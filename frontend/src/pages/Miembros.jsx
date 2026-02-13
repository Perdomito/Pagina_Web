import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaPlus, FaEdit, FaTrash } from "react-icons/fa";
import { MIEMBROS } from "../data/mockData";
import toast from 'react-hot-toast';

export default function Miembros() {
  const navigate = useNavigate();
  const [miembros, setMiembros] = useState(MIEMBROS);
  const [filtro, setFiltro] = useState("");

  const miembrosFiltrados = miembros.filter(m =>
    m.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
    m.pais.toLowerCase().includes(filtro.toLowerCase()) ||
    m.ciudad.toLowerCase().includes(filtro.toLowerCase())
  );

  const handleDelete = (id) => {
    if (window.confirm("¿Estás seguro de eliminar este miembro?")) {
      setMiembros(miembros.filter(m => m.id !== id));
      toast.success("Miembro eliminado");
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0E5A61, #15777F)", padding: "20px" }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
            <button onClick={() => navigate("/home")} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "8px", padding: "10px 15px", color: "white", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
              <FaArrowLeft /> Volver
            </button>
            <h1 style={{ color: "white", margin: 0 }}>Gestión de Miembros</h1>
          </div>
          <button onClick={() => toast.info("Función de agregar en desarrollo")} style={{ background: "#4CAF50", border: "none", borderRadius: "8px", padding: "12px 20px", color: "white", cursor: "pointer", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px" }}>
            <FaPlus /> Agregar Miembro
          </button>
        </div>

        {/* Filtro */}
        <div style={{ background: "white", padding: "20px", borderRadius: "12px", marginBottom: "20px" }}>
          <input type="text" placeholder="Buscar por nombre, país o ciudad..." value={filtro} onChange={(e) => setFiltro(e.target.value)} style={{ width: "100%", padding: "12px", border: "1px solid #ddd", borderRadius: "8px", fontSize: "14px" }} />
        </div>

        {/* Tabla */}
        <div style={{ background: "white", borderRadius: "12px", overflow: "hidden", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f5f5f5" }}>
                  <th style={{ padding: "15px", textAlign: "left", fontWeight: "600" }}>Nombre</th>
                  <th style={{ padding: "15px", textAlign: "left", fontWeight: "600" }}>Identidad</th>
                  <th style={{ padding: "15px", textAlign: "left", fontWeight: "600" }}>País</th>
                  <th style={{ padding: "15px", textAlign: "left", fontWeight: "600" }}>Ciudad</th>
                  <th style={{ padding: "15px", textAlign: "left", fontWeight: "600" }}>Edad</th>
                  <th style={{ padding: "15px", textAlign: "left", fontWeight: "600" }}>Tipo</th>
                  <th style={{ padding: "15px", textAlign: "center", fontWeight: "600" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {miembrosFiltrados.map((miembro, i) => (
                  <tr key={miembro.id} style={{ borderTop: "1px solid #eee" }}>
                    <td style={{ padding: "15px" }}>{miembro.nombre}</td>
                    <td style={{ padding: "15px" }}>{miembro.identidad}</td>
                    <td style={{ padding: "15px" }}>{miembro.pais}</td>
                    <td style={{ padding: "15px" }}>{miembro.ciudad}</td>
                    <td style={{ padding: "15px" }}>{miembro.edad}</td>
                    <td style={{ padding: "15px" }}>
                      <span style={{ background: miembro.tipo_miembro === 'Comprometido' ? '#4CAF50' : miembro.tipo_miembro === 'Registrado' ? '#2196F3' : '#FF9800', color: "white", padding: "4px 12px", borderRadius: "12px", fontSize: "12px" }}>
                        {miembro.tipo_miembro}
                      </span>
                    </td>
                    <td style={{ padding: "15px", textAlign: "center" }}>
                      <button onClick={() => toast.info("Editar en desarrollo")} style={{ background: "#2196F3", border: "none", borderRadius: "6px", padding: "6px 12px", color: "white", cursor: "pointer", marginRight: "8px" }}>
                        <FaEdit />
                      </button>
                      <button onClick={() => handleDelete(miembro.id)} style={{ background: "#f44336", border: "none", borderRadius: "6px", padding: "6px 12px", color: "white", cursor: "pointer" }}>
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p style={{ color: "white", textAlign: "center", marginTop: "20px", fontSize: "13px" }}>
          Total de miembros: {miembrosFiltrados.length}
        </p>
      </div>
    </div>
  );
}
