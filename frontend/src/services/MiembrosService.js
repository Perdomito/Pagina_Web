import API from '../api/axios';

const miembrosService = {
  getAll: async (filtros = {}) => {
    const params = new URLSearchParams(filtros);
    const response = await API.get(`/miembros?${params}`);
    return response.data;
  },

  getById: async (id) => {
    const response = await API.get(`/miembros/${id}`);
    return response.data;
  },

  create: async (datos) => {
    const response = await API.post('/miembros', datos);
    return response.data;
  },

  update: async (id, datos) => {
    const response = await API.patch(`/miembros/${id}`, datos);
    return response.data;
  },

  delete: async (id) => {
    const response = await API.delete(`/miembros/${id}`);
    return response.data;
  }
};

export default miembrosService;
