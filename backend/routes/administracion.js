const express = require('express');
const router = express.Router();
const administracionController = require('../controllers/administracionController');
const { verificarToken, verificarRol } = require('../middleware/auth');

router.use(verificarToken);

// Usuarios (solo admin)
router.get('/usuarios', verificarRol(['admin']), administracionController.getAllUsuarios);
router.post('/usuarios', verificarRol(['admin']), administracionController.crearUsuario);
router.put('/usuarios/:id', verificarRol(['admin']), administracionController.actualizarUsuario);
router.delete('/usuarios/:id', verificarRol(['admin']), administracionController.eliminarUsuario);

// Continentes
router.get('/continentes', administracionController.getAllContinentes);
router.post('/continentes', verificarToken, administracionController.crearContinente);
router.delete('/continentes/:id', verificarToken, administracionController.eliminarContinente);

// Países (todos los autenticados)
router.get('/paises', administracionController.getAllPaises);
router.get('/paises/continente/:continente', administracionController.getPaisesPorContinente);
router.post('/paises', administracionController.crearPais);

// Roles (solo admin)
router.get('/roles', verificarRol(['admin']), administracionController.getAllRoles);

// Estadísticas (admin y pastor)
router.get('/estadisticas', verificarRol(['admin', 'pastor']), administracionController.getEstadisticasGenerales);

module.exports = router;
