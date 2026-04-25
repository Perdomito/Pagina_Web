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

//Elimina Pas
exports.eliminarPais = async (req, res) => {
  try {
    const resultado = await AdministracionService.eliminarPais(req.params.id);
    res.json(resultado);
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
// ===== PRESUPUESTOS =====
exports.getPresupuestosPorPais = async (req, res) => {
  try {
    const { pais_id, anio } = req.query;
    const presupuestos = await AdministracionService.getPresupuestosPorPais(
      parseInt(pais_id),
      parseInt(anio)
    );
    res.json(presupuestos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getDetallePresupuesto = async (req, res) => {
  try {
    const { pais_id, mes, anio } = req.query;
    const detalle = await AdministracionService.getDetallePresupuesto(
      parseInt(pais_id),
      mes,
      parseInt(anio)
    );
    res.json(detalle);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.agregarItemPresupuesto = async (req, res) => {
  try {
    const item = await AdministracionService.agregarItemPresupuesto(req.body);
    res.status(201).json(item);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.eliminarItemPresupuesto = async (req, res) => {
  try {
    const resultado = await AdministracionService.eliminarItemPresupuesto(req.params.id);
    res.json(resultado);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// ===== EJECUCIONES =====
exports.getEjecucionesPorPais = async (req, res) => {
  try {
    const { pais_id, anio } = req.query;
    const ejecuciones = await AdministracionService.getEjecucionesPorPais(
      parseInt(pais_id),
      parseInt(anio)
    );
    res.json(ejecuciones);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.crearEjecucion = async (req, res) => {
  try {
    const ejecucion = await AdministracionService.crearEjecucion(req.body);
    res.status(201).json(ejecucion);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.actualizarMontoEjecucion = async (req, res) => {
  try {
    const { monto_recibido_usd } = req.body;
    const ejecucion = await AdministracionService.actualizarMontoEjecucion(
      req.params.id,
      parseFloat(monto_recibido_usd)
    );
    res.json(ejecucion);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getGastosReales = async (req, res) => {
  try {
    const gastos = await AdministracionService.getGastosReales(req.params.ejecucion_id);
    res.json(gastos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.agregarGastoReal = async (req, res) => {
  try {
    const gasto = await AdministracionService.agregarGastoReal(req.body);
    res.status(201).json(gasto);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.eliminarGastoReal = async (req, res) => {
  try {
    const resultado = await AdministracionService.eliminarGastoReal(req.params.id);
    res.json(resultado);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// ===== COTIZACIONES =====
exports.getAllCotizaciones = async (req, res) => {
  try {
    const cotizaciones = await AdministracionService.getAllCotizaciones();
    res.json(cotizaciones);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.crearCotizacion = async (req, res) => {
  try {
    const cotizacion = await AdministracionService.crearCotizacion(req.body);
    res.status(201).json(cotizacion);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.aprobarCotizacion = async (req, res) => {
  try {
    const { mes_agregado, anio_agregado } = req.body;
    const cotizacion = await AdministracionService.aprobarCotizacion(
      req.params.id,
      mes_agregado,
      parseInt(anio_agregado)
    );
    res.json(cotizacion);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.rechazarCotizacion = async (req, res) => {
  try {
    const cotizacion = await AdministracionService.rechazarCotizacion(req.params.id);
    res.json(cotizacion);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// ===== CONFIGURACIÓN =====
exports.getTasaCambio = async (req, res) => {
  try {
    const tasa = await AdministracionService.getTasaCambio();
    res.json({ tasa_cambio: tasa });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.actualizarTasaCambio = async (req, res) => {
  try {
    const { tasa } = req.body;
    const resultado = await AdministracionService.actualizarTasaCambio(parseFloat(tasa));
    res.json(resultado);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
module.exports = exports;
