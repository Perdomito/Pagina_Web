import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";

export default function EstudiosBiblicos() {
  const navigate = useNavigate();
  const [mesActual] = useState("Febrero 2025");

  // Datos simulados para la tabla tipo Excel
  const estudiantes = [
    { nombre: "Pedro Sánchez", sem1: 2, sem2: 3, sem3: 2, sem4: 1, total: 8, meta: 12 },
    { nombre: "Lucía Vargas", sem1: 3, sem2: 3, sem3: 4, sem4: 2, total: 12, meta: 12 },
    { nombre: "Ana López", sem1: 1, sem2: 2, sem3: 1, sem4: 2, total: 6, meta: 8 },
    { nombre: "Roberto Gómez", sem1: 0, sem2: 1, sem3: 1, sem4: 0, total: 2, meta: 8 }
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
            <h1 style={{ fontSize: "28px", color: "#1a1a1a", margin: 0 }}>Estudios Bíblicos</h1>
            <p style={{ margin: "5px 0 0", color: "#666", fontSize: "14px" }}>Control semanal tipo Excel - {mesActual}</p>
          </div>
        </div>

        {/* Tabla Excel */}
        <div style={{ background: "white", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
            <thead>
              <tr style={{ background: "#2196F3", color: "white", fontWeight: "600" }}>
                <th style={{ border: "1px solid #e0e0e0", padding: "12px", textAlign: "left", position: "sticky", left: 0, background: "#2196F3", zIndex: 10 }}>Estudiante</th>
                <th style={{ border: "1px solid #e0e0e0", padding: "12px", textAlign: "center" }}>Semana 1</th>
                <th style={{ border: "1px solid #e0e0e0", padding: "12px", textAlign: "center" }}>Semana 2</th>
                <th style={{ border: "1px solid #e0e0e0", padding: "12px", textAlign: "center" }}>Semana 3</th>
                <th style={{ border: "1px solid #e0e0e0", padding: "12px", textAlign: "center" }}>Semana 4</th>
                <th style={{ border: "1px solid #e0e0e0", padding: "12px", textAlign: "center", background: "#4CAF50" }}>Total</th>
                <th style={{ border: "1px solid #e0e0e0", padding: "12px", textAlign: "center", background: "#FF9800" }}>Meta</th>
                <th style={{ border: "1px solid #e0e0e0", padding: "12px", textAlign: "center", background: "#9C27B0" }}>%</th>
              </tr>
            </thead>
            <tbody>
              {estudiantes.map((est, i) => {
                const porcentaje = Math.round((est.total / est.meta) * 100);
                return (
                  <tr key={i}>
                    <td style={{ border: "1px solid #e0e0e0", padding: "12px", background: "#fff3e0", fontWeight: "600", textAlign: "left", position: "sticky", left: 0, zIndex: 5 }}>{est.nombre}</td>
                    <td style={{ border: "1px solid #e0e0e0", padding: "12px", textAlign: "center" }}>{est.sem1}</td>
                    <td style={{ border: "1px solid #e0e0e0", padding: "12px", textAlign: "center" }}>{est.sem2}</td>
                    <td style={{ border: "1px solid #e0e0e0", padding: "12px", textAlign: "center" }}>{est.sem3}</td>
                    <td style={{ border: "1px solid #e0e0e0", padding: "12px", textAlign: "center" }}>{est.sem4}</td>
                    <td style={{ border: "1px solid #e0e0e0", padding: "12px", textAlign: "center", fontWeight: "700", background: "#e8f5e9" }}>{est.total}</td>
                    <td style={{ border: "1px solid #e0e0e0", padding: "12px", textAlign: "center", background: "#fff3e0" }}>{est.meta}</td>
                    <td style={{ border: "1px solid #e0e0e0", padding: "12px", textAlign: "center", fontWeight: "700", color: porcentaje >= 100 ? "#4CAF50" : porcentaje >= 70 ? "#FF9800" : "#f44336" }}>{porcentaje}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Resumen */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px", marginTop: "20px" }}>
          <div style={{ background: "white", padding: "20px", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
            <div style={{ fontSize: "14px", color: "#666", marginBottom: "8px" }}>Total Estudiantes</div>
            <div style={{ fontSize: "28px", fontWeight: "700", color: "#2196F3" }}>{estudiantes.length}</div>
          </div>
          <div style={{ background: "white", padding: "20px", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
            <div style={{ fontSize: "14px", color: "#666", marginBottom: "8px" }}>Estudios Totales</div>
            <div style={{ fontSize: "28px", fontWeight: "700", color: "#4CAF50" }}>{estudiantes.reduce((sum, e) => sum + e.total, 0)}</div>
          </div>
          <div style={{ background: "white", padding: "20px", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
            <div style={{ fontSize: "14px", color: "#666", marginBottom: "8px" }}>Meta Global</div>
            <div style={{ fontSize: "28px", fontWeight: "700", color: "#FF9800" }}>{estudiantes.reduce((sum, e) => sum + e.meta, 0)}</div>
          </div>
          <div style={{ background: "white", padding: "20px", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
            <div style={{ fontSize: "14px", color: "#666", marginBottom: "8px" }}>Cumplimiento</div>
            <div style={{ fontSize: "28px", fontWeight: "700", color: "#9C27B0" }}>
              {Math.round((estudiantes.reduce((sum, e) => sum + e.total, 0) / estudiantes.reduce((sum, e) => sum + e.meta, 0)) * 100)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
