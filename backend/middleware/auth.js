// ============================================
// MIDDLEWARE DE AUTENTICACIÓN
// ============================================
const jwt = require('jsonwebtoken');

// Verificar token JWT
const verificarToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

// Verificar rol específico
const verificarRol = (rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    if (!rolesPermitidos.includes(req.user.rol)) {
      return res.status(403).json({ error: 'No tiene permisos para esta acción' });
    }

    next();
  };
};

// Middleware opcional (no falla si no hay token)
const verificarTokenOpcional = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    } catch (error) {
      // Token inválido, pero continuamos sin usuario
    }
  }

  next();
};

module.exports = {
  verificarToken,
  verificarRol,
  verificarTokenOpcional
};
