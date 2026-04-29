// ============================================
// AUTH CONTROLLER
// ============================================
const AuthService = require('../services/AuthService');

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const resultado = await AuthService.login(email, password);
    res.json(resultado);
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
};

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const usuario = await AuthService.register(req.body);
    res.status(201).json({ message: 'Usuario creado exitosamente', usuario });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// GET /api/auth/verify
exports.verify = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }
    const decoded = await AuthService.verifyToken(token);
    res.json({ valid: true, user: decoded });
  } catch (error) {
    res.status(401).json({ error: 'Token inválido' });
  }
};

// POST /api/auth/change-password
exports.changePassword = async (req, res) => {
  try {
    const { passwordActual, passwordNueva } = req.body;
    const userId = req.user.id; // Del middleware auth
    const resultado = await AuthService.changePassword(userId, passwordActual, passwordNueva);
    res.json(resultado);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};


// GET /api/auth/mis-permisos
exports.getMisPermisos = async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'No autenticado' });
    }
    
    const { query } = require('../config/database');
    
    // Obtener rol del usuario
    const userQuery = 'SELECT rol_id FROM usuarios WHERE id = $1';
    const userResult = await query(userQuery, [userId]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    const rolId = userResult.rows[0].rol_id;
    
    // Obtener permisos del rol
    const permisosRolQuery = `
      SELECT p.nombre
      FROM rol_permisos rp
      JOIN permisos p ON rp.permiso_id = p.id
      WHERE rp.rol_id = $1 AND rp.tiene_acceso = true AND p.activo = true
    `;
    
    const permisosRolResult = await query(permisosRolQuery, [rolId]);
    const permisosRol = permisosRolResult.rows.map(row => row.nombre);
    
    // Obtener permisos personalizados del usuario
    const permisosUsuarioQuery = `
      SELECT p.nombre, up.tiene_acceso
      FROM usuario_permisos up
      JOIN permisos p ON up.permiso_id = p.id
      WHERE up.usuario_id = $1 AND p.activo = true
    `;
    
    const permisosUsuarioResult = await query(permisosUsuarioQuery, [userId]);
    
    // Combinar permisos: rol + personalizados (los personalizados con tiene_acceso=true se suman)
    const permisosFinales = new Set(permisosRol);
    
    permisosUsuarioResult.rows.forEach(permiso => {
      if (permiso.tiene_acceso) {
        permisosFinales.add(permiso.nombre);
      } else {
        // Si tiene_acceso es false, se QUITA el permiso (anula el del rol)
        permisosFinales.delete(permiso.nombre);
      }
    });
    
    res.json({ permisos: Array.from(permisosFinales) });
  } catch (error) {
    console.error('Error en getMisPermisos:', error);
    res.status(500).json({ error: error.message });
  }
};