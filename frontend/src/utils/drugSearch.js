import {
    ATC_LEVEL_1,
    ATC_LEVEL_2,
    ATC_LEVEL_3,
    ATC_LEVEL_4,
    getDrugAtcCode
} from './atcTree.js';

/**
 * Normaliza texto para búsqueda: minúsculas y sin tildes/diacríticos.
 * Permite que "macrolidos" encuentre "Macrólidos".
 */
export const normalizeText = (value) =>
    String(value ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();

const tokenize = (query) => normalizeText(query).split(/\s+/).filter(Boolean);

const indexCache = new WeakMap();

/**
 * Construye (y cachea por objeto fármaco) un texto indexable con:
 * nombre, códigos ATC, nombres de categoría de la API y nombres oficiales
 * de los niveles 1-4 de la clasificación ATC de la OMS.
 */
const getDrugIndex = (drug) => {
    const cached = indexCache.get(drug);
    if (cached) return cached;

    const parts = [drug.name];
    const code = getDrugAtcCode(drug);
    const codes = new Set(code ? [code] : []);

    (drug.atc || []).forEach((a) => {
        if (a?.code) codes.add(String(a.code).toUpperCase());
        parts.push(a?.code, a?.categoryCode, a?.categoryName, a?.subcategoryCode, a?.subcategoryName);
    });

    codes.forEach((c) => {
        parts.push(c);
        const levels = [
            [ATC_LEVEL_1, c.substring(0, 1)],
            [ATC_LEVEL_2, c.substring(0, 3)],
            [ATC_LEVEL_3, c.substring(0, 4)],
            [ATC_LEVEL_4, c.substring(0, 5)]
        ];
        levels.forEach(([table, key]) => {
            const node = table[key];
            if (node) parts.push(node.code, node.name);
        });
    });

    const index = {
        base: normalizeText(parts.filter(Boolean).join(' | ')),
        mechanism: normalizeText(drug.actionMechanism)
    };
    indexCache.set(drug, index);
    return index;
};

/**
 * Indica si un fármaco coincide con la consulta (todas las palabras deben aparecer).
 * Busca por nombre, código ATC y categoría (ej. "macrólidos", "J01F", "antibióticos").
 */
export const matchesDrugQuery = (drug, query, { includeMechanism = false } = {}) => {
    const tokens = Array.isArray(query) ? query : tokenize(query);
    if (tokens.length === 0) return true;
    const index = getDrugIndex(drug);
    const haystack = includeMechanism ? `${index.base} | ${index.mechanism}` : index.base;
    return tokens.every((token) => haystack.includes(token));
};

export const filterDrugsByQuery = (drugs, query, options) => {
    const tokens = tokenize(query);
    if (tokens.length === 0) return drugs;
    return drugs.filter((drug) => matchesDrugQuery(drug, tokens, options));
};

/**
 * Busca categorías del árbol ATC (niveles 1-4) por código o nombre.
 */
export const searchAtcCategories = (query, limit = 6) => {
    const tokens = tokenize(query);
    if (tokens.length === 0) return [];

    const results = [];
    [
        [ATC_LEVEL_1, 1],
        [ATC_LEVEL_2, 2],
        [ATC_LEVEL_3, 3],
        [ATC_LEVEL_4, 4]
    ].forEach(([table, level]) => {
        Object.values(table).forEach((node) => {
            const haystack = normalizeText(`${node.code} ${node.name}`);
            if (tokens.every((token) => haystack.includes(token))) {
                results.push({ ...node, level });
            }
        });
    });

    // Más específicos primero (niveles 3-4 suelen ser la "familia" buscada)
    results.sort((a, b) => b.level - a.level || a.code.localeCompare(b.code));
    return results.slice(0, limit);
};
