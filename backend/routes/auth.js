// ============================================
// RUTAS DE AUTENTICACIÓN
// ============================================
// Define las rutas relacionadas con autenticación

/*
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// POST /api/auth/login - Iniciar sesión
router.post('/login', authController.login);

// POST /api/auth/register - Registrar nuevo usuario
router.post('/register', authController.register);

// POST /api/auth/forgot-password - Recuperar contraseña
router.post('/forgot-password', authController.forgotPassword);

// POST /api/auth/logout - Cerrar sesión
router.post('/logout', authController.logout);

module.exports = router;
*/

// ============================================
// CÓMO USAR ESTAS RUTAS DESDE EL FRONTEND:
// ============================================
// 
// Login:
// axios.post('/api/auth/login', { email, password })
//
// Registro:
// axios.post('/api/auth/register', { nombre, email, password, rol, pais })
//
// Recuperar contraseña:
// axios.post('/api/auth/forgot-password', { email })
//
// Cerrar sesión:
// axios.post('/api/auth/logout')

module.exports = {};
