// ============================================
// CONFIGURACIÓN DE BASE DE DATOS
// ============================================
// Este archivo maneja la conexión a MySQL.
// Se usará cuando el backend esté activo.

/*
const mysql = require('mysql2/promise');

// Crear pool de conexiones para mejor rendimiento
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'iglesia_emanuel',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Función para probar la conexión
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Conexión a MySQL exitosa');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Error conectando a MySQL:', error.message);
    return false;
  }
}

// Ejecutar la función al importar
testConnection();

module.exports = pool;
*/

// ============================================
// INSTRUCCIONES PARA CONFIGURAR LA BD:
// ============================================
// 1. Instalar MySQL en tu máquina
// 2. Crear la base de datos: CREATE DATABASE iglesia_emanuel;
// 3. Ejecutar el script schema.sql (en la carpeta database/)
// 4. Configurar las credenciales en el archivo .env
// 5. Descomentar este código
// 6. El pool de conexiones estará listo para usarse en los controladores

module.exports = null; // Placeholder temporal
