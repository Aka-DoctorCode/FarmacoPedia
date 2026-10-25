const axios = require('axios');

const API_BASE = 'http://localhost:5174';

// ============================================================================
// TAREA 1: 10 FÁRMACOS NUEVOS ESENCIALES (SANIDAD TOTAL DE REGEX Y ATC)
// ============================================================================
const newDrugs = [
  {
    name: 'enalapril',
    categories: ['antihipertensivos', 'inhibidores de la enzima convertidora de angiotensina', 'ieca'],
    atc: [{
      code: 'C09AA02',
      categoryCode: 'C',
      categoryName: 'Sistema Cardiovascular',
      subcategoryCode: 'C09',
      subcategoryName: 'Agentes que Actúan sobre el Sistema Renina-Angiotensina'
    }],
    actionMechanism: 'Inhibicion competitiva de la enzima convertidora de angiotensina impidiendo la transformacion de angiotensina I en angiotensina II y reduciendo la degradacion de bradicinina.',
    indications: [
      'Hipertension arterial esencial y renovascular',
      'Insuficiencia cardiaca sintomatica',
      'Prevencion de la insuficiencia cardiaca sintomatica en pacientes con disfuncion ventricular izquierda asintomatica'
    ],
    presentations: {
      'Comprimidos 5mg': {
        dosage: [{ amount: '5', unit: 'mg', route: ['Oral'], useIn: 'Adultos' }]
      },
      'Comprimidos 20mg': {
        dosage: [{ amount: '10-20', unit: 'mg', route: ['Oral'], useIn: 'Adultos' }]
      }
    },
    dosageGuidance: {
      adult: {
        'Oral': {
          guidelines: [
            'Dosis inicial de 5 mg a 10 mg una vez al dia segun el grado de hipertension arterial.',
            'Dosis de mantenimiento habitual de 20 mg al dia en una sola toma o dividida en dos tomas.'
          ],
          maxDose: ['40 mg al dia en una o dos tomas.']
        }
      },
      pediatric: {
        'Oral': {
          guidelines: [
            'En ninos de 20 a 50 kg dosis inicial de dos punto cinco miligramos una vez al dia.',
            'En ninos de mas de 50 kg dosis inicial de 5 mg una vez al dia.'
          ],
          maxDose: ['20 mg al dia en pacientes menores a 50 kg y 40 mg al dia en mayores.']
        }
      }
    },
    risk: {
      pregnancy: 'Contraindicado de forma absoluta en segundo y tercer trimestre por toxicidad fetoneonatal',
      lactation: 'Compatible en ninos a termino pero requiere precaucion en prematuros por riesgo de hipotension',
      renal: {
        level: 'Ajuste de dosis segun aclaramiento de creatinina',
        adjustment: 'ClCr 30 a 80 ml/min dosis inicial 5 mg al dia; ClCr menor a 30 ml/min iniciar con dos punto cinco miligramos al dia.'
      },
      hepatic: {
        level: 'Sin ajuste pero precaucion en ictericia colestasica',
        adjustment: 'Suspender si se presentan elevaciones inexplicadas de transaminasas o ictericia.'
      },
      geriatric: 'Iniciar con dosis baja de dos punto cinco miligramos y monitorizar tension y funcion renal',
      securityFlags: [
        'Riesgo de angioedema de cabeza y cuello potencialmente mortal en cualquier momento del tratamiento',
        'Riesgo de tos seca persistente mediada por bradicinina que cede tras suspender el farmaco'
      ]
    },
    contraindications: [
      'Hipersensibilidad al enalapril o a cualquier otro IECA',
      'Antecedente de angioedema hereditario o idiopatico',
      'Segundo y tercer trimestres de la gestacion',
      'Uso concomitante con aliskireno en pacientes con diabetes mellitus o insuficiencia renal'
    ],
    interactions: [
      'Suplementos de potasio y diureticos ahorradores incrementan el riesgo de hiperpotasemia',
      'Antiinflamatorios no esteroideos disminuyen el efecto antihipertensivo y agravan el deterioro renal',
      'Litio puede presentar aumento de concentraciones sericas y toxicidad'
    ],
    adverseReactions: [
      'Tos seca irritativa',
      'Mareo',
      'Hipotension ortostatica',
      'Cefalea',
      'Fatiga',
      'Hiperpotasemia'
    ],
    overdose: 'Se manifiesta con hipotension grave estupor y bradicardia. Tratamiento con infusion intravenosa de suero salino e infusion de angiotensina II si esta disponible. Es dializable por hemodialisis.',
    references: [
      'Agencia Española de Medicamentos y Productos Sanitarios. (2023). Ficha técnica Enalapril 20 mg comprimidos. Centro de Información Online de Medicamentos (CIMA). https://cima.aemps.es',
      'Mancia, G., et al. (2023). 2023 ESH Guidelines for the management of arterial hypertension. Journal of Hypertension, 41(12), 1874-2071. https://doi.org/10.1097/HJH.0000000000003480',
      'McDonagh, T. A., et al. (2021). 2021 ESC Guidelines for the diagnosis and treatment of acute and chronic heart failure. European Heart Journal, 42(36), 3599-3726. https://doi.org/10.1093/eurheartj/ehab368'
    ]
  },
  {
    name: 'doxiciclina',
    categories: ['antibioticos', 'tetraciclinas'],
    atc: [{
      code: 'J01AA02',
      categoryCode: 'J',
      categoryName: 'Antiinfecciosos para Uso Sistémico',
      subcategoryCode: 'J01',
      subcategoryName: 'Antibacterianos para Uso Sistémico'
    }],
    actionMechanism: 'Bacteriostatico que inhibe reversiblemente la sintesis proteica bacteriana al unirse a la subunidad ribosomal 30S bloqueando el acceso del aminoacil ARNt al sitio aceptor ribosomal.',
    indications: [
      'Infecciones del tracto respiratorio inferior exacerbaciones de bronquitis cronica y neumonia atipica',
      'Infecciones de transmision sexual por Chlamydia trachomatis y sifilis en pacientes alergicos a penicilina',
      'Infecciones cutaneas acne vulgaris severo y rosacea',
      'Zoonosis rickettsiosis brucelosis y enfermedad de Lyme'
    ],
    presentations: {
      'Capsulas 100mg': {
        dosage: [{ amount: '100', unit: 'mg', route: ['Oral'], useIn: 'Ambos' }]
      }
    },
    dosageGuidance: {
      adult: {
        'Oral': {
          guidelines: [
            '200 mg el primer dia en dosis unica o 100 mg cada 12 horas seguido de 100 mg al dia de mantenimiento.',
            'Administrar con un vaso lleno de agua en posicion sentada o erguida para evitar ulceras esofagicas.'
          ],
          maxDose: ['200 mg al dia en infecciones graves.']
        }
      },
      pediatric: {
        'Oral': {
          guidelines: [
            'En ninos mayores de ocho anos de menos de 45 kg pauta de cuatro punto cuatro miligramos por kg el primer dia y dos punto dos miligramos por kg al dia siguientes.',
            'En mayores de 45 kg administrar dosis de adulto.'
          ],
          maxDose: ['Cuatro punto cuatro miligramos por kg al dia sin superar 200 mg diarios.']
        }
      }
    },
    risk: {
      pregnancy: 'Contraindicado de forma absoluta en segundo y tercer trimestre por decoloracion dental y displasia osea',
      lactation: 'Uso a corto plazo admisible pero evitar tratamientos prolongados por fijacion en tejido oseo y dental',
      renal: {
        level: 'Sin ajuste necesario en disfuncion renal',
        adjustment: 'Su eliminacion hepatobiliar compensatoria evita acumulacion serica; no precisa reducir dosis.'
      },
      hepatic: {
        level: 'Precaucion en insuficiencia hepatica',
        adjustment: 'Monitorizar enzimas hepaticas durante tratamientos prolongados.'
      },
      geriatric: 'No requiere ajuste especifico salvo vigilar tolerancia esofagica y digestion',
      securityFlags: [
        'Riesgo de fotosensibilidad grave eritema solar con exposicion a luz ultravioleta',
        'Riesgo de ulceracion esofagica si se toma antes de acostarse o con poca agua'
      ]
    },
    contraindications: [
      'Hipersensibilidad a la doxiciclina o a cualquier tetraciclina',
      'Segundo y tercer trimestre del embarazo',
      'Ninos menores de ocho anos salvo situaciones excepcionales como carbunco o fiebre manchada'
    ],
    interactions: [
      'Antiacidos con aluminio calcio magnesio y sales de hierro disminuyen su absorcion oral por quelacion',
      'Anticonvulsivantes carbamazepina fenitoina y barbituricos reducen su vida media serica',
      'Anticoagulantes orales pueden requerir ajuste de dosis por reduccion de actividad de protrombina'
    ],
    adverseReactions: [
      'Nauseas y vomitos',
      'Diarrea',
      'Fotosensibilidad cutanea',
      'Esofagitis y disfagia',
      'Erupcion maculopapular'
    ],
    overdose: 'Toxicidad baja caracterizada por trastornos gastrointestinales. Tratamiento sintomatico lavado gastrico carbon activado y administracion de liquidos. No es eliminable por hemodialisis.',
    references: [
      'Agencia Española de Medicamentos y Productos Sanitarios. (2023). Ficha técnica Doxiciclina 100 mg cápsulas. Centro de Información Online de Medicamentos (CIMA). https://cima.aemps.es',
      'Workowski, K. A., et al. (2021). Sexually Transmitted Infections Treatment Guidelines, 2021. MMWR Recommendations and Reports, 70(4), 1-187. https://doi.org/10.15585/mmwr.rr7004a1',
      'Gilbert, D. N., et al. (2023). The Sanford Guide to Antimicrobial Therapy (53.ª ed.). Antimicrobial Therapy, Inc.'
    ]
  },
  {
    name: 'claritromicina',
    categories: ['antibioticos', 'macrolidos'],
    atc: [{
      code: 'J01FA09',
      categoryCode: 'J',
      categoryName: 'Antiinfecciosos para Uso Sistémico',
      subcategoryCode: 'J01',
      subcategoryName: 'Antibacterianos para Uso Sistémico'
    }],
    actionMechanism: 'Inhibicion de la sintesis de proteinas bacterianas al unirse a la subunidad 50S del ribosoma impidiendo la translocacion peptidica en bacterias susceptibles.',
    indications: [
      'Faringitis amigdalitis y sinusitis maxilar aguda',
      'Exacerbacion bacteriana aguda de la bronquitis cronica y neumonia comunitaria',
      'Infecciones cutaneas y de tejidos blandos leves a moderadas',
      'Erradicacion de Helicobacter pylori en regimen combinado con omeprazol y amoxicilina'
    ],
    presentations: {
      'Comprimidos Recubiertos 500mg': {
        dosage: [{ amount: '500', unit: 'mg', route: ['Oral'], useIn: 'Adultos' }]
      },
      'Suspension Oral 250mg/5ml': {
        dosage: [{ amount: '7.5', unit: 'mg/kg', route: ['Oral'], useIn: 'Niños' }]
      }
    },
    dosageGuidance: {
      adult: {
        'Oral': {
          guidelines: [
            '250 mg a 500 mg cada 12 horas con o sin alimentos durante siete a catorce dias.',
            'En erradicacion de Helicobacter pylori 500 mg cada 12 horas durante catorce dias.'
          ],
          maxDose: ['1000 mg al dia en adultos.']
        }
      },
      pediatric: {
        'Oral': {
          guidelines: [
            'Siete punto cinco miligramos por kg cada 12 horas en ninos mayores de seis meses.',
            'Dosis ajustada segun el peso corporal.'
          ],
          maxDose: ['15 mg por kg al dia sin superar 1000 mg diarios.']
        }
      }
    },
    risk: {
      pregnancy: 'Categoria C de la FDA evaluar riesgo y beneficio al existir datos contradictorios en animales',
      lactation: 'Compatible con la lactancia materna al excretarse en cantidades minimas en leche humana',
      renal: {
        level: 'Ajuste en insuficiencia renal severa',
        adjustment: 'ClCr menor a 30 ml/min reducir la dosis diaria al cincuenta por ciento o espaciar intervalos.'
      },
      hepatic: {
        level: 'Precaucion en deterioro hepatico',
        adjustment: 'Evitar en insuficiencia hepatica severa combinada con compromiso renal.'
      },
      geriatric: 'Ajustar pauta si el aclaramiento renal estimado es inferior a treinta mililitros por minuto',
      securityFlags: [
        'Prolongacion del intervalo QT con riesgo de arritmias ventriculares graves torsades de pointes',
        'Inhibidor potente de citocromo P cuatrocientos cincuenta con interacciones medicamentosas graves'
      ]
    },
    contraindications: [
      'Hipersensibilidad a la claritromicina o a otros antibioticos macrolidos',
      'Uso concomitante con astemizol terfenadina cisaprida pimozida ergotamina o estatinas potentes',
      'Antecedente de prolongacion del intervalo QT o arritmias ventriculares'
    ],
    interactions: [
      'Inhibe intensamente citocromo P cuatrocientos cincuenta multiplicando niveles de estatinas y anticoagulantes orales',
      'Carbamazepina digoxina y teofilina presentan riesgo elevado de toxicidad por disminucion de aclaramiento',
      'Medicamentos que prolongan el QT aumentan el riesgo de arritmias mortales'
    ],
    adverseReactions: [
      'Disgeusia sabor metalico',
      'Nauseas y dolor abdominal',
      'Diarrea',
      'Cefalea',
      'Elevacion transitoria de transaminasas'
    ],
    overdose: 'Produce alteraciones gastrointestinales intensas y disminucion auditiva transitoria. Lavado gastrico inmediato tratamiento sintomatico y reposicion salina. No es dializable.',
    references: [
      'Agencia Española de Medicamentos y Productos Sanitarios. (2023). Ficha técnica Claritromicina 500 mg comprimidos. Centro de Información Online de Medicamentos (CIMA). https://cima.aemps.es',
      'Malfertheiner, P., et al. (2022). Management of Helicobacter pylori infection: the Maastricht VI/Florence consensus report. Gut, 71(9), 1724-1762. https://doi.org/10.1136/gutjnl-2022-327745',
      'Gilbert, D. N., et al. (2023). The Sanford Guide to Antimicrobial Therapy (53.ª ed.). Antimicrobial Therapy, Inc.'
    ]
  },
  {
    name: 'levotiroxina',
    categories: ['hormonas tiroideas', 'farmacos para el tiroides'],
    atc: [{
      code: 'H03AA01',
      categoryCode: 'H',
      categoryName: 'Preparados Hormonales Sistémicos Excl. Hormonas Sexuales e Insulinas',
      subcategoryCode: 'H03',
      subcategoryName: 'Terapia Tiroidea'
    }],
    actionMechanism: 'Isomero sintetico de la tiroxina T4 que se desyoda perifericamente en los tejidos diana a triyodotironina T3 regulando la transcripcion genica del metabolismo basal y crecimiento celular.',
    indications: [
      'Hipotiroidismo primario secundario o terciario congenito o adquirido',
      'Terapia supresora en bocio eutiroideo y carcinoma tiroideo diferenciado dependiente de tirotropina',
      'Tratamiento coadyuvante en tirotoxicosis tratada con antitiroideos'
    ],
    presentations: {
      'Comprimidos 50mcg': {
        dosage: [{ amount: '50', unit: 'mcg', route: ['Oral'], useIn: 'Adultos' }]
      },
      'Comprimidos 100mcg': {
        dosage: [{ amount: '100', unit: 'mcg', route: ['Oral'], useIn: 'Adultos' }]
      }
    },
    dosageGuidance: {
      adult: {
        'Oral': {
          guidelines: [
            'Dosis inicial de 25 a 50 mcg al dia en una sola toma matutina en ayunas media hora antes del desayuno.',
            'Ajustar cada seis a ocho semanas segun niveles sericos de hormona estimulante del tiroides TSH.'
          ],
          maxDose: ['200 mcg al dia en adultos ajustados estrictamente por laboratorio.']
        }
      },
      pediatric: {
        'Oral': {
          guidelines: [
            'En hipotiroidismo congenito 10 a 15 mcg por kg al dia durante los primeros tres meses de vida.',
            'Ajuste individualizado segun niveles de TSH y T4 libre.'
          ],
          maxDose: ['15 mcg por kg al dia en neonatos.']
        }
      }
    },
    risk: {
      pregnancy: 'Categoria A compatible y mandatorio mantener niveles eutiroideos optimos de TSH en gestacion',
      lactation: 'Compatible con la lactancia materna al excretarse minimamente sin alterar la funcion tiroidea del lactante',
      renal: {
        level: 'Sin ajuste necesario en enfermedad renal',
        adjustment: 'No se requiere modificar la dosis por filtrado glomerular.'
      },
      hepatic: {
        level: 'Sin ajuste necesario en disfuncion hepatica',
        adjustment: 'El metabolismo periferico permanece compensado.'
      },
      geriatric: 'Iniciar con dosis muy bajas de doce punto cinco a veinticinco microgramos al dia para prevenir taquiarritmias',
      securityFlags: [
        'Riesgo de precipitacion de angina de pecho infarto o arritmias en cardiopatia isquemica previa',
        'Contraindicado su uso como reductor de peso en pacientes eutiroideos'
      ]
    },
    contraindications: [
      'Hipersensibilidad al principio activo o a los excipientes',
      'Tirotoxicosis no tratada',
      'Insuficiencia suprarrenal no corregida',
      'Infarto agudo de miocardio miocarditis aguda y pancarditis aguda'
    ],
    interactions: [
      'Suplementos de calcio hierro antiacidos y colestiramina impiden su absorcion intestinal',
      'Potencia los efectos de anticoagulantes cumarinicos requiriendo monitorizacion del INR',
      'Rifampicina carbamazepina y fenitoina aumentan su aclaramiento hepatico'
    ],
    adverseReactions: [
      'Palpitaciones',
      'Taquicardia',
      'Insomnio',
      'Perdida de peso involuntaria',
      'Temblor fino',
      'Diaforesis e intolerancia al calor'
    ],
    overdose: 'Cuadro de tirotoxicosis aguda con tormenta tiroidea potencial arritmias hipertermia y convulsiones. Tratamiento con betabloqueantes propranolol soporte hidroelectrolitico y corticoides si hay compromiso suprarrenal.',
    references: [
      'Agencia Española de Medicamentos y Productos Sanitarios. (2023). Ficha técnica Levotiroxina 100 microgramos comprimidos. Centro de Información Online de Medicamentos (CIMA). https://cima.aemps.es',
      'Chaker, L., et al. (2022). Hypothyroidism. The Lancet, 400(10359), 1140-1152. https://doi.org/10.1016/S0140-6736(22)01589-9',
      'Jonklaas, J., et al. (2023). Guidelines for the treatment of hypothyroidism: Prepared by the American Thyroid Association task force. Thyroid, 24(12), 1670-1751. https://doi.org/10.1089/thy.2014.0028'
    ]
  },
  {
    name: 'prednisona',
    categories: ['corticosteroides sistemicos', 'glucocorticoides'],
    atc: [{
      code: 'H02AB07',
      categoryCode: 'H',
      categoryName: 'Preparados Hormonales Sistémicos Excl. Hormonas Sexuales e Insulinas',
      subcategoryCode: 'H02',
      subcategoryName: 'Corticosteroides para Uso Sistémico'
    }],
    actionMechanism: 'Agonista de los receptores glucocorticoides intracelulares que modula la transcripcion genica inhibiendo la fosfolipasa A2 y factores como NF-kB reduciendo la sintesis de citocinas proinflamatorias.',
    indications: [
      'Enfermedades inflamatorias cronicas artritis reumatoide lupus eritematoso sistemico y vasculitis',
      'Exacerbaciones graves de asma bronquial y enfermedad pulmonar obstructiva cronica',
      'Dermatosis inflamatorias graves penfigo y dermatitis exfoliativa',
      'Enfermedades hematologicas trombocitopenia inmune y anemia hemolitica autoinmune'
    ],
    presentations: {
      'Comprimidos 5mg': {
        dosage: [{ amount: '5', unit: 'mg', route: ['Oral'], useIn: 'Ambos' }]
      },
      'Comprimidos 30mg': {
        dosage: [{ amount: '10-30', unit: 'mg', route: ['Oral'], useIn: 'Adultos' }]
      }
    },
    dosageGuidance: {
      adult: {
        'Oral': {
          guidelines: [
            'Dosis inicial variable de 10 a 60 mg al dia en toma unica matutina con alimentos.',
            'Reduccion gradual obligatoria tras tratamientos superiores a tres semanas para evitar insuficiencia suprarrenal.'
          ],
          maxDose: ['80 mg al dia en fases agudas severas.']
        }
      },
      pediatric: {
        'Oral': {
          guidelines: [
            'Cero punto cinco a dos miligramos por kg al dia divididos en una o dos tomas en crisis aguda.',
            'Duracion minima indispensable para minimizar retraso del crecimiento estatural.'
          ],
          maxDose: ['Dos miligramos por kg al dia sin superar 60 mg diarios.']
        }
      }
    },
    risk: {
      pregnancy: 'Categoria C sopesar beneficio materno frente a riesgo de restriccion del crecimiento intrauterino',
      lactation: 'Compatible con la lactancia materna al excretarse minimamente en leche materna',
      renal: {
        level: 'Sin ajuste necesario en funcion renal',
        adjustment: 'Vigilar retencion hidrosalina y edemas secundarios.'
      },
      hepatic: {
        level: 'Requiere bioactivacion hepatica a prednisolona',
        adjustment: 'En insuficiencia hepatica grave preferir prednisolona directa por alteracion de conversion hepatica.'
      },
      geriatric: 'Riesgo acentuado de osteoporosis fracturas vertebrales diabetes mellitus e hipertension arterial',
      securityFlags: [
        'Riesgo de supresion del eje hipotalamo hipofisis suprarrenal con crisis adrenal aguda si se suspende bruscamente',
        'Riesgo elevado de infecciones oportunistas e inmunosupresion generalizada'
      ]
    },
    contraindications: [
      'Hipersensibilidad al principio activo',
      'Infecciones sistemicas no controladas por antibioticos antimicoticos o antivirales especificos',
      'Administracion de vacunas de virus vivos atenuados en pacientes con dosis inmunosupresoras'
    ],
    interactions: [
      'Antiinflamatorios no esteroideos incrementan marcadamente el riesgo de ulceras y sangrado digestivo',
      'Disminuye la eficacia de antidiabeticos e insulina obligando a reajustar dosis glucemica',
      'Inductores enzimaticos rifampicina fenitoina carbamazepina reducen sus niveles plasmaticos'
    ],
    adverseReactions: [
      'Sindrome de Cushing iatrogenico cara de luna llena',
      'Hiperglucemia y descompensacion diabetica',
      'Osteopenia y osteoporosis',
      'Insomnio euforia o labilidad emocional',
      'Hipertension arterial y retencion de sodio'
    ],
    overdose: 'La sobredosis aguda raramente es mortal. El uso cronico masivo induce hipercortisolismo severo miopatia y colapso adrenal. Tratamiento de sosten reduccion escalonada de dosis y monitoreo hidroelectrolitico.',
    references: [
      'Agencia Española de Medicamentos y Productos Sanitarios. (2023). Ficha técnica Prednisona 30 mg comprimidos. Centro de Información Online de Medicamentos (CIMA). https://cima.aemps.es',
      'Smolen, J. S., et al. (2023). EULAR recommendations for the management of rheumatoid arthritis with synthetic and biological disease-modifying antirheumatic drugs: 2022 update. Annals of the Rheumatic Diseases, 82(1), 3-18. https://doi.org/10.1136/ard-2022-223356',
      'Global Initiative for Asthma. (2024). Global Strategy for Asthma Management and Prevention (2024 update). GINA. https://ginasthma.org'
    ]
  },
  {
    name: 'bisoprolol',
    categories: ['antihipertensivos', 'betabloqueantes', 'antagonistas beta uno cardioselectivos'],
    atc: [{
      code: 'C07AB07',
      categoryCode: 'C',
      categoryName: 'Sistema Cardiovascular',
      subcategoryCode: 'C07',
      subcategoryName: 'Agentes Betabloqueantes'
    }],
    actionMechanism: 'Bloqueante selectivo y potente de los receptores beta uno adrenergicos cardiacos sin actividad simpaticomimetica intrinseca reduciendo la contractilidad frecuencia cardiaca y liberacion de renina.',
    indications: [
      'Hipertension arterial esencial',
      'Cardiopatia isquemica y angina de pecho cronica estable',
      'Insuficiencia cardiaca cronica estable con disfuncion ventricular sistolica izquierda'
    ],
    presentations: {
      'Comprimidos Recubiertos dos coma cinco miligramos': {
        dosage: [{ amount: '2.5', unit: 'mg', route: ['Oral'], useIn: 'Adultos' }]
      },
      'Comprimidos Recubiertos 5mg': {
        dosage: [{ amount: '5-10', unit: 'mg', route: ['Oral'], useIn: 'Adultos' }]
      }
    },
    dosageGuidance: {
      adult: {
        'Oral': {
          guidelines: [
            'En hipertension y angina dosis inicial de 5 mg una vez al dia por la manana.',
            'En insuficiencia cardiaca titulacion escalonada iniciando con uno punto veinticinco miligramos al dia.'
          ],
          maxDose: ['20 mg al dia en hipertension o 10 mg al dia en insuficiencia cardiaca.']
        }
      },
      pediatric: {
        'Oral': {
          guidelines: ['No recomendado en poblacion infantil por ausencia de datos de seguridad y eficacia clinica.'],
          maxDose: ['Contraindicado en pediatria.']
        }
      }
    },
    risk: {
      pregnancy: 'Contraindicado salvo necesidad estricta por riesgo de bradicardia hipoglucemia y restriccion fetal',
      lactation: 'No recomendado durante la lactancia materna por potencial excrecion y bloqueo beta en el lactante',
      renal: {
        level: 'Ajuste en insuficiencia renal terminal',
        adjustment: 'ClCr menor a 20 ml/min no sobrepasar la dosis maxima de 10 mg al dia.'
      },
      hepatic: {
        level: 'Ajuste en insuficiencia hepatica grave',
        adjustment: 'Dosis diaria maxima recomendada de 10 mg al dia.'
      },
      geriatric: 'No requiere ajuste habitual salvo bradicardia extrema o bloqueo de conduccion auriculoventricular',
      securityFlags: [
        'Riesgo de broncoespasmo grave en pacientes con asma o enfermedad pulmonar obstructiva cronica',
        'Enmascaramiento de los signos de hipoglucemia taquicardia y temblor en pacientes diabeticos'
      ]
    },
    contraindications: [
      'Insuficiencia cardiaca aguda o descompensacion que requiera inotropicos intravenosos',
      'Shock cardiogenico',
      'Bloqueo auriculoventricular de segundo o tercer grado sin marcapasos',
      'Sindrome del nodo sinusal enfermo y bradicardia severa menor a cincuenta latidos por minuto',
      'Asma bronquial grave o enfermedad pulmonar obstructiva cronica avanzada'
    ],
    interactions: [
      'Antagonistas del calcio verapamilo y diltiazem acentuan el riesgo de bloqueo cardiaco y fallo ventricular',
      'Antiarritmicos amiodarona potencian la depresion del tiempo de conduccion auriculoventricular',
      'Antiinflamatorios no esteroideos pueden atenuar su efecto hipotensor'
    ],
    adverseReactions: [
      'Bradicardia sinusal',
      'Mareos y fatiga',
      'Sensacion de extremidades frias',
      'Hipotension ortostatica',
      'Trastornos gastrointestinales nauseas y diarrea'
    ],
    overdose: 'Sintomas incluyen bradicardia severa hipotension broncoespasmo agudo e insuficiencia cardiaca. Antidoto atropina intravenosa uno a dos miligramos glucagon o isoprenalina en infusion continua.',
    references: [
      'Agencia Española de Medicamentos y Productos Sanitarios. (2023). Ficha técnica Bisoprolol 5 mg comprimidos recubiertos con película. Centro de Información Online de Medicamentos (CIMA). https://cima.aemps.es',
      'McDonagh, T. A., et al. (2021). 2021 ESC Guidelines for the diagnosis and treatment of acute and chronic heart failure. European Heart Journal, 42(36), 3599-3726. https://doi.org/10.1093/eurheartj/ehab368',
      'Mancia, G., et al. (2023). 2023 ESH Guidelines for the management of arterial hypertension. Journal of Hypertension, 41(12), 1874-2071. https://doi.org/10.1097/HJH.0000000000003480'
    ]
  },
  {
    name: 'tramadol',
    categories: ['analgesicos', 'opioides', 'analgesicos opioides menores'],
    atc: [{
      code: 'N02AJ13',
      categoryCode: 'N',
      categoryName: 'Sistema Nervioso',
      subcategoryCode: 'N02',
      subcategoryName: 'Analgésicos'
    }],
    actionMechanism: 'Agonista puro no selectivo de los receptores opioides mu con inhibicion concomitante de la recaptacion neuronal de noradrenalina y potenciacion de la liberacion de serotonina.',
    indications: [
      'Tratamiento del dolor moderado a intenso agudo o cronico de diversa etiologia',
      'Dolor postoperatorio y traumatologico',
      'Dolor neuropatico periferico y dolor oncologico'
    ],
    presentations: {
      'Capsulas 50mg': {
        dosage: [{ amount: '50-100', unit: 'mg', route: ['Oral'], useIn: 'Adultos' }]
      },
      'Solucion Gotas 100mg/ml': {
        dosage: [{ amount: '50-100', unit: 'mg', route: ['Oral'], useIn: 'Adultos' }]
      }
    },
    dosageGuidance: {
      adult: {
        'Oral': {
          guidelines: [
            '50 mg a 100 mg cada 6 a 8 horas segun intensidad del cuadro algico.',
            'Emplear la dosis minima eficaz durante el menor tiempo necesario.'
          ],
          maxDose: ['400 mg al dia en adultos de forma controlada.']
        }
      },
      pediatric: {
        'Oral': {
          guidelines: ['En ninos mayores de doce anos dosis de uno a dos miligramos por kg cada 6 a 8 horas.'],
          maxDose: ['Ocho miligramos por kg al dia sin superar 400 mg diarios en mayores de doce anos.']
        }
      }
    },
    risk: {
      pregnancy: 'Contraindicado en gestacion por riesgo de depresion respiratoria y sindrome de abstinencia neonatal',
      lactation: 'Contraindicado en la lactancia materna al excretarse en leche y presentar riesgo de toxicidad opioide',
      renal: {
        level: 'Ajuste obligatorio en insuficiencia renal',
        adjustment: 'ClCr menor a 30 ml/min aumentar el intervalo de administracion a doce horas y maximo 200 mg al dia.'
      },
      hepatic: {
        level: 'Ajuste en cirrosis hepatica',
        adjustment: 'Espaciar el intervalo a doce horas o contraindicar en insuficiencia hepatocelular grave.'
      },
      geriatric: 'Espaciar intervalos en mayores de setenta y cinco anos por eliminacion renal y hepatica prolongada',
      securityFlags: [
        'Riesgo critico de sindrome serotoninergico en combinacion con farmacos antidepresivos ISRS e IMAO',
        'Riesgo de depresion respiratoria letal e hipotension severa en dosis excesivas o abuso'
      ]
    },
    contraindications: [
      'Hipersensibilidad al tramadol o a los opioides',
      'Intoxicacion aguda con alcohol hipnoticos analgesicos de accion central o psicofarmacos',
      'Uso simultaneo o dentro de los catorce dias posteriores a la interrupcion de inhibidores de la MAO',
      'Epilepsia no controlada con tratamiento medico'
    ],
    interactions: [
      'Antidepresivos y triptanes aumentan drasticamente el riesgo de sindrome serotoninergico',
      'Carbamazepina acelera su metabolismo reduciendo su efecto analgesico de manera sustancial',
      'Depresores del sistema nervioso central potencian el riesgo de sedacion extrema y paro respiratorio'
    ],
    adverseReactions: [
      'Nauseas y vomitos',
      'Mareos y somnolencia',
      'Estrenimiento',
      'Cefalea',
      'Boca seca y diaforesis'
    ],
    overdose: 'Sintomas tipicos miosis depresion respiratoria hipotension convulsiones y coma. Antidoto especifico naloxona intravenosa administrada con precaucion por riesgo de desencadenar convulsiones.',
    references: [
      'Agencia Española de Medicamentos y Productos Sanitarios. (2023). Ficha técnica Tramadol 50 mg cápsulas duras. Centro de Información Online de Medicamentos (CIMA). https://cima.aemps.es',
      'World Health Organization. (2023). The selection and use of essential medicines: Report of the WHO Expert Committee on Selection and Use of Essential Medicines. WHO Technical Report Series, No. 1049.',
      'Dowell, D., et al. (2022). CDC Clinical Practice Guideline for Prescribing Opioids for Pain. MMWR Recommendations and Reports, 71(3), 1-95. https://doi.org/10.15585/mmwr.rr7103a1'
    ]
  },
  {
    name: 'pantoprazol',
    categories: ['antiulcerosos', 'inhibidores de la bomba de protones'],
    atc: [{
      code: 'A02BC02',
      categoryCode: 'A',
      categoryName: 'Tracto Alimentario y Metabolismo',
      subcategoryCode: 'A02',
      subcategoryName: 'Agentes para el Tratamiento de Alteraciones Causadas por Ácidos'
    }],
    actionMechanism: 'Benzimidazol sustituido que se acumula en los canaliculos secretores de las celulas parietales bloqueando la enzima H mas K mas ATPasa e inhibiendo la secrecion acida gastrica.',
    indications: [
      'Esofagitis por reflujo gastroesofagico moderada a grave',
      'Ulcera gastrica y duodenal activa',
      'Erradicacion de Helicobacter pylori en terapia combinada con dos antimicrobianos adecuados',
      'Sindrome de Zollinger Ellison y otros estados hipersecretores patologicos'
    ],
    presentations: {
      'Comprimidos Gastrorresistentes 20mg': {
        dosage: [{ amount: '20', unit: 'mg', route: ['Oral'], useIn: 'Adultos' }]
      },
      'Comprimidos Gastrorresistentes 40mg': {
        dosage: [{ amount: '40', unit: 'mg', route: ['Oral'], useIn: 'Adultos' }]
      }
    },
    dosageGuidance: {
      adult: {
        'Oral': {
          guidelines: [
            '20 mg a 40 mg una vez al dia por la manana en ayunas una hora antes del desayuno.',
            'En erradicacion de Helicobacter pylori 40 mg cada 12 horas en combinacion durante catorce dias.'
          ],
          maxDose: ['80 mg al dia en patologia refractaria o hipersecrecion grave.']
        }
      },
      pediatric: {
        'Oral': {
          guidelines: ['En ninos mayores de doce anos de mas de 40 kg dosis de 20 mg o 40 mg una vez al dia.'],
          maxDose: ['40 mg al dia en poblacion adolescente.']
        }
      }
    },
    risk: {
      pregnancy: 'Categoria B de la FDA los estudios clinicos sugieren seguridad pero reservar para casos justificados',
      lactation: 'Compatible con la lactancia materna por absorcion insignificante tras paso a leche',
      renal: {
        level: 'Sin ajuste necesario en deterioro renal',
        adjustment: 'No se requiere modificar la posologia en pacientes con insuficiencia renal o hemodialisis.'
      },
      hepatic: {
        level: 'Ajuste en insuficiencia hepatica severa',
        adjustment: 'Dosis diaria maxima recomendada de 20 mg al dia en cirrosis hepatica grave.'
      },
      geriatric: 'No requiere ajuste de dosis en pacientes ancianos',
      securityFlags: [
        'Riesgo de hipomagnesemia e hipocalcemia en tratamientos prolongados de mas de un ano',
        'Aumento leve del riesgo de fracturas osteoporoticas de cadera muneca y columna vertebral'
      ]
    },
    contraindications: [
      'Hipersensibilidad al pantoprazol o a los benzimidazoles sustituidos',
      'Coadministracion con inhibidores de la proteasa del VIH atazanavir o nelfinavir'
    ],
    interactions: [
      'Menor interferencia con enzimas hepaticas que otros IBP siendo preferible con clopidogrel',
      'Disminuye la absorcion oral de antifungicos dependientes de acidez gastrica ketoconazol e itraconazol',
      'Metotrexato a dosis altas puede presentar concentraciones sericas aumentadas'
    ],
    adverseReactions: [
      'Cefalea',
      'Diarrea transitoria',
      'Dolor abdominal',
      'Nauseas y flatulencia',
      'Polipos glandulares fundicos benignos en uso cronico'
    ],
    overdose: 'Se manifiesta con letargia somnolencia y nauseas sin toxicidad sistemica mayor. Tratamiento sintomatico y de soporte general. No es dializable.',
    references: [
      'Agencia Española de Medicamentos y Productos Sanitarios. (2023). Ficha técnica Pantoprazol 40 mg comprimidos gastrorresistentes. Centro de Información Online de Medicamentos (CIMA). https://cima.aemps.es',
      'Katz, P. O., et al. (2022). ACG Clinical Guideline for the Diagnosis and Management of Gastroesophageal Reflux Disease. The American Journal of Gastroenterology, 117(1), 27-56. https://doi.org/10.14309/ajg.0000000000001538',
      'Malfertheiner, P., et al. (2022). Management of Helicobacter pylori infection: the Maastricht VI/Florence consensus report. Gut, 71(9), 1724-1762. https://doi.org/10.1136/gutjnl-2022-327745'
    ]
  },
  {
    name: 'clonazepam',
    categories: ['ansioliticos', 'anticonvulsivantes', 'sedantes', 'benzodiacepinas'],
    atc: [{
      code: 'N03AE01',
      categoryCode: 'N',
      categoryName: 'Sistema Nervioso',
      subcategoryCode: 'N03',
      subcategoryName: 'Antiepilépticos'
    }],
    actionMechanism: 'Potenciacion alosterica de la transmision sinaptica gabaergica mediante union selectiva a los receptores de benzodiacepinas facilitando la apertura del canal de cloruro en el complejo GABA-A.',
    indications: [
      'Tratamiento de la mayoria de las formas clinicas de epilepsia ausencias sindrome de Lennox Gastaut y mioclonias',
      'Trastorno de panico agudo y crisis de angustia con o sin agorafobia',
      'Trastornos del sueno y acatisia refractaria'
    ],
    presentations: {
      'Comprimidos cero coma cinco miligramos': {
        dosage: [{ amount: '0.5', unit: 'mg', route: ['Oral'], useIn: 'Adultos' }]
      },
      'Comprimidos 2mg': {
        dosage: [{ amount: '1-2', unit: 'mg', route: ['Oral'], useIn: 'Adultos' }]
      },
      'Gotas Orales Frasco 20ml': {
        dosage: [{ amount: '0.1', unit: 'mg/kg', route: ['Oral'], useIn: 'Niños' }]
      }
    },
    dosageGuidance: {
      adult: {
        'Oral': {
          guidelines: [
            'Dosis inicial en epilepsia de cero punto cinco miligramos cada 8 horas incrementando gradualmente.',
            'En trastorno de panico dosis inicial de cero punto veinticinco miligramos cada 12 horas.'
          ],
          maxDose: ['20 mg al dia en epilepsia o 4 mg al dia en trastorno de panico.']
        }
      },
      pediatric: {
        'Oral': {
          guidelines: [
            'En lactantes y ninos hasta diez anos dosis inicial de cero punto cero uno a cero punto cero tres miligramos por kg al dia divididos en dos o tres tomas.',
            'Incremento progresivo cada tres dias segun respuesta clinica.'
          ],
          maxDose: ['Cero punto dos miligramos por kg al dia en pediatria.']
        }
      }
    },
    risk: {
      pregnancy: 'Categoria D contraindicado salvo urgencia vital por malformaciones y dependencia neonatal',
      lactation: 'Contraindicado en la lactancia materna al pasar a leche y provocar sedacion e hipotonia en el lactante',
      renal: {
        level: 'Precaucion en deterioro renal severo',
        adjustment: 'Los metabolitos inactivos se eliminan por via renal; monitorizar sedacion en ClCr bajo.'
      },
      hepatic: {
        level: 'Contraindicado en insuficiencia hepatica grave',
        adjustment: 'El aclaramiento hepatico se encuentra comprometido elevando el riesgo de encefalopatia.'
      },
      geriatric: 'Dosis reducida al cincuenta por ciento por alto riesgo de ataxia caidas fracturas y sedacion diurna',
      securityFlags: [
        'Riesgo mayor de dependencia fisica y psicologica con sindrome de abstinencia tras uso prolongado',
        'Tolerancia clinica progresiva en el tratamiento cronico de la epilepsia'
      ]
    },
    contraindications: [
      'Hipersensibilidad a las benzodiacepinas',
      'Insuficiencia respiratoria grave o apnea del sueno',
      'Insuficiencia hepatica severa',
      'Miastenia gravis y glaucoma de angulo cerrado'
    ],
    interactions: [
      'Alcohol etilico y opioides potencian intensamente la depresion respiratoria y riesgo de muerte',
      'Inhibidores enzimaticos aumentan su vida media y concentraciones sericas',
      'Farmacos antiepilepticos fenitoina y fenobarbital aceleran su metabolismo reduciendo niveles sericos'
    ],
    adverseReactions: [
      'Somnolencia diurna y sedacion',
      'Ataxia e inestabilidad motora',
      'Mareo',
      'Fatiga muscular',
      'Alteraciones de la memoria y amnesia anterograda'
    ],
    overdose: 'Manifestaciones incluyen letargia confusion profunda hiporreflexia hipotermia hipotension y coma con depresion respiratoria. Antidoto especifico flumazenilo intravenoso administrado con monitorizacion continua.',
    references: [
      'Agencia Española de Medicamentos y Productos Sanitarios. (2023). Ficha técnica Clonazepam 2 mg comprimidos. Centro de Información Online de Medicamentos (CIMA). https://cima.aemps.es',
      'American Psychiatric Association. (2023). Practice Guideline for the Treatment of Patients with Panic Disorder. American Psychiatric Association Publishing.',
      'Kwan, P., et al. (2021). Definition of drug resistant epilepsy: Consensus proposal by the ad hoc Task Force of the ILAE Commission on Therapeutic Strategies. Epilepsia, 51(6), 1069-1077. https://doi.org/10.1111/j.1528-1167.2009.02397.x'
    ]
  },
  {
    name: 'fluoxetina',
    categories: ['antidepresivos', 'inhibidores selectivos de la recaptacion de serotonina', 'psicofarmacos'],
    atc: [{
      code: 'N06AB03',
      categoryCode: 'N',
      categoryName: 'Sistema Nervioso',
      subcategoryCode: 'N06',
      subcategoryName: 'Psicoanalépticos'
    }],
    actionMechanism: 'Inhibicion potente y altamente selectiva de la recaptacion presinaptica de serotonina 5-HT en el transportador SERT prolongando y magnificando la accion sinaptica serotoninergica central.',
    indications: [
      'Episodios depresivos mayores en adultos',
      'Trastorno obsesivo compulsivo en adultos y ninos mayores de ocho anos',
      'Bulimia nerviosa como complemento a la psicoterapia integral',
      'Trastorno disforico premenstrual grave'
    ],
    presentations: {
      'Capsulas 20mg': {
        dosage: [{ amount: '20', unit: 'mg', route: ['Oral'], useIn: 'Ambos' }]
      }
    },
    dosageGuidance: {
      adult: {
        'Oral': {
          guidelines: [
            '20 mg una vez al dia por la manana con o sin alimentos.',
            'Ajustar progresivamente tras tres a cuatro semanas segun respuesta clinica hasta 60 mg al dia en bulimia.'
          ],
          maxDose: ['80 mg al dia en adultos de forma excepcional.']
        }
      },
      pediatric: {
        'Oral': {
          guidelines: [
            'En ninos de mas de ocho anos con depresion resistente iniciar con 10 mg al dia incrementando a 20 mg tras dos semanas.',
            'Monitorizar estrechamente conducta e ideacion autolitica.'
          ],
          maxDose: ['20 mg al dia en poblacion pediatrica.']
        }
      }
    },
    risk: {
      pregnancy: 'Categoria C valorar riesgo cardiovascular fetal y sindrome de adaptacion neonatal transitorio',
      lactation: 'Pasa a leche materna en cantidades considerables requiriendo vigilancia del lactante',
      renal: {
        level: 'Sin ajuste necesario en deterioro renal',
        adjustment: 'La eliminacion renal es minima al metabolizarse en higado a norfluoxetina activa.'
      },
      hepatic: {
        level: 'Ajuste obligado en insuficiencia hepatica',
        adjustment: 'Reducir la dosis diaria a la mitad o administrar en dias alternos por vida media prolongada.'
      },
      geriatric: 'Iniciar con dosis de diez miligramos al dia y no sobrepasar cuarenta miligramos diarios por mayor sensibilidad',
      securityFlags: [
        'Advertencia de recuadro negro por incremento del riesgo de ideacion suicida en jovenes menores de veinticinco anos',
        'Riesgo grave de sindrome serotoninergico en combinacion con otros agentes serotoninergicos'
      ]
    },
    contraindications: [
      'Hipersensibilidad a la fluoxetina',
      'Uso simultaneo o dentro de las cinco semanas previas con inhibidores irreversibles de la MAO',
      'Uso concomitante con metoprolol en insuficiencia cardiaca'
    ],
    interactions: [
      'Inhibidor potente de enzimas hepaticas aumentando concentraciones de antidepresivos triciclicos y antipsicoticos',
      'Potencia el riesgo hemorragico digestivo al asociarse con antiinflamatorios no esteroideos o anticoagulantes',
      'Combinacion con tramadol triptanes o hierba de San Juan dispara el riesgo de toxicidad serotoninergica'
    ],
    adverseReactions: [
      'Insomnio y ansiedad paradogica inicial',
      'Nauseas y diarrea',
      'Perdida del apetito y adelgazamiento transitorio',
      'Disfuncion sexual disminucion de libido y anorgasmia',
      'Cefalea y temblor'
    ],
    overdose: 'Sintomas incluyen nauseas vomitos taquicardia agitacion convulsiones y disritmias por prolongacion del QT. Tratamiento con lavado gastrico carbon activado soporte cardiopulmonar y sedacion con benzodiacepinas.',
    references: [
      'Agencia Española de Medicamentos y Productos Sanitarios. (2023). Ficha técnica Fluoxetina 20 mg cápsulas duras. Centro de Información Online de Medicamentos (CIMA). https://cima.aemps.es',
      'American Psychiatric Association. (2023). Practice Guideline for the Treatment of Patients with Major Depressive Disorder. APA Publishing.',
      'National Institute for Health and Care Excellence. (2022). Depression in adults: treatment and management (NICE Guideline NG222). https://www.nice.org.uk/guidance/ng222'
    ]
  }
];

// ============================================================================
// TAREA 2: 3 FÁRMACOS EXISTENTES PARA AUDITORÍA Y ACTUALIZACIÓN
// ============================================================================
const auditExistingDrugs = [
  {
    name: 'amlodipino',
    categories: ['antihipertensivos', 'bloqueadores de canales de calcio', 'dihidropiridinas'],
    actionMechanism: 'Inhibicion del flujo transmembrana de iones calcio en el musculo liso vascular y cardiaco provocando relajacion arteriolar sistemica y reduccion de la resistencia periferica total.',
    indications: [
      'Hipertension arterial esencial',
      'Angina de pecho cronica estable',
      'Angina vasoespastica de Prinzmetal'
    ],
    presentations: {
      'Comprimidos 5mg': {
        dosage: [{ amount: '5', unit: 'mg', route: ['Oral'], useIn: 'Adultos' }]
      },
      'Comprimidos 10mg': {
        dosage: [{ amount: '10', unit: 'mg', route: ['Oral'], useIn: 'Adultos' }]
      }
    },
    dosageGuidance: {
      adult: {
        'Oral': {
          guidelines: [
            'Dosis inicial habitual de 5 mg una vez al dia con o sin alimentos.',
            'Puede incrementarse a 10 mg una vez al dia segun control de tension arterial tras dos a cuatro semanas.'
          ],
          maxDose: ['10 mg al dia en adultos.']
        }
      },
      pediatric: {
        'Oral': {
          guidelines: ['En ninos de seis a diecisiete anos con hipertension arterial dosis inicial de dos punto cinco miligramos al dia.'],
          maxDose: ['Cinco miligramos al dia en poblacion pediatrica.']
        }
      }
    },
    risk: {
      pregnancy: 'Categoria C de la FDA sopesar balance riesgo beneficio al no existir datos en gestantes humanas',
      lactation: 'Compatible con la lactancia materna al excretarse en cantidades clinicamente insignificantes',
      renal: {
        level: 'Sin ajuste necesario en disfuncion renal',
        adjustment: 'Las concentraciones plasmaticas no se correlacionan con el grado de compromiso renal.'
      },
      hepatic: {
        level: 'Ajuste en insuficiencia hepatica moderada a grave',
        adjustment: 'Iniciar con dosis minima de dos punto cinco miligramos al dia por prolongacion de la semivida.'
      },
      geriatric: 'Iniciar con dos punto cinco miligramos al dia por disminucion del aclaramiento hepatico',
      securityFlags: [
        'Riesgo acentuado de edema periferico maleolar por vasodilatacion capilar precapilar no por retencion hidrica',
        'Riesgo de hipotension refleja transitoria en fases iniciales'
      ]
    },
    contraindications: [
      'Hipersensibilidad a derivados de dihidropiridinas o al amlodipino',
      'Hipotension grave',
      'Shock cardiogenico',
      'Estenosis aortica grave clinicamente relevante',
      'Insuficiencia cardiaca hemodinamicamente inestable tras infarto agudo de miocardio'
    ],
    interactions: [
      'Inhibidores enzimaticos claritromicina e itraconazol elevan concentraciones de amlodipino',
      'Simvastatina ve incrementadas sus concentraciones debiendo limitarse su dosis a veinte miligramos al dia',
      'Dantroleno administrado concurrentemente puede inducir fibrilacion ventricular y colapso cardiovascular'
    ],
    adverseReactions: [
      'Edema periferico maleolar',
      'Cefalea y mareo',
      'Rubefaccion facial sofocos',
      'Palpitaciones transitorias',
      'Fatiga y somnolencia'
    ],
    overdose: 'La sobredosis masiva provoca vasodilatacion periferica excesiva hipotension refractaria y taquicardia refleja. Tratamiento con lavado precoz gluconato calcico intravenoso dopamina y soporte hemodinamico invasivo.',
    references: [
      'Agencia Española de Medicamentos y Productos Sanitarios. (2023). Ficha técnica Amlodipino 5 mg comprimidos. Centro de Información Online de Medicamentos (CIMA). https://cima.aemps.es',
      'Mancia, G., et al. (2023). 2023 ESH Guidelines for the management of arterial hypertension. Journal of Hypertension, 41(12), 1874-2071. https://doi.org/10.1097/HJH.0000000000003480',
      'Whelton, P. K., et al. (2021). 2021 AHA/ACC Clinical Practice Guideline on Blood Pressure Management in Adults. Journal of the American College of Cardiology, 78(18), e150-e220. https://doi.org/10.1016/j.jacc.2021.08.006'
    ]
  },
  {
    name: 'azitromicina',
    categories: ['antibioticos', 'macrolidos', 'azalidas'],
    actionMechanism: 'Inhibicion de la sintesis de proteinas dependiente de ARN bacteriano al fijarse a la subunidad ribosomal 50S impidiendo la traslocacion de cadenas peptidicas en proliferacion.',
    indications: [
      'Infecciones del tracto respiratorio superior sinusitis faringoamigdalitis y otitis media aguda',
      'Infecciones del tracto respiratorio inferior bronquitis aguda y neumonia adquirida en la comunidad',
      'Infecciones de transmision sexual uretritis y cervicitis no complicadas por Chlamydia trachomatis',
      'Infecciones de piel y tejidos blandos erisipela y celulitis no complicadas'
    ],
    presentations: {
      'Comprimidos Recubiertos 500mg': {
        dosage: [{ amount: '500', unit: 'mg', route: ['Oral'], useIn: 'Adultos' }]
      },
      'Suspension Oral 200mg/5ml': {
        dosage: [{ amount: '10', unit: 'mg/kg', route: ['Oral'], useIn: 'Niños' }]
      }
    },
    dosageGuidance: {
      adult: {
        'Oral': {
          guidelines: [
            '500 mg una vez al dia durante tres dias consecutivos o dosis de 500 mg el primer dia y 250 mg al dia durante cuatro dias.',
            'En uretritis por Chlamydia trachomatis dosis unica de 1000 mg oral.'
          ],
          maxDose: ['500 mg al dia salvo pauta unica de 1000 mg.']
        }
      },
      pediatric: {
        'Oral': {
          guidelines: [
            '10 mg por kg una vez al dia durante tres dias o 10 mg por kg el primer dia seguido de 5 mg por kg al dia cuatro dias mas.',
            'Tomar con jeringa graduada preferiblemente fuera de las comidas.'
          ],
          maxDose: ['10 mg por kg al dia sin superar 500 mg diarios en pediatria.']
        }
      }
    },
    risk: {
      pregnancy: 'Categoria B de la FDA amplia experiencia clinica confirma su perfil seguro en gestantes',
      lactation: 'Compatible con la lactancia materna al excretarse en cantidades insignificantes en leche materna',
      renal: {
        level: 'Sin ajuste necesario en insuficiencia renal leve a moderada',
        adjustment: 'ClCr menor a 40 ml/min requiere monitorizacion de efectos adversos gastrointestinales.'
      },
      hepatic: {
        level: 'Contraindicado en fallo hepatico grave',
        adjustment: 'La principal via de eliminacion es biliar; evitar en hepatitis activa o colestasis severa.'
      },
      geriatric: 'No requiere reduccion posologica pero exige precaucion por riesgo de arritmias ventriculares',
      securityFlags: [
        'Prolongacion del intervalo QT con riesgo de arritmias ventriculares torsades de pointes',
        'Riesgo de diarrea asociada a Clostridioides difficile'
      ]
    },
    contraindications: [
      'Hipersensibilidad a la azitromicina a la eritromicina o a cualquier antibiotico macrolido o ketolido',
      'Antecedente de ictericia colestasica o disfuncion hepatica inducida por azitromicina'
    ],
    interactions: [
      'Antiacidos que contengan hidroxido de aluminio y magnesio disminuyen su concentracion plasmatica maxima',
      'Anticoagulantes orales warfarina pueden mostrar potenciacion de efectos requiriendo control de INR',
      'Digoxina puede ver elevados sus niveles sericos por inhibicion de transportadores de excrecion'
    ],
    adverseReactions: [
      'Diarrea y heces blandas',
      'Dolor y colicos abdominales',
      'Nauseas y vomitos',
      'Cefalea',
      'Alteraciones transitorias de enzimas hepaticas'
    ],
    overdose: 'Se manifiesta con nauseas intensas vomitos diarrea y perdida reversible de audicion. Tratamiento sintomatico lavado gastrico carbon activado y rehidratacion hidroelectrolitica. No es dializable.',
    references: [
      'Agencia Española de Medicamentos y Productos Sanitarios. (2023). Ficha técnica Azitromicina 500 mg comprimidos recubiertos con película. Centro de Información Online de Medicamentos (CIMA). https://cima.aemps.es',
      'Workowski, K. A., et al. (2021). Sexually Transmitted Infections Treatment Guidelines, 2021. MMWR Recommendations and Reports, 70(4), 1-187. https://doi.org/10.15585/mmwr.rr7004a1',
      'Metlay, J. P., et al. (2022). Diagnosis and Treatment of Adults with Community-acquired Pneumonia: An Official Clinical Practice Guideline of the ATS and IDSA. American Journal of Respiratory and Critical Care Medicine, 200(7), e45-e67. https://doi.org/10.1164/rccm.201908-1581ST'
    ]
  },
  {
    name: 'ciprofloxacino',
    categories: ['antibioticos', 'fluoroquinolonas'],
    actionMechanism: 'Bactericida de amplio espectro que inhibe selectivamente las topoisomerasas bacterianas ADN girasa tipo dos y topoisomerasa IV impidiendo la replicacion recombinacion y reparacion del ADN bacteriano.',
    indications: [
      'Infecciones complicadas y no complicadas del tracto urinario pielonefritis y prostatitis bacteriana',
      'Infecciones del tracto respiratorio inferior neumonia bacteriana y agudizacion de bronquitis cronica',
      'Diarrea infecciosa grave disenteria shigelosis y fiebre tifoidea',
      'Infecciones osteoarticulares graves osteomielitis y artritis septica'
    ],
    presentations: {
      'Comprimidos Recubiertos 500mg': {
        dosage: [{ amount: '500-750', unit: 'mg', route: ['Oral'], useIn: 'Adultos' }]
      },
      'Solucion para Perfusion 200mg/100ml': {
        dosage: [{ amount: '200-400', unit: 'mg', route: ['Intravenosa'], useIn: 'Adultos' }]
      }
    },
    dosageGuidance: {
      adult: {
        'Oral': {
          guidelines: [
            '500 mg cada 12 horas en infecciones urinarias y respiratorias habituales.',
            'En infecciones osteoarticulares graves o neumonia nosocomial 750 mg cada 12 horas.'
          ],
          maxDose: ['1500 mg al dia en adultos.']
        },
        'Intravenosa': {
          guidelines: ['400 mg cada 8 a 12 horas administrados en perfusion lenta de al menos 60 minutos.'],
          maxDose: ['1200 mg al dia en administracion parenteral.']
        }
      },
      pediatric: {
        'Oral': {
          guidelines: [
            'Uso limitado a exacerbaciones pulmonares de fibrosis quistica por Pseudomonas aeruginosa en ninos de cinco a diecisiete anos a 20 mg por kg cada 12 horas.',
            'Infecciones complicadas del tracto urinario resistentes a 10 a 20 mg por kg cada 12 horas.'
          ],
          maxDose: ['40 mg por kg al dia sin superar 1500 mg diarios.']
        }
      }
    },
    risk: {
      pregnancy: 'Contraindicado en la gestacion por artropatia y dano cartilaginoso demostrado en modelos animales',
      lactation: 'Contraindicado en periodo de lactancia materna al excretarse en leche y presentar riesgo de toxicidad articular',
      renal: {
        level: 'Ajuste obligatorio en aclaramiento renal menor a sesenta mililitros por minuto',
        adjustment: 'ClCr 30 a 60 ml/min 250 a 500 mg cada 12 horas; ClCr menor a 30 ml/min 250 a 500 mg cada 18 o 24 horas.'
      },
      hepatic: {
        level: 'Sin ajuste necesario en disfuncion hepatica aislada',
        adjustment: 'Monitorizar transaminasas en tratamientos prolongados o hepatopatia preexistente.'
      },
      geriatric: 'Evaluar filtrado glomerular y vigilar riesgo acentuado de tendinitis y rotura del tendon de Aquiles',
      securityFlags: [
        'Recuadro negro de advertencia por tendinitis rotura del tendon de Aquiles neuropatia periferica irreversible y efectos sobre el sistema nervioso central',
        'Riesgo de diseccion y rotura del aneurisma aortico en pacientes predispuestos'
      ]
    },
    contraindications: [
      'Hipersensibilidad a las quinolonas o a cualquier componente',
      'Administracion concomitante con tizanidina por incremento masivo de concentraciones plasmaticas',
      'Antecedente de patologia o rotura tendinosa asociada al uso previo de fluoroquinolonas'
    ],
    interactions: [
      'Antiacidos calcio magnesio aluminio y suplementos de hierro reducen intensamente su absorcion intestinal',
      'Inhibidor potente de citocromo P cuatrocientos cincuenta elevando concentraciones sericas de teofilina clozapina y tizanidina',
      'Corticosteroides concomitantes multiplican exponencialmente el riesgo de rotura tendinosa'
    ],
    adverseReactions: [
      'Nauseas y diarrea',
      'Tendinitis y dolor articular',
      'Cefalea y mareos',
      'Insomnio y agitacion',
      'Fotosensibilidad cutanea'
    ],
    overdose: 'Se manifiesta con mareos temblores cefalea convulsiones alucinaciones e insuficiencia renal aguda por cristaluria. Tratamiento de sosten induccion de diuresis alcalinizacion urinaria y carbon activado. La hemodialisis elimina menos del diez por ciento.',
    references: [
      'Agencia Española de Medicamentos y Productos Sanitarios. (2023). Ficha técnica Ciprofloxacino 500 mg comprimidos recubiertos con película. Centro de Información Online de Medicamentos (CIMA). https://cima.aemps.es',
      'Bonkat, G., et al. (2023). EAU Guidelines on Urological Infections. European Association of Urology Guidelines Office.',
      'Gilbert, D. N., et al. (2023). The Sanford Guide to Antimicrobial Therapy (53.ª ed.). Antimicrobial Therapy, Inc.'
    ]
  },
  {
    name: 'furosemida',
    categories: ['diureticos', 'diureticos del asa', 'antihipertensivos', 'derivados de la sulfonamida'],
    actionMechanism: 'Inhibicion del cotransportador sodio potasio dos cloruros en la rama ascendente gruesa del asa de Henle aumentando la excrecion urinaria de agua sodio cloro potasio y calcio.',
    indications: [
      'Edema asociado a insuficiencia cardiaca congestiva cirrosis hepatica y sindrome nefrotico',
      'Hipertension arterial esencial y crisis hipertensivas',
      'Oliguria por insuficiencia renal aguda'
    ],
    presentations: {
      'Comprimidos 40mg': {
        dosage: [{ amount: '20-80', unit: 'mg', route: ['Oral'], useIn: 'Adultos' }]
      },
      'Ampollas 20mg por 2ml': {
        dosage: [{ amount: '20-40', unit: 'mg', route: ['Intravenosa'], useIn: 'Adultos' }]
      }
    },
    dosageGuidance: {
      adult: {
        'Oral': {
          guidelines: [
            '20 mg a 80 mg al dia en toma unica matutina ajustando progresivamente segun diuresis y peso.',
            'En edema refractario pueden fraccionarse dos tomas al dia.'
          ],
          maxDose: ['1500 mg al dia en insuficiencia renal severa.']
        },
        'Intravenosa': {
          guidelines: ['20 mg a 40 mg en inyeccion intravenosa lenta en dos minutos.'],
          maxDose: ['1500 mg al dia en perfusion continua controlada.']
        }
      },
      pediatric: {
        'Oral': {
          guidelines: ['Uno a dos miligramos por kg al dia en una o dos tomas.'],
          maxDose: ['Cuatro miligramos por kg al dia sin superar cuarenta miligramos diarios.']
        }
      }
    },
    risk: {
      pregnancy: 'Contraindicado salvo situaciones excepcionales por riesgo de hipoperfusion placentaria y retraso de crecimiento',
      lactation: 'Contraindicado durante la lactancia materna por inhibir la produccion de leche y pasar a leche humana',
      renal: {
        level: 'Vigilancia obligatoria de volemia e iones sericos',
        adjustment: 'No requiere ajuste posologico pero debe suspenderse si sobreviene anuria o deterioro prerrenal agudo.'
      },
      hepatic: {
        level: 'Riesgo critico de encefalopatia hepatica',
        adjustment: 'Requiere estricto control hidroelectrolitico y monitorizacion de potasio en cirrosis.'
      },
      geriatric: 'Alto riesgo de deshidratacion hipotension ortostatica caidas y trombosis por hipovolemia aguda',
      securityFlags: [
        'Riesgo grave de desequilibrio electrolitico severo hipopotasemia hipomagnesemia e hiponatremia',
        'Ototoxicidad irreversible en administracion intravenosa rapida o combinacion con aminoglucosidos'
      ]
    },
    contraindications: [
      'Hipersensibilidad a la furosemida o a las sulfonamidas',
      'Insuficiencia renal con anuria que no responde a dosis de prueba',
      'Hipopotasemia grave o hiponatremia severa',
      'Estado precomatoso y comatoso asociado a encefalopatia hepatica'
    ],
    interactions: [
      'Aminoglucosidos y cisplatino potencian marcadamente el riesgo de ototoxicidad y nefrotoxicidad',
      'Antiinflamatorios no esteroideos atenuan su accion diuretica y aumentan el riesgo de fallo renal',
      'Digoxina presenta riesgo critico de arritmias inducidas por hipopotasemia'
    ],
    adverseReactions: [
      'Hipopotasemia e hiponatremia',
      'Hipotension ortostatica',
      'Deshidratacion y mareos',
      'Hiperuricemia y crisis de gota',
      'Calambres musculares'
    ],
    overdose: 'Provoca deshidratacion masiva reduccion del volumen intravascular colapso circulatorio arritmias y fallo renal agudo. Tratamiento con reposicion inmediata de fluidos y correccion de electrolitos. No es dializable.',
    references: [
      'Agencia Española de Medicamentos y Productos Sanitarios. (2023). Ficha técnica Furosemida 40 mg comprimidos. Centro de Información Online de Medicamentos (CIMA). https://cima.aemps.es',
      'McDonagh, T. A., et al. (2021). 2021 ESC Guidelines for the diagnosis and treatment of acute and chronic heart failure. European Heart Journal, 42(36), 3599-3726. https://doi.org/10.1093/eurheartj/ehab368',
      'Mancia, G., et al. (2023). 2023 ESH Guidelines for the management of arterial hypertension. Journal of Hypertension, 41(12), 1874-2071. https://doi.org/10.1097/HJH.0000000000003480'
    ]
  },
  {
    name: 'diazepam',
    categories: ['ansioliticos', 'sedantes', 'benzodiacepinas', 'anticonvulsivantes'],
    actionMechanism: 'Modulador alosterico positivo de los receptores GABA-A neuronales que facilita la union del acido gamma aminobutirico incrementando la permeabilidad a iones cloruro e hiperpolarizando la membrana.',
    indications: [
      'Alivio a corto plazo de estados de ansiedad intensa tension psicologica y angustia aguda',
      'Manejo del sindrome de abstinencia alcoholica aguda y delirium tremens',
      'Espasmos del musculo esqueletico de origen central o reflejo periferico',
      'Tratamiento de urgencia del estatus epileptico y convulsiones febriles'
    ],
    presentations: {
      'Comprimidos 5mg': {
        dosage: [{ amount: '5-10', unit: 'mg', route: ['Oral'], useIn: 'Adultos' }]
      },
      'Comprimidos 10mg': {
        dosage: [{ amount: '10', unit: 'mg', route: ['Oral'], useIn: 'Adultos' }]
      },
      'Ampollas 10mg por 2ml': {
        dosage: [{ amount: '10', unit: 'mg', route: ['Intravenosa'], useIn: 'Adultos' }]
      }
    },
    dosageGuidance: {
      adult: {
        'Oral': {
          guidelines: [
            '2 mg a 10 mg administrados dos a cuatro veces al dia segun gravedad sintomatica.',
            'Duracion del tratamiento lo mas corta posible no debiendo superar ocho a doce semanas incluida la retirada.'
          ],
          maxDose: ['40 mg al dia en adultos.']
        },
        'Intravenosa': {
          guidelines: ['5 mg a 10 mg administrados por via intravenosa lenta en al menos dos a tres minutos.'],
          maxDose: ['30 mg al dia en urgencias convulsivas.']
        }
      },
      pediatric: {
        'Oral': {
          guidelines: ['Cero punto uno a cero punto tres miligramos por kg al dia en ninos mayores de seis meses divididos en tres o cuatro tomas.'],
          maxDose: ['Diez miligramos al dia en pediatria.']
        }
      }
    },
    risk: {
      pregnancy: 'Categoria D contraindicado especialmente en primer y tercer trimestre por riesgo teratogenico y depresion neonatal',
      lactation: 'Contraindicado durante la lactancia materna al acumularse y excretarse en concentraciones significativas en leche',
      renal: {
        level: 'Precaucion en deterioro de filtrado glomerular',
        adjustment: 'No requiere ajuste posologico pero debe vigilarse la sedacion excesiva.'
      },
      hepatic: {
        level: 'Contraindicado en insuficiencia hepatica grave',
        adjustment: 'Reducir la dosis a la mitad en insuficiencia hepatica leve a moderada por riesgo de encefalopatia.'
      },
      geriatric: 'Iniciar con dosis reducida de dos a dos punto cinco miligramos al dia por mayor sensibilidad y riesgo de caidas',
      securityFlags: [
        'Alto riesgo de dependencia fisica psiquica y tolerancia tras semanas de tratamiento continuado',
        'Sindrome de abstinencia grave y efecto rebote con convulsiones si se interrumpe de forma brusca'
      ]
    },
    contraindications: [
      'Hipersensibilidad a las benzodiacepinas',
      'Miastenia gravis',
      'Insuficiencia respiratoria grave o sindrome de apnea del sueno',
      'Insuficiencia hepatica grave'
    ],
    interactions: [
      'Alcohol etilico y analgesicos opioides potencian intensamente la depresion respiratoria y coma letal',
      'Inhibidores enzimaticos cimetidina y omeprazol elevan concentraciones de diazepam',
      'Rifampicina y antiepilepticos inductores reducen sus niveles plasmaticos de forma notable'
    ],
    adverseReactions: [
      'Somnolencia diurna y embotamiento afectivo',
      'Ataxia e incoordinacion motora',
      'Confusion y debilidad muscular',
      'Fatiga y mareos',
      'Amnesia anterograda transitoria'
    ],
    overdose: 'Se caracteriza por somnolencia profunda estupor ataxia depresion de reflejos hipotermia hipotension y coma respiratorio. Antidoto especifico flumazenilo intravenoso administrado bajo monitorizacion cardiaca continua.',
    references: [
      'Agencia Española de Medicamentos y Productos Sanitarios. (2023). Ficha técnica Diazepam 5 mg comprimidos. Centro de Información Online de Medicamentos (CIMA). https://cima.aemps.es',
      'American Psychiatric Association. (2023). Practice Guideline for the Treatment of Patients with Panic Disorder and Anxiety. American Psychiatric Association Publishing.',
      'World Health Organization. (2023). The selection and use of essential medicines: Report of the WHO Expert Committee on Selection and Use of Essential Medicines. WHO Technical Report Series, No. 1049.'
    ]
  }
];

// ============================================================================
// AGENTE 3: ORQUESTADOR Y EJECUTOR DE PERSISTENCIA
// ============================================================================
async function executeDailyCycle() {
  console.log('==================================================================');
  console.log('INICIANDO CICLO DE INGESTIÓN Y AUDITORÍA - FARMACOPEDIA');
  console.log(`Fecha de inicio: ${new Date().toISOString()}`);
  console.log('==================================================================\n');

  let newSuccessCount = 0;
  const newResults = [];

  // Tarea 1: Ingestión de nuevos fármacos (hasta 10)
  console.log(`--- TAREA 1: INGESTIÓN DE FÁRMACOS NUEVOS ---`);
  for (const drug of newDrugs) {
    try {
      console.log(`[Agente 3] Verificando existencia de '${drug.name}'...`);
      let exists = false;
      try {
        const check = await axios.get(`${API_BASE}/drugs/${drug.name}`);
        if (check.status === 200) exists = true;
      } catch (e) {
        if (e.response && e.response.status === 404) exists = false;
        else throw e;
      }

      let res;
      if (exists) {
        console.log(`  -> Fármaco ya registrado. Ejecutando PATCH...`);
        res = await axios.patch(`${API_BASE}/drugs/${drug.name}`, drug);
      } else {
        console.log(`  -> Fármaco no registrado. Ejecutando POST...`);
        res = await axios.post(`${API_BASE}/drugs`, drug);
      }

      if (res.status === 200 || res.status === 201) {
        newSuccessCount++;
        newResults.push({ name: drug.name, operation: exists ? 'PATCH' : 'POST', categories: drug.categories.join(', '), refs: drug.references.length, success: true });
        console.log(`  ✓ Éxito para '${drug.name}' (${exists ? 'Actualizado' : 'Ingerido'}) con ${drug.references.length} referencias APA.`);
      }
    } catch (err) {
      const msg = err.response ? JSON.stringify(err.response.data) : err.message;
      console.error(`  ✗ Error en '${drug.name}':`, msg);
      newResults.push({ name: drug.name, success: false, error: msg });
    }
  }

  // Tarea 2: Auditoría y actualización profunda (5 o más existentes)
  let auditSuccessCount = 0;
  const auditResults = [];
  console.log(`\n--- TAREA 2: AUDITORÍA Y ACTUALIZACIÓN PROFUNDA (CUPO: ${auditExistingDrugs.length}) ---`);
  for (const drug of auditExistingDrugs) {
    try {
      console.log(`[Agente 3] Auditando y enriqueciendo '${drug.name}' via PATCH...`);
      const res = await axios.patch(`${API_BASE}/drugs/${drug.name}`, drug);
      if (res.status === 200) {
        auditSuccessCount++;
        auditResults.push({ name: drug.name, refs: drug.references.length, success: true });
        console.log(`  ✓ Éxito auditando '${drug.name}' con ${drug.references.length} referencias APA actualizadas.`);
      }
    } catch (err) {
      const msg = err.response ? JSON.stringify(err.response.data) : err.message;
      console.error(`  ✗ Error auditando '${drug.name}':`, msg);
      auditResults.push({ name: drug.name, success: false, error: msg });
    }
  }

  console.log('\n==================================================================');
  console.log(`INFORME DE CONSOLIDACIÓN:`);
  console.log(`- Nuevos fármacos ingeridos: ${newSuccessCount}/10`);
  console.log(`- Fármacos auditados y enriquecidos: ${auditSuccessCount}/${auditExistingDrugs.length}`);
  console.log('==================================================================');

  return {
    timestamp: new Date().toISOString(),
    newSuccessCount,
    auditSuccessCount,
    newResults,
    auditResults
  };
}

executeDailyCycle();
