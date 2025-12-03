const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

// Obtener el nombre del fármaco de los argumentos
const drugName = process.argv[2];

if (!drugName) {
    console.error('❌ Error: Debes proporcionar el nombre del fármaco.');
    console.error('Ejemplo: npm run buscar-vademecum "Ibuprofeno"');
    process.exit(1);
}

// URL base de búsqueda en Vademecum
// Vademecum tiene un buscador que redirige. La URL de búsqueda suele ser:
// https://www.vademecum.es/busqueda/principios-activos/{nombre}
// O https://www.vademecum.es/principios-activos-{nombre}-...

async function scrapeVademecum() {
    try {
        console.log(`🔍 Buscando "${drugName}" en Vademecum...`);

        // 1. Búsqueda inicial para obtener el enlace de la ficha
        // Vademecum usa un buscador que devuelve una lista.
        // Simulamos una búsqueda directa a su índice de principios activos.
        const searchUrl = `https://www.vademecum.es/busqueda/principios-activos/${encodeURIComponent(drugName)}`;

        const responseSearch = await axios.get(searchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        const $search = cheerio.load(responseSearch.data);

        // Buscar el primer resultado que sea un principio activo
        // Vademecum lista resultados con clase .search-results o similar.
        // Buscamos enlaces que contengan "principios-activos-"
        let drugLink = '';

        $search('a').each((i, el) => {
            const href = $search(el).attr('href');
            if (href && href.includes('principios-activos-') && href.includes(drugName.toLowerCase())) {
                drugLink = href;
                // Si es relativo, añadir dominio
                if (!drugLink.startsWith('http')) {
                    drugLink = `https://www.vademecum.es${drugLink}`;
                }
                return false; // Stop
            }
        });

        if (!drugLink) {
            console.log('❌ No se encontró el principio activo en Vademecum.');
            return;
        }

        console.log(`✅ Encontrado: ${drugLink}`);
        console.log('📥 Descargando ficha técnica...');

        // 2. Scrapear la ficha técnica
        const responseDrug = await axios.get(drugLink, {
            headers: {
                'User-Agent': 'Mozilla/5.0'
            }
        });
        const $ = cheerio.load(responseDrug.data);

        // Extracción de datos (Basado en estructura típica de Vademecum)
        // Vademecum suele usar <div> con ids o clases específicas para cada sección

        const extractText = (selector) => {
            const el = $(selector);
            return el.length ? el.text().trim() : 'No encontrado';
        };

        // Función para limpiar texto (quitar saltos de línea excesivos)
        const clean = (text) => text.replace(/\s+/g, ' ').trim();

        const farmacoData = {
            nombre: drugName.toUpperCase(),
            familia: ["Consultar Vademecum"], // Difícil de extraer automáticamente sin mapeo
            id: `vdm_${path.basename(drugLink)}`,
            source_url: drugLink,

            mecanismoDeAccion: clean(extractText('#content_mecanismo_accion, .mecanismo_accion')),
            indicaciones: [clean(extractText('#content_indicaciones, .indicaciones_terapeuticas'))],
            posologia: {
                dosisAdulto: {
                    viaDeAdministracion: [{
                        via: "Ver ficha",
                        dosis: [clean(extractText('#content_posologia, .posologia'))]
                    }]
                },
                dosisMaxAdulto: [],
                dosisPediatrica: { viaDeAdministracion: [] },
                dosisMaxPediatrica: []
            },
            contraindicaciones: [clean(extractText('#content_contraindicaciones, .contraindicaciones'))],
            riesgo: {
                embarazo: clean(extractText('#content_embarazo, .embarazo')),
                lactancia: clean(extractText('#content_lactancia, .lactancia')),
                renal: {
                    riesgo: clean(extractText('#content_insuficiencia_renal')),
                    ajusteRenal: "Ver texto insuficiencia renal"
                },
                hepatico: {
                    riesgo: clean(extractText('#content_insuficiencia_hepatica')),
                    ajusteHepatico: "Ver texto insuficiencia hepática"
                }
            },
            interacciones: [clean(extractText('#content_interacciones, .interacciones'))],
            reaccionesAdversas: [clean(extractText('#content_reacciones_adversas, .reacciones_adversas'))],
            sobreDosis: clean(extractText('#content_sobredosificacion, .sobredosificacion')),

            presentaciones: [{
                tipo: "Genérico",
                composicion: [drugName],
                viasAdministracion: ["Verificar ficha"]
            }]
        };

        // Guardar JSON
        const fileName = `${drugName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_vademecum.json`;
        const dirPath = path.join(__dirname, '../../data/farmacos');

        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }

        const filePath = path.join(dirPath, fileName);
        fs.writeFileSync(filePath, JSON.stringify(farmacoData, null, 2));

        console.log(`\n✨ ¡Éxito! Archivo generado: ${filePath}`);

    } catch (error) {
        console.error('Error:', error.message);
        if (error.response && error.response.status === 403) {
            console.error('⚠️ Vademecum bloqueó la petición (Error 403). Probablemente detectaron el bot.');
        }
    }
}

scrapeVademecum();
