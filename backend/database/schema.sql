-- ============================================
-- SCHEMA DE BASE DE DATOS - IGLESIA EMANUEL
-- ============================================
-- Este script crea todas las tablas necesarias para el sistema
-- Ejecutar este script en MySQL después de crear la base de datos

-- Crear la base de datos si no existe
CREATE DATABASE IF NOT EXISTS iglesia_emanuel;
USE iglesia_emanuel;

-- ============================================
-- TABLA: usuarios
-- ============================================
CREATE TABLE IF NOT EXISTS usuarios (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,  -- Se guardará encriptado con bcrypt
  rol ENUM('admin', 'pastor', 'miembro') DEFAULT 'miembro',
  pais VARCHAR(100),
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: miembros
-- ============================================
CREATE TABLE IF NOT EXISTS miembros (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(100) NOT NULL,
  identidad VARCHAR(50) UNIQUE,
  pais VARCHAR(100) NOT NULL,
  ciudad VARCHAR(100),
  edad INT,
  evangelizado_por VARCHAR(100),
  estado_civil ENUM('Soltero', 'Casado', 'Divorciado', 'Viudo'),
  profesion VARCHAR(100),
  comentarios TEXT,
  tipo_miembro ENUM('Comprometido', 'Registrado', 'Voluntario') DEFAULT 'Registrado',
  cargo_funcion VARCHAR(100),
  ministerio_of VARCHAR(100),
  avance_audio VARCHAR(100),
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: contactos
-- ============================================
CREATE TABLE IF NOT EXISTS contactos (
  id INT PRIMARY KEY AUTO_INCREMENT,
  miembro_id INT NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  telefono VARCHAR(20),
  pais VARCHAR(100),
  activo BOOLEAN DEFAULT TRUE,
  notas TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (miembro_id) REFERENCES miembros(id) ON DELETE CASCADE
);

-- ============================================
-- TABLA: reportes
-- ============================================
CREATE TABLE IF NOT EXISTS reportes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  miembro_id INT NOT NULL,
  fecha DATE NOT NULL,
  tiempo_evangelizacion DECIMAL(5,2) DEFAULT 0,  -- En horas
  contactos_obtenidos INT DEFAULT 0,
  contactos_estudian INT DEFAULT 0,
  numero_estudios INT DEFAULT 0,
  total_estudiantes INT DEFAULT 0,
  pais VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (miembro_id) REFERENCES miembros(id) ON DELETE CASCADE
);

-- ============================================
-- TABLA: estudios_biblicos
-- ============================================
CREATE TABLE IF NOT EXISTS estudios_biblicos (
  id INT PRIMARY KEY AUTO_INCREMENT,
  contacto_id INT NOT NULL,
  miembro_responsable_id INT NOT NULL,
  nivel ENUM('Básico', 'Intermedio', 'Avanzado') DEFAULT 'Básico',
  progreso VARCHAR(50),  -- Ej: "3/10 lecciones"
  ultima_sesion DATE,
  proxima_sesion DATE,
  notas TEXT,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (contacto_id) REFERENCES contactos(id) ON DELETE CASCADE,
  FOREIGN KEY (miembro_responsable_id) REFERENCES miembros(id) ON DELETE CASCADE
);

-- ============================================
-- TABLA: presupuestos
-- ============================================
CREATE TABLE IF NOT EXISTS presupuestos (
  id INT PRIMARY KEY AUTO_INCREMENT,
  pais VARCHAR(100) NOT NULL,
  mes VARCHAR(20) NOT NULL,
  año INT NOT NULL,
  tipo ENUM('gasto_fijo', 'pago_misionero', 'otro_gasto') NOT NULL,
  concepto VARCHAR(200) NOT NULL,
  monto DECIMAL(12,2) NOT NULL,
  moneda VARCHAR(10) DEFAULT 'USD',
  tasa_cambio DECIMAL(10,4) DEFAULT 1.0000,
  notas TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================
-- ÍNDICES PARA MEJORAR EL RENDIMIENTO
-- ============================================
CREATE INDEX idx_miembros_pais ON miembros(pais);
CREATE INDEX idx_miembros_tipo ON miembros(tipo_miembro);
CREATE INDEX idx_contactos_miembro ON contactos(miembro_id);
CREATE INDEX idx_contactos_activo ON contactos(activo);
CREATE INDEX idx_reportes_miembro ON reportes(miembro_id);
CREATE INDEX idx_reportes_fecha ON reportes(fecha);
CREATE INDEX idx_estudios_contacto ON estudios_biblicos(contacto_id);
CREATE INDEX idx_estudios_responsable ON estudios_biblicos(miembro_responsable_id);
CREATE INDEX idx_presupuestos_pais_mes ON presupuestos(pais, mes, año);

-- ============================================
-- USUARIO ADMIN POR DEFECTO
-- ============================================
-- Contraseña: 1234 (encriptada con bcrypt)
-- Nota: En producción cambiar esta contraseña inmediatamente
INSERT INTO usuarios (nombre, email, password, rol) VALUES 
('Admin', 'admin@sistema.com', '$2a$10$XqwC7gTZ9QZPxLKj8h7Ube4kx5y8hQ0Z9VYvF0zqJqvXqZ1P0Z0K6', 'admin');

-- ============================================
-- SCRIPT COMPLETADO
-- ============================================
-- Para verificar que todo se creó correctamente:
-- SHOW TABLES;
-- DESCRIBE usuarios;
-- DESCRIBE miembros;
-- etc.
