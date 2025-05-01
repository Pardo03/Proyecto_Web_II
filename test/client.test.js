require("dotenv").config();
const supertest = require("supertest");
const app = require("../index");
const mongoose = require("mongoose");
const request = require("supertest")(app);

const User = require("../models/User");
const Client = require("../models/Client");

let token;
let clientId;

beforeAll(async () => {
  await mongoose.connect(process.env.DB_URI_TEST);
  await User.deleteMany({ email: "cliente@test.com" });
  await Client.deleteMany({});

  // Crear usuario y login
  await request.post("/api/auth/register").send({
    email: "cliente@test.com",
    password: "Cliente123!",
  });

  const login = await request.post("/api/auth/login").send({
    email: "cliente@test.com",
    password: "Cliente123!",
  });

  token = login.body.token;
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe("Clientes API", () => {
  it("Debe crear un cliente", async () => {
    const res = await request
      .post("/api/client")
      .set("Authorization", `Bearer ${token}`)
      .send({
        nombre: "Cliente Test S.L.",
        email: "cliente@email.com",
        telefono: "123456789",
        direccion: "Calle Central 1",
        ciudad: "Madrid",
        provincia: "Madrid",
        codigoPostal: "28001",
        pais: "España",
      });

    expect(res.status).toBe(201);
    expect(res.body.client.nombre).toBe("Cliente Test S.L.");
    clientId = res.body.client._id;
  });

  it("Debe obtener todos los clientes del usuario", async () => {
    const res = await request
      .get("/api/client")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.clients)).toBe(true);
    expect(res.body.clients.length).toBeGreaterThan(0);
  });

  it("Debe obtener un cliente por ID", async () => {
    const res = await request
      .get(`/api/client/${clientId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.client._id).toBe(clientId);
  });

  it("Debe actualizar un cliente por ID", async () => {
    const res = await request
      .put(`/api/client/${clientId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ telefono: "987654321" });

    expect(res.status).toBe(200);
    expect(res.body.client.telefono).toBe("987654321");
  });

  it("Debe archivar el cliente", async () => {
    const res = await request
      .patch(`/api/client/archive/${clientId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  it("Debe mostrar el cliente como archivado", async () => {
    const res = await request
      .get("/api/client/archived")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    const archived = res.body.clients.find((c) => c._id === clientId);
    expect(archived).toBeDefined();
  });

  it("Debe recuperar el cliente archivado", async () => {
    const res = await request
      .patch(`/api/client/recover/${clientId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  it("Debe eliminar el cliente permanentemente", async () => {
    const res = await request
      .delete(`/api/client/${clientId}?soft=false`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  it("No debe encontrar el cliente eliminado", async () => {
    const res = await request
      .get(`/api/client/${clientId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});

describe("Casos negativos de clientes", () => {
    it("No debe crear cliente sin nombre", async () => {
      const res = await request
        .post("/api/client")
        .set("Authorization", `Bearer ${token}`)
        .send({ email: "sin-nombre@email.com" });
  
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/nombre.*obligatorio/i);
    });
  
    it("No debe obtener cliente con ID inexistente", async () => {
      const fakeId = "000000000000000000000000"; // ID válido pero inexistente
      const res = await request
        .get(`/api/client/${fakeId}`)
        .set("Authorization", `Bearer ${token}`);
  
      expect(res.status).toBe(404);
    });
  
    it("No debe recuperar cliente que no está archivado", async () => {
      // Creamos uno temporal 
      const temp = await request
        .post("/api/client")
        .set("Authorization", `Bearer ${token}`)
        .send({
          nombre: "Cliente Temporal",
          email: "temporal@email.com",
          telefono: "111111111"
        });
        
    
      expect(temp.status).toBe(201);
      const clientId = temp.body.client?._id;
      expect(clientId).toBeDefined();
    
      const res = await request
        .patch(`/api/client/recover/${clientId}`)
        .set("Authorization", `Bearer ${token}`);
    
      expect(res.status).toBe(404);
    });
    
  
    it("No debe eliminar cliente de otro usuario", async () => {
      // Crear otro usuario
      await request.post("/api/auth/register").send({
        email: "otro@user.com",
        password: "Password123!",
      });
    
      const login = await request.post("/api/auth/login").send({
        email: "otro@user.com",
        password: "Password123!",
      });
    
      const otroToken = login.body.token;
    
      // Crear cliente con este nuevo usuario
      const clienteOtro = await request
        .post("/api/client")
        .set("Authorization", `Bearer ${otroToken}`)
        .send({
          nombre: "Cliente Ajeno",
          email: "ajeno@email.com",
          telefono: "222222222"
        });
        
    
      expect(clienteOtro.status).toBe(201);
      const clientId = clienteOtro.body.client?._id;
      expect(clientId).toBeDefined();
    
      // Intentar eliminarlo con el token anterior
      const res = await request
        .delete(`/api/client/${clientId}?soft=false`)
        .set("Authorization", `Bearer ${token}`);
    
      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/no tienes permisos/i);
    });
    
  
    it("No debe acceder sin token", async () => {
      const res = await request.get("/api/client");
      expect(res.status).toBe(401);
    });
  
    it("No debe acceder con token inválido", async () => {
      const res = await request
        .get("/api/client")
        .set("Authorization", "Bearer token-falso");
  
      expect(res.status).toBe(401);
    });
  });
  
