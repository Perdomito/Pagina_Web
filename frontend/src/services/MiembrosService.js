import API from '../api/axios';

const miembrosService = {
  // Obtener todos los miembros
  getAll: async (filtros = {}) => {
    const params = new URLSearchParams(filtros);
    const response = await API.get(`/miembros?${params}`);
    return response.data;
  },

  // Obtener por ID
  getById: async (id) => {
    const response = await API.get(`/miembros/${id}`);
    return response.data;
  },

  // Crear miembro
  create: async (datos) => {
    const response = await API.post('/miembros', datos);
    return response.data;
  },

  // Actualizar miembro
  update: async (id, datos) => {
    const response = await API.put(`/miembros/${id}`, datos);
    return response.data;
  },

  // Eliminar miembro
  delete: async (id) => {
    const response = await API.delete(`/miembros/${id}`);
    return response.data;
  }
};

export default miembrosService;