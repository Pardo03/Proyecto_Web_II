/*
const mongoose = require("mongoose");

const clientSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
    },
    telefono: {
      type: String,
      trim: true,
    },
    direccion: {
      type: String,
      trim: true,
    },
    ciudad: {
      type: String,
    },
    provincia: {
      type: String,
    },
    codigoPostal: {
      type: String,
    },
    pais: {
      type: String,
    },

    // Usuario que crea el cliente
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Para que los usuarios de la misma compañía puedan ver el cliente
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Soft delete
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Client", clientSchema);
*/

const mongoose = require("mongoose");
const mongooseDelete = require("mongoose-delete");

const clientSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
    },
    telefono: {
      type: String,
      trim: true,
    },
    direccion: {
      type: String,
      trim: true,
    },
    ciudad: {
      type: String,
    },
    provincia: {
      type: String,
    },
    codigoPostal: {
      type: String,
    },
    pais: {
      type: String,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Aplicamos el plugin de mongoose-delete
clientSchema.plugin(mongooseDelete, { deletedAt: true, overrideMethods: "all" });

module.exports = mongoose.model("Client", clientSchema);
