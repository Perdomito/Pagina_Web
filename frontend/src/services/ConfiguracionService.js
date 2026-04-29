import axios from '../api/axios';

const ConfiguracionService = {
  // USUARIOS
  getAllUsuarios: async () => {
    try {
      const response = await axios.get('/configuracion/usuarios');
      return response.data;
    } catch (error) {
      console.error('Error en getAllUsuarios:', error);
      throw error;
    }
  },

  crearUsuario: async (datos) => {
    try {
      const response = await axios.post('/configuracion/usuarios', datos);
      return response.data;
    } catch (error) {
      console.error('Error en crearUsuario:', error);
      throw error;
    }
  },

  actualizarUsuario: async (id, datos) => {
    try {
      const response = await axios.put(`/configuracion/usuarios/${id}`, datos);
      return response.data;
    } catch (error) {
      console.error('Error en actualizarUsuario:', error);
      throw error;
    }
  },

  eliminarUsuario: async (id) => {
    try {
      const response = await axios.delete(`/configuracion/usuarios/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error en eliminarUsuario:', error);
      throw error;
    }
  },

  // ROLES
  getAllRoles: async () => {
    try {
      const response = await axios.get('/configuracion/roles');
      return response.data;
    } catch (error) {
      console.error('Error en getAllRoles:', error);
      throw error;
    }
  },

  // PERMISOS
  getAllPermisos: async () => {
    try {
      const response = await axios.get('/configuracion/permisos');
      return response.data;
    } catch (error) {
      console.error('Error en getAllPermisos:', error);
      throw error;
    }
  },

  getPermisosRol: async (rol_id) => {
    try {
      const response = await axios.get(`/configuracion/roles/${rol_id}/permisos`);
      return response.data;
    } catch (error) {
      console.error('Error en getPermisosRol:', error);
      throw error;
    }
  },

  actualizarPermisoRol: async (rol_id, permiso_id, tiene_acceso) => {
    try {
      const response = await axios.put(`/configuracion/roles/${rol_id}/permisos/${permiso_id}`, {
        tiene_acceso
      });
      return response.data;
    } catch (error) {
      console.error('Error en actualizarPermisoRol:', error);
      throw error;
    }
  },

  // PAÍSES
  getAllPaises: async () => {
    try {
      const response = await axios.get('/configuracion/paises');
      return response.data;
    } catch (error) {
      console.error('Error en getAllPaises:', error);
      throw error;
    }
  },

  // PERMISOS PERSONALIZADOS POR USUARIO
  getPermisosUsuario: async (usuario_id) => {
    try {
      const response = await axios.get(`/configuracion/usuarios/${usuario_id}/permisos`);
      return response.data;
    } catch (error) {
      console.error('Error en getPermisosUsuario:', error);
      throw error;
    }
  },

  actualizarPermisoUsuario: async (usuario_id, permiso_id, tiene_acceso) => {
    try {
      const response = await axios.put(`/configuracion/usuarios/${usuario_id}/permisos/${permiso_id}`, {
        tiene_acceso
      });
      return response.data;
    } catch (error) {
      console.error('Error en actualizarPermisoUsuario:', error);
      throw error;
    }
  },

  eliminarPermisoUsuario: async (usuario_id, permiso_id) => {
    try {
      const response = await axios.delete(`/configuracion/usuarios/${usuario_id}/permisos/${permiso_id}`);
      return response.data;
    } catch (error) {
      console.error('Error en eliminarPermisoUsuario:', error);
      throw error;
    }
  }
};

export default ConfiguracionService;
