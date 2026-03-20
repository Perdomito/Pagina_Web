import API from '../api/axios';

const reportesService = {
  // Generar reporte automático
  generarReporte: async (pais_id, mes, anio, tipo = 'Mensual') => {
    const response = await API.get('/reportes/generar', {
      params: { pais_id, mes, anio, tipo }
    });
    return response.data;
  },

  // Guardar reporte
  guardarReporte: async (datos) => {
    const response = await API.post('/reportes', datos);
    return response.data;
  },

  // Obtener histórico
  getHistorico: async (pais_id, limit = 12) => {
    const response = await API.get('/reportes/historico', {
      params: { pais_id, limit }
    });
    return response.data;
  },

  // Obtener reporte específico
  getReporte: async (pais_id, mes, anio, tipo) => {
    const response = await API.get('/reportes', {
      params: { pais_id, mes, anio, tipo }
    });
    return response.data;
  }
};

export default reportesService;