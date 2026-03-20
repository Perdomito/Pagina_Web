// ============================================
// AUTH SERVICE
// ============================================
// Lógica de negocio para autenticación

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

class AuthService {
  // Login
  async login(email, password) {
    // Validación
    if (!email || !password) {
      throw new Error('Email y contraseña son requeridos');
    }

    // Buscar usuario con rol
    const result = await query(`
      SELECT u.*, r.nombre as rol_nombre, p.nombre as pais_nombre
      FROM usuarios u
      LEFT JOIN roles r ON u.rol_id = r.id
      LEFT JOIN paises p ON u.pais_id = p.id
      WHERE u.email = $1 AND u.activo = TRUE
    `, [email]);

    if (result.rows.length === 0) {
      throw new Error('Credenciales inválidas');
    }

    const usuario = result.rows[0];

    // Verificar contraseña
    const passwordValida = await bcrypt.compare(password, usuario.password);
    if (!passwordValida) {
      throw new Error('Credenciales inválidas');
    }

    // Actualizar último acceso
    await query(
      'UPDATE usuarios SET ultimo_acceso = CURRENT_TIMESTAMP WHERE id = $1',
      [usuario.id]
    );

    // Generar token
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

    // Retornar datos sin password
    delete usuario.password;
    
    return {
      token,
      usuario: {
        ...usuario,
        rol: usuario.rol_nombre,
        pais: usuario.pais_nombre
      }
    };
  }

  // Registro
  async register(datos) {
    const { nombre, email, password, rol_id, pais_id } = datos;

    // Validaciones
    if (!nombre || !email || !password) {
      throw new Error('Nombre, email y contraseña son requeridos');
    }

    if (password.length < 4) {
      throw new Error('La contraseña debe tener al menos 4 caracteres');
    }

    // Verificar si el email ya existe
    const existente = await query(
      'SELECT id FROM usuarios WHERE email = $1',
      [email]
    );

    if (existente.rows.length > 0) {
      throw new Error('El email ya está registrado');
    }

    // Hashear contraseña
    const passwordHash = await bcrypt.hash(password, 10);

    // Crear usuario
    const result = await query(`
      INSERT INTO usuarios (nombre, email, password, rol_id, pais_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, nombre, email, rol_id, pais_id, created_at
    `, [nombre, email, passwordHash, rol_id || 3, pais_id]);

    return result.rows[0];
  }

  // Verificar token
  async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Verificar que el usuario aún existe y está activo
      const result = await query(
        'SELECT id, nombre, email, rol_id FROM usuarios WHERE id = $1 AND activo = TRUE',
        [decoded.id]
      );

      if (result.rows.length === 0) {
        throw new Error('Usuario no válido');
      }

      return decoded;
    } catch (error) {
      throw new Error('Token inválido');
    }
  }

  // Cambiar contraseña
  async changePassword(userId, passwordActual, passwordNueva) {
    if (!passwordActual || !passwordNueva) {
      throw new Error('Contraseñas requeridas');
    }

    if (passwordNueva.length < 4) {
      throw new Error('La contraseña debe tener al menos 4 caracteres');
    }

    // Obtener usuario
    const result = await query(
      'SELECT password FROM usuarios WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      throw new Error('Usuario no encontrado');
    }

    // Verificar contraseña actual
    const passwordValida = await bcrypt.compare(passwordActual, result.rows[0].password);
    if (!passwordValida) {
      throw new Error('Contraseña actual incorrecta');
    }

    // Hashear nueva contraseña
    const passwordHash = await bcrypt.hash(passwordNueva, 10);

    // Actualizar
    await query(
      'UPDATE usuarios SET password = $1 WHERE id = $2',
      [passwordHash, userId]
    );

    return { message: 'Contraseña actualizada exitosamente' };
  }
}

module.exports = new AuthService();
