const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const pythonApi = require('../config/pythonApi');

class AuthService {
  async login(email, password) {
    if (!email || !password) {
      throw new Error('Email y contrasena son requeridos');
    }

    const response = await pythonApi.post('/auth/login', { email, password });
    return response.data;
  }

  async register(datos) {
    const { nombre, email, password, rol_id, pais_id } = datos;

    if (!nombre || !email || !password) {
      throw new Error('Nombre, email y contrasena son requeridos');
    }

    if (password.length < 4) {
      throw new Error('La contrasena debe tener al menos 4 caracteres');
    }

    const id = datos.id || nombre.toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.|\.$/g, '');

    const payload = {
      id,
      nombre,
      email,
      password,
      rol: rol_id || 3,
      activo: true,
      region: pais_id ? String(pais_id) : null
    };

    const response = await pythonApi.post('/usuarios/', payload);
    return response.data;
  }

  async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const result = await query(
        'SELECT id, nombre, email, rol FROM usuarios WHERE id = $1 AND activo = TRUE',
        [decoded.id]
      );

      if (result.rows.length === 0) {
        throw new Error('Usuario no valido');
      }

      return decoded;
    } catch (error) {
      throw new Error('Token invalido');
    }
  }

  async changePassword(userId, passwordActual, passwordNueva) {
    if (!passwordActual || !passwordNueva) {
      throw new Error('Contrasenas requeridas');
    }

    if (passwordNueva.length < 4) {
      throw new Error('La contrasena debe tener al menos 4 caracteres');
    }

    const result = await query(
      'SELECT password_hash FROM usuarios WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      throw new Error('Usuario no encontrado');
    }

    const passwordValida = await bcrypt.compare(passwordActual, result.rows[0].password_hash);
    if (!passwordValida) {
      throw new Error('Contrasena actual incorrecta');
    }

    const passwordHash = await bcrypt.hash(passwordNueva, 10);

    await query(
      'UPDATE usuarios SET password_hash = $1 WHERE id = $2',
      [passwordHash, userId]
    );

    return { message: 'Contrasena actualizada exitosamente' };
  }
}

module.exports = new AuthService();