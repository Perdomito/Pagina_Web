const express = require('express');
const router = express.Router();
const estudiosController = require('../controllers/estudiosController');
const { verificarToken } = require('../middleware/auth');

// Ruta pública (sin token) - DEBE IR ANTES de router.use
router.get('/reporte', estudiosController.getReporteCompleto);

// Aplicar token a todas las demás rutas
router.use(verificarToken);

router.post('/estudio', estudiosController.guardarEstudio);
router.get('/estudios', estudiosController.getEstudiosPorPaisYMes);
router.post('/evangelismo', estudiosController.guardarEvangelismo);
router.get('/evangelismo', estudiosController.getEvangelismoPorPaisYMes);
router.post('/nuevos-estudiantes', estudiosController.guardarNuevosEstudiantes);
router.get('/nuevos-estudiantes', estudiosController.getNuevosEstudiantesPorPaisYMes);
router.get('/resumen', estudiosController.getResumenCompleto);

module.exports = router;