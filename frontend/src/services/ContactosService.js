import API from '../api/axios';

const contactosService = {
  getAll: async (filtros = {}) => {
    const params = new URLSearchParams(filtros);
    const response = await API.get(`/contactos?${params}`);
    return response.data;
  },

  getById: async (id) => {
    const response = await API.get(`/contactos/${id}`);
    return response.data;
  },

  create: async (datos) => {
    const response = await API.post('/contactos', datos);
    return response.data;
  },

  update: async (id, datos) => {
    const response = await API.put(`/contactos/${id}`, datos);
    return response.data;
  },

  delete: async (id) => {
    const response = await API.delete(`/contactos/${id}`);
    return response.data;
  }
};

export default contactosService;