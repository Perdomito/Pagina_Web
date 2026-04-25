import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import administracionService from '../services/AdministracionService';
import toast from 'react-hot-toast';

export default function Administracion() {
  const navigate = useNavigate();
  const [paises, setPaises] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [paisesData, rolesData] = await Promise.all([
        administracionService.getAllPaises(),
        administracionService.getAllRoles()
      ]);
      setPaises(paisesData);
      setRoles(rolesData);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0E5A61, #15777F)", padding: "20px", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <div style={{ background: "white", padding: "40px", borderRadius: "12px" }}>
          Cargando...
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0E5A61, #15777F)", padding: "20px" }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "30px" }}>
          <button onClick={() => navigate("/home")} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "8px", padding: "10px 15px", color: "white", cursor: "pointer" }}>
            <FaArrowLeft /> Volver
          </button>
          <h1 style={{ color: "white", margin: 0 }}>Administración</h1>
        </div>

        {/* Tabla de Países */}
        <div style={{ background: "white", borderRadius: "12px", overflow: "hidden", marginBottom: "20px" }}>
          <div style={{ padding: "20px", background: "#f5f5f5", fontWeight: "600", fontSize: "18px" }}>
            Países del Sistema
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#fafafa" }}>
                <th style={{ padding: "15px", textAlign: "left" }}>ID</th>
                <th style={{ padding: "15px", textAlign: "left" }}>Nombre</th>
                <th style={{ padding: "15px", textAlign: "left" }}>Continente</th>
                <th style={{ padding: "15px", textAlign: "left" }}>Código ISO</th>
                <th style={{ padding: "15px", textAlign: "left" }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {paises.map(p => (
                <tr key={p.id} style={{ borderTop: "1px solid #eee" }}>
                  <td style={{ padding: "15px" }}>{p.id}</td>
                  <td style={{ padding: "15px", fontWeight: "600" }}>{p.nombre}</td>
                  <td style={{ padding: "15px" }}>{p.continente}</td>
                  <td style={{ padding: "15px" }}>{p.codigo_iso}</td>
                  <td style={{ padding: "15px" }}>
                    <span style={{ background: p.activo ? '#4CAF50' : '#f44336', color: "white", padding: "4px 12px", borderRadius: "12px", fontSize: "12px" }}>
                      {p.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Tabla de Roles */}
        <div style={{ background: "white", borderRadius: "12px", overflow: "hidden" }}>
          <div style={{ padding: "20px", background: "#f5f5f5", fontWeight: "600", fontSize: "18px" }}>
            Roles del Sistema
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#fafafa" }}>
                <th style={{ padding: "15px", textAlign: "left" }}>ID</th>
                <th style={{ padding: "15px", textAlign: "left" }}>Nombre</th>
                <th style={{ padding: "15px", textAlign: "left" }}>Descripción</th>
              </tr>
            </thead>
            <tbody>
              {roles.map(r => (
                <tr key={r.id} style={{ borderTop: "1px solid #eee" }}>
                  <td style={{ padding: "15px" }}>{r.id}</td>
                  <td style={{ padding: "15px" }}>
                    <span style={{ background: '#2196F3', color: "white", padding: "4px 12px", borderRadius: "12px", fontSize: "12px", fontWeight: "600" }}>
                      {r.nombre}
                    </span>
                  </td>
                  <td style={{ padding: "15px" }}>{r.descripcion}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}