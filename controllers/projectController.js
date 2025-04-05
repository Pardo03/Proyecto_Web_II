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

// Actualiza un proyecto
exports.updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion } = req.body;
    const user = req.user;

    const project = await Project.findOne({
      _id: id,
      $or: [
        { createdBy: user.id },
        { companyId: user.companyId },
      ],
    });

    if (!project) {
      return res.status(404).json({ message: "Proyecto no encontrado o sin permisos" });
    }

    // Verifica duplicados si cambia el nombre
    if (nombre && nombre !== project.nombre) {
      const existing = await Project.findOne({
        nombre,
        clienteId: project.clienteId,
        $or: [
          { createdBy: user.id },
          { companyId: user.companyId },
        ],
      });

      if (existing) {
        return res.status(409).json({ message: "Ya existe un proyecto con ese nombre para este cliente" });
      }
    }

    if (nombre) project.nombre = nombre;
    if (descripcion) project.descripcion = descripcion;

    await project.save();

    res.status(200).json({
      message: "Proyecto actualizado correctamente",
      project,
    });
  } catch (error) {
    console.error("Error al actualizar proyecto:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

// Para obtener todos los proyectos
exports.getAllProjects = async (req, res) => {
  try {
    const user = req.user;

    const projects = await Project.find({
      isArchived: false,
      $or: [
        { createdBy: user.id },
        { companyId: user.companyId },
      ],
    }).populate("clienteId", "nombre email").sort({ createdAt: -1 });

    res.status(200).json({ projects });
  } catch (error) {
    console.error("Error al obtener proyectos:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};


// Para obtener un proyecto específico por ID
exports.getProjectById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const project = await Project.findOne({
      _id: id,
      $or: [
        { createdBy: user.id },
        { companyId: user.companyId },
      ],
    }).populate("clienteId", "nombre email direccion");

    if (!project) {
      return res.status(404).json({ message: "Proyecto no encontrado o sin permisos" });
    }

    res.status(200).json({ project });
  } catch (error) {
    console.error("Error al obtener proyecto por ID:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

// Para archivar un proyecto
exports.archiveProject = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const project = await Project.findOne({
      _id: id,
      isArchived: false,
      $or: [
        { createdBy: user.id },
        { companyId: user.companyId }
      ]
    });

    if (!project) {
      return res.status(404).json({ message: "Proyecto no encontrado o ya archivado" });
    }

    project.isArchived = true;
    await project.save();

    res.status(200).json({ message: "Proyecto archivado correctamente" });
  } catch (error) {
    console.error("Error al archivar proyecto:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

// Para recuperar un proyecto archivado
exports.recoverProject = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const project = await Project.findOne({
      _id: id,
      isArchived: true,
      $or: [
        { createdBy: user.id },
        { companyId: user.companyId }
      ]
    });

    if (!project) {
      return res.status(404).json({ message: "Proyecto no encontrado o no está archivado" });
    }

    project.isArchived = false;
    await project.save();

    res.status(200).json({ message: "Proyecto recuperado correctamente" });
  } catch (error) {
    console.error("Error al recuperar proyecto:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

// Para poder ver los proyectos archivados
exports.getArchivedProjects = async (req, res) => {
  try {
    const user = req.user;

    const archived = await Project.find({
      isArchived: true,
      $or: [
        { createdBy: user.id },
        { companyId: user.companyId }
      ]
    }).populate("clienteId", "nombre");

    res.status(200).json({ archived });
  } catch (error) {
    console.error("Error al listar archivados:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

// Para eliminar un proyecto permanentemente 
exports.deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    const soft = req.query.soft !== "false"; // por defecto es true
    const user = req.user;

    const project = await Project.findOne({
      _id: id,
      $or: [
        { createdBy: user.id },
        { companyId: user.companyId }
      ]
    });

    if (!project) {
      return res.status(404).json({ message: "Proyecto no encontrado o sin permisos" });
    }

    if (soft) {
      project.isArchived = true;
      await project.save();
      return res.status(200).json({ message: "Proyecto archivado (soft delete)" });
    } else {
      await project.deleteOne();
      return res.status(200).json({ message: "Proyecto eliminado permanentemente (hard delete)" });
    }
  } catch (error) {
    console.error("Error al eliminar proyecto:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

