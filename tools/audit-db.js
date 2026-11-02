#!/usr/bin/env node
/**
 * Auditoría de solo lectura de la colección `drugs`.
 * Usa el mismo criterio clínico que tools/check-record.js:
 * contenido real y secciones presentes, sin umbrales artificiales de longitud
 * ni mínimos de indicaciones/contraindicaciones/interacciones.
 *
 * Uso: node tools/audit-db.js
 * Salida: auditoria_farmacos.json + resumen por consola.
 */
const fs = require("fs");
const path = require("path");
const mongoose = require(path.join(__dirname, "../backend/node_modules/mongoose"));
require(path.join(__dirname, "../backend/node_modules/dotenv")).config({ path: path.join(__dirname, "../backend/.env") });
const { audit } = require("./check-record");

const OUT = path.join(__dirname, "..", "auditoria_farmacos.json");

(async () => {
    await mongoose.connect(process.env.MONGODB_URI);
    const col = mongoose.connection.db.collection("drugs");
    const docs = await col.find({}).toArray();
    const records = docs.map(audit);

    const summary = {
        generatedAt: new Date().toISOString(),
        total: records.length,
        niveles: records.reduce((a, r) => (a[r.level] = (a[r.level] || 0) + 1, a), {}),
        porProblema: {},
        prefijoGrupo: records.filter(r => r.issues.some(i => i.code === "prefijo_grupo")).map(r => r.name),
        prefijoAtc: records.filter(r => r.issues.some(i => i.code === "prefijo_atc")).map(r => r.name)
    };
    for (const r of records) for (const i of r.issues) summary.porProblema[i.code] = (summary.porProblema[i.code] || 0) + 1;
    summary.porProblema = Object.fromEntries(Object.entries(summary.porProblema).sort((a, b) => b[1] - a[1]));

    fs.writeFileSync(OUT, JSON.stringify({ summary, records }, null, 2));

    console.log(`Auditadas: ${summary.total}`);
    console.log(`Niveles: ${JSON.stringify(summary.niveles)}`);
    if (Object.keys(summary.porProblema).length) {
        console.log("Problemas:");
        for (const [k, v] of Object.entries(summary.porProblema)) console.log(`  ${k}: ${v}`);
    }
    console.log(`Reporte: ${OUT}`);
    await mongoose.disconnect();
})().catch(async e => {
    console.error(e.message);
    try { await mongoose.disconnect(); } catch { }
    process.exit(1);
});
