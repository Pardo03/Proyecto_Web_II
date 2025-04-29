const axios = require("axios");

const sendErrorToSlack = async ({ error, path, method, body, user }) => {
  try {
    const webhookUrl = process.env.SLACK_WEBHOOK;

    if (!webhookUrl) {
      console.warn("SLACK_WEBHOOK no configurado en .env");
      return;
    }

    const message = {
      text: `* Error 500 Detectado en la API*\n
*Ruta:* \`${method} ${path}\`
*Error:* ${error.message}
*Usuario:* ${user ? `\`${JSON.stringify(user)}\`` : "No autenticado"}
*Body:* \`\`\`${JSON.stringify(body, null, 2)}\`\`\`
*Stack:* \`\`\`${error.stack || "No disponible"}\`\`\``
    };

    await axios.post(webhookUrl, message);
  } catch (err) {
    console.error("Error enviando mensaje a Slack:", err.message);
  }
};

module.exports = sendErrorToSlack;
