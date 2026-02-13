// ============================================
// CONFIGURACIÓN DE AXIOS - PARA FUTURA API
// ============================================
// Este archivo está preparado para cuando se implemente el backend.
// Por ahora, la aplicación NO usa este archivo ya que trabaja con datos mock.

// NOTA: Descomenta este código cuando el backend esté listo
/*
import axios from 'axios';

// URL base de la API - cambiar según el ambiente
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Crear instancia de axios con configuración base
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar el token a todas las peticiones
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de respuesta
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si el token expiró o es inválido, redirigir al login
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default api;
*/

// ============================================
// ENDPOINTS QUE SE USARÁN EN EL FUTURO:
// ============================================
// AUTH:
//   POST /auth/login - Iniciar sesión
//   POST /auth/logout - Cerrar sesión
//   POST /auth/forgot-password - Recuperar contraseña
//
// MIEMBROS:
//   GET /miembros - Obtener todos los miembros
//   GET /miembros/:id - Obtener un miembro
//   POST /miembros - Crear nuevo miembro
//   PUT /miembros/:id - Actualizar miembro
//   DELETE /miembros/:id - Eliminar miembro
//
// CONTACTOS:
//   GET /contactos - Obtener todos los contactos
//   POST /contactos - Crear nuevo contacto
//   PUT /contactos/:id - Actualizar contacto
//   DELETE /contactos/:id - Eliminar contacto
//
// REPORTES:
//   GET /reportes - Obtener todos los reportes
//   POST /reportes - Crear nuevo reporte
//   PUT /reportes/:id - Actualizar reporte
//   DELETE /reportes/:id - Eliminar reporte
//
// ADMINISTRACIÓN:
//   GET /administracion/presupuestos - Obtener presupuestos
//   POST /administracion/presupuestos - Crear presupuesto
//   PUT /administracion/presupuestos/:id - Actualizar presupuesto
//   DELETE /administracion/presupuestos/:id - Eliminar presupuesto
//
// ESTUDIOS:
//   GET /estudios - Obtener todos los estudios bíblicos
//   POST /estudios - Crear nuevo estudio
//   PUT /estudios/:id - Actualizar estudio
//   DELETE /estudios/:id - Eliminar estudio

// Por ahora, exportar un objeto vacío para evitar errores
export default {};
