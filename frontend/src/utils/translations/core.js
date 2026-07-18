// ============================================
// TRADUCCIONES DEL SISTEMA (es / en)
// Se consumen via useIdioma() -> t('clave')
// ============================================

const core = {
  es: {
    // Header
    panelControl: "Panel de Control",
    cerrarSesion: "Cerrar Sesión",
    sistemaGestion: "Sistema de Gestión",

    // Roles
    administrador: "Administrador",
    pastor: "Pastor",
    misionero: "Misionero",

    // Módulos
    miembros: "Miembros",
    miembrosDesc: "Registros, seguimiento y visitas.",
    estudios: "Estudios",
    estudiosDesc: "Lista de estudiantes activos.",
    estudiosBiblicos: "Estudios Bíblicos",
    estudiosBiblicosDesc: "Control y seguimiento semanal.",
    reportes: "Reportes",
    reportesDesc: "Resultados y metas cumplidas.",
    contactos: "Contactos",
    contactosDesc: "Nuevos, pendientes y seguimiento.",
    administracion: "Administración",
    administracionDesc: "Presupuesto y control financiero.",
    estadisticas: "Estadísticas",
    estadisticasDesc: "Gráficos y reportes por país.",
    configuracion: "Configuración",
    configuracionDesc: "Usuarios, roles y permisos.",

    // Estados
    enConstruccion: "🚧 En construcción - Próximamente",

    // Botones
    volver: "Volver",
    guardar: "Guardar",
    cancelar: "Cancelar",
    editar: "Editar",
    eliminar: "Eliminar",
    nuevo: "Nuevo",
    buscar: "Buscar",

    // Mensajes
    cargando: "Cargando...",
    sinDatos: "Sin datos disponibles",
    error: "Error al cargar datos",
    exitoGuardar: "Guardado exitosamente",
    exitoEliminar: "Eliminado exitosamente",
    confirmarEliminar: "¿Está seguro de eliminar?",
    sesionCerrada: "Sesión cerrada",

    // Notificaciones
    notificaciones: "Notificaciones",
    marcarTodasLeidas: "Marcar todas como leídas",
    sinNotificaciones: "No hay notificaciones",

    // Login
    bienvenido: "Bienvenido",
    ingresaCredenciales: "Ingresa tus credenciales para continuar",
    correo: "Correo Electrónico",
    contrasena: "Contraseña",
    iniciarSesion: "Iniciar Sesión",
    verificando: "Verificando...",
    olvidoContrasena: "¿Olvidaste tu contraseña?",
    camposObligatorios: "Por favor completa todos los campos.",
    errorLogin: "Error al iniciar sesión. Intenta de nuevo.",
    bienvenidoToast: "¡Bienvenido!",
    versiculo: "\"Todo lo puedo en Cristo que me fortalece.\"",
    versiculoRef: "— Filipenses 4:13",

    // Configuración
    gestionUsuariosRolesPermisos: "Gestión de usuarios, roles y permisos",
    usuariosSistema: "Usuarios del Sistema",
    nuevoUsuario: "Nuevo Usuario",
    usuariosTab: "Usuarios",
    rolesTab: "Roles",
    permisosDelRol: "Permisos del rol",
    permisosDe: "Permisos de",

    // Idioma
    menu: "Menú",
    idioma: "Idioma",
    idiomaTab: "Idioma",
    idiomaTitulo: "Idioma del Sistema",
    idiomaDesc: "Elige el idioma en el que se muestra la interfaz. El cambio es inmediato y se recuerda en este dispositivo.",
    idiomaCambiado: "Idioma cambiado a Español",
    español: "Español",
    ingles: "Inglés",

    // Lista de estudios (mock)
    el_estudiante: "Estudiante",
    el_responsable: "Responsable",
    el_nivel: "Nivel",
    el_progreso: "Progreso",
    el_ultimaSesion: "Última Sesión",
    el_proximaSesion: "Próxima Sesión",
    el_notas: "Notas",

    // Footer
    footer: "Iglesia Emanuel • Sistema de Gestión"
  },

  en: {
    // Header
    panelControl: "Control Panel",
    cerrarSesion: "Sign Out",
    sistemaGestion: "Management System",

    // Roles
    administrador: "Administrator",
    pastor: "Pastor",
    misionero: "Missionary",

    // Módulos
    miembros: "Members",
    miembrosDesc: "Records, follow-up & visits.",
    estudios: "Studies",
    estudiosDesc: "Active students list.",
    estudiosBiblicos: "Bible Studies",
    estudiosBiblicosDesc: "Weekly control & tracking.",
    reportes: "Reports",
    reportesDesc: "Results & goals achieved.",
    contactos: "Contacts",
    contactosDesc: "New & follow-up.",
    administracion: "Administration",
    administracionDesc: "Budget & financial control.",
    estadisticas: "Statistics",
    estadisticasDesc: "Charts & reports by country.",
    configuracion: "Settings",
    configuracionDesc: "Users, roles & permissions.",

    // Estados
    enConstruccion: "🚧 Under construction - Coming soon",

    // Botones
    volver: "Back",
    guardar: "Save",
    cancelar: "Cancel",
    editar: "Edit",
    eliminar: "Delete",
    nuevo: "New",
    buscar: "Search",

    // Mensajes
    cargando: "Loading...",
    sinDatos: "No data available",
    error: "Error loading data",
    exitoGuardar: "Saved successfully",
    exitoEliminar: "Deleted successfully",
    confirmarEliminar: "Are you sure you want to delete?",
    sesionCerrada: "Session closed",

    // Notificaciones
    notificaciones: "Notifications",
    marcarTodasLeidas: "Mark all as read",
    sinNotificaciones: "No notifications",

    // Login
    bienvenido: "Welcome",
    ingresaCredenciales: "Enter your credentials to continue",
    correo: "Email Address",
    contrasena: "Password",
    iniciarSesion: "Sign In",
    verificando: "Verifying...",
    olvidoContrasena: "Forgot your password?",
    camposObligatorios: "Please fill in all fields.",
    errorLogin: "Login error. Please try again.",
    bienvenidoToast: "Welcome!",
    versiculo: "\"I can do all things through Christ who strengthens me.\"",
    versiculoRef: "— Philippians 4:13",

    // Configuración
    gestionUsuariosRolesPermisos: "User, role and permission management",
    usuariosSistema: "System Users",
    nuevoUsuario: "New User",
    usuariosTab: "Users",
    rolesTab: "Roles",
    permisosDelRol: "Permissions of role",
    permisosDe: "Permissions of",

    // Idioma
    menu: "Menu",
    idioma: "Language",
    idiomaTab: "Language",
    idiomaTitulo: "System Language",
    idiomaDesc: "Choose the language of the interface. The change is instant and remembered on this device.",
    idiomaCambiado: "Language changed to English",
    español: "Spanish",
    ingles: "English",

    // Lista de estudios (mock)
    el_estudiante: "Student",
    el_responsable: "Responsible",
    el_nivel: "Level",
    el_progreso: "Progress",
    el_ultimaSesion: "Last Session",
    el_proximaSesion: "Next Session",
    el_notas: "Notes",

    // Footer
    footer: "Emanuel Church • Management System"
  }
};

export default core;
