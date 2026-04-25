const express = require('express');
const router = express.Router();
const administracionController = require('../controllers/administracionController');
const { verificarToken, verificarRol } = require('../middleware/auth');

// router.use(verificarToken);

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
router.delete('/paises/:id', verificarToken, administracionController.eliminarPais);

// Roles (solo admin)
router.get('/roles', verificarRol(['admin']), administracionController.getAllRoles);

// Estadísticas (admin y pastor)
router.get('/estadisticas', verificarRol(['admin', 'pastor']), administracionController.getEstadisticasGenerales);

// ===== PRESUPUESTOS =====
router.get('/presupuestos', administracionController.getPresupuestosPorPais);
router.get('/presupuestos/detalle', administracionController.getDetallePresupuesto);
router.post('/presupuestos', administracionController.agregarItemPresupuesto);
router.delete('/presupuestos/:id', administracionController.eliminarItemPresupuesto);

// ===== EJECUCIONES =====
router.get('/ejecuciones', administracionController.getEjecucionesPorPais);
router.post('/ejecuciones', administracionController.crearEjecucion);
router.put('/ejecuciones/:id/monto', administracionController.actualizarMontoEjecucion);
router.get('/ejecuciones/:ejecucion_id/gastos', administracionController.getGastosReales);
router.post('/ejecuciones/gastos', administracionController.agregarGastoReal);
router.delete('/ejecuciones/gastos/:id', administracionController.eliminarGastoReal);

// ===== COTIZACIONES =====
router.get('/cotizaciones', administracionController.getAllCotizaciones);
router.post('/cotizaciones', administracionController.crearCotizacion);
router.put('/cotizaciones/:id/aprobar', administracionController.aprobarCotizacion);
router.put('/cotizaciones/:id/rechazar', administracionController.rechazarCotizacion);

// ===== CONFIGURACIÓN =====
router.get('/configuracion/tasa-cambio', administracionController.getTasaCambio);
router.put('/configuracion/tasa-cambio', administracionController.actualizarTasaCambio);

module.exports = router;
