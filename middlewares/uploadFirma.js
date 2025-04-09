const multer = require("multer");

// Uso almacenamiento en memoria (no en disco)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) cb(null, true);
  else cb(new Error("Formato no válido. Solo se permiten imágenes."), false);
};

const uploadFirma = multer({ storage, fileFilter });

module.exports = uploadFirma;
