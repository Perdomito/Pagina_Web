import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaFilePdf, FaPrint, FaChartLine, FaUsers, FaClock, FaBookOpen, FaUserPlus, FaCheckCircle, FaCalendarWeek, FaCalendarAlt } from "react-icons/fa";
import jsPDF from "jspdf";
import "jspdf-autotable";

export default function Reportes() {
  const navigate = useNavigate();
  
  // Estados de filtros
  const [continenteSeleccionado, setContinenteSeleccionado] = useState("");
  const [paisSeleccionado, setPaisSeleccionado] = useState("");
  const [tipoReporte, setTipoReporte] = useState("semanal"); // semanal o mensual
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState("");
  const [observaciones, setObservaciones] = useState("");
  
  // Estados de datos
  const [reporteActual, setReporteActual] = useState(null);
  const [reporteAnterior, setReporteAnterior] = useState(null);
  const [mostrandoComparacion, setMostrandoComparacion] = useState(false);
  
  // Datos de ejemplo (conectar con Estudios Bíblicos)
  const continentes = [
    {
      id: 1,
      nombre: "CAC",
      paises: [
        { id: 1, nombre: "República Dominicana" },
        { id: 2, nombre: "Guatemala" },
        { id: 3, nombre: "Honduras" },
        { id: 4, nombre: "México" }
      ]
    },
    {
      id: 2,
      nombre: "Sudamérica",
      paises: [
        { id: 5, nombre: "Colombia" },
        { id: 6, nombre: "Bolivia" },
        { id: 7, nombre: "Cuba" },
        { id: 8, nombre: "Argentina" }
      ]
    }
  ];
  
  const paisesDelContinente = continenteSeleccionado 
    ? continentes.find(c => c.id === parseInt(continenteSeleccionado))?.paises || []
    : [];
  
  // Generar opciones de período según el tipo
  const obtenerPeriodos = () => {
    const periodos = [];
    const hoy = new Date();
    
    if (tipoReporte === "semanal") {
      // Generar últimas 12 semanas
      for (let i = 0; i < 12; i++) {
        const fecha = new Date(hoy);
        fecha.setDate(fecha.getDate() - (i * 7));
        const inicio = new Date(fecha);
        inicio.setDate(fecha.getDate() - fecha.getDay()); // Domingo
        const fin = new Date(inicio);
        fin.setDate(inicio.getDate() + 6); // Sábado
        
        periodos.push({
          valor: `${inicio.getFullYear()}-W${Math.ceil((inicio.getDate()) / 7)}`,
          etiqueta: `${inicio.getDate().toString().padStart(2, '0')}.${(inicio.getMonth() + 1).toString().padStart(2, '0')}.${inicio.getFullYear()} - ${fin.getDate().toString().padStart(2, '0')}.${(fin.getMonth() + 1).toString().padStart(2, '0')}.${fin.getFullYear()}`
        });
      }
    } else {
      // MENSUAL: Generar últimos 12 meses
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
  
  // Calcular datos del reporte (conectar con Estudios Bíblicos)
  const calcularReporte = () => {
    if (!continenteSeleccionado || !paisSeleccionado || !periodoSeleccionado) {
      return null;
    }
    
    // Extraer mes del período seleccionado
    const [año, mesPart] = periodoSeleccionado.split('-');
    let mes;
    
    if (tipoReporte === "mensual") {
      // Formato: "2026-03" -> mes "MARZO"
      const meses = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
      mes = meses[parseInt(mesPart) - 1];
    } else {
      // Para semanal, usar el mes actual por ahora
      const hoy = new Date();
      const meses = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
      mes = meses[hoy.getMonth()];
    }
    
    // USAR DATOS REALES DE ESTUDIOS BÍBLICOS
    // Importar la función cuando esté disponible
    // Por ahora retorna 0 si no hay datos
    const datosReales = {
      estudiantesActuales: 0,
      evangelismoOnline: 0,
      evangelismoPresencial: 0,
      numeroEstudios: 0,
      nuevosContactos: 0,
      contactosEstudian: 0,
      // Datos en 0 (futuro)
      hastRomanos4: 0,
      terminadoRomanos8: 0,
      terminado4Leyes: 0,
      probabilidadMiembro: 0,
      ovejasPotenciales: 0
    };
    
    return datosReales;
  };
  
  // Generar reporte
  const generarReporte = () => {
    const reporte = calcularReporte();
    setReporteActual(reporte);
    
    // TODO: Calcular reporte anterior real para comparación
    // Por ahora null (sin comparación)
    setReporteAnterior(null);
  };
  
  // Auto-generar cuando cambian los filtros
  useEffect(() => {
    if (continenteSeleccionado && paisSeleccionado && periodoSeleccionado) {
      generarReporte();
    }
  }, [continenteSeleccionado, paisSeleccionado, tipoReporte, periodoSeleccionado]);
  
  // Calcular diferencia porcentual
  const calcularDiferencia = (actual, anterior) => {
    if (!anterior || anterior === 0) return 0;
    return Math.round(((actual - anterior) / anterior) * 100);
  };
  
  // Imprimir
  const handleImprimir = () => {
    window.print();
  };
  
  // Exportar PDF
  const handleExportarPDF = () => {
    if (!reporteActual) return;
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Configurar fuente
    doc.setFont("helvetica");
    
    // Título principal
    doc.setFontSize(20);
    doc.setTextColor(14, 90, 97);
    doc.text("Reporte de Evangelización", pageWidth / 2, 20, { align: "center" });
    
    // Subtítulo
    doc.setFontSize(14);
    doc.setTextColor(100, 100, 100);
    const paisNombre = paisesDelContinente.find(p => p.id === parseInt(paisSeleccionado))?.nombre || "";
    const periodoTexto = obtenerPeriodos().find(p => p.valor === periodoSeleccionado)?.etiqueta || "";
    doc.text(`${tipoReporte === "semanal" ? "Semanal" : "Mensual"} - ${paisNombre}`, pageWidth / 2, 30, { align: "center" });
    doc.text(periodoTexto, pageWidth / 2, 38, { align: "center" });
    
    // Línea separadora
    doc.setDrawColor(14, 90, 97);
    doc.setLineWidth(0.5);
    doc.line(20, 42, pageWidth - 20, 42);
    
    // Datos principales
    const datosTabla = [
      ["Métrica", "Valor"],
      ["Estudiantes Actuales de la Biblia", reporteActual.estudiantesActuales.toString()],
      ["Evangelismo Online (horas)", reporteActual.evangelismoOnline.toString()],
      ["Evangelismo Presencial (horas)", reporteActual.evangelismoPresencial.toString()],
      [`Estudios en la ${tipoReporte === "semanal" ? "Semana" : "Mes"}`, reporteActual.numeroEstudios.toString()],
      [`Nuevos Contactos ${tipoReporte === "semanal" ? "esta Semana" : "este Mes"}`, reporteActual.nuevosContactos.toString()],
      ["Contactos que Tomaron el Estudio", reporteActual.contactosEstudian.toString()]
    ];
    
    doc.autoTable({
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
    
    // Seguimiento de progreso (futuro)
    const yPosition = doc.lastAutoTable.finalY + 15;
    
    doc.setFontSize(14);
    doc.setTextColor(14, 90, 97);
    doc.text("Seguimiento de Progreso", 20, yPosition);
    
    const datosProgreso = [
      ["Métrica", "Valor"],
      ["Estudiantes hasta Romanos 4", reporteActual.hastRomanos4.toString()],
      ["Estudiantes que terminaron Romanos 8", reporteActual.terminadoRomanos8.toString()],
      ["Estudiantes que terminaron las 4 Leyes", reporteActual.terminado4Leyes.toString()],
      ["Probabilidad de Hacerse Miembro", reporteActual.probabilidadMiembro.toString()],
      ["Ovejas Potenciales", reporteActual.ovejasPotenciales.toString()]
    ];
    
    doc.autoTable({
      startY: yPosition + 5,
      head: [datosProgreso[0]],
      body: datosProgreso.slice(1),
      theme: 'grid',
      headStyles: {
        fillColor: [14, 90, 97],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 11
      },
      bodyStyles: {
        fontSize: 10,
        textColor: [150, 150, 150]
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250]
      },
      margin: { left: 20, right: 20 }
    });
    
    // Observaciones si existen
    if (observaciones && observaciones.trim()) {
      const yObs = doc.lastAutoTable.finalY + 15;
      
      doc.setFontSize(14);
      doc.setTextColor(14, 90, 97);
      doc.text("Observaciones", 20, yObs);
      
      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      const splitObs = doc.splitTextToSize(observaciones, pageWidth - 40);
      doc.text(splitObs, 20, yObs + 7);
    }
    
    // Pie de página
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Generado el ${new Date().toLocaleDateString('es-ES')} - Página ${i} de ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: "center" }
      );
    }
    
    // Guardar PDF
    const nombreArchivo = `Reporte_${paisNombre.replace(/\s+/g, '_')}_${periodoTexto.replace(/\s+/g, '_')}.pdf`;
    doc.save(nombreArchivo);
  };
  
  const MetricaCard = ({ icono, titulo, valor, anterior, color }) => {
    const diff = anterior ? calcularDiferencia(valor, anterior) : null;
    
    return (
      <div style={{
        background: "white",
        borderRadius: "12px",
        padding: "24px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        transition: "transform 0.3s, box-shadow 0.3s",
        cursor: "pointer"
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.15)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)";
      }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "12px" }}>
          <div style={{
            background: `${color}20`,
            color: color,
            width: "50px",
            height: "50px",
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "24px"
          }}>
            {icono}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "13px", color: "#666", marginBottom: "4px" }}>{titulo}</div>
            <div style={{ fontSize: "32px", fontWeight: "700", color: color }}>{valor}</div>
          </div>
        </div>
        
        {mostrandoComparacion && diff !== null && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "13px",
            color: diff >= 0 ? "#4CAF50" : "#f44336",
            fontWeight: "600"
          }}>
            <span>{diff >= 0 ? "↑" : "↓"}</span>
            <span>{Math.abs(diff)}%</span>
            <span style={{ color: "#999", fontWeight: "400" }}>vs período anterior</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f5f7fa", padding: "20px" }}>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
        }
        
        .input-modern {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          font-size: 15px;
          transition: all 0.3s;
          box-sizing: border-box;
        }
        
        .input-modern:focus {
          outline: none;
          border-color: #0E5A61;
          box-shadow: 0 0 0 3px rgba(14,90,97,0.1);
        }
        
        .btn-modern {
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        
        .btn-primary {
          background: linear-gradient(135deg, #0E5A61 0%, #15777F 100%);
          color: white;
        }
        
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(14,90,97,0.3);
        }
        
        .btn-secondary {
          background: white;
          color: #0E5A61;
          border: 2px solid #0E5A61;
        }
        
        .btn-secondary:hover {
          background: #0E5A61;
          color: white;
        }
      `}</style>

      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #0E5A61 0%, #15777F 100%)",
        borderRadius: "16px",
        padding: "30px",
        marginBottom: "30px",
        boxShadow: "0 8px 24px rgba(14,90,97,0.2)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
            <button
              onClick={() => navigate("/home")}
              className="btn-secondary no-print"
              style={{ background: "rgba(255,255,255,0.2)", color: "white", borderColor: "transparent" }}
            >
              <FaArrowLeft /> Inicio
            </button>
            <h1 style={{ color: "white", margin: 0, fontSize: "28px" }}>
              <FaChartLine style={{ marginRight: "10px" }} />
              Reportes de Evangelización
            </h1>
          </div>
          
          {reporteActual && (
            <div style={{ display: "flex", gap: "10px" }} className="no-print">
              <button onClick={handleExportarPDF} className="btn-secondary" style={{ background: "white", color: "#0E5A61", borderColor: "white" }}>
                <FaFilePdf /> PDF
              </button>
              <button onClick={handleImprimir} className="btn-secondary" style={{ background: "white", color: "#0E5A61", borderColor: "white" }}>
                <FaPrint /> Imprimir
              </button>
              <button
                onClick={() => setMostrandoComparacion(!mostrandoComparacion)}
                className="btn-secondary"
                style={{
                  background: mostrandoComparacion ? "white" : "rgba(255,255,255,0.2)",
                  color: mostrandoComparacion ? "#0E5A61" : "white",
                  borderColor: mostrandoComparacion ? "white" : "rgba(255,255,255,0.3)"
                }}
              >
                <FaChartLine /> Comparar
              </button>
            </div>
          )}
        </div>
        
        {/* Filtros */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px" }} className="no-print">
          <select
            value={continenteSeleccionado}
            onChange={(e) => {
              setContinenteSeleccionado(e.target.value);
              setPaisSeleccionado("");
            }}
            className="input-modern"
            style={{ background: "rgba(255,255,255,0.95)" }}
          >
            <option value="">Seleccione Continente</option>
            {continentes.map(c => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
          
          <select
            value={paisSeleccionado}
            onChange={(e) => setPaisSeleccionado(e.target.value)}
            className="input-modern"
            style={{ background: "rgba(255,255,255,0.95)" }}
            disabled={!continenteSeleccionado}
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
            }}
            className="input-modern"
            style={{ background: "rgba(255,255,255,0.95)" }}
          >
            <option value="semanal">Reporte Semanal</option>
            <option value="mensual">Reporte Mensual</option>
          </select>
          
          <select
            value={periodoSeleccionado}
            onChange={(e) => setPeriodoSeleccionado(e.target.value)}
            className="input-modern"
            style={{ background: "rgba(255,255,255,0.95)" }}
          >
            <option value="">Seleccione Período</option>
            {obtenerPeriodos().map(p => (
              <option key={p.valor} value={p.valor}>{p.etiqueta}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Contenido del Reporte */}
      {reporteActual ? (
        <div>
          {/* Título del Reporte */}
          <div style={{ background: "white", borderRadius: "12px", padding: "24px", marginBottom: "30px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
            <h2 style={{ margin: "0 0 8px 0", color: "#0E5A61", fontSize: "24px" }}>
              Reporte {tipoReporte === "semanal" ? "Semanal" : "Mensual"} de {paisesDelContinente.find(p => p.id === parseInt(paisSeleccionado))?.nombre}
            </h2>
            <div style={{ color: "#666", fontSize: "15px" }}>
              {tipoReporte === "semanal" ? <FaCalendarWeek style={{ marginRight: "8px" }} /> : <FaCalendarAlt style={{ marginRight: "8px" }} />}
              {obtenerPeriodos().find(p => p.valor === periodoSeleccionado)?.etiqueta}
            </div>
          </div>
          
          {/* Métricas Principales */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px", marginBottom: "30px" }}>
            <MetricaCard
              icono={<FaUsers />}
              titulo="Estudiantes Actuales de la Biblia"
              valor={reporteActual.estudiantesActuales}
              anterior={reporteAnterior?.estudiantesActuales}
              color="#0E5A61"
            />
            
            <MetricaCard
              icono={<FaClock />}
              titulo="Evangelismo Online (horas)"
              valor={reporteActual.evangelismoOnline}
              anterior={reporteAnterior?.evangelismoOnline}
              color="#2196F3"
            />
            
            <MetricaCard
              icono={<FaClock />}
              titulo="Evangelismo Presencial (horas)"
              valor={reporteActual.evangelismoPresencial}
              anterior={reporteAnterior?.evangelismoPresencial}
              color="#4CAF50"
            />
            
            <MetricaCard
              icono={<FaBookOpen />}
              titulo={`Estudios en la ${tipoReporte === "semanal" ? "Semana" : "Mes"}`}
              valor={reporteActual.numeroEstudios}
              anterior={reporteAnterior?.numeroEstudios}
              color="#FF9800"
            />
            
            <MetricaCard
              icono={<FaUserPlus />}
              titulo={`Nuevos Contactos ${tipoReporte === "semanal" ? "esta Semana" : "este Mes"}`}
              valor={reporteActual.nuevosContactos}
              anterior={reporteAnterior?.nuevosContactos}
              color="#9C27B0"
            />
            
            <MetricaCard
              icono={<FaCheckCircle />}
              titulo="Contactos que Tomaron el Estudio"
              valor={reporteActual.contactosEstudian}
              anterior={reporteAnterior?.contactosEstudian}
              color="#00BCD4"
            />
          </div>
          
          {/* Métricas Adicionales (Futuro) */}
          <div style={{ background: "white", borderRadius: "12px", padding: "24px", marginBottom: "30px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
            <h3 style={{ margin: "0 0 20px 0", color: "#0E5A61", fontSize: "20px" }}>
              Seguimiento de Progreso (Próximamente)
            </h3>
            
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "15px" }}>
              <div style={{ padding: "16px", background: "#f5f7fa", borderRadius: "8px" }}>
                <div style={{ fontSize: "13px", color: "#666", marginBottom: "4px" }}>
                  Estudiantes hasta Romanos 4
                </div>
                <div style={{ fontSize: "24px", fontWeight: "700", color: "#999" }}>
                  {reporteActual.hastRomanos4}
                </div>
              </div>
              
              <div style={{ padding: "16px", background: "#f5f7fa", borderRadius: "8px" }}>
                <div style={{ fontSize: "13px", color: "#666", marginBottom: "4px" }}>
                  Estudiantes que terminaron Romanos 8
                </div>
                <div style={{ fontSize: "24px", fontWeight: "700", color: "#999" }}>
                  {reporteActual.terminadoRomanos8}
                </div>
              </div>
              
              <div style={{ padding: "16px", background: "#f5f7fa", borderRadius: "8px" }}>
                <div style={{ fontSize: "13px", color: "#666", marginBottom: "4px" }}>
                  Estudiantes que terminaron las 4 Leyes
                </div>
                <div style={{ fontSize: "24px", fontWeight: "700", color: "#999" }}>
                  {reporteActual.terminado4Leyes}
                </div>
              </div>
              
              <div style={{ padding: "16px", background: "#f5f7fa", borderRadius: "8px" }}>
                <div style={{ fontSize: "13px", color: "#666", marginBottom: "4px" }}>
                  Probabilidad de Hacerse Miembro
                </div>
                <div style={{ fontSize: "24px", fontWeight: "700", color: "#999" }}>
                  {reporteActual.probabilidadMiembro}
                </div>
              </div>
              
              <div style={{ padding: "16px", background: "#f5f7fa", borderRadius: "8px" }}>
                <div style={{ fontSize: "13px", color: "#666", marginBottom: "4px" }}>
                  Ovejas Potenciales
                </div>
                <div style={{ fontSize: "24px", fontWeight: "700", color: "#999" }}>
                  {reporteActual.ovejasPotenciales}
                </div>
              </div>
            </div>
          </div>
          
          {/* Observaciones */}
          <div style={{ background: "white", borderRadius: "12px", padding: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
            <h3 style={{ margin: "0 0 15px 0", color: "#0E5A61", fontSize: "20px" }}>
              Observaciones y Comentarios
            </h3>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Agregue observaciones o comentarios sobre este período..."
              className="input-modern no-print"
              style={{
                minHeight: "120px",
                resize: "vertical",
                fontFamily: "inherit"
              }}
            />
            {observaciones && (
              <div style={{ marginTop: "15px", padding: "15px", background: "#f5f7fa", borderRadius: "8px", fontSize: "15px", lineHeight: "1.6" }}>
                {observaciones}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{
          background: "white",
          borderRadius: "12px",
          padding: "60px 24px",
          textAlign: "center",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
        }}>
          <FaChartLine size={64} style={{ color: "#e0e0e0", marginBottom: "20px" }} />
          <h3 style={{ margin: "0 0 10px 0", color: "#666", fontSize: "20px" }}>
            Seleccione los filtros para generar un reporte
          </h3>
          <p style={{ margin: 0, color: "#999", fontSize: "15px" }}>
            Continente → País → Tipo de Reporte → Período
          </p>
        </div>
      )}
    </div>
  );
}
