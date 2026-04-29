const express = require('express');
const router = express.Router();
const configuracionController = require('../controllers/configuracionController');
// const { verificarToken } = require('../middleware/auth'); // Descomentar cuando esté listo

// Descomentar esta línea cuando tengas el middleware de autenticación listo
// router.use(verificarToken);

// USUARIOS
router.get('/usuarios', configuracionController.getAllUsuarios);
router.post('/usuarios', configuracionController.crearUsuario);
router.put('/usuarios/:id', configuracionController.actualizarUsuario);
router.delete('/usuarios/:id', configuracionController.eliminarUsuario);

// ROLES
router.get('/roles', configuracionController.getAllRoles);

// PERMISOS
router.get('/permisos', configuracionController.getAllPermisos);
router.get('/roles/:rol_id/permisos', configuracionController.getPermisosRol);
router.put('/roles/:rol_id/permisos/:permiso_id', configuracionController.actualizarPermisoRol);

// PAÍSES
router.get('/paises', configuracionController.getAllPaises);

// PERMISOS PERSONALIZADOS POR USUARIO
router.get('/usuarios/:usuario_id/permisos', configuracionController.getPermisosUsuario);
router.put('/usuarios/:usuario_id/permisos/:permiso_id', configuracionController.actualizarPermisoUsuario);
router.delete('/usuarios/:usuario_id/permisos/:permiso_id', configuracionController.eliminarPermisoUsuario);

module.exports = router;