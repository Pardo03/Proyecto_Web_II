const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "OnBoarding API - User Registration and Authentication",
      version: "1.0.0",
      description: "This API handles user registration, login, email verification, and profile management.",
      license: {
        name: "MIT",
        url: "https://spdx.org/licenses/MIT.html",
      },
      contact: {
        name: "Your Name",
        url: "https://your-website.com",
        email: "your-email@example.com",
      },
    },
    servers: [
      {
        url: "http://localhost:3000", // Local server URL
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
        },
      },
      schemas: {
        user: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: {
              type: "string",
              example: "user@example.com",
            },
            password: {
              type: "string",
              example: "Password123!",
            },
          },
        },
        login: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: {
              type: "string",
              example: "user@example.com",
            },
            password: {
              type: "string",
              example: "Password123!",
            },
          },
        },
        validationCode: {
          type: "object",
          required: ["email", "validationCode"],
          properties: {
            email: {
              type: "string",
              example: "user@example.com",
            },
            validationCode: {
              type: "string",
              example: "123456",
            },
          },
        },
      },
    },
  },
  apis: ["./routes/*.js"], // Path to your API routes
};

module.exports = swaggerJsdoc(options);
