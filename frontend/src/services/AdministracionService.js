import axios from '../api/axios';

const administracionService = {
  // Continentes
  getAllContinentes: async () => {
    try {
      const response = await axios.get('/administracion/continentes');
      return response.data;
    } catch (error) {
      console.error('Error al obtener continentes:', error);
      throw error;
    }
  },

  crearContinente: async (datos) => {
    try {
      const response = await axios.post('/administracion/continentes', datos);
      return response.data;
    } catch (error) {
      console.error('Error al crear continente:', error);
      throw error;
    }
  },

  eliminarContinente: async (id) => {
    try {
      const response = await axios.delete(`/administracion/continentes/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error al eliminar continente:', error);
      throw error;
    }
  },

  // Países
  getAllPaises: async () => {
    try {
      const response = await axios.get('/administracion/paises');
      return response.data;
    } catch (error) {
      console.error('Error al obtener países:', error);
      throw error;
    }
  },

  crearPais: async (datos) => {
    try {
      const response = await axios.post('/administracion/paises', datos);
      return response.data;
    } catch (error) {
      console.error('Error al crear país:', error);
      throw error;
    }
  },

  // Roles
  getAllRoles: async () => {
    try {
      const response = await axios.get('/administracion/roles');
      return response.data;
    } catch (error) {
      console.error('Error al obtener roles:', error);
      throw error;
    }
  },

  // Estadísticas generales
  getEstadisticasGenerales: async () => {
    try {
      const response = await axios.get('/administracion/estadisticas');
      return response.data;
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      throw error;
    }
  }
};

export default administracionService;