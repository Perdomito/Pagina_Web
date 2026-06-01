import API from '../api/axios';

const reportesService = {
  generarReporte: async (pais_id, mes, anio, tipo = 'Mensual') => {
    const response = await API.get('/reportes', {
      params: { pais_id, mes, anio, tipo }
    });
    return response.data;
  },

  guardarReporte: async (datos) => {
    const response = await API.post('/reportes', datos);
    return response.data;
  },

  getHistorico: async (pais_id, limit = 12) => {
    const response = await API.get('/reportes', {
      params: { pais_id, limit }
    });
    return response.data;
  },

  getReporte: async (pais_id, mes, anio, tipo) => {
    const response = await API.get('/reportes', {
      params: { pais_id, mes, anio, tipo }
    });
    return response.data;
  }
};

export default reportesService;
