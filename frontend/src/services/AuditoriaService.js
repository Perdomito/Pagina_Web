import API from '../api/axios';

const AuditoriaService = {
  listar: async (filtros = {}) => {
    const params = new URLSearchParams();
    Object.entries(filtros).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    const query = params.toString();
    const response = await API.get(`/auditoria${query ? `?${query}` : ''}`);
    return response.data;
  }
};

export default AuditoriaService;
