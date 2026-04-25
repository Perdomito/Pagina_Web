import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaFilePdf, FaChartLine, FaUsers, FaClock, FaBookOpen, FaUserPlus, FaCheckCircle, FaEye, FaTimes } from "react-icons/fa";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import estudiosService from '../services/EstudiosService';
import administracionService from '../services/AdministracionService';
import miembrosService from '../services/MiembrosService';

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
  const navigate = useNavigate();
  
  const [continenteSeleccionado, setContinenteSeleccionado] = useState("");
  const [paisSeleccionado, setPaisSeleccionado] = useState("");
  const [tipoReporte, setTipoReporte] = useState("mensual");
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState("");
  const [observaciones, setObservaciones] = useState("");
  
  const [reporteActual, setReporteActual] = useState(null);
  const [reporteAnterior, setReporteAnterior] = useState(null);
  const [mostrandoComparacion, setMostrandoComparacion] = useState(false);
  
  const [mostrandoDetalle, setMostrandoDetalle] = useState(false);
  const [misioneros, setMisioneros] = useState([]);
  const [misioneroSeleccionado, setMisioneroSeleccionado] = useState(null);
  const [estudiantesMisionero, setEstudiantesMisionero] = useState([]);
  const [continentes, setContinentes] = useState([]);
  
  useEffect(() => {
    const cargarContinentes = async () => {
      try {
        const continentesData = await administracionService.getAllContinentes();
        const paisesData = await administracionService.getAllPaises();
        
        const continentesConPaises = continentesData.map(cont => ({
          id: cont.id,
          nombre: cont.nombre,
          paises: paisesData.filter(p => p.continente === cont.nombre)
        }));
        
        setContinentes(continentesConPaises);
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
  
  const calcularReporte = async () => {
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
      
      const datosReales = await estudiosService.getReporteCompleto(
        parseInt(paisSeleccionado),
        mes,
        parseInt(año),
        tipoReporte
      );
      
      return datosReales;
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
  };
  
  const generarReporte = async () => {
    const reporte = await calcularReporte();
    setReporteActual(reporte);
    setReporteAnterior(null);
  };
  
  useEffect(() => {
    if (continenteSeleccionado && paisSeleccionado && periodoSeleccionado) {
      generarReporte();
    }
  }, [continenteSeleccionado, paisSeleccionado, tipoReporte, periodoSeleccionado]);
  
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
      
      const resumen = await estudiosService.getResumenCompleto(parseInt(paisSeleccionado), mes, parseInt(año));
      
      const misionerosConDatos = misionerosPais.map(misionero => {
        const estudiantesMisionero = resumen.estudios.filter(e => e.miembro_responsable_id === misionero.id);
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
      
      const resumen = await estudiosService.getResumenCompleto(parseInt(paisSeleccionado), mes, parseInt(año));
      
      const estudiantesPorMisionero = {};
      resumen.estudios
        .filter(e => e.miembro_responsable_id === misionero.id)
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
      doc.setTextColor(14, 90, 97);
      doc.text("Reporte de Evangelización", pageWidth / 2, 20, { align: "center" });
      
      doc.setFontSize(14);
      doc.setTextColor(100, 100, 100);
      const paisNombre = paisesDelContinente.find(p => p.id === parseInt(paisSeleccionado))?.nombre || "";
      const periodoTexto = obtenerPeriodos().find(p => p.valor === periodoSeleccionado)?.etiqueta || "";
      doc.text(`${tipoReporte === "semanal" ? "Semanal" : "Mensual"} - ${paisNombre}`, pageWidth / 2, 30, { align: "center" });
      doc.text(periodoTexto, pageWidth / 2, 38, { align: "center" });
      
      doc.setDrawColor(14, 90, 97);
      doc.setLineWidth(0.5);
      doc.line(20, 42, pageWidth - 20, 42);
      
      const datosTabla = [
        ["Métrica", "Valor"],
        ["Estudiantes Actuales de la Biblia", reporteActual.estudiantesActuales.toString()],
        ["Evangelismo Online (horas)", reporteActual.evangelismoOnline.toString()],
        ["Evangelismo Presencial (horas)", reporteActual.evangelismoPresencial.toString()],
        [`Estudios en ${tipoReporte === "semanal" ? "la Semana" : "el Mes"}`, reporteActual.numeroEstudios.toString()],
        [`Nuevos Contactos ${tipoReporte === "semanal" ? "esta Semana" : "este Mes"}`, reporteActual.nuevosContactos.toString()],
        ["Contactos que Tomaron el Estudio", reporteActual.contactosEstudian.toString()]
      ];
      
      autoTable(doc, {
        startY: 50,
        head: [datosTabla[0]],
        body: datosTabla.slice(1),
        theme: 'grid',
        headStyles: {
          fillColor: [14, 90, 97],
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
      
      const nombreArchivo = `Reporte_${paisNombre.replace(/\s+/g, '_')}_${periodoTexto.replace(/\s+/g, '_')}.pdf`;
      doc.save(nombreArchivo);
    }
  };
  
  const MetricaCard = ({ icono, titulo, valor, anterior, color }) => {
    const diff = anterior ? calcularDiferencia(valor, anterior) : null;
    
    return (
      <div style={{
        background: "white",
        borderRadius: "12px",
        padding: "20px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        display: "flex",
        alignItems: "center",
        gap: "15px"
      }}>
        <div style={{
          width: "50px",
          height: "50px",
          borderRadius: "10px",
          background: `linear-gradient(135deg, ${color}22, ${color}44)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: color,
          fontSize: "24px"
        }}>
          {icono}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "13px", color: "#666", marginBottom: "5px" }}>{titulo}</div>
          <div style={{ fontSize: "28px", fontWeight: "700", color: "#333" }}>{valor}</div>
          {diff !== null && diff !== 0 && (
            <div style={{
              fontSize: "12px",
              color: diff > 0 ? "#4CAF50" : "#f44336",
              marginTop: "5px"
            }}>
              {diff > 0 ? "▲" : "▼"} {Math.abs(diff)}% vs período anterior
            </div>
          )}
        </div>
      </div>
    );
  };
  
  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      padding: "20px"
    }}>
      <div style={{
        maxWidth: "1400px",
        margin: "0 auto",
        background: "white",
        borderRadius: "20px",
        padding: "30px",
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)"
      }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "30px",
          paddingBottom: "20px",
          borderBottom: "2px solid #f0f0f0"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
            <button
              onClick={handleVolver}
              style={{
                padding: "10px 15px",
                background: "#0E5A61",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
              className="no-print"
            >
              <FaArrowLeft /> Volver
            </button>
            <h1 style={{ margin: 0, color: "#0E5A61", fontSize: "28px" }}>
              <FaChartLine style={{ marginRight: "10px" }} />
              Reportes de Evangelización
            </h1>
          </div>
          
          <div style={{ display: "flex", gap: "10px" }} className="no-print">
            <button
              onClick={handleImprimir}
              disabled={!reporteActual && !misioneroSeleccionado}
              style={{
                padding: "10px 20px",
                background: (reporteActual || misioneroSeleccionado) ? "#f44336" : "#ccc",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: (reporteActual || misioneroSeleccionado) ? "pointer" : "not-allowed",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
            >
              <FaFilePdf /> Imprimir
            </button>
          </div>
        </div>
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px", marginBottom: "30px" }} className="no-print">
          <select
            value={continenteSeleccionado}
            onChange={(e) => {
              setContinenteSeleccionado(e.target.value);
              setPaisSeleccionado("");
              setMostrandoDetalle(false);
              setMisioneroSeleccionado(null);
            }}
            style={{
              padding: "12px",
              borderRadius: "8px",
              border: "2px solid #e0e0e0",
              fontSize: "14px"
            }}
          >
            <option value="">Seleccione Continente</option>
            {continentes.map(c => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
          
          <select
            value={paisSeleccionado}
            onChange={(e) => {
              setPaisSeleccionado(e.target.value);
              setMostrandoDetalle(false);
              setMisioneroSeleccionado(null);
            }}
            disabled={!continenteSeleccionado}
            style={{
              padding: "12px",
              borderRadius: "8px",
              border: "2px solid #e0e0e0",
              fontSize: "14px"
            }}
          >
            <option value="">Seleccione País</option>
            {paisesDelContinente.map(p => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>
          
          <select
            value={tipoReporte}
            onChange={(e) => {
              setTipoReporte(e.target.value);
              setPeriodoSeleccionado("");
              setMostrandoDetalle(false);
              setMisioneroSeleccionado(null);
            }}
            style={{
              padding: "12px",
              borderRadius: "8px",
              border: "2px solid #e0e0e0",
              fontSize: "14px"
            }}
          >
            <option value="semanal">Reporte Semanal</option>
            <option value="mensual">Reporte Mensual</option>
          </select>
          
          <select
            key={tipoReporte}
            value={periodoSeleccionado}
            onChange={(e) => {
              setPeriodoSeleccionado(e.target.value);
              setMostrandoDetalle(false);
              setMisioneroSeleccionado(null);
            }}
            style={{
              padding: "12px",
              borderRadius: "8px",
              border: "2px solid #e0e0e0",
              fontSize: "14px"
            }}
          >
            <option value="">Seleccione Período</option>
            {obtenerPeriodos().map(p => (
              <option key={p.valor} value={p.valor}>{p.etiqueta}</option>
            ))}
          </select>
        </div>
        
        {!mostrandoDetalle && !misioneroSeleccionado && reporteActual && (
          <>
            <div style={{ textAlign: "center", marginBottom: "30px" }}>
              <h2 style={{ color: "#0E5A61", fontSize: "24px", margin: "0 0 5px 0" }}>
                Reporte {tipoReporte === "semanal" ? "Semanal" : "Mensual"} de {paisesDelContinente.find(p => p.id === parseInt(paisSeleccionado))?.nombre}
              </h2>
              <p style={{ color: "#666", fontSize: "16px", margin: 0 }}>
                {obtenerPeriodos().find(p => p.valor === periodoSeleccionado)?.etiqueta}
              </p>
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px", marginBottom: "30px" }}>
              <MetricaCard icono={<FaUsers />} titulo="Estudiantes Actuales de la Biblia" valor={reporteActual.estudiantesActuales} anterior={reporteAnterior?.estudiantesActuales} color="#2196F3" />
              <MetricaCard icono={<FaClock />} titulo="Evangelismo Online (horas)" valor={reporteActual.evangelismoOnline} anterior={reporteAnterior?.evangelismoOnline} color="#9C27B0" />
              <MetricaCard icono={<FaClock />} titulo="Evangelismo Presencial (horas)" valor={reporteActual.evangelismoPresencial} anterior={reporteAnterior?.evangelismoPresencial} color="#FF9800" />
              <MetricaCard icono={<FaBookOpen />} titulo={`Estudios en ${tipoReporte === "semanal" ? "la Semana" : "el Mes"}`} valor={reporteActual.numeroEstudios} anterior={reporteAnterior?.numeroEstudios} color="#4CAF50" />
              <MetricaCard icono={<FaUserPlus />} titulo={`Nuevos Contactos ${tipoReporte === "semanal" ? "esta Semana" : "este Mes"}`} valor={reporteActual.nuevosContactos} anterior={reporteAnterior?.nuevosContactos} color="#00BCD4" />
              <MetricaCard icono={<FaCheckCircle />} titulo="Contactos que Tomaron el Estudio" valor={reporteActual.contactosEstudian} anterior={reporteAnterior?.contactosEstudian} color="#8BC34A" />
            </div>
            
            <div style={{ textAlign: "center", marginBottom: "30px" }} className="no-print">
              <button
                onClick={cargarDetalleMisioneros}
                style={{
                  padding: "15px 30px",
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "white",
                  border: "none",
                  borderRadius: "12px",
                  cursor: "pointer",
                  fontSize: "16px",
                  fontWeight: "600",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "10px",
                  boxShadow: "0 4px 15px rgba(102, 126, 234, 0.4)"
                }}
              >
                <FaEye /> Ver Detalle por Misionero
              </button>
            </div>
            
            <div style={{ background: "#f5f5f5", borderRadius: "12px", padding: "20px", marginTop: "30px" }}>
              <h3 style={{ color: "#0E5A61", fontSize: "18px", marginBottom: "15px" }}>
                Seguimiento de Progreso (Próximamente)
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px" }}>
                {[
                  { label: "Estudiantes hasta Romanos 4", value: reporteActual.hastRomanos4 },
                  { label: "Estudiantes que terminaron Romanos 8", value: reporteActual.terminadoRomanos8 },
                  { label: "Estudiantes que terminaron las 4 Leyes", value: reporteActual.terminado4Leyes },
                  { label: "Probabilidad de Hacerse Miembro", value: reporteActual.probabilidadMiembro },
                  { label: "Ovejas Potenciales", value: reporteActual.ovejasPotenciales }
                ].map((item, idx) => (
                  <div key={idx} style={{ background: "white", padding: "15px", borderRadius: "8px", textAlign: "center" }}>
                    <div style={{ fontSize: "12px", color: "#999", marginBottom: "5px" }}>{item.label}</div>
                    <div style={{ fontSize: "24px", fontWeight: "700", color: "#ccc" }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
            
            <div style={{ marginTop: "30px" }} className="no-print">
              <label style={{ display: "block", marginBottom: "10px", color: "#0E5A61", fontWeight: "600" }}>
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
              <h2 style={{ color: "#0E5A61", fontSize: "24px", margin: 0 }}>
                Detalle por Misionero - {paisesDelContinente.find(p => p.id === parseInt(paisSeleccionado))?.nombre}
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
                    e.currentTarget.style.borderColor = "#667eea";
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
                    <h3 style={{ color: "#0E5A61", fontSize: "18px", margin: "0 0 5px 0" }}>
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
                      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
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
                <h2 style={{ color: "#0E5A61", fontSize: "24px", margin: 0 }}>
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
                    <tr style={{ background: "#0E5A61", color: "white" }}>
                      <th style={{ padding: "12px", textAlign: "left" }}>N°</th>
                      <th style={{ padding: "12px", textAlign: "left" }}>Nombre</th>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map(dia => (
                        <th key={dia} colSpan="2" style={{ padding: "12px", textAlign: "center", fontSize: "12px" }}>
                          Día {dia}
                        </th>
                      ))}
                    </tr>
                    <tr style={{ background: "#0E5A61", color: "white" }}>
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
        
        <style>{estilosImpresion}</style>
      </div>
    </div>
  );
}
