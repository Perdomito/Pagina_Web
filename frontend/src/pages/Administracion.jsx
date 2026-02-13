import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import { PRESUPUESTOS, getResumenFinanciero } from "../data/mockData";

export default function Administracion() {
  const navigate = useNavigate();
  const [presupuestos] = useState(PRESUPUESTOS);
  const resumen = getResumenFinanciero();

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0E5A61, #15777F)", padding: "20px" }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "30px" }}>
          <button onClick={() => navigate("/home")} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "8px", padding: "10px 15px", color: "white", cursor: "pointer" }}>
            <FaArrowLeft /> Volver
          </button>
          <h1 style={{ color: "white", margin: 0 }}>Administración y Presupuesto</h1>
        </div>

        {/* Resumen */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px", marginBottom: "20px" }}>
          <div style={{ background: "white", padding: "20px", borderRadius: "12px" }}>
            <h3 style={{ margin: "0 0 10px", color: "#666", fontSize: "14px" }}>Gastos Fijos</h3>
            <p style={{ margin: 0, fontSize: "24px", fontWeight: "700", color: "#f44336" }}>
              ${resumen.gastosFijos.toLocaleString()}
            </p>
          </div>
          <div style={{ background: "white", padding: "20px", borderRadius: "12px" }}>
            <h3 style={{ margin: "0 0 10px", color: "#666", fontSize: "14px" }}>Pagos Misioneros</h3>
            <p style={{ margin: 0, fontSize: "24px", fontWeight: "700", color: "#2196F3" }}>
              ${resumen.pagosMisioneros.toLocaleString()}
            </p>
          </div>
          <div style={{ background: "white", padding: "20px", borderRadius: "12px" }}>
            <h3 style={{ margin: "0 0 10px", color: "#666", fontSize: "14px" }}>Total Mensual</h3>
            <p style={{ margin: 0, fontSize: "24px", fontWeight: "700", color: "#4CAF50" }}>
              ${resumen.totalMensual.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Tabla */}
        <div style={{ background: "white", borderRadius: "12px", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr style={{ background: "#f5f5f5" }}>
              <th style={{ padding: "15px", textAlign: "left" }}>País</th>
              <th style={{ padding: "15px", textAlign: "left" }}>Mes/Año</th>
              <th style={{ padding: "15px", textAlign: "left" }}>Tipo</th>
              <th style={{ padding: "15px", textAlign: "left" }}>Concepto</th>
              <th style={{ padding: "15px", textAlign: "right" }}>Monto</th>
              <th style={{ padding: "15px", textAlign: "left" }}>Moneda</th>
              <th style={{ padding: "15px", textAlign: "left" }}>Notas</th>
            </tr></thead>
            <tbody>
              {presupuestos.map(p => (
                <tr key={p.id} style={{ borderTop: "1px solid #eee" }}>
                  <td style={{ padding: "15px" }}>{p.pais}</td>
                  <td style={{ padding: "15px" }}>{p.mes} {p.año}</td>
                  <td style={{ padding: "15px" }}>
                    <span style={{ 
                      background: p.tipo === 'gasto_fijo' ? '#f44336' : p.tipo === 'pago_misionero' ? '#2196F3' : '#FF9800', 
                      color: "white", 
                      padding: "4px 12px", 
                      borderRadius: "12px", 
                      fontSize: "12px" 
                    }}>
                      {p.tipo.replace('_', ' ')}
                    </span>
                  </td>
                  <td style={{ padding: "15px" }}>{p.concepto}</td>
                  <td style={{ padding: "15px", textAlign: "right", fontWeight: "600" }}>
                    {p.monto.toLocaleString()}
                  </td>
                  <td style={{ padding: "15px" }}>{p.moneda}</td>
                  <td style={{ padding: "15px" }}>{p.notas}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
