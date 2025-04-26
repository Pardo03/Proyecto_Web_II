const DeliveryNote = require("../models/DeliveryNote");
const Project = require("../models/Project");
const Client = require("../models/Client");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { uploadToPinata } = require("../utils/handleUploadIPFS");

// Crear albarán
exports.createDeliveryNote = async (req, res) => {
  try {
    const { proyecto, cliente, items } = req.body;
    const usuario = req.user.id;

    if (!proyecto || !cliente || !items || items.length === 0) {
      return res.status(400).json({ message: "Todos los campos son obligatorios." });
    }

    const validProject = await Project.findById(proyecto);
    const validClient = await Client.findById(cliente);
    if (!validProject || !validClient) {
      return res.status(404).json({ message: "Proyecto o cliente no válido." });
    }

    const total = items.reduce((sum, item) => sum + item.cantidad * item.precioUnitario, 0);

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

// Obtener todos los albaranes
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

// Obtener albarán por ID
exports.getDeliveryNoteById = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.user.id;

    const note = await DeliveryNote.findOne({ _id: id, usuario: usuarioId })
      .populate("cliente")
      .populate("proyecto")
      .populate("usuario");

    if (!note) return res.status(404).json({ message: "Albarán no encontrado" });

    res.status(200).json({ deliveryNote: note });
  } catch (error) {
    console.error("Error al obtener albarán:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

// Descargar PDF
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

    doc.fontSize(18).text("ALBARÁN", { align: "center" }).moveDown();
    doc.fontSize(12).text(`Usuario: ${note.usuario.nombre || note.usuario.email}`);
    doc.text(`Cliente: ${note.cliente.nombre}`);
    doc.text(`Proyecto: ${note.proyecto.nombre}`);
    doc.text(`Fecha: ${new Date(note.createdAt).toLocaleDateString()}`).moveDown();
    doc.fontSize(14).text("Líneas:").moveDown(0.5);

    note.items.forEach((item, i) => {
      doc.fontSize(12).text(
        `${i + 1}. [${item.tipo}] ${item.descripcion} - Cantidad: ${item.cantidad}, Precio unitario: ${item.precioUnitario}€`
      );
    });

    doc.moveDown();
    doc.fontSize(14).text(`Total: ${note.total} €`);

    if (note.firmaUrl) {
      try {
        const response = await axios.get(note.firmaUrl, { responseType: "arraybuffer" });
        const buffer = Buffer.from(response.data, "binary");
        const firmaPath = path.join(__dirname, `../uploads/temp_firma_${id}.png`);
        fs.writeFileSync(firmaPath, buffer);

        doc.addPage();
        doc.fontSize(16).text("Firma del cliente:", { align: "left" });
        doc.image(firmaPath, { fit: [250, 150], align: "center", valign: "center" });

        fs.unlinkSync(firmaPath);
      } catch (err) {
        console.warn("No se pudo incluir la firma:", err.message);
      }
    }

    doc.end();

    writeStream.on("finish", () => {
      res.download(filePath, `albaran_${id}.pdf`);
    });
  } catch (error) {
    console.error("Error al generar PDF:", error);
    res.status(500).json({ message: "Error al generar el PDF" });
  }
};

// Firmar albarán y subir PDF a Pinata
exports.signDeliveryNote = async (req, res) => {
  try {
    const deliveryNoteId = req.params.id;
    const userId = req.user.id;

    const note = await DeliveryNote.findOne({ _id: deliveryNoteId, usuario: userId })
      .populate("cliente")
      .populate("proyecto")
      .populate("usuario");

    if (!note) return res.status(404).json({ message: "Albarán no encontrado" });
    if (note.firmada) return res.status(400).json({ message: "Ya está firmado" });
    if (!req.file) return res.status(400).json({ message: "Imagen de firma requerida" });

    const pinataImg = await uploadToPinata(req.file.buffer, req.file.originalname);
    const firmaIPFSUrl = `https://${process.env.PINATA_GATEWAY_URL}/ipfs/${pinataImg.IpfsHash}`;

    note.firmada = true;
    note.firmaUrl = firmaIPFSUrl;

    const doc = new PDFDocument();
    const buffers = [];

    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", async () => {
      const pdfBuffer = Buffer.concat(buffers);
      const pdfPinata = await uploadToPinata(pdfBuffer, `albaran_${deliveryNoteId}_firmado.pdf`);
      const pdfIPFSUrl = `https://${process.env.PINATA_GATEWAY_URL}/ipfs/${pdfPinata.IpfsHash}`;

      note.pdfUrl = pdfIPFSUrl;
      await note.save();

      res.status(200).json({
        message: "Albarán firmado correctamente y PDF subido a IPFS",
        deliveryNote: note,
      });
    });

    doc.fontSize(18).text("ALBARÁN", { align: "center" }).moveDown();
    doc.fontSize(12).text(`Usuario: ${note.usuario.nombre || note.usuario.email}`);
    doc.text(`Cliente: ${note.cliente.nombre}`);
    doc.text(`Proyecto: ${note.proyecto.nombre}`);
    doc.text(`Fecha: ${new Date(note.createdAt).toLocaleDateString()}`).moveDown();
    doc.fontSize(14).text("Líneas:");
    note.items.forEach((item, i) => {
      doc.fontSize(12).text(
        `${i + 1}. [${item.tipo}] ${item.descripcion} - Cantidad: ${item.cantidad}, Precio unitario: ${item.precioUnitario}€`
      );
    });
    doc.moveDown();
    doc.fontSize(14).text(`Total: ${note.total} €`);

    const response = await axios.get(firmaIPFSUrl, { responseType: "arraybuffer" });
    const imageBuffer = Buffer.from(response.data, "binary");
    const tempPath = path.join(__dirname, `../uploads/temp_firma_${deliveryNoteId}.png`);
    fs.writeFileSync(tempPath, imageBuffer);

    doc.addPage();
    doc.fontSize(16).text("Firma del cliente:", { align: "left" });
    doc.image(tempPath, { fit: [250, 150], align: "center", valign: "center" });
    fs.unlinkSync(tempPath);

    doc.end();
  } catch (error) {
    console.error("Error al firmar albarán:", error);
    res.status(500).json({ message: "Error al firmar albarán" });
  }
};

// Eliminar alabaran no firmado
exports.deleteDeliveryNote = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.user.id;

    const note = await DeliveryNote.findOne({ _id: id, usuario: usuarioId });

    if (!note) {
      return res.status(404).json({ message: "Albarán no encontrado" });
    }

    if (note.firmada) {
      return res.status(403).json({ message: "No se puede eliminar un albarán ya firmado" });
    }

    await DeliveryNote.deleteOne({ _id: id });
    res.status(200).json({ message: "Albarán eliminado correctamente" });

  } catch (error) {
    console.error("Error al eliminar albarán:", error);
    res.status(500).json({ message: "Error al eliminar albarán" });
  }
};