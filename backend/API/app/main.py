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
            await conn.execute(text("""
                CREATE TABLE IF NOT EXISTS usuario_permisos (
                    id SERIAL PRIMARY KEY,
                    usuario_id VARCHAR(30) NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
                    permiso_id INTEGER NOT NULL REFERENCES public.permisos(id) ON DELETE CASCADE,
                    tiene_acceso BOOLEAN DEFAULT TRUE,
                    UNIQUE(usuario_id, permiso_id)
                )
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
