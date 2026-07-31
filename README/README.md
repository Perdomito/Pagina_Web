# Sistema de Gestión - Iglesia Emanuel

Sistema full-stack para la gestión de miembros, contactos, estudios bíblicos, reportes y administración financiera de la Iglesia Emanuel.

## 📋 Descripción

**Estado**: Sistema en producción con BD real en Neon PostgreSQL.

- **Frontend**: React 18 con estilos inline, Context API para i18n y autenticación
- **Backend**: FastAPI con autenticación JWT, roles y permisos
- **Base de datos**: Neon PostgreSQL (proyecto "sweet-salad-38836045", tabla "GNIT DB")
- **i18n**: Sistema de idiomas (ES/EN) manejado completamente en frontend con localStorage

## 🚀 Características

- ✅ Autenticación JWT con rol y permisos
- ✅ Gestión de miembros, contactos, reportes
- ✅ Control de estudios bíblicos y evangelización
- ✅ Administración financiera (presupuestos, ingresos, gastos)
- ✅ Sistema de idiomas (Español/Inglés) en interfaz
- ✅ Datos persistentes en Neon PostgreSQL
- ✅ Diseño responsive
- ✅ Roles y permisos por usuario

## 🔐 Credenciales de Acceso

Las credenciales se validan contra la base de datos Neon. Los usuarios deben existir en la tabla `usuarios` con permisos asignados.

Ejemplo de roles disponibles:
- `administrador`: Acceso completo
- `pastor`: Acceso a miembros, reportes, estudios
- `misionero`: Acceso limitado a contactos y reportes

## 📦 Instalación

### Frontend

```bash
cd frontend
npm install
npm start
```

Abre `http://localhost:3000`. La app intenta conectar con el backend en `http://localhost:8000` por defecto.

### Backend (FastAPI)

```bash
cd backend/API
python -m venv venv
.\venv\Scripts\activate  # Windows
source venv/bin/activate  # macOS/Linux

pip install -r requirements.txt
python app/main.py
```

Backend corre en `http://localhost:8000`

**Variables de entorno**: Copia `.env.example` a `.env` y configura:
```env
DATABASE_URL=postgresql://...  # Neon DB
SECRET_KEY=tu-clave-secreta
```

## 🗂️ Estructura del Proyecto

```
Pagina_Web/
│
├── frontend/                          # Aplicación React
│   ├── public/
│   └── src/
│       ├── pages/                    # Páginas (Home, Login, Configuracion, etc)
│       ├── components/               # Componentes reutilizables
│       ├── context/
│       │   ├── AuthContext.js       # Autenticación JWT + usuario
│       │   └── IdiomaContext.js     # Sistema de idiomas (ES/EN)
│       ├── utils/
│       │   └── translations.js      # Traducciones de UI
│       └── App.js
│
├── backend/API/                       # FastAPI + SQLAlchemy
│   ├── app/
│   │   ├── main.py                  # Punto de entrada
│   │   ├── models.py                # Modelos SQLAlchemy
│   │   ├── schemas.py               # Pydantic schemas (validación)
│   │   ├── database.py              # Conexión Neon
│   │   ├── middleware.py            # Auth JWT
│   │   └── routers/                 # Endpoints (usuarios, roles, etc)
│   ├── requirements.txt
│   ├── pytest.ini
│   └── tests/                        # Tests unitarios
│
└── GNITDB2.sql                       # Dump de BD (referencia)
```

## 🌐 Sistema de Idiomas (i18n)

El sistema maneja traducciones de la interfaz completamente en **frontend** sin consumir una API.

### Cómo funciona

1. **Traducciones definidas en código**  
   `frontend/src/utils/translations.js` contiene dos objetos: `es` e `en` con pares clave-valor.

   ```javascript
   const translations = {
     es: { panelControl: "Panel de Control", ... },
     en: { panelControl: "Control Panel", ... }
   };
   ```

2. **Context API para cambiar idioma**  
   `frontend/src/context/IdiomaContext.js` proporciona:
   - `idioma`: idioma actual (`"es"` o `"en"`)
   - `setIdioma()`: cambia el idioma
   - `t(clave)`: traduce una clave a texto

3. **Uso en componentes**  
   ```javascript
   const { t } = useIdioma();
   return <h1>{t('panelControl')}</h1>;
   ```

4. **Persistencia local**  
   - Se guarda en `localStorage` como `idioma: "es"`
   - Al recargar, se recupera la preferencia
   - **No se sincroniza con la BD** — cada navegador/dispositivo mantiene su propio idioma

### Nota importante

- **La BD recibe datos en su forma original**, no traducidos
- El cambio de idioma solo afecta etiquetas de UI (botones, títulos, mensajes)
- Los datos de usuarios (nombres, descripciones) se almacenan como son, sin traducción

## 🔄 Flujo de desarrollo

### Cambios en base de datos
1. Proponer cambio en esquema (expandir columna, nueva tabla, etc)
2. Crear rama desde `main`: `git checkout -b db-update`
3. Actualizar `models.py` y `schemas.py`
4. Crear migration si es necesario (expand-contract para tablas grandes)
5. Testear contra rama Neon
6. PR → review → merge a `main`

### Cambios en frontend
1. Crear rama: `git checkout -b feature/mi-feature`
2. Modificar componentes, añadir rutas si es necesario
3. Verificar i18n: nuevas claves van en `translations.js`
4. Test en navegador
5. PR → merge a `main`

### Despliegue
- **Frontend**: builds automáticos en production
- **Backend**: push a `main` en rama separada `gnit-api` (deploy en HuggingFace)

## 🛠️ Tecnologías Utilizadas

### Frontend
- **React 18** — UI
- **React Router DOM** — Navegación
- **React Icons** — Iconografía
- **React Hot Toast** — Notificaciones
- **Context API** — Estado global (autenticación, idioma)
- CSS-in-JS (estilos inline)

### Backend
- **FastAPI** — Framework web
- **SQLAlchemy** — ORM
- **Pydantic** — Validación de datos
- **JWT** — Autenticación
- **Python-jose** — Tokens JWT
- **Passlib + bcrypt** — Hashing de contraseñas

### Base de datos
- **Neon PostgreSQL** — BD en la nube
- **20+ tablas** — Geografía, personas, finanzas, operaciones

## 👥 Colaboración

- El frontend puede desarrollarse independientemente del backend con un servidor de desarrollo local
- Cambios en modelos deben coordinarse en BD (rama `db-update`)
- Consultar `CLAUDE.md` para convenciones de código y flujo de git

## 📝 Notas Importantes

1. **Autenticación**
   - Credenciales se validan contra tabla `usuarios` en Neon
   - Tokens JWT se almacenan en localStorage (`token` y `refresh_token`)
   - Permisos se asignan por rol + permisos individuales

2. **Base de datos**
   - Conexión: `postgresql://...` en `.env` (`DATABASE_URL`)
   - Testing: crear rama Neon desde `main` antes de cambios
   - Nunca alterar schema en producción sin migration

3. **i18n**
   - Solo frontend/localStorage, no sincronizado con BD
   - Datos usuarios se guardan en idioma original
   - Para agregar traducciones nuevas: editar `frontend/src/utils/translations.js`

4. **Despliegue**
   - Frontend: automático desde `main`
   - Backend: manual push a rama `gnit-api` en repo separado

## 🤝 Contribuir

1. Crea rama desde `main`
2. Haz cambios y verifica en local
3. Commit claro y conciso (describen el QUÉ, no el CÓMO)
4. Push y abre PR
5. Review y merge a `main`

**No** hacer:
- Commits amend o force push a ramas compartidas
- Co-Authored-By de Claude en commits
- Cambios a schema sin migration

## 📚 Documentación

- `CLAUDE.md` — Protocolo de desarrollo NEPTUNO
- `GNITDB2.sql` — Referencia del schema (puede estar desactualizada)
- Truuth source: Lee el código + estado actual de BD

## 📄 Licencia

Privado — Iglesia Emanuel

---

**Versión**: 2.0.0 (FastAPI + Neon PostgreSQL)  
**Última actualización**: Julio 2026
