// reportesHelper.js
// Funciones auxiliares para calcular reportes desde datos de Estudios Bíblicos

/**
 * Obtener datos de localStorage
 */
export const obtenerDatosEstudiosBiblicos = () => {
  try {
    // Por ahora retornamos estructura vacía
    // Cuando Estudios Bíblicos guarde en localStorage, esto funcionará automáticamente
    return {
      estudiantes: JSON.parse(localStorage.getItem('estudiantes') || '{}'),
      evangelismoData: JSON.parse(localStorage.getItem('evangelismoData') || '{}'),
      estudiantesQueDigeronSi: JSON.parse(localStorage.getItem('estudiantesQueDigeronSi') || '{}'),
      nuevosContactos: JSON.parse(localStorage.getItem('nuevosContactos') || '{}')
    };
  } catch (error) {
    console.error('Error al obtener datos:', error);
    return {
      estudiantes: {},
      evangelismoData: {},
      estudiantesQueDigeronSi: {},
      nuevosContactos: {}
    };
  }
};

/**
 * Calcular reporte para un país y período específico
 */
export const calcularReporte = (continenteId, paisId, mes, tipo, semana = null) => {
  const datos = obtenerDatosEstudiosBiblicos();
  const clave = `${continenteId}-${paisId}-${mes}`;
  
  // Determinar rango de días
  let diasRango = [];
  if (tipo === 'semanal' && semana) {
    // Semana 1: días 1-7, Semana 2: días 8-14, etc.
    const inicio = (semana - 1) * 7 + 1;
    const fin = Math.min(semana * 7, 31);
    diasRango = Array.from({ length: fin - inicio + 1 }, (_, i) => inicio + i);
  } else {
    // Mensual: todos los días del mes
    diasRango = Array.from({ length: 31 }, (_, i) => i + 1);
  }
  
  // Inicializar contadores
  let estudiantesActuales = 0;
  let evangelismoOnline = 0;
  let evangelismoPresencial = 0;
  let numeroEstudios = 0;
  let nuevosContactos = 0;
  let contactosEstudian = 0;
  
  // Obtener datos de la clave
  const estudiantesClave = datos.estudiantes[clave] || {};
  const evangelismoClave = datos.evangelismoData[clave] || {};
  const dijeronSiClave = datos.estudiantesQueDigeronSi[clave] || {};
  const contactosClave = datos.nuevosContactos[clave] || {};
  
  // Contar estudiantes únicos
  const estudiantesUnicos = new Set();
  Object.values(estudiantesClave).forEach(misioneroEstudiantes => {
    if (Array.isArray(misioneroEstudiantes)) {
      misioneroEstudiantes.forEach(est => {
        estudiantesUnicos.add(est.id);
      });
    }
  });
  estudiantesActuales = estudiantesUnicos.size;
  
  // Calcular evangelismo y estudios por misionero
  Object.keys(evangelismoClave).forEach(misioneroId => {
    const evang = evangelismoClave[misioneroId] || {};
    const estudiantesMisionero = estudiantesClave[misioneroId] || [];
    
    diasRango.forEach(dia => {
      // Evangelismo
      evangelismoOnline += parseInt(evang.virtual?.[dia]?.horas || 0);
      evangelismoPresencial += parseInt(evang.presencial?.[dia]?.horas || 0);
      
      // Estudios (contar capítulos llenos)
      if (Array.isArray(estudiantesMisionero)) {
        estudiantesMisionero.forEach(est => {
          if (est.estudios?.[dia]?.capitulo && est.estudios[dia].capitulo.trim() !== "") {
            numeroEstudios++;
          }
        });
      }
    });
  });
  
  // Nuevos contactos y dijeron sí
  Object.keys(contactosClave).forEach(misioneroId => {
    const contactosMisionero = contactosClave[misioneroId] || {};
    const dijeronSiMisionero = dijeronSiClave[misioneroId] || {};
    
    diasRango.forEach(dia => {
      nuevosContactos += parseInt(contactosMisionero[dia] || 0);
      contactosEstudian += parseInt(dijeronSiMisionero[dia] || 0);
    });
  });
  
  return {
    estudiantesActuales,
    evangelismoOnline,
    evangelismoPresencial,
    numeroEstudios,
    nuevosContactos,
    contactosEstudian,
    // Datos futuros (en 0)
    hastRomanos4: 0,
    terminadoRomanos8: 0,
    terminado4Leyes: 0,
    probabilidadMiembro: 0,
    ovejasPotenciales: 0
  };
};

/**
 * Obtener datos históricos para gráficos
 */
export const obtenerDatosHistoricos = (continenteId, paisId, meses) => {
  return meses.map(mes => {
    const reporte = calcularReporte(continenteId, paisId, mes, 'mensual');
    return {
      mes,
      ...reporte
    };
  });
};

/**
 * Generar datos de ejemplo (fallback si no hay datos reales)
 */
export const generarDatosEjemplo = () => {
  return {
    estudiantesActuales: 122,
    evangelismoOnline: 8,
    evangelismoPresencial: 10,
    numeroEstudios: 147,
    nuevosContactos: 696,
    contactosEstudian: 19,
    hastRomanos4: 0,
    terminadoRomanos8: 0,
    terminado4Leyes: 0,
    probabilidadMiembro: 0,
    ovejasPotenciales: 0
  };
};

/**
 * Verificar si hay datos disponibles
 */
export const hayDatosDisponibles = (continenteId, paisId, mes) => {
  const datos = obtenerDatosEstudiosBiblicos();
  const clave = `${continenteId}-${paisId}-${mes}`;
  
  return !!(
    datos.estudiantes[clave] || 
    datos.evangelismoData[clave] || 
    datos.estudiantesQueDigeronSi[clave] || 
    datos.nuevosContactos[clave]
  );
};
