const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
  tipo: {
    type: String,
    enum: ["hora", "material"],
    required: true,
  },
  descripcion: {
    type: String,
    required: true,
  },
  cantidad: {
    type: Number,
    required: true,
  },
  precioUnitario: {
    type: Number,
    required: true,
  },
});

const deliveryNoteSchema = new mongoose.Schema(
  {
    proyecto: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    cliente: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [itemSchema],
    total: {
      type: Number,
      required: true,
    },
    firmada: {
      type: Boolean,
      default: false,
    },
    firmaUrl: {
      type: String, // Enlace a imagen de la firma (en IPFS o cloud)
    },
    pdfUrl: {
      type: String, // Enlace al PDF generado (si se sube a la nube)
    },
    archivado: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DeliveryNote", deliveryNoteSchema);
