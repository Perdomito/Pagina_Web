import axios from '../api/axios';

const ConfiguracionService = {
  getAllUsuarios: async () => {
    const response = await axios.get('/usuarios');
    return response.data;
  },

  getUsuarioById: async (id) => {
    const response = await axios.get(`/usuarios/${id}`);
    return response.data;
  },

  crearUsuario: async (datos) => {
    const payload = { ...datos, rol: datos.rol_id || datos.rol };
    const response = await axios.post('/usuarios', payload);
    return response.data;
  },

  actualizarUsuario: async (id, datos) => {
    const payload = { ...datos, rol: datos.rol_id || datos.rol };
    const response = await axios.patch(`/usuarios/${id}`, payload);
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
    // El backend usa "activo" en permisos de rol; el frontend trabaja con "tiene_acceso"
    return response.data.map(p => ({ ...p, tiene_acceso: p.activo }));
  },

  actualizarPermisoRol: async (rol_id, permiso_id, tiene_acceso) => {
    let data;
    try {
      const response = await axios.patch(`/roles/${rol_id}/permisos/${permiso_id}`, {
        activo: tiene_acceso
      });
      data = response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        // La fila rol-permiso no existe todavía: crearla
        const response = await axios.post(`/roles/${rol_id}/permisos`, {
          rol_id,
          permiso_id,
          activo: tiene_acceso
        });
        data = response.data;
      } else {
        throw error;
      }
    }
    return { ...data, tiene_acceso: data.activo };
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
    // 1) Intentar actualizar la fila existente
    try {
      const response = await axios.patch(`/usuarios/${usuario_id}/permisos/${permiso_id}`, {
        tiene_acceso
      });
      return response.data;
    } catch (error) {
      if (error.response?.status !== 404) throw error;
    }

    let ultimoError;
    for (let intento = 0; intento < 40; intento++) {
      try {
        const response = await axios.post(`/usuarios/${usuario_id}/permisos`, {
          usuario_id,
          permiso_id,
          tiene_acceso
        });
        return response.data;
      } catch (e) {
        ultimoError = e;
        // Si entre reintentos la fila ya quedó creada, actualizarla y salir
        if (e.response?.status === 400) {
          const response = await axios.patch(`/usuarios/${usuario_id}/permisos/${permiso_id}`, {
            tiene_acceso
          });
          return response.data;
        }
        // Solo insistir en errores de integridad (choque de ID); otros errores se propagan
        const detalle = String(e.response?.data?.detail || '');
        if (!detalle.includes('IntegrityError') && !detalle.includes('duplicate')) {
          throw e;
        }
      }
    }
    throw ultimoError;
  },

  eliminarPermisoUsuario: async (usuario_id, permiso_id) => {
    const response = await axios.delete(`/usuarios/${usuario_id}/permisos/${permiso_id}`);
    return response.data;
  },

  // Nota: el backend de esto ya no existe (se revirtió Google Sign-In).
  // Se dejan estas funciones solo para que la pestaña "Solicitudes de
  // acceso" en Configuracion.jsx no rompa el resto de la pantalla — el
  // .catch(() => []) que ya tiene esa pantalla se encarga del resto.
  getSolicitudesAcceso: async (estado) => {
    const response = await axios.get('/solicitudes-acceso', { params: estado ? { estado } : {} });
    return response.data;
  },

  aprobarSolicitud: async (id, datos) => {
    const response = await axios.post(`/solicitudes-acceso/${id}/aprobar`, datos);
    return response.data;
  },

  rechazarSolicitud: async (id, notas) => {
    const response = await axios.post(`/solicitudes-acceso/${id}/rechazar`, { notas: notas || null });
    return response.data;
  }
};

export default ConfiguracionService;
