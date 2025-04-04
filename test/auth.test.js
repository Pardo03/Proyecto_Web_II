// Cargar variables de entorno
require('dotenv').config();
const supertest = require('supertest');
const app = require("../index");
const mongoose = require("mongoose");
const request = require("supertest")(app);
const User = require('../models/User'); // Asegúrate que la ruta sea correcta
const path = require('path');
const fs = require('fs');

let token;
let resetToken = '';

beforeAll(async () => {
  // Conectamos a la base de datos de test
  await mongoose.connect(process.env.DB_URI_TEST);

  // Limpiar usuarios existentes por si ya están creados
  await User.deleteMany({ email: 'testuser@example.com' });
  await User.deleteMany({ email: 'guestuser@example.com' });
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe('OnBoarding API - Registro, Login y Validación', () => {
  // 1️) Registro de usuario
  it('should register a new user', async () => {
    const response = await request
      .post('/api/auth/register')
      .send({
        email: 'testuser@example.com',
        password: 'Password123!',
      })
      .set('Accept', 'application/json')
      .expect(201);

    expect(response.body.user.email).toBe('testuser@example.com');
    expect(response.body.user.role).toBe('user');

    token = response.body.token; // Guardamos token para siguientes pruebas
  });

  // 2️) Login con credenciales válidas
  it('should login with valid credentials', async () => {
    const response = await request
      .post('/api/auth/login')
      .send({
        email: 'testuser@example.com',
        password: 'Password123!',
      })
      .set('Accept', 'application/json')
      .expect(200);

    expect(response.body.token).toBeDefined();
    token = response.body.token;
  });

  // 3️) Validación del email usando el código desde DB
  it('should validate email with the correct code', async () => {
    const user = await User.findOne({ email: 'testuser@example.com' });
    expect(user).toBeTruthy();

    const response = await request
      .put('/api/auth/validate')
      .send({
        code: `${user.verificationCode}`,
      })
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.message).toBe('Email verificado correctamente');
  });

  // 4️) Obtener datos del usuario autenticado
  it('should get user data with valid token', async () => {
    const response = await request
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const email = response.body.email || response.body.user?.email;
    expect(email).toBe('testuser@example.com');
  });

  // 5️) Eliminar usuario (soft delete)
  it('should delete the user with valid token', async () => {
    const response = await request
      .delete('/api/auth/delete')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.message).toBe('Usuario desactivado (soft delete)');
  });
});

describe('OnBoarding Extended API - Datos personales, empresa, recuperación, logo e invitaciones', () => {
  // Reactivar usuario para seguir testeando
  beforeAll(async () => {
    await User.updateOne({ email: 'testuser@example.com' }, { isDeleted: false });
    const login = await request.post('/api/auth/login').send({
      email: 'testuser@example.com',
      password: 'Password123!',
    });
    token = login.body.token;
  });

  // 6️) Actualización de datos personales
  it('should update personal data', async () => {
    const response = await request
      .put('/api/auth/personal')
      .send({
        nombre: 'Rodrigo',
        apellidos: 'Pardo',
        nif: '12345678A',
      })
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.message).toBe('Datos personales actualizados correctamente');
  });

  // 7️) Actualización de datos de empresa (modo autónomo)
  it('should update company data as autónomo', async () => {
    const response = await request
      .patch('/api/auth/company')
      .send({
        nombre: 'Mi Empresa',
        cif: 'B12345678',
        direccion: 'Calle Falsa 123',
        esAutonomo: true,
      })
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.message).toBe('Datos de la compañía actualizados correctamente');
  });

  // 8️) Solicitar token de recuperación de contraseña
  it('should request password reset token', async () => {
    const res = await request
      .post('/api/auth/forgot-password')
      .send({ email: 'testuser@example.com' })
      .expect(200);

    expect(res.body.message).toContain('Token de recuperación generado');

    const user = await User.findOne({ email: 'testuser@example.com' });
    resetToken = user.resetToken;
    expect(resetToken).toBeDefined();
  });

  // 9️) Resetear contraseña con el token recibido
  it('should reset password using token', async () => {
    const res = await request
      .post('/api/auth/reset-password')
      .send({
        token: resetToken,
        newPassword: 'NuevaPass123!',
      })
      .expect(200);

    expect(res.body.message).toBe('Contraseña actualizada correctamente');
  });

  // 10) Invitar a un usuario con rol guest
  it('should invite a new guest user', async () => {
    const res = await request
      .post('/api/auth/invite')
      .send({ email: 'guestuser@example.com' })
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    expect(res.body.guest.email).toBe('guestuser@example.com');
    expect(res.body.guest.role).toBe('guest');

    const invited = await User.findOne({ email: 'guestuser@example.com' });
    expect(invited).toBeTruthy();
  });

  //Subida de imagen tipo logo
  it('should upload a logo image', async () => {
    const dummyImagePath = path.join(__dirname, 'dummy-logo.jpg');

    //Crear archivo falso si no existe
    if (!fs.existsSync(dummyImagePath)) {
      fs.writeFileSync(dummyImagePath, 'fake image content');
    }

    const res = await request
      .patch('/api/auth/logo')
      .set('Authorization', `Bearer ${token}`)
      .attach('logo', dummyImagePath)
      .expect(200);

    expect(res.body.message).toBe('Logo subido correctamente');
    expect(res.body.logoUrl).toMatch(/\/uploads\/.+/);
  });
});

describe('Gestión de errores y casos negativos', () => {
    // 1️) Registro con email inválido
    it('should not register a user with invalid email', async () => {
      const res = await request
        .post('/api/auth/register')
        .send({ email: 'no-valido', password: 'Password123!' })
        .expect(400);
  
      expect(res.body.message).toMatch(/Email inválido/i);
    });
  
    // 2️) Registro con password corta
    it('should not register a user with short password', async () => {
      const res = await request
        .post('/api/auth/register')
        .send({ email: 'nuevo@test.com', password: '123' })
        .expect(400);
  
      expect(res.body.message).toMatch(/contraseña.*al menos 8/i);
    });
  
    // 3️) Registro con email duplicado
    it('should not register a user with existing email', async () => {
      const res = await request
        .post('/api/auth/register')
        .send({ email: 'testuser@example.com', password: 'Password123!' })
        .expect(409);
  
      expect(res.body.message).toMatch(/email ya está registrado/i);
    });
  
    // 4️) Login con email incorrecto
    it('should not login with unregistered email', async () => {
      const res = await request
        .post('/api/auth/login')
        .send({ email: 'noexiste@test.com', password: 'Password123!' })
        .expect(401);
  
      expect(res.body.message).toMatch(/credenciales inválidas/i);
    });
  
    // 5️) Login con contraseña incorrecta
    it('should not login with incorrect password', async () => {
      const res = await request
        .post('/api/auth/login')
        .send({ email: 'testuser@example.com', password: 'MalPassword123' })
        .expect(401);
  
      expect(res.body.message).toMatch(/credenciales inválidas/i);
    });
  
    // 6️) Validación de email con código incorrecto
    it('should not validate email with incorrect code', async () => {
      const login = await request.post('/api/auth/login').send({
        email: 'testuser@example.com',
        password: 'NuevaPass123!', // ya cambiada antes
      });
      const tempToken = login.body.token;
  
      const res = await request
        .put('/api/auth/validate')
        .send({ code: '000000' })
        .set('Authorization', `Bearer ${tempToken}`)
        .expect(400);
  
      expect(res.body.message).toMatch(/ya fue verificado/i);
    });
  
    // 7️) GET /me sin token
    it('should not get user data without token', async () => {
      const res = await request.get('/api/auth/me').expect(401);
      expect(res.body.message).toBeDefined();
    });
  
    // 8️) DELETE usuario sin token
    it('should not delete user without token', async () => {
      const res = await request.delete('/api/auth/delete').expect(401);
      expect(res.body.message).toBeDefined();
    });
  
    // 9️) Forgot password con email inexistente
    it('should not send reset token to unknown email', async () => {
      const res = await request
        .post('/api/auth/forgot-password')
        .send({ email: 'desconocido@correo.com' })
        .expect(404);
  
      expect(res.body.message).toMatch(/usuario no encontrado/i);
    });
  
    // 10) Reset password con token inválido
    it('should not reset password with invalid token', async () => {
      const res = await request
        .post('/api/auth/reset-password')
        .send({ token: 'invalido', newPassword: 'OtraNueva123!' })
        .expect(400);
  
      expect(res.body.message).toMatch(/token inválido/i);
    });
  
    // Subir logo sin archivo
    it('should not upload logo without file', async () => {
      const res = await request
        .patch('/api/auth/logo')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);
  
      expect(res.body.message).toMatch(/no se ha subido ningún archivo/i);
    });
  });
  


