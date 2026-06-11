import API from '../api/axios';

const MESES = ["ENERO","FEBRERO","MARZO","ABRIL","MAYO","JUNIO","JULIO","AGOSTO","SEPTIEMBRE","OCTUBRE","NOVIEMBRE","DICIEMBRE"];
const mesNum = (mes) => typeof mes === 'string' ? MESES.indexOf(mes) + 1 : mes;

const estudiosService = {
  guardarEstudio: async (datos) => {
    const response = await API.post('/estudios-diarios', {
      ...datos,
      mes: mesNum(datos.mes)
    });
    return response.data;
  },

  getEstudiosPorPaisYMes: async (pais_id, mes, anio) => {
    const response = await API.get('/estudios-diarios', {
      params: { pais_id, mes: mesNum(mes), anio }
    });
    return response.data;
  },

  guardarEvangelismo: async (datos) => {
    const response = await API.post('/estudios-diarios', {
      ...datos,
      mes: mesNum(datos.mes)
    });
    return response.data;
  },

  getEvangelismoPorPaisYMes: async (pais_id, mes, anio) => {
    const response = await API.get('/estudios-diarios', {
      params: { pais_id, mes: mesNum(mes), anio }
    });
    return response.data;
  },

  guardarNuevosEstudiantes: async (datos) => {
    const response = await API.post('/estudios-diarios', {
      ...datos,
      mes: mesNum(datos.mes)
    });
    return response.data;
  },

  getNuevosEstudiantesPorPaisYMes: async (pais_id, mes, anio) => {
    const response = await API.get('/estudios-diarios', {
      params: { pais_id, mes: mesNum(mes), anio }
    });
    return response.data;
  },

  getResumenCompleto: async (pais_id, mes, anio) => {
    const response = await API.get('/estudios-diarios', {
      params: { pais_id, mes: mesNum(mes), anio }
    });
    return response.data;
  },

  getReporteCompleto: async (pais_id, mes, anio, tipo = 'mensual') => {
    const response = await API.get('/reportes', {
      params: { pais_id, mes: mesNum(mes), anio, tipo }
    });
    return response.data;
  }
};

export default estudiosService;
