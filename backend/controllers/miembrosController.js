// ============================================
// MIEMBROS CONTROLLER
// ============================================
const MiembrosService = require('../services/MiembrosService');

exports.getAll = async (req, res) => {
  try {
    const miembros = await MiembrosService.getAll(req.query);
    res.json(miembros);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const miembro = await MiembrosService.getById(req.params.id);
    res.json(miembro);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const miembro = await MiembrosService.create(req.body);
    res.status(201).json(miembro);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const miembro = await MiembrosService.update(req.params.id, req.body);
    res.json(miembro);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const resultado = await MiembrosService.delete(req.params.id);
    res.json(resultado);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getEstadisticas = async (req, res) => {
  try {
    const stats = await MiembrosService.getEstadisticas(req.query.pais_id);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = exports;
