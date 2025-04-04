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

    //FIX: Validar duplicados por createdBy y opcionalmente companyId
    const duplicateFilter = [
      { createdBy: currentUser._id }
    ];

    if (currentUser.companyId) {
      duplicateFilter.push({ companyId: currentUser.companyId });
    }

    const existingClient = await Client.findOne({
      nombre,
      $or: duplicateFilter,
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


// Para editar un cliente que ya existe
exports.updateClient = async (req, res) => {
  try {
    const clientId = req.params.id;
    const currentUser = await User.findById(req.user.id);

    if (!currentUser) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const client = await Client.findById(clientId);

    if (!client || client.isArchived) {
      return res.status(404).json({ message: "Cliente no encontrado o archivado" });
    }

    const isOwnerOrCompany = client.createdBy.equals(currentUser._id) ||
                             (client.companyId && client.companyId.equals(currentUser.companyId));

    if (!isOwnerOrCompany) {
      return res.status(403).json({ message: "No tienes permiso para editar este cliente" });
    }

    // Si intenta cambiar el nombre, validamos que no exista duplicado
    if (req.body.nombre && req.body.nombre !== client.nombre) {
      const duplicate = await Client.findOne({
        nombre: req.body.nombre,
        _id: { $ne: clientId },
        $or: [
          { createdBy: currentUser._id },
          { companyId: currentUser.companyId },
        ]
      });

      if (duplicate) {
        return res.status(409).json({ message: "Ya existe un cliente con ese nombre para este usuario o compañía" });
      }
    }

    Object.assign(client, req.body);
    await client.save();

    res.status(200).json({
      message: "Cliente actualizado correctamente",
      client,
    });
  } catch (error) {
    console.error("Error al actualizar cliente:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

// Para obtener todos los clientes
exports.getAllClients = async (req, res) => {
  try {
    const currentUser = req.user;

    const filter = {
      isArchived: false,
      $or: [
        { createdBy: currentUser.id }
      ]
    };

    if (currentUser.companyId) {
      filter.$or.push({ companyId: currentUser.companyId });
    }

    const clients = await Client.find(filter).sort({ createdAt: -1 });

    res.status(200).json({ clients });
  } catch (error) {
    console.error("Error al obtener clientes:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

//Para obtener un cliente por ID
exports.getClientById = async (req, res) => {
  try {
    const clientId = req.params.id;
    const currentUser = req.user;

    const client = await Client.findById(clientId);

    if (!client || client.isArchived) {
      return res.status(404).json({ message: "Cliente no encontrado o archivado" });
    }

    const isOwnerOrCompany = client.createdBy.equals(currentUser.id) ||
      (client.companyId && client.companyId.equals(currentUser.companyId));

    if (!isOwnerOrCompany) {
      return res.status(403).json({ message: "No tienes acceso a este cliente" });
    }

    res.status(200).json({ client });
  } catch (error) {
    console.error("Error al obtener cliente:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

