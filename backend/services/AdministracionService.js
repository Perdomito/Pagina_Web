// ============================================
// ADMINISTRACION SERVICE
// ============================================
const bcrypt = require('bcryptjs');
const { query } = require('../config/database');

class AdministracionService {
  getMonthOrderCase(fieldName = 'mes') {
    return `
      CASE ${fieldName}
        WHEN 'ENERO' THEN 1
        WHEN 'FEBRERO' THEN 2
        WHEN 'MARZO' THEN 3
        WHEN 'ABRIL' THEN 4
        WHEN 'MAYO' THEN 5
        WHEN 'JUNIO' THEN 6
        WHEN 'JULIO' THEN 7
        WHEN 'AGOSTO' THEN 8
        WHEN 'SEPTIEMBRE' THEN 9
        WHEN 'OCTUBRE' THEN 10
        WHEN 'NOVIEMBRE' THEN 11
        WHEN 'DICIEMBRE' THEN 12
        ELSE 0
      END
    `;
  }

  calcularPorcentajeCambio(actual, anterior) {
    if (!anterior) {
      return actual > 0 ? 100 : 0;
    }

    return Number((((actual - anterior) / anterior) * 100).toFixed(1));
  }

  redondear(valor, decimales = 2) {
    return Number(Number(valor || 0).toFixed(decimales));
  }

  getPreviousMonth(mes, anio) {
    const meses = [
      'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
      'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
    ];

    const monthIndex = meses.indexOf(mes);
    if (monthIndex <= 0) {
      return {
        mes: 'DICIEMBRE',
        anio: anio - 1
      };
    }

    return {
      mes: meses[monthIndex - 1],
      anio
    };
  }

  getMonthLabels() {
    return [
      'ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN',
      'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'
    ];
  }

  mapMonthlySeries(rows, anio) {
    const monthOrder = {
      ENERO: 0,
      FEBRERO: 1,
      MARZO: 2,
      ABRIL: 3,
      MAYO: 4,
      JUNIO: 5,
      JULIO: 6,
      AGOSTO: 7,
      SEPTIEMBRE: 8,
      OCTUBRE: 9,
      NOVIEMBRE: 10,
      DICIEMBRE: 11
    };

    const serie = Array(12).fill(0);

    rows
      .filter((row) => parseInt(row.anio) === anio)
      .forEach((row) => {
        const index = monthOrder[row.mes];
        if (index !== undefined) {
          serie[index] = parseInt(row.total_estudios) || 0;
        }
      });

    return serie;
  }

  // ===== USUARIOS =====
  async getAllUsuarios() {
    const result = await query(`
      SELECT u.id, u.nombre, u.email, u.activo, u.ultimo_acceso, u.created_at,
             r.nombre as rol_nombre, p.nombre as pais_nombre
      FROM usuarios u
      LEFT JOIN roles r ON u.rol_id = r.id
      LEFT JOIN paises p ON u.pais_id = p.id
      ORDER BY u.created_at DESC
    `);
    return result.rows;
  }

  async crearUsuario(datos) {
    const { nombre, email, password, rol_id, pais_id } = datos;

    if (!nombre || !email || !password) {
      throw new Error('Datos incompletos');
    }

    const existente = await query('SELECT id FROM usuarios WHERE email = $1', [email]);
    if (existente.rows.length > 0) {
      throw new Error('El email ya existe');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await query(`
      INSERT INTO usuarios (nombre, email, password, rol_id, pais_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, nombre, email, rol_id, pais_id, created_at
    `, [nombre, email, passwordHash, rol_id, pais_id]);

    return result.rows[0];
  }

  async actualizarUsuario(id, datos) {
    const { nombre, email, rol_id, pais_id, activo } = datos;

    const result = await query(`
      UPDATE usuarios
      SET nombre = $1, email = $2, rol_id = $3, pais_id = $4, activo = $5
      WHERE id = $6
      RETURNING id, nombre, email, rol_id, pais_id, activo
    `, [nombre, email, rol_id, pais_id, activo, id]);

    if (result.rows.length === 0) {
      throw new Error('Usuario no encontrado');
    }

    return result.rows[0];
  }

  async eliminarUsuario(id) {
    const result = await query('DELETE FROM usuarios WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      throw new Error('Usuario no encontrado');
    }
    return { message: 'Usuario eliminado' };
  }

  // ===== CONTINENTES =====
  async getAllContinentes() {
    const result = await query(`
      SELECT * FROM continentes WHERE activo = TRUE ORDER BY nombre
    `);
    return result.rows;
  }

  async crearContinente(datos) {
    const { nombre } = datos;

    if (!nombre) {
      throw new Error('El nombre del continente es requerido');
    }

    const existente = await query('SELECT id FROM continentes WHERE LOWER(nombre) = LOWER($1)', [nombre]);
    if (existente.rows.length > 0) {
      throw new Error('Este continente ya existe');
    }

    const result = await query(`
      INSERT INTO continentes (nombre)
      VALUES ($1)
      RETURNING *
    `, [nombre]);

    return result.rows[0];
  }

  async eliminarContinente(id) {
    const paises = await query('SELECT COUNT(*) as total FROM paises WHERE continente = (SELECT nombre FROM continentes WHERE id = $1)', [id]);
    
    if (parseInt(paises.rows[0].total) > 0) {
      throw new Error('No se puede eliminar un continente con países asociados');
    }

    const result = await query('DELETE FROM continentes WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      throw new Error('Continente no encontrado');
    }
    
    return { message: 'Continente eliminado' };
  }

  // ===== PAÍSES =====
  async getAllPaises() {
    const result = await query(`
      SELECT * FROM paises WHERE activo = TRUE ORDER BY nombre
    `);
    return result.rows;
  }

  async getPaisesPorContinente(continente) {
    const result = await query(`
      SELECT * FROM paises WHERE continente = $1 AND activo = TRUE ORDER BY nombre
    `, [continente]);
    return result.rows;
  }

  async crearPais(datos) {
    const { nombre, continente, codigo_iso } = datos;

    if (!nombre || !continente) {
      throw new Error('Nombre y continente son requeridos');
    }

    const result = await query(`
      INSERT INTO paises (nombre, continente, codigo_iso)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [nombre, continente, codigo_iso]);

    return result.rows[0];
  }

  async eliminarPais(id) {
    const contactos = await query('SELECT COUNT(*) as total FROM contactos WHERE pais_id = $1', [id]);
    const miembros = await query('SELECT COUNT(*) as total FROM miembros WHERE pais_id = $1', [id]);
    
    if (parseInt(contactos.rows[0].total) > 0 || parseInt(miembros.rows[0].total) > 0) {
      throw new Error('No se puede eliminar un país con contactos o miembros asociados');
    }

    const result = await query('DELETE FROM paises WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      throw new Error('País no encontrado');
    }
    
    return { message: 'País eliminado' };
  }
  
  // ===== ROLES =====
  async getAllRoles() {
    const result = await query('SELECT * FROM roles ORDER BY id');
    return result.rows;
  }

  // ===== ESTADÍSTICAS GENERALES =====
  async getEstadisticasGenerales() {
    const [usuarios, miembros, contactos, estudios, estudiosPorAnioMes, estudiantesPorAnioMes] = await Promise.all([
      query('SELECT COUNT(*) as total FROM usuarios WHERE activo = TRUE'),
      query('SELECT COUNT(*) as total FROM miembros WHERE activo = TRUE'),
      query('SELECT COUNT(*) as total FROM contactos WHERE activo = TRUE'),
      query('SELECT COUNT(*) as total FROM estudios_biblicos WHERE activo = TRUE'),
      query(`
        SELECT
          anio,
          mes,
          COUNT(*) AS total_estudios
        FROM estudios_biblicos
        WHERE activo = TRUE
        GROUP BY anio, mes
        ORDER BY anio DESC, ${this.getMonthOrderCase('mes')} DESC
      `),
      query(`
        SELECT
          anio,
          mes,
          COUNT(DISTINCT contacto_id) AS total_estudiantes
        FROM estudios_biblicos
        WHERE activo = TRUE
        GROUP BY anio, mes
        ORDER BY anio DESC, ${this.getMonthOrderCase('mes')} DESC
      `)
    ]);

    const aniosDisponibles = [...new Set(
      estudiosPorAnioMes.rows.map((row) => parseInt(row.anio))
    )].sort((a, b) => b - a);

    const anioActual = aniosDisponibles[0] || new Date().getFullYear();
    const anioAnterior = aniosDisponibles[1] || (anioActual - 1);

    const labels = this.getMonthLabels();
    const serieActual = this.mapMonthlySeries(estudiosPorAnioMes.rows, anioActual);
    const serieAnterior = this.mapMonthlySeries(estudiosPorAnioMes.rows, anioAnterior);
    const crecimientoEstudiantesActual = this.mapMonthlySeries(
      estudiantesPorAnioMes.rows.map((row) => ({
        ...row,
        total_estudios: row.total_estudiantes
      })),
      anioActual
    );
    const totalAnterior = serieAnterior.reduce((sum, value) => sum + value, 0);
    const totalActual = serieActual.reduce((sum, value) => sum + value, 0);
    const rendimientoProfesoresResult = await query(`
      SELECT
        m.id,
        m.nombre,
        COUNT(e.id) AS total_estudios
      FROM estudios_biblicos e
      INNER JOIN miembros m ON m.id = e.miembro_responsable_id
      WHERE e.activo = TRUE
        AND m.activo = TRUE
        AND e.anio = $1
      GROUP BY m.id, m.nombre
      ORDER BY COUNT(e.id) DESC, m.nombre ASC
    `, [anioActual]);

    const rendimientoProfesores = rendimientoProfesoresResult.rows.map((row) => {
      const totalEstudiosProfesor = parseInt(row.total_estudios) || 0;

      return {
        id: parseInt(row.id),
        nombre: row.nombre,
        total_estudios: totalEstudiosProfesor,
        promedio_mensual: this.redondear(totalEstudiosProfesor / 12, 1),
        promedio_diario: this.redondear(totalEstudiosProfesor / 365, 2)
      };
    });

    return {
      total_usuarios: parseInt(usuarios.rows[0].total),
      total_miembros: parseInt(miembros.rows[0].total),
      total_contactos: parseInt(contactos.rows[0].total),
      total_estudios: parseInt(estudios.rows[0].total),
      comparacion_estudios: {
        labels,
        serie_anterior: {
          etiqueta: `${anioAnterior}`,
          data: serieAnterior,
          total: totalAnterior
        },
        serie_actual: {
          etiqueta: `${anioActual}`,
          data: serieActual,
          total: totalActual
        },
        crecimiento: this.calcularPorcentajeCambio(totalActual, totalAnterior),
        diferencia: totalActual - totalAnterior
      },
      rendimiento_profesores: {
        anio: anioActual,
        profesores: rendimientoProfesores
      },
      crecimiento_estudiantes: {
        anio: anioActual,
        labels,
        serie: crecimientoEstudiantesActual,
        total: crecimientoEstudiantesActual.reduce((sum, value) => sum + value, 0)
      }
    };
  }

  // ===== PRESUPUESTOS =====
  async getPresupuestosPorPais(pais_id, anio) {
    const result = await query(`
      SELECT 
        mes,
        anio,
        tipo,
        SUM(CASE WHEN tipo = 'gasto_fijo' THEN monto ELSE 0 END) as total_gastos_fijos,
        SUM(CASE WHEN tipo = 'pago_misionero' THEN monto ELSE 0 END) as total_misioneros,
        SUM(CASE WHEN tipo = 'otro_gasto' THEN monto ELSE 0 END) as total_otros,
        SUM(monto) as total_general
      FROM presupuestos
      WHERE pais_id = $1 AND anio = $2
      GROUP BY mes, anio, tipo
      ORDER BY 
        CASE mes
          WHEN 'ENERO' THEN 1 WHEN 'FEBRERO' THEN 2 WHEN 'MARZO' THEN 3
          WHEN 'ABRIL' THEN 4 WHEN 'MAYO' THEN 5 WHEN 'JUNIO' THEN 6
          WHEN 'JULIO' THEN 7 WHEN 'AGOSTO' THEN 8 WHEN 'SEPTIEMBRE' THEN 9
          WHEN 'OCTUBRE' THEN 10 WHEN 'NOVIEMBRE' THEN 11 WHEN 'DICIEMBRE' THEN 12
        END
    `, [pais_id, anio]);
    
    return result.rows;
  }

  async getDetallePresupuesto(pais_id, mes, anio) {
    const result = await query(`
      SELECT * FROM presupuestos
      WHERE pais_id = $1 AND mes = $2 AND anio = $3
      ORDER BY tipo, concepto
    `, [pais_id, mes, anio]);
    
    return result.rows;
  }

  async agregarItemPresupuesto(datos) {
    const { pais_id, mes, anio, tipo, concepto, monto, moneda, tasa_cambio } = datos;
    
    const result = await query(`
      INSERT INTO presupuestos (pais_id, mes, anio, tipo, concepto, monto, moneda, tasa_cambio)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [pais_id, mes, anio, tipo, concepto, monto, moneda || 'DOP', tasa_cambio]);
    
    return result.rows[0];
  }

  async eliminarItemPresupuesto(id) {
    const result = await query('DELETE FROM presupuestos WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      throw new Error('Item no encontrado');
    }
    return { message: 'Item eliminado' };
  }

  // ===== EJECUCIONES =====
  async getEjecucionesPorPais(pais_id, anio) {
    const result = await query(`
      SELECT * FROM ejecuciones
      WHERE pais_id = $1 AND anio = $2
      ORDER BY 
        CASE mes
          WHEN 'ENERO' THEN 1 WHEN 'FEBRERO' THEN 2 WHEN 'MARZO' THEN 3
          WHEN 'ABRIL' THEN 4 WHEN 'MAYO' THEN 5 WHEN 'JUNIO' THEN 6
          WHEN 'JULIO' THEN 7 WHEN 'AGOSTO' THEN 8 WHEN 'SEPTIEMBRE' THEN 9
          WHEN 'OCTUBRE' THEN 10 WHEN 'NOVIEMBRE' THEN 11 WHEN 'DICIEMBRE' THEN 12
        END
    `, [pais_id, anio]);
    
    return result.rows;
  }

  async crearEjecucion(datos) {
    const { pais_id, mes, anio, monto_recibido_usd, presupuesto_base_id } = datos;
    
    const result = await query(`
      INSERT INTO ejecuciones (pais_id, mes, anio, monto_recibido_usd, presupuesto_base_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [pais_id, mes, anio, monto_recibido_usd || 0, presupuesto_base_id]);
    
    return result.rows[0];
  }

  async actualizarMontoEjecucion(id, monto_recibido_usd) {
    const result = await query(`
      UPDATE ejecuciones SET monto_recibido_usd = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 RETURNING *
    `, [monto_recibido_usd, id]);
    
    return result.rows[0];
  }

  async getGastosReales(ejecucion_id) {
    const result = await query(`
      SELECT * FROM gastos_reales WHERE ejecucion_id = $1 ORDER BY concepto
    `, [ejecucion_id]);
    
    return result.rows;
  }

  async agregarGastoReal(datos) {
    const { ejecucion_id, concepto, monto, tipo } = datos;
    
    const result = await query(`
      INSERT INTO gastos_reales (ejecucion_id, concepto, monto, tipo)
      VALUES ($1, $2, $3, $4) RETURNING *
    `, [ejecucion_id, concepto, monto, tipo]);
    
    return result.rows[0];
  }

  async eliminarGastoReal(id) {
    const result = await query('DELETE FROM gastos_reales WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      throw new Error('Gasto no encontrado');
    }
    return { message: 'Gasto eliminado' };
  }

  // ===== COTIZACIONES =====
  async getAllCotizaciones() {
    const result = await query(`
      SELECT * FROM cotizaciones ORDER BY fecha DESC, created_at DESC
    `);
    return result.rows;
  }

  async crearCotizacion(datos) {
    const { fecha, solicitante, concepto, monto } = datos;
    
    const result = await query(`
      INSERT INTO cotizaciones (fecha, solicitante, concepto, monto)
      VALUES ($1, $2, $3, $4) RETURNING *
    `, [fecha, solicitante, concepto, monto]);
    
    return result.rows[0];
  }

  async aprobarCotizacion(id, mes_agregado, anio_agregado) {
    const result = await query(`
      UPDATE cotizaciones 
      SET estado = 'aprobado', agregado_a_gastos = TRUE, 
          mes_agregado = $2, anio_agregado = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 RETURNING *
    `, [id, mes_agregado, anio_agregado]);
    
    return result.rows[0];
  }

  async rechazarCotizacion(id) {
    const result = await query(`
      UPDATE cotizaciones SET estado = 'rechazado', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 RETURNING *
    `, [id]);
    
    return result.rows[0];
  }

  // ===== CONFIGURACIÓN =====
  async getTasaCambio() {
    const result = await query(`
      SELECT valor FROM configuracion WHERE clave = 'tasa_cambio_usd'
    `);
    
    if (result.rows.length === 0) {
      return '58.00';
    }
    
    return result.rows[0].valor;
  }

  async actualizarTasaCambio(nuevaTasa) {
    const result = await query(`
      UPDATE configuracion 
      SET valor = $1, updated_at = CURRENT_TIMESTAMP
      WHERE clave = 'tasa_cambio_usd'
      RETURNING valor
    `, [nuevaTasa.toString()]);
    
    return result.rows[0];
  }
}

module.exports = new AdministracionService();
