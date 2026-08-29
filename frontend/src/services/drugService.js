import axios from 'axios';

class DrugService {
    constructor() {
        this.apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:10000';
        this.fallbackDrugs = this.initializeFallbackDataset();
    }

    async getAllDrugs() {
        try {
            const response = await axios.get(`${this.apiBaseUrl}/drugs`, { timeout: 3000 });
            if (response.data && response.data.success && Array.isArray(response.data.data)) {
                return { success: true, data: response.data.data, isOffline: false };
            }
            throw new Error('Invalid backend response');
        } catch (error) {
            const namesOnly = this.fallbackDrugs.map((drug) => ({
                id: drug.name,
                _id: drug.name,
                name: drug.name,
                categories: drug.categories,
                actionMechanism: drug.actionMechanism
            }));
            return { success: true, data: namesOnly, isOffline: true };
        }
    }

    async getAllFamilies() {
        try {
            const response = await axios.get(`${this.apiBaseUrl}/drugs/families`, { timeout: 3000 });
            if (response.data && response.data.success && Array.isArray(response.data.data)) {
                return { success: true, data: response.data.data, isOffline: false };
            }
            throw new Error('Invalid backend response');
        } catch (error) {
            const categoriesSet = new Set();
            this.fallbackDrugs.forEach((drug) => {
                drug.categories.forEach((category) => categoriesSet.add(category));
            });
            return { success: true, data: Array.from(categoriesSet).sort(), isOffline: true };
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
                .filter((drug) => drug.categories.some((cat) => cat.toLowerCase() === categoryName.toLowerCase()))
                .map((drug) => ({
                    id: drug.name,
                    _id: drug.name,
                    name: drug.name,
                    categories: drug.categories,
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

    searchFallback(queryText) {
        const normalized = queryText.toLowerCase().trim();
        if (!normalized) return [];

        return this.fallbackDrugs.filter((drug) => {
            const nameMatch = drug.name.toLowerCase().includes(normalized);
            const categoryMatch = drug.categories.some((cat) => cat.toLowerCase().includes(normalized));
            const mechanismMatch = drug.actionMechanism ? drug.actionMechanism.toLowerCase().includes(normalized) : false;
            const indicationMatch = drug.indications ? drug.indications.some((ind) => ind.toLowerCase().includes(normalized)) : false;
            return nameMatch || categoryMatch || mechanismMatch || indicationMatch;
        });
    }

    initializeFallbackDataset() {
        return [
            {
                name: 'paracetamol',
                categories: ['analgesicos', 'antipireticos'],
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
                overdose: 'Administrar N-acetilcisteina dentro de las primeras 8-10 horas. Medir niveles sericos mediante normograma de Rumack-Matthew.'
            },
            {
                name: 'ibuprofeno',
                categories: ['antiinflamatorios no esteroideos', 'analgesicos', 'antipireticos'],
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
                overdose: 'Lavado gastrico y carbon activado precoz. Tratamiento de soporte hemodinamico y correccion hidroelectrolitica.'
            },
            {
                name: 'amoxicilina',
                categories: ['antibioticos', 'betalactamicos', 'penicilinas'],
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
                overdose: 'Medidas de sosten e hidratacion adecuada. Hemodializable en casos graves.'
            },
            {
                name: 'omeprazol',
                categories: ['inhibidores de bomba de protones', 'antiulcerosos'],
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
                overdose: 'Tratamiento sintomatico. No se conocen efectos graves por sobredosis puntual.'
            }
        ];
    }
}

export const drugService = new DrugService();
