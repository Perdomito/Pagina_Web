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
      iso: datos.codigo_iso || '',
      continente_id: datos.continente_id
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
    const MESES = ["ENERO","FEBRERO","MARZO","ABRIL","MAYO","JUNIO","JULIO","AGOSTO","SEPTIEMBRE","OCTUBRE","NOVIEMBRE","DICIEMBRE"];
    const mesNum = typeof mes === 'string' ? MESES.indexOf(mes) + 1 : mes;
    const response = await axios.get('/presupuestos', {
      params: { pais_id, mes: mesNum, anio }
    });
    return response.data;
  },

  agregarItemPresupuesto: async (datos) => {
    const MESES = ["ENERO","FEBRERO","MARZO","ABRIL","MAYO","JUNIO","JULIO","AGOSTO","SEPTIEMBRE","OCTUBRE","NOVIEMBRE","DICIEMBRE"];
    const datosFixed = { ...datos };
    if (typeof datosFixed.mes === 'string') {
      datosFixed.mes = MESES.indexOf(datosFixed.mes) + 1;
    }
    const response = await axios.post('/presupuestos', datosFixed);
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
    try {
      const response = await axios.get('/configuracion/tasa_cambio');
      return response.data.valor;
    } catch {
      return 58.00; // valor por defecto si no existe
    }
  },

  actualizarTasaCambio: async (tasa) => {
    try {
      const response = await axios.patch('/configuracion/tasa_cambio', { valor: String(tasa) });
      return response.data;
    } catch {
      // Si no existe la clave, la creamos
      try {
        const response = await axios.post('/configuracion', { clave: 'tasa_cambio', valor: String(tasa) });
        return response.data;
      } catch {}
    }
  }
,

  // Ingresos
  getIngresos: async (pais_id, mes, anio) => {
    const MESES = ["ENERO","FEBRERO","MARZO","ABRIL","MAYO","JUNIO","JULIO","AGOSTO","SEPTIEMBRE","OCTUBRE","NOVIEMBRE","DICIEMBRE"];
    const mesNum = typeof mes === 'string' ? MESES.indexOf(mes) + 1 : mes;
    const response = await axios.get('/ingresos', {
      params: { pais_id, mes: mesNum, anio }
    });
    return response.data;
  },

  crearIngreso: async (datos) => {
    const MESES = ["ENERO","FEBRERO","MARZO","ABRIL","MAYO","JUNIO","JULIO","AGOSTO","SEPTIEMBRE","OCTUBRE","NOVIEMBRE","DICIEMBRE"];
    const datosFixed = { ...datos };
    if (typeof datosFixed.mes === 'string') {
      datosFixed.mes = MESES.indexOf(datosFixed.mes) + 1;
    }
    const response = await axios.post('/ingresos', datosFixed);
    return response.data;
  },

  eliminarIngreso: async (id) => {
    const response = await axios.delete(`/ingresos/${id}`);
    return response.data;
  },

  // Traslados
  getTraslados: async (pais_id) => {
    const response = await axios.get('/traslados', { params: { pais_id } });
    return response.data;
  },

  crearTraslado: async (datos) => {
    const response = await axios.post('/traslados', datos);
    return response.data;
  },

  // Saldos caja/banco
  getSaldos: async (pais_id) => {
    try {
      const response = await axios.get('/saldos-caja-banco', { params: { pais_id } });
      return response.data;
    } catch { return []; }
  },

  actualizarSaldos: async (id, datos) => {
    const response = await axios.patch(`/saldos-caja-banco/${id}`, datos);
    return response.data;
  },

  crearSaldos: async (datos) => {
    const response = await axios.post('/saldos-caja-banco', datos);
    return response.data;
  }

};

export default administracionService;
