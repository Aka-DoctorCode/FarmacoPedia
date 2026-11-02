#!/usr/bin/env node
/**
 * Audita manualmente una carpeta de fichas JSON (por ejemplo "auditoria final").
 *
 * Uso:
 *   node tools/audit-folder.js "auditoria final"
 *   node tools/audit-folder.js ./mis_fichas
 *
 * Genera <carpeta>/_auditoria.json y muestra un resumen.
 * Ignora archivos que empiezan por "_".
 */
const fs = require("fs");
const path = require("path");
const { audit } = require("./check-record");

const dir = process.argv[2] || path.join(__dirname, "..", "auditoria final");
if (!fs.existsSync(dir)) {
    console.error("No existe la carpeta:", dir);
    process.exit(2);
}

const files = fs.readdirSync(dir).filter(f => f.endsWith(".json") && !f.startsWith("_"));
const records = [];
for (const f of files) {
    try {
        const doc = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
        records.push({ file: f, ...audit(doc) });
    } catch (e) {
        records.push({ file: f, name: f, level: "error", issues: [{ code: "json_invalido", detail: e.message }], metrics: {} });
    }
}

const niveles = records.reduce((a, r) => (a[r.level] = (a[r.level] || 0) + 1, a), {});
const out = path.join(dir, "_auditoria.json");
fs.writeFileSync(out, JSON.stringify({ generatedAt: new Date().toISOString(), total: records.length, niveles, records }, null, 2));

console.log(`Carpeta: ${dir}`);
console.log(`Fichas: ${records.length}`);
console.log(`Niveles: ${JSON.stringify(niveles)}`);
const malas = records.filter(r => r.level !== "completo");
if (malas.length) {
    console.log("\nNo completas:");
    for (const r of malas.slice(0, 50)) console.log(` - ${r.name || r.file}: ${r.level} (${r.issues.map(i => i.code).join(", ")})`);
}
console.log(`\nReporte: ${out}`);
