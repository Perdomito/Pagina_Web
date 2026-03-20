// ============================================
// CONTACTOS SERVICE
// ============================================
const { query } = require('../config/database');

class ContactosService {
  async getAll(filtros = {}) {
    let sql = `
      SELECT c.*, m.nombre as miembro_nombre, p.nombre as pais_nombre
      FROM contactos c
      LEFT JOIN miembros m ON c.miembro_id = m.id
      LEFT JOIN paises p ON c.pais_id = p.id
      WHERE c.activo = TRUE
    `;
    const params = [];

    if (filtros.miembro_id) {
      params.push(filtros.miembro_id);
      sql += ` AND c.miembro_id = $${params.length}`;
    }

    if (filtros.pais_id) {
      params.push(filtros.pais_id);
      sql += ` AND c.pais_id = $${params.length}`;
    }

    sql += ' ORDER BY c.created_at DESC';
    const result = await query(sql, params);
    return result.rows;
  }

  async getById(id) {
    const result = await query(`
      SELECT c.*, m.nombre as miembro_nombre, p.nombre as pais_nombre
      FROM contactos c
      LEFT JOIN miembros m ON c.miembro_id = m.id
      LEFT JOIN paises p ON c.pais_id = p.id
      WHERE c.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      throw new Error('Contacto no encontrado');
    }
    return result.rows[0];
  }

  async create(datos) {
    const { miembro_id, nombre, telefono, pais_id, notas, estado } = datos;

    if (!miembro_id || !nombre) {
      throw new Error('Miembro y nombre son requeridos');
    }

    const result = await query(`
      INSERT INTO contactos (miembro_id, nombre, telefono, pais_id, notas, estado)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [miembro_id, nombre, telefono, pais_id, notas, estado || 'Nuevo']);

    return result.rows[0];
  }

  async update(id, datos) {
    await this.getById(id);
    const { nombre, telefono, pais_id, notas, estado } = datos;

    const result = await query(`
      UPDATE contactos SET
        nombre = $1, telefono = $2, pais_id = $3, notas = $4, estado = $5
      WHERE id = $6
      RETURNING *
    `, [nombre, telefono, pais_id, notas, estado, id]);

    return result.rows[0];
  }

  async delete(id) {
    await this.getById(id);
    await query('UPDATE contactos SET activo = FALSE WHERE id = $1', [id]);
    return { message: 'Contacto eliminado' };
  }
}

module.exports = new ContactosService();
