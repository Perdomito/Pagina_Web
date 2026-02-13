// ============================================
// SERVER.JS - SERVIDOR PRINCIPAL DEL BACKEND
// ============================================
// Este archivo es el punto de entrada del servidor Express.
// Por ahora está comentado porque la app funciona sin backend.
// Descomentar cuando esté lista la base de datos.

/* 
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================
// MIDDLEWARES
// ============================================
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================
// RUTAS - IMPORTAR CUANDO ESTÉN LISTAS
// ============================================
// const authRoutes = require('./routes/auth');
// const miembrosRoutes = require('./routes/miembros');
// const contactosRoutes = require('./routes/contactos');
// const reportesRoutes = require('./routes/reportes');
// const estudiosRoutes = require('./routes/estudios');
// const administracionRoutes = require('./routes/administracion');

// ============================================
// USAR LAS RUTAS
// ============================================
// app.use('/api/auth', authRoutes);
// app.use('/api/miembros', miembrosRoutes);
// app.use('/api/contactos', contactosRoutes);
// app.use('/api/reportes', reportesRoutes);
// app.use('/api/estudios', estudiosRoutes);
// app.use('/api/administracion', administracionRoutes);

// Ruta de prueba
app.get('/api', (req, res) => {
  res.json({ 
    message: 'API de Iglesia Emanuel funcionando',
    version: '1.0.0'
  });
});

// Ruta para endpoints no encontrados
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Endpoint no encontrado',
    path: req.path 
  });
});

// Manejador de errores global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ============================================
// INICIAR SERVIDOR
// ============================================
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en puerto ${PORT}`);
  console.log(`📍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 API disponible en: http://localhost:${PORT}/api`);
});
*/

// ============================================
// PARA ACTIVAR EL SERVIDOR:
// ============================================
// 1. Instalar dependencias: npm install
// 2. Configurar .env con las credenciales de la base de datos
// 3. Descomentar todo el código de arriba
// 4. Ejecutar: npm run dev (para desarrollo) o npm start (para producción)

console.log('⚠️  El backend está desactivado.');
console.log('📝 La aplicación funciona con datos mock en el frontend.');
console.log('💡 Para activar el backend, seguir las instrucciones en este archivo.');
