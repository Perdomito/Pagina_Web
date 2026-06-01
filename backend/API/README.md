# GNIT API — Documentacion

API REST construida con **FastAPI** y **SQLAlchemy** (async) sobre **PostgreSQL** (Neon). Expone operaciones CRUD para la gestion de miembros, reportes, presupuestos, cotizaciones y mas de la organizacion GNIT.

---

## Estructura del Proyecto

```
backend/API/
├── .env.example          # Template de variables de entorno
├── Dockerfile            # Build de Docker para despliegue
├── railway.toml          # Config para Railway
├── requirements.txt      # Dependencias Python
└── app/
    ├── __init__.py
    ├── main.py           # Aplicacion FastAPI y configuracion CORS
    ├── config.py          # SettingsPydantic (lee .env)
    ├── database.py        # Motor async, sesion y Base declarativa
    ├── models.py          # Modelos ORM SQLAlchemy
    ├── schemas.py         # Esquemas Pydantic (validacion)
    └── routers/
        ├── __init__.py
        ├── ciudades.py
        ├── ciudades_mision.py
        ├── configuracion.py
        ├── contactos.py
        ├── cotizaciones.py
        ├── ejecuciones.py
        ├── estadisticas_paises.py
        ├── gastos_reales.py
        ├── ingresos.py
        ├── miembros.py
        ├── miembros_info_adicional.py
        ├── paises.py
        ├── presupuestos.py
        ├── reportes.py
        ├── roles.py
        ├── saldos_caja_banco.py
        ├── traslados.py
        └── usuarios.py
```

---

## Tecnologias

| Componente     | Tecnologia                           |
| -------------- | ------------------------------------ |
| Framework      | FastAPI 0.115.5                      |
| ASGI Server    | Uvicorn 0.32.1                      |
| ORM            | SQLAlchemy 2.0.36 (async)           |
| Driver DB      | asyncpg 0.30.0                      |
| Validacion      | Pydantic 2.10.3 + pydantic-settings |
| Base de datos   | PostgreSQL (Neon Serverless)         |
| Despliegue     | Railway                              |

---

## Configuracion

### Variables de entorno

Copia `.env.example` a `.env` y completa los valores:

| Variable                  | Descripcion                                            |
| ------------------------- | ------------------------------------------------------ |
| `DATABASE_URL`            | String de conexion async a PostgreSQL (`postgresql+asyncpg://...`) |
| `SECRET_KEY`              | Clave secreta para JWT (`python -c "import secrets; print(secrets.token_hex(32))"`) |
| `ALGORITHM`               | Algoritmo de cifrado JWT (default: `HS256`)            |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Duracion del token en minutos (default: `60`)       |
| `ENVIRONMENT`             | `development` o `production` (activa SQL echo en dev)  |

### Instalacion local (desarrollo)

```bash
cd backend/API
python -m venv venv
# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

La API estara disponible en `http://localhost:8000`.

### Despliegue en Railway

La API ya esta desplegada en Railway con Docker. El archivo `railway.toml` configura el builder automaticamente. Para redesplegar, simplemente haz push al repositorio y Railway reconstruira la imagen.

La URL de produccion es: `https://gnit-api-production.up.railway.app`

---

## Arquitectura

### Flujo de una peticion

```
Cliente → FastAPI (CORS) → Router → Schema Pydantic (validacion) → SQLAlchemy Async → PostgreSQL
                                           ↓
                                     Respuesta JSON
```

1. **FastAPI** recibe la peticion HTTP y aplica CORS middleware (permite todos los origenes).
2. El **Router** correspondiente dirige la peticion al endpoint adecuado.
3. **Pydantic Schemas** validan y serializan los datos de entrada/salida.
4. **SQLAlchemy AsyncSession** ejecuta la consulta en PostgreSQL.
5. La respuesta se serializa con Pydantic y se devuelve como JSON.

### Capas

- **`config.py`** — Lee variables de entorno con `pydantic-settings`.
- **`database.py`** — Crea el engine async, la sesion (`get_db` dependency) y la `Base` declarativa.
- **`models.py`** — Define las tablas de la DB como clases ORM con relaciones.
- **`schemas.py`** — Define `Create`, `Update` y `Out` para cada entidad con validacion.
- **`routers/`** — Cada archivo es un router con endpoints CRUD.

---

## Modelo de Datos

### Diagrama de Entidades

```
paises ─── ciudades ─── ciudades_mision
  ├── miembros ─── contactos
  │            ├── reportes
  │            ├── cotizaciones
  │            └── miembros_info_adicional
  ├── presupuestos ─── ejecuciones ─── gastos_reales
  ├── estadisticas_paises
  ├── ingresos
  ├── saldos_caja_banco
  └── traslados

roles ─── rol_permisos
usuarios (FK a roles)
configuracion (clave/valor)
```

### Enums

| Enum                     | Valores                                  |
| ------------------------ | ---------------------------------------- |
| `TipoMiembroEnum`        | `Comprometido`, `Registrado`, `Voluntario` |
| `CotizacionEstadoEnum`   | `pendiente`, `aprobado`, `rechazado`      |
| `EstadoPresenciaMisionEnum` | `Con iglesia`, `Evangelizado`, `En proceso` |
| `CuentaTipoEnum`         | `Banco`, `Caja`                          |
| `TipoSangreEnum`         | `A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-` |

### Modelos principales

| Modelo               | Tabla                | PK    | Descripcion                                     |
| -------------------- | -------------------- | ----- | ------------------------------------------------ |
| `Pais`               | `paises`             | `id`  | Paises con codigo ISO                             |
| `Ciudad`             | `ciudades`           | `id`  | Ciudades con coordenadas y poblacion              |
| `Rol`                | `roles`              | `id`  | Roles de usuario                                  |
| `RolPermiso`         | `rol_permisos`       | compuesto `rol_id` + `permiso_id` | Permisos por rol              |
| `Usuario`            | `usuarios`           | `id` (str) | Usuarios con email y hash de password         |
| `Miembro`            | `miembros`           | `id` (str) | Miembros con tipo, pais, ciudad               |
| `Contacto`           | `contactos`          | `id`  | Contactos asignados a miembros                    |
| `Reporte`            | `reportes`           | `id`  | Reportes de evangelizacion                        |
| `Cotizacion`         | `cotizaciones`       | `id`  | Cotizaciones con estado (pendiente/aprobado/rechazado) |
| `Presupuesto`        | `presupuestos`        | `id`  | Presupuestos por pais y tipo de gasto             |
| `Ejecucion`          | `ejecuciones`        | `id`  | Ejecuciones presupuestarias                       |
| `GastoReal`           | `gastos_reales`       | `id`  | Gastos reales vinculados a ejecuciones            |
| `EstadisticaPais`    | `estadisticas_paises` | `id` | Estadisticas por pais y periodo                  |
| `Configuracion`      | `configuracion`      | `id`  | Parametros clave-valor                            |
| `CiudadMision`       | `ciudades_mision`    | `id`  | Ciudades con mision, estado de presencia y pastor |
| `Ingreso`            | `ingresos`           | `id`  | Ingresos por pais, tipo y cuenta (caja/banco)     |
| `MiembroInfoAdicional` | `miembros_info_adicional` | `miembro_id` (str) | Info extendida de miembros (padres, sangre, email) |
| `SaldoCajaBanco`     | `saldos_caja_banco`  | `id`  | Saldos de caja y banco por pais                   |
| `Traslado`           | `traslados`           | `id`  | Traslados entre caja y banco por pais             |

---

## Endpoints

Todos los endpoints estan bajo la raiz de la API. La documentacion interactiva esta disponible en:

- **Swagger UI**: `GET /docs`
- **ReDoc**: `GET /redoc`

### Estado del servicio

| Metodo | Path      | Descripcion                    |
| ------ | --------- | ------------------------------ |
| GET    | `/`       | Verifica que la API funciona   |
| GET    | `/health` | Health check                   |

### Paises `/paises`

| Metodo | Path       | Descripcion          | Filtros |
| ------ | ---------- | -------------------- | ------- |
| GET    | `/paises`  | Listar paises        | —       |
| GET    | `/paises/{id}` | Obtener pais    | —       |
| POST   | `/paises`  | Crear pais           | —       |
| PATCH  | `/paises/{id}` | Actualizar pais  | —       |
| DELETE | `/paises/{id}` | Eliminar pais    | —       |

### Ciudades `/ciudades`

| Metodo | Path           | Descripcion          | Filtros                            |
| ------ | -------------- | -------------------- | ----------------------------------- |
| GET    | `/ciudades`    | Listar ciudades      | `pais_iso2`, `limit`, `offset`     |
| GET    | `/ciudades/{id}` | Obtener ciudad   | —                                   |
| POST   | `/ciudades`    | Crear ciudad         | —                                   |
| PATCH  | `/ciudades/{id}` | Actualizar ciudad | —                                  |
| DELETE | `/ciudades/{id}` | Eliminar ciudad   | —                                  |

### Miembros `/miembros`

| Metodo | Path             | Descripcion          | Filtros                          |
| ------ | ---------------- | -------------------- | --------------------------------- |
| GET    | `/miembros`      | Listar miembros      | `tipo`, `pais_id`               |
| GET    | `/miembros/{id}` | Obtener miembro      | —                                 |
| POST   | `/miembros`      | Crear miembro       | —  (valida duplicado por `id`)   |
| PATCH  | `/miembros/{id}` | Actualizar miembro   | —                                 |
| DELETE | `/miembros/{id}` | Eliminar miembro     | —                                 |

### Contactos `/contactos`

| Metodo | Path             | Descripcion          | Filtros                          |
| ------ | ---------------- | -------------------- | --------------------------------- |
| GET    | `/contactos`     | Listar contactos     | `miembro_responsable_id`, `pais_id` |
| GET    | `/contactos/{id}` | Obtener contacto   | —                                 |
| POST   | `/contactos`     | Crear contacto      | —                                 |
| PATCH  | `/contactos/{id}` | Actualizar contacto | —                               |
| DELETE | `/contactos/{id}` | Eliminar contacto   | —                                 |

### Reportes `/reportes`

| Metodo | Path           | Descripcion          | Filtros                          |
| ------ | -------------- | -------------------- | --------------------------------- |
| GET    | `/reportes`    | Listar reportes      | `miembro_id`, `pais_id`, `anio` |
| GET    | `/reportes/{id}` | Obtener reporte   | —                                 |
| POST   | `/reportes`    | Crear reporte        | —                                 |
| PATCH  | `/reportes/{id}` | Actualizar reporte | —                               |
| DELETE | `/reportes/{id}` | Eliminar reporte   | —                                 |

### Cotizaciones `/cotizaciones`

| Metodo | Path              | Descripcion          | Filtros                              |
| ------ | ----------------- | -------------------- | ------------------------------------ |
| GET    | `/cotizaciones`   | Listar cotizaciones | `estado`, `miembro_id`, `anio`, `mes` |
| GET    | `/cotizaciones/{id}` | Obtener cotizacion | —                                  |
| POST   | `/cotizaciones`   | Crear cotizacion    | —                                    |
| PATCH  | `/cotizaciones/{id}` | Actualizar cotizacion | —                               |
| DELETE | `/cotizaciones/{id}` | Eliminar cotizacion | —                                |

### Presupuestos `/presupuestos`

| Metodo | Path               | Descripcion          | Filtros                                  |
| ------ | ------------------ | -------------------- | ---------------------------------------- |
| GET    | `/presupuestos`    | Listar presupuestos | `pais_id`, `anio`, `mes`, `tipo_gasto` |
| GET    | `/presupuestos/{id}` | Obtener presupuesto | —                                     |
| POST   | `/presupuestos`    | Creer presupuesto    | —                                        |
| PATCH  | `/presupuestos/{id}` | Actualizar presupuesto | —                                   |
| DELETE | `/presupuestos/{id}` | Eliminar presupuesto  | —                                    |

### Ejecuciones `/ejecuciones`

| Metodo | Path              | Descripcion          | Filtros                     |
| ------ | ----------------- | -------------------- | --------------------------- |
| GET    | `/ejecuciones`   | Listar ejecuciones   | `pais_id`, `anio`, `mes`  |
| GET    | `/ejecuciones/{id}` | Obtener ejecucion | —                            |
| POST   | `/ejecuciones`    | Crear ejecucion     | —                            |
| PATCH  | `/ejecuciones/{id}` | Actualizar ejecucion | —                         |
| DELETE | `/ejecuciones/{id}` | Eliminar ejecucion  | —                            |

### Gastos Reales `/gastos-reales`

| Metodo | Path                  | Descripcion          | Filtros           |
| ------ | --------------------- | -------------------- | ----------------- |
| GET    | `/gastos-reales`      | Listar gastos        | `ejecucion_id`   |
| GET    | `/gastos-reales/{id}` | Obtener gasto        | —                 |
| POST   | `/gastos-reales`      | Crear gasto          | —                 |
| PATCH  | `/gastos-reales/{id}` | Actualizar gasto     | —                 |
| DELETE | `/gastos-reales/{id}` | Eliminar gasto       | —                 |

### Estadisticas por Pais `/estadisticas-paises`

| Metodo | Path                          | Descripcion              | Filtros                     |
| ------ | ----------------------------- | ------------------------ | --------------------------- |
| GET    | `/estadisticas-paises`        | Listar estadisticas     | `pais_id`, `anio`, `mes`  |
| GET    | `/estadisticas-paises/{id}`   | Obtener estadistica      | —                           |
| POST   | `/estadisticas-paises`        | Crear estadistica        | —                           |
| PATCH  | `/estadisticas-paises/{id}`   | Actualizar estadistica   | —                           |
| DELETE | `/estadisticas-paises/{id}`   | Eliminar estadistica     | —                           |

### Roles `/roles`

| Metodo | Path                          | Descripcion              |
| ------ | ----------------------------- | ------------------------ |
| GET    | `/roles`                      | Listar roles             |
| GET    | `/roles/{id}`                 | Obtener rol              |
| POST   | `/roles`                      | Crear rol                |
| PATCH  | `/roles/{id}`                 | Actualizar rol           |
| DELETE | `/roles/{id}`                 | Eliminar rol             |
| GET    | `/roles/{rol_id}/permisos`    | Listar permisos de un rol |
| POST   | `/roles/{rol_id}/permisos`    | Agregar permiso a un rol  |
| PATCH  | `/roles/{rol_id}/permisos/{permiso_id}` | Actualizar permiso |
| DELETE | `/roles/{rol_id}/permisos/{permiso_id}` | Eliminar permiso |

### Usuarios `/usuarios`

| Metodo | Path             | Descripcion          | Notas                        |
| ------ | ---------------- | -------------------- | ---------------------------- |
| GET    | `/usuarios`      | Listar usuarios      | —                            |
| GET    | `/usuarios/{id}` | Obtener usuario      | —                            |
| POST   | `/usuarios`      | Crear usuario        | Valida duplicado por `id`    |
| PATCH  | `/usuarios/{id}` | Actualizar usuario   | —                            |
| DELETE | `/usuarios/{id}` | Eliminar usuario     | —                            |

### Configuracion `/configuracion`

| Metodo | Path                    | Descripcion              | Notas                    |
| ------ | ----------------------- | ------------------------ | ------------------------ |
| GET    | `/configuracion`        | Listar configuraciones  | —                        |
| GET    | `/configuracion/{clave}` | Obtener config por clave | Busca por string `clave` |
| POST   | `/configuracion`        | Crear config             | Valida duplicado por `clave` |
| PATCH  | `/configuracion/{clave}` | Actualizar config       | —                        |
| DELETE | `/configuracion/{clave}` | Eliminar config         | —                        |

### Ciudades Mision `/ciudades-mision`

| Metodo | Path                          | Descripcion               | Filtros                     |
| ------ | ----------------------------- | ------------------------ | --------------------------- |
| GET    | `/ciudades-mision`           | Listar ciudades mision   | `ciudad_id`, `estado_presencia` |
| GET    | `/ciudades-mision/{id}`      | Obtener ciudad mision    | —                           |
| POST   | `/ciudades-mision`           | Crear ciudad mision      | —                           |
| PATCH  | `/ciudades-mision/{id}`      | Actualizar ciudad mision | —                           |
| DELETE | `/ciudades-mision/{id}`      | Eliminar ciudad mision   | —                           |

### Ingresos `/ingresos`

| Metodo | Path             | Descripcion       | Filtros                                        |
| ------ | ---------------- | ----------------- | ----------------------------------------------- |
| GET    | `/ingresos`      | Listar ingresos   | `pais_id`, `anio`, `mes`, `tipo`, `donde_ingresa` |
| GET    | `/ingresos/{id}` | Obtener ingreso   | —                                               |
| POST   | `/ingresos`      | Crear ingreso     | —                                               |
| PATCH  | `/ingresos/{id}` | Actualizar ingreso | —                                              |
| DELETE | `/ingresos/{id}` | Eliminar ingreso   | —                                               |

### Miembros Info Adicional `/miembros-info-adicional`

| Metodo | Path                                  | Descripcion                  | Notas                        |
| ------ | ------------------------------------- | ---------------------------- | ---------------------------- |
| GET    | `/miembros-info-adicional`           | Listar info adicional        | Filtro: `miembro_id`        |
| GET    | `/miembros-info-adicional/{miembro_id}` | Obtener info por miembro | Busca por string `miembro_id` |
| POST   | `/miembros-info-adicional`           | Crear info adicional         | Valida duplicado por `miembro_id` |
| PATCH  | `/miembros-info-adicional/{miembro_id}` | Actualizar info        | —                            |
| DELETE | `/miembros-info-adicional/{miembro_id}` | Eliminar info           | —                            |

### Saldos Caja Banco `/saldos-caja-banco`

| Metodo | Path                       | Descripcion          | Filtros     |
| ------ | -------------------------- | -------------------- | ----------- |
| GET    | `/saldos-caja-banco`      | Listar saldos        | `pais_id`   |
| GET    | `/saldos-caja-banco/{id}`  | Obtener saldo        | —           |
| POST   | `/saldos-caja-banco`      | Crear saldo          | —           |
| PATCH  | `/saldos-caja-banco/{id}`  | Actualizar saldo     | —           |
| DELETE | `/saldos-caja-banco/{id}`  | Eliminar saldo       | —           |

### Traslados `/traslados`

| Metodo | Path              | Descripcion        | Filtros              |
| ------ | ----------------- | ------------------ | -------------------- |
| GET    | `/traslados`      | Listar traslados   | `pais_id`, `anio`, `mes` |
| GET    | `/traslados/{id}` | Obtener traslado   | —                    |
| POST   | `/traslados`      | Crear traslado     | —                    |
| PATCH  | `/traslados/{id}` | Actualizar traslado | —                   |
| DELETE | `/traslados/{id}` | Eliminar traslado  | —                    |

---

## Validaciones

Los schemas de Pydantic aplican estas validaciones:

- **`mes`**: Debe estar entre 1 y 12 (en `CotizacionCreate`, `PresupuestoCreate`, `EjecucionCreate`, `EstadisticaPaisCreate`).
- **`tipo_gasto`**: En presupuestos debe ser uno de: `presupuesto_recibido`, `alquiler_local`, `servicios_publicos`, `materiales_evangelizacion`, `alimentacion`, `transporte`, `comunicaciones`, `otros_gastos`.
- **`email`**: Se valida como email valido en `UsuarioCreate` y `UsuarioUpdate`.
- **`tipo_miembro`**: Debe ser `Comprometido`, `Registrado` o `Voluntario`.
- **`estado_presencia` de ciudades mision**: Debe ser `Con iglesia`, `Evangelizado` o `En proceso`.
- **`donde_ingresa` de ingresos**: Debe ser `Banco` o `Caja`.
- **`de` y `a` de traslados**: Deben ser `Banco` o `Caja`.
- **`tipo_sangre` de miembros info adicional**: Debe ser uno de: `A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-`.
- **`mes` en ingresos**: Debe estar entre 1 y 12.

---

## Ejemplos de Uso

La API esta desplegada en Railway y accesible publicamente:

| Entorno   | URL                                                |
| --------- | -------------------------------------------------- |
| Produccion | `https://gnit-api-production.up.railway.app`    |
| Local     | `https://gnit-api-production.up.railway.app` (solo para desarrollo)    |

Todas las peticiones de los ejemplos usan la URL de produccion. Para desarrollo local, reemplaza la URL base por `https://gnit-api-production.up.railway.app`.

### URL Base

```
https://gnit-api-production.up.railway.app
```

### Verificar estado del servicio

```bash
# Verificar que la API esta funcionando
curl https://gnit-api-production.up.railway.app/

# Health check
curl https://gnit-api-production.up.railway.app/health
```

**Respuesta `/`:**
```json
{
  "status": "ok",
  "mensaje": "GNIT API funcionando 🟢"
}
```

**Respuesta `/health`:**
```json
{
  "status": "healthy"
}
```

### Documentacion interactiva

```
# Swagger UI (interactiva, permite probar endpoints)
https://gnit-api-production.up.railway.app/docs

# ReDoc (documentacion legible)
https://gnit-api-production.up.railway.app/redoc
```

---

### Paises

#### Listar todos los paises

```bash
curl https://gnit-api-production.up.railway.app/paises
```

**Respuesta `200`:**
```json
[
  {
    "id": 1,
    "iso": "CO",
    "nombre": "Colombia"
  },
  {
    "id": 2,
    "iso": "MX",
    "nombre": "Mexico"
  }
]
```

#### Obtener un pais por ID

```bash
curl https://gnit-api-production.up.railway.app/paises/1
```

**Respuesta `200`:**
```json
{
  "id": 1,
  "iso": "CO",
  "nombre": "Colombia"
}
```

**Respuesta `404` (no encontrado):**
```json
{
  "detail": "Pais no encontrado"
}
```

#### Crear un pais

```bash
curl -X POST https://gnit-api-production.up.railway.app/paises \
  -H "Content-Type: application/json" \
  -d '{
    "iso": "AR",
    "nombre": "Argentina"
  }'
```

**Respuesta `201`:**
```json
{
  "id": 3,
  "iso": "AR",
  "nombre": "Argentina"
}
```

#### Actualizar un pais (PATCH parcial)

```bash
curl -X PATCH https://gnit-api-production.up.railway.app/paises/3 \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Republica Argentina"
  }'
```

**Respuesta `200`:**
```json
{
  "id": 3,
  "iso": "AR",
  "nombre": "Republica Argentina"
}
```

#### Eliminar un pais

```bash
curl -X DELETE https://gnit-api-production.up.railway.app/paises/3
```

**Respuesta `204`:** Sin contenido.

---

### Ciudades

#### Listar ciudades con filtros y paginacion

```bash
# Todas las ciudades (limit por defecto: 50)
curl https://gnit-api-production.up.railway.app/ciudades

# Filtrar por codigo ISO de pais
curl "https://gnit-api-production.up.railway.app/ciudades?pais_iso2=CO"

# Paginacion: obtener 20 ciudades desde la posicion 40
curl "https://gnit-api-production.up.railway.app/ciudades?limit=20&offset=40"

# Combinar filtros
curl "https://gnit-api-production.up.railway.app/ciudades?pais_iso2=CO&limit=10&offset=0"
```

**Respuesta `200`:**
```json
[
  {
    "id": 1,
    "nombre": "Bogota",
    "nombre_ascii": "Bogota",
    "lat": "4.7100000",
    "lng": "-74.0700000",
    "pais_iso2": "CO",
    "admin_name": "Bogota D.C.",
    "capital": "primary",
    "population": 7181460,
    "worldcity_id": 12345
  }
]
```

#### Crear una ciudad

```bash
curl -X POST https://gnit-api-production.up.railway.app/ciudades \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Medellin",
    "nombre_ascii": "Medellin",
    "lat": "6.2519000",
    "lng": "-75.5636000",
    "pais_iso2": "CO",
    "population": 2529100
  }'
```

---

### Miembros

#### Listar miembros con filtros

```bash
# Todos los miembros
curl https://gnit-api-production.up.railway.app/miembros

# Filtrar por tipo de miembro
curl "https://gnit-api-production.up.railway.app/miembros?tipo=Comprometido"

# Filtrar por pais
curl "https://gnit-api-production.up.railway.app/miembros?pais_id=1"

# Combinar filtros
curl "https://gnit-api-production.up.railway.app/miembros?tipo=Registrado&pais_id=2"
```

**Respuesta `200`:**
```json
[
  {
    "id": "miem_001",
    "nombre": "Juan Perez",
    "identidad": "12345678",
    "pais": "Colombia",
    "ciudad": "Bogota",
    "edad": 30,
    "evangelizado_por": "Maria Lopez",
    "estado_civil": "Casado",
    "profesion": "Ingeniero",
    "comentarios": "Miembro activo",
    "tipo_miembro": "Comprometido",
    "pais_id": 1,
    "ciudad_id": 1
  }
]
```

#### Crear un miembro

```bash
curl -X POST https://gnit-api-production.up.railway.app/miembros \
  -H "Content-Type: application/json" \
  -d '{
    "id": "miem_002",
    "nombre": "Carlos Garcia",
    "pais": "Mexico",
    "ciudad": "CDMX",
    "edad": 25,
    "tipo_miembro": "Voluntario",
    "pais_id": 2
  }'
```

**Respuesta `201`:**
```json
{
  "id": "miem_002",
  "nombre": "Carlos Garcia",
  "identidad": null,
  "pais": "Mexico",
  "ciudad": "CDMX",
  "edad": 25,
  "evangelizado_por": null,
  "estado_civil": null,
  "profesion": null,
  "comentarios": null,
  "tipo_miembro": "Voluntario",
  "pais_id": 2,
  "ciudad_id": null
}
```

#### Error: miembro duplicado

```bash
curl -X POST https://gnit-api-production.up.railway.app/miembros \
  -H "Content-Type: application/json" \
  -d '{
    "id": "miem_002",
    "nombre": "Otro Carlos",
    "tipo_miembro": "Registrado"
  }'
```

**Respuesta `400`:**
```json
{
  "detail": "Ya existe un miembro con ese id"
}
```

---

### Contactos

#### Listar contactos con filtros

```bash
# Todos los contactos
curl https://gnit-api-production.up.railway.app/contactos

# Filtrar por miembro responsable
curl "https://gnit-api-production.up.railway.app/contactos?miembro_responsable_id=miem_001"

# Filtrar por pais
curl "https://gnit-api-production.up.railway.app/contactos?pais_id=1"
```

#### Crear un contacto

```bash
curl -X POST https://gnit-api-production.up.railway.app/contactos \
  -H "Content-Type: application/json" \
  -d '{
    "miembro_responsable": "Juan Perez",
    "nombre": "Ana Martinez",
    "telefono": "+57 300 1234567",
    "pais": "Colombia",
    "notas": "Interesada en estudios biblicos",
    "profesion": "Profesora",
    "pais_id": 1,
    "miembro_responsable_id": "miem_001"
  }'
```

**Respuesta `201`:**
```json
{
  "id": 1,
  "miembro_responsable": "Juan Perez",
  "nombre": "Ana Martinez",
  "telefono": "+57 300 1234567",
  "pais": "Colombia",
  "notas": "Interesada en estudios biblicos",
  "profesion": "Profesora",
  "pais_id": 1,
  "miembro_responsable_id": "miem_001",
  "ciudad_id": null,
  "fecha_creacion": "2025-05-18T20:00:00"
}
```

---

### Reportes

#### Listar reportes con filtros

```bash
# Todos los reportes
curl https://gnit-api-production.up.railway.app/reportes

# Filtrar por miembro
curl "https://gnit-api-production.up.railway.app/reportes?miembro_id=miem_001"

# Filtrar por pais
curl "https://gnit-api-production.up.railway.app/reportes?pais_id=1"

# Filtrar por anio
curl "https://gnit-api-production.up.railway.app/reportes?anio=2025"

# Combinar filtros
curl "https://gnit-api-production.up.railway.app/reportes?pais_id=1&anio=2025"
```

#### Crear un reporte

```bash
curl -X POST https://gnit-api-production.up.railway.app/reportes \
  -H "Content-Type: application/json" \
  -d '{
    "miembro_que_reporta": "Juan Perez",
    "fecha": "2025-05-18",
    "tiempo_evangelizacion": "PT2H30M",
    "contactos_obtenidos": 5,
    "contactos_estudian": 3,
    "numero_estudios_dados": 2,
    "total_estudiantes": 8,
    "pais": "Colombia",
    "pais_id": 1,
    "miembro_id": "miem_001"
  }'
```

**Nota**: El campo `tiempo_evangelizacion` usa formato ISO 8601 para duraciones: `PT2H30M` = 2 horas 30 minutos.

**Respuesta `201`:**
```json
{
  "id": 1,
  "miembro_que_reporta": "Juan Perez",
  "fecha": "2025-05-18",
  "tiempo_evangelizacion": "PT2H30M",
  "contactos_obtenidos": 5,
  "contactos_estudian": 3,
  "numero_estudios_dados": 2,
  "total_estudiantes": 8,
  "pais": "Colombia",
  "pais_id": 1,
  "miembro_id": "miem_001",
  "ciudad_id": null,
  "fecha_creacion": "2025-05-18T20:00:00"
}
```

---

### Cotizaciones

#### Listar cotizaciones con filtros

```bash
# Todas las cotizaciones
curl https://gnit-api-production.up.railway.app/cotizaciones

# Filtrar por estado
curl "https://gnit-api-production.up.railway.app/cotizaciones?estado=pendiente"

# Filtrar por miembro
curl "https://gnit-api-production.up.railway.app/cotizaciones?miembro_id=miem_001"

# Filtrar por periodo
curl "https://gnit-api-production.up.railway.app/cotizaciones?anio=2025&mes=5"

# Combinar filtros
curl "https://gnit-api-production.up.railway.app/cotizaciones?estado=aprobado&anio=2025"
```

#### Crear una cotizacion

```bash
curl -X POST https://gnit-api-production.up.railway.app/cotizaciones \
  -H "Content-Type: application/json" \
  -d '{
    "fecha": "2025-05-18",
    "solicitante": "Juan Perez",
    "concepto": "Alquiler de local para reunion",
    "monto": 500.00,
    "moneda": "USD",
    "estado": "pendiente",
    "notas": "Pago mensual del local",
    "miembro_id": "miem_001"
  }'
```

**Respuesta `201`:**
```json
{
  "id": 1,
  "fecha": "2025-05-18",
  "solicitante": "Juan Perez",
  "concepto": "Alquiler de local para reunion",
  "monto": "500.00",
  "moneda": "USD",
  "estado": "pendiente",
  "agregado_a_gastos": false,
  "mes_agregado": null,
  "anio_agregado": null,
  "notas": "Pago mensual del local",
  "miembro_id": "miem_001",
  "fecha_creacion": "2025-05-18T20:00:00",
  "fecha_actualizacion": "2025-05-18T20:00:00"
}
```

#### Aprobar una cotizacion (PATCH parcial)

```bash
curl -X PATCH https://gnit-api-production.up.railway.app/cotizaciones/1 \
  -H "Content-Type: application/json" \
  -d '{
    "estado": "aprobado"
  }'
```

#### Error: mes invalido

```bash
curl -X POST https://gnit-api-production.up.railway.app/cotizaciones \
  -H "Content-Type: application/json" \
  -d '{
    "fecha": "2025-05-18",
    "solicitante": "Juan",
    "concepto": "Test",
    "monto": 100,
    "mes_agregado": 13
  }'
```

**Respuesta `422`:**
```json
{
  "detail": [
    {
      "type": "value_error",
      "loc": ["body", "mes_agregado"],
      "msg": "Value error, El mes debe estar entre 1 y 12",
      "input": 13
    }
  ]
}
```

---

### Presupuestos

#### Listar presupuestos con filtros

```bash
# Todos los presupuestos
curl https://gnit-api-production.up.railway.app/presupuestos

# Filtrar por pais
curl "https://gnit-api-production.up.railway.app/presupuestos?pais_id=1"

# Filtrar por anio y mes
curl "https://gnit-api-production.up.railway.app/presupuestos?anio=2025&mes=5"

# Filtrar por tipo de gasto
curl "https://gnit-api-production.up.railway.app/presupuestos?tipo_gasto=alquiler_local"

# Combinar filtros
curl "https://gnit-api-production.up.railway.app/presupuestos?pais_id=1&anio=2025&tipo_gasto=alimentacion"
```

Los valores validos para `tipo_gasto` son:
- `presupuesto_recibido`
- `alquiler_local`
- `servicios_publicos`
- `materiales_evangelizacion`
- `alimentacion`
- `transporte`
- `comunicaciones`
- `otros_gastos`

#### Crear un presupuesto

```bash
curl -X POST https://gnit-api-production.up.railway.app/presupuestos \
  -H "Content-Type: application/json" \
  -d '{
    "pais": "Colombia",
    "mes": 5,
    "anio": 2025,
    "tipo_gasto": "alquiler_local",
    "concepto": "Alquiler sede principal",
    "monto": 1500.00,
    "moneda": "USD",
    "tasa_cambio": 3900.50,
    "notas": "Contrato hasta diciembre",
    "pais_id": 1
  }'
```

**Respuesta `201`:**
```json
{
  "id": 1,
  "pais": "Colombia",
  "mes": 5,
  "anio": 2025,
  "tipo_gasto": "alquiler_local",
  "concepto": "Alquiler sede principal",
  "monto": "1500.00",
  "moneda": "USD",
  "tasa_cambio": "3900.500000",
  "notas": "Contrato hasta diciembre",
  "pais_id": 1,
  "fecha_registro": "2025-05-18T20:00:00"
}
```

---

### Ejecuciones

#### Listar ejecuciones con filtros

```bash
# Todas las ejecuciones
curl https://gnit-api-production.up.railway.app/ejecuciones

# Filtrar por pais
curl "https://gnit-api-production.up.railway.app/ejecuciones?pais_id=1"

# Filtrar por periodo
curl "https://gnit-api-production.up.railway.app/ejecuciones?anio=2025&mes=5"
```

#### Crear una ejecucion

```bash
curl -X POST https://gnit-api-production.up.railway.app/ejecuciones \
  -H "Content-Type: application/json" \
  -d '{
    "pais": "Colombia",
    "mes": 5,
    "anio": 2025,
    "monto_recibido_usd": 2000.00,
    "presupuesto_id": 1,
    "notas": "Transferencia recibida",
    "pais_id": 1
  }'
```

**Respuesta `201`:**
```json
{
  "id": 1,
  "pais": "Colombia",
  "mes": 5,
  "anio": 2025,
  "monto_recibido_usd": "2000.00",
  "presupuesto_id": 1,
  "notas": "Transferencia recibida",
  "pais_id": 1,
  "fecha_creacion": "2025-05-18T20:00:00",
  "fecha_actualizacion": "2025-05-18T20:00:00"
}
```

---

### Gastos Reales

#### Listar gastos con filtro

```bash
# Todos los gastos
curl https://gnit-api-production.up.railway.app/gastos-reales

# Filtrar por ejecucion
curl "https://gnit-api-production.up.railway.app/gastos-reales?ejecucion_id=1"
```

#### Crear un gasto real

```bash
curl -X POST https://gnit-api-production.up.railway.app/gastos-reales \
  -H "Content-Type: application/json" \
  -d '{
    "ejecucion_id": 1,
    "concepto": "Pago de electricidad",
    "monto": 150.00,
    "tipo_gasto": "servicios_publicos"
  }'
```

**Respuesta `201`:**
```json
{
  "id": 1,
  "ejecucion_id": 1,
  "concepto": "Pago de electricidad",
  "monto": "150.00",
  "tipo_gasto": "servicios_publicos",
  "fecha_creacion": "2025-05-18T20:00:00"
}
```

---

### Estadisticas por Pais

#### Listar estadisticas con filtros

```bash
# Todas las estadisticas
curl https://gnit-api-production.up.railway.app/estadisticas-paises

# Filtrar por pais
curl "https://gnit-api-production.up.railway.app/estadisticas-paises?pais_id=1"

# Filtrar por periodo
curl "https://gnit-api-production.up.railway.app/estadisticas-paises?anio=2025&mes=5"
```

#### Crear una estadistica

```bash
curl -X POST https://gnit-api-production.up.railway.app/estadisticas-paises \
  -H "Content-Type: application/json" \
  -d '{
    "nombre_pais": "Colombia",
    "cantidad_miembros": 50,
    "cantidad_estudios": 12,
    "cantidad_reportes": 30,
    "color": "#FF5733",
    "mes": 5,
    "anio": 2025,
    "pais_id": 1
  }'
```

---

### Roles y Permisos

#### Listar roles

```bash
curl https://gnit-api-production.up.railway.app/roles
```

#### Crear un rol

```bash
curl -X POST https://gnit-api-production.up.railway.app/roles \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Administrador",
    "descripcion": "Acceso total al sistema"
  }'
```

#### Agregar un permiso a un rol

```bash
curl -X POST https://gnit-api-production.up.railway.app/roles/1/permisos \
  -H "Content-Type: application/json" \
  -d '{
    "rol_id": 1,
    "permiso_id": 5,
    "activo": true
  }'
```

#### Actualizar un permiso (activar/desactivar)

```bash
curl -X PATCH https://gnit-api-production.up.railway.app/roles/1/permisos/5 \
  -H "Content-Type: application/json" \
  -d '{
    "activo": false
  }'
```

#### Listar permisos de un rol

```bash
curl https://gnit-api-production.up.railway.app/roles/1/permisos
```

#### Eliminar un permiso de un rol

```bash
curl -X DELETE https://gnit-api-production.up.railway.app/roles/1/permisos/5
```

---

### Usuarios

#### Listar usuarios

```bash
curl https://gnit-api-production.up.railway.app/usuarios
```

#### Crear un usuario

```bash
curl -X POST https://gnit-api-production.up.railway.app/usuarios \
  -H "Content-Type: application/json" \
  -d '{
    "id": "usr_001",
    "nombre": "Admin Principal",
    "email": "admin@gnit.org",
    "password_hash": "hash_secreto_aqui",
    "rol": 1,
    "activo": true
  }'
```

**Respuesta `201`:**
```json
{
  "id": "usr_001",
  "nombre": "Admin Principal",
  "email": "admin@gnit.org",
  "rol": 1,
  "activo": true,
  "fecha_registro": "2025-05-18T20:00:00"
}
```

#### Actualizar un usuario (PATCH parcial)

```bash
curl -X PATCH https://gnit-api-production.up.railway.app/usuarios/usr_001 \
  -H "Content-Type: application/json" \
  -d '{
    "activo": true,
    "nombre": "Admin Principal Actualizado"
  }'
```

#### Error: email invalido

```bash
curl -X POST https://gnit-api-production.up.railway.app/usuarios \
  -H "Content-Type: application/json" \
  -d '{
    "id": "usr_002",
    "nombre": "Test",
    "email": "no-es-un-email",
    "password_hash": "abc",
    "rol": 1
  }'
```

**Respuesta `422`:**
```json
{
  "detail": [
    {
      "type": "value_error",
      "loc": ["body", "email"],
      "msg": "value is not a valid email address",
      "input": "no-es-un-email"
    }
  ]
}
```

---

### Configuracion

#### Listar todas las configuraciones

```bash
curl https://gnit-api-production.up.railway.app/configuracion
```

#### Obtener una configuracion por clave

```bash
curl https://gnit-api-production.up.railway.app/configuracion/nombre_iglesia
```

**Respuesta `200`:**
```json
{
  "id": 1,
  "clave": "nombre_iglesia",
  "valor": "GNIT Internacional",
  "descripcion": "Nombre oficial de la iglesia",
  "fecha_actualizacion": "2025-05-18T20:00:00"
}
```

#### Crear una configuracion

```bash
curl -X POST https://gnit-api-production.up.railway.app/configuracion \
  -H "Content-Type: application/json" \
  -d '{
    "clave": "moneda_default",
    "valor": "USD",
    "descripcion": "Moneda por defecto del sistema"
  }'
```

#### Actualizar una configuracion (por clave)

```bash
curl -X PATCH https://gnit-api-production.up.railway.app/configuracion/moneda_default \
  -H "Content-Type: application/json" \
  -d '{
    "valor": "COP",
    "descripcion": "Moneda por defecto cambiada a pesos colombianos"
  }'
```

---

### Ciudades Mision

#### Listar ciudades mision con filtros

```bash
# Todas las ciudades mision
curl https://gnit-api-production.up.railway.app/ciudades-mision

# Filtrar por ciudad
curl "https://gnit-api-production.up.railway.app/ciudades-mision?ciudad_id=1"

# Filtrar por estado de presencia
curl "https://gnit-api-production.up.railway.app/ciudades-mision?estado_presencia=Con+iglesia"
```

#### Crear una ciudad mision

```bash
curl -X POST https://gnit-api-production.up.railway.app/ciudades-mision \
  -H "Content-Type: application/json" \
  -d '{
    "ciudad_id": 1,
    "region": "America Central",
    "estado_presencia": "En proceso",
    "fecha_inicio_trabajo": "2025-01-15",
    "pastor_encargado_id": "miem_001",
    "pastor_encargado_nombre": "Juan Perez",
    "cantidad_miembros_activos": 12,
    "notas": "Mision en crecimiento"
  }'
```

**Respuesta `201`:**
```json
{
  "id": 1,
  "ciudad_id": 1,
  "region": "America Central",
  "estado_presencia": "En proceso",
  "fecha_inicio_trabajo": "2025-01-15",
  "pastor_encargado_id": "miem_001",
  "pastor_encargado_nombre": "Juan Perez",
  "cantidad_miembros_activos": 12,
  "notas": "Mision en crecimiento",
  "fecha_creacion": "2025-06-01T12:00:00",
  "fecha_actualizacion": "2025-06-01T12:00:00"
}
```

---

### Ingresos

#### Listar ingresos con filtros

```bash
# Todos los ingresos
curl https://gnit-api-production.up.railway.app/ingresos

# Filtrar por pais
curl "https://gnit-api-production.up.railway.app/ingresos?pais_id=1"

# Filtrar por periodo
curl "https://gnit-api-production.up.railway.app/ingresos?anio=2025&mes=5"

# Filtrar por tipo
curl "https://gnit-api-production.up.railway.app/ingresos?tipo=donacion"

# Filtrar por donde ingresa
curl "https://gnit-api-production.up.railway.app/ingresos?donde_ingresa=Banco"
```

#### Crear un ingreso

```bash
curl -X POST https://gnit-api-production.up.railway.app/ingresos \
  -H "Content-Type: application/json" \
  -d '{
    "pais_id": 1,
    "mes": 5,
    "anio": 2025,
    "tipo": "donacion",
    "origen": "Iglesia hermana",
    "donde_ingresa": "Banco",
    "valor": 5000.00,
    "observaciones": "Donacion mensual",
    "fecha": "2025-05-15"
  }'
```

---

### Miembros Info Adicional

#### Listar info adicional

```bash
# Toda la info adicional
curl https://gnit-api-production.up.railway.app/miembros-info-adicional

# Filtrar por miembro
curl "https://gnit-api-production.up.railway.app/miembros-info-adicional?miembro_id=miem_001"
```

#### Obtener info adicional de un miembro

```bash
curl https://gnit-api-production.up.railway.app/miembros-info-adicional/miem_001
```

#### Crear info adicional

```bash
curl -X POST https://gnit-api-production.up.railway.app/miembros-info-adicional \
  -H "Content-Type: application/json" \
  -d '{
    "miembro_id": "miem_001",
    "nombre_padre": "Carlos Perez",
    "telefono_padre": "+57 300 1111111",
    "nombre_madre": "Maria Lopez",
    "telefono_madre": "+57 300 2222222",
    "tipo_sangre": "O+",
    "correo_electronico": "miembro@gnit.org"
  }'
```

#### Actualizar info adicional (PATCH parcial)

```bash
curl -X PATCH https://gnit-api-production.up.railway.app/miembros-info-adicional/miem_001 \
  -H "Content-Type: application/json" \
  -d '{
    "correo_electronico": "nuevo@gnit.org"
  }'
```

---

### Saldos Caja Banco

#### Listar saldos con filtro

```bash
# Todos los saldos
curl https://gnit-api-production.up.railway.app/saldos-caja-banco

# Filtrar por pais
curl "https://gnit-api-production.up.railway.app/saldos-caja-banco?pais_id=1"
```

#### Crear un saldo

```bash
curl -X POST https://gnit-api-production.up.railway.app/saldos-caja-banco \
  -H "Content-Type: application/json" \
  -d '{
    "pais_id": 1,
    "saldo_caja": 1500.00,
    "saldo_banco": 5000.00
  }'
```

**Respuesta `201`:**
```json
{
  "id": 1,
  "pais_id": 1,
  "saldo_caja": "1500.00",
  "saldo_banco": "5000.00",
  "updated_at": "2025-06-01T12:00:00"
}
```

---

### Traslados

#### Listar traslados con filtros

```bash
# Todos los traslados
curl https://gnit-api-production.up.railway.app/traslados

# Filtrar por pais
curl "https://gnit-api-production.up.railway.app/traslados?pais_id=1"

# Filtrar por periodo
curl "https://gnit-api-production.up.railway.app/traslados?anio=2025&mes=5"
```

#### Crear un traslado

```bash
curl -X POST https://gnit-api-production.up.railway.app/traslados \
  -H "Content-Type: application/json" \
  -d '{
    "pais_id": 1,
    "de": "Caja",
    "a": "Banco",
    "valor": 2000.00,
    "observaciones": "Traslado de excedente a cuenta bancaria",
    "fecha": "2025-05-20"
  }'
```

**Respuesta `201`:**
```json
{
  "id": 1,
  "pais_id": 1,
  "de": "Caja",
  "a": "Banco",
  "valor": "2000.00",
  "observaciones": "Traslado de excedente a cuenta bancaria",
  "fecha": "2025-05-20",
  "fecha_creacion": "2025-06-01T12:00:00"
}
```

| Codigo | Significado                     | Cuando se usa                                     |
| ------ | ------------------------------- | ------------------------------------------------ |
| `200`  | OK                              | GET (listar/obtener), PATCH (actualizar)         |
| `201`  | Created                         | POST (crear recurso)                             |
| `204`  | No Content                      | DELETE (eliminar recurso, sin cuerpo en respuesta) |
| `400`  | Bad Request                     | Recurso duplicado (ej: miembro con mismo `id`)   |
| `404`  | Not Found                       | Recurso no encontrado por ID o clave             |
| `422`  | Unprocessable Entity            | Validacion fallida (campos invalidos, tipos erroneos) |

### Ejemplo de error 404

```bash
curl https://gnit-api-production.up.railway.app/paises/9999
```

```json
{
  "detail": "Pais no encontrado"
}
```

---

## Caracteristicas

- **Async completo**: Todas las operaciones de DB usan `AsyncSession` de SQLAlchemy con `asyncpg`.
- **CRUD completo**: Cada entidad tiene endpoints `GET`, `POST`, `PATCH`, `DELETE`.
- **PATCH parcial**: Los updates usan `exclude_unset=True` para solo modificar campos enviados.
- **Filtros en listados**: La mayoria de endpoints GET soportan filtros por query params.
- **Paginacion**: El endpoint `/ciudades` implementa `limit`/`offset`.
- **404 automatico**: Los endpoints de detalle/updating/delete retornan 404 si el recurso no existe.
- **201 en creacion**: Los POST retornan status code 201.
- **CORS abierto**: Permite todos los origenes (`allow_origins=["*"]`).
- **Documentacion auto**: Swagger UI en `/docs` y ReDoc en `/redoc`.