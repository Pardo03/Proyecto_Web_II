const request = require('supertest');
const app = require('../index');
const mongoose = require('mongoose');
const path = require('path');

let token;
let deliveryNoteId;
let projectId;
let clientId;

beforeAll(async () => {
  await request(app).post('/api/auth/register').send({
    email: 'testdelivery@example.com',
    password: '12345678',
  });

  const resLogin = await request(app).post('/api/auth/login').send({
    email: 'testdelivery@example.com',
    password: '12345678',
  });

  token = resLogin.body.token;

  const resClient = await request(app)
    .post('/api/client')
    .set('Authorization', `Bearer ${token}`)
    .send({
      nombre: 'Cliente Testing',
      email: 'cliente@testing.com',
      telefono: '600600600',
      direccion: 'Calle Testing 123',
      ciudad: 'Madrid',
      provincia: 'Madrid',
      codigoPostal: '28001',
      pais: 'España',
    });

  clientId = resClient.body.client._id;

  const resProject = await request(app)
    .post('/api/project')
    .set('Authorization', `Bearer ${token}`)
    .send({
      nombre: 'Proyecto Testing',
      descripcion: 'Proyecto para pruebas',
      clienteId: clientId,
    });

  projectId = resProject.body.project._id;
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe('Delivery Notes API', () => {
  test('Debe crear un albarán simple', async () => {
    const res = await request(app)
      .post('/api/deliverynote')
      .set('Authorization', `Bearer ${token}`)
      .send({
        proyecto: projectId,
        cliente: clientId,
        items: [
          { tipo: 'material', descripcion: 'Cableado', cantidad: 10, precioUnitario: 5 },
        ],
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.deliveryNote).toHaveProperty('_id');
    deliveryNoteId = res.body.deliveryNote._id;
  });

  test('Debe listar todos los albaranes', async () => {
    const res = await request(app)
      .get('/api/deliverynote')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.deliveryNotes)).toBe(true);
  });

  test('Debe obtener un albarán por ID', async () => {
    const res = await request(app)
      .get(`/api/deliverynote/${deliveryNoteId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.deliveryNote._id).toBe(deliveryNoteId);
  });

  test('Debe firmar un albarán', async () => {
    const res = await request(app)
      .patch(`/api/deliverynote/sign/${deliveryNoteId}`)
      .set('Authorization', `Bearer ${token}`)
      .attach('firma', path.resolve(__dirname, 'test_assets/firma.png'));

    expect(res.statusCode).toBe(200);
    expect(res.body.deliveryNote.firmada).toBe(true);
  });

  test('Debe descargar el PDF del albarán firmado', async () => {
    const res = await request(app)
      .get(`/api/deliverynote/pdf/${deliveryNoteId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toBe('application/pdf');
  });

  test('No debe crear albarán sin datos obligatorios', async () => {
    const res = await request(app)
      .post('/api/deliverynote')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.statusCode).toBe(400);
  });

  test('Debe devolver 404 al obtener un albarán inexistente', async () => {
    const res = await request(app)
      .get('/api/deliverynote/000000000000000000000000')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(404);
  });

  test('Debe devolver 404 al firmar un albarán inexistente', async () => {
    const res = await request(app)
      .patch('/api/deliverynote/sign/000000000000000000000000')
      .set('Authorization', `Bearer ${token}`)
      .attach('firma', path.resolve(__dirname, 'test_assets/firma.png'));

    expect(res.statusCode).toBe(404);
  });

  test('Debe fallar al firmar un albarán ya firmado', async () => {
    const res = await request(app)
      .patch(`/api/deliverynote/sign/${deliveryNoteId}`)
      .set('Authorization', `Bearer ${token}`)
      .attach('firma', path.resolve(__dirname, 'test_assets/firma.png'));

    expect(res.statusCode).toBe(400);
  });

  test('Debe devolver 404 al descargar PDF de un albarán inexistente', async () => {
    const res = await request(app)
      .get('/api/deliverynote/pdf/000000000000000000000000')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(404);
  });

  test('Debe fallar al intentar eliminar un albarán firmado', async () => {
    const res = await request(app)
      .delete(`/api/deliverynote/${deliveryNoteId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(403);
  });

  test('Debe crear y eliminar un albarán NO firmado correctamente', async () => {
    // Crear nuevo cliente
    const resNewClient = await request(app)
      .post('/api/client')
      .set('Authorization', `Bearer ${token}`)
      .send({
        nombre: 'Cliente Nuevo',
        email: 'nuevo@testing.com',
        telefono: '600600601',
        direccion: 'Calle Nueva 123',
        ciudad: 'Barcelona',
        provincia: 'Barcelona',
        codigoPostal: '08001',
        pais: 'España',
      });

    const newClientId = resNewClient.body.client._id;

    // Crear nuevo proyecto
    const resNewProject = await request(app)
      .post('/api/project')
      .set('Authorization', `Bearer ${token}`)
      .send({
        nombre: 'Proyecto Nuevo',
        descripcion: 'Proyecto pruebas borrar',
        clienteId: newClientId,
      });

    const newProjectId = resNewProject.body.project._id;

    const resCreate = await request(app)
      .post('/api/deliverynote')
      .set('Authorization', `Bearer ${token}`)
      .send({
        proyecto: newProjectId,
        cliente: newClientId,
        items: [
          { tipo: 'hora', descripcion: 'Trabajo adicional', cantidad: 5, precioUnitario: 20 },
        ],
      });

    expect(resCreate.statusCode).toBe(201);

    const idNuevo = resCreate.body.deliveryNote._id;

    const resDelete = await request(app)
      .delete(`/api/deliverynote/${idNuevo}`)
      .set('Authorization', `Bearer ${token}`);

    expect(resDelete.statusCode).toBe(200);
  });

  test('Debe fallar si no se envía token al crear albarán', async () => {
    const res = await request(app)
      .post('/api/deliverynote')
      .send({
        proyecto: projectId,
        cliente: clientId,
        items: [
          { tipo: 'material', descripcion: 'Material sin token', cantidad: 1, precioUnitario: 100 },
        ],
      });

    expect(res.statusCode).toBe(401);
  });
});

