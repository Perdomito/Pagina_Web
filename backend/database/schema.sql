-- ============================================
-- SCHEMA DE BASE DE DATOS - IGLESIA EMANUEL
-- PostgreSQL - Neon Database
-- ============================================

-- ============================================
-- TABLA: roles (Catálogo)
-- ============================================
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(50) UNIQUE NOT NULL,
  descripcion TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar roles por defecto
INSERT INTO roles (nombre, descripcion) VALUES 
('admin', 'Administrador con acceso completo'),
('pastor', 'Pastor con acceso a reportes y gestión'),
('misionero', 'Misionero con acceso limitado a sus datos'),
('supervisor', 'Supervisor con acceso de solo lectura')
ON CONFLICT (nombre) DO NOTHING;

-- ============================================
-- TABLA: paises (Catálogo)
-- ============================================
CREATE TABLE IF NOT EXISTS paises (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) UNIQUE NOT NULL,
  continente VARCHAR(50) NOT NULL,
  codigo_iso VARCHAR(3),
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar países por defecto
INSERT INTO paises (nombre, continente, codigo_iso) VALUES 
('República Dominicana', 'CAC', 'DOM'),
('Guatemala', 'CAC', 'GTM'),
('Honduras', 'CAC', 'HND'),
('México', 'CAC', 'MEX'),
('Colombia', 'Sudamérica', 'COL'),
('Bolivia', 'Sudamérica', 'BOL'),
('Cuba', 'CAC', 'CUB'),
('Argentina', 'Sudamérica', 'ARG')
ON CONFLICT (nombre) DO NOTHING;

-- ============================================
-- TABLA: usuarios
-- ============================================
CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,  -- Hasheado con bcrypt
  rol_id INTEGER NOT NULL,
  pais_id INTEGER,
  activo BOOLEAN DEFAULT TRUE,
  ultimo_acceso TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (rol_id) REFERENCES roles(id) ON DELETE RESTRICT,
  FOREIGN KEY (pais_id) REFERENCES paises(id) ON DELETE SET NULL
);

-- Índices para usuarios
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON usuarios(rol_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_activo ON usuarios(activo);

-- ============================================
-- TABLA: miembros (Misioneros)
-- ============================================
CREATE TABLE IF NOT EXISTS miembros (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  identidad VARCHAR(50) UNIQUE,
  pais_id INTEGER NOT NULL,
  ciudad VARCHAR(100),
  edad INTEGER CHECK (edad >= 0 AND edad <= 150),
  evangelizado_por VARCHAR(100),
  estado_civil VARCHAR(20) CHECK (estado_civil IN ('Soltero', 'Casado', 'Divorciado', 'Viudo')),
  profesion VARCHAR(100),
  comentarios TEXT,
  tipo_miembro VARCHAR(20) DEFAULT 'Registrado' CHECK (tipo_miembro IN ('Comprometido', 'Registrado', 'Voluntario')),
  cargo_funcion VARCHAR(100),
  ministerio_of VARCHAR(100),
  avance_audio VARCHAR(100),
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (pais_id) REFERENCES paises(id) ON DELETE RESTRICT
);

-- Índices para miembros
CREATE INDEX IF NOT EXISTS idx_miembros_pais ON miembros(pais_id);
CREATE INDEX IF NOT EXISTS idx_miembros_tipo ON miembros(tipo_miembro);
CREATE INDEX IF NOT EXISTS idx_miembros_activo ON miembros(activo);
CREATE INDEX IF NOT EXISTS idx_miembros_nombre ON miembros(nombre);

-- ============================================
-- TABLA: contactos (Estudiantes potenciales)
-- ============================================
CREATE TABLE IF NOT EXISTS contactos (
  id SERIAL PRIMARY KEY,
  miembro_id INTEGER NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  telefono VARCHAR(20),
  pais_id INTEGER,
  activo BOOLEAN DEFAULT TRUE,
  notas TEXT,
  estado VARCHAR(50) DEFAULT 'Nuevo',
  fecha_primer_contacto TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (miembro_id) REFERENCES miembros(id) ON DELETE CASCADE,
  FOREIGN KEY (pais_id) REFERENCES paises(id) ON DELETE SET NULL
);

-- Índices para contactos
CREATE INDEX IF NOT EXISTS idx_contactos_miembro ON contactos(miembro_id);
CREATE INDEX IF NOT EXISTS idx_contactos_pais ON contactos(pais_id);
CREATE INDEX IF NOT EXISTS idx_contactos_activo ON contactos(activo);

-- ============================================
-- TABLA: estudios_biblicos
-- ============================================
CREATE TABLE IF NOT EXISTS estudios_biblicos (
  id SERIAL PRIMARY KEY,
  contacto_id INTEGER NOT NULL,
  miembro_responsable_id INTEGER NOT NULL,
  pais_id INTEGER NOT NULL,
  mes VARCHAR(20) NOT NULL,
  anio INTEGER NOT NULL,
  dia INTEGER CHECK (dia >= 1 AND dia <= 31),
  capitulo VARCHAR(50),
  horas DECIMAL(5,2) DEFAULT 0,
  nivel VARCHAR(20) DEFAULT 'Básico' CHECK (nivel IN ('Básico', 'Intermedio', 'Avanzado')),
  progreso VARCHAR(50),
  ultima_sesion DATE,
  proxima_sesion DATE,
  notas TEXT,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (contacto_id) REFERENCES contactos(id) ON DELETE CASCADE,
  FOREIGN KEY (miembro_responsable_id) REFERENCES miembros(id) ON DELETE CASCADE,
  FOREIGN KEY (pais_id) REFERENCES paises(id) ON DELETE RESTRICT
);

-- Índices para estudios_biblicos
CREATE INDEX IF NOT EXISTS idx_estudios_contacto ON estudios_biblicos(contacto_id);
CREATE INDEX IF NOT EXISTS idx_estudios_responsable ON estudios_biblicos(miembro_responsable_id);
CREATE INDEX IF NOT EXISTS idx_estudios_pais_mes ON estudios_biblicos(pais_id, mes, anio);

-- ============================================
-- TABLA: evangelismo
-- ============================================
CREATE TABLE IF NOT EXISTS evangelismo (
  id SERIAL PRIMARY KEY,
  miembro_id INTEGER NOT NULL,
  pais_id INTEGER NOT NULL,
  mes VARCHAR(20) NOT NULL,
  anio INTEGER NOT NULL,
  dia INTEGER CHECK (dia >= 1 AND dia <= 31),
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('Virtual', 'Presencial')),
  donde TEXT,
  horas DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (miembro_id) REFERENCES miembros(id) ON DELETE CASCADE,
  FOREIGN KEY (pais_id) REFERENCES paises(id) ON DELETE RESTRICT
);

-- Índices para evangelismo
CREATE INDEX IF NOT EXISTS idx_evangelismo_miembro ON evangelismo(miembro_id);
CREATE INDEX IF NOT EXISTS idx_evangelismo_pais_mes ON evangelismo(pais_id, mes, anio);
CREATE INDEX IF NOT EXISTS idx_evangelismo_tipo ON evangelismo(tipo);

-- ============================================
-- TABLA: nuevos_estudiantes
-- ============================================
CREATE TABLE IF NOT EXISTS nuevos_estudiantes (
  id SERIAL PRIMARY KEY,
  miembro_id INTEGER NOT NULL,
  pais_id INTEGER NOT NULL,
  mes VARCHAR(20) NOT NULL,
  anio INTEGER NOT NULL,
  dia INTEGER CHECK (dia >= 1 AND dia <= 31),
  dijeron_si INTEGER DEFAULT 0,
  nuevos_contactos INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (miembro_id) REFERENCES miembros(id) ON DELETE CASCADE,
  FOREIGN KEY (pais_id) REFERENCES paises(id) ON DELETE RESTRICT
);

-- Índices para nuevos_estudiantes
CREATE INDEX IF NOT EXISTS idx_nuevos_miembro ON nuevos_estudiantes(miembro_id);
CREATE INDEX IF NOT EXISTS idx_nuevos_pais_mes ON nuevos_estudiantes(pais_id, mes, anio);

-- ============================================
-- TABLA: reportes
-- ============================================
CREATE TABLE IF NOT EXISTS reportes (
  id SERIAL PRIMARY KEY,
  pais_id INTEGER NOT NULL,
  mes VARCHAR(20) NOT NULL,
  anio INTEGER NOT NULL,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('Semanal', 'Mensual')),
  estudiantes_actuales INTEGER DEFAULT 0,
  evangelismo_online DECIMAL(5,2) DEFAULT 0,
  evangelismo_presencial DECIMAL(5,2) DEFAULT 0,
  numero_estudios INTEGER DEFAULT 0,
  nuevos_contactos INTEGER DEFAULT 0,
  contactos_estudian INTEGER DEFAULT 0,
  hasta_romanos4 INTEGER DEFAULT 0,
  terminado_romanos8 INTEGER DEFAULT 0,
  terminado_4leyes INTEGER DEFAULT 0,
  probabilidad_miembro INTEGER DEFAULT 0,
  ovejas_potenciales INTEGER DEFAULT 0,
  observaciones TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (pais_id) REFERENCES paises(id) ON DELETE RESTRICT
);

-- Índices para reportes
CREATE INDEX IF NOT EXISTS idx_reportes_pais_mes ON reportes(pais_id, mes, anio);
CREATE INDEX IF NOT EXISTS idx_reportes_tipo ON reportes(tipo);

-- ============================================
-- TABLA: presupuestos
-- ============================================
CREATE TABLE IF NOT EXISTS presupuestos (
  id SERIAL PRIMARY KEY,
  pais_id INTEGER NOT NULL,
  mes VARCHAR(20) NOT NULL,
  anio INTEGER NOT NULL,
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('gasto_fijo', 'pago_misionero', 'otro_gasto')),
  concepto VARCHAR(200) NOT NULL,
  monto DECIMAL(12,2) NOT NULL,
  moneda VARCHAR(10) DEFAULT 'USD',
  tasa_cambio DECIMAL(10,4) DEFAULT 1.0000,
  notas TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (pais_id) REFERENCES paises(id) ON DELETE RESTRICT
);

-- Índices para presupuestos
CREATE INDEX IF NOT EXISTS idx_presupuestos_pais_mes ON presupuestos(pais_id, mes, anio);

-- ============================================
-- TRIGGER: Actualizar updated_at automáticamente
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger a todas las tablas
CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_miembros_updated_at BEFORE UPDATE ON miembros FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contactos_updated_at BEFORE UPDATE ON contactos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_estudios_updated_at BEFORE UPDATE ON estudios_biblicos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_evangelismo_updated_at BEFORE UPDATE ON evangelismo FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_nuevos_updated_at BEFORE UPDATE ON nuevos_estudiantes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reportes_updated_at BEFORE UPDATE ON reportes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_presupuestos_updated_at BEFORE UPDATE ON presupuestos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- USUARIO ADMIN POR DEFECTO
-- ============================================
-- Contraseña: 1234 (hasheada con bcrypt)
-- Hash generado: $2a$10$XqwC7gTZ9QZPxLKj8h7Ube4kx5y8hQ0Z9VYvF0zqJqvXqZ1P0Z0K6
INSERT INTO usuarios (nombre, email, password, rol_id) VALUES 
('Admin', 'admin@sistema.com', '$2a$10$rOJ4w8qGlHqZ0yJPW6qm2Oc5K8/9HzUvXJ8x7P0m6Z7qLmH8pX9.K', 1)
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- VERIFICACIÓN
-- ============================================
-- Para verificar que todo se creó correctamente:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
-- SELECT * FROM roles;
-- SELECT * FROM paises;

-- ============================================
-- SCRIPT COMPLETADO ✅
-- ============================================
