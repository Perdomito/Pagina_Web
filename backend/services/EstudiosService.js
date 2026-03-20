// ============================================
// ESTUDIOS SERVICE
// ============================================
const { query, transaction } = require('../config/database');

class EstudiosService {
  // Guardar estudio (crear o actualizar)
  async guardarEstudio(datos) {
    const {
      contacto_id,
      miembro_responsable_id,
      pais_id,
      mes,
      anio,
      dia,
      capitulo,
      horas
    } = datos;

    if (!contacto_id || !miembro_responsable_id || !pais_id || !mes || !anio || !dia) {
      throw new Error('Datos incompletos');
    }

    // Verificar si ya existe
    const existente = await query(`
      SELECT id FROM estudios_biblicos
      WHERE contacto_id = $1 AND mes = $2 AND anio = $3 AND dia = $4
    `, [contacto_id, mes, anio, dia]);

    if (existente.rows.length > 0) {
      // Actualizar
      const result = await query(`
        UPDATE estudios_biblicos
        SET capitulo = $1, horas = $2, miembro_responsable_id = $3, pais_id = $4
        WHERE id = $5
        RETURNING *
      `, [capitulo, horas, miembro_responsable_id, pais_id, existente.rows[0].id]);
      return result.rows[0];
    } else {
      // Crear
      const result = await query(`
        INSERT INTO estudios_biblicos 
        (contacto_id, miembro_responsable_id, pais_id, mes, anio, dia, capitulo, horas)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `, [contacto_id, miembro_responsable_id, pais_id, mes, anio, dia, capitulo, horas]);
      return result.rows[0];
    }
  }

  // Obtener estudios por país y mes
  async getEstudiosPorPaisYMes(pais_id, mes, anio) {
    const result = await query(`
      SELECT e.*, c.nombre as contacto_nombre, m.nombre as miembro_nombre
      FROM estudios_biblicos e
      LEFT JOIN contactos c ON e.contacto_id = c.id
      LEFT JOIN miembros m ON e.miembro_responsable_id = m.id
      WHERE e.pais_id = $1 AND e.mes = $2 AND e.anio = $3 AND e.activo = TRUE
      ORDER BY e.dia, e.contacto_id
    `, [pais_id, mes, anio]);

    return result.rows;
  }

  // Guardar evangelismo
  async guardarEvangelismo(datos) {
    const { miembro_id, pais_id, mes, anio, dia, tipo, donde, horas } = datos;

    if (!miembro_id || !pais_id || !mes || !anio || !dia || !tipo) {
      throw new Error('Datos incompletos');
    }

    // Verificar si existe
    const existente = await query(`
      SELECT id FROM evangelismo
      WHERE miembro_id = $1 AND mes = $2 AND anio = $3 AND dia = $4 AND tipo = $5
    `, [miembro_id, mes, anio, dia, tipo]);

    if (existente.rows.length > 0) {
      const result = await query(`
        UPDATE evangelismo SET donde = $1, horas = $2 WHERE id = $3 RETURNING *
      `, [donde, horas, existente.rows[0].id]);
      return result.rows[0];
    } else {
      const result = await query(`
        INSERT INTO evangelismo (miembro_id, pais_id, mes, anio, dia, tipo, donde, horas)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *
      `, [miembro_id, pais_id, mes, anio, dia, tipo, donde, horas]);
      return result.rows[0];
    }
  }

  // Obtener evangelismo
  async getEvangelismoPorPaisYMes(pais_id, mes, anio) {
    const result = await query(`
      SELECT e.*, m.nombre as miembro_nombre
      FROM evangelismo e
      LEFT JOIN miembros m ON e.miembro_id = m.id
      WHERE e.pais_id = $1 AND e.mes = $2 AND e.anio = $3
      ORDER BY e.dia, e.tipo
    `, [pais_id, mes, anio]);

    return result.rows;
  }

  // Guardar nuevos estudiantes
  async guardarNuevosEstudiantes(datos) {
    const { miembro_id, pais_id, mes, anio, dia, dijeron_si, nuevos_contactos } = datos;

    const existente = await query(`
      SELECT id FROM nuevos_estudiantes
      WHERE miembro_id = $1 AND mes = $2 AND anio = $3 AND dia = $4
    `, [miembro_id, mes, anio, dia]);

    if (existente.rows.length > 0) {
      const result = await query(`
        UPDATE nuevos_estudiantes SET dijeron_si = $1, nuevos_contactos = $2
        WHERE id = $3 RETURNING *
      `, [dijeron_si, nuevos_contactos, existente.rows[0].id]);
      return result.rows[0];
    } else {
      const result = await query(`
        INSERT INTO nuevos_estudiantes (miembro_id, pais_id, mes, anio, dia, dijeron_si, nuevos_contactos)
        VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *
      `, [miembro_id, pais_id, mes, anio, dia, dijeron_si, nuevos_contactos]);
      return result.rows[0];
    }
  }

  // Obtener nuevos estudiantes
  async getNuevosEstudiantesPorPaisYMes(pais_id, mes, anio) {
    const result = await query(`
      SELECT n.*, m.nombre as miembro_nombre
      FROM nuevos_estudiantes n
      LEFT JOIN miembros m ON n.miembro_id = m.id
      WHERE n.pais_id = $1 AND n.mes = $2 AND n.anio = $3
      ORDER BY n.dia
    `, [pais_id, mes, anio]);

    return result.rows;
  }

  // Obtener resumen completo
  async getResumenCompleto(pais_id, mes, anio) {
    const [estudios, evangelismo, nuevosEstudiantes] = await Promise.all([
      this.getEstudiosPorPaisYMes(pais_id, mes, anio),
      this.getEvangelismoPorPaisYMes(pais_id, mes, anio),
      this.getNuevosEstudiantesPorPaisYMes(pais_id, mes, anio)
    ]);

    return {
      estudios,
      evangelismo,
      nuevosEstudiantes
    };
  }
}

module.exports = new EstudiosService();
