const path = require('path');
const backendDir = path.resolve(__dirname, '../backend');
const axios = require(path.join(backendDir, 'node_modules/axios'));
const mongoose = require(path.join(backendDir, 'node_modules/mongoose'));
require(path.join(backendDir, 'node_modules/dotenv')).config({
  path: path.join(backendDir, '.env')
});

// WHO ATC Standard Level 1 Taxonomy (Spanish)
const ATC_LEVEL_1 = {
  A: 'Tracto Alimentario y Metabolismo',
  B: 'Sangre y Órganos Hematopoyéticos',
  C: 'Sistema Cardiovascular',
  D: 'Dermatológicos',
  G: 'Sistema Genitourinario y Hormonas Sexuales',
  H: 'Preparados Hormonales Sistémicos Excl. Hormonas Sexuales e Insulinas',
  J: 'Antiinfecciosos para Uso Sistémico',
  L: 'Antineoplásicos e Inmunomoduladores',
  M: 'Sistema Musculoesquelético',
  N: 'Sistema Nervioso',
  P: 'Productos Antiparasitarios, Insecticidas y Repelentes',
  R: 'Sistema Respiratorio',
  S: 'Órganos de los Sentidos',
  V: 'Varios'
};

// WHO ATC Standard Level 2 Taxonomy (Spanish)
const ATC_LEVEL_2 = {
  A01: 'Preparaciones Estomatológicas',
  A02: 'Agentes para el Tratamiento de Alteraciones Causadas por Ácidos',
  A03: 'Agentes contra Padecimientos Funcionales del Estómago e Intestino',
  A04: 'Antieméticos y Antinauseosos',
  A05: 'Terapia Biliar y Hepática',
  A06: 'Fármacos para el Estreñimiento',
  A07: 'Antidiarreicos, Agentes Antiinflamatorios/Antiinfecciosos Intestinales',
  A08: 'Preparados contra la Obesidad',
  A09: 'Digestivos, Incluyendo Enzimas',
  A10: 'Fármacos Usados en Diabetes',
  A11: 'Vitaminas',
  A12: 'Suplementos Minerales',
  B01: 'Agentes Antitrombóticos',
  B02: 'Antihemorrágicos',
  B03: 'Preparados Antianémicos',
  B05: 'Sustitutos de Sangre y Soluciones para Perfusión',
  B06: 'Otros Agentes Hematológicos',
  C01: 'Terapia Cardíaca',
  C02: 'Antihipertensivos',
  C03: 'Diuréticos',
  C04: 'Vasodilatadores Periféricos',
  C05: 'Vasoprotectores',
  C07: 'Betabloqueantes',
  C08: 'Bloqueantes de Canales de Calcio',
  C09: 'Agentes que Actúan sobre el Sistema Renina-Angiotensina',
  C10: 'Agentes Modificadores de los Lípidos',
  D01: 'Antifúngicos para Uso Dermatológico',
  D02: 'Emolientes y Protectores',
  D03: 'Preparados para el Tratamiento de Heridas y Úlceras',
  D04: 'Antipruriginosos, Incluyendo Antihistamínicos y Anestésicos',
  D05: 'Antipsoriásicos',
  D06: 'Antibióticos y Quimioterápicos para Uso Dermatológico',
  D07: 'Preparados Dermatológicos con Corticosteroides',
  D08: 'Antisépticos y Desinfectantes',
  D10: 'Preparados contra el Acné',
  D11: 'Otros Preparados Dermatológicos',
  G01: 'Antiinfecciosos y Antisépticos Ginecológicos',
  G02: 'Otros Ginecológicos',
  G03: 'Hormonas Sexuales y Moduladores del Sistema Genital',
  G04: 'Urológicos',
  H01: 'Hormonas Hipofisarias e Hipotalámicas',
  H02: 'Corticosteroides para Uso Sistémico',
  H03: 'Terapia Tiroidea',
  H04: 'Hormonas Pancreáticas',
  H05: 'Homeostasis del Calcio',
  J01: 'Antibacterianos para Uso Sistémico',
  J02: 'Antimicóticos para Uso Sistémico',
  J04: 'Antimicobacterias',
  J05: 'Antivirales para Uso Sistémico',
  J06: 'Sueros Inmunes e Inmunoglobulinas',
  J07: 'Vacunas',
  L01: 'Agentes Antineoplásicos',
  L02: 'Terapia Endocrina',
  L03: 'Inmunoestimulantes',
  L04: 'Inmunosupresores',
  M01: 'Productos Antiinflamatorios y Antirreumáticos',
  M02: 'Productos Tópicos para el Dolor Articular y Muscular',
  M03: 'Relajantes Musculares',
  M04: 'Preparados Antigotosos',
  M05: 'Fármacos para el Tratamiento de Enfermedades Óseas',
  M09: 'Otros Fármacos para Desórdenes del Sistema Musculoesquelético',
  N01: 'Anestésicos',
  N02: 'Analgésicos',
  N03: 'Antiepilépticos',
  N04: 'Antiparkinsonianos',
  N05: 'Psicolépticos',
  N06: 'Psicoanalépticos',
  N07: 'Otros Fármacos para el Sistema Nervioso',
  P01: 'Antiprotozoarios',
  P02: 'Antihelmínticos',
  P03: 'Ectoparasiticidas, Incluyendo Escabicidas',
  R01: 'Preparados Nasales',
  R02: 'Preparados para la Garganta',
  R03: 'Agentes contra Padecimientos Obstructivos de las Vías Respiratorias',
  R05: 'Preparados para la Tos y el Resfriado',
  R06: 'Antihistamínicos para Uso Sistémico',
  R07: 'Otros Productos para el Sistema Respiratorio',
  S01: 'Oftalmológicos',
  S02: 'Otológicos',
  S03: 'Preparados Oftalmológicos y Otológicos',
  V03: 'Todos los Demás Productos Terapéuticos',
  V04: 'Agentes Diagnósticos',
  V08: 'Medios de Contraste',
  V09: 'Radiofármacos para Diagnóstico',
  V10: 'Radiofármacos para Terapéutica',
  V20: 'Vendajes Quirúrgicos'
};

// Canonical official ATC codes registered in CIMA / WHO for existing drugs
const CANONICAL_DRUG_ATC = {
  acetaminofen: 'N02BE01',     // Paracetamol
  paracetamol: 'N02BE01',
  amoxicilina: 'J01CA04',
  ibuprofeno: 'M01AE01',
  omeprazol: 'A02BC01',
  salbutamol: 'R03AC02',
  losartan: 'C09CA01',
  metformina: 'A10BA02',
  atorvastatina: 'C10AA05',
  ciprofloxacino: 'J01MA02',
  azitromicina: 'J01FA10',
  ampicilina: 'J01CA01',
  hidroclorotiazida: 'C03AA03',
  glibenclamida: 'A10BB01',
  simvastatina: 'C10AA01',
  diazepam: 'N05BA01',
  loratadina: 'R06AX13',
  furosemida: 'C03CA01',
  amlodipino: 'C08CA01',
  ceftriaxona: 'J01DD04',
  meropenem: 'J01DH02',
  sertralina: 'N06AB06',
  metoclopramida: 'A03FA01'
};

function buildAtcEntry(atcCode) {
  const code = atcCode.trim().toUpperCase();
  const categoryCode = code.charAt(0);
  const subcategoryCode = code.substring(0, 3);
  const categoryName = ATC_LEVEL_1[categoryCode] || 'Varios';
  const subcategoryName = ATC_LEVEL_2[subcategoryCode] || 'Subcategoría Terapéutica';

  return {
    code,
    categoryCode,
    categoryName,
    subcategoryCode,
    subcategoryName
  };
}

async function fetchAtcFromCima(drugName) {
  const synonyms = {
    acetaminofen: 'paracetamol'
  };
  const queryName = synonyms[drugName.toLowerCase()] || drugName.toLowerCase();
  
  try {
    const searchUrl = `https://cima.aemps.es/cima/rest/medicamentos?nombre=${encodeURIComponent(queryName)}`;
    const searchRes = await axios.get(searchUrl, { timeout: 4000 });
    const results = searchRes.data?.resultados || [];
    if (results.length === 0) return null;

    const authorized = results.find(r => r.estado?.aut && r.nregistro) || results[0];
    if (!authorized?.nregistro) return null;

    const detailUrl = `https://cima.aemps.es/cima/rest/medicamento?nregistro=${authorized.nregistro}`;
    const detailRes = await axios.get(detailUrl, { timeout: 4000 });
    const atcs = detailRes.data?.atcs || [];
    
    // Look for level 5 ATC code
    const level5 = atcs.find(a => a.nivel === 5 && a.codigo);
    if (level5) return level5.codigo;
    
    // Or longest ATC code available
    if (atcs.length > 0) {
      const sorted = [...atcs].sort((a, b) => (b.codigo?.length || 0) - (a.codigo?.length || 0));
      return sorted[0].codigo;
    }
  } catch (err) {
    // Return null on network error to allow fallback
    return null;
  }
  return null;
}

async function migrate() {
  console.log('====================================================');
  console.log(' ClickSalud FarmacoPedia - Migración ATC CIMA / OMS ');
  console.log('====================================================\n');

  if (!process.env.MONGODB_URI) {
    console.error('Error: MONGODB_URI no está definido en backend/.env');
    process.exit(1);
  }

  console.log('Conectando a MongoDB Atlas...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✓ Conectado exitosamente.\n');

  const drugsCollection = mongoose.connection.collection('drugs');
  const allDrugs = await drugsCollection.find({}).toArray();
  console.log(`Se encontraron ${allDrugs.length} fármacos registrados en la base de datos.\n`);

  let updatedCount = 0;
  const summary = [];

  for (const drug of allDrugs) {
    const drugName = drug.name.toLowerCase().trim();
    let atcCode = CANONICAL_DRUG_ATC[drugName];

    // If not in canonical table or want live CIMA check:
    if (!atcCode) {
      console.log(`Consultando API de CIMA para '${drugName}'...`);
      atcCode = await fetchAtcFromCima(drugName);
    }

    if (!atcCode) {
      console.warn(`⚠️ No se encontró código ATC para '${drugName}'.`);
      continue;
    }

    const atcEntry = buildAtcEntry(atcCode);
    const atcArray = [atcEntry];

    await drugsCollection.updateOne(
      { _id: drug._id },
      { $set: { atc: atcArray } }
    );

    updatedCount++;
    console.log(`✓ [${atcEntry.code}] ${drugName.padEnd(18)} → ${atcEntry.categoryCode} (${atcEntry.categoryName}) > ${atcEntry.subcategoryCode} (${atcEntry.subcategoryName})`);
    summary.push({
      name: drugName,
      atc: atcEntry
    });
  }

  console.log('\n====================================================');
  console.log(` Migración Finalizada: ${updatedCount}/${allDrugs.length} fármacos actualizados.`);
  console.log('====================================================\n');

  await mongoose.disconnect();
}

if (require.main === module) {
  migrate().catch(err => {
    console.error('Error durante la migración:', err);
    process.exit(1);
  });
}

module.exports = {
  migrate,
  ATC_LEVEL_1,
  ATC_LEVEL_2,
  CANONICAL_DRUG_ATC,
  buildAtcEntry
};
