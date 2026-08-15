import API from '../api/axios';

const seguimientoLeyesService = {
  getAll: async (filtros = {}) => {
    const params = new URLSearchParams();
    Object.entries(filtros).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value);
      }
    });
    const query = params.toString();
    const response = await API.get(`/seguimiento-leyes${query ? `?${query}` : ''}`);
    return response.data;
  },

  getById: async (id) => {
    const response = await API.get(`/seguimiento-leyes/${id}`);
    return response.data;
  },

  create: async (datos) => {
    const response = await API.post('/seguimiento-leyes', datos);
    return response.data;
  },

  update: async (id, datos) => {
    const response = await API.patch(`/seguimiento-leyes/${id}`, datos);
    return response.data;
  },

  avanzar: async (id, datos) => {
    const response = await API.post(`/seguimiento-leyes/${id}/avanzar`, datos);
    return response.data;
  },

  retroceder: async (id) => {
    const response = await API.post(`/seguimiento-leyes/${id}/retroceder`);
    return response.data;
  },

  getEtapas: async () => {
    const response = await API.get('/seguimiento-leyes/meta/etapas');
    return response.data.etapas || [];
  }
};

export default seguimientoLeyesService;
