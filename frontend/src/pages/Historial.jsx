import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaHistory, FaUserPlus, FaEdit, FaTrash } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { useIdioma } from "../context/IdiomaContext";
import colors from "../utils/colors";
import AuditoriaService from "../services/AuditoriaService";

const ICONOS_ACCION = {
  crear: { icon: <FaUserPlus />, color: "#4CAF50" },
  editar: { icon: <FaEdit />, color: "#FF9800" },
  eliminar: { icon: <FaTrash />, color: "#f44336" },
};

export default function Historial() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { idioma } = useIdioma();
  const tx = (es, en) => (idioma === "en" ? en : es);

  const [registros, setRegistros] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtroModulo, setFiltroModulo] = useState("");

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroModulo]);

  const cargar = async () => {
    try {
      setCargando(true);
      const data = await AuditoriaService.listar(filtroModulo ? { modulo: filtroModulo } : {});
      setRegistros(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
    } finally {
      setCargando(false);
    }
  };

  if (user?.rol_id !== 1) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: colors.backgroundGray, fontFamily: "'Lato', sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ color: "#666", marginBottom: "16px" }}>
            {tx("Esta sección es solo para el Administrador.", "This section is admin-only.")}
          </p>
          <button onClick={() => navigate("/home")} style={{ background: colors.primary, color: "white", border: "none", borderRadius: "10px", padding: "10px 20px", cursor: "pointer" }}>
            {tx("Volver al inicio", "Back to Home")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: colors.backgroundGray, padding: "20px", fontFamily: "'Lato', sans-serif" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "24px" }}>
          <button onClick={() => navigate("/home")} style={{ background: colors.primary, color: "white", border: "none", borderRadius: "10px", width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <FaArrowLeft />
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: "22px", color: colors.primary, fontFamily: "'Cinzel', serif", display: "flex", alignItems: "center", gap: "10px" }}>
              <FaHistory /> {tx("Historial", "History")}
            </h1>
            <p style={{ margin: "4px 0 0", color: "#888", fontSize: "13px" }}>
              {tx("Quién hizo cada cambio, con fecha y hora", "Who did each change, with date and time")}
            </p>
          </div>
        </div>

        <div style={{ marginBottom: "18px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {[
            { valor: "", label: tx("Todos", "All") },
            { valor: "usuarios", label: tx("Usuarios", "Users") },
            { valor: "miembros", label: tx("Miembros", "Members") },
            { valor: "permisos", label: tx("Permisos", "Permissions") },
          ].map((op) => (
            <button
              key={op.valor}
              onClick={() => setFiltroModulo(op.valor)}
              style={{
                border: "none",
                borderRadius: "999px",
                padding: "8px 16px",
                fontWeight: "700",
                fontSize: "13px",
                cursor: "pointer",
                background: filtroModulo === op.valor ? colors.primary : "white",
                color: filtroModulo === op.valor ? "white" : "#666",
                boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
              }}
            >
              {op.label}
            </button>
          ))}
        </div>

        {cargando ? (
          <p style={{ color: "#999", textAlign: "center", padding: "40px" }}>{tx("Cargando...", "Loading...")}</p>
        ) : registros.length === 0 ? (
          <p style={{ color: "#999", textAlign: "center", padding: "40px" }}>{tx("Sin registros todavía.", "No records yet.")}</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {registros.map((r) => {
              const estilo = ICONOS_ACCION[r.accion] || ICONOS_ACCION.editar;
              return (
                <div key={r.id} style={{ background: "white", borderRadius: "12px", padding: "14px 18px", display: "flex", gap: "14px", alignItems: "flex-start", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: `${estilo.color}18`, color: estilo.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {estilo.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "14px", color: "#333" }}>{r.descripcion}</div>
                    <div style={{ fontSize: "12px", color: "#999", marginTop: "4px" }}>
                      {r.usuario_nombre || tx("Desconocido", "Unknown")} · {new Date(r.fecha).toLocaleString(idioma === "en" ? "en-US" : "es-ES", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
