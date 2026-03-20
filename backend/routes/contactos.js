const express = require('express');
const router = express.Router();
const contactosController = require('../controllers/contactosController');
const { verificarToken } = require('../middleware/auth');

router.use(verificarToken);

router.get('/', contactosController.getAll);
router.get('/:id', contactosController.getById);
router.post('/', contactosController.create);
router.put('/:id', contactosController.update);
router.delete('/:id', contactosController.delete);

module.exports = router;
