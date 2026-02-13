// ============================================
// MIDDLEWARE DE AUTENTICACIÓN
// ============================================
// Este middleware verifica que el usuario esté autenticado
// Se usa en las rutas protegidas

/*
const jwt = require('jsonwebtoken');

// Middleware para verificar token JWT
exports.verifyToken = (req, res, next) => {
  try {
    // Obtener token del header Authorization
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        message: 'Token no proporcionado' 
      });
    }

    // Verificar token
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(403).json({ 
          message: 'Token inválido o expirado' 
        });
      }

      // Guardar datos del usuario en req
      req.user = decoded;
      next();
    });

  } catch (error) {
    console.error('Error en verifyToken:', error);
    res.status(500).json({ 
      message: 'Error al verificar autenticación' 
    });
  }
};

// Middleware para verificar rol de administrador
exports.isAdmin = (req, res, next) => {
  if (req.user && req.user.rol === 'admin') {
    next();
  } else {
    res.status(403).json({ 
      message: 'Acceso denegado. Se requieren permisos de administrador' 
    });
  }
};

// Middleware para verificar rol de pastor
exports.isPastor = (req, res, next) => {
  if (req.user && (req.user.rol === 'pastor' || req.user.rol === 'admin')) {
    next();
  } else {
    res.status(403).json({ 
      message: 'Acceso denegado. Se requieren permisos de pastor' 
    });
  }
};

module.exports = exports;
*/

// ============================================
// USO DE ESTE MIDDLEWARE:
// ============================================
// En las rutas, importar y usar así:
//
// const { verifyToken, isAdmin } = require('../middleware/auth');
//
// router.get('/ruta-protegida', verifyToken, (req, res) => {
//   // Solo usuarios autenticados pueden acceder
//   res.json({ user: req.user });
// });
//
// router.post('/solo-admin', verifyToken, isAdmin, (req, res) => {
//   // Solo administradores pueden acceder
//   res.json({ message: 'Eres admin' });
// });

module.exports = {};
