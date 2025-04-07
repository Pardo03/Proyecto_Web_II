require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const connectDB = require("./config/db");

// Swagger dependencies
const swaggerUi = require("swagger-ui-express");
const swaggerSpecs = require("./docs/swagger");

connectDB();

const app = express();
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));

// Routes
const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);

const clientRoutes = require("./routes/clientRoutes");
app.use("/api/client", clientRoutes);

const projectRoutes = require("./routes/projectRoutes");
app.use("/api/project", projectRoutes);

const deliveryNoteRoutes = require("./routes/deliveryNoteRoutes");
app.use("/api/deliverynote", deliveryNoteRoutes);

// Swagger documentation route
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Static file serving for logos
app.use("/uploads", express.static("uploads"));

app.get("/", (req, res) => {
  res.send("API Gestión de Usuarios esta funcionando");
});

const PORT = process.env.PORT || 3000;

// SOLO iniciar el servidor si no es un test
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
}

module.exports = app; // Exporto solo la app para pruebas
