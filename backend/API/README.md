---
title: GNIT API
sdk: docker
app_port: 7860
---

# GNIT API

API REST para la plataforma GNIT — gestión de miembros, contactos, estudios bíblicos, reportes, finanzas y más.

- **Stack:** FastAPI + SQLAlchemy asyncio + PostgreSQL 16 (Neon)
- **Documentacion interactiva:** `/docs` (Swagger UI) | `/redoc` (ReDoc)
- **Health check:** `/health`

---

## Base de Datos

### Geografia

#### `continentes`

| Campo    | Tipo          | Nulleable | Default |
|----------|---------------|-----------|---------|
| id       | Integer PK    | NO        |         |
| nombre   | String(100)   | NO        |         |

#### `paises`

| Campo         | Tipo                     | Nulleable | Default    |
|---------------|--------------------------|-----------|------------|
| id            | Integer PK               | NO        |            |
| iso           | String(2)                | SI        |            |
| nombre        | String(100)              | NO        |            |
| continente_id | Integer FK → continentes | SI        | SET NULL   |

#### `ciudades`

| Campo        | Tipo                     | Nulleable | Default    |
|--------------|--------------------------|-----------|------------|
| id           | Integer PK               | NO        |            |
| nombre       | String(100)              | NO        |            |
| nombre_ascii | String(100)              | SI        |            |
| lat          | Numeric(10,7)            | SI        |            |
| lng          | Numeric(10,7)            | SI        |            |
| pais_iso2    | String(2) FK → paises    | SI        | SET NULL   |
| admin_name   | String(100)              | SI        |            |
| capital      | String(20)               | SI        |            |
| population   | BigInteger               | SI        |            |
| worldcity_id | BigInteger               | SI        |            |

---

### Usuarios y Roles

#### `usuarios`

| Campo         | Tipo                     | Nulleable | Default    |
|---------------|--------------------------|-----------|------------|
| id            | String(30) PK            | NO        |            |
| nombre        | Text                     | NO        |            |
| email         | Text                     | NO        | UNIQUE     |
| password_hash | Text                     | NO        |            |
| rol           | Integer FK → roles       | NO        |            |
| fecha_registro| DateTime                 | NO        | utcnow     |
| activo        | Boolean                  | NO        | false      |
| region        | String(20)               | SI        |            |
| pais_id       | Integer FK → paises      | SI        | SET NULL   |
| ciudad_id     | Integer FK → ciudades    | SI        | SET NULL   |
| miembro_id    | String(30) FK → miembros | SI        | SET NULL   |

#### `roles`

| Campo      | Tipo          | Nulleable | Default |
|------------|---------------|-----------|---------|
| id         | Integer PK    | NO        |         |
| nombre     | String(30)    | NO        | ''      |
| descripcion| String(100)   | SI        |         |

#### `permisos`

Catalogo de modulos de la app. Lo siembra el `startup()` con los 7 modulos que
espera la UI: Bible Studies, Reports, Members, Contacts, Administration,
Statistics, Settings.

| Campo  | Tipo        | Nulleable | Default |
|--------|-------------|-----------|---------|
| id     | Integer PK  | NO        |         |
| nombre | String(50)  | NO        |         |

#### `rol_permisos`

| Campo      | Tipo                     | Nulleable | Default |
|------------|--------------------------|-----------|---------|
| rol_id     | Integer FK → roles       | NO        | PK      |
| permiso_id | Integer FK → permisos    | NO        | PK, CASCADE |
| activo     | Boolean                  | SI        | true    |

#### `usuario_permisos`

| Campo       | Tipo                       | Nulleable | Default  |
|-------------|----------------------------|-----------|----------|
| id          | Integer PK                 | NO        |          |
| usuario_id  | String(30) FK → usuarios   | NO        | CASCADE  |
| permiso_id  | Integer FK → permisos      | NO        | CASCADE  |
| tiene_acceso| Boolean                    | SI        | true     |

---

### Personas

#### `miembros`

| Campo             | Tipo                     | Nulleable | Default    |
|-------------------|--------------------------|-----------|------------|
| id                | String(30) PK            | NO        |            |
| nombre            | Text                     | NO        |            |
| identidad         | String(30)               | SI        |            |
| pais              | Text                     | SI        |            |
| ciudad            | Text                     | SI        |            |
| edad              | Integer                  | SI        |            |
| evangelizado_por  | Text                     | SI        |            |
| estado_civil      | Text                     | SI        |            |
| profesion         | Text                     | SI        |            |
| comentarios       | Text                     | SI        |            |
| tipo_miembro      | String(20)               | NO        |            |
| pais_id           | Integer FK → paises      | SI        | SET NULL   |
| ciudad_id         | Integer FK → ciudades    | SI        | SET NULL   |
| cargo_funcion     | Text                     | SI        |            |
| ministerio_of     | Text                     | SI        |            |
| avance_audio      | Text                     | SI        |            |

#### `miembros_info_adicional`

| Campo              | Tipo                       | Nulleable | Default    |
|--------------------|----------------------------|-----------|------------|
| id                 | String(30) PK FK → miembros| NO        | CASCADE    |
| nombre_padre       | Text                       | SI        |            |
| telefono_padre     | String(30)                 | SI        |            |
| nombre_madre       | Text                       | SI        |            |
| telefono_madre     | String(30)                 | SI        |            |
| tipo_sangre        | String(5)                  | SI        |            |
| correo_electronico | String(255)                | SI        |            |
| fecha_creacion     | DateTime                   | NO        | utcnow     |
| fecha_actualizacion| DateTime                   | NO        | utcnow     |

#### `contactos`

| Campo                 | Tipo                         | Nulleable | Default    |
|-----------------------|------------------------------|-----------|------------|
| id                    | Integer PK                   | NO        |            |
| miembro_responsable   | Text                         | NO        |            |
| nombre                | Text                         | NO        |            |
| telefono              | Text                         | SI        |            |
| pais                  | Text                         | SI        |            |
| notas                 | Text                         | SI        |            |
| profesion             | Text                         | SI        |            |
| fecha_creacion        | DateTime                     | SI        | utcnow     |
| pais_id               | Integer FK → paises          | SI        | SET NULL   |
| miembro_responsable_id| String(30) FK → miembros     | SI        | SET NULL   |
| ciudad_id             | Integer FK → ciudades        | SI        | SET NULL   |

---

### Misiones y Estudios

#### `ciudades_mision`

| Campo                    | Tipo                      | Nulleable | Default       |
|--------------------------|---------------------------|-----------|---------------|
| id                       | Integer PK                | NO        |               |
| ciudad_id                | Integer FK → ciudades     | NO        | CASCADE       |
| region                   | String(150)               | SI        |               |
| estado_presencia         | String(30)                | NO        | 'En proceso'  |
| fecha_inicio_trabajo     | Date                      | SI        |               |
| pastor_encargado_id      | String(30) FK → miembros  | SI        | SET NULL      |
| pastor_encargado_nombre  | Text                      | SI        |               |
| cantidad_miembros_activos| Integer                   | SI        | 0             |
| notas                    | Text                      | SI        |               |
| fecha_creacion           | DateTime                  | NO        | utcnow        |
| fecha_actualizacion      | DateTime                  | NO        | utcnow        |

#### `iglesias`

Una fila por iglesia de cada ciudad. Es la fuente del contador "cantidad de
iglesias" por pais que muestra Estadisticas. `pais_id` es redundante con la
ciudad, pero se guarda porque todas las consultas filtran por pais; si no se
manda al crear, el endpoint lo deriva de la ciudad.

| Campo                   | Tipo                      | Nulleable | Default    |
|-------------------------|---------------------------|-----------|------------|
| id                      | Integer PK                | NO        |            |
| ciudad_id               | Integer FK → ciudades     | NO        | RESTRICT   |
| pais_id                 | Integer FK → paises       | SI        | SET NULL   |
| nombre                  | Text                      | NO        |            |
| direccion               | Text                      | SI        |            |
| pastor_encargado_id     | String(30) FK → miembros  | SI        | SET NULL   |
| pastor_encargado_nombre | Text                      | SI        |            |
| fecha_apertura          | Date                      | SI        |            |
| cantidad_miembros       | Integer                   | SI        | 0          |
| activa                  | Boolean                   | NO        | true       |
| notas                   | Text                      | SI        |            |
| fecha_creacion          | DateTime                  | NO        | utcnow     |
| fecha_actualizacion     | DateTime                  | NO        | utcnow     |

Indices: `idx_iglesias_pais (pais_id)`, `idx_iglesias_ciudad (ciudad_id)`.
Cerrar una iglesia se hace con `activa = false`, no borrandola: el conteo por
pais solo suma las activas y asi no se pierde el historico.

#### `reportes`

| Campo                  | Tipo                     | Nulleable | Default    |
|------------------------|--------------------------|-----------|------------|
| id                     | Integer PK               | NO        |            |
| miembro_que_reporta    | Text                     | NO        |            |
| fecha                  | Date                     | NO        |            |
| tiempo_evangelizacion  | Interval                 | SI        |            |
| contactos_obtenidos    | Integer                  | SI        | 0          |
| contactos_estudian     | Integer                  | SI        | 0          |
| numero_estudios_dados  | Integer                  | SI        | 0          |
| total_estudiantes      | Integer                  | SI        | 0          |
| pais                   | Text                     | SI        |            |
| fecha_creacion         | DateTime                 | SI        | utcnow     |
| pais_id                | Integer FK → paises      | SI        | SET NULL   |
| miembro_id             | String(30) FK → miembros | SI        | SET NULL   |
| ciudad_id              | Integer FK → ciudades    | SI        | SET NULL   |

#### `estudios_diarios`

| Campo           | Tipo                         | Nulleable | Default    |
|-----------------|------------------------------|-----------|------------|
| id              | Integer PK                   | NO        |            |
| miembro_id      | String(30) FK → miembros     | NO        | CASCADE    |
| pais_id         | Integer FK → paises          | SI        | SET NULL   |
| contacto_id     | Integer FK → contactos       | SI        | RESTRICT   |
| mes             | Integer                      | NO        |            |
| anio            | Integer                      | NO        |            |
| dia             | Integer                      | NO        |            |
| capitulo        | String(255)                  | SI        |            |
| horas           | Numeric(5,2)                 | SI        |            |
| tipo            | String(50)                   | SI        |            |
| donde           | String(255)                  | SI        |            |
| dijeron_si      | Integer                      | SI        | 0          |
| nuevos_contactos| Integer                      | SI        | 0          |
| potenciales     | Integer                      | NO        | 0          |
| fecha_creacion  | DateTime                     | NO        | utcnow     |

La tabla guarda **tres clases de fila** y se distinguen por `contacto_id` y `tipo`:

| Clase | `contacto_id` | `tipo` | Campos que usa |
|-------|---------------|--------|----------------|
| Estudio de un contacto | id del contacto | NULL | `capitulo`, `horas` |
| Evangelismo | NULL | 'Virtual' / 'Presencial' | `horas`, `donde` |
| Contadores del dia | NULL | NULL | `dijeron_si`, `nuevos_contactos`, `potenciales` |

Los contadores del dia son **uno por misionero y fecha**: el `POST` hace upsert
sobre esa clave en vez de insertar (la UI reenvia el dia entero en cada tecla y
antes quedaba una fila por pulsacion, inflando los totales de los reportes).

#### `archivos`

Adjuntos de ingresos y gastos. El binario vive en Supabase Storage; aqui solo
queda la referencia. `referencia_id` apunta a `ingresos.id` o a `gastos_reales.id`
segun `tipo`, por eso **no es una clave foranea**.

| Campo          | Tipo         | Nulleable | Default    |
|----------------|--------------|-----------|------------|
| id             | Integer PK   | NO        |            |
| tipo           | String(20)   | NO        | CHECK: 'ingreso' \| 'gasto' |
| referencia_id  | Integer      | NO        |            |
| nombre_original| Text         | SI        |            |
| content_type   | String(100)  | SI        |            |
| tamano_bytes   | BigInteger   | SI        |            |
| storage_path   | Text         | SI        |            |
| url            | Text         | NO        |            |
| fecha_creacion | DateTime     | NO        | utcnow     |

---

### Finanzas

#### `cotizaciones`

| Campo              | Tipo                       | Nulleable | Default     |
|--------------------|----------------------------|-----------|-------------|
| id                 | Integer PK                 | NO        |             |
| fecha              | Date                       | NO        |             |
| solicitante        | Text                       | NO        |             |
| concepto           | Text                       | NO        |             |
| monto              | Numeric(15,2)              | NO        |             |
| moneda             | String(10)                 | NO        | 'USD'       |
| estado             | String(20)                 | NO        | 'pendiente' |
| agregado_a_gastos  | Boolean                    | NO        | false       |
| mes_agregado       | Integer                    | SI        |             |
| anio_agregado      | Integer                    | SI        |             |
| notas              | Text                       | SI        |             |
| fecha_creacion     | DateTime                   | NO        | utcnow      |
| fecha_actualizacion| DateTime                   | NO        | utcnow      |
| miembro_id         | String(30) FK → miembros   | SI        | SET NULL    |
| pais_id            | Integer FK → paises        | SI        | SET NULL    |
| ciudad_id          | Integer FK → ciudades      | SI        | SET NULL    |

#### `presupuestos`

| Campo       | Tipo                     | Nulleable | Default    |
|-------------|--------------------------|-----------|------------|
| id          | Integer PK               | NO        |            |
| pais        | String(100)              | NO        |            |
| mes         | Integer                  | SI        |            |
| anio        | Integer                  | NO        |            |
| tipo_gasto  | String(100)              | NO        |            |
| concepto    | Text                     | SI        |            |
| monto       | Numeric(15,2)            | NO        |            |
| moneda      | String(10)               | NO        |            |
| tasa_cambio | Numeric(15,6)            | SI        |            |
| notas       | Text                     | SI        |            |
| fecha_registro | DateTime              | SI        | utcnow     |
| pais_id     | Integer FK → paises      | SI        | SET NULL   |

#### `ejecuciones`

| Campo              | Tipo                        | Nulleable | Default    |
|--------------------|-----------------------------|-----------|------------|
| id                 | Integer PK                  | NO        |            |
| pais               | String(100)                 | NO        |            |
| mes                | Integer                     | NO        |            |
| anio               | Integer                     | NO        |            |
| monto_recibido_usd | Numeric(15,2)               | NO        |            |
| presupuesto_id     | Integer FK → presupuestos   | SI        | SET NULL   |
| notas              | Text                        | SI        |            |
| fecha_creacion     | DateTime                    | NO        | utcnow     |
| fecha_actualizacion| DateTime                    | NO        | utcnow     |
| pais_id            | Integer FK → paises         | SI        | SET NULL   |

#### `gastos_reales`

| Campo       | Tipo                        | Nulleable | Default    |
|-------------|-----------------------------|-----------|------------|
| id          | Integer PK                  | NO        |            |
| ejecucion_id| Integer FK → ejecuciones    | NO        | CASCADE    |
| concepto    | Text                        | NO        |            |
| monto       | Numeric(15,2)               | NO        |            |
| tipo_gasto  | String(100)                 | NO        |            |
| fecha_creacion | DateTime                 | NO        | utcnow     |

#### `ingresos`

| Campo         | Tipo                     | Nulleable | Default    |
|---------------|--------------------------|-----------|------------|
| id            | Integer PK               | NO        |            |
| pais_id       | Integer FK → paises      | SI        | SET NULL   |
| mes           | Integer                  | NO        |            |
| anio          | Integer                  | NO        |            |
| tipo          | String(100)              | NO        |            |
| origen        | Text                     | SI        |            |
| donde_ingresa | String(10)               | NO        |            |
| valor         | Numeric(15,2)            | NO        |            |
| observaciones | Text                     | SI        |            |
| fecha         | Date                     | NO        |            |
| fecha_creacion| DateTime                 | NO        | utcnow     |

#### `saldos_caja_banco`

| Campo      | Tipo                     | Nulleable | Default    |
|------------|--------------------------|-----------|------------|
| id         | Integer PK               | NO        |            |
| pais_id    | Integer FK → paises      | SI        | SET NULL   |
| saldo_caja | Numeric(15,2)            | NO        | 0          |
| saldo_banco| Numeric(15,2)            | NO        | 0          |
| updated_at | DateTime                 | NO        | utcnow     |

#### `traslados`

| Campo         | Tipo                     | Nulleable | Default    |
|---------------|--------------------------|-----------|------------|
| id            | Integer PK               | NO        |            |
| pais_id       | Integer FK → paises      | SI        | SET NULL   |
| de            | String(10)               | NO        |            |
| a             | String(10)               | NO        |            |
| valor         | Numeric(15,2)            | NO        |            |
| observaciones | Text                     | SI        |            |
| fecha         | Date                     | NO        |            |
| fecha_creacion| DateTime                 | NO        | utcnow     |

---

### Configuracion

#### `configuracion`

| Campo              | Tipo          | Nulleable | Default    |
|--------------------|---------------|-----------|------------|
| id                 | Integer PK    | NO        |            |
| clave              | String(100)   | NO        | UNIQUE     |
| valor              | Text          | NO        |            |
| descripcion        | Text          | SI        |            |
| fecha_actualizacion| DateTime      | NO        | utcnow     |

---

### Estadisticas

#### `estadisticas_paises`

| Campo               | Tipo                     | Nulleable | Default    |
|---------------------|--------------------------|-----------|------------|
| id                  | Integer PK               | NO        |            |
| nombre_pais         | String(100)              | NO        |            |
| cantidad_miembros   | Integer                  | SI        | 0          |
| cantidad_estudios   | Integer                  | SI        | 0          |
| cantidad_reportes   | Integer                  | SI        | 0          |
| color               | String(20)               | SI        |            |
| mes                 | Integer                  | SI        |            |
| anio                | Integer                  | NO        |            |
| fecha_creacion      | DateTime                 | SI        | utcnow     |
| fecha_actualizacion | DateTime                 | SI        | utcnow     |
| pais_id             | Integer FK → paises      | SI        | SET NULL   |

---

## Endpoints de la API

### Auth

`/auth`

| Metodo | Ruta                    | Descripcion                                    | Parametros               |
|--------|-------------------------|------------------------------------------------|--------------------------|
| POST   | `/auth/login`           | Iniciar sesion, devuelve JWT                   | Body: email, password    |
| GET    | `/auth/mis-permisos`    | Permisos del usuario autenticado               | Header: Authorization    |

### Miembros

`/miembros`

| Metodo | Ruta                     | Descripcion                    | Parametros                     |
|--------|--------------------------|--------------------------------|--------------------------------|
| GET    | `/miembros`              | Listar miembros                | `?tipo_miembro=&pais_id=`      |
| GET    | `/miembros/{id}`         | Obtener miembro por ID         |                                |
| POST   | `/miembros`              | Crear miembro                  | Body: MiembroCreate            |
| PATCH  | `/miembros/{id}`         | Actualizar miembro             | Body: MiembroUpdate            |
| DELETE | `/miembros/{id}`         | Eliminar miembro               |                                |

### Miembros Info Adicional

`/miembros-info-adicional`

| Metodo | Ruta                                      | Descripcion               | Parametros                     |
|--------|-------------------------------------------|---------------------------|--------------------------------|
| GET    | `/miembros-info-adicional`                | Listar info adicional     | `?id=`                         |
| GET    | `/miembros-info-adicional/{id}`           | Obtener por ID de miembro |                                |
| POST   | `/miembros-info-adicional`                | Crear info adicional      | Body: MiembroInfoAdicionalCreate |
| PATCH  | `/miembros-info-adicional/{id}`           | Actualizar info adicional | Body: MiembroInfoAdicionalUpdate |
| DELETE | `/miembros-info-adicional/{id}`           | Eliminar info adicional   |                                |

### Contactos

`/contactos`

| Metodo | Ruta                     | Descripcion                    | Parametros                                     |
|--------|--------------------------|--------------------------------|------------------------------------------------|
| GET    | `/contactos`             | Listar contactos               | `?miembro_responsable_id=&pais_id=`            |
| GET    | `/contactos/{id}`        | Obtener contacto               |                                                |
| POST   | `/contactos`             | Crear contacto                 | Body: ContactoCreate                           |
| PATCH  | `/contactos/{id}`        | Actualizar contacto            | Body: ContactoUpdate                           |
| DELETE | `/contactos/{id}`        | Eliminar contacto              |                                                |

### Estudios Diarios

`/estudios-diarios`

| Metodo | Ruta                         | Descripcion              | Parametros                           |
|--------|------------------------------|--------------------------|--------------------------------------|
| GET    | `/estudios-diarios`          | Listar estudios diarios  | `?miembro_id=&pais_id=&anio=&mes=`   |
| GET    | `/estudios-diarios/{id}`     | Obtener estudio         |                                      |
| POST   | `/estudios-diarios`          | Crear estudio, o actualizar los contadores del dia si ya existen (ver tabla) | Body: EstudioDiarioCreate |
| PATCH  | `/estudios-diarios/{id}`     | Actualizar estudio      | Body: EstudioDiarioUpdate            |
| DELETE | `/estudios-diarios/{id}`     | Eliminar estudio        |                                      |

### Reportes

`/reportes`

| Metodo | Ruta                     | Descripcion                    | Parametros                     |
|--------|--------------------------|--------------------------------|--------------------------------|
| GET    | `/reportes`              | Listar reportes                | `?miembro_id=&pais_id=&anio=`  |
| GET    | `/reportes/{id}`         | Obtener reporte                |                                |
| POST   | `/reportes`              | Crear reporte                  | Body: ReporteCreate            |
| PATCH  | `/reportes/{id}`         | Actualizar reporte             | Body: ReporteUpdate            |
| DELETE | `/reportes/{id}`         | Eliminar reporte               |                                |

### Iglesias

`/iglesias`

| Metodo | Ruta                          | Descripcion                                   | Parametros                     |
|--------|-------------------------------|-----------------------------------------------|--------------------------------|
| GET    | `/iglesias`                   | Listar iglesias (incluye `ciudad_nombre` y `pais_nombre`) | `?pais_id=&ciudad_id=&activa=` |
| GET    | `/iglesias/conteo-por-pais`   | Cantidad de iglesias por pais                 | `?activa=` (true por defecto)  |
| GET    | `/iglesias/{id}`              | Obtener iglesia                               |                                |
| POST   | `/iglesias`                   | Crear iglesia; deriva `pais_id` de la ciudad si no se manda | Body: IglesiaCreate |
| PATCH  | `/iglesias/{id}`              | Actualizar iglesia; al cambiar de ciudad recalcula el pais | Body: IglesiaUpdate |
| DELETE | `/iglesias/{id}`              | Eliminar iglesia                              |                                |

Errores: `404` si la ciudad no existe, `422` si el nombre viene vacio.

### Archivos

`/archivos`

| Metodo | Ruta               | Descripcion                                    | Parametros                  |
|--------|--------------------|------------------------------------------------|-----------------------------|
| GET    | `/archivos`        | Listar adjuntos                                | `?tipo=&referencia_id=`     |
| POST   | `/archivos`        | Subir adjunto a Supabase Storage (multipart)   | `tipo`, `referencia_id`, `file` |
| DELETE | `/archivos/{id}`   | Eliminar adjunto                               |                             |

Requiere `SUPABASE_URL` y `SUPABASE_SERVICE_KEY`; sin esas variables el `POST`
responde `503`.

### Estadisticas Generales

`/estadisticas`

| Metodo | Ruta                     | Descripcion                                                      | Parametros        |
|--------|--------------------------|------------------------------------------------------------------|-------------------|
| GET    | `/estadisticas`          | Dashboard: comparacion estudios, rendimiento, evangelismo, crecimiento y `resumen_pais` | `?anio=&pais_id=` |

`resumen_pais` (solo si se manda `pais_id`) devuelve `cantidad_miembros` y
`cantidad_iglesias`, esta ultima contando las iglesias **activas** del pais.

### Estadisticas por Pais

`/estadisticas-paises`

| Metodo | Ruta                           | Descripcion              | Parametros               |
|--------|--------------------------------|--------------------------|--------------------------|
| GET    | `/estadisticas-paises`         | Listar estadisticas      | `?pais_id=&anio=&mes=`   |
| GET    | `/estadisticas-paises/{id}`    | Obtener estadistica      |                          |
| POST   | `/estadisticas-paises`         | Crear estadistica        | Body: EstadisticaPaisCreate |
| PATCH  | `/estadisticas-paises/{id}`    | Actualizar estadistica   | Body: EstadisticaPaisUpdate |
| DELETE | `/estadisticas-paises/{id}`    | Eliminar estadistica     |                          |

### Paises

`/paises`

| Metodo | Ruta                     | Descripcion                    | Parametros                     |
|--------|--------------------------|--------------------------------|--------------------------------|
| GET    | `/paises`                | Listar paises                  |                                |
| GET    | `/paises/{id}`           | Obtener pais                   |                                |
| POST   | `/paises`                | Crear pais                     | Body: PaisCreate               |
| PATCH  | `/paises/{id}`           | Actualizar pais                | Body: PaisUpdate               |
| DELETE | `/paises/{id}`           | Eliminar pais                  |                                |

### Continentes

`/continentes`

| Metodo | Ruta                     | Descripcion                    | Parametros                     |
|--------|--------------------------|--------------------------------|--------------------------------|
| GET    | `/continentes`           | Listar continentes             |                                |
| GET    | `/continentes/{id}`      | Obtener continente             |                                |
| POST   | `/continentes`           | Crear continente               | Body: ContinenteCreate         |
| PATCH  | `/continentes/{id}`      | Actualizar continente          | Body: ContinenteUpdate         |
| DELETE | `/continentes/{id}`      | Eliminar continente            |                                |

### Ciudades

`/ciudades`

| Metodo | Ruta                     | Descripcion                    | Parametros                        |
|--------|--------------------------|--------------------------------|-----------------------------------|
| GET    | `/ciudades`              | Listar ciudades                | `?pais_iso2=&limit=&offset=`      |
| GET    | `/ciudades/{id}`         | Obtener ciudad                 |                                   |
| POST   | `/ciudades`              | Crear ciudad                   | Body: CiudadCreate                |
| PATCH  | `/ciudades/{id}`         | Actualizar ciudad              | Body: CiudadUpdate                |
| DELETE | `/ciudades/{id}`         | Eliminar ciudad                |                                   |

### Ciudades Mision

`/ciudades-mision`

| Metodo | Ruta                           | Descripcion              | Parametros                     |
|--------|--------------------------------|--------------------------|--------------------------------|
| GET    | `/ciudades-mision`             | Listar ciudades mision  | `?ciudad_id=&estado_presencia=` |
| GET    | `/ciudades-mision/{id}`        | Obtener ciudad mision   |                                |
| POST   | `/ciudades-mision`             | Crear ciudad mision     | Body: CiudadMisionCreate       |
| PATCH  | `/ciudades-mision/{id}`        | Actualizar ciudad mision| Body: CiudadMisionUpdate       |
| DELETE | `/ciudades-mision/{id}`        | Eliminar ciudad mision  |                                |

### Cotizaciones

`/cotizaciones`

| Metodo | Ruta                     | Descripcion                    | Parametros                           |
|--------|--------------------------|--------------------------------|--------------------------------------|
| GET    | `/cotizaciones`          | Listar cotizaciones            | `?estado=&miembro_id=&anio=&mes=`    |
| GET    | `/cotizaciones/{id}`     | Obtener cotizacion             |                                      |
| POST   | `/cotizaciones`          | Crear cotizacion               | Body: CotizacionCreate               |
| PATCH  | `/cotizaciones/{id}`     | Actualizar cotizacion          | Body: CotizacionUpdate               |
| DELETE | `/cotizaciones/{id}`     | Eliminar cotizacion            |                                      |

### Presupuestos

`/presupuestos`

| Metodo | Ruta                     | Descripcion                    | Parametros                           |
|--------|--------------------------|--------------------------------|--------------------------------------|
| GET    | `/presupuestos`          | Listar presupuestos            | `?pais_id=&anio=&mes=&tipo_gasto=`   |
| GET    | `/presupuestos/{id}`     | Obtener presupuesto            |                                      |
| POST   | `/presupuestos`          | Crear presupuesto              | Body: PresupuestoCreate              |
| PATCH  | `/presupuestos/{id}`     | Actualizar presupuesto         | Body: PresupuestoUpdate              |
| DELETE | `/presupuestos/{id}`     | Eliminar presupuesto           |                                      |

### Ejecuciones

`/ejecuciones`

| Metodo | Ruta                     | Descripcion                    | Parametros                     |
|--------|--------------------------|--------------------------------|--------------------------------|
| GET    | `/ejecuciones`           | Listar ejecuciones             | `?pais_id=&anio=&mes=`         |
| GET    | `/ejecuciones/{id}`      | Obtener ejecucion              |                                |
| POST   | `/ejecuciones`           | Crear ejecucion                | Body: EjecucionCreate          |
| PATCH  | `/ejecuciones/{id}`      | Actualizar ejecucion           | Body: EjecucionUpdate          |
| DELETE | `/ejecuciones/{id}`      | Eliminar ejecucion             |                                |

### Gastos Reales

`/gastos-reales`

| Metodo | Ruta                     | Descripcion                    | Parametros                     |
|--------|--------------------------|--------------------------------|--------------------------------|
| GET    | `/gastos-reales`         | Listar gastos reales           | `?ejecucion_id=`               |
| GET    | `/gastos-reales/{id}`    | Obtener gasto                  |                                |
| POST   | `/gastos-reales`         | Crear gasto                    | Body: GastoRealCreate          |
| PATCH  | `/gastos-reales/{id}`    | Actualizar gasto               | Body: GastoRealUpdate          |
| DELETE | `/gastos-reales/{id}`    | Eliminar gasto                 |                                |

### Ingresos

`/ingresos`

| Metodo | Ruta                     | Descripcion                    | Parametros                                   |
|--------|--------------------------|--------------------------------|----------------------------------------------|
| GET    | `/ingresos`              | Listar ingresos                | `?pais_id=&anio=&mes=&tipo=&donde_ingresa=`  |
| GET    | `/ingresos/{id}`         | Obtener ingreso                |                                              |
| POST   | `/ingresos`              | Crear ingreso                  | Body: IngresoCreate                          |
| PATCH  | `/ingresos/{id}`         | Actualizar ingreso             | Body: IngresoUpdate                          |
| DELETE | `/ingresos/{id}`         | Eliminar ingreso               |                                              |

### Saldos Caja / Banco

`/saldos-caja-banco`

| Metodo | Ruta                           | Descripcion              | Parametros               |
|--------|--------------------------------|--------------------------|--------------------------|
| GET    | `/saldos-caja-banco`           | Listar saldos            | `?pais_id=`              |
| GET    | `/saldos-caja-banco/{id}`      | Obtener saldo            |                          |
| POST   | `/saldos-caja-banco`           | Crear saldo              | Body: SaldoCajaBancoCreate |
| PATCH  | `/saldos-caja-banco/{id}`      | Actualizar saldo         | Body: SaldoCajaBancoUpdate |
| DELETE | `/saldos-caja-banco/{id}`      | Eliminar saldo           |                          |

### Traslados

`/traslados`

| Metodo | Ruta                     | Descripcion                    | Parametros                     |
|--------|--------------------------|--------------------------------|--------------------------------|
| GET    | `/traslados`             | Listar traslados               | `?pais_id=&anio=&mes=`         |
| GET    | `/traslados/{id}`        | Obtener traslado               |                                |
| POST   | `/traslados`             | Crear traslado                 | Body: TrasladoCreate           |
| PATCH  | `/traslados/{id}`        | Actualizar traslado            | Body: TrasladoUpdate           |
| DELETE | `/traslados/{id}`        | Eliminar traslado              |                                |

### Usuarios

`/usuarios`

| Metodo | Ruta                                          | Descripcion               | Parametros                     |
|--------|-----------------------------------------------|---------------------------|--------------------------------|
| GET    | `/usuarios`                                   | Listar usuarios           |                                |
| GET    | `/usuarios/{id}`                              | Obtener usuario           |                                |
| POST   | `/usuarios`                                   | Crear usuario             | Body: UsuarioCreate            |
| PATCH  | `/usuarios/{id}`                              | Actualizar usuario        | Body: UsuarioUpdate            |
| DELETE | `/usuarios/{id}`                              | Eliminar usuario          |                                |
| GET    | `/usuarios/{id}/permisos`                     | Listar permisos           |                                |
| POST   | `/usuarios/{id}/permisos`                     | Agregar permiso           | Body: permiso_id               |
| PATCH  | `/usuarios/{id}/permisos/{permiso_id}`        | Actualizar permiso        | Body: tiene_acceso             |
| DELETE | `/usuarios/{id}/permisos/{permiso_id}`        | Quitar permiso            |                                |

### Roles y Permisos

`/roles`

| Metodo | Ruta                                        | Descripcion               | Parametros                     |
|--------|---------------------------------------------|---------------------------|--------------------------------|
| GET    | `/roles`                                    | Listar roles              |                                |
| GET    | `/roles/{id}`                               | Obtener rol               |                                |
| POST   | `/roles`                                    | Crear rol                 | Body: RolCreate                |
| PATCH  | `/roles/{id}`                               | Actualizar rol            | Body: RolUpdate                |
| DELETE | `/roles/{id}`                               | Eliminar rol              |                                |
| GET    | `/roles/{rol_id}/permisos`                  | Listar permisos del rol   |                                |
| POST   | `/roles/{rol_id}/permisos`                  | Agregar permiso al rol    | Body: permiso_id               |
| PATCH  | `/roles/{rol_id}/permisos/{permiso_id}`     | Actualizar permiso del rol| Body: activo                   |
| DELETE | `/roles/{rol_id}/permisos/{permiso_id}`     | Quitar permiso del rol    |                                |

### Configuracion

`/configuracion`

| Metodo | Ruta                     | Descripcion                    | Parametros                     |
|--------|--------------------------|--------------------------------|--------------------------------|
| GET    | `/configuracion`         | Listar configuracion           |                                |
| GET    | `/configuracion/{clave}` | Obtener valor por clave        |                                |
| POST   | `/configuracion`         | Crear clave de configuracion  | Body: ConfiguracionCreate      |
| PATCH  | `/configuracion/{clave}` | Actualizar valor               | Body: ConfiguracionUpdate      |
| DELETE | `/configuracion/{clave}` | Eliminar clave                 |                                |

---

## Integridad y migraciones automáticas

El `startup()` de `app/main.py` se ejecuta en cada arranque y es **idempotente** (seguro de re-ejecutar):

- `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` para columnas nuevas (`usuarios.pais_id/ciudad_id/miembro_id`, `cotizaciones.pais_id/ciudad_id`, `miembros.cargo_funcion/ministerio_of/avance_audio`, `estudios_diarios.potenciales`, `ingresos.numero`, `saldos_caja_banco.codigo_contable_caja/banco`).
- `CREATE TABLE IF NOT EXISTS` para las tablas financieras (`ingresos`, `traslados`, `saldos_caja_banco`), `permisos`, `usuario_permisos`, `archivos` e `iglesias` (con sus índices) — definición espejo de `app/migrations/schema.sql`.
- Claves foráneas idempotentes (vía `DO $$ ... pg_constraint`): `usuarios.rol/pais_id/ciudad_id/miembro_id`, `cotizaciones.pais_id/ciudad_id`, `rol_permisos.rol_id/permiso_id`, `usuario_permisos.permiso_id`.
- Normalización de `ON DELETE` en `saldos_caja_banco.pais_id`, `paises.continente_id` y `estudios_diarios.contacto_id` (RESTRICT: no se borra un contacto con estudios registrados).

No se necesita migración manual: al desplegar, la base se sincroniza sola con el esquema declarado en los modelos.

## Tests

```bash
python -m pytest -q
```

Corren sobre SQLite en memoria construido desde los propios modelos (`tests/conftest.py`),
así que **no tocan Neon ni producción**. Un modelo mal declarado —una FK que no
resuelve, un tipo inválido— hace fallar la suite entera.

Además de los casos de negocio, hay dos redes de seguridad que conviene conocer
antes de tocar el esquema:

- `tests/test_contratos.py` — cada payload que manda el frontend debe existir en
  el schema de Pydantic. Evita el fallo silencioso de que la API devuelva `200`
  descartando un campo que la UI sí envía.
- `tests/test_relaciones.py` — fija el inventario completo de claves foráneas con
  su `ON DELETE`. Si agregas una columna `*_id` sin relación, o cambias un
  `ON DELETE`, el test falla y te obliga a actualizarlo a conciencia.

## Setup

```bash
# Variables de entorno requeridas
DATABASE_URL=postgresql+asyncpg://usuario:password@host/GNIT%20DB
SECRET_KEY=clave-secreta-para-jwt
ENVIRONMENT=development

# Opcionales: sin ellas, POST /archivos responde 503
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
SUPABASE_BUCKET=archivos

# Ejecutar con Docker
docker build -t gnit-api .
docker run -p 7860:7860 gnit-api

# Ejecutar localmente
pip install -r requirements.txt
uvicorn app.main:app --reload --port 7860
```
