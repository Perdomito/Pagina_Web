// ============================================
// MIEMBROS SERVICE
// ============================================
// Lógica de negocio para misioneros/miembros

const { query, transaction } = require('../config/database');

class MiembrosService {
  // Obtener todos los miembros
  async getAll(filtros = {}) {
    let sql = `
      SELECT m.*, p.nombre as pais_nombre, p.continente
      FROM miembros m
      LEFT JOIN paises p ON m.pais_id = p.id
      WHERE m.activo = TRUE
    `;
    const params = [];

    // Filtros opcionales
    if (filtros.pais_id) {
      params.push(filtros.pais_id);
      sql += ` AND m.pais_id = $${params.length}`;
    }

    if (filtros.tipo_miembro) {
      params.push(filtros.tipo_miembro);
      sql += ` AND m.tipo_miembro = $${params.length}`;
    }

    if (filtros.busqueda) {
      params.push(`%${filtros.busqueda}%`);
      sql += ` AND (m.nombre ILIKE $${params.length} OR m.identidad ILIKE $${params.length})`;
    }

    sql += ' ORDER BY m.nombre ASC';

    const result = await query(sql, params);
    return result.rows;
  }

  // Obtener por ID
  async getById(id) {
    const result = await query(`
      SELECT m.*, p.nombre as pais_nombre, p.continente
      FROM miembros m
      LEFT JOIN paises p ON m.pais_id = p.id
      WHERE m.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      throw new Error('Miembro no encontrado');
    }

    return result.rows[0];
  }

  // Crear miembro
  async create(datos) {
    const {
      nombre,
      identidad,
      pais_id,
      ciudad,
      edad,
      evangelizado_por,
      estado_civil,
      profesion,
      comentarios,
      tipo_miembro,
      cargo_funcion,
      ministerio_of,
      avance_audio
    } = datos;

    // Validaciones
    if (!nombre || !pais_id) {
      throw new Error('Nombre y país son requeridos');
    }

    // Verificar si la identidad ya existe
    if (identidad) {
      const existente = await query(
        'SELECT id FROM miembros WHERE identidad = $1',
        [identidad]
      );

      if (existente.rows.length > 0) {
        throw new Error('La identidad ya está registrada');
      }
    }

    const result = await query(`
      INSERT INTO miembros (
        nombre, identidad, pais_id, ciudad, edad,
        evangelizado_por, estado_civil, profesion, comentarios,
        tipo_miembro, cargo_funcion, ministerio_of, avance_audio
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `, [
      nombre, identidad, pais_id, ciudad, edad,
      evangelizado_por, estado_civil, profesion, comentarios,
      tipo_miembro || 'Registrado', cargo_funcion, ministerio_of, avance_audio
    ]);

    return result.rows[0];
  }

  // Actualizar miembro
  async update(id, datos) {
    const {
      nombre,
      identidad,
      pais_id,
      ciudad,
      edad,
      evangelizado_por,
      estado_civil,
      profesion,
      comentarios,
      tipo_miembro,
      cargo_funcion,
      ministerio_of,
      avance_audio
    } = datos;

    // Verificar que el miembro existe
    await this.getById(id);

    // Verificar identidad duplicada (excepto el mismo miembro)
    if (identidad) {
      const existente = await query(
        'SELECT id FROM miembros WHERE identidad = $1 AND id != $2',
        [identidad, id]
      );

      if (existente.rows.length > 0) {
        throw new Error('La identidad ya está registrada');
      }
    }

    const result = await query(`
      UPDATE miembros SET
        nombre = $1,
        identidad = $2,
        pais_id = $3,
        ciudad = $4,
        edad = $5,
        evangelizado_por = $6,
        estado_civil = $7,
        profesion = $8,
        comentarios = $9,
        tipo_miembro = $10,
        cargo_funcion = $11,
        ministerio_of = $12,
        avance_audio = $13
      WHERE id = $14
      RETURNING *
    `, [
      nombre, identidad, pais_id, ciudad, edad,
      evangelizado_por, estado_civil, profesion, comentarios,
      tipo_miembro, cargo_funcion, ministerio_of, avance_audio, id
    ]);

    return result.rows[0];
  }

  // Eliminar miembro (soft delete)
  async delete(id) {
    await this.getById(id); // Verificar que existe

    await query(
      'UPDATE miembros SET activo = FALSE WHERE id = $1',
      [id]
    );

    return { message: 'Miembro eliminado exitosamente' };
  }

  // Obtener estadísticas
  async getEstadisticas(pais_id = null) {
    let sql = `
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE tipo_miembro = 'Comprometido') as comprometidos,
        COUNT(*) FILTER (WHERE tipo_miembro = 'Registrado') as registrados,
        COUNT(*) FILTER (WHERE tipo_miembro = 'Voluntario') as voluntarios
      FROM miembros
      WHERE activo = TRUE
    `;

    const params = [];
    if (pais_id) {
      params.push(pais_id);
      sql += ` AND pais_id = $1`;
    }

    const result = await query(sql, params);
    return result.rows[0];
  }
}

module.exports = new MiembrosService();
