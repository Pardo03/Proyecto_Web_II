const axios = require("axios");
const FormData = require("form-data");
const { PINATA_KEY, PINATA_SECRET } = process.env;

const uploadToPinata = async (fileBuffer, fileName) => {
  const url = "https://api.pinata.cloud/pinning/pinFileToIPFS";
  const data = new FormData();

  //Forma correcta en Node.js
  data.append("file", fileBuffer, {
    filename: fileName,
    contentType: "image/png", // o ajusta según tipo
  });

  data.append("pinataMetadata", JSON.stringify({ name: fileName }));
  data.append("pinataOptions", JSON.stringify({ cidVersion: 0 }));

  try {
    const res = await axios.post(url, data, {
      maxBodyLength: "Infinity", // por si la imagen es grande
      headers: {
        ...data.getHeaders(),
        pinata_api_key: PINATA_KEY,
        pinata_secret_api_key: PINATA_SECRET,
      },
    });

    return res.data; // contiene IpfsHash
  } catch (err) {
    console.error("Error al subir archivo a Pinata:", err.response?.data || err.message);
    throw err;
  }
};

module.exports = { uploadToPinata };
