import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import { REPORTES } from "../data/mockData";

export default function Reportes() {
  const navigate = useNavigate();
  const [reportes] = useState(REPORTES);

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0E5A61, #15777F)", padding: "20px" }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "30px" }}>
          <button onClick={() => navigate("/home")} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "8px", padding: "10px 15px", color: "white", cursor: "pointer" }}>
            <FaArrowLeft /> Volver
          </button>
          <h1 style={{ color: "white", margin: 0 }}>Reportes de Evangelización</h1>
        </div>

        <div style={{ background: "white", borderRadius: "12px", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr style={{ background: "#f5f5f5" }}>
              <th style={{ padding: "15px", textAlign: "left" }}>Miembro</th>
              <th style={{ padding: "15px", textAlign: "left" }}>Fecha</th>
              <th style={{ padding: "15px", textAlign: "left" }}>Tiempo (hrs)</th>
              <th style={{ padding: "15px", textAlign: "left" }}>Contactos Obtenidos</th>
              <th style={{ padding: "15px", textAlign: "left" }}>Estudian</th>
              <th style={{ padding: "15px", textAlign: "left" }}># Estudios</th>
              <th style={{ padding: "15px", textAlign: "left" }}>Estudiantes</th>
            </tr></thead>
            <tbody>
              {reportes.map(r => (
                <tr key={r.id} style={{ borderTop: "1px solid #eee" }}>
                  <td style={{ padding: "15px" }}>{r.miembro_nombre}</td>
                  <td style={{ padding: "15px" }}>{new Date(r.fecha).toLocaleDateString()}</td>
                  <td style={{ padding: "15px" }}>{r.tiempo_evangelizacion}</td>
                  <td style={{ padding: "15px" }}>{r.contactos_obtenidos}</td>
                  <td style={{ padding: "15px" }}>{r.contactos_estudian}</td>
                  <td style={{ padding: "15px" }}>{r.numero_estudios}</td>
                  <td style={{ padding: "15px" }}>{r.total_estudiantes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
