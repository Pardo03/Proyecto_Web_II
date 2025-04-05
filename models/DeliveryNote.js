const mongoose = require("mongoose");

const deliveryNoteSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Client",
    required: true,
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project",
    required: true,
  },
  horas: [
    {
      persona: { type: String },
      horas: { type: Number },
      descripcion: { type: String },
    },
  ],
  materiales: [
    {
      nombre: { type: String },
      cantidad: { type: Number },
      descripcion: { type: String },
    },
  ],
  firmado: {
    type: Boolean,
    default: false,
  },
  firmaUrl: {
    type: String,
  },
  pdfUrl: {
    type: String,
  },
}, { timestamps: true });

module.exports = mongoose.model("DeliveryNote", deliveryNoteSchema);
