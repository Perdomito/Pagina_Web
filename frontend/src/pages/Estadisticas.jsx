import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";

export default function Estadisticas() {
  const navigate = useNavigate();
  
  const paises = [
    { nombre: "República Dominicana", miembros: 25, estudios: 45, reportes: 18, color: "#2196F3" },
    { nombre: "Colombia", miembros: 18, estudios: 32, reportes: 14, color: "#4CAF50" },
    { nombre: "Venezuela", miembros: 12, estudios: 20, reportes: 9, color: "#FF9800" },
    { nombre: "México", miembros: 8, estudios: 15, reportes: 6, color: "#9C27B0" }
  ];

  const maxValue = Math.max(...paises.map(p => Math.max(p.miembros, p.estudios, p.reportes)));

  return (
    <div style={{ minHeight: "100vh", background: "#f5f7fa", padding: "20px" }}>
      <div style={{ maxWidth: "1600px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "20px" }}>
          <button onClick={() => navigate("/home")} style={{ background: "white", border: "none", borderRadius: "12px", width: "50px", height: "50px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
            <FaArrowLeft style={{ fontSize: "18px", color: "#0E5A61" }} />
          </button>
          <div>
            <h1 style={{ fontSize: "28px", color: "#1a1a1a", margin: 0 }}>Estadísticas por País</h1>
            <p style={{ margin: "5px 0 0", color: "#666", fontSize: "14px" }}>Dashboard con métricas y gráficos</p>
          </div>
        </div>

        {/* Tarjetas de resumen */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px", marginBottom: "30px" }}>
          <div style={{ background: "white", padding: "25px", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: "14px", color: "#666", marginBottom: "8px" }}>Total Miembros</div>
                <div style={{ fontSize: "32px", fontWeight: "700", color: "#2196F3" }}>
                  {paises.reduce((sum, p) => sum + p.miembros, 0)}
                </div>
              </div>
              <div style={{ fontSize: "48px", opacity: 0.2 }}>👥</div>
            </div>
          </div>

          <div style={{ background: "white", padding: "25px", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: "14px", color: "#666", marginBottom: "8px" }}>Total Estudios</div>
                <div style={{ fontSize: "32px", fontWeight: "700", color: "#4CAF50" }}>
                  {paises.reduce((sum, p) => sum + p.estudios, 0)}
                </div>
              </div>
              <div style={{ fontSize: "48px", opacity: 0.2 }}>📚</div>
            </div>
          </div>

          <div style={{ background: "white", padding: "25px", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: "14px", color: "#666", marginBottom: "8px" }}>Total Reportes</div>
                <div style={{ fontSize: "32px", fontWeight: "700", color: "#FF9800" }}>
                  {paises.reduce((sum, p) => sum + p.reportes, 0)}
                </div>
              </div>
              <div style={{ fontSize: "48px", opacity: 0.2 }}>📊</div>
            </div>
          </div>

          <div style={{ background: "white", padding: "25px", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: "14px", color: "#666", marginBottom: "8px" }}>Países Activos</div>
                <div style={{ fontSize: "32px", fontWeight: "700", color: "#9C27B0" }}>
                  {paises.length}
                </div>
              </div>
              <div style={{ fontSize: "48px", opacity: 0.2 }}>🌎</div>
            </div>
          </div>
        </div>

        {/* Gráfico de barras */}
        <div style={{ background: "white", padding: "30px", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", marginBottom: "20px" }}>
          <h2 style={{ fontSize: "20px", marginBottom: "25px", color: "#1a1a1a" }}>Comparativa por País</h2>
          
          {paises.map((pais, i) => (
            <div key={i} style={{ marginBottom: "30px" }}>
              <div style={{ fontSize: "14px", fontWeight: "600", marginBottom: "10px", color: "#1a1a1a" }}>{pais.nombre}</div>
              
              <div style={{ marginBottom: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                  <span style={{ color: "#666" }}>Miembros</span>
                  <span style={{ fontWeight: "600", color: "#2196F3" }}>{pais.miembros}</span>
                </div>
                <div style={{ height: "8px", background: "#f0f0f0", borderRadius: "4px", overflow: "hidden" }}>
                  <div style={{ height: "100%", background: "#2196F3", width: `${(pais.miembros / maxValue) * 100}%`, transition: "width 0.3s" }} />
                </div>
              </div>

              <div style={{ marginBottom: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                  <span style={{ color: "#666" }}>Estudios</span>
                  <span style={{ fontWeight: "600", color: "#4CAF50" }}>{pais.estudios}</span>
                </div>
                <div style={{ height: "8px", background: "#f0f0f0", borderRadius: "4px", overflow: "hidden" }}>
                  <div style={{ height: "100%", background: "#4CAF50", width: `${(pais.estudios / maxValue) * 100}%`, transition: "width 0.3s" }} />
                </div>
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                  <span style={{ color: "#666" }}>Reportes</span>
                  <span style={{ fontWeight: "600", color: "#FF9800" }}>{pais.reportes}</span>
                </div>
                <div style={{ height: "8px", background: "#f0f0f0", borderRadius: "4px", overflow: "hidden" }}>
                  <div style={{ height: "100%", background: "#FF9800", width: `${(pais.reportes / maxValue) * 100}%`, transition: "width 0.3s" }} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabla de datos */}
        <div style={{ background: "white", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f5f5f5" }}>
                <th style={{ padding: "15px", textAlign: "left", fontWeight: "600" }}>País</th>
                <th style={{ padding: "15px", textAlign: "center", fontWeight: "600" }}>Miembros</th>
                <th style={{ padding: "15px", textAlign: "center", fontWeight: "600" }}>Estudios</th>
                <th style={{ padding: "15px", textAlign: "center", fontWeight: "600" }}>Reportes</th>
                <th style={{ padding: "15px", textAlign: "center", fontWeight: "600" }}>Promedio</th>
              </tr>
            </thead>
            <tbody>
              {paises.map((pais, i) => (
                <tr key={i} style={{ borderTop: "1px solid #eee" }}>
                  <td style={{ padding: "15px" }}>{pais.nombre}</td>
                  <td style={{ padding: "15px", textAlign: "center" }}>
                    <span style={{ background: "#2196F315", color: "#2196F3", padding: "4px 12px", borderRadius: "12px", fontWeight: "600" }}>
                      {pais.miembros}
                    </span>
                  </td>
                  <td style={{ padding: "15px", textAlign: "center" }}>
                    <span style={{ background: "#4CAF5015", color: "#4CAF50", padding: "4px 12px", borderRadius: "12px", fontWeight: "600" }}>
                      {pais.estudios}
                    </span>
                  </td>
                  <td style={{ padding: "15px", textAlign: "center" }}>
                    <span style={{ background: "#FF980015", color: "#FF9800", padding: "4px 12px", borderRadius: "12px", fontWeight: "600" }}>
                      {pais.reportes}
                    </span>
                  </td>
                  <td style={{ padding: "15px", textAlign: "center", fontWeight: "600" }}>
                    {Math.round((pais.miembros + pais.estudios + pais.reportes) / 3)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
