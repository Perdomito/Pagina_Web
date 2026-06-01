import axios from '../api/axios';

const ConfiguracionService = {
  getAllUsuarios: async () => {
    const response = await axios.get('/usuarios');
    return response.data;
  },

  crearUsuario: async (datos) => {
    const response = await axios.post('/usuarios', datos);
    return response.data;
  },

  actualizarUsuario: async (id, datos) => {
    const response = await axios.patch(`/usuarios/${id}`, datos);
    return response.data;
  },

  eliminarUsuario: async (id) => {
    const response = await axios.delete(`/usuarios/${id}`);
    return response.data;
  },

  getAllRoles: async () => {
    const response = await axios.get('/roles');
    return response.data;
  },

  getAllPermisos: async () => {
    const response = await axios.get('/roles');
    const roles = response.data;
    const todosPermisos = new Map();
    for (const rol of roles) {
      try {
        const permisosRol = await axios.get(`/roles/${rol.id}/permisos`).then(r => r.data);
        permisosRol.forEach(p => {
          if (!todosPermisos.has(p.permiso_id)) {
            todosPermisos.set(p.permiso_id, {
              id: p.permiso_id,
              nombre: p.nombre || `Permiso ${p.permiso_id}`,
              descripcion: p.descripcion || ''
            });
          }
        });
      } catch {}
    }
    return Array.from(todosPermisos.values());
  },

  getPermisosRol: async (rol_id) => {
    const response = await axios.get(`/roles/${rol_id}/permisos`);
    return response.data;
  },

  actualizarPermisoRol: async (rol_id, permiso_id, tiene_acceso) => {
    const response = await axios.patch(`/roles/${rol_id}/permisos/${permiso_id}`, {
      tiene_acceso
    });
    return response.data;
  },

  getAllPaises: async () => {
    const response = await axios.get('/paises');
    return response.data;
  },

  getPermisosUsuario: async (usuario_id) => {
    const response = await axios.get(`/usuarios/${usuario_id}/permisos`);
    return response.data;
  },

  actualizarPermisoUsuario: async (usuario_id, permiso_id, tiene_acceso) => {
    const response = await axios.patch(`/usuarios/${usuario_id}/permisos/${permiso_id}`, {
      tiene_acceso
    });
    return response.data;
  },

  eliminarPermisoUsuario: async (usuario_id, permiso_id) => {
    const response = await axios.delete(`/usuarios/${usuario_id}/permisos/${permiso_id}`);
    return response.data;
  }
};

export default ConfiguracionService;
