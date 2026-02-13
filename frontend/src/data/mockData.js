// ============================================
// DATOS MOCK - SIN BASE DE DATOS
// ============================================
// Este archivo contiene todos los datos que se usarán en la aplicación.
// Los datos son fijos y no se conectan a ninguna base de datos.
// En el futuro, estos datos serán reemplazados por llamadas a la API.

// ============================================
// USUARIOS
// ============================================
export const USUARIOS = [
  {
    id: 1,
    nombre: 'Admin',
    email: 'admin@sistema.com',
    password: '1234', // Contraseña sin encriptar (solo para desarrollo)
    rol: 'admin',
    pais: null
  },
  {
    id: 2,
    nombre: 'Pastor Juan',
    email: 'pastor@iglesia.com',
    password: 'pastor123',
    rol: 'pastor',
    pais: 'República Dominicana'
  },
  {
    id: 3,
    nombre: 'María López',
    email: 'maria@miembros.com',
    password: '123456',
    rol: 'miembro',
    pais: 'República Dominicana'
  }
];

// ============================================
// MIEMBROS
// ============================================
export const MIEMBROS = [
  {
    id: 1,
    nombre: 'Juan Pérez',
    identidad: '001-1234567-8',
    pais: 'República Dominicana',
    ciudad: 'Santo Domingo',
    edad: 35,
    evangelizado_por: 'Pastor Juan',
    estado_civil: 'Casado',
    profesion: 'Ingeniero',
    comentarios: 'Muy comprometido con la obra',
    tipo_miembro: 'Comprometido',
    cargo_funcion: 'Anciano Local',
    ministerio_of: null,
    avance_audio: null
  },
  {
    id: 2,
    nombre: 'María García',
    identidad: '001-2345678-9',
    pais: 'República Dominicana',
    ciudad: 'Santiago',
    edad: 28,
    evangelizado_por: 'Pastor Juan',
    estado_civil: 'Soltera',
    profesion: 'Doctora',
    comentarios: 'Estudiante activa',
    tipo_miembro: 'Registrado',
    cargo_funcion: null,
    ministerio_of: null,
    avance_audio: 'Nivel 2 completado'
  },
  {
    id: 3,
    nombre: 'Carlos Rodríguez',
    identidad: '1234567890',
    pais: 'Colombia',
    ciudad: 'Bogotá',
    edad: 42,
    evangelizado_por: 'María García',
    estado_civil: 'Casado',
    profesion: 'Profesor',
    comentarios: 'Líder natural',
    tipo_miembro: 'Comprometido',
    cargo_funcion: 'Siervo Ministerial',
    ministerio_of: null,
    avance_audio: null
  },
  {
    id: 4,
    nombre: 'Ana Martínez',
    identidad: '001-3456789-0',
    pais: 'República Dominicana',
    ciudad: 'La Vega',
    edad: 31,
    evangelizado_por: 'Juan Pérez',
    estado_civil: 'Casada',
    profesion: 'Contadora',
    comentarios: 'Excelente progreso',
    tipo_miembro: 'Comprometido',
    cargo_funcion: 'Tesorera',
    ministerio_of: null,
    avance_audio: null
  }
];

// ============================================
// CONTACTOS
// ============================================
export const CONTACTOS = [
  {
    id: 1,
    miembro_id: 1,
    miembro_nombre: 'Juan Pérez',
    nombre: 'Pedro Sánchez',
    telefono: '+1 809-555-1234',
    pais: 'República Dominicana',
    activo: true,
    notas: 'Interesado en estudios bíblicos'
  },
  {
    id: 2,
    miembro_id: 1,
    miembro_nombre: 'Juan Pérez',
    nombre: 'Lucía Vargas',
    telefono: '+1 809-555-2345',
    pais: 'República Dominicana',
    activo: true,
    notas: 'Estudia los martes'
  },
  {
    id: 3,
    miembro_id: 2,
    miembro_nombre: 'María García',
    nombre: 'Ana López',
    telefono: '+57 300-555-5678',
    pais: 'República Dominicana',
    activo: true,
    notas: 'Muy motivada, avanza rápido'
  },
  {
    id: 4,
    miembro_id: 3,
    miembro_nombre: 'Carlos Rodríguez',
    nombre: 'Roberto Gómez',
    telefono: '+58 412-555-9876',
    pais: 'Colombia',
    activo: false,
    notas: 'Viajó al exterior'
  }
];

// ============================================
// REPORTES
// ============================================
export const REPORTES = [
  {
    id: 1,
    miembro_id: 1,
    miembro_nombre: 'Juan Pérez',
    fecha: '2025-02-01',
    tiempo_evangelizacion: 2.5,
    contactos_obtenidos: 5,
    contactos_estudian: 3,
    numero_estudios: 10,
    total_estudiantes: 8,
    pais: 'República Dominicana'
  },
  {
    id: 2,
    miembro_id: 1,
    miembro_nombre: 'Juan Pérez',
    fecha: '2025-02-08',
    tiempo_evangelizacion: 3.0,
    contactos_obtenidos: 4,
    contactos_estudian: 4,
    numero_estudios: 12,
    total_estudiantes: 10,
    pais: 'República Dominicana'
  },
  {
    id: 3,
    miembro_id: 2,
    miembro_nombre: 'María García',
    fecha: '2025-02-01',
    tiempo_evangelizacion: 1.5,
    contactos_obtenidos: 3,
    contactos_estudian: 2,
    numero_estudios: 6,
    total_estudiantes: 5,
    pais: 'República Dominicana'
  },
  {
    id: 4,
    miembro_id: 3,
    miembro_nombre: 'Carlos Rodríguez',
    fecha: '2025-02-01',
    tiempo_evangelizacion: 3.5,
    contactos_obtenidos: 6,
    contactos_estudian: 5,
    numero_estudios: 15,
    total_estudiantes: 12,
    pais: 'Colombia'
  }
];

// ============================================
// PRESUPUESTOS (ADMINISTRACIÓN)
// ============================================
export const PRESUPUESTOS = [
  {
    id: 1,
    pais: 'República Dominicana',
    mes: 'Febrero',
    año: 2025,
    tipo: 'gasto_fijo',
    concepto: 'Alquiler del salón',
    monto: 55000.00,
    moneda: 'DOP',
    tasa_cambio: 1.00,
    notas: 'Mensual'
  },
  {
    id: 2,
    pais: 'República Dominicana',
    mes: 'Febrero',
    año: 2025,
    tipo: 'gasto_fijo',
    concepto: 'Internet y servicios',
    monto: 2000.00,
    moneda: 'DOP',
    tasa_cambio: 1.00,
    notas: 'Mensual'
  },
  {
    id: 3,
    pais: 'República Dominicana',
    mes: 'Febrero',
    año: 2025,
    tipo: 'pago_misionero',
    concepto: 'Pastor Juan - Febrero',
    monto: 10000.00,
    moneda: 'DOP',
    tasa_cambio: 1.00,
    notas: 'Pago mensual'
  },
  {
    id: 4,
    pais: 'Colombia',
    mes: 'Febrero',
    año: 2025,
    tipo: 'gasto_fijo',
    concepto: 'Alquiler',
    monto: 800000.00,
    moneda: 'COP',
    tasa_cambio: 1.00,
    notas: 'Mensual'
  }
];

// ============================================
// ESTUDIOS BÍBLICOS
// ============================================
export const ESTUDIOS_BIBLICOS = [
  {
    id: 1,
    contacto_id: 1,
    contacto_nombre: 'Pedro Sánchez',
    miembro_responsable: 'Juan Pérez',
    nivel: 'Básico',
    progreso: '3/10 lecciones',
    ultima_sesion: '2025-02-10',
    proxima_sesion: '2025-02-17',
    notas: 'Muy interesado, asiste puntualmente'
  },
  {
    id: 2,
    contacto_id: 2,
    contacto_nombre: 'Lucía Vargas',
    miembro_responsable: 'Juan Pérez',
    nivel: 'Intermedio',
    progreso: '6/10 lecciones',
    ultima_sesion: '2025-02-09',
    proxima_sesion: '2025-02-16',
    notas: 'Hace muchas preguntas profundas'
  },
  {
    id: 3,
    contacto_id: 3,
    contacto_nombre: 'Ana López',
    miembro_responsable: 'María García',
    nivel: 'Básico',
    progreso: '2/10 lecciones',
    ultima_sesion: '2025-02-11',
    proxima_sesion: '2025-02-18',
    notas: 'Recién comenzó sus estudios'
  }
];

// ============================================
// ESTUDIOS BÍBLICOS SEMANALES (TIPO EXCEL)
// ============================================
export const ESTUDIOS_SEMANALES = [
  {
    id: 1,
    estudiante: "Pedro Sánchez",
    semana1: 2,
    semana2: 3,
    semana3: 2,
    semana4: 1,
    total: 8,
    meta: 12
  },
  {
    id: 2,
    estudiante: "Lucía Vargas",
    semana1: 3,
    semana2: 3,
    semana3: 4,
    semana4: 2,
    total: 12,
    meta: 12
  },
  {
    id: 3,
    estudiante: "Ana López",
    semana1: 1,
    semana2: 2,
    semana3: 1,
    semana4: 2,
    total: 6,
    meta: 8
  },
  {
    id: 4,
    estudiante: "Roberto Gómez",
    semana1: 0,
    semana2: 1,
    semana3: 1,
    semana4: 0,
    total: 2,
    meta: 8
  }
];

// ============================================
// ESTADÍSTICAS POR PAÍS
// ============================================
export const ESTADISTICAS_PAISES = [
  {
    id: 1,
    nombre: "República Dominicana",
    miembros: 25,
    estudios: 45,
    reportes: 18,
    color: "#2196F3"
  },
  {
    id: 2,
    nombre: "Colombia",
    miembros: 18,
    estudios: 32,
    reportes: 14,
    color: "#4CAF50"
  },
  {
    id: 3,
    nombre: "Venezuela",
    miembros: 12,
    estudios: 20,
    reportes: 9,
    color: "#FF9800"
  },
  {
    id: 4,
    nombre: "México",
    miembros: 8,
    estudios: 15,
    reportes: 6,
    color: "#9C27B0"
  }
];

// ============================================
// FUNCIONES HELPER
// ============================================

// Generar nuevo ID único
export const generateId = (array) => {
  if (!array || array.length === 0) return 1;
  return Math.max(...array.map(item => item.id)) + 1;
};

// Obtener miembro por ID
export const getMiembroById = (id) => {
  return MIEMBROS.find(m => m.id === parseInt(id));
};

// Filtrar miembros por país
export const getMiembrosByPais = (pais) => {
  return MIEMBROS.filter(m => m.pais === pais);
};

// Obtener estadísticas de miembros
export const getEstadisticasMiembros = () => {
  return {
    total: MIEMBROS.length,
    comprometidos: MIEMBROS.filter(m => m.tipo_miembro === 'Comprometido').length,
    registrados: MIEMBROS.filter(m => m.tipo_miembro === 'Registrado').length,
    voluntarios: MIEMBROS.filter(m => m.tipo_miembro === 'Voluntario').length
  };
};

// Obtener resumen financiero
export const getResumenFinanciero = () => {
  const gastosFijos = PRESUPUESTOS
    .filter(p => p.tipo === 'gasto_fijo')
    .reduce((sum, p) => sum + p.monto * p.tasa_cambio, 0);
  
  const pagosMisioneros = PRESUPUESTOS
    .filter(p => p.tipo === 'pago_misionero')
    .reduce((sum, p) => sum + p.monto * p.tasa_cambio, 0);
  
  const otrosGastos = PRESUPUESTOS
    .filter(p => p.tipo === 'otro_gasto')
    .reduce((sum, p) => sum + p.monto * p.tasa_cambio, 0);
  
  return {
    gastosFijos,
    pagosMisioneros,
    otrosGastos,
    totalMensual: gastosFijos + pagosMisioneros + otrosGastos
  };
};
