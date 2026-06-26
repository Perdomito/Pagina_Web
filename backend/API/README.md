---
title: GNIT API
emoji: 🐳
colorFrom: purple
colorTo: gray
sdk: docker
app_port: 7860
---

# GNIT API

API REST para la plataforma GNIT — gestión de miembros, contactos, estudios bíblicos, reportes, finanzas y más.

- **Stack:** FastAPI + SQLAlchemy asyncio + PostgreSQL 16 (Neon)
- **Docs interactivos:** `/docs` (Swagger) | `/redoc` (ReDoc)
- **Health check:** `/health`

---

## Tablas (Base de Datos)

### 🌍 Geografía

#### `continentes`
| Campo | Tipo | Nulleable | Default |
|-------|------|-----------|---------|
| id | Integer PK | NO | |
| nombre | String(100) | NO | |

#### `paises`
| Campo | Tipo | Nulleable | Default |
|-------|------|-----------|---------|
| id | Integer PK | NO | |
| iso | String(2) | SI | |
| nombre | String(100) | NO | |
| continente_id | Integer FK → continentes.id | SI | `SET NULL` |

#### `ciudades`
| Campo | Tipo | Nulleable | Default |
|-------|------|-----------|---------|
| id | Integer PK | NO | |
| nombre | String(100) | NO | |
| nombre_ascii | String(100) | SI | |
| lat | Numeric(10,7) | SI | |
| lng | Numeric(10,7) | SI | |
| pais_iso2 | String(2) FK → paises.iso | SI | `SET NULL` |
| admin_name | String(100) | SI | |
| capital | String(20) | SI | |
| population | BigInteger | SI | |
| worldcity_id | BigInteger | SI | |

---

### 👥 Usuarios y Roles

#### `usuarios`
| Campo | Tipo | Nulleable | Default |
|-------|------|-----------|---------|
| id | String(30) PK | NO | |
| nombre | Text | NO | |
| email | Text | NO (UNIQUE) | |
| password_hash | Text | NO | |
| rol | Integer FK → roles.id | NO | |
| fecha_registro | DateTime | NO | `utcnow` |
| activo | Boolean | NO | `false` |
| region | String(20) | SI | |

#### `roles`
| Campo | Tipo | Nulleable | Default |
|-------|------|-----------|---------|
| id | Integer PK | NO | |
| nombre | String(30) | NO | `''` |
| descripcion | String(100) | SI | |

#### `rol_permisos`
| Campo | Tipo | Nulleable | Default |
|-------|------|-----------|---------|
| rol_id | Integer FK → roles.id | NO (PK) | |
| permiso_id | Integer PK | NO | |
| activo | Boolean | SI | `true` |

#### `usuario_permisos`
| Campo | Tipo | Nulleable | Default |
|-------|------|-----------|---------|
| id | Integer PK | NO | |
| usuario_id | String(30) FK → usuarios.id | NO | `CASCADE` |
| permiso_id | Integer | NO | |
| tiene_acceso | Boolean | SI | `true` |

---

### 👤 Personas

#### `miembros`
| Campo | Tipo | Nulleable | Default |
|-------|------|-----------|---------|
| id | String(30) PK | NO | |
| nombre | Text | NO | |
| identidad | String(30) | SI | |
| pais | Text | SI | |
| ciudad | Text | SI | |
| edad | Integer | SI | |
| evangelizado_por | Text | SI | |
| estado_civil | Text | SI | |
| profesion | Text | SI | |
| comentarios | Text | SI | |
| tipo_miembro | String(20) | NO | |
| pais_id | Integer FK → paises.id | SI | `SET NULL` |
| ciudad_id | Integer FK → ciudades.id | SI | `SET NULL` |
| cargo_funcion | Text | SI | |
| ministerio_of | Text | SI | |
| avance_audio | Text | SI | |

#### `miembros_info_adicional`
| Campo | Tipo | Nulleable | Default |
|-------|------|-----------|---------|
| id | String(30) PK FK → miembros.id | NO | `CASCADE` |
| nombre_padre | Text | SI | |
| telefono_padre | String(30) | SI | |
| nombre_madre | Text | SI | |
| telefono_madre | String(30) | SI | |
| tipo_sangre | String(5) | SI | |
| correo_electronico | String(255) | SI | |
| fecha_creacion | DateTime | NO | `utcnow` |
| fecha_actualizacion | DateTime | NO | `utcnow` |

#### `contactos`
| Campo | Tipo | Nulleable | Default |
|-------|------|-----------|---------|
| id | Integer PK | NO | |
| miembro_responsable | Text | NO | |
| nombre | Text | NO | |
| telefono | Text | SI | |
| pais | Text | SI | |
| notas | Text | SI | |
| profesion | Text | SI | |
| fecha_creacion | DateTime | SI | `utcnow` |
| pais_id | Integer FK → paises.id | SI | `SET NULL` |
| miembro_responsable_id | String(30) FK → miembros.id | SI | `SET NULL` |
| ciudad_id | Integer FK → ciudades.id | SI | `SET NULL` |

---

### 📖 Misiones y Estudios

#### `ciudades_mision`
| Campo | Tipo | Nulleable | Default |
|-------|------|-----------|---------|
| id | Integer PK | NO | |
| ciudad_id | Integer FK → ciudades.id | NO | `SET NULL` |
| region | String(150) | SI | |
| estado_presencia | String(30) | NO | `'En proceso'` |
| fecha_inicio_trabajo | Date | SI | |
| pastor_encargado_id | String(30) | SI | |
| pastor_encargado_nombre | Text | SI | |
| cantidad_miembros_activos | Integer | SI | `0` |
| notas | Text | SI | |
| fecha_creacion | DateTime | NO | `utcnow` |
| fecha_actualizacion | DateTime | NO | `utcnow` |

#### `reportes`
| Campo | Tipo | Nulleable | Default |
|-------|------|-----------|---------|
| id | Integer PK | NO | |
| miembro_que_reporta | Text | NO | |
| fecha | Date | NO | |
| tiempo_evangelizacion | Interval | SI | |
| contactos_obtenidos | Integer | SI | `0` |
| contactos_estudian | Integer | SI | `0` |
| numero_estudios_dados | Integer | SI | `0` |
| total_estudiantes | Integer | SI | `0` |
| pais | Text | SI | |
| fecha_creacion | DateTime | SI | `utcnow` |
| pais_id | Integer FK → paises.id | SI | `SET NULL` |
| miembro_id | String(30) FK → miembros.id | SI | `SET NULL` |
| ciudad_id | Integer FK → ciudades.id | SI | `SET NULL` |

#### `estudios_diarios`
| Campo | Tipo | Nulleable | Default |
|-------|------|-----------|---------|
| id | Integer PK | NO | |
| miembro_id | String(30) FK → miembros.id | NO | `CASCADE` |
| pais_id | Integer FK → paises.id | SI | `SET NULL` |
| contacto_id | Integer FK → contactos.id | SI | `SET NULL` |
| mes | Integer | NO | |
| anio | Integer | NO | |
| dia | Integer | NO | |
| capitulo | String(255) | SI | |
| horas | Numeric(5,2) | SI | |
| tipo | String(50) | SI | |
| donde | String(255) | SI | |
| dijeron_si | Integer | SI | `0` |
| nuevos_contactos | Integer | SI | `0` |
| fecha_creacion | DateTime | NO | `utcnow` |

---

### 💰 Finanzas

#### `cotizaciones`
| Campo | Tipo | Nulleable | Default |
|-------|------|-----------|---------|
| id | Integer PK | NO | |
| fecha | Date | NO | |
| solicitante | Text | NO | |
| concepto | Text | NO | |
| monto | Numeric(15,2) | NO | |
| moneda | String(10) | NO | `'USD'` |
| estado | String(20) | NO | `'pendiente'` |
| agregado_a_gastos | Boolean | NO | `false` |
| mes_agregado | Integer | SI | |
| anio_agregado | Integer | SI | |
| notas | Text | SI | |
| fecha_creacion | DateTime | NO | `utcnow` |
| fecha_actualizacion | DateTime | NO | `utcnow` |
| miembro_id | String(30) FK → miembros.id | SI | `SET NULL` |

#### `presupuestos`
| Campo | Tipo | Nulleable | Default |
|-------|------|-----------|---------|
| id | Integer PK | NO | |
| pais | String(100) | NO | |
| mes | Integer | SI | |
| anio | Integer | NO | |
| tipo_gasto | String(100) | NO | |
| concepto | Text | SI | |
| monto | Numeric(15,2) | NO | |
| moneda | String(10) | NO | |
| tasa_cambio | Numeric(15,6) | SI | |
| notas | Text | SI | |
| fecha_registro | DateTime | SI | `utcnow` |
| pais_id | Integer FK → paises.id | SI | `SET NULL` |

#### `ejecuciones`
| Campo | Tipo | Nulleable | Default |
|-------|------|-----------|---------|
| id | Integer PK | NO | |
| pais | String(100) | NO | |
| mes | Integer | NO | |
| anio | Integer | NO | |
| monto_recibido_usd | Numeric(15,2) | NO | |
| presupuesto_id | Integer FK → presupuestos.id | SI | `SET NULL` |
| notas | Text | SI | |
| fecha_creacion | DateTime | NO | `utcnow` |
| fecha_actualizacion | DateTime | NO | `utcnow` |
| pais_id | Integer FK → paises.id | SI | `SET NULL` |

#### `gastos_reales`
| Campo | Tipo | Nulleable | Default |
|-------|------|-----------|---------|
| id | Integer PK | NO | |
| ejecucion_id | Integer FK → ejecuciones.id | NO | `CASCADE` |
| concepto | Text | NO | |
| monto | Numeric(15,2) | NO | |
| tipo_gasto | String(100) | NO | |
| fecha_creacion | DateTime | NO | `utcnow` |

#### `ingresos`
| Campo | Tipo | Nulleable | Default |
|-------|------|-----------|---------|
| id | Integer PK | NO | |
| pais_id | Integer FK → paises.id | SI | `SET NULL` |
| mes | Integer | NO | |
| anio | Integer | NO | |
| tipo | String(100) | NO | |
| origen | Text | SI | |
| donde_ingresa | String(10) | NO | |
| valor | Numeric(15,2) | NO | |
| observaciones | Text | SI | |
| fecha | Date | NO | |
| fecha_creacion | DateTime | NO | `utcnow` |

#### `saldos_caja_banco`
| Campo | Tipo | Nulleable | Default |
|-------|------|-----------|---------|
| id | Integer PK | NO | |
| pais_id | Integer FK → paises.id | SI | `SET NULL` |
| saldo_caja | Numeric(15,2) | NO | `0` |
| saldo_banco | Numeric(15,2) | NO | `0` |
| updated_at | DateTime | NO | `utcnow` |

#### `traslados`
| Campo | Tipo | Nulleable | Default |
|-------|------|-----------|---------|
| id | Integer PK | NO | |
| pais_id | Integer FK → paises.id | SI | `SET NULL` |
| de | String(10) | NO | |
| a | String(10) | NO | |
| valor | Numeric(15,2) | NO | |
| observaciones | Text | SI | |
| fecha | Date | NO | |
| fecha_creacion | DateTime | NO | `utcnow` |

---

### ⚙️ Configuración

#### `configuracion`
| Campo | Tipo | Nulleable | Default |
|-------|------|-----------|---------|
| id | Integer PK | NO | |
| clave | String(100) | NO (UNIQUE) | |
| valor | Text | NO | |
| descripcion | Text | SI | |
| fecha_actualizacion | DateTime | NO | `utcnow` |

---

### 📊 Estadísticas

#### `estadisticas_paises`
| Campo | Tipo | Nulleable | Default |
|-------|------|-----------|---------|
| id | Integer PK | NO | |
| nombre_pais | String(100) | NO | |
| cantidad_miembros | Integer | SI | `0` |
| cantidad_estudios | Integer | SI | `0` |
| cantidad_reportes | Integer | SI | `0` |
| color | String(20) | SI | |
| mes | Integer | SI | |
| anio | Integer | NO | |
| fecha_creacion | DateTime | SI | `utcnow` |
| fecha_actualizacion | DateTime | SI | `utcnow` |
| pais_id | Integer FK → paises.id | SI | `SET NULL` |

---

## Endpoints de la API

### 🔐 Auth (`/auth`)

| Método | Ruta | Descripción | Parámetros |
|--------|------|-------------|------------|
| POST | `/auth/login` | Iniciar sesión, devuelve JWT | Body: email, password |
| GET | `/auth/mis-permisos` | Obtener permisos del usuario autenticado | Header: Authorization Bearer |

### 👥 Miembros (`/miembros`)

| Método | Ruta | Descripción | Parámetros |
|--------|------|-------------|------------|
| GET | `/miembros` | Listar miembros | `?tipo=&pais_id=` |
| GET | `/miembros/{id}` | Obtener miembro por ID | |
| POST | `/miembros` | Crear miembro | Body: MiembroCreate |
| PATCH | `/miembros/{id}` | Actualizar miembro | Body: MiembroUpdate |
| DELETE | `/miembros/{id}` | Eliminar miembro | |

### ℹ️ Miembros Info Adicional (`/miembros-info-adicional`)

| Método | Ruta | Descripción | Parámetros |
|--------|------|-------------|------------|
| GET | `/miembros-info-adicional` | Listar info adicional | `?id=` |
| GET | `/miembros-info-adicional/{id}` | Obtener por ID de miembro | |
| POST | `/miembros-info-adicional` | Crear info adicional | Body: MiembroInfoAdicionalCreate |
| PATCH | `/miembros-info-adicional/{id}` | Actualizar info adicional | Body: MiembroInfoAdicionalUpdate |
| DELETE | `/miembros-info-adicional/{id}` | Eliminar info adicional | |

### 📞 Contactos (`/contactos`)

| Método | Ruta | Descripción | Parámetros |
|--------|------|-------------|------------|
| GET | `/contactos` | Listar contactos | `?miembro_responsable_id=&pais_id=` |
| GET | `/contactos/{id}` | Obtener contacto | |
| POST | `/contactos` | Crear contacto | Body: ContactoCreate |
| PATCH | `/contactos/{id}` | Actualizar contacto | Body: ContactoUpdate |
| DELETE | `/contactos/{id}` | Eliminar contacto | |

### 📖 Estudios Diarios (`/estudios-diarios`)

| Método | Ruta | Descripción | Parámetros |
|--------|------|-------------|------------|
| GET | `/estudios-diarios` | Listar estudios diarios | `?miembro_id=&pais_id=&anio=&mes=` |
| GET | `/estudios-diarios/{id}` | Obtener estudio | |
| POST | `/estudios-diarios` | Crear estudio | Body: EstudioDiarioCreate |
| PATCH | `/estudios-diarios/{id}` | Actualizar estudio | Body: EstudioDiarioUpdate |
| DELETE | `/estudios-diarios/{id}` | Eliminar estudio | |

### 📋 Reportes (`/reportes`)

| Método | Ruta | Descripción | Parámetros |
|--------|------|-------------|------------|
| GET | `/reportes` | Listar reportes | `?miembro_id=&pais_id=&anio=` |
| GET | `/reportes/{id}` | Obtener reporte | |
| POST | `/reportes` | Crear reporte | Body: ReporteCreate |
| PATCH | `/reportes/{id}` | Actualizar reporte | Body: ReporteUpdate |
| DELETE | `/reportes/{id}` | Eliminar reporte | |

### 📊 Estadísticas Generales (`/estadisticas`)

| Método | Ruta | Descripción | Parámetros |
|--------|------|-------------|------------|
| GET | `/estadisticas` | Dashboard completo (comparación estudios, rendimiento profesores, evangelismo, crecimiento) | `?anio=` |

### 📈 Estadísticas por País (`/estadisticas-paises`)

| Método | Ruta | Descripción | Parámetros |
|--------|------|-------------|------------|
| GET | `/estadisticas-paises` | Listar estadísticas por país | `?pais_id=&anio=&mes=` |
| GET | `/estadisticas-paises/{id}` | Obtener estadística | |
| POST | `/estadisticas-paises` | Crear estadística | Body: EstadisticaPaisCreate |
| PATCH | `/estadisticas-paises/{id}` | Actualizar estadística | Body: EstadisticaPaisUpdate |
| DELETE | `/estadisticas-paises/{id}` | Eliminar estadística | |

### 🌍 Países (`/paises`)

| Método | Ruta | Descripción | Parámetros |
|--------|------|-------------|------------|
| GET | `/paises` | Listar países | |
| GET | `/paises/{id}` | Obtener país | |
| POST | `/paises` | Crear país | Body: PaisCreate |
| PATCH | `/paises/{id}` | Actualizar país | Body: PaisUpdate |
| DELETE | `/paises/{id}` | Eliminar país | |

### 🌎 Continentes (`/continentes`)

| Método | Ruta | Descripción | Parámetros |
|--------|------|-------------|------------|
| GET | `/continentes` | Listar continentes | |
| GET | `/continentes/{id}` | Obtener continente | |
| POST | `/continentes` | Crear continente | Body: ContinenteCreate |
| PATCH | `/continentes/{id}` | Actualizar continente | Body: ContinenteUpdate |
| DELETE | `/continentes/{id}` | Eliminar continente | |

### 🏙️ Ciudades (`/ciudades`)

| Método | Ruta | Descripción | Parámetros |
|--------|------|-------------|------------|
| GET | `/ciudades` | Listar ciudades | `?pais_iso2=&limit=&offset=` |
| GET | `/ciudades/{id}` | Obtener ciudad | |
| POST | `/ciudades` | Crear ciudad | Body: CiudadCreate |
| PATCH | `/ciudades/{id}` | Actualizar ciudad | Body: CiudadUpdate |
| DELETE | `/ciudades/{id}` | Eliminar ciudad | |

### ⛪ Ciudades Misión (`/ciudades-mision`)

| Método | Ruta | Descripción | Parámetros |
|--------|------|-------------|------------|
| GET | `/ciudades-mision` | Listar ciudades misión | `?ciudad_id=&estado_presencia=` |
| GET | `/ciudades-mision/{id}` | Obtener ciudad misión | |
| POST | `/ciudades-mision` | Crear ciudad misión | Body: CiudadMisionCreate |
| PATCH | `/ciudades-mision/{id}` | Actualizar ciudad misión | Body: CiudadMisionUpdate |
| DELETE | `/ciudades-mision/{id}` | Eliminar ciudad misión | |

### 💵 Cotizaciones (`/cotizaciones`)

| Método | Ruta | Descripción | Parámetros |
|--------|------|-------------|------------|
| GET | `/cotizaciones` | Listar cotizaciones | `?estado=&miembro_id=&anio=&mes=` |
| GET | `/cotizaciones/{id}` | Obtener cotización | |
| POST | `/cotizaciones` | Crear cotización | Body: CotizacionCreate |
| PATCH | `/cotizaciones/{id}` | Actualizar cotización | Body: CotizacionUpdate |
| DELETE | `/cotizaciones/{id}` | Eliminar cotización | |

### 💰 Presupuestos (`/presupuestos`)

| Método | Ruta | Descripción | Parámetros |
|--------|------|-------------|------------|
| GET | `/presupuestos` | Listar presupuestos | `?pais_id=&anio=&mes=&tipo_gasto=` |
| GET | `/presupuestos/{id}` | Obtener presupuesto | |
| POST | `/presupuestos` | Crear presupuesto | Body: PresupuestoCreate |
| PATCH | `/presupuestos/{id}` | Actualizar presupuesto | Body: PresupuestoUpdate |
| DELETE | `/presupuestos/{id}` | Eliminar presupuesto | |

### 📊 Ejecuciones (`/ejecuciones`)

| Método | Ruta | Descripción | Parámetros |
|--------|------|-------------|------------|
| GET | `/ejecuciones` | Listar ejecuciones | `?pais_id=&anio=&mes=` |
| GET | `/ejecuciones/{id}` | Obtener ejecución | |
| POST | `/ejecuciones` | Crear ejecución | Body: EjecucionCreate |
| PATCH | `/ejecuciones/{id}` | Actualizar ejecución | Body: EjecucionUpdate |
| DELETE | `/ejecuciones/{id}` | Eliminar ejecución | |

### 💸 Gastos Reales (`/gastos-reales`)

| Método | Ruta | Descripción | Parámetros |
|--------|------|-------------|------------|
| GET | `/gastos-reales` | Listar gastos | `?ejecucion_id=` |
| GET | `/gastos-reales/{id}` | Obtener gasto | |
| POST | `/gastos-reales` | Crear gasto | Body: GastoRealCreate |
| PATCH | `/gastos-reales/{id}` | Actualizar gasto | Body: GastoRealUpdate |
| DELETE | `/gastos-reales/{id}` | Eliminar gasto | |

### 💳 Ingresos (`/ingresos`)

| Método | Ruta | Descripción | Parámetros |
|--------|------|-------------|------------|
| GET | `/ingresos` | Listar ingresos | `?pais_id=&anio=&mes=&tipo=&donde_ingresa=` |
| GET | `/ingresos/{id}` | Obtener ingreso | |
| POST | `/ingresos` | Crear ingreso | Body: IngresoCreate |
| PATCH | `/ingresos/{id}` | Actualizar ingreso | Body: IngresoUpdate |
| DELETE | `/ingresos/{id}` | Eliminar ingreso | |

### 🏦 Saldos Caja/Banco (`/saldos-caja-banco`)

| Método | Ruta | Descripción | Parámetros |
|--------|------|-------------|------------|
| GET | `/saldos-caja-banco` | Listar saldos | `?pais_id=` |
| GET | `/saldos-caja-banco/{id}` | Obtener saldo | |
| POST | `/saldos-caja-banco` | Crear saldo | Body: SaldoCajaBancoCreate |
| PATCH | `/saldos-caja-banco/{id}` | Actualizar saldo | Body: SaldoCajaBancoUpdate |
| DELETE | `/saldos-caja-banco/{id}` | Eliminar saldo | |

### 🔄 Traslados (`/traslados`)

| Método | Ruta | Descripción | Parámetros |
|--------|------|-------------|------------|
| GET | `/traslados` | Listar traslados | `?pais_id=&anio=&mes=` |
| GET | `/traslados/{id}` | Obtener traslado | |
| POST | `/traslados` | Crear traslado | Body: TrasladoCreate |
| PATCH | `/traslados/{id}` | Actualizar traslado | Body: TrasladoUpdate |
| DELETE | `/traslados/{id}` | Eliminar traslado | |

### 👤 Usuarios (`/usuarios`)

| Método | Ruta | Descripción | Parámetros |
|--------|------|-------------|------------|
| GET | `/usuarios` | Listar usuarios | |
| GET | `/usuarios/{id}` | Obtener usuario | |
| POST | `/usuarios` | Crear usuario | Body: UsuarioCreate |
| PATCH | `/usuarios/{id}` | Actualizar usuario | Body: UsuarioUpdate |
| DELETE | `/usuarios/{id}` | Eliminar usuario | |
| GET | `/usuarios/{id}/permisos` | Listar permisos de un usuario | |
| POST | `/usuarios/{id}/permisos` | Agregar permiso a usuario | Body: permiso_id |
| PATCH | `/usuarios/{id}/permisos/{permiso_id}` | Actualizar permiso de usuario | Body: tiene_acceso |
| DELETE | `/usuarios/{id}/permisos/{permiso_id}` | Quitar permiso de usuario | |

### 🎭 Roles y Permisos (`/roles`)

| Método | Ruta | Descripción | Parámetros |
|--------|------|-------------|------------|
| GET | `/roles` | Listar roles | |
| GET | `/roles/{id}` | Obtener rol | |
| POST | `/roles` | Crear rol | Body: RolCreate |
| PATCH | `/roles/{id}` | Actualizar rol | Body: RolUpdate |
| DELETE | `/roles/{id}` | Eliminar rol | |
| GET | `/roles/{rol_id}/permisos` | Listar permisos de un rol | |
| POST | `/roles/{rol_id}/permisos` | Agregar permiso a rol | Body: permiso_id |
| PATCH | `/roles/{rol_id}/permisos/{permiso_id}` | Actualizar permiso de rol | Body: activo |
| DELETE | `/roles/{rol_id}/permisos/{permiso_id}` | Quitar permiso de rol | |

### ⚙️ Configuración (`/configuracion`)

| Método | Ruta | Descripción | Parámetros |
|--------|------|-------------|------------|
| GET | `/configuracion` | Listar configuración | |
| GET | `/configuracion/{clave}` | Obtener valor por clave | |
| POST | `/configuracion` | Crear clave | Body: ConfiguracionCreate |
| PATCH | `/configuracion/{clave}` | Actualizar valor | Body: ConfiguracionUpdate |
| DELETE | `/configuracion/{clave}` | Eliminar clave | |

---

## Setup

```bash
# Variables de entorno
DATABASE_URL=postgresql://user:pass@host:5432/neondb
SECRET_KEY=tu-secreto-jwt
ENVIRONMENT=development

# Docker
docker build -t gnit-api .
docker run -p 7860:7860 gnit-api

# O local
pip install -r requirements.txt
uvicorn app.main:app --reload --port 7860
```
