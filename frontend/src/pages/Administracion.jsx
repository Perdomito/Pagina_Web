import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaHome, FaUniversity, FaExchangeAlt, FaFileInvoiceDollar,
  FaListAlt, FaPlus, FaTrash, FaSearch, FaFilter, FaTimes,
  FaSave, FaArrowLeft, FaDollarSign, FaCheckCircle,
  FaTimesCircle, FaFileAlt, FaChartBar, FaGlobe,
  FaArrowDown, FaArrowUp, FaEdit
} from "react-icons/fa";
import toast from 'react-hot-toast';
import administracionService from '../services/AdministracionService';
import { useAuth } from '../context/AuthContext';

const P  = "#1a5490";
const PL = "#2a72b8";

const CATEGORIAS_GASTO = [
  { codigo: "51957001", nombre: "Gasto transporte misiones" },
  { codigo: "51957002", nombre: "Gastos alimentación misiones" },
  { codigo: "51957003", nombre: "Comisiones misioneros" },
  { codigo: "51957004", nombre: "Gastos eventos" },
  { codigo: "51957005", nombre: "Gastos operativos" },
  { codigo: "51957006", nombre: "Pago misioneros" },
  { codigo: "51957007", nombre: "Otros gastos" },
];

const FORMAS_PAGO = ["Cash", "Bank Transfer", "Check", "Other"];

const MESES = ["ENERO","FEBRERO","MARZO","ABRIL","MAYO","JUNIO","JULIO","AGOSTO","SEPTIEMBRE","OCTUBRE","NOVIEMBRE","DICIEMBRE"];
const MES_EN = { ENERO:"January",FEBRERO:"February",MARZO:"March",ABRIL:"April",MAYO:"May",JUNIO:"June",JULIO:"July",AGOSTO:"August",SEPTIEMBRE:"September",OCTUBRE:"October",NOVIEMBRE:"November",DICIEMBRE:"December" };

export default function Administracion() {
  const navigate   = useNavigate();
  const { user }   = useAuth();

  const [seccion, setSeccion]         = useState("dashboard");
  const [mes, setMes]                 = useState(MESES[new Date().getMonth()]);
  const [año]                         = useState(new Date().getFullYear());
  const [paisNombre, setPaisNombre]   = useState("");
  const [paisId, setPaisId]           = useState(1);
  const [tasaCambio, setTasaCambio]   = useState(58.00);

  // Cajas y bancos
  const [saldoCaja, setSaldoCaja]     = useState(0);
  const [saldoBanco, setSaldoBanco]   = useState(0);
  const [saldoId, setSaldoId]         = useState(null);

  // Traslados
  const [traslados, setTraslados]     = useState([]);
  const [modalTraslado, setModalTraslado] = useState(false);
  const [nuevoTraslado, setNuevoTraslado] = useState({ de: "banco", a: "caja", valor: "", observaciones: "", fecha: new Date().toISOString().split('T')[0] });

  // Ingresos (recibos de caja)
  const [ingresos, setIngresos]       = useState([]);
  const [modalIngreso, setModalIngreso] = useState(false);
  const [nuevoIngreso, setNuevoIngreso] = useState({ tipo: "RC-1-Recibo de caja", origen: "World Olivet Assembly", dondeIngresa: "banco", valorRecibido: "", observaciones: "", fecha: new Date().toISOString().split('T')[0] });

  // Gastos
  const [gastos, setGastos]           = useState([]);
  const [modalGasto, setModalGasto]   = useState(false);
  const [busqueda, setBusqueda]       = useState("");
  const [filtroTipo, setFiltroTipo]   = useState("");
  const [nuevoGasto, setNuevoGasto]   = useState({
    tipo: "", fecha: new Date().toISOString().split('T')[0],
    proveedor: "", categoria: "", descripcion: "",
    cantidad: 1, valorUnitario: 0, descuento: 0,
    formaPago: "Cash", observaciones: ""
  });

  useEffect(() => {
    if (user) {
      const pid = user.pais_id || 1;
      setPaisId(pid);
      cargarDatos(pid);
      cargarFinanzas(pid);
    }
  }, [user]);

  const cargarDatos = async (pid) => {
    try {
      const [paises, tasa] = await Promise.all([
        administracionService.getAllPaises(),
        administracionService.getTasaCambio()
      ]);
      const p = paises.find(x => x.id === pid);
      if (p) setPaisNombre(p.nombre);
      setTasaCambio(parseFloat(tasa));
    } catch {}
  };

  const cargarFinanzas = async (pid) => {
    try {
      const [saldos, trasl] = await Promise.all([
        administracionService.getSaldos(pid),
        administracionService.getTraslados(pid)
      ]);
      const fila = Array.isArray(saldos) ? saldos[0] : saldos;
      if (fila) {
        setSaldoCaja(parseFloat(fila.saldo_caja) || 0);
        setSaldoBanco(parseFloat(fila.saldo_banco) || 0);
        setSaldoId(fila.id);
      } else {
        setSaldoCaja(0); setSaldoBanco(0); setSaldoId(null);
      }
      setTraslados((trasl || []).map(t => ({
        id: t.id, de: t.de, a: t.a, valor: parseFloat(t.valor) || 0,
        observaciones: t.observaciones, fecha: t.fecha
      })));
    } catch {}
  };

  const persistirSaldo = async (nuevoCaja, nuevoBanco) => {
    try {
      if (saldoId) {
        await administracionService.actualizarSaldos(saldoId, {
          saldo_caja: nuevoCaja, saldo_banco: nuevoBanco
        });
      } else {
        const s = await administracionService.crearSaldos({
          pais_id: paisId, saldo_caja: nuevoCaja, saldo_banco: nuevoBanco
        });
        if (s && s.id) setSaldoId(s.id);
      }
    } catch { toast.error("Movement saved, but balance could not be updated"); }
  };

  const cargarGastosMes = useCallback(async () => {
    try {
      const d = await administracionService.getDetallePresupuesto(paisId, mes, año);
      setGastos(d.map(x => ({
        id: x.id, concepto: x.concepto, monto: parseFloat(x.monto),
        tipo: x.tipo, fecha: x.fecha_registro?.split('T')[0] || new Date().toISOString().split('T')[0]
      })));
    } catch {}
  }, [paisId, mes, año]);

  const cargarIngresosMes = useCallback(async () => {
    try {
      const d = await administracionService.getIngresos(paisId, mes, año);
      setIngresos((d || []).map(x => ({
        id: x.id, fecha: x.fecha, tipo: x.tipo, origen: x.origen,
        dondeIngresa: x.donde_ingresa, valorRecibido: x.valor,
        observaciones: x.observaciones
      })));
    } catch {}
  }, [paisId, mes, año]);

  useEffect(() => { cargarGastosMes(); cargarIngresosMes(); }, [mes, cargarGastosMes, cargarIngresosMes]);

  // Totales
  const totalIngresos  = ingresos.reduce((s, i) => s + parseFloat(i.valorRecibido || 0), 0);
  const totalGastos    = gastos.reduce((s, g) => s + g.monto, 0);
  const totalTraslados = traslados.length;
  const saldoNeto      = totalIngresos - totalGastos;

  const gastosFiltrados = gastos.filter(g => {
    const matchBusq = g.concepto?.toLowerCase().includes(busqueda.toLowerCase());
    const matchTipo = filtroTipo ? g.tipo === filtroTipo : true;
    return matchBusq && matchTipo;
  });

  const guardarTraslado = async () => {
    if (!nuevoTraslado.valor) { toast.error("Enter an amount"); return; }
    const val = parseFloat(nuevoTraslado.valor);
    try {
      const creado = await administracionService.crearTraslado({
        pais_id: paisId, de: nuevoTraslado.de, a: nuevoTraslado.a,
        valor: val, observaciones: nuevoTraslado.observaciones, fecha: nuevoTraslado.fecha
      });
      setTraslados([{
        id: creado?.id ?? Date.now(), de: nuevoTraslado.de, a: nuevoTraslado.a,
        valor: val, observaciones: nuevoTraslado.observaciones, fecha: nuevoTraslado.fecha
      }, ...traslados]);
      const nuevoCaja  = saldoCaja  + (nuevoTraslado.a === "caja"  ? val : 0) - (nuevoTraslado.de === "caja"  ? val : 0);
      const nuevoBanco = saldoBanco + (nuevoTraslado.a === "banco" ? val : 0) - (nuevoTraslado.de === "banco" ? val : 0);
      setSaldoCaja(nuevoCaja); setSaldoBanco(nuevoBanco);
      await persistirSaldo(nuevoCaja, nuevoBanco);
      toast.success("Transfer recorded");
      setModalTraslado(false);
      setNuevoTraslado({ de:"banco", a:"caja", valor:"", observaciones:"", fecha: new Date().toISOString().split('T')[0] });
    } catch { toast.error("Error saving transfer"); }
  };

  const guardarIngreso = async () => {
    if (!nuevoIngreso.valorRecibido) { toast.error("Enter the amount received"); return; }
    const val = parseFloat(nuevoIngreso.valorRecibido);
    try {
      const creado = await administracionService.crearIngreso({
        pais_id: paisId, mes: MESES.indexOf(mes) + 1, anio: año,
        tipo: nuevoIngreso.tipo, origen: nuevoIngreso.origen,
        donde_ingresa: nuevoIngreso.dondeIngresa, valor: val,
        observaciones: nuevoIngreso.observaciones, fecha: nuevoIngreso.fecha
      });
      setIngresos([{
        id: creado?.id ?? Date.now(), fecha: nuevoIngreso.fecha, tipo: nuevoIngreso.tipo,
        origen: nuevoIngreso.origen, dondeIngresa: nuevoIngreso.dondeIngresa,
        valorRecibido: val, observaciones: nuevoIngreso.observaciones
      }, ...ingresos]);
      const nuevoCaja  = saldoCaja  + (nuevoIngreso.dondeIngresa === "caja"  ? val : 0);
      const nuevoBanco = saldoBanco + (nuevoIngreso.dondeIngresa === "banco" ? val : 0);
      setSaldoCaja(nuevoCaja); setSaldoBanco(nuevoBanco);
      await persistirSaldo(nuevoCaja, nuevoBanco);
      toast.success("Income recorded");
      setModalIngreso(false);
      setNuevoIngreso({ tipo:"RC-1-Recibo de caja", origen:"World Olivet Assembly", dondeIngresa:"banco", valorRecibido:"", observaciones:"", fecha: new Date().toISOString().split('T')[0] });
    } catch { toast.error("Error saving income"); }
  };

  const guardarGasto = async () => {
    if (!nuevoGasto.descripcion || !nuevoGasto.valorUnitario) { toast.error("Complete the required fields"); return; }
    const total = (parseFloat(nuevoGasto.valorUnitario) * parseInt(nuevoGasto.cantidad)) - parseFloat(nuevoGasto.descuento || 0);
    try {
      const g = await administracionService.agregarItemPresupuesto({
        pais_id: paisId, mes, anio: año,
        tipo: nuevoGasto.tipo || "otro_gasto",
        concepto: `${nuevoGasto.descripcion}${nuevoGasto.proveedor ? ` — ${nuevoGasto.proveedor}` : ""}`,
        monto: total, moneda: "DOP", tasa_cambio: tasaCambio
      });
      setGastos([{ id: g.id, concepto: g.concepto || nuevoGasto.descripcion, monto: total, tipo: nuevoGasto.tipo || "otro_gasto", fecha: nuevoGasto.fecha }, ...gastos]);
      toast.success("Expense saved");
      setModalGasto(false);
      setNuevoGasto({ tipo:"", fecha: new Date().toISOString().split('T')[0], proveedor:"", categoria:"", descripcion:"", cantidad:1, valorUnitario:0, descuento:0, formaPago:"Cash", observaciones:"" });
    } catch { toast.error("Error saving expense"); }
  };

  const eliminarGasto = async (id) => {
    if (!window.confirm("Delete this expense?")) return;
    try {
      await administracionService.eliminarItemPresupuesto(id);
      setGastos(gastos.filter(g => g.id !== id));
      toast.success("Deleted");
    } catch { toast.error("Error deleting"); }
  };

  const nav = [
    { key:"dashboard",  icon:<FaHome />,              label:"Dashboard"    },
    { key:"cajas",      icon:<FaUniversity />,         label:"Cash & Banks" },
    { key:"traslados",  icon:<FaExchangeAlt />,        label:"Transfers"    },
    { key:"ingresos",   icon:<FaArrowDown />,          label:"Income"       },
    { key:"gastos",     icon:<FaFileInvoiceDollar />,  label:"Expenses"     },
    { key:"reporte",    icon:<FaChartBar />,           label:"Reports"      },
  ];

  const inputCls = { width:"100%", padding:"9px 12px", border:"1.5px solid #dde3ef", borderRadius:"8px", fontSize:"13px", fontFamily:"'Lato', sans-serif", color:"#1a2d5a", outline:"none", boxSizing:"border-box", marginBottom:"12px" };
  const labelCls = { display:"block", fontSize:"11px", fontWeight:"700", color:"#5a6a85", letterSpacing:"0.8px", textTransform:"uppercase", marginBottom:"5px" };

  return (
    <div style={{ display:"flex", height:"100vh", fontFamily:"'Lato', sans-serif", background:"#f4f6fb", overflow:"hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Lato:wght@300;400;700&display=swap');
        .adm-nav { display:flex; align-items:center; gap:10px; padding:12px 20px; color:rgba(255,255,255,0.65); font-size:13px; font-weight:600; cursor:pointer; border-left:3px solid transparent; transition:all 0.2s; }
        .adm-nav:hover { background:rgba(255,255,255,0.08); color:white; }
        .adm-nav.active { background:rgba(255,255,255,0.12); color:white; border-left-color:white; }
        .adm-btn { display:inline-flex; align-items:center; gap:6px; padding:8px 16px; border:none; border-radius:8px; font-family:'Lato',sans-serif; font-size:12px; font-weight:700; cursor:pointer; transition:all 0.2s; }
        .adm-btn:hover { transform:translateY(-1px); box-shadow:0 3px 10px rgba(0,0,0,0.12); }
        .adm-btn-p { background:${P}; color:white; }
        .adm-btn-s { background:#4CAF50; color:white; }
        .adm-btn-d { background:#f44336; color:white; }
        .adm-btn-o { background:#f0f4fa; color:#5a6a85; }
        .adm-btn-sm { padding:5px 12px; font-size:11px; }
        .adm-card { background:white; border-radius:12px; border:1px solid #e8edf5; margin-bottom:20px; }
        .adm-card-hdr { padding:16px 22px; border-bottom:1px solid #e8edf5; display:flex; align-items:center; justify-content:space-between; }
        .adm-card-ttl { font-family:'Cinzel',serif; font-size:14px; color:#1a2d5a; font-weight:600; margin:0; }
        .adm-table { width:100%; border-collapse:collapse; }
        .adm-table th { padding:10px 18px; text-align:left; font-size:11px; font-weight:700; letter-spacing:0.8px; text-transform:uppercase; color:#8a97b0; border-bottom:2px solid #e8edf5; background:#fafbfd; }
        .adm-table td { padding:13px 18px; font-size:13px; color:#1a2d5a; border-bottom:1px solid #f0f4fa; }
        .adm-table tr:last-child td { border-bottom:none; }
        .adm-table tr:hover td { background:#f8faff; }
        .adm-input:focus { border-color:${P} !important; box-shadow:0 0 0 3px rgba(26,84,144,0.08); }
        .adm-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.45); display:flex; align-items:center; justify-content:center; z-index:1000; padding:20px; }
        .adm-modal { background:white; border-radius:14px; width:100%; max-width:580px; max-height:90vh; overflow-y:auto; box-shadow:0 20px 60px rgba(0,0,0,0.2); }
        .adm-modal-hdr { padding:18px 24px; border-bottom:1px solid #e8edf5; display:flex; align-items:center; justify-content:space-between; position:sticky; top:0; background:white; z-index:1; }
        .adm-modal-ttl { font-family:'Cinzel',serif; font-size:15px; color:${P}; margin:0; }
        .adm-modal-body { padding:20px 24px; }
        .adm-modal-ftr { padding:14px 24px; border-top:1px solid #e8edf5; display:flex; gap:10px; }
        .adm-stat { background:white; border-radius:12px; border:1px solid #e8edf5; padding:18px 20px; }
        .adm-stat-lbl { font-size:11px; color:#8a97b0; text-transform:uppercase; letter-spacing:0.8px; margin-bottom:6px; }
        .adm-stat-val { font-size:22px; font-weight:700; }
        .adm-mes-btn { padding:6px 12px; border:1.5px solid #dde3ef; background:white; color:#8a97b0; font-size:11px; font-weight:700; border-radius:6px; cursor:pointer; font-family:'Lato',sans-serif; transition:all 0.15s; }
        .adm-mes-btn:hover { border-color:${P}; color:${P}; }
        .adm-mes-btn.active { background:${P}; color:white; border-color:${P}; }
        .adm-badge { display:inline-flex; align-items:center; padding:3px 10px; border-radius:99px; font-size:10px; font-weight:700; }
        .adm-badge-in  { background:#e8f5e9; color:#2e7d32; }
        .adm-badge-out { background:#ffebee; color:#c62828; }
        .adm-badge-tr  { background:#e3f2fd; color:#1565c0; }
        .adm-section-divider { font-size:11px; font-weight:700; color:rgba(255,255,255,0.4); letter-spacing:1px; text-transform:uppercase; padding:12px 20px 4px; }
        .adm-back { display:flex; align-items:center; gap:6px; padding:14px 20px; color:rgba(255,255,255,0.5); font-size:12px; cursor:pointer; border-top:1px solid rgba(255,255,255,0.1); margin-top:auto; transition:color 0.2s; }
        .adm-back:hover { color:white; }
      `}</style>

      {/* ── SIDEBAR ── */}
      <div style={{ width:220, background:P, display:"flex", flexDirection:"column", flexShrink:0 }}>
        <div style={{ padding:"22px 20px 16px", borderBottom:"1px solid rgba(255,255,255,0.12)" }}>
          <h2 style={{ fontFamily:"'Cinzel',serif", fontSize:13, color:"white", margin:"0 0 4px", letterSpacing:1 }}>Administration</h2>
          <p style={{ fontSize:11, color:"rgba(255,255,255,0.5)", margin:0 }}>{paisNombre} · {año}</p>
        </div>

        <nav style={{ paddingTop:8 }}>
          <div className="adm-section-divider">Main</div>
          {nav.map(item => (
            <div key={item.key} className={`adm-nav ${seccion===item.key?"active":""}`} onClick={()=>setSeccion(item.key)}>
              <span style={{ fontSize:14, width:18, textAlign:"center" }}>{item.icon}</span>
              {item.label}
            </div>
          ))}
          <div className="adm-section-divider" style={{ marginTop:8 }}>Regional</div>
          <div className="adm-nav" onClick={()=>navigate("/informe-regional")}>
            <span style={{ fontSize:14, width:18, textAlign:"center" }}><FaGlobe /></span>
            HQ Report
          </div>
        </nav>

        {/* Tasa de cambio */}
        <div style={{ padding:"14px 20px", borderTop:"1px solid rgba(255,255,255,0.1)", marginTop:"auto" }}>
          <div style={{ fontSize:10, color:"rgba(255,255,255,0.4)", letterSpacing:1, textTransform:"uppercase", marginBottom:6 }}>Exchange Rate</div>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <FaDollarSign style={{ color:"rgba(255,255,255,0.5)", fontSize:11 }} />
            <span style={{ color:"rgba(255,255,255,0.6)", fontSize:11 }}>1 USD =</span>
            <input type="number" step="0.01" value={tasaCambio}
              onChange={e => { setTasaCambio(parseFloat(e.target.value)); administracionService.actualizarTasaCambio(parseFloat(e.target.value)).catch(()=>{}); }}
              style={{ background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.2)", borderRadius:6, color:"white", fontSize:13, fontWeight:700, width:60, padding:"3px 6px", textAlign:"center", outline:"none", fontFamily:"'Lato',sans-serif" }} />
            <span style={{ color:"rgba(255,255,255,0.6)", fontSize:11 }}>DOP</span>
          </div>
        </div>

        <div className="adm-back" onClick={()=>navigate("/home")}>
          <FaArrowLeft style={{ fontSize:11 }} /> Back to Home
        </div>
      </div>

      {/* ── MAIN ── */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>

        {/* TOPBAR */}
        <div style={{ background:"white", borderBottom:"1px solid #e8edf5", padding:"0 28px", height:60, display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
          <span style={{ fontFamily:"'Cinzel',serif", fontSize:16, color:"#1a2d5a", fontWeight:600 }}>
            { seccion==="dashboard" ? "Dashboard"
            : seccion==="cajas"     ? "Cash & Banks"
            : seccion==="traslados" ? "Money Transfers"
            : seccion==="ingresos"  ? "Income — Cash Receipts"
            : seccion==="gastos"    ? "Purchases & Expenses"
            :                         "Reports" }
          </span>
          <div style={{ display:"flex", gap:10 }}>
            { seccion==="traslados" && <button className="adm-btn adm-btn-p adm-btn-sm" onClick={()=>setModalTraslado(true)}><FaPlus /> New Transfer</button> }
            { seccion==="ingresos"  && <button className="adm-btn adm-btn-s adm-btn-sm" onClick={()=>setModalIngreso(true)}><FaPlus /> New Receipt</button> }
            { seccion==="gastos"    && <button className="adm-btn adm-btn-p adm-btn-sm" onClick={()=>setModalGasto(true)}><FaPlus /> New Expense</button> }
          </div>
        </div>

        {/* MES SELECTOR */}
        <div style={{ background:"white", borderBottom:"1px solid #e8edf5", padding:"10px 28px", display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", flexShrink:0 }}>
          <span style={{ fontSize:11, fontWeight:700, color:"#8a97b0", letterSpacing:1, textTransform:"uppercase", marginRight:4 }}>Month:</span>
          {MESES.map(m => (
            <button key={m} className={`adm-mes-btn ${mes===m?"active":""}`} onClick={()=>setMes(m)}>
              {MES_EN[m].slice(0,3)}
            </button>
          ))}
        </div>

        {/* CONTENT */}
        <div style={{ flex:1, overflowY:"auto", padding:"24px 28px" }}>

          {/* ── DASHBOARD ── */}
          {seccion==="dashboard" && (
            <>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:20 }}>
                <div className="adm-stat">
                  <div className="adm-stat-lbl">Cash Available</div>
                  <div className="adm-stat-val" style={{ color:"#4CAF50" }}>${saldoCaja.toLocaleString()}</div>
                  <div style={{ fontSize:11, color:"#b0bcd0", marginTop:4 }}>DOP · Petty Cash</div>
                </div>
                <div className="adm-stat">
                  <div className="adm-stat-lbl">Bank Balance</div>
                  <div className="adm-stat-val" style={{ color:P }}>${saldoBanco.toLocaleString()}</div>
                  <div style={{ fontSize:11, color:"#b0bcd0", marginTop:4 }}>DOP · Bank Account</div>
                </div>
                <div className="adm-stat">
                  <div className="adm-stat-lbl">Total Income</div>
                  <div className="adm-stat-val" style={{ color:"#4CAF50" }}>${totalIngresos.toLocaleString()}</div>
                  <div style={{ fontSize:11, color:"#b0bcd0", marginTop:4 }}>{ingresos.length} receipt{ingresos.length!==1?"s":""}</div>
                </div>
                <div className="adm-stat">
                  <div className="adm-stat-lbl">Total Expenses</div>
                  <div className="adm-stat-val" style={{ color:"#f44336" }}>${totalGastos.toLocaleString()}</div>
                  <div style={{ fontSize:11, color:"#b0bcd0", marginTop:4 }}>{gastos.length} record{gastos.length!==1?"s":""}</div>
                </div>
              </div>

              {/* Balance neto */}
              <div className="adm-card">
                <div className="adm-card-hdr">
                  <h3 className="adm-card-ttl">Net Balance — {MES_EN[mes]} {año}</h3>
                </div>
                <div style={{ padding:"24px", display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:24 }}>
                  <div style={{ textAlign:"center" }}>
                    <div style={{ fontSize:11, color:"#8a97b0", marginBottom:6, textTransform:"uppercase", letterSpacing:0.8 }}>Income</div>
                    <div style={{ fontSize:32, fontWeight:700, color:"#4CAF50" }}>${totalIngresos.toLocaleString()}</div>
                  </div>
                  <div style={{ textAlign:"center" }}>
                    <div style={{ fontSize:11, color:"#8a97b0", marginBottom:6, textTransform:"uppercase", letterSpacing:0.8 }}>Expenses</div>
                    <div style={{ fontSize:32, fontWeight:700, color:"#f44336" }}>${totalGastos.toLocaleString()}</div>
                  </div>
                  <div style={{ textAlign:"center", borderLeft:"2px solid #eef2f7", paddingLeft:24 }}>
                    <div style={{ fontSize:11, color:"#8a97b0", marginBottom:6, textTransform:"uppercase", letterSpacing:0.8 }}>Net Balance</div>
                    <div style={{ fontSize:32, fontWeight:700, color:saldoNeto>=0?"#4CAF50":"#f44336" }}>
                      {saldoNeto<0?"-":""}${Math.abs(saldoNeto).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick actions */}
              <div className="adm-card">
                <div className="adm-card-hdr"><h3 className="adm-card-ttl">Quick Actions</h3></div>
                <div style={{ padding:"20px 24px", display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
                  {[
                    { icon:<FaArrowDown />, label:"Register Income",   color:"#4CAF50", action:()=>{setSeccion("ingresos"); setModalIngreso(true);} },
                    { icon:<FaFileInvoiceDollar />, label:"Register Expense", color:P, action:()=>{setSeccion("gastos"); setModalGasto(true);} },
                    { icon:<FaExchangeAlt />, label:"Transfer Money",  color:"#FF9800", action:()=>{setSeccion("traslados"); setModalTraslado(true);} },
                  ].map(a => (
                    <button key={a.label} onClick={a.action} style={{ padding:"18px", background:`${a.color}12`, border:`1.5px solid ${a.color}30`, borderRadius:12, cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:10, transition:"all 0.2s", fontFamily:"'Lato',sans-serif" }}
                      onMouseOver={e=>e.currentTarget.style.background=`${a.color}22`}
                      onMouseOut={e=>e.currentTarget.style.background=`${a.color}12`}>
                      <span style={{ fontSize:24, color:a.color }}>{a.icon}</span>
                      <span style={{ fontSize:12, fontWeight:700, color:"#1a2d5a" }}>{a.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ── CAJAS Y BANCOS ── */}
          {seccion==="cajas" && (
            <div className="adm-card">
              <div className="adm-card-hdr"><h3 className="adm-card-ttl">Bank Accounts & Cash</h3></div>
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Account Code</th>
                    <th>Account / Cash Register</th>
                    <th style={{ textAlign:"right" }}>Balance (DOP)</th>
                    <th style={{ textAlign:"center" }}>Type</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ color:"#8a97b0", fontSize:12 }}>11050501</td>
                    <td style={{ fontWeight:700 }}>Petty Cash</td>
                    <td style={{ textAlign:"right", fontWeight:700, color:"#4CAF50", fontSize:16 }}>${saldoCaja.toLocaleString()}</td>
                    <td style={{ textAlign:"center" }}><span className="adm-badge adm-badge-in">Cash</span></td>
                  </tr>
                  <tr>
                    <td style={{ color:"#8a97b0", fontSize:12 }}>11200501</td>
                    <td style={{ fontWeight:700 }}>Bank Account (Savings)</td>
                    <td style={{ textAlign:"right", fontWeight:700, color:P, fontSize:16 }}>${saldoBanco.toLocaleString()}</td>
                    <td style={{ textAlign:"center" }}><span className="adm-badge adm-badge-tr">Bank</span></td>
                  </tr>
                  <tr style={{ background:"#f0f4fa" }}>
                    <td colSpan={2} style={{ fontWeight:700, color:"#5a6a85", fontSize:12, textTransform:"uppercase" }}>Total</td>
                    <td style={{ textAlign:"right", fontWeight:700, fontSize:18, color:P }}>${(saldoCaja+saldoBanco).toLocaleString()}</td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* ── TRASLADOS ── */}
          {seccion==="traslados" && (
            <div className="adm-card">
              <div className="adm-card-hdr">
                <h3 className="adm-card-ttl">Money Transfers</h3>
                <span style={{ fontSize:12, color:"#8a97b0" }}>Record cash withdrawals and transfers between accounts</span>
              </div>
              {traslados.length===0 ? (
                <div style={{ padding:"48px", textAlign:"center", color:"#b0bcd0" }}>
                  <FaExchangeAlt style={{ fontSize:36, marginBottom:12, opacity:0.3 }} />
                  <div style={{ fontWeight:700 }}>No transfers recorded</div>
                </div>
              ) : (
                <table className="adm-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>From</th>
                      <th>To</th>
                      <th style={{ textAlign:"right" }}>Amount (DOP)</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {traslados.map(t => (
                      <tr key={t.id}>
                        <td style={{ color:"#8a97b0", fontSize:12 }}>{t.fecha}</td>
                        <td style={{ fontWeight:600 }}>{t.de==="banco"?"Bank Account":"Petty Cash"}</td>
                        <td style={{ fontWeight:600 }}>{t.a==="caja"?"Petty Cash":"Bank Account"}</td>
                        <td style={{ textAlign:"right", fontWeight:700, color:"#FF9800" }}>${t.valor.toLocaleString()}</td>
                        <td style={{ color:"#8a97b0", fontSize:12 }}>{t.observaciones||"—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* ── INGRESOS ── */}
          {seccion==="ingresos" && (
            <div className="adm-card">
              <div className="adm-card-hdr">
                <h3 className="adm-card-ttl">Cash Receipts — Income</h3>
                <span style={{ fontSize:12, color:"#8a97b0" }}>Record money received from headquarters</span>
              </div>
              {ingresos.length===0 ? (
                <div style={{ padding:"48px", textAlign:"center", color:"#b0bcd0" }}>
                  <FaArrowDown style={{ fontSize:36, marginBottom:12, opacity:0.3 }} />
                  <div style={{ fontWeight:700 }}>No income recorded</div>
                </div>
              ) : (
                <table className="adm-table">
                  <thead>
                    <tr>
                      <th>No.</th>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Origin</th>
                      <th>Where</th>
                      <th style={{ textAlign:"right" }}>Amount (DOP)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ingresos.map((ing,i) => (
                      <tr key={ing.id}>
                        <td style={{ color:"#8a97b0", fontSize:12 }}>RC-{i+1}</td>
                        <td style={{ color:"#8a97b0", fontSize:12 }}>{ing.fecha}</td>
                        <td>{ing.tipo}</td>
                        <td style={{ fontWeight:600 }}>{ing.origen}</td>
                        <td><span className="adm-badge adm-badge-tr">{ing.dondeIngresa==="caja"?"Petty Cash":"Bank"}</span></td>
                        <td style={{ textAlign:"right", fontWeight:700, color:"#4CAF50" }}>${parseFloat(ing.valorRecibido).toLocaleString()}</td>
                      </tr>
                    ))}
                    <tr style={{ background:"#f0f4fa" }}>
                      <td colSpan={5} style={{ fontWeight:700, color:"#5a6a85", fontSize:12, textTransform:"uppercase" }}>Total Income</td>
                      <td style={{ textAlign:"right", fontWeight:700, fontSize:16, color:"#4CAF50" }}>${totalIngresos.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* ── GASTOS ── */}
          {seccion==="gastos" && (
            <>
              {/* Filtros estilo Siigo */}
              <div style={{ background:"white", borderRadius:12, border:"1px solid #e8edf5", padding:"16px 20px", marginBottom:16 }}>
                <div style={{ display:"flex", alignItems:"center", gap:4, marginBottom:12, fontSize:12, color:"#8a97b0", cursor:"pointer" }}>
                  <FaFilter /> Hide search criteria
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
                  <div>
                    <label style={labelCls}>Search</label>
                    <div style={{ display:"flex", alignItems:"center", gap:8, border:"1.5px solid #dde3ef", borderRadius:8, padding:"8px 12px" }}>
                      <FaSearch style={{ color:"#b0bcd0", fontSize:13 }} />
                      <input type="text" placeholder="Description..." value={busqueda} onChange={e=>setBusqueda(e.target.value)}
                        style={{ border:"none", outline:"none", fontSize:13, fontFamily:"'Lato',sans-serif", color:"#1a2d5a", width:"100%" }} />
                    </div>
                  </div>
                  <div>
                    <label style={labelCls}>Transaction Type</label>
                    <select value={filtroTipo} onChange={e=>setFiltroTipo(e.target.value)}
                      style={{ ...inputCls, marginBottom:0 }} className="adm-input">
                      <option value="">All</option>
                      <option value="gasto_fijo">Fixed Expense</option>
                      <option value="pago_misionero">Missionary Payment</option>
                      <option value="otro_gasto">Other Expense</option>
                    </select>
                  </div>
                  <div style={{ display:"flex", alignItems:"flex-end", gap:10 }}>
                    <button className="adm-btn adm-btn-p" style={{ flex:1, justifyContent:"center" }}>Search</button>
                    <button className="adm-btn adm-btn-o" onClick={()=>{setBusqueda(""); setFiltroTipo("");}}>Clear</button>
                  </div>
                </div>
              </div>

              <div className="adm-card">
                <div className="adm-card-hdr">
                  <h3 className="adm-card-ttl">Purchases, Expenses — {MES_EN[mes]}</h3>
                  <span style={{ fontSize:12, color:"#8a97b0" }}>{gastosFiltrados.length} records</span>
                </div>
                {gastosFiltrados.length===0 ? (
                  <div style={{ padding:"48px", textAlign:"center", color:"#b0bcd0" }}>
                    <FaFileInvoiceDollar style={{ fontSize:36, marginBottom:12, opacity:0.3 }} />
                    <div style={{ fontWeight:700 }}>No expenses found</div>
                  </div>
                ) : (
                  <table className="adm-table">
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Receipt No.</th>
                        <th>Date</th>
                        <th>Description</th>
                        <th style={{ textAlign:"right" }}>Amount (DOP)</th>
                        <th style={{ textAlign:"center", width:60 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {gastosFiltrados.map((g,i) => (
                        <tr key={g.id}>
                          <td><span className="adm-badge adm-badge-out">
                            { g.tipo==="gasto_fijo"?"Fixed"
                            : g.tipo==="pago_misionero"?"Missionary"
                            : "Other" }
                          </span></td>
                          <td style={{ color:`${P}`, fontWeight:600, fontSize:12 }}>RP-{año}-{String(i+1).padStart(4,"0")}</td>
                          <td style={{ color:"#8a97b0", fontSize:12 }}>{g.fecha}</td>
                          <td style={{ fontWeight:600 }}>{g.concepto}</td>
                          <td style={{ textAlign:"right", fontWeight:700, color:"#f44336" }}>${g.monto.toLocaleString()}</td>
                          <td style={{ textAlign:"center" }}>
                            <button onClick={()=>eliminarGasto(g.id)} style={{ background:"none", border:"none", color:"#f44336", cursor:"pointer", fontSize:14 }}><FaTrash /></button>
                          </td>
                        </tr>
                      ))}
                      <tr style={{ background:"#f0f4fa" }}>
                        <td colSpan={4} style={{ fontWeight:700, color:"#5a6a85", fontSize:12, textTransform:"uppercase" }}>Total Expenses</td>
                        <td style={{ textAlign:"right", fontWeight:700, fontSize:16, color:"#f44336" }}>${totalGastos.toLocaleString()}</td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}

          {/* ── REPORTES ── */}
          {seccion==="reporte" && (
            <div className="adm-card">
              <div className="adm-card-hdr"><h3 className="adm-card-ttl">Financial Reports</h3></div>
              <div style={{ padding:"20px 24px" }}>
                {[
                  { grupo:"Accounting", items:["Account List","Detailed Vouchers","Voucher Sequence","Financial Movement Report"] },
                  { grupo:"Financial", items:["Financial Situation Statement","Trial Balance","Income Statement"] },
                  { grupo:"Balances", items:["General Trial Balance","Balance by Country","Balance by Missionary"] },
                ].map(g => (
                  <div key={g.grupo} style={{ marginBottom:24 }}>
                    <div style={{ fontWeight:700, color:"#1a2d5a", fontSize:13, marginBottom:10, fontFamily:"'Cinzel',serif" }}>{g.grupo}</div>
                    {g.items.map(item => (
                      <div key={item} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 0", borderBottom:"1px solid #f0f4fa", cursor:"pointer" }}
                        onMouseOver={e=>e.currentTarget.style.paddingLeft="8px"}
                        onMouseOut={e=>e.currentTarget.style.paddingLeft="0"}>
                        <span style={{ fontSize:13, color:"#5a6a85", transition:"all 0.2s" }}>{item}</span>
                        <FaFileAlt style={{ color:"#b0bcd0", fontSize:12 }} />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── MODAL TRASLADO ── */}
      {modalTraslado && (
        <div className="adm-overlay" onClick={()=>setModalTraslado(false)}>
          <div className="adm-modal" onClick={e=>e.stopPropagation()}>
            <div className="adm-modal-hdr">
              <h3 className="adm-modal-ttl">New Money Transfer</h3>
              <button onClick={()=>setModalTraslado(false)} style={{ background:"none", border:"none", fontSize:18, cursor:"pointer", color:"#8a97b0" }}><FaTimes /></button>
            </div>
            <div className="adm-modal-body">
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
                <div>
                  <label style={labelCls}>From</label>
                  <select value={nuevoTraslado.de} onChange={e=>setNuevoTraslado({...nuevoTraslado, de:e.target.value})} style={{...inputCls, marginBottom:0}} className="adm-input">
                    <option value="banco">Bank Account</option>
                    <option value="caja">Petty Cash</option>
                  </select>
                </div>
                <div>
                  <label style={labelCls}>To</label>
                  <select value={nuevoTraslado.a} onChange={e=>setNuevoTraslado({...nuevoTraslado, a:e.target.value})} style={{...inputCls, marginBottom:0}} className="adm-input">
                    <option value="caja">Petty Cash</option>
                    <option value="banco">Bank Account</option>
                  </select>
                </div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
                <div>
                  <label style={labelCls}>Date</label>
                  <input type="date" value={nuevoTraslado.fecha} onChange={e=>setNuevoTraslado({...nuevoTraslado, fecha:e.target.value})} style={{...inputCls, marginBottom:0}} className="adm-input" />
                </div>
                <div>
                  <label style={labelCls}>Amount (DOP)</label>
                  <input type="number" placeholder="0.00" value={nuevoTraslado.valor} onChange={e=>setNuevoTraslado({...nuevoTraslado, valor:e.target.value})} style={{...inputCls, marginBottom:0}} className="adm-input" />
                </div>
              </div>
              <label style={labelCls}>Notes</label>
              <textarea value={nuevoTraslado.observaciones} onChange={e=>setNuevoTraslado({...nuevoTraslado, observaciones:e.target.value})}
                style={{...inputCls, minHeight:70, resize:"vertical", marginBottom:0}} className="adm-input" placeholder="Optional notes..." />
            </div>
            <div className="adm-modal-ftr">
              <button className="adm-btn adm-btn-p" style={{ flex:1, justifyContent:"center" }} onClick={guardarTraslado}><FaSave /> Save</button>
              <button className="adm-btn adm-btn-o" style={{ flex:1, justifyContent:"center" }} onClick={()=>setModalTraslado(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL INGRESO ── */}
      {modalIngreso && (
        <div className="adm-overlay" onClick={()=>setModalIngreso(false)}>
          <div className="adm-modal" onClick={e=>e.stopPropagation()}>
            <div className="adm-modal-hdr">
              <h3 className="adm-modal-ttl">New Cash Receipt — Income</h3>
              <button onClick={()=>setModalIngreso(false)} style={{ background:"none", border:"none", fontSize:18, cursor:"pointer", color:"#8a97b0" }}><FaTimes /></button>
            </div>
            <div className="adm-modal-body">
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <div>
                  <label style={labelCls}>Type</label>
                  <select value={nuevoIngreso.tipo} onChange={e=>setNuevoIngreso({...nuevoIngreso, tipo:e.target.value})} style={{...inputCls}} className="adm-input">
                    <option>RC-1-Recibo de caja</option>
                    <option>RC-2-Advance</option>
                    <option>RC-3-Other</option>
                  </select>
                </div>
                <div>
                  <label style={labelCls}>Date</label>
                  <input type="date" value={nuevoIngreso.fecha} onChange={e=>setNuevoIngreso({...nuevoIngreso, fecha:e.target.value})} style={{...inputCls}} className="adm-input" />
                </div>
              </div>
              <label style={labelCls}>Origin (Client / Sender)</label>
              <input type="text" value={nuevoIngreso.origen} onChange={e=>setNuevoIngreso({...nuevoIngreso, origen:e.target.value})} style={{...inputCls}} className="adm-input" placeholder="e.g. World Olivet Assembly INC" />
              <label style={labelCls}>Where the money enters</label>
              <select value={nuevoIngreso.dondeIngresa} onChange={e=>setNuevoIngreso({...nuevoIngreso, dondeIngresa:e.target.value})} style={{...inputCls}} className="adm-input">
                <option value="banco">Bank Account</option>
                <option value="caja">Petty Cash</option>
              </select>
              <label style={labelCls}>Amount Received (DOP)</label>
              <input type="number" placeholder="0.00" value={nuevoIngreso.valorRecibido} onChange={e=>setNuevoIngreso({...nuevoIngreso, valorRecibido:e.target.value})} style={{...inputCls}} className="adm-input" />
              <label style={labelCls}>Notes</label>
              <textarea value={nuevoIngreso.observaciones} onChange={e=>setNuevoIngreso({...nuevoIngreso, observaciones:e.target.value})}
                style={{...inputCls, minHeight:70, resize:"vertical", marginBottom:0}} className="adm-input" placeholder="Optional notes..." />
            </div>
            <div className="adm-modal-ftr">
              <button className="adm-btn adm-btn-s" style={{ flex:1, justifyContent:"center" }} onClick={guardarIngreso}><FaSave /> Save & Record</button>
              <button className="adm-btn adm-btn-o" style={{ flex:1, justifyContent:"center" }} onClick={()=>setModalIngreso(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL GASTO (estilo factura de compra Siigo) ── */}
      {modalGasto && (
        <div className="adm-overlay" onClick={()=>setModalGasto(false)}>
          <div className="adm-modal" onClick={e=>e.stopPropagation()} style={{ maxWidth:640 }}>
            <div className="adm-modal-hdr">
              <h3 className="adm-modal-ttl">New Purchase / Expense</h3>
              <button onClick={()=>setModalGasto(false)} style={{ background:"none", border:"none", fontSize:18, cursor:"pointer", color:"#8a97b0" }}><FaTimes /></button>
            </div>
            <div className="adm-modal-body">
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
                <div>
                  <label style={labelCls}>Type</label>
                  <select value={nuevoGasto.tipo} onChange={e=>setNuevoGasto({...nuevoGasto, tipo:e.target.value})} style={{...inputCls}} className="adm-input">
                    <option value="">Select...</option>
                    <option value="gasto_fijo">Fixed Expense</option>
                    <option value="pago_misionero">Missionary Payment</option>
                    <option value="otro_gasto">Other Expense</option>
                  </select>
                </div>
                <div>
                  <label style={labelCls}>Date</label>
                  <input type="date" value={nuevoGasto.fecha} onChange={e=>setNuevoGasto({...nuevoGasto, fecha:e.target.value})} style={{...inputCls}} className="adm-input" />
                </div>
                <div>
                  <label style={labelCls}>Payment Method</label>
                  <select value={nuevoGasto.formaPago} onChange={e=>setNuevoGasto({...nuevoGasto, formaPago:e.target.value})} style={{...inputCls}} className="adm-input">
                    {FORMAS_PAGO.map(f=><option key={f}>{f}</option>)}
                  </select>
                </div>
              </div>
              <label style={labelCls}>Supplier / Provider</label>
              <input type="text" placeholder="e.g. Person or company name" value={nuevoGasto.proveedor} onChange={e=>setNuevoGasto({...nuevoGasto, proveedor:e.target.value})} style={{...inputCls}} className="adm-input" />
              <label style={labelCls}>Category</label>
              <select value={nuevoGasto.categoria} onChange={e=>setNuevoGasto({...nuevoGasto, categoria:e.target.value})} style={{...inputCls}} className="adm-input">
                <option value="">Select category...</option>
                {CATEGORIAS_GASTO.map(c=><option key={c.codigo} value={c.codigo}>{c.codigo} — {c.nombre}</option>)}
              </select>

              {/* Detalle del gasto */}
              <div style={{ border:"1px solid #e8edf5", borderRadius:8, overflow:"hidden", marginBottom:12 }}>
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                  <thead>
                    <tr style={{ background:"#fafbfd" }}>
                      <th style={{ padding:"8px 12px", fontSize:11, fontWeight:700, color:"#8a97b0", textAlign:"left", letterSpacing:0.8 }}>Description *</th>
                      <th style={{ padding:"8px 12px", fontSize:11, fontWeight:700, color:"#8a97b0", textAlign:"right", letterSpacing:0.8, width:70 }}>Qty</th>
                      <th style={{ padding:"8px 12px", fontSize:11, fontWeight:700, color:"#8a97b0", textAlign:"right", letterSpacing:0.8, width:100 }}>Unit Value</th>
                      <th style={{ padding:"8px 12px", fontSize:11, fontWeight:700, color:"#8a97b0", textAlign:"right", letterSpacing:0.8, width:80 }}>Discount</th>
                      <th style={{ padding:"8px 12px", fontSize:11, fontWeight:700, color:"#8a97b0", textAlign:"right", letterSpacing:0.8, width:100 }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding:"8px 12px" }}>
                        <input type="text" placeholder="Description..." value={nuevoGasto.descripcion} onChange={e=>setNuevoGasto({...nuevoGasto, descripcion:e.target.value})}
                          style={{ width:"100%", border:"none", outline:"none", fontSize:13, fontFamily:"'Lato',sans-serif", color:"#1a2d5a" }} />
                      </td>
                      <td style={{ padding:"8px 12px" }}>
                        <input type="number" value={nuevoGasto.cantidad} onChange={e=>setNuevoGasto({...nuevoGasto, cantidad:parseInt(e.target.value)||1})}
                          style={{ width:"100%", border:"none", outline:"none", fontSize:13, textAlign:"right", fontFamily:"'Lato',sans-serif", color:"#1a2d5a" }} />
                      </td>
                      <td style={{ padding:"8px 12px" }}>
                        <input type="number" step="0.01" value={nuevoGasto.valorUnitario} onChange={e=>setNuevoGasto({...nuevoGasto, valorUnitario:parseFloat(e.target.value)||0})}
                          style={{ width:"100%", border:"none", outline:"none", fontSize:13, textAlign:"right", fontFamily:"'Lato',sans-serif", color:"#1a2d5a" }} />
                      </td>
                      <td style={{ padding:"8px 12px" }}>
                        <input type="number" step="0.01" value={nuevoGasto.descuento} onChange={e=>setNuevoGasto({...nuevoGasto, descuento:parseFloat(e.target.value)||0})}
                          style={{ width:"100%", border:"none", outline:"none", fontSize:13, textAlign:"right", fontFamily:"'Lato',sans-serif", color:"#1a2d5a" }} />
                      </td>
                      <td style={{ padding:"8px 12px", textAlign:"right", fontWeight:700, color:P }}>
                        ${((nuevoGasto.valorUnitario*nuevoGasto.cantidad)-nuevoGasto.descuento).toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Totales estilo Siigo */}
              <div style={{ display:"flex", justifyContent:"flex-end" }}>
                <div style={{ width:220 }}>
                  {[
                    { label:"Gross Total", val: nuevoGasto.valorUnitario*nuevoGasto.cantidad },
                    { label:"Discounts",   val: nuevoGasto.descuento },
                    { label:"Subtotal",    val: (nuevoGasto.valorUnitario*nuevoGasto.cantidad)-nuevoGasto.descuento, bold:true },
                  ].map(r => (
                    <div key={r.label} style={{ display:"flex", justifyContent:"space-between", padding:"5px 0", borderBottom:"1px solid #f0f4fa" }}>
                      <span style={{ fontSize:12, color:"#8a97b0" }}>{r.label}:</span>
                      <span style={{ fontSize:r.bold?15:12, fontWeight:r.bold?700:400, color:r.bold?P:"#1a2d5a" }}>${r.val.toLocaleString()}</span>
                    </div>
                  ))}
                  <div style={{ display:"flex", justifyContent:"space-between", padding:"10px 0", marginTop:4 }}>
                    <span style={{ fontWeight:700, fontSize:13 }}>Total Neto:</span>
                    <span style={{ fontWeight:700, fontSize:18, color:P }}>${((nuevoGasto.valorUnitario*nuevoGasto.cantidad)-nuevoGasto.descuento).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <label style={labelCls}>Notes</label>
              <textarea value={nuevoGasto.observaciones} onChange={e=>setNuevoGasto({...nuevoGasto, observaciones:e.target.value})}
                style={{...inputCls, minHeight:60, resize:"vertical", marginBottom:0}} className="adm-input" placeholder="Optional notes..." />
            </div>
            <div className="adm-modal-ftr">
              <button className="adm-btn adm-btn-p" style={{ flex:1, justifyContent:"center" }} onClick={guardarGasto}><FaSave /> Save</button>
              <button className="adm-btn adm-btn-o" style={{ flex:1, justifyContent:"center" }} onClick={()=>setModalGasto(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
