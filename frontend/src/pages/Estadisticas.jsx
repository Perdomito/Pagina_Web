import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import { Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
  Filler
} from "chart.js";
import administracionService from '../services/AdministracionService';
import estudiosService from '../services/EstudiosService';
import iglesiasService from '../services/IglesiasService';
import toast from 'react-hot-toast';
import { useAuth } from "../context/AuthContext";
import configuracionService from "../services/ConfiguracionService";
import { useIdioma } from "../context/IdiomaContext";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend, Filler);

const obtenerColorCrecimiento = (valor) => {
  if (valor > 0) return "#4CAF50";
  if (valor < 0) return "#F44336";
  return "#607D8B";
};

const formatearVariacion = (valor) => {
  if (valor > 0) return `+${valor}%`;
  return `${valor}%`;
};

const formatearDecimal = (valor, decimales = 1) => Number(valor || 0).toFixed(decimales);

const formatearMes = (valor) => {
  if (!valor) return "";
  return valor.charAt(0).toUpperCase() + valor.slice(1).toLowerCase();
};

const construirResumenEstudios = (resumen) => {
  const raw = resumen || [];
  const entries = Array.isArray(raw) ? raw : Object.values(raw).find(v => Array.isArray(v)) || [];
  const estudios = entries.filter(r => r && r.contacto_id != null);
  const evangelismo = entries.filter(r => r && r.contacto_id == null && r.tipo != null);
  const nuevos = entries.filter(r => r && r.contacto_id == null && r.tipo == null && (r.dijeron_si > 0 || r.nuevos_contactos > 0 || r.potenciales > 0));
  const contactosUnicos = [...new Set(estudios.map(e => e.contacto_id).filter(Boolean))];
  const horasTotales = estudios.reduce((s, e) => s + parseFloat(e.horas || 0), 0);
  const horasOnline = evangelismo
    .filter(e => (e.tipo || '').toLowerCase().includes('virtual'))
    .reduce((s, e) => s + parseFloat(e.horas || 0), 0);
  const horasPresencial = evangelismo
    .filter(e => (e.tipo || '').toLowerCase().includes('presencial') || (e.tipo || '').toLowerCase().includes('person'))
    .reduce((s, e) => s + parseFloat(e.horas || 0), 0);
  const dijeronSi = nuevos.reduce((s, e) => s + parseInt(e.dijeron_si || 0), 0);
  const nuevosContactos = nuevos.reduce((s, e) => s + parseInt(e.nuevos_contactos || 0), 0);
  const potenciales = nuevos.reduce((s, e) => s + parseInt(e.potenciales || 0), 0);

  return {
    estudiantesActivos: contactosUnicos.length,
    horasTotales: Math.round(horasTotales * 10) / 10,
    horasOnline: Math.round(horasOnline * 10) / 10,
    horasPresencial: Math.round(horasPresencial * 10) / 10,
    dijeronSi,
    nuevosContactos,
    potenciales
  };
};

const MESES_EVANGELISMO = [
  "ENERO",
  "FEBRERO",
  "MARZO",
  "ABRIL",
  "MAYO",
  "JUNIO",
  "JULIO",
  "AGOSTO",
  "SEPTIEMBRE",
  "OCTUBRE",
  "NOVIEMBRE",
  "DICIEMBRE"
];

const MESES_EN_ANIO = 12;

const sumarSerie = (serie = []) => serie.reduce((sum, value) => sum + Number(value || 0), 0);

const sumarSerieHastaMes = (serie = [], mesIndice = 0) =>
  serie.slice(0, Math.max(0, Math.min(mesIndice + 1, serie.length))).reduce((sum, value) => sum + Number(value || 0), 0);

const proyectarCierreAnnual = (acumulado, mesesTranscurridos) => {
  if (!mesesTranscurridos || mesesTranscurridos <= 0) return 0;
  return Number(((Number(acumulado || 0) / mesesTranscurridos) * MESES_EN_ANIO).toFixed(1));
};

const calcularVariacion = (actual, anterior) => {
  if (anterior > 0) {
    return Number((((Number(actual || 0) - Number(anterior || 0)) / anterior) * 100).toFixed(1));
  }

  return actual > 0 ? 100 : 0;
};

const obtenerLecturaPronostico = (variacion) => {
  if (variacion >= 10) {
    return {
      etiquetaKey: "st_pronosticoAlto",
      color: "#2E7D32",
      descripcionKey: "st_descripcionAlto"
    };
  }

  if (variacion <= -10) {
    return {
      etiquetaKey: "st_pronosticoBajo",
      color: "#C62828",
      descripcionKey: "st_descripcionBajo"
    };
  }

  return {
    etiquetaKey: "st_pronosticoEstable",
    color: "#B26A00",
    descripcionKey: "st_descripcionEstable"
  };
};

export default function Estadisticas() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useIdioma();
  const anioActualPorDefecto = new Date().getFullYear();
  const mesActualPorDefecto = new Date().toLocaleString('es-ES', { month: 'long' }).toUpperCase();
  const [stats, setStats] = useState(null);
  const [continentes, setContinentes] = useState([]);
  const [paisesDisponibles, setPaisesDisponibles] = useState([]);
  const [continenteSeleccionado, setContinenteSeleccionado] = useState(null);
  const [paisSeleccionado, setPaisSeleccionado] = useState(null);
  const [paisesDelContinente, setPaisesDelContinente] = useState([]);
  const [datosRealesEstudios, setDatosRealesEstudios] = useState(null);
  const [anioSeleccionadoFiltro, setAnioSeleccionadoFiltro] = useState(new Date().getFullYear());
  const [statsProyeccion, setStatsProyeccion] = useState(null);
  const [resumenPaisFallback, setResumenPaisFallback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paisUsuarioResuelto, setPaisUsuarioResuelto] = useState(
    user?.pais_id || (user?.region && !Number.isNaN(Number(user.region)) ? Number(user.region) : null)
  );
  const [tabActiva, setTabActiva] = useState("evangelismo");
  const [profesorSelectdo, setMissionarySelectdo] = useState("");
  const [tipoMiembroSelectdo, setTipoMiembroSelectdo] = useState("Todos");
  const [anioComparacionMiembros, setAnioComparacionMiembros] = useState(anioActualPorDefecto - 1);
  const [paisCrecimientoSeleccionado, setPaisCrecimientoSeleccionado] = useState(null);
  const [statsCrecimientoMiembros, setStatsCrecimientoMiembros] = useState(null);
  const [modoEvangelismoSelectdo, setModoEvangelismoSelectdo] = useState("monthly");
  const [anioEvangelismoSelectdo, setAnioEvangelismoSelectdo] = useState(anioActualPorDefecto);
  const [mesEvangelismoSelectdo, setMesEvangelismoSelectdo] = useState(mesActualPorDefecto);
  const [anioComparacionEvangelismoSelectdo, setAnioComparacionEvangelismoSelectdo] = useState(anioActualPorDefecto - 1);
  const [iglesiasDelPais, setIglesiasDelPais] = useState([]);
  const [conteoIglesias, setConteoIglesias] = useState({});
  const [ciudadesDelPais, setCiudadesDelPais] = useState([]);
  const [cargandoIglesias, setCargandoIglesias] = useState(false);
  const [guardandoIglesia, setGuardandoIglesia] = useState(false);
  const [busquedaIglesia, setBusquedaIglesia] = useState("");
  const [nuevaIglesia, setNuevaIglesia] = useState({
    ciudad_id: "", nombre: "", direccion: "", pastor_encargado_nombre: "",
    fecha_apertura: ""
  });
  const tf = (clave, valores = {}) =>
    Object.entries(valores).reduce(
      (texto, [llave, valor]) => texto.replaceAll(`{${llave}}`, String(valor ?? "")),
      t(clave)
    );
  const mesesTraducidos = Array.from({ length: 12 }, (_, index) => t(`st_mes${index}`));
  const traducirMes = (valor) => {
    if (!valor) return "";
    const indice = MESES_EVANGELISMO.indexOf(String(valor).toUpperCase());
    return indice >= 0 ? mesesTraducidos[indice] : formatearMes(String(valor));
  };
  useEffect(() => {
    const cargarContinentes = async () => {
      try {
        const [data, paises] = await Promise.all([
          administracionService.getAllContinentes(),
          administracionService.getAllPaises().catch(() => [])
        ]);
        setContinentes(data);
        setPaisesDisponibles(paises);
        if (data.length > 0) {
          const guardadoId = Number(localStorage.getItem('estadisticas_continente_id')) || null;
          const continenteGuardado = guardadoId ? data.find(c => c.id === guardadoId) : null;
          const continenteInicial = continenteGuardado || data[0];
          setContinenteSeleccionado(continenteInicial.id);
          setPaisesDelContinente(continenteInicial.paises || []);
          // No preseleccionar país — usuario elige
        }
      } catch {}
    };
    cargarContinentes();
  }, []);

  useEffect(() => {
    const paisDesdeSesion = user?.pais_id || (user?.region && !Number.isNaN(Number(user.region)) ? Number(user.region) : null);
    if (paisDesdeSesion) {
      setPaisUsuarioResuelto(paisDesdeSesion);
      return;
    }

    const cargarPaisUsuario = async () => {
      if (!user?.id) return;
      try {
        const usuarioActual = await configuracionService.getUsuarioById(user.id);
        const paisResuelto = usuarioActual?.pais_id || (usuarioActual?.region && !Number.isNaN(Number(usuarioActual.region)) ? Number(usuarioActual.region) : null);
        if (paisResuelto) {
          setPaisUsuarioResuelto(paisResuelto);
        }
      } catch (error) {
        console.error('Error loading current user country:', error);
      }
    };

    cargarPaisUsuario();
  }, [user]);

  // Iglesias: el conteo por país alimenta las tarjetas; la lista y las ciudades
  // solo se piden con la pestaña abierta, porque un país puede traer cientos de ciudades.
  const [refrescoIglesias, setRefrescoIglesias] = useState(0);
  useEffect(() => {
    if (tabActiva !== "iglesias") return;

    const cargarIglesias = async () => {
      setCargandoIglesias(true);
      try {
        const conteo = await iglesiasService.getConteoPorPais();
        setConteoIglesias(Object.fromEntries(conteo.map(c => [c.pais_id, c.cantidad])));

        if (!paisSeleccionado) {
          setIglesiasDelPais([]);
          setCiudadesDelPais([]);
          return;
        }

        const pais = [...paisesDelContinente, ...paisesDisponibles].find(p => p.id === paisSeleccionado);
        const iso = pais?.codigo_iso || pais?.iso || "";
        const [lista, ciudades] = await Promise.all([
          iglesiasService.getAll({ pais_id: paisSeleccionado }),
          iso ? administracionService.getCiudadesPorPaisIso2(iso).catch(() => []) : []
        ]);
        setIglesiasDelPais(lista);
        setCiudadesDelPais(ciudades);
      } catch (error) {
        console.error('Error loading churches:', error);
      } finally {
        setCargandoIglesias(false);
      }
    };

    cargarIglesias();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabActiva, paisSeleccionado, refrescoIglesias, paisesDelContinente, paisesDisponibles]);

  const crearIglesia = async () => {
    if (!paisSeleccionado) {
      toast.error(t('st_errorSeleccionaPais'));
      return;
    }
    if (!nuevaIglesia.ciudad_id || !nuevaIglesia.nombre.trim()) {
      toast.error(t('st_errorIglesiaCampos'));
      return;
    }

    setGuardandoIglesia(true);
    try {
      await iglesiasService.crear({ ...nuevaIglesia, pais_id: paisSeleccionado });
      setNuevaIglesia({
        ciudad_id: "", nombre: "", direccion: "", pastor_encargado_nombre: "",
        fecha_apertura: ""
      });
      setRefrescoIglesias(v => v + 1);
      toast.success(t('st_iglesiaRegistrada'));
    } catch (error) {
      console.error('Error creating church:', error);
      toast.error(error?.response?.data?.detail || t('st_errorRegistrarIglesia'));
    } finally {
      setGuardandoIglesia(false);
    }
  };

  const paisSeleccionadoNombre = (
    paisesDelContinente.find(p => p.id === paisSeleccionado)?.nombre || ""
  ).toLowerCase();
  const busquedaCoincideConPais = busquedaIglesia.trim() !== "" &&
    paisSeleccionadoNombre.includes(busquedaIglesia.trim().toLowerCase());
  const iglesiasFiltradas = busquedaCoincideConPais
    ? iglesiasDelPais
    : iglesiasDelPais.filter(ig =>
        (ig.nombre || "").toLowerCase().includes(busquedaIglesia.trim().toLowerCase())
      );

  const eliminarIglesia = async (iglesia) => {
    try {
      await iglesiasService.eliminar(iglesia.id);
      setRefrescoIglesias(v => v + 1);
      toast.success(t('st_iglesiaEliminada'));
    } catch (error) {
      console.error('Error deleting church:', error);
      toast.error(t('st_errorEliminarIglesia'));
    }
  };

  useEffect(() => {
    if (paisUsuarioResuelto && !paisCrecimientoSeleccionado) {
      setPaisCrecimientoSeleccionado(paisUsuarioResuelto);
    }
  }, [paisUsuarioResuelto, paisCrecimientoSeleccionado]);

  useEffect(() => {
    const cargarEstadisticas = async () => {
      try {
        setLoading(true);
        const filtros = {
          ...(paisSeleccionado ? { pais_id: paisSeleccionado } : paisUsuarioResuelto ? { pais_id: paisUsuarioResuelto } : {})
        };
        const [data, dataProyeccion] = await Promise.all([
          administracionService.getEstadisticasGenerales(anioSeleccionadoFiltro, filtros).catch(() => null),
          administracionService.getEstadisticasGenerales(anioSeleccionadoFiltro, filtros).catch(() => null)
        ]);
        setStats(data);
        setStatsProyeccion(dataProyeccion);
      } catch (error) {
        console.error('Error:', error);
        toast.error(t('st_errorCargarEstadisticas'));
      } finally {
        setLoading(false);
      }
    };

    cargarEstadisticas();
  }, [anioSeleccionadoFiltro, paisSeleccionado, paisUsuarioResuelto, t]);

  useEffect(() => {
    const cargarCrecimientoMiembros = async () => {
      const paisFiltro = paisCrecimientoSeleccionado || paisUsuarioResuelto;
      if (!paisFiltro) {
        setStatsCrecimientoMiembros(null);
        return;
      }

      try {
        const data = await administracionService.getEstadisticasGenerales(
          anioSeleccionadoFiltro,
          { pais_id: paisFiltro }
        );
        setStatsCrecimientoMiembros(data);
      } catch (error) {
        console.error('Error loading member growth by country:', error);
        setStatsCrecimientoMiembros(null);
      }
    };

    cargarCrecimientoMiembros();
  }, [anioSeleccionadoFiltro, paisCrecimientoSeleccionado, paisUsuarioResuelto]);

  useEffect(() => {
    const cargarResumenPaisFallback = async () => {
      if (!paisUsuarioResuelto) {
        setResumenPaisFallback(null);
        return;
      }

      try {
        const pais = await administracionService.getPaisById(paisUsuarioResuelto);
        const [miembros, statsPais] = await Promise.all([
          administracionService.getMiembrosPorPais(paisUsuarioResuelto),
          administracionService.getEstadisticasGenerales(anioSeleccionadoFiltro, { pais_id: paisUsuarioResuelto }).catch(() => null)
        ]);
        const cantidadMiembros = (miembros || []).length;
        const cantidadIglesias = Math.max(
          stats?.resumen_pais?.cantidad_iglesias ?? 0,
          statsPais?.resumen_pais?.cantidad_iglesias ?? 0,
          0
        );

        setResumenPaisFallback({
          pais_id: pais.id,
          nombre_pais: pais.nombre,
          cantidad_iglesias: cantidadIglesias,
          cantidad_miembros: cantidadMiembros
        });
      } catch (error) {
        console.error('Error loading country summary fallback:', error);
        setResumenPaisFallback(null);
      }
    };

    cargarResumenPaisFallback();
  }, [anioSeleccionadoFiltro, paisUsuarioResuelto, stats?.resumen_pais]);

  useEffect(() => {
    const missionaries = stats?.rendimiento_missionaries?.missionaries || [];

    if (!missionaries.length) {
      setMissionarySelectdo("");
      return;
    }

    const profesorExiste = missionaries.some(
      (profesor) => String(profesor.id) === profesorSelectdo
    );

    if (!profesorSelectdo || !profesorExiste) {
      setMissionarySelectdo(String(missionaries[0].id));
    }
  }, [stats, profesorSelectdo]);

  useEffect(() => {
    const tiposDisponibles = statsCrecimientoMiembros?.crecimiento_miembros?.tipos_disponibles
      || stats?.crecimiento_miembros?.tipos_disponibles
      || ["Todos"];

    if (!tiposDisponibles.includes(tipoMiembroSelectdo)) {
      setTipoMiembroSelectdo("Todos");
    }
  }, [stats, statsCrecimientoMiembros, tipoMiembroSelectdo]);

  useEffect(() => {
    const anioSelectdoActual = statsCrecimientoMiembros?.anio_seleccionado || stats?.anio_seleccionado || anioActualPorDefecto;
    const aniosComparables = (
      statsCrecimientoMiembros?.crecimiento_miembros?.anios_disponibles
      || stats?.crecimiento_miembros?.anios_disponibles
      || []
    )
      .filter((anio) => anio !== anioSelectdoActual);

    const anioPreferido = aniosComparables.includes(anioSelectdoActual - 1)
      ? anioSelectdoActual - 1
      : aniosComparables[0] || (anioSelectdoActual - 1);

    if (!aniosComparables.includes(anioComparacionMiembros)) {
      setAnioComparacionMiembros(anioPreferido);
    }
  }, [stats, statsCrecimientoMiembros, anioActualPorDefecto, anioComparacionMiembros]);

  // Cargar datos reales de estudios bíblicos
  useEffect(() => {
    if (!paisSeleccionado) return;
    const cargarDatosReales = async () => {
      try {
        const MESES = ["ENERO","FEBRERO","MARZO","ABRIL","MAYO","JUNIO","JULIO","AGOSTO","SEPTIEMBRE","OCTUBRE","NOVIEMBRE","DICIEMBRE"];
        const mesNombre = MESES[new Date().getMonth()];
        const resumen = await estudiosService.getResumenCompleto(paisSeleccionado, mesNombre, anioSeleccionadoFiltro);
        setDatosRealesEstudios(construirResumenEstudios(resumen));
      } catch {}
    };
    cargarDatosReales();
  }, [paisSeleccionado, anioSeleccionadoFiltro]);

  useEffect(() => {
    if (!continenteSeleccionado) return;
    const cont = continentes.find(c => c.id === continenteSeleccionado);
    if (cont) {
      setPaisesDelContinente(cont.paises || []);
      setPaisSeleccionado(null); // Reset país al cambiar región
    }
  }, [continenteSeleccionado, continentes]);

  useEffect(() => {
    const aniosDisponibles = stats?.evangelismo_missionaries?.anios_disponibles || [anioActualPorDefecto, anioActualPorDefecto - 1];
    const aniosComparables = aniosDisponibles.filter((anio) => anio !== anioEvangelismoSelectdo);
    const sugerido = aniosComparables.includes(anioEvangelismoSelectdo - 1)
      ? anioEvangelismoSelectdo - 1
      : (aniosComparables[0] || (anioEvangelismoSelectdo - 1));

    if (!aniosComparables.includes(anioComparacionEvangelismoSelectdo)) {
      setAnioComparacionEvangelismoSelectdo(sugerido);
    }
  }, [stats, anioActualPorDefecto, anioEvangelismoSelectdo, anioComparacionEvangelismoSelectdo]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #134069 0%, #1a5490 40%, #f4f6fb 40%)", padding: "28px", fontFamily: "'Lato', sans-serif", display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div style={{ background: "white", padding: "40px", borderRadius: "12px", textAlign: "center" }}>
          {t('cargando')}
        </div>
      </div>
    );
  }

  const comparacion = stats?.comparacion_estudios || {};
  const rendimientoMissionaryes = stats?.rendimiento_missionaries?.missionaries || [];
  const anioRendimiento = stats?.rendimiento_missionaries?.anio || new Date().getFullYear();
  const evangelismoMissionaryes = stats?.evangelismo_missionaries?.missionaries || [];
  const evangelismoMissionaryesComparacion = stats?.evangelismo_missionaries?.missionaries_comparacion || [];
  const modoEvangelismo = stats?.evangelismo_missionaries?.modo || modoEvangelismoSelectdo;
  const mesEvangelismo = traducirMes(stats?.evangelismo_missionaries?.mes || "");
  const anioEvangelismo = stats?.evangelismo_missionaries?.anio || new Date().getFullYear();
  const anioComparacionEvangelismo = stats?.evangelismo_missionaries?.anio_comparacion || anioComparacionEvangelismoSelectdo;
  const aniosEvangelismoDisponibles = stats?.evangelismo_missionaries?.anios_disponibles || [anioActualPorDefecto, anioActualPorDefecto - 1];
  const aniosEvangelismoComparables = aniosEvangelismoDisponibles.filter((anio) => anio !== anioEvangelismoSelectdo);
  const totalEvangelismoActual = evangelismoMissionaryes.reduce((sum, profesor) => sum + Number(profesor.total_horas || 0), 0);
  const totalEvangelismoComparacion = evangelismoMissionaryesComparacion.reduce((sum, profesor) => sum + Number(profesor.total_horas || 0), 0);
  const variacionEvangelismoAnnual = totalEvangelismoComparacion > 0
    ? Number((((totalEvangelismoActual - totalEvangelismoComparacion) / totalEvangelismoComparacion) * 100).toFixed(1))
    : (totalEvangelismoActual > 0 ? 100 : 0);
  const crecimientoEstudiantes = stats?.crecimiento_estudiantes || {};
  const statsMiembros = statsCrecimientoMiembros || stats;
  const crecimientoMiembros = statsMiembros?.crecimiento_miembros || {};
  const crecimientoEstudiantesProyeccion = statsProyeccion?.crecimiento_estudiantes || crecimientoEstudiantes;
  const crecimientoMiembrosProyeccion = statsProyeccion?.crecimiento_miembros || crecimientoMiembros;
  const comparacionEstudiosProyeccion = statsProyeccion?.comparacion_estudios || comparacion;
  const evangelismoProyeccion = statsProyeccion?.evangelismo_missionaries || {};
  const anioSelectdo = statsMiembros?.anio_seleccionado || stats?.anio_seleccionado || anioActualPorDefecto;
  const aniosDisponibles = stats?.anios_disponibles || [anioSelectdo];
  const tiposMiembroDisponibles = crecimientoMiembros.tipos_disponibles || ["Todos"];
  const aniosComparacionDisponibles = (crecimientoMiembros.anios_disponibles || aniosDisponibles)
    .filter((anio) => anio !== anioSelectdo);
  const aniosComparacionMiembrosOpciones = aniosComparacionDisponibles.length
    ? aniosComparacionDisponibles
    : [anioSelectdo - 1];
  const paisCrecimientoActivo = paisesDisponibles.find(
    (pais) => Number(pais.id) === Number(paisCrecimientoSeleccionado || paisUsuarioResuelto)
  ) || null;
  const seriesMiembrosPorTipo = crecimientoMiembros.series_por_tipo || {};
  const seriesTipoMiembroSelectdo = seriesMiembrosPorTipo[tipoMiembroSelectdo] || {};
  const serieCrecimientoMiembrosActual = seriesTipoMiembroSelectdo[anioSelectdo] || Array(12).fill(0);
  const serieCrecimientoMiembrosComparacion = seriesTipoMiembroSelectdo[anioComparacionMiembros] || Array(12).fill(0);
  const totalCrecimientoMiembrosActual = serieCrecimientoMiembrosActual.reduce((sum, value) => sum + value, 0);
  const totalCrecimientoMiembrosComparacion = serieCrecimientoMiembrosComparacion.reduce((sum, value) => sum + value, 0);
  const variacionCrecimientoMiembros = totalCrecimientoMiembrosComparacion > 0
    ? Number((((totalCrecimientoMiembrosActual - totalCrecimientoMiembrosComparacion) / totalCrecimientoMiembrosComparacion) * 100).toFixed(1))
    : (totalCrecimientoMiembrosActual > 0 ? 100 : 0);
  const profesorActivo = rendimientoMissionaryes.find(
    (profesor) => String(profesor.id) === profesorSelectdo
  ) || rendimientoMissionaryes[0] || null;
  const resumenPais = resumenPaisFallback || stats?.resumen_pais || null;
  const mesActualIndice = new Date().getMonth();
  const mesCorteProyeccion = anioSelectdo < anioActualPorDefecto
    ? MESES_EN_ANIO - 1
    : Math.min(mesActualIndice, MESES_EN_ANIO - 1);
  const mesesTranscurridosProyeccion = mesCorteProyeccion + 1;
  const serieEstudiosActual = comparacionEstudiosProyeccion?.serie_actual?.data || Array(MESES_EN_ANIO).fill(0);
  const serieEstudiosAnterior = comparacionEstudiosProyeccion?.serie_anterior?.data || Array(MESES_EN_ANIO).fill(0);
  const acumuladoEstudiosActual = sumarSerieHastaMes(serieEstudiosActual, mesCorteProyeccion);
  const acumuladoEstudiosAnteriorMismoPeriodo = sumarSerieHastaMes(serieEstudiosAnterior, mesCorteProyeccion);
  const totalEstudiosAnterior = sumarSerie(serieEstudiosAnterior);
  const proyeccionEstudios = proyectarCierreAnnual(acumuladoEstudiosActual, mesesTranscurridosProyeccion);
  const variacionProyeccionEstudios = calcularVariacion(proyeccionEstudios, totalEstudiosAnterior);
  const lecturaEstudios = obtenerLecturaPronostico(variacionProyeccionEstudios);
  const seriesMiembrosTodosProyeccion = crecimientoMiembrosProyeccion.series_por_tipo?.Todos || {};
  const serieMiembrosActualProyeccion = seriesMiembrosTodosProyeccion[anioSelectdo] || Array(MESES_EN_ANIO).fill(0);
  const anioComparacionPronosticoMiembros = aniosComparacionMiembrosOpciones.includes(anioComparacionMiembros)
    ? anioComparacionMiembros
    : aniosComparacionMiembrosOpciones[0];
  const serieMiembrosAnteriorProyeccion = seriesMiembrosTodosProyeccion[anioComparacionPronosticoMiembros] || Array(MESES_EN_ANIO).fill(0);
  const acumuladoMiembrosActual = sumarSerieHastaMes(serieMiembrosActualProyeccion, mesCorteProyeccion);
  const acumuladoMiembrosAnteriorMismoPeriodo = sumarSerieHastaMes(serieMiembrosAnteriorProyeccion, mesCorteProyeccion);
  const totalMiembrosAnterior = sumarSerie(serieMiembrosAnteriorProyeccion);
  const proyeccionMiembros = proyectarCierreAnnual(acumuladoMiembrosActual, mesesTranscurridosProyeccion);
  const variacionProyeccionMiembros = calcularVariacion(proyeccionMiembros, totalMiembrosAnterior);
  const lecturaMiembros = obtenerLecturaPronostico(variacionProyeccionMiembros);
  const serieEstudiantesActualProyeccion = crecimientoEstudiantesProyeccion.serie || Array(MESES_EN_ANIO).fill(0);
  const acumuladoEstudiantesActual = sumarSerieHastaMes(serieEstudiantesActualProyeccion, mesCorteProyeccion);
  const proyeccionEstudiantes = proyectarCierreAnnual(acumuladoEstudiantesActual, mesesTranscurridosProyeccion);
  const totalEvangelismoActualProyeccion = (evangelismoProyeccion.missionaries || []).reduce((sum, profesor) => sum + Number(profesor.total_horas || 0), 0);
  const totalEvangelismoAnteriorProyeccion = (evangelismoProyeccion.missionaries_comparacion || []).reduce((sum, profesor) => sum + Number(profesor.total_horas || 0), 0);
  const proyeccionEvangelismo = proyectarCierreAnnual(totalEvangelismoActualProyeccion, mesesTranscurridosProyeccion);
  const variacionProyeccionEvangelismo = calcularVariacion(proyeccionEvangelismo, totalEvangelismoAnteriorProyeccion);
  const lecturaEvangelismo = obtenerLecturaPronostico(variacionProyeccionEvangelismo);
  const resumenesPronostico = [
    {
      id: "evangelismo",
      titulo: t('st_tabEvangelismo'),
      color: "#134069",
      actual: totalEvangelismoActualProyeccion,
      anteriorMismoPeriodo: null,
      proyectado: proyeccionEvangelismo,
      cierreAnterior: totalEvangelismoAnteriorProyeccion,
      variacion: variacionProyeccionEvangelismo,
      lectura: lecturaEvangelismo,
      unidad: t('st_unidadHoras')
    },
    {
      id: "miembros",
      titulo: t('st_miembros'),
      color: "#8E24AA",
      actual: acumuladoMiembrosActual,
      anteriorMismoPeriodo: acumuladoMiembrosAnteriorMismoPeriodo,
      proyectado: proyeccionMiembros,
      cierreAnterior: totalMiembrosAnterior,
      variacion: variacionProyeccionMiembros,
      lectura: lecturaMiembros,
      unidad: t('st_unidadRegistros')
    },
    {
      id: "estudios",
      titulo: t('st_tabEstudios'),
      color: "#2E7D32",
      actual: acumuladoEstudiosActual,
      anteriorMismoPeriodo: acumuladoEstudiosAnteriorMismoPeriodo,
      proyectado: proyeccionEstudios,
      cierreAnterior: totalEstudiosAnterior,
      variacion: variacionProyeccionEstudios,
      lectura: lecturaEstudios,
      unidad: t('st_unidadEstudios')
    }
  ];
  const graficoComparacion = {
    labels: comparacion.labels || mesesTraducidos,
    datasets: [
      {
        label: comparacion?.serie_anterior?.etiqueta || tf('st_cierreAnio', { anio: anioSelectdo - 1 }),
        data: comparacion?.serie_anterior?.data || Array(12).fill(0),
        borderColor: "#B8C4CC",
        backgroundColor: "rgba(184, 196, 204, 0.10)",
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        tension: 0.35,
        fill: false
      },
      {
        label: comparacion?.serie_actual?.etiqueta || tf('st_acumuladoAnio', { anio: anioSelectdo }),
        data: comparacion?.serie_actual?.data || Array(12).fill(0),
        borderColor: "#134069",
        backgroundColor: "rgba(19, 64, 105, 0.12)",
        borderWidth: 2.5,
        pointRadius: 0,
        pointHoverRadius: 4,
        tension: 0.35,
        fill: true
      }
    ]
  };

  const opcionesGrafico = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          usePointStyle: true,
          boxWidth: 8,
          color: "#444"
        }
      },
      tooltip: {
        backgroundColor: "#1f2937",
        padding: 12
      }
    },
    scales: {
      x: {
        grid: {
          color: "rgba(0,0,0,0.04)",
          drawBorder: false
        },
        ticks: {
          color: "#666"
        }
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: "#666",
          precision: 0
        },
        grid: {
          color: "rgba(0,0,0,0.06)",
          drawBorder: false
        }
      }
    }
  };

  const graficoRendimientoMissionary = {
    labels: [t('st_desempenoAnual'), t('st_promedioMensual'), t('st_promedioDiario')],
    datasets: [
      {
        label: profesorActivo?.nombre || t('st_missionaryFallback'),
        data: profesorActivo
          ? [
              profesorActivo.total_estudios || 0,
              profesorActivo.promedio_mensual || 0,
              profesorActivo.promedio_diario || 0
            ]
          : [0, 0, 0],
        borderColor: "#134069",
        backgroundColor: "rgba(19, 64, 105, 0.12)",
        borderWidth: 3,
        pointBackgroundColor: "#134069",
        pointBorderColor: "#ffffff",
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
        tension: 0.3,
        fill: true
      }
    ]
  };

  const opcionesGraficoMissionaryes = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          usePointStyle: true,
          boxWidth: 8,
          color: "#444"
        }
      },
      tooltip: {
        backgroundColor: "#1f2937",
        padding: 12
      }
    },
    scales: {
      x: {
        grid: {
          color: "rgba(0,0,0,0.04)",
          drawBorder: false
        },
        ticks: {
          color: "#666"
        }
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: "#666"
        },
        grid: {
          color: "rgba(0,0,0,0.06)",
          drawBorder: false
        }
      }
    }
  };

  const graficoEvangelismoMissionaryes = {
    labels: Array.from(new Set([
      ...evangelismoMissionaryes.map((profesor) => profesor.nombre),
      ...evangelismoMissionaryesComparacion.map((profesor) => profesor.nombre)
    ])),
    datasets: modoEvangelismo === "annual"
      ? [
          {
            label: tf('st_horasDeAnio', { anio: anioComparacionEvangelismo }),
            data: Array.from(new Set([
              ...evangelismoMissionaryes.map((profesor) => profesor.nombre),
              ...evangelismoMissionaryesComparacion.map((profesor) => profesor.nombre)
            ])).map((nombre) => evangelismoMissionaryesComparacion.find((profesor) => profesor.nombre === nombre)?.total_horas || 0),
            backgroundColor: "#B8C4CC",
            borderRadius: 10,
            borderSkipped: false
          },
          {
            label: tf('st_horasDeAnio', { anio: anioEvangelismo }),
            data: Array.from(new Set([
              ...evangelismoMissionaryes.map((profesor) => profesor.nombre),
              ...evangelismoMissionaryesComparacion.map((profesor) => profesor.nombre)
            ])).map((nombre) => evangelismoMissionaryes.find((profesor) => profesor.nombre === nombre)?.total_horas || 0),
            backgroundColor: "#134069",
            borderRadius: 10,
            borderSkipped: false
          }
        ]
      : [
          {
            label: tf('st_horasEvangelismoMes', { mes: mesEvangelismo || t('st_mesActual') }),
            data: evangelismoMissionaryes.map((profesor) => profesor.total_horas || 0),
            backgroundColor: [
              "#134069",
              "#177E89",
              "#1FA2A6",
              "#4CB5AE",
              "#83C5BE",
              "#BEE3DB"
            ],
            borderRadius: 10,
            borderSkipped: false
          }
        ]
  };

  const opcionesGraficoEvangelismo = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: modoEvangelismo === "annual"
      },
      tooltip: {
        backgroundColor: "#1f2937",
        padding: 12,
        callbacks: {
          label: (context) => `${context.parsed.y} ${t('st_horasSufijo')}`
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
          drawBorder: false
        },
        ticks: {
          color: "#666"
        }
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: "#666"
        },
        grid: {
          color: "rgba(0,0,0,0.06)",
          drawBorder: false
        }
      }
    }
  };

  const graficoCrecimientoEstudiantes = {
    labels: crecimientoEstudiantes.labels || mesesTraducidos,
    datasets: [
      {
        label: `${t('st_totalEstudiantesPorMes')} · ${crecimientoEstudiantes.anio || new Date().getFullYear()}`,
        data: crecimientoEstudiantes.serie || Array(12).fill(0),
        borderColor: "#2E7D32",
        backgroundColor: "rgba(46, 125, 50, 0.14)",
        borderWidth: 3,
        pointBackgroundColor: "#2E7D32",
        pointBorderColor: "#ffffff",
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.35,
        fill: true
      }
    ]
  };

  const graficoCrecimientoMiembros = {
    labels: crecimientoMiembros.labels || mesesTraducidos,
    datasets: [
      {
        label: `${tipoMiembroSelectdo} ${anioComparacionMiembros}`,
        data: serieCrecimientoMiembrosComparacion,
        borderColor: "#B8C4CC",
        backgroundColor: "rgba(184, 196, 204, 0.10)",
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        tension: 0.35,
        fill: false
      },
      {
        label: `${tipoMiembroSelectdo} ${anioSelectdo}`,
        data: serieCrecimientoMiembrosActual,
        borderColor: "#8E24AA",
        backgroundColor: "rgba(142, 36, 170, 0.12)",
        borderWidth: 3,
        pointBackgroundColor: "#8E24AA",
        pointBorderColor: "#ffffff",
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.35,
        fill: true
      }
    ]
  };

  const graficoPronostico = {
    labels: resumenesPronostico.map((item) => item.titulo),
    datasets: [
      {
        label: tf('st_acumuladoAnio', { anio: anioSelectdo }),
        data: resumenesPronostico.map((item) => Number(formatearDecimal(item.actual, 1))),
        backgroundColor: ["#8FD3D7", "#D2A8E6", "#A5D6A7"],
        borderRadius: 10,
        borderSkipped: false
      },
      {
        label: tf('st_proyeccionCierreAnio', { anio: anioSelectdo }),
        data: resumenesPronostico.map((item) => item.proyectado),
        backgroundColor: ["#134069", "#8E24AA", "#2E7D32"],
        borderRadius: 10,
        borderSkipped: false
      },
      {
        label: tf('st_cierreAnio', { anio: anioSelectdo - 1 }),
        data: resumenesPronostico.map((item) => Number(item.cierreAnterior || 0)),
        backgroundColor: ["#B8C4CC", "#C9B6D9", "#C8E6C9"],
        borderRadius: 10,
        borderSkipped: false
      }
    ]
  };

  const tabs = [
    { id: "pais", label: t('st_tabPais') },
    { id: "evangelismo", label: t('st_tabEvangelismo') },
    { id: "estudios", label: t('st_tabEstudios') },
    { id: "missionaries", label: t('st_tabMissionaries') },
    { id: "crecimiento", label: t('st_tabCrecimiento') },
    { id: "proyeccion", label: t('st_tabProyeccion') },
    { id: "iglesias", label: t('st_tabIglesias') }
  ];

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #134069 0%, #1a5490 40%, #f4f6fb 40%)", padding: "28px", fontFamily: "'Lato', sans-serif" }}>
      <div style={{ maxWidth: "1600px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "28px" }}>
          <button onClick={() => navigate("/home")} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "8px", padding: "8px 14px", color: "white", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: "700", fontFamily: "'Lato',sans-serif" }}>
            <FaArrowLeft /> {t('volver')}
          </button>
          <div>
            <h1 style={{ fontSize: "20px", color: "white", margin: 0, fontFamily: "'Cinzel',serif", fontWeight: "600", letterSpacing: "1px" }}>{t('st_titulo')}</h1>
            <p style={{ margin: "2px 0 0", color: "rgba(255,255,255,0.6)", fontSize: "12px", fontFamily: "'Lato',sans-serif" }}>{t('st_subtitulo')} · {new Date().getFullYear()}</p>
          </div>
        </div>

        {/* Selector de región y país */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
          <select value={continenteSeleccionado || ""} onChange={e => { const id = Number(e.target.value); setContinenteSeleccionado(id); localStorage.setItem('estadisticas_continente_id', String(id)); setPaisSeleccionado(null); }}
            style={{ padding: "10px 14px", borderRadius: "8px", border: "none", fontSize: "13px", fontFamily: "'Lato',sans-serif", color: "#1a2d5a", fontWeight: "600", minWidth: "200px" }}>
            <option value="">{t('st_seleccionarRegion')}</option>
            {continentes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
          <select value={anioSeleccionadoFiltro} onChange={e => setAnioSeleccionadoFiltro(Number(e.target.value))}
            style={{ padding: "10px 14px", borderRadius: "8px", border: "none", fontSize: "13px", fontFamily: "'Lato',sans-serif", color: "#1a2d5a", fontWeight: "600" }}>
            {[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        {/* Tarjetas datos reales de estudios */}
        {datosRealesEstudios && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px", marginBottom: "20px" }}>
            {[
              { label: t('st_activeStudents'), value: datosRealesEstudios.estudiantesActivos, color: "#134069", icon: "📖" },
              { label: t('st_studyHours'), value: datosRealesEstudios.horasTotales, color: "#4CAF50", icon: "⏱" },
              { label: t('st_onlineEvang'), value: datosRealesEstudios.horasOnline, color: "#2196F3", icon: "💻" },
              { label: t('st_inPersonEvang'), value: datosRealesEstudios.horasPresencial, color: "#FF9800", icon: "🚶" },
              { label: t('st_newContacts'), value: datosRealesEstudios.nuevosContactos, color: "#9C27B0", icon: "👥" },
              { label: t('st_saidYes'), value: datosRealesEstudios.dijeronSi, color: "#E91E63", icon: "✋" },
              { label: t('st_potentials'), value: datosRealesEstudios.potenciales, color: "#00897B", icon: "🌱" },
            ].map((item, i) => (
              <div key={i} style={{ background: "white", borderRadius: "10px", padding: "14px 16px", border: "1px solid #e8edf5", boxShadow: "0 2px 6px rgba(19,64,105,0.06)" }}>
                <div style={{ fontSize: "18px", marginBottom: "4px" }}>{item.icon}</div>
                <div style={{ fontSize: "10px", color: "#8a97b0", fontWeight: "700", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: "4px" }}>{item.label}</div>
                <div style={{ fontSize: "24px", fontWeight: "700", color: item.color }}>{item.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Tarjetas de resumen */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px", marginBottom: "30px" }}>
          <div style={{ background: "white", padding: "25px", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: "14px", color: "#666", marginBottom: "8px" }}>{t('st_totalUsuarios')}</div>
                <div style={{ fontSize: "32px", fontWeight: "700", color: "#2196F3" }}>
                  {stats?.total_usuarios || 0}
                </div>
              </div>
              <div style={{ fontSize: "48px", opacity: 0.2 }}>👥</div>
            </div>
          </div>

          <div style={{ background: "white", padding: "25px", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: "14px", color: "#666", marginBottom: "8px" }}>{t('st_totalMiembros')}</div>
                <div style={{ fontSize: "32px", fontWeight: "700", color: "#4CAF50" }}>
                  {stats?.total_miembros || 0}
                </div>
              </div>
              <div style={{ fontSize: "48px", opacity: 0.2 }}>🙋</div>
            </div>
          </div>

          <div style={{ background: "white", padding: "25px", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: "14px", color: "#666", marginBottom: "8px" }}>{t('st_totalEstudios')}</div>
                <div style={{ fontSize: "32px", fontWeight: "700", color: "#9C27B0" }}>
                  {stats?.total_estudios || 0}
                </div>
              </div>
              <div style={{ fontSize: "48px", opacity: 0.2 }}>📚</div>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px", marginBottom: "30px" }}>
          <div style={{ background: "white", padding: "25px", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
            <div style={{ fontSize: "14px", color: "#666", marginBottom: "8px" }}>{t('st_variacionAnual')}</div>
            <div style={{ fontSize: "30px", fontWeight: "700", color: obtenerColorCrecimiento(comparacion.crecimiento || 0) }}>
              {formatearVariacion(comparacion.crecimiento || 0)}
            </div>
            <div style={{ marginTop: "10px", color: "#777", fontSize: "13px" }}>
              {t('st_vsPeriodoAnterior')}
            </div>
          </div>

          <div style={{ background: "white", padding: "25px", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
            <div style={{ fontSize: "14px", color: "#666", marginBottom: "8px" }}>{t('st_diferenciaTotal')}</div>
            <div style={{ fontSize: "30px", fontWeight: "700", color: obtenerColorCrecimiento(comparacion.diferencia || 0) }}>
              {comparacion.diferencia > 0 ? `+${comparacion.diferencia}` : comparacion.diferencia || 0}
            </div>
            <div style={{ marginTop: "10px", color: "#777", fontSize: "13px" }}>
              {t('st_diferenciaEstudios')}
            </div>
          </div>
        </div>

        <div style={{ background: "white", padding: "20px", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", marginBottom: "30px" }}>
          <div style={{ display: "flex", gap: "12px", borderBottom: "1px solid #e5e7eb", paddingBottom: "12px", marginBottom: "20px", overflowX: "auto" }}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setTabActiva(tab.id)}
                style={{
                  border: "none",
                  borderRadius: "999px",
                  padding: "12px 18px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  background: tabActiva === tab.id ? "#134069" : "#f0f4fa",
                  color: tabActiva === tab.id ? "white" : "#4b5563",
                  transition: "all 0.2s ease"
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {tabActiva === "pais" && (
            <div style={{ padding: "10px" }}>
              <div style={{ background: "#f8fafb", borderRadius: "16px", padding: "24px" }}>
                <h2 style={{ fontSize: "20px", marginBottom: "8px", color: "#1a1a1a" }}>{t('st_resumenPaisTitulo')}</h2>
                <p style={{ margin: "0 0 20px", color: "#666", fontSize: "14px" }}>
                  {t('st_resumenPaisDesc')}
                </p>

                {resumenPais ? (
                  <>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "20px" }}>
                      <div style={{ background: "white", borderRadius: "14px", padding: "18px", border: "1px solid #e5e7eb" }}>
                        <div style={{ fontSize: "12px", color: "#667085", marginBottom: "6px" }}>{t('st_tabPais')}</div>
                        <div style={{ fontSize: "24px", fontWeight: "700", color: "#134069" }}>
                          {resumenPais.nombre_pais}
                        </div>
                      </div>
                      <div style={{ background: "white", borderRadius: "14px", padding: "18px", border: "1px solid #e5e7eb" }}>
                        <div style={{ fontSize: "12px", color: "#667085", marginBottom: "6px" }}>{t('st_cantidadIglesias')}</div>
                        <div style={{ fontSize: "28px", fontWeight: "700", color: "#2E7D32" }}>
                          {resumenPais.cantidad_iglesias || 0}
                        </div>
                      </div>
                      <div style={{ background: "white", borderRadius: "14px", padding: "18px", border: "1px solid #e5e7eb" }}>
                        <div style={{ fontSize: "12px", color: "#667085", marginBottom: "6px" }}>{t('st_cantidadMiembros')}</div>
                        <div style={{ fontSize: "28px", fontWeight: "700", color: "#8E24AA" }}>
                          {resumenPais.cantidad_miembros || 0}
                        </div>
                      </div>
                    </div>

                    <div style={{ background: "white", borderRadius: "14px", padding: "18px", border: "1px solid #e5e7eb", color: "#4b5563", lineHeight: "1.6" }}>
                      {tf('st_narrativaPais', {
                        pais: resumenPais.nombre_pais,
                        iglesias: resumenPais.cantidad_iglesias || 0,
                        miembros: resumenPais.cantidad_miembros || 0
                      })}
                    </div>
                  </>
                ) : (
                  <div style={{ padding: "18px", borderRadius: "12px", background: "white", color: "#667085", border: "1px solid #e5e7eb" }}>
                    {t('st_sinPaisAsignado')}
                  </div>
                )}
              </div>
            </div>
          )}

          {tabActiva === "evangelismo" && (
            <div style={{ padding: "10px" }}>
              <div style={{ background: "#f8fafb", borderRadius: "16px", padding: "24px" }}>
                <h2 style={{ fontSize: "20px", marginBottom: "8px", color: "#1a1a1a" }}>{t('st_evangelismoTitulo')}</h2>
                <p style={{ margin: "0 0 20px", color: "#666", fontSize: "14px" }}>
                  {modoEvangelismo === "annual"
                    ? tf('st_evangelismoDescAnual', { anio: anioEvangelismo, anioComp: anioComparacionEvangelismo })
                    : tf('st_evangelismoDescMensual', { mes: mesEvangelismo || t('st_mesActual'), anio: anioEvangelismo })}
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px", marginBottom: "20px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", color: "#46535a", marginBottom: "8px", fontWeight: "600" }}>
                      {t('st_vista')}
                    </label>
                    <select
                      value={modoEvangelismoSelectdo}
                      onChange={(e) => setModoEvangelismoSelectdo(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "12px 14px",
                        borderRadius: "10px",
                        border: "1px solid #d0d5dd",
                        background: "white",
                        color: "#1f2937",
                        fontSize: "14px"
                      }}
                    >
                      <option value="monthly">{t('st_vistaMensual')}</option>
                      <option value="annual">{t('st_vistaAnual')}</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", color: "#46535a", marginBottom: "8px", fontWeight: "600" }}>
                      {t('st_anio')}
                    </label>
                    <select
                      value={anioEvangelismoSelectdo}
                      onChange={(e) => setAnioEvangelismoSelectdo(Number(e.target.value))}
                      style={{
                        width: "100%",
                        padding: "12px 14px",
                        borderRadius: "10px",
                        border: "1px solid #d0d5dd",
                        background: "white",
                        color: "#1f2937",
                        fontSize: "14px"
                      }}
                    >
                      {aniosEvangelismoDisponibles.map((anio) => (
                        <option key={anio} value={anio}>
                          {anio}
                        </option>
                      ))}
                    </select>
                  </div>
                  {modoEvangelismoSelectdo === "monthly" && (
                    <div>
                      <label style={{ display: "block", fontSize: "13px", color: "#46535a", marginBottom: "8px", fontWeight: "600" }}>
                        {t('st_mesLabel')}
                      </label>
                      <select
                        value={mesEvangelismoSelectdo}
                        onChange={(e) => setMesEvangelismoSelectdo(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "12px 14px",
                          borderRadius: "10px",
                          border: "1px solid #d0d5dd",
                          background: "white",
                          color: "#1f2937",
                          fontSize: "14px"
                        }}
                      >
                        {MESES_EVANGELISMO.map((mes) => (
                          <option key={mes} value={mes}>
                            {traducirMes(mes)}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  {modoEvangelismoSelectdo === "annual" && (
                    <div>
                      <label style={{ display: "block", fontSize: "13px", color: "#46535a", marginBottom: "8px", fontWeight: "600" }}>
                        {t('st_compararContra')}
                      </label>
                      <select
                        value={anioComparacionEvangelismoSelectdo}
                        onChange={(e) => setAnioComparacionEvangelismoSelectdo(Number(e.target.value))}
                        style={{
                          width: "100%",
                          padding: "12px 14px",
                          borderRadius: "10px",
                          border: "1px solid #d0d5dd",
                          background: "white",
                          color: "#1f2937",
                          fontSize: "14px"
                        }}
                      >
                        {(aniosEvangelismoComparables.length ? aniosEvangelismoComparables : [anioEvangelismoSelectdo - 1]).map((anio) => (
                          <option key={anio} value={anio}>
                            {anio}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {evangelismoMissionaryes.length > 0 ? (
                  <>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginBottom: "20px" }}>
                      <div style={{ background: "white", borderRadius: "12px", padding: "14px 16px", border: "1px solid #e5e7eb" }}>
                        <div style={{ fontSize: "12px", color: "#667085", marginBottom: "6px" }}>{t('st_missionariesConRegistro')}</div>
                        <div style={{ fontSize: "24px", fontWeight: "700", color: "#134069" }}>
                          {evangelismoMissionaryes.filter((profesor) => Number(profesor.total_horas) > 0).length}
                        </div>
                      </div>
                      <div style={{ background: "white", borderRadius: "12px", padding: "14px 16px", border: "1px solid #e5e7eb" }}>
                        <div style={{ fontSize: "12px", color: "#667085", marginBottom: "6px" }}>
                          {modoEvangelismo === "annual" ? tf('st_totalHorasAnio', { anio: anioEvangelismo }) : t('st_totalHorasMes')}
                        </div>
                        <div style={{ fontSize: "24px", fontWeight: "700", color: "#1f2937" }}>
                          {formatearDecimal(totalEvangelismoActual, 1)}
                        </div>
                      </div>
                      {modoEvangelismo === "annual" && (
                        <>
                          <div style={{ background: "white", borderRadius: "12px", padding: "14px 16px", border: "1px solid #e5e7eb" }}>
                            <div style={{ fontSize: "12px", color: "#667085", marginBottom: "6px" }}>
                              {tf('st_totalHorasAnio', { anio: anioComparacionEvangelismo })}
                            </div>
                            <div style={{ fontSize: "24px", fontWeight: "700", color: "#475467" }}>
                              {formatearDecimal(totalEvangelismoComparacion, 1)}
                            </div>
                          </div>
                          <div style={{ background: "white", borderRadius: "12px", padding: "14px 16px", border: "1px solid #e5e7eb" }}>
                            <div style={{ fontSize: "12px", color: "#667085", marginBottom: "6px" }}>{t('st_variacionAnual')}</div>
                            <div style={{ fontSize: "24px", fontWeight: "700", color: obtenerColorCrecimiento(variacionEvangelismoAnnual) }}>
                              {formatearVariacion(variacionEvangelismoAnnual)}
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    <div style={{ height: "340px", marginBottom: "20px" }}>
                      <Bar data={graficoEvangelismoMissionaryes} options={opcionesGraficoEvangelismo} />
                    </div>

                    <div style={{ background: "white", borderRadius: "14px", border: "1px solid #e5e7eb", overflow: "hidden" }}>
                      {evangelismoMissionaryes.map((profesor, index) => (
                        <div
                          key={profesor.id || profesor.nombre}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "minmax(180px, 1.5fr) minmax(100px, 0.7fr)",
                            gap: "12px",
                            alignItems: "center",
                            padding: "14px 16px",
                            borderTop: index === 0 ? "none" : "1px solid #e5e7eb"
                          }}
                        >
                          <div style={{ color: "#1f2937", fontWeight: "700" }}>{profesor.nombre}</div>
                          <div style={{ textAlign: "right", color: "#134069", fontWeight: "700" }}>
                            {formatearDecimal(profesor.total_horas, 1)} {t('st_horasSufijo')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div style={{ padding: "18px", borderRadius: "12px", background: "white", color: "#667085", border: "1px solid #e5e7eb" }}>
                    {t('st_sinHorasEvangelismo')}
                  </div>
                )}
              </div>
            </div>
          )}

          {tabActiva === "estudios" && (
            <div style={{ padding: "10px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "12px", marginBottom: "20px" }}>
                <div style={{ background: "white", borderRadius: "12px", padding: "14px 16px", border: "1px solid #e5e7eb" }}>
                  <div style={{ fontSize: "12px", color: "#667085", marginBottom: "6px" }}>{t('st_variacionAnual')}</div>
                  <div style={{ fontSize: "24px", fontWeight: "700", color: obtenerColorCrecimiento(comparacion.crecimiento || 0) }}>
                    {formatearVariacion(comparacion.crecimiento || 0)}
                  </div>
                </div>
                <div style={{ background: "white", borderRadius: "12px", padding: "14px 16px", border: "1px solid #e5e7eb" }}>
                  <div style={{ fontSize: "12px", color: "#667085", marginBottom: "6px" }}>{t('st_diferenciaTotal')}</div>
                  <div style={{ fontSize: "24px", fontWeight: "700", color: obtenerColorCrecimiento(comparacion.diferencia || 0) }}>
                    {comparacion.diferencia > 0 ? `+${comparacion.diferencia}` : comparacion.diferencia || 0}
                  </div>
                </div>
              </div>

              <div style={{ background: "#f8fafb", borderRadius: "16px", padding: "24px", minWidth: 0 }}>
                <h2 style={{ fontSize: "20px", marginBottom: "8px", color: "#1a1a1a" }}>{t('st_comparacionEstudiosTitulo')}</h2>
                <p style={{ margin: "0 0 20px", color: "#666", fontSize: "14px" }}>
                  {t('st_comparacionEstudiosDesc')}
                </p>

                <div style={{ height: "340px" }}>
                  <Line data={graficoComparacion} options={opcionesGrafico} />
                </div>
              </div>
            </div>
          )}

          {tabActiva === "missionaries" && (
            <div style={{ padding: "10px" }}>
              <div style={{ background: "#f8fafb", borderRadius: "16px", padding: "24px", minWidth: 0 }}>
                <h2 style={{ fontSize: "20px", marginBottom: "8px", color: "#1a1a1a" }}>{t('st_rendimientoTitulo')}</h2>
                <p style={{ margin: "0 0 20px", color: "#666", fontSize: "14px" }}>
                  {tf('st_rendimientoDesc', { anio: anioRendimiento })}
                </p>

                {rendimientoMissionaryes.length > 0 ? (
                  <>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px", marginBottom: "20px" }}>
                      <div style={{ background: "white", borderRadius: "12px", padding: "14px 16px", border: "1px solid #e5e7eb" }}>
                        <div style={{ fontSize: "12px", color: "#667085", marginBottom: "6px" }}>{t('st_missionariesConDatos')}</div>
                        <div style={{ fontSize: "24px", fontWeight: "700", color: "#134069" }}>{rendimientoMissionaryes.length}</div>
                      </div>
                      <div style={{ background: "white", borderRadius: "12px", padding: "14px 16px", border: "1px solid #e5e7eb" }}>
                        <div style={{ fontSize: "12px", color: "#667085", marginBottom: "6px" }}>{t('st_missionarySeleccionado')}</div>
                        <div style={{ fontSize: "16px", fontWeight: "700", color: "#1f2937" }}>
                          {profesorActivo?.nombre || t('st_sinDatosLabel')}
                        </div>
                      </div>
                    </div>

                    <div style={{ marginBottom: "20px" }}>
                      <label style={{ display: "block", fontSize: "13px", color: "#46535a", marginBottom: "8px", fontWeight: "600" }}>
                        {t('st_seleccionarProfesor')}
                      </label>
                      <select
                        value={profesorSelectdo}
                        onChange={(e) => setMissionarySelectdo(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "12px 14px",
                          borderRadius: "10px",
                          border: "1px solid #d0d5dd",
                          background: "white",
                          color: "#1f2937",
                          fontSize: "14px"
                        }}
                      >
                        {rendimientoMissionaryes.map((profesor) => (
                          <option key={profesor.id} value={String(profesor.id)}>
                            {profesor.nombre}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div style={{ height: "300px", marginBottom: "20px" }}>
                      <Line data={graficoRendimientoMissionary} options={opcionesGraficoMissionaryes} />
                    </div>

                    <div style={{ background: "white", borderRadius: "14px", border: "1px solid #e5e7eb", maxHeight: "260px", overflowY: "auto" }}>
                      {[profesorActivo].filter(Boolean).map((profesor, index) => (
                        <div
                          key={profesor.id || profesor.nombre}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "minmax(160px, 1.3fr) repeat(3, minmax(90px, 1fr))",
                            gap: "12px",
                            alignItems: "center",
                            padding: "14px 16px",
                            borderTop: index === 0 ? "none" : "1px solid #e5e7eb"
                          }}
                        >
                          <div>
                            <div style={{ color: "#1f2937", fontWeight: "700" }}>{profesor.nombre}</div>
                            <div style={{ color: "#667085", fontSize: "12px" }}>{t('st_missionaryFallback')}</div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ color: "#134069", fontWeight: "700" }}>{profesor.total_estudios || 0}</div>
                            <div style={{ color: "#667085", fontSize: "12px" }}>{t('st_anual')}</div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ color: "#1f2937", fontWeight: "600" }}>{formatearDecimal(profesor.promedio_mensual, 1)}</div>
                            <div style={{ color: "#667085", fontSize: "12px" }}>{t('st_mensual')}</div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ color: "#1f2937", fontWeight: "600" }}>{formatearDecimal(profesor.promedio_diario, 2)}</div>
                            <div style={{ color: "#667085", fontSize: "12px" }}>{t('st_diario')}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div style={{ padding: "18px", borderRadius: "12px", background: "white", color: "#667085", border: "1px solid #e5e7eb" }}>
                    {t('st_sinRendimiento')}
                  </div>
                )}
              </div>
            </div>
          )}

          {tabActiva === "crecimiento" && (
            <div style={{ padding: "10px" }}>
              <div style={{ background: "#f8fafb", borderRadius: "16px", padding: "24px", marginBottom: "24px" }}>
                <h2 style={{ fontSize: "20px", marginBottom: "8px", color: "#1a1a1a" }}>{t('st_crecimientoMiembrosTitulo')}</h2>
                <p style={{ margin: "0 0 20px", color: "#666", fontSize: "14px" }}>
                  {t('st_crecimientoMiembrosDesc')}
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px", marginBottom: "20px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", color: "#46535a", marginBottom: "8px", fontWeight: "600" }}>
                      {t('st_pais')}
                    </label>
                    <select
                      value={paisCrecimientoSeleccionado || paisUsuarioResuelto || ""}
                      onChange={(e) => setPaisCrecimientoSeleccionado(e.target.value ? Number(e.target.value) : null)}
                      style={{
                        width: "100%",
                        padding: "12px 14px",
                        borderRadius: "10px",
                        border: "1px solid #d0d5dd",
                        background: "white",
                        color: "#1f2937",
                        fontSize: "14px"
                      }}
                    >
                      {paisesDisponibles.map((pais) => (
                        <option key={pais.id} value={pais.id}>
                          {pais.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", color: "#46535a", marginBottom: "8px", fontWeight: "600" }}>
                      {t('st_tipoMiembro')}
                    </label>
                    <select
                      value={tipoMiembroSelectdo}
                      onChange={(e) => setTipoMiembroSelectdo(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "12px 14px",
                        borderRadius: "10px",
                        border: "1px solid #d0d5dd",
                        background: "white",
                        color: "#1f2937",
                        fontSize: "14px"
                      }}
                    >
                      {tiposMiembroDisponibles.map((tipo) => (
                        <option key={tipo} value={tipo}>
                          {tipo === "Todos" ? t('st_todos') : tipo}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", color: "#46535a", marginBottom: "8px", fontWeight: "600" }}>
                      {t('st_compararContra')}
                    </label>
                    <select
                      value={anioComparacionMiembros}
                      onChange={(e) => setAnioComparacionMiembros(Number(e.target.value))}
                      style={{
                        width: "100%",
                        padding: "12px 14px",
                        borderRadius: "10px",
                        border: "1px solid #d0d5dd",
                        background: "white",
                        color: "#1f2937",
                        fontSize: "14px"
                      }}
                    >
                      {aniosComparacionMiembrosOpciones.map((anio) => (
                        <option key={anio} value={anio}>
                          {anio}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginBottom: "20px" }}>
                  <div style={{ background: "white", borderRadius: "12px", padding: "14px 16px", border: "1px solid #e5e7eb" }}>
                    <div style={{ fontSize: "12px", color: "#667085", marginBottom: "6px" }}>{t('st_tabPais')}</div>
                    <div style={{ fontSize: "20px", fontWeight: "700", color: "#134069" }}>
                      {paisCrecimientoActivo?.nombre || t('st_sinDatosLabel')}
                    </div>
                  </div>
                  <div style={{ background: "white", borderRadius: "12px", padding: "14px 16px", border: "1px solid #e5e7eb" }}>
                    <div style={{ fontSize: "12px", color: "#667085", marginBottom: "6px" }}>{t('st_anioPrincipal')}</div>
                    <div style={{ fontSize: "24px", fontWeight: "700", color: "#8E24AA" }}>
                      {anioSelectdo}
                    </div>
                  </div>
                  <div style={{ background: "white", borderRadius: "12px", padding: "14px 16px", border: "1px solid #e5e7eb" }}>
                    <div style={{ fontSize: "12px", color: "#667085", marginBottom: "6px" }}>{tf('st_miembrosNuevosEnAnio', { anio: anioSelectdo })}</div>
                    <div style={{ fontSize: "24px", fontWeight: "700", color: "#1f2937" }}>
                      {totalCrecimientoMiembrosActual}
                    </div>
                  </div>
                  <div style={{ background: "white", borderRadius: "12px", padding: "14px 16px", border: "1px solid #e5e7eb" }}>
                    <div style={{ fontSize: "12px", color: "#667085", marginBottom: "6px" }}>{tf('st_miembrosNuevosEnAnio', { anio: anioComparacionMiembros })}</div>
                    <div style={{ fontSize: "24px", fontWeight: "700", color: "#475467" }}>
                      {totalCrecimientoMiembrosComparacion}
                    </div>
                  </div>
                  <div style={{ background: "white", borderRadius: "12px", padding: "14px 16px", border: "1px solid #e5e7eb" }}>
                    <div style={{ fontSize: "12px", color: "#667085", marginBottom: "6px" }}>{t('st_variacionAnual')}</div>
                    <div style={{ fontSize: "24px", fontWeight: "700", color: obtenerColorCrecimiento(variacionCrecimientoMiembros) }}>
                      {formatearVariacion(variacionCrecimientoMiembros)}
                    </div>
                  </div>
                </div>

                <div style={{ height: "360px" }}>
                  <Line data={graficoCrecimientoMiembros} options={opcionesGrafico} />
                </div>
              </div>

              <div style={{ background: "#f8fafb", borderRadius: "16px", padding: "24px" }}>
                <h2 style={{ fontSize: "20px", marginBottom: "8px", color: "#1a1a1a" }}>{t('st_estudiantesUnicosTitulo')}</h2>
                <p style={{ margin: "0 0 20px", color: "#666", fontSize: "14px" }}>
                  {tf('st_estudiantesUnicosDesc', { anio: crecimientoEstudiantes.anio || new Date().getFullYear() })}
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginBottom: "20px" }}>
                  <div style={{ background: "white", borderRadius: "12px", padding: "14px 16px", border: "1px solid #e5e7eb" }}>
                    <div style={{ fontSize: "12px", color: "#667085", marginBottom: "6px" }}>{t('st_anioAnalizado')}</div>
                    <div style={{ fontSize: "24px", fontWeight: "700", color: "#2E7D32" }}>
                      {crecimientoEstudiantes.anio || new Date().getFullYear()}
                    </div>
                  </div>
                  <div style={{ background: "white", borderRadius: "12px", padding: "14px 16px", border: "1px solid #e5e7eb" }}>
                    <div style={{ fontSize: "12px", color: "#667085", marginBottom: "6px" }}>{t('st_totalEstudiantesPorMes')}</div>
                    <div style={{ fontSize: "24px", fontWeight: "700", color: "#1f2937" }}>
                      {crecimientoEstudiantes.total || 0}
                    </div>
                  </div>
                </div>

                <div style={{ height: "360px" }}>
                  <Line data={graficoCrecimientoEstudiantes} options={opcionesGrafico} />
                </div>
              </div>
            </div>
          )}

          {tabActiva === "proyeccion" && (
            <div style={{ padding: "10px" }}>
              <div style={{ background: "#f8fafb", borderRadius: "16px", padding: "24px", marginBottom: "24px" }}>
                <h2 style={{ fontSize: "20px", marginBottom: "8px", color: "#1a1a1a" }}>{t('st_proyeccionTitulo')}</h2>
                <p style={{ margin: "0 0 20px", color: "#666", fontSize: "14px" }}>
                  {tf('st_proyeccionDesc', {
                    anio: anioSelectdo,
                    mesInicio: t('st_mes0'),
                    mesFin: traducirMes(MESES_EVANGELISMO[mesCorteProyeccion])
                  })}
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginBottom: "20px" }}>
                  <div style={{ background: "white", borderRadius: "12px", padding: "14px 16px", border: "1px solid #e5e7eb" }}>
                    <div style={{ fontSize: "12px", color: "#667085", marginBottom: "6px" }}>{t('st_anioProyectado')}</div>
                    <div style={{ fontSize: "24px", fontWeight: "700", color: "#134069" }}>{anioSelectdo}</div>
                  </div>
                  <div style={{ background: "white", borderRadius: "12px", padding: "14px 16px", border: "1px solid #e5e7eb" }}>
                    <div style={{ fontSize: "12px", color: "#667085", marginBottom: "6px" }}>{t('st_mesesAnalizados')}</div>
                    <div style={{ fontSize: "24px", fontWeight: "700", color: "#1f2937" }}>{mesesTranscurridosProyeccion}</div>
                  </div>
                  <div style={{ background: "white", borderRadius: "12px", padding: "14px 16px", border: "1px solid #e5e7eb" }}>
                    <div style={{ fontSize: "12px", color: "#667085", marginBottom: "6px" }}>{t('st_criterio')}</div>
                    <div style={{ fontSize: "16px", fontWeight: "700", color: "#1f2937" }}>{t('st_ritmoPromedioMensual')}</div>
                  </div>
                  <div style={{ background: "white", borderRadius: "12px", padding: "14px 16px", border: "1px solid #e5e7eb" }}>
                    <div style={{ fontSize: "12px", color: "#667085", marginBottom: "6px" }}>{t('st_estudiantesProyectados')}</div>
                    <div style={{ fontSize: "24px", fontWeight: "700", color: "#2E7D32" }}>{formatearDecimal(proyeccionEstudiantes, 1)}</div>
                  </div>
                </div>

                <div style={{ height: "360px", marginBottom: "24px" }}>
                  <Bar data={graficoPronostico} options={opcionesGraficoEvangelismo} />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
                  {resumenesPronostico.map((item) => (
                    <div key={item.id} style={{ background: "white", borderRadius: "16px", padding: "18px", border: "1px solid #e5e7eb", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", gap: "12px" }}>
                        <div style={{ fontSize: "18px", fontWeight: "700", color: "#1a1a1a" }}>{item.titulo}</div>
                        <div style={{ background: `${item.lectura.color}18`, color: item.lectura.color, borderRadius: "999px", padding: "6px 10px", fontSize: "12px", fontWeight: "700" }}>
                          {t(item.lectura.etiquetaKey)}
                        </div>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "12px", marginBottom: "14px" }}>
                        <div style={{ background: "#f8fafb", borderRadius: "12px", padding: "12px" }}>
                          <div style={{ fontSize: "12px", color: "#667085", marginBottom: "6px" }}>{t('st_acumuladoActual')}</div>
                          <div style={{ fontSize: "24px", fontWeight: "700", color: item.color }}>
                            {formatearDecimal(item.actual, 1)}
                          </div>
                        </div>
                        <div style={{ background: "#f8fafb", borderRadius: "12px", padding: "12px" }}>
                          <div style={{ fontSize: "12px", color: "#667085", marginBottom: "6px" }}>{t('st_cierreProyectado')}</div>
                          <div style={{ fontSize: "24px", fontWeight: "700", color: "#1f2937" }}>
                            {formatearDecimal(item.proyectado, 1)}
                          </div>
                        </div>
                        <div style={{ background: "#f8fafb", borderRadius: "12px", padding: "12px" }}>
                          <div style={{ fontSize: "12px", color: "#667085", marginBottom: "6px" }}>{t('st_cierreAnioAnterior')}</div>
                          <div style={{ fontSize: "24px", fontWeight: "700", color: "#475467" }}>
                            {formatearDecimal(item.cierreAnterior, 1)}
                          </div>
                        </div>
                        <div style={{ background: "#f8fafb", borderRadius: "12px", padding: "12px" }}>
                          <div style={{ fontSize: "12px", color: "#667085", marginBottom: "6px" }}>{t('st_variacionProyectada')}</div>
                          <div style={{ fontSize: "24px", fontWeight: "700", color: obtenerColorCrecimiento(item.variacion) }}>
                            {formatearVariacion(item.variacion)}
                          </div>
                        </div>
                      </div>

                      <div style={{ color: "#4b5563", fontSize: "14px", lineHeight: "1.6" }}>
                        {item.id === "evangelismo"
                          ? tf('st_narrativaEvangelismo', {
                              proyectado: formatearDecimal(item.proyectado, 1),
                              unidad: item.unidad,
                              cierreAnterior: formatearDecimal(item.cierreAnterior, 1),
                              descripcion: t(item.lectura.descripcionKey)
                            })
                          : tf('st_narrativaGeneral', {
                              mes: traducirMes(MESES_EVANGELISMO[mesCorteProyeccion]),
                              actual: formatearDecimal(item.actual, 1),
                              unidad: item.unidad,
                              anteriorMismoPeriodo: formatearDecimal(item.anteriorMismoPeriodo, 1),
                              descripcion: t(item.lectura.descripcionKey)
                            })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* TAB IGLESIAS POR PAÍS */}
        {tabActiva === "iglesias" && (
          <div style={{ background: "white", borderRadius: "12px", border: "1px solid #e8edf5", overflow: "hidden" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #e8edf5" }}>
              <h2 style={{ margin: 0, color: "#134069", fontFamily: "'Cinzel',serif", fontSize: "17px" }}>
                {t('st_iglesiasTitulo')}
              </h2>
              <p style={{ margin: "4px 0 0", color: "#8a97b0", fontSize: "12px" }}>
                {continenteSeleccionado ? continentes.find(c => c.id === continenteSeleccionado)?.nombre : t('st_todasLasRegiones')} — {anioSeleccionadoFiltro}
              </p>
            </div>
            <div style={{ padding: "20px 24px" }}>
              <input
                type="text"
                placeholder="Buscar iglesia..."
                value={busquedaIglesia}
                onChange={(e) => setBusquedaIglesia(e.target.value)}
                style={{ ...estiloCampoIglesia, width: "100%", maxWidth: "320px", marginBottom: "18px" }}
              />

              {paisSeleccionado && (
                <button
                  onClick={() => setPaisSeleccionado(null)}
                  style={{ background: "none", border: "none", color: "#134069", fontSize: "13px", fontWeight: "700", cursor: "pointer", padding: 0, marginBottom: "14px" }}
                >
                  ← Ver todos los países
                </button>
              )}

              {paisesDelContinente.length === 0 ? (
                <div style={{ textAlign: "center", color: "#b0bcd0", padding: "40px" }}>{t('st_seleccionaRegionParaVer')}</div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
                  {paisesDelContinente
                    .filter(pais => paisSeleccionado
                      ? pais.id === paisSeleccionado
                      : (pais.nombre || "").toLowerCase().includes(busquedaIglesia.trim().toLowerCase()))
                    .map((pais, i) => {
                    const colores = ["#134069","#4CAF50","#2196F3","#FF9800","#9C27B0","#E91E63","#00BCD4","#FF5722"];
                    const color = colores[i % colores.length];
                    return (
                      <div key={pais.id} style={{ background: "#f8faff", borderRadius: "12px", padding: "18px", border: `2px solid ${paisSeleccionado === pais.id ? color : "#e8edf5"}`, cursor: "pointer", transition: "all 0.2s" }}
                        onClick={() => setPaisSeleccionado(pais.id)}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                          <div style={{ fontWeight: "700", color: "#1a2d5a", fontSize: "15px", fontFamily: "'Lato',sans-serif" }}>{pais.nombre}</div>
                          <div style={{ background: color, color: "white", borderRadius: "6px", padding: "2px 8px", fontSize: "10px", fontWeight: "700" }}>{pais.codigo_iso || pais.iso || "—"}</div>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                          {[
                            { label: t('st_miembros'), value: stats?.total_miembros || "—", icon: "👥" },
                            { label: t('st_contactos'), value: stats?.total_contactos || "—", icon: "📞" },
                            { label: t('st_iglesias'), value: conteoIglesias[pais.id] || 0, icon: "⛪" },
                            { label: t('st_estudiosLabel'), value: datosRealesEstudios?.estudiantesActivos || 0, icon: "📖" },
                          ].map((item, j) => (
                            <div key={j} style={{ background: "white", borderRadius: "8px", padding: "10px", textAlign: "center", border: "1px solid #e8edf5" }}>
                              <div style={{ fontSize: "16px" }}>{item.icon}</div>
                              <div style={{ fontSize: "18px", fontWeight: "700", color: color }}>{item.value}</div>
                              <div style={{ fontSize: "10px", color: "#8a97b0", fontWeight: "700" }}>{item.label}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Alta y listado de iglesias de la ciudad */}
              {paisSeleccionado && (
                <div style={{ marginTop: "24px", borderTop: "1px solid #e8edf5", paddingTop: "20px" }}>
                  <h3 style={{ margin: "0 0 4px", color: "#134069", fontFamily: "'Cinzel',serif", fontSize: "15px" }}>
                    {tf('st_iglesiasDePais', { pais: paisesDelContinente.find(p => p.id === paisSeleccionado)?.nombre || "" })}
                  </h3>
                  <p style={{ margin: "0 0 16px", color: "#8a97b0", fontSize: "12px" }}>
                    {iglesiasDelPais.length} {iglesiasDelPais.length === 1 ? "iglesia registrada" : "iglesias registradas"} — {iglesiasDelPais.reduce((suma, ig) => suma + (ig.cantidad_miembros || 0), 0)} miembros en total
                  </p>

                  {cargandoIglesias ? (
                    <div style={{ color: "#b0bcd0", fontSize: "13px" }}>{t('st_cargandoIglesias')}</div>
                  ) : iglesiasFiltradas.length === 0 ? (
                    <div style={{ color: "#b0bcd0", fontSize: "13px" }}>
                      {t('st_sinIglesiasPais')}
                    </div>
                  ) : (
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                        <thead>
                          <tr style={{ background: "#f4f6fb", color: "#8a97b0", textAlign: "left" }}>
                            <th style={estiloCeldaIglesia}>{t('st_colCiudad')}</th>
                            <th style={estiloCeldaIglesia}>{t('st_colIglesia')}</th>
                            <th style={estiloCeldaIglesia}>{t('st_colPastor')}</th>
                            <th style={estiloCeldaIglesia}>{t('st_colApertura')}</th>
                            <th style={estiloCeldaIglesia}>{t('st_colMiembros')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {iglesiasFiltradas.map(ig => (
                            <tr key={ig.id} style={{ borderBottom: "1px solid #eef1f7" }}>
                              <td style={estiloCeldaIglesia}>{ig.ciudad_nombre || "—"}</td>
                              <td style={{ ...estiloCeldaIglesia, fontWeight: "700", color: "#1a2d5a" }}>{ig.nombre}</td>
                              <td style={estiloCeldaIglesia}>{ig.pastor_encargado_nombre || "—"}</td>
                              <td style={estiloCeldaIglesia}>{ig.fecha_apertura || "—"}</td>
                              <td style={estiloCeldaIglesia}>{ig.cantidad_miembros || 0}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const estiloCampoIglesia = {
  padding: "10px 12px",
  borderRadius: "8px",
  border: "1px solid #dde3ef",
  fontSize: "13px",
  fontFamily: "'Lato',sans-serif",
  color: "#1a2d5a"
};

const estiloCeldaIglesia = {
  padding: "10px 12px"
};
