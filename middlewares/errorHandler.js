const sendErrorToSlack = require("../utils/sendErrorToSlack");

const errorHandler = (err, req, res, next) => {
  console.error(err); // Siempre log local
  
  let statusCode = 500;
  let message = "Error interno del servidor";

  // Errores de validación de mongoose
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = err.message || "Datos inválidos enviados.";
  }

  // Errores de token JWT
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Token inválido.";
  }

  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token expirado.";
  }

  // Errores de multer
  if (err.message && (err.message.includes("Solo se permiten imágenes") || err.message.includes("Formato no válido"))) {
    statusCode = 400;
    message = err.message;
  }

  // Errores personalizados con statusCode
  if (err.statusCode && err.message) {
    statusCode = err.statusCode;
    message = err.message;
  }

  res.status(statusCode).json({ message });

  //Si es 500, se reporta a Slack
  if (statusCode === 500) {
    sendErrorToSlack({
      error: err,
      path: req.originalUrl,
      method: req.method,
      body: req.body,
      user: req.user || null,
    });
  }
};

module.exports = errorHandler;
