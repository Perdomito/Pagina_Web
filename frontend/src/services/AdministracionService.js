import axios from '../api/axios';

const administracionService = {
  // Continentes
  getAllContinentes: async () => {
    try {
      const response = await axios.get('/administracion/continentes');
      return response.data;
    } catch (error) {
      console.error('Error al obtener continentes:', error);
      throw error;
    }
  },

  crearContinente: async (datos) => {
    try {
      const response = await axios.post('/administracion/continentes', datos);
      return response.data;
    } catch (error) {
      console.error('Error al crear continente:', error);
      throw error;
    }
  },

  eliminarContinente: async (id) => {
    try {
      const response = await axios.delete(`/administracion/continentes/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error al eliminar continente:', error);
      throw error;
    }
  },

  // Países
  getAllPaises: async () => {
    try {
      const response = await axios.get('/administracion/paises');
      return response.data;
    } catch (error) {
      console.error('Error al obtener países:', error);
      throw error;
    }
  },

  crearPais: async (datos) => {
    try {
      const response = await axios.post('/administracion/paises', datos);
      return response.data;
    } catch (error) {
      console.error('Error al crear país:', error);
      throw error;
    }
  },

  eliminarPais: async (id) => {
    try {
      const response = await axios.delete(`/administracion/paises/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error al eliminar país:', error);
      throw error;
    }
  },

  // Roles
  getAllRoles: async () => {
    try {
      const response = await axios.get('/administracion/roles');
      return response.data;
    } catch (error) {
      console.error('Error al obtener roles:', error);
      throw error;
    }
  },

  // Estadísticas generales
  getEstadisticasGenerales: async () => {
    try {
      const response = await axios.get('/administracion/estadisticas');
      return response.data;
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      throw error;
    }
  },

  // ===== PRESUPUESTOS =====
  getPresupuestosPorPais: async (pais_id, anio) => {
    try {
      const response = await axios.get('/administracion/presupuestos', {
        params: { pais_id, anio }
      });
      return response.data;
    } catch (error) {
      console.error('Error al obtener presupuestos:', error);
      throw error;
    }
  },

  getDetallePresupuesto: async (pais_id, mes, anio) => {
    try {
      const response = await axios.get('/administracion/presupuestos/detalle', {
        params: { pais_id, mes, anio }
      });
      return response.data;
    } catch (error) {
      console.error('Error al obtener detalle de presupuesto:', error);
      throw error;
    }
  },

  agregarItemPresupuesto: async (datos) => {
    try {
      const response = await axios.post('/administracion/presupuestos', datos);
      return response.data;
    } catch (error) {
      console.error('Error al agregar item:', error);
      throw error;
    }
  },

  eliminarItemPresupuesto: async (id) => {
    try {
      const response = await axios.delete(`/administracion/presupuestos/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error al eliminar item:', error);
      throw error;
    }
  },

  // ===== EJECUCIONES =====
  getEjecucionesPorPais: async (pais_id, anio) => {
    try {
      const response = await axios.get('/administracion/ejecuciones', {
        params: { pais_id, anio }
      });
      return response.data;
    } catch (error) {
      console.error('Error al obtener ejecuciones:', error);
      throw error;
    }
  },

  crearEjecucion: async (datos) => {
    try {
      const response = await axios.post('/administracion/ejecuciones', datos);
      return response.data;
    } catch (error) {
      console.error('Error al crear ejecución:', error);
      throw error;
    }
  },

  actualizarMontoEjecucion: async (id, monto_recibido_usd) => {
    try {
      const response = await axios.put(`/administracion/ejecuciones/${id}/monto`, {
        monto_recibido_usd
      });
      return response.data;
    } catch (error) {
      console.error('Error al actualizar monto:', error);
      throw error;
    }
  },

  getGastosReales: async (ejecucion_id) => {
    try {
      const response = await axios.get(`/administracion/ejecuciones/${ejecucion_id}/gastos`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener gastos reales:', error);
      throw error;
    }
  },

  agregarGastoReal: async (datos) => {
    try {
      const response = await axios.post('/administracion/ejecuciones/gastos', datos);
      return response.data;
    } catch (error) {
      console.error('Error al agregar gasto real:', error);
      throw error;
    }
  },

  eliminarGastoReal: async (id) => {
    try {
      const response = await axios.delete(`/administracion/ejecuciones/gastos/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error al eliminar gasto real:', error);
      throw error;
    }
  },

  // ===== COTIZACIONES =====
  getAllCotizaciones: async () => {
    try {
      const response = await axios.get('/administracion/cotizaciones');
      return response.data;
    } catch (error) {
      console.error('Error al obtener cotizaciones:', error);
      throw error;
    }
  },

  crearCotizacion: async (datos) => {
    try {
      const response = await axios.post('/administracion/cotizaciones', datos);
      return response.data;
    } catch (error) {
      console.error('Error al crear cotización:', error);
      throw error;
    }
  },

  aprobarCotizacion: async (id, mes_agregado, anio_agregado) => {
    try {
      const response = await axios.put(`/administracion/cotizaciones/${id}/aprobar`, {
        mes_agregado,
        anio_agregado
      });
      return response.data;
    } catch (error) {
      console.error('Error al aprobar cotización:', error);
      throw error;
    }
  },

  rechazarCotizacion: async (id) => {
    try {
      const response = await axios.put(`/administracion/cotizaciones/${id}/rechazar`);
      return response.data;
    } catch (error) {
      console.error('Error al rechazar cotización:', error);
      throw error;
    }
  },

  // ===== CONFIGURACIÓN =====
  getTasaCambio: async () => {
    try {
      const response = await axios.get('/administracion/configuracion/tasa-cambio');
      return response.data.tasa_cambio;
    } catch (error) {
      console.error('Error al obtener tasa de cambio:', error);
      throw error;
    }
  },

  actualizarTasaCambio: async (tasa) => {
    try {
      const response = await axios.put('/administracion/configuracion/tasa-cambio', { tasa });
      return response.data;
    } catch (error) {
      console.error('Error al actualizar tasa de cambio:', error);
      throw error;
    }
  }
};

export default administracionService;