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

// Swagger documentation route
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Static file serving for logos
app.use("/uploads", express.static("uploads"));

app.get("/", (req, res) => {
  res.send("API Gestión de Usuarios esta funcionando");
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

// Exporta tanto 'app' como 'server' para usarlos en los tests
module.exports = { app, server };
