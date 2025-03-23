const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
  },
  status: {
    type: String,
    enum: ["pending", "verified"],
    default: "pending",
  },
  role: {
    type: String,
    enum: ["user", "admin", "guest"],
    default: "user",
  },
  verificationCode: {
    type: String, // Código de verificación de 6 dígitos
    required: function () {
      return this.status !== "verified";
    }
  },
  attemptsLeft: {
    type: Number,
    default: 3, // Intentos permitidos para validar el código
  },
  personalData: { // Datos personales del usuario
    nombre: { type: String },
    apellidos: { type: String },
    nif: { type: String },
  },
  companyData: { // Datos de la empresa del usuario
    nombre: { type: String },
    cif: { type: String },
    direccion: { type: String },
    esAutonomo: { type: Boolean, default: false }
  }, 
  logoUrl: { // URL de la imagen
    type: String 
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  resetToken: {
    type: String,
  },
  resetTokenExpire: {
    type: Date,
  },
  companyId: { // Esto permie que los usuarios con rol "guest" estén vinculados a quien los invitó
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

// Middleware para cifrar la contraseña antes de guardar el usuario
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

module.exports = mongoose.model("User", UserSchema);
