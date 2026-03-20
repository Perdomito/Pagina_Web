const ReportesService = require('../services/ReportesService');

exports.generarReporte = async (req, res) => {
  try {
    const { pais_id, mes, anio, tipo } = req.query;
    const reporte = await ReportesService.generarReporte(pais_id, mes, parseInt(anio), tipo);
    res.json(reporte);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.guardarReporte = async (req, res) => {
  try {
    const reporte = await ReportesService.guardarReporte(req.body);
    res.json(reporte);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getHistorico = async (req, res) => {
  try {
    const { pais_id, limit } = req.query;
    const historico = await ReportesService.getHistorico(pais_id, limit ? parseInt(limit) : 12);
    res.json(historico);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getReporte = async (req, res) => {
  try {
    const { pais_id, mes, anio, tipo } = req.query;
    const reporte = await ReportesService.getReporte(pais_id, mes, parseInt(anio), tipo);
    res.json(reporte);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = exports;
