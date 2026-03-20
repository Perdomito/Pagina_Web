// ============================================
// CONFIGURACIÓN DE BASE DE DATOS - PostgreSQL
// ============================================
const { Pool } = require('pg');

// Crear pool de conexiones
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Necesario para Neon y otras DBs en la nube
  },
  max: 20, // Máximo de conexiones
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Función para probar la conexión
async function testConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('✅ Conexión a PostgreSQL exitosa');
    console.log('📅 Hora del servidor:', result.rows[0].now);
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Error conectando a PostgreSQL:', error.message);
    return false;
  }
}

// Función helper para queries
async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Query ejecutada:', { text, duration, rows: res.rowCount });
    }
    return res;
  } catch (error) {
    console.error('❌ Error en query:', error.message);
    throw error;
  }
}

// Función helper para transacciones
async function transaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Ejecutar test de conexión al importar
testConnection();

module.exports = {
  pool,
  query,
  transaction,
  testConnection
};
