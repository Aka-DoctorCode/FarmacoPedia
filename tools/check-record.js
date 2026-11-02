#!/usr/bin/env node
/**
 * Auditoría clínica y estructural de UNA ficha JSON.
 *
 * Criterio actual (acordado): contenido real, no umbrales artificiales.
 * - ATC presente
 * - actionMechanism con contenido, sin prefijos ni HTML
 * - al menos 1 indicación, 1 contraindicación, 1 interacción y 1 reacción adversa
 * - presentaciones con dosage, posología adulto y pediátrica
 * - riesgo completo y al menos 1 securityFlag
 * - sobredosis con contenido
 * - al menos 1 referencia
 *
 * Uso:
 *   node tools/check-record.js "auditoria final/acetaminofen_paracetamol.json"
 *   node tools/check-record.js resto_json/mi_ficha.json
 *
 * Sale con código 0 solo si la ficha es COMPLETA.
 */
const fs = require("fs");

const empty = v => v == null || v === "" || (Array.isArray(v) && !v.length) || (typeof v === "object" && !Array.isArray(v) && !Object.keys(v).length);
const hasHtml = v => /<\/?(?:p|br|div|span|strong|em|ul|ol|li|table|thead|tbody|tr|td|th|h[1-6]|sup|sub|b|i|u|a)\b[^>]*>|&nbsp;?/i.test(String(v || ""));
const GRUPO_PREFIX = /^\s*Grupo\s+(?:Farmaco)?terap[eé]utico\s*:/i;

function audit(doc) {
    const issues = [];
    const add = (code, detail) => issues.push({ code, detail });

    const atc = Array.isArray(doc.atc) ? doc.atc : [];
    if (!atc.length) add("sin_atc", "No tiene clasificación ATC");
    else if (!atc[0].code) add("atc_incompleto", "ATC sin código");

    const mech = typeof doc.actionMechanism === "string" ? doc.actionMechanism.trim() : "";
    if (!mech) add("sin_mecanismo", "actionMechanism vacío");
    else {
        if (GRUPO_PREFIX.test(mech)) add("prefijo_grupo", "actionMechanism empieza con 'Grupo farmacoterapéutico:'");
        if (/C[oó]digo ATC\s*:/i.test(mech.slice(0, 220))) add("prefijo_atc", "actionMechanism contiene 'Código ATC:' al inicio");
        if (hasHtml(mech)) add("html", "HTML residual en actionMechanism");
    }

    const ind = Array.isArray(doc.indications) ? doc.indications.filter(Boolean) : [];
    if (ind.length < 1) add("sin_indicaciones", "No tiene indicaciones");

    const pres = doc.presentations && typeof doc.presentations === "object" ? Object.keys(doc.presentations) : [];
    if (!pres.length) add("sin_presentaciones", "Sin formas farmacéuticas");
    else {
        const dosages = Object.values(doc.presentations).flatMap(g => (g && Array.isArray(g.dosage) ? g.dosage : []));
        if (!dosages.length) add("presentaciones_sin_dosis", "Presentaciones sin dosage");
    }

    const adult = doc.dosageGuidance && doc.dosageGuidance.adult && Object.keys(doc.dosageGuidance.adult).length ? doc.dosageGuidance.adult : null;
    const ped = doc.dosageGuidance && doc.dosageGuidance.pediatric && Object.keys(doc.dosageGuidance.pediatric).length ? doc.dosageGuidance.pediatric : null;
    if (!adult) add("sin_dosificacion_adulto", "Sin dosageGuidance.adult");
    if (!ped) add("sin_dosificacion_pediatrica", "Sin dosageGuidance.pediatric");

    const risk = doc.risk && typeof doc.risk === "object" ? doc.risk : {};
    const riskMissing = [];
    if (empty(risk.pregnancy)) riskMissing.push("pregnancy");
    if (empty(risk.lactation)) riskMissing.push("lactation");
    if (!risk.renal || empty(risk.renal.level) || empty(risk.renal.adjustment)) riskMissing.push("renal");
    if (!risk.hepatic || empty(risk.hepatic.level) || empty(risk.hepatic.adjustment)) riskMissing.push("hepatic");
    if (empty(risk.geriatric)) riskMissing.push("geriatric");
    if (riskMissing.length) add("riesgo_incompleto", `Faltan: ${riskMissing.join(", ")}`);

    const flags = Array.isArray(risk.securityFlags) ? risk.securityFlags.filter(Boolean) : [];
    if (flags.length < 1) add("sin_security_flags", "No tiene securityFlags");

    const contra = Array.isArray(doc.contraindications) ? doc.contraindications.filter(Boolean) : [];
    if (contra.length < 1) add("sin_contraindicaciones", "No tiene contraindicaciones");

    const inter = Array.isArray(doc.interactions) ? doc.interactions.filter(Boolean) : [];
    if (inter.length < 1) add("sin_interacciones", "No tiene interacciones");

    const adv = Array.isArray(doc.adverseReactions) ? doc.adverseReactions.filter(Boolean) : [];
    if (adv.length < 1) add("sin_reacciones", "No tiene reacciones adversas");

    if (!String(doc.overdose || "").trim()) add("sin_sobredosis", "No tiene sobredosis");

    const refs = Array.isArray(doc.references) ? doc.references.filter(Boolean) : [];
    if (refs.length < 1) add("sin_referencias", "No tiene referencias");

    const critical = new Set([
        "sin_atc", "atc_incompleto", "sin_mecanismo", "sin_presentaciones",
        "presentaciones_sin_dosis", "sin_dosificacion_adulto", "riesgo_incompleto"
    ]);
    const level = issues.length === 0 ? "completo" : issues.some(i => critical.has(i.code)) ? "deficiente" : "parcial";

    return {
        name: doc.name,
        atc: atc[0] && atc[0].code,
        level,
        issues,
        metrics: {
            mechLength: mech.length,
            indications: ind.length,
            presentations: pres.length,
            hasPediatric: Boolean(ped),
            securityFlags: flags.length,
            contraindications: contra.length,
            interactions: inter.length,
            adverseReactions: adv.length,
            overdoseLength: String(doc.overdose || "").trim().length,
            references: refs.length
        }
    };
}

module.exports = { audit };

if (require.main === module) {
    const file = process.argv[2];
    if (!file) {
        console.error("Uso: node tools/check-record.js <archivo.json>");
        process.exit(2);
    }
    const doc = JSON.parse(fs.readFileSync(file, "utf8"));
    const r = audit(doc);
    console.log(`${r.name}: ${r.level.toUpperCase()}`);
    for (const i of r.issues) console.log(` - ${i.code}: ${i.detail}`);
    console.log("Métricas:", JSON.stringify(r.metrics));
    process.exit(r.level === "completo" ? 0 : 1);
}
