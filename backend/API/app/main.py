from fastapi import FastAPI, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import traceback
from app.config import settings
from app.auth_middleware import get_current_user
from app.routers import (
    paises, ciudades, miembros, contactos, reportes,
    cotizaciones, presupuestos, ejecuciones, gastos_reales,
    estadisticas_paises, roles, configuracion, usuarios,
    ciudades_mision, ingresos, miembros_info_adicional,
    saldos_caja_banco, traslados, auth, continentes,
    estudios_diarios, estadisticas, archivos, iglesias, seguimiento_leyes,
    notificaciones, auditoria,
)

_es_produccion = settings.ENVIRONMENT == "production"

app = FastAPI(
    title="GNIT API",
    description="API REST para la base de datos GNIT — gestión de miembros, reportes, presupuestos y más.",
    version="1.0.0",
    docs_url=None if _es_produccion else "/docs",
    redoc_url=None if _es_produccion else "/redoc",
    openapi_url=None if _es_produccion else "/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # Se loguea el detalle en servidor, pero al cliente solo un mensaje generico
    # para no filtrar internals de la BD ni trazas.
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"detail": "Error interno del servidor"},
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

            # Catalogo de permisos (modulos de la app)
            await conn.execute(text("""
                CREATE TABLE IF NOT EXISTS public.permisos (
                    id     INTEGER PRIMARY KEY,
                    nombre VARCHAR(50) NOT NULL
                )
            """))
            await conn.execute(text("""
                INSERT INTO permisos (id, nombre) VALUES
                    (1, 'Bible Studies'), (2, 'Reports'), (3, 'Members'),
                    (4, 'Contacts'), (5, 'Administration'), (6, 'Statistics'),
                    (7, 'Settings'), (8, 'Laws Tracking')
                ON CONFLICT (id) DO NOTHING
            """))

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
            # Iglesia a la que pertenece el miembro (punto 13 del análisis: cantidad_miembros
            # de iglesias pasa de ser un número manual a poder calcularse desde miembros reales)
            await conn.execute(text("""
                ALTER TABLE miembros ADD COLUMN IF NOT EXISTS iglesia_id INTEGER REFERENCES iglesias(id) ON DELETE SET NULL
            """))
            # Protección contra fuerza bruta en login: contador de intentos fallidos
            # y hasta cuándo queda bloqueada la cuenta si se pasa del límite
            await conn.execute(text("""
                ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS intentos_fallidos INTEGER NOT NULL DEFAULT 0
            """))
            await conn.execute(text("""
                ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS bloqueado_hasta TIMESTAMP
            """))
            # Datos nuevos pedidos para migrar el Excel de Miembros Comprometidos:
            # celular, fecha de nacimiento (reemplaza edad manual) y fecha de compromiso
            await conn.execute(text("""
                ALTER TABLE miembros ADD COLUMN IF NOT EXISTS celular VARCHAR(30)
            """))
            await conn.execute(text("""
                ALTER TABLE miembros ADD COLUMN IF NOT EXISTS fecha_nacimiento DATE
            """))
            await conn.execute(text("""
                ALTER TABLE miembros ADD COLUMN IF NOT EXISTS fecha_compromiso DATE
            """))
            # Datos nuevos del Excel de Sudamérica
            await conn.execute(text("""
                ALTER TABLE miembros ADD COLUMN IF NOT EXISTS pasaporte VARCHAR(30)
            """))
            await conn.execute(text("""
                ALTER TABLE miembros ADD COLUMN IF NOT EXISTS fecha_matrimonio DATE
            """))
            await conn.execute(text("""
                ALTER TABLE miembros ADD COLUMN IF NOT EXISTS fecha_divorcio DATE
            """))
            await conn.execute(text("""
                ALTER TABLE miembros_info_adicional ADD COLUMN IF NOT EXISTS contacto_emergencia_nombre TEXT
            """))
            await conn.execute(text("""
                ALTER TABLE miembros_info_adicional ADD COLUMN IF NOT EXISTS contacto_emergencia_parentesco VARCHAR(50)
            """))
            # Categoría real del gasto en Administración (Iglesia/Casa/Misión/Misioneros/General),
            # separada de tipo_gasto que ya tiene su propia lista fija de valores validados
            await conn.execute(text("""
                ALTER TABLE presupuestos ADD COLUMN IF NOT EXISTS categoria VARCHAR(50)
            """))
            # Contactos potenciales registrados dia a dia (se acumulan en reportes)
            await conn.execute(text("""
                ALTER TABLE estudios_diarios ADD COLUMN IF NOT EXISTS potenciales INTEGER NOT NULL DEFAULT 0
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
            # Correlativo de recibos por pais+anio+mes (RC-001)
            await conn.execute(text("""
                ALTER TABLE ingresos ADD COLUMN IF NOT EXISTS numero VARCHAR(20)
            """))
            # Backfill idempotente: solo rellena los que aun no tienen numero
            await conn.execute(text("""
                WITH numbered AS (
                    SELECT id, 'RC-' || LPAD((ROW_NUMBER() OVER (
                        PARTITION BY pais_id, anio, mes ORDER BY fecha, id))::text, 3, '0') AS num
                    FROM ingresos
                )
                UPDATE ingresos i SET numero = n.num
                FROM numbered n WHERE i.id = n.id AND i.numero IS NULL
            """))
            # Comision descontada de cada deposito (reportes financieros del equipo).
            # Nullable a proposito: los ingresos ya registrados no la tienen.
            await conn.execute(text("""
                ALTER TABLE ingresos ADD COLUMN IF NOT EXISTS comision NUMERIC(15,2)
            """))
            # Codigos contables de caja/banco
            await conn.execute(text("""
                ALTER TABLE saldos_caja_banco ADD COLUMN IF NOT EXISTS codigo_contable_caja VARCHAR(20)
            """))
            await conn.execute(text("""
                ALTER TABLE saldos_caja_banco ADD COLUMN IF NOT EXISTS codigo_contable_banco VARCHAR(20)
            """))
            # Iglesias: una fila por iglesia de cada ciudad. Alimenta el contador
            # "cantidad de iglesias" por pais de Estadisticas.
            await conn.execute(text("""
                CREATE TABLE IF NOT EXISTS public.iglesias (
                    id                      SERIAL PRIMARY KEY,
                    ciudad_id               INTEGER NOT NULL REFERENCES public.ciudades(id) ON DELETE RESTRICT,
                    pais_id                 INTEGER REFERENCES public.paises(id) ON DELETE SET NULL,
                    nombre                  TEXT NOT NULL,
                    direccion               TEXT,
                    pastor_encargado_id     VARCHAR(30) REFERENCES public.miembros(id) ON DELETE SET NULL,
                    pastor_encargado_nombre TEXT,
                    fecha_apertura          DATE,
                    cantidad_miembros       INTEGER DEFAULT 0,
                    activa                  BOOLEAN NOT NULL DEFAULT TRUE,
                    notas                   TEXT,
                    fecha_creacion          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    fecha_actualizacion     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
            """))
            await conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_iglesias_pais ON public.iglesias (pais_id)
            """))
            await conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_iglesias_ciudad ON public.iglesias (ciudad_id)
            """))
            await conn.execute(text("""
                CREATE TABLE IF NOT EXISTS public.seguimiento_leyes (
                    id                      SERIAL PRIMARY KEY,
                    contacto_id             INTEGER NOT NULL REFERENCES public.contactos(id) ON DELETE RESTRICT,
                    pais_id                 INTEGER REFERENCES public.paises(id) ON DELETE SET NULL,
                    miembro_contacto_id     VARCHAR(30) REFERENCES public.miembros(id) ON DELETE SET NULL,
                    miembro_estudios_id     VARCHAR(30) REFERENCES public.miembros(id) ON DELETE SET NULL,
                    estado_actual           VARCHAR(50) NOT NULL DEFAULT 'Contacto',
                    etapa_actual_orden      INTEGER NOT NULL DEFAULT 0,
                    abandono_alerta         BOOLEAN NOT NULL DEFAULT FALSE,
                    desertado              BOOLEAN NOT NULL DEFAULT FALSE,
                    fecha_inicio            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    fecha_ultimo_avance     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    fecha_abandono          TIMESTAMP,
                    fecha_desercion         TIMESTAMP,
                    fecha_conversion_miembro TIMESTAMP,
                    miembro_convertido_id   VARCHAR(30) REFERENCES public.miembros(id) ON DELETE SET NULL,
                    tipo_miembro_destino    VARCHAR(50) NOT NULL DEFAULT 'Registrado',
                    notas_generales         TEXT,
                    activo                  BOOLEAN NOT NULL DEFAULT TRUE
                )
            """))
            await conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_seguimiento_leyes_contacto ON public.seguimiento_leyes (contacto_id)
            """))
            await conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_seguimiento_leyes_pais ON public.seguimiento_leyes (pais_id)
            """))
            # Estas 3 columnas se agregaron despues de que la tabla ya existia
            # en produccion, asi que el CREATE TABLE IF NOT EXISTS de arriba
            # nunca las crea de verdad (la tabla ya existe, no hace nada).
            # Hace falta agregarlas explicitamente asi:
            await conn.execute(text("""
                ALTER TABLE seguimiento_leyes ADD COLUMN IF NOT EXISTS desertado BOOLEAN NOT NULL DEFAULT FALSE
            """))
            await conn.execute(text("""
                ALTER TABLE seguimiento_leyes ADD COLUMN IF NOT EXISTS fecha_desercion TIMESTAMP
            """))
            await conn.execute(text("""
                CREATE TABLE IF NOT EXISTS public.seguimiento_leyes_historial (
                    id                    SERIAL PRIMARY KEY,
                    seguimiento_id        INTEGER NOT NULL REFERENCES public.seguimiento_leyes(id) ON DELETE CASCADE,
                    etapa                 VARCHAR(50) NOT NULL,
                    etapa_orden           INTEGER NOT NULL DEFAULT 0,
                    notas                 TEXT,
                    maestro_id            VARCHAR(30) REFERENCES public.miembros(id) ON DELETE SET NULL,
                    calificacion_estrellas INTEGER,
                    fecha_evento          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
            """))
            # maestro_id y calificacion_estrellas: mismo caso, la tabla ya
            # existia de antes con menos columnas.
            await conn.execute(text("""
                ALTER TABLE seguimiento_leyes_historial ADD COLUMN IF NOT EXISTS maestro_id VARCHAR(30) REFERENCES public.miembros(id) ON DELETE SET NULL
            """))
            await conn.execute(text("""
                ALTER TABLE seguimiento_leyes_historial ADD COLUMN IF NOT EXISTS calificacion_estrellas INTEGER
            """))
            await conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_seguimiento_leyes_historial_seguimiento
                ON public.seguimiento_leyes_historial (seguimiento_id, fecha_evento)
            """))
            # Notificaciones simples por rol (ej. "alguien pidio recuperar su
            # contrasena"). Tabla nueva, no existia antes.
            await conn.execute(text("""
                CREATE TABLE IF NOT EXISTS public.notificaciones (
                    id              SERIAL PRIMARY KEY,
                    mensaje         TEXT NOT NULL,
                    tipo            VARCHAR(30),
                    rol_destino_id  INTEGER NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
                    leida           BOOLEAN NOT NULL DEFAULT FALSE,
                    fecha           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
            """))
            await conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_notificaciones_rol ON public.notificaciones (rol_destino_id, leida)
            """))
            # Historial de acciones (empezamos por Usuarios, Miembros y
            # Permisos; se agregan mas modulos despues del 17).
            await conn.execute(text("""
                CREATE TABLE IF NOT EXISTS public.auditoria (
                    id              SERIAL PRIMARY KEY,
                    usuario_id      VARCHAR(30) REFERENCES public.usuarios(id) ON DELETE SET NULL,
                    usuario_nombre  TEXT,
                    modulo          VARCHAR(30) NOT NULL,
                    accion          VARCHAR(20) NOT NULL,
                    descripcion     TEXT NOT NULL,
                    fecha           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
            """))
            await conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_auditoria_fecha ON public.auditoria (fecha DESC)
            """))
            # Detalle estructurado de dos etapas del flujo. El resto (Potencial,
            # Ley 1-4, Camino al Discipulo) vive en el historial: no necesitan
            # campos propios y una tabla por etapa duplicaria el estado.
            # UNIQUE(seguimiento_id) fuerza el 1:1 con el seguimiento.
            await conn.execute(text("""
                CREATE TABLE IF NOT EXISTS public.examenes_romanos (
                    id                  SERIAL PRIMARY KEY,
                    seguimiento_id      INTEGER NOT NULL UNIQUE
                                        REFERENCES public.seguimiento_leyes(id) ON DELETE CASCADE,
                    fecha               DATE,
                    nota                NUMERIC(5,2),
                    nota_oral           NUMERIC(5,2),
                    nota_virtual        NUMERIC(5,2),
                    nota_maxima         NUMERIC(5,2) DEFAULT 100,
                    aprobado            BOOLEAN,
                    evaluador_id        VARCHAR(30) REFERENCES public.miembros(id) ON DELETE SET NULL,
                    observaciones       TEXT,
                    fecha_creacion      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
            """))
            await conn.execute(text("""
                CREATE TABLE IF NOT EXISTS public.entrevistas (
                    id                      SERIAL PRIMARY KEY,
                    seguimiento_id          INTEGER NOT NULL UNIQUE
                                            REFERENCES public.seguimiento_leyes(id) ON DELETE CASCADE,
                    fecha                   DATE,
                    entrevistador_id        VARCHAR(30) REFERENCES public.miembros(id) ON DELETE SET NULL,
                    entrevistador_nombre    TEXT,
                    resultado               VARCHAR(30) DEFAULT 'Pendiente',
                    tipo_miembro_resultante VARCHAR(50),
                    observaciones           TEXT,
                    fecha_creacion          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    fecha_actualizacion     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
            """))

            # Tabla de archivos adjuntos (ingresos/gastos)
            await conn.execute(text("""
                CREATE TABLE IF NOT EXISTS public.archivos (
                    id              SERIAL PRIMARY KEY,
                    tipo            VARCHAR(20) NOT NULL,
                    referencia_id   INTEGER NOT NULL,
                    nombre_original TEXT,
                    content_type    VARCHAR(100),
                    tamano_bytes    BIGINT,
                    storage_path    TEXT,
                    url             TEXT NOT NULL,
                    fecha_creacion  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    CONSTRAINT chk_archivos_tipo CHECK (tipo IN ('ingreso', 'gasto'))
                )
            """))
            await conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_archivos_ref ON public.archivos (tipo, referencia_id)
            """))
            # Proteger contactos con estudios: recrear FK contacto_id como RESTRICT
            await conn.execute(text("""
                DO $$ DECLARE existing text; BEGIN
                    SELECT conname INTO existing FROM pg_constraint c
                    WHERE c.conrelid='estudios_diarios'::regclass AND c.contype='f'
                      AND (SELECT attname FROM pg_attribute
                           WHERE attrelid=c.conrelid AND attnum=c.conkey[1])='contacto_id';
                    IF existing IS NOT NULL THEN
                        IF (SELECT confdeltype FROM pg_constraint WHERE conname=existing) <> 'r' THEN
                            EXECUTE format('ALTER TABLE estudios_diarios DROP CONSTRAINT %I', existing);
                            ALTER TABLE estudios_diarios ADD CONSTRAINT estudios_diarios_contacto_id_fkey
                                FOREIGN KEY (contacto_id) REFERENCES contactos(id) ON DELETE RESTRICT;
                        END IF;
                    END IF;
                END $$
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
                ("fk_rol_permisos_permiso", "rol_permisos",
                 "FOREIGN KEY (permiso_id) REFERENCES permisos(id) ON DELETE CASCADE"),
                ("fk_usuario_permisos_permiso", "usuario_permisos",
                 "FOREIGN KEY (permiso_id) REFERENCES permisos(id) ON DELETE CASCADE"),
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

# Registrar todos los routers.
# Todos exigen un token JWT valido (autenticacion) salvo auth: /auth/login debe
# ser publico y /auth/mis-permisos ya se auto-protege con su propio Depends.
_auth_requerida = [Depends(get_current_user)]

app.include_router(paises.router, dependencies=_auth_requerida)
app.include_router(ciudades.router, dependencies=_auth_requerida)
app.include_router(miembros.router, dependencies=_auth_requerida)
app.include_router(contactos.router, dependencies=_auth_requerida)
app.include_router(reportes.router, dependencies=_auth_requerida)
app.include_router(cotizaciones.router, dependencies=_auth_requerida)
app.include_router(presupuestos.router, dependencies=_auth_requerida)
app.include_router(ejecuciones.router, dependencies=_auth_requerida)
app.include_router(gastos_reales.router, dependencies=_auth_requerida)
app.include_router(estadisticas_paises.router, dependencies=_auth_requerida)
app.include_router(roles.router, dependencies=_auth_requerida)
app.include_router(configuracion.router, dependencies=_auth_requerida)
app.include_router(usuarios.router, dependencies=_auth_requerida)
app.include_router(ciudades_mision.router, dependencies=_auth_requerida)
app.include_router(ingresos.router, dependencies=_auth_requerida)
app.include_router(miembros_info_adicional.router, dependencies=_auth_requerida)
app.include_router(saldos_caja_banco.router, dependencies=_auth_requerida)
app.include_router(traslados.router, dependencies=_auth_requerida)
app.include_router(auth.router)
app.include_router(continentes.router, dependencies=_auth_requerida)
app.include_router(estudios_diarios.router, dependencies=_auth_requerida)
app.include_router(estadisticas.router, dependencies=_auth_requerida)
app.include_router(archivos.router, dependencies=_auth_requerida)
app.include_router(iglesias.router, dependencies=_auth_requerida)
app.include_router(seguimiento_leyes.router, dependencies=_auth_requerida)
app.include_router(notificaciones.router, dependencies=_auth_requerida)
app.include_router(auditoria.router, dependencies=_auth_requerida)


@app.get("/", tags=["Estado"])
async def root():
    return {"status": "ok", "mensaje": "GNIT API funcionando 🟢"}


@app.get("/health", tags=["Estado"])
async def health():
    return {"status": "healthy"}
