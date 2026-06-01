const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

class AuthService {
  async login(email, password) {
    if (!email || !password) {
      throw new Error('Email y contrasena son requeridos');
    }

    const result = await query(`
      SELECT u.*, r.nombre as rol_nombre, p.nombre as pais_nombre
      FROM usuarios u
      LEFT JOIN roles r ON u.rol = r.id
      LEFT JOIN paises p ON u.pais_id = p.id
      WHERE u.email = $1 AND u.activo = TRUE
    `, [email]);

    if (result.rows.length === 0) {
      throw new Error('Credenciales invalidas');
    }

    const usuario = result.rows[0];

    const passwordValida = await bcrypt.compare(password, usuario.password_hash);
    if (!passwordValida) {
      throw new Error('Credenciales invalidas');
    }

    await query(
      'UPDATE usuarios SET ultimo_acceso = CURRENT_TIMESTAMP WHERE id = $1',
      [usuario.id]
    );

    const token = jwt.sign(
      {
        id: usuario.id,
        email: usuario.email,
        rol: usuario.rol_nombre,
        pais_id: usuario.pais_id
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    delete usuario.password_hash;

    return {
      token,
      usuario: {
        ...usuario,
        rol: usuario.rol_nombre,
        pais: usuario.pais_nombre
      }
    };
  }

  async register(datos) {
    const { nombre, email, password, rol_id, pais_id } = datos;

    if (!nombre || !email || !password) {
      throw new Error('Nombre, email y contrasena son requeridos');
    }

    if (password.length < 4) {
      throw new Error('La contrasena debe tener al menos 4 caracteres');
    }

    const existente = await query(
      'SELECT id FROM usuarios WHERE email = $1',
      [email]
    );

    if (existente.rows.length > 0) {
      throw new Error('El email ya esta registrado');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await query(`
      INSERT INTO usuarios (nombre, email, password_hash, rol, pais_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, nombre, email, rol, pais_id, fecha_registro
    `, [nombre, email, passwordHash, rol_id || 3, pais_id]);

    return result.rows[0];
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