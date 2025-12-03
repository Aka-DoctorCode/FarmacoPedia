const axios = require('axios');
const fs = require('fs');
const path = require('path');
const translate = require('translate-google');

// Obtener el nombre del fármaco de los argumentos
const drugName = process.argv[2];

if (!drugName) {
    console.error('❌ Error: Debes proporcionar el nombre del fármaco en INGLÉS.');
    console.error('Ejemplo: npm run buscar-droga "Ibuprofen"');
    process.exit(1);
}

const API_URL = 'https://api.fda.gov/drug/label.json';

// Función auxiliar para traducir texto
async function traducir(texto) {
    if (!texto) return '';
    // Limitar longitud para evitar errores de la API gratuita
    const textoLimpio = Array.isArray(texto) ? texto[0] : texto;
    if (textoLimpio.length > 3000) {
        return await translate(textoLimpio.substring(0, 3000) + '...', { to: 'es' });
    }
    try {
        return await translate(textoLimpio, { to: 'es' });
    } catch (err) {
        console.error('Error traduciendo:', err.message);
        return textoLimpio; // Retornar original si falla
    }
}

async function searchAndMapDrug() {
    try {
        console.log(`🔍 Buscando "${drugName}" en OpenFDA...`);

        const response = await axios.get(API_URL, {
            params: {
                search: `openfda.generic_name:"${drugName}"`,
                limit: 1
            }
        });

        if (!response.data.results || response.data.results.length === 0) {
            console.log('❌ No se encontró información. Intenta con el nombre exacto en inglés.');
            return;
        }

        const data = response.data.results[0];
        console.log('✅ Datos encontrados. Procesando y traduciendo (esto puede tardar un poco)...');

        // 1. Extraer datos crudos
        const rawData = {
            mechanism: data.mechanism_of_action?.[0] || '',
            indications: data.indications_and_usage?.[0] || '',
            contraindications: data.contraindications?.[0] || '',
            adverse_reactions: data.adverse_reactions?.[0] || '',
            overdosage: data.overdosage?.[0] || '',
            pharm_class: data.openfda?.pharm_class_epc || []
        };

        // 2. Traducir campos principales
        const mecanismoTraducido = await traducir(rawData.mechanism);
        const indicacionesTraducidas = await traducir(rawData.indications);
        const contraindicacionesTraducidas = await traducir(rawData.contraindications);
        const reaccionesTraducidas = await traducir(rawData.adverse_reactions);
        const sobreDosisTraducida = await traducir(rawData.overdosage);

        // Traducir array de familias
        const familiasTraducidas = [];
        for (const fam of rawData.pharm_class) {
            familiasTraducidas.push(await traducir(fam));
        }

        // 3. Mapear al Schema de FarmacoPedia
        const farmacoSchema = {
            nombre: drugName.toUpperCase(), // El nombre que buscaste (en inglés por ahora, o podrías pasarlo en español)
            familia: familiasTraducidas.length > 0 ? familiasTraducidas : ["General"],
            id: `fda_${data.id || Date.now()}`,

            mecanismoDeAccion: mecanismoTraducido,

            // El schema espera array de strings para indicaciones
            indicaciones: indicacionesTraducidas ? [indicacionesTraducidas] : [],

            contraindicaciones: contraindicacionesTraducidas ? [contraindicacionesTraducidas] : [],
            reaccionesAdversas: reaccionesTraducidas ? [reaccionesTraducidas] : [],
            sobreDosis: sobreDosisTraducida,

            // Campos complejos que OpenFDA no entrega estructurados (se dejan vacíos o genéricos)
            presentaciones: [{
                tipo: "Genérico",
                composicion: [data.openfda?.generic_name?.[0] || drugName],
                viasAdministracion: ["Oral"] // Valor por defecto seguro
            }],
            posologia: {
                dosisAdulto: {
                    viaDeAdministracion: [{
                        via: "Oral",
                        dosis: ["Consultar médico"]
                    }]
                },
                dosisMaxAdulto: ["Consultar médico"],
                dosisPediatrica: {
                    viaDeAdministracion: []
                },
                dosisMaxPediatrica: []
            },
            riesgo: {
                embarazo: data.pregnancy?.[0] ? "Verificar sección embarazo" : "No especificado",
                lactancia: data.nursing_mothers?.[0] ? "Verificar sección lactancia" : "No especificado",
                renal: { riesgo: "No especificado", ajusteRenal: "No especificado" },
                hepatico: { riesgo: "No especificado", ajusteHepatico: "No especificado" }
            }
        };

        // 4. Guardar JSON
        const fileName = `${drugName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_es.json`;
        const dirPath = path.join(__dirname, '../../data/farmacos');

        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }

        const filePath = path.join(dirPath, fileName);
        fs.writeFileSync(filePath, JSON.stringify(farmacoSchema, null, 2));

        console.log(`\n✨ ¡Éxito! Archivo generado: ${filePath}`);
        console.log('Este JSON sigue la estructura de tu base de datos y está traducido al español.');

    } catch (error) {
        console.error('Error:', error.message);
    }
}

searchAndMapDrug();
