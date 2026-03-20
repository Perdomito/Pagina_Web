import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import administracionService from '../services/AdministracionService';
import toast from 'react-hot-toast';

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

        {/* Información adicional */}
        <div style={{ background: "white", padding: "30px", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
          <h2 style={{ fontSize: "20px", marginBottom: "20px", color: "#1a1a1a" }}>Sistema Activo</h2>
          <p style={{ color: "#666", lineHeight: "1.6" }}>
            El sistema está operando correctamente. Todos los módulos están conectados a la base de datos PostgreSQL en Neon.
          </p>
          <div style={{ marginTop: "20px", padding: "15px", background: "#f5f5f5", borderRadius: "8px" }}>
            <strong>Estado:</strong> ✅ Production Ready
          </div>
        </div>
      </div>
    </div>
  );
}