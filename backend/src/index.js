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
app.use(express.json());
app.use(cors());

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
// Schema & Model
// --------------------------------------------------------------

const dosageEntrySchema = new mongoose.Schema({
    amount: { 
        type: String, 
        trim: true, 
        match: /^[0-9\-\/.,\s]+$/i 
    },
    unit: { 
        type: String, 
        trim: true, 
        match: /^[a-záéíóúüñ0-9\,./%\s-]+$/i 
    },
    route: [{ 
        type: String, 
        match: /^[a-záéíóúüñA-ZÁÉÍÓÚÜÑ\s]+$/i 
    }],
    useIn: { 
        type: String, 
        enum: ["Adultos", "Niños", "Ambos"] 
    }
}, { _id: false });

const routeGuidanceSchema = new mongoose.Schema({
    guidelines: [{ 
        type: String, 
        match: /^[a-záéíóúüñA-ZÁÉÍÓÚÜÑ0-9\,.;:()%+*/<>≤≥÷\s-]+$/i 
    }],
    maxDose: [{ 
        type: String, 
        match: /^[a-záéíóúüñA-ZÁÉÍÓÚÜÑ0-9\,.;:()%+*/<>≤≥÷\s-]+$/i 
    }]
}, { _id: false });

const atcEntrySchema = new mongoose.Schema({
    code: { 
        type: String, 
        trim: true, 
        uppercase: true 
    },
    categoryCode: { 
        type: String, 
        trim: true, 
        uppercase: true 
    },
    categoryName: { 
        type: String, 
        trim: true 
    },
    subcategoryCode: { 
        type: String, 
        trim: true, 
        uppercase: true 
    },
    subcategoryName: { 
        type: String, 
        trim: true 
    }
}, { _id: false });

const drugSchema = new mongoose.Schema({
    name: { 
        type: String, 
        unique: true, 
        required: true, 
        trim: true, 
        lowercase: true, 
        index: true,
        match: /^[a-záéíóúüñA-ZÁÉÍÓÚÜÑ\s-]+$/i
    },
    atc: {
        type: [atcEntrySchema],
        required: true,
        validate: [v => Array.isArray(v) && v.length > 0, "Al menos una clasificación ATC es requerida."]
    },
    actionMechanism: {
        type: String,
        match: /^[a-záéíóúüñA-ZÁÉÍÓÚÜÑ0-9\,.;:()%+*/<>≤≥÷\s-]+$/i
    },
    indications: [{
        type: String,
        match: /^[a-záéíóúüñA-ZÁÉÍÓÚÜÑ\s]+$/i
    }],
    presentations: { 
        type: Map, 
        of: { dosage: [dosageEntrySchema] } 
    },
    dosageGuidance: {
        adult: { type: Map, of: routeGuidanceSchema },
        pediatric: { type: Map, of: routeGuidanceSchema }
    },
    risk: {
        pregnancy: { type: String, match: /^[a-záéíóúüñA-ZÁÉÍÓÚÜÑ\s]+$/i },
        lactation: { type: String, match: /^[a-záéíóúüñA-ZÁÉÍÓÚÜÑ\s]+$/i },
        renal: { 
            level: { type: String, match: /^[a-záéíóúüñA-ZÁÉÍÓÚÜÑ\s]+$/i }, 
            adjustment: { type: String, match: /^[a-záéíóúüñA-ZÁÉÍÓÚÜÑ0-9\,.;:()%+*/<>≤≥÷\s-]+$/i } 
        },
        hepatic: { 
            level: { type: String, match: /^[a-záéíóúüñA-ZÁÉÍÓÚÜÑ\s]+$/i }, 
            adjustment: { type: String, match: /^[a-záéíóúüñA-ZÁÉÍÓÚÜÑ0-9\,.;:()%+*/<>≤≥÷\s-]+$/i } 
        },
        geriatric: { type: String, match: /^[a-záéíóúüñA-ZÁÉÍÓÚÜÑ\s]+$/i },
        securityFlags: [{ type: String, match: /^[a-záéíóúüñA-ZÁÉÍÓÚÜÑ\s]+$/i }]
    },
    contraindications: [{ type: String, match: /^[a-záéíóúüñA-ZÁÉÍÓÚÜÑ\s]+$/i }],
    interactions: [{ type: String, match: /^[a-záéíóúüñA-ZÁÉÍÓÚÜÑ\s]+$/i }],
    adverseReactions: [{ type: String, match: /^[a-záéíóúüñA-ZÁÉÍÓÚÜÑ\s]+$/i }],
    overdose: {
        type: String,
        match: /^[a-záéíóúüñA-ZÁÉÍÓÚÜÑ0-9\,.;:()%+*/<>≤≥÷\s-]+$/i
    },
    references: [{
        type: String,
        trim: true,
        match: /^[a-záéíóúüñA-ZÁÉÍÓÚÜÑ0-9\s.,;:()—–\-_/&?="'#%ªº]+$/i
    }]
}, { timestamps: true, lean: true });

// Compound indexes for optimized search and ATC queries
drugSchema.index({ name: 1 });
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
        lowercase: true,
        index: true
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
}, { timestamps: true, lean: true });

pendingDrugSchema.index({ status: 1, searchCount: -1 });

const PendingDrug = mongoose.model("PendingDrug", pendingDrugSchema);

// --------------------------------------------------------------
// Helpers
// --------------------------------------------------------------
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// --------------------------------------------------------------
// Routes
// --------------------------------------------------------------

// POST: Add drug
app.post("/drugs", asyncHandler(async (req, res) => {
    const newDrug = new Drug(req.body);
    await newDrug.save();
    res.status(201).json({ success: true, data: newDrug });
}));

// GET: All drug names (supports ?q= or ?search= by name, category, or ATC)
app.get("/drugs", asyncHandler(async (req, res) => {
    const { q, search } = req.query;
    const queryTerm = (q || search || "").trim();
    let filter = {};
    if (queryTerm) {
        const escaped = queryTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escaped, 'i');
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
    const drugList = await Drug.find(filter, "name atc actionMechanism").sort({ name: 1 });
    res.status(200).json({ success: true, count: drugList.length, data: drugList });
}));

// GET: All categories (Returns ATC Level 1 -> Level 2 hierarchical tree, or ?flat=true for list of ATC subcategories)
app.get("/drugs/families", asyncHandler(async (req, res) => {
    if (req.query.flat === 'true') {
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
        cat.subcategories.sort((a, b) => a.subcategoryCode.localeCompare(b.subcategoryCode));
    });

    res.status(200).json({ success: true, data: tree });
}));

// Helper function to resolve enriched ATC search and metadata
const getEnrichedAtcDrugs = async (identifier) => {
    const raw = (identifier || "").trim();
    if (!raw) return null;

    const escaped = raw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`^${escaped}$`, 'i');

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
    ).sort({ name: 1 });

    if (!drugs || drugs.length === 0) {
        return null;
    }

    // Determine metadata from first matching drug's ATC entries
    let matchedMetadata = null;
    const upper = raw.toUpperCase();

    for (const drug of drugs) {
        for (const item of (drug.atc || [])) {
            if (item.code?.toUpperCase() === upper) {
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
            } else if (item.subcategoryCode?.toUpperCase() === upper || item.subcategoryName?.toLowerCase() === raw.toLowerCase()) {
                matchedMetadata = {
                    level: 2,
                    code: item.subcategoryCode,
                    name: item.subcategoryName,
                    categoryCode: item.categoryCode,
                    categoryName: item.categoryName
                };
                break;
            } else if (item.categoryCode?.toUpperCase() === upper || item.categoryName?.toLowerCase() === raw.toLowerCase()) {
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
        matchedMetadata = {
            query: raw
        };
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

// GET: Filter by ATC subcategory code (e.g. N02, J01)
app.get("/drugs/atc/subcategories/:code", asyncHandler(async (req, res) => {
    const rawCode = (req.params.code || "").trim().toUpperCase();
    const drugs = await Drug.find({ 
        "atc.subcategoryCode": rawCode 
    }, "name atc actionMechanism").sort({ name: 1 });
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

// GET: Single drug
app.get("/drugs/:name", asyncHandler(async (req, res) => {
    const drugFound = await Drug.findOne({ name: req.params.name.toLowerCase() });
    if (!drugFound) {
        return res.status(404).json({ success: false, error: "Drug not found" });
    }
    res.status(200).json({ success: true, data: drugFound });
}));

// PATCH: Update
app.patch("/drugs/:name", asyncHandler(async (req, res) => {
    const updatedDrug = await Drug.findOneAndUpdate(
        { name: req.params.name.toLowerCase() },
        { $set: req.body },
        { new: true, runValidators: true }
    );
    if (!updatedDrug) {
        return res.status(404).json({ success: false, error: "Drug not found" });
    }
    res.status(200).json({ success: true, data: updatedDrug });
}));

// DELETE: Remove
app.delete("/drugs/:name", asyncHandler(async (req, res) => {
    const deletedDrug = await Drug.findOneAndDelete({ name: req.params.name.toLowerCase() });
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
    if (!name || typeof name !== "string") {
        return res.status(400).json({ success: false, error: "Name is required" });
    }
    const normalizedName = name.trim().toLowerCase();
    const pending = await PendingDrug.findOneAndUpdate(
        { name: normalizedName },
        {
            $inc: { searchCount: 1 },
            $set: { lastSearchedAt: new Date(), status: "pending" }
        },
        { new: true, upsert: true }
    );
    res.status(200).json({ success: true, data: pending });
}));

// GET: Get prioritized pending drugs
app.get("/pending-drugs", asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit, 10) || 10;
    const pendingList = await PendingDrug.find({ status: "pending" })
        .sort({ searchCount: -1, lastSearchedAt: -1 })
        .limit(limit);
    res.status(200).json({ success: true, count: pendingList.length, data: pendingList });
}));

// PATCH: Mark pending drug as completed
app.patch("/pending-drugs/:name/complete", asyncHandler(async (req, res) => {
    const updated = await PendingDrug.findOneAndUpdate(
        { name: req.params.name.toLowerCase() },
        { status: "completed" },
        { new: true }
    );
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
    }
    if (err.code === 11000) {
        statusCode = 400;
        message = "The drug name must be unique.";
    }

    res.status(statusCode).json({ success: false, error: message });
});

// --------------------------------------------------------------
// Server
// --------------------------------------------------------------
const PORT = process.env.PORT || 10000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});