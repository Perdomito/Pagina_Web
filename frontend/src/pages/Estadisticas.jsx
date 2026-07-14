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
import miembrosService from '../services/MiembrosService';
import contactosService from '../services/ContactosService';
import toast from 'react-hot-toast';
import { useAuth } from "../context/AuthContext";
import configuracionService from "../services/ConfiguracionService";

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
      etiqueta: "Alto",
      color: "#2E7D32",
      descripcion: "Projected closing is above the previous year."
    };
  }

  if (variacion <= -10) {
    return {
      etiqueta: "Bajo",
      color: "#C62828",
      descripcion: "Projected closing is below the previous year."
    };
  }

  return {
    etiqueta: "Estable",
    color: "#B26A00",
    descripcion: "Projected closing is near the previous year."
  };
};

export default function Estadisticas() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const anioActualPorDefecto = new Date().getFullYear();
  const mesActualPorDefecto = new Date().toLocaleString('es-ES', { month: 'long' }).toUpperCase();
  const [stats, setStats] = useState(null);
  const [continentes, setContinentes] = useState([]);
  const [continenteSeleccionado, setContinenteSeleccionado] = useState(null);
  const [paisSeleccionado, setPaisSeleccionado] = useState(null);
  const [paisesDelContinente, setPaisesDelContinente] = useState([]);
  const [datosRealesEstudios, setDatosRealesEstudios] = useState(null);
  const [mesSeleccionado, setMesSeleccionado] = useState(new Date().toLocaleString('en-US', {month:'long'}).toUpperCase());
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
  const [modoEvangelismoSelectdo, setModoEvangelismoSelectdo] = useState("monthly");
  const [anioEvangelismoSelectdo, setAnioEvangelismoSelectdo] = useState(anioActualPorDefecto);
  const [mesEvangelismoSelectdo, setMesEvangelismoSelectdo] = useState(mesActualPorDefecto);
  const [anioComparacionEvangelismoSelectdo, setAnioComparacionEvangelismoSelectdo] = useState(anioActualPorDefecto - 1);
  useEffect(() => {
    const cargarContinentes = async () => {
      try {
        const data = await administracionService.getAllContinentes();
        setContinentes(data);
        if (data.length > 0) {
          setContinenteSeleccionado(data[0].id);
          setPaisesDelContinente(data[0].paises || []);
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
        toast.error('Error loading statistics');
      } finally {
        setLoading(false);
      }
    };

    cargarEstadisticas();
  }, [anioSeleccionadoFiltro, paisSeleccionado, paisUsuarioResuelto]);

  useEffect(() => {
    const cargarResumenPaisFallback = async () => {
      if (!paisUsuarioResuelto) {
        setResumenPaisFallback(null);
        return;
      }

      if (stats?.resumen_pais) {
        setResumenPaisFallback(stats.resumen_pais);
        return;
      }

      try {
        const pais = await administracionService.getPaisById(paisUsuarioResuelto);
        const [miembros, ciudades, ciudadesMision] = await Promise.all([
          administracionService.getMiembrosPorPais(paisUsuarioResuelto),
          administracionService.getCiudadesPorPaisIso2(pais.iso),
          administracionService.getCiudadesMision()
        ]);

        const ciudadesIds = new Set((ciudades || []).map((ciudad) => ciudad.id));
        const cantidadIglesias = (ciudadesMision || []).filter((item) => ciudadesIds.has(item.ciudad_id)).length;

        setResumenPaisFallback({
          pais_id: pais.id,
          nombre_pais: pais.nombre,
          cantidad_iglesias: cantidadIglesias,
          cantidad_miembros: (miembros || []).length
        });
      } catch (error) {
        console.error('Error loading country summary fallback:', error);
        setResumenPaisFallback(null);
      }
    };

    cargarResumenPaisFallback();
  }, [paisUsuarioResuelto, stats?.resumen_pais]);

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
    const tiposDisponibles = stats?.crecimiento_miembros?.tipos_disponibles || ["Todos"];

    if (!tiposDisponibles.includes(tipoMiembroSelectdo)) {
      setTipoMiembroSelectdo("Todos");
    }
  }, [stats, tipoMiembroSelectdo]);

  useEffect(() => {
    const anioSelectdoActual = stats?.anio_seleccionado || anioActualPorDefecto;
    const aniosComparables = (stats?.crecimiento_miembros?.anios_disponibles || [])
      .filter((anio) => anio !== anioSelectdoActual);

    const anioPreferido = aniosComparables.includes(anioSelectdoActual - 1)
      ? anioSelectdoActual - 1
      : aniosComparables[0] || (anioSelectdoActual - 1);

    if (!aniosComparables.includes(anioComparacionMiembros)) {
      setAnioComparacionMiembros(anioPreferido);
    }
  }, [stats, anioActualPorDefecto, anioComparacionMiembros]);

  // Cargar datos reales de estudios bíblicos
  useEffect(() => {
    if (!paisSeleccionado) return;
    const cargarDatosReales = async () => {
      try {
        const MESES = ["ENERO","FEBRERO","MARZO","ABRIL","MAYO","JUNIO","JULIO","AGOSTO","SEPTIEMBRE","OCTUBRE","NOVIEMBRE","DICIEMBRE"];
        const mesNombre = MESES[new Date().getMonth()];
        const resumen = await estudiosService.getResumenCompleto(paisSeleccionado, mesNombre, anioSeleccionadoFiltro);
        const raw = resumen || [];
        const entries = Array.isArray(raw) ? raw : Object.values(raw).find(v => Array.isArray(v)) || [];
        const estudios = entries.filter(r => r && r.contacto_id != null);
        const evangelismo = entries.filter(r => r && r.contacto_id == null && r.tipo != null);
        const nuevos = entries.filter(r => r && r.contacto_id == null && r.tipo == null && (r.dijeron_si > 0 || r.nuevos_contactos > 0));
        const contactosUnicos = [...new Set(estudios.map(e => e.contacto_id).filter(Boolean))];
        const horasTotales = estudios.reduce((s, e) => s + parseFloat(e.horas || 0), 0);
        const horasOnline = evangelismo.filter(e => (e.tipo||'').toLowerCase().includes('virtual')).reduce((s,e) => s + parseFloat(e.horas||0), 0);
        const horasPresencial = evangelismo.filter(e => (e.tipo||'').toLowerCase().includes('presencial')||(e.tipo||'').toLowerCase().includes('person')).reduce((s,e) => s + parseFloat(e.horas||0), 0);
        const dijeronSi = nuevos.reduce((s,e) => s + parseInt(e.dijeron_si||0), 0);
        const nuevosContactos = nuevos.reduce((s,e) => s + parseInt(e.nuevos_contactos||0), 0);
        setDatosRealesEstudios({ estudiantesActivos: contactosUnicos.length, horasTotales: Math.round(horasTotales*10)/10, horasOnline: Math.round(horasOnline*10)/10, horasPresencial: Math.round(horasPresencial*10)/10, dijeronSi, nuevosContactos });
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
          Loading statistics...
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
  const mesEvangelismo = formatearMes(stats?.evangelismo_missionaries?.mes || "");
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
  const crecimientoMiembros = stats?.crecimiento_miembros || {};
  const crecimientoEstudiantesProyeccion = statsProyeccion?.crecimiento_estudiantes || crecimientoEstudiantes;
  const crecimientoMiembrosProyeccion = statsProyeccion?.crecimiento_miembros || crecimientoMiembros;
  const comparacionEstudiosProyeccion = statsProyeccion?.comparacion_estudios || comparacion;
  const evangelismoProyeccion = statsProyeccion?.evangelismo_missionaries || {};
  const anioSelectdo = stats?.anio_seleccionado || anioActualPorDefecto;
  const aniosDisponibles = stats?.anios_disponibles || [anioSelectdo];
  const tiposMiembroDisponibles = crecimientoMiembros.tipos_disponibles || ["Todos"];
  const aniosComparacionDisponibles = (crecimientoMiembros.anios_disponibles || aniosDisponibles)
    .filter((anio) => anio !== anioSelectdo);
  const aniosComparacionMiembrosOpciones = aniosComparacionDisponibles.length
    ? aniosComparacionDisponibles
    : [anioSelectdo - 1];
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
  const resumenPais = stats?.resumen_pais || resumenPaisFallback || null;
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
      titulo: "Evangelism",
      color: "#134069",
      actual: totalEvangelismoActualProyeccion,
      anteriorMismoPeriodo: null,
      proyectado: proyeccionEvangelismo,
      cierreAnterior: totalEvangelismoAnteriorProyeccion,
      variacion: variacionProyeccionEvangelismo,
      lectura: lecturaEvangelismo,
      unidad: "horas"
    },
    {
      id: "miembros",
      titulo: "Members",
      color: "#8E24AA",
      actual: acumuladoMiembrosActual,
      anteriorMismoPeriodo: acumuladoMiembrosAnteriorMismoPeriodo,
      proyectado: proyeccionMiembros,
      cierreAnterior: totalMiembrosAnterior,
      variacion: variacionProyeccionMiembros,
      lectura: lecturaMiembros,
      unidad: "registros"
    },
    {
      id: "estudios",
      titulo: "Studies",
      color: "#2E7D32",
      actual: acumuladoEstudiosActual,
      anteriorMismoPeriodo: acumuladoEstudiosAnteriorMismoPeriodo,
      proyectado: proyeccionEstudios,
      cierreAnterior: totalEstudiosAnterior,
      variacion: variacionProyeccionEstudios,
      lectura: lecturaEstudios,
      unidad: "estudios"
    }
  ];
  const graficoComparacion = {
    labels: comparacion.labels || ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"],
    datasets: [
      {
        label: comparacion?.serie_anterior?.etiqueta || "Previous Year",
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
        label: comparacion?.serie_actual?.etiqueta || "Current Year",
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
    labels: ["Annual Performance", "Monthly Average", "Daily Average"],
    datasets: [
      {
        label: profesorActivo?.nombre || "Missionary",
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
            label: `Horas ${anioComparacionEvangelismo}`,
            data: Array.from(new Set([
              ...evangelismoMissionaryes.map((profesor) => profesor.nombre),
              ...evangelismoMissionaryesComparacion.map((profesor) => profesor.nombre)
            ])).map((nombre) => evangelismoMissionaryesComparacion.find((profesor) => profesor.nombre === nombre)?.total_horas || 0),
            backgroundColor: "#B8C4CC",
            borderRadius: 10,
            borderSkipped: false
          },
          {
            label: `Horas ${anioEvangelismo}`,
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
            label: `Evangelism hours · ${mesEvangelismo || "current month"}`,
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
          label: (context) => `${context.parsed.y} horas`
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
    labels: crecimientoEstudiantes.labels || ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"],
    datasets: [
      {
        label: `Unique students per month · ${crecimientoEstudiantes.anio || new Date().getFullYear()}`,
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
    labels: crecimientoMiembros.labels || ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"],
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
        label: `Accumulated ${anioSelectdo}`,
        data: resumenesPronostico.map((item) => Number(formatearDecimal(item.actual, 1))),
        backgroundColor: ["#8FD3D7", "#D2A8E6", "#A5D6A7"],
        borderRadius: 10,
        borderSkipped: false
      },
      {
        label: `Year-end projection ${anioSelectdo}`,
        data: resumenesPronostico.map((item) => item.proyectado),
        backgroundColor: ["#134069", "#8E24AA", "#2E7D32"],
        borderRadius: 10,
        borderSkipped: false
      },
      {
        label: `Year-end ${anioSelectdo - 1}`,
        data: resumenesPronostico.map((item) => Number(item.cierreAnterior || 0)),
        backgroundColor: ["#B8C4CC", "#C9B6D9", "#C8E6C9"],
        borderRadius: 10,
        borderSkipped: false
      }
    ]
  };

  const tabs = [
    { id: "pais", label: "Country" },
    { id: "evangelismo", label: "Evangelism" },
    { id: "estudios", label: "Bible Studies" },
    { id: "missionaries", label: "Missionaries" },
    { id: "crecimiento", label: "Growth" },
    { id: "proyeccion", label: "Projection" },
    { id: "iglesias", label: "Churches by Country" }
  ];

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #134069 0%, #1a5490 40%, #f4f6fb 40%)", padding: "28px", fontFamily: "'Lato', sans-serif" }}>
      <div style={{ maxWidth: "1600px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "28px" }}>
          <button onClick={() => navigate("/home")} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "8px", padding: "8px 14px", color: "white", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: "700", fontFamily: "'Lato',sans-serif" }}>
            <FaArrowLeft /> Back
          </button>
          <div>
            <h1 style={{ fontSize: "20px", color: "white", margin: 0, fontFamily: "'Cinzel',serif", fontWeight: "600", letterSpacing: "1px" }}>General Statistics</h1>
            <p style={{ margin: "2px 0 0", color: "rgba(255,255,255,0.6)", fontSize: "12px", fontFamily: "'Lato',sans-serif" }}>System overview · {new Date().getFullYear()}</p>
          </div>
        </div>

        {/* Selector de región y país */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
          <select value={continenteSeleccionado || ""} onChange={e => { setContinenteSeleccionado(Number(e.target.value)); setPaisSeleccionado(null); }}
            style={{ padding: "10px 14px", borderRadius: "8px", border: "none", fontSize: "13px", fontFamily: "'Lato',sans-serif", color: "#1a2d5a", fontWeight: "600", minWidth: "200px" }}>
            <option value="">Select Region</option>
            {continentes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
          <select value={anioSeleccionadoFiltro} onChange={e => setAnioSeleccionadoFiltro(Number(e.target.value))}
            style={{ padding: "10px 14px", borderRadius: "8px", border: "none", fontSize: "13px", fontFamily: "'Lato',sans-serif", color: "#1a2d5a", fontWeight: "600" }}>
            {[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        {/* Tarjetas datos reales de estudios */}
        {datosRealesEstudios && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: "12px", marginBottom: "20px" }}>
            {[
              { label: "Active Students", value: datosRealesEstudios.estudiantesActivos, color: "#134069", icon: "📖" },
              { label: "Study Hours", value: datosRealesEstudios.horasTotales, color: "#4CAF50", icon: "⏱" },
              { label: "Online Evang.", value: datosRealesEstudios.horasOnline, color: "#2196F3", icon: "💻" },
              { label: "In-Person Evang.", value: datosRealesEstudios.horasPresencial, color: "#FF9800", icon: "🚶" },
              { label: "New Contacts", value: datosRealesEstudios.nuevosContactos, color: "#9C27B0", icon: "👥" },
              { label: "Said Yes", value: datosRealesEstudios.dijeronSi, color: "#E91E63", icon: "✋" },
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
                <div style={{ fontSize: "14px", color: "#666", marginBottom: "8px" }}>Total Users</div>
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
                <div style={{ fontSize: "14px", color: "#666", marginBottom: "8px" }}>Total Members</div>
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
                <div style={{ fontSize: "14px", color: "#666", marginBottom: "8px" }}>Total Contacts</div>
                <div style={{ fontSize: "32px", fontWeight: "700", color: "#FF9800" }}>
                  {stats?.total_contactos || 0}
                </div>
              </div>
              <div style={{ fontSize: "48px", opacity: 0.2 }}>📞</div>
            </div>
          </div>

          <div style={{ background: "white", padding: "25px", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: "14px", color: "#666", marginBottom: "8px" }}>Total Studies</div>
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
            <div style={{ fontSize: "14px", color: "#666", marginBottom: "8px" }}>Annual Variation</div>
            <div style={{ fontSize: "30px", fontWeight: "700", color: obtenerColorCrecimiento(comparacion.crecimiento || 0) }}>
              {formatearVariacion(comparacion.crecimiento || 0)}
            </div>
            <div style={{ marginTop: "10px", color: "#777", fontSize: "13px" }}>
              vs previous period
            </div>
          </div>

          <div style={{ background: "white", padding: "25px", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
            <div style={{ fontSize: "14px", color: "#666", marginBottom: "8px" }}>Total Difference</div>
            <div style={{ fontSize: "30px", fontWeight: "700", color: obtenerColorCrecimiento(comparacion.diferencia || 0) }}>
              {comparacion.diferencia > 0 ? `+${comparacion.diferencia}` : comparacion.diferencia || 0}
            </div>
            <div style={{ marginTop: "10px", color: "#777", fontSize: "13px" }}>
              Study difference
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
                <h2 style={{ fontSize: "20px", marginBottom: "8px", color: "#1a1a1a" }}>Country Summary</h2>
                <p style={{ margin: "0 0 20px", color: "#666", fontSize: "14px" }}>
                  Datos consolidados del país asignado al usuario actual.
                </p>

                {resumenPais ? (
                  <>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "20px" }}>
                      <div style={{ background: "white", borderRadius: "14px", padding: "18px", border: "1px solid #e5e7eb" }}>
                        <div style={{ fontSize: "12px", color: "#667085", marginBottom: "6px" }}>Country</div>
                        <div style={{ fontSize: "24px", fontWeight: "700", color: "#134069" }}>
                          {resumenPais.nombre_pais}
                        </div>
                      </div>
                      <div style={{ background: "white", borderRadius: "14px", padding: "18px", border: "1px solid #e5e7eb" }}>
                        <div style={{ fontSize: "12px", color: "#667085", marginBottom: "6px" }}>Cantidad de iglesias</div>
                        <div style={{ fontSize: "28px", fontWeight: "700", color: "#2E7D32" }}>
                          {resumenPais.cantidad_iglesias || 0}
                        </div>
                      </div>
                      <div style={{ background: "white", borderRadius: "14px", padding: "18px", border: "1px solid #e5e7eb" }}>
                        <div style={{ fontSize: "12px", color: "#667085", marginBottom: "6px" }}>Cantidad de miembros</div>
                        <div style={{ fontSize: "28px", fontWeight: "700", color: "#8E24AA" }}>
                          {resumenPais.cantidad_miembros || 0}
                        </div>
                      </div>
                    </div>

                    <div style={{ background: "white", borderRadius: "14px", padding: "18px", border: "1px solid #e5e7eb", color: "#4b5563", lineHeight: "1.6" }}>
                      {`${resumenPais.nombre_pais} tiene ${resumenPais.cantidad_iglesias || 0} iglesias registradas y ${resumenPais.cantidad_miembros || 0} miembros asociados a ese país.`}
                    </div>
                  </>
                ) : (
                  <div style={{ padding: "18px", borderRadius: "12px", background: "white", color: "#667085", border: "1px solid #e5e7eb" }}>
                    No country assigned to user or no data available for this country.
                  </div>
                )}
              </div>
            </div>
          )}

          {tabActiva === "evangelismo" && (
            <div style={{ padding: "10px" }}>
              <div style={{ background: "#f8fafb", borderRadius: "16px", padding: "24px" }}>
                <h2 style={{ fontSize: "20px", marginBottom: "8px", color: "#1a1a1a" }}>Evangelism Hours by Missionary</h2>
                <p style={{ margin: "0 0 20px", color: "#666", fontSize: "14px" }}>
                  {modoEvangelismo === "annual"
                    ? `Total hours recorded by missionary during ${anioEvangelismo}, vs ${anioComparacionEvangelismo}.`
                    : `Total hours recorded by missionary in ${mesEvangelismo || "current month"} de ${anioEvangelismo}.`}
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px", marginBottom: "20px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", color: "#46535a", marginBottom: "8px", fontWeight: "600" }}>
                      Vista
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
                      <option value="monthly">Specific month</option>
                      <option value="annual">Todo el ano</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", color: "#46535a", marginBottom: "8px", fontWeight: "600" }}>
                      Año
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
                        Mes
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
                            {formatearMes(mes)}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  {modoEvangelismoSelectdo === "annual" && (
                    <div>
                      <label style={{ display: "block", fontSize: "13px", color: "#46535a", marginBottom: "8px", fontWeight: "600" }}>
                        Comparar contra
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
                        <div style={{ fontSize: "12px", color: "#667085", marginBottom: "6px" }}>Missionaryes con registro</div>
                        <div style={{ fontSize: "24px", fontWeight: "700", color: "#134069" }}>
                          {evangelismoMissionaryes.filter((profesor) => Number(profesor.total_horas) > 0).length}
                        </div>
                      </div>
                      <div style={{ background: "white", borderRadius: "12px", padding: "14px 16px", border: "1px solid #e5e7eb" }}>
                        <div style={{ fontSize: "12px", color: "#667085", marginBottom: "6px" }}>
                          {modoEvangelismo === "annual" ? `Total hours ${anioEvangelismo}` : "Total hours del mes"}
                        </div>
                        <div style={{ fontSize: "24px", fontWeight: "700", color: "#1f2937" }}>
                          {formatearDecimal(totalEvangelismoActual, 1)}
                        </div>
                      </div>
                      {modoEvangelismo === "annual" && (
                        <>
                          <div style={{ background: "white", borderRadius: "12px", padding: "14px 16px", border: "1px solid #e5e7eb" }}>
                            <div style={{ fontSize: "12px", color: "#667085", marginBottom: "6px" }}>
                              {`Total hours ${anioComparacionEvangelismo}`}
                            </div>
                            <div style={{ fontSize: "24px", fontWeight: "700", color: "#475467" }}>
                              {formatearDecimal(totalEvangelismoComparacion, 1)}
                            </div>
                          </div>
                          <div style={{ background: "white", borderRadius: "12px", padding: "14px 16px", border: "1px solid #e5e7eb" }}>
                            <div style={{ fontSize: "12px", color: "#667085", marginBottom: "6px" }}>Annual Variation</div>
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
                            {formatearDecimal(profesor.total_horas, 1)} h
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div style={{ padding: "18px", borderRadius: "12px", background: "white", color: "#667085", border: "1px solid #e5e7eb" }}>
                    No evangelism hours recorded yet.
                  </div>
                )}
              </div>
            </div>
          )}

          {tabActiva === "estudios" && (
            <div style={{ padding: "10px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "12px", marginBottom: "20px" }}>
                <div style={{ background: "white", borderRadius: "12px", padding: "14px 16px", border: "1px solid #e5e7eb" }}>
                  <div style={{ fontSize: "12px", color: "#667085", marginBottom: "6px" }}>Annual Variation</div>
                  <div style={{ fontSize: "24px", fontWeight: "700", color: obtenerColorCrecimiento(comparacion.crecimiento || 0) }}>
                    {formatearVariacion(comparacion.crecimiento || 0)}
                  </div>
                </div>
                <div style={{ background: "white", borderRadius: "12px", padding: "14px 16px", border: "1px solid #e5e7eb" }}>
                  <div style={{ fontSize: "12px", color: "#667085", marginBottom: "6px" }}>Total Difference</div>
                  <div style={{ fontSize: "24px", fontWeight: "700", color: obtenerColorCrecimiento(comparacion.diferencia || 0) }}>
                    {comparacion.diferencia > 0 ? `+${comparacion.diferencia}` : comparacion.diferencia || 0}
                  </div>
                </div>
              </div>

              <div style={{ background: "#f8fafb", borderRadius: "16px", padding: "24px", minWidth: 0 }}>
                <h2 style={{ fontSize: "20px", marginBottom: "8px", color: "#1a1a1a" }}>Studies Comparison</h2>
                <p style={{ margin: "0 0 20px", color: "#666", fontSize: "14px" }}>
                  Total studies per month comparing current year vs previous year.
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
                <h2 style={{ fontSize: "20px", marginBottom: "8px", color: "#1a1a1a" }}>Performance by Missionary</h2>
                <p style={{ margin: "0 0 20px", color: "#666", fontSize: "14px" }}>
                  Estudios del año {anioRendimiento}, con promedio mensual y promedio diario por profesor.
                </p>

                {rendimientoMissionaryes.length > 0 ? (
                  <>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px", marginBottom: "20px" }}>
                      <div style={{ background: "white", borderRadius: "12px", padding: "14px 16px", border: "1px solid #e5e7eb" }}>
                        <div style={{ fontSize: "12px", color: "#667085", marginBottom: "6px" }}>Missionaryes con datos</div>
                        <div style={{ fontSize: "24px", fontWeight: "700", color: "#134069" }}>{rendimientoMissionaryes.length}</div>
                      </div>
                      <div style={{ background: "white", borderRadius: "12px", padding: "14px 16px", border: "1px solid #e5e7eb" }}>
                        <div style={{ fontSize: "12px", color: "#667085", marginBottom: "6px" }}>Missionary seleccionado</div>
                        <div style={{ fontSize: "16px", fontWeight: "700", color: "#1f2937" }}>
                          {profesorActivo?.nombre || "No data"}
                        </div>
                      </div>
                    </div>

                    <div style={{ marginBottom: "20px" }}>
                      <label style={{ display: "block", fontSize: "13px", color: "#46535a", marginBottom: "8px", fontWeight: "600" }}>
                        Selectr profesor
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
                            <div style={{ color: "#667085", fontSize: "12px" }}>Missionary</div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ color: "#134069", fontWeight: "700" }}>{profesor.total_estudios || 0}</div>
                            <div style={{ color: "#667085", fontSize: "12px" }}>Annual</div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ color: "#1f2937", fontWeight: "600" }}>{formatearDecimal(profesor.promedio_mensual, 1)}</div>
                            <div style={{ color: "#667085", fontSize: "12px" }}>Monthly</div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ color: "#1f2937", fontWeight: "600" }}>{formatearDecimal(profesor.promedio_diario, 2)}</div>
                            <div style={{ color: "#667085", fontSize: "12px" }}>Diario</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div style={{ padding: "18px", borderRadius: "12px", background: "white", color: "#667085", border: "1px solid #e5e7eb" }}>
                    No missionary performance data available yet.
                  </div>
                )}
              </div>
            </div>
          )}

          {tabActiva === "crecimiento" && (
            <div style={{ padding: "10px" }}>
              <div style={{ background: "#f8fafb", borderRadius: "16px", padding: "24px", marginBottom: "24px" }}>
                <h2 style={{ fontSize: "20px", marginBottom: "8px", color: "#1a1a1a" }}>Member Growth by Month</h2>
                <p style={{ margin: "0 0 20px", color: "#666", fontSize: "14px" }}>
                  Monthly member additions by type, comparing main year vs another year.
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px", marginBottom: "20px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", color: "#46535a", marginBottom: "8px", fontWeight: "600" }}>
                      Tipo de miembro
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
                          {tipo}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", color: "#46535a", marginBottom: "8px", fontWeight: "600" }}>
                      Comparar contra
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
                    <div style={{ fontSize: "12px", color: "#667085", marginBottom: "6px" }}>Main Year</div>
                    <div style={{ fontSize: "24px", fontWeight: "700", color: "#8E24AA" }}>
                      {anioSelectdo}
                    </div>
                  </div>
                  <div style={{ background: "white", borderRadius: "12px", padding: "14px 16px", border: "1px solid #e5e7eb" }}>
                    <div style={{ fontSize: "12px", color: "#667085", marginBottom: "6px" }}>Miembros nuevos en {anioSelectdo}</div>
                    <div style={{ fontSize: "24px", fontWeight: "700", color: "#1f2937" }}>
                      {totalCrecimientoMiembrosActual}
                    </div>
                  </div>
                  <div style={{ background: "white", borderRadius: "12px", padding: "14px 16px", border: "1px solid #e5e7eb" }}>
                    <div style={{ fontSize: "12px", color: "#667085", marginBottom: "6px" }}>Miembros nuevos en {anioComparacionMiembros}</div>
                    <div style={{ fontSize: "24px", fontWeight: "700", color: "#475467" }}>
                      {totalCrecimientoMiembrosComparacion}
                    </div>
                  </div>
                  <div style={{ background: "white", borderRadius: "12px", padding: "14px 16px", border: "1px solid #e5e7eb" }}>
                    <div style={{ fontSize: "12px", color: "#667085", marginBottom: "6px" }}>Annual Variation</div>
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
                <h2 style={{ fontSize: "20px", marginBottom: "8px", color: "#1a1a1a" }}>Unique Students with Bible Study per Month</h2>
                <p style={{ margin: "0 0 20px", color: "#666", fontSize: "14px" }}>
                  Muestra cuantos estudiantes diferentes tuvieron al menos un estudio biblico en cada mes de {crecimientoEstudiantes.anio || new Date().getFullYear()}, sin repetir al mismo estudiante dentro del mismo mes.
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginBottom: "20px" }}>
                  <div style={{ background: "white", borderRadius: "12px", padding: "14px 16px", border: "1px solid #e5e7eb" }}>
                    <div style={{ fontSize: "12px", color: "#667085", marginBottom: "6px" }}>Year analyzed</div>
                    <div style={{ fontSize: "24px", fontWeight: "700", color: "#2E7D32" }}>
                      {crecimientoEstudiantes.anio || new Date().getFullYear()}
                    </div>
                  </div>
                  <div style={{ background: "white", borderRadius: "12px", padding: "14px 16px", border: "1px solid #e5e7eb" }}>
                    <div style={{ fontSize: "12px", color: "#667085", marginBottom: "6px" }}>Total students per month</div>
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
                <h2 style={{ fontSize: "20px", marginBottom: "8px", color: "#1a1a1a" }}>Annual Closing Projection</h2>
                <p style={{ margin: "0 0 20px", color: "#666", fontSize: "14px" }}>
                  Estimates how the year {anioSelectdo} may close if the average pace from January to {formatearMes(MESES_EVANGELISMO[mesCorteProyeccion])} is maintained through December, compared to the previous year closing.
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginBottom: "20px" }}>
                  <div style={{ background: "white", borderRadius: "12px", padding: "14px 16px", border: "1px solid #e5e7eb" }}>
                    <div style={{ fontSize: "12px", color: "#667085", marginBottom: "6px" }}>Projected year</div>
                    <div style={{ fontSize: "24px", fontWeight: "700", color: "#134069" }}>{anioSelectdo}</div>
                  </div>
                  <div style={{ background: "white", borderRadius: "12px", padding: "14px 16px", border: "1px solid #e5e7eb" }}>
                    <div style={{ fontSize: "12px", color: "#667085", marginBottom: "6px" }}>Meses analizados</div>
                    <div style={{ fontSize: "24px", fontWeight: "700", color: "#1f2937" }}>{mesesTranscurridosProyeccion}</div>
                  </div>
                  <div style={{ background: "white", borderRadius: "12px", padding: "14px 16px", border: "1px solid #e5e7eb" }}>
                    <div style={{ fontSize: "12px", color: "#667085", marginBottom: "6px" }}>Criterio</div>
                    <div style={{ fontSize: "16px", fontWeight: "700", color: "#1f2937" }}>Ritmo promedio mensual</div>
                  </div>
                  <div style={{ background: "white", borderRadius: "12px", padding: "14px 16px", border: "1px solid #e5e7eb" }}>
                    <div style={{ fontSize: "12px", color: "#667085", marginBottom: "6px" }}>Estudiantes proyectados</div>
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
                          {item.lectura.etiqueta}
                        </div>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "12px", marginBottom: "14px" }}>
                        <div style={{ background: "#f8fafb", borderRadius: "12px", padding: "12px" }}>
                          <div style={{ fontSize: "12px", color: "#667085", marginBottom: "6px" }}>Acumulado actual</div>
                          <div style={{ fontSize: "24px", fontWeight: "700", color: item.color }}>
                            {formatearDecimal(item.actual, 1)}
                          </div>
                        </div>
                        <div style={{ background: "#f8fafb", borderRadius: "12px", padding: "12px" }}>
                          <div style={{ fontSize: "12px", color: "#667085", marginBottom: "6px" }}>Cierre proyectado</div>
                          <div style={{ fontSize: "24px", fontWeight: "700", color: "#1f2937" }}>
                            {formatearDecimal(item.proyectado, 1)}
                          </div>
                        </div>
                        <div style={{ background: "#f8fafb", borderRadius: "12px", padding: "12px" }}>
                          <div style={{ fontSize: "12px", color: "#667085", marginBottom: "6px" }}>Previous year closing</div>
                          <div style={{ fontSize: "24px", fontWeight: "700", color: "#475467" }}>
                            {formatearDecimal(item.cierreAnterior, 1)}
                          </div>
                        </div>
                        <div style={{ background: "#f8fafb", borderRadius: "12px", padding: "12px" }}>
                          <div style={{ fontSize: "12px", color: "#667085", marginBottom: "6px" }}>Projected variation</div>
                          <div style={{ fontSize: "24px", fontWeight: "700", color: obtenerColorCrecimiento(item.variacion) }}>
                            {formatearVariacion(item.variacion)}
                          </div>
                        </div>
                      </div>

                      <div style={{ color: "#4b5563", fontSize: "14px", lineHeight: "1.6" }}>
                        {item.titulo === "Evangelismo"
                          ? `At current pace, ${item.titulo.toLowerCase()} could close at ${formatearDecimal(item.proyectado, 1)} ${item.unidad}, vs ${formatearDecimal(item.cierreAnterior, 1)} ${item.unidad} of the previous year. ${item.lectura.descripcion}`
                          : `Through ${formatearMes(MESES_EVANGELISMO[mesCorteProyeccion])} you have ${formatearDecimal(item.actual, 1)} ${item.unidad}. At the same point last year: ${formatearDecimal(item.anteriorMismoPeriodo, 1)} ${item.unidad}. ${item.lectura.descripcion}`}
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
                Churches & Presence by Country
              </h2>
              <p style={{ margin: "4px 0 0", color: "#8a97b0", fontSize: "12px" }}>
                {continenteSeleccionado ? continentes.find(c => c.id === continenteSeleccionado)?.nombre : "All regions"} — {anioSeleccionadoFiltro}
              </p>
            </div>
            <div style={{ padding: "20px 24px" }}>
              {paisesDelContinente.length === 0 ? (
                <div style={{ textAlign: "center", color: "#b0bcd0", padding: "40px" }}>Select a region to view countries</div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
                  {paisesDelContinente.map((pais, i) => {
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
                            { label: "Members", value: stats?.total_miembros || "—", icon: "👥" },
                            { label: "Contacts", value: stats?.total_contactos || "—", icon: "📞" },
                            { label: "Churches", value: resumenPaisFallback?.cantidad_iglesias || 0, icon: "⛪" },
                            { label: "Studies", value: datosRealesEstudios?.estudiantesActivos || 0, icon: "📖" },
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
