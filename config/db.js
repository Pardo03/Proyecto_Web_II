const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = async () => {
  try {
    // Usamos DB_URI_TEST para el entorno de pruebas y MONGO_URI para producción
    const dbURI = process.env.NODE_ENV === 'test' ? process.env.DB_URI_TEST : process.env.MONGO_URI;

    await mongoose.connect(dbURI, {
      useNewUrlParser: true,  // Eliminamos el uso de opciones obsoletas (ya no son necesarias)
      useUnifiedTopology: true,
    });

    console.log("Conectado a MongoDB");
  } catch (error) {
    console.error("Error al conectar a MongoDB:", error);
    process.exit(1);  // Salimos con error si la conexión falla
  }
};

module.exports = connectDB;

