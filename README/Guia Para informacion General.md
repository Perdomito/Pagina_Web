# 🚀 INICIO RÁPIDO - Sistema Iglesia Emanuel (GNIT)

## ¿Qué es este proyecto?

Un sistema web para gestionar:

- ✅ Miembros de la iglesia
- ✅ Contactos y evangelización
- ✅ Estudios bíblicos (registro día a día por misionero)
- ✅ Iglesias por ciudad y país
- ✅ Reportes de actividades
- ✅ Administración y presupuestos

**IMPORTANTE**: el sistema trabaja con **datos reales en una base Neon PostgreSQL**.
Lo que hagas en la app (crear un miembro, borrar un contacto) se guarda de verdad y lo
ven los demás. No hay datos de prueba.

## 📥 Instalación (2 pasos)

### Paso 1: Instalar dependencias

```bash
cd frontend
npm install
```

⏱️ Tomará unos minutos la primera vez.

### Paso 2: Iniciar la aplicación

```bash
npm start
```

✅ Se abre en `http://localhost:3000`.

**No hace falta instalar Python, ni base de datos, ni levantar el backend**: la app se
conecta sola a la API ya desplegada en HuggingFace. Solo necesitas Node.js.

## 🔐 Acceder al Sistema

Con tu usuario y contraseña reales. Las credenciales se validan contra la tabla
`usuarios` de la base de datos — no hay usuarios de ejemplo.

Si no tienes acceso, pídeselo a quien administre el sistema: te creará el usuario y te
asignará el rol, que es lo que decide qué módulos ves.

## 🎨 ¿Qué puedes hacer?

El panel principal tiene 7 módulos, y **verás solo aquellos que tu rol permita**:

1. **Miembros** — Ver, buscar y gestionar miembros
2. **Estudios Bíblicos** — Seguimiento diario: estudios por contacto, horas de
   evangelismo y contadores del día (dijeron sí, nuevos contactos, potenciales)
3. **Reportes** — Reportes semanales/mensuales, exportables a PDF
4. **Contactos** — Gestión de contactos nuevos
5. **Estadísticas** — Gráficas por país, proyecciones e iglesias por país
6. **Administración** — Presupuestos, ingresos, gastos y saldos
7. **Configuración** — Usuarios, roles y permisos

## 💾 Sobre los Datos

Todo vive en Neon PostgreSQL (proyecto `sweet-salad-38836045`, base **"GNIT DB"**).

⚠️ **Los cambios son permanentes y afectan a todos.** Si vas a probar algo que borre o
modifique datos, hazlo primero contra una rama de Neon, nunca contra la base principal.

## 🔧 Comandos Útiles

```bash
cd frontend
npm start                 # Iniciar (Ctrl + C para detener)

rm -rf node_modules       # Si algo se rompe:
npm install
```

Para trabajar en la API (solo si vas a tocar el backend), mira `backend/API/README.md`.

## 📁 Estructura del Proyecto

```
Pagina_Web/
│
├── frontend/                 ← Aquí trabajarás casi siempre
│   └── src/
│       ├── pages/           ← Una página por módulo (Login, Miembros, ...)
│       ├── services/        ← Llamadas a la API, una por dominio
│       ├── context/         ← AuthContext (login) e IdiomaContext (ES/EN)
│       ├── utils/translations/  ← Textos de la interfaz
│       └── api/axios.js     ← A qué API apunta la app
│
├── backend/API/              ← La API real (FastAPI). Su README documenta
│   │                           todas las tablas y endpoints
│   └── backend/*.js          ← Express heredado, ya no se usa
│
└── README.md                 ← Documentación general
```

## ❓ Preguntas Frecuentes

### ¿Necesito instalar PostgreSQL o alguna base de datos?

No. La base está en la nube y la API también.

### ¿Los cambios se guardan?

Sí, permanentemente y para todos los usuarios. Ten cuidado al borrar.

### ¿Puedo modificar el diseño?

Sí, en `frontend/src/pages/`. Cada página es un `.jsx` con estilos inline.

### ¿Cómo agrego un texto nuevo a la interfaz?

En `frontend/src/utils/translations/<módulo>.js`, añadiendo la clave en **`es` y en
`en`**; luego úsala con `t('miClave')`.

### ¿Por qué no veo un módulo del menú?

Porque tu rol no tiene ese permiso. Se gestiona en Configuración → Roles y permisos.

### ¿Cuándo levanto el backend?

Solo si vas a modificar la API. Para trabajar en la interfaz no hace falta.

## 📚 Siguientes Pasos

1. **Explora la aplicación**: navega por los módulos a los que tengas acceso
2. **Lee `README.md`** en la raíz: arquitectura y flujo de despliegue
3. **Lee `backend/API/README.md`**: esquema de la base de datos y endpoints
4. **Lee `CLAUDE.md`**: convenciones de código y flujo de trabajo

---

**¿Todo listo?** `npm start` y a explorar 🎉
