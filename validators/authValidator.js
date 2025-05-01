const { body } = require("express-validator");

// Registro de usuario
const registerValidator = [
  body("email")
    .notEmpty().withMessage("El email es obligatorio")
    .isEmail().withMessage("Email inválido"),
  body("password")
    .notEmpty().withMessage("La contraseña es obligatoria")
    .isLength({ min: 8 }).withMessage("La contraseña debe tener al menos 8 caracteres"),
];

// Login de usuario
const loginValidator = [
  body("email")
    .notEmpty().withMessage("El email es obligatorio")
    .isEmail().withMessage("El email debe ser válido"),
  body("password")
    .notEmpty().withMessage("La contraseña es obligatoria"),
];

// Validación de email con código
const validateCodeValidator = [
  body("code")
    .notEmpty().withMessage("El código de validación es obligatorio")
    .isLength({ min: 6, max: 6 }).withMessage("El código debe tener 6 caracteres"),
];

// Olvidé mi contraseña
const forgotPasswordValidator = [
  body("email")
    .notEmpty().withMessage("El email es obligatorio")
    .isEmail().withMessage("El email debe ser válido"),
];

// Resetear contraseña
const resetPasswordValidator = [
  body("token")
    .notEmpty().withMessage("El token es obligatorio"),
  body("newPassword")
    .notEmpty().withMessage("La nueva contraseña es obligatoria")
    .isLength({ min: 8 }).withMessage("La nueva contraseña debe tener al menos 8 caracteres"),
];

module.exports = {
  registerValidator,
  loginValidator,
  validateCodeValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
};
