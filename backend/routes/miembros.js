const express = require('express');
const router = express.Router();
const miembrosController = require('../controllers/miembrosController');
const { verificarToken } = require('../middleware/auth');

router.use(verificarToken); // Todas las rutas requieren autenticación

router.get('/', miembrosController.getAll);
router.get('/estadisticas', miembrosController.getEstadisticas);
router.get('/:id', miembrosController.getById);
router.post('/', miembrosController.create);
router.put('/:id', miembrosController.update);
router.delete('/:id', miembrosController.delete);

module.exports = router;
