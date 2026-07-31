// Traducciones de la pagina estudiosBiblicos — las llena su agente/desarrollador
// Formato: { es: { clave: "..." }, en: { clave: "..." } }
const estudiosBiblicos = {
  es: {
    // Header / navegación
    eb_cambiarRegion: "Cambiar Región",
    eb_seleccionaContinente: "Selecciona un Continente",
    eb_countries: "países",
    eb_seleccionaPais: "Selecciona un País",
    eb_nuevoPaisCard: "Nuevo País",
    eb_seleccionaMes: "Selecciona un Mes",
    eb_mesActual: "Mes Actual",
    eb_noDisponible: "No Disponible",

    // Tabs
    eb_resumenTab: "Resumen",
    eb_porMisioneroTab: "Por Misionero",
    eb_nuevosEstudiantesTab: "Nuevos Estudiantes",

    // Vista resumen
    eb_reporteControl: "Reporte de Control",
    eb_nombreCol: "NOMBRE",
    eb_totalCol: "TOTAL",
    eb_accionesCol: "ACCIONES",
    eb_totalDiario: "TOTAL DIARIO",
    eb_agregarMisionero: "Agregar Misionero",
    eb_evangelismoTitulo: "Evangelismo",
    eb_totalHorasCol: "TOTAL HORAS",
    eb_virtualCol: "VIRTUAL",
    eb_presencialCol: "PRESENCIAL",
    eb_dijeronSiCol: "DIJERON SÍ",
    eb_contactosCol: "CONTACTOS",

    // Vista por misionero (cards)
    eb_estudiantesLabel: "estudiantes",
    eb_estudiosLabel: "Estudios",
    eb_horasLabel: "Horas",

    // Vista nuevos estudiantes
    eb_dijeronSiHeading: "Dijeron Sí",
    eb_nuevosContactosHeading: "Nuevos Contactos",

    // Detalle misionero — tabla de estudiantes
    eb_delCol: "ELIM",
    eb_telefonoCol: "N.º TELÉFONO",
    eb_paisCol: "PAÍS",
    eb_capCol: "Cap",
    eb_hrCol: "Hr",
    eb_seleccionar: "Seleccionar",
    eb_totalGeneralEstudios: "TOTAL GENERAL DE ESTUDIOS",
    eb_agregarEstudiante: "Agregar Estudiante",
    eb_noAgregarMesPasado: "No se pueden agregar estudiantes a meses pasados",

    // Otras actividades / evangelismo detalle
    eb_otrasActividades: "Otras Actividades",
    eb_actividadCol: "ACTIVIDAD",
    eb_ubicacionCol: "Lugar",
    eb_hrsCol: "Hrs",
    eb_evangelismoVirtual: "EVANGELISMO VIRTUAL",
    eb_evangelismoPresencial: "EVANGELISMO PRESENCIAL",

    // Placeholders
    eb_placeholderTelefonoEjemplo: "ej.: +1 809 000 0000",
    eb_placeholderTelefonoSimple: "+1 809 000 0000",
    eb_placeholderNombreSimple: "Nombre",
    eb_placeholderNombreRequerido: "Nombre *",
    eb_placeholderTelefonoModal: "N.º de teléfono (ej.: +1 809 000 0000)",
    eb_placeholderNombreMisionero: "Nombre del misionero",
    eb_placeholderEjemploPais: "Ej.: Panamá",
    eb_seleccionarPais: "Seleccionar país",

    // Modal alerta
    eb_alertaTituloNoEliminar: "No se Puede Eliminar el Estudiante",
    eb_alertaMensajeNoEliminar: "Este estudiante tiene estudios registrados y no puede eliminarse. Solo se pueden quitar estudiantes sin horas registradas.",
    eb_entendido: "Entendido",

    // Modales
    eb_nuevoEstudianteTitulo: "Nuevo Estudiante",
    eb_nuevoMisioneroTitulo: "Nuevo Misionero",
    eb_nombreNuevoPais: "Nombre del nuevo país:",
    eb_aceptar: "Aceptar",
    eb_cerrar: "Cerrar",

    // Estadísticas
    eb_estadisticasTitulo: "Estadísticas",
    eb_totalEstudiosLabel: "Total de Estudios",
    eb_totalHorasLabel: "Total de Horas",
    eb_totalEstudiantesLabel: "Total de Estudiantes",
    eb_misionerosActivosLabel: "Misioneros Activos",
    eb_porMisioneroLabel: "Por Misionero:",
    eb_misioneroCol: "Misionero",
    eb_estudiantesCol: "Estudiantes",
    eb_promedioCol: "Promedio",

    // Toasts / confirmaciones
    eb_errorCargarDatos: "Error al cargar datos del sistema",
    eb_completeNombre: "Complete al menos el nombre",
    eb_noAgregarMesPasadoToast: "No se pueden agregar estudiantes a un mes pasado",
    eb_estudianteAgregado: "✅ Estudiante agregado",
    eb_errorGuardarEstudiante: "Error al guardar estudiante",
    eb_confirmarEliminarEstudiante: "¿Está seguro de eliminar este estudiante?",
    eb_estudianteEliminado: "Estudiante eliminado",
    eb_errorGuardarEstudio: "Error al guardar el estudio",
    eb_nombrePaisRequerido: "El nombre del país es requerido",
    eb_seleccionaContinentePrimero: "Selecciona un continente primero",
    eb_paisYaExiste: "Este país ya existe en este continente",
    eb_paisCreado: "País creado exitosamente",
    eb_errorCrearPais: "Error al crear país: ",
    eb_confirmarEliminarPais: "¿Eliminar este país?",
    eb_paisEliminado: "✅ País eliminado",
    eb_errorEliminarPais: "Error al eliminar país",
    eb_ingreseNombre: "Ingrese un nombre",
    eb_misioneroAgregado: "✅ Misionero agregado",
    eb_confirmarEliminarMisionero: "¿Eliminar este misionero?",
    eb_misioneroEliminado: "Misionero eliminado",
    eb_estudianteGuardado: "✅ Estudiante guardado",

    // Meses
    eb_mes_ENERO: "Enero",
    eb_mes_FEBRERO: "Febrero",
    eb_mes_MARZO: "Marzo",
    eb_mes_ABRIL: "Abril",
    eb_mes_MAYO: "Mayo",
    eb_mes_JUNIO: "Junio",
    eb_mes_JULIO: "Julio",
    eb_mes_AGOSTO: "Agosto",
    eb_mes_SEPTIEMBRE: "Septiembre",
    eb_mes_OCTUBRE: "Octubre",
    eb_mes_NOVIEMBRE: "Noviembre",
    eb_mes_DICIEMBRE: "Diciembre",

    // Días de la semana (abreviados)
    eb_dow_SUN: "DOM",
    eb_dow_MON: "LUN",
    eb_dow_TUE: "MAR",
    eb_dow_WED: "MIÉ",
    eb_dow_THU: "JUE",
    eb_dow_FRI: "VIE",
    eb_dow_SAT: "SÁB",
  },

  en: {
    // Header / navegación
    eb_cambiarRegion: "Change Region",
    eb_seleccionaContinente: "Select a Continent",
    eb_countries: "countries",
    eb_seleccionaPais: "Select a Country",
    eb_nuevoPaisCard: "New Country",
    eb_seleccionaMes: "Select a Month",
    eb_mesActual: "Current Month",
    eb_noDisponible: "Not Available",

    // Tabs
    eb_resumenTab: "Summary",
    eb_porMisioneroTab: "By Missionary",
    eb_nuevosEstudiantesTab: "New Students",

    // Vista resumen
    eb_reporteControl: "Report Control",
    eb_nombreCol: "NAME",
    eb_totalCol: "TOTAL",
    eb_accionesCol: "ACTIONS",
    eb_totalDiario: "DAILY TOTAL",
    eb_agregarMisionero: "Add Missionary",
    eb_evangelismoTitulo: "Evangelism",
    eb_totalHorasCol: "TOTAL HOURS",
    eb_virtualCol: "VIRTUAL",
    eb_presencialCol: "IN-PERSON",
    eb_dijeronSiCol: "SAID YES",
    eb_contactosCol: "CONTACTS",

    // Vista por misionero (cards)
    eb_estudiantesLabel: "students",
    eb_estudiosLabel: "Studies",
    eb_horasLabel: "Hours",

    // Vista nuevos estudiantes
    eb_dijeronSiHeading: "Said Yes",
    eb_nuevosContactosHeading: "New Contacts",

    // Detalle misionero — tabla de estudiantes
    eb_delCol: "DEL",
    eb_telefonoCol: "PHONE No.",
    eb_paisCol: "COUNTRY",
    eb_capCol: "Cap",
    eb_hrCol: "Hr",
    eb_seleccionar: "Select",
    eb_totalGeneralEstudios: "TOTAL GENERAL STUDIES",
    eb_agregarEstudiante: "Add Student",
    eb_noAgregarMesPasado: "Cannot add students to past months",

    // Otras actividades / evangelismo detalle
    eb_otrasActividades: "Other Activities",
    eb_actividadCol: "ACTIVITY",
    eb_ubicacionCol: "Location",
    eb_hrsCol: "Hrs",
    eb_evangelismoVirtual: "VIRTUAL EVANGELISM",
    eb_evangelismoPresencial: "IN-PERSON EVANGELISM",

    // Placeholders
    eb_placeholderTelefonoEjemplo: "e.g. +1 809 000 0000",
    eb_placeholderTelefonoSimple: "+1 809 000 0000",
    eb_placeholderNombreSimple: "Name",
    eb_placeholderNombreRequerido: "Name *",
    eb_placeholderTelefonoModal: "Phone No. (e.g. +1 809 000 0000)",
    eb_placeholderNombreMisionero: "Missionary name",
    eb_placeholderEjemploPais: "E.g.: Panama",
    eb_seleccionarPais: "Select country",

    // Modal alerta
    eb_alertaTituloNoEliminar: "Cannot Delete Student",
    eb_alertaMensajeNoEliminar: "This student has study records and cannot be deleted. Only students with no registered hours can be removed.",
    eb_entendido: "Understood",

    // Modales
    eb_nuevoEstudianteTitulo: "New Student",
    eb_nuevoMisioneroTitulo: "New Missionary",
    eb_nombreNuevoPais: "Name of new country:",
    eb_aceptar: "Accept",
    eb_cerrar: "Close",

    // Estadísticas
    eb_estadisticasTitulo: "Statistics",
    eb_totalEstudiosLabel: "Total Studies",
    eb_totalHorasLabel: "Total Hours",
    eb_totalEstudiantesLabel: "Total Students",
    eb_misionerosActivosLabel: "Active Missionaries",
    eb_porMisioneroLabel: "By Missionary:",
    eb_misioneroCol: "Missionary",
    eb_estudiantesCol: "Students",
    eb_promedioCol: "Average",

    // Toasts / confirmaciones
    eb_errorCargarDatos: "Error loading system data",
    eb_completeNombre: "Complete at least the name",
    eb_noAgregarMesPasadoToast: "Cannot add students to a past month",
    eb_estudianteAgregado: "✅ Student added",
    eb_errorGuardarEstudiante: "Error saving student",
    eb_confirmarEliminarEstudiante: "Are you sure you want to delete this student?",
    eb_estudianteEliminado: "Student removed",
    eb_errorGuardarEstudio: "Error saving the study",
    eb_nombrePaisRequerido: "Country name is required",
    eb_seleccionaContinentePrimero: "Select a continent first",
    eb_paisYaExiste: "This country already exists in this continent",
    eb_paisCreado: "Country created successfully",
    eb_errorCrearPais: "Error creating country: ",
    eb_confirmarEliminarPais: "Delete this country?",
    eb_paisEliminado: "✅ Country deleted",
    eb_errorEliminarPais: "Error deleting country",
    eb_ingreseNombre: "Enter a name",
    eb_misioneroAgregado: "✅ Missionary added",
    eb_confirmarEliminarMisionero: "Delete this missionary?",
    eb_misioneroEliminado: "Missionary removed",
    eb_estudianteGuardado: "✅ Student saved",

    // Meses
    eb_mes_ENERO: "January",
    eb_mes_FEBRERO: "February",
    eb_mes_MARZO: "March",
    eb_mes_ABRIL: "April",
    eb_mes_MAYO: "May",
    eb_mes_JUNIO: "June",
    eb_mes_JULIO: "July",
    eb_mes_AGOSTO: "August",
    eb_mes_SEPTIEMBRE: "September",
    eb_mes_OCTUBRE: "October",
    eb_mes_NOVIEMBRE: "November",
    eb_mes_DICIEMBRE: "December",

    // Días de la semana (abreviados)
    eb_dow_SUN: "SUN",
    eb_dow_MON: "MON",
    eb_dow_TUE: "TUE",
    eb_dow_WED: "WED",
    eb_dow_THU: "THU",
    eb_dow_FRI: "FRI",
    eb_dow_SAT: "SAT",
  }
};

export default estudiosBiblicos;
