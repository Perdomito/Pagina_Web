const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verificarToken } = require('../middleware/auth');

router.post('/login', authController.login);
router.post('/register', authController.register);
router.get('/verify', authController.verify);
router.post('/change-password', verificarToken, authController.changePassword);

router.get('/mis-permisos', verificarToken, authController.getMisPermisos);

module.exports = router;
