// imports
const express = require ('express');
const cors = require('cors');
const mongoose = require('mongoose');
// const { response } = require('express');

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
        required: true
    },
    familia: {
        type: [String], 
        required: true
    },
    id : this.familia[0] + this.nombre.slice(0, 3),
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
            tipo: {
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

// cración del Id
farmaco.virtual("id").get(function () {
    const familia = this.familia.join(" ");
    const nombre = this.nombre.slice(0, 3);
    return familia + nombre;
});

// modelo
const Farmaco = mongoose.model('Farmaco', farmaco);

// rutas
app.get("/farmacos", async (req, res)=>{
    const farmacosEncontrados = await Farmaco.find();
    res.status(200).json(farmacosEncontrados);

    if (farmacosEncontrados != null) {
        response.status(200).json(farmacosEncontrados);
    } else {
        response.status(404).json({
            "error": "No se encontraron farmacos",
            "solucion": "Intenta con otro"
        });
    }
});

app.get("/farmaco/:nombre", async (req, res)=>{
    const {nombre} = req.params;
    const farmacoEncontrado = await Farmaco.findOne({"nombre": nombre});

    if (farmacoEncontrado != null) {
        response.status(200).json(farmacoEncontrado);
    }else{
        response.status(404).json({
            "error": "No se encontro el farmaco",
            "solucion": "Intenta con otro"
        });
    }
});

app.get("/farmaco/:familia", async (req, res)=>{
    const {familia} = req.params;
    const farmacoEncontrado = await Farmaco.findAll({"familia": familia});

    if (farmacoEncontrado != null) {
        response.status(200).json(farmacoEncontrado);
    }else{
        response.status(404).json({
            "error": "No se encontro el farmaco",
            "solucion": "Intenta con otro"
        });
    }
});

app.post("/agregarFarmaco", async (req, res)=>{
    const {id, nombre, familia, mecanismoDeAccion, indicacion, presentaciones, viaAdministracion, dosisAdulto, dosisMaxAdult, dosisPediatrica, dosisMaxPedia, riesgo, contraindicaciones, ajusteRenal, ajusteHepatico} = req.body;

    try {
        const nuevoFarmaco = new Farmaco({id, nombre, familia, mecanismoDeAccion, indicacion, presentaciones, viaAdministracion, dosisAdulto, dosisMaxAdult, dosisPediatrica, dosisMaxPedia, riesgo, contraindicaciones, ajusteRenal, ajusteHepatico});

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

app.put("/farmaco/:nombre", async (req, res)=>{
    const {nombreFarmaco} = req.params;

    const {id, nombre, familia, mecanismoDeAccion, indicacion, presentaciones, viaAdministracion, dosisAdulto, dosisMaxAdult, dosisPediatrica, dosisMaxPedia, riesgo, contraindicaciones, ajusteRenal, ajusteHepatico} = req.body;

    try {
        const farmacoModificado = await Farmaco.findOneAndUpdate(
            {"nombre": nombreFarmaco},
            {id, nombre, familia, mecanismoDeAccion, indicacion, presentaciones, viaAdministracion, dosisAdulto, dosisMaxAdult, dosisPediatrica, dosisMaxPedia, riesgo, contraindicaciones, ajusteRenal, ajusteHepatico}
        );

        res.status(200).json({
            "Se actualizo el farmaco": farmacoModificado,
            "NuevosDatos": {
                "nombre": nombre,
                "familia": familia,
                "mecanismoDeAccion": mecanismoDeAccion,
                "indicacion": indicacion,
                "presentaciones": presentaciones,
                "viaAdministracion": viaAdministracion,
                "dosisAdulto": dosisAdulto,
                "dosisMaxAdult": dosisMaxAdult,
                "dosisPediatrica": dosisPediatrica,
                "dosisMaxPedia": dosisMaxPedia,
                "riesgo": riesgo,
                "contraindicaciones": contraindicaciones,
                "ajusteRenal": ajusteRenal,
                "ajusteHepatico": ajusteHepatico
            },
            "datosAnteriores" : farmacoModificado
        });
    }catch(error){
        res.status(400).json({
            "error": error,
            "Solucion": "Asegurate que el farmaco este bien escrito, o puede que este no exista aún en la base de datos"
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