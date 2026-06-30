from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import traceback
from app.routers import (
    paises, ciudades, miembros, contactos, reportes,
    cotizaciones, presupuestos, ejecuciones, gastos_reales,
    estadisticas_paises, roles, configuracion, usuarios,
    ciudades_mision, ingresos, miembros_info_adicional,
    saldos_caja_banco, traslados, auth, continentes,
    estudios_diarios, estadisticas,
)

app = FastAPI(
    title="GNIT API",
    description="API REST para la base de datos GNIT — gestión de miembros, reportes, presupuestos y más.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc), "type": type(exc).__name__},
    )


@app.on_event("startup")
async def startup():
    import logging
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger("gnit-api")
    logger.info("=== GNIT API Starting ===")
    try:
        from app.database import engine, Base
        from sqlalchemy import text
        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT 1"))
            logger.info(f"=== DB Connection OK: {result.scalar()} ===")
        async with engine.begin() as conn:
            try:
                await conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS usuario_permisos (
                        id SERIAL PRIMARY KEY,
                        usuario_id VARCHAR(30) NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
                        permiso_id INTEGER NOT NULL,
                        tiene_acceso BOOLEAN DEFAULT TRUE,
                        UNIQUE(usuario_id, permiso_id)
                    )
                """))
            except Exception as e:
                logger.warning(f"Could not create usuario_permisos table: {e}")

            # ── Tablas financieras (esquema versionado, idempotente) ───────
            # Definicion espejo de app/migrations/schema.sql. CREATE IF NOT
            # EXISTS: no-op si ya existen, las crea en un deploy nuevo.
            financial_tables = {
                "ingresos": """
                    CREATE TABLE IF NOT EXISTS public.ingresos (
                        id             SERIAL PRIMARY KEY,
                        pais_id        INTEGER REFERENCES public.paises(id) ON DELETE SET NULL,
                        mes            INTEGER NOT NULL,
                        anio           INTEGER NOT NULL,
                        tipo           VARCHAR(100) NOT NULL,
                        origen         TEXT,
                        donde_ingresa  VARCHAR(20) NOT NULL,
                        valor          NUMERIC(15,2) NOT NULL,
                        observaciones  TEXT,
                        fecha          DATE NOT NULL,
                        fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                    )
                """,
                "traslados": """
                    CREATE TABLE IF NOT EXISTS public.traslados (
                        id             SERIAL PRIMARY KEY,
                        pais_id        INTEGER REFERENCES public.paises(id) ON DELETE SET NULL,
                        de             VARCHAR(20) NOT NULL,
                        a              VARCHAR(20) NOT NULL,
                        valor          NUMERIC(15,2) NOT NULL,
                        observaciones  TEXT,
                        fecha          DATE NOT NULL,
                        fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                    )
                """,
                "saldos_caja_banco": """
                    CREATE TABLE IF NOT EXISTS public.saldos_caja_banco (
                        id          SERIAL PRIMARY KEY,
                        pais_id     INTEGER REFERENCES public.paises(id) ON DELETE SET NULL,
                        saldo_caja  NUMERIC(15,2) NOT NULL DEFAULT 0,
                        saldo_banco NUMERIC(15,2) NOT NULL DEFAULT 0,
                        updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                    )
                """,
            }
            for table_name, ddl in financial_tables.items():
                try:
                    await conn.execute(text(ddl))
                except Exception as e:
                    logger.warning(f"Could not create {table_name} table: {e}")

            await conn.execute(text("""
                ALTER TABLE miembros ADD COLUMN IF NOT EXISTS cargo_funcion TEXT
            """))
            await conn.execute(text("""
                ALTER TABLE miembros ADD COLUMN IF NOT EXISTS ministerio_of TEXT
            """))
            await conn.execute(text("""
                ALTER TABLE miembros ADD COLUMN IF NOT EXISTS avance_audio TEXT
            """))
            await conn.execute(text("""
                ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS pais_id INTEGER
            """))
            await conn.execute(text("""
                ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS ciudad_id INTEGER
            """))
            await conn.execute(text("""
                ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS miembro_id VARCHAR(30)
            """))
            await conn.execute(text("""
                ALTER TABLE cotizaciones ADD COLUMN IF NOT EXISTS pais_id INTEGER
            """))
            await conn.execute(text("""
                ALTER TABLE cotizaciones ADD COLUMN IF NOT EXISTS ciudad_id INTEGER
            """))

            # ── Claves foraneas (idempotentes) ─────────────────────────────
            # Postgres no soporta ADD CONSTRAINT IF NOT EXISTS para FK, por eso
            # cada una se guarda con un bloque DO que revisa pg_constraint.
            fk_definitions = [
                ("fk_usuarios_rol", "usuarios", "FOREIGN KEY (rol) REFERENCES roles(id)"),
                ("fk_usuarios_pais", "usuarios", "FOREIGN KEY (pais_id) REFERENCES paises(id) ON DELETE SET NULL"),
                ("fk_usuarios_ciudad", "usuarios", "FOREIGN KEY (ciudad_id) REFERENCES ciudades(id) ON DELETE SET NULL"),
                ("fk_usuarios_miembro", "usuarios", "FOREIGN KEY (miembro_id) REFERENCES miembros(id) ON DELETE SET NULL"),
                ("fk_cotizaciones_pais", "cotizaciones", "FOREIGN KEY (pais_id) REFERENCES paises(id) ON DELETE SET NULL"),
                ("fk_cotizaciones_ciudad", "cotizaciones", "FOREIGN KEY (ciudad_id) REFERENCES ciudades(id) ON DELETE SET NULL"),
                ("fk_rol_permisos_rol", "rol_permisos", "FOREIGN KEY (rol_id) REFERENCES roles(id)"),
            ]
            for cname, table, definition in fk_definitions:
                await conn.execute(text(f"""
                    DO $$ BEGIN
                        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='{cname}') THEN
                            ALTER TABLE {table} ADD CONSTRAINT {cname} {definition};
                        END IF;
                    END $$
                """))

            # ── Normalizar ON DELETE (recrea la FK existente como SET NULL) ──
            for table, column, cname in [
                ("saldos_caja_banco", "pais_id", "fk_saldos_pais"),
                ("paises", "continente_id", "fk_paises_continente"),
            ]:
                ref_table = "paises" if column == "pais_id" else "continentes"
                await conn.execute(text(f"""
                    DO $$ DECLARE existing text; BEGIN
                        SELECT conname INTO existing FROM pg_constraint c
                        WHERE c.conrelid='{table}'::regclass AND c.contype='f'
                          AND (SELECT attname FROM pg_attribute
                               WHERE attrelid=c.conrelid AND attnum=c.conkey[1])='{column}';
                        IF existing IS NOT NULL AND existing <> '{cname}' THEN
                            EXECUTE format('ALTER TABLE {table} DROP CONSTRAINT %I', existing);
                        END IF;
                        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='{cname}') THEN
                            ALTER TABLE {table} ADD CONSTRAINT {cname}
                                FOREIGN KEY ({column}) REFERENCES {ref_table}(id) ON DELETE SET NULL;
                        END IF;
                    END $$
                """))

            logger.info("=== Tables sync OK ===")
    except Exception as e:
        logger.error(f"=== DB Connection FAILED: {e} ===")

# Registrar todos los routers
app.include_router(paises.router)
app.include_router(ciudades.router)
app.include_router(miembros.router)
app.include_router(contactos.router)
app.include_router(reportes.router)
app.include_router(cotizaciones.router)
app.include_router(presupuestos.router)
app.include_router(ejecuciones.router)
app.include_router(gastos_reales.router)
app.include_router(estadisticas_paises.router)
app.include_router(roles.router)
app.include_router(configuracion.router)
app.include_router(usuarios.router)
app.include_router(ciudades_mision.router)
app.include_router(ingresos.router)
app.include_router(miembros_info_adicional.router)
app.include_router(saldos_caja_banco.router)
app.include_router(traslados.router)
app.include_router(auth.router)
app.include_router(continentes.router)
app.include_router(estudios_diarios.router)
app.include_router(estadisticas.router)


@app.get("/", tags=["Estado"])
async def root():
    return {"status": "ok", "mensaje": "GNIT API funcionando 🟢"}


@app.get("/health", tags=["Estado"])
async def health():
    return {"status": "healthy"}
