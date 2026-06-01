const bcrypt = require('bcryptjs');
const { query } = require('../config/database');
const pythonApi = require('../config/pythonApi');

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

  mapMonthlySeriesByMonthNumber(rows, anio, valueField = 'total') {
    const serie = Array(12).fill(0);

    rows
      .filter((row) => parseInt(row.anio) === anio)
      .forEach((row) => {
        const monthIndex = (parseInt(row.mes_num) || 0) - 1;
        if (monthIndex >= 0 && monthIndex < 12) {
          serie[monthIndex] += parseInt(row[valueField]) || 0;
        }
      });

    return serie;
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

  async getEvangelismoMemberColumn() {
    const result = await query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'evangelismo'
        AND column_name IN ('miembro_id', 'misionero_id', 'member_id')
      ORDER BY CASE column_name
        WHEN 'miembro_id' THEN 1
        WHEN 'misionero_id' THEN 2
        WHEN 'member_id' THEN 3
        ELSE 99
      END
    `);

    return result.rows[0]?.column_name || null;
  }

  // ===== VIA PYTHON API: PAISES =====
  async getAllPaises() {
    const response = await pythonApi.get('/paises');
    return response.data;
  }

  async crearPais(datos) {
    const response = await pythonApi.post('/paises', datos);
    return response.data;
  }

  async eliminarPais(id) {
    const response = await pythonApi.delete(`/paises/${id}`);
    return response.data;
  }

  // ===== VIA PYTHON API: ROLES =====
  async getAllRoles() {
    const response = await pythonApi.get('/roles');
    return response.data;
  }

  // ===== VIA PYTHON API: COTIZACIONES =====
  async getAllCotizaciones() {
    const response = await pythonApi.get('/cotizaciones');
    return response.data;
  }

  async crearCotizacion(datos) {
    const response = await pythonApi.post('/cotizaciones', datos);
    return response.data;
  }

  async aprobarCotizacion(id, mes_agregado, anio_agregado) {
    const response = await pythonApi.patch(`/cotizaciones/${id}`, {
      estado: 'aprobado',
      agregado_a_gastos: true,
      mes_agregado,
      anio_agregado
    });
    return response.data;
  }

  async rechazarCotizacion(id) {
    const response = await pythonApi.patch(`/cotizaciones/${id}`, {
      estado: 'rechazado'
    });
    return response.data;
  }

  // ===== VIA PYTHON API: PRESUPUESTOS =====
  async agregarItemPresupuesto(datos) {
    const payload = { ...datos };
    if (payload.tipo && !payload.tipo_gasto) {
      payload.tipo_gasto = payload.tipo;
      delete payload.tipo;
    }
    const response = await pythonApi.post('/presupuestos', payload);
    return response.data;
  }

  async eliminarItemPresupuesto(id) {
    const response = await pythonApi.delete(`/presupuestos/${id}`);
    return response.data;
  }

  // ===== VIA PYTHON API: EJECUCIONES =====
  async crearEjecucion(datos) {
    const payload = { ...datos };
    if (payload.presupuesto_base_id && !payload.presupuesto_id) {
      payload.presupuesto_id = payload.presupuesto_base_id;
      delete payload.presupuesto_base_id;
    }
    const response = await pythonApi.post('/ejecuciones', payload);
    return response.data;
  }

  async actualizarMontoEjecucion(id, monto_recibido_usd) {
    const response = await pythonApi.patch(`/ejecuciones/${id}`, {
      monto_recibido_usd
    });
    return response.data;
  }

  // ===== VIA PYTHON API: GASTOS REALES =====
  async getGastosReales(ejecucion_id) {
    const response = await pythonApi.get('/gastos-reales', {
      params: { ejecucion_id }
    });
    return response.data;
  }

  async agregarGastoReal(datos) {
    const payload = { ...datos };
    if (payload.tipo && !payload.tipo_gasto) {
      payload.tipo_gasto = payload.tipo;
      delete payload.tipo;
    }
    const response = await pythonApi.post('/gastos-reales', payload);
    return response.data;
  }

  async eliminarGastoReal(id) {
    const response = await pythonApi.delete(`/gastos-reales/${id}`);
    return response.data;
  }

  // ===== VIA PYTHON API: CONFIGURACION =====
  async getTasaCambio() {
    const response = await pythonApi.get('/configuracion/tasa_cambio_usd');
    return response.data;
  }

  async actualizarTasaCambio(tasa) {
    const response = await pythonApi.patch('/configuracion/tasa_cambio_usd', {
      valor: tasa
    });
    return response.data;
  }

  // ===== VIA DIRECT DB: USUARIOS =====
  async getAllUsuarios() {
    const result = await query(`
      SELECT u.id, u.nombre, u.email, u.activo, u.ultimo_acceso, u.created_at,
             r.nombre as rol_nombre, p.nombre as pais_nombre
      FROM usuarios u
      LEFT JOIN roles r ON u.rol = r.id
      LEFT JOIN paises p ON u.pais_id = p.id
      ORDER BY u.created_at DESC
    `);
    return result.rows;
  }

  async crearUsuario(datos) {
    const { nombre, email, password, rol, pais_id } = datos;

    if (!nombre || !email || !password) {
      throw new Error('Datos incompletos');
    }

    const existente = await query('SELECT id FROM usuarios WHERE email = $1', [email]);
    if (existente.rows.length > 0) {
      throw new Error('El email ya existe');
    }

    const password_hash = await bcrypt.hash(password, 10);

    const result = await query(`
      INSERT INTO usuarios (nombre, email, password_hash, rol, pais_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, nombre, email, rol, pais_id, created_at
    `, [nombre, email, password_hash, rol, pais_id]);

    return result.rows[0];
  }

  async actualizarUsuario(id, datos) {
    const { nombre, email, rol, pais_id, activo, password } = datos;

    if (password) {
      const password_hash = await bcrypt.hash(password, 10);
      const result = await query(`
        UPDATE usuarios
        SET nombre = $1, email = $2, rol = $3, pais_id = $4, activo = $5, password_hash = $6
        WHERE id = $7
        RETURNING id, nombre, email, rol, pais_id, activo
      `, [nombre, email, rol, pais_id, activo, password_hash, id]);

      if (result.rows.length === 0) {
        throw new Error('Usuario no encontrado');
      }
      return result.rows[0];
    }

    const result = await query(`
      UPDATE usuarios
      SET nombre = $1, email = $2, rol = $3, pais_id = $4, activo = $5
      WHERE id = $6
      RETURNING id, nombre, email, rol, pais_id, activo
    `, [nombre, email, rol, pais_id, activo, id]);

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

  // ===== VIA DIRECT DB: CONTINENTES =====
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

  // ===== VIA DIRECT DB: PAISES POR CONTINENTE =====
  async getPaisesPorContinente(continente) {
    const result = await query(`
      SELECT * FROM paises WHERE continente = $1 AND activo = TRUE ORDER BY nombre
    `, [continente]);
    return result.rows;
  }

  // ===== VIA DIRECT DB: ESTADISTICAS GENERALES =====
  async getEstadisticasGenerales(anioSeleccionado = null, opciones = {}) {
    const [usuarios, miembros, contactos, estudios, estudiosPorAnioMes, estudiantesPorAnioMes, miembrosPorAnioMesTipo] = await Promise.all([
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
      `),
      query(`
        SELECT
          EXTRACT(YEAR FROM created_at)::int AS anio,
          EXTRACT(MONTH FROM created_at)::int AS mes_num,
          COALESCE(NULLIF(tipo_miembro, ''), 'Sin tipo') AS tipo_miembro,
          COUNT(*) AS total
        FROM miembros
        WHERE activo = TRUE
        GROUP BY 1, 2, 3
        ORDER BY anio DESC, mes_num DESC, tipo_miembro ASC
      `)
    ]);

    const currentYear = new Date().getFullYear();
    const anioActual = Number.isInteger(anioSeleccionado) && anioSeleccionado > 0
      ? anioSeleccionado
      : currentYear;
    const anioAnterior = anioActual - 1;
    const aniosDisponibles = [...new Set([
      ...estudiosPorAnioMes.rows.map((row) => parseInt(row.anio)),
      ...estudiantesPorAnioMes.rows.map((row) => parseInt(row.anio)),
      ...miembrosPorAnioMesTipo.rows.map((row) => parseInt(row.anio)),
      anioActual,
      anioAnterior
    ])].sort((a, b) => b - a);
    const mesActual = new Date().toLocaleString('es-ES', { month: 'long' }).toUpperCase();
    const anioEvangelismo = Number.isInteger(opciones.anioEvangelismo) && opciones.anioEvangelismo > 0
      ? opciones.anioEvangelismo
      : anioActual;
    const mesEvangelismo = opciones.mesEvangelismo
      ? String(opciones.mesEvangelismo).toUpperCase()
      : mesActual;
    const modoEvangelismo = opciones.modoEvangelismo === 'anual' ? 'anual' : 'mensual';
    const anioComparacionEvangelismo = Number.isInteger(opciones.anioComparacionEvangelismo) && opciones.anioComparacionEvangelismo > 0
      ? opciones.anioComparacionEvangelismo
      : (anioEvangelismo - 1);

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
    const tiposMiembroDisponibles = [...new Set(
      miembrosPorAnioMesTipo.rows.map((row) => row.tipo_miembro).filter(Boolean)
    )].sort((a, b) => a.localeCompare(b));
    const crecimientoMiembrosPorTipo = tiposMiembroDisponibles.reduce((acc, tipo) => {
      const rowsTipo = miembrosPorAnioMesTipo.rows.filter((row) => row.tipo_miembro === tipo);
      const seriesPorAnio = {};

      aniosDisponibles.forEach((anio) => {
        seriesPorAnio[anio] = this.mapMonthlySeriesByMonthNumber(rowsTipo, anio, 'total');
      });

      acc[tipo] = seriesPorAnio;
      return acc;
    }, {});
    const crecimientoMiembrosTodos = {};

    aniosDisponibles.forEach((anio) => {
      crecimientoMiembrosTodos[anio] = this.mapMonthlySeriesByMonthNumber(
        miembrosPorAnioMesTipo.rows,
        anio,
        'total'
      );
    });

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
        id: row.id,
        nombre: row.nombre,
        total_estudios: totalEstudiosProfesor,
        promedio_mensual: this.redondear(totalEstudiosProfesor / 12, 1),
        promedio_diario: this.redondear(totalEstudiosProfesor / 365, 2)
      };
    });

    const evangelismoMemberColumn = await this.getEvangelismoMemberColumn();

    let evangelismoProfesoresResult = { rows: [] };
    let evangelismoProfesoresComparacionResult = { rows: [] };
    let aniosEvangelismoDisponibles = [anioEvangelismo, anioComparacionEvangelismo];

    if (evangelismoMemberColumn) {
      const evangelismoAniosResult = await query(`
        SELECT DISTINCT anio
        FROM evangelismo
        WHERE anio IS NOT NULL
        ORDER BY anio DESC
      `);

      aniosEvangelismoDisponibles = [...new Set([
        ...evangelismoAniosResult.rows.map((row) => parseInt(row.anio)),
        anioEvangelismo,
        anioComparacionEvangelismo
      ])].sort((a, b) => b - a);

      const filtroMensual = modoEvangelismo === 'mensual'
        ? `AND UPPER(e.mes) = $2`
        : '';
      const paramsPeriodoActual = modoEvangelismo === 'mensual'
        ? [anioEvangelismo, mesEvangelismo]
        : [anioEvangelismo];

      evangelismoProfesoresResult = await query(`
        SELECT
          m.id,
          m.nombre,
          COALESCE(SUM(e.horas), 0) AS total_horas
        FROM miembros m
        LEFT JOIN evangelismo e
          ON e.${evangelismoMemberColumn} = m.id
          AND e.anio = $1
          ${filtroMensual}
        WHERE m.activo = TRUE
        GROUP BY m.id, m.nombre
        ORDER BY total_horas DESC, m.nombre ASC
      `, paramsPeriodoActual);

      if (modoEvangelismo === 'anual') {
        evangelismoProfesoresComparacionResult = await query(`
          SELECT
            m.id,
            m.nombre,
            COALESCE(SUM(e.horas), 0) AS total_horas
          FROM miembros m
          LEFT JOIN evangelismo e
            ON e.${evangelismoMemberColumn} = m.id
            AND e.anio = $1
          WHERE m.activo = TRUE
          GROUP BY m.id, m.nombre
          ORDER BY total_horas DESC, m.nombre ASC
        `, [anioComparacionEvangelismo]);
      }
    }

    const evangelismoProfesores = evangelismoProfesoresResult.rows.map((row) => ({
      id: row.id,
      nombre: row.nombre,
      total_horas: this.redondear(parseFloat(row.total_horas || 0), 1)
    }));
    const evangelismoProfesoresComparacion = evangelismoProfesoresComparacionResult.rows.map((row) => ({
      id: row.id,
      nombre: row.nombre,
      total_horas: this.redondear(parseFloat(row.total_horas || 0), 1)
    }));

    return {
      anio_seleccionado: anioActual,
      anios_disponibles: aniosDisponibles,
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
      evangelismo_profesores: {
        modo: modoEvangelismo,
        anio: anioEvangelismo,
        mes: modoEvangelismo === 'mensual' ? mesEvangelismo : null,
        anios_disponibles: aniosEvangelismoDisponibles,
        anio_comparacion: modoEvangelismo === 'anual' ? anioComparacionEvangelismo : null,
        profesores: evangelismoProfesores,
        profesores_comparacion: evangelismoProfesoresComparacion
      },
      crecimiento_estudiantes: {
        anio: anioActual,
        labels,
        serie: crecimientoEstudiantesActual,
        total: crecimientoEstudiantesActual.reduce((sum, value) => sum + value, 0)
      },
      crecimiento_miembros: {
        anio: anioActual,
        labels,
        anios_disponibles: aniosDisponibles,
        tipos_disponibles: ['Todos', ...tiposMiembroDisponibles],
        series_por_tipo: {
          Todos: crecimientoMiembrosTodos,
          ...crecimientoMiembrosPorTipo
        }
      }
    };
  }

  // ===== VIA DIRECT DB: PRESUPUESTOS =====
  async getPresupuestosPorPais(pais_id, anio) {
    const result = await query(`
      SELECT
        mes,
        anio,
        SUM(CASE WHEN tipo_gasto = 'presupuesto_recibido' THEN monto ELSE 0 END) as total_presupuesto_recibido,
        SUM(CASE WHEN tipo_gasto = 'alquiler_local' THEN monto ELSE 0 END) as total_alquiler_local,
        SUM(CASE WHEN tipo_gasto = 'servicios_publicos' THEN monto ELSE 0 END) as total_servicios_publicos,
        SUM(CASE WHEN tipo_gasto = 'materiales_evangelizacion' THEN monto ELSE 0 END) as total_materiales_evangelizacion,
        SUM(CASE WHEN tipo_gasto = 'alimentacion' THEN monto ELSE 0 END) as total_alimentacion,
        SUM(CASE WHEN tipo_gasto = 'transporte' THEN monto ELSE 0 END) as total_transporte,
        SUM(CASE WHEN tipo_gasto = 'comunicaciones' THEN monto ELSE 0 END) as total_comunicaciones,
        SUM(CASE WHEN tipo_gasto = 'otros_gastos' THEN monto ELSE 0 END) as total_otros,
        SUM(monto) as total_general
      FROM presupuestos
      WHERE pais_id = $1 AND anio = $2
      GROUP BY mes, anio
      ORDER BY mes
    `, [pais_id, anio]);

    return result.rows;
  }

  async getDetallePresupuesto(pais_id, mes, anio) {
    const result = await query(`
      SELECT * FROM presupuestos
      WHERE pais_id = $1 AND mes = $2 AND anio = $3
      ORDER BY tipo_gasto, concepto
    `, [pais_id, mes, anio]);

    return result.rows;
  }

  // ===== VIA DIRECT DB: EJECUCIONES =====
  async getEjecucionesPorPais(pais_id, anio) {
    const result = await query(`
      SELECT * FROM ejecuciones
      WHERE pais_id = $1 AND anio = $2
      ORDER BY mes
    `, [pais_id, anio]);

    return result.rows;
  }
}

module.exports = new AdministracionService();