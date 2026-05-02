import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
} from "chart.js";
import administracionService from '../services/AdministracionService';
import toast from 'react-hot-toast';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

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

export default function Estadisticas() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tabActiva, setTabActiva] = useState("graficos-evangelismo");
  const [profesorSeleccionado, setProfesorSeleccionado] = useState("");

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  const cargarEstadisticas = async () => {
    try {
      setLoading(true);
      const data = await administracionService.getEstadisticasGenerales();
      setStats(data);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar estadísticas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!profesorSeleccionado && stats?.rendimiento_profesores?.profesores?.length) {
      setProfesorSeleccionado(String(stats.rendimiento_profesores.profesores[0].id));
    }
  }, [stats, profesorSeleccionado]);

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
  const crecimientoEstudiantes = stats?.crecimiento_estudiantes || {};
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

  const graficoCrecimientoEstudiantes = {
    labels: crecimientoEstudiantes.labels || ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"],
    datasets: [
      {
        label: `Estudiantes ${crecimientoEstudiantes.anio || new Date().getFullYear()}`,
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
            <button
              onClick={() => setTabActiva("graficos-evangelismo")}
              style={{
                border: "none",
                borderRadius: "999px",
                padding: "12px 18px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                whiteSpace: "nowrap",
                background: tabActiva === "graficos-evangelismo" ? "#0E5A61" : "#edf2f4",
                color: tabActiva === "graficos-evangelismo" ? "white" : "#4b5563",
                transition: "all 0.2s ease"
              }}
            >
              Graficos de Evangelismo
            </button>
            <button
              onClick={() => setTabActiva("crecimiento")}
              style={{
                border: "none",
                borderRadius: "999px",
                padding: "12px 18px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                whiteSpace: "nowrap",
                background: tabActiva === "crecimiento" ? "#0E5A61" : "#edf2f4",
                color: tabActiva === "crecimiento" ? "white" : "#4b5563",
                transition: "all 0.2s ease"
              }}
            >
              Crecimiento
            </button>
          </div>

          {tabActiva === "graficos-evangelismo" && (
            <div style={{ padding: "10px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: "24px", alignItems: "start" }}>
                <div style={{ background: "#f8fafb", borderRadius: "16px", padding: "24px", minWidth: 0 }}>
                  <h2 style={{ fontSize: "20px", marginBottom: "8px", color: "#1a1a1a" }}>Comparación de estudios</h2>
                  <p style={{ margin: "0 0 20px", color: "#666", fontSize: "14px" }}>
                    Total de estudios por mes.
                  </p>

                  <div style={{ height: "340px" }}>
                    <Line data={graficoComparacion} options={opcionesGrafico} />
                  </div>
                </div>

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
            </div>
          )}

          {tabActiva === "crecimiento" && (
            <div style={{ padding: "10px" }}>
              <div style={{ background: "#f8fafb", borderRadius: "16px", padding: "24px" }}>
                <h2 style={{ fontSize: "20px", marginBottom: "8px", color: "#1a1a1a" }}>Crecimiento de estudiantes por mes</h2>
                <p style={{ margin: "0 0 20px", color: "#666", fontSize: "14px" }}>
                  Evolución mensual de estudiantes registrados durante {crecimientoEstudiantes.anio || new Date().getFullYear()}.
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginBottom: "20px" }}>
                  <div style={{ background: "white", borderRadius: "12px", padding: "14px 16px", border: "1px solid #e5e7eb" }}>
                    <div style={{ fontSize: "12px", color: "#667085", marginBottom: "6px" }}>Año analizado</div>
                    <div style={{ fontSize: "24px", fontWeight: "700", color: "#2E7D32" }}>
                      {crecimientoEstudiantes.anio || new Date().getFullYear()}
                    </div>
                  </div>
                  <div style={{ background: "white", borderRadius: "12px", padding: "14px 16px", border: "1px solid #e5e7eb" }}>
                    <div style={{ fontSize: "12px", color: "#667085", marginBottom: "6px" }}>Total acumulado</div>
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
