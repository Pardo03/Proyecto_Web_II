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


//Esta es la parte para generar el PDF del albarán
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const User = require("../models/User");

// GET /api/deliverynote/pdf/:id
exports.generatePDFDeliveryNote = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.user.id;

    const note = await DeliveryNote.findOne({ _id: id })
      .populate("cliente")
      .populate("proyecto")
      .populate("usuario");

    if (!note) return res.status(404).json({ message: "Albarán no encontrado" });

    const isOwner = note.usuario._id.toString() === usuarioId;
    const isGuest = req.user.role === "guest" && req.user.owner?.toString() === note.usuario._id.toString();

    if (!isOwner && !isGuest) {
      return res.status(403).json({ message: "Acceso no autorizado" });
    }

    const doc = new PDFDocument();
    const filePath = path.join(__dirname, `../pdfs/albaran_${id}.pdf`);
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    // Encabezado
    doc.fontSize(18).text("ALBARÁN", { align: "center" });
    doc.moveDown();

    doc.fontSize(12).text(`Usuario: ${note.usuario.nombre || note.usuario.email}`);
    doc.text(`Cliente: ${note.cliente.nombre}`);
    doc.text(`Proyecto: ${note.proyecto.nombre}`);
    doc.text(`Fecha: ${new Date(note.createdAt).toLocaleDateString()}`);
    doc.moveDown();

    doc.fontSize(14).text("Líneas:");
    doc.moveDown(0.5);

    note.items.forEach((item, i) => {
      doc.fontSize(12).text(
        `${i + 1}. [${item.tipo}] ${item.descripcion} - Cantidad: ${item.cantidad}, Precio unitario: ${item.precioUnitario}€`
      );
    });

    doc.moveDown();
    doc.fontSize(14).text(`Total: ${note.total} €`);

    // Firma si existe
    if (note.firmaUrl) {
      doc.addPage();
      doc.fontSize(16).text("Firma del cliente:", { align: "left" });
      doc.image(note.firmaUrl, {
        fit: [250, 150],
        align: "center",
        valign: "center",
      });
    }

    doc.end();

    writeStream.on("finish", () => {
      res.download(filePath, `albaran_${id}.pdf`, () => {
        fs.unlinkSync(filePath); // Opcional: elimina después de enviar
      });
    });
  } catch (error) {
    console.error("Error al generar PDF:", error);
    res.status(500).json({ message: "Error al generar el PDF" });
  }
};