// ============================================
// REPORTES SERVICE
// ============================================
const { query } = require('../config/database');

class ReportesService {
  // Generar reporte automático desde datos de estudios
  async generarReporte(pais_id, mes, anio, tipo = 'Mensual') {
    // Obtener datos de estudios bíblicos
    const estudios = await query(`
      SELECT COUNT(DISTINCT contacto_id) as total_estudiantes,
             COUNT(*) FILTER (WHERE capitulo IS NOT NULL AND capitulo != '') as numero_estudios,
             SUM(horas) as total_horas
      FROM estudios_biblicos
      WHERE pais_id = $1 AND mes = $2 AND anio = $3 AND activo = TRUE
    `, [pais_id, mes, anio]);

    // Obtener evangelismo
    const evangelismo = await query(`
      SELECT 
        SUM(horas) FILTER (WHERE tipo = 'Virtual') as evangelismo_online,
        SUM(horas) FILTER (WHERE tipo = 'Presencial') as evangelismo_presencial
      FROM evangelismo
      WHERE pais_id = $1 AND mes = $2 AND anio = $3
    `, [pais_id, mes, anio]);

    // Obtener nuevos estudiantes
    const nuevos = await query(`
      SELECT 
        SUM(dijeron_si) as contactos_estudian,
        SUM(nuevos_contactos) as nuevos_contactos
      FROM nuevos_estudiantes
      WHERE pais_id = $1 AND mes = $2 AND anio = $3
    `, [pais_id, mes, anio]);

    const datosReporte = {
      pais_id,
      mes,
      anio,
      tipo,
      estudiantes_actuales: parseInt(estudios.rows[0]?.total_estudiantes || 0),
      evangelismo_online: parseFloat(evangelismo.rows[0]?.evangelismo_online || 0),
      evangelismo_presencial: parseFloat(evangelismo.rows[0]?.evangelismo_presencial || 0),
      numero_estudios: parseInt(estudios.rows[0]?.numero_estudios || 0),
      nuevos_contactos: parseInt(nuevos.rows[0]?.nuevos_contactos || 0),
      contactos_estudian: parseInt(nuevos.rows[0]?.contactos_estudian || 0),
      hasta_romanos4: 0,
      terminado_romanos8: 0,
      terminado_4leyes: 0,
      probabilidad_miembro: 0,
      ovejas_potenciales: 0
    };

    return datosReporte;
  }

  // Guardar reporte
  async guardarReporte(datos) {
    const {
      pais_id, mes, anio, tipo, estudiantes_actuales,
      evangelismo_online, evangelismo_presencial, numero_estudios,
      nuevos_contactos, contactos_estudian, observaciones
    } = datos;

    // Verificar si ya existe
    const existente = await query(`
      SELECT id FROM reportes
      WHERE pais_id = $1 AND mes = $2 AND anio = $3 AND tipo = $4
    `, [pais_id, mes, anio, tipo]);

    if (existente.rows.length > 0) {
      const result = await query(`
        UPDATE reportes SET
          estudiantes_actuales = $1,
          evangelismo_online = $2,
          evangelismo_presencial = $3,
          numero_estudios = $4,
          nuevos_contactos = $5,
          contactos_estudian = $6,
          observaciones = $7
        WHERE id = $8
        RETURNING *
      `, [
        estudiantes_actuales, evangelismo_online, evangelismo_presencial,
        numero_estudios, nuevos_contactos, contactos_estudian, observaciones,
        existente.rows[0].id
      ]);
      return result.rows[0];
    } else {
      const result = await query(`
        INSERT INTO reportes (
          pais_id, mes, anio, tipo, estudiantes_actuales,
          evangelismo_online, evangelismo_presencial, numero_estudios,
          nuevos_contactos, contactos_estudian, observaciones
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `, [
        pais_id, mes, anio, tipo, estudiantes_actuales,
        evangelismo_online, evangelismo_presencial, numero_estudios,
        nuevos_contactos, contactos_estudian, observaciones
      ]);
      return result.rows[0];
    }
  }

  // Obtener reportes históricos
  async getHistorico(pais_id, limit = 12) {
    const result = await query(`
      SELECT r.*, p.nombre as pais_nombre
      FROM reportes r
      LEFT JOIN paises p ON r.pais_id = p.id
      WHERE r.pais_id = $1
      ORDER BY r.anio DESC, r.mes DESC
      LIMIT $2
    `, [pais_id, limit]);

    return result.rows;
  }

  // Obtener reporte específico
  async getReporte(pais_id, mes, anio, tipo) {
    const result = await query(`
      SELECT r.*, p.nombre as pais_nombre
      FROM reportes r
      LEFT JOIN paises p ON r.pais_id = p.id
      WHERE r.pais_id = $1 AND r.mes = $2 AND r.anio = $3 AND r.tipo = $4
    `, [pais_id, mes, anio, tipo]);

    if (result.rows.length === 0) {
      // Si no existe, generarlo automáticamente
      return await this.generarReporte(pais_id, mes, anio, tipo);
    }

    return result.rows[0];
  }
}

module.exports = new ReportesService();
