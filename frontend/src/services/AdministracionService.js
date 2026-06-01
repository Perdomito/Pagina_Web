import axios from '../api/axios';

const administracionService = {
  getAllPaises: async () => {
    const response = await axios.get('/paises');
    return response.data;
  },

  crearPais: async (datos) => {
    const response = await axios.post('/paises', datos);
    return response.data;
  },

  eliminarPais: async (id) => {
    const response = await axios.delete(`/paises/${id}`);
    return response.data;
  },

  getAllContinentes: async () => {
    const response = await axios.get('/continentes');
    const continentes = response.data;
    const paises = await axios.get('/paises').then(r => r.data).catch(() => []);
    return continentes.map(cont => ({
      ...cont,
      paises: paises
        .filter(p => p.continente_id === cont.id)
        .map(p => ({
          id: p.id,
          nombre: p.nombre,
          continente: cont.nombre,
          codigo_iso: p.iso || '',
          activo: true
        }))
    }));
  },

  crearContinente: async (datos) => {
    const response = await axios.post('/continentes', datos);
    return response.data;
  },

  eliminarContinente: async (id) => {
    const response = await axios.delete(`/continentes/${id}`);
    return response.data;
  },

  crearPaisConContinente: async (datos) => {
    const response = await axios.post('/paises', {
      nombre: datos.nombre,
      iso: datos.codigo_iso || ''
    });
    return { ...response.data, continente: datos.continente };
  },

  getAllRoles: async () => {
    const response = await axios.get('/roles');
    return response.data;
  },

  getEstadisticasGenerales: async (anio, filtros = {}) => {
    const response = await axios.get('/estadisticas', {
      params: { ...(anio ? { anio } : {}) }
    });
    return response.data;
  },

  getPresupuestosPorPais: async (pais_id, anio) => {
    const response = await axios.get('/presupuestos', {
      params: { pais_id, anio }
    });
    return response.data;
  },

  getDetallePresupuesto: async (pais_id, mes, anio) => {
    const response = await axios.get('/presupuestos', {
      params: { pais_id, mes, anio }
    });
    return response.data;
  },

  agregarItemPresupuesto: async (datos) => {
    const response = await axios.post('/presupuestos', datos);
    return response.data;
  },

  eliminarItemPresupuesto: async (id) => {
    const response = await axios.delete(`/presupuestos/${id}`);
    return response.data;
  },

  getEjecucionesPorPais: async (pais_id, anio) => {
    const response = await axios.get('/ejecuciones', {
      params: { pais_id, anio }
    });
    return response.data;
  },

  crearEjecucion: async (datos) => {
    const response = await axios.post('/ejecuciones', datos);
    return response.data;
  },

  actualizarMontoEjecucion: async (id, monto_recibido_usd) => {
    const response = await axios.patch(`/ejecuciones/${id}`, {
      monto_recibido_usd
    });
    return response.data;
  },

  getGastosReales: async (ejecucion_id) => {
    const response = await axios.get('/gastos-reales', {
      params: { ejecucion_id }
    });
    return response.data;
  },

  agregarGastoReal: async (datos) => {
    const response = await axios.post('/gastos-reales', datos);
    return response.data;
  },

  eliminarGastoReal: async (id) => {
    const response = await axios.delete(`/gastos-reales/${id}`);
    return response.data;
  },

  getAllCotizaciones: async () => {
    const response = await axios.get('/cotizaciones');
    return response.data;
  },

  crearCotizacion: async (datos) => {
    const response = await axios.post('/cotizaciones', datos);
    return response.data;
  },

  aprobarCotizacion: async (id, mes_agregado, anio_agregado) => {
    const response = await axios.patch(`/cotizaciones/${id}`, {
      estado: 'aprobado',
      mes_agregado,
      anio_agregado
    });
    return response.data;
  },

  rechazarCotizacion: async (id) => {
    const response = await axios.patch(`/cotizaciones/${id}`, {
      estado: 'rechazado'
    });
    return response.data;
  },

  getTasaCambio: async () => {
    const response = await axios.get('/configuracion/tasa_cambio');
    return response.data.valor;
  },

  actualizarTasaCambio: async (tasa) => {
    const response = await axios.patch('/configuracion/tasa_cambio', { valor: tasa });
    return response.data;
  }
};

export default administracionService;
