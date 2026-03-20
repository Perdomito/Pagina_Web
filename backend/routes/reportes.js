const express = require('express');
const router = express.Router();
const reportesController = require('../controllers/reportesController');
const { verificarToken } = require('../middleware/auth');

router.use(verificarToken);

router.get('/generar', reportesController.generarReporte);
router.post('/', reportesController.guardarReporte);
router.get('/historico', reportesController.getHistorico);
router.get('/', reportesController.getReporte);

module.exports = router;
