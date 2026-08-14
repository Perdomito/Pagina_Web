import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaPlus, FaTrash, FaPrint, FaSave, FaTimes, FaUser, FaCalendarAlt, FaBook, FaChartBar, FaGlobe, FaChartLine, FaUserPlus } from "react-icons/fa";
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

//
import contactosService from '../services/ContactosService';
import miembrosService from '../services/MiembrosService';
import estudiosService, { MESES } from '../services/EstudiosService';
import administracionService from '../services/AdministracionService';
import { useIdioma } from '../context/IdiomaContext';

const MESES_ARR = ["ENERO","FEBRERO","MARZO","ABRIL","MAYO","JUNIO","JULIO","AGOSTO","SEPTIEMBRE","OCTUBRE","NOVIEMBRE","DICIEMBRE"];
const toMesNum = (mes) => typeof mes === 'string' ? MESES_ARR.indexOf(mes) + 1 : mes;

export default function EstudiosBiblicos() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, idioma } = useIdioma();
  const tx = (es, en) => (idioma === 'en' ? en : es); // texto bilingüe directo, para etiquetas que aún no están en el diccionario del traductor
  const [continenteSeleccionado, setContinenteSeleccionado] = useState(null);
  const [paisSeleccionado, setPaisSeleccionado] = useState(null);
  const [mesSeleccionado, setMesSeleccionado] = useState(null);
  const [misioneroSeleccionado, setMissionarySeleccionado] = useState(null);
  const [busquedaEstudiante, setBusquedaEstudiante] = useState('');
  const [vistaActual, setVistaActual] = useState("resumen");
  
  const [mostrandoModalEstudiante, setMostrandoModalEstudiante] = useState(false);
  const [mostrandoModalMissionary, setMostrandoModalMissionary] = useState(false);
  const [mostrandoEstadisticas, setMostrandoEstadisticas] = useState(false);
  const [mostrandoPromptPais, setMostrandoPromptPais] = useState(false);
  
  const [fechaActual] = useState(new Date());
  const mesActualNombre = fechaActual.toLocaleDateString('es-ES', { month: 'long' }).toUpperCase();
  const [añoActual, setAñoActual] = useState(fechaActual.getFullYear());
  const añosDisponibles = Array.from({ length: 5 }, (_, i) => fechaActual.getFullYear() - i); // ultimos 5 años
  
  //
const [, setCargandoDatos] = useState(false);

 const [continentes, setContinentes] = useState([]);
 const [roles, setRoles] = useState([]);
  
  const meses = [
    "ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO",
    "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"
  ];
  
 const [misioneros, setMissionarys] = useState([]);
  
  const [datosStudies, setDatosStudies] = useState({});
  const [students, setEstudiantes] = useState({});
  const [evangelismoData, setEvangelismoData] = useState({});
  const [studentsQueDigeronSi, setEstudiantesQueDigeronSi] = useState({});
  const [nuevosContactos, setNuevosContactos] = useState({});
  const [potenciales, setPotenciales] = useState({});
  
  const [alertaModal, setAlertaModal] = useState({ visible: false, titulo: '', mensaje: '' });
  const [nuevoEstudiante, setNuevoEstudiante] = useState({
    numero: "",
    nombre: "",
    pais: ""
  });
  const [nuevoMissionary, setNuevoMissionary] = useState("");
  const [nuevoNombrePais, setNuevoNombrePais] = useState("");
  const [continenteParaPais, setContinenteParaPais] = useState(null);
  
// CARGAR DATOS INICIALES DE LA API
useEffect(() => {
  cargarDatosIniciales();
}, []);

const cargarDatosIniciales = async () => {
  try {
    setCargandoDatos(true);
    
    const continentesData = await administracionService.getAllContinentes();
    setContinentes(continentesData);

    administracionService.getAllRoles().then(setRoles).catch(() => setRoles([]));
    
    // Cargar countries desde la API
    const paisesData = await administracionService.getAllPaises();
    
    // Agrupar countries por continente
    const continentesConPaises = continentesData.map(cont => ({
      id: cont.id,
      nombre: cont.nombre,
      paises: paisesData.filter(p => p.continente_id === cont.id)
    }));
    
    setContinentes(continentesConPaises);
    
// Cargar miembros COMPROMETIDOS (sin filtro de país todavía)
    const miembrosData = await miembrosService.getAll({ tipo_miembro: 'Comprometido' });
    setMissionarys(miembrosData); 
    
  } catch (error) {
    console.error('Error al cargar datos iniciales:', error);
    toast.error(t('eb_errorCargarDatos'));
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
      
      // SOLO inicializar datosStudies si no existe
      if (!datosStudies[clave]) {
        setDatosStudies(prev => ({
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
  // cargarContactosDelPais removido — cargarDatosGuardados maneja los estudiantes directamente
  // Cargar datos guardados desde la BD
  useEffect(() => {
    const cargarDatosGuardados = async () => {
      if (!paisSeleccionado || !mesSeleccionado) return;
   //   if (misioneros.length === 0) return; // Wait for missionaries to load


      
try {
        const pais = continentes.find(c => c.id === continenteSeleccionado)?.paises.find(p => p.id === paisSeleccionado);
        if (!pais) return;
        
        const resumenRaw = await estudiosService.getResumenCompleto(pais.id, mesSeleccionado, añoActual);
              
        // Separar array plano en categorías
        const resumen = {
          evangelismo: resumenRaw.filter(r => r.tipo !== null && r.contacto_id === null),
          nuevosEstudiantes: resumenRaw.filter(r => r.tipo === null && r.contacto_id === null && (r.dijeron_si > 0 || r.nuevos_contactos > 0 || r.potenciales > 0)),
          estudios: resumenRaw.filter(r => r.contacto_id !== null)
        };
        
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
        
        // Procesar nuevos students
        if (resumen.nuevosEstudiantes && resumen.nuevosEstudiantes.length > 0) {
          const dijeronSiData = {};
          const contactosData = {};
          const potencialesData = {};

          resumen.nuevosEstudiantes.forEach(ne => {
            if (!dijeronSiData[ne.miembro_id]) {
              dijeronSiData[ne.miembro_id] = {};
              contactosData[ne.miembro_id] = {};
              potencialesData[ne.miembro_id] = {};
            }
            dijeronSiData[ne.miembro_id][ne.dia] = ne.dijeron_si;
            contactosData[ne.miembro_id][ne.dia] = ne.nuevos_contactos;
            potencialesData[ne.miembro_id][ne.dia] = ne.potenciales;
          });

          setEstudiantesQueDigeronSi(prev => ({
            ...prev,
            [clave]: dijeronSiData
          }));

          setNuevosContactos(prev => ({
            ...prev,
            [clave]: contactosData
          }));

          setPotenciales(prev => ({
            ...prev,
            [clave]: potencialesData
          }));
        }
        
        // Procesar estudios (horas por estudiante por día)
        if (resumen.estudios && resumen.estudios.length > 0) {
          // Cargar contactos para obtener nombres/teléfonos si no vienen en el resumen
          let contactosMap = {};
          try {
            const contactosList = await contactosService.getAll({ pais_id: paisSeleccionado });
            contactosList.forEach(c => { contactosMap[c.id] = c; });
          } catch {}

          const studentsPorMissionary = {};
          
          resumen.estudios.forEach(est => {
            const misioneroId = est.miembro_id;
            if (!studentsPorMissionary[misioneroId]) {
              studentsPorMissionary[misioneroId] = [];
            }
            
            let estudiante = studentsPorMissionary[misioneroId].find(e => e.id === est.contacto_id);
            if (!estudiante) {
              const contactoBD = contactosMap[est.contacto_id] || {};
              estudiante = {
                id: est.contacto_id,
                numero: contactoBD.telefono || contactoBD.phone || contactoBD.numero || contactoBD.celular || est.telefono || est.numero || '-',
                nombre: contactoBD.nombre || est.contacto_nombre || '',
                pais: contactoBD.pais_nombre || '',
                estudios: {}
              };
              studentsPorMissionary[misioneroId].push(estudiante);
            }
            
            // Si ya hay una sesión guardada ese mismo día (varias sesiones el
            // mismo día con el mismo contacto), sumar en vez de sobrescribir —
            // antes se perdían todas menos la última (causaba conteos de menos,
            // ej. Francisca Mayo Nicaragua: 87 en vez de 108)
            const previo = estudiante.estudios[est.dia];
            estudiante.estudios[est.dia] = {
              capitulo: est.capitulo,
              horas: (parseFloat(previo?.horas) || 0) + (parseFloat(est.horas) || 0),
              cantidad: (previo?.cantidad || 0) + 1,
            };
          });
          
          // Mergear con todos los contactos del país — incluir los que no tienen horas aún
          Object.entries(contactosMap).forEach(([id, contacto]) => {
            const misioneroId = contacto.miembro_responsable_id;
            if (!misioneroId) return;
            if (!studentsPorMissionary[misioneroId]) {
              studentsPorMissionary[misioneroId] = [];
            }
            const yaExiste = studentsPorMissionary[misioneroId].find(e => e.id === contacto.id);
            if (!yaExiste) {
              studentsPorMissionary[misioneroId].push({
                id: contacto.id,
                numero: contacto.telefono || contacto.phone || contacto.numero || '-',
                nombre: contacto.nombre,
                pais: contacto.pais_nombre || '',
                estudios: {}
              });
            }
          });

          // Ordenar por id para mantener orden de creación
          Object.keys(studentsPorMissionary).forEach(mid => {
            studentsPorMissionary[mid].sort((a, b) => a.id - b.id);
          });

          setEstudiantes(prev => ({
            ...prev,
            [clave]: studentsPorMissionary
          }));
        } else {
          // No hay estudios guardados — cargar contactos del país como base
          try {
            const contactosData = await contactosService.getAll({ pais_id: paisSeleccionado });
            const studentsPorMissionary = {};
            contactosData.forEach(contacto => {
              const misioneroId = contacto.miembro_responsable_id;
              if (!studentsPorMissionary[misioneroId]) {
                studentsPorMissionary[misioneroId] = [];
              }
              studentsPorMissionary[misioneroId].push({
                id: contacto.id,
                numero: contacto.telefono || String(contacto.id),
                nombre: contacto.nombre,
                pais: contacto.pais_nombre || '',
                estudios: {}
              });
            });
            Object.keys(studentsPorMissionary).forEach(mid => {
              studentsPorMissionary[mid].sort((a, b) => a.id - b.id);
            });
            setEstudiantes(prev => ({
              ...prev,
              [clave]: studentsPorMissionary
            }));
          } catch (e) {
            console.error('Error al cargar contactos fallback:', e);
          }
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
    const estud = students[clave] || {};
    if (!misioneroId) return estud;
    const lista = estud[misioneroId] || [];
    return [...lista].sort((a, b) => (a.nombre || '').localeCompare(b.nombre || '', 'es', { sensitivity: 'base' }));
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
    const data = studentsQueDigeronSi[clave] || {};
    return misioneroId ? (data[misioneroId] || {}) : data;
  };
  
  const obtenerContactosActual = (misioneroId = null) => {
    if (!continenteSeleccionado || !paisSeleccionado || !mesSeleccionado) return {};
    const clave = obtenerClave(continenteSeleccionado, paisSeleccionado, mesSeleccionado);
    const data = nuevosContactos[clave] || {};
    return misioneroId ? (data[misioneroId] || {}) : data;
  };

  const obtenerPotencialesActual = (misioneroId = null) => {
    if (!continenteSeleccionado || !paisSeleccionado || !mesSeleccionado) return {};
    const clave = obtenerClave(continenteSeleccionado, paisSeleccionado, mesSeleccionado);
    const data = potenciales[clave] || {};
    return misioneroId ? (data[misioneroId] || {}) : data;
  };

  const calcularTotalStudiesMissionary = (misioneroId) => {
    const studentsLista = obtenerEstudiantesActuales(misioneroId);
    const diasDelMes = mesSeleccionado ? obtenerDiasDelMes(mesSeleccionado, añoActual) : [];
    let totalStudies = 0;
    
    studentsLista.forEach(est => {
      diasDelMes.forEach(dia => {
        if (est.estudios?.[dia]?.capitulo && est.estudios?.[dia]?.capitulo.trim() !== "") {
          totalStudies += (est.estudios[dia].cantidad || 1);
        }
      });
    });
    
    return totalStudies;
  };
  
  const calcularTotalStudiesDia = (dia) => {
    let total = 0;
    misioneros.forEach(m => {
      const studentsLista = obtenerEstudiantesActuales(m.id);
      studentsLista.forEach(est => {
        // Contar estudios reales (capitulo registrado), no sumar horas --
        // sumar horas daba 0 para datos que no tienen ese campo cargado
        const capitulo = est.estudios?.[dia]?.capitulo;
        if (capitulo !== undefined && capitulo !== null && capitulo !== "") {
          total += (est.estudios[dia].cantidad || 1);
        }
      });
    });
    return total;
  };
  
  const calcularHoursEvangelismo = (misioneroId, dia) => {
    const studentsLista = obtenerEstudiantesActuales(misioneroId);
    let totalHours = 0;
    
    studentsLista.forEach(est => {
      const horas = est.estudios?.[dia]?.horas || 0;
      totalHours += parseInt(horas) || 0;
    });
    
    return totalHours;
  };
  
  const calcularTotalHoursMissionary = (misioneroId) => {
    const diasDelMes = mesSeleccionado ? obtenerDiasDelMes(mesSeleccionado, añoActual) : [];
    let total = 0;
    diasDelMes.forEach(dia => {
      total += calcularHoursEvangelismo(misioneroId, dia);
    });
    
    const evang = obtenerEvangelismoActual(misioneroId);
    diasDelMes.forEach(dia => {
      total += parseInt(evang.virtual?.[dia]?.horas || 0);
      total += parseInt(evang.presencial?.[dia]?.horas || 0);
    });
    
    return total;
  };

  // Solo las horas de Evangelismo (virtual + presencial), SIN mezclar con las horas
  // de estudio bíblico — para que "Total de Horas" coincida con la tabla de Evangelismo
  const calcularHorasEvangelismoSolo = (misioneroId) => {
    const diasDelMes = mesSeleccionado ? obtenerDiasDelMes(mesSeleccionado, añoActual) : [];
    const evang = obtenerEvangelismoActual(misioneroId);
    let total = 0;
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
        mes: toMesNum(mesSeleccionado),
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
  const potencialesCantidad = potenciales[clave]?.[misioneroId]?.[dia] || 0;

  estudiosService.guardarNuevosEstudiantes({
    miembro_id: misioneroId,
    pais_id: paisSeleccionado,
    mes: toMesNum(mesSeleccionado),
    anio: añoActual,
    dia: parseInt(dia),
    dijeron_si: parseInt(cantidad || 0),
    nuevos_contactos: parseInt(contactosCantidad || 0),
    potenciales: parseInt(potencialesCantidad || 0)
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
  const dijeronSiCantidad = studentsQueDigeronSi[clave]?.[misioneroId]?.[dia] || 0;
  const potencialesCantidad = potenciales[clave]?.[misioneroId]?.[dia] || 0;

  estudiosService.guardarNuevosEstudiantes({
    miembro_id: misioneroId,
    pais_id: paisSeleccionado,
    mes: toMesNum(mesSeleccionado),
    anio: añoActual,
    dia: parseInt(dia),
    dijeron_si: parseInt(dijeronSiCantidad || 0),
    nuevos_contactos: parseInt(cantidad || 0),
    potenciales: parseInt(potencialesCantidad || 0)
  }).catch(err => console.error('Error autoguardando:', err));
};

const actualizarPotenciales = (misioneroId, dia, cantidad) => {
  const clave = obtenerClave(continenteSeleccionado, paisSeleccionado, mesSeleccionado);

  setPotenciales(prev => ({
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
  const dijeronSiCantidad = studentsQueDigeronSi[clave]?.[misioneroId]?.[dia] || 0;
  const contactosCantidad = nuevosContactos[clave]?.[misioneroId]?.[dia] || 0;

  estudiosService.guardarNuevosEstudiantes({
    miembro_id: misioneroId,
    pais_id: paisSeleccionado,
    mes: toMesNum(mesSeleccionado),
    anio: añoActual,
    dia: parseInt(dia),
    dijeron_si: parseInt(dijeronSiCantidad || 0),
    nuevos_contactos: parseInt(contactosCantidad || 0),
    potenciales: parseInt(cantidad || 0)
  }).catch(err => console.error('Error autoguardando:', err));
};

  const agregarEstudiante = async () => {
    if (!nuevoEstudiante.nombre || !misioneroSeleccionado) {
      toast.error(t('eb_completeNombre'));
      return;
    }

    // Bloquear si es mes pasado
    const mesIdx = MESES_ARR.indexOf(mesSeleccionado);
    const mesActualIdx = MESES_ARR.indexOf(mesActualNombre);
    if (mesIdx < mesActualIdx && añoActual === new Date().getFullYear()) {
      toast.error(t('eb_noAgregarMesPasadoToast'));
      return;
    }

    const clave = obtenerClave(continenteSeleccionado, paisSeleccionado, mesSeleccionado);

    try {
      const misionero = misioneros.find(m => m.id === misioneroSeleccionado);
      const nuevoContacto = await contactosService.create({
        nombre: nuevoEstudiante.nombre,
        miembro_responsable: misionero?.nombre || '',
        miembro_responsable_id: misioneroSeleccionado,
        pais_id: paisSeleccionado,
        telefono: nuevoEstudiante.numero || '',
        notas: '',
      });

      const estudiante = {
        id: nuevoContacto.id,
        numero: nuevoEstudiante.numero || '',
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
      toast.success(t('eb_estudianteAgregado'));
    } catch {
      toast.error(t('eb_errorGuardarEstudiante'));
    }
  };
  
  const eliminarEstudiante = async (misioneroId, estudianteId) => {
    const clave = obtenerClave(continenteSeleccionado, paisSeleccionado, mesSeleccionado);
    
    // Verificar si tiene datos (horas registradas en cualquier mes)
    const estudiante = students[clave]?.[misioneroId]?.find(e => e.id === estudianteId);
    const tieneHoras = estudiante?.estudios && Object.values(estudiante.estudios).some(d => parseFloat(d.horas) > 0);
    
    if (tieneHoras) {
      setAlertaModal({ visible: true, titulo: t('eb_alertaTituloNoEliminar'), mensaje: t('eb_alertaMensajeNoEliminar') });
      return;
    }

    if (!window.confirm(t('eb_confirmarEliminarEstudiante'))) return;
    
    try {
      await contactosService.delete(estudianteId);
    } catch {}

    // Solo quitar del mes actual, el histórico queda intacto
    setEstudiantes(prev => ({
      ...prev,
      [clave]: {
        ...prev[clave],
        [misioneroId]: (prev[clave]?.[misioneroId] || []).filter(e => e.id !== estudianteId)
      }
    }));
    
    toast.success(t('eb_estudianteEliminado'));
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
  const estudianteActual = students[clave]?.[misioneroId]?.find(e => e.id === estudianteId);
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
      miembro_id: misioneroId,
      pais_id: paisSeleccionado,
      mes: MESES[mesSeleccionado] ?? Number(mesSeleccionado),
      anio: añoActual,
      dia: parseInt(dia),
      capitulo: capituloActual,
      horas: parseFloat(horasActual || 0)
    }).catch(err => {
      console.error('Error autoguardando:', err);
      toast.error(t('eb_errorGuardarEstudio'));
    });
  }
};
  
  
const agregarPais = async () => {
  if (!nuevoNombrePais.trim()) {
    toast.error(t('eb_nombrePaisRequerido'));
    return;
  }

  if (!continenteParaPais) {
    toast.error(t('eb_seleccionaContinentePrimero'));
    return;
  }
  
  try {
    setCargandoDatos(true);
    
    // Verificar si el país ya existe
    const continente = continentes.find(c => c.id === continenteParaPais);
    const yaExiste = continente?.paises.some(p => p.nombre.toLowerCase() === nuevoNombrePais.trim().toLowerCase());
    
    if (yaExiste) {
      toast.error(t('eb_paisYaExiste'));
      return;
    }
    
    // Crear país en la BD
const nuevoPais = await administracionService.crearPaisConContinente({
      nombre: nuevoNombrePais.trim(),
      continente_id: continenteParaPais,
      codigo_iso: '',
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
    toast.success(t('eb_paisCreado'));

  } catch (error) {
    console.error('Error al crear país:', error);
    toast.error(t('eb_errorCrearPais') + (error.response?.data?.error || error.message));
  } finally {
    setCargandoDatos(false);
  }
};
  
const eliminarPais = async (continenteId, paisId) => {
    if (!window.confirm(t('eb_confirmarEliminarPais'))) return;
    
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
      
      toast.success(t('eb_paisEliminado'));
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.response?.data?.error || t('eb_errorEliminarPais'));
    }
  };
  
  const agregarMissionary = () => {
    if (!nuevoMissionary.trim()) {
      toast.error(t('eb_ingreseNombre'));
      return;
    }
    
    const nuevoM = {
      id: Date.now(),
      nombre: nuevoMissionary.trim()
    };
    
    setMissionarys([...misioneros, nuevoM]);
    setMostrandoModalMissionary(false);
    setNuevoMissionary("");
    toast.success(t('eb_misioneroAgregado'));
  };

  const eliminarMissionary = (id) => {
    if (!window.confirm(t('eb_confirmarEliminarMisionero'))) return;
    setMissionarys(misioneros.filter(m => m.id !== id));
    toast.success(t('eb_misioneroEliminado'));
  };

  const obtenerDiaSemana = (dia, mes, año) => {
    const dias = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    const mesIndex = meses.indexOf(mes);
    const fecha = new Date(año, mesIndex, dia);
    return t(`eb_dow_${dias[fecha.getDay()]}`);
  };

  const nombreMes = (mes) => mes ? t(`eb_mes_${mes}`) : mes;

  const paisesDelContinente = continenteSeleccionado 
    ? continentes.find(c => c.id === continenteSeleccionado)?.paises || []
    : [];

  const esAdmin = user?.rol_id === 1;
  const esPastor = !esAdmin && roles.find(r => r.id === user?.rol_id)?.nombre?.toLowerCase() === 'pastor';
  // Admin ve todo, Pastor ve toda su región, cualquier otro rol ve solo su propio país.
  const puedeVerVariosPaises = esAdmin || esPastor;
  
  const diasDelMes = mesSeleccionado ? obtenerDiasDelMes(mesSeleccionado, añoActual) : [];

  return (
    <div style={{ minHeight: "100vh", background: "#f5f7fa", padding: "20px", fontFamily: "'Lato', sans-serif" }}>
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
          font-family: 'Lato', sans-serif;
          background: #1a5490;
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
          border-color: #1a5490;
          box-shadow: 0 0 0 3px rgba(26,84,144,0.1);
        }
        .tabla-estudios .total-final {
          background: #1a5490;
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
          font-family: 'Lato', sans-serif;
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
          background: linear-gradient(135deg, #1a5490 0%, #2a72b8 100%);
          color: white;
        }
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(26,84,144,0.3);
        }
        .btn-secondary {
          background: #f5f7fa;
          color: #333;
          border: 2px solid #e0e0e0;
        }
        .btn-secondary:hover {
          background: #e8ecef;
          border-color: #1a5490;
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
          border-color: #1a5490;
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
          border-color: #1a5490;
          box-shadow: 0 0 0 4px rgba(26,84,144,0.1);
        }
.btn-prompt-aceptar {
          background: linear-gradient(135deg, #1a5490 0%, #2a72b8 100%);
          color: white;
          border: none;
          padding: 12px 28px;
          border-radius: 10px;
          cursor: pointer;
          font-weight: 700;
          font-size: 15px;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(26, 84, 144, 0.3);
        }
        .btn-prompt-aceptar:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(26, 84, 144, 0.4);
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
        background: "linear-gradient(135deg, #1a5490 0%, #2a72b8 100%)", 
        borderRadius: "16px", 
        padding: "30px",
        marginBottom: "30px",
        boxShadow: "0 8px 24px rgba(26,84,144,0.2)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
        <button 
           // onClick={() => navigate("/home")}

            onClick={() => {
            if (misioneroSeleccionado) {
              setMissionarySeleccionado(null);
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
            <FaArrowLeft /> {t('volver')}
          </button>

          <h1 style={{ color: "white", margin: 0, fontSize: "28px", fontFamily: "'Cinzel', serif", letterSpacing: "1px" }}>
            <FaBook style={{ marginRight: "10px" }} />
            {t('estudiosBiblicos')} {añoActual}
          </h1>
<div style={{ display: "flex", gap: "10px" }}>
            {mesSeleccionado && (
              <>
                <button
                  onClick={() => setMostrandoEstadisticas(true)}
                  className="no-print" style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(10px)", border: "1.5px solid rgba(255,255,255,0.4)", borderRadius: "8px", padding: "8px 18px", color: "white", fontSize: "13px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <FaChartLine /> {t('estadisticas')}
                </button>

              </>
            )}

          </div>
        </div>

        {mesSeleccionado && (
          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            <button
              onClick={() => {
                setContinenteSeleccionado(null);
                setPaisSeleccionado(null);
                setMesSeleccionado(null);
                setMissionarySeleccionado(null);
                setVistaActual("resumen");
              }}
              style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(10px)", border: "1.5px solid rgba(255,255,255,0.4)", borderRadius: "8px", padding: "8px 18px", color: "white", fontSize: "13px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
            >
              <FaGlobe size={13} /> {t('eb_cambiarRegion')}
            </button>

            <div style={{ flex: 1 }}></div>
            <div style={{ color: "white", fontSize: "16px", fontWeight: "600" }}>
              {continentes.find(c => c.id === continenteSeleccionado)?.nombre} • {paisesDelContinente.find(p => p.id === paisSeleccionado)?.nombre} • {nombreMes(mesSeleccionado)}
            </div>
          </div>
        )}
      </div>

      {/* SELECCIÓN DE CONTINENTE */}
      {!continenteSeleccionado && (
        <div style={{ position: "relative" }}>
          <h2 style={{ margin: "0 0 8px 0", color: "#134069", fontFamily: "'Cinzel',serif", fontSize: "18px", position: "relative" }}>
            <FaGlobe style={{ marginRight: "10px" }} />
            {t('eb_seleccionaContinente')}
          </h2>
          {user?.region && (
            <p style={{ color: "#8a97b0", fontSize: "13px", margin: "0 0 20px", fontFamily: "'Lato',sans-serif" }}>
              Your region: <strong style={{ color: "#134069" }}>{user.region}</strong>
            </p>
          )}
<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "16px", position: "relative" }}>
{continentes.map(cont => {
              const esDelUsuario = (user?.pais_id && cont.paises?.some(p => p.id === user.pais_id)) ||
                (user?.region && (
                  cont.nombre?.toLowerCase().includes(user.region?.toLowerCase()) ||
                  user.region?.toLowerCase().includes(cont.nombre?.toLowerCase())
                ));
              const puedeEntrar = user?.rol_id === 1 || esDelUsuario || (!user?.pais_id && !user?.region);
              return (
                <div
                  key={cont.id}
                  className="card-item"
                    onClick={() => { if (puedeEntrar) setContinenteSeleccionado(cont.id); }}
                  style={{
                    opacity: puedeEntrar ? 1 : 0.45,
                    cursor: puedeEntrar ? "pointer" : "not-allowed",
                    border: esDelUsuario ? "2px solid #134069" : "1px solid #e8edf5",
                    background: esDelUsuario ? "#f0f4fa" : "white",
                    borderRadius: "12px",
                    padding: "20px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    position: "relative"
                  }}
                >
                  {esDelUsuario && (
                    <div style={{ position: "absolute", top: 10, right: 10, background: "#134069", color: "white", fontSize: "10px", fontWeight: "700", borderRadius: "6px", padding: "2px 8px", fontFamily: "'Lato',sans-serif" }}>
                      YOUR REGION
                    </div>
                  )}
                  <div style={{ fontSize: "18px", fontWeight: "700", color: esDelUsuario ? "#134069" : "#1a2d5a", marginBottom: "6px", fontFamily: "'Cinzel',serif" }}>
                    {cont.nombre}
                  </div>
                  <div style={{ fontSize: "13px", color: "#8a97b0", fontFamily: "'Lato',sans-serif" }}>
                    {cont.paises?.length || 0} {t('eb_countries')}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mapamundi centrado debajo de las tarjetas */}
          <div style={{ display: "flex", justifyContent: "center", marginTop: "10px" }}>
            <img
              src="/mapamundi.png"
              alt="World map"
              onError={(e) => { e.target.style.display = 'none'; }}
              style={{
                width: "100%",
                maxWidth: "1100px",
                maxHeight: "450px",
                objectFit: "contain",
                opacity: 0.9,
                pointerEvents: "none"
              }}
            />
          </div>
        </div>
      )}

      {/* SELECCIÓN DE PAÍS */}
      {continenteSeleccionado && !paisSeleccionado && (
        <div>
          <h2 style={{ margin: "0 0 20px 0", color: "#1a5490" }}>
            {t('eb_seleccionaPais')}
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "20px" }}>
            {paisesDelContinente.map(pais => {
              const esSuPais = pais.id === user?.pais_id;
              const puedeEntrarPais = puedeVerVariosPaises || esSuPais;
              return (
              <div
                key={pais.id}
                className="card-item"
                onClick={() => { if (puedeEntrarPais) setPaisSeleccionado(pais.id); }}
                style={{
                  opacity: puedeEntrarPais ? 1 : 0.45,
                  cursor: puedeEntrarPais ? "pointer" : "not-allowed",
                  border: esSuPais ? "2px solid #134069" : undefined,
                }}
              >
                {puedeVerVariosPaises && (
                  <button
                    className="card-delete-btn no-print"
                    onClick={(e) => {
                      e.stopPropagation();
                      eliminarPais(continenteSeleccionado, pais.id);
                    }}
                  >
                    <FaTrash size={14} />
                  </button>
                )}
                <div style={{ fontSize: "20px", fontWeight: "700", color: "#1a5490" }}>
                  {pais.nombre}
                </div>
              </div>
            );})}
            {puedeVerVariosPaises && (
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
                <div style={{ fontSize: "16px", fontWeight: "700" }}>New Country</div>
              </div>
            </div>
            )}
          </div>
        </div>
      )}

      {/* SELECCIÓN DE MES */}
      {continenteSeleccionado && paisSeleccionado && !mesSeleccionado && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
            <h2 style={{ margin: 0, color: "#1a5490" }}>
              <FaCalendarAlt style={{ marginRight: "10px" }} />
              {tx('Selecciona un Mes', 'Select a Month')}
            </h2>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "13px", color: "#666", fontWeight: "600" }}>{tx('Año:', 'Year:')}</span>
              <select
                value={añoActual}
                onChange={(e) => setAñoActual(Number(e.target.value))}
                style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "14px", fontWeight: "600" }}
              >
                {añosDisponibles.map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "15px" }}>
            {meses.map((mes, index) => {
              const mesIndex = meses.indexOf(mesActualNombre);
              const esAñoReal = añoActual === fechaActual.getFullYear();
              const esActual = mes === mesActualNombre && esAñoReal;
              const esPasado = !esAñoReal ? (añoActual < fechaActual.getFullYear()) : index < mesIndex;
              const esFuturo = esAñoReal && index > mesIndex;
              
              return (
                <div
                  key={mes}
                  className="card-item"
                  onClick={() => { if (!esFuturo) { setMesSeleccionado(null); setTimeout(() => setMesSeleccionado(mes), 500); } }}
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
                    {nombreMes(mes)}
                  </div>
                  {esActual && (
                    <div style={{ fontSize: "12px", opacity: 0.9 }}>
                      {tx('Mes Actual', 'Current Month')}
                    </div>
                  )}
                  {esFuturo && (
                    <div style={{ fontSize: "12px", color: "#999" }}>
                      {tx('No Disponible', 'Not Available')}
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
          <div style={{ display: "flex", gap: "4px", marginBottom: "30px", background: "white", borderRadius: "50px", padding: "5px", boxShadow: "0 2px 12px rgba(0,0,0,0.1)", width: "fit-content" }} className="no-print">
            <button
              onClick={() => setVistaActual("resumen")}
              style={{ background: vistaActual === "resumen" ? "#1a5490" : "transparent", color: vistaActual === "resumen" ? "white" : "#555", border: "none", borderRadius: "50px", padding: "10px 24px", fontSize: "14px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", transition: "all 0.2s" }}
            >
              <FaChartBar size={13} /> {tx('Resumen', 'Summary')}
            </button>
            <button
              onClick={() => setVistaActual("misioneros")}
              style={{ background: vistaActual === "misioneros" ? "#1a5490" : "transparent", color: vistaActual === "misioneros" ? "white" : "#555", border: "none", borderRadius: "50px", padding: "10px 24px", fontSize: "14px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", transition: "all 0.2s" }}
            >
              <FaUser size={13} /> {tx('Por Misionero', 'By Missionary')}
            </button>
            <button
              onClick={() => setVistaActual("nuevosEstudiantes")}
              style={{ background: vistaActual === "nuevosEstudiantes" ? "#1a5490" : "transparent", color: vistaActual === "nuevosEstudiantes" ? "white" : "#555", border: "none", borderRadius: "50px", padding: "10px 24px", fontSize: "14px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", transition: "all 0.2s" }}
            >
              <FaUserPlus size={13} /> {tx('Nuevos Estudiantes', 'New Students')}
            </button>
          </div>

          {/* VISTA RESUMEN */}
          {vistaActual === "resumen" && (
            <div style={{ background: "white", borderRadius: "12px", padding: "25px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
              <h2 style={{ margin: "0 0 25px 0", color: "#1a5490", fontSize: "24px" }}>
                {t('eb_reporteControl')} - {nombreMes(mesSeleccionado)} {añoActual}
              </h2>
              
              <div className="scroll-container">
                <table className="tabla-estudios">
                  <thead>
                    <tr>
                      <th style={{ minWidth: "150px" }}>{tx('NOMBRE', 'NAME')}</th>
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
                            const studentsLista = obtenerEstudiantesActuales(misionero.id);
                            let totalStudies = 0;
                            diasDelMes.forEach(dia => {
                              studentsLista.forEach(est => {
                                const capitulo = est.estudios?.[dia]?.capitulo;
                                if (capitulo !== undefined && capitulo !== null && capitulo !== "") {
                                  totalStudies += (est.estudios[dia].cantidad || 1);
                                }
                              });
                            });
                            return totalStudies;
                          })()}
                        </td>
                        {diasDelMes.map(dia => {
                          const studentsLista = obtenerEstudiantesActuales(misionero.id);
                          let studiesDiaMissionary = 0;

                          // Contar ESTUDIOS de ese dia (no sumar horas)
                          studentsLista.forEach(est => {
                            const capitulo = est.estudios?.[dia]?.capitulo;
                            if (capitulo !== undefined && capitulo !== null && capitulo !== "") {
                              studiesDiaMissionary += (est.estudios[dia].cantidad || 1);
                            }
                          });

                          return (
                            <td key={dia} style={{ fontSize: "15px" }}>
                              {studiesDiaMissionary}
                            </td>
                          );
                        })}
                        <td className="no-print">
                          <button
                            onClick={() => eliminarMissionary(misionero.id)}
                            className="btn-danger"
                          >
                            <FaTrash size={11} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    <tr className="total-final">
                      <td>{tx('TOTAL DIARIO', 'DAILY TOTAL')}</td>
                      <td>
                        {misioneros.reduce((sum, m) => {
                          const studentsLista = obtenerEstudiantesActuales(m.id);
                          let totalStudies = 0;
                          diasDelMes.forEach(dia => {
                            studentsLista.forEach(est => {
                              const capitulo = est.estudios?.[dia]?.capitulo;
                              if (capitulo !== undefined && capitulo !== null && capitulo !== "") {
                                totalStudies += (est.estudios[dia].cantidad || 1);
                              }
                            });
                          });
                          return sum + totalStudies;
                        }, 0)}
                      </td>
                      {diasDelMes.map(dia => (
                        <td key={dia}>{calcularTotalStudiesDia(dia)}</td>
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
                  <FaPlus size={18} /> {tx('Agregar Misionero', 'Add Missionary')}
                </button>
              </div>

              {/* Evangelismo */}
              <h3 style={{ margin: "40px 0 20px 0", color: "#1a5490", fontSize: "22px" }}>{t('eb_evangelismoTitulo')} {nombreMes(mesSeleccionado)}</h3>
              <table className="tabla-estudios" style={{ maxWidth: "800px" }}>
                <thead>
                  <tr>
                    <th style={{ minWidth: "150px" }}>{tx('NOMBRE', 'NAME')}</th>
                    <th>{tx('TOTAL HORAS', 'TOTAL HOURS')}</th>
                    <th>VIRTUAL</th>
                    <th>{tx('PRESENCIAL', 'IN-PERSON')}</th>
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
              <h3 style={{ margin: "40px 0 20px 0", color: "#1a5490", fontSize: "22px" }}>{t('eb_nuevosEstudiantesTab')} {nombreMes(mesSeleccionado)}</h3>
              <table className="tabla-estudios" style={{ maxWidth: "800px" }}>
                <thead>
                  <tr>
                    <th style={{ minWidth: "150px" }}>{tx('NOMBRE', 'NAME')}</th>
                    <th>{tx('DIJERON SÍ', 'SAID YES')}</th>
                    <th>{tx('CONTACTOS', 'CONTACTS')}</th>
                    <th>{tx('POTENCIALES', 'POTENTIALS')}</th>
                  </tr>
                </thead>
                <tbody>
                  {misioneros.filter(m => m.pais_id === paisSeleccionado).map(misionero => {
                    const dataSi = obtenerDigeronSiActual(misionero.id);
                    const dataContactos = obtenerContactosActual(misionero.id);
                    const dataPotenciales = obtenerPotencialesActual(misionero.id);
                    const totalSi = Object.values(dataSi).reduce((sum, val) => sum + (parseInt(val) || 0), 0);
                    const totalContactos = Object.values(dataContactos).reduce((sum, val) => sum + (parseInt(val) || 0), 0);
                    const totalPotenciales = Object.values(dataPotenciales).reduce((sum, val) => sum + (parseInt(val) || 0), 0);

                    return (
                      <tr key={misionero.id}>
                        <td style={{ textAlign: "left", fontWeight: "700", fontSize: "14px" }}>
                          {misionero.nombre}
                        </td>
                        <td style={{ fontSize: "15px" }}>{totalSi}</td>
                        <td style={{ fontSize: "15px" }}>{totalContactos}</td>
                        <td style={{ fontSize: "15px" }}>{totalPotenciales}</td>
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
                    <td>
                      {misioneros.reduce((sum, m) => {
                        const data = obtenerPotencialesActual(m.id);
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
                  const studentsLista = obtenerEstudiantesActuales(misionero.id);
                  
                  // Contar ESTUDIOS reales (cuantos dias con capitulo registrado,
                  // no la suma de horas -- antes mostraba horasStudies aqui, que
                  // sale en 0 para datos que no tienen el campo horas cargado)
                  let cantidadStudies = 0;
                  diasDelMes.forEach(dia => {
                    studentsLista.forEach(est => {
                      const capitulo = est.estudios?.[dia]?.capitulo;
                      if (capitulo !== undefined && capitulo !== null && capitulo !== "") {
                        cantidadStudies += (est.estudios[dia].cantidad || 1);
                      }
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
                      onClick={() => setMissionarySeleccionado(misionero.id)}
                    >
                      <button
                        className="card-delete-btn no-print"
                        onClick={(e) => {
                          e.stopPropagation();
                          eliminarMissionary(misionero.id);
                        }}
                      >
                        <FaTrash size={14} />
                      </button>
                      <div style={{ fontSize: "20px", fontWeight: "700", color: "#1a5490", marginBottom: "12px" }}>
                        <FaUser style={{ marginRight: "8px" }} />
                        {misionero.nombre}
                      </div>
                      <div style={{ fontSize: "14px", color: "#666", marginBottom: "12px" }}>
                        {studentsLista.length} students
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "12px", borderTop: "1px solid #e0e0e0" }}>
                        <div>
                          <div style={{ fontSize: "12px", color: "#999" }}>Studies</div>
                          <div style={{ fontSize: "22px", fontWeight: "700", color: "#1a5490" }}>{cantidadStudies}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: "12px", color: "#999" }}>Hours</div>
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
                  <FaPlus size={18} /> {tx('Agregar Misionero', 'Add Missionary')}
                </button>
              </div>
            </div>
          )}

          {/* VISTA NUEVOS ESTUDIANTES */}
          {vistaActual === "nuevosEstudiantes" && (
            <div style={{ background: "white", borderRadius: "12px", padding: "25px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
              <h2 style={{ margin: "0 0 25px 0", color: "#1a5490", fontSize: "24px" }}>
                {t('eb_nuevosEstudiantesTab')} - {nombreMes(mesSeleccionado)} {añoActual}
              </h2>
              
              {/* ESTUDIANTES QUE SAID YES */}
              <h3 style={{ margin: "0 0 20px 0", color: "#4CAF50", fontSize: "22px" }}>
                {tx('Dijeron Sí', 'Said Yes')}
              </h3>
              <div className="scroll-container">
                <table className="tabla-estudios">
                  <thead>
                    <tr>
                      <th style={{ minWidth: "150px", background: "#4CAF50 !important" }}>{tx('NOMBRE', 'NAME')}</th>
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

              {/* NUEVOS CONTACTS */}
              <h3 style={{ margin: "40px 0 20px 0", color: "#4CAF50", fontSize: "22px" }}>
                {tx('Nuevos Contactos', 'New Contacts')}
              </h3>
              <div className="scroll-container">
                <table className="tabla-estudios">
                  <thead>
                    <tr>
                      <th style={{ minWidth: "150px", background: "#4CAF50 !important" }}>{tx('NOMBRE', 'NAME')}</th>
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

              {/* POTENCIALES */}
              <h3 style={{ margin: "40px 0 20px 0", color: "#4CAF50", fontSize: "22px" }}>
                {tx('Potenciales', 'Potentials')}
              </h3>
              <div className="scroll-container">
                <table className="tabla-estudios">
                  <thead>
                    <tr>
                      <th style={{ minWidth: "150px", background: "#4CAF50 !important" }}>{tx('NOMBRE', 'NAME')}</th>
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
                      const data = obtenerPotencialesActual(misionero.id);
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
                                onChange={(e) => actualizarPotenciales(misionero.id, dia, e.target.value)}
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
                          const data = obtenerPotencialesActual(m.id);
                          return sum + Object.values(data).reduce((s, val) => s + (parseInt(val) || 0), 0);
                        }, 0)}
                      </td>
                      {diasDelMes.map(dia => (
                        <td key={dia} style={{ fontSize: "16px" }}>
                          {misioneros.reduce((sum, m) => {
                            const data = obtenerPotencialesActual(m.id);
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
        <>
          <div style={{ display: "flex", gap: "4px", marginBottom: "20px", background: "white", borderRadius: "50px", padding: "5px", boxShadow: "0 2px 12px rgba(0,0,0,0.1)", width: "fit-content" }} className="no-print">
            <button
              onClick={() => { setMissionarySeleccionado(null); setVistaActual("resumen"); }}
              style={{ background: "transparent", color: "#555", border: "none", borderRadius: "50px", padding: "10px 24px", fontSize: "14px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
            >
              <FaChartBar size={13} /> {tx('Resumen', 'Summary')}
            </button>
            <button
              onClick={() => { setMissionarySeleccionado(null); setVistaActual("misioneros"); }}
              style={{ background: "transparent", color: "#555", border: "none", borderRadius: "50px", padding: "10px 24px", fontSize: "14px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
            >
              <FaUser size={13} /> {tx('Por Misionero', 'By Missionary')}
            </button>
            <button
              onClick={() => { setMissionarySeleccionado(null); setVistaActual("nuevosEstudiantes"); }}
              style={{ background: "transparent", color: "#555", border: "none", borderRadius: "50px", padding: "10px 24px", fontSize: "14px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
            >
              <FaUserPlus size={13} /> {tx('Nuevos Estudiantes', 'New Students')}
            </button>
          </div>
          <div style={{ background: "white", borderRadius: "12px", padding: "25px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px", flexWrap: "wrap", gap: "12px" }}>
            <h2 style={{ margin: 0, color: "#1a5490", fontSize: "24px" }}>
              {misioneros.find(m => m.id === misioneroSeleccionado)?.nombre} - {nombreMes(mesSeleccionado)} {añoActual}
            </h2>
            <input
              type="text"
              value={busquedaEstudiante}
              onChange={(e) => setBusquedaEstudiante(e.target.value)}
              placeholder={tx('Buscar estudiante por nombre...', 'Search student by name...')}
              className="no-print"
              style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "14px", minWidth: "220px" }}
            />
          </div>

          <div className="scroll-container">
            <table className="tabla-estudios">
              <thead>
                <tr>
                  <th rowSpan="2" style={{ minWidth: "60px" }}>DEL</th>
                  <th rowSpan="2" style={{ minWidth: "130px" }}>{tx('TELÉFONO', 'PHONE No.')}</th>
                  <th rowSpan="2" style={{ minWidth: "220px" }}>{tx('NOMBRE', 'NAME')}</th>
                  <th rowSpan="2" style={{ minWidth: "160px" }}>{tx('PAÍS', 'COUNTRY')}</th>
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
                {obtenerEstudiantesActuales(misioneroSeleccionado)
                  .filter(estudiante => !busquedaEstudiante.trim() || (estudiante.nombre || '').toLowerCase().includes(busquedaEstudiante.trim().toLowerCase()))
                  .map(estudiante => (
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
                        value={estudiante.telefono || estudiante.numero || ""}
                        onChange={(e) => actualizarEstudiante(misioneroSeleccionado, estudiante.id, 'telefono', e.target.value)}
                        placeholder="e.g. +1 809 000 0000"
                        style={{ width: "120px" }}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={estudiante.nombre}
                        onChange={(e) => actualizarEstudiante(misioneroSeleccionado, estudiante.id, 'nombre', e.target.value)}
                        style={{ width: "210px", textAlign: "left", fontWeight: "600", textTransform: "uppercase" }}
                      />
                    </td>
                    <td>
                      <select
                        value={estudiante.pais}
                        onChange={(e) => actualizarEstudiante(misioneroSeleccionado, estudiante.id, 'pais', e.target.value)}
                        style={{ width: "150px" }}
                      >
                        <option value="">Select</option>
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
                      const misionero = misioneros.find(m => m.id === misioneroSeleccionado);
const numeroTelefono = numeroInput?.value?.trim() || '';
                      const nuevoContacto = await contactosService.create({
                        nombre: nombre,
                        miembro_responsable: misionero?.nombre || '',
                        miembro_responsable_id: misioneroSeleccionado,
                        pais_id: paisSeleccionado,
                        telefono: numeroTelefono,
                        notas: '',
                      });
                      
                      const nuevoEst = {
                        id: nuevoContacto.id,
                        numero: numeroTelefono,
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
                    // Save las horas de estudio también
                    const promesasStudies = [];
                    Object.entries(estudiosCapturados).forEach(([dia, datos]) => {
                      if (datos.horas && datos.horas > 0) {
                        promesasStudies.push(
                          estudiosService.guardarEstudio({
                            contacto_id: nuevoContacto.id,
                            miembro_id: misioneroSeleccionado,
                            pais_id: paisSeleccionado,
                            mes: MESES[mesSeleccionado] ?? Number(mesSeleccionado),
                            anio: añoActual,
                            dia: parseInt(dia),
                            capitulo: datos.capitulo || '',
                            horas: parseFloat(datos.horas)
                          }).catch(err => {
                            console.error('Error guardando estudio:', err);
                          })
                        );
                      }
                    });
                    
                    if (promesasStudies.length > 0) {
                      await Promise.all(promesasStudies);
                    }
                    toast.success('✅ Student saved');
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
                        placeholder="+1 809 000 0000" 
                        style={{ width: "120px" }}
                        onKeyDown={handleKeyDown}
                      />
                    </td>
                    <td>
                      <input 
                        type="text" 
                        data-campo="nombre" 
                        placeholder="Name" 
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
                        <option value="">Select</option>
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
                
                {/* Fila TOTAL GENERAL STUDIES - suma HORAS */}
                <tr style={{ background: "#1a5490", color: "white", fontWeight: "700" }}>
                  <td></td>
                  <td colSpan="3" style={{ textAlign: "left", fontSize: "15px" }}>
                    TOTAL GENERAL STUDIES
                  </td>
                  {diasDelMes.map(dia => {
                    const studentsLista = obtenerEstudiantesActuales(misioneroSeleccionado);
                    let studiesDia = 0;

                    // Contar ESTUDIOS de students ese dia (no sumar horas)
                    studentsLista.forEach(est => {
                      const capitulo = est.estudios?.[dia]?.capitulo;
                      if (capitulo !== undefined && capitulo !== null && capitulo !== "") {
                        studiesDia += (est.estudios[dia].cantidad || 1);
                      }
                    });

                    return (
                      <React.Fragment key={dia}>
                        <td></td>
                        <td style={{ fontSize: "17px" }}>{studiesDia}</td>
                      </React.Fragment>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>

          <div className="no-print" style={{ marginTop: "20px" }}>
            {(() => {
              const mesIdx = MESES_ARR.indexOf(mesSeleccionado);
              const mesActualIdx = MESES_ARR.indexOf(mesActualNombre);
              const esPasado = mesIdx < mesActualIdx;
              return !esPasado ? (
                <button
                  onClick={() => {
                    setNuevoEstudiante({ numero: "", nombre: "", pais: "" });
                    setMostrandoModalEstudiante(true);
                  }}
                  className="btn-add-new"
                >
                  <FaPlus size={18} /> Add Student
                </button>
              ) : (
                <div style={{ textAlign: "center", color: "#999", padding: "14px", fontSize: "14px" }}>
                  {tx('No se pueden agregar estudiantes a meses pasados', 'Cannot add students to past months')}
                </div>
              );
            })()}
          </div>

          {/* TABLA EVANGELISMO */}
          <div className="tabla-evangelismo">
            <h3 style={{ margin: "0 0 20px 0", color: "#4CAF50", fontSize: "20px" }}>
              {tx('Otras Actividades', 'Other Activities')}
            </h3>
            
            <div className="scroll-container">
              <table className="tabla-estudios">
                <thead>
                  <tr>
                    <th style={{ minWidth: "150px", background: "#4CAF50 !important" }}>{tx('ACTIVIDAD', 'ACTIVITY')}</th>
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
                        <th style={{ fontSize: "11px", background: "#4CAF50 !important" }}>{tx('Ubicación', 'Location')}</th>
                        <th style={{ fontSize: "11px", background: "#4CAF50 !important" }}>Hrs</th>
                      </React.Fragment>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ textAlign: "left", fontWeight: "700", background: "#C8E6C9" }}>
                      {tx('EVANGELISMO VIRTUAL', 'VIRTUAL EVANGELISM')}
                    </td>
                    {diasDelMes.map(dia => {
                      const evang = obtenerEvangelismoActual(misioneroSeleccionado);
                      return (
                        <React.Fragment key={dia}>
                          <td>
                            <input
                              type="text"
                              placeholder={tx('Ubicación', 'Location')}
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
                      {tx('EVANGELISMO PRESENCIAL', 'IN-PERSON EVANGELISM')}
                    </td>
                    {diasDelMes.map(dia => {
                      const evang = obtenerEvangelismoActual(misioneroSeleccionado);
                      return (
                        <React.Fragment key={dia}>
                          <td>
                            <input
                              type="text"
                              placeholder={tx('Ubicación', 'Location')}
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
        </>
      )}

      {/* Modal de advertencia */}
      {alertaModal.visible && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 2000 }}>
          <div style={{ background: "white", borderRadius: "16px", padding: "35px", maxWidth: "420px", width: "90%", textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>⚠️</div>
            <h3 style={{ margin: "0 0 12px", color: "#d32f2f", fontSize: "20px" }}>{alertaModal.titulo}</h3>
            <p style={{ margin: "0 0 24px", color: "#555", lineHeight: "1.6" }}>{alertaModal.mensaje}</p>
            <button
              onClick={() => setAlertaModal({ visible: false, titulo: '', mensaje: '' })}
              style={{ background: "#134069", color: "white", border: "none", borderRadius: "8px", padding: "12px 32px", fontSize: "15px", fontWeight: "600", cursor: "pointer" }}
            >
              Understood
            </button>
          </div>
        </div>
      )}

      {mostrandoModalEstudiante && (
        <div className="modal-overlay" onClick={() => setMostrandoModalEstudiante(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "550px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" }}>
              <h3 style={{ margin: 0, color: "#1a5490", fontSize: "22px", fontWeight: "700" }}>
                <FaPlus style={{ marginRight: "8px" }} />
                New Student
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
              placeholder="Phone No. (e.g. +1 809 000 0000)"
              value={nuevoEstudiante.numero}
              onChange={(e) => setNuevoEstudiante({...nuevoEstudiante, numero: e.target.value})}
              className="input-modern"
            />

            <input
              type="text"
              placeholder="Name *"
              value={nuevoEstudiante.nombre}
              onChange={(e) => setNuevoEstudiante({...nuevoEstudiante, nombre: e.target.value})}
              className="input-modern"
            />

            <select
              value={nuevoEstudiante.pais}
              onChange={(e) => setNuevoEstudiante({...nuevoEstudiante, pais: e.target.value})}
              className="input-modern"
            >
              <option value="">Select country</option>
              {paisesDelContinente.map(pais => (
                <option key={pais.id} value={pais.nombre}>{pais.nombre}</option>
              ))}
            </select>

            <div style={{ display: "flex", gap: "12px", marginTop: "25px" }}>
              <button onClick={agregarEstudiante} className="btn-primary" style={{ flex: 1, fontSize: "16px", padding: "14px" }}>
                <FaSave /> Save
              </button>
              <button onClick={() => setMostrandoModalEstudiante(false)} className="btn-secondary" style={{ flex: 1, fontSize: "16px", padding: "14px" }}>
                <FaTimes /> Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {mostrandoModalMissionary && (
        <div className="modal-overlay" onClick={() => setMostrandoModalMissionary(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "550px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" }}>
              <h3 style={{ margin: 0, color: "#1a5490", fontSize: "22px", fontWeight: "700" }}>
                <FaPlus style={{ marginRight: "8px" }} />
                New Missionary
              </h3>
              <button
                onClick={() => setMostrandoModalMissionary(false)}
                style={{ background: "none", border: "none", fontSize: "28px", cursor: "pointer", color: "#999", lineHeight: 1 }}
              >
                <FaTimes />
              </button>
            </div>

            <input
              type="text"
              placeholder="Missionary name"
              value={nuevoMissionary}
              onChange={(e) => setNuevoMissionary(e.target.value)}
              className="input-modern"
            />

            <div style={{ display: "flex", gap: "12px", marginTop: "25px" }}>
              <button onClick={agregarMissionary} className="btn-primary" style={{ flex: 1, fontSize: "16px", padding: "14px" }}>
                <FaSave /> Save
              </button>
              <button onClick={() => setMostrandoModalMissionary(false)} className="btn-secondary" style={{ flex: 1, fontSize: "16px", padding: "14px" }}>
                <FaTimes /> Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {mostrandoPromptPais && (
        <div className="modal-overlay" onClick={() => setMostrandoPromptPais(false)}>
          <div className="modal-prompt" onClick={(e) => e.stopPropagation()}>
            <h4 style={{ margin: "0 0 20px 0", color: "#333", fontSize: "18px" }}>
              Name of new country:
            </h4>

            <input
              type="text"
              value={nuevoNombrePais}
              onChange={(e) => setNuevoNombrePais(e.target.value)}
              className="input-modern"
              placeholder="E.g.: Panama"
              autoFocus
            />

            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button onClick={agregarPais} className="btn-prompt-aceptar">
                Accept
              </button>
              <button onClick={() => setMostrandoPromptPais(false)} className="btn-prompt-cancelar">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {mostrandoEstadisticas && (
        <div className="modal-overlay" onClick={() => setMostrandoEstadisticas(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "900px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
              <h3 style={{ margin: 0, color: "#1a5490", fontSize: "24px", fontWeight: "700" }}>
                <FaChartLine style={{ marginRight: "10px" }} />
                {t('estadisticas')} - {nombreMes(mesSeleccionado)} {añoActual}
              </h3>
              <button
                onClick={() => setMostrandoEstadisticas(false)}
                style={{ background: "none", border: "none", fontSize: "28px", cursor: "pointer", color: "#999", lineHeight: 1 }}
              >
                <FaTimes />
              </button>
            </div>

            {(() => {
              const misionerosDelPais = misioneros.filter(m => m.pais_id === paisSeleccionado);
              const filas = misionerosDelPais.map(m => {
                const estudios = calcularTotalStudiesMissionary(m.id);
                const horas = calcularHorasEvangelismoSolo(m.id);
                const estudiantes = obtenerEstudiantesActuales(m.id).length;
                return { nombre: m.nombre, estudios, horas, estudiantes };
              });
              const totalEstudios = filas.reduce((s, f) => s + f.estudios, 0);
              const totalHoras = filas.reduce((s, f) => s + f.horas, 0);
              const totalEstudiantes = filas.reduce((s, f) => s + f.estudiantes, 0);
              const misionerosActivos = filas.filter(f => f.estudios > 0 || f.horas > 0).length;

              return (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "18px", marginBottom: "30px" }}>
                    <div style={{ background: "#E3F2FD", padding: "24px", borderRadius: "14px" }}>
                      <div style={{ fontSize: "15px", color: "#666", marginBottom: "8px" }}>{tx('Total de Estudios', 'Total Studies')}</div>
                      <div style={{ fontSize: "38px", fontWeight: "700", color: "#1a5490" }}>{totalEstudios}</div>
                    </div>
                    <div style={{ background: "#E8F5E9", padding: "24px", borderRadius: "14px" }}>
                      <div style={{ fontSize: "15px", color: "#666", marginBottom: "8px" }}>{tx('Horas de Evangelismo', 'Evangelism Hours')}</div>
                      <div style={{ fontSize: "38px", fontWeight: "700", color: "#4CAF50" }}>{totalHoras}</div>
                    </div>
                    <div style={{ background: "#FFF3E0", padding: "24px", borderRadius: "14px" }}>
                      <div style={{ fontSize: "15px", color: "#666", marginBottom: "8px" }}>{tx('Total de Estudiantes', 'Total Students')}</div>
                      <div style={{ fontSize: "38px", fontWeight: "700", color: "#FF9800" }}>{totalEstudiantes}</div>
                    </div>
                    <div style={{ background: "#F3E5F5", padding: "24px", borderRadius: "14px" }}>
                      <div style={{ fontSize: "15px", color: "#666", marginBottom: "8px" }}>{tx('Misioneros Activos', 'Active Missionaries')}</div>
                      <div style={{ fontSize: "38px", fontWeight: "700", color: "#9C27B0" }}>{misionerosActivos}</div>
                    </div>
                  </div>

                  <h4 style={{ color: "#1a5490", marginBottom: "18px", fontSize: "18px" }}>{tx('Por Misionero:', 'By Missionary:')}</h4>
                  <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                    {filas.length === 0 ? (
                      <div style={{ color: "#999", textAlign: "center", padding: "20px" }}>{tx('Sin misioneros para este país', 'No missionaries for this country')}</div>
                    ) : (
                      <table className="tabla-estudios">
                        <thead>
                          <tr>
                            <th>{tx('Misionero', 'Missionary')}</th>
                            <th>{tx('Estudios', 'Studies')}</th>
                            <th>{tx('Horas', 'Hours')}</th>
                            <th>{tx('Estudiantes', 'Students')}</th>
                            <th>{tx('Promedio', 'Average')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filas.map((f, i) => {
                            const promedio = f.estudiantes > 0 ? (f.estudios / f.estudiantes).toFixed(1) : 0;
                            return (
                              <tr key={i}>
                                <td style={{ textAlign: "left", fontWeight: "600" }}>{f.nombre}</td>
                                <td>{f.estudios}</td>
                                <td>{f.horas}</td>
                                <td>{f.estudiantes}</td>
                                <td>{promedio}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                </>
              );
            })()}

            <div style={{ marginTop: "25px", textAlign: "right" }}>
              <button onClick={() => setMostrandoEstadisticas(false)} className="btn-secondary" style={{ padding: "12px 28px" }}>
                {tx('Cerrar', 'Close')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}