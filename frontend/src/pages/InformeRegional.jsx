import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowLeft, FaFileAlt, FaPrint, FaDownload,
  FaCheckCircle, FaGlobe, FaDollarSign, FaChartBar,
  FaFilter, FaSearch
} from "react-icons/fa";
import { useAuth } from '../context/AuthContext';
import administracionService from '../services/AdministracionService';
import { useIdioma } from '../context/IdiomaContext';
import toast from 'react-hot-toast';

const P  = "#1a5490";
const PL = "#2a72b8";

const MESES_ES = {
  ENERO:"Enero", FEBRERO:"Febrero", MARZO:"Marzo", ABRIL:"Abril",
  MAYO:"Mayo", JUNIO:"Junio", JULIO:"Julio", AGOSTO:"Agosto",
  SEPTIEMBRE:"Septiembre", OCTUBRE:"Octubre", NOVIEMBRE:"Noviembre", DICIEMBRE:"Diciembre"
};
const MESES_ES_ABR = {
  ENERO:"Ene", FEBRERO:"Feb", MARZO:"Mar", ABRIL:"Abr",
  MAYO:"May", JUNIO:"Jun", JULIO:"Jul", AGOSTO:"Ago",
  SEPTIEMBRE:"Sep", OCTUBRE:"Oct", NOVIEMBRE:"Nov", DICIEMBRE:"Dic"
};
const MESES_EN = {
  ENERO:"January", FEBRERO:"February", MARZO:"March", ABRIL:"April",
  MAYO:"May", JUNIO:"June", JULIO:"July", AGOSTO:"August",
  SEPTIEMBRE:"September", OCTUBRE:"October", NOVIEMBRE:"November", DICIEMBRE:"December"
};
const MESES_EN_ABR = {
  ENERO:"Jan", FEBRERO:"Feb", MARZO:"Mar", ABRIL:"Apr",
  MAYO:"May", JUNIO:"Jun", JULIO:"Jul", AGOSTO:"Aug",
  SEPTIEMBRE:"Sep", OCTUBRE:"Oct", NOVIEMBRE:"Nov", DICIEMBRE:"Dec"
};
const MESES = Object.keys(MESES_EN);

export default function InformeRegional() {
  const navigate   = useNavigate();
  const { user }   = useAuth();
  const { idioma } = useIdioma();
  const tx = (es, en) => (idioma === 'en' ? en : es);
  const mesNombre = (m) => tx(MESES_ES[m], MESES_EN[m]);
  const mesAbr = (m) => tx(MESES_ES_ABR[m], MESES_EN_ABR[m]);

  const [año, setAño]               = useState(new Date().getFullYear());
  const [mes, setMes]               = useState(MESES[new Date().getMonth()]);
  const [filtroModo, setFiltroModo] = useState("mensual"); // mensual | anual
  const [busqueda, setBusqueda]     = useState("");
  const [datos, setDatos]           = useState([]);
  const [paises, setPaises]         = useState([]);
  const [continentes, setContinentes] = useState([]);
  const [continenteId, setContinenteId] = useState(null);
  const [region, setRegion]         = useState("CAC");
  const [cargando, setCargando]     = useState(false);
  const [generado, setGenerado]     = useState(false);

  useEffect(() => { cargarContinentes(); }, []);

  const cargarContinentes = async () => {
    try {
      const data = await administracionService.getAllContinentes();
      setContinentes(data);
      // Seleccionar el primer continente por defecto
      if (data.length > 0) {
        setContinenteId(data[0].id);
        setRegion(data[0].nombre);
        setPaises(data[0].paises || []);
      }
    } catch { toast.error(tx('Error al cargar las regiones', 'Error loading regions')); }
  };

  const handleContinenteChange = (id) => {
    const cont = continentes.find(c => String(c.id) === String(id));
    if (cont) {
      setContinenteId(cont.id);
      setRegion(cont.nombre);
      setPaises(cont.paises || []);
      setGenerado(false);
      setDatos([]);
    }
  };

  const generarInforme = async () => {
    try {
      setCargando(true);
      setGenerado(false);

      const resultados = await Promise.all(
        paises.map(async (pais) => {
          try {
            const mesesConsulta = filtroModo === "anual" ? MESES : [mes];
            let totalGastado = 0;
            let totalRecibido = 0;
            const movimientos = [];

            for (const m of mesesConsulta) {
              try {
                const detalles = await administracionService.getDetallePresupuesto(pais.id, m, año);
                const lista = Array.isArray(detalles) ? detalles : [];
                const gastosMes = lista.reduce((s, d) => s + parseFloat(d.monto || d.valor || 0), 0);
                totalGastado += gastosMes;
                if (gastosMes > 0) {
                  movimientos.push({ mes: MESES_EN[m], monto: gastosMes, items: lista.length });
                }
                // Ingresos del mes
                const ingresosMes = await administracionService.getIngresos(pais.id, m, año).catch(() => []);
                const ingresosList = Array.isArray(ingresosMes) ? ingresosMes : [];
                totalRecibido += ingresosList.reduce((s, i) => s + parseFloat(i.valor || i.monto || 0), 0);
              } catch {}
            }

            return {
              pais: pais.nombre,
              iso: pais.codigo_iso || pais.iso || "",
              totalRecibido,
              totalGastado,
              restante: totalRecibido - totalGastado,
              movimientos,
              tieneData: totalGastado > 0 || totalRecibido > 0
            };
          } catch {
            return { pais: pais.nombre, iso: pais.codigo_iso || pais.iso || "", totalRecibido: 0, totalGastado: 0, restante: 0, movimientos: [], tieneData: false };
          }
        })
      );

      setDatos(resultados);
      setGenerado(true);
    } catch { toast.error(tx('Error al generar el informe', 'Error generating report')); }
    finally { setCargando(false); }
  };

  const datosFiltrados = datos.filter(d =>
    d.pais.toLowerCase().includes(busqueda.toLowerCase())
  );

  const totalRegionGastado  = datos.reduce((s, d) => s + d.totalGastado, 0);
  const totalRegionRecibido = datos.reduce((s, d) => s + d.totalRecibido, 0);
  const paisesConData       = datos.filter(d => d.tieneData).length;
  const paisessinData       = datos.filter(d => !d.tieneData).length;

  const handlePrint = () => window.print();

  return (
    <div style={{ minHeight: "100vh", background: "#f4f6fb", fontFamily: "'Lato', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Lato:wght@300;400;700&display=swap');

        /* ── TOPBAR ── */
        .ir-topbar {
          background: white; border-bottom: 1px solid #e8edf5;
          padding: 0 32px; height: 60px;
          display: flex; align-items: center; justify-content: space-between;
          position: sticky; top: 0; z-index: 100;
        }
        .ir-topbar-left { display: flex; align-items: center; gap: 16px; }
        .ir-back { display: flex; align-items: center; gap: 6px; padding: 8px 14px; background: #f0f4fa; border: none; border-radius: 8px; color: #5a6a85; font-family: 'Lato', sans-serif; font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.2s; }
        .ir-back:hover { background: #e3eaf5; color: ${P}; }
        .ir-title { font-family: 'Cinzel', serif; font-size: 16px; color: #1a2d5a; font-weight: 600; }
        .ir-region-tag { background: ${P}; color: white; font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 99px; letter-spacing: 0.5px; }
        .ir-topbar-right { display: flex; align-items: center; gap: 10px; }
        .ir-btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border: none; border-radius: 8px; font-family: 'Lato', sans-serif; font-size: 12px; font-weight: 700; cursor: pointer; transition: all 0.2s; }
        .ir-btn:hover { transform: translateY(-1px); }
        .ir-btn-primary { background: ${P}; color: white; box-shadow: 0 3px 10px rgba(26,84,144,0.25); }
        .ir-btn-outline { background: white; color: #5a6a85; border: 1.5px solid #dde3ef; }
        .ir-btn-print   { background: #f0f4fa; color: #5a6a85; }

        /* ── FILTROS ── */
        .ir-filters {
          background: white; border-bottom: 1px solid #e8edf5; padding: 16px 32px;
          display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
        }
        .ir-filter-label { font-size: 11px; font-weight: 700; color: #8a97b0; letter-spacing: 1px; text-transform: uppercase; }
        .ir-select { padding: 8px 12px; border: 1.5px solid #dde3ef; border-radius: 8px; font-size: 13px; font-family: 'Lato', sans-serif; color: #1a2d5a; outline: none; cursor: pointer; }
        .ir-select:focus { border-color: ${P}; }
        .ir-mode-btn { padding: 7px 14px; border: 1.5px solid #dde3ef; background: white; color: #8a97b0; font-size: 12px; font-weight: 700; border-radius: 8px; cursor: pointer; font-family: 'Lato', sans-serif; transition: all 0.15s; }
        .ir-mode-btn.active { background: ${P}; color: white; border-color: ${P}; }
        .ir-search { display: flex; align-items: center; gap: 8px; padding: 8px 14px; border: 1.5px solid #dde3ef; border-radius: 8px; margin-left: auto; }
        .ir-search input { border: none; outline: none; font-size: 13px; font-family: 'Lato', sans-serif; color: #1a2d5a; width: 160px; }
        .ir-search-icon { color: #b0bcd0; font-size: 13px; }

        /* ── CONTENT ── */
        .ir-content { padding: 28px 32px; max-width: 1400px; margin: 0 auto; }

        /* ── SUMMARY CARDS ── */
        .ir-summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 28px; }
        .ir-sum-card { background: white; border-radius: 12px; border: 1px solid #e8edf5; padding: 20px; }
        .ir-sum-label { font-size: 11px; color: #8a97b0; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px; }
        .ir-sum-value { font-size: 26px; font-weight: 700; }
        .ir-sum-sub   { font-size: 11px; color: #b0bcd0; margin-top: 4px; }

        /* ── MAIN TABLE CARD ── */
        .ir-card { background: white; border-radius: 12px; border: 1px solid #e8edf5; overflow: hidden; }
        .ir-card-header { padding: 18px 24px; border-bottom: 1px solid #e8edf5; display: flex; align-items: center; justify-content: space-between; }
        .ir-card-title { font-family: 'Cinzel', serif; font-size: 15px; color: #1a2d5a; font-weight: 600; margin: 0; }

        /* ── TABLE ── */
        .ir-table { width: 100%; border-collapse: collapse; }
        .ir-table th { padding: 11px 20px; text-align: left; font-size: 11px; font-weight: 700; letter-spacing: 0.8px; text-transform: uppercase; color: #8a97b0; border-bottom: 2px solid #e8edf5; background: #fafbfd; white-space: nowrap; }
        .ir-table td { padding: 14px 20px; font-size: 13px; color: #1a2d5a; border-bottom: 1px solid #f0f4fa; }
        .ir-table tr:last-child td { border-bottom: none; }
        .ir-table tr:hover td { background: #f8faff; }
        .ir-table .total-row td { background: #eef2fb; font-weight: 700; font-size: 14px; border-top: 2px solid #dde3ef; }

        /* ── ESTADO BADGE ── */
        .ir-badge { display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px; border-radius: 99px; font-size: 10px; font-weight: 700; }
        .ir-badge-ok      { background: #e8f5e9; color: #2e7d32; }
        .ir-badge-no-data { background: #f5f5f5; color: #9e9e9e; }
        .ir-badge-over    { background: #ffebee; color: #c62828; }

        /* ── EMPTY STATE ── */
        .ir-empty { padding: 60px; text-align: center; color: #b0bcd0; }
        .ir-empty-icon { font-size: 48px; margin-bottom: 16px; opacity: 0.3; }

        /* ── LOADING ── */
        .ir-loading { padding: 60px; text-align: center; }
        .ir-spinner { width: 36px; height: 36px; border: 3px solid #eef2f7; border-top-color: ${P}; border-radius: 50%; animation: spin 0.7s linear infinite; margin: 0 auto 16px; }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── PRINT ── */
        @media print {
          .ir-topbar, .ir-filters, .ir-btn, .ir-back, .no-print { display: none !important; }
          .ir-content { padding: 0; }
          .ir-card { border: none; border-radius: 0; }
          body { background: white; }
          .ir-print-header { display: block !important; }
        }
        .ir-print-header { display: none; padding: 20px 0 16px; border-bottom: 2px solid #1a2d5a; margin-bottom: 20px; }
      `}</style>

      {/* ── TOPBAR ── */}
      <div className="ir-topbar no-print">
        <div className="ir-topbar-left">
          <button className="ir-back" onClick={() => navigate("/administracion")}>
            <FaArrowLeft /> {tx('Volver', 'Back')}
          </button>
          <span className="ir-title">{tx('Informe Financiero Regional', 'Regional Financial Report')}</span>
          <span className="ir-region-tag">{region}</span>
        </div>
        <div className="ir-topbar-right">
          {generado && (
            <>
              <button className="ir-btn ir-btn-print" onClick={handlePrint}>
                <FaPrint /> {tx('Imprimir', 'Print')}
              </button>
              <button className="ir-btn ir-btn-outline">
                <FaDownload /> {tx('Exportar', 'Export')}
              </button>
            </>
          )}
          <button className="ir-btn ir-btn-primary" onClick={generarInforme} disabled={cargando}>
            <FaFileAlt /> {cargando ? tx('Generando...', 'Generating...') : tx('Generar Informe', 'Generate Report')}
          </button>
        </div>
      </div>

      {/* ── FILTROS ── */}
      <div className="ir-filters no-print">
        <FaFilter style={{ color: "#b0bcd0", fontSize: "13px" }} />
        <span className="ir-filter-label">{tx('Región:', 'Region:')}</span>
        <select className="ir-select" value={continenteId || ""} onChange={e => handleContinenteChange(e.target.value)}>
          {continentes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
        <span className="ir-filter-label" style={{ marginLeft:8 }}>{tx('Periodo:', 'Period:')}</span>
        <button className={`ir-mode-btn ${filtroModo === "mensual" ? "active" : ""}`} onClick={() => setFiltroModo("mensual")}>{tx('Mensual', 'Monthly')}</button>
        <button className={`ir-mode-btn ${filtroModo === "anual"   ? "active" : ""}`} onClick={() => setFiltroModo("anual")}>{tx('Anual', 'Annual')}</button>

        {filtroModo === "mensual" && (
          <select className="ir-select" value={mes} onChange={e => setMes(e.target.value)}>
            {MESES.map(m => <option key={m} value={m}>{mesNombre(m)}</option>)}
          </select>
        )}

        <select className="ir-select" value={año} onChange={e => setAño(parseInt(e.target.value))}>
          {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
        </select>

        {generado && (
          <div className="ir-search">
            <FaSearch className="ir-search-icon" />
            <input type="text" placeholder={tx('Buscar país...', 'Search country...')} value={busqueda} onChange={e => setBusqueda(e.target.value)} />
          </div>
        )}
      </div>

      {/* ── CONTENT ── */}
      <div className="ir-content">

        {/* Print Header */}
        <div className="ir-print-header">
          <h2 style={{ fontFamily: "'Cinzel', serif", color: "#1a2d5a", margin: "0 0 4px" }}>
            {tx('Iglesia Emanuel — Informe Financiero Regional', 'Emanuel Church — Regional Financial Report')}
          </h2>
          <p style={{ color: "#8a97b0", margin: 0, fontSize: "13px" }}>
            {region} · {filtroModo === "anual" ? `${tx('Año', 'Year')} ${año}` : `${mesNombre(mes)} ${año}`} · {tx('Generado', 'Generated')}: {new Date().toLocaleDateString(idioma === 'en' ? 'en-US' : 'es-DO')}
          </p>
        </div>

        {!generado && !cargando && (
          <div className="ir-empty">
            <div className="ir-empty-icon"><FaGlobe /></div>
            <div style={{ fontWeight: "700", fontSize: "16px", marginBottom: "8px" }}>{tx('Configura y genera el informe', 'Configure and generate the report')}</div>
            <p style={{ fontSize: "13px", maxWidth: "320px", margin: "0 auto" }}>
              {tx('Selecciona el periodo y haz clic en', 'Select the period and click')} <strong>{tx('Generar Informe', 'Generate Report')}</strong> {tx('para ver los datos consolidados de los', 'to see the consolidated data for all')} {paises.length} {tx('países en', 'countries in')} {region}.
            </p>
          </div>
        )}

        {cargando && (
          <div className="ir-loading">
            <div className="ir-spinner" />
            <div style={{ color: "#8a97b0", fontSize: "14px" }}>{tx('Cargando datos de', 'Loading data from')} {paises.length} {tx('países...', 'countries...')}</div>
          </div>
        )}

        {generado && !cargando && (
          <>
            {/* Summary cards */}
            <div className="ir-summary">
              <div className="ir-sum-card">
                <div className="ir-sum-label">{tx('Países en la Región', 'Countries in Region')}</div>
                <div className="ir-sum-value" style={{ color: P }}>{paises.length}</div>
                <div className="ir-sum-sub">{paisesConData} {tx('con registros', 'with records')}</div>
              </div>
              <div className="ir-sum-card">
                <div className="ir-sum-label">{tx('Total Distribuido (USD)', 'Total Distributed (USD)')}</div>
                <div className="ir-sum-value" style={{ color: P }}>${totalRegionRecibido.toLocaleString()}</div>
                <div className="ir-sum-sub">{tx('Desde la sede', 'From headquarters')}</div>
              </div>
              <div className="ir-sum-card">
                <div className="ir-sum-label">{tx('Total Gastado (USD)', 'Total Spent (USD)')}</div>
                <div className="ir-sum-value" style={{ color: "#f44336" }}>${totalRegionGastado.toLocaleString()}</div>
                <div className="ir-sum-sub">{tx('Todos los países combinados', 'All countries combined')}</div>
              </div>
              <div className="ir-sum-card">
                <div className="ir-sum-label">{tx('Países Sin Datos', 'Countries No Data')}</div>
                <div className="ir-sum-value" style={{ color: "#FF9800" }}>{paisessinData}</div>
                <div className="ir-sum-sub">{tx('Informes pendientes', 'Pending reports')}</div>
              </div>
            </div>

            {/* Main table */}
            <div className="ir-card">
              <div className="ir-card-header">
                <h3 className="ir-card-title">
                  {tx('Detalle de Gastos por País', 'Expense Detail by Country')} — {filtroModo === "anual" ? `${tx('Año', 'Year')} ${año}` : `${mesNombre(mes)} ${año}`}
                </h3>
                <span style={{ fontSize: "12px", color: "#8a97b0" }}>{region} · {datosFiltrados.length} {tx('países', 'countries')}</span>
              </div>

              <table className="ir-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>{tx('País', 'Country')}</th>
                    <th>ISO</th>
                    <th style={{ textAlign: "right" }}>{tx('Recibido (USD)', 'Received (USD)')}</th>
                    <th style={{ textAlign: "right" }}>{tx('Gastado (USD)', 'Spent (USD)')}</th>
                    <th style={{ textAlign: "right" }}>{tx('Restante', 'Remaining')}</th>
                    <th style={{ textAlign: "center" }}>{tx('Registros', 'Records')}</th>
                    <th style={{ textAlign: "center" }}>{tx('Estado', 'Status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {datosFiltrados.map((d, i) => (
                    <tr key={d.pais}>
                      <td style={{ color: "#b0bcd0", fontSize: "12px" }}>{i + 1}</td>
                      <td style={{ fontWeight: "700" }}>{d.pais}</td>
                      <td style={{ color: "#b0bcd0", fontSize: "12px", fontWeight: "700" }}>{d.iso}</td>
                      <td style={{ textAlign: "right", color: P, fontWeight: "700" }}>
                        {d.totalRecibido > 0 ? `$${d.totalRecibido.toLocaleString()}` : "—"}
                      </td>
                      <td style={{ textAlign: "right", color: d.tieneData ? "#f44336" : "#b0bcd0", fontWeight: "700" }}>
                        {d.tieneData ? `$${d.totalGastado.toLocaleString()}` : "—"}
                      </td>
                      <td style={{ textAlign: "right", color: d.restante < 0 ? "#f44336" : d.tieneData ? "#4CAF50" : "#b0bcd0", fontWeight: "700" }}>
                        {d.tieneData ? `$${Math.abs(d.restante).toLocaleString()}` : "—"}
                      </td>
                      <td style={{ textAlign: "center", color: "#8a97b0" }}>
                        {d.movimientos.reduce((s, m) => s + m.items, 0) || "—"}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        {!d.tieneData
                          ? <span className="ir-badge ir-badge-no-data">{tx('Sin datos', 'No data')}</span>
                          : d.restante < 0
                          ? <span className="ir-badge ir-badge-over">{tx('Sobre presupuesto', 'Over budget')}</span>
                          : <span className="ir-badge ir-badge-ok"><FaCheckCircle /> {tx('Reportado', 'Reported')}</span>
                        }
                      </td>
                    </tr>
                  ))}

                  {/* Total row */}
                  <tr className="total-row">
                    <td colSpan="3" style={{ color: "#5a6a85", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      {tx('Total Regional', 'Regional Total')} — {region}
                    </td>
                    <td style={{ textAlign: "right", color: P }}>${totalRegionRecibido.toLocaleString()}</td>
                    <td style={{ textAlign: "right", color: "#f44336" }}>${totalRegionGastado.toLocaleString()}</td>
                    <td style={{ textAlign: "right", color: totalRegionRecibido - totalRegionGastado < 0 ? "#f44336" : "#4CAF50" }}>
                      ${Math.abs(totalRegionRecibido - totalRegionGastado).toLocaleString()}
                    </td>
                    <td colSpan="2" style={{ textAlign: "center", color: "#8a97b0" }}>
                      {paisesConData} / {paises.length} {tx('países', 'countries')}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Detalle por mes si es anual */}
            {filtroModo === "anual" && datosFiltrados.some(d => d.movimientos.length > 0) && (
              <div className="ir-card" style={{ marginTop: "20px" }}>
                <div className="ir-card-header">
                  <h3 className="ir-card-title">{tx('Desglose Mensual por País', 'Monthly Breakdown by Country')}</h3>
                </div>
                <table className="ir-table">
                  <thead>
                    <tr>
                      <th>{tx('País', 'Country')}</th>
                      {MESES.map(m => <th key={m} style={{ textAlign: "right" }}>{mesAbr(m)}</th>)}
                      <th style={{ textAlign: "right" }}>{tx('Total', 'Total')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {datosFiltrados.filter(d => d.tieneData).map(d => (
                      <tr key={d.pais}>
                        <td style={{ fontWeight: "700" }}>{d.pais}</td>
                        {MESES.map(m => {
                          const mov = d.movimientos.find(mv => mv.mes === MESES_EN[m]);
                          return (
                            <td key={m} style={{ textAlign: "right", fontSize: "12px", color: mov ? "#1a2d5a" : "#e0e0e0" }}>
                              {mov ? `$${mov.monto.toLocaleString()}` : "—"}
                            </td>
                          );
                        })}
                        <td style={{ textAlign: "right", fontWeight: "700", color: P }}>${d.totalGastado.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Nota para sede */}
            <div style={{ marginTop: "20px", padding: "16px 20px", background: "#eef2fb", borderRadius: "12px", border: `1px solid ${P}20`, display: "flex", alignItems: "center", gap: "12px" }}>
              <FaGlobe style={{ color: P, fontSize: "18px", flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: "700", color: P, fontSize: "13px", marginBottom: "2px" }}>{tx('Informe listo para enviar a la sede', 'Report ready to send to headquarters')}</div>
                <div style={{ fontSize: "12px", color: "#8a97b0" }}>
                  {tx('Este informe consolida los gastos de', 'This report consolidates the expenses of')} {paisesConData} {tx('países en la región', 'countries in the')} {region} {tx('para', 'region for')} {filtroModo === "anual" ? `${tx('el año', 'the year')} ${año}` : `${mesNombre(mes)} ${año}`}.
                  {paisessinData > 0 && ` ${paisessinData} ${tx('países aún no han enviado su reporte de gastos.', 'countries have not yet submitted their expense report.')}`}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
