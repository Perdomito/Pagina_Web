// ============================================
// AUTH CONTROLLER
// ============================================
const AuthService = require('../services/AuthService');

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const resultado = await AuthService.login(email, password);
    res.json(resultado);
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
};

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const usuario = await AuthService.register(req.body);
    res.status(201).json({ message: 'Usuario creado exitosamente', usuario });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// GET /api/auth/verify
exports.verify = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }
    const decoded = await AuthService.verifyToken(token);
    res.json({ valid: true, user: decoded });
  } catch (error) {
    res.status(401).json({ error: 'Token inválido' });
  }
};

// POST /api/auth/change-password
exports.changePassword = async (req, res) => {
  try {
    const { passwordActual, passwordNueva } = req.body;
    const userId = req.user.id; // Del middleware auth
    const resultado = await AuthService.changePassword(userId, passwordActual, passwordNueva);
    res.json(resultado);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = exports;
