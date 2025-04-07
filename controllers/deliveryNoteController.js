const DeliveryNote = require("../models/DeliveryNote");
const Project = require("../models/Project");
const Client = require("../models/Client");

// Para crear un albarán
exports.createDeliveryNote = async (req, res) => {
  try {
    const { proyecto, cliente, items } = req.body;
    const usuario = req.user.id;

    if (!proyecto || !cliente || !items || items.length === 0) {
      return res.status(400).json({ message: "Todos los campos son obligatorios." });
    }

    // Verificar proyecto y cliente existen
    const validProject = await Project.findById(proyecto);
    const validClient = await Client.findById(cliente);

    if (!validProject || !validClient) {
      return res.status(404).json({ message: "Proyecto o cliente no válido." });
    }

    const total = items.reduce(
      (sum, item) => sum + item.cantidad * item.precioUnitario,
      0
    );

    const newNote = new DeliveryNote({
      proyecto,
      cliente,
      usuario,
      items,
      total,
    });

    await newNote.save();
    res.status(201).json({ message: "Albarán creado", deliveryNote: newNote });
  } catch (error) {
    console.error("Error al crear albarán:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

//Para obtener todos los albaranes
exports.getAllDeliveryNotes = async (req, res) => {
  try {
    const usuarioId = req.user.id;
    const notes = await DeliveryNote.find({ usuario: usuarioId })
      .populate("cliente")
      .populate("proyecto")
      .sort({ createdAt: -1 });

    res.status(200).json({ deliveryNotes: notes });
  } catch (error) {
    console.error("Error al obtener albaranes:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

//Para obtener un albarán por ID
exports.getDeliveryNoteById = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.user.id;

    const note = await DeliveryNote.findOne({ _id: id, usuario: usuarioId })
      .populate("cliente")
      .populate("proyecto")
      .populate("usuario");

    if (!note) {
      return res.status(404).json({ message: "Albarán no encontrado" });
    }

    res.status(200).json({ deliveryNote: note });
  } catch (error) {
    console.error("Error al obtener albarán:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};
