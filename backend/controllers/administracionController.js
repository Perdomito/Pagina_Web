const AdministracionService = require('../services/AdministracionService');

// Usuarios
exports.getAllUsuarios = async (req, res) => {
  try {
    const usuarios = await AdministracionService.getAllUsuarios();
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.crearUsuario = async (req, res) => {
  try {
    const usuario = await AdministracionService.crearUsuario(req.body);
    res.status(201).json(usuario);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.actualizarUsuario = async (req, res) => {
  try {
    const usuario = await AdministracionService.actualizarUsuario(req.params.id, req.body);
    res.json(usuario);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.eliminarUsuario = async (req, res) => {
  try {
    const resultado = await AdministracionService.eliminarUsuario(req.params.id);
    res.json(resultado);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
// Continentes
exports.getAllContinentes = async (req, res) => {
  try {
    const continentes = await AdministracionService.getAllContinentes();
    res.json(continentes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.crearContinente = async (req, res) => {
  try {
    const continente = await AdministracionService.crearContinente(req.body);
    res.status(201).json(continente);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.eliminarContinente = async (req, res) => {
  try {
    const resultado = await AdministracionService.eliminarContinente(req.params.id);
    res.json(resultado);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Países
exports.getAllPaises = async (req, res) => {
  try {
    const paises = await AdministracionService.getAllPaises();
    res.json(paises);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getPaisesPorContinente = async (req, res) => {
  try {
    const paises = await AdministracionService.getPaisesPorContinente(req.params.continente);
    res.json(paises);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
exports.crearPais = async (req, res) => {
  try {
    const pais = await AdministracionService.crearPais(req.body);
    res.status(201).json(pais);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
// Roles
exports.getAllRoles = async (req, res) => {
  try {
    const roles = await AdministracionService.getAllRoles();
    res.json(roles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Estadísticas
exports.getEstadisticasGenerales = async (req, res) => {
  try {
    const stats = await AdministracionService.getEstadisticasGenerales();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
exports.crearPais = async (req, res) => {
  try {
    const pais = await AdministracionService.crearPais(req.body);
    res.status(201).json(pais);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
module.exports = exports;
