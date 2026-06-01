-- ============================================
-- MIGRACION: Agregar tablas y columnas faltantes
-- a la base de datos GNIT (Neon PostgreSQL)
-- para compatibilidad con el backend Node.js
-- ============================================
-- Ejecutar contra: DATABASE_URL de Neon

-- ============================================
-- 1. DESACTIVAR RLS (sin politicas = bloquea todo)
-- ============================================
ALTER TABLE public.contactos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.miembros DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.presupuestos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.reportes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.rol_permisos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.estadisticas_paises DISABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. SECUENCIAS PARA IDs AUTOINCREMENTALES
-- (Python envia IDs explicitos, Node.js los genera)
-- ============================================
CREATE SEQUENCE IF NOT EXISTS miembros_id_seq;
ALTER TABLE public.miembros ALTER COLUMN id SET DEFAULT nextval('miembros_id_seq')::VARCHAR;

CREATE SEQUENCE IF NOT EXISTS usuarios_id_seq;
ALTER TABLE public.usuarios ALTER COLUMN id SET DEFAULT nextval('usuarios_id_seq')::VARCHAR;

-- ============================================
-- 3. TABLAS NUEVAS (no existen en GNIT DB)
-- ============================================

CREATE TABLE IF NOT EXISTS estudios_biblicos (
  id SERIAL PRIMARY KEY,
  contacto_id INTEGER NOT NULL REFERENCES public.contactos(id) ON DELETE CASCADE,
  miembro_responsable_id VARCHAR(30) NOT NULL REFERENCES public.miembros(id) ON DELETE CASCADE,
  pais_id INTEGER NOT NULL REFERENCES public.paises(id) ON DELETE RESTRICT,
  mes VARCHAR(20) NOT NULL,
  anio INTEGER NOT NULL,
  dia INTEGER CHECK (dia >= 1 AND dia <= 31),
  capitulo VARCHAR(50),
  horas DECIMAL(5,2) DEFAULT 0,
  nivel VARCHAR(20) DEFAULT 'Basico',
  progreso VARCHAR(50),
  ultima_sesion DATE,
  proxima_sesion DATE,
  notas TEXT,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_estudios_contacto ON public.estudios_biblicos(contacto_id);
CREATE INDEX IF NOT EXISTS idx_estudios_responsable ON public.estudios_biblicos(miembro_responsable_id);
CREATE INDEX IF NOT EXISTS idx_estudios_pais_mes ON public.estudios_biblicos(pais_id, mes, anio);

CREATE TABLE IF NOT EXISTS evangelismo (
  id SERIAL PRIMARY KEY,
  miembro_id VARCHAR(30) NOT NULL REFERENCES public.miembros(id) ON DELETE CASCADE,
  pais_id INTEGER NOT NULL REFERENCES public.paises(id) ON DELETE RESTRICT,
  mes VARCHAR(20) NOT NULL,
  anio INTEGER NOT NULL,
  dia INTEGER CHECK (dia >= 1 AND dia <= 31),
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('Virtual', 'Presencial')),
  donde TEXT,
  horas DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_evangelismo_miembro ON public.evangelismo(miembro_id);
CREATE INDEX IF NOT EXISTS idx_evangelismo_pais_mes ON public.evangelismo(pais_id, mes, anio);

CREATE TABLE IF NOT EXISTS nuevos_estudiantes (
  id SERIAL PRIMARY KEY,
  miembro_id VARCHAR(30) NOT NULL REFERENCES public.miembros(id) ON DELETE CASCADE,
  pais_id INTEGER NOT NULL REFERENCES public.paises(id) ON DELETE RESTRICT,
  mes VARCHAR(20) NOT NULL,
  anio INTEGER NOT NULL,
  dia INTEGER CHECK (dia >= 1 AND dia <= 31),
  dijeron_si INTEGER DEFAULT 0,
  nuevos_contactos INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_nuevos_miembro ON public.nuevos_estudiantes(miembro_id);
CREATE INDEX IF NOT EXISTS idx_nuevos_pais_mes ON public.nuevos_estudiantes(pais_id, mes, anio);

CREATE TABLE IF NOT EXISTS continentes (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS permisos (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  descripcion TEXT,
  activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS usuario_permisos (
  id SERIAL PRIMARY KEY,
  usuario_id VARCHAR(30) NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  permiso_id INTEGER NOT NULL REFERENCES public.permisos(id) ON DELETE CASCADE,
  tiene_acceso BOOLEAN DEFAULT TRUE,
  UNIQUE(usuario_id, permiso_id)
);

-- ============================================
-- 4. COLUMNAS FALTANTES EN TABLAS EXISTENTES
-- ============================================

-- miembros
ALTER TABLE public.miembros ADD COLUMN IF NOT EXISTS cargo_funcion VARCHAR(100);
ALTER TABLE public.miembros ADD COLUMN IF NOT EXISTS ministerio_of VARCHAR(100);
ALTER TABLE public.miembros ADD COLUMN IF NOT EXISTS avance_audio VARCHAR(100);
ALTER TABLE public.miembros ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT TRUE;

-- usuarios
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS pais_id INTEGER REFERENCES public.paises(id) ON DELETE SET NULL;
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS ultimo_acceso TIMESTAMP;
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- contactos
ALTER TABLE public.contactos ADD COLUMN IF NOT EXISTS estado VARCHAR(50) DEFAULT 'Nuevo';
ALTER TABLE public.contactos ADD COLUMN IF NOT EXISTS fecha_primer_contacto TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE public.contactos ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT TRUE;

-- reportes: campos de progreso biblico
ALTER TABLE public.reportes ADD COLUMN IF NOT EXISTS estudiantes_actuales INTEGER DEFAULT 0;
ALTER TABLE public.reportes ADD COLUMN IF NOT EXISTS evangelismo_online DECIMAL(5,2) DEFAULT 0;
ALTER TABLE public.reportes ADD COLUMN IF NOT EXISTS evangelismo_presencial DECIMAL(5,2) DEFAULT 0;
ALTER TABLE public.reportes ADD COLUMN IF NOT EXISTS numero_estudios INTEGER DEFAULT 0;
ALTER TABLE public.reportes ADD COLUMN IF NOT EXISTS nuevos_contactos INTEGER DEFAULT 0;
ALTER TABLE public.reportes ADD COLUMN IF NOT EXISTS contactos_estudian INTEGER DEFAULT 0;
ALTER TABLE public.reportes ADD COLUMN IF NOT EXISTS hasta_romanos4 INTEGER DEFAULT 0;
ALTER TABLE public.reportes ADD COLUMN IF NOT EXISTS terminado_romanos8 INTEGER DEFAULT 0;
ALTER TABLE public.reportes ADD COLUMN IF NOT EXISTS terminado_4leyes INTEGER DEFAULT 0;
ALTER TABLE public.reportes ADD COLUMN IF NOT EXISTS probabilidad_miembro INTEGER DEFAULT 0;
ALTER TABLE public.reportes ADD COLUMN IF NOT EXISTS ovejas_potenciales INTEGER DEFAULT 0;
ALTER TABLE public.reportes ADD COLUMN IF NOT EXISTS observaciones TEXT;

-- paises: columna continente (no existe en GNIT DB)
ALTER TABLE public.paises ADD COLUMN IF NOT EXISTS continente VARCHAR(50);
ALTER TABLE public.paises ADD COLUMN IF NOT EXISTS codigo_iso VARCHAR(3);
ALTER TABLE public.paises ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT TRUE;

-- ============================================
-- 5. TRIGGER PARA updated_at EN TABLAS NUEVAS
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_estudios_biblicos_updated_at BEFORE UPDATE ON public.estudios_biblicos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_evangelismo_updated_at BEFORE UPDATE ON public.evangelismo FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_nuevos_estudiantes_updated_at BEFORE UPDATE ON public.nuevos_estudiantes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. PERMISOS POR DEFECTO
-- ============================================
INSERT INTO public.continentes (nombre) VALUES
  ('CAC'), ('Sudamerica'), ('Norteamerica'), ('Europa'), ('Africa'), ('Asia'), ('Oceania')
ON CONFLICT (nombre) DO NOTHING;

-- ============================================
-- MIGRACION COMPLETADA
-- ============================================