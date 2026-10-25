const axios = require('axios');

const API_BASE = 'http://localhost:5174';

const drugsToIngest = [
  {
    name: 'omeprazol',
    categories: ['antiulcerosos', 'inhibidores de la bomba de protones'],
    actionMechanism: 'Inhibicion irreversible de la enzima H mas K mas ATPasa en las celulas parietales gastricas suprimiendo la secrecion acida basal y estimulada.',
    indications: [
      'Ulcera duodenal y ulcera gastrica benigna',
      'Erradicacion de Helicobacter pylori en combinacion con antibioticos',
      'Reflujo gastroesofagico y esofagitis por reflujo',
      'Sindrome de Zollinger Ellison'
    ],
    presentations: {
      'Capsulas Duras Gastrorresistentes 20mg': {
        dosage: [
          {
            amount: '20-40',
            unit: 'mg',
            route: ['Oral'],
            useIn: 'Adultos'
          }
        ]
      },
      'Capsulas Duras Gastrorresistentes 40mg': {
        dosage: [
          {
            amount: '40',
            unit: 'mg',
            route: ['Oral'],
            useIn: 'Adultos'
          }
        ]
      }
    },
    dosageGuidance: {
      adult: {
        'Oral': {
          guidelines: [
            '20 mg una vez al dia por la manana en ayunas antes del desayuno durante 4 semanas.',
            'En casos refractarios o sindrome de Zollinger-Ellison la dosis puede incrementarse hasta 80 mg al dia.'
          ],
          maxDose: [
            '120 mg al dia divididos en dos tomas.'
          ]
        }
      },
      pediatric: {
        'Oral': {
          guidelines: [
            'En ninos mayores de un ano de 10 a 20 kg dosis de 10 mg una vez al dia.',
            'En ninos de mas de 20 kg dosis de 20 mg una vez al dia en esofagitis grave.'
          ],
          maxDose: [
            '20 mg al dia en poblacion pediatrica.'
          ]
        }
      }
    },
    risk: {
      pregnancy: 'Categoria C de la FDA evaluar riesgo y beneficio en gestacion',
      lactation: 'Compatible con la lactancia materna al excretarse en cantidades minimas',
      renal: {
        level: 'Sin ajuste requerido en insuficiencia renal',
        adjustment: 'No es necesario modificar la pauta posologica en pacientes con deterioro de la funcion renal.'
      },
      hepatic: {
        level: 'Ajuste de dosis en insuficiencia hepatica grave',
        adjustment: 'Dosis diaria maxima recomendada de 20 mg al dia por aumento de biodisponibilidad y vida media.'
      },
      geriatric: 'No se requiere ajuste de dosis en pacientes ancianos salvo deterioro hepatico asociado',
      securityFlags: [
        'Riesgo de hipomagnesemia en tratamientos prolongados superiores a un ano',
        'Incremento del riesgo de fracturas oseas e infecciones gastrointestinales por Clostridioides difficile'
      ]
    },
    contraindications: [
      'Hipersensibilidad conocida al omeprazol o a benzimidazoles sustituidos',
      'Administracion concomitante con nelfinavir o rilpivirina'
    ],
    interactions: [
      'Clopidogrel presenta disminucion en su transformacion al metabolito activo',
      'Ketoconazol e itraconazol disminuyen su absorcion gastrointestinal por reduccion de acidez',
      'Digoxina puede aumentar su biodisponibilidad serica'
    ],
    adverseReactions: [
      'Cefalea',
      'Diarrea transitoria',
      'Dolor abdominal',
      'Nauseas',
      'Estrenimiento',
      'Flatulencia'
    ],
    overdose: 'Sintomas incluyen confusion, somnolencia, vision borrosa y taquicardia. Tratamiento sintomatico y de soporte general; no es dializable de forma significativa.',
    references: [
      'Agencia Española de Medicamentos y Productos Sanitarios. (2023). Ficha técnica Omeprazol 20 mg cápsulas duras gastrorresistentes. Centro de Información Online de Medicamentos (CIMA). https://cima.aemps.es',
      'Strand, D. S., Kim, D., & Peura, D. A. (2017). 25 years of proton pump inhibitors: A comprehensive review. Gut and Liver, 11(1), 27-37. https://doi.org/10.5009/gnl15502'
    ]
  },
  {
    name: 'losartan',
    categories: ['antihipertensivos', 'antagonistas de receptores de angiotensina ii'],
    actionMechanism: 'Bloqueo selectivo y competitivo de los receptores AT1 de la angiotensina II evitando la vasoconstriccion y la liberacion de aldosterona.',
    indications: [
      'Hipertension arterial esencial',
      'Proteccion renal en pacientes con diabetes mellitus tipo dos y proteinuria',
      'Reduccion del riesgo de accidente cerebrovascular en hipertrofia ventricular izquierda',
      'Insuficiencia cardiaca cuando los inhibidores de la eca no son tolerados'
    ],
    presentations: {
      'Comprimidos Recubiertos 50mg': {
        dosage: [
          {
            amount: '50-100',
            unit: 'mg',
            route: ['Oral'],
            useIn: 'Adultos'
          }
        ]
      },
      'Comprimidos Recubiertos 100mg': {
        dosage: [
          {
            amount: '100',
            unit: 'mg',
            route: ['Oral'],
            useIn: 'Adultos'
          }
        ]
      }
    },
    dosageGuidance: {
      adult: {
        'Oral': {
          guidelines: [
            'Dosis habitual de inicio y mantenimiento de 50 mg una vez al dia con o sin alimentos.',
            'Se puede incrementar a 100 mg una vez al dia segun control tensional a las tres a seis semanas.'
          ],
          maxDose: [
            '100 mg al dia en dosis unica o fraccionada en dos tomas.'
          ]
        }
      },
      pediatric: {
        'Oral': {
          guidelines: [
            'En ninos de mas de seis anos con peso entre 20 y 50 kg iniciar con 25 mg una vez al dia.',
            'En pacientes con peso mayor a 50 kg la dosis inicial es 50 mg una vez al dia.'
          ],
          maxDose: [
            '50 mg al dia en pacientes menores a 50 kg y 100 mg al dia en peso superior.'
          ]
        }
      }
    },
    risk: {
      pregnancy: 'Contraindicado de forma absoluta en segundo y tercer trimestre por dano y muerte fetal',
      lactation: 'No recomendado durante la lactancia materna por falta de datos suficientes',
      renal: {
        level: 'Monitoreo en insuficiencia renal moderada a severa',
        adjustment: 'No se requiere ajuste inicial pero debe monitorizarse la creatinina serica y el potasio.'
      },
      hepatic: {
        level: 'Ajuste de dosis en antecedentes de deterioro hepatico',
        adjustment: 'Iniciar con dosis reducida de 25 mg al dia en pacientes con historial de insuficiencia hepatica.'
      },
      geriatric: 'No suele requerirse ajuste de dosis salvo pacientes ancianos donde puede iniciarse con dosis menor',
      securityFlags: [
        'Riesgo de hipotension ortostatica grave en pacientes con deplecion de volumen intravascular',
        'Riesgo de hiperpotasemia en combinacion con farmacos ahorradores de potasio'
      ]
    },
    contraindications: [
      'Hipersensibilidad al principio activo o a cualquier excipiente',
      'Segundo y tercer trimestre del embarazo',
      'Insuficiencia hepatica grave',
      'Uso concomitante con aliskireno en pacientes diabeticos o con insuficiencia renal'
    ],
    interactions: [
      'Suplementos de potasio y diureticos ahorradores de potasio inducen hiperpotasemia',
      'Antiinflamatorios no esteroideos pueden atenuar el efecto antihipertensivo y deteriorar funcion renal',
      'Litio puede presentar aumento en concentraciones sericas y toxicidad asociada'
    ],
    adverseReactions: [
      'Mareo',
      'Hipotension postural',
      'Fatiga',
      'Hiperpotasemia',
      'Infecciones del tracto respiratorio superior'
    ],
    overdose: 'Manifestaciones principales son hipotension taquicardia o bradicardia vagal. Tratamiento con soporte hemodinamico y reposicion salina intravenosa.',
    references: [
      'Agencia Española de Medicamentos y Productos Sanitarios. (2023). Ficha técnica Losartán 50 mg comprimidos recubiertos con película. Centro de Información Online de Medicamentos (CIMA). https://cima.aemps.es',
      'Whelton, P. K., et al. (2018). 2017 ACC/AHA Guideline for the Prevention, Detection, Evaluation, and Management of High Blood Pressure in Adults. Journal of the American College of Cardiology, 71(19), e127-e248. https://doi.org/10.1016/j.jacc.2017.11.006'
    ]
  },
  {
    name: 'metformina',
    categories: ['antidiabeticos orales', 'biguanidas'],
    actionMechanism: 'Disminucion de la produccion hepatica de glucosa mediante inhibicion de la gluconeogenesis y glucogenolisis y aumento de la sensibilidad a la insulina periferica.',
    indications: [
      'Tratamiento de la diabetes mellitus tipo dos en monoterapia o combinacion',
      'Prevencion de la progresion a diabetes tipo dos en adultos con prediabetes',
      'Sindrome de ovario poliquistico con resistencia insulinica'
    ],
    presentations: {
      'Comprimidos Recubiertos 850mg': {
        dosage: [
          {
            amount: '850',
            unit: 'mg',
            route: ['Oral'],
            useIn: 'Ambos'
          }
        ]
      },
      'Comprimidos Recubiertos 1000mg': {
        dosage: [
          {
            amount: '1000',
            unit: 'mg',
            route: ['Oral'],
            useIn: 'Adultos'
          }
        ]
      }
    },
    dosageGuidance: {
      adult: {
        'Oral': {
          guidelines: [
            'Iniciar con 500 mg u 850 mg una vez al dia con las comidas principales para minimizar efectos gastrointestinales.',
            'Ajustar progresivamente cada diez a quince dias segun niveles de glucemia y hemoglobina glicosilada.'
          ],
          maxDose: [
            '2550 mg al dia divididos en dos o tres tomas.'
          ]
        }
      },
      pediatric: {
        'Oral': {
          guidelines: [
            'En ninos de mas de diez anos dosis inicial de 500 mg una vez al dia administrada durante o despues de las comidas.',
            'Ajuste gradual semanal segun tolerancia metabolica.'
          ],
          maxDose: [
            '2000 mg al dia divididos en dos o tres tomas.'
          ]
        }
      }
    },
    risk: {
      pregnancy: 'Categoria B compatible en mujeres con diabetes gestacional segun criterio clinico',
      lactation: 'Compatible con la lactancia materna al excretarse en leche materna en niveles insignificantes',
      renal: {
        level: 'Monitoreo estricto del filtrado glomerular estimado',
        adjustment: 'TFG 45 a 59 ml/min dosis maxima 1000 mg al dia; TFG 30 a 44 ml/min dosis maxima 500 mg al dia; contraindicar en TFG menor a 30 ml/min.'
      },
      hepatic: {
        level: 'Contraindicado en insuficiencia hepatica moderada a grave',
        adjustment: 'Evitar su uso por riesgo elevado de acumulacion de lactato y desarrollo de acidosis lactica.'
      },
      geriatric: 'Evaluar regularmente funcion renal basal por riesgo de deterioro y acumulacion del farmaco',
      securityFlags: [
        'Advertencia de recuadro negro por riesgo de acidosis lactica potencialmente letal',
        'Suspender dos dias antes de procedimientos quirurgicos mayores o con contraste radiologico yodado'
      ]
    },
    contraindications: [
      'Insuficiencia renal grave con filtrado glomerular marcadamente reducido',
      'Cualquier cuadro de acidosis metabolica aguda incluida acidosis lactica o cetoacidosis diabetica',
      'Estados hipoxicos agudos deshidratacion sepsis o shock cardiogenico',
      'Insuficiencia hepatica e intoxicacion alcoholica aguda'
    ],
    interactions: [
      'Medios de contraste radiologicos yodados aumentan riesgo de nefropatia inducida y acidosis lactica',
      'Alcohol etilico incrementa marcadamente el riesgo de acidosis lactica',
      'Farmacos cationicos eliminados por secrecion tubular compiten por vias de transporte'
    ],
    adverseReactions: [
      'Nauseas',
      'Vomitos',
      'Diarrea',
      'Dolor abdominal',
      'Perdida del apetito',
      'Sabor metalico',
      'Deficit de vitamina B doce en uso prolongado'
    ],
    overdose: 'La sobredosis masiva provoca acidosis lactica severa con hiperventilacion hipotermia y colapso cardiovascular. Requiere correccion hidroelectrolitica y hemodialisis de urgencia.',
    references: [
      'Agencia Española de Medicamentos y Productos Sanitarios. (2023). Ficha técnica Metformina 850 mg comprimidos recubiertos. Centro de Información Online de Medicamentos (CIMA). https://cima.aemps.es',
      'American Diabetes Association. (2024). Standards of Care in Diabetes—2024. Diabetes Care, 47(Suppl. 1), S1-S343. https://doi.org/10.2337/dc24-S001'
    ]
  },
  {
    name: 'atorvastatina',
    categories: ['hipolipemiantes', 'inhibidores de la hmg coa reductasa', 'estatinas'],
    actionMechanism: 'Inhibicion competitiva y selectiva de la 3 hidroxi 3 metilglutaril coenzima A reductasa limitando la sintesis hepatica de colesterol y sobreexpresando receptores de LDL.',
    indications: [
      'Hipercolesterolemia primaria y dislipidemia mixta',
      'Hipercolesterolemia familiar heterocigota y homocigota',
      'Prevencion secundaria de eventos cardiovasculares en pacientes con cardiopatia isquemica coronaria',
      'Prevencion primaria en adultos con alto riesgo cardiovascular'
    ],
    presentations: {
      'Comprimidos Recubiertos 20mg': {
        dosage: [
          {
            amount: '20',
            unit: 'mg',
            route: ['Oral'],
            useIn: 'Adultos'
          }
        ]
      },
      'Comprimidos Recubiertos 40mg': {
        dosage: [
          {
            amount: '40',
            unit: 'mg',
            route: ['Oral'],
            useIn: 'Adultos'
          }
        ]
      }
    },
    dosageGuidance: {
      adult: {
        'Oral': {
          guidelines: [
            'Dosis inicial habitual de 10 o 20 mg una vez al dia a cualquier hora con o sin alimentos.',
            'Ajustar cada cuatro semanas segun metas de colesterol LDL hasta un maximo de 80 mg al dia.'
          ],
          maxDose: [
            '80 mg al dia en toma unica diaria.'
          ]
        }
      },
      pediatric: {
        'Oral': {
          guidelines: [
            'En ninos mayores de diez anos con hipercolesterolemia familiar iniciar con 10 mg al dia.',
            'Monitorear desarrollo somatico y ajustar progresivamente segun respuesta lipidica.'
          ],
          maxDose: [
            '20 mg al dia en poblacion pediatrica.'
          ]
        }
      }
    },
    risk: {
      pregnancy: 'Contraindicado de forma absoluta en el embarazo por interferencia en la esteroidogenesis fetal',
      lactation: 'Contraindicado durante el periodo de lactancia materna por potencial de reacciones adversas graves en el lactante',
      renal: {
        level: 'Sin ajuste de dosis requerido en insuficiencia renal',
        adjustment: 'La eliminacion renal es minima inferior al dos por ciento; no precisa ajuste posologico.'
      },
      hepatic: {
        level: 'Contraindicado en enfermedad hepatica activa',
        adjustment: 'Evitar en cirrosis activa o con elevacion persistente e inexplicable de transaminasas mayor a tres veces el limite normal.'
      },
      geriatric: 'Eficacia y seguridad similar a la poblacion adulta pero requiere monitoreo de enzimas musculares',
      securityFlags: [
        'Riesgo de miopatia y rabdomiolisis con mioglobinuria e insuficiencia renal aguda',
        'Riesgo de aumento leve de glucemia basal en pacientes predispuestos a diabetes'
      ]
    },
    contraindications: [
      'Hipersensibilidad a la atorvastatina o excipientes de la formulacion',
      'Enfermedad hepatica activa o elevaciones persistentes no explicadas de transaminasas sericas',
      'Embarazo y periodo de lactancia materna activa',
      'Mujeres en edad fertil que no utilicen metodos anticonceptivos eficaces',
      'Coadministracion con antivirales inhibidores de la proteasa del VHC glecaprevir o pibrentasvir'
    ],
    interactions: [
      'Inhibidores potentes de citocromo P cuatrocientos cincuenta como claritromicina e itraconazol multiplican niveles y riesgo de rabdomiolisis',
      'Fibratos gemfibrozilo aumentan notablemente el riesgo de miopatia grave',
      'Zumo de pomelo toronja en cantidades superiores a un litro diario incrementa concentraciones plasmaticas'
    ],
    adverseReactions: [
      'Nasofaringitis',
      'Dolor faringolaringeo',
      'Epistaxis',
      'Hiperglucemia',
      'Mialgias',
      'Artralgias',
      'Dolor en extremidades',
      'Espasmos musculares',
      'Cefalea',
      'Estrenimiento y diarrea'
    ],
    overdose: 'No existe tratamiento especifico antídoto. Tratamiento de sosten sintomatico monitoreo de funcion hepatica y niveles sericos de creatina cinasa.',
    references: [
      'Agencia Española de Medicamentos y Productos Sanitarios. (2023). Ficha técnica Atorvastatina 20 mg comprimidos recubiertos con película. Centro de Información Online de Medicamentos (CIMA). https://cima.aemps.es',
      'Grundy, S. M., et al. (2019). 2018 AHA/ACC/AACVPR/AAPA/ABC/ACPM/ADA/AGS/APhA/ASPC/NLA/PCNA Guideline on the Management of Blood Cholesterol. Circulation, 139(25), e1082-e1143. https://doi.org/10.1161/CIR.0000000000000625'
    ]
  },
  {
    name: 'salbutamol',
    categories: ['broncodilatadores', 'agonistas beta dos adrenergicos selectivos'],
    actionMechanism: 'Estimulacion selectiva de los receptores beta dos adrenergicos del musculo liso bronquial activando la adenilato ciclasa y provocando broncodilatacion rapida.',
    indications: [
      'Alivio y prevencion del broncoespasmo en asma bronquial',
      'Tratamiento de la obstruccion reversible de vias respiratorias en bronquitis cronica y enfisema',
      'Profilaxis del broncoespasmo inducido por ejercicio o exposicion a alergenos'
    ],
    presentations: {
      'Suspension para Inhalacion 100mcg': {
        dosage: [
          {
            amount: '100-200',
            unit: 'mcg',
            route: ['Inhalatoria'],
            useIn: 'Ambos'
          }
        ]
      },
      'Solucion para Nebulizacion 5mg/ml': {
        dosage: [
          {
            amount: '2.5-5',
            unit: 'mg',
            route: ['Inhalatoria'],
            useIn: 'Ambos'
          }
        ]
      }
    },
    dosageGuidance: {
      adult: {
        'Inhalatoria': {
          guidelines: [
            'Alivio del broncoespasmo agudo una a dos inhalaciones de 100 mcg segun demanda.',
            'Prevencion de asma por ejercicio dos inhalaciones quince minutos antes de la actividad.'
          ],
          maxDose: [
            '800 mcg al dia equivalentes a ocho inhalaciones diarias.'
          ]
        }
      },
      pediatric: {
        'Inhalatoria': {
          guidelines: [
            'Alivio agudo en ninos una inhalacion de 100 mcg incrementable a dos si es necesario con camara espaciadora.',
            'Profilaxis de broncoespasmo por esfuerzo una inhalacion antes del ejercicio.'
          ],
          maxDose: [
            '400 mcg al dia equivalentes a cuatro inhalaciones en ninos menores de doce anos.'
          ]
        }
      }
    },
    risk: {
      pregnancy: 'Categoria C seguro en crisis aguda de asma donde el beneficio materno fetal supera el riesgo',
      lactation: 'Compatible con la lactancia materna por absorcion sistemica insignificante tras inhalacion',
      renal: {
        level: 'Sin ajuste necesario en administracion inhalatoria',
        adjustment: 'No se requieren ajustes de dosis por via inhalatoria en pacientes con alteracion renal.'
      },
      hepatic: {
        level: 'Sin ajuste necesario en administracion inhalatoria',
        adjustment: 'El metabolismo presistemico no compromete la seguridad por via inhalatoria.'
      },
      geriatric: 'Vigilar efectos cardiovasculares taquicardia e hipopotasemia en ancianos con cardiopatia',
      securityFlags: [
        'Riesgo de broncoespasmo paradojico potencialmente fatal tras inhalacion aguda',
        'Riesgo de hipopotasemia transitoria y arritmias cardiacas en dosis excesivas'
      ]
    },
    contraindications: [
      'Hipersensibilidad al salbutamol o a los componentes del aerosol',
      'Formulaciones inhalatorias no deben utilizarse en el manejo del parto prematuro o amenaza de aborto'
    ],
    interactions: [
      'Betabloqueantes no cardioselectivos como propranolol antagonizan el efecto broncodilatador',
      'Diureticos de asa y tiazidicos potencian el riesgo de hipopotasemia severa',
      'Antidepresivos triciclicos e IMAO potencian efectos cardiovasculares'
    ],
    adverseReactions: [
      'Temblor fino distal',
      'Cefalea',
      'Taquicardia',
      'Palpitaciones',
      'Calambres musculares',
      'Irritacion bucofaringea'
    ],
    overdose: 'Signos de sobredosis incluyen taquicardia hipopotasemia hiperglucemia y temblores marcados. El antidoto de eleccion es un betabloqueante cardioselectivo con extrema cautela en asmaticos.',
    references: [
      'Agencia Española de Medicamentos y Productos Sanitarios. (2023). Ficha técnica Salbutamol 100 microgramos por pulsación suspensión para inhalación. Centro de Información Online de Medicamentos (CIMA). https://cima.aemps.es',
      'Global Initiative for Asthma. (2024). Global Strategy for Asthma Management and Prevention (2024 update). GINA. https://ginasthma.org'
    ]
  }
];

async function runIngestion() {
  console.log(`Iniciando prueba de ingestión de ${drugsToIngest.length} fármacos prioritarios...`);
  
  let successCount = 0;
  const results = [];

  for (const drug of drugsToIngest) {
    try {
      console.log(`\nProcesando: ${drug.name}...`);
      
      // Comprobar si existe
      let exists = false;
      try {
        const checkRes = await axios.get(`${API_BASE}/drugs/${drug.name}`);
        if (checkRes.status === 200) {
          exists = true;
        }
      } catch (err) {
        if (err.response && err.response.status === 404) {
          exists = false;
        } else {
          throw err;
        }
      }

      let res;
      if (exists) {
        console.log(`Fármaco ya existe. Ejecutando PATCH...`);
        res = await axios.patch(`${API_BASE}/drugs/${drug.name}`, drug);
      } else {
        console.log(`Fármaco nuevo. Ejecutando POST...`);
        res = await axios.post(`${API_BASE}/drugs`, drug);
      }

      if (res.status === 200 || res.status === 201) {
        successCount++;
        results.push({ name: drug.name, operation: exists ? 'PATCH' : 'POST', success: true });
        console.log(`✓ Éxito para ${drug.name} (${exists ? 'Actualizado' : 'Insertado'})`);
      }
    } catch (error) {
      const errMsg = error.response ? JSON.stringify(error.response.data) : error.message;
      console.error(`✗ Error procesando ${drug.name}:`, errMsg);
      results.push({ name: drug.name, success: false, error: errMsg });
    }
  }

  console.log('\n========================================');
  console.log(`RESULTADO FINAL: ${successCount}/${drugsToIngest.length} procesados con éxito.`);
  console.log('========================================');
}

runIngestion();
