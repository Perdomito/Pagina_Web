# 🚀 INICIO RÁPIDO - Sistema Iglesia Emanuel

## ¿Qué es este proyecto?

Es un sistema web completo para gestionar:
- ✅ Miembros de la iglesia
- ✅ Contactos y evangelización  
- ✅ Estudios bíblicos
- ✅ Reportes de actividades
- ✅ Administración y presupuestos

**IMPORTANTE**: El proyecto funciona SIN necesidad de base de datos. Usa datos de prueba (mock data) para que todos puedan trabajar sin configuraciones complicadas.

## 📥 Instalación (3 pasos)

### Paso 1: Descomprimir
Descomprime el archivo `iglesia-emanuel-proyecto.zip` en tu computadora.

### Paso 2: Instalar dependencias
Abre una terminal en la carpeta del proyecto y ejecuta:

```bash
cd frontend
npm install
```

⏱️ Esto tomará unos minutos la primera vez.

### Paso 3: Iniciar la aplicación

```bash
npm start
```

✅ La aplicación se abrirá automáticamente en tu navegador en `http://localhost:3000`

## 🔐 Acceder al Sistema

En la pantalla de login, usa estas credenciales:

**Opción 1 - Administrador:**
- Email: `admin@sistema.com`
- Contraseña: `1234`

**Opción 2 - Pastor:**
- Email: `pastor@iglesia.com`
- Contraseña: `pastor123`

**Opción 3 - Miembro:**
- Email: `maria@miembros.com`
- Contraseña: `123456`

## 🎨 ¿Qué puedes hacer?

Una vez dentro, verás el panel principal con 5 módulos:

1. **Miembros** - Ver, buscar y gestionar miembros de la iglesia
2. **Estudios Bíblicos** - Seguimiento de estudios
3. **Reportes** - Reportes de evangelización
4. **Contactos** - Gestión de contactos nuevos
5. **Administración** - Control de presupuestos

Todos los módulos tienen datos de ejemplo que puedes ver y modificar.

## 💾 Sobre los Datos

Los datos son de **PRUEBA** y están en el archivo:
```
frontend/src/data/mockData.js
```

Puedes:
- ✅ Agregar más datos de prueba editando ese archivo
- ✅ Modificar los datos existentes
- ✅ Ver toda la información sin necesidad de base de datos

**NOTA**: Los cambios que hagas en la aplicación (como eliminar un miembro) se perderán al recargar la página, porque los datos están en memoria.

## 🔧 Comandos Útiles

### Iniciar la aplicación
```bash
cd frontend
npm start
```

### Detener la aplicación
Presiona `Ctrl + C` en la terminal

### Reinstalar dependencias (si hay problemas)
```bash
cd frontend
rm -rf node_modules
npm install
```

## 📁 Estructura del Proyecto

```
proyecto-iglesia-emanuel/
│
├── frontend/              ← Aquí trabajarás principalmente
│   ├── src/
│   │   ├── pages/        ← Todas las páginas (Login, Home, Miembros, etc.)
│   │   ├── data/         ← mockData.js (datos de prueba)
│   │   └── context/      ← AuthContext.js (maneja el login)
│   └── package.json
│
├── backend/              ← Preparado para el futuro (opcional)
│   ├── controllers/     ← Archivos con comentarios y ejemplos
│   ├── routes/          ← Rutas de la API
│   └── database/        ← Script SQL listo para usar
│
├── README.md            ← Documentación completa
└── GUIA_DESARROLLADORES.md  ← Guía detallada
```

## ❓ Preguntas Frecuentes

### ¿Necesito instalar MySQL o alguna base de datos?
**No**. El proyecto funciona sin base de datos usando datos de prueba.

### ¿Los cambios se guardan?
Solo mientras la página esté abierta. Al recargar, vuelven a los datos originales.

### ¿Puedo modificar el diseño?
Sí, los archivos están en `frontend/src/pages/`. Cada página es un archivo `.jsx`.

### ¿Cómo agrego más datos de prueba?
Edita el archivo `frontend/src/data/mockData.js` y agrega objetos a los arrays.

### ¿Cuándo se usa el backend?
Cuando estén listos para conectar a una base de datos real. Todos los archivos están preparados con instrucciones.

## 🆘 Problemas Comunes

### "npm: command not found"
**Solución**: Necesitas instalar Node.js. Descárgalo de [nodejs.org](https://nodejs.org/)

### "Port 3000 is already in use"
**Solución**: Cierra cualquier otra aplicación que use el puerto 3000, o usa otro puerto:
```bash
PORT=3001 npm start
```

### La página no carga después de cambios
**Solución**: 
1. Guarda todos los archivos
2. Recarga la página (F5 o Ctrl+R)
3. Si persiste, detén el servidor (Ctrl+C) y vuelve a iniciarlo

## 📚 Siguientes Pasos

1. **Explora la aplicación**: Navega por todos los módulos
2. **Lee README.md**: Para entender mejor el proyecto
3. **Lee GUIA_DESARROLLADORES.md**: Para aprender a modificar y extender
4. **Haz tus primeros cambios**: Prueba modificar los datos mock

## 🎯 Objetivo del Proyecto

Crear un sistema completo que permita a la iglesia:
- Gestionar sus miembros y contactos
- Llevar control de estudios bíblicos
- Generar reportes de evangelización
- Administrar presupuestos
- Todo desde un solo lugar, de forma sencilla y moderna

---

**¿Todo listo?** ¡Ejecuta `npm start` y comienza a explorar! 🎉

Si tienes dudas, revisa los archivos README.md y GUIA_DESARROLLADORES.md para más información.
