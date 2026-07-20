import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaFilePdf, FaChartLine, FaUsers, FaClock, FaBookOpen, FaUserPlus, FaCheckCircle, FaEye } from "react-icons/fa";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import estudiosService from '../services/EstudiosService';
import administracionService from '../services/AdministracionService';
import miembrosService from '../services/MiembrosService';
import { useAuth } from '../context/AuthContext';

// Estilos para impresión del misionero
const estilosImpresion = `
  .print-misionero {
    position: absolute;
    left: -9999px;
  }
  
  @media print {
    body * {
      visibility: hidden;
    }
    
    .print-misionero, .print-misionero * {
      visibility: visible;
    }
    
    .print-misionero {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      padding: 40px;
    }
    
    .no-print {
      display: none !important;
    }
    
    .print-misionero h2 {
      font-size: 18px;
      margin: 0 0 10px 0;
      border-bottom: 2px solid #000;
      padding-bottom: 5px;
    }
    
    .print-misionero .fecha {
      font-size: 14px;
      margin-bottom: 20px;
    }
    
    .print-misionero ol {
      font-size: 14px;
      line-height: 1.8;
      padding-left: 20px;
    }
    
    .print-misionero ol li {
      margin-bottom: 10px;
    }
  }
`;

export default function Reportes() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [continenteSeleccionado, setContinenteSeleccionado] = useState("");
  const [paisSeleccionado, setPaisSeleccionado] = useState("");
  // Pre-seleccionar el país del usuario
  const [tipoReporte, setTipoReporte] = useState("mensual");
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState("");
  const [observaciones, setObservaciones] = useState("");
  
  const [reporteActual, setReporteActual] = useState(null);
  const [reporteAnterior, setReporteAnterior] = useState(null);
  
  const [mostrandoDetalle, setMostrandoDetalle] = useState(false);
  const [misioneros, setMisioneros] = useState([]);
  const [misioneroSeleccionado, setMisioneroSeleccionado] = useState(null);
  const [estudiantesMisionero, setEstudiantesMisionero] = useState([]);
  const [continentes, setContinentes] = useState([]);
  
  useEffect(() => {
    const cargarContinentes = async () => {
      try {
        const continentesData = await administracionService.getAllContinentes();
        setContinentes(continentesData);
        
        // Auto-seleccionar la región del usuario
        if (user?.region) {
          const contUsuario = continentesData.find(c => 
            c.nombre?.toLowerCase().includes(user.region?.toLowerCase()) ||
            user.region?.toLowerCase().includes(c.nombre?.toLowerCase())
          );
          if (contUsuario) {
            setContinenteSeleccionado(String(contUsuario.id));
            // Auto-seleccionar el país del usuario
            if (user?.pais_id) {
              const paisUsuario = contUsuario.paises?.find(p => p.id === user.pais_id);
              if (paisUsuario) setPaisSeleccionado(String(user.pais_id));
            }
          }
        }
      } catch (error) {
        console.error('Error al cargar continentes:', error);
      }
    };
    
    cargarContinentes();
  }, []);
  
  const paisesDelContinente = continenteSeleccionado 
    ? continentes.find(c => c.id === parseInt(continenteSeleccionado))?.paises || []
    : [];
  
  const obtenerPeriodos = () => {
    const periodos = [];
    const hoy = new Date();
    
    if (tipoReporte === "semanal") {
      for (let i = 0; i < 12; i++) {
        const fecha = new Date(hoy);
        fecha.setDate(fecha.getDate() - (i * 7));
        const inicio = new Date(fecha);
        inicio.setDate(fecha.getDate() - fecha.getDay());
        const fin = new Date(inicio);
        fin.setDate(inicio.getDate() + 6);
        
        periodos.push({
          valor: `${inicio.getFullYear()}-W${Math.ceil((inicio.getDate()) / 7)}`,
          etiqueta: `${inicio.getDate().toString().padStart(2, '0')}.${(inicio.getMonth() + 1).toString().padStart(2, '0')}.${inicio.getFullYear()} - ${fin.getDate().toString().padStart(2, '0')}.${(fin.getMonth() + 1).toString().padStart(2, '0')}.${fin.getFullYear()}`
        });
      }
    } else {
      const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
      for (let i = 0; i < 12; i++) {
        const fecha = new Date(hoy);
        fecha.setMonth(fecha.getMonth() - i);
        periodos.push({
          valor: `${fecha.getFullYear()}-${(fecha.getMonth() + 1).toString().padStart(2, '0')}`,
          etiqueta: `${meses[fecha.getMonth()]} ${fecha.getFullYear()}`
        });
      }
    }
    
    return periodos;
  };
  
  const calcularReporte = useCallback(async () => {
    if (!continenteSeleccionado || !paisSeleccionado || !periodoSeleccionado) {
      return null;
    }
    
    try {
      const [año, mesPart] = periodoSeleccionado.split('-');
      let mes;
      
      if (tipoReporte === "mensual") {
        const meses = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
        mes = meses[parseInt(mesPart) - 1];
      } else {
        const hoy = new Date();
        const meses = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
        mes = meses[hoy.getMonth()];
      }
      
      // Obtener datos reales del resumen de estudios
      const resumen = await estudiosService.getResumenCompleto(
        parseInt(paisSeleccionado), mes, parseInt(año)
      );
      
      const raw = resumen || [];
      const todasEntradas = Array.isArray(raw) ? raw :
                            Array.isArray(raw.data) ? raw.data :
                            Object.values(raw).find(v => Array.isArray(v)) || [];

      const estudios = todasEntradas.filter(r => r && r.contacto_id != null);
      const evangelismo = todasEntradas.filter(r => r && r.contacto_id == null && r.tipo != null);
      const nuevosEst = todasEntradas.filter(r => r && r.contacto_id == null && r.tipo == null && (r.dijeron_si > 0 || r.nuevos_contactos > 0));

      const contactosUnicos = [...new Set(estudios.map(e => e.contacto_id).filter(Boolean))];

      // Capítulo máximo por contacto
      const capMaxPorContacto = {};
      estudios.forEach(e => {
        const cap = parseInt(e.capitulo || 0);
        const cid = e.contacto_id;
        if (cid && cap > (capMaxPorContacto[cid] || 0)) capMaxPorContacto[cid] = cap;
      });
      const hastaCap4 = Object.values(capMaxPorContacto).filter(c => c >= 1 && c <= 4).length;
      const hastaCap8 = Object.values(capMaxPorContacto).filter(c => c >= 5 && c <= 8).length;
      const masDe8 = Object.values(capMaxPorContacto).filter(c => c > 8).length;

      const horasOnline = evangelismo
        .filter(e => (e.tipo || '').toLowerCase().includes('virtual'))
        .reduce((s, e) => s + parseFloat(e.horas || 0), 0);
      const horasPresencial = evangelismo
        .filter(e => (e.tipo || '').toLowerCase().includes('presencial') || (e.tipo || '').toLowerCase().includes('person'))
        .reduce((s, e) => s + parseFloat(e.horas || 0), 0);
      const totalHorasEstudios = estudios.reduce((s, e) => s + parseFloat(e.horas || 0), 0);
      const totalNuevosContactos = nuevosEst.reduce((s, e) => s + parseInt(e.nuevos_contactos || 0), 0);
      const totalDijeronSi = nuevosEst.reduce((s, e) => s + parseInt(e.dijeron_si || 0), 0);

      return {
        estudiantesActuales: contactosUnicos.length,
        evangelismoOnline: Math.round(horasOnline * 10) / 10,
        evangelismoPresencial: Math.round(horasPresencial * 10) / 10,
        numeroEstudios: Math.round(totalHorasEstudios * 10) / 10,
        nuevosContactos: totalNuevosContactos,
        contactosEstudian: contactosUnicos.length,
        hastRomanos4: hastaCap4,
        terminadoRomanos8: hastaCap8,
        terminado4Leyes: masDe8,
        probabilidadMiembro: totalDijeronSi,
        ovejasPotenciales: totalDijeronSi
      };
    } catch (error) {
      console.error('Error al calcular reporte:', error);
      return {
        estudiantesActuales: 0,
        evangelismoOnline: 0,
        evangelismoPresencial: 0,
        numeroEstudios: 0,
        nuevosContactos: 0,
        contactosEstudian: 0,
        hastRomanos4: 0,
        terminadoRomanos8: 0,
        terminado4Leyes: 0,
        probabilidadMiembro: 0,
        ovejasPotenciales: 0
      };
    }
  }, [continenteSeleccionado, paisSeleccionado, periodoSeleccionado, tipoReporte]);
  
  const generarReporte = useCallback(async () => {
    const reporte = await calcularReporte();
    setReporteActual(reporte);
    setReporteAnterior(null);
  }, [calcularReporte]);
  
  useEffect(() => {
    if (continenteSeleccionado && paisSeleccionado && periodoSeleccionado) {
      generarReporte();
    }
  }, [continenteSeleccionado, paisSeleccionado, tipoReporte, periodoSeleccionado, generarReporte]);
  
  const cargarDetalleMisioneros = async () => {
    try {
      const miembrosData = await miembrosService.getAll({ tipo_miembro: 'Comprometido' });
      const misionerosPais = miembrosData.filter(m => m.pais_id === parseInt(paisSeleccionado));
      
      const [año, mesPart] = periodoSeleccionado.split('-');
      let mes;
      if (tipoReporte === "mensual") {
        const meses = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
        mes = meses[parseInt(mesPart) - 1];
      } else {
        const hoy = new Date();
        const meses = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
        mes = meses[hoy.getMonth()];
      }
      
      const resumenRaw = await estudiosService.getResumenCompleto(parseInt(paisSeleccionado), mes, parseInt(año));
      const resumenEstudios = Array.isArray(resumenRaw) ? resumenRaw.filter(r => r.contacto_id !== null) : (resumenRaw?.estudios || []);
      
      const misionerosConDatos = misionerosPais.map(misionero => {
        const estudiantesMisionero = resumenEstudios.filter(e => e.miembro_id === misionero.id || e.miembro_responsable_id === misionero.id);
        const estudiantesUnicos = [...new Set(estudiantesMisionero.map(e => e.contacto_id))];
        const horasTotales = estudiantesMisionero.reduce((sum, e) => sum + parseFloat(e.horas || 0), 0);
        
        return {
          ...misionero,
          totalEstudiantes: estudiantesUnicos.length,
          totalHoras: horasTotales
        };
      });
      
      setMisioneros(misionerosConDatos);
      setMostrandoDetalle(true);
    } catch (error) {
      console.error('Error al cargar detalle de misioneros:', error);
    }
  };
  
  const verDetalleMisionero = async (misionero) => {
    try {
      setMisioneroSeleccionado(misionero);
      
      const [año, mesPart] = periodoSeleccionado.split('-');
      let mes;
      if (tipoReporte === "mensual") {
        const meses = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
        mes = meses[parseInt(mesPart) - 1];
      } else {
        const hoy = new Date();
        const meses = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
        mes = meses[hoy.getMonth()];
      }
      
      const resumenRaw2 = await estudiosService.getResumenCompleto(parseInt(paisSeleccionado), mes, parseInt(año));
      const resumenEstudios2 = Array.isArray(resumenRaw2) ? resumenRaw2.filter(r => r.contacto_id !== null) : (resumenRaw2?.estudios || []);
      
      const estudiantesPorMisionero = {};
      resumenEstudios2
        .filter(e => e.miembro_id === misionero.id || e.miembro_responsable_id === misionero.id)
        .forEach(est => {
          if (!estudiantesPorMisionero[est.contacto_id]) {
            estudiantesPorMisionero[est.contacto_id] = {
              id: est.contacto_id,
              nombre: est.contacto_nombre,
              estudios: {}
            };
          }
          
          estudiantesPorMisionero[est.contacto_id].estudios[est.dia] = {
            capitulo: est.capitulo,
            horas: est.horas
          };
        });
      
      setEstudiantesMisionero(Object.values(estudiantesPorMisionero));
    } catch (error) {
      console.error('Error al cargar detalle del misionero:', error);
    }
  };
  
  const calcularDiferencia = (actual, anterior) => {
    if (!anterior || anterior === 0) return 0;
    return Math.round(((actual - anterior) / anterior) * 100);
  };
  
  const handleVolver = () => {
    if (misioneroSeleccionado) {
      setMisioneroSeleccionado(null);
    } else if (mostrandoDetalle) {
      setMostrandoDetalle(false);
    } else {
      navigate("/home");
    }
  };
  
  // Función de imprimir: genera PDF o abre diálogo de impresión según la vista
  const handleImprimir = () => {
    if (misioneroSeleccionado) {
      // Si estamos viendo un misionero específico, usar window.print()
      window.print();
    } else if (reporteActual) {
      // Si estamos en reporte general, generar PDF
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      doc.setFont("helvetica");
      doc.setFontSize(20);
      doc.setTextColor(19, 64, 105);
      doc.text("Evangelism Report", pageWidth / 2, 20, { align: "center" });
      
      doc.setFontSize(14);
      doc.setTextColor(100, 100, 100);
      const paisNombrePDF = paisesDelContinente.find(p => p.id === parseInt(paisSeleccionado))?.nombre || "";
      const periodoTexto = obtenerPeriodos().find(p => p.valor === periodoSeleccionado)?.etiqueta || "";
      doc.text(`${tipoReporte === "semanal" ? "Weekly" : "Monthly"} - ${paisNombrePDF}`, pageWidth / 2, 30, { align: "center" });
      doc.text(periodoTexto, pageWidth / 2, 38, { align: "center" });
      
      doc.setDrawColor(19, 64, 105);
      doc.setLineWidth(0.5);
      doc.line(20, 42, pageWidth - 20, 42);
      
      const datosTabla = [
        ["Metric", "Value"],
        ["Active Bible Students", reporteActual.estudiantesActuales.toString()],
        ["Online Evangelism (hours)", reporteActual.evangelismoOnline.toString()],
        ["In-Person Evangelism (hours)", reporteActual.evangelismoPresencial.toString()],
        [`Studies in ${tipoReporte === "semanal" ? "the Week" : "the Month"}`, reporteActual.numeroEstudios.toString()],
        [`New Contacts ${tipoReporte === "semanal" ? "this Week" : "this Month"}`, reporteActual.nuevosContactos.toString()],
        ["Contacts who Took Study", reporteActual.contactosEstudian.toString()],
        ["Students up to Chapter 4", (reporteActual.hastRomanos4 || 0).toString()],
        ["Students up to Chapter 8", (reporteActual.terminadoRomanos8 || 0).toString()],
        ["Students past Chapter 8", (reporteActual.terminado4Leyes || 0).toString()],
        ["Said Yes", (reporteActual.probabilidadMiembro || 0).toString()]
      ];
      
      autoTable(doc, {
        startY: 50,
        head: [datosTabla[0]],
        body: datosTabla.slice(1),
        theme: 'grid',
        headStyles: {
          fillColor: [19, 64, 105],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 11
        },
        bodyStyles: {
          fontSize: 10
        },
        alternateRowStyles: {
          fillColor: [245, 247, 250]
        },
        margin: { left: 20, right: 20 }
      });
      
      const nombreArchivo = `Reporte_${paisNombrePDF.replace(/\s+/g, '_')}_${periodoTexto.replace(/\s+/g, '_')}.pdf`;
      doc.save(nombreArchivo);
    }
  };
  
  const MetricaCard = ({ icono, titulo, valor, anterior, color }) => {
    const diff = anterior ? calcularDiferencia(valor, anterior) : null;
    
    return (
      <div style={{ background: "white", borderRadius: "12px", padding: "20px", border: "1px solid #e8edf5", display: "flex", alignItems: "center", gap: "16px", boxShadow: "0 2px 8px rgba(19,64,105,0.06)" }}>
        <div style={{ width: "48px", height: "48px", borderRadius: "10px", background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center", color: color, fontSize: "22px", flexShrink: 0 }}>
          {icono}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "11px", color: "#8a97b0", marginBottom: "4px", fontWeight: "700", letterSpacing: "0.5px", textTransform: "uppercase", fontFamily: "'Lato',sans-serif" }}>{titulo}</div>
          <div style={{ fontSize: "30px", fontWeight: "700", color: "#1a2d5a", fontFamily: "'Lato',sans-serif", lineHeight: 1 }}>{valor}</div>
          {diff !== null && diff !== 0 && (
            <div style={{ fontSize: "11px", color: diff > 0 ? "#4CAF50" : "#f44336", marginTop: "4px", fontFamily: "'Lato',sans-serif" }}>
              {diff > 0 ? "▲" : "▼"} {Math.abs(diff)}% vs previous period
            </div>
          )}
        </div>
      </div>
    );
  };
  
  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #134069 0%, #1a5490 60%, #0d2d4a 100%)",
      padding: "28px",
      fontFamily: "'Lato', sans-serif"
    }}>
      <div style={{
        maxWidth: "1400px",
        margin: "0 auto",
        background: "white",
        borderRadius: "16px",
        padding: "0",
        boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
        overflow: "hidden"
      }}>
        {/* HEADER */}
        <div style={{ background: "#134069", padding: "20px 28px", display: "flex", justifyContent: "space-between", alignItems: "center" }} className="no-print">
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <button onClick={handleVolver} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "8px", padding: "8px 14px", color: "white", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: "700", fontFamily: "'Lato',sans-serif" }}>
              <FaArrowLeft /> Back
            </button>
            <div>
              <h1 style={{ margin: 0, color: "white", fontSize: "18px", fontFamily: "'Cinzel',serif", fontWeight: "600", letterSpacing: "1px" }}>
                <FaChartLine style={{ marginRight: "10px", fontSize: "16px" }} />
                Evangelism Reports
              </h1>
              {reporteActual && (
                <p style={{ margin: "2px 0 0", color: "rgba(255,255,255,0.6)", fontSize: "12px" }}>
                  {paisesDelContinente.find(p => p.id === parseInt(paisSeleccionado))?.nombre} · {obtenerPeriodos().find(p => p.valor === periodoSeleccionado)?.etiqueta}
                </p>
              )}
            </div>
          </div>
          <button onClick={handleImprimir} disabled={!reporteActual && !misioneroSeleccionado}
            style={{ background: (reporteActual || misioneroSeleccionado) ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: "8px", padding: "8px 16px", color: "white", cursor: (reporteActual || misioneroSeleccionado) ? "pointer" : "not-allowed", display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: "700", fontFamily: "'Lato',sans-serif" }}>
            <FaFilePdf /> Export PDF
          </button>
        </div>

        <div style={{ padding: "24px 28px" }}>
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "12px", marginBottom: "24px" }} className="no-print">
          {[
            { value: continenteSeleccionado, onChange: (v) => { setContinenteSeleccionado(v); setPaisSeleccionado(""); setMostrandoDetalle(false); setMisioneroSeleccionado(null); }, options: continentes.map(c => ({ val: c.id, label: c.nombre })), placeholder: "Select Region", disabled: false },
            { value: paisSeleccionado, onChange: (v) => { setPaisSeleccionado(v); setMostrandoDetalle(false); setMisioneroSeleccionado(null); }, options: paisesDelContinente.map(p => ({ val: p.id, label: p.nombre })), placeholder: "Select Country", disabled: !continenteSeleccionado },
            { value: tipoReporte, onChange: (v) => { setTipoReporte(v); setPeriodoSeleccionado(""); setMostrandoDetalle(false); setMisioneroSeleccionado(null); }, options: [{ val: "mensual", label: "Monthly Report" }, { val: "semanal", label: "Weekly Report" }], placeholder: null, disabled: false },
            { value: periodoSeleccionado, onChange: (v) => { setPeriodoSeleccionado(v); setMostrandoDetalle(false); setMisioneroSeleccionado(null); }, options: obtenerPeriodos().map(p => ({ val: p.valor, label: p.etiqueta })), placeholder: "Select Period", disabled: false, key: tipoReporte },
          ].map((sel, i) => (
            <select key={sel.key || i} value={sel.value} onChange={e => sel.onChange(e.target.value)} disabled={sel.disabled}
              style={{ padding: "10px 14px", borderRadius: "8px", border: "1.5px solid #dde3ef", fontSize: "13px", fontFamily: "'Lato',sans-serif", color: "#1a2d5a", outline: "none", cursor: sel.disabled ? "not-allowed" : "pointer", opacity: sel.disabled ? 0.5 : 1 }}>
              {sel.placeholder && <option value="">{sel.placeholder}</option>}
              {sel.options.map(o => <option key={o.val} value={o.val}>{o.label}</option>)}
            </select>
          ))}
        </div>
        
        {!misioneroSeleccionado && reporteActual && (
          <>
            <div style={{ marginBottom: "24px", borderBottom: "2px solid #e8edf5", paddingBottom: "16px" }}>
              <h2 style={{ color: "#134069", fontSize: "20px", margin: "0 0 4px", fontFamily: "'Cinzel',serif", fontWeight: "600" }}>
                {tipoReporte === "semanal" ? "Weekly" : "Monthly"} Report — {paisesDelContinente.find(p => p.id === parseInt(paisSeleccionado))?.nombre}
              </h2>
              <p style={{ color: "#8a97b0", fontSize: "13px", margin: 0, fontFamily: "'Lato',sans-serif" }}>
                {obtenerPeriodos().find(p => p.valor === periodoSeleccionado)?.etiqueta}
              </p>
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "16px", marginBottom: "24px" }}>
              <MetricaCard icono={<FaUsers />} titulo="Estudiantes Actuales de la Biblia" valor={reporteActual.estudiantesActuales} anterior={reporteAnterior?.estudiantesActuales} color="#2196F3" />
              <MetricaCard icono={<FaClock />} titulo="Evangelismo Online (horas)" valor={reporteActual.evangelismoOnline} anterior={reporteAnterior?.evangelismoOnline} color="#9C27B0" />
              <MetricaCard icono={<FaClock />} titulo="Evangelismo Presencial (horas)" valor={reporteActual.evangelismoPresencial} anterior={reporteAnterior?.evangelismoPresencial} color="#FF9800" />
              <MetricaCard icono={<FaBookOpen />} titulo={`Estudios en ${tipoReporte === "semanal" ? "la Semana" : "el Mes"}`} valor={reporteActual.numeroEstudios} anterior={reporteAnterior?.numeroEstudios} color="#4CAF50" />
              <MetricaCard icono={<FaUserPlus />} titulo={`Nuevos Contactos ${tipoReporte === "semanal" ? "esta Semana" : "este Mes"}`} valor={reporteActual.nuevosContactos} anterior={reporteAnterior?.nuevosContactos} color="#00BCD4" />
              <MetricaCard icono={<FaCheckCircle />} titulo="Contactos que Tomaron el Estudio" valor={reporteActual.contactosEstudian} anterior={reporteAnterior?.contactosEstudian} color="#8BC34A" />
            </div>
            
            <div style={{ marginBottom: "24px" }} className="no-print">
              <button onClick={mostrandoDetalle ? () => setMostrandoDetalle(false) : cargarDetalleMisioneros}
                style={{ background: mostrandoDetalle ? "#f0f4fa" : "#134069", color: mostrandoDetalle ? "#134069" : "white", border: mostrandoDetalle ? "1.5px solid #dde3ef" : "none", borderRadius: "8px", padding: "12px 24px", cursor: "pointer", fontSize: "14px", fontWeight: "700", display: "inline-flex", alignItems: "center", gap: "8px", fontFamily: "'Lato',sans-serif", boxShadow: mostrandoDetalle ? "none" : "0 4px 12px rgba(19,64,105,0.3)" }}>
                <FaEye /> {mostrandoDetalle ? "Hide Missionary Detail" : "View Detail by Missionary"}
              </button>
            </div>
            
            <div style={{ background: "#f4f6fb", borderRadius: "12px", padding: "20px", marginTop: "16px", border: "1px solid #e8edf5" }}>
              <h3 style={{ color: "#134069", fontSize: "15px", marginBottom: "16px", fontFamily: "'Cinzel',serif", fontWeight: "600" }}>
                Progress Tracking
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px" }}>
                {[
                  { label: "Students up to Chapter 4", value: reporteActual.hastRomanos4 },
                  { label: "Students up to Chapter 8", value: reporteActual.terminadoRomanos8 },
                  { label: "Students past Chapter 8", value: reporteActual.terminado4Leyes },
                  { label: "Said Yes", value: reporteActual.probabilidadMiembro },
                  { label: "Potential Sheep", value: reporteActual.ovejasPotenciales }
                ].map((item, idx) => (
                  <div key={idx} style={{ background: "white", padding: "15px", borderRadius: "8px", textAlign: "center" }}>
                    <div style={{ fontSize: "12px", color: "#999", marginBottom: "5px" }}>{item.label}</div>
                    <div style={{ fontSize: "24px", fontWeight: "700", color: "#ccc" }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
            
            <div style={{ marginTop: "30px" }} className="no-print">
              <label style={{ display: "block", marginBottom: "8px", color: "#134069", fontWeight: "700", fontSize: "13px", letterSpacing: "0.5px", textTransform: "uppercase", fontFamily: "'Lato',sans-serif" }}>
                Observaciones y Comentarios
              </label>
              <textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Añade observaciones o comentarios sobre este reporte..."
                style={{
                  width: "100%",
                  minHeight: "100px",
                  padding: "12px",
                  borderRadius: "8px",
                  border: "2px solid #e0e0e0",
                  fontSize: "14px",
                  resize: "vertical"
                }}
              />
            </div>
          </>
        )}
        
        {mostrandoDetalle && !misioneroSeleccionado && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ color: "#134069", fontSize: "18px", margin: "0 0 4px", fontFamily: "'Cinzel',serif", fontWeight: "600" }}>
                Missionary Detail — {paisesDelContinente.find(p => p.id === parseInt(paisSeleccionado))?.nombre}
              </h2>
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
              {misioneros.map(misionero => (
                <div
                  key={misionero.id}
                  style={{
                    background: "white",
                    borderRadius: "12px",
                    padding: "20px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    border: "2px solid #e0e0e0",
                    transition: "all 0.3s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#134069";
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(102, 126, 234, 0.3)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#e0e0e0";
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
                  }}
                >
                  <div style={{ marginBottom: "15px" }}>
                    <h3 style={{ color: "#134069", fontSize: "18px", margin: "0 0 5px 0" }}>
                      {misionero.nombre}
                    </h3>
                    {misionero.identidad && (
                      <p style={{ fontSize: "12px", color: "#999", margin: 0 }}>
                        Cédula: {misionero.identidad}
                      </p>
                    )}
                  </div>
                  
                  <div style={{ display: "flex", gap: "15px", marginBottom: "15px" }}>
                    <div style={{ flex: 1, textAlign: "center", padding: "10px", background: "#f5f5f5", borderRadius: "8px" }}>
                      <div style={{ fontSize: "12px", color: "#666" }}>Estudiantes</div>
                      <div style={{ fontSize: "24px", fontWeight: "700", color: "#2196F3" }}>
                        {misionero.totalEstudiantes}
                      </div>
                    </div>
                    <div style={{ flex: 1, textAlign: "center", padding: "10px", background: "#f5f5f5", borderRadius: "8px" }}>
                      <div style={{ fontSize: "12px", color: "#666" }}>Horas</div>
                      <div style={{ fontSize: "24px", fontWeight: "700", color: "#4CAF50" }}>
                        {misionero.totalHoras.toFixed(1)}
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => verDetalleMisionero(misionero)}
                    style={{
                      width: "100%",
                      padding: "12px",
                      background: "#134069",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: "600",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px"
                    }}
                  >
                    <FaEye /> Ver Detalle
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {misioneroSeleccionado && (
          <div>
           <div className="print-misionero">
              <h2>Reporte | {misioneroSeleccionado.nombre}</h2>
              <div className="fecha">
                Fecha: {new Date().toLocaleDateString('es-DO', { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </div>
              <ol>
                <li>Tiempo diario de evangelización: {misioneroSeleccionado.totalHoras.toFixed(1)} horas</li>
                <li>Número de contactos obtenidos: 0</li>
                <li>Contactos que decidieron tomar estudio: 0</li>
                <li>Número de estudios bíblicos: {estudiantesMisionero.length} est</li>
                <li>Número total de estudiantes actuales: {misioneroSeleccionado.totalEstudiantes}</li>
              </ol>
            </div>
            
            <div className="no-print">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h2 style={{ color: "#134069", fontSize: "24px", margin: 0 }}>
                  {misioneroSeleccionado.nombre} - {obtenerPeriodos().find(p => p.valor === periodoSeleccionado)?.etiqueta}
                </h2>
              </div>
              
              <div style={{ overflowX: "auto" }}>
                <table style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  background: "white",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  borderRadius: "8px",
                  overflow: "hidden"
                }}>
                  <thead>
                    <tr style={{ background: "#134069", color: "white", fontFamily: "'Lato',sans-serif" }}>
                      <th style={{ padding: "12px", textAlign: "left" }}>N°</th>
                      <th style={{ padding: "12px", textAlign: "left" }}>Nombre</th>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map(dia => (
                        <th key={dia} colSpan="2" style={{ padding: "12px", textAlign: "center", fontSize: "12px" }}>
                          Día {dia}
                        </th>
                      ))}
                    </tr>
                    <tr style={{ background: "#134069", color: "white", fontFamily: "'Lato',sans-serif" }}>
                      <th colSpan="2"></th>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map(dia => (
                        <React.Fragment key={dia}>
                          <th style={{ padding: "8px", fontSize: "11px" }}>Cap</th>
                          <th style={{ padding: "8px", fontSize: "11px" }}>Hr</th>
                        </React.Fragment>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {estudiantesMisionero.map((estudiante, idx) => (
                      <tr key={estudiante.id} style={{ borderBottom: "1px solid #e0e0e0" }}>
                        <td style={{ padding: "12px" }}>{idx + 1}</td>
                        <td style={{ padding: "12px", fontWeight: "600" }}>{estudiante.nombre}</td>
                        {Array.from({ length: 31 }, (_, i) => i + 1).map(dia => (
                          <React.Fragment key={dia}>
                            <td style={{ padding: "8px", textAlign: "center", fontSize: "13px" }}>
                              {estudiante.estudios[dia]?.capitulo || "-"}
                            </td>
                            <td style={{ padding: "8px", textAlign: "center", fontSize: "13px", fontWeight: "600", color: "#4CAF50" }}>
                              {estudiante.estudios[dia]?.horas || "-"}
                            </td>
                          </React.Fragment>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        
        </div>{/* cierre padding div */}
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Lato:wght@300;400;700&display=swap');
          ${estilosImpresion}
        `}</style>
      </div>
    </div>
  );
}
