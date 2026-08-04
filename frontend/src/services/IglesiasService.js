import axios from '../api/axios';

const iglesiasService = {
  getAll: async ({ pais_id, ciudad_id, activa } = {}) => {
    const params = {};
    if (pais_id != null && pais_id !== '') params.pais_id = Number(pais_id);
    if (ciudad_id != null && ciudad_id !== '') params.ciudad_id = Number(ciudad_id);
    if (activa != null) params.activa = activa;
    const response = await axios.get('/iglesias', { params });
    return response.data;
  },

  getConteoPorPais: async (activa = true) => {
    const response = await axios.get('/iglesias/conteo-por-pais', { params: { activa } });
    return response.data;
  },

  crear: async (datos) => {
    const response = await axios.post('/iglesias', datos);
    return response.data;
  },

  actualizar: async (id, datos) => {
    const response = await axios.patch(`/iglesias/${id}`, datos);
    return response.data;
  },

  eliminar: async (id) => {
    await axios.delete(`/iglesias/${id}`);
  }
};

export default iglesiasService;
