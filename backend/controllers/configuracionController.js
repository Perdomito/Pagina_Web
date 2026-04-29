const ConfiguracionService = require('../services/ConfiguracionService');

// USUARIOS
const getAllUsuarios = async (req, res) => {
  try {
    const usuarios = await ConfiguracionService.getAllUsuarios();
    res.json(usuarios);
  } catch (error) {
    console.error('Error en getAllUsuarios:', error);
    res.status(500).json({ error: error.message });
  }
};

const crearUsuario = async (req, res) => {
  try {
    const nuevoUsuario = await ConfiguracionService.crearUsuario(req.body);
    res.status(201).json(nuevoUsuario);
  } catch (error) {
    console.error('Error en crearUsuario:', error);
    res.status(500).json({ error: error.message });
  }
};

const actualizarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioActualizado = await ConfiguracionService.actualizarUsuario(id, req.body);
    res.json(usuarioActualizado);
  } catch (error) {
    console.error('Error en actualizarUsuario:', error);
    res.status(500).json({ error: error.message });
  }
};

const eliminarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    await ConfiguracionService.eliminarUsuario(id);
    res.json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    console.error('Error en eliminarUsuario:', error);
    res.status(500).json({ error: error.message });
  }
};

// ROLES
const getAllRoles = async (req, res) => {
  try {
    const roles = await ConfiguracionService.getAllRoles();
    res.json(roles);
  } catch (error) {
    console.error('Error en getAllRoles:', error);
    res.status(500).json({ error: error.message });
  }
};

// PERMISOS
const getAllPermisos = async (req, res) => {
  try {
    const permisos = await ConfiguracionService.getAllPermisos();
    res.json(permisos);
  } catch (error) {
    console.error('Error en getAllPermisos:', error);
    res.status(500).json({ error: error.message });
  }
};

const getPermisosRol = async (req, res) => {
  try {
    const { rol_id } = req.params;
    const permisos = await ConfiguracionService.getPermisosRol(rol_id);
    res.json(permisos);
  } catch (error) {
    console.error('Error en getPermisosRol:', error);
    res.status(500).json({ error: error.message });
  }
};

const actualizarPermisoRol = async (req, res) => {
  try {
    const { rol_id, permiso_id } = req.params;
    const { tiene_acceso } = req.body;
    
    const resultado = await ConfiguracionService.actualizarPermisoRol(rol_id, permiso_id, tiene_acceso);
    res.json(resultado);
  } catch (error) {
    console.error('Error en actualizarPermisoRol:', error);
    res.status(500).json({ error: error.message });
  }
};

// PAÍSES
const getAllPaises = async (req, res) => {
  try {
    const paises = await ConfiguracionService.getAllPaises();
    res.json(paises);
  } catch (error) {
    console.error('Error en getAllPaises:', error);
    res.status(500).json({ error: error.message });
  }
};

// PERMISOS PERSONALIZADOS POR USUARIO
const getPermisosUsuario = async (req, res) => {
  try {
    const { usuario_id } = req.params;
    const permisos = await ConfiguracionService.getPermisosUsuario(usuario_id);
    res.json(permisos);
  } catch (error) {
    console.error('Error en getPermisosUsuario:', error);
    res.status(500).json({ error: error.message });
  }
};

const actualizarPermisoUsuario = async (req, res) => {
  try {
    const { usuario_id, permiso_id } = req.params;
    const { tiene_acceso } = req.body;
    
    const resultado = await ConfiguracionService.actualizarPermisoUsuario(usuario_id, permiso_id, tiene_acceso);
    res.json(resultado);
  } catch (error) {
    console.error('Error en actualizarPermisoUsuario:', error);
    res.status(500).json({ error: error.message });
  }
};

const eliminarPermisoUsuario = async (req, res) => {
  try {
    const { usuario_id, permiso_id } = req.params;
    await ConfiguracionService.eliminarPermisoUsuario(usuario_id, permiso_id);
    res.json({ message: 'Permiso personalizado eliminado' });
  } catch (error) {
    console.error('Error en eliminarPermisoUsuario:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllUsuarios,
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario,
  getAllRoles,
  getAllPermisos,
  getPermisosRol,
  actualizarPermisoRol,
  getAllPaises,
  getPermisosUsuario,
  actualizarPermisoUsuario,
  eliminarPermisoUsuario
};