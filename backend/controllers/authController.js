// ============================================
// CONTROLADOR DE AUTENTICACIÓN
// ============================================
// Este archivo maneja el login, registro y recuperación de contraseña
// Por ahora está desactivado. Activar cuando el backend esté listo.

/*
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

// ============================================
// LOGIN - Iniciar sesión
// ============================================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validar datos
    if (!email || !password) {
      return res.status(400).json({ 
        message: 'Por favor proporcione email y contraseña' 
      });
    }

    // Buscar usuario en la base de datos
    const [users] = await db.query(
      'SELECT * FROM usuarios WHERE email = ? AND activo = TRUE',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ 
        message: 'Credenciales incorrectas' 
      });
    }

    const user = users[0];

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({ 
        message: 'Credenciales incorrectas' 
      });
    }

    // Generar token JWT
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        rol: user.rol 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Enviar respuesta (sin la contraseña)
    res.json({
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        pais: user.pais
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ 
      message: 'Error al iniciar sesión' 
    });
  }
};

// ============================================
// REGISTER - Registrar nuevo usuario
// ============================================
exports.register = async (req, res) => {
  try {
    const { nombre, email, password, rol, pais } = req.body;

    // Validar datos
    if (!nombre || !email || !password) {
      return res.status(400).json({ 
        message: 'Nombre, email y contraseña son requeridos' 
      });
    }

    // Verificar si el email ya existe
    const [existingUsers] = await db.query(
      'SELECT id FROM usuarios WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ 
        message: 'El email ya está registrado' 
      });
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insertar en la base de datos
    const [result] = await db.query(
      'INSERT INTO usuarios (nombre, email, password, rol, pais) VALUES (?, ?, ?, ?, ?)',
      [nombre, email, hashedPassword, rol || 'miembro', pais]
    );

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      userId: result.insertId
    });

  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ 
      message: 'Error al registrar usuario' 
    });
  }
};

// ============================================
// FORGOT PASSWORD - Recuperar contraseña
// ============================================
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Buscar usuario
    const [users] = await db.query(
      'SELECT id, nombre FROM usuarios WHERE email = ?',
      [email]
    );

    // Por seguridad, siempre devolver el mismo mensaje
    // (no revelar si el email existe o no)
    res.json({
      message: 'Si el correo existe, recibirás instrucciones para recuperar tu contraseña'
    });

    if (users.length > 0) {
      // AQUÍ IMPLEMENTAR ENVÍO DE EMAIL
      // 1. Generar token de recuperación
      // 2. Guardar token en la base de datos
      // 3. Enviar email con el link de recuperación
      // Por ahora solo un console.log
      console.log(`Enviar email de recuperación a: ${email}`);
    }

  } catch (error) {
    console.error('Error en forgot password:', error);
    res.status(500).json({ 
      message: 'Error al procesar solicitud' 
    });
  }
};

// ============================================
// LOGOUT - Cerrar sesión
// ============================================
exports.logout = async (req, res) => {
  // En JWT, el logout se maneja en el cliente eliminando el token
  // Aquí se puede implementar una lista negra de tokens si se requiere
  res.json({ message: 'Sesión cerrada exitosamente' });
};

module.exports = exports;
*/

// ============================================
// PARA ACTIVAR ESTE CONTROLADOR:
// ============================================
// 1. Descomentar todo el código de arriba
// 2. Asegurarse que la base de datos esté configurada
// 3. Importar este controlador en las rutas (routes/auth.js)

module.exports = {};
