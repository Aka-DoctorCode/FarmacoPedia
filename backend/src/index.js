// imports
const express = require ('express');
const cors = require('cors');
const mongoose = require('mongoose');

// app
const app = express();

// middlewares
app.use(express.json());
app.use(cors());

// conexion base de datos
const bd = "mongodb://localhost:27017/FarmacoPedia";
async function conexionBD(){
    await mongoose.connect(bd);
    console.log("Conexión a la base de datos exitosa");
}
conexionBD();


// Schema de los farmacos
const farmaco = new mongoose.Schema({
    nombre: {
        type: String,
        unique: true,
        required: true,
        match: /^[a-záéíóúü]+$/
    },
    familia: {
        type: [String], 
        required: true,
        match: /^[a-záéíóúü]+$/
    },
    id: {
        type: String,
        unique: true
    },
    mecanismoDeAccion: {
        type: String,
        default: "información faltante",
    },
    indicacion: {
        type: [String],
        default: "información faltante",
        match: /^[a-záéíóúü]\s+$/
    },
    presentaciones: [
        {
            tipo: {
                type: String,
                default: "información faltante",
                match: /^[a-záéíóúü]\s+$/
            },
            presentacion:{
                composicion: {
                    type: String,
                    default: "información faltante",
                    match: /^[a-záéíóúü0-9\,.-/]\s+$/
                },
            },
            viasAdministracion: {
                type: [String],
                default: "información faltante",
                match: /^[a-záéíóúü]\s+$/
            }
        },
    ],
    nombresComercial: [
        {
            nombreComercial: {
                type: String,
                default: "información faltante",
                match: /^[a-záéíóúü]\s+$/
            },
            composicion: {
                type: String,
                default: "información faltante",
                match: /^[a-z0-9\,.-/]\s+$/
            },
            paises: [
                {
                    pais: {
                        type: String,
                        default: "información faltante",
                        match: /^[a-záéíóúü]\s+$/
                    }
                }
            ]
        }
    ],
    posologia: {
        dosisAdulto: {
            viaAdministracion: [
                {
                    dosis: [
                        {
                            dosis: {
                                type: String,
                                required: true,
                                match: /^[a-záéíóúü\,.;:()%-+=*/<>≤≥÷]\s+$/
                            }
                        }
                    ]
                }
            ]
        },
        dosisMaxAdulto: {
            type: [String],
            default: "información faltante",
            match: /^[a-záéíóúü\,.;:()%-+=*/<>≤≥÷]\s+$/
        },
        dosisPediatrica: {
            viaAdministracion: [
                {
                    dosis: [
                        {
                            dosis: {
                                type: String,
                                required: true,
                                match: /^[a-záéíóúü\,.;:()%-+=*/<>≤≥÷]\s+$/
                            }
                        }
                    ]
                }
            ]
        },
        dosisMaxPediatrica: {
            type: [String],
            default: "información faltante",
            match: /^[a-záéíóúü\,.;:()%-+=*/<>≤≥÷]\s+$/
        },
    },
    riesgo: [
        {
            embarazo: {
                type: String,
                default: "información faltante",
                match: /^[a-záéíóúü]\s+$/
            },
            lactancia: {
                type: String,
                default: "información faltante",
                match: /^[a-záéíóúü]\s+$/
            },
            renal: {
                riesgo: {
                    type: String,
                    default: "información faltante",
                    match: /^[a-záéíóúü]\s+$/
                },
                ajusteRenal: {
                    type: String,
                    default: "información faltante",
                    match: /^[a-záéíóúü\,.;:()%-+=*/<>≤≥÷]\s+$/
                    
                }
            },
            hepatico: {
                riesgo: {
                    type: String,
                    default: "información faltante",
                    match: /^[a-záéíóúü]\s+$/
                },
                ajusteHepatico: {
                    type: String,
                    default: "información faltante",
                    match: /^[a-záéíóúü\,.;:()%-+=*/<>≤≥÷]\s+$/
                    
                }
            }
        }
    ],
    contraindicaciones: {
        type: [String],
        default: "información faltante",
        match: /^[a-záéíóúü]\s+$/
    },
    interacciones: {
        type: [String],
        default: "información faltante",
        match: /^[a-záéíóúü]\s+$/
    },
    reaccionesAdversas: {
        type: [String],
        default: "información faltante",
        match: /^[a-záéíóúü]\s+$/
    },
    sobreDosis: {
        type: String,
        default: "información faltante",
        // match: /^[a-záéíóúü\,.;:()%-+=*/<>≤≥÷]\s+$/
    }
});

// modelo
const Farmaco = mongoose.model('Farmaco', farmaco);

// rutas
app.get("/farmacos", async (req, res) => {
    const farmacosEncontrados = await Farmaco.find();

    if (farmacosEncontrados != null) {
        res.status(200).json(farmacosEncontrados);
    } else {
        res.status(404).json({
            "error": "No se encontraron farmacos la base de datos esta vacia",
        });
    }
});

app.get("/farmaco/:nombre", async (req, res)=>{
    const {nombre} = req.params;
    const farmacoEncontrado = await Farmaco.findOne({"nombre": nombre});
    console.log(farmacoEncontrado);

    if (farmacoEncontrado != null) {
        res.status(200).json(farmacoEncontrado);
    }else{
        res.status(404).json({
            "error": "No se encontro el farmaco",
            "solucion": "Intenta con otro"
        });
    }
});

app.get("/farmacos/familia/:familia", async (req, res)=>{
    const {familia} = req.params;
    const farmacoEncontrado = await Farmaco.find({ familia });

    if (farmacoEncontrado.length > 0) {
        res.status(200).json(farmacoEncontrado);
    }else{
        res.status(404).json({
            "error": "No se encontraron farmacos en esta familia",
            "solucion": "Intenta con otra familia"
        });
    }
});

app.post("/agregarFarmaco", async (req, res)=>{
    const datos = req.body;
    const {nombre, familia} = req.body;
    const id = (familia && familia.length > 0) ? familia[0] + "_" + nombre.slice(0, 3) : "";
    try {
        const nuevoFarmaco = new Farmaco({id, nombre, familia, datos});

        await nuevoFarmaco.save();

        res.status(200).json({
            "Se agrego el farmaco": nuevoFarmaco.nombre
        });
    }catch(error){
        console.log(error);
        res.status(400).json({
            "error": error,
            "No se pudo agregar el farmaco": "Intenta con otro",
            "solucion": "Intenta con otro"
        });
    }
});

app.patch("/farmaco/:nombre", async (req, res) =>{
    const nuevosDatos = req.body;

    try {
        await Farmaco.updateOne(
            {"nombre": req.params.nombre},
            {$set: nuevosDatos}
        );
        res.status(200).json({
            "Se actualizo el farmaco" : `${nuevosDatos.nombre}`,
            "NuevosDatos": {nuevosDatos}
        })
    } catch (error) {
        res.status(400).json({
            "error": error,
            "Solución": "Asegurate que el farmaco este bien escrito, o puede que este no exista en la base de datos"
        });
    }
});

app.delete("/farmaco/:nombre", async (req, res)=>{
    const farmacoAEliminar = await Farmaco.findOneAndDelete({"nombre": req.params.nombre});

    farmacoAEliminar != null
        ? res.status(200).json({
            "respuesta": `Se elimino el farmaco ${farmacoAEliminar.nombre}`,
            "farmaco": farmacoAEliminar
        })
        : res.status(404).json({
            "respuesta": "No se encontro el farmaco",
            "farmaco": farmacoAEliminar
        });
});


// escuchar el puerto
app.listen(7000, () => {
    console.log("Servidor escuchando en el puerto 7000");
    console.log("http://localhost:7000");
})