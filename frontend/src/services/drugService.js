import axios from 'axios';
import { CANONICAL_DRUG_ATC, parseAtcPath } from '../utils/atcTree.js';

class DrugService {
    constructor() {
        this.apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:10000';
        this.fallbackDrugs = this.initializeFallbackDataset();
    }

    async getAllDrugs() {
        try {
            const response = await axios.get(`${this.apiBaseUrl}/drugs`, { timeout: 3000 });
            if (response.data && response.data.success && Array.isArray(response.data.data)) {
                const enriched = response.data.data.map((drug) => {
                    if (!drug.atc || !Array.isArray(drug.atc) || drug.atc.length === 0 || !drug.atc[0].code) {
                        const canon = CANONICAL_DRUG_ATC[(drug.name || '').toLowerCase().trim()];
                        if (canon) {
                            const parsed = parseAtcPath(canon);
                            return {
                                ...drug,
                                atc: [{
                                    code: canon,
                                    categoryCode: parsed.l1.code,
                                    categoryName: parsed.l1.name,
                                    subcategoryCode: parsed.l2 ? parsed.l2.code : canon.substring(0, 3),
                                    subcategoryName: parsed.l2 ? parsed.l2.name : 'Subgrupo Terapéutico'
                                }]
                            };
                        }
                    }
                    return drug;
                });
                return { success: true, data: enriched, isOffline: false };
            }
            throw new Error('Invalid backend response');
        } catch (error) {
            const namesOnly = this.fallbackDrugs.map((drug) => ({
                id: drug.name,
                _id: drug.name,
                name: drug.name,
                categories: drug.categories,
                atc: drug.atc,
                actionMechanism: drug.actionMechanism
            }));
            return { success: true, data: namesOnly, isOffline: true };
        }
    }

    async getAllFamilies() {
        try {
            const response = await axios.get(`${this.apiBaseUrl}/drugs/families`, { timeout: 3000 });
            if (response.data && response.data.success && Array.isArray(response.data.data)) {
                // If remote backend returned legacy flat strings, reject and fallback to structured ATC
                if (response.data.data.length > 0 && typeof response.data.data[0] === 'string') {
                    throw new Error('Backend returned legacy flat string families');
                }
                return { success: true, data: response.data.data, isOffline: false };
            }
            throw new Error('Invalid backend response');
        } catch (error) {
            const categoryMap = new Map();
            this.fallbackDrugs.forEach((drug) => {
                (drug.atc || []).forEach((atc) => {
                    if (!categoryMap.has(atc.categoryCode)) {
                        categoryMap.set(atc.categoryCode, {
                            categoryCode: atc.categoryCode,
                            categoryName: atc.categoryName,
                            subcategories: new Map(),
                            totalDrugs: 0
                        });
                    }
                    const cat = categoryMap.get(atc.categoryCode);
                    if (!cat.subcategories.has(atc.subcategoryCode)) {
                        cat.subcategories.set(atc.subcategoryCode, {
                            subcategoryCode: atc.subcategoryCode,
                            subcategoryName: atc.subcategoryName,
                            count: 0,
                            drugs: []
                        });
                    }
                    const sub = cat.subcategories.get(atc.subcategoryCode);
                    if (!sub.drugs.some((d) => d.name === drug.name)) {
                        sub.drugs.push({ name: drug.name, atcCode: atc.code });
                        sub.count++;
                        cat.totalDrugs++;
                    }
                });
            });
            const tree = Array.from(categoryMap.values()).map((c) => ({
                ...c,
                subcategories: Array.from(c.subcategories.values()).sort((a, b) => a.subcategoryCode.localeCompare(b.subcategoryCode))
            })).sort((a, b) => a.categoryCode.localeCompare(b.categoryCode));
            return { success: true, data: tree, isOffline: true };
        }
    }

    async getDrugsByAtcSubcategory(subcategoryCode) {
        try {
            const response = await axios.get(`${this.apiBaseUrl}/drugs/atc/subcategories/${encodeURIComponent(subcategoryCode)}`, { timeout: 3000 });
            if (response.data && response.data.success && Array.isArray(response.data.data)) {
                return { success: true, data: response.data.data, isOffline: false };
            }
            throw new Error('Invalid backend response');
        } catch (error) {
            if (error.response?.status === 404) {
                return { success: true, data: [], isOffline: false };
            }
            const codeUpper = (subcategoryCode || '').toUpperCase();
            const matchedDrugs = this.fallbackDrugs
                .filter((drug) => (drug.atc || []).some((a) => a.subcategoryCode?.toUpperCase() === codeUpper))
                .map((drug) => ({
                    id: drug.name,
                    _id: drug.name,
                    name: drug.name,
                    categories: drug.categories,
                    atc: drug.atc,
                    actionMechanism: drug.actionMechanism
                }));
            return { success: true, data: matchedDrugs, isOffline: true };
        }
    }

    async getDrugsByCategory(categoryName) {
        try {
            const response = await axios.get(`${this.apiBaseUrl}/drugs/categories/${encodeURIComponent(categoryName)}`, { timeout: 3000 });
            if (response.data && response.data.success && Array.isArray(response.data.data)) {
                return { success: true, data: response.data.data, isOffline: false };
            }
            throw new Error('Invalid backend response');
        } catch (error) {
            const matchedDrugs = this.fallbackDrugs
                .filter((drug) => (drug.atc || []).some((a) => 
                    a.subcategoryName?.toLowerCase() === categoryName.toLowerCase() ||
                    a.categoryName?.toLowerCase() === categoryName.toLowerCase() ||
                    a.subcategoryCode?.toLowerCase() === categoryName.toLowerCase() ||
                    a.categoryCode?.toLowerCase() === categoryName.toLowerCase()
                ))
                .map((drug) => ({
                    id: drug.name,
                    _id: drug.name,
                    name: drug.name,
                    atc: drug.atc,
                    actionMechanism: drug.actionMechanism
                }));
            return { success: true, data: matchedDrugs, isOffline: true };
        }
    }

    async getDrugByName(drugName) {
        try {
            const response = await axios.get(`${this.apiBaseUrl}/drugs/${encodeURIComponent(drugName.toLowerCase())}`, { timeout: 3000 });
            if (response.data && response.data.success && response.data.data) {
                return { success: true, data: response.data.data, isOffline: false };
            }
            throw new Error('Invalid backend response');
        } catch (error) {
            const matchedDrug = this.fallbackDrugs.find(
                (drug) => drug.name.toLowerCase() === drugName.toLowerCase()
            );
            if (matchedDrug) {
                return { success: true, data: matchedDrug, isOffline: true };
            }
            return { success: false, error: 'Drug not found', isOffline: true };
        }
    }

    async reportMissingDrug(drugName) {
        try {
            const response = await axios.post(`${this.apiBaseUrl}/pending-drugs`, { name: drugName }, { timeout: 3000 });
            return response.data;
        } catch (error) {
            console.warn('Could not report missing drug to backend:', error.message);
            return { success: false };
        }
    }

    async getPendingDrugs(limit = 10) {
        try {
            const response = await axios.get(`${this.apiBaseUrl}/pending-drugs?limit=${limit}`, { timeout: 3000 });
            return response.data;
        } catch (error) {
            return { success: false, data: [] };
        }
    }

    searchFallback(queryText) {
        const normalized = queryText.toLowerCase().trim();
        if (!normalized) return [];

        return this.fallbackDrugs.filter((drug) => {
            const nameMatch = drug.name.toLowerCase().includes(normalized);
            const atcMatch = (drug.atc || []).some((a) => 
                a.code?.toLowerCase().includes(normalized) ||
                a.subcategoryCode?.toLowerCase().includes(normalized) ||
                a.subcategoryName?.toLowerCase().includes(normalized) ||
                a.categoryName?.toLowerCase().includes(normalized)
            );
            const mechanismMatch = drug.actionMechanism ? drug.actionMechanism.toLowerCase().includes(normalized) : false;
            const indicationMatch = drug.indications ? drug.indications.some((ind) => ind.toLowerCase().includes(normalized)) : false;
            return nameMatch || atcMatch || mechanismMatch || indicationMatch;
        });
    }

    initializeFallbackDataset() {
        return [
            {
                name: 'paracetamol',
                categories: ['analgesicos', 'antipireticos'],
                atc: [
                    {
                        code: 'N02BE01',
                        categoryCode: 'N',
                        categoryName: 'Sistema Nervioso',
                        subcategoryCode: 'N02',
                        subcategoryName: 'Analgésicos'
                    }
                ],
                actionMechanism: 'Inhibicion de la sintesis de prostaglandinas en el sistema nervioso central y bloqueo del impulso doloroso periférico.',
                indications: ['Tratamiento sintomatico del dolor leve a moderado', 'Fiebre de origen diverso'],
                presentations: {
                    'Comprimidos 500mg': {
                        dosage: [
                            { amount: '500-1000', unit: 'mg', route: ['Oral'], useIn: 'Adultos' },
                            { amount: '10-15', unit: 'mg/kg', route: ['Oral'], useIn: 'Niños' }
                        ]
                    },
                    'Solucion Gotas 100mg/ml': {
                        dosage: [
                            { amount: '10-15', unit: 'mg/kg', route: ['Oral'], useIn: 'Niños' }
                        ]
                    },
                    'Solucion Inyectable 10mg/ml': {
                        dosage: [
                            { amount: '1000', unit: 'mg', route: ['Intravenosa'], useIn: 'Adultos' },
                            { amount: '15', unit: 'mg/kg', route: ['Intravenosa'], useIn: 'Niños' }
                        ]
                    }
                },
                dosageGuidance: {
                    adult: {
                        'Oral': {
                            guidelines: ['500 a 1000 mg cada 4 a 6 horas segun necesidad.'],
                            maxDose: ['4000 mg al dia (3000 mg/dia en uso cronico).']
                        },
                        'Intravenosa': {
                            guidelines: ['Infusion lenta en al menos 15 minutos.'],
                            maxDose: ['4000 mg al dia.']
                        }
                    },
                    pediatric: {
                        'Oral': {
                            guidelines: ['10 a 15 mg/kg cada 4 a 6 horas.'],
                            maxDose: ['60 mg/kg/dia sin superar 2000 mg/dia.']
                        }
                    }
                },
                risk: {
                    pregnancy: 'Categoria B - Seguro en dosis terapeuticas',
                    lactation: 'Compatible con la lactancia materna',
                    renal: {
                        level: 'Ajuste en ClCr < 30 ml/min',
                        adjustment: 'Espaciar intervalo de administracion a 6-8 horas.'
                    },
                    hepatic: {
                        level: 'Riesgo alto en insuficiencia hepatica severa',
                        adjustment: 'Reducir dosis diaria maxima a 2000 mg o contraindicar.'
                    },
                    geriatric: 'Vigilar desnutricion y funcion hepatica basal',
                    securityFlags: ['Riesgo de hepatotoxicidad por sobredosis aguda']
                },
                contraindications: ['Hipersensibilidad al paracetamol', 'Insuficiencia hepatocelular grave', 'Hepatitis virica activa'],
                interactions: ['Alcohol incrementa riesgo de toxicidad hepatica', 'Anticoagulantes orales (warfarina) con uso prolongado'],
                adverseReactions: ['Elevacion asintomatica de transaminasas', 'Reacciones cutaneas raras', 'Trombocitopenia infrecuente'],
                overdose: 'Administrar N-acetilcisteina dentro de las primeras 8-10 horas. Medir niveles sericos mediante normograma de Rumack-Matthew.',
                references: [
                    'Agencia Española de Medicamentos y Productos Sanitarios. (2023). Ficha técnica Paracetamol 500 mg comprimidos. Centro de Información Online de Medicamentos (CIMA). https://cima.aemps.es',
                    'Brunton, L. L., Hilal-Dandan, R., & Knollmann, B. C. (2018). Goodman & Gilman: Las bases farmacológicas de la terapéutica (13.ª ed.). McGraw-Hill.'
                ]
            },
            {
                name: 'ibuprofeno',
                categories: ['antiinflamatorios no esteroideos', 'analgesicos', 'antipireticos'],
                atc: [
                    {
                        code: 'M01AE01',
                        categoryCode: 'M',
                        categoryName: 'Sistema Musculoesquelético',
                        subcategoryCode: 'M01',
                        subcategoryName: 'Productos Antiinflamatorios y Antirreumáticos'
                    }
                ],
                actionMechanism: 'Inhibicion no selectiva de las isoformas COX-1 y COX-2 de la ciclooxigenasa, reduciendo la formacion de prostaglandinas.',
                indications: ['Dolor inflamatorio articular y muscular', 'Dismenorrea primaria', 'Cefalea tensional', 'Cuadros febriles'],
                presentations: {
                    'Capsulas Blandas 400mg': {
                        dosage: [
                            { amount: '400-600', unit: 'mg', route: ['Oral'], useIn: 'Adultos' }
                        ]
                    },
                    'Suspension Oral 100mg/5ml': {
                        dosage: [
                            { amount: '5-10', unit: 'mg/kg', route: ['Oral'], useIn: 'Niños' }
                        ]
                    }
                },
                dosageGuidance: {
                    adult: {
                        'Oral': {
                            guidelines: ['400 a 600 mg cada 6 a 8 horas con alimentos.'],
                            maxDose: ['2400 mg al dia en adultos.']
                        }
                    },
                    pediatric: {
                        'Oral': {
                            guidelines: ['5 a 10 mg/kg cada 6 a 8 horas.'],
                            maxDose: ['40 mg/kg al dia.']
                        }
                    }
                },
                risk: {
                    pregnancy: 'Categoria D en tercer trimestre (cierre de ductus arterioso)',
                    lactation: 'Compatible en dosis moderadas',
                    renal: {
                        level: 'Riesgo de nefropatia por AINEs',
                        adjustment: 'Evitar en insuficiencia renal severa (ClCr < 30 ml/min).'
                    },
                    hepatic: {
                        level: 'Precaucion en cirrosis',
                        adjustment: 'Usar dosis minima efectiva.'
                    },
                    geriatric: 'Mayor riesgo de hemorragia digestiva alta',
                    securityFlags: ['Riesgo cardiovascular en dosis elevadas y uso prolongado', 'Gastrolesividad']
                },
                contraindications: ['Ulcera peptica activa', 'Antecedente de hemorragia digestiva', 'Tercer trimestre de gestacion'],
                interactions: ['IECA y ARA-II disminuyen efecto antihipertensivo', 'Aspirina y anticoagulantes potencian riesgo hemorragico'],
                adverseReactions: ['Dispepsia', 'Gastritis erosiva', 'Retencion hidrica', 'Hipertension arterial'],
                overdose: 'Lavado gastrico y carbon activado precoz. Tratamiento de soporte hemodinamico y correccion hidroelectrolitica.',
                references: [
                    'Agencia Española de Medicamentos y Productos Sanitarios. (2023). Ficha técnica Ibuprofeno 400 mg cápsulas blandas. CIMA. https://cima.aemps.es',
                    'Rainsford, K. D. (2015). Ibuprofen: Pharmacology, therapeutics and side effects. Springer International Publishing.'
                ]
            },
            {
                name: 'amoxicilina',
                categories: ['antibioticos', 'betalactamicos', 'penicilinas'],
                atc: [
                    {
                        code: 'J01CA04',
                        categoryCode: 'J',
                        categoryName: 'Antiinfecciosos para Uso Sistémico',
                        subcategoryCode: 'J01',
                        subcategoryName: 'Antibacterianos para Uso Sistémico'
                    }
                ],
                actionMechanism: 'Inhibe la sintesis de la pared celular bacteriana al unirse a las proteinas fijadoras de penicilina (PBP).',
                indications: ['Faringoamigdalitis estreptococica', 'Otitis media aguda', 'Neumonia adquirida en comunidad', 'Infecciones urinarias no complicadas'],
                presentations: {
                    'Capsulas 500mg': {
                        dosage: [
                            { amount: '500-1000', unit: 'mg', route: ['Oral'], useIn: 'Adultos' }
                        ]
                    },
                    'Suspension 250mg/5ml': {
                        dosage: [
                            { amount: '40-90', unit: 'mg/kg/dia', route: ['Oral'], useIn: 'Niños' }
                        ]
                    }
                },
                dosageGuidance: {
                    adult: {
                        'Oral': {
                            guidelines: ['500 mg cada 8 horas o 875 mg cada 12 horas.'],
                            maxDose: ['3000 mg al dia.']
                        }
                    },
                    pediatric: {
                        'Oral': {
                            guidelines: ['50 a 90 mg/kg/dia dividido cada 8 o 12 horas.'],
                            maxDose: ['90 mg/kg/dia maximo 3000 mg/dia.']
                        }
                    }
                },
                risk: {
                    pregnancy: 'Categoria B - Amplia seguridad demostrada',
                    lactation: 'Compatible con la lactancia',
                    renal: {
                        level: 'Ajuste requerido en insuficiencia moderada a severa',
                        adjustment: 'ClCr 10-30: 500 mg c/12h. ClCr < 10: 500 mg c/24h.'
                    },
                    hepatic: {
                        level: 'Sin ajuste necesario de dosis',
                        adjustment: 'Monitoreo en tratamiento prolongado.'
                    },
                    geriatric: 'Evaluar funcion renal basal',
                    securityFlags: ['Alerta por anafilaxia en pacientes con alergia a betalactamicos']
                },
                contraindications: ['Alergia confirmada a penicilinas o betalactamicos', 'Mononucleosis infecciosa (riesgo de exantema)'],
                interactions: ['Metotrexato (disminuye eliminacion renal)', 'Anticonceptivos orales (potencial reduccion de eficacia)'],
                adverseReactions: ['Diarrea asociada a antibioticos', 'Exantema maculopapular', 'Nauseas', 'Candidiasis mucocutanea'],
                overdose: 'Medidas de sosten e hidratacion adecuada. Hemodializable en casos graves.',
                references: [
                    'Agencia Española de Medicamentos y Productos Sanitarios. (2022). Ficha técnica Amoxicilina 500 mg cápsulas. CIMA. https://cima.aemps.es',
                    'World Health Organization. (2023). The selection and use of essential medicines: Report of the WHO Expert Committee on Selection and Use of Essential Medicines. WHO Technical Report Series.'
                ]
            },
            {
                name: 'omeprazol',
                categories: ['inhibidores de bomba de protones', 'antiulcerosos'],
                atc: [
                    {
                        code: 'A02BC01',
                        categoryCode: 'A',
                        categoryName: 'Tracto Alimentario y Metabolismo',
                        subcategoryCode: 'A02',
                        subcategoryName: 'Agentes para el Tratamiento de Alteraciones Causadas por Ácidos'
                    }
                ],
                actionMechanism: 'Bloqueo irreversible de la enzima H+/K+ ATPasa en la celula parietal gastrica suprime la secrecion acida basal y estimulada.',
                indications: ['Enfermedad por reflujo gastroesofagico', 'Ulcera gastrica y duodenal', 'Erradicacion de Helicobacter pylori', 'Profilaxis de gastrolesion por AINEs'],
                presentations: {
                    'Capsulas Gastroresistentes 20mg': {
                        dosage: [
                            { amount: '20-40', unit: 'mg', route: ['Oral'], useIn: 'Adultos' }
                        ]
                    },
                    'Frasco Ampolla 40mg': {
                        dosage: [
                            { amount: '40', unit: 'mg', route: ['Intravenosa'], useIn: 'Adultos' }
                        ]
                    }
                },
                dosageGuidance: {
                    adult: {
                        'Oral': {
                            guidelines: ['20 mg una vez al dia 30 minutos antes del desayuno.'],
                            maxDose: ['80 mg al dia en Sindrome de Zollinger-Ellison.']
                        }
                    },
                    pediatric: {
                        'Oral': {
                            guidelines: ['0.7 a 1.4 mg/kg/dia en ERGE severo.'],
                            maxDose: ['20 mg al dia.']
                        }
                    }
                },
                risk: {
                    pregnancy: 'Categoria C - Usar si beneficio supera riesgo',
                    lactation: 'Compatible con monitoreo',
                    renal: {
                        level: 'Sin ajuste requerido',
                        adjustment: 'Vigilar riesgo de nefritis intersticial aguda.'
                    },
                    hepatic: {
                        level: 'Ajuste en cirrosis severa',
                        adjustment: 'Dosis maxima recomendada de 20 mg/dia.'
                    },
                    geriatric: 'Riesgo de deficit de vitamina B12 y fracturas oseas por uso cronico',
                    securityFlags: ['Uso cronico asociado a hipomagnesemia e infecciones por Clostridioides difficile']
                },
                contraindications: ['Hipersensibilidad a benzimidazoles', 'Coadministracion con nelfinavir o rilpivirina'],
                interactions: ['Clopidogrel (disminuye activacion de profarmaco)', 'Ketoconazol (disminuye absorcion)', 'Digoxina (aumenta niveles)'],
                adverseReactions: ['Cefalea', 'Flatulencia', 'Dolor abdominal', 'Estrenimiento o diarrea transitoria'],
                overdose: 'Tratamiento sintomatico. No se conocen efectos graves por sobredosis puntual.',
                references: [
                    'Agencia Española de Medicamentos y Productos Sanitarios. (2023). Ficha técnica Omeprazol 20 mg cápsulas duras gastrorresistentes. CIMA. https://cima.aemps.es',
                    'Strand, D. S., Kim, D., & Peura, D. A. (2017). 25 years of proton pump inhibitors: A comprehensive review. Gut and Liver, 11(1), 27-37.'
                ]
            },
            {
                name: 'ceftriaxona',
                categories: ['antibacterianos', 'cefalosporinas', 'betalactamicos'],
                atc: [{
                    code: 'J01DD04',
                    categoryCode: 'J',
                    categoryName: 'Antiinfecciosos para Uso Sistémico',
                    subcategoryCode: 'J01',
                    subcategoryName: 'Antibacterianos para Uso Sistémico'
                }],
                actionMechanism: 'Cefalosporina de 3.ª generación bactericida. Inhibe la síntesis de la pared celular bacteriana por unión irreversible a las proteínas fijadoras de penicilina (PBP 1a, 1b, 2 y 3). Resistente a gran variedad de betalactamasas.',
                indications: ['Meningitis bacteriana', 'Sepsis y bacteriemia', 'Neumonía adquirida en la comunidad', 'Infección gonocócica', 'Profilaxis quirúrgica'],
                presentations: {
                    'Vial 1g Polvo para Solución Inyectable': {
                        dosage: [
                            { amount: '1-2', unit: 'g/día', route: ['Intravenosa', 'Intramuscular'], useIn: 'Adultos' },
                            { amount: '50-80', unit: 'mg/kg/día', route: ['Intravenosa'], useIn: 'Niños' }
                        ]
                    }
                },
                dosageGuidance: {
                    adult: {
                        'Intravenosa': {
                            guidelines: ['1 a 2 g cada 24 horas administrados en infusión lenta en 30 minutos. Hasta 4 g/día en meningitis.'],
                            maxDose: ['4 g al día.']
                        }
                    },
                    pediatric: {
                        'Intravenosa': {
                            guidelines: ['50 a 80 mg/kg cada 24 horas. En meningitis 100 mg/kg/día (máx 4 g).'],
                            maxDose: ['4 g al día o 100 mg/kg/día.']
                        }
                    }
                },
                risk: {
                    pregnancy: 'Categoría B - Seguro cuando esté indicado',
                    lactation: 'Compatible en dosis terapéuticas',
                    renal: { level: 'Sin ajuste hasta ClCr < 10 ml/min', adjustment: 'Máximo 2 g/día en insuficiencia renal grave combinada con hepática.' },
                    hepatic: { level: 'Sin ajuste necesario si función renal conservada', adjustment: 'Monitoreo ecográfico en tratamientos prolongados (riesgo de pseudolitiasis biliar).' },
                    geriatric: 'No requiere ajuste con función renal normal para la edad',
                    securityFlags: ['Contraindicado en neonatos hiperbilirrubinémicos', 'Incompatible con soluciones que contengan calcio (ceftriaxona-calcio precipitados)']
                },
                contraindications: ['Hipersensibilidad severa a cefalosporinas o betalactámicos', 'Neonatos con ictericia o hipoalbuminemia', 'Administración simultánea con calcio IV'],
                interactions: ['Calcio intravenoso (formación de precipitados letales)', 'Anticoagulantes orales (potenciación de hipoprotrombinemia)'],
                adverseReactions: ['Diarrea por disbiosis', 'Eosinofilia', 'Leucopenia transitoria', 'Pseudolitiasis biliar reversible'],
                overdose: 'Tratamiento de soporte sintomático. No dializable mediante hemodiálisis.',
                references: ['CIMA AEMPS (2023). Ficha técnica Ceftriaxona 1g.', 'The Sanford Guide to Antimicrobial Therapy (2024).']
            },
            {
                name: 'meropenem',
                categories: ['antibacterianos', 'carbapenem', 'betalactamicos'],
                atc: [{
                    code: 'J01DH02',
                    categoryCode: 'J',
                    categoryName: 'Antiinfecciosos para Uso Sistémico',
                    subcategoryCode: 'J01',
                    subcategoryName: 'Antibacterianos para Uso Sistémico'
                }],
                actionMechanism: 'Carbapenémico de ultra amplio espectro bactericida. Inhibe la síntesis de la pared bacteriana fijándose con alta afinidad a PBP-2 y PBP-3. Estable ante casi todas las betalactamasas (incluidas BLEE y AmpC).',
                indications: ['Infecciones nosocomiales graves', 'Sepsis de foco intraabdominal', 'Neutropenia febril', 'Meningitis bacteriana por bacilos gramnegativos'],
                presentations: {
                    'Vial 1g': {
                        dosage: [{ amount: '1000', unit: 'mg', route: ['Intravenosa'], useIn: 'Adultos' }]
                    }
                },
                dosageGuidance: {
                    adult: { 'Intravenosa': { guidelines: ['500 a 1000 mg cada 8 horas en infusión de 15 a 30 minutos o infusión extendida de 3 horas.'], maxDose: ['6 g al día en meningitis.'] } }
                },
                risk: {
                    pregnancy: 'Categoría B',
                    lactation: 'Compatible con precaución',
                    renal: { level: 'Ajuste obligatorio por eliminación renal', adjustment: 'ClCr 26-50: 1g c/12h; ClCr 10-25: 500mg c/12h; ClCr < 10: 500mg c/24h.' },
                    hepatic: { level: 'Sin ajuste', adjustment: 'Monitoreo enzimático en terapias prolongadas.' },
                    geriatric: 'Ajustar según aclaramiento de creatinina',
                    securityFlags: ['Reduce drásticamente los niveles de ácido valproico provocando crisis convulsivas']
                },
                contraindications: ['Hipersensibilidad grave a carbapenémicos'],
                interactions: ['Ácido valproico (disminución de niveles hasta 60-100%, contraindicación de uso concomitante)', 'Probenecid'],
                adverseReactions: ['Diarrea', 'Trombocitosis', 'Elevación transitoria de transaminasas', 'Cefalea', 'Convulsiones en insuficiencia renal no ajustada'],
                overdose: 'Hemodiálisis remueve activamente el meropenem.',
                references: ['CIMA AEMPS (2023). Ficha técnica Meropenem 1g.']
            },
            {
                name: 'ciprofloxacino',
                categories: ['antibacterianos', 'quinolonas', 'fluoroquinolonas'],
                atc: [{
                    code: 'J01MA02',
                    categoryCode: 'J',
                    categoryName: 'Antiinfecciosos para Uso Sistémico',
                    subcategoryCode: 'J01',
                    subcategoryName: 'Antibacterianos para Uso Sistémico'
                }],
                actionMechanism: 'Fluoroquinolona bactericida de amplio espectro. Inhibe la topoisomerasa II (ADN-girasa) y la topoisomerasa IV bacterianas, bloqueando la replicación y transcripción del ADN.',
                indications: ['Infecciones del tracto urinario complicadas', 'Pielonefritis aguda', 'Gastroenteritis bacteriana grave', 'Infecciones osteoarticulares'],
                presentations: {
                    'Comprimidos 500mg': {
                        dosage: [{ amount: '500-750', unit: 'mg', route: ['Oral'], useIn: 'Adultos' }]
                    }
                },
                dosageGuidance: {
                    adult: { 'Oral': { guidelines: ['500 a 750 mg cada 12 horas en ayunas o con alimentos (sin lácteos).'], maxDose: ['1500 mg al día.'] } }
                },
                risk: {
                    pregnancy: 'Categoría C - Evitar salvo riesgo vital',
                    lactation: 'Evitar o suspender lactancia materna',
                    renal: { level: 'Ajuste en ClCr < 60 ml/min', adjustment: 'ClCr 30-60: 250-500 mg c/12h; ClCr < 30: 250-500 mg c/24h.' },
                    hepatic: { level: 'Sin ajuste', adjustment: 'Monitorear función.' },
                    geriatric: 'Vigilar riesgo aumentado de rotura tendinosa y confusión',
                    securityFlags: ['Alerta de seguridad FDA/EMA por tendinitis y rotura del tendón de Aquiles', 'Prolongación del intervalo QT']
                },
                contraindications: ['Hipersensibilidad a quinolonas', 'Uso concomitante con tizanidina', 'Antecedente de patología tendinosa por quinolonas'],
                interactions: ['Antiácidos con aluminio/magnesio/hierro (quelación masiva)', 'Teofilina (toxicidad grave por inhibición CYP1A2)', 'Fármacos que prolongan el QT'],
                adverseReactions: ['Náuseas', 'Diarrea', 'Tendinopatía aquilea', 'Fototoxicidad', 'Insomnio y mareo'],
                overdose: 'Lavado gástrico, antiácidos con magnesio para quelar, monitoreo ECG.',
                references: ['CIMA AEMPS (2023). Ficha técnica Ciprofloxacino 500 mg.']
            },
            {
                name: 'azitromicina',
                categories: ['antibacterianos', 'macrolidos'],
                atc: [{
                    code: 'J01FA10',
                    categoryCode: 'J',
                    categoryName: 'Antiinfecciosos para Uso Sistémico',
                    subcategoryCode: 'J01',
                    subcategoryName: 'Antibacterianos para Uso Sistémico'
                }],
                actionMechanism: 'Macrólido azalida bacteriostático. Se une reversiblemente a la subunidad 50S del ribosoma bacteriano inhibiendo la síntesis proteica por translocación de péptidos.',
                indications: ['Infecciones respiratorias agudas', 'Neumonía atípica por Mycoplasma o Chlamydia', 'Uretritis por Chlamydia trachomatis', 'Faringitis estreptocócica en alérgicos a penicilina'],
                presentations: {
                    'Comprimidos 500mg': {
                        dosage: [{ amount: '500', unit: 'mg/día', route: ['Oral'], useIn: 'Adultos' }]
                    }
                },
                dosageGuidance: {
                    adult: { 'Oral': { guidelines: ['500 mg cada 24 horas durante 3 días consecutivos o 500 mg día 1 seguido de 250 mg días 2 al 5.'], maxDose: ['500 mg al día (dosis única 1 g en uretritis).'] } }
                },
                risk: {
                    pregnancy: 'Categoría B - Uso seguro cuando está indicado',
                    lactation: 'Compatible con precaución',
                    renal: { level: 'Sin ajuste en ClCr > 10 ml/min', adjustment: 'Precaución en ClCr < 10 ml/min.' },
                    hepatic: { level: 'Metabolismo y excreción biliar mayoritarios', adjustment: 'Contraindicado en insuficiencia hepática grave.' },
                    geriatric: 'Vigilar riesgo proarrítmico',
                    securityFlags: ['Alerta por prolongación del intervalo QT y torsade de pointes en pacientes con cardiopatía']
                },
                contraindications: ['Hipersensibilidad a macrólidos o ketólidos', 'Insuficiencia hepática grave'],
                interactions: ['Antiácidos reducen concentración pico', 'Fármacos proarrítmicos (amiodarona, sotalol)', 'Digoxina (aumento de biodisponibilidad)'],
                adverseReactions: ['Diarrea y dolor abdominal por motilidad gastrointestinal', 'Náuseas', 'Cefalea', 'Prolongación QT'],
                overdose: 'Soporte hemodinámico y lavado gástrico.',
                references: ['CIMA AEMPS (2023). Ficha técnica Azitromicina 500 mg.']
            },
            {
                name: 'ampicilina',
                categories: ['antibacterianos', 'penicilinas', 'betalactamicos'],
                atc: [{
                    code: 'J01CA01',
                    categoryCode: 'J',
                    categoryName: 'Antiinfecciosos para Uso Sistémico',
                    subcategoryCode: 'J01',
                    subcategoryName: 'Antibacterianos para Uso Sistémico'
                }],
                actionMechanism: 'Aminopenicilina bactericida de amplio espectro. Inhibe la transpeptidación bacteriana uniéndose a las PBP 1 y 3 en la síntesis de la pared celular.',
                indications: ['Listeriosis invasiva (meningitis por Listeria monocytogenes)', 'Infecciones enterocócicas', 'Infecciones urinarias por Enterococcus faecalis', 'Profilaxis de estreptococo grupo B intraparto'],
                presentations: {
                    'Vial Inyectable 1g': {
                        dosage: [{ amount: '1000-2000', unit: 'mg', route: ['Intravenosa'], useIn: 'Adultos' }]
                    }
                },
                dosageGuidance: {
                    adult: { 'Intravenosa': { guidelines: ['1 a 2 g cada 4 a 6 horas según severidad.'], maxDose: ['12 g al día en meningitis.'] } }
                },
                risk: {
                    pregnancy: 'Categoría B',
                    lactation: 'Compatible',
                    renal: { level: 'Ajuste requerido por eliminación renal', adjustment: 'ClCr 10-50: c/6-12h; ClCr < 10: c/12-24h.' },
                    hepatic: { level: 'Sin ajuste', adjustment: 'Monitoreo básico.' },
                    geriatric: 'Evaluar función renal basal',
                    securityFlags: ['Anafilaxia en alérgicos a betalactámicos']
                },
                contraindications: ['Alergia a penicilinas', 'Mononucleosis infecciosa'],
                interactions: ['Alopurinol aumenta drásticamente riesgo de erupción cutánea', 'Metotrexato'],
                adverseReactions: ['Erupción maculopapular', 'Diarrea', 'Urticaria', 'Fiebre medicamentosa'],
                overdose: 'Hidratación y hemodiálisis si es preciso.',
                references: ['CIMA AEMPS (2023). Ficha técnica Ampicilina 1g.']
            },
            {
                name: 'salbutamol',
                categories: ['broncodilatadores', 'adrenergicos'],
                atc: [{
                    code: 'R03AC02',
                    categoryCode: 'R',
                    categoryName: 'Sistema Respiratorio',
                    subcategoryCode: 'R03',
                    subcategoryName: 'Agentes contra Padecimientos Obstructivos de Vías Respiratorias'
                }],
                actionMechanism: 'Agonista selectivo de receptores beta-2 adrenérgicos del músculo liso bronquial. Estimula la adenilil ciclasa incrementando el AMP cíclico intracelular y produciendo relajación bronquial rápida.',
                indications: ['Alivio del broncoespasmo agudo en asma y EPOC', 'Prevención del broncoespasmo inducido por ejercicio', 'Crisis asmática moderada a grave'],
                presentations: {
                    'Inhalador 100mcg/dosis': {
                        dosage: [{ amount: '100-200', unit: 'mcg', route: ['Inhalatoria'], useIn: 'Ambos' }]
                    }
                },
                dosageGuidance: {
                    adult: { 'Inhalatoria': { guidelines: ['1 a 2 inhalaciones (100-200 mcg) a demanda cada 4 a 6 horas.'], maxDose: ['8 inhalaciones (800 mcg) al día sin supervisión médica.'] } }
                },
                risk: {
                    pregnancy: 'Categoría C',
                    lactation: 'Compatible',
                    renal: { level: 'Sin ajuste', adjustment: 'Precaución en fallo avanzado.' },
                    hepatic: { level: 'Sin ajuste', adjustment: 'Vigilar metabolismo.' },
                    geriatric: 'Mayor susceptibilidad a temblor y taquicardia',
                    securityFlags: ['Taquicardia refleja, hipopotasemia en dosis altas']
                },
                contraindications: ['Hipersensibilidad al salbutamol'],
                interactions: ['Betabloqueantes no cardioselectivos (antagonismo mutuo broncoconstrictor)', 'Diuréticos (aumentan riesgo de hipopotasemia)'],
                adverseReactions: ['Temblor fino distal', 'Palpitaciones y taquicardia', 'Cefalea', 'Hipopotasemia'],
                overdose: 'Betabloqueante cardioselectivo (atenolol/metoprolol) con extrema cautela si hay riesgo broncospástico.',
                references: ['CIMA AEMPS (2023). Ficha técnica Salbutamol 100 mcg suspensión para inhalación.']
            },
            {
                name: 'loratadina',
                categories: ['antihistaminicos'],
                atc: [{
                    code: 'R06AX13',
                    categoryCode: 'R',
                    categoryName: 'Sistema Respiratorio',
                    subcategoryCode: 'R06',
                    subcategoryName: 'Antihistamínicos para Uso Sistémico'
                }],
                actionMechanism: 'Antihistamínico tricíclico periférico potente y de acción prolongada. Bloqueante competitivo y selectivo de receptores H1 de histamina con escasa penetración en barrera hematoencefálica.',
                indications: ['Rinitis alérgica estacional y perenne', 'Urticaria idiopática crónica', 'Conjuntivitis alérgica'],
                presentations: {
                    'Comprimidos 10mg': {
                        dosage: [{ amount: '10', unit: 'mg/día', route: ['Oral'], useIn: 'Adultos' }]
                    }
                },
                dosageGuidance: {
                    adult: { 'Oral': { guidelines: ['10 mg una vez al día con o sin alimentos.'], maxDose: ['10 mg al día.'] } }
                },
                risk: {
                    pregnancy: 'Categoría B',
                    lactation: 'Compatible',
                    renal: { level: 'Sin ajuste en insuficiencia renal leve a moderada', adjustment: '10 mg en días alternos en ClCr < 30 ml/min.' },
                    hepatic: { level: 'Ajuste en insuficiencia hepática grave', adjustment: 'Dosis inicial de 10 mg cada 48 horas.' },
                    geriatric: 'Bajo riesgo sedante',
                    securityFlags: ['Suspender 48 horas antes de pruebas alérgicas cutáneas']
                },
                contraindications: ['Hipersensibilidad a la loratadina'],
                interactions: ['Inhibidores potentes de CYP3A4 y CYP2D6 aumentan niveles sin cambios electrocardiográficos significativos'],
                adverseReactions: ['Somnolencia leve en pacientes susceptibles', 'Cefalea', 'Sequedad de boca', 'Fatiga'],
                overdose: 'Lavado gástrico y monitorización sintomática.',
                references: ['CIMA AEMPS (2023). Ficha técnica Loratadina 10 mg comprimidos.']
            },
            {
                name: 'losartan',
                categories: ['antihipertensivos', 'ara-ii'],
                atc: [{
                    code: 'C09CA01',
                    categoryCode: 'C',
                    categoryName: 'Sistema Cardiovascular',
                    subcategoryCode: 'C09',
                    subcategoryName: 'Agentes que Actúan sobre el Sistema Renina-Angiotensina (IECA / ARA-II)'
                }],
                actionMechanism: 'Antagonista oral potente, selectivo y no peptídico del receptor de angiotensina II subtipo AT1. Bloquea vasoconstricción, secreción de aldosterona y remodelado cardíaco sin inducir tos.',
                indications: ['Hipertensión arterial esencial', 'Protección renal en diabetes mellitus tipo 2 con proteinuria', 'Insuficiencia cardíaca crónica', 'Reducción de riesgo de ictus en HTA con HVI'],
                presentations: {
                    'Comprimidos 50mg': {
                        dosage: [{ amount: '50-100', unit: 'mg/día', route: ['Oral'], useIn: 'Adultos' }]
                    }
                },
                dosageGuidance: {
                    adult: { 'Oral': { guidelines: ['50 mg una vez al día por la mañana. Puede aumentarse a 100 mg/día tras 3-6 semanas.'], maxDose: ['100 mg al día.'] } }
                },
                risk: {
                    pregnancy: 'Categoría D - Absolutamente contraindicado en 2.º y 3.er trimestre (fetotoxicidad)',
                    lactation: 'No recomendado',
                    renal: { level: 'Monitorear creatinina y potasio', adjustment: 'Precaución en estenosis bilateral de la arteria renal.' },
                    hepatic: { level: 'Ajuste en disfunción hepática leve a moderada', adjustment: 'Dosis de inicio 25 mg una vez al día.' },
                    geriatric: 'Iniciar con 25 a 50 mg según presión basal',
                    securityFlags: ['Riesgo de hiperpotasemia e hipotensión severa con depleción de volumen']
                },
                contraindications: ['Embarazo (2.º y 3.er trimestre)', 'Insuficiencia hepática grave', 'Uso concomitante con aliskireno en diabetes'],
                interactions: ['Suplementos de potasio y diuréticos ahorradores aumentan riesgo de hiperpotasemia grave', 'AINEs reducen efecto antihipertensivo'],
                adverseReactions: ['Mareo postural', 'Hipotensión ortostática', 'Hiperpotasemia', 'Astenia'],
                overdose: 'Soporte de volemia mediante suero salino isotónico y posición de Trendelenburg.',
                references: ['CIMA AEMPS (2023). Ficha técnica Losartán 50 mg comprimidos.']
            },
            {
                name: 'amlodipino',
                categories: ['antihipertensivos', 'bloqueantes de canales de calcio'],
                atc: [{
                    code: 'C08CA01',
                    categoryCode: 'C',
                    categoryName: 'Sistema Cardiovascular',
                    subcategoryCode: 'C08',
                    subcategoryName: 'Bloqueantes de Canales de Calcio (Antagonistas del Calcio)'
                }],
                actionMechanism: 'Antagonista de los canales de calcio del grupo de las dihidropiridinas. Inhibe el flujo transmembrana de iones de calcio hacia el músculo liso vascular y cardíaco, induciendo vasodilatación arterial periférica prolongada.',
                indications: ['Hipertensión arterial', 'Angina de pecho crónica estable', 'Angina vasoespástica (de Prinzmetal)'],
                presentations: {
                    'Comprimidos 5mg': {
                        dosage: [{ amount: '5-10', unit: 'mg/día', route: ['Oral'], useIn: 'Adultos' }]
                    }
                },
                dosageGuidance: {
                    adult: { 'Oral': { guidelines: ['5 mg una vez al día; titular a 10 mg/día tras 1 a 2 semanas.'], maxDose: ['10 mg al día.'] } }
                },
                risk: {
                    pregnancy: 'Categoría C',
                    lactation: 'Compatible en dosis habituales',
                    renal: { level: 'Sin ajuste necesario', adjustment: 'No dializable.' },
                    hepatic: { level: 'Metabolismo hepático extenso', adjustment: 'Iniciar con 2.5 mg/día en disfunción hepática.' },
                    geriatric: 'Iniciar con 2.5 mg/día por semivida prolongada',
                    securityFlags: ['Edema maleolar dependiente de dosis']
                },
                contraindications: ['Hipotensión grave (sistólica < 90 mmHg)', 'Shock cardiogénico', 'Estenosis aórtica severa', 'Insuficiencia cardíaca inestable tras IAM'],
                interactions: ['Simvastatina (limitar simvastatina a máx 20 mg/día por inhibición CYP3A4)', 'Tacrolimus y ciclosporina (aumenta niveles)'],
                adverseReactions: ['Edema periférico en miembros inferiores', 'Rubor facial', 'Cefalea', 'Palpitaciones y mareo'],
                overdose: 'Gluconato cálcico IV, fluidoterapia y vasopresores.',
                references: ['CIMA AEMPS (2023). Ficha técnica Amlodipino 5 mg comprimidos.']
            },
            {
                name: 'hidroclorotiazida',
                categories: ['diureticos', 'tiazidas'],
                atc: [{
                    code: 'C03AA03',
                    categoryCode: 'C',
                    categoryName: 'Sistema Cardiovascular',
                    subcategoryCode: 'C03',
                    subcategoryName: 'Diuréticos'
                }],
                actionMechanism: 'Diurético tiazídico de techo bajo. Inhibe el cotransportador activo de sodio y cloro (NCC) en el túbulo contorneado distal, incrementando la excreción de agua, sodio, potasio y magnesio.',
                indications: ['Hipertensión arterial esencial (monoterapia o combinación)', 'Edema asociado a insuficiencia cardíaca congestiva o cirrosis', 'Diabetes insípida nefrogénica'],
                presentations: {
                    'Comprimidos 25mg': {
                        dosage: [{ amount: '12.5-25', unit: 'mg/día', route: ['Oral'], useIn: 'Adultos' }]
                    }
                },
                dosageGuidance: {
                    adult: { 'Oral': { guidelines: ['12.5 a 25 mg una vez al día por la mañana.'], maxDose: ['50 mg al día en edemas refractarios.'] } }
                },
                risk: {
                    pregnancy: 'Categoría B',
                    lactation: 'Precaución (puede inhibir lactancia)',
                    renal: { level: 'Ineficaz con ClCr < 30 ml/min', adjustment: 'Cambiar a diuréticos del asa en insuficiencia renal avanzada.' },
                    hepatic: { level: 'Riesgo de encefalopatía hepática por hipopotasemia', adjustment: 'Monitoreo electrolítico estricto.' },
                    geriatric: 'Vigilar hiponatremia e hipotensión ortostática',
                    securityFlags: ['Riesgo de hipopotasemia, hiperuricemia e hiperglucemia']
                },
                contraindications: ['Anuria', 'Insuficiencia renal severa (ClCr < 30 ml/min)', 'Hipopotasemia o hiponatremia refractaria', 'Enfermedad de Addison'],
                interactions: ['Litio (reduce eliminación provocando intoxicación)', 'Digoxina (hipopotasemia aumenta riesgo de arritmias)', 'AINEs'],
                adverseReactions: ['Hipopotasemia', 'Hiponatremia', 'Hiperuricemia (crisis gotosa)', 'Hiperglucemia en diabéticos'],
                overdose: 'Reposición hidroelectrolítica intensiva.',
                references: ['CIMA AEMPS (2023). Ficha técnica Hidroclorotiazida 25 mg.']
            },
            {
                name: 'furosemida',
                categories: ['diureticos', 'diureticos del asa'],
                atc: [{
                    code: 'C03CA01',
                    categoryCode: 'C',
                    categoryName: 'Sistema Cardiovascular',
                    subcategoryCode: 'C03',
                    subcategoryName: 'Diuréticos'
                }],
                actionMechanism: 'Diurético de techo alto de acción corta y potente. Inhibe selectivamente el cotransportador Na+/K+/2Cl- en la rama ascendente gruesa del asa de Henle, promoviendo una rápida diuresis salurética.',
                indications: ['Edema agudo de pulmón', 'Insuficiencia cardíaca congestiva descompensada', 'Edema por síndrome nefrótico o cirrosis hepática', 'Crisis hipertensiva'],
                presentations: {
                    'Comprimidos 40mg': { dosage: [{ amount: '20-80', unit: 'mg/día', route: ['Oral'], useIn: 'Adultos' }] },
                    'Ampolla 20mg/2ml': { dosage: [{ amount: '20-40', unit: 'mg', route: ['Intravenosa'], useIn: 'Adultos' }] }
                },
                dosageGuidance: {
                    adult: { 'Oral': { guidelines: ['20 a 40 mg en ayunas; escalar en caso de resistencia diurética.'], maxDose: ['600 mg al día en fallo renal crónico severo.'] } }
                },
                risk: {
                    pregnancy: 'Categoría C',
                    lactation: 'Inhibe la lactancia materna',
                    renal: { level: 'Eficaz incluso con ClCr < 20 ml/min', adjustment: 'Requiere dosis más elevadas en enfermedad renal.' },
                    hepatic: { level: 'Riesgo alto de coma hepático por alcalosis metabólica', adjustment: 'Usar con espironolactona en cirrosis.' },
                    geriatric: 'Riesgo elevado de deshidratación e hipotensión',
                    securityFlags: ['Ototoxicidad en infusión rápida o combinación con aminoglucósidos', 'Hipopotasemia severa']
                },
                contraindications: ['Insuficiencia renal anúrica refractaria', 'Coma hepático y precoma', 'Hipovolemia o deshidratación severa'],
                interactions: ['Aminoglucósidos y cisplatino (potenciación de ototoxicidad y nefrotoxicidad)', 'Digoxina', 'Litio'],
                adverseReactions: ['Hipopotasemia marcada', 'Hipomagnesemia', 'Hipotensión ortostática', 'Alcalosis metabólica'],
                overdose: 'Reposición inmediata de volemia y electrolitos con suero fisiológico.',
                references: ['CIMA AEMPS (2023). Ficha técnica Furosemida 40 mg comprimidos.']
            },
            {
                name: 'simvastatina',
                categories: ['hipolipemiantes', 'estatinas'],
                atc: [{
                    code: 'C10AA01',
                    categoryCode: 'C',
                    categoryName: 'Sistema Cardiovascular',
                    subcategoryCode: 'C10',
                    subcategoryName: 'Agentes Modificadores de los Lípidos (Hipolipemiantes y Estatinas)'
                }],
                actionMechanism: 'Profármaco lactónico inactivo que se hidroliza al beta-hidroxiácido activo. Inhibe de forma competitiva la 3-hidroxi-3-metilglutaril-coenzima A (HMG-CoA) reductasa, enzima limitante en la síntesis hepática de colesterol.',
                indications: ['Hipercolesterolemia primaria', 'Dislipidemia mixta', 'Prevención secundaria de eventos cardiovasculares mayores'],
                presentations: {
                    'Comprimidos 20mg': { dosage: [{ amount: '20-40', unit: 'mg/noche', route: ['Oral'], useIn: 'Adultos' }] }
                },
                dosageGuidance: {
                    adult: { 'Oral': { guidelines: ['10 a 40 mg una vez al día por la noche (ritmo circadiano del colesterol).'], maxDose: ['40 mg al día (dosis de 80 mg desaconsejada por miopatía).'] } }
                },
                risk: {
                    pregnancy: 'Categoría X - Absolutamente contraindicado en gestación y lactancia',
                    lactation: 'Contraindicado',
                    renal: { level: 'Precaución en ClCr < 30 ml/min', adjustment: 'Iniciar con 10 mg/día.' },
                    hepatic: { level: 'Contraindicado en hepatopatía activa o transaminasas elevadas > 3x LSN', adjustment: 'Suspender si hay elevación mantenida.' },
                    geriatric: 'Vigilar mialgias y riesgo de interacción',
                    securityFlags: ['Riesgo de rabdomiólisis y miopatía, especialmente con inhibidores de CYP3A4']
                },
                contraindications: ['Embarazo y lactancia', 'Hepatopatía activa', 'Uso concomitante con inhibidores potentes de CYP3A4 (claritromicina, itraconazol, ketoconazol, ritonavir)'],
                interactions: ['Zumo de pomelo (incrementa drásticamente niveles)', 'Amiodarona, verapamilo, amlodipino (máx 20 mg/día)', 'Gemfibrozilo (contraindicado)'],
                adverseReactions: ['Mialgias', 'Elevación asintomática de transaminasas', 'Cefalea', 'Rabdomiólisis infrecuente'],
                overdose: 'Monitorear niveles de creatina quinasa (CK) y función renal.',
                references: ['CIMA AEMPS (2023). Ficha técnica Simvastatina 20 mg.']
            },
            {
                name: 'atorvastatina',
                categories: ['hipolipemiantes', 'estatinas'],
                atc: [{
                    code: 'C10AA05',
                    categoryCode: 'C',
                    categoryName: 'Sistema Cardiovascular',
                    subcategoryCode: 'C10',
                    subcategoryName: 'Agentes Modificadores de los Lípidos (Hipolipemiantes y Estatinas)'
                }],
                actionMechanism: 'Inhibidor selectivo y competitivo de la HMG-CoA reductasa de alta potencia. Aumenta el número de receptores hepáticos de LDL en la superficie celular, intensificando la captación y catabolismo del colesterol LDL circulante.',
                indications: ['Hipercolesterolemia primaria', 'Síndrome coronario agudo (prevención secundaria intensiva)', 'Reducción de riesgo de ictus y cardiopatía isquémica'],
                presentations: {
                    'Comprimidos 20mg': { dosage: [{ amount: '20-80', unit: 'mg/día', route: ['Oral'], useIn: 'Adultos' }] }
                },
                dosageGuidance: {
                    adult: { 'Oral': { guidelines: ['10 a 80 mg una vez al día a cualquier hora del día (semivida prolongada).'], maxDose: ['80 mg al día en prevención secundaria intensiva.'] } }
                },
                risk: {
                    pregnancy: 'Categoría X - Contraindicado en el embarazo',
                    lactation: 'Contraindicado',
                    renal: { level: 'Sin ajuste necesario en disfunción renal', adjustment: 'No dializable.' },
                    hepatic: { level: 'Contraindicado en enfermedad hepática activa', adjustment: 'Suspender ante transaminasas > 3x LSN.' },
                    geriatric: 'Eficacia y seguridad similar a jóvenes',
                    securityFlags: ['Miopatía y rabdomiólisis dependiente de dosis']
                },
                contraindications: ['Hepatopatía activa', 'Embarazo y lactancia', 'Elevación inexplicable de transaminasas'],
                interactions: ['Claritromicina y eritromicina (aumentan exposición)', 'Ciclosporina (limitar a 10 mg/día)', 'Colchicina'],
                adverseReactions: ['Nasofaringitis', 'Artralgias y dolor en extremidades', 'Elevación de HbA1c y glucosa basal', 'Diarrea'],
                overdose: 'Tratamiento de soporte y control seriado de CPK.',
                references: ['CIMA AEMPS (2023). Ficha técnica Atorvastatina 20 mg comprimidos.']
            },
            {
                name: 'metformina',
                categories: ['antidiabeticos', 'biguanidas'],
                atc: [{
                    code: 'A10BA02',
                    categoryCode: 'A',
                    categoryName: 'Tracto Alimentario y Metabolismo',
                    subcategoryCode: 'A10',
                    subcategoryName: 'Fármacos Usados en Diabetes (Antidiabéticos e Insulinas)'
                }],
                actionMechanism: 'Antihiperglucemiante oral biguanida. Reduce la producción hepática de glucosa inhibiendo la gluconeogénesis y glucogenólisis, aumenta la sensibilidad a la insulina en músculo y retrasa la absorción intestinal de glucosa sin provocar hipoglucemia.',
                indications: ['Diabetes mellitus tipo 2 como tratamiento de primera línea', 'Síndrome de ovario poliquístico (indicación off-label)', 'Prevención de DM2 en prediabetes'],
                presentations: {
                    'Comprimidos 850mg': { dosage: [{ amount: '850-2550', unit: 'mg/día', route: ['Oral'], useIn: 'Adultos' }] }
                },
                dosageGuidance: {
                    adult: { 'Oral': { guidelines: ['500 u 850 mg dos o tres veces al día con o después de las comidas principales.'], maxDose: ['2550 mg al día en 3 tomas.'] } }
                },
                risk: {
                    pregnancy: 'Categoría B - Uso seguro cada vez más extendido bajo supervisión',
                    lactation: 'Compatible',
                    renal: { level: 'Ajuste estricto por FG', adjustment: 'FG 45-59: máx 1000 mg/día; FG 30-44: máx 500 mg/día; FG < 30: contraindicada.' },
                    hepatic: { level: 'Contraindicado en insuficiencia hepática', adjustment: 'Riesgo aumentado de acidosis láctica.' },
                    geriatric: 'Monitorear función renal al menos semestralmente',
                    securityFlags: ['Acidosis láctica: complicación metabólica rara pero grave', 'Suspender 48 horas antes de contraste yodado']
                },
                contraindications: ['Insuficiencia renal severa (TFG < 30 ml/min)', 'Acidosis metabólica aguda', 'Estados hipóxicos agudos (shock, insuficiencia cardíaca descompensada, sepsis)', 'Alcoholismo activo'],
                interactions: ['Medios de contraste radiológicos yodados (suspender 48h antes por riesgo de nefropatía y acidosis)', 'Alcohol'],
                adverseReactions: ['Diarrea y náuseas al inicio', 'Dolor abdominal y sabor metálico', 'Déficit de vitamina B12 en uso prolongado'],
                overdose: 'Hemodiálisis efectiva para remover metformina y corregir acidosis láctica.',
                references: ['CIMA AEMPS (2023). Ficha técnica Metformina 850 mg comprimidos.']
            },
            {
                name: 'glibenclamida',
                categories: ['antidiabeticos', 'sulfonilureas'],
                atc: [{
                    code: 'A10BB01',
                    categoryCode: 'A',
                    categoryName: 'Tracto Alimentario y Metabolismo',
                    subcategoryCode: 'A10',
                    subcategoryName: 'Fármacos Usados en Diabetes (Antidiabéticos e Insulinas)'
                }],
                actionMechanism: 'Sulfonilurea de segunda generación secretagoga de insulina. Estimula la liberación de insulina uniéndose a los receptores SUR1 de los canales de potasio sensibles a ATP en las células beta pancreáticas.',
                indications: ['Diabetes mellitus tipo 2 cuando dieta y ejercicio o metformina no alcanzan control glucémico adecuado'],
                presentations: {
                    'Comprimidos 5mg': { dosage: [{ amount: '2.5-15', unit: 'mg/día', route: ['Oral'], useIn: 'Adultos' }] }
                },
                dosageGuidance: {
                    adult: { 'Oral': { guidelines: ['2.5 a 5 mg administrados inmediatamente antes del desayuno o comida principal.'], maxDose: ['15 mg al día.'] } }
                },
                risk: {
                    pregnancy: 'Categoría C',
                    lactation: 'Contraindicado',
                    renal: { level: 'Acumulación de metabolitos activos', adjustment: 'Evitar en FG < 60 ml/min por riesgo de hipoglucemia prolongada.' },
                    hepatic: { level: 'Contraindicado en insuficiencia hepática grave', adjustment: 'Metabolismo dependiente.' },
                    geriatric: 'Desaconsejado en ancianos por criterio de Beers (hipoglucemia severa prolongada)',
                    securityFlags: ['Hipoglucemias severas y de larga duración (hasta 24-48 horas)']
                },
                contraindications: ['Diabetes mellitus tipo 1', 'Cetoacidosis diabética', 'Insuficiencia renal o hepática moderada a grave'],
                interactions: ['AINEs, sulfonamidas, fluconazol (potencian hipoglucemia)', 'Alcohol (efecto antabús e hipoglucemia)'],
                adverseReactions: ['Hipoglucemia', 'Aumento de peso', 'Trastornos gastrointestinales transitorios'],
                overdose: 'Glucosa hipertónica IV continua y octreotida en hipoglucemia refractaria.',
                references: ['CIMA AEMPS (2023). Ficha técnica Glibenclamida 5 mg.']
            },
            {
                name: 'metoclopramida',
                categories: ['antiemeticos', 'procineticos'],
                atc: [{
                    code: 'A03FA01',
                    categoryCode: 'A',
                    categoryName: 'Tracto Alimentario y Metabolismo',
                    subcategoryCode: 'A03',
                    subcategoryName: 'Agentes contra Padecimientos Funcionales Gastrointestinales (Espasmolíticos)'
                }],
                actionMechanism: 'Antagonista de receptores dopaminérgicos D2 tanto en el sistema nervioso central (área postrema) como periférico, con acción agonista 5-HT4. Incrementa el tono del esfínter esofágico inferior y acelera el vaciamiento gástrico.',
                indications: ['Prevención y tratamiento de náuseas y vómitos inducidos por quimioterapia, radioterapia o postoperatorios', 'Gastroparesia diabética'],
                presentations: {
                    'Comprimidos 10mg': { dosage: [{ amount: '10', unit: 'mg', route: ['Oral'], useIn: 'Adultos' }] },
                    'Ampollas 10mg/2ml': { dosage: [{ amount: '10', unit: 'mg', route: ['Intravenosa'], useIn: 'Adultos' }] }
                },
                dosageGuidance: {
                    adult: { 'Oral': { guidelines: ['10 mg hasta 3 veces al día antes de las comidas, con intervalo mínimo de 6 horas.'], maxDose: ['30 mg al día (máximo 5 días de tratamiento consecutivo).'] } }
                },
                risk: {
                    pregnancy: 'Categoría B',
                    lactation: 'Compatible',
                    renal: { level: 'Ajuste en ClCr < 40 ml/min', adjustment: 'Reducir dosis un 50% en insuficiencia renal.' },
                    hepatic: { level: 'Sin ajuste en leve', adjustment: 'Reducir al 50% en insuficiencia severa.' },
                    geriatric: 'Mayor susceptibilidad a síntomas extrapiramidales y discinesia tardía',
                    securityFlags: ['Reacciones distónicas agudas en niños y adultos jóvenes', 'Uso máximo 5 días']
                },
                contraindications: ['Hemorragia u obstrucción gastrointestinal mecánica', 'Feocromocitoma', 'Epilepsia', 'Uso concomitante con levodopa'],
                interactions: ['Levodopa y agonistas dopaminérgicos (antagonismo mutuo)', 'Sedantes y alcohol potencian somnolencia'],
                adverseReactions: ['Somnolencia y astenia', 'Espasmos faciales y distonía cervical aguda', 'Acatisia', 'Hiperprolactinemia'],
                overdose: 'Biperideno o difenhidramina parenteral para revertir el cuadro distónico extrapiramidal.',
                references: ['CIMA AEMPS (2023). Ficha técnica Metoclopramida 10 mg.']
            },
            {
                name: 'diazepam',
                categories: ['ansioliticos', 'benzodiazepinas'],
                atc: [{
                    code: 'N05BA01',
                    categoryCode: 'N',
                    categoryName: 'Sistema Nervioso',
                    subcategoryCode: 'N05',
                    subcategoryName: 'Psicolépticos (Ansiolíticos, Hipnóticos y Antipsicóticos)'
                }],
                actionMechanism: 'Benzodiazepina de acción prolongada. Se une al receptor GABAA en la interfaz de subunidades alfa-gamma, potenciando alostéricamente la afinidad del GABA por su receptor y aumentando la frecuencia de apertura de canales de cloruro.',
                indications: ['Trastornos de ansiedad generalizada y crisis de pánico', 'Status epilepticus y crisis convulsivas agudas', 'Espasmos musculares y contracturas', 'Delirium tremens por abstinencia alcohólica'],
                presentations: {
                    'Comprimidos 5mg': { dosage: [{ amount: '5-10', unit: 'mg', route: ['Oral'], useIn: 'Adultos' }] },
                    'Ampollas 10mg/2ml': { dosage: [{ amount: '10', unit: 'mg', route: ['Intravenosa', 'Rectal'], useIn: 'Adultos' }] }
                },
                dosageGuidance: {
                    adult: { 'Oral': { guidelines: ['2 a 10 mg administrados en 2 a 4 tomas diarias según necesidad clínica.'], maxDose: ['40 mg al día en pacientes hospitalizados.'] } }
                },
                risk: {
                    pregnancy: 'Categoría D - Atraviesa placenta (riesgo de síndrome de abstinencia neonatal)',
                    lactation: 'Se excreta en leche materna; evitar o suspender',
                    renal: { level: 'Sin ajuste mayor', adjustment: 'Precaución por acumulación de metabolito activo nordiazepam.' },
                    hepatic: { level: 'Contraindicado en insuficiencia hepática grave', adjustment: 'Riesgo de encefalopatía.' },
                    geriatric: 'Iniciar con dosis mínimas (2 a 2.5 mg) por riesgo de sedación y caídas',
                    securityFlags: ['Depresión respiratoria si se asocia a opioides o alcohol', 'Dependencia física y tolerancia']
                },
                contraindications: ['Miastenia gravis', 'Insuficiencia respiratoria grave', 'Síndrome de apnea del sueño', 'Insuficiencia hepática grave'],
                interactions: ['Opioides y alcohol (depresión respiratoria letal)', 'Inhibidores de CYP3A4 y CYP2C19 aumentan concentración sérica'],
                adverseReactions: ['Sedación diurna', 'Ataxia y confusión', 'Amnesia anterógrada', 'Efecto rebote al retirar bruscamente'],
                overdose: 'Flumazenilo IV como antídoto específico bajo monitorización electrocardiográfica estricta.',
                references: ['CIMA AEMPS (2023). Ficha técnica Diazepam 5 mg comprimidos.']
            },
            {
                name: 'sertralina',
                categories: ['antidepresivos', 'isrs'],
                atc: [{
                    code: 'N06AB06',
                    categoryCode: 'N',
                    categoryName: 'Sistema Nervioso',
                    subcategoryCode: 'N06',
                    subcategoryName: 'Psicoanalépticos (Antidepresivos y Psicoestimulantes)'
                }],
                actionMechanism: 'Inhibidor potente y altamente selectivo de la recaptación neuronal de serotonina (5-HT) en la hendidura sináptica. Presenta efectos mínimos sobre la recaptación de noradrenalina y dopamina, careciendo de afinidad colinérgica o histaminérgica.',
                indications: ['Episodio depresivo mayor', 'Trastorno obsesivo-compulsivo (TOC)', 'Trastorno de angustia con o sin agorafobia', 'Trastorno de estrés postraumático (TEPT)', 'Fobia social'],
                presentations: {
                    'Comprimidos 50mg': { dosage: [{ amount: '50-100', unit: 'mg/día', route: ['Oral'], useIn: 'Adultos' }] }
                },
                dosageGuidance: {
                    adult: { 'Oral': { guidelines: ['50 mg una vez al día, por la mañana o por la noche; puede aumentarse gradualmente en tramos de 50 mg cada semana.'], maxDose: ['200 mg al día.'] } }
                },
                risk: {
                    pregnancy: 'Categoría C',
                    lactation: 'Compatible con monitorización',
                    renal: { level: 'Sin ajuste necesario en ningún grado de insuficiencia renal', adjustment: 'Metabolismo hepático preponderante.' },
                    hepatic: { level: 'Ajuste en insuficiencia hepática', adjustment: 'Reducir dosis o espaciar intervalos.' },
                    geriatric: 'Vigilar hiponatremia por SIADH',
                    securityFlags: ['Alerta por síndrome serotoninérgico con otros fármacos proserotoninérgicos', 'Aumento transitorio de ideación autolítica al inicio']
                },
                contraindications: ['Tratamiento concomitante con IMAO irreversible (dejar al menos 14 días libres)', 'Uso con pimozida'],
                interactions: ['IMAOs (riesgo mortal de síndrome serotoninérgico)', 'Triptanos, tramadol, fentanilo', 'Anticoagulantes orales (aumenta riesgo de sangrado)'],
                adverseReactions: ['Náuseas y diarrea al inicio', 'Insomnio o somnolencia', 'Disfunción sexual (eyaculación retardada)', 'Cefalea'],
                overdose: 'Tratamiento de soporte y carbón activado precoz. No existe antídoto específico.',
                references: ['CIMA AEMPS (2023). Ficha técnica Sertralina 50 mg comprimidos.']
            }
        ];
    }
}

export const drugService = new DrugService();
