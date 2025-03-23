const User = require("../models/User");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const bcrypt = require("bcrypt"); // Para encriptar contraseñas

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

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validaciones básicas
    if (!email || !password) {
      return res.status(400).json({ message: "Email y contraseña son obligatorios" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    // Comparar contraseña cifrada
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    // Generar token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({
      message: "Inicio de sesión exitoso",
      user: {
        email: user.email,
        status: user.status,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error("Error en el login:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

//PUT
exports.updatePersonalData = async (req, res) => {
  const { nombre, apellidos, nif } = req.body;

  if (!nombre || !apellidos || !nif) {
    return res.status(400).json({ message: "Nombre, apellidos y NIF son obligatorios" });
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    user.personalData = { nombre, apellidos, nif };
    await user.save();

    res.status(200).json({ message: "Datos personales actualizados correctamente" });
  } catch (error) {
    console.error("Error actualizando datos personales:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

//PATCH
exports.updateCompanyData = async (req, res) => {
  const { nombre, cif, direccion, esAutonomo } = req.body;

  if (!nombre || !cif || !direccion) {
    return res.status(400).json({ message: "Nombre, CIF y dirección son obligatorios" });
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    if (esAutonomo) {
      user.companyData = {
        nombre: user.personalData?.nombre || nombre,
        cif: user.personalData?.nif || cif,
        direccion,
        esAutonomo: true
      };
    } else {
      user.companyData = { nombre, cif, direccion, esAutonomo: false };
    }

    await user.save();

    res.status(200).json({ message: "Datos de la compañía actualizados correctamente" });
  } catch (error) {
    console.error("Error actualizando compañía:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

// Para subir la imagen del logo
exports.uploadLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No se ha subido ningún archivo" });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    user.logoUrl = `/uploads/${req.file.filename}`;
    await user.save();

    res.status(200).json({
      message: "Logo subido correctamente",
      logoUrl: user.logoUrl
    });
  } catch (error) {
    console.error("Error al subir logo:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};



