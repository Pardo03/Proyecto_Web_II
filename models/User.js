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
    required: true,
  },
  attemptsLeft: {
    type: Number,
    default: 3, // Intentos permitidos para validar el código
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
