#!/usr/bin/env node
/**
 * Herramienta de Deduplicación y Fusión Inteligente de Fármacos
 * Soporta dos modos:
 *   --dry-run (por defecto): Simula el proceso completo, valida las fichas y reporta.
 *   --apply: Aplica los cambios en MongoDB y en auditoria final/.
 */

const fs = require("fs");
const path = require("path");
const { audit } = require("./check-record");
const mongoose = require("../backend/node_modules/mongoose");
require("../backend/node_modules/dotenv").config({ path: path.join(__dirname, "../backend/.env") });

const DIR = path.join(__dirname, "..", "auditoria final");

// Normalización de texto para comparación
function stripDiacritics(str) {
    return String(str || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

function normalizeKey(name) {
    const s = stripDiacritics(name)
        .replace(/[+&]/g, " y ")
        .replace(/[()[\],.\-—_]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    const tokens = s.split(/\b(?:y|con)\b/g).map(t => t.trim()).filter(Boolean);
    tokens.sort();
    return tokens.join(" + ");
}

// Fusión aditiva inteligente de dos o más fichas
function mergeRecords(records, preferredCanonicalName) {
    // Escoger nombre canónico
    let finalName = preferredCanonicalName;
    if (!finalName) {
        // Preferir versión con '+' si es combinación, o con tilde si es monofármaco
        const withPlus = records.find(r => r.name.includes("+"));
        if (withPlus) finalName = withPlus.name;
        else {
            // El de mayor longitud suele tener tildes o grafía completa
            records.sort((a, b) => b.name.length - a.name.length);
            finalName = records[0].name;
        }
    }

    // ATC: preferir el de código más largo (más específico, nivel 5)
    let bestAtc = records[0].atc || [];
    for (const r of records) {
        const atc = r.atc || [];
        if (atc[0] && atc[0].code) {
            const currentCode = bestAtc[0] ? bestAtc[0].code : "";
            if (atc[0].code.length > currentCode.length) {
                bestAtc = atc;
            }
        }
    }

    // Mecanismo de acción: el más largo/descriptivo
    let bestMech = "";
    for (const r of records) {
        const m = String(r.actionMechanism || "").trim();
        if (m.length > bestMech.length) bestMech = m;
    }

    // Listas: Indicaciones, Contraindicaciones, Interacciones, RAMs, Referencias (unión única)
    function mergeLists(key) {
        const set = new Set();
        const result = [];
        for (const r of records) {
            const list = Array.isArray(r[key]) ? r[key] : [];
            for (const item of list) {
                if (!item) continue;
                const norm = stripDiacritics(item);
                if (!set.has(norm)) {
                    set.add(norm);
                    result.push(item);
                }
            }
        }
        return result;
    }

    const indications = mergeLists("indications");
    const contraindications = mergeLists("contraindications");
    const interactions = mergeLists("interactions");
    const adverseReactions = mergeLists("adverseReactions");
    const references = mergeLists("references");

    // Sobredosis: el más completo
    let bestOverdose = "";
    for (const r of records) {
        const ov = String(r.overdose || "").trim();
        if (ov.length > bestOverdose.length) bestOverdose = ov;
    }

    // Presentaciones: fusionar llaves y dosificaciones
    const mergedPresentations = {};
    for (const r of records) {
        const pres = r.presentations || {};
        for (const [pName, pObj] of Object.entries(pres)) {
            if (!mergedPresentations[pName]) {
                mergedPresentations[pName] = { dosage: [] };
            }
            const doses = (pObj && Array.isArray(pObj.dosage)) ? pObj.dosage : [];
            for (const d of doses) {
                const exists = mergedPresentations[pName].dosage.some(
                    ex => ex.amount === d.amount && ex.unit === d.unit && String(ex.route) === String(d.route)
                );
                if (!exists) {
                    mergedPresentations[pName].dosage.push(d);
                }
            }
        }
    }

    // DosageGuidance: fusionar rutas de adulto y pediátrico
    const mergedDosageGuidance = { adult: {}, pediatric: {} };
    for (const r of records) {
        const dg = r.dosageGuidance || {};
        ['adult', 'pediatric'].forEach(pop => {
            const routes = dg[pop] || {};
            for (const [rName, rObj] of Object.entries(routes)) {
                if (!mergedDosageGuidance[pop][rName]) {
                    mergedDosageGuidance[pop][rName] = { guidelines: [], maxDose: [] };
                }
                const gList = rObj.guidelines || [];
                const mList = rObj.maxDose || [];
                gList.forEach(g => {
                    if (!mergedDosageGuidance[pop][rName].guidelines.includes(g)) {
                        mergedDosageGuidance[pop][rName].guidelines.push(g);
                    }
                });
                mList.forEach(m => {
                    if (!mergedDosageGuidance[pop][rName].maxDose.includes(m)) {
                        mergedDosageGuidance[pop][rName].maxDose.push(m);
                    }
                });
            }
        });
    }

    // Risk: el más completo por campo
    const mergedRisk = { securityFlags: [] };
    const flagsSet = new Set();
    for (const r of records) {
        const rk = r.risk || {};
        ['pregnancy', 'lactation', 'geriatric'].forEach(f => {
            if (rk[f] && (!mergedRisk[f] || rk[f].length > mergedRisk[f].length)) {
                mergedRisk[f] = rk[f];
            }
        });
        ['renal', 'hepatic'].forEach(org => {
            if (rk[org]) {
                if (!mergedRisk[org]) mergedRisk[org] = { level: "", adjustment: "" };
                if (rk[org].level && (!mergedRisk[org].level || rk[org].level.length > mergedRisk[org].level.length)) {
                    mergedRisk[org].level = rk[org].level;
                }
                if (rk[org].adjustment && (!mergedRisk[org].adjustment || rk[org].adjustment.length > mergedRisk[org].adjustment.length)) {
                    mergedRisk[org].adjustment = rk[org].adjustment;
                }
            }
        });
        (rk.securityFlags || []).forEach(flag => {
            const norm = stripDiacritics(flag);
            if (!flagsSet.has(norm)) {
                flagsSet.add(norm);
                mergedRisk.securityFlags.push(flag);
            }
        });
    }

    return {
        name: finalName,
        atc: bestAtc,
        actionMechanism: bestMech,
        indications,
        presentations: mergedPresentations,
        dosageGuidance: mergedDosageGuidance,
        risk: mergedRisk,
        contraindications,
        interactions,
        adverseReactions,
        overdose: bestOverdose,
        references
    };
}

// Pares conocidos en inglés vs español
const KNOWN_ENG_SPA_PAIRS = [
    { enFile: "yellow_fever_vaccine.json", esFile: "vacuna_anti_fiebre_amarilla.json" },
    { enFile: "rabies_vaccine.json", esFile: "vacuna_anti_rabia.json" },
    { enFile: "cholera_vaccine.json", esFile: "vacuna_anti_colera.json" },
    { enFile: "bcg_vaccine.json", esFile: "vacuna_anti_bcg.json" },
    { enFile: "typhoid_vaccine.json", esFile: "vacuna_anti_tifoidea.json" },
    { enFile: "respiratory_syncytial_virus_vaccine.json", esFile: "vacuna_anti_virus_respiratorio_sincitial.json" },
    { enFile: "hyoscine_butylbromide.json", esFile: "butilescopolamina_bromuro.json" },
    { enFile: "anti_d_immunoglobulin.json", esFile: "inmunoglobulina_anti_d_rh.json" },
    { enFile: "calcium_folinate_leucovorin_calcium.json", esFile: "acido_folinico.json" },
    { enFile: "anti_rabies_immunoglobulin.json", esFile: "inmunoglobulina_antirrabica_humana.json" },
    { enFile: "acetylsalicylic_acid_atorvastatin_ramipril.json", esFile: "atorvastatina_acido_acetilsalicilico_ramipril.json" }
];

async function run() {
    const isApply = process.argv.includes("--apply");
    console.log(`=== Ingesta / Deduplicación Inteligente [Modo: ${isApply ? "APPLY" : "DRY-RUN"}] ===\n`);

    const files = fs.readdirSync(DIR).filter(f => f.endsWith(".json") && f !== "_auditoria.json");
    console.log(`Total archivos en auditoria final/: ${files.length}`);

    // 1. Mapear pares inglés -> español explícitos
    const englishFilesToMerge = new Map();
    for (const pair of KNOWN_ENG_SPA_PAIRS) {
        if (files.includes(pair.enFile) && files.includes(pair.esFile)) {
            englishFilesToMerge.set(pair.enFile, pair.esFile);
        }
    }

    // 2. Agrupar archivos por clave canónica normalizada
    const groups = new Map();
    const fileToDoc = new Map();

    for (const f of files) {
        const filePath = path.join(DIR, f);
        const doc = JSON.parse(fs.readFileSync(filePath, "utf8"));
        fileToDoc.set(f, doc);

        // Si es un archivo en inglés mapeado, asignarlo al grupo de su archivo español
        let key;
        if (englishFilesToMerge.has(f)) {
            const targetEsFile = englishFilesToMerge.get(f);
            const esDoc = JSON.parse(fs.readFileSync(path.join(DIR, targetEsFile), "utf8"));
            key = normalizeKey(esDoc.name);
        } else {
            key = normalizeKey(doc.name);
        }

        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push({ file: f, doc });
    }

    console.log(`Grupos canónicos únicos detectados: ${groups.size}`);

    let singleCount = 0;
    let duplicateGroupsCount = 0;
    let totalMergedFiles = 0;
    const finalDrugs = [];
    const filesToDelete = [];
    const auditIssues = [];

    for (const [key, items] of groups.entries()) {
        if (items.length === 1) {
            singleCount++;
            finalDrugs.push({
                canonicalFile: items[0].file,
                doc: items[0].doc,
                mergedFrom: [items[0].file]
            });
        } else {
            duplicateGroupsCount++;
            totalMergedFiles += items.length;

            // Determinar nombre canónico preferido:
            // Regla: si hay uno con '+', elegir ese; si no, preferir el que tenga tilde / mejor grafía en español
            let preferredName = null;
            const plusItem = items.find(i => i.doc.name.includes("+"));
            if (plusItem) {
                // Asegurar formato 'comp1 + comp2'
                preferredName = plusItem.doc.name;
            } else {
                // Entre monofármacos, preferir el que tenga tilde o longitud mayor
                const sorted = [...items].sort((a, b) => b.doc.name.length - a.doc.name.length);
                preferredName = sorted[0].doc.name;
            }

            // Archivo canónico que quedará
            // Si hay uno sin sufijo _2 ni en inglés, usar ese
            let canonicalFileItem = items.find(i => !i.file.includes("_2.json") && !englishFilesToMerge.has(i.file) && !i.file.endsWith("_y_.json") && !i.file.includes("_y_"));
            if (!canonicalFileItem) canonicalFileItem = items[0];

            const mergedDoc = mergeRecords(items.map(i => i.doc), preferredName);
            
            // Los otros archivos del grupo se marcarán para eliminación
            for (const it of items) {
                if (it.file !== canonicalFileItem.file) {
                    filesToDelete.push(it.file);
                }
            }

            finalDrugs.push({
                canonicalFile: canonicalFileItem.file,
                doc: mergedDoc,
                mergedFrom: items.map(i => i.file)
            });
        }
    }

    console.log(`\n--- Estadísticas de la Fusión ---`);
    console.log(`Fichas sin duplicados: ${singleCount}`);
    console.log(`Grupos de duplicados fusionados: ${duplicateGroupsCount} (${totalMergedFiles} archivos originales)`);
    console.log(`Fichas consolidadas resultantes: ${finalDrugs.length}`);
    console.log(`Archivos redundantes a eliminar: ${filesToDelete.length}`);

    // Validar calidad clínica de todas las fichas consolidadas con check-record
    let validCount = 0;
    for (const item of finalDrugs) {
        const res = audit(item.doc);
        if (res.level === "completo") {
            validCount++;
        } else {
            auditIssues.push({ name: item.doc.name, file: item.canonicalFile, level: res.level, issues: res.issues });
        }
    }

    console.log(`\n--- Control de Calidad Clínico ---`);
    console.log(`Fichas con nivel COMPLETO (100% válidas): ${validCount} / ${finalDrugs.length} (${((validCount/finalDrugs.length)*100).toFixed(2)}%)`);
    if (auditIssues.length) {
        console.log(`Problemas detectados:`, JSON.stringify(auditIssues, null, 2));
    }

    if (!isApply) {
        console.log(`\n[DRY-RUN FINALIZADO CON ÉXITO] No se realizaron cambios en la base de datos ni en disco.`);
        console.log(`Ejecute con '--apply' para persistir la fusión.`);
        return;
    }

    // MODO APPLY: PERSISTIR EN MONGODB Y DISCO
    console.log(`\nPersistiendo cambios en MongoDB y en disco...`);
    await mongoose.connect(process.env.MONGODB_URI);
    const col = mongoose.connection.db.collection("drugs");

    // 1. Respaldo de seguridad en MongoDB (colección drugs_backup_pre_dedup)
    const backupColName = `drugs_backup_${Date.now()}`;
    console.log(`Creando colección de respaldo: ${backupColName}...`);
    const allCurrentDb = await col.find({}).toArray();
    if (allCurrentDb.length) {
        await mongoose.connection.db.collection(backupColName).insertMany(allCurrentDb);
        console.log(`Respaldo completado (${allCurrentDb.length} documentos salvaguardados).`);
    }

    // 2. Actualizar/Insertar en MongoDB cada ficha consolidada
    console.log(`Sincronizando ${finalDrugs.length} fármacos en la colección 'drugs'...`);
    let upsertCount = 0;
    for (const item of finalDrugs) {
        await col.updateOne(
            { name: item.doc.name },
            { $set: item.doc },
            { upsert: true }
        );
        upsertCount++;
    }
    console.log(`Upsert completado: ${upsertCount} documentos sincronizados.`);

    // 3. Eliminar de MongoDB los nombres que fueron absorbidos/eliminados
    const canonicalNamesSet = new Set(finalDrugs.map(d => d.doc.name.toLowerCase().trim()));
    const dbDocs = await col.find({}, { projection: { name: 1 } }).toArray();
    let deletedDbCount = 0;
    for (const d of dbDocs) {
        if (!canonicalNamesSet.has(d.name.toLowerCase().trim())) {
            await col.deleteOne({ _id: d._id });
            deletedDbCount++;
        }
    }
    console.log(`Documentos obsoletos eliminados de MongoDB: ${deletedDbCount}`);

    // 4. Guardar archivos consolidados en auditoria final/ y eliminar redundantes
    console.log(`Actualizando archivos en '${DIR}'...`);
    for (const item of finalDrugs) {
        const filePath = path.join(DIR, item.canonicalFile);
        fs.writeFileSync(filePath, JSON.stringify(item.doc, null, 2), "utf8");
    }

    let deletedFilesCount = 0;
    for (const delFile of filesToDelete) {
        const filePath = path.join(DIR, delFile);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            deletedFilesCount++;
        }
    }
    console.log(`Archivos redundantes eliminados de disco: ${deletedFilesCount}`);

    // 5. Regenerar _auditoria.json
    console.log(`Regenerando _auditoria.json...`);
    const { execSync } = require("child_process");
    execSync(`node "${path.join(__dirname, "audit-folder.js")}" "${DIR}"`, { stdio: "inherit" });

    await mongoose.disconnect();
    console.log(`\n¡PROCESO COMPLETADO EXITOSAMENTE!`);
}

run().catch(e => {
    console.error("Error en deduplicación:", e);
    process.exit(1);
});
