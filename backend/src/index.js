// --------------------------------------------------------------
// Imports
// --------------------------------------------------------------
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();

// --------------------------------------------------------------
// Middlewares
// --------------------------------------------------------------
app.use(express.json({ limit: "2mb" }));
app.use(cors());

// Admin protection for write routes (header: x-admin-key)
const crypto = require("crypto");
const requireAdmin = (req, res, next) => {
    const expected = process.env.ADMIN_API_KEY;
    if (!expected) {
        return res.status(503).json({ success: false, error: "ADMIN_API_KEY not configured on server" });
    }
    const sha = (v) => crypto.createHash("sha256").update(String(v || "")).digest();
    if (!crypto.timingSafeEqual(sha(req.get("x-admin-key")), sha(expected))) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
    }
    next();
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
const REGEX_CLINICAL_TEXT = /^[a-záéíóúüñ0-9\s.,;:()[\]—–\-_/&?="'#%ªº+*/<>≤≥±°αβγμ]+$/i;

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

// --------------------------------------------------------------
// Helpers
// --------------------------------------------------------------
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

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

// POST: Add drug & automatically mark as completed in PendingDrug queue if it existed
app.post("/drugs", requireAdmin, asyncHandler(async (req, res) => {
    const newDrug = new Drug(req.body);
    await newDrug.save();

    // Si estaba en la lista de pendientes (con o sin tilde), marcarlo como completado
    await PendingDrug.updateMany(
        { name: buildAccentInsensitiveRegex(newDrug.name, true) },
        { $set: { status: "completed" } }
    );

    res.status(201).json({ success: true, data: newDrug });
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
        message = "The drug name must be unique.";
    }

    res.status(statusCode).json({ success: false, error: message });
});

// --------------------------------------------------------------
// Server
// --------------------------------------------------------------
const PORT = process.env.PORT || 10000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on port ${PORT}`);
});