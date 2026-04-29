const db = require('../config/database');
const bcrypt = require('bcryptjs');

class ConfiguracionService {
  // USUARIOS
  async getAllUsuarios() {
    try {
      const query = `
        SELECT 
          u.id,
          u.nombre,
          u.email,
          u.rol_id,
          u.pais_id,
          u.activo,
          u.ultimo_acceso,
          u.created_at
        FROM usuarios u
        ORDER BY u.created_at DESC
      `;
      
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error en getAllUsuarios:', error);
      throw error;
    }
  }

  async crearUsuario(datos) {
    try {
      const { nombre, email, password, rol_id, pais_id } = datos;
      
      // Hashear contraseña
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const query = `
        INSERT INTO usuarios (nombre, email, password, rol_id, pais_id)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, nombre, email, rol_id, pais_id, activo, created_at
      `;
      
      const values = [nombre, email, hashedPassword, rol_id, pais_id || null];
      const result = await db.query(query, values);
      
      return result.rows[0];
    } catch (error) {
      console.error('Error en crearUsuario:', error);
      throw error;
    }
  }

  async actualizarUsuario(id, datos) {
    try {
      const { nombre, email, password, rol_id, pais_id } = datos;
      
      let query, values;
      
      if (password) {
        // Si se proporciona contraseña, hashearla y actualizar
        const hashedPassword = await bcrypt.hash(password, 10);
        
        query = `
          UPDATE usuarios 
          SET nombre = $1, email = $2, password = $3, rol_id = $4, pais_id = $5, updated_at = CURRENT_TIMESTAMP
          WHERE id = $6
          RETURNING id, nombre, email, rol_id, pais_id, activo, updated_at
        `;
        
        values = [nombre, email, hashedPassword, rol_id, pais_id || null, id];
      } else {
        // Si no se proporciona contraseña, no actualizarla
        query = `
          UPDATE usuarios 
          SET nombre = $1, email = $2, rol_id = $3, pais_id = $4, updated_at = CURRENT_TIMESTAMP
          WHERE id = $5
          RETURNING id, nombre, email, rol_id, pais_id, activo, updated_at
        `;
        
        values = [nombre, email, rol_id, pais_id || null, id];
      }
      
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error en actualizarUsuario:', error);
      throw error;
    }
  }

  async eliminarUsuario(id) {
    try {
      const query = 'DELETE FROM usuarios WHERE id = $1';
      await db.query(query, [id]);
      return { success: true };
    } catch (error) {
      console.error('Error en eliminarUsuario:', error);
      throw error;
    }
  }

  // ROLES
  async getAllRoles() {
    try {
      const query = 'SELECT * FROM roles ORDER BY id';
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error en getAllRoles:', error);
      throw error;
    }
  }

  // PERMISOS
  async getAllPermisos() {
    try {
      const query = 'SELECT * FROM permisos WHERE activo = true ORDER BY nombre';
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error en getAllPermisos:', error);
      throw error;
    }
  }

  async getPermisosRol(rol_id) {
    try {
      const query = `
        SELECT 
          rp.id,
          rp.rol_id,
          rp.permiso_id,
          rp.tiene_acceso,
          p.nombre as permiso_nombre,
          p.descripcion as permiso_descripcion
        FROM rol_permisos rp
        JOIN permisos p ON rp.permiso_id = p.id
        WHERE rp.rol_id = $1
        ORDER BY p.nombre
      `;
      
      const result = await db.query(query, [rol_id]);
      return result.rows;
    } catch (error) {
      console.error('Error en getPermisosRol:', error);
      throw error;
    }
  }

  async actualizarPermisoRol(rol_id, permiso_id, tiene_acceso) {
    try {
      // Verificar si ya existe la relación
      const checkQuery = 'SELECT * FROM rol_permisos WHERE rol_id = $1 AND permiso_id = $2';
      const checkResult = await db.query(checkQuery, [rol_id, permiso_id]);
      
      let query, values;
      
      if (checkResult.rows.length > 0) {
        // Actualizar existente
        query = `
          UPDATE rol_permisos 
          SET tiene_acceso = $1
          WHERE rol_id = $2 AND permiso_id = $3
          RETURNING *
        `;
        values = [tiene_acceso, rol_id, permiso_id];
      } else {
        // Crear nuevo
        query = `
          INSERT INTO rol_permisos (rol_id, permiso_id, tiene_acceso)
          VALUES ($1, $2, $3)
          RETURNING *
        `;
        values = [rol_id, permiso_id, tiene_acceso];
      }
      
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error en actualizarPermisoRol:', error);
      throw error;
    }
  }

  // PAÍSES
  async getAllPaises() {
    try {
      const query = 'SELECT * FROM paises WHERE activo = true ORDER BY nombre';
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error en getAllPaises:', error);
      throw error;
    }
  }

  // PERMISOS PERSONALIZADOS POR USUARIO
  async getPermisosUsuario(usuario_id) {
    try {
      const query = `
        SELECT 
          up.id,
          up.usuario_id,
          up.permiso_id,
          up.tiene_acceso,
          p.nombre as permiso_nombre,
          p.descripcion as permiso_descripcion
        FROM usuario_permisos up
        JOIN permisos p ON up.permiso_id = p.id
        WHERE up.usuario_id = $1
        ORDER BY p.nombre
      `;
      
      const result = await db.query(query, [usuario_id]);
      return result.rows;
    } catch (error) {
      console.error('Error en getPermisosUsuario:', error);
      throw error;
    }
  }

  async actualizarPermisoUsuario(usuario_id, permiso_id, tiene_acceso) {
    try {
      // Verificar si ya existe la relación
      const checkQuery = 'SELECT * FROM usuario_permisos WHERE usuario_id = $1 AND permiso_id = $2';
      const checkResult = await db.query(checkQuery, [usuario_id, permiso_id]);
      
      let query, values;
      
      if (checkResult.rows.length > 0) {
        // Actualizar existente
        query = `
          UPDATE usuario_permisos 
          SET tiene_acceso = $1
          WHERE usuario_id = $2 AND permiso_id = $3
          RETURNING *
        `;
        values = [tiene_acceso, usuario_id, permiso_id];
      } else {
        // Crear nuevo
        query = `
          INSERT INTO usuario_permisos (usuario_id, permiso_id, tiene_acceso)
          VALUES ($1, $2, $3)
          RETURNING *
        `;
        values = [usuario_id, permiso_id, tiene_acceso];
      }
      
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error en actualizarPermisoUsuario:', error);
      throw error;
    }
  }

  async eliminarPermisoUsuario(usuario_id, permiso_id) {
    try {
      const query = 'DELETE FROM usuario_permisos WHERE usuario_id = $1 AND permiso_id = $2';
      await db.query(query, [usuario_id, permiso_id]);
      return { success: true };
    } catch (error) {
      console.error('Error en eliminarPermisoUsuario:', error);
      throw error;
    }
  }
}

module.exports = new ConfiguracionService();