/**
 * Catálogo Maestro Oficial ATC de la Organización Mundial de la Salud (OMS)
 * con descripciones canónicas en español para los Niveles 1 al 4,
 * enriquecido para navegación taxonómica clínica (Drill-Down).
 */

export const ATC_LEVEL_1 = {
    A: { code: 'A', name: 'Tracto Alimentario y Metabolismo', desc: 'Aparato digestivo, metabolismo, diabetes, vitaminas y minerales.' },
    B: { code: 'B', name: 'Sangre y Órganos Hematopoyéticos', desc: 'Antitrombóticos, antihemorrágicos, antianémicos y hemoderivados.' },
    C: { code: 'C', name: 'Sistema Cardiovascular', desc: 'Antihipertensivos, diuréticos, betabloqueantes y modificadores de lípidos.' },
    D: { code: 'D', name: 'Dermatológicos', desc: 'Antifúngicos, emolientes, apósitos, antibióticos y corticosteroides tópicos.' },
    G: { code: 'G', name: 'Sistema Genitourinario y Hormonas Sexuales', desc: 'Antiinfecciosos ginecológicos, anticonceptivos, urológicos.' },
    H: { code: 'H', name: 'Preparados Hormonales Sistémicos', desc: 'Corticoides sistémicos, tiroideos y hormonas pancreáticas.' },
    J: { code: 'J', name: 'Antiinfecciosos para Uso Sistémico', desc: 'Antibacterianos (antibióticos), antimicóticos, antivirales y vacunas.' },
    L: { code: 'L', name: 'Antineoplásicos e Inmunomoduladores', desc: 'Quimioterápicos, terapia endocrina e inmunosupresores.' },
    M: { code: 'M', name: 'Sistema Musculoesquelético', desc: 'Antiinflamatorios no esteroideos (AINEs), relajantes musculares y antigotosos.' },
    N: { code: 'N', name: 'Sistema Nervioso', desc: 'Analgésicos, anestésicos, antiepilépticos, psicolépticos y psicoanalépticos.' },
    P: { code: 'P', name: 'Antiparasitarios, Insecticidas y Repelentes', desc: 'Antiprotozoarios, antihelmínticos y ectoparasiticidas.' },
    R: { code: 'R', name: 'Sistema Respiratorio', desc: 'Broncodilatadores, antiasmáticos, antihistamínicos y descongestivos.' },
    S: { code: 'S', name: 'Órganos de los Sentidos', desc: 'Fármacos oftálmicos y preparaciones óticas.' },
    V: { code: 'V', name: 'Varios', desc: 'Antídotos, medios de contraste, radiofármacos y nutrientes.' }
};

export const ATC_LEVEL_2 = {
    A01: { code: 'A01', parent: 'A', name: 'Preparaciones Estomatológicas' },
    A02: { code: 'A02', parent: 'A', name: 'Agentes para el Tratamiento de Alteraciones Causadas por Ácidos (Antiulcerosos)' },
    A03: { code: 'A03', parent: 'A', name: 'Agentes contra Padecimientos Funcionales Gastrointestinales (Espasmolíticos)' },
    A04: { code: 'A04', parent: 'A', name: 'Antieméticos y Antinauseosos' },
    A05: { code: 'A05', parent: 'A', name: 'Terapia Biliar y Hepática' },
    A06: { code: 'A06', parent: 'A', name: 'Fármacos para el Estreñimiento (Laxantes)' },
    A07: { code: 'A07', parent: 'A', name: 'Antidiarreicos, Antiinflamatorios y Antiinfecciosos Intestinales' },
    A08: { code: 'A08', parent: 'A', name: 'Preparados contra la Obesidad' },
    A09: { code: 'A09', parent: 'A', name: 'Digestivos, Incluyendo Enzimas' },
    A10: { code: 'A10', parent: 'A', name: 'Fármacos Usados en Diabetes (Antidiabéticos e Insulinas)' },
    A11: { code: 'A11', parent: 'A', name: 'Vitaminas' },
    A12: { code: 'A12', parent: 'A', name: 'Suplementos Minerales' },
    B01: { code: 'B01', parent: 'B', name: 'Agentes Antitrombóticos (Anticoagulantes y Antiagregantes)' },
    B02: { code: 'B02', parent: 'B', name: 'Antihemorrágicos' },
    B03: { code: 'B03', parent: 'B', name: 'Preparados Antianémicos (Hierro, B12, Ácido Fólico)' },
    B05: { code: 'B05', parent: 'B', name: 'Sustitutos de Sangre y Soluciones para Perfusión' },
    B06: { code: 'B06', parent: 'B', name: 'Otros Agentes Hematológicos' },
    C01: { code: 'C01', parent: 'C', name: 'Terapia Cardíaca (Inotrópicos y Antiarrítmicos)' },
    C02: { code: 'C02', parent: 'C', name: 'Antihipertensivos de Acción Central y Periférica' },
    C03: { code: 'C03', parent: 'C', name: 'Diuréticos' },
    C04: { code: 'C04', parent: 'C', name: 'Vasodilatadores Periféricos' },
    C05: { code: 'C05', parent: 'C', name: 'Vasoprotectores' },
    C07: { code: 'C07', parent: 'C', name: 'Betabloqueantes' },
    C08: { code: 'C08', parent: 'C', name: 'Bloqueantes de Canales de Calcio (Antagonistas del Calcio)' },
    C09: { code: 'C09', parent: 'C', name: 'Agentes que Actúan sobre el Sistema Renina-Angiotensina (IECA / ARA-II)' },
    C10: { code: 'C10', parent: 'C', name: 'Agentes Modificadores de los Lípidos (Hipolipemiantes y Estatinas)' },
    D01: { code: 'D01', parent: 'D', name: 'Antifúngicos para Uso Dermatológico' },
    D02: { code: 'D02', parent: 'D', name: 'Emolientes y Protectores' },
    D03: { code: 'D03', parent: 'D', name: 'Preparados para Heridas y Úlceras' },
    D06: { code: 'D06', parent: 'D', name: 'Antibióticos y Quimioterápicos Tópicos' },
    D07: { code: 'D07', parent: 'D', name: 'Preparados Dermatológicos con Corticosteroides' },
    G01: { code: 'G01', parent: 'G', name: 'Antiinfecciosos y Antisépticos Ginecológicos' },
    G02: { code: 'G02', parent: 'G', name: 'Otros Ginecológicos (Oxitócicos)' },
    G03: { code: 'G03', parent: 'G', name: 'Hormonas Sexuales y Moduladores Genitales' },
    G04: { code: 'G04', parent: 'G', name: 'Urológicos' },
    H01: { code: 'H01', parent: 'H', name: 'Hormonas Hipofisarias e Hipotalámicas' },
    H02: { code: 'H02', parent: 'H', name: 'Corticosteroides para Uso Sistémico' },
    H03: { code: 'H03', parent: 'H', name: 'Terapia Tiroidea' },
    J01: { code: 'J01', parent: 'J', name: 'Antibacterianos para Uso Sistémico (Antibióticos)' },
    J02: { code: 'J02', parent: 'J', name: 'Antimicóticos para Uso Sistémico' },
    J04: { code: 'J04', parent: 'J', name: 'Antimicobacterias (Antituberculosos)' },
    J05: { code: 'J05', parent: 'J', name: 'Antivirales para Uso Sistémico' },
    L01: { code: 'L01', parent: 'L', name: 'Agentes Antineoplásicos' },
    L04: { code: 'L04', parent: 'L', name: 'Inmunosupresores' },
    M01: { code: 'M01', parent: 'M', name: 'Productos Antiinflamatorios y Antirreumáticos (AINEs)' },
    M03: { code: 'M03', parent: 'M', name: 'Relajantes Musculares' },
    M04: { code: 'M04', parent: 'M', name: 'Preparados Antigotosos' },
    N01: { code: 'N01', parent: 'N', name: 'Anestésicos' },
    N02: { code: 'N02', parent: 'N', name: 'Analgésicos y Antipiréticos' },
    N03: { code: 'N03', parent: 'N', name: 'Antiepilépticos' },
    N04: { code: 'N04', parent: 'N', name: 'Antiparkinsonianos' },
    N05: { code: 'N05', parent: 'N', name: 'Psicolépticos (Ansiolíticos, Hipnóticos y Antipsicóticos)' },
    N06: { code: 'N06', parent: 'N', name: 'Psicoanalépticos (Antidepresivos y Psicoestimulantes)' },
    P01: { code: 'P01', parent: 'P', name: 'Antiprotozoarios (Antiparasitarios)' },
    P02: { code: 'P02', parent: 'P', name: 'Antihelmínticos' },
    R01: { code: 'R01', parent: 'R', name: 'Preparados Nasales' },
    R03: { code: 'R03', parent: 'R', name: 'Agentes contra Padecimientos Obstructivos de Vías Respiratorias (Broncodilatadores)' },
    R05: { code: 'R05', parent: 'R', name: 'Preparados para la Tos y el Resfriado' },
    R06: { code: 'R06', parent: 'R', name: 'Antihistamínicos para Uso Sistémico' },
    S01: { code: 'S01', parent: 'S', name: 'Oftalmológicos' },
    V03: { code: 'V03', parent: 'V', name: 'Todos los Demás Productos Terapéuticos (Antídotos)' }
};

export const ATC_LEVEL_3 = {
    // A02
    A02A: { code: 'A02A', parent: 'A02', name: 'Antiácidos' },
    A02B: { code: 'A02B', parent: 'A02', name: 'Agentes contra la Úlcera Péptica y el Reflujo Gastroesofágico' },
    A02X: { code: 'A02X', parent: 'A02', name: 'Otros Fármacos contra la Úlcera Péptica' },
    // A03
    A03F: { code: 'A03F', parent: 'A03', name: 'Propulsivos Gastrointestinales (Procinéticos)' },
    // A10
    A10A: { code: 'A10A', parent: 'A10', name: 'Insulinas y Análogos' },
    A10B: { code: 'A10B', parent: 'A10', name: 'Fármacos Hipoglucemiantes Orales' },
    // B01
    B01A: { code: 'B01A', parent: 'B01', name: 'Agentes Antitrombóticos' },
    // C03
    C03A: { code: 'C03A', parent: 'C03', name: 'Diuréticos de Techo Bajo, Tiazidas' },
    C03C: { code: 'C03C', parent: 'C03', name: 'Diuréticos de Techo Alto (Diuréticos del Asa)' },
    C03D: { code: 'C03D', parent: 'C03', name: 'Ahorradores de Potasio' },
    // C07
    C07A: { code: 'C07A', parent: 'C07', name: 'Agentes Betabloqueantes' },
    // C08
    C08C: { code: 'C08C', parent: 'C08', name: 'Bloqueantes Selectivos de Canales de Calcio con Efectos Vasculares' },
    // C09
    C09A: { code: 'C09A', parent: 'C09', name: 'Inhibidores de la ECA Solos' },
    C09C: { code: 'C09C', parent: 'C09', name: 'Antagonistas de Receptores de Angiotensina II (ARA-II) Solos' },
    // C10
    C10A: { code: 'C10A', parent: 'C10', name: 'Modificadores de Lípidos, Monofármacos' },
    // H02 & H03
    H02A: { code: 'H02A', parent: 'H02', name: 'Corticosteroides para Uso Sistémico, Solos' },
    H03A: { code: 'H03A', parent: 'H03', name: 'Preparados Tiroideos' },
    // J01 Antibacterianos
    J01A: { code: 'J01A', parent: 'J01', name: 'Tetraciclinas' },
    J01B: { code: 'J01B', parent: 'J01', name: 'Anfenicoles' },
    J01C: { code: 'J01C', parent: 'J01', name: 'Antibacterianos Betalactámicos, Penicilinas' },
    J01D: { code: 'J01D', parent: 'J01', name: 'Otros Antibacterianos Betalactámicos (Cefalosporinas, Carbapenémicos)' },
    J01E: { code: 'J01E', parent: 'J01', name: 'Sulfonamidas y Trimetoprima' },
    J01F: { code: 'J01F', parent: 'J01', name: 'Macrólidos, Lincosamidas y Estreptograminas' },
    J01G: { code: 'J01G', parent: 'J01', name: 'Antibacterianos Aminoglucósidos' },
    J01M: { code: 'J01M', parent: 'J01', name: 'Antibacterianos Quinolónicos' },
    J01R: { code: 'J01R', parent: 'J01', name: 'Combinaciones de Antibacterianos' },
    J01X: { code: 'J01X', parent: 'J01', name: 'Otros Antibacterianos (Glucopéptidos, Imidazoles, Polimixinas)' },
    // M01
    M01A: { code: 'M01A', parent: 'M01', name: 'Antiinflamatorios y Antirreumáticos No Esteroideos' },
    // N02
    N02A: { code: 'N02A', parent: 'N02', name: 'Opioides' },
    N02B: { code: 'N02B', parent: 'N02', name: 'Otros Analgésicos y Antipiréticos' },
    N02C: { code: 'N02C', parent: 'N02', name: 'Antimigrañosos' },
    // N03
    N03A: { code: 'N03A', parent: 'N03', name: 'Antiepilépticos' },
    // N05
    N05A: { code: 'N05A', parent: 'N05', name: 'Antipsicóticos' },
    N05B: { code: 'N05B', parent: 'N05', name: 'Ansiolíticos' },
    N05C: { code: 'N05C', parent: 'N05', name: 'Hipnóticos y Sedantes' },
    // N06
    N06A: { code: 'N06A', parent: 'N06', name: 'Antidepresivos' },
    // P01
    P01A: { code: 'P01A', parent: 'P01', name: 'Agentes contra la Amebiasis y otras Enfermedades por Protozoarios' },
    // R03
    R03A: { code: 'R03A', parent: 'R03', name: 'Adrenérgicos Inhalatorios' },
    R03B: { code: 'R03B', parent: 'R03', name: 'Otros Agentes Inhalatorios contra Padecimientos Obstructivos' },
    R03C: { code: 'R03C', parent: 'R03', name: 'Adrenérgicos para Uso Sistémico' },
    // R06
    R06A: { code: 'R06A', parent: 'R06', name: 'Antihistamínicos para Uso Sistémico' }
};

export const ATC_LEVEL_4 = {
    // A02BC
    A02BC: { code: 'A02BC', parent: 'A02B', name: 'Inhibidores de la Bomba de Protones (IBP)' },
    A02BA: { code: 'A02BA', parent: 'A02B', name: 'Antagonistas del Receptor H2' },
    // A03FA
    A03FA: { code: 'A03FA', parent: 'A03F', name: 'Propulsivos (Procinéticos)' },
    // A10AE, A10BA, A10BB
    A10AE: { code: 'A10AE', parent: 'A10A', name: 'Insulinas y Análogos de Acción Prolongada' },
    A10BA: { code: 'A10BA', parent: 'A10B', name: 'Biguanidas' },
    A10BB: { code: 'A10BB', parent: 'A10B', name: 'Sulfonilureas' },
    // B01AC
    B01AC: { code: 'B01AC', parent: 'B01A', name: 'Inhibidores de la Agregación Plaquetaria Excl. Heparina' },
    // C03AA, C03CA
    C03AA: { code: 'C03AA', parent: 'C03A', name: 'Tiazidas Solas' },
    C03CA: { code: 'C03CA', parent: 'C03C', name: 'Sulfonamidas Solas (Furosemida)' },
    // C07AB
    C07AB: { code: 'C07AB', parent: 'C07A', name: 'Agentes Betabloqueantes Selectivos' },
    // C08CA
    C08CA: { code: 'C08CA', parent: 'C08C', name: 'Derivados de Dihidropiridina' },
    // C09AA, C09CA
    C09AA: { code: 'C09AA', parent: 'C09A', name: 'Inhibidores de la ECA Solos' },
    C09CA: { code: 'C09CA', parent: 'C09C', name: 'Antagonistas de la Angiotensina II (ARA-II) Solos' },
    // C10AA
    C10AA: { code: 'C10AA', parent: 'C10A', name: 'Inhibidores de la HMG-CoA Reductasa (Estatinas)' },
    // H02AB & H03AA
    H02AB: { code: 'H02AB', parent: 'H02A', name: 'Glucocorticoides' },
    H03AA: { code: 'H03AA', parent: 'H03A', name: 'Hormonas Tiroideas' },
    // J01AA Tetraciclinas
    J01AA: { code: 'J01AA', parent: 'J01A', name: 'Tetraciclinas' },
    // J01C Penicilinas
    J01CA: { code: 'J01CA', parent: 'J01C', name: 'Penicilinas de Amplio Espectro (Aminopenicilinas)' },
    J01CE: { code: 'J01CE', parent: 'J01C', name: 'Penicilinas Sensibles a Betalactamasa' },
    J01CF: { code: 'J01CF', parent: 'J01C', name: 'Penicilinas Resistentes a Betalactamasa' },
    J01CR: { code: 'J01CR', parent: 'J01C', name: 'Combinaciones de Penicilinas Incl. Inhibidores de Betalactamasa' },
    // J01D Cefalosporinas y otros betalactámicos
    J01DB: { code: 'J01DB', parent: 'J01D', name: 'Cefalosporinas de 1.ª Generación' },
    J01DC: { code: 'J01DC', parent: 'J01D', name: 'Cefalosporinas de 2.ª Generación' },
    J01DD: { code: 'J01DD', parent: 'J01D', name: 'Cefalosporinas de 3.ª Generación' },
    J01DE: { code: 'J01DE', parent: 'J01D', name: 'Cefalosporinas de 4.ª Generación' },
    J01DH: { code: 'J01DH', parent: 'J01D', name: 'Carbapenémicos' },
    J01DF: { code: 'J01DF', parent: 'J01D', name: 'Monobactámicos' },
    J01DI: { code: 'J01DI', parent: 'J01D', name: 'Otras Cefalosporinas y Penemas (5.ª Generación)' },
    // J01FA Macrólidos
    J01FA: { code: 'J01FA', parent: 'J01F', name: 'Macrólidos' },
    // J01MA Quinolonas
    J01MA: { code: 'J01MA', parent: 'J01M', name: 'Fluoroquinolonas' },
    // J01XD Otros Antibacterianos
    J01XD: { code: 'J01XD', parent: 'J01X', name: 'Derivados del Imidazol' },
    // M01AE
    M01AE: { code: 'M01AE', parent: 'M01A', name: 'Derivados del Ácido Propiónico' },
    // N02AX, N02BE, N02BA
    N02AX: { code: 'N02AX', parent: 'N02A', name: 'Otros Opioides' },
    N02BE: { code: 'N02BE', parent: 'N02B', name: 'Anilidas (Paracetamol)' },
    N02BA: { code: 'N02BA', parent: 'N02B', name: 'Ácido Salicílico y Derivados' },
    // N03AE
    N03AE: { code: 'N03AE', parent: 'N03A', name: 'Derivados de Benzodiazepina (Antiepilépticos)' },
    // N05BA
    N05BA: { code: 'N05BA', parent: 'N05B', name: 'Derivados de Benzodiazepina (Ansiolíticos)' },
    // N06AB
    N06AB: { code: 'N06AB', parent: 'N06A', name: 'Inhibidores Selectivos de la Recaptación de Serotonina (ISRS)' },
    // P01AB
    P01AB: { code: 'P01AB', parent: 'P01A', name: 'Derivados del Nitroimidazol' },
    // R03AC
    R03AC: { code: 'R03AC', parent: 'R03A', name: 'Agonistas Selectivos de Receptores Beta-2 Adrenérgicos' },
    // R06AX
    R06AX: { code: 'R06AX', parent: 'R06A', name: 'Otros Antihistamínicos para Uso Sistémico' }
};

/**
 * Normaliza y construye la ruta jerárquica de 5 niveles para un código ATC dado.
 * Ej: 'J01DD04' -> { l1: 'J', l2: 'J01', l3: 'J01D', l4: 'J01DD', l5: 'J01DD04' }
 */
export function parseAtcPath(atcCode) {
    if (!atcCode || typeof atcCode !== 'string') return null;
    const clean = atcCode.trim().toUpperCase();
    if (clean.length < 1) return null;

    const l1Code = clean.charAt(0);
    const l2Code = clean.length >= 3 ? clean.substring(0, 3) : null;
    const l3Code = clean.length >= 4 ? clean.substring(0, 4) : null;
    const l4Code = clean.length >= 5 ? clean.substring(0, 5) : null;
    const l5Code = clean.length >= 7 ? clean.substring(0, 7) : clean;

    return {
        l1: ATC_LEVEL_1[l1Code] || { code: l1Code, name: `Grupo ${l1Code}` },
        l2: l2Code ? (ATC_LEVEL_2[l2Code] || { code: l2Code, parent: l1Code, name: `Subgrupo ${l2Code}` }) : null,
        l3: l3Code ? (ATC_LEVEL_3[l3Code] || { code: l3Code, parent: l2Code, name: `Subgrupo ${l3Code}` }) : null,
        l4: l4Code ? (ATC_LEVEL_4[l4Code] || { code: l4Code, parent: l3Code, name: `Subgrupo ${l4Code}` }) : null,
        l5: l5Code
    };
}

/**
 * Retorna la lista de hijos (Subgrupos) para un nodo dado del árbol ATC.
 * @param {string|null} parentCode - Código del nodo padre (null para Nivel 1).
 * @param {number} currentLevel - Nivel actual (0 para raíz -> retorna Nivel 1, 1 -> Nivel 2, etc.)
 */
export function getAtcChildren(parentCode, currentLevel = 0) {
    if (currentLevel === 0 || !parentCode) {
        return Object.values(ATC_LEVEL_1).map(item => ({
            ...item,
            level: 1,
            hasChildren: true
        }));
    }

    if (currentLevel === 1) {
        return Object.values(ATC_LEVEL_2)
            .filter(item => item.parent === parentCode)
            .map(item => ({
                ...item,
                level: 2,
                hasChildren: true
            }));
    }

    if (currentLevel === 2) {
        return Object.values(ATC_LEVEL_3)
            .filter(item => item.parent === parentCode)
            .map(item => ({
                ...item,
                level: 3,
                hasChildren: true
            }));
    }

    if (currentLevel === 3) {
        return Object.values(ATC_LEVEL_4)
            .filter(item => item.parent === parentCode)
            .map(item => ({
                ...item,
                level: 4,
                hasChildren: false
            }));
    }

    return [];
}

/**
 * Tabla de respaldo canónica de códigos ATC Nivel 5 para todos los fármacos de FarmacoPedia.
 */
export const CANONICAL_DRUG_ATC = {
    acetaminofen: 'N02BE01',
    paracetamol: 'N02BE01',
    amlodipino: 'C08CA01',
    amoxicilina: 'J01CA04',
    ampicilina: 'J01CA01',
    atorvastatina: 'C10AA05',
    azitromicina: 'J01FA10',
    bisoprolol: 'C07AB07',
    ceftriaxona: 'J01DD04',
    ciprofloxacino: 'J01MA02',
    claritromicina: 'J01FA09',
    clonazepam: 'N03AE01',
    dexametasona: 'H02AB02',
    diazepam: 'N05BA01',
    doxiciclina: 'J01AA02',
    enalapril: 'C09AA02',
    fluoxetina: 'N06AB03',
    furosemida: 'C03CA01',
    glibenclamida: 'A10BB01',
    hidroclorotiazida: 'C03AA03',
    ibuprofeno: 'M01AE01',
    'insulina glargina': 'A10AE04',
    levotiroxina: 'H03AA01',
    loratadina: 'R06AX13',
    losartan: 'C09CA01',
    meropenem: 'J01DH02',
    metformina: 'A10BA02',
    metoclopramida: 'A03FA01',
    metronidazol: 'J01XD01',
    omeprazol: 'A02BC01',
    pantoprazol: 'A02BC02',
    prednisona: 'H02AB07',
    salbutamol: 'R03AC02',
    sertralina: 'N06AB06',
    simvastatina: 'C10AA01',
    tramadol: 'N02AX02'
};

/**
 * Obtiene el código ATC Nivel 5 más preciso de un objeto fármaco.
 */
export function getDrugAtcCode(drug) {
    if (!drug) return null;
    if (drug.atc && Array.isArray(drug.atc) && drug.atc.length > 0 && drug.atc[0].code) {
        return drug.atc[0].code.toUpperCase();
    }
    const cleanName = (drug.name || '').toLowerCase().trim();
    return CANONICAL_DRUG_ATC[cleanName] || null;
}

/**
 * Retorna información y metadatos pedagógicos sobre cada nivel ATC.
 */
export function getLevelInfo(level) {
    switch (level) {
        case 1:
            return {
                title: 'Nivel 1 — Grupo Anatómico Principal',
                desc: 'Órgano o sistema fisiológico principal sobre el que actúa el fármaco.',
                codeLabel: 'Letra anatómica (A-V)'
            };
        case 2:
            return {
                title: 'Nivel 2 — Subgrupo Terapéutico Principal',
                desc: 'Efecto terapéutico general y ámbito clínico de aplicación.',
                codeLabel: 'Código terapéutico de 3 caracteres (ej. J01)'
            };
        case 3:
            return {
                title: 'Nivel 3 — Subgrupo Farmacológico / Tipo Químico',
                desc: 'Mecanismo farmacológico y naturaleza química de la familia.',
                codeLabel: 'Código farmacológico de 4 caracteres (ej. J01D)'
            };
        case 4:
            return {
                title: 'Nivel 4 — Subgrupo Químico Específico / Generación',
                desc: 'Subgrupo químico diferenciado o generación clínica (ej. Cefalosporinas 3.ª gen).',
                codeLabel: 'Código químico de 5 caracteres (ej. J01DD)'
            };
        case 5:
            return {
                title: 'Nivel 5 — Principio Activo y Fármaco Individual',
                desc: 'Molécula y principio activo registrado para uso clínico (ej. Ceftriaxona).',
                codeLabel: 'Código ATC completo de 7 caracteres (ej. J01DD04)'
            };
        default:
            return {
                title: 'Catálogo Anatómico Terapéutico Químico (ATC)',
                desc: 'Clasificación oficial de la OMS.',
                codeLabel: 'Código'
            };
    }
}

/**
 * Reconstruye el array de migas de pan para cualquier código ATC dado (ej. "J01DD" o "J01DD04").
 */
export function buildPathFromCode(targetCode) {
    if (!targetCode || typeof targetCode !== 'string') return [];
    const clean = targetCode.trim().toUpperCase();
    if (clean.length === 0) return [];

    const path = [];

    // Nivel 1
    const l1Code = clean.charAt(0);
    const l1 = ATC_LEVEL_1[l1Code] || { code: l1Code, name: `Grupo ${l1Code}` };
    path.push({ code: l1.code, name: l1.name, level: 1 });

    // Nivel 2
    if (clean.length >= 3) {
        const l2Code = clean.substring(0, 3);
        const l2 = ATC_LEVEL_2[l2Code] || { code: l2Code, parent: l1Code, name: `Subgrupo ${l2Code}` };
        path.push({ code: l2.code, name: l2.name, level: 2 });
    }

    // Nivel 3
    if (clean.length >= 4) {
        const l3Code = clean.substring(0, 4);
        const l3 = ATC_LEVEL_3[l3Code] || { code: l3Code, parent: clean.substring(0, 3), name: `Subgrupo ${l3Code}` };
        path.push({ code: l3.code, name: l3.name, level: 3 });
    }

    // Nivel 4
    if (clean.length >= 5) {
        const l4Code = clean.substring(0, 5);
        const l4 = ATC_LEVEL_4[l4Code] || { code: l4Code, parent: clean.substring(0, 4), name: `Subgrupo ${l4Code}` };
        path.push({ code: l4.code, name: l4.name, level: 4 });
    }

    return path;
}

/**
 * Búsqueda predictiva global en el árbol ATC y fármacos registrados.
 */
const normalizeForSearch = (value) =>
    String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

export function searchAtcTree(query, allDrugs = [], { drugsPrefiltered = false } = {}) {
    const q = normalizeForSearch(query);
    if (!q) return [];

    const results = [];

    // 1. Buscar en fármacos registrados
    allDrugs.forEach((drug) => {
        const drugCode = getDrugAtcCode(drug) || '';
        const nameMatch = normalizeForSearch(drug.name).includes(q);
        const codeMatch = normalizeForSearch(drugCode).includes(q);
        const mechanismMatch = normalizeForSearch(drug.actionMechanism).includes(q);

        if (drugsPrefiltered || nameMatch || codeMatch || mechanismMatch) {
            const path = buildPathFromCode(drugCode);
            results.push({
                type: 'drug',
                title: drug.name,
                code: drugCode,
                level: 5,
                drug,
                path,
                matchSubtitle: drug.actionMechanism ? drug.actionMechanism.substring(0, 90) + '...' : ''
            });
        }
    });

    // 2. Buscar en Nivel 4
    Object.values(ATC_LEVEL_4).forEach((item) => {
        if (normalizeForSearch(item.code).includes(q) || normalizeForSearch(item.name).includes(q)) {
            results.push({
                type: 'node',
                title: item.name,
                code: item.code,
                level: 4,
                path: buildPathFromCode(item.code)
            });
        }
    });

    // 3. Buscar en Nivel 3
    Object.values(ATC_LEVEL_3).forEach((item) => {
        if (normalizeForSearch(item.code).includes(q) || normalizeForSearch(item.name).includes(q)) {
            results.push({
                type: 'node',
                title: item.name,
                code: item.code,
                level: 3,
                path: buildPathFromCode(item.code)
            });
        }
    });

    // 4. Buscar en Nivel 2
    Object.values(ATC_LEVEL_2).forEach((item) => {
        if (normalizeForSearch(item.code).includes(q) || normalizeForSearch(item.name).includes(q)) {
            results.push({
                type: 'node',
                title: item.name,
                code: item.code,
                level: 2,
                path: buildPathFromCode(item.code)
            });
        }
    });

    // 5. Buscar en Nivel 1
    Object.values(ATC_LEVEL_1).forEach((item) => {
        if (normalizeForSearch(item.code).includes(q) || normalizeForSearch(item.name).includes(q) || normalizeForSearch(item.desc).includes(q)) {
            results.push({
                type: 'node',
                title: item.name,
                code: item.code,
                level: 1,
                path: buildPathFromCode(item.code)
            });
        }
    });

    // Categorías ATC primero (más específicas antes), luego fármacos
    const nodes = results.filter((r) => r.type === 'node').sort((a, b) => b.level - a.level);
    const drugs = results.filter((r) => r.type === 'drug');
    return [...nodes, ...drugs].slice(0, 40);
}
