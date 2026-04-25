import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaPlus, FaTrash, FaPrint, FaSave, FaTimes, FaUser, FaCalendarAlt, FaBook, FaChartBar, FaGlobe, FaChartLine, FaUserPlus } from "react-icons/fa";
import toast from 'react-hot-toast';

// 
import contactosService from '../services/ContactosService';
import miembrosService from '../services/MiembrosService';
import estudiosService from '../services/EstudiosService';
import administracionService from '../services/AdministracionService';

export default function EstudiosBiblicos() {
  const navigate = useNavigate();
  
  const [continenteSeleccionado, setContinenteSeleccionado] = useState(null);
  const [paisSeleccionado, setPaisSeleccionado] = useState(null);
  const [mesSeleccionado, setMesSeleccionado] = useState(null);
  const [misioneroSeleccionado, setMisioneroSeleccionado] = useState(null);
  const [vistaActual, setVistaActual] = useState("resumen");
  
  const [mostrandoModalEstudiante, setMostrandoModalEstudiante] = useState(false);
  const [mostrandoModalMisionero, setMostrandoModalMisionero] = useState(false);
  const [mostrandoEstadisticas, setMostrandoEstadisticas] = useState(false);
  const [mostrandoPromptContinente, setMostrandoPromptContinente] = useState(false);
  const [mostrandoPromptPais, setMostrandoPromptPais] = useState(false);
  
  const [fechaActual] = useState(new Date());
  const mesActualNombre = fechaActual.toLocaleDateString('es-ES', { month: 'long' }).toUpperCase();
  const añoActual = fechaActual.getFullYear();
  
  //
const [cargandoDatos, setCargandoDatos] = useState(false);

 const [continentes, setContinentes] = useState([]);
  
  const meses = [
    "ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO",
    "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"
  ];
  
 const [misioneros, setMisioneros] = useState([]);
  
  const [datosEstudios, setDatosEstudios] = useState({});
  const [estudiantes, setEstudiantes] = useState({});
  const [evangelismoData, setEvangelismoData] = useState({});
  const [estudiantesQueDigeronSi, setEstudiantesQueDigeronSi] = useState({});
  const [nuevosContactos, setNuevosContactos] = useState({});
  
  const [nuevoEstudiante, setNuevoEstudiante] = useState({
    numero: "",
    nombre: "",
    pais: ""
  });
  const [nuevoMisionero, setNuevoMisionero] = useState("");
  const [nuevoNombreContinente, setNuevoNombreContinente] = useState("");
  const [nuevoNombrePais, setNuevoNombrePais] = useState("");
  const [continenteParaPais, setContinenteParaPais] = useState(null);
  
  // ============================================
// ✅ CARGAR DATOS INICIALES DE LA API
// ============================================
useEffect(() => {
  cargarDatosIniciales();
}, []);

const cargarDatosIniciales = async () => {
  try {
    setCargandoDatos(true);
    
    // Cargar continentes desde la BD
    const continentesData = await administracionService.getAllContinentes();
    
    // Cargar países desde la API
    const paisesData = await administracionService.getAllPaises();
    
    // Agrupar países por continente
    const continentesConPaises = continentesData.map(cont => ({
      id: cont.id,
      nombre: cont.nombre,
      paises: paisesData.filter(p => p.continente === cont.nombre)
    }));
    
    setContinentes(continentesConPaises);
    
// Cargar miembros COMPROMETIDOS (sin filtro de país todavía)
    const miembrosData = await miembrosService.getAll({ tipo_miembro: 'Comprometido' });
    setMisioneros(miembrosData); 
    
  } catch (error) {
    console.error('Error al cargar datos iniciales:', error);
    toast.error('Error al cargar datos del sistema');
  } finally {
    setCargandoDatos(false);
  }
};
// ============================================
// ✅ GUARDAR DATOS EN LA API
// ============================================
const guardarTodosLosDatos = async () => {
  if (!continenteSeleccionado || !paisSeleccionado || !mesSeleccionado) {
    toast.error('Selecciona continente, país y mes primero');
    return;
  }
  
  try {
    setCargandoDatos(true);
    const clave = obtenerClave(continenteSeleccionado, paisSeleccionado, mesSeleccionado);
    
    const continente = continentes.find(c => c.id === continenteSeleccionado);
    const pais = continente?.paises.find(p => p.id === paisSeleccionado);
    
    if (!pais) {
      toast.error('País no encontrado');
      return;
    }
    
    const promises = [];
    const datosActuales = datosEstudios[clave] || {};
    const evangelismoActual = evangelismoData[clave] || {};
    const dijeronSiActual = estudiantesQueDigeronSi[clave] || {};
    const contactosActual = nuevosContactos[clave] || {};
    
    Object.entries(datosActuales).forEach(([misioneroId, data]) => {
      Object.entries(data.estudios || {}).forEach(([estudianteNum, dias]) => {
        Object.entries(dias).forEach(([dia, horas]) => {
          if (horas > 0) {
            promises.push(
              estudiosService.guardarEstudio({
                contacto_id: parseInt(estudianteNum),
                miembro_responsable_id: parseInt(misioneroId),
                pais_id: pais.id,
                mes: mesSeleccionado,
                anio: añoActual,
                dia: parseInt(dia),
                capitulo: '',
                horas: parseFloat(horas)
              })
            );
          }
        });
      });
    });
    
    Object.entries(evangelismoActual).forEach(([misioneroId, tipos]) => {
      ['virtual', 'presencial'].forEach(tipo => {
        Object.entries(tipos[tipo] || {}).forEach(([dia, data]) => {
          if (data.horas > 0 || data.donde) {
            promises.push(
              estudiosService.guardarEvangelismo({
                miembro_id: parseInt(misioneroId),
                pais_id: pais.id,
                mes: mesSeleccionado,
                anio: añoActual,
                dia: parseInt(dia),
                tipo: tipo === 'virtual' ? 'Virtual' : 'Presencial',
                donde: data.donde || '',
                horas: parseFloat(data.horas || 0)
              })
            );
          }
        });
      });
    });
    
    Object.entries(dijeronSiActual).forEach(([misioneroId, dias]) => {
      Object.entries(dias).forEach(([dia, cantidad]) => {
        const contactosCantidad = contactosActual[misioneroId]?.[dia] || 0;
        if (cantidad > 0 || contactosCantidad > 0) {
          promises.push(
            estudiosService.guardarNuevosEstudiantes({
              miembro_id: parseInt(misioneroId),
              pais_id: pais.id,
              mes: mesSeleccionado,
              anio: añoActual,
              dia: parseInt(dia),
              dijeron_si: parseInt(cantidad || 0),
              nuevos_contactos: parseInt(contactosCantidad || 0)
            })
          );
        }
      });
    });
    
    await Promise.all(promises);
    toast.success('✅ Datos guardados exitosamente en la base de datos');
    
  } catch (error) {
    console.error('Error al guardar:', error);
    toast.error('Error al guardar datos');
  } finally {
    setCargandoDatos(false);
  }
};

  const obtenerDiasDelMes = (mes, año) => {
    const mesIndex = meses.indexOf(mes);
    const diasEnMes = new Date(año, mesIndex + 1, 0).getDate();
    return Array.from({ length: diasEnMes }, (_, i) => i + 1);
  };
  
  const obtenerClave = (continenteId, paisId, mes) => {
    return `${continenteId}-${paisId}-${mes}`;
  };
  
useEffect(() => {
    if (continenteSeleccionado && paisSeleccionado && mesSeleccionado) {
      const clave = obtenerClave(continenteSeleccionado, paisSeleccionado, mesSeleccionado);
      
      // SOLO inicializar datosEstudios si no existe
      if (!datosEstudios[clave]) {
        setDatosEstudios(prev => ({
          ...prev,
          [clave]: (() => {
            const nuevosDatos = {};
            misioneros.forEach(m => {
              nuevosDatos[m.id] = {
                estudios: {},
                evangelismo: { online: 0, virtual: 0 }
              };
            });
            return nuevosDatos;
          })()
        }));
      }
      
      // NO inicializar otros estados aquí - dejar que el useEffect de carga los llene desde BD
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [continenteSeleccionado, paisSeleccionado, mesSeleccionado, misioneros]);
  // Cargar contactos desde la BD cuando se selecciona un país
  useEffect(() => {
    const cargarContactosDelPais = async () => {
      if (!paisSeleccionado) return;
      
      try {
        const contactosData = await contactosService.getAll({ pais_id: paisSeleccionado });
        
        // Convertir contactos a formato de estudiantes agrupados por misionero
        const clave = obtenerClave(continenteSeleccionado, paisSeleccionado, mesSeleccionado);
        const estudiantesPorMisionero = {};
        
        contactosData.forEach(contacto => {
          const misioneroId = contacto.miembro_responsable_id;
          if (!estudiantesPorMisionero[misioneroId]) {
            estudiantesPorMisionero[misioneroId] = [];
          }
          
          estudiantesPorMisionero[misioneroId].push({
            id: contacto.id,
            numero: contacto.id,
            nombre: contacto.nombre,
            pais: contacto.pais_nombre,
            estudios: {}
          });
        });
        
        setEstudiantes(prev => ({
          ...prev,
          [clave]: estudiantesPorMisionero
        }));
        
      } catch (error) {
        console.error('Error al cargar contactos:', error);
      }
    };
    
    cargarContactosDelPais();
  }, [paisSeleccionado, continenteSeleccionado, mesSeleccionado]);
  // Cargar datos guardados desde la BD
  useEffect(() => {
    const cargarDatosGuardados = async () => {
      if (!paisSeleccionado || !mesSeleccionado) return;


      
try {
        const pais = continentes.find(c => c.id === continenteSeleccionado)?.paises.find(p => p.id === paisSeleccionado);
        if (!pais) return;
        
        const resumen = await estudiosService.getResumenCompleto(pais.id, mesSeleccionado, añoActual);
        
        console.log('Datos cargados:', resumen);
        
        const clave = obtenerClave(continenteSeleccionado, paisSeleccionado, mesSeleccionado);
        
        // Procesar evangelismo
        if (resumen.evangelismo && resumen.evangelismo.length > 0) {
          const evangelismoData = {};
          resumen.evangelismo.forEach(ev => {
            if (!evangelismoData[ev.miembro_id]) {
              evangelismoData[ev.miembro_id] = { virtual: {}, presencial: {} };
            }
            const tipoKey = ev.tipo.toLowerCase();
            evangelismoData[ev.miembro_id][tipoKey][ev.dia] = {
              horas: ev.horas,
              donde: ev.donde
            };
          });
          
          setEvangelismoData(prev => ({
            ...prev,
            [clave]: evangelismoData
          }));
        }
        
        // Procesar nuevos estudiantes
        if (resumen.nuevosEstudiantes && resumen.nuevosEstudiantes.length > 0) {
          const dijeronSiData = {};
          const contactosData = {};
          
          resumen.nuevosEstudiantes.forEach(ne => {
            if (!dijeronSiData[ne.miembro_id]) {
              dijeronSiData[ne.miembro_id] = {};
              contactosData[ne.miembro_id] = {};
            }
            dijeronSiData[ne.miembro_id][ne.dia] = ne.dijeron_si;
            contactosData[ne.miembro_id][ne.dia] = ne.nuevos_contactos;
          });
          
          setEstudiantesQueDigeronSi(prev => ({
            ...prev,
            [clave]: dijeronSiData
          }));
          
          setNuevosContactos(prev => ({
            ...prev,
            [clave]: contactosData
          }));
        }
        
        // Procesar estudios (horas por estudiante por día)
        if (resumen.estudios && resumen.estudios.length > 0) {
          const estudiantesPorMisionero = {};
          
          resumen.estudios.forEach(est => {
            const misioneroId = est.miembro_responsable_id;
            if (!estudiantesPorMisionero[misioneroId]) {
              estudiantesPorMisionero[misioneroId] = [];
            }
            
            // Buscar si el estudiante ya existe
            let estudiante = estudiantesPorMisionero[misioneroId].find(e => e.id === est.contacto_id);
            if (!estudiante) {
              estudiante = {
                id: est.contacto_id,
                numero: est.contacto_id,
                nombre: est.contacto_nombre,
                pais: '',
                estudios: {}
              };
              estudiantesPorMisionero[misioneroId].push(estudiante);
            }
            
            // Agregar datos del día
            estudiante.estudios[est.dia] = {
              capitulo: est.capitulo,
              horas: est.horas
            };
          });
          
          setEstudiantes(prev => ({
            ...prev,
            [clave]: estudiantesPorMisionero
          }));
        }
        
      } catch (error) {
        console.error('Error al cargar datos guardados:', error);
      }
    };
    
    cargarDatosGuardados();
}, [paisSeleccionado, mesSeleccionado, continenteSeleccionado, continentes, añoActual, misioneros]);

  const obtenerEstudiantesActuales = (misioneroId = null) => {
    if (!continenteSeleccionado || !paisSeleccionado || !mesSeleccionado) return [];
    const clave = obtenerClave(continenteSeleccionado, paisSeleccionado, mesSeleccionado);
    const estud = estudiantes[clave] || {};
    return misioneroId ? (estud[misioneroId] || []) : estud;
  };
  
  const obtenerEvangelismoActual = (misioneroId = null) => {
    if (!continenteSeleccionado || !paisSeleccionado || !mesSeleccionado) return {};
    const clave = obtenerClave(continenteSeleccionado, paisSeleccionado, mesSeleccionado);
    const evang = evangelismoData[clave] || {};
    return misioneroId ? (evang[misioneroId] || { virtual: {}, presencial: {} }) : evang;
  };
  
  const obtenerDigeronSiActual = (misioneroId = null) => {
    if (!continenteSeleccionado || !paisSeleccionado || !mesSeleccionado) return {};
    const clave = obtenerClave(continenteSeleccionado, paisSeleccionado, mesSeleccionado);
    const data = estudiantesQueDigeronSi[clave] || {};
    return misioneroId ? (data[misioneroId] || {}) : data;
  };
  
  const obtenerContactosActual = (misioneroId = null) => {
    if (!continenteSeleccionado || !paisSeleccionado || !mesSeleccionado) return {};
    const clave = obtenerClave(continenteSeleccionado, paisSeleccionado, mesSeleccionado);
    const data = nuevosContactos[clave] || {};
    return misioneroId ? (data[misioneroId] || {}) : data;
  };
  
  const calcularTotalEstudiosMisionero = (misioneroId) => {
    const estudiantesLista = obtenerEstudiantesActuales(misioneroId);
    const diasDelMes = mesSeleccionado ? obtenerDiasDelMes(mesSeleccionado, añoActual) : [];
    let totalEstudios = 0;
    
    estudiantesLista.forEach(est => {
      diasDelMes.forEach(dia => {
        if (est.estudios?.[dia]?.capitulo && est.estudios?.[dia]?.capitulo.trim() !== "") {
          totalEstudios++;
        }
      });
    });
    
    return totalEstudios;
  };
  
  const calcularTotalEstudiosDia = (dia) => {
    let total = 0;
    misioneros.forEach(m => {
      const estudiantesLista = obtenerEstudiantesActuales(m.id);
      estudiantesLista.forEach(est => {
        // Sumar HORAS en lugar de contar capítulos
        total += parseInt(est.estudios?.[dia]?.horas || 0);
      });
    });
    return total;
  };
  
  const calcularHorasEvangelismo = (misioneroId, dia) => {
    const estudiantesLista = obtenerEstudiantesActuales(misioneroId);
    let totalHoras = 0;
    
    estudiantesLista.forEach(est => {
      const horas = est.estudios?.[dia]?.horas || 0;
      totalHoras += parseInt(horas) || 0;
    });
    
    return totalHoras;
  };
  
  const calcularTotalHorasMisionero = (misioneroId) => {
    const diasDelMes = mesSeleccionado ? obtenerDiasDelMes(mesSeleccionado, añoActual) : [];
    let total = 0;
    diasDelMes.forEach(dia => {
      total += calcularHorasEvangelismo(misioneroId, dia);
    });
    
    const evang = obtenerEvangelismoActual(misioneroId);
    diasDelMes.forEach(dia => {
      total += parseInt(evang.virtual?.[dia]?.horas || 0);
      total += parseInt(evang.presencial?.[dia]?.horas || 0);
    });
    
    return total;
  };
  
const actualizarEvangelismo = (misioneroId, tipo, dia, campo, valor) => {
    const clave = obtenerClave(continenteSeleccionado, paisSeleccionado, mesSeleccionado);
    
    setEvangelismoData(prev => ({
      ...prev,
      [clave]: {
        ...prev[clave],
        [misioneroId]: {
          ...prev[clave]?.[misioneroId],
          [tipo]: {
            ...prev[clave]?.[misioneroId]?.[tipo],
            [dia]: {
              ...prev[clave]?.[misioneroId]?.[tipo]?.[dia],
              [campo]: valor
            }
          }
        }
      }
    }));
    
    // Autoguardar en BD
    const datosActuales = obtenerEvangelismoActual(misioneroId);
    const donde = campo === 'donde' ? valor : (datosActuales[tipo]?.[dia]?.donde || '');
    const horas = campo === 'horas' ? valor : (datosActuales[tipo]?.[dia]?.horas || 0);
    
    if (horas > 0 || donde) {
      estudiosService.guardarEvangelismo({
        miembro_id: misioneroId,
        pais_id: paisSeleccionado,
        mes: mesSeleccionado,
        anio: añoActual,
        dia: parseInt(dia),
        tipo: tipo === 'virtual' ? 'Virtual' : 'Presencial',
        donde: donde,
        horas: parseFloat(horas || 0)
      }).catch(err => console.error('Error autoguardando:', err));
    }
  };
  
const actualizarDigeronSi = (misioneroId, dia, cantidad) => {
  const clave = obtenerClave(continenteSeleccionado, paisSeleccionado, mesSeleccionado);
  
  setEstudiantesQueDigeronSi(prev => ({
    ...prev,
    [clave]: {
      ...prev[clave],
      [misioneroId]: {
        ...prev[clave]?.[misioneroId],
        [dia]: parseInt(cantidad) || 0
      }
    }
  }));
  
  // Autoguardar en BD
  const contactosCantidad = nuevosContactos[clave]?.[misioneroId]?.[dia] || 0;
  
  estudiosService.guardarNuevosEstudiantes({
    miembro_id: misioneroId,
    pais_id: paisSeleccionado,
    mes: mesSeleccionado,
    anio: añoActual,
    dia: parseInt(dia),
    dijeron_si: parseInt(cantidad || 0),
    nuevos_contactos: parseInt(contactosCantidad || 0)
  }).catch(err => console.error('Error autoguardando:', err));
};
  
const actualizarContactos = (misioneroId, dia, cantidad) => {
  const clave = obtenerClave(continenteSeleccionado, paisSeleccionado, mesSeleccionado);
  
  setNuevosContactos(prev => ({
    ...prev,
    [clave]: {
      ...prev[clave],
      [misioneroId]: {
        ...prev[clave]?.[misioneroId],
        [dia]: parseInt(cantidad) || 0
      }
    }
  }));
  
  // Autoguardar en BD
  const dijeronSiCantidad = estudiantesQueDigeronSi[clave]?.[misioneroId]?.[dia] || 0;
  
  estudiosService.guardarNuevosEstudiantes({
    miembro_id: misioneroId,
    pais_id: paisSeleccionado,
    mes: mesSeleccionado,
    anio: añoActual,
    dia: parseInt(dia),
    dijeron_si: parseInt(dijeronSiCantidad || 0),
    nuevos_contactos: parseInt(cantidad || 0)
  }).catch(err => console.error('Error autoguardando:', err));
};
  
  const agregarEstudiante = () => {
    if (!nuevoEstudiante.nombre || !misioneroSeleccionado) {
      toast.error("Complete al menos el nombre");
      return;
    }
    
    const clave = obtenerClave(continenteSeleccionado, paisSeleccionado, mesSeleccionado);
    const estudiantesActuales = estudiantes[clave]?.[misioneroSeleccionado] || [];
    
    const estudiante = {
      id: Date.now(),
      numero: nuevoEstudiante.numero || (estudiantesActuales.length + 1),
      nombre: nuevoEstudiante.nombre,
      pais: nuevoEstudiante.pais,
      estudios: {}
    };
    
    setEstudiantes(prev => ({
      ...prev,
      [clave]: {
        ...prev[clave],
        [misioneroSeleccionado]: [
          ...(prev[clave]?.[misioneroSeleccionado] || []),
          estudiante
        ]
      }
    }));
    
    setMostrandoModalEstudiante(false);
    setNuevoEstudiante({ numero: "", nombre: "", pais: "" });
    toast.success("✅ Estudiante agregado");
  };
  
  const eliminarEstudiante = (misioneroId, estudianteId) => {
    if (!window.confirm("¿Está seguro de eliminar este estudiante?")) return;
    
    const clave = obtenerClave(continenteSeleccionado, paisSeleccionado, mesSeleccionado);
    
    setEstudiantes(prev => ({
      ...prev,
      [clave]: {
        ...prev[clave],
        [misioneroId]: prev[clave][misioneroId].filter(e => e.id !== estudianteId)
      }
    }));
    
    toast.success("Estudiante eliminado");
  };
  
  const actualizarEstudiante = (misioneroId, estudianteId, campo, valor) => {
    const clave = obtenerClave(continenteSeleccionado, paisSeleccionado, mesSeleccionado);
    
    setEstudiantes(prev => ({
      ...prev,
      [clave]: {
        ...prev[clave],
        [misioneroId]: prev[clave][misioneroId].map(est => 
          est.id === estudianteId ? { ...est, [campo]: valor } : est
        )
      }
    }));
  };
  
const actualizarEstudioEstudiante = (misioneroId, estudianteId, dia, campo, valor) => {
  const clave = obtenerClave(continenteSeleccionado, paisSeleccionado, mesSeleccionado);
  
  // Obtener datos actuales ANTES de actualizar
  const estudianteActual = estudiantes[clave]?.[misioneroId]?.find(e => e.id === estudianteId);
  const capituloActual = campo === 'capitulo' ? valor : (estudianteActual?.estudios?.[dia]?.capitulo || '');
  const horasActual = campo === 'horas' ? valor : (estudianteActual?.estudios?.[dia]?.horas || 0);
  
  setEstudiantes(prev => ({
    ...prev,
    [clave]: {
      ...prev[clave],
      [misioneroId]: prev[clave][misioneroId].map(est => {
        if (est.id === estudianteId) {
          return {
            ...est,
            estudios: {
              ...est.estudios,
              [dia]: {
                ...est.estudios?.[dia],
                [campo]: valor
              }
            }
          };
        }
        return est;
      })
    }
  }));
  
  console.log('🔥 INTENTANDO GUARDAR:', {
    contacto_id: estudianteId,
    dia: dia,
    capitulo: capituloActual,
    horas: horasActual
  });

  // Autoguardar en BD (guarda tanto capítulo como horas)
  if (horasActual > 0 || capituloActual) {
    estudiosService.guardarEstudio({
      contacto_id: estudianteId,
      miembro_responsable_id: misioneroId,
      pais_id: paisSeleccionado,
      mes: mesSeleccionado,
      anio: añoActual,
      dia: parseInt(dia),
      capitulo: capituloActual,
      horas: parseFloat(horasActual || 0)
    }).catch(err => console.error('Error autoguardando:', err));
  }
};
  
const agregarContinente = async () => {
  if (!nuevoNombreContinente.trim()) {
    toast.error("El nombre del continente es requerido");
    return;
  }
  
  try {
    setCargandoDatos(true);
    
    // Crear continente en la BD
    const nuevoContinente = await administracionService.crearContinente({
      nombre: nuevoNombreContinente.trim()
    });

    // Actualizar lista local
    setContinentes(prev => [...prev, { 
      id: nuevoContinente.id, 
      nombre: nuevoContinente.nombre, 
      paises: [] 
    }]);
    
    setNuevoNombreContinente("");
    setMostrandoPromptContinente(false);
    toast.success("✅ Continente guardado en la base de datos");
    
  } catch (error) {
    console.error('Error:', error);
    toast.error(error.response?.data?.error || 'Error al crear continente');
  } finally {
    setCargandoDatos(false);
  }
};
  
const eliminarContinente = async (id) => {
    if (!window.confirm("¿Eliminar este continente?")) return;
    
    try {
      await administracionService.eliminarContinente(id);
      setContinentes(continentes.filter(c => c.id !== id));
      toast.success("✅ Continente eliminado de la BD");
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.response?.data?.error || 'Error al eliminar continente');
    }
  };
  
const agregarPais = async () => {
  if (!nuevoNombrePais.trim()) {
    toast.error("El nombre del país es requerido");
    return;
  }
  
  if (!continenteParaPais) {
    toast.error("Selecciona un continente primero");
    return;
  }
  
  try {
    setCargandoDatos(true);
    
    // Verificar si el país ya existe
    const continente = continentes.find(c => c.id === continenteParaPais);
    const yaExiste = continente?.paises.some(p => p.nombre.toLowerCase() === nuevoNombrePais.trim().toLowerCase());
    
    if (yaExiste) {
      toast.error("Este país ya existe en este continente");
      return;
    }
    
    // Crear país en la BD
const nuevoPais = await administracionService.crearPais({
      nombre: nuevoNombrePais.trim(),
      continente: continente.nombre,
      codigo_iso: '', // Opcional
      activo: true
    });
    
    // Actualizar estado local
    setContinentes(prev => {
      const nuevos = [...prev];
      const cont = nuevos.find(c => c.id === continenteParaPais);
      if (cont) {
        cont.paises.push({ id: nuevoPais.id, nombre: nuevoPais.nombre });
      }
      return nuevos;
    });
    
    setNuevoNombrePais("");
    setMostrandoPromptPais(false);
    setContinenteParaPais(null);
    toast.success("País creado exitosamente en la base de datos");
    
  } catch (error) {
    console.error('Error al crear país:', error);
    toast.error('Error al crear país: ' + (error.response?.data?.error || error.message));
  } finally {
    setCargandoDatos(false);
  }
};
  
const eliminarPais = async (continenteId, paisId) => {
    if (!window.confirm("¿Eliminar este país?")) return;
    
    try {
      await administracionService.eliminarPais(paisId);
      
      setContinentes(continentes.map(cont => {
        if (cont.id === continenteId) {
          return {
            ...cont,
            paises: cont.paises.filter(p => p.id !== paisId)
          };
        }
        return cont;
      }));
      
      toast.success("✅ País eliminado de la BD");
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.response?.data?.error || 'Error al eliminar país');
    }
  };
  
  const agregarMisionero = () => {
    if (!nuevoMisionero.trim()) {
      toast.error("Ingrese un nombre");
      return;
    }
    
    const nuevoM = {
      id: Date.now(),
      nombre: nuevoMisionero.trim()
    };
    
    setMisioneros([...misioneros, nuevoM]);
    setMostrandoModalMisionero(false);
    setNuevoMisionero("");
    toast.success("✅ Misionero agregado");
  };
  
  const eliminarMisionero = (id) => {
    if (!window.confirm("¿Eliminar este misionero?")) return;
    setMisioneros(misioneros.filter(m => m.id !== id));
    toast.success("Misionero eliminado");
  };
  
  const obtenerDiaSemana = (dia, mes, año) => {
    const dias = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];
    const mesIndex = meses.indexOf(mes);
    const fecha = new Date(año, mesIndex, dia);
    return dias[fecha.getDay()];
  };
  
  const obtenerNombreDiaCompleto = (dia, mes, año) => {
    const dias = ["DOMINGO", "LUNES", "MARTES", "MIÉRCOLES", "JUEVES", "VIERNES", "SÁBADO"];
    const mesIndex = meses.indexOf(mes);
    const fecha = new Date(año, mesIndex, dia);
    return dias[fecha.getDay()];
  };
  
  const paisesDelContinente = continenteSeleccionado 
    ? continentes.find(c => c.id === continenteSeleccionado)?.paises || []
    : [];
  
  const diasDelMes = mesSeleccionado ? obtenerDiasDelMes(mesSeleccionado, añoActual) : [];

  return (
    <div style={{ minHeight: "100vh", background: "#f5f7fa", padding: "20px" }}>
      <style>{`
        @media print {
          .no-print { display: none !important; }
        }
        .tabla-estudios {
          width: 100%;
          border-collapse: collapse;
          background: white;
          font-size: 13px;
        }
        .tabla-estudios th,
        .tabla-estudios td {
          border: 1px solid #ddd;
          padding: 10px 8px;
          text-align: center;
          white-space: nowrap;
        }
        .tabla-estudios th {
          background: #0E5A61;
          color: white;
          font-weight: 600;
          position: sticky;
          top: 0;
          z-index: 10;
        }
        .tabla-estudios td input,
        .tabla-estudios td select,
        .tabla-estudios td textarea {
          width: 100%;
          padding: 6px;
          border: 1px solid #ddd;
          border-radius: 6px;
          text-align: center;
          box-sizing: border-box;
          font-size: 13px;
        }
        .tabla-estudios td input:focus,
        .tabla-estudios td select:focus {
          outline: none;
          border-color: #0E5A61;
          box-shadow: 0 0 0 3px rgba(14,90,97,0.1);
        }
        .tabla-estudios .total-final {
          background: #0E5A61;
          color: white;
          font-weight: 700;
          font-size: 15px;
        }
        .tabla-estudios .fila-vacia input,
        .tabla-estudios .fila-vacia select {
          background: #fafafa;
        }
        .scroll-container {
          overflow-x: auto;
          max-width: 100%;
        }
        .btn-modern {
          padding: 14px 24px;
          border: none;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          display: inline-flex;
          align-items: center;
          gap: 10px;
        }
        .btn-primary {
          background: linear-gradient(135deg, #0E5A61 0%, #15777F 100%);
          color: white;
        }
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(14,90,97,0.3);
        }
        .btn-secondary {
          background: #f5f7fa;
          color: #333;
          border: 2px solid #e0e0e0;
        }
        .btn-secondary:hover {
          background: #e8ecef;
          border-color: #0E5A61;
        }
        .btn-success {
          background: #4CAF50;
          color: white;
        }
        .btn-success:hover {
          background: #45a049;
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(76,175,80,0.3);
        }
        .btn-danger {
          background: #f44336;
          color: white;
          padding: 8px 12px;
          font-size: 13px;
        }
        .btn-add-new {
          background: #FF9800;
          color: white;
          width: 100%;
          padding: 16px;
          font-size: 16px;
          font-weight: 700;
        }
        .btn-add-new:hover {
          background: #FB8C00;
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(255,152,0,0.3);
        }
        .card-item {
          background: white;
          border-radius: 12px;
          padding: 24px;
          cursor: pointer;
          transition: all 0.3s;
          border: 2px solid #e0e0e0;
          position: relative;
        }
        .card-item:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.12);
          border-color: #0E5A61;
        }
        .card-delete-btn {
          position: absolute;
          top: 12px;
          right: 12px;
          background: #f44336;
          color: white;
          border: none;
          border-radius: 50%;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          opacity: 0;
          transition: all 0.3s;
        }
        .card-item:hover .card-delete-btn {
          opacity: 1;
        }
        .card-delete-btn:hover {
          background: #d32f2f;
          transform: scale(1.1);
        }
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .modal-content {
          background: white;
          padding: 35px;
          border-radius: 16px;
          box-shadow: 0 15px 50px rgba(0,0,0,0.3);
          max-width: 95vw;
          width: 1200px;
          max-height: 90vh;
          overflow-y: auto;
        }
        .modal-prompt {
          background: white;
          padding: 30px;
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.2);
          max-width: 450px;
          width: 90%;
        }
        .input-modern {
          width: 100%;
          padding: 14px 18px;
          border: 2px solid #e0e0e0;
          border-radius: 10px;
          font-size: 15px;
          transition: all 0.3s;
          box-sizing: border-box;
          margin-bottom: 18px;
        }
        .input-modern:focus {
          outline: none;
          border-color: #0E5A61;
          box-shadow: 0 0 0 4px rgba(14,90,97,0.1);
        }
.btn-prompt-aceptar {
          background: linear-gradient(135deg, #0E5A61 0%, #15777F 100%);
          color: white;
          border: none;
          padding: 12px 28px;
          border-radius: 10px;
          cursor: pointer;
          font-weight: 700;
          font-size: 15px;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(14, 90, 97, 0.3);
        }
        .btn-prompt-aceptar:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(14, 90, 97, 0.4);
        }
        .btn-prompt-cancelar {
          background: #6c757d;
          color: white;
          border: none;
          padding: 12px 28px;
          border-radius: 10px;
          cursor: pointer;
          font-weight: 600;
          font-size: 15px;
          transition: all 0.3s ease;
        }
        .btn-prompt-cancelar:hover {
          background: #5a6268;
          transform: translateY(-1px);
        }
        .btn-prompt-aceptar:hover {
          background: #1976D2;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(33,150,243,0.3);
        }
        .btn-prompt-cancelar {
          background: #E3F2FD;
          color: #1976D2;
          padding: 12px 28px;
          border: none;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }
        .btn-prompt-cancelar:hover {
          background: #BBDEFB;
        }
        .tabla-evangelismo {
          margin-top: 30px;
          background: #E8F5E9;
          padding: 20px;
          border-radius: 12px;
        }
        .tabla-evangelismo th {
          background: #4CAF50 !important;
        }
        .tabla-nuevos {
          margin-top: 30px;
        }
        .tabla-nuevos th {
          background: #FF9800 !important;
        }
      `}</style>

      {/* Header */}
      <div style={{ 
        background: "linear-gradient(135deg, #0E5A61 0%, #15777F 100%)", 
        borderRadius: "16px", 
        padding: "30px",
        marginBottom: "30px",
        boxShadow: "0 8px 24px rgba(14,90,97,0.2)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
        <button 
           // onClick={() => navigate("/home")}

            onClick={() => {
            if (misioneroSeleccionado) {
              setMisioneroSeleccionado(null);
              setVistaActual("resumen");
            } else if (mesSeleccionado) {
              setMesSeleccionado(null);
            } else if (paisSeleccionado) {
              setPaisSeleccionado(null);
            } else if (continenteSeleccionado) {
              setContinenteSeleccionado(null);
            } else {
              navigate("/home");
            }
          }} 
            style={{ 
              background: "rgba(255,255,255,0.2)", 
              border: "none", 
              borderRadius: "8px", 
              padding: "10px 15px", 
              color: "white", 
              cursor: "pointer", 
              display: "flex", 
              alignItems: "center", 
              gap: "8px" 
            }}
            className="no-print"
          >
            <FaArrowLeft /> Volver
          </button>

          <h1 style={{ color: "white", margin: 0, fontSize: "28px" }}>
            <FaBook style={{ marginRight: "10px" }} />
            Estudios Bíblicos {añoActual}
          </h1>
<div style={{ display: "flex", gap: "10px" }}>
            {mesSeleccionado && (
              <>
                <button
                  onClick={() => setMostrandoEstadisticas(true)}
                  className="btn-success no-print"
                >
                  <FaChartLine /> Estadísticas
                </button>

              </>
            )}
            <button onClick={() => window.print()} className="btn-secondary no-print" style={{ background: "white", color: "#0E5A61", borderColor: "white" }}>
              <FaPrint /> Imprimir
            </button>
          </div>
        </div>
        
        {mesSeleccionado && (
          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            <button
              onClick={() => {
                setContinenteSeleccionado(null);
                setPaisSeleccionado(null);
                setMesSeleccionado(null);
                setMisioneroSeleccionado(null);
                setVistaActual("resumen");
              }}
              className="btn-secondary"
              style={{ background: "rgba(255,255,255,0.2)", color: "white", borderColor: "rgba(255,255,255,0.3)", fontSize: "13px" }}
            >
              <FaGlobe size={12} /> Cambiar Región
            </button>
            {misioneroSeleccionado && (
              <>
                <button
                  onClick={() => {
                    setMisioneroSeleccionado(null);
                    setVistaActual("resumen");
                  }}
                  className="btn-secondary"
                  style={{ background: "rgba(255,255,255,0.2)", color: "white", borderColor: "rgba(255,255,255,0.3)", fontSize: "13px" }}
                >
                  <FaChartBar size={12} /> Resumen
                </button>
                <button
                  onClick={() => {
                    setMisioneroSeleccionado(null);
                    setVistaActual("misioneros");
                  }}
                  className="btn-secondary"
                  style={{ background: "rgba(255,255,255,0.2)", color: "white", borderColor: "rgba(255,255,255,0.3)", fontSize: "13px" }}
                >
                  <FaUser size={12} /> Por Misionero
                </button>
              </>
            )}
            <div style={{ flex: 1 }}></div>
            <div style={{ color: "white", fontSize: "16px", fontWeight: "600" }}>
              {continentes.find(c => c.id === continenteSeleccionado)?.nombre} • {paisesDelContinente.find(p => p.id === paisSeleccionado)?.nombre} • {mesSeleccionado}
            </div>
          </div>
        )}
      </div>

      {/* SELECCIÓN DE CONTINENTE */}
      {!continenteSeleccionado && (
        <div>
          <h2 style={{ margin: "0 0 20px 0", color: "#0E5A61" }}>
            <FaGlobe style={{ marginRight: "10px" }} />
            Seleccione un Continente
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "20px" }}>
            {continentes.map(cont => (
              <div
                key={cont.id}
                className="card-item"
                onClick={() => setContinenteSeleccionado(cont.id)}
              >
                <button
                  className="card-delete-btn no-print"
                  onClick={(e) => {
                    e.stopPropagation();
                    eliminarContinente(cont.id);
                  }}
                >
                  <FaTrash size={14} />
                </button>
                <div style={{ fontSize: "20px", fontWeight: "700", color: "#0E5A61", marginBottom: "10px" }}>
                  {cont.nombre}
                </div>
                <div style={{ fontSize: "14px", color: "#666" }}>
                  {cont.paises.length} países
                </div>
              </div>
            ))}
            <div
              className="card-item"
              onClick={() => setMostrandoPromptContinente(true)}
              style={{ borderStyle: "dashed", borderColor: "#FF9800", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "120px" }}
            >
              <div style={{ textAlign: "center", color: "#FF9800" }}>
                <FaPlus size={32} style={{ marginBottom: "10px" }} />
                <div style={{ fontSize: "16px", fontWeight: "700" }}>Nuevo Continente</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SELECCIÓN DE PAÍS */}
      {continenteSeleccionado && !paisSeleccionado && (
        <div>
          <h2 style={{ margin: "0 0 20px 0", color: "#0E5A61" }}>
            Seleccione un País
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "20px" }}>
            {paisesDelContinente.map(pais => (
              <div
                key={pais.id}
                className="card-item"
                onClick={() => setPaisSeleccionado(pais.id)}
              >
                <button
                  className="card-delete-btn no-print"
                  onClick={(e) => {
                    e.stopPropagation();
                    eliminarPais(continenteSeleccionado, pais.id);
                  }}
                >
                  <FaTrash size={14} />
                </button>
                <div style={{ fontSize: "20px", fontWeight: "700", color: "#0E5A61" }}>
                  {pais.nombre}
                </div>
              </div>
            ))}
            <div
              className="card-item"
              onClick={() => {
                setContinenteParaPais(continenteSeleccionado);
                setMostrandoPromptPais(true);
              }}
              style={{ borderStyle: "dashed", borderColor: "#FF9800", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "120px" }}
            >
              <div style={{ textAlign: "center", color: "#FF9800" }}>
                <FaPlus size={32} style={{ marginBottom: "10px" }} />
                <div style={{ fontSize: "16px", fontWeight: "700" }}>Nuevo País</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SELECCIÓN DE MES */}
      {continenteSeleccionado && paisSeleccionado && !mesSeleccionado && (
        <div>
          <h2 style={{ margin: "0 0 20px 0", color: "#0E5A61" }}>
            <FaCalendarAlt style={{ marginRight: "10px" }} />
            Seleccione un Mes
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "15px" }}>
            {meses.map((mes, index) => {
              const mesIndex = meses.indexOf(mesActualNombre);
              const esActual = mes === mesActualNombre;
              const esPasado = index < mesIndex;
              const esFuturo = index > mesIndex;
              
              return (
                <div
                  key={mes}
                  className="card-item"
                  onClick={() => !esFuturo && setMesSeleccionado(mes)}
                  style={{
                    background: esActual ? "linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)" : 
                                esPasado ? "#E8F5E9" : "#f5f7fa",
                    color: esActual ? "white" : "#333",
                    borderColor: esActual ? "#4CAF50" : "#e0e0e0",
                    opacity: esFuturo ? 0.5 : 1,
                    cursor: esFuturo ? "not-allowed" : "pointer",
                    textAlign: "center",
                    padding: "20px"
                  }}
                >
                  <div style={{ fontSize: "18px", fontWeight: "700", marginBottom: "6px" }}>
                    {mes}
                  </div>
                  {esActual && (
                    <div style={{ fontSize: "12px", opacity: 0.9 }}>
                      Mes Actual
                    </div>
                  )}
                  {esFuturo && (
                    <div style={{ fontSize: "12px", color: "#999" }}>
                      No Disponible
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VISTA PRINCIPAL */}
      {continenteSeleccionado && paisSeleccionado && mesSeleccionado && !misioneroSeleccionado && (
        <div>
          <div style={{ display: "flex", gap: "10px", marginBottom: "30px", flexWrap: "wrap" }} className="no-print">
            <button
              onClick={() => setVistaActual("resumen")}
              className={vistaActual === "resumen" ? "btn-primary" : "btn-secondary"}
            >
              <FaChartBar /> Resumen
            </button>
            <button
              onClick={() => setVistaActual("misioneros")}
              className={vistaActual === "misioneros" ? "btn-primary" : "btn-secondary"}
            >
              <FaUser /> Por Misionero
            </button>
            <button
              onClick={() => setVistaActual("nuevosEstudiantes")}
              className={vistaActual === "nuevosEstudiantes" ? "btn-primary" : "btn-secondary"}
            >
              <FaUserPlus /> Nuevos Estudiantes
            </button>
          </div>

          {/* VISTA RESUMEN */}
          {vistaActual === "resumen" && (
            <div style={{ background: "white", borderRadius: "12px", padding: "25px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
              <h2 style={{ margin: "0 0 25px 0", color: "#0E5A61", fontSize: "24px" }}>
                Control de Reportes - {mesSeleccionado} {añoActual}
              </h2>
              
              <div className="scroll-container">
                <table className="tabla-estudios">
                  <thead>
                    <tr>
                      <th style={{ minWidth: "150px" }}>NOMBRE</th>
                      <th style={{ minWidth: "90px" }}>TOTAL</th>
                      {diasDelMes.map(dia => (
                        <th key={dia} style={{ minWidth: "70px" }}>
                          {obtenerDiaSemana(dia, mesSeleccionado, añoActual)}<br/>{dia}
                        </th>
                      ))}
                      <th className="no-print" style={{ minWidth: "90px" }}>ACCIONES</th>
                    </tr>
                  </thead>
                  <tbody>
              {misioneros.filter(m => m.pais_id === paisSeleccionado).map(misionero => (
                      <tr key={misionero.id}>
                        <td style={{ textAlign: "left", fontWeight: "700", background: "#f8f9fa", fontSize: "14px" }}>
                          {misionero.nombre}
                        </td>
                        <td style={{ fontWeight: "700", background: "#E3F2FD", fontSize: "17px" }}>
                          {(() => {
                            const estudiantesLista = obtenerEstudiantesActuales(misionero.id);
                            let totalHoras = 0;
                            diasDelMes.forEach(dia => {
                              estudiantesLista.forEach(est => {
                                totalHoras += parseInt(est.estudios?.[dia]?.horas || 0);
                              });
                            });
                            return totalHoras;
                          })()}
                        </td>
                        {diasDelMes.map(dia => {
                          const estudiantesLista = obtenerEstudiantesActuales(misionero.id);
                          let horasDiaMisionero = 0;
                          
                          // Sumar HORAS de ese día
                          estudiantesLista.forEach(est => {
                            horasDiaMisionero += parseInt(est.estudios?.[dia]?.horas || 0);
                          });
                          
                          return (
                            <td key={dia} style={{ fontSize: "15px" }}>
                              {horasDiaMisionero}
                            </td>
                          );
                        })}
                        <td className="no-print">
                          <button
                            onClick={() => eliminarMisionero(misionero.id)}
                            className="btn-danger"
                          >
                            <FaTrash size={11} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    <tr className="total-final">
                      <td>TOTAL DIARIO</td>
                      <td>
                        {misioneros.reduce((sum, m) => {
                          const estudiantesLista = obtenerEstudiantesActuales(m.id);
                          let totalHoras = 0;
                          diasDelMes.forEach(dia => {
                            estudiantesLista.forEach(est => {
                              totalHoras += parseInt(est.estudios?.[dia]?.horas || 0);
                            });
                          });
                          return sum + totalHoras;
                        }, 0)}
                      </td>
                      {diasDelMes.map(dia => (
                        <td key={dia}>{calcularTotalEstudiosDia(dia)}</td>
                      ))}
                      <td className="no-print"></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="no-print" style={{ marginTop: "20px" }}>
                <button
                  onClick={() => navigate("/miembros")}
                  className="btn-add-new"
                >
                  <FaPlus size={18} /> Añadir Misionero
                </button>
              </div>

              {/* Evangelismo */}
              <h3 style={{ margin: "40px 0 20px 0", color: "#0E5A61", fontSize: "22px" }}>Evangelismo {mesSeleccionado}</h3>
              <table className="tabla-estudios" style={{ maxWidth: "800px" }}>
                <thead>
                  <tr>
                    <th style={{ minWidth: "150px" }}>NOMBRE</th>
                    <th>TOTAL HORAS</th>
                    <th>VIRTUAL</th>
                    <th>PRESENCIAL</th>
                  </tr>
                </thead>
                <tbody>
                  {misioneros.filter(m => m.pais_id === paisSeleccionado).map(misionero => {
                    const evang = obtenerEvangelismoActual(misionero.id);
                    
                    let horasVirtual = 0;
                    let horasPresencial = 0;
                    
                    diasDelMes.forEach(dia => {
                      horasVirtual += parseInt(evang.virtual?.[dia]?.horas || 0);
                      horasPresencial += parseInt(evang.presencial?.[dia]?.horas || 0);
                    });
                    
                    const totalEvangelismo = horasVirtual + horasPresencial;
                    
                    return (
                      <tr key={misionero.id}>
                        <td style={{ textAlign: "left", fontWeight: "700", fontSize: "14px" }}>
                          {misionero.nombre}
                        </td>
                        <td style={{ fontWeight: "700", background: "#E3F2FD", fontSize: "17px" }}>
                          {totalEvangelismo}
                        </td>
                        <td style={{ fontSize: "15px" }}>{horasVirtual}</td>
                        <td style={{ fontSize: "15px" }}>{horasPresencial}</td>
                      </tr>
                    );
                  })}
                  <tr className="total-final">
                    <td>TOTAL</td>
                    <td>
                      {misioneros.reduce((sum, m) => {
                        const evang = obtenerEvangelismoActual(m.id);
                        let total = 0;
                        diasDelMes.forEach(dia => {
                          total += parseInt(evang.virtual?.[dia]?.horas || 0);
                          total += parseInt(evang.presencial?.[dia]?.horas || 0);
                        });
                        return sum + total;
                      }, 0)}
                    </td>
                    <td>
                      {misioneros.reduce((sum, m) => {
                        const evang = obtenerEvangelismoActual(m.id);
                        let total = 0;
                        diasDelMes.forEach(dia => {
                          total += parseInt(evang.virtual?.[dia]?.horas || 0);
                        });
                        return sum + total;
                      }, 0)}
                    </td>
                    <td>
                      {misioneros.reduce((sum, m) => {
                        const evang = obtenerEvangelismoActual(m.id);
                        let total = 0;
                        diasDelMes.forEach(dia => {
                          total += parseInt(evang.presencial?.[dia]?.horas || 0);
                        });
                        return sum + total;
                      }, 0)}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* NUEVOS ESTUDIANTES - RESUMEN */}
              <h3 style={{ margin: "40px 0 20px 0", color: "#0E5A61", fontSize: "22px" }}>Nuevos Estudiantes {mesSeleccionado}</h3>
              <table className="tabla-estudios" style={{ maxWidth: "800px" }}>
                <thead>
                  <tr>
                    <th style={{ minWidth: "150px" }}>NOMBRE</th>
                    <th>DIJERON SÍ</th>
                    <th>CONTACTOS</th>
                  </tr>
                </thead>
                <tbody>
                  {misioneros.filter(m => m.pais_id === paisSeleccionado).map(misionero => {
                    const dataSi = obtenerDigeronSiActual(misionero.id);
                    const dataContactos = obtenerContactosActual(misionero.id);
                    const totalSi = Object.values(dataSi).reduce((sum, val) => sum + (parseInt(val) || 0), 0);
                    const totalContactos = Object.values(dataContactos).reduce((sum, val) => sum + (parseInt(val) || 0), 0);
                    
                    return (
                      <tr key={misionero.id}>
                        <td style={{ textAlign: "left", fontWeight: "700", fontSize: "14px" }}>
                          {misionero.nombre}
                        </td>
                        <td style={{ fontSize: "15px" }}>{totalSi}</td>
                        <td style={{ fontSize: "15px" }}>{totalContactos}</td>
                      </tr>
                    );
                  })}
                  <tr className="total-final">
                    <td>TOTAL</td>
                    <td>
                      {misioneros.reduce((sum, m) => {
                        const data = obtenerDigeronSiActual(m.id);
                        return sum + Object.values(data).reduce((s, val) => s + (parseInt(val) || 0), 0);
                      }, 0)}
                    </td>
                    <td>
                      {misioneros.reduce((sum, m) => {
                        const data = obtenerContactosActual(m.id);
                        return sum + Object.values(data).reduce((s, val) => s + (parseInt(val) || 0), 0);
                      }, 0)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* VISTA POR MISIONERO */}
          {vistaActual === "misioneros" && (
            <div>
<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "20px", marginBottom: "20px" }}>
                {misioneros.filter(m => m.pais_id === paisSeleccionado).map(misionero => {
                  const estudiantesLista = obtenerEstudiantesActuales(misionero.id);
                  
                  // Calcular horas de ESTUDIOS (solo estudiantes)
                  let horasEstudios = 0;
                  diasDelMes.forEach(dia => {
                    estudiantesLista.forEach(est => {
                      horasEstudios += parseInt(est.estudios?.[dia]?.horas || 0);
                    });
                  });
                  
                  // Calcular horas de EVANGELISMO (virtual + presencial)
                  const evang = obtenerEvangelismoActual(misionero.id);
                  let horasEvangelismo = 0;
                  diasDelMes.forEach(dia => {
                    horasEvangelismo += parseInt(evang.virtual?.[dia]?.horas || 0);
                    horasEvangelismo += parseInt(evang.presencial?.[dia]?.horas || 0);
                  });
                  
                  return (
                    <div
                      key={misionero.id}
                      className="card-item"
                      onClick={() => setMisioneroSeleccionado(misionero.id)}
                    >
                      <button
                        className="card-delete-btn no-print"
                        onClick={(e) => {
                          e.stopPropagation();
                          eliminarMisionero(misionero.id);
                        }}
                      >
                        <FaTrash size={14} />
                      </button>
                      <div style={{ fontSize: "20px", fontWeight: "700", color: "#0E5A61", marginBottom: "12px" }}>
                        <FaUser style={{ marginRight: "8px" }} />
                        {misionero.nombre}
                      </div>
                      <div style={{ fontSize: "14px", color: "#666", marginBottom: "12px" }}>
                        {estudiantesLista.length} estudiantes
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "12px", borderTop: "1px solid #e0e0e0" }}>
                        <div>
                          <div style={{ fontSize: "12px", color: "#999" }}>Estudios</div>
                          <div style={{ fontSize: "22px", fontWeight: "700", color: "#0E5A61" }}>{horasEstudios}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: "12px", color: "#999" }}>Horas</div>
                          <div style={{ fontSize: "22px", fontWeight: "700", color: "#4CAF50" }}>{horasEvangelismo}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="no-print">
                <button
                  onClick={() => navigate("/miembros")}
                  className="btn-add-new"
                >
                  <FaPlus size={18} /> Añadir Nuevo Misionero
                </button>
              </div>
            </div>
          )}

          {/* VISTA NUEVOS ESTUDIANTES */}
          {vistaActual === "nuevosEstudiantes" && (
            <div style={{ background: "white", borderRadius: "12px", padding: "25px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
              <h2 style={{ margin: "0 0 25px 0", color: "#0E5A61", fontSize: "24px" }}>
                Nuevos Estudiantes - {mesSeleccionado} {añoActual}
              </h2>
              
              {/* ESTUDIANTES QUE DIJERON SÍ */}
              <h3 style={{ margin: "0 0 20px 0", color: "#4CAF50", fontSize: "22px" }}>
                Estudiantes que Dijeron "SÍ"
              </h3>
              <div className="scroll-container">
                <table className="tabla-estudios">
                  <thead>
                    <tr>
                      <th style={{ minWidth: "150px", background: "#4CAF50 !important" }}>NOMBRE</th>
                      <th style={{ background: "#4CAF50 !important" }}>TOTAL</th>
                      {diasDelMes.map(dia => (
                        <th key={dia} style={{ minWidth: "90px", background: "#4CAF50 !important" }}>
                          {obtenerDiaSemana(dia, mesSeleccionado, añoActual)}<br/>{dia}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {misioneros.filter(m => m.pais_id === paisSeleccionado).map(misionero => {
                      const data = obtenerDigeronSiActual(misionero.id);
                      const total = Object.values(data).reduce((sum, val) => sum + (parseInt(val) || 0), 0);
                      
                      return (
                        <tr key={misionero.id}>
                          <td style={{ textAlign: "left", fontWeight: "700", fontSize: "14px" }}>
                            {misionero.nombre}
                          </td>
                          <td style={{ fontWeight: "700", background: "#C8E6C9", fontSize: "16px" }}>
                            {total}
                          </td>
                          {diasDelMes.map(dia => (
                            <td key={dia}>
                              <input
                                type="number"
                                min="0"
                                placeholder="0"
                                value={data[dia] || ""}
                                onChange={(e) => actualizarDigeronSi(misionero.id, dia, e.target.value)}
                                style={{ width: "70px", fontSize: "15px" }}
                              />
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                    <tr style={{ background: "#4CAF50", color: "white", fontWeight: "700" }}>
                      <td>TOTAL</td>
                      <td style={{ fontSize: "17px" }}>
                        {misioneros.reduce((sum, m) => {
                          const data = obtenerDigeronSiActual(m.id);
                          return sum + Object.values(data).reduce((s, val) => s + (parseInt(val) || 0), 0);
                        }, 0)}
                      </td>
                      {diasDelMes.map(dia => (
                        <td key={dia} style={{ fontSize: "16px" }}>
                          {misioneros.reduce((sum, m) => {
                            const data = obtenerDigeronSiActual(m.id);
                            return sum + (parseInt(data[dia]) || 0);
                          }, 0)}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* NUEVOS CONTACTOS */}
              <h3 style={{ margin: "40px 0 20px 0", color: "#4CAF50", fontSize: "22px" }}>
                Nuevos Contactos
              </h3>
              <div className="scroll-container">
                <table className="tabla-estudios">
                  <thead>
                    <tr>
                      <th style={{ minWidth: "150px", background: "#4CAF50 !important" }}>NOMBRE</th>
                      <th style={{ background: "#4CAF50 !important" }}>TOTAL</th>
                      {diasDelMes.map(dia => (
                        <th key={dia} style={{ minWidth: "90px", background: "#4CAF50 !important" }}>
                          {obtenerDiaSemana(dia, mesSeleccionado, añoActual)}<br/>{dia}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {misioneros.filter(m => m.pais_id === paisSeleccionado).map(misionero => {
                      const data = obtenerContactosActual(misionero.id);
                      const total = Object.values(data).reduce((sum, val) => sum + (parseInt(val) || 0), 0);
                      
                      return (
                        <tr key={misionero.id}>
                          <td style={{ textAlign: "left", fontWeight: "700", fontSize: "14px" }}>
                            {misionero.nombre}
                          </td>
                          <td style={{ fontWeight: "700", background: "#C8E6C9", fontSize: "16px" }}>
                            {total}
                          </td>
                          {diasDelMes.map(dia => (
                            <td key={dia}>
                              <input
                                type="number"
                                min="0"
                                placeholder="0"
                                value={data[dia] || ""}
                                onChange={(e) => actualizarContactos(misionero.id, dia, e.target.value)}
                                style={{ width: "70px", fontSize: "15px" }}
                              />
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                    <tr style={{ background: "#4CAF50", color: "white", fontWeight: "700" }}>
                      <td>TOTAL</td>
                      <td style={{ fontSize: "17px" }}>
                        {misioneros.reduce((sum, m) => {
                          const data = obtenerContactosActual(m.id);
                          return sum + Object.values(data).reduce((s, val) => s + (parseInt(val) || 0), 0);
                        }, 0)}
                      </td>
                      {diasDelMes.map(dia => (
                        <td key={dia} style={{ fontSize: "16px" }}>
                          {misioneros.reduce((sum, m) => {
                            const data = obtenerContactosActual(m.id);
                            return sum + (parseInt(data[dia]) || 0);
                          }, 0)}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VISTA DETALLE MISIONERO */}
      {misioneroSeleccionado && (
        <div style={{ background: "white", borderRadius: "12px", padding: "25px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" }}>
            <h2 style={{ margin: 0, color: "#0E5A61", fontSize: "24px" }}>
              {misioneros.find(m => m.id === misioneroSeleccionado)?.nombre} - {mesSeleccionado} {añoActual}
            </h2>
            <button
              onClick={() => {
                setNuevoEstudiante({ numero: "", nombre: "", pais: "" });
                setMostrandoModalEstudiante(true);
              }}
              className="btn-primary no-print"
            >
              <FaPlus /> Nuevo Estudiante
            </button>
          </div>

          <div className="scroll-container">
            <table className="tabla-estudios">
              <thead>
                <tr>
                  <th rowSpan="2" style={{ minWidth: "60px" }}>BORRAR</th>
                  <th rowSpan="2" style={{ minWidth: "80px" }}>N°</th>
                  <th rowSpan="2" style={{ minWidth: "220px" }}>NOMBRE</th>
                  <th rowSpan="2" style={{ minWidth: "160px" }}>PAÍS</th>
                  {diasDelMes.map(dia => (
                    <th key={dia} colSpan="2" style={{ minWidth: "90px" }}>
                      {obtenerDiaSemana(dia, mesSeleccionado, añoActual)} {dia}
                    </th>
                  ))}
                </tr>
<tr>
                  {diasDelMes.map(dia => (
                    <React.Fragment key={dia}>
                      <th style={{ fontSize: "12px", fontWeight: "600" }}>Cap</th>
                      <th style={{ fontSize: "12px", fontWeight: "600" }}>Hr</th>
                    </React.Fragment>
                  ))}
                </tr>
              </thead>
              <tbody>
                {obtenerEstudiantesActuales(misioneroSeleccionado).map(estudiante => (
                  <tr key={estudiante.id}>
                    <td>
                      <button
                        onClick={() => eliminarEstudiante(misioneroSeleccionado, estudiante.id)}
                        className="btn-danger"
                        style={{ padding: "6px 10px" }}
                      >
                        <FaTrash size={12} />
                      </button>
                    </td>
                    <td>
                      <input
                        type="text"
                        value={estudiante.numero}
                        onChange={(e) => actualizarEstudiante(misioneroSeleccionado, estudiante.id, 'numero', e.target.value)}
                        style={{ width: "70px" }}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={estudiante.nombre}
                        onChange={(e) => actualizarEstudiante(misioneroSeleccionado, estudiante.id, 'nombre', e.target.value)}
                        style={{ width: "210px", textAlign: "left", fontWeight: "600" }}
                      />
                    </td>
                    <td>
                      <select
                        value={estudiante.pais}
                        onChange={(e) => actualizarEstudiante(misioneroSeleccionado, estudiante.id, 'pais', e.target.value)}
                        style={{ width: "150px" }}
                      >
                        <option value="">Seleccionar</option>
                        {paisesDelContinente.map(pais => (
                          <option key={pais.id} value={pais.nombre}>{pais.nombre}</option>
                        ))}
                      </select>
                    </td>
                    {diasDelMes.map(dia => (
                      <React.Fragment key={dia}>
                        <td>
                          <input
                            type="text"
                            placeholder="Cap"
                            value={estudiante.estudios?.[dia]?.capitulo || ""}
                            onChange={(e) => actualizarEstudioEstudiante(misioneroSeleccionado, estudiante.id, dia, 'capitulo', e.target.value)}
                            style={{ width: "55px" }}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={estudiante.estudios?.[dia]?.horas || ""}
                            onChange={(e) => actualizarEstudioEstudiante(misioneroSeleccionado, estudiante.id, dia, 'horas', e.target.value)}
                            style={{ width: "50px" }}
                          />
                        </td>
                      </React.Fragment>
                    ))}
                  </tr>
                ))}
                
                {/* Filas vacías FUNCIONALES */}
              {Array.from({ length: Math.max(5 - obtenerEstudiantesActuales(misioneroSeleccionado).length, 0) }).map((_, idx) => {
                  const handleFilaBlur = async (e) => {
                  const fila = e.currentTarget;
                  const relatedTarget = e.relatedTarget;
                  if (fila.contains(relatedTarget)) return; // el foco sigue dentro de la misma fila

                  const numeroInput = fila.querySelector('input[data-campo="numero"]');
                  const nombreInput = fila.querySelector('input[data-campo="nombre"]');
                  const paisSelect  = fila.querySelector('select[data-campo="pais"]');

                  const numero = numeroInput?.value?.trim();
                  const nombre = nombreInput?.value?.trim();
                  const pais   = paisSelect?.value || "";

                  if (nombre) {
                    // Capturar Cap y Hr de cada día antes de limpiar
                    const estudiosCapturados = {};
                    fila.querySelectorAll('input[data-campo="cap"]').forEach(input => {
                      const dia = input.dataset.dia;
                      const cap = input.value.trim();
                      if (cap) {
                        if (!estudiosCapturados[dia]) estudiosCapturados[dia] = {};
                        estudiosCapturados[dia].capitulo = cap;
                      }
                    });
                    
                    fila.querySelectorAll('input[data-campo="hr"]').forEach(input => {
                     console.log('Capturando día:', input.dataset.dia, 'horas:', input.value);
                      const dia = input.dataset.dia;
                      const hr = input.value.trim();
                      if (hr) {
                        if (!estudiosCapturados[dia]) estudiosCapturados[dia] = {};
                        estudiosCapturados[dia].horas = hr;
                      }
                    });

                  // Primero crear el contacto en la BD
                    try {
                      const nuevoContacto = await contactosService.create({
                        nombre: nombre,
                        pais_id: paisSeleccionado,
                        miembro_id: misioneroSeleccionado,
                        telefono: '',
                        notas: '',
                        estado: 'Activo'
                      });
                      
                      const nuevoEst = {
                        id: nuevoContacto.id,
                        numero: nuevoContacto.id,
                        nombre,
                        pais,
                        estudios: estudiosCapturados
                      };
                    
                    const clave = obtenerClave(continenteSeleccionado, paisSeleccionado, mesSeleccionado);
                    setEstudiantes(prev => ({
                      ...prev,
                      [clave]: {
                        ...prev[clave],
                        [misioneroSeleccionado]: [
                          ...(prev[clave]?.[misioneroSeleccionado] || []),
                          nuevoEst
                        ]
                      }
                    }));
                    
                    // Limpiar los campos
                    if (numeroInput) numeroInput.value = "";
                    if (nombreInput) nombreInput.value = "";
                    if (paisSelect)  paisSelect.value  = "";
                    fila.querySelectorAll('input[data-campo="cap"]').forEach(input => input.value = "");
                    fila.querySelectorAll('input[data-campo="hr"]').forEach(input => input.value = "");
                    // Guardar las horas de estudio también
                    const promesasEstudios = [];
                    Object.entries(estudiosCapturados).forEach(([dia, datos]) => {
                      if (datos.horas && datos.horas > 0) {
                        promesasEstudios.push(
                          estudiosService.guardarEstudio({
                            contacto_id: nuevoContacto.id,
                            miembro_responsable_id: misioneroSeleccionado,
                            pais_id: paisSeleccionado,
                            mes: mesSeleccionado,
                            anio: añoActual,
                            dia: parseInt(dia),
                            capitulo: datos.capitulo || '',
                            horas: parseFloat(datos.horas)
                          })
                        );
                      }
                    });
                    
                    if (promesasEstudios.length > 0) {
                      await Promise.all(promesasEstudios);
                    }
                    toast.success('✅ Estudiante guardado en BD');
                  } catch (error) {
                    console.error('Error al guardar contacto:', error);
                    toast.error('Error al guardar estudiante');
                  }
                }
              };  

                const handleKeyDown = (e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const fila = e.currentTarget.closest('tr');
                    const campo = e.currentTarget.dataset.campo;
                    
                    if (campo === 'numero') {
                      const nombreInput = fila.querySelector('input[data-campo="nombre"]');
                      nombreInput?.focus();
                    } else if (campo === 'nombre') {
                      const paisSelect = fila.querySelector('select[data-campo="pais"]');
                      paisSelect?.focus();
                    }
                  }
                };

                return (
                  <tr key={`empty-${idx}`} className="fila-vacia" onBlur={handleFilaBlur}>
                    <td></td>
                    <td>
                      <input 
                        type="text" 
                        data-campo="numero" 
                        placeholder="-" 
                        style={{ width: "70px" }}
                        onKeyDown={handleKeyDown}
                      />
                    </td>
                    <td>
                      <input 
                        type="text" 
                        data-campo="nombre" 
                        placeholder="Nombre" 
                        style={{ width: "210px" }}
                        onKeyDown={handleKeyDown}
                      />
                    </td>
                    <td>
                      <select 
                        data-campo="pais" 
                        style={{ width: "150px" }}
                        onKeyDown={handleKeyDown}
                      >
                        <option value="">Seleccionar</option>
                        {paisesDelContinente.map(pais => (
                          <option key={pais.id} value={pais.nombre}>{pais.nombre}</option>
                        ))}
                      </select>
                    </td>
                    {diasDelMes.map(dia => (
                      <React.Fragment key={dia}>
                        <td><input type="text" data-campo="cap" data-dia={dia} placeholder="Cap" style={{ width: "55px" }} /></td>
                        <td><input type="number" data-campo="hr" data-dia={dia} min="0" placeholder="0" style={{ width: "50px" }} /></td>
                      </React.Fragment>
                    ))}
                  </tr>
                );
              })}
                
                {/* Fila TOTAL GENERAL DE ESTUDIOS - suma HORAS */}
                <tr style={{ background: "#0E5A61", color: "white", fontWeight: "700" }}>
                  <td></td>
                  <td colSpan="3" style={{ textAlign: "left", fontSize: "15px" }}>
                    TOTAL GENERAL DE ESTUDIOS
                  </td>
                  {diasDelMes.map(dia => {
                    const estudiantesLista = obtenerEstudiantesActuales(misioneroSeleccionado);
                    let totalHorasDia = 0;
                    
                    // Sumar HORAS de estudiantes ese día
                    estudiantesLista.forEach(est => {
                      totalHorasDia += parseInt(est.estudios?.[dia]?.horas || 0);
                    });
                    
                    return (
                      <React.Fragment key={dia}>
                        <td></td>
                        <td style={{ fontSize: "17px" }}>{totalHorasDia}</td>
                      </React.Fragment>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>

          <div className="no-print" style={{ marginTop: "20px" }}>
            <button
              onClick={() => {
                setNuevoEstudiante({ numero: "", nombre: "", pais: "" });
                setMostrandoModalEstudiante(true);
              }}
              className="btn-add-new"
            >
              <FaPlus size={18} /> Añadir Estudiante
            </button>
          </div>

          {/* TABLA EVANGELISMO */}
          <div className="tabla-evangelismo">
            <h3 style={{ margin: "0 0 20px 0", color: "#4CAF50", fontSize: "20px" }}>
              Otras Actividades
            </h3>
            
            <div className="scroll-container">
              <table className="tabla-estudios">
                <thead>
                  <tr>
                    <th style={{ minWidth: "150px", background: "#4CAF50 !important" }}>ACTIVIDAD</th>
                    {diasDelMes.map(dia => (
                      <th key={dia} colSpan="2" style={{ minWidth: "120px", background: "#4CAF50 !important" }}>
                        {obtenerDiaSemana(dia, mesSeleccionado, añoActual)} {dia}
                      </th>
                    ))}
                  </tr>
                  <tr>
                    <th style={{ background: "#4CAF50 !important" }}></th>
                    {diasDelMes.map(dia => (
                      <React.Fragment key={dia}>
                        <th style={{ fontSize: "11px", background: "#4CAF50 !important" }}>¿Dónde?</th>
                        <th style={{ fontSize: "11px", background: "#4CAF50 !important" }}>Hrs</th>
                      </React.Fragment>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ textAlign: "left", fontWeight: "700", background: "#C8E6C9" }}>
                      EVANGELISMO VIRTUAL
                    </td>
                    {diasDelMes.map(dia => {
                      const evang = obtenerEvangelismoActual(misioneroSeleccionado);
                      return (
                        <React.Fragment key={dia}>
                          <td>
                            <input
                              type="text"
                              placeholder="Lugar"
                              value={evang.virtual?.[dia]?.donde || ""}
                              onChange={(e) => actualizarEvangelismo(misioneroSeleccionado, 'virtual', dia, 'donde', e.target.value)}
                              style={{ width: "100px" }}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              min="0"
                              placeholder="0"
                              value={evang.virtual?.[dia]?.horas || ""}
                              onChange={(e) => actualizarEvangelismo(misioneroSeleccionado, 'virtual', dia, 'horas', e.target.value)}
                              style={{ width: "60px" }}
                            />
                          </td>
                        </React.Fragment>
                      );
                    })}
                  </tr>
                  
                  <tr>
                    <td style={{ textAlign: "left", fontWeight: "700", background: "#C8E6C9" }}>
                      EVANGELISMO PRESENCIAL
                    </td>
                    {diasDelMes.map(dia => {
                      const evang = obtenerEvangelismoActual(misioneroSeleccionado);
                      return (
                        <React.Fragment key={dia}>
                          <td>
                            <input
                              type="text"
                              placeholder="Lugar"
                              value={evang.presencial?.[dia]?.donde || ""}
                              onChange={(e) => actualizarEvangelismo(misioneroSeleccionado, 'presencial', dia, 'donde', e.target.value)}
                              style={{ width: "100px" }}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              min="0"
                              placeholder="0"
                              value={evang.presencial?.[dia]?.horas || ""}
                              onChange={(e) => actualizarEvangelismo(misioneroSeleccionado, 'presencial', dia, 'horas', e.target.value)}
                              style={{ width: "60px" }}
                            />
                          </td>
                        </React.Fragment>
                      );
                    })}
                  </tr>
                  
                  {/* Fila TOTAL */}
                  <tr style={{ background: "#4CAF50", color: "white", fontWeight: "700" }}>
                    <td style={{ textAlign: "left" }}>TOTAL</td>
                    {diasDelMes.map(dia => {
                      const evang = obtenerEvangelismoActual(misioneroSeleccionado);
                      const totalDia = (parseInt(evang.virtual?.[dia]?.horas || 0) + parseInt(evang.presencial?.[dia]?.horas || 0));
                      return (
                        <React.Fragment key={dia}>
                          <td></td>
                          <td style={{ fontSize: "16px" }}>{totalDia}</td>
                        </React.Fragment>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {mostrandoModalEstudiante && (
        <div className="modal-overlay" onClick={() => setMostrandoModalEstudiante(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "550px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" }}>
              <h3 style={{ margin: 0, color: "#0E5A61", fontSize: "22px", fontWeight: "700" }}>
                <FaPlus style={{ marginRight: "8px" }} />
                Nuevo Estudiante
              </h3>
              <button
                onClick={() => setMostrandoModalEstudiante(false)}
                style={{ background: "none", border: "none", fontSize: "28px", cursor: "pointer", color: "#999", lineHeight: 1 }}
              >
                <FaTimes />
              </button>
            </div>

            <input
              type="text"
              placeholder="Número (opcional)"
              value={nuevoEstudiante.numero}
              onChange={(e) => setNuevoEstudiante({...nuevoEstudiante, numero: e.target.value})}
              className="input-modern"
            />

            <input
              type="text"
              placeholder="Nombre *"
              value={nuevoEstudiante.nombre}
              onChange={(e) => setNuevoEstudiante({...nuevoEstudiante, nombre: e.target.value})}
              className="input-modern"
            />

            <select
              value={nuevoEstudiante.pais}
              onChange={(e) => setNuevoEstudiante({...nuevoEstudiante, pais: e.target.value})}
              className="input-modern"
            >
              <option value="">Seleccione país</option>
              {paisesDelContinente.map(pais => (
                <option key={pais.id} value={pais.nombre}>{pais.nombre}</option>
              ))}
            </select>

            <div style={{ display: "flex", gap: "12px", marginTop: "25px" }}>
              <button onClick={agregarEstudiante} className="btn-primary" style={{ flex: 1, fontSize: "16px", padding: "14px" }}>
                <FaSave /> Guardar
              </button>
              <button onClick={() => setMostrandoModalEstudiante(false)} className="btn-secondary" style={{ flex: 1, fontSize: "16px", padding: "14px" }}>
                <FaTimes /> Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {mostrandoModalMisionero && (
        <div className="modal-overlay" onClick={() => setMostrandoModalMisionero(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "550px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" }}>
              <h3 style={{ margin: 0, color: "#0E5A61", fontSize: "22px", fontWeight: "700" }}>
                <FaPlus style={{ marginRight: "8px" }} />
                Nuevo Misionero
              </h3>
              <button
                onClick={() => setMostrandoModalMisionero(false)}
                style={{ background: "none", border: "none", fontSize: "28px", cursor: "pointer", color: "#999", lineHeight: 1 }}
              >
                <FaTimes />
              </button>
            </div>

            <input
              type="text"
              placeholder="Nombre del misionero"
              value={nuevoMisionero}
              onChange={(e) => setNuevoMisionero(e.target.value)}
              className="input-modern"
            />

            <div style={{ display: "flex", gap: "12px", marginTop: "25px" }}>
              <button onClick={agregarMisionero} className="btn-primary" style={{ flex: 1, fontSize: "16px", padding: "14px" }}>
                <FaSave /> Guardar
              </button>
              <button onClick={() => setMostrandoModalMisionero(false)} className="btn-secondary" style={{ flex: 1, fontSize: "16px", padding: "14px" }}>
                <FaTimes /> Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {mostrandoPromptContinente && (
        <div className="modal-overlay" onClick={() => setMostrandoPromptContinente(false)}>
          <div className="modal-prompt" onClick={(e) => e.stopPropagation()}>
            <h4 style={{ margin: "0 0 20px 0", color: "#333", fontSize: "18px" }}>
              Nombre del nuevo continente:
            </h4>

            <input
              type="text"
              value={nuevoNombreContinente}
              onChange={(e) => setNuevoNombreContinente(e.target.value)}
              className="input-modern"
              placeholder="Ej: Europa"
              autoFocus
            />

            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button onClick={agregarContinente} className="btn-prompt-aceptar">
                Aceptar
              </button>
              <button onClick={() => setMostrandoPromptContinente(false)} className="btn-prompt-cancelar">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {mostrandoPromptPais && (
        <div className="modal-overlay" onClick={() => setMostrandoPromptPais(false)}>
          <div className="modal-prompt" onClick={(e) => e.stopPropagation()}>
            <h4 style={{ margin: "0 0 20px 0", color: "#333", fontSize: "18px" }}>
              Nombre del nuevo país:
            </h4>

            <input
              type="text"
              value={nuevoNombrePais}
              onChange={(e) => setNuevoNombrePais(e.target.value)}
              className="input-modern"
              placeholder="Ej: Panamá"
              autoFocus
            />

            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button onClick={agregarPais} className="btn-prompt-aceptar">
                Aceptar
              </button>
              <button onClick={() => setMostrandoPromptPais(false)} className="btn-prompt-cancelar">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {mostrandoEstadisticas && (
        <div className="modal-overlay" onClick={() => setMostrandoEstadisticas(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "900px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
              <h3 style={{ margin: 0, color: "#0E5A61", fontSize: "24px", fontWeight: "700" }}>
                <FaChartLine style={{ marginRight: "10px" }} />
                Estadísticas - {mesSeleccionado} {añoActual}
              </h3>
              <button
                onClick={() => setMostrandoEstadisticas(false)}
                style={{ background: "none", border: "none", fontSize: "28px", cursor: "pointer", color: "#999", lineHeight: 1 }}
              >
                <FaTimes />
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "18px", marginBottom: "30px" }}>
              <div style={{ background: "#E3F2FD", padding: "24px", borderRadius: "14px" }}>
                <div style={{ fontSize: "15px", color: "#666", marginBottom: "8px" }}>Total Estudios</div>
                <div style={{ fontSize: "38px", fontWeight: "700", color: "#0E5A61" }}>
                  {misioneros.reduce((sum, m) => sum + calcularTotalEstudiosMisionero(m.id), 0)}
                </div>
              </div>
              <div style={{ background: "#E8F5E9", padding: "24px", borderRadius: "14px" }}>
                <div style={{ fontSize: "15px", color: "#666", marginBottom: "8px" }}>Total Horas</div>
                <div style={{ fontSize: "38px", fontWeight: "700", color: "#4CAF50" }}>
                  {misioneros.reduce((sum, m) => sum + calcularTotalHorasMisionero(m.id), 0)}
                </div>
              </div>
              <div style={{ background: "#FFF3E0", padding: "24px", borderRadius: "14px" }}>
                <div style={{ fontSize: "15px", color: "#666", marginBottom: "8px" }}>Total Estudiantes</div>
                <div style={{ fontSize: "38px", fontWeight: "700", color: "#FF9800" }}>
                  {Object.values(obtenerEstudiantesActuales()).reduce((sum, lista) => sum + (lista?.length || 0), 0)}
                </div>
              </div>
              <div style={{ background: "#F3E5F5", padding: "24px", borderRadius: "14px" }}>
                <div style={{ fontSize: "15px", color: "#666", marginBottom: "8px" }}>Misioneros Activos</div>
                <div style={{ fontSize: "38px", fontWeight: "700", color: "#9C27B0" }}>
                  {misioneros.filter(m => calcularTotalEstudiosMisionero(m.id) > 0).length}
                </div>
              </div>
            </div>

            <h4 style={{ color: "#0E5A61", marginBottom: "18px", fontSize: "18px" }}>Por Misionero:</h4>
            <div style={{ maxHeight: "300px", overflowY: "auto" }}>
              <table className="tabla-estudios">
                <thead>
                  <tr>
                    <th>Misionero</th>
                    <th>Estudios</th>
                    <th>Horas</th>
                    <th>Estudiantes</th>
                    <th>Promedio</th>
                  </tr>
                </thead>
                <tbody>
                  {misioneros.filter(m => m.pais_id === paisSeleccionado).map(m => {
                    const estudios = calcularTotalEstudiosMisionero(m.id);
                    const horas = calcularTotalHorasMisionero(m.id);
                    const estudiantesLista = obtenerEstudiantesActuales(m.id);
                    const promedio = estudiantesLista.length > 0 ? (estudios / estudiantesLista.length).toFixed(1) : 0;
                    
                    return (
                      <tr key={m.id}>
                        <td style={{ textAlign: "left", fontWeight: "600" }}>{m.nombre}</td>
                        <td>{estudios}</td>
                        <td>{horas}</td>
                        <td>{estudiantesLista.length}</td>
                        <td>{promedio}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: "25px", textAlign: "right" }}>
              <button onClick={() => setMostrandoEstadisticas(false)} className="btn-secondary" style={{ padding: "12px 28px" }}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
