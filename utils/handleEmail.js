const nodemailer = require("nodemailer");
const { google } = require("googleapis");

const OAuth2 = google.auth.OAuth2;

const createTransporter = async () => {
    try {
      const oauth2Client = new OAuth2(
        process.env.CLIENT_ID,
        process.env.CLIENT_SECRET,
        "https://developers.google.com/oauthplayground"
      );
  
      oauth2Client.setCredentials({
        refresh_token: process.env.REFRESH_TOKEN,
      });
  
      const accessToken = await oauth2Client.getAccessToken();
      
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          type: "OAuth2",
          user: process.env.EMAIL,
          accessToken: accessToken.token,
          clientId: process.env.CLIENT_ID,
          clientSecret: process.env.CLIENT_SECRET,
          refreshToken: process.env.REFRESH_TOKEN,
        },
      });
  
      return transporter;
    } catch (error) {
      console.error("Error creando el transporter de Gmail:", error);
      throw new Error("No se pudo crear el transporter para enviar emails");
    }
};
  
const sendEmail = async (emailOptions) => {
try {
    const emailTransporter = await createTransporter();
    const info = await emailTransporter.sendMail(emailOptions);
    console.log("Email enviado correctamente:", info.messageId);
    return info;
} catch (error) {
    console.error("Error enviando email:", error);
    throw new Error("No se pudo enviar el email");
}
};
  
module.exports = { sendEmail };
