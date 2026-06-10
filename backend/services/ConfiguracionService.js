const pythonApi = require('../config/pythonApi');

class ConfiguracionService {
  async getAllUsuarios() {
    const response = await pythonApi.get('/usuarios');
    return response.data;
  }

  async crearUsuario(datos) {
    const { nombre, email, password, rol_id, pais_id } = datos;

    if (!nombre || !email || !password) {
      throw new Error('Datos incompletos');
    }

    const id = datos.id || nombre.toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.|\.$/g, '');

    const payload = {
      id,
      nombre,
      email,
      password,
      rol: rol_id || 3,
      activo: true,
      region: pais_id ? String(pais_id) : null
    };

    const response = await pythonApi.post('/usuarios', payload);
    return response.data;
  }

  async actualizarUsuario(id, datos) {
    const payload = {};

    if (datos.nombre !== undefined) payload.nombre = datos.nombre;
    if (datos.email !== undefined) payload.email = datos.email;
    if (datos.rol_id !== undefined) payload.rol = datos.rol_id;
    if (datos.pais_id !== undefined) payload.region = String(datos.pais_id);
    if (datos.activo !== undefined) payload.activo = datos.activo;
    if (datos.password) payload.password = datos.password;

    const response = await pythonApi.patch(`/usuarios/${id}`, payload);
    return response.data;
  }

  async eliminarUsuario(id) {
    await pythonApi.delete(`/usuarios/${id}`);
    return { success: true };
  }

  async getAllRoles() {
    const response = await pythonApi.get('/roles');
    return response.data;
  }

  async getAllPermisos() {
    const response = await pythonApi.get('/roles');
    const roles = response.data;
    const permisosSet = new Map();

    for (const rol of roles) {
      try {
        const permResponse = await pythonApi.get(`/roles/${rol.id}/permisos`);
        for (const permiso of permResponse.data) {
          if (!permisosSet.has(permiso.permiso_id)) {
            permisosSet.set(permiso.permiso_id, {
              id: permiso.permiso_id,
              nombre: permiso.permiso_nombre || `Permiso ${permiso.permiso_id}`,
              activo: true
            });
          }
        }
      } catch (e) {
        // Algunos roles pueden no tener permisos
      }
    }

    return Array.from(permisosSet.values());
  }

  async getPermisosRol(rol_id) {
    try {
      const response = await pythonApi.get(`/roles/${rol_id}/permisos`);
      return response.data.map(p => ({
        id: p.id || p.permiso_id,
        rol_id: p.rol_id,
        permiso_id: p.permiso_id,
        tiene_acceso: p.activo !== undefined ? p.activo : true,
        permiso_nombre: p.permiso_nombre || `Permiso ${p.permiso_id}`,
        permiso_descripcion: p.permiso_descripcion || ''
      }));
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return [];
      }
      throw error;
    }
  }

  async actualizarPermisoRol(rol_id, permiso_id, tiene_acceso) {
    const response = await pythonApi.post(`/roles/${rol_id}/permisos`, {
      rol_id,
      permiso_id,
      activo: tiene_acceso
    });
    return response.data;
  }

  async getAllPaises() {
    const response = await pythonApi.get('/paises');
    return response.data.map(p => ({
      ...p,
      continente: p.continente || null,
      activo: p.activo !== undefined ? p.activo : true
    }));
  }

  async getPermisosUsuario(usuario_id) {
    return [];
  }

  async actualizarPermisoUsuario(usuario_id, permiso_id, tiene_acceso) {
    return { success: true };
  }

  async eliminarPermisoUsuario(usuario_id, permiso_id) {
    return { success: true };
  }
}

module.exports = new ConfiguracionService();