const User = require("../models/User");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();

exports.register = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validar email con expresión regular
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({ message: "Email inválido" });
    }

    // Validar password (mínimo 8 caracteres)
    if (!password || password.length < 8) {
      return res.status(400).json({ message: "La contraseña debe tener al menos 8 caracteres" });
    }

    // Comprobar si el email ya existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "El email ya está registrado" });
    }

    // Generar código de verificación de 6 dígitos
    const verificationCode = crypto.randomInt(100000, 999999).toString();

    // Crear usuario en la base de datos
    const newUser = new User({
      email,
      password,
      verificationCode,
      attemptsLeft: 3,
    });

    await newUser.save();

    // Mostrar el código en la terminal, pero no enviarlo en la API
    console.log(`El código de verificación del usuario ${email} es: ${verificationCode}`);

    // Generar token JWT
    const token = jwt.sign(
      { id: newUser._id, email: newUser.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(201).json({
      message: "Usuario registrado correctamente. Verifica tu email.",
      user: {
        email: newUser.email,
        status: newUser.status,
        role: newUser.role,
      },
      token
    });
  } catch (error) {
    console.error("Error en el registro:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

exports.validateEmail = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code || code.length !== 6) {
      return res.status(400).json({ message: "Código inválido (debe tener 6 dígitos)" });
    }

    const userId = req.user.id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    if (user.status === "verified") {
      return res.status(400).json({ message: "El email ya fue verificado" });
    }

    if (user.verificationCode === code) {
      user.status = "verified";
      user.verificationCode = undefined;
      user.attemptsLeft = undefined;
      await user.save();

      return res.status(200).json({ message: "Email verificado correctamente" });
    } else {
      user.attemptsLeft -= 1;

      if (user.attemptsLeft <= 0) {
        await user.save();
        return res.status(403).json({ message: "Demasiados intentos fallidos. Contacta soporte." });
      }

      await user.save();
      return res.status(400).json({ message: `Código incorrecto. Intentos restantes: ${user.attemptsLeft}` });
    }
  } catch (error) {
    console.error("Error en la validación del email:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};
