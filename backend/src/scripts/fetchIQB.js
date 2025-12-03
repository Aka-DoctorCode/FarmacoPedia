const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const iconv = require('iconv-lite');

// Obtener el nombre del fármaco de los argumentos
const drugName = process.argv[2];

if (!drugName) {
    console.error('❌ Error: Debes proporcionar el nombre del fármaco (en español).');
    console.error('Ejemplo: npm run buscar-iqb "Ibuprofeno"');
    process.exit(1);
}

// URL base de búsqueda en IQB (usaremos Google para encontrar la página exacta en IQB)
// IQB no tiene un buscador simple de URL, así que la estrategia más robusta es buscar la URL específica primero
// Para este ejemplo, intentaremos construir la URL directa si es posible, o simular una búsqueda.
// IQB suele tener estructura: https://www.iqb.es/cbasicas/farma/farma04/i004.htm (códigos internos)
// Como no sabemos el código, haremos un scraping de su índice alfabético o usaremos una búsqueda de Google custom.

// ESTRATEGIA SIMPLIFICADA:
// IQB tiene índices alfabéticos. Ej: https://www.iqb.es/cbasicas/farma/farma04/indicei.htm (para la I)
// 1. Determinar la letra inicial.
// 2. Ir al índice de esa letra.
// 3. Buscar el link que contenga el nombre del fármaco.
// 4. Ir a ese link y extraer la info.

async function scrapeIQB() {
    try {
        const letra = drugName.charAt(0).toLowerCase();
        const indexUrl = `https://www.iqb.es/cbasicas/farma/farma04/indice${letra}.htm`;

        console.log(`🔍 Buscando "${drugName}" en el índice de IQB (${indexUrl})...`);

        // Axios pide la página, pero IQB usa encoding ISO-8859-1 (latin1), no UTF-8.
        // Necesitamos decodificarlo bien para ver tildes.
        const responseIndex = await axios.get(indexUrl, {
            responseType: 'arraybuffer',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        const htmlIndex = iconv.decode(responseIndex.data, 'win1252'); // Decodificar
        const $index = cheerio.load(htmlIndex);

        // Buscar el enlace que contenga el nombre del fármaco
        let drugUrl = '';
        $index('a').each((i, el) => {
            const text = $index(el).text().trim().toLowerCase();
            if (text.includes(drugName.toLowerCase())) {
                const href = $index(el).attr('href');
                if (href) {
                    // Los links en IQB suelen ser relativos, ej: "i004.htm"
                    drugUrl = `https://www.iqb.es/cbasicas/farma/farma04/${href}`;
                    return false; // Romper el bucle
                }
            }
        });

        if (!drugUrl) {
            console.log('❌ No se encontró el fármaco en el índice de IQB.');
            return;
        }

        console.log(`✅ Encontrado: ${drugUrl}`);
        console.log('📥 Descargando y procesando ficha técnica...');

        // 2. Scrapear la página del fármaco
        const responseDrug = await axios.get(drugUrl, {
            responseType: 'arraybuffer',
            headers: {
                'User-Agent': 'Mozilla/5.0'
            }
        });
        const htmlDrug = iconv.decode(responseDrug.data, 'win1252');
        const $ = cheerio.load(htmlDrug);

        // EXTRAER DATOS (Esto es artesanal, depende del HTML de IQB que es antiguo)
        // IQB usa muchas tablas y <p> sin clases. Buscaremos por texto de cabecera.

        const extractSection = (headerText) => {
            // Buscar un elemento que contenga el texto (ej: "MECANISMO DE ACCION")
            // y tomar los párrafos siguientes hasta el próximo header.
            let content = '';

            // Estrategia: Buscar tags <strong> o <b> o <h3> que contengan el texto
            $('strong, b, h3, font').each((i, el) => {
                const text = $(el).text().trim().toUpperCase();
                // Limpieza básica de caracteres raros
                const cleanText = text.replace(/[\n\r\t]/g, ' ');

                if (cleanText.includes(headerText)) {
                    // Encontrado el título. Ahora buscar el contenido.
                    // En IQB el contenido suele estar en el parent o en siblings.
                    // A veces es una tabla.

                    // Intentar obtener el texto del padre o los siguientes elementos
                    let parent = $(el).parent();

                    // A veces el texto está justo después en el mismo p
                    content = parent.text().replace(text, '').trim();

                    // Si está vacío, buscar en el siguiente p
                    if (content.length < 10) {
                        let next = parent.next();
                        if (next.is('p') || next.is('table')) {
                            content += '\n' + next.text().trim();
                        }
                    }
                    return false; // Stop searching
                }
            });
            return content || 'No encontrado o requiere revisión manual';
        };

        const farmacoData = {
            nombre: drugName.toUpperCase(),
            familia: ["Consultar IQB"], // IQB no siempre tiene esto claro en un header
            id: `iqb_${path.basename(drugUrl, '.htm')}`,

            mecanismoDeAccion: extractSection('MECANISMO DE ACCION'),
            indicaciones: [extractSection('INDICACIONES')],
            contraindicaciones: [extractSection('CONTRAINDICACIONES')],
            reaccionesAdversas: [extractSection('REACCIONES ADVERSAS')],
            sobreDosis: extractSection('SOBREDOSIS'),
            posologia: {
                dosisAdulto: {
                    viaDeAdministracion: [{
                        via: "Oral/Parenteral",
                        dosis: [extractSection('POSOLOGIA')] // Aquí vendrá mucho texto mezclado
                    }]
                },
                dosisMaxAdulto: [],
                dosisPediatrica: { viaDeAdministracion: [] },
                dosisMaxPediatrica: []
            },
            riesgo: {
                embarazo: "Verificar texto completo",
                lactancia: "Verificar texto completo",
                renal: { riesgo: "Verificar", ajusteRenal: "Verificar" },
                hepatico: { riesgo: "Verificar", ajusteHepatico: "Verificar" }
            },
            presentaciones: [{
                tipo: "Genérico",
                composicion: [drugName],
                viasAdministracion: ["Verificar"]
            }],
            source_url: drugUrl
        };

        // Guardar JSON
        const fileName = `${drugName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_iqb.json`;
        const dirPath = path.join(__dirname, '../../data/farmacos');

        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }

        const filePath = path.join(dirPath, fileName);
        fs.writeFileSync(filePath, JSON.stringify(farmacoData, null, 2));

        console.log(`\n✨ ¡Éxito! Archivo generado: ${filePath}`);
        console.log('⚠️ Nota: El scraping de IQB es imperfecto debido a su HTML antiguo. Revisa el JSON.');

    } catch (error) {
        console.error('Error:', error.message);
    }
}

scrapeIQB();
