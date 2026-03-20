import API from '../api/axios';

const estudiosService = {
  // Guardar estudio
  guardarEstudio: async (datos) => {
    const response = await API.post('/estudios/estudio', datos);
    return response.data;
  },

  // Obtener estudios por país y mes
  getEstudiosPorPaisYMes: async (pais_id, mes, anio) => {
    const response = await API.get('/estudios/estudios', {
      params: { pais_id, mes, anio }
    });
    return response.data;
  },

  // Guardar evangelismo
  guardarEvangelismo: async (datos) => {
    const response = await API.post('/estudios/evangelismo', datos);
    return response.data;
  },

  // Obtener evangelismo
  getEvangelismoPorPaisYMes: async (pais_id, mes, anio) => {
    const response = await API.get('/estudios/evangelismo', {
      params: { pais_id, mes, anio }
    });
    return response.data;
  },

  // Guardar nuevos estudiantes
  guardarNuevosEstudiantes: async (datos) => {
    const response = await API.post('/estudios/nuevos-estudiantes', datos);
    return response.data;
  },

  // Obtener nuevos estudiantes
  getNuevosEstudiantesPorPaisYMes: async (pais_id, mes, anio) => {
    const response = await API.get('/estudios/nuevos-estudiantes', {
      params: { pais_id, mes, anio }
    });
    return response.data;
  },

  // Obtener resumen completo
  getResumenCompleto: async (pais_id, mes, anio) => {
    const response = await API.get('/estudios/resumen', {
      params: { pais_id, mes, anio }
    });
    return response.data;
  }
};

export default estudiosService;