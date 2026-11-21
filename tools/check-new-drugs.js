#!/usr/bin/env node
/**
 * Herramienta de Auditoría y Detección de Fármacos Novedosos / Faltantes
 * Compara los medicamentos autorizados vigentes en CIMA AEMPS y OpenFDA frente a MongoDB
 * normalizando sales y prefijos químicos, para alimentar automáticamente la cola de ingestión.
 *
 * Uso:
 *   node tools/check-new-drugs.js [--enqueue] [--fda]
 */

const https = require("https");
const path = require("path");
const mongoose = require("../backend/node_modules/mongoose");
require("../backend/node_modules/dotenv").config({ path: path.join(__dirname, "../backend/.env") });

const OPENFDA_KEY = process.env.OPENFDA_API_KEY || "";

function fetchJson(url) {
    return new Promise((resolve) => {
        https.get(url, (res) => {
            if (res.statusCode >= 400) return resolve(null);
            let data = "";
            res.on("data", chunk => data += chunk);
            res.on("end", () => {
                try { resolve(JSON.parse(data)); } catch (e) { resolve(null); }
            });
        }).on("error", () => resolve(null));
    });
}

function stripDiacritics(str) {
    return String(str || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

function normalizeKey(str) {
    return stripDiacritics(str)
        .replace(/[+/&]/g, " y ")
        .replace(/[()[\],.\-—_]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

// Limpia sales químicas comunes (ej. "tramadol hidrocloruro" -> "tramadol")
function cleanChemicalSalt(name) {
    const salts = [
        "hidrocloruro", "clorhidrato", "sodio trihidrato", "sodio", "potasio",
        "acetato", "maleato", "fumarato", "bromuro", "fosfato", "tartrato",
        "dihidrato", "monohidrato", "valerato", "propionato", "xinafoato",
        "trometamol", "aceponato", "sulfato", "trihidrato", "dihidrocloruro"
    ];
    let res = stripDiacritics(name);
    for (const s of salts) {
        res = res.replace(new RegExp("\\b" + s + "\\b", "g"), "").trim();
    }
    res = res.replace(/\b([a-z]+)ico acido\b/g, "acido $1ico");
    return res.replace(/\s+/g, " ").trim();
}

async function run() {
    console.log("=== AUDITORÍA PERIÓDICA DE FÁRMACOS NOVEDOSOS (CIMA & OpenFDA) ===\n");
    await mongoose.connect(process.env.MONGODB_URI);
    const Drug = mongoose.connection.db.collection("drugs");
    const PendingDrug = mongoose.connection.db.collection("pendingdrugs");

    console.log("Consultando catálogo actual de FarmacoPedia...");
    const existingDrugs = await Drug.find({}, { projection: { name: 1, atc: 1 } }).toArray();
    const existingKeys = new Set();
    existingDrugs.forEach(d => {
        existingKeys.add(normalizeKey(d.name));
        existingKeys.add(cleanChemicalSalt(d.name));
    });
    console.log(`Fármacos en producción: ${existingDrugs.length}`);

    const existingPending = await PendingDrug.find({}).toArray();
    const pendingKeys = new Set(existingPending.map(p => normalizeKey(p.name)));
    console.log(`Fármacos en cola de pendientes: ${existingPending.length}\n`);

    const shouldEnqueue = process.argv.includes("--enqueue");
    const checkFda = process.argv.includes("--fda");

    const newCandidates = [];

    // 1. Cuestionar CIMA AEMPS
    console.log("Consultando medicamentos autorizados vigentes en CIMA AEMPS...");
    const cimaSample = await fetchJson("https://cima.aemps.es/cima/rest/medicamentos?estado=1&validados=1&limit=60");
    if (cimaSample && Array.isArray(cimaSample.resultados)) {
        for (const med of cimaSample.resultados) {
            if (!med.nregistro) continue;
            const detail = await fetchJson(`https://cima.aemps.es/cima/rest/medicamento?nregistro=${med.nregistro}`);
            if (detail && Array.isArray(detail.principiosActivos) && detail.principiosActivos.length > 0) {
                const actList = detail.principiosActivos.map(p => cleanChemicalSalt(p.nombre));
                actList.sort();
                const dciName = actList.join(" + ");
                const key = normalizeKey(dciName);

                if (!existingKeys.has(key) && !pendingKeys.has(key)) {
                    if (!newCandidates.some(c => c.key === key)) {
                        newCandidates.push({
                            key,
                            name: dciName,
                            atc: (detail.atcs && detail.atcs[0]) ? detail.atcs[0].codigo : null,
                            source: "CIMA AEMPS",
                            nregistro: med.nregistro,
                            comercialSample: med.nombre
                        });
                    }
                }
            }
        }
    }

    // 2. Cuestionar OpenFDA si está habilitado o configurado
    if (checkFda && OPENFDA_KEY) {
        console.log("Consultando novedades de etiquetado en OpenFDA...");
        const fdaUrl = `https://api.fda.gov/drug/label.json?api_key=${OPENFDA_KEY}&limit=20`;
        const fdaData = await fetchJson(fdaUrl);
        if (fdaData && Array.isArray(fdaData.results)) {
            for (const r of fdaData.results) {
                const subs = (r.openfda && r.openfda.substance_name) || [];
                for (const sub of subs) {
                    const normSub = cleanChemicalSalt(sub);
                    const key = normalizeKey(normSub);
                    if (!existingKeys.has(key) && !pendingKeys.has(key)) {
                        if (!newCandidates.some(c => c.key === key)) {
                            newCandidates.push({
                                key,
                                name: normSub,
                                atc: null,
                                source: "OpenFDA",
                                nregistro: null,
                                comercialSample: (r.openfda && r.openfda.brand_name && r.openfda.brand_name[0]) || sub
                            });
                        }
                    }
                }
            }
        }
    }

    console.log(`\nNuevos principios activos / combinaciones ausentes: ${newCandidates.length}`);
    newCandidates.forEach(c => {
        console.log(`  - [${c.source}] ${c.name} ${c.atc ? `(ATC: ${c.atc})` : ""} | Comercial: ${c.comercialSample}`);
    });

    if (shouldEnqueue && newCandidates.length > 0) {
        console.log(`\nEncolando ${newCandidates.length} fármacos en la colección 'pendingdrugs'...`);
        for (const cand of newCandidates) {
            await PendingDrug.updateOne(
                { name: cand.name },
                {
                    $setOnInsert: {
                        name: cand.name,
                        searchCount: 1,
                        status: "pending",
                        lastSearchedAt: new Date(),
                        createdAt: new Date(),
                        updatedAt: new Date()
                    }
                },
                { upsert: true }
            );
        }
        console.log("Fármacos agregados a la cola de pendientes exitosamente.");
    }

    await mongoose.disconnect();
    console.log("\nRevisión completada.");
}

run().catch(console.error);
