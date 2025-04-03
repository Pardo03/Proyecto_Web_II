const Client = require("../models/Client");
const User = require("../models/User");

exports.createClient = async (req, res) => {
  try {
    const { nombre, email, telefono, direccion, ciudad, provincia, codigoPostal, pais } = req.body;

    if (!nombre) {
      return res.status(400).json({ message: "El nombre del cliente es obligatorio" });
    }

    const currentUser = await User.findById(req.user.id);
    if (!currentUser) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // Verificar si ya existe un cliente con ese nombre para el usuario o su compañía
    const existingClient = await Client.findOne({
      nombre,
      $or: [
        { createdBy: currentUser._id },
        { companyId: currentUser.companyId },
      ],
    });

    if (existingClient) {
      return res.status(409).json({ message: "Ese cliente ya existe para este usuario o su compañía" });
    }

    const newClient = new Client({
      nombre,
      email,
      telefono,
      direccion,
      ciudad,
      provincia,
      codigoPostal,
      pais,
      createdBy: currentUser._id,
      companyId: currentUser.companyId || null,
    });

    await newClient.save();

    res.status(201).json({
      message: "Cliente creado correctamente",
      client: newClient,
    });
  } catch (error) {
    console.error("Error al crear cliente:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};
