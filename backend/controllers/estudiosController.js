const EstudiosService = require('../services/EstudiosService');

exports.guardarEstudio = async (req, res) => {
  try {
    const estudio = await EstudiosService.guardarEstudio(req.body);
    res.json(estudio);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getEstudiosPorPaisYMes = async (req, res) => {
  try {
    const { pais_id, mes, anio } = req.query;
    const estudios = await EstudiosService.getEstudiosPorPaisYMes(pais_id, mes, anio);
    res.json(estudios);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.guardarEvangelismo = async (req, res) => {
  try {
    const evangelismo = await EstudiosService.guardarEvangelismo(req.body);
    res.json(evangelismo);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getEvangelismoPorPaisYMes = async (req, res) => {
  try {
    const { pais_id, mes, anio } = req.query;
    const evangelismo = await EstudiosService.getEvangelismoPorPaisYMes(pais_id, mes, anio);
    res.json(evangelismo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.guardarNuevosEstudiantes = async (req, res) => {
  try {
    const resultado = await EstudiosService.guardarNuevosEstudiantes(req.body);
    res.json(resultado);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getNuevosEstudiantesPorPaisYMes = async (req, res) => {
  try {
    const { pais_id, mes, anio } = req.query;
    const nuevos = await EstudiosService.getNuevosEstudiantesPorPaisYMes(pais_id, mes, anio);
    res.json(nuevos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getResumenCompleto = async (req, res) => {
  try {
    const { pais_id, mes, anio } = req.query;
    const resumen = await EstudiosService.getResumenCompleto(pais_id, mes, anio);
    res.json(resumen);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = exports;
