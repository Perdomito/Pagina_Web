const ContactosService = require('../services/ContactosService');

exports.getAll = async (req, res) => {
  try {
    const contactos = await ContactosService.getAll(req.query);
    res.json(contactos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const contacto = await ContactosService.getById(req.params.id);
    res.json(contacto);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const contacto = await ContactosService.create(req.body);
    res.status(201).json(contacto);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const contacto = await ContactosService.update(req.params.id, req.body);
    res.json(contacto);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const resultado = await ContactosService.delete(req.params.id);
    res.json(resultado);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = exports;
