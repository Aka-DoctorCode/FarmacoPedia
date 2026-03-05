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
    await mongoose.connect(process.env.MONGODB_URI);
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
        match: /^[a-záéíóúüñ0-9\,./\s-]+$/gm,
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
  //       match: /^[a-záéíóúüñ0-9\,./\s-]+$/gm,
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

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// ----------------------------------------------------
// rutas
// ----------------------------------------------------

app.post("/agregarFarmaco", asyncHandler(async (req, res) => {
  const { familia, nombre } = req.body;

  // Generate unique ID based on family and name
  const id = familia && familia.length > 0
    ? `${familia[0]}.${nombre.slice(0, 5)}${randomId()}`
    : "";

  const nuevoFarmaco = new Farmaco({
    ...req.body,
    id
  });

  await nuevoFarmaco.save();

  res.status(201).json({
    success: true,
    message: "Drug successfully added to database",
    data: nuevoFarmaco
  });
}));

// GET: List all unique drug names
app.get("/farmacos", asyncHandler(async (req, res) => {
  const nombresFarmacos = await Farmaco.distinct("nombre");

  if (nombresFarmacos.length === 0) {
    return res.status(404).json({ error: "Database is empty" });
  }

  nombresFarmacos.sort();
  res.status(200).json({ nombres: nombresFarmacos });
}));

// GET: Find a specific drug by name
app.get("/farmaco/:nombre", asyncHandler(async (req, res) => {
  const { nombre } = req.params;
  const farmacoEncontrado = await Farmaco.findOne({ nombre });

  if (!farmacoEncontrado) {
    return res.status(404).json({
      error: "Drug not found",
      solution: "Try searching for a different name"
    });
  }

  res.status(200).json(farmacoEncontrado);
}));

// GET: List all unique drug families
app.get("/farmacos/familias", asyncHandler(async (req, res) => {
  const familias = await Farmaco.distinct("familia");

  if (familias.length === 0) {
    return res.status(404).json({ error: "No families found" });
  }

  familias.sort();
  res.status(200).json({ familias });
}));

// GET: List drugs belonging to a specific family
app.get("/farmacos/familia/:familia", asyncHandler(async (req, res) => {
  const { familia } = req.params;
  const farmacosEncontrados = await Farmaco.find({ familia });

  if (farmacosEncontrados.length === 0) {
    return res.status(404).json({
      error: "No drugs found in this family",
      solution: "Verify the family name"
    });
  }

  const nombres = farmacosEncontrados.map(f => f.nombre).sort();
  res.status(200).json({ nombres });
}));

// PATCH: Update drug data
app.patch("/farmaco/:nombre", asyncHandler(async (req, res) => {
  const { nombre } = req.params;
  const updatedDrug = await Farmaco.findOneAndUpdate(
    { nombre },
    { $set: req.body },
    { new: true, runValidators: true }
  );

  if (!updatedDrug) {
    return res.status(404).json({ error: "Drug not found for update" });
  }

  res.status(200).json({
    message: "Drug updated successfully",
    data: updatedDrug
  });
}));

// DELETE: Remove a drug by name
app.delete("/farmaco/:nombre", asyncHandler(async (req, res) => {
  const farmacoEliminado = await Farmaco.findOneAndDelete({
    nombre: req.params.nombre
  });

  if (!farmacoEliminado) {
    return res.status(404).json({ error: "Drug not found" });
  }

  res.status(200).json({
    message: `Drug ${farmacoEliminado.nombre} deleted`,
    data: farmacoEliminado
  });
}));

app.use((err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // Handle Mongoose Validation Errors
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors).map(val => val.message).join(", ");
  }

  // Handle Mongoose Duplicate Key Errors (Unique constraint)
  if (err.code === 11000) {
    statusCode = 400;
    message = `Duplicate field value entered: ${Object.keys(err.keyValue)}. Please use another value.`;
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    stack: process.env.NODE_ENV === "development" ? err.stack : {}
  });
});

// ----------------------------------------------------
// Port listening
// ----------------------------------------------------
// Server Port configuration for local and production
const port = process.env.PORT || 5174;

// Listen to the server on all network interfaces
app.listen(port, "0.0.0.0", () => {
  console.log(`Server running on port ${port}`);
  console.log(`Health check: http://localhost:${port}/farmacos`);
});