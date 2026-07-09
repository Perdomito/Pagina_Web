import API from '../api/axios';

export const MESES = { ENERO:1, FEBRERO:2, MARZO:3, ABRIL:4, MAYO:5, JUNIO:6,
                       JULIO:7, AGOSTO:8, SEPTIEMBRE:9, OCTUBRE:10, NOVIEMBRE:11, DICIEMBRE:12 };

function buildParams(pais_id, mes, anio, extra = {}) {
  const params = { ...extra };
  if (pais_id != null && pais_id !== '') params.pais_id = Number(pais_id);
  if (mes != null && mes !== '') params.mes = MESES[mes] ?? Number(mes);
  if (anio != null && anio !== '') params.anio = Number(anio);
  return params;
}

const estudiosService = {
  guardarEstudio: async (datos) => {
    const response = await API.post('/estudios-diarios', datos);
    return response.data;
  },

  getEstudiosPorPaisYMes: async (pais_id, mes, anio) => {
    const response = await API.get('/estudios-diarios', {
      params: buildParams(pais_id, mes, anio)
    });
    return response.data;
  },

  guardarEvangelismo: async (datos) => {
    const response = await API.post('/estudios-diarios', datos);
    return response.data;
  },

  getEvangelismoPorPaisYMes: async (pais_id, mes, anio) => {
    const response = await API.get('/estudios-diarios', {
      params: buildParams(pais_id, mes, anio)
    });
    return response.data;
  },

  guardarNuevosEstudiantes: async (datos) => {
    const response = await API.post('/estudios-diarios', datos);
    return response.data;
  },

  getNuevosEstudiantesPorPaisYMes: async (pais_id, mes, anio) => {
    const response = await API.get('/estudios-diarios', {
      params: buildParams(pais_id, mes, anio)
    });
    return response.data;
  },

  getResumenCompleto: async (pais_id, mes, anio) => {
    const response = await API.get('/estudios-diarios', {
      params: buildParams(pais_id, mes, anio)
    });
    return response.data;
  },

  getReporteCompleto: async (pais_id, mes, anio, tipo = 'mensual') => {
    const response = await API.get('/reportes', {
      params: buildParams(pais_id, mes, anio, { tipo })
    });
    return response.data;
  },

  tieneEstudios: async (contacto_id) => {
    try {
      const response = await API.get('/estudios-diarios', {
        params: { contacto_id }
      });
      if (!Array.isArray(response.data)) return false;
      // Filtrar estrictamente por contacto_id en caso de que la API no filtre
      const conDatos = response.data.filter(r => 
        String(r.contacto_id) === String(contacto_id) && parseFloat(r.horas || 0) > 0
      );
      return conDatos.length > 0;
    } catch {
      return false;
    }
  }
};

export default estudiosService;
