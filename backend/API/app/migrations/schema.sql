-- ============================================================================
-- Esquema financiero — GNIT API
-- ============================================================================
-- Definicion versionada de las tablas de movimientos financieros.
-- Todas usan CREATE TABLE IF NOT EXISTS: es seguro ejecutarlo sobre una BD
-- que ya las tiene (no-op) y crea las tablas en un deploy nuevo.
--
-- El startup() de app/main.py aplica este mismo DDL automaticamente en cada
-- arranque, por lo que este archivo sirve como documentacion/referencia y
-- para aplicarlo manualmente si hiciera falta.
--
-- Los nombres/tipos coinciden EXACTAMENTE con app/models.py y con la BD de
-- produccion (valor, fecha_creacion, updated_at) para no romper los endpoints.
-- ============================================================================

-- Ingresos
CREATE TABLE IF NOT EXISTS public.ingresos (
  id             SERIAL PRIMARY KEY,
  pais_id        INTEGER REFERENCES public.paises(id) ON DELETE SET NULL,
  mes            INTEGER NOT NULL,
  anio           INTEGER NOT NULL,
  tipo           VARCHAR(100) NOT NULL,
  origen         TEXT,
  donde_ingresa  VARCHAR(20) NOT NULL,           -- 'caja' | 'banco'
  valor          NUMERIC(15,2) NOT NULL,
  observaciones  TEXT,
  fecha          DATE NOT NULL,
  fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Traslados (movimientos entre caja y banco)
CREATE TABLE IF NOT EXISTS public.traslados (
  id             SERIAL PRIMARY KEY,
  pais_id        INTEGER REFERENCES public.paises(id) ON DELETE SET NULL,
  de             VARCHAR(20) NOT NULL,           -- 'caja' | 'banco'
  a              VARCHAR(20) NOT NULL,
  valor          NUMERIC(15,2) NOT NULL,
  observaciones  TEXT,
  fecha          DATE NOT NULL,
  fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Saldos actuales de caja y banco por pais
CREATE TABLE IF NOT EXISTS public.saldos_caja_banco (
  id          SERIAL PRIMARY KEY,
  pais_id     INTEGER REFERENCES public.paises(id) ON DELETE SET NULL,
  saldo_caja  NUMERIC(15,2) NOT NULL DEFAULT 0,
  saldo_banco NUMERIC(15,2) NOT NULL DEFAULT 0,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
