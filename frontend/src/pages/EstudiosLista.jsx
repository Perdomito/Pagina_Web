import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import { ESTUDIOS_BIBLICOS } from "../data/mockData";
import { useIdioma } from "../context/IdiomaContext";

export default function Estudios() {
  const navigate = useNavigate();
  const [estudios] = useState(ESTUDIOS_BIBLICOS);
  const { t, tv, idioma } = useIdioma();

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0E5A61, #15777F)", padding: "20px" }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "30px" }}>
          <button onClick={() => navigate("/home")} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "8px", padding: "10px 15px", color: "white", cursor: "pointer" }}>
            <FaArrowLeft /> {t('volver')}
          </button>
          <h1 style={{ color: "white", margin: 0 }}>{t('estudiosBiblicos')}</h1>
        </div>

        <div style={{ background: "white", borderRadius: "12px", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr style={{ background: "#f5f5f5" }}>
              <th style={{ padding: "15px", textAlign: "left" }}>{t('el_estudiante')}</th>
              <th style={{ padding: "15px", textAlign: "left" }}>{t('el_responsable')}</th>
              <th style={{ padding: "15px", textAlign: "left" }}>{t('el_nivel')}</th>
              <th style={{ padding: "15px", textAlign: "left" }}>{t('el_progreso')}</th>
              <th style={{ padding: "15px", textAlign: "left" }}>{t('el_ultimaSesion')}</th>
              <th style={{ padding: "15px", textAlign: "left" }}>{t('el_proximaSesion')}</th>
              <th style={{ padding: "15px", textAlign: "left" }}>{t('el_notas')}</th>
            </tr></thead>
            <tbody>
              {estudios.map(e => (
                <tr key={e.id} style={{ borderTop: "1px solid #eee" }}>
                  <td style={{ padding: "15px" }}>{e.contacto_nombre}</td>
                  <td style={{ padding: "15px" }}>{e.miembro_responsable}</td>
                  <td style={{ padding: "15px" }}>
                    <span style={{ background: e.nivel === 'Básico' ? '#2196F3' : '#4CAF50', color: "white", padding: "4px 12px", borderRadius: "12px", fontSize: "12px" }}>
                      {tv(e.nivel)}
                    </span>
                  </td>
                  <td style={{ padding: "15px" }}>{e.progreso}</td>
                  <td style={{ padding: "15px" }}>{new Date(e.ultima_sesion).toLocaleDateString(idioma === 'es' ? 'es-ES' : 'en-US')}</td>
                  <td style={{ padding: "15px" }}>{new Date(e.proxima_sesion).toLocaleDateString(idioma === 'es' ? 'es-ES' : 'en-US')}</td>
                  <td style={{ padding: "15px" }}>{e.notas}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
