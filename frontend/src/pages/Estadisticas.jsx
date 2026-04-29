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

export default function Estadisticas() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

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

        <div style={{ background: "white", padding: "30px", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", marginBottom: "30px" }}>
          <h2 style={{ fontSize: "20px", marginBottom: "8px", color: "#1a1a1a" }}>Comparación de estudios</h2>
          <p style={{ margin: "0 0 20px", color: "#666", fontSize: "14px" }}>
            Total de estudios por mes.
          </p>

          <div style={{ height: "340px" }}>
            <Line data={graficoComparacion} options={opcionesGrafico} />
          </div>
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
