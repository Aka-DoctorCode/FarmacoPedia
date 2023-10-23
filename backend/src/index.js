// imports
const express = require ('express');
const cors = require('cors');
const mongoose = require('mongoose');
require("dotenv").config();

// app
const app = express();

// middlewares
app.use(express.json());
app.use(cors());

// conexion base de datos
// const bd = "mongodb://localhost:27017/FarmacoPedia";
const bd = process.env.DB_URI
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
        match: /^[a-z]+$/
    },
    familia: {
        type: [String], 
        required: true,
        match: /^[a-z]+$/
    },
    id: {
        type: String,
        unique: true
    },
    mecanismoDeAccion: {
        type: String,
        match: /^[a-záéíóúüñA-ZÁ́ÉÍÓÚÜÑ\,.;:()0-9\s]+$/gm
    },
    indicaciones: {
        type: [String],
        match: /^[a-záéíóúüñ\s]+$/gm
    },
    presentaciones: [
        {
            tipo: {
                type: String,
                match: /^[a-záéíóúüñ\s]+$/gm
            },
            composicion: {
                type: [String],
                match: /^[a-záéíóúüñ0-9\,.-/\s]+$/gm
            },
            viasAdministracion: {
                type: [String],
                match: /^[a-záéíóúüñ\s]+$/gm
            }
        },
    ],
    nombresComercial: [
        {
            nombre: {
                type: String,
                match: /^[a-záéíóúüñ\s]+$/gm
            },
            composicion: {
                type: [String],
                match: /^[a-záéíóúüñ0-9\,.-/\s]+$/gm
            },
            paises: {
                type: [String],
                match: /^[a-záéíóúüñ\s]+$/gm
            }
        }
    ],
    posologia: {
        dosisAdulto: {
            viaDeAdministracion: [
                {
                    via: {
                        type: String,
                        match: /^[a-záéíóúüñ\s]+$/gm
                    },
                    dosis: {
                        type: [String],
                        match: /^[a-záéíóúü\,.;:()%-+=*/<>≤≥÷\s]+$/gm
                    }
                },
            ],
        },
        dosisMaxAdulto: {
            type: [String],
            match: /^[a-záéíóúü\,.;:()%-+=*/<>≤≥÷\s]+$/gm
        },
        dosisPediatrica: {
            viaDeAdministracion: [
                {
                    via: {
                        type: String,
                        match: /^[a-záéíóúüñ\s]+$/gm
                    },
                    dosis: {
                        type: [String],
                        match: /^[a-záéíóúü\,.;:()%-+=*/<>≤≥÷\s]+$/gm
                    }
                },
            ],
        },
        dosisMaxPediatrica: {
            type: [String],
            match: /^[a-záéíóúü\,.;:()%-+=*/<>≤≥÷\s]+$/gm
        },
    },
    riesgo: {
        embarazo: {
            type: String,
            match: /^[a-záéíóúüñ\s]+$/gm
        },
        lactancia: {
            type: String,
            match: /^[a-záéíóúüñ\s]+$/gm
        },
        renal: {
            riesgo: {
                type: String,
                match: /^[a-záéíóúüñ\s]+$/gm
            },
            ajusteRenal: {
                type: String,
                match: /^[a-záéíóúü\,.;:()%-+=*/<>≤≥÷\s]+$/gm
            }
        },
        hepatico: {
            riesgo: {
                type: String,
                match: /^[a-záéíóúüñ\s]+$/gm
            },
            ajusteHepatico: {
                type: String,
                match: /^[a-záéíóúüñ\,.;:()%-+=*/<>≤≥÷\s]+$/gm
            }
        }
    },
    contraindicaciones: {
        type: [String],
        match: /^[a-záéíóúüñ\s]+$/gm
    },
    interacciones: {
        type: [String],
        match: /^[a-záéíóúüñ\s]+$/gm
    },
    reaccionesAdversas: {
        type: [String],
        match: /^[a-záéíóúüñ\s]+$/gm
    },
    sobreDosis: {
        type: String,
        match: /^[a-záéíóúüñ\,.;:()%-+=*/<>≤≥÷\s]+$/gm
    }
});

// modelo
const Farmaco = mongoose.model('Farmaco', farmaco);

// rutas
app.post("/agregarFarmaco", async (req, res)=>{
    const {nombre, familia, mecanismoDeAccion, indicaciones, presentaciones, nombresComercial, posologia, riesgo, contraindicaciones, interacciones, reaccionesAdversas, sobreDosis} = req.body;
    const id = (familia && familia.length > 0) ? familia[0] + "." + nombre.slice(0, 5) : "";
    try {
        const nuevoFarmaco = new Farmaco({id, nombre, familia, mecanismoDeAccion, indicaciones, presentaciones, nombresComercial, posologia, riesgo, contraindicaciones, interacciones, reaccionesAdversas, sobreDosis});
        await nuevoFarmaco.save();
        res.status(200).json({
            "Se agrego con exito a la base de datos": nuevoFarmaco
        });
    }catch(error){
        console.log(error);
        res.status(400).json({
            "error": error,
            "Solución 1": `verifica que ${nombre} no exista en la base de datos`,
            "Solución 2": 'asegurate de que se cumple el schema',
        });
    }
});


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
app.listen(8000, () => {
    console.log("Servidor escuchando en el puerto 7000");
    console.log("http://localhost:7000");
})