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
    id: {
        type: Number,
        unique: true,
    },
    nombre: {
        type: String,
        unique: true,
        required: true
    },
    familia: {
        type: [String], 
        required: true
    },
    mecanismoDeAccion: {
        type: String,
        default: "Información faltante",
    },
    indicacion: {
        type: [String],
        default: "Información faltante",
    },
    presentaciones: [
        {
            presentacion: {
                type: String,
                default: "Información faltante",
            },
            dosis: {
                type: String,
                default: "Información faltante",
            }
        }
    ],
    viaAdministracion: {
        type: [String],
        default: "Información faltante",
    },
    dosisAdulto: {
        type: [String],
        requiered: true
    },
    dosisMaxAdult:{
        type: String,
        default: "Información faltante",
    },
    dosisPediatrica: {
        type: String,
        requiered: true
    },
    dosisMaxPedia: {
        type: String,
        default: "Información faltante",
    },
    riesgo: [
        {
            embarazo: {
                type: String,
                default: "desconocido",
            },
            lactancia: {
                type: String,
                default: "desconocido",
            },
            renal: {
                type: String,
                default: "desconocido",
            },
            hepatico: {
                type: String,
                default: "desconocido",
            }
        }
    ],
    contraindicaciones: {
        type: [String],
        default: "Información faltante"
    },
    ajusteRenal: {
        type: String,
        default: "No requerido ajuste"
    },
    ajusteHepatico: {
        type: String,
        default: "No requerido ajuste"
    },

});

// modelo
const Farmaco = mongoose.model('Farmaco', farmaco);

// rutas
app.get("/getfarmacos", async (req, res)=>{
    const farmacosEncontrados = await Farmaco.find();
    res.status(200).json(farmacosEncontrados);
})






// escuchar el puerto
app.listen(7000, () => {
    console.log("Servidor escuchando en el puerto 7000");
    console.log("http://localhost:7000");
})

// 