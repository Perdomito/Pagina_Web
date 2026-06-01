const pythonApi = require('../config/pythonApi');

class ContactosService {
  async getAll(filtros = {}) {
    const params = {};
    if (filtros.miembro_id) params.miembro_responsable_id = filtros.miembro_id;
    if (filtros.pais_id) params.pais_id = filtros.pais_id;

    const response = await pythonApi.get('/contactos', { params });
    return response.data.map(c => ({
      ...c,
      miembro_nombre: c.miembro_responsable || null,
      pais_nombre: c.pais || null,
      activo: c.activo !== undefined ? c.activo : true
    }));
  }

  async getById(id) {
    const response = await pythonApi.get(`/contactos/${id}`);
    const c = response.data;
    return {
      ...c,
      miembro_nombre: c.miembro_responsable || null,
      pais_nombre: c.pais || null,
      activo: c.activo !== undefined ? c.activo : true
    };
  }

  async create(datos) {
    if (!datos.miembro_id || !datos.nombre) {
      throw new Error('Miembro y nombre son requeridos');
    }

    const payload = {
      miembro_responsable: datos.miembro_nombre || datos.miembro_responsable || '',
      nombre: datos.nombre,
      telefono: datos.telefono || null,
      pais: datos.pais_nombre || datos.pais || null,
      notas: datos.notas || null,
      profesion: datos.profesion || null,
      pais_id: datos.pais_id || null,
      miembro_responsable_id: datos.miembro_id || datos.miembro_responsable_id || null,
      ciudad_id: datos.ciudad_id || null
    };

    const response = await pythonApi.post('/contactos', payload);
    return response.data;
  }

  async update(id, datos) {
    await this.getById(id);

    const payload = {};
    if (datos.nombre !== undefined) payload.nombre = datos.nombre;
    if (datos.telefono !== undefined) payload.telefono = datos.telefono;
    if (datos.pais !== undefined) payload.pais = datos.pais;
    if (datos.notas !== undefined) payload.notas = datos.notas;
    if (datos.profesion !== undefined) payload.profesion = datos.profesion;
    if (datos.pais_id !== undefined) payload.pais_id = datos.pais_id;
    if (datos.miembro_responsable_id !== undefined) payload.miembro_responsable_id = datos.miembro_responsable_id;
    if (datos.ciudad_id !== undefined) payload.ciudad_id = datos.ciudad_id;

    const response = await pythonApi.patch(`/contactos/${id}`, payload);
    return response.data;
  }

  async delete(id) {
    await pythonApi.delete(`/contactos/${id}`);
    return { message: 'Contacto eliminado' };
  }
}

module.exports = new ContactosService();