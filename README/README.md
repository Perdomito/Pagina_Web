# Sistema de Gestión - Iglesia Emanuel

Sistema web para la gestión de miembros, contactos, estudios bíblicos, reportes y administración financiera de la Iglesia Emanuel.

## 📋 Descripción

Este proyecto está dividido en dos partes:
- **Frontend**: Aplicación React con interfaz de usuario
- **Backend**: API REST con Node.js y Express (preparado para futura implementación)

**ESTADO ACTUAL**: La aplicación funciona completamente SIN backend, usando datos mock (datos de prueba fijos). Esto permite que todos los desarrolladores trabajen en el frontend sin necesidad de configurar una base de datos.

## 🚀 Características Actuales

- ✅ Sistema de login con credenciales fijas
- ✅ Gestión de miembros (ver, filtrar, eliminar)
- ✅ Gestión de contactos
- ✅ Reportes de evangelización
- ✅ Estudios bíblicos
- ✅ Administración financiera y presupuestos
- ✅ Diseño responsive y moderno
- ✅ Navegación entre módulos
- ✅ Datos mock para desarrollo

## 🔐 Credenciales de Acceso

Para iniciar sesión, usa:
- **Email**: admin@sistema.com
- **Contraseña**: 1234

También puedes usar:
- **Email**: pastor@iglesia.com, **Contraseña**: pastor123
- **Email**: maria@miembros.com, **Contraseña**: 123456

## 📦 Instalación

### Frontend

```bash
cd frontend
npm install
npm start
```

La aplicación se abrirá en `http://localhost:3000`

### Backend (Opcional - Para futura implementación)

```bash
cd backend
npm install
# Configurar archivo .env con credenciales de base de datos
npm run dev
```

## 🗂️ Estructura del Proyecto

```
proyecto-iglesia-emanuel/
│
├── frontend/                 # Aplicación React
│   ├── public/
│   └── src/
│       ├── pages/           # Páginas de la aplicación
│       ├── context/         # Context API (AuthContext)
│       ├── data/            # Datos mock
│       ├── api/             # Configuración para futura API
│       └── App.js
│
└── backend/                 # API (preparada para implementación)
    ├── config/             # Configuración de BD
    ├── controllers/        # Lógica de negocio
    ├── routes/             # Rutas de la API
    ├── middleware/         # Middlewares (auth, etc)
    ├── database/           # Scripts SQL
    └── server.js
```

## 💾 Datos Mock

Los datos de prueba están en `frontend/src/data/mockData.js` e incluyen:
- 3 usuarios de ejemplo
- 4 miembros
- 4 contactos
- 4 reportes
- 4 presupuestos
- 3 estudios bíblicos

Estos datos se pueden modificar directamente en el archivo para hacer pruebas.

## 🔮 Próximos Pasos (Cuando implementen el Backend)

1. **Configurar Base de Datos**
   - Instalar MySQL
   - Ejecutar script `backend/database/schema.sql`
   - Configurar archivo `.env` con credenciales

2. **Activar Backend**
   - Descomentar código en `backend/server.js`
   - Descomentar código en controladores
   - Descomentar código en rutas

3. **Conectar Frontend con Backend**
   - Descomentar código en `frontend/src/api/axios.js`
   - Modificar `AuthContext.js` para usar la API
   - Crear servicios para cada módulo

## 🛠️ Tecnologías Utilizadas

### Frontend
- React 18
- React Router DOM
- React Icons
- React Hot Toast
- CSS-in-JS (estilos inline)

### Backend (Preparado)
- Node.js
- Express
- MySQL
- JWT (autenticación)
- bcryptjs (encriptación)

## 👥 Colaboración

Este proyecto está diseñado para trabajo en equipo:
- Cada desarrollador puede trabajar en diferentes módulos
- No se necesita base de datos para desarrollo frontend
- Los datos mock permiten probar toda la funcionalidad

## 📝 Notas Importantes

1. **Autenticación**: Actualmente local, verifica credenciales contra datos mock
2. **Datos**: Se guardan en memoria, se pierden al recargar
3. **Backend**: Todos los archivos están preparados con comentarios y ejemplos
4. **Base de Datos**: El schema SQL está listo para usarse

## 🤝 Contribuir

1. Clona el repositorio
2. Crea una rama para tu funcionalidad
3. Realiza tus cambios
4. Haz commit y push
5. Crea un Pull Request

## 📄 Licencia

Este proyecto es privado y pertenece a la Iglesia Emanuel.

---

**Versión**: 1.0.0  
**Última actualización**: Febrero 2025
