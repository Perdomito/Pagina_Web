import API from '../api/axios';

const estudiosService = {
  guardarEstudio: async (datos) => {
    const response = await API.post('/estudios-diarios', datos);
    return response.data;
  },

  getEstudiosPorPaisYMes: async (pais_id, mes, anio) => {
    const response = await API.get('/estudios-diarios', {
      params: { pais_id, mes, anio }
    });
    return response.data;
  },

  guardarEvangelismo: async (datos) => {
    const response = await API.post('/estudios-diarios', datos);
    return response.data;
  },

  getEvangelismoPorPaisYMes: async (pais_id, mes, anio) => {
    const response = await API.get('/estudios-diarios', {
      params: { pais_id, mes, anio }
    });
    return response.data;
  },

  guardarNuevosEstudiantes: async (datos) => {
    const response = await API.post('/estudios-diarios', datos);
    return response.data;
  },

  getNuevosEstudiantesPorPaisYMes: async (pais_id, mes, anio) => {
    const response = await API.get('/estudios-diarios', {
      params: { pais_id, mes, anio }
    });
    return response.data;
  },

  getResumenCompleto: async (pais_id, mes, anio) => {
    const response = await API.get('/estudios-diarios', {
      params: { pais_id, mes, anio }
    });
    return response.data;
  },

  getReporteCompleto: async (pais_id, mes, anio, tipo = 'mensual') => {
    const response = await API.get('/reportes', {
      params: { pais_id, mes, anio, tipo }
    });
    return response.data;
  }
};

export default estudiosService;
