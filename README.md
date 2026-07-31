# Sistema de Gestión - Iglesia Emanuel (GNIT)

Sistema full-stack para gestionar miembros, contactos, estudios bíblicos, reportes, iglesias y administración financiera.

## Arquitectura

```
frontend (React 18)  ──HTTPS──▶  API FastAPI en HuggingFace Space  ──▶  Neon PostgreSQL
```

- **Frontend**: React 18 + React Router, estilos inline. Apunta **directamente** a la API
  desplegada (`https://laevateinn707-gnit-api.hf.space`, fijado en `frontend/src/api/axios.js`).
- **Backend**: FastAPI + SQLAlchemy asyncio en `backend/API`. Documentación completa del
  esquema y de los endpoints en [`backend/API/README.md`](backend/API/README.md).
- **Base de datos**: Neon PostgreSQL — proyecto `sweet-salad-38836045`, base **"GNIT DB"**
  (no `neondb`).
- **Auth**: JWT + roles y permisos por módulo en BD.
- **i18n**: Context API + localStorage (ES/EN), resuelto entero en el frontend.

> `backend/` contiene además un servidor Express (`server.js`, `routes/`, `controllers/`)
> que es **código heredado**: el frontend no lo usa. La API viva es la de `backend/API`.

## Inicio rápido

### Frontend

```bash
cd frontend
npm install
npm start      # http://localhost:3000
```

Funciona sin levantar nada más: consume la API ya desplegada.

### Backend (solo si vas a tocar la API)

```bash
cd backend/API
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt

# .env con DATABASE_URL, SECRET_KEY (ver backend/API/README.md)
uvicorn app.main:app --reload --port 7860
```

Para apuntar el frontend a esa instancia local, cambia el `baseURL` de
`frontend/src/api/axios.js`.

### Tests

```bash
cd backend/API && python -m pytest -q
```

Corren sobre SQLite en memoria; no tocan Neon.

## Módulos

| Módulo | Qué hace |
|---|---|
| Miembros | Alta y gestión de miembros, tipos (Comprometido / Registrado / Voluntario) e info adicional |
| Contactos | Contactos de evangelización por misionero responsable |
| Estudios Bíblicos | Registro día a día por misionero: estudios por contacto, horas de evangelismo y contadores diarios (dijeron sí, nuevos contactos, **potenciales**) |
| Reportes | Reportes semanales/mensuales con exportación a PDF |
| Estadísticas | Dashboard por país: evangelismo, crecimiento, proyección e **iglesias por país** |
| Administración | Presupuestos, ejecuciones, ingresos, gastos, traslados y saldos caja/banco |
| Configuración | Usuarios, roles y permisos por módulo |

## Despliegue

El backend **no se despliega desde este repositorio**. Vive en el repo aparte
`C:\gnit-api`, que empuja al Space `Laevateinn707/gnit-api`. El flujo es copiar los
archivos de `backend/API/app` allí y publicar; el Space reconstruye solo.

Las migraciones de esquema son **idempotentes y automáticas**: el `startup()` de
`app/main.py` crea tablas, columnas y claves foráneas que falten en cada arranque.

## Convenciones

Consulta `CLAUDE.md` en la raíz para el flujo de trabajo y las convenciones de código.
