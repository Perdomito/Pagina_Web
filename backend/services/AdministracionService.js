// ============================================
// ADMINISTRACION SERVICE
// ============================================
const bcrypt = require('bcryptjs');
const { query } = require('../config/database');

class AdministracionService {
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

    // Verificar email único
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

    // Verificar si ya existe
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
    // Verificar que no tenga países asociados
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

  // ===== ROLES =====
  async getAllRoles() {
    const result = await query('SELECT * FROM roles ORDER BY id');
    return result.rows;
  }

  // ===== ESTADÍSTICAS GENERALES =====
  async getEstadisticasGenerales() {
    const [usuarios, miembros, contactos, estudios] = await Promise.all([
      query('SELECT COUNT(*) as total FROM usuarios WHERE activo = TRUE'),
      query('SELECT COUNT(*) as total FROM miembros WHERE activo = TRUE'),
      query('SELECT COUNT(*) as total FROM contactos WHERE activo = TRUE'),
      query('SELECT COUNT(*) as total FROM estudios_biblicos WHERE activo = TRUE')
    ]);

    return {
      total_usuarios: parseInt(usuarios.rows[0].total),
      total_miembros: parseInt(miembros.rows[0].total),
      total_contactos: parseInt(contactos.rows[0].total),
      total_estudios: parseInt(estudios.rows[0].total)
    };
  }
}

module.exports = new AdministracionService();