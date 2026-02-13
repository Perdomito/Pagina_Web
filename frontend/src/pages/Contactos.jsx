import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaPlus } from "react-icons/fa";
import { CONTACTOS } from "../data/mockData";

export default function Contactos() {
  const navigate = useNavigate();
  const [contactos] = useState(CONTACTOS);

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0E5A61, #15777F)", padding: "20px" }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
            <button onClick={() => navigate("/home")} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "8px", padding: "10px 15px", color: "white", cursor: "pointer" }}>
              <FaArrowLeft /> Volver
            </button>
            <h1 style={{ color: "white", margin: 0 }}>Gestión de Contactos</h1>
          </div>
        </div>

        <div style={{ background: "white", borderRadius: "12px", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr style={{ background: "#f5f5f5" }}>
              <th style={{ padding: "15px", textAlign: "left" }}>Nombre</th>
              <th style={{ padding: "15px", textAlign: "left" }}>Teléfono</th>
              <th style={{ padding: "15px", textAlign: "left" }}>País</th>
              <th style={{ padding: "15px", textAlign: "left" }}>Miembro Responsable</th>
              <th style={{ padding: "15px", textAlign: "left" }}>Estado</th>
              <th style={{ padding: "15px", textAlign: "left" }}>Notas</th>
            </tr></thead>
            <tbody>
              {contactos.map(c => (
                <tr key={c.id} style={{ borderTop: "1px solid #eee" }}>
                  <td style={{ padding: "15px" }}>{c.nombre}</td>
                  <td style={{ padding: "15px" }}>{c.telefono}</td>
                  <td style={{ padding: "15px" }}>{c.pais}</td>
                  <td style={{ padding: "15px" }}>{c.miembro_nombre}</td>
                  <td style={{ padding: "15px" }}>
                    <span style={{ background: c.activo ? '#4CAF50' : '#f44336', color: "white", padding: "4px 12px", borderRadius: "12px", fontSize: "12px" }}>
                      {c.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td style={{ padding: "15px" }}>{c.notas}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
