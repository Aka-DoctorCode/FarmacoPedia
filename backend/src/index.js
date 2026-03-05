// imports
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

// app
const app = express();

// middlewares
app.use(express.json());
app.use(cors());

// conexion base de datos
async function connectDatabase() {
  try {
    await mongoose.connect(process.env.DB_URI);
    console.log("Database connection successful");
  } catch (error) {
    console.error("Database connection failed:", error.message);
  }
}
connectDatabase();

// Schema de los farmacos
const farmaco = new mongoose.Schema({
  nombre: {
    type: String,
    unique: true,
    required: true,
    match: /^[a-záéíóúüñA-ZÁÉÍÓÚÜÑ\s-]+$/i,
  },
  familia: {
    type: [String],
    required: true,
    match: /^[a-záéíóúüñA-ZÁÉÍÓÚÜÑ\s-]+$/,
  },
  id: {
    type: String,
    unique: true,
  },
  mecanismoDeAccion: {
    type: String,
    match: /^[a-záéíóúüñA-ZÁÉÍÓÚÜÑ0-9\,.;:()%+*/<>≤≥÷\s-]+$/gm,
  },
  indicaciones: {
    type: [String],
    match: /^[a-záéíóúüñA-ZÁÉÍÓÚÜÑ\s]+$/gm,
  },
  presentaciones: [
    {
      tipo: {
        type: String,
        match: /^[a-záéíóúüñA-ZÁÉÍÓÚÜÑ\s]+$/gm,
      },
      composicion: {
        type: [String],
        match: /^[a-záéíóúüñ0-9\,.-/\s]+$/gm,
      },
      viasAdministracion: {
        type: [String],
        match: /^[a-záéíóúüñA-ZÁÉÍÓÚÜÑ\s]+$/gm,
      },
    },
  ],
  // nombresComercial: [
  //   {
  //     nombre: {
  //       type: String,
  //       match: /^[a-záéíóúüñA-ZÁÉÍÓÚÜÑ\s]+$/gm,
  //     },
  //     composicion: {
  //       type: [String],
  //       match: /^[a-záéíóúüñ0-9\,.-/\s]+$/gm,
  //     },
  //     paises: {
  //       type: [String],
  //       match: /^[a-záéíóúüñA-ZÁÉÍÓÚÜÑ\s]+$/gm,
  //     },
  //   },
  // ],
  posologia: {
    dosisAdulto: {
      viaDeAdministracion: [
        {
          via: {
            type: String,
            match: /^[a-záéíóúüñA-ZÁÉÍÓÚÜÑ\s]+$/gm,
          },
          dosis: {
            type: [String],
            match: /^[a-záéíóúüñA-ZÁÉÍÓÚÜÑ0-9\,.;:()%+*/<>≤≥÷\s-]+$/gm,
          },
        },
      ],
    },
    dosisMaxAdulto: {
      type: [String],
      match: /^[a-záéíóúüñA-ZÁÉÍÓÚÜÑ0-9\,.;:()%+*/<>≤≥÷\s-]+$/gm,
    },
    dosisPediatrica: {
      viaDeAdministracion: [
        {
          via: {
            type: String,
            match: /^[a-záéíóúüñA-ZÁÉÍÓÚÜÑ\s]+$/gm,
          },
          dosis: {
            type: [String],
            match: /^[a-záéíóúüñA-ZÁÉÍÓÚÜÑ0-9\,.;:()%+*/<>≤≥÷\s-]+$/gm,
          },
        },
      ],
    },
    dosisMaxPediatrica: {
      type: [String],
      match: /^[a-záéíóúüñA-ZÁÉÍÓÚÜÑ0-9\,.;:()%+*/<>≤≥÷\s-]+$/gm,
    },
  },
  riesgo: {
        embarazo: {
            type: String,
            match: /^[a-záéíóúüñA-ZÁÉÍÓÚÜÑ\s]+$/gm,
        },
        lactancia: {
            type: String,
            match: /^[a-záéíóúüñA-ZÁÉÍÓÚÜÑ\s]+$/gm,
        },
        renal: {
            riesgo: {
                type: String,
                match: /^[a-záéíóúüñA-ZÁÉÍÓÚÜÑ\s]+$/gm,
            },
            ajusteRenal: {
                type: String,
                match: /^[a-záéíóúüñA-ZÁÉÍÓÚÜÑ0-9\,.;:()%+*/<>≤≥÷\s-]+$/gm,
            },
        },
        hepatico: {
            riesgo: {
                type: String,
                match: /^[a-záéíóúüñA-ZÁÉÍÓÚÜÑ\s]+$/gm,
            },
            ajusteHepatico: {
                type: String,
                match: /^[a-záéíóúüñA-ZÁÉÍÓÚÜÑ0-9\,.;:()%+*/<>≤≥÷\s-]+$/gm,
            },
        },
    },
  contraindicaciones: {
    type: [String],
    match: /^[a-záéíóúüñA-ZÁÉÍÓÚÜÑ\s]+$/gm,
  },
  interacciones: {
    type: [String],
    match: /^[a-záéíóúüñA-ZÁÉÍÓÚÜÑ\s]+$/gm,
  },
  reaccionesAdversas: {
    type: [String],
    match: /^[a-záéíóúüñA-ZÁÉÍÓÚÜÑ\s]+$/gm,
  },
  sobreDosis: {
    type: String,
    match: /^[a-záéíóúüñA-ZÁÉÍÓÚÜÑ0-9\,.;:()%+*/<>≤≥÷\s-]+$/gm,
  },
});

// modelo
const Farmaco = mongoose.model("Farmaco", farmaco);

const randomId = () => {
  const randomNumber = Math.floor(10 + Math.random() * 90);
  return randomNumber.toString();
};
// rutas
app.post("/agregarFarmaco", async (req, res) => {
  const {
    nombre,
    familia,
    mecanismoDeAccion,
    indicaciones,
    presentaciones,
    // nombresComercial,
    posologia,
    riesgo,
    contraindicaciones,
    interacciones,
    reaccionesAdversas,
    sobreDosis,
  } = req.body;
  const id =
    familia && familia.length > 0
      ? familia[0] + "." + nombre.slice(0, 5) + randomId()
      : "";
  try {
    const nuevoFarmaco = new Farmaco({
      id,
      nombre,
      familia,
      mecanismoDeAccion,
      indicaciones,
      presentaciones,
      // nombresComercial,
      posologia,
      riesgo,
      contraindicaciones,
      interacciones,
      reaccionesAdversas,
      sobreDosis,
    });
    await nuevoFarmaco.save();
    res.status(200).json({
      "Se agrego con exito a la base de datos": nuevoFarmaco,
    });
  } catch (error) {
    console.log(error);
    res.status(404).json({
      error: error,
      "Solución 1": `verifica que ${nombre} no exista en la base de datos`,
      "Solución 2": "asegurate de que se cumple el schema",
    });
  }
});

app.get("/farmacos", async (req, res) => {
  const farmacosEncontrados = await Farmaco.find();
  let nombresFarmacos = [];
  if (farmacosEncontrados != null) {
    farmacosEncontrados.map((farmaco) => {
      if (!nombresFarmacos.includes(farmaco.nombre))
        nombresFarmacos.push(farmaco.nombre);
    });
    nombresFarmacos.sort();
    res.status(200).json({ nombres: nombresFarmacos });
  } else {
    res.status(404).json({
      error: "No se encontraron farmacos la base de datos esta vacia",
    });
  }
});

app.get("/farmaco/:nombre", async (req, res) => {
  const { nombre } = req.params;
  const farmacoEncontrado = await Farmaco.findOne({ nombre: nombre });
  console.log(farmacoEncontrado);

  if (farmacoEncontrado != null) {
    res.status(200).json(farmacoEncontrado);
  } else {
    res.status(404).json({
      error: "No se encontro el farmaco",
      solucion: "Intenta con otro",
    });
  }
});

app.get("/farmacos/familias", async (req, res) => {
  const farmacosEnBD = await Farmaco.find();
  let familias = [];
  if (farmacosEnBD.length > 0) {
    farmacosEnBD.map((farmaco) => {
      farmaco.familia.map((familia) => {
        if (familias.includes(familia)) {
        } else {
          familias.push(familia);
        }
      });
    });
    familias.sort();
    res.status(200).json({ familias: familias });
  } else {
    res.status(404).json({
      error: "No se encontraron farmacos en esta familia",
      solucion: "Intenta con otra familia",
    });
  }
});

app.get("/farmacos/familia/:familia", async (req, res) => {
  const { familia } = req.params;
  const farmacosEncontrados = await Farmaco.find({ familia });
  let nombres = [];
  if (farmacosEncontrados.length > 0) {
    farmacosEncontrados.map((farmaco) => {
      if (!nombres.includes(farmaco.nombre)) nombres.push(farmaco.nombre);
    });
    nombres.sort();
    res.status(200).json({ nombres: nombres });
  } else {
    res.status(404).json({
      error: "No se encontraron farmacos en esta familia",
      solucion: "Intenta con otra familia",
    });
  }
});

app.patch("/farmaco/:nombre", async (req, res) => {
  const nuevosDatos = req.body;

  try {
    await Farmaco.updateOne(
      { nombre: req.params.nombre },
      { $set: nuevosDatos }
    );
    res.status(200).json({
      "Se actualizo el farmaco": `${nuevosDatos.nombre}`,
      NuevosDatos: { nuevosDatos },
    });
  } catch (error) {
    res.status(400).json({
      error: error,
      Solución:
        "Asegurate que el farmaco este bien escrito, o puede que este no exista en la base de datos",
    });
  }
});

app.delete("/farmaco/:nombre", async (req, res) => {
  const farmacoAEliminar = await Farmaco.findOneAndDelete({
    nombre: req.params.nombre,
  });

  farmacoAEliminar != null
    ? res.status(200).json({
      respuesta: `Se elimino el farmaco ${farmacoAEliminar.nombre}`,
      farmaco: farmacoAEliminar,
    })
    : res.status(404).json({
      respuesta: "No se encontro el farmaco",
      farmaco: farmacoAEliminar,
    });
});

// escuchar el puerto
app.listen(5174, () => {
  console.log("Servidor escuchando en el puerto 5174");
  console.log("http://localhost:5174");
});
