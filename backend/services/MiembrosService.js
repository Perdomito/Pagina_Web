const pythonApi = require('../config/pythonApi');

class MiembrosService {
  async getAll(filtros = {}) {
    const params = {};
    if (filtros.pais_id) params.pais_id = filtros.pais_id;
    if (filtros.tipo_miembro) params.tipo = filtros.tipo_miembro;

    const response = await pythonApi.get('/miembros', { params });
    let miembros = response.data;

    if (filtros.busqueda) {
      const term = filtros.busqueda.toLowerCase();
      miembros = miembros.filter(m =>
        (m.nombre && m.nombre.toLowerCase().includes(term)) ||
        (m.identidad && m.identidad.toLowerCase().includes(term))
      );
    }

    return miembros.map(m => ({
      ...m,
      pais_nombre: m.pais || null,
      activo: m.activo !== undefined ? m.activo : true
    }));
  }

  async getById(id) {
    const response = await pythonApi.get(`/miembros/${id}`);
    const m = response.data;
    return {
      ...m,
      pais_nombre: m.pais || null,
      activo: m.activo !== undefined ? m.activo : true
    };
  }

  async create(datos) {
    if (!datos.nombre || !datos.pais_id) {
      throw new Error('Nombre y pais son requeridos');
    }

    const payload = {
      nombre: datos.nombre,
      identidad: datos.identidad || null,
      pais: datos.pais_nombre || null,
      ciudad: datos.ciudad || null,
      edad: datos.edad || null,
      evangelizado_por: datos.evangelizado_por || null,
      estado_civil: datos.estado_civil || null,
      profesion: datos.profesion || null,
      comentarios: datos.comentarios || null,
      tipo_miembro: datos.tipo_miembro || 'Registrado',
      pais_id: datos.pais_id,
      ciudad_id: datos.ciudad_id || null
    };

    if (datos.id) {
      payload.id = datos.id;
    }

    const response = await pythonApi.post('/miembros', payload);
    return response.data;
  }

  async update(id, datos) {
    await this.getById(id);

    const payload = {};
    if (datos.nombre !== undefined) payload.nombre = datos.nombre;
    if (datos.identidad !== undefined) payload.identidad = datos.identidad;
    if (datos.pais !== undefined) payload.pais = datos.pais;
    if (datos.ciudad !== undefined) payload.ciudad = datos.ciudad;
    if (datos.edad !== undefined) payload.edad = datos.edad;
    if (datos.evangelizado_por !== undefined) payload.evangelizado_por = datos.evangelizado_por;
    if (datos.estado_civil !== undefined) payload.estado_civil = datos.estado_civil;
    if (datos.profesion !== undefined) payload.profesion = datos.profesion;
    if (datos.comentarios !== undefined) payload.comentarios = datos.comentarios;
    if (datos.tipo_miembro !== undefined) payload.tipo_miembro = datos.tipo_miembro;
    if (datos.pais_id !== undefined) payload.pais_id = datos.pais_id;
    if (datos.ciudad_id !== undefined) payload.ciudad_id = datos.ciudad_id;

    const response = await pythonApi.patch(`/miembros/${id}`, payload);
    return response.data;
  }

  async delete(id) {
    await pythonApi.delete(`/miembros/${id}`);
    return { message: 'Miembro eliminado exitosamente' };
  }

  async getEstadisticas(pais_id = null) {
    const params = {};
    if (pais_id) params.pais_id = pais_id;

    const response = await pythonApi.get('/miembros', { params });
    const miembros = response.data;

    const total = miembros.length;
    const comprometidos = miembros.filter(m => m.tipo_miembro === 'Comprometido').length;
    const registrados = miembros.filter(m => m.tipo_miembro === 'Registrado').length;
    const voluntarios = miembros.filter(m => m.tipo_miembro === 'Voluntario').length;

    return { total, comprometidos, registrados, voluntarios };
  }
}

module.exports = new MiembrosService();