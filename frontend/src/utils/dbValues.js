// ============================================
// VALORES DE BD → ETIQUETA POR IDIOMA
// Solo para MOSTRAR. El valor que viaja a la API
// siempre es el original de la BD, nunca la etiqueta.
// La búsqueda es case-insensitive (hay variantes tipo "Caja"/"caja").
// ============================================

const entradas = [
  // Roles (tabla roles.nombre)
  { valores: ['admin', 'administrador'], es: 'Administrador', en: 'Administrator' },
  { valores: ['pastor'], es: 'Pastor', en: 'Pastor' },
  { valores: ['miembro', 'member'], es: 'Miembro', en: 'Member' },
  { valores: ['tesorero', 'treasurer'], es: 'Tesorero', en: 'Treasurer' },
  { valores: ['misionero', 'missionary'], es: 'Misionero', en: 'Missionary' },

  // miembros.tipo_miembro
  { valores: ['comprometido', 'committed'], es: 'Comprometido', en: 'Committed' },
  { valores: ['registrado', 'registered'], es: 'Registrado', en: 'Registered' },
  { valores: ['voluntario', 'volunteer'], es: 'Voluntario', en: 'Volunteer' },

  // miembros.estado_civil (la BD tiene valores en inglés y podría tener en español)
  { valores: ['soltero', 'soltera', 'single'], es: 'Soltero/a', en: 'Single' },
  { valores: ['casado', 'casada', 'married'], es: 'Casado/a', en: 'Married' },
  { valores: ['divorciado', 'divorciada', 'divorced'], es: 'Divorciado/a', en: 'Divorced' },
  { valores: ['viudo', 'viuda', 'widowed'], es: 'Viudo/a', en: 'Widowed' },
  { valores: ['union libre', 'unión libre', 'free union'], es: 'Unión libre', en: 'Free union' },

  // Caja / Banco (ingresos.donde_ingresa, traslados.de/a, saldos)
  { valores: ['caja', 'cash'], es: 'Caja', en: 'Cash' },
  { valores: ['banco', 'bank'], es: 'Banco', en: 'Bank' },

  // estudios_diarios.tipo
  { valores: ['presencial', 'in-person'], es: 'Presencial', en: 'In-person' },
  { valores: ['virtual'], es: 'Virtual', en: 'Virtual' },

  // ingresos.tipo
  { valores: ['diezmo', 'tithe'], es: 'Diezmo', en: 'Tithe' },
  { valores: ['ofrenda', 'offering'], es: 'Ofrenda', en: 'Offering' },
  { valores: ['donacion', 'donación', 'donation'], es: 'Donación', en: 'Donation' },
  { valores: ['cooperacion', 'cooperación', 'cooperation'], es: 'Cooperación', en: 'Cooperation' },
  { valores: ['misiones', 'missions'], es: 'Misiones', en: 'Missions' },
  { valores: ['rc-1-recibo de caja'], es: 'RC-1-Recibo de caja', en: 'RC-1-Cash receipt' },
  { valores: ['rc-2-advance'], es: 'RC-2-Avance', en: 'RC-2-Advance' },
  { valores: ['rc-3-other'], es: 'RC-3-Otro', en: 'RC-3-Other' },

  // presupuestos/gastos_reales.tipo_gasto (códigos snake_case)
  { valores: ['alimentacion'], es: 'Alimentación', en: 'Food' },
  { valores: ['alquiler_local'], es: 'Alquiler de local', en: 'Venue rent' },
  { valores: ['comunicaciones'], es: 'Comunicaciones', en: 'Communications' },
  { valores: ['materiales_evangelizacion'], es: 'Materiales de evangelización', en: 'Evangelism materials' },
  { valores: ['otros_gastos'], es: 'Otros gastos', en: 'Other expenses' },
  { valores: ['servicios_publicos'], es: 'Servicios públicos', en: 'Utilities' },
  { valores: ['transporte'], es: 'Transporte', en: 'Transportation' },
  { valores: ['presupuesto_recibido'], es: 'Presupuesto recibido', en: 'Budget received' },

  // Catálogo de permisos / módulos (la BD los tiene en inglés; /auth/mis-permisos
  // usa códigos snake_case en español que las páginas normalizan con _ → espacio)
  { valores: ['bible studies', 'estudios biblicos', 'estudios bíblicos'], es: 'Estudios Bíblicos', en: 'Bible Studies' },
  { valores: ['reports', 'reportes'], es: 'Reportes', en: 'Reports' },
  { valores: ['members', 'miembros'], es: 'Miembros', en: 'Members' },
  { valores: ['contacts', 'contactos'], es: 'Contactos', en: 'Contacts' },
  { valores: ['administration', 'administracion', 'administración'], es: 'Administración', en: 'Administration' },
  { valores: ['statistics', 'estadisticas', 'estadísticas'], es: 'Estadísticas', en: 'Statistics' },
  { valores: ['settings', 'configuracion', 'configuración'], es: 'Configuración', en: 'Settings' },

  // Niveles de estudio
  { valores: ['basico', 'básico', 'basic'], es: 'Básico', en: 'Basic' },
  { valores: ['intermedio', 'intermediate'], es: 'Intermedio', en: 'Intermediate' },
  { valores: ['avanzado', 'advanced'], es: 'Avanzado', en: 'Advanced' },

  // Estados genéricos
  { valores: ['activo', 'active'], es: 'Activo', en: 'Active' },
  { valores: ['inactivo', 'inactive'], es: 'Inactivo', en: 'Inactive' },
  { valores: ['pendiente', 'pending'], es: 'Pendiente', en: 'Pending' },
  { valores: ['aprobado', 'aprobada', 'approved'], es: 'Aprobado', en: 'Approved' },
  { valores: ['rechazado', 'rechazada', 'rejected'], es: 'Rechazado', en: 'Rejected' },
  { valores: ['completado', 'completada', 'completed'], es: 'Completado', en: 'Completed' },
  { valores: ['en seguimiento', 'seguimiento', 'follow-up'], es: 'En seguimiento', en: 'Follow-up' },
  { valores: ['nuevo', 'nueva', 'new'], es: 'Nuevo', en: 'New' },
];

// Índice: valor en minúsculas → { es, en }
export const dbValueMap = {};
for (const entrada of entradas) {
  for (const v of entrada.valores) {
    dbValueMap[v] = entrada;
  }
}

export default dbValueMap;
