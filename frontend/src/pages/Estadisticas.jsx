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
import toast from 'react-hot-toast';

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

export default function Estadisticas() {
  const navigate = useNavigate();
  const anioActualPorDefecto = new Date().getFullYear();
  const mesActualPorDefecto = new Date().toLocaleString('es-ES', { month: 'long' }).toUpperCase();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tabActiva, setTabActiva] = useState("evangelismo");
  const [profesorSeleccionado, setProfesorSeleccionado] = useState("");
  const [tipoMiembroSeleccionado, setTipoMiembroSeleccionado] = useState("Todos");
  const [anioComparacionMiembros, setAnioComparacionMiembros] = useState(anioActualPorDefecto - 1);
  const [modoEvangelismoSeleccionado, setModoEvangelismoSeleccionado] = useState("mensual");
  const [anioEvangelismoSeleccionado, setAnioEvangelismoSeleccionado] = useState(anioActualPorDefecto);
  const [mesEvangelismoSeleccionado, setMesEvangelismoSeleccionado] = useState(mesActualPorDefecto);
  const [anioComparacionEvangelismoSeleccionado, setAnioComparacionEvangelismoSeleccionado] = useState(anioActualPorDefecto - 1);

  useEffect(() => {
    cargarEstadisticas(anioActualPorDefecto);
  }, [anioEvangelismoSeleccionado, mesEvangelismoSeleccionado, modoEvangelismoSeleccionado, anioComparacionEvangelismoSeleccionado]);

  const cargarEstadisticas = async (anio) => {
    try {
      setLoading(true);
      const data = await administracionService.getEstadisticasGenerales(anio, {
        anio_evangelismo: anioEvangelismoSeleccionado,
        mes_evangelismo: mesEvangelismoSeleccionado,
        modo_evangelismo: modoEvangelismoSeleccionado,
        anio_comparacion_evangelismo: anioComparacionEvangelismoSeleccionado
      });
      setStats(data);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar estadísticas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const profesores = stats?.rendimiento_profesores?.profesores || [];

    if (!profesores.length) {
      setProfesorSeleccionado("");
      return;
    }

    const profesorExiste = profesores.some(
      (profesor) => String(profesor.id) === profesorSeleccionado
    );

    if (!profesorSeleccionado || !profesorExiste) {
      setProfesorSeleccionado(String(profesores[0].id));
    }
  }, [stats, profesorSeleccionado]);

  useEffect(() => {
    const tiposDisponibles = stats?.crecimiento_miembros?.tipos_disponibles || ["Todos"];

    if (!tiposDisponibles.includes(tipoMiembroSeleccionado)) {
      setTipoMiembroSeleccionado("Todos");
    }
  }, [stats, tipoMiembroSeleccionado]);

  useEffect(() => {
    const anioSeleccionadoActual = stats?.anio_seleccionado || anioActualPorDefecto;
    const aniosComparables = (stats?.crecimiento_miembros?.anios_disponibles || [])
      .filter((anio) => anio !== anioSeleccionadoActual);

    const anioPreferido = aniosComparables.includes(anioSeleccionadoActual - 1)
      ? anioSeleccionadoActual - 1
      : aniosComparables[0] || (anioSeleccionadoActual - 1);

    if (!aniosComparables.includes(anioComparacionMiembros)) {
      setAnioComparacionMiembros(anioPreferido);
    }
  }, [stats, anioActualPorDefecto, anioComparacionMiembros]);

  useEffect(() => {
    const aniosDisponibles = stats?.evangelismo_profesores?.anios_disponibles || [anioActualPorDefecto, anioActualPorDefecto - 1];
    const aniosComparables = aniosDisponibles.filter((anio) => anio !== anioEvangelismoSeleccionado);
    const sugerido = aniosComparables.includes(anioEvangelismoSeleccionado - 1)
      ? anioEvangelismoSeleccionado - 1
      : (aniosComparables[0] || (anioEvangelismoSeleccionado - 1));

    if (!aniosComparables.includes(anioComparacionEvangelismoSeleccionado)) {
      setAnioComparacionEvangelismoSeleccionado(sugerido);
    }
  }, [stats, anioActualPorDefecto, anioEvangelismoSeleccionado, anioComparacionEvangelismoSeleccionado]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#f5f7fa", padding: "20px", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <div style={{ background: "white", padding: "40px", borderRadius: "12px", textAlign: "center" }}>
          Cargando estadísticas...
        </div>
      </div>
    );
  }

  const comparacion = stats?.comparacion_estudios || {};
  const rendimientoProfesores = stats?.rendimiento_profesores?.profesores || [];
  const anioRendimiento = stats?.rendimiento_profesores?.anio || new Date().getFullYear();
  const evangelismoProfesores = stats?.evangelismo_profesores?.profesores || [];
  const evangelismoProfesoresComparacion = stats?.evangelismo_profesores?.profesores_comparacion || [];
  const modoEvangelismo = stats?.evangelismo_profesores?.modo || modoEvangelismoSeleccionado;
  const mesEvangelismo = formatearMes(stats?.evangelismo_profesores?.mes || "");
  const anioEvangelismo = stats?.evangelismo_profesores?.anio || new Date().getFullYear();
  const anioComparacionEvangelismo = stats?.evangelismo_profesores?.anio_comparacion || anioComparacionEvangelismoSeleccionado;
  const aniosEvangelismoDisponibles = stats?.evangelismo_profesores?.anios_disponibles || [anioActualPorDefecto, anioActualPorDefecto - 1];
  const aniosEvangelismoComparables = aniosEvangelismoDisponibles.filter((anio) => anio !== anioEvangelismoSeleccionado);
  const totalEvangelismoActual = evangelismoProfesores.reduce((sum, profesor) => sum + Number(profesor.total_horas || 0), 0);
  const totalEvangelismoComparacion = evangelismoProfesoresComparacion.reduce((sum, profesor) => sum + Number(profesor.total_horas || 0), 0);
  const variacionEvangelismoAnual = totalEvangelismoComparacion > 0
    ? Number((((totalEvangelismoActual - totalEvangelismoComparacion) / totalEvangelismoComparacion) * 100).toFixed(1))
    : (totalEvangelismoActual > 0 ? 100 : 0);
  const crecimientoEstudiantes = stats?.crecimiento_estudiantes || {};
  const crecimientoMiembros = stats?.crecimiento_miembros || {};
  const anioSeleccionado = stats?.anio_seleccionado || anioActualPorDefecto;
  const aniosDisponibles = stats?.anios_disponibles || [anioSeleccionado];
  const tiposMiembroDisponibles = crecimientoMiembros.tipos_disponibles || ["Todos"];
  const aniosComparacionDisponibles = (crecimientoMiembros.anios_disponibles || aniosDisponibles)
    .filter((anio) => anio !== anioSeleccionado);
  const aniosComparacionMiembrosOpciones = aniosComparacionDisponibles.length
    ? aniosComparacionDisponibles
    : [anioSeleccionado - 1];
  const seriesMiembrosPorTipo = crecimientoMiembros.series_por_tipo || {};
  const seriesTipoMiembroSeleccionado = seriesMiembrosPorTipo[tipoMiembroSeleccionado] || {};
  const serieCrecimientoMiembrosActual = seriesTipoMiembroSeleccionado[anioSeleccionado] || Array(12).fill(0);
  const serieCrecimientoMiembrosComparacion = seriesTipoMiembroSeleccionado[anioComparacionMiembros] || Array(12).fill(0);
  const totalCrecimientoMiembrosActual = serieCrecimientoMiembrosActual.reduce((sum, value) => sum + value, 0);
  const totalCrecimientoMiembrosComparacion = serieCrecimientoMiembrosComparacion.reduce((sum, value) => sum + value, 0);
  const variacionCrecimientoMiembros = totalCrecimientoMiembrosComparacion > 0
    ? Number((((totalCrecimientoMiembrosActual - totalCrecimientoMiembrosComparacion) / totalCrecimientoMiembrosComparacion) * 100).toFixed(1))
    : (totalCrecimientoMiembrosActual > 0 ? 100 : 0);
  const profesorActivo = rendimientoProfesores.find(
    (profesor) => String(profesor.id) === profesorSeleccionado
  ) || rendimientoProfesores[0] || null;
  const graficoComparacion = {
    labels: comparacion.labels || ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"],
    datasets: [
      {
        label: comparacion?.serie_anterior?.etiqueta || "Año anterior",
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
        label: comparacion?.serie_actual?.etiqueta || "Año actual",
        data: comparacion?.serie_actual?.data || Array(12).fill(0),
        borderColor: "#0E5A61",
        backgroundColor: "rgba(14, 90, 97, 0.12)",
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

  const graficoRendimientoProfesor = {
    labels: ["Rendimiento anual", "Promedio mensual", "Promedio diario"],
    datasets: [
      {
        label: profesorActivo?.nombre || "Profesor",
        data: profesorActivo
          ? [
              profesorActivo.total_estudios || 0,
              profesorActivo.promedio_mensual || 0,
              profesorActivo.promedio_diario || 0
            ]
          : [0, 0, 0],
        borderColor: "#0E5A61",
        backgroundColor: "rgba(14, 90, 97, 0.12)",
        borderWidth: 3,
        pointBackgroundColor: "#0E5A61",
        pointBorderColor: "#ffffff",
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
        tension: 0.3,
        fill: true
      }
    ]
  };

  const opcionesGraficoProfesores = {
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

  const graficoEvangelismoProfesores = {
    labels: Array.from(new Set([
      ...evangelismoProfesores.map((profesor) => profesor.nombre),
      ...evangelismoProfesoresComparacion.map((profesor) => profesor.nombre)
    ])),
    datasets: modoEvangelismo === "anual"
      ? [
          {
            label: `Horas ${anioComparacionEvangelismo}`,
            data: Array.from(new Set([
              ...evangelismoProfesores.map((profesor) => profesor.nombre),
              ...evangelismoProfesoresComparacion.map((profesor) => profesor.nombre)
            ])).map((nombre) => evangelismoProfesoresComparacion.find((profesor) => profesor.nombre === nombre)?.total_horas || 0),
            backgroundColor: "#B8C4CC",
            borderRadius: 10,
            borderSkipped: false
          },
          {
            label: `Horas ${anioEvangelismo}`,
            data: Array.from(new Set([
              ...evangelismoProfesores.map((profesor) => profesor.nombre),
              ...evangelismoProfesoresComparacion.map((profesor) => profesor.nombre)
            ])).map((nombre) => evangelismoProfesores.find((profesor) => profesor.nombre === nombre)?.total_horas || 0),
            backgroundColor: "#0E5A61",
            borderRadius: 10,
            borderSkipped: false
          }
        ]
      : [
          {
            label: `Horas de evangelismo en ${mesEvangelismo || "el mes actual"}`,
            data: evangelismoProfesores.map((profesor) => profesor.total_horas || 0),
            backgroundColor: [
              "#0E5A61",
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
        display: modoEvangelismo === "anual"
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
    labels: crecimientoEstudiantes.labels || ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"],
    datasets: [
      {
        label: `Estudiantes unicos por mes ${crecimientoEstudiantes.anio || new Date().getFullYear()}`,
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
    labels: crecimientoMiembros.labels || ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"],
    datasets: [
      {
        label: `${tipoMiembroSeleccionado} ${anioComparacionMiembros}`,
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
        label: `${tipoMiembroSeleccionado} ${anioSeleccionado}`,
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

  const tabs = [
    { id: "evangelismo", label: "Evangelismo" },
    { id: "estudios", label: "Estudios" },
    { id: "profesores", label: "Profesores" },
    { id: "crecimiento", label: "Crecimiento" }
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#f5f7fa", padding: "20px" }}>
      <div style={{ maxWidth: "1600px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "20px" }}>
          <button onClick={() => navigate("/home")} style={{ background: "white", border: "none", borderRadius: "12px", width: "50px", height: "50px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
            <FaArrowLeft style={{ fontSize: "18px", color: "#0E5A61" }} />
          </button>
          <div>
            <h1 style={{ fontSize: "28px", color: "#1a1a1a", margin: 0 }}>Estadísticas Generales</h1>
            <p style={{ margin: "5px 0 0", color: "#666", fontSize: "14px" }}>Resumen del sistema</p>
          </div>
        </div>

        {/* Tarjetas de resumen */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px", marginBottom: "30px" }}>
          <div style={{ background: "white", padding: "25px", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: "14px", color: "#666", marginBottom: "8px" }}>Total Usuarios</div>
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
                <div style={{ fontSize: "14px", color: "#666", marginBottom: "8px" }}>Total Miembros</div>
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
                <div style={{ fontSize: "14px", color: "#666", marginBottom: "8px" }}>Total Contactos</div>
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
                <div style={{ fontSize: "14px", color: "#666", marginBottom: "8px" }}>Total Estudios</div>
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
            <div style={{ fontSize: "14px", color: "#666", marginBottom: "8px" }}>Variacion anual</div>
            <div style={{ fontSize: "30px", fontWeight: "700", color: obtenerColorCrecimiento(comparacion.crecimiento || 0) }}>
              {formatearVariacion(comparacion.crecimiento || 0)}
            </div>
            <div style={{ marginTop: "10px", color: "#777", fontSize: "13px" }}>
              Frente al periodo anterior
            </div>
          </div>

          <div style={{ background: "white", padding: "25px", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
            <div style={{ fontSize: "14px", color: "#666", marginBottom: "8px" }}>Diferencia total</div>
            <div style={{ fontSize: "30px", fontWeight: "700", color: obtenerColorCrecimiento(comparacion.diferencia || 0) }}>
              {comparacion.diferencia > 0 ? `+${comparacion.diferencia}` : comparacion.diferencia || 0}
            </div>
            <div style={{ marginTop: "10px", color: "#777", fontSize: "13px" }}>
              Estudios de diferencia
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
                  background: tabActiva === tab.id ? "#0E5A61" : "#edf2f4",
                  color: tabActiva === tab.id ? "white" : "#4b5563",
                  transition: "all 0.2s ease"
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {tabActiva === "evangelismo" && (
            <div style={{ padding: "10px" }}>
              <div style={{ background: "#f8fafb", borderRadius: "16px", padding: "24px" }}>
                <h2 style={{ fontSize: "20px", marginBottom: "8px", color: "#1a1a1a" }}>Horas de evangelismo por profesor</h2>
                <p style={{ margin: "0 0 20px", color: "#666", fontSize: "14px" }}>
                  {modoEvangelismo === "anual"
                    ? `Total de horas registradas por profesor durante ${anioEvangelismo}, con comparación frente a ${anioComparacionEvangelismo}.`
                    : `Total de horas registradas por profesor en ${mesEvangelismo || "el mes actual"} de ${anioEvangelismo}.`}
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px", marginBottom: "20px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", color: "#46535a", marginBottom: "8px", fontWeight: "600" }}>
                      Vista
                    </label>
                    <select
                      value={modoEvangelismoSeleccionado}
                      onChange={(e) => setModoEvangelismoSeleccionado(e.target.value)}
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
                      <option value="mensual">Mes especifico</option>
                      <option value="anual">Todo el ano</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", color: "#46535a", marginBottom: "8px", fontWeight: "600" }}>
                      Año
                    </label>
                    <select
                      value={anioEvangelismoSeleccionado}
                      onChange={(e) => setAnioEvangelismoSeleccionado(Number(e.target.value))}
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
                  {modoEvangelismoSeleccionado === "mensual" && (
                    <div>
                      <label style={{ display: "block", fontSize: "13px", color: "#46535a", marginBottom: "8px", fontWeight: "600" }}>
                        Mes
                      </label>
                      <select
                        value={mesEvangelismoSeleccionado}
                        onChange={(e) => setMesEvangelismoSeleccionado(e.target.value)}
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
                  {modoEvangelismoSeleccionado === "anual" && (
                    <div>
                      <label style={{ display: "block", fontSize: "13px", color: "#46535a", marginBottom: "8px", fontWeight: "600" }}>
                        Comparar contra
                      </label>
                      <select
                        value={anioComparacionEvangelismoSeleccionado}
                        onChange={(e) => setAnioComparacionEvangelismoSeleccionado(Number(e.target.value))}
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
                        {(aniosEvangelismoComparables.length ? aniosEvangelismoComparables : [anioEvangelismoSeleccionado - 1]).map((anio) => (
                          <option key={anio} value={anio}>
                            {anio}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {evangelismoProfesores.length > 0 ? (
                  <>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginBottom: "20px" }}>
                      <div style={{ background: "white", borderRadius: "12px", padding: "14px 16px", border: "1px solid #e5e7eb" }}>
                        <div style={{ fontSize: "12px", color: "#667085", marginBottom: "6px" }}>Profesores con registro</div>
                        <div style={{ fontSize: "24px", fontWeight: "700", color: "#0E5A61" }}>
                          {evangelismoProfesores.filter((profesor) => Number(profesor.total_horas) > 0).length}
                        </div>
                      </div>
                      <div style={{ background: "white", borderRadius: "12px", padding: "14px 16px", border: "1px solid #e5e7eb" }}>
                        <div style={{ fontSize: "12px", color: "#667085", marginBottom: "6px" }}>
                          {modoEvangelismo === "anual" ? `Horas totales ${anioEvangelismo}` : "Horas totales del mes"}
                        </div>
                        <div style={{ fontSize: "24px", fontWeight: "700", color: "#1f2937" }}>
                          {formatearDecimal(totalEvangelismoActual, 1)}
                        </div>
                      </div>
                      {modoEvangelismo === "anual" && (
                        <>
                          <div style={{ background: "white", borderRadius: "12px", padding: "14px 16px", border: "1px solid #e5e7eb" }}>
                            <div style={{ fontSize: "12px", color: "#667085", marginBottom: "6px" }}>
                              {`Horas totales ${anioComparacionEvangelismo}`}
                            </div>
                            <div style={{ fontSize: "24px", fontWeight: "700", color: "#475467" }}>
                              {formatearDecimal(totalEvangelismoComparacion, 1)}
                            </div>
                          </div>
                          <div style={{ background: "white", borderRadius: "12px", padding: "14px 16px", border: "1px solid #e5e7eb" }}>
                            <div style={{ fontSize: "12px", color: "#667085", marginBottom: "6px" }}>Variacion anual</div>
                            <div style={{ fontSize: "24px", fontWeight: "700", color: obtenerColorCrecimiento(variacionEvangelismoAnual) }}>
                              {formatearVariacion(variacionEvangelismoAnual)}
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    <div style={{ height: "340px", marginBottom: "20px" }}>
                      <Bar data={graficoEvangelismoProfesores} options={opcionesGraficoEvangelismo} />
                    </div>

                    <div style={{ background: "white", borderRadius: "14px", border: "1px solid #e5e7eb", overflow: "hidden" }}>
                      {evangelismoProfesores.map((profesor, index) => (
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
                          <div style={{ textAlign: "right", color: "#0E5A61", fontWeight: "700" }}>
                            {formatearDecimal(profesor.total_horas, 1)} h
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div style={{ padding: "18px", borderRadius: "12px", background: "white", color: "#667085", border: "1px solid #e5e7eb" }}>
                    No hay horas de evangelismo registradas para mostrar todavía.
                  </div>
                )}
              </div>
            </div>
          )}

          {tabActiva === "estudios" && (
            <div style={{ padding: "10px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "12px", marginBottom: "20px" }}>
                <div style={{ background: "white", borderRadius: "12px", padding: "14px 16px", border: "1px solid #e5e7eb" }}>
                  <div style={{ fontSize: "12px", color: "#667085", marginBottom: "6px" }}>Variacion anual</div>
                  <div style={{ fontSize: "24px", fontWeight: "700", color: obtenerColorCrecimiento(comparacion.crecimiento || 0) }}>
                    {formatearVariacion(comparacion.crecimiento || 0)}
                  </div>
                </div>
                <div style={{ background: "white", borderRadius: "12px", padding: "14px 16px", border: "1px solid #e5e7eb" }}>
                  <div style={{ fontSize: "12px", color: "#667085", marginBottom: "6px" }}>Diferencia total</div>
                  <div style={{ fontSize: "24px", fontWeight: "700", color: obtenerColorCrecimiento(comparacion.diferencia || 0) }}>
                    {comparacion.diferencia > 0 ? `+${comparacion.diferencia}` : comparacion.diferencia || 0}
                  </div>
                </div>
              </div>

              <div style={{ background: "#f8fafb", borderRadius: "16px", padding: "24px", minWidth: 0 }}>
                <h2 style={{ fontSize: "20px", marginBottom: "8px", color: "#1a1a1a" }}>Comparación de estudios</h2>
                <p style={{ margin: "0 0 20px", color: "#666", fontSize: "14px" }}>
                  Total de estudios por mes para comparar el año actual frente al anterior.
                </p>

                <div style={{ height: "340px" }}>
                  <Line data={graficoComparacion} options={opcionesGrafico} />
                </div>
              </div>
            </div>
          )}

          {tabActiva === "profesores" && (
            <div style={{ padding: "10px" }}>
              <div style={{ background: "#f8fafb", borderRadius: "16px", padding: "24px", minWidth: 0 }}>
                <h2 style={{ fontSize: "20px", marginBottom: "8px", color: "#1a1a1a" }}>Rendimiento por profesor</h2>
                <p style={{ margin: "0 0 20px", color: "#666", fontSize: "14px" }}>
                  Estudios del año {anioRendimiento}, con promedio mensual y promedio diario por profesor.
                </p>

                {rendimientoProfesores.length > 0 ? (
                  <>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px", marginBottom: "20px" }}>
                      <div style={{ background: "white", borderRadius: "12px", padding: "14px 16px", border: "1px solid #e5e7eb" }}>
                        <div style={{ fontSize: "12px", color: "#667085", marginBottom: "6px" }}>Profesores con datos</div>
                        <div style={{ fontSize: "24px", fontWeight: "700", color: "#0E5A61" }}>{rendimientoProfesores.length}</div>
                      </div>
                      <div style={{ background: "white", borderRadius: "12px", padding: "14px 16px", border: "1px solid #e5e7eb" }}>
                        <div style={{ fontSize: "12px", color: "#667085", marginBottom: "6px" }}>Profesor seleccionado</div>
                        <div style={{ fontSize: "16px", fontWeight: "700", color: "#1f2937" }}>
                          {profesorActivo?.nombre || "Sin datos"}
                        </div>
                      </div>
                    </div>

                    <div style={{ marginBottom: "20px" }}>
                      <label style={{ display: "block", fontSize: "13px", color: "#46535a", marginBottom: "8px", fontWeight: "600" }}>
                        Seleccionar profesor
                      </label>
                      <select
                        value={profesorSeleccionado}
                        onChange={(e) => setProfesorSeleccionado(e.target.value)}
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
                        {rendimientoProfesores.map((profesor) => (
                          <option key={profesor.id} value={String(profesor.id)}>
                            {profesor.nombre}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div style={{ height: "300px", marginBottom: "20px" }}>
                      <Line data={graficoRendimientoProfesor} options={opcionesGraficoProfesores} />
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
                            <div style={{ color: "#667085", fontSize: "12px" }}>Profesor</div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ color: "#0E5A61", fontWeight: "700" }}>{profesor.total_estudios || 0}</div>
                            <div style={{ color: "#667085", fontSize: "12px" }}>Anual</div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ color: "#1f2937", fontWeight: "600" }}>{formatearDecimal(profesor.promedio_mensual, 1)}</div>
                            <div style={{ color: "#667085", fontSize: "12px" }}>Mensual</div>
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
                    No hay datos de rendimiento por profesor para mostrar todavía.
                  </div>
                )}
              </div>
            </div>
          )}

          {tabActiva === "crecimiento" && (
            <div style={{ padding: "10px" }}>
              <div style={{ background: "#f8fafb", borderRadius: "16px", padding: "24px", marginBottom: "24px" }}>
                <h2 style={{ fontSize: "20px", marginBottom: "8px", color: "#1a1a1a" }}>Crecimiento de miembros por mes</h2>
                <p style={{ margin: "0 0 20px", color: "#666", fontSize: "14px" }}>
                  Altas mensuales de miembros segun el tipo seleccionado, comparando el año principal frente a otro año.
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px", marginBottom: "20px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", color: "#46535a", marginBottom: "8px", fontWeight: "600" }}>
                      Tipo de miembro
                    </label>
                    <select
                      value={tipoMiembroSeleccionado}
                      onChange={(e) => setTipoMiembroSeleccionado(e.target.value)}
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
                    <div style={{ fontSize: "12px", color: "#667085", marginBottom: "6px" }}>Año principal</div>
                    <div style={{ fontSize: "24px", fontWeight: "700", color: "#8E24AA" }}>
                      {anioSeleccionado}
                    </div>
                  </div>
                  <div style={{ background: "white", borderRadius: "12px", padding: "14px 16px", border: "1px solid #e5e7eb" }}>
                    <div style={{ fontSize: "12px", color: "#667085", marginBottom: "6px" }}>Miembros nuevos en {anioSeleccionado}</div>
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
                    <div style={{ fontSize: "12px", color: "#667085", marginBottom: "6px" }}>Variacion anual</div>
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
                <h2 style={{ fontSize: "20px", marginBottom: "8px", color: "#1a1a1a" }}>Estudiantes unicos con estudio biblico por mes</h2>
                <p style={{ margin: "0 0 20px", color: "#666", fontSize: "14px" }}>
                  Muestra cuantos estudiantes diferentes tuvieron al menos un estudio biblico en cada mes de {crecimientoEstudiantes.anio || new Date().getFullYear()}, sin repetir al mismo estudiante dentro del mismo mes.
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginBottom: "20px" }}>
                  <div style={{ background: "white", borderRadius: "12px", padding: "14px 16px", border: "1px solid #e5e7eb" }}>
                    <div style={{ fontSize: "12px", color: "#667085", marginBottom: "6px" }}>Año analizado</div>
                    <div style={{ fontSize: "24px", fontWeight: "700", color: "#2E7D32" }}>
                      {crecimientoEstudiantes.anio || new Date().getFullYear()}
                    </div>
                  </div>
                  <div style={{ background: "white", borderRadius: "12px", padding: "14px 16px", border: "1px solid #e5e7eb" }}>
                    <div style={{ fontSize: "12px", color: "#667085", marginBottom: "6px" }}>Suma de estudiantes por mes</div>
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
        </div>

        <div style={{ background: "white", padding: "30px", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
          <h2 style={{ fontSize: "20px", marginBottom: "20px", color: "#1a1a1a" }}>Resumen</h2>
          <p style={{ color: "#666", lineHeight: "1.6", margin: 0 }}>
            Comparativa mensual de estudios registrados.
          </p>
        </div>
      </div>
    </div>
  );
}
