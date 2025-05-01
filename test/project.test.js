require("dotenv").config();
const request = require("supertest");
const app = require("../index");
const mongoose = require("mongoose");
const Project = require("../models/Project");
const User = require("../models/User");
const Client = require("../models/Client");

let token;
let projectId;
let clientId;

beforeAll(async () => {
  await mongoose.connect(process.env.DB_URI_TEST);

  // Crear usuario y cliente
  await User.deleteMany({ email: "projectuser@test.com" });
  const register = await request(app).post("/api/auth/register").send({
    email: "projectuser@test.com",
    password: "Password123!",
  });
  token = register.body.token;

  const user = await User.findOne({ email: "projectuser@test.com" });
  user.status = "verified";
  await user.save();

  const clientRes = await request(app)
    .post("/api/client")
    .set("Authorization", `Bearer ${token}`)
    .send({
      nombre: "Cliente Test Proyectos",
      email: "clienteproyecto@test.com",
      telefono: "123456789",
      direccion: "Calle Proyecto 123",
      ciudad: "TestCity",
      provincia: "TestProv",
      codigoPostal: "12345",
      pais: "España",
    });

  clientId = clientRes.body.client._id;
});

afterAll(async () => {
  await Project.deleteMany({});
  await Client.deleteMany({});
  await User.deleteMany({ email: "projectuser@test.com" });
  await mongoose.connection.close();
});

describe("Projects API", () => {
  it("Debe crear un nuevo proyecto", async () => {
    const res = await request(app)
      .post("/api/project")
      .set("Authorization", `Bearer ${token}`)
      .send({
        nombre: "Proyecto Test 1",
        descripcion: "Proyecto de pruebas",
        clienteId: clientId,
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.project.nombre).toBe("Proyecto Test 1");
    projectId = res.body.project._id;
  });

  it("Debe obtener todos los proyectos", async () => {
    const res = await request(app)
      .get("/api/project")
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.projects)).toBe(true);
  });

  it("Debe obtener un proyecto por ID", async () => {
    const res = await request(app)
      .get(`/api/project/${projectId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.project._id).toBe(projectId);
  });

  it("Debe actualizar el proyecto", async () => {
    const res = await request(app)
      .put(`/api/project/${projectId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ nombre: "Proyecto Actualizado" });

    expect(res.statusCode).toBe(200);
    expect(res.body.project.nombre).toBe("Proyecto Actualizado");
  });

  it("Debe archivar el proyecto", async () => {
    const res = await request(app)
      .patch(`/api/project/archive/${projectId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
  });

  it("Debe listar proyectos archivados", async () => {
    const res = await request(app)
      .get("/api/project/archived")
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.archived.length).toBeGreaterThan(0);
  });

  it("Debe recuperar el proyecto archivado", async () => {
    const res = await request(app)
      .patch(`/api/project/recover/${projectId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
  });

  it("Debe eliminar el proyecto (hard delete)", async () => {
    const res = await request(app)
      .delete(`/api/project/${projectId}?soft=false`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
  });
});

describe("Project API - Casos negativos", () => {
    it("No debe crear proyecto sin nombre", async () => {
      const res = await request(app)
        .post("/api/project")
        .set("Authorization", `Bearer ${token}`)
        .send({
          descripcion: "Sin nombre",
          clienteId: clientId,
        });
  
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe("El nombre del proyecto es obligatorio");
    });
  
    it("No debe crear proyecto con cliente inválido", async () => {
      const res = await request(app)
        .post("/api/project")
        .set("Authorization", `Bearer ${token}`)
        .send({
          nombre: "Proyecto Inválido",
          descripcion: "Cliente falso",
          clienteId: "000000000000000000000000",
        });
  
      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe("Cliente no válido o no accesible");
    });
  
    it("No debe obtener proyecto con ID inválido", async () => {
      const res = await request(app)
        .get("/api/project/000000000000000000000000")
        .set("Authorization", `Bearer ${token}`);
  
      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe("Proyecto no encontrado o sin permisos");
    });
  
    it("No debe actualizar proyecto inexistente", async () => {
      const res = await request(app)
        .put("/api/project/000000000000000000000000")
        .set("Authorization", `Bearer ${token}`)
        .send({ nombre: "Update Fail" });
  
      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe("Proyecto no encontrado o sin permisos");
    });
  
    it("No debe archivar proyecto inexistente", async () => {
      const res = await request(app)
        .patch("/api/project/archive/000000000000000000000000")
        .set("Authorization", `Bearer ${token}`);
  
      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe("Proyecto no encontrado o ya archivado");
    });
  
    it("No debe recuperar proyecto que no está archivado", async () => {
      // Creamos uno no archivado
      const newProject = await request(app)
        .post("/api/project")
        .set("Authorization", `Bearer ${token}`)
        .send({
          nombre: "Proyecto No Archivado",
          descripcion: "Prueba",
          clienteId: clientId,
        });
  
      const newId = newProject.body.project._id;
  
      const res = await request(app)
        .patch(`/api/project/recover/${newId}`)
        .set("Authorization", `Bearer ${token}`);
  
      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe("Proyecto no encontrado o no está archivado");
    });
  
    it("No debe acceder sin token", async () => {
      const res = await request(app).get("/api/project");
      expect(res.statusCode).toBe(401);
      expect(res.body.message).toBeDefined(); // opcional
    });
  
    it("No debe acceder con token inválido", async () => {
      const res = await request(app)
        .get("/api/project")
        .set("Authorization", "Bearer TOKEN_FALSO");
  
      expect(res.statusCode).toBe(401); // El middleware lanza 401
      expect(res.body.message).toBeDefined(); // opcional
    });
  });
  
  
