// --------------------------------------------------------------
// Imports
// --------------------------------------------------------------
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoose = require("mongoose");
const path = require("path");
const crypto = require("crypto");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
require("dotenv").config();

const app = express();

// --------------------------------------------------------------
// Middlewares: Security Headers, CORS, Rate Limit & Body Parsers
// --------------------------------------------------------------
app.use(helmet({
    contentSecurityPolicy: false, // Permite assets web dinámicos sin interferir con Vite
    crossOriginEmbedderPolicy: false
}));

// CORS restrictivo con soporte dinámico para dominios autorizados y desarrollo local
const ALLOWED_ORIGINS = [
    /\.clicksalud\.org$/,
    /\.clicksalud\.com$/,
    /\.vercel\.app$/,
    /^http:\/\/localhost(:\d+)?$/,
    /^http:\/\/127\.0\.0\.1(:\d+)?$/
];

app.use(cors({
    origin: (origin, callback) => {
        // Permitir peticiones sin header Origin (como herramientas backend, proxies internos o Postman/CLI)
        if (!origin) return callback(null, true);
        const isAllowed = ALLOWED_ORIGINS.some(pattern => pattern.test(origin));
        if (isAllowed) {
            callback(null, true);
        } else {
            callback(new Error("Acceso bloqueado por política de CORS"));
        }
    },
    credentials: true
}));

// Límite de tamaño de JSON global seguro (100kb) para evitar DoS por memoria
app.use(express.json({ limit: "100kb" }));

// Rate Limiters para protección contra fuerza bruta y DoS
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: "Demasiados intentos. Por favor espera 15 minutos antes de intentar de nuevo." }
});

const pendingLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: "Límite de solicitudes alcanzado para fármacos pendientes." }
});

app.use(["/auth", "/editor/auth"], authLimiter);
app.use("/pending-drugs", pendingLimiter);

// Strip /api prefix if forwarded without path rewrite to support /api/ routes seamlessly
app.use((req, res, next) => {
    if (req.url.startsWith("/api/")) {
        req.url = req.url.replace(/^\/api/, "");
    } else if (req.url === "/api") {
        req.url = "/";
    }
    next();
});

const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// --------------------------------------------------------------
// Database connection
// --------------------------------------------------------------
const connectDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Database connection successful");
    } catch (error) {
        console.error("Database connection failed:", error.message);
        process.exit(1);
    }
};
connectDatabase();

// --------------------------------------------------------------
// Regex Patterns (Clinical & Pharmacological Validation)
// --------------------------------------------------------------
// Soporta letras con tildes, números, paréntesis, barras, signos y letras griegas (ej. "Acetaminofén (Paracetamol)")
const REGEX_DRUG_NAME = /^[a-záéíóúüñ0-9\s\-()/+,%αβγ.]+$/i;

// Soporta números, rangos, fracciones y decimales (ej. "500", "100-200", "12.5")
const REGEX_DOSAGE_AMOUNT = /^[0-9\-/.,\s]+$/;

// Soporta texto médico completo, signos de puntuación, unidades, comparadores, corchetes y símbolos clínicos
const REGEX_CLINICAL_TEXT = /^[a-záéíóúüñ0-9\s.,;:()[\]—–\-_/&?="'#%ªº+*/<>≤≥±°÷αβγμ~^]+$/i;

// Soporta códigos alfanuméricos ATC (ej. "N", "N02B", "N02BE01")
const REGEX_ATC_CODE = /^[a-z0-9]+$/i;

// --------------------------------------------------------------
// Schema & Models
// --------------------------------------------------------------

const dosageEntrySchema = new mongoose.Schema({
    amount: {
        type: String,
        trim: true,
        match: [REGEX_DOSAGE_AMOUNT, "Formato de cantidad de dosis inválido."]
    },
    unit: {
        type: String,
        trim: true,
        match: [REGEX_CLINICAL_TEXT, "Formato de unidad de dosis inválido."]
    },
    route: [{
        type: String,
        trim: true,
        match: [REGEX_CLINICAL_TEXT, "Formato de vía de administración inválido."]
    }],
    useIn: {
        type: String,
        trim: true,
        enum: ["Adultos", "Niños", "Ambos"]
    }
}, { _id: false });

const presentationGroupSchema = new mongoose.Schema({
    dosage: [dosageEntrySchema]
}, { _id: false });

const routeGuidanceSchema = new mongoose.Schema({
    guidelines: [{
        type: String,
        trim: true,
        match: [REGEX_CLINICAL_TEXT, "Carácter no permitido en pautas de dosificación."]
    }],
    maxDose: [{
        type: String,
        trim: true,
        match: [REGEX_CLINICAL_TEXT, "Carácter no permitido en dosis máxima."]
    }]
}, { _id: false });

const atcEntrySchema = new mongoose.Schema({
    code: {
        type: String,
        trim: true,
        uppercase: true,
        match: [REGEX_ATC_CODE, "Código ATC inválido."]
    },
    categoryCode: {
        type: String,
        trim: true,
        uppercase: true,
        match: [REGEX_ATC_CODE, "Código de categoría ATC inválido."]
    },
    categoryName: {
        type: String,
        trim: true,
        match: [REGEX_CLINICAL_TEXT, "Nombre de categoría ATC inválido."]
    },
    subcategoryCode: {
        type: String,
        trim: true,
        uppercase: true,
        match: [REGEX_ATC_CODE, "Código de subcategoría ATC inválido."]
    },
    subcategoryName: {
        type: String,
        trim: true,
        match: [REGEX_CLINICAL_TEXT, "Nombre de subcategoría ATC inválido."]
    }
}, { _id: false });

const drugSchema = new mongoose.Schema({
    name: {
        type: String,
        unique: true,
        required: [true, "El nombre del fármaco es obligatorio."],
        trim: true,
        lowercase: true,
        match: [REGEX_DRUG_NAME, "El nombre del fármaco contiene caracteres no válidos."]
    },
    atc: {
        type: [atcEntrySchema],
        required: true,
        validate: [v => Array.isArray(v) && v.length > 0, "Al menos una clasificación ATC es requerida."]
    },
    actionMechanism: {
        type: String,
        trim: true,
        match: [REGEX_CLINICAL_TEXT, "Carácter no válido en el mecanismo de acción."]
    },
    indications: [{
        type: String,
        trim: true,
        match: [REGEX_CLINICAL_TEXT, "Carácter no válido en indicaciones."]
    }],
    presentations: {
        type: Map,
        of: presentationGroupSchema
    },
    dosageGuidance: {
        adult: { type: Map, of: routeGuidanceSchema },
        pediatric: { type: Map, of: routeGuidanceSchema }
    },
    risk: {
        pregnancy: { type: String, trim: true, match: REGEX_CLINICAL_TEXT },
        lactation: { type: String, trim: true, match: REGEX_CLINICAL_TEXT },
        renal: {
            level: { type: String, trim: true, match: REGEX_CLINICAL_TEXT },
            adjustment: { type: String, trim: true, match: REGEX_CLINICAL_TEXT }
        },
        hepatic: {
            level: { type: String, trim: true, match: REGEX_CLINICAL_TEXT },
            adjustment: { type: String, trim: true, match: REGEX_CLINICAL_TEXT }
        },
        geriatric: { type: String, trim: true, match: REGEX_CLINICAL_TEXT },
        securityFlags: [{ type: String, trim: true, match: REGEX_CLINICAL_TEXT }]
    },
    contraindications: [{ type: String, trim: true, match: REGEX_CLINICAL_TEXT }],
    interactions: [{ type: String, trim: true, match: REGEX_CLINICAL_TEXT }],
    adverseReactions: [{ type: String, trim: true, match: REGEX_CLINICAL_TEXT }],
    overdose: {
        type: String,
        trim: true,
        match: [REGEX_CLINICAL_TEXT, "Carácter no válido en sobredosis."]
    },
    references: [{
        type: String,
        trim: true,
        match: [REGEX_CLINICAL_TEXT, "Carácter no válido en referencias."]
    }]
}, { timestamps: true });

// Índices optimizados para búsquedas por ATC (el índice de 'name' ya se crea con unique: true)
drugSchema.index({ "atc.code": 1 });
drugSchema.index({ "atc.subcategoryCode": 1 });
drugSchema.index({ "atc.categoryCode": 1 });

const Drug = mongoose.model("Drug", drugSchema);

const pendingDrugSchema = new mongoose.Schema({
    name: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        lowercase: true
    },
    searchCount: {
        type: Number,
        default: 1
    },
    status: {
        type: String,
        enum: ["pending", "in_progress", "completed"],
        default: "pending",
        index: true
    },
    lastSearchedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

pendingDrugSchema.index({ status: 1, searchCount: -1 });

const PendingDrug = mongoose.model("PendingDrug", pendingDrugSchema);

// Doctor & Health Professional Model
const doctorUserSchema = new mongoose.Schema(
    {
        firstName: { type: String, required: true, trim: true },
        lastName: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        passwordHash: { type: String, default: null },
        salt: { type: String, default: null },
        country: { type: String, required: true, trim: true }, // País donde ejerce
        identifiers: {
            type: Map,
            of: String,
            default: {}
        },
        specialty: {
            type: String,
            trim: true,
            enum: [
                "Médico general",
                "Médico especialista",
                "Estudiante de medicina",
                "Enfermera",
                "Farmacista",
                "Otros"
            ],
            default: "Médico general"
        },
        role: {
            type: String,
            trim: true,
            enum: ["doctor", "admin", "Médico"],
            default: "doctor"
        },
        institution: { type: String, trim: true, default: "" }
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

// Virtual: nombre completo dinámico (evita redundancia en BD)
doctorUserSchema.virtual("name").get(function () {
    return [this.firstName, this.lastName].filter(Boolean).join(" ");
});

// Virtual: resumen de licencias dinámico (evita redundancia en BD)
doctorUserSchema.virtual("licenseNumber").get(function () {
    if (!this.identifiers) return "";
    const entries = this.identifiers instanceof Map
        ? Array.from(this.identifiers.entries())
        : Object.entries(this.identifiers);
    return entries
        .filter(([_, v]) => Boolean(v && String(v).trim()))
        .map(([k, v]) => `${k.toUpperCase()}: ${String(v).trim()}`)
        .join(" / ");
});

doctorUserSchema.index({ email: 1 });
doctorUserSchema.index({ country: 1 });

const DoctorUser = mongoose.model("DoctorUser", doctorUserSchema);

// Password helpers (PBKDF2 con 210,000 iteraciones según estándar OWASP)
const PBKDF2_ITERATIONS = 210000;
const LEGACY_PBKDF2_ITERATIONS = 1000;

function hashPassword(password, existingSalt = null, iterations = PBKDF2_ITERATIONS) {
    const salt = existingSalt || crypto.randomBytes(16).toString("hex");
    const hash = crypto.pbkdf2Sync(password, salt, iterations, 64, "sha512").toString("hex");
    return { hash, salt, iterations };
}

function verifyPassword(password, hash, salt) {
    if (!hash || !salt || !password) return { isValid: false, needsRehash: false };

    // 1. Probar con estándar de 210,000 iteraciones
    const computedModern = crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, 64, "sha512").toString("hex");
    if (computedModern.length === hash.length && crypto.timingSafeEqual(Buffer.from(computedModern), Buffer.from(hash))) {
        return { isValid: true, needsRehash: false };
    }

    // 2. Probar con estándar legacy (1,000 iteraciones) para cuentas existentes
    const computedLegacy = crypto.pbkdf2Sync(password, salt, LEGACY_PBKDF2_ITERATIONS, 64, "sha512").toString("hex");
    if (computedLegacy.length === hash.length && crypto.timingSafeEqual(Buffer.from(computedLegacy), Buffer.from(hash))) {
        return { isValid: true, needsRehash: true };
    }

    return { isValid: false, needsRehash: false };
}

// Admin Token & Security Helpers
const ADMIN_TOKEN_SECRET = process.env.ADMIN_API_KEY || process.env.JWT_SECRET;
if (!ADMIN_TOKEN_SECRET && process.env.NODE_ENV === "production") {
    console.warn("[SECURITY WARNING] ADMIN_API_KEY o JWT_SECRET no está definido en las variables de entorno.");
}
const EFFECTIVE_ADMIN_SECRET = ADMIN_TOKEN_SECRET || "farmacopedia-dev-local-secret-2026";

function createAdminToken(userId, email) {
    const timestamp = Date.now().toString();
    const payload = `${userId}:${timestamp}:${String(email || "").toLowerCase().trim()}`;
    const sig = crypto.createHmac("sha256", EFFECTIVE_ADMIN_SECRET).update(payload).digest("hex");
    return `${payload}:${sig}`;
}

async function verifyAdminToken(token) {
    if (!token || typeof token !== "string") return null;
    const parts = token.split(":");
    if (parts.length !== 4) return null;
    const [userId, timestamp, email, sig] = parts;
    const payload = `${userId}:${timestamp}:${email}`;
    const expectedSig = crypto.createHmac("sha256", EFFECTIVE_ADMIN_SECRET).update(payload).digest("hex");

    if (sig.length !== expectedSig.length) return null;
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) return null;

    // Token max age: 30 days
    if (Date.now() - parseInt(timestamp, 10) > 30 * 24 * 3600 * 1000) return null;

    if (!mongoose.Types.ObjectId.isValid(userId)) return null;
    const user = await DoctorUser.findById(userId).lean();
    if (!user || user.role !== "admin") return null;
    return user;
}

function createAuthToken(userId, email, role = "doctor") {
    const timestamp = Date.now().toString();
    const payload = `${userId}:${timestamp}:${String(email || "").toLowerCase().trim()}:${role}`;
    const sig = crypto.createHmac("sha256", EFFECTIVE_ADMIN_SECRET).update(payload).digest("hex");
    return `${payload}:${sig}`;
}

async function verifyAuthToken(token) {
    if (!token || typeof token !== "string") return null;
    const parts = token.split(":");
    if (parts.length === 5) {
        const [userId, timestamp, email, role, sig] = parts;
        const payload = `${userId}:${timestamp}:${email}:${role}`;
        const expectedSig = crypto.createHmac("sha256", EFFECTIVE_ADMIN_SECRET).update(payload).digest("hex");
        if (sig.length !== expectedSig.length) return null;
        if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) return null;
        if (Date.now() - parseInt(timestamp, 10) > 30 * 24 * 3600 * 1000) return null;
        if (!mongoose.Types.ObjectId.isValid(userId)) return null;
        return await DoctorUser.findById(userId);
    }
    if (parts.length === 4) {
        return await verifyAdminToken(token);
    }
    return null;
}

const requireAdmin = async (req, res, next) => {
    // 1. Direct API Key check (for CLI scripts and editor proxy)
    const adminKey = req.get("x-admin-key");
    const expectedKey = process.env.ADMIN_API_KEY;
    if (adminKey && expectedKey) {
        const sha = (v) => crypto.createHash("sha256").update(String(v || "")).digest();
        if (crypto.timingSafeEqual(sha(adminKey), sha(expectedKey))) {
            return next();
        }
    }

    // 2. Token-based admin verification (for React Admin View)
    const authHeader = req.get("authorization") || req.get("x-admin-token") || "";
    const rawToken = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (rawToken) {
        try {
            const adminUser = await verifyAdminToken(rawToken);
            if (adminUser) {
                req.adminUser = adminUser;
                return next();
            }
        } catch (e) {
            console.warn("[requireAdmin] Admin token error:", e.message);
        }
    }

    return res.status(401).json({
        success: false,
        error: "Acceso no autorizado: se requiere rol de administrador"
    });
};

// --------------------------------------------------------------
// Servir directamente la aplicación web de tools/editor
// --------------------------------------------------------------
const toolsEditorPath = path.resolve(__dirname, "../../tools/editor");
app.use("/editor", express.static(toolsEditorPath));

app.get(["/session", "/editor/session"], asyncHandler(async (req, res) => {
    const authHeader = req.get("authorization") || req.get("x-admin-token") || "";
    const rawToken = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!rawToken) {
        return res.status(401).json({ ok: false });
    }
    const adminUser = await verifyAdminToken(rawToken);
    if (adminUser) {
        return res.status(200).json({ ok: true, user: adminUser.email });
    }
    const expected = process.env.ADMIN_API_KEY;
    if (expected && rawToken === expected) {
        return res.status(200).json({ ok: true });
    }
    return res.status(401).json({ ok: false });
}));

app.post(["/auth", "/editor/auth"], asyncHandler(async (req, res) => {
    const { email, password } = req.body || {};
    const adminKey = process.env.ADMIN_API_KEY;
    const adminPass = process.env.ADMIN_PASSWORD;

    let authenticated = false;
    let adminUser = null;

    const safeCompare = (a, b) => {
        if (!a || !b) return false;
        const ha = crypto.createHash("sha256").update(String(a)).digest();
        const hb = crypto.createHash("sha256").update(String(b)).digest();
        return crypto.timingSafeEqual(ha, hb);
    };

    if (password && (safeCompare(password, adminPass) || safeCompare(password, adminKey))) {
        authenticated = true;
    } else if (email && password) {
        // Autenticación segura por email de administrador médico
        const user = await DoctorUser.findOne({ email: String(email).trim().toLowerCase(), role: "admin" });
        if (user && user.passwordHash && user.salt) {
            const verification = verifyPassword(String(password), user.passwordHash, user.salt);
            if (verification.isValid) {
                authenticated = true;
                adminUser = user;
                if (verification.needsRehash) {
                    const newHash = hashPassword(String(password));
                    user.passwordHash = newHash.hash;
                    user.salt = newHash.salt;
                    await user.save();
                }
            }
        }
    }

    if (authenticated) {
        const token = adminUser ? createAdminToken(adminUser._id, adminUser.email) : (adminKey || createAdminToken("000000000000000000000001", "admin@clicksalud.com"));
        return res.status(200).json({ ok: true, token });
    }
    return res.status(401).json({ ok: false, error: "Credenciales de administrador incorrectas." });
}));

app.get(["/config", "/editor/config"], (req, res) => {
    res.json({
        apiBase: "/api",
        prod: Boolean(process.env.VERCEL || process.env.NODE_ENV === "production")
    });
});

// --------------------------------------------------------------
// Helpers
// --------------------------------------------------------------

/**
 * Construye una expresión regular insensible a mayúsculas/minúsculas y tildes/diéresis.
 * Permite encontrar "acetaminofén" buscando "acetaminofen" o viceversa.
 */
const buildAccentInsensitiveRegex = (text, exact = false) => {
    const escaped = text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const accentPattern = escaped
        .replace(/[aá]/gi, "[aá]")
        .replace(/[eé]/gi, "[eé]")
        .replace(/[ií]/gi, "[ií]")
        .replace(/[oó]/gi, "[oó]")
        .replace(/[uúü]/gi, "[uúü]")
        .replace(/[nñ]/gi, "[nñ]");
    return new RegExp(exact ? `^${accentPattern}$` : accentPattern, "i");
};

/**
 * Helper para resolver búsquedas enriquecidas de ATC (Nivel 1 a Nivel 5)
 */
const getEnrichedAtcDrugs = async (identifier) => {
    const raw = (identifier || "").trim();
    if (!raw) return null;

    const regex = buildAccentInsensitiveRegex(raw, true);

    const filter = {
        $or: [
            { "atc.code": regex },
            { "atc.subcategoryCode": regex },
            { "atc.categoryCode": regex },
            { "atc.subcategoryName": regex },
            { "atc.categoryName": regex }
        ]
    };

    const drugs = await Drug.find(
        filter,
        "name atc actionMechanism indications"
    )
        .collation({ locale: "es", strength: 1 })
        .sort({ name: 1 })
        .lean();

    if (!drugs || drugs.length === 0) {
        return null;
    }

    // Determinar metadatos del grupo ATC a partir de la primera coincidencia
    let matchedMetadata = null;
    const exactRegex = buildAccentInsensitiveRegex(raw, true);

    for (const drug of drugs) {
        for (const item of (drug.atc || [])) {
            if (item.code && exactRegex.test(item.code)) {
                matchedMetadata = {
                    level: 5,
                    code: item.code,
                    name: drug.name,
                    categoryCode: item.categoryCode,
                    categoryName: item.categoryName,
                    subcategoryCode: item.subcategoryCode,
                    subcategoryName: item.subcategoryName
                };
                break;
            } else if (
                (item.subcategoryCode && exactRegex.test(item.subcategoryCode)) ||
                (item.subcategoryName && exactRegex.test(item.subcategoryName))
            ) {
                matchedMetadata = {
                    level: 2,
                    code: item.subcategoryCode,
                    name: item.subcategoryName,
                    categoryCode: item.categoryCode,
                    categoryName: item.categoryName
                };
                break;
            } else if (
                (item.categoryCode && exactRegex.test(item.categoryCode)) ||
                (item.categoryName && exactRegex.test(item.categoryName))
            ) {
                matchedMetadata = {
                    level: 1,
                    code: item.categoryCode,
                    name: item.categoryName
                };
                break;
            }
        }
        if (matchedMetadata) break;
    }

    if (!matchedMetadata) {
        matchedMetadata = { query: raw };
    }

    const formattedDrugs = drugs.map(d => ({
        _id: d._id,
        name: d.name,
        atc: d.atc,
        actionMechanism: d.actionMechanism,
        indications: (d.indications || []).slice(0, 3)
    }));

    return {
        atcGroup: matchedMetadata,
        count: formattedDrugs.length,
        drugs: formattedDrugs
    };
};

// --------------------------------------------------------------
// Routes
// --------------------------------------------------------------

// Root & Health check endpoints for Render cold start and monitoring
app.get("/", (req, res) => {
    res.status(200).json({ success: true, message: "ClickSalud FarmacoPedia API is active", status: "online" });
});

app.get("/health", (req, res) => {
    res.status(200).json({ success: true, status: "healthy", timestamp: Date.now() });
});

// POST: Bulk upsert drugs (up to thousands of entries in batches)
app.post("/drugs/bulk", requireAdmin, express.json({ limit: "15mb" }), asyncHandler(async (req, res) => {
    const items = req.body;
    if (!Array.isArray(items) || !items.length) {
        return res.status(400).json({ success: false, error: "Array of drug objects is required in body." });
    }

    const results = {
        total: items.length,
        inserted: 0,
        modified: 0,
        errors: []
    };

    // Validar y ejecutar en lotes de 100 usando bulkWrite para máximo rendimiento
    const BATCH_SIZE = 100;
    const completedNames = [];

    for (let i = 0; i < items.length; i += BATCH_SIZE) {
        const chunk = items.slice(i, i + BATCH_SIZE);
        const ops = [];

        for (const raw of chunk) {
            const name = (raw && raw.name ? String(raw.name) : "").trim();
            if (!name) {
                results.errors.push({ name: "(desconocido)", error: "Entrada sin propiedad 'name'" });
                continue;
            }

            // Sanitizar campos internos de mongo que pudieran venir en el json
            const doc = { ...raw };
            delete doc._id;
            delete doc.__v;
            delete doc.createdAt;
            delete doc.updatedAt;

            ops.push({
                replaceOne: {
                    filter: { name: buildAccentInsensitiveRegex(name, true) },
                    replacement: doc,
                    upsert: true
                }
            });
            completedNames.push(name);
        }

        if (ops.length > 0) {
            try {
                const bulkRes = await Drug.bulkWrite(ops, { ordered: false });
                results.inserted += (bulkRes.upsertedCount || 0);
                results.modified += (bulkRes.modifiedCount || 0) + (bulkRes.matchedCount ? (bulkRes.matchedCount - (bulkRes.modifiedCount || 0)) : 0);
            } catch (err) {
                if (err.name === "MongoBulkWriteError" && err.writeErrors) {
                    for (const we of err.writeErrors) {
                        const failedOp = ops[we.index];
                        const failedName = failedOp?.replaceOne?.replacement?.name || `Índice ${we.index}`;
                        results.errors.push({ name: failedName, error: we.errmsg || err.message });
                    }
                    if (err.result) {
                        results.inserted += (err.result.upsertedCount || 0);
                        results.modified += (err.result.modifiedCount || 0);
                    }
                } else {
                    results.errors.push({ name: `Lote ${i}-${i + chunk.length}`, error: err.message });
                }
            }
        }
    }

    // Actualizar en lote los fármacos pendientes a completed
    if (completedNames.length > 0) {
        const regexList = completedNames.slice(0, 1000).map(n => buildAccentInsensitiveRegex(n, true));
        await PendingDrug.updateMany(
            { name: { $in: regexList } },
            { $set: { status: "completed" } }
        ).catch(() => {});
    }

    res.status(200).json({ success: true, results });
}));

// POST: Add or replace drug (upsert) & automatically mark as completed in PendingDrug queue
app.post("/drugs", requireAdmin, asyncHandler(async (req, res) => {
    const rawName = (req.body.name || "").trim();
    if (!rawName) {
        return res.status(400).json({ success: false, error: "The drug name is required." });
    }

    // Upsert (crea si no existe, o reemplaza/actualiza si ya existe por nombre insensible a tildes)
    const existing = await Drug.findOne({ name: buildAccentInsensitiveRegex(rawName, true) });

    let savedDrug;
    if (existing) {
        // Reemplazar campos con los del payload
        existing.overwrite(req.body);
        savedDrug = await existing.save();
    } else {
        savedDrug = await new Drug(req.body).save();
    }

    // Si estaba en la lista de pendientes (con o sin tilde), marcarlo como completado
    await PendingDrug.updateMany(
        { name: buildAccentInsensitiveRegex(savedDrug.name, true) },
        { $set: { status: "completed" } }
    );

    res.status(existing ? 200 : 201).json({ success: true, data: savedDrug, replaced: Boolean(existing) });
}));

// GET: All drug names (supports ?q= or ?search= by name, category, or ATC, accent-insensitive)
app.get("/drugs", asyncHandler(async (req, res) => {
    const { q, search } = req.query;
    const queryTerm = (q || search || "").trim();
    let filter = {};

    if (queryTerm) {
        const regex = buildAccentInsensitiveRegex(queryTerm, false);
        filter = {
            $or: [
                { name: regex },
                { "atc.code": regex },
                { "atc.subcategoryCode": regex },
                { "atc.subcategoryName": regex },
                { "atc.categoryName": regex }
            ]
        };
    }

    const drugList = await Drug.find(filter, "name atc actionMechanism")
        .collation({ locale: "es", strength: 1 })
        .sort({ name: 1 })
        .lean();

    res.status(200).json({ success: true, count: drugList.length, data: drugList });
}));

// GET: All categories (Returns ATC Level 1 -> Level 2 hierarchical tree, or ?flat=true for list of ATC subcategories)
app.get("/drugs/families", asyncHandler(async (req, res) => {
    if (req.query.flat === "true") {
        const subcategories = await Drug.distinct("atc.subcategoryName");
        return res.status(200).json({ success: true, data: subcategories.filter(Boolean).sort() });
    }

    const pipeline = [
        { $unwind: "$atc" },
        {
            $group: {
                _id: {
                    categoryCode: "$atc.categoryCode",
                    categoryName: "$atc.categoryName",
                    subcategoryCode: "$atc.subcategoryCode",
                    subcategoryName: "$atc.subcategoryName",
                    name: "$name"
                },
                atcCode: { $first: "$atc.code" }
            }
        },
        {
            $group: {
                _id: {
                    categoryCode: "$_id.categoryCode",
                    categoryName: "$_id.categoryName",
                    subcategoryCode: "$_id.subcategoryCode",
                    subcategoryName: "$_id.subcategoryName"
                },
                drugCount: { $sum: 1 },
                drugs: { $push: { name: "$_id.name", atcCode: "$atcCode" } }
            }
        },
        {
            $group: {
                _id: {
                    categoryCode: "$_id.categoryCode",
                    categoryName: "$_id.categoryName"
                },
                subcategories: {
                    $push: {
                        subcategoryCode: "$_id.subcategoryCode",
                        subcategoryName: "$_id.subcategoryName",
                        count: "$drugCount",
                        drugs: "$drugs"
                    }
                },
                totalDrugs: { $sum: "$drugCount" }
            }
        },
        {
            $project: {
                _id: 0,
                categoryCode: "$_id.categoryCode",
                categoryName: "$_id.categoryName",
                subcategories: 1,
                totalDrugs: 1
            }
        },
        { $sort: { categoryCode: 1 } }
    ];

    const tree = await Drug.aggregate(pipeline);
    tree.forEach(cat => {
        cat.subcategories.sort((a, b) => (a.subcategoryCode || "").localeCompare(b.subcategoryCode || ""));
    });

    res.status(200).json({ success: true, data: tree });
}));

// GET: Filter by ATC subcategory code (e.g. N02B, J01)
app.get("/drugs/atc/subcategories/:code", asyncHandler(async (req, res) => {
    const rawCode = (req.params.code || "").trim().toUpperCase();
    const drugs = await Drug.find(
        { "atc.subcategoryCode": rawCode },
        "name atc actionMechanism"
    )
        .collation({ locale: "es", strength: 1 })
        .sort({ name: 1 })
        .lean();

    res.status(200).json({ success: true, count: drugs.length, data: drugs });
}));

// GET: Enriched ATC query (supports Level 1 to Level 5: Code, subcategory, or category name)
app.get("/drugs/atc/:identifier", asyncHandler(async (req, res) => {
    const result = await getEnrichedAtcDrugs(req.params.identifier);
    if (!result) {
        return res.status(404).json({ success: false, error: "No drugs found for this ATC classification" });
    }
    res.status(200).json({
        success: true,
        atcGroup: result.atcGroup,
        count: result.count,
        data: result.drugs
    });
}));

// GET: Legacy /drugs/categories/:category alias (supports retro-compatibility and returns enriched payload)
app.get("/drugs/categories/:category", asyncHandler(async (req, res) => {
    const result = await getEnrichedAtcDrugs(req.params.category);
    if (!result) {
        return res.status(404).json({ success: false, error: "No drugs found for this category" });
    }
    res.status(200).json({
        success: true,
        atcGroup: result.atcGroup,
        count: result.count,
        data: result.drugs
    });
}));

// GET: Single drug (accent-insensitive match)
app.get("/drugs/:name", asyncHandler(async (req, res) => {
    const rawName = (req.params.name || "").trim();
    const drugFound = await Drug.findOne({
        name: buildAccentInsensitiveRegex(rawName, true)
    }).lean();

    if (!drugFound) {
        return res.status(404).json({ success: false, error: "Drug not found" });
    }
    res.status(200).json({ success: true, data: drugFound });
}));

// PATCH: Update drug
app.patch("/drugs/:name", requireAdmin, asyncHandler(async (req, res) => {
    const rawName = (req.params.name || "").trim();
    const updatedDrug = await Drug.findOneAndUpdate(
        { name: buildAccentInsensitiveRegex(rawName, true) },
        { $set: req.body },
        { new: true, runValidators: true }
    ).lean();

    if (!updatedDrug) {
        return res.status(404).json({ success: false, error: "Drug not found" });
    }
    res.status(200).json({ success: true, data: updatedDrug });
}));

// DELETE: Remove drug
app.delete("/drugs/:name", requireAdmin, asyncHandler(async (req, res) => {
    const rawName = (req.params.name || "").trim();
    const deletedDrug = await Drug.findOneAndDelete({
        name: buildAccentInsensitiveRegex(rawName, true)
    }).lean();

    if (!deletedDrug) {
        return res.status(404).json({ success: false, error: "Drug not found" });
    }
    res.status(200).json({ success: true, message: `Drug ${deletedDrug.name} deleted` });
}));

// --------------------------------------------------------------
// Pending Drugs (Queue & Priorities) Routes
// --------------------------------------------------------------

// POST: Record a missing drug search or request
app.post("/pending-drugs", asyncHandler(async (req, res) => {
    const { name } = req.body;
    if (!name || typeof name !== "string" || !name.trim()) {
        return res.status(400).json({ success: false, error: "Name is required" });
    }
    const normalizedName = name.trim().toLowerCase();

    // Verificar primero si el fármaco ya existe en la colección principal Drug
    const existingDrug = await Drug.findOne({
        name: buildAccentInsensitiveRegex(normalizedName, true)
    }).lean();

    if (existingDrug) {
        return res.status(200).json({
            success: true,
            message: "Drug already exists in main database",
            alreadyExists: true,
            data: { name: existingDrug.name, status: "completed" }
        });
    }

    const pending = await PendingDrug.findOneAndUpdate(
        { name: normalizedName },
        {
            $inc: { searchCount: 1 },
            $set: { lastSearchedAt: new Date(), status: "pending" }
        },
        { new: true, upsert: true }
    ).lean();

    res.status(200).json({ success: true, data: pending });
}));

// GET: Get prioritized pending drugs
app.get("/pending-drugs", asyncHandler(async (req, res) => {
    const all = req.query.all === "true";
    const limit = all
        ? 0
        : Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
    const pendingList = await PendingDrug.find(all ? {} : { status: "pending" })
        .sort({ searchCount: -1, lastSearchedAt: -1 })
        .limit(limit)
        .lean();

    res.status(200).json({ success: true, count: pendingList.length, data: pendingList });
}));

// PATCH: Edit pending drug (used by the local admin editor)
app.patch("/pending-drugs/:name", requireAdmin, asyncHandler(async (req, res) => {
    const rawName = (req.params.name || "").trim();
    const updated = await PendingDrug.findOneAndUpdate(
        { name: buildAccentInsensitiveRegex(rawName, true) },
        { $set: req.body },
        { new: true, runValidators: true }
    ).lean();

    if (!updated) {
        return res.status(404).json({ success: false, error: "Pending drug record not found" });
    }
    res.status(200).json({ success: true, data: updated });
}));

// DELETE: Remove pending drug
app.delete("/pending-drugs/:name", requireAdmin, asyncHandler(async (req, res) => {
    const rawName = (req.params.name || "").trim();
    const deleted = await PendingDrug.findOneAndDelete({
        name: buildAccentInsensitiveRegex(rawName, true)
    }).lean();

    if (!deleted) {
        return res.status(404).json({ success: false, error: "Pending drug record not found" });
    }
    res.status(200).json({ success: true, message: `Pending drug ${deleted.name} deleted` });
}));

// PATCH: Mark pending drug as completed
app.patch("/pending-drugs/:name/complete", requireAdmin, asyncHandler(async (req, res) => {
    const rawName = (req.params.name || "").trim();
    const updated = await PendingDrug.findOneAndUpdate(
        { name: buildAccentInsensitiveRegex(rawName, true) },
        { $set: { status: "completed" } },
        { new: true }
    ).lean();

    if (!updated) {
        return res.status(404).json({ success: false, error: "Pending drug record not found" });
    }
    res.status(200).json({ success: true, data: updated });
}));

// ==============================================================
// AUTH & PROFESSIONAL MEDICAL REGISTRATION
// ==============================================================
app.post("/auth/register", asyncHandler(async (req, res) => {
    const {
        firstName,
        lastName,
        email,
        password,
        country,
        identifiers,
        specialty,
        institution
    } = req.body;

    if (!email || !country) {
        return res.status(400).json({
            success: false,
            error: "Correo y país son obligatorios."
        });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanFirstName = firstName ? String(firstName).trim() : "";
    const cleanLastName = lastName ? String(lastName).trim() : "";

    if (!cleanFirstName || !cleanLastName) {
        return res.status(400).json({
            success: false,
            error: "Nombre y apellido son obligatorios."
        });
    }

    // Comprobar si el usuario ya existe para evitar secuestro de cuentas
    const existingUser = await DoctorUser.findOne({ email: cleanEmail });
    if (existingUser) {
        return res.status(409).json({
            success: false,
            error: "Este correo electrónico ya está registrado. Por favor inicia sesión."
        });
    }

    if (!password || String(password).trim().length < 6) {
        return res.status(400).json({
            success: false,
            error: "Debes proporcionar una contraseña de al menos 6 caracteres para registrarte."
        });
    }

    const { hash: passwordHash, salt } = hashPassword(String(password).trim());

    let cleanIdentifiers = {};
    if (identifiers && typeof identifiers === "object") {
        cleanIdentifiers = identifiers instanceof Map ? Object.fromEntries(identifiers.entries()) : identifiers;
    }

    const user = await DoctorUser.create({
        firstName: cleanFirstName,
        lastName: cleanLastName,
        email: cleanEmail,
        passwordHash,
        salt,
        country: String(country).trim(),
        identifiers: cleanIdentifiers,
        specialty: specialty || "Médico general",
        role: "doctor",
        institution: institution ? String(institution).trim() : ""
    });

    const userObj = user.toObject({ virtuals: true });
    delete userObj.passwordHash;
    delete userObj.salt;

    userObj.token = createAuthToken(user._id, user.email, user.role);
    if (user.role === "admin") {
        userObj.adminToken = createAdminToken(user._id, user.email);
    }

    return res.status(201).json({
        success: true,
        message: "Profesional de la salud registrado con éxito.",
        data: userObj
    });
}));

// PUT: Actualización de perfil médico del usuario autenticado
app.put("/auth/profile", asyncHandler(async (req, res) => {
    const authHeader = req.get("authorization") || req.get("x-admin-token") || "";
    const rawToken = authHeader.replace(/^Bearer\s+/i, "").trim();
    const { email } = req.body || {};

    let user = null;
    if (rawToken) {
        user = await verifyAuthToken(rawToken);
    }
    if (!user && email) {
        user = await DoctorUser.findOne({ email: String(email).trim().toLowerCase() });
    }

    if (!user) {
        return res.status(401).json({ success: false, error: "Usuario no autenticado o no encontrado." });
    }

    const { firstName, lastName, country, identifiers, specialty, institution } = req.body;

    if (firstName) user.firstName = String(firstName).trim();
    if (lastName) user.lastName = String(lastName).trim();
    if (country) user.country = String(country).trim();
    if (specialty) user.specialty = specialty;
    if (institution !== undefined) user.institution = String(institution).trim();

    if (identifiers && typeof identifiers === "object") {
        const cleanIdentifiers = identifiers instanceof Map ? Object.fromEntries(identifiers.entries()) : identifiers;
        user.identifiers = cleanIdentifiers;
    }

    await user.save();

    const userObj = user.toObject({ virtuals: true });
    delete userObj.passwordHash;
    delete userObj.salt;

    userObj.token = createAuthToken(user._id, user.email, user.role);
    if (user.role === "admin") {
        userObj.adminToken = createAdminToken(user._id, user.email);
    }

    return res.status(200).json({
        success: true,
        message: "Perfil profesional actualizado con éxito.",
        data: userObj
    });
}));

app.post("/auth/login", asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ success: false, error: "El correo y la contraseña son requeridos." });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const user = await DoctorUser.findOne({ email: cleanEmail });

    if (!user) {
        return res.status(404).json({
            success: false,
            needsRegistration: true,
            error: "No existe cuenta con este correo. Por favor regístrate."
        });
    }

    if (!user.passwordHash || !user.salt) {
        return res.status(400).json({
            success: false,
            error: "La cuenta requiere configurar una contraseña."
        });
    }

    const verification = verifyPassword(String(password), user.passwordHash, user.salt);
    if (!verification.isValid) {
        return res.status(401).json({
            success: false,
            error: "Contraseña incorrecta."
        });
    }

    // Migración transparente a 210,000 iteraciones si la cuenta usaba el estándar anterior
    if (verification.needsRehash) {
        const upgraded = hashPassword(String(password));
        user.passwordHash = upgraded.hash;
        user.salt = upgraded.salt;
        await user.save();
    }

    const userObj = user.toObject({ virtuals: true });
    delete userObj.passwordHash;
    delete userObj.salt;

    userObj.token = createAuthToken(user._id, user.email, user.role);
    if (user.role === "admin") {
        userObj.adminToken = createAdminToken(user._id, user.email);
    }

    return res.status(200).json({
        success: true,
        data: userObj
    });
}));

// POST: Verificación segura de sesión de administrador mediante token en cabecera
app.post("/auth/verify-admin", asyncHandler(async (req, res) => {
    const authHeader = req.get("authorization") || req.get("x-admin-token") || "";
    const rawToken = authHeader.replace(/^Bearer\s+/i, "").trim();

    if (!rawToken) {
        return res.status(401).json({ success: false, error: "Token de administrador requerido." });
    }

    const user = await verifyAdminToken(rawToken);

    if (!user || user.role !== "admin") {
        return res.status(403).json({ success: false, error: "No tienes permisos de administrador." });
    }

    return res.status(200).json({
        success: true,
        adminToken: createAdminToken(user._id, user.email),
        user: {
            id: user._id,
            email: user.email,
            role: user.role,
            firstName: user.firstName,
            lastName: user.lastName
        }
    });
}));

// ==============================================================
// GESTIÓN DE USUARIOS Y ROLES (SOLO ADMINISTRADORES)
// ==============================================================

// GET: Búsqueda de médicos registrados
app.get("/admin/users", requireAdmin, asyncHandler(async (req, res) => {
    const query = String(req.query.q || "").trim();
    let filter = {};

    if (query) {
        const regex = buildAccentInsensitiveRegex(query, false);
        filter = {
            $or: [
                { firstName: regex },
                { lastName: regex },
                { email: regex }
            ]
        };
    }

    const users = await DoctorUser.find(
        filter,
        "firstName lastName email role country specialty institution identifiers"
    )
        .sort({ role: 1, lastName: 1, firstName: 1 })
        .limit(50)
        .lean({ virtuals: true });

    const formatted = users.map(u => ({
        _id: u._id,
        name: [u.firstName, u.lastName].filter(Boolean).join(" "),
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        role: u.role || "doctor",
        country: u.country,
        specialty: u.specialty,
        institution: u.institution,
        licenseNumber: u.licenseNumber || (u.identifiers ? Object.entries(u.identifiers).map(([k, v]) => `${k.toUpperCase()}: ${v}`).join(" / ") : "")
    }));

    res.status(200).json({ success: true, count: formatted.length, data: formatted });
}));

// PATCH: Asignar o revocar rol de administrador a un usuario
app.patch("/admin/users/:id/role", requireAdmin, asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !["doctor", "admin", "Médico"].includes(role)) {
        return res.status(400).json({ success: false, error: "Rol inválido. Debe ser 'doctor' o 'admin'." });
    }

    const normalizedRole = role === "admin" ? "admin" : "doctor";

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, error: "Identificador de usuario inválido." });
    }

    const targetUser = await DoctorUser.findById(id);
    if (!targetUser) {
        return res.status(404).json({ success: false, error: "Usuario no encontrado." });
    }

    // Evitar revocar el rol al último administrador del sistema
    if (normalizedRole === "doctor" && targetUser.role === "admin") {
        const adminCount = await DoctorUser.countDocuments({ role: "admin" });
        if (adminCount <= 1) {
            return res.status(400).json({
                success: false,
                error: "No se puede revocar el rol al único administrador de la plataforma."
            });
        }
    }

    targetUser.role = normalizedRole;
    await targetUser.save();

    const userObj = targetUser.toObject({ virtuals: true });
    delete userObj.passwordHash;
    delete userObj.salt;

    res.status(200).json({
        success: true,
        message: `Rol actualizado a ${role === 'admin' ? 'Administrador' : 'Médico'} con éxito.`,
        data: userObj
    });
}));

// --------------------------------------------------------------
// Error Handler
// --------------------------------------------------------------
app.use((err, req, res, next) => {
    let statusCode = 500;
    let message = err.message || "Internal Server Error";

    if (err.name === "ValidationError") {
        statusCode = 400;
        message = Object.values(err.errors).map(val => val.message).join(", ");
    } else if (err.code === 11000) {
        statusCode = 400;
        message = "El registro ya existe en el sistema y debe ser único.";
    } else if (statusCode === 500 && process.env.NODE_ENV === "production") {
        message = "Ocurrió un error interno en el servidor.";
    }

    res.status(statusCode).json({ success: false, error: message });
});

// --------------------------------------------------------------
// Server
// --------------------------------------------------------------
const PORT = process.env.PORT || 10000;

if (process.env.NODE_ENV !== "test") {
    app.listen(PORT, "0.0.0.0", () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

module.exports = app;