const Project = require("../models/Project");
const Client = require("../models/Client");

exports.createProject = async (req, res) => {
  try {
    const { nombre, descripcion, clienteId } = req.body;
    const user = req.user;

    if (!nombre || !clienteId) {
      return res.status(400).json({ message: "Faltan campos obligatorios" });
    }

    // Verifica que el cliente existe y sea del usuario o su empresa
    const client = await Client.findOne({
      _id: clienteId,
      $or: [
        { createdBy: user.id },
        { companyId: user.companyId },
      ],
    });

    if (!client) {
      return res.status(404).json({ message: "Cliente no válido o no accesible" });
    }

    // Verifica que no haya un proyecto igual ya creado por este usuario o su compañía
    const existing = await Project.findOne({
      nombre,
      clienteId,
      $or: [
        { createdBy: user.id },
        { companyId: user.companyId },
      ],
    });

    if (existing) {
      return res.status(409).json({ message: "Ya existe un proyecto con ese nombre para este cliente" });
    }

    const newProject = new Project({
      nombre,
      descripcion,
      clienteId,
      createdBy: user.id,
      companyId: user.companyId || null,
    });

    await newProject.save();

    res.status(201).json({
      message: "Proyecto creado correctamente",
      project: newProject,
    });
  } catch (error) {
    console.error("Error creando proyecto:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};
