from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import (
    paises, ciudades, miembros, contactos, reportes,
    cotizaciones, presupuestos, ejecuciones, gastos_reales,
    estadisticas_paises, roles, configuracion, usuarios,
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


@app.get("/", tags=["Estado"])
async def root():
    return {"status": "ok", "mensaje": "GNIT API funcionando 🟢"}


@app.get("/health", tags=["Estado"])
async def health():
    return {"status": "healthy"}
