// ============================================
// SERVER.JS - SERVIDOR PRINCIPAL DEL BACKEND
// ============================================
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
// IMPORTAR RUTAS
// ============================================
const authRoutes = require('./routes/auth');
const miembrosRoutes = require('./routes/miembros');
const contactosRoutes = require('./routes/contactos');
const reportesRoutes = require('./routes/reportes');
const estudiosRoutes = require('./routes/estudios');
const administracionRoutes = require('./routes/administracion');

// ============================================
// USAR LAS RUTAS
// ============================================
app.use('/api/auth', authRoutes);
app.use('/api/miembros', miembrosRoutes);
app.use('/api/contactos', contactosRoutes);
app.use('/api/reportes', reportesRoutes);
app.use('/api/estudios', estudiosRoutes);
app.use('/api/administracion', administracionRoutes);

// Ruta de prueba
app.get('/api', (req, res) => {
  res.json({ 
    message: 'API de Iglesia Emanuel funcionando',
    version: '2.0.0',
    status: 'Production Ready'
  });
});

// Ruta de health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
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
  console.error('❌ Error:', err.stack);
  res.status(500).json({ 
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Ha ocurrido un error'
  });
});

// ============================================
// INICIAR SERVIDOR
// ============================================
app.listen(PORT, () => {
  console.log('==========================================');
  console.log('🚀 SERVIDOR IGLESIA EMANUEL');
  console.log('==========================================');
  console.log(`✅ Servidor corriendo en puerto ${PORT}`);
  console.log(`📍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 API disponible en: http://localhost:${PORT}/api`);
  console.log(`🔐 Health check: http://localhost:${PORT}/api/health`);
  console.log('==========================================');
});

module.exports = app;
