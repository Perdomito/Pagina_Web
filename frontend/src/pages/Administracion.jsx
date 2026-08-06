import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaHome, FaUniversity, FaExchangeAlt, FaFileInvoiceDollar,
  FaListAlt, FaPlus, FaTrash, FaSearch, FaFilter, FaTimes,
  FaSave, FaArrowLeft, FaDollarSign, FaCheckCircle,
  FaTimesCircle, FaFileAlt, FaChartBar, FaGlobe,
  FaArrowDown, FaArrowUp, FaEdit, FaPrint
} from "react-icons/fa";
import toast from 'react-hot-toast';
import administracionService from '../services/AdministracionService';
import { useAuth } from '../context/AuthContext';
import { useIdioma } from '../context/IdiomaContext';

const P  = "#1a5490";
const PL = "#2a72b8";

const CATEGORIAS_GASTO = [
  { codigo: "51957001", nombre: "Iglesia" },
  { codigo: "51957002", nombre: "Casa (Alquiler, Luz, Internet, Agua, Gas, Gastos de Hogar, Mueble, Local)" },
  { codigo: "51957003", nombre: "Misión (Misión, Evangelismo, Trans. Evan.)" },
  { codigo: "51957004", nombre: "Misioneros (Pago Misionero, Comisión)" },
  { codigo: "51957005", nombre: "General (Comida, Salud, Transporte, Pagos Extras)" },
];

const FORMAS_PAGO = ["Efectivo", "Transferencia Bancaria", "Cheque", "Otro"];

const MESES = ["ENERO","FEBRERO","MARZO","ABRIL","MAYO","JUNIO","JULIO","AGOSTO","SEPTIEMBRE","OCTUBRE","NOVIEMBRE","DICIEMBRE"];
const MES_EN = { ENERO:"January",FEBRERO:"February",MARZO:"March",ABRIL:"April",MAYO:"May",JUNIO:"June",JULIO:"July",AGOSTO:"August",SEPTIEMBRE:"September",OCTUBRE:"October",NOVIEMBRE:"November",DICIEMBRE:"December" };
const MES_EN_ABR = { ENERO:"Jan",FEBRERO:"Feb",MARZO:"Mar",ABRIL:"Apr",MAYO:"May",JUNIO:"Jun",JULIO:"Jul",AGOSTO:"Aug",SEPTIEMBRE:"Sep",OCTUBRE:"Oct",NOVIEMBRE:"Nov",DICIEMBRE:"Dec" };
const MES_ES_ABR = { ENERO:"Ene",FEBRERO:"Feb",MARZO:"Mar",ABRIL:"Abr",MAYO:"May",JUNIO:"Jun",JULIO:"Jul",AGOSTO:"Ago",SEPTIEMBRE:"Sep",OCTUBRE:"Oct",NOVIEMBRE:"Nov",DICIEMBRE:"Dic" };
const capitalizar = (s) => s.charAt(0) + s.slice(1).toLowerCase();
const AÑO_ACTUAL = new Date().getFullYear();
const AÑOS_DISPONIBLES = [AÑO_ACTUAL, AÑO_ACTUAL - 1, AÑO_ACTUAL - 2];

export default function Administracion() {
  const navigate   = useNavigate();
  const { user }   = useAuth();
  const { t, idioma } = useIdioma();
  const tx = (es, en) => (idioma === 'en' ? en : es);
  const mesNombre = (m) => tx(capitalizar(m), MES_EN[m]);
  const mesAbr = (m) => tx(MES_ES_ABR[m], MES_EN_ABR[m]);
  const plural = (n, es, en) => `${n} ${n === 1 ? tx(es, en) : tx(es + 's', en + 's')}`;

  const CATEGORIA_DEL_GASTO = {
    "51957001": "Iglesia",
    "51957002": "Casa",
    "51957003": "Mision",
    "51957004": "Misioneros",
    "51957005": "General",
  };
  const KEY_A_CODIGO = {
    Iglesia: "51957001", Casa: "51957002", Mision: "51957003",
    Misioneros: "51957004", General: "51957005",
  };
  // El backend valida tipo_gasto contra una lista fija que no incluye nuestras
  // categorías reales (pendiente que Jasen agregue una columna "categoria" propia).
  // Mientras tanto: tipo_gasto siempre va "otros_gastos" (válido), y la categoría
  // real viaja como etiqueta al inicio del concepto: "[Casa] descripción".
  const parseConcepto = (concepto) => {
    const m = concepto?.match(/^\[(Iglesia|Casa|Mision|Misioneros|General)\]\s*/);
    if (m) return { categoria: KEY_A_CODIGO[m[1]], texto: concepto.slice(m[0].length) };
    return { categoria: null, texto: concepto };
  };

  const [seccion, setSeccion]         = useState("dashboard");
  const [mes, setMes]                 = useState(MESES[new Date().getMonth()]);
  const [año, setAño]                 = useState(new Date().getFullYear());
  const [paisNombre, setPaisNombre]   = useState("");
  const [paisId, setPaisId]           = useState(null);
  const [listaPaises, setListaPaises]   = useState([]);
  const [tasaCambio, setTasaCambio]   = useState(1);

  // Cajas y bancos
  const [saldoCaja, setSaldoCaja]     = useState(0);
  const [saldoBanco, setSaldoBanco]   = useState(0);

  // Traslados
  const [traslados, setTraslados]     = useState([]);
  const [modalTraslado, setModalTraslado] = useState(false);
  const [nuevoTraslado, setNuevoTraslado] = useState({ de: "banco", a: "caja", valor: "", observaciones: "", fecha: new Date().toISOString().split('T')[0] });

  // Ingresos (recibos de caja)
  const [ingresos, setIngresos]       = useState([]);
  const [modalIngreso, setModalIngreso] = useState(false);
  const [nuevoIngreso, setNuevoIngreso] = useState({ tipo: "RC-1-Recibo de caja", origen: "World Olivet Assembly", dondeIngresa: "banco", valorRecibido: "", comision: "", observaciones: "", fecha: new Date().toISOString().split('T')[0] });

  // Gastos
  const [gastos, setGastos]           = useState([]);
  const [modalGasto, setModalGasto]   = useState(false);
  const [busqueda, setBusqueda]       = useState("");
  const [filtroTipo, setFiltroTipo]   = useState("");
  const [nuevoGasto, setNuevoGasto]   = useState({
    fecha: new Date().toISOString().split('T')[0],
    proveedor: "", categoria: "", descripcion: "",
    cantidad: 1, valorUnitario: 0, descuento: 0,
    formaPago: "Efectivo", observaciones: "", centro_costo: ""
  });

  useEffect(() => {
    if (user) {
      const pid = user.pais_id || 1;
      // Tasa default por país
      const tasasPais = { 'Colombia': 4200, 'República Dominicana': 58, 'México': 17, 'Argentina': 1000, 'Chile': 900, 'Perú': 3.7, 'Ecuador': 1, 'Bolivia': 6.9, 'Venezuela': 36, 'Paraguay': 7300, 'Uruguay': 38 };
      const nombrePais = user.pais_nombre || '';
      const tasaMatch = Object.entries(tasasPais).find(([p]) => nombrePais.toLowerCase().includes(p.toLowerCase()));
      if (tasaMatch) setTasaCambio(tasaMatch[1]);
      setPaisId(pid);
      setPaisNombre(user.pais_nombre || '');
      cargarDatos(pid);
    }
  }, [user]);

  const cargarDatos = async (pid) => {
    try {
      const [paises, tasa] = await Promise.all([
        administracionService.getAllPaises(),
        administracionService.getTasaCambio()
      ]);
      setListaPaises(paises);
      if (!paisNombre) {
        const p = paises.find(x => String(x.id) === String(pid));
        if (p) setPaisNombre(p.nombre);
      }
      setTasaCambio(parseFloat(tasa));
    } catch {}
  };

  const cargarGastosMes = useCallback(async () => {
    try {
      const d = await administracionService.getDetallePresupuesto(paisId, mes, año);
      setGastos(d.map(x => {
        // Registros nuevos: la categoría viene en su propia columna (x.categoria).
        // Registros viejos (cargados antes de que existiera esa columna): sigue
        // viniendo como etiqueta "[Casa] " al inicio del concepto — se parsea igual.
        if (x.categoria) {
          return {
            id: x.id, concepto: x.concepto, monto: parseFloat(x.monto), centro_costo: x.centro_costo || '',
            categoria: x.categoria,
            fecha: x.created_at?.split('T')[0] || new Date().toISOString().split('T')[0]
          };
        }
        const parsed = parseConcepto(x.concepto);
        return {
          id: x.id, concepto: parsed.texto, monto: parseFloat(x.monto), centro_costo: x.centro_costo || '',
          categoria: parsed.categoria || KEY_A_CODIGO.General,
          fecha: x.created_at?.split('T')[0] || new Date().toISOString().split('T')[0]
        };
      }));
    } catch {}
  }, [paisId, mes, año]);

  useEffect(() => { cargarGastosMes(); }, [mes, cargarGastosMes]);

  const cargarIngresosMes = useCallback(async () => {
    try {
      const data = await administracionService.getIngresos(paisId, mes, año);
      setIngresos(data.map(x => ({
        id: x.id,
        tipo: x.tipo || "RC-1-Recibo de caja",
        origen: x.origen || "World Olivet Assembly",
        dondeIngresa: x.donde_ingresa || "banco",
        valorRecibido: parseFloat(x.valor || x.monto || 0),
        observaciones: x.observaciones || "",
        fecha: x.fecha?.split('T')[0] || new Date().toISOString().split('T')[0],
        numero: x.numero || `RC-${String(x.id).padStart(3,'0')}`
      })));
    } catch {}
  }, [paisId, mes, año]);

  const cargarTrasladosMes = useCallback(async () => {
    try {
      const data = await administracionService.getTraslados(paisId);
      setTraslados(data.map(x => ({
        id: x.id,
        de: x.de,
        a: x.a,
        valor: parseFloat(x.valor || 0),
        observaciones: x.observaciones || "",
        fecha: x.fecha?.split('T')[0] || new Date().toISOString().split('T')[0]
      })));
    } catch {}
  }, [paisId]);

  useEffect(() => { cargarIngresosMes(); }, [mes, cargarIngresosMes]);
  useEffect(() => { cargarTrasladosMes(); }, [cargarTrasladosMes]);

  // Totales
  const totalIngresos  = ingresos.reduce((s, i) => s + parseFloat(i.valorRecibido || 0), 0);
  const totalGastos    = gastos.reduce((s, g) => s + g.monto, 0);
  const totalTraslados = traslados.length;
  const saldoNeto      = totalIngresos - totalGastos;

  const gastosFiltrados = gastos.filter(g => {
    const matchBusq = g.concepto?.toLowerCase().includes(busqueda.toLowerCase());
    const matchTipo = filtroTipo ? g.categoria === filtroTipo : true;
    return matchBusq && matchTipo;
  });

  const guardarTraslado = async () => {
    if (!nuevoTraslado.valor) { toast.error(tx('Ingresa un monto', 'Enter an amount')); return; }
    const val = parseFloat(nuevoTraslado.valor);
    try {
      await administracionService.crearTraslado({
        pais_id: paisId,
        de: nuevoTraslado.de,
        a: nuevoTraslado.a,
        valor: val,
        observaciones: nuevoTraslado.observaciones,
        fecha: nuevoTraslado.fecha
      });
      const t = { ...nuevoTraslado, id: Date.now(), valor: val };
      setTraslados([t, ...traslados]);
      if (nuevoTraslado.de === "banco") setSaldoBanco(s => s - val);
      else setSaldoCaja(s => s - val);
      if (nuevoTraslado.a === "caja") setSaldoCaja(s => s + val);
      else setSaldoBanco(s => s + val);
      toast.success(tx('Traslado registrado', 'Transfer recorded'));
      setModalTraslado(false);
      setNuevoTraslado({ de:"banco", a:"caja", valor:"", observaciones:"", fecha: new Date().toISOString().split('T')[0] });
    } catch { toast.error(tx('Error al guardar el traslado', 'Error saving transfer')); }
  };

  const eliminarIngreso = async (id) => {
    if (!window.confirm("Delete this income record?")) return;
    try {
      await administracionService.eliminarIngreso(id);
      const ing = ingresos.find(i => i.id === id);
      if (ing) {
        if (ing.dondeIngresa === "caja") setSaldoCaja(s => s - parseFloat(ing.valorRecibido));
        else setSaldoBanco(s => s - parseFloat(ing.valorRecibido));
      }
      setIngresos(prev => prev.filter(i => i.id !== id));
      toast.success(tx('Registro de ingreso eliminado', 'Income record deleted'));
    } catch { toast.error(tx('Error al eliminar el registro', 'Error deleting record')); }
  };

  const guardarIngreso = async () => {
    if (!nuevoIngreso.valorRecibido) { toast.error(tx('Ingresa el monto recibido', 'Enter the amount received')); return; }
    const val = parseFloat(nuevoIngreso.valorRecibido);
    try {
      const MESES = ["ENERO","FEBRERO","MARZO","ABRIL","MAYO","JUNIO","JULIO","AGOSTO","SEPTIEMBRE","OCTUBRE","NOVIEMBRE","DICIEMBRE"];
      const mesNum = MESES.indexOf(mes) + 1;
      const saved = await administracionService.crearIngreso({
        pais_id: paisId,
        mes: mesNum,
        mes_nombre: mes,
        anio: año,
        tipo: nuevoIngreso.tipo,
        origen: nuevoIngreso.origen,
        donde_ingresa: nuevoIngreso.dondeIngresa,
        valor: val,
        // TODO: cuando Jasen agregue la columna "comision" a la tabla ingresos,
        // descomentar esta línea para que se guarde de verdad:
        // comision: nuevoIngreso.comision ? parseFloat(nuevoIngreso.comision) : null,
        observaciones: nuevoIngreso.observaciones || null,
        fecha: nuevoIngreso.fecha
      });
      const numeroCorrelativo = saved.numero || `RC-${String(saved.id || Date.now()).padStart(3,'0')}`;
      const ing = { ...nuevoIngreso, id: saved.id || Date.now(), numero: numeroCorrelativo, valorRecibido: val };
      setIngresos([ing, ...ingresos]);
      if (nuevoIngreso.dondeIngresa === "caja") setSaldoCaja(s => s + val);
      else setSaldoBanco(s => s + val);
      toast.success(tx('Ingreso registrado', 'Income recorded'));
      setModalIngreso(false);
      setNuevoIngreso({ tipo:"RC-1-Recibo de caja", origen:"World Olivet Assembly", dondeIngresa:"banco", valorRecibido:"", comision:"", observaciones:"", fecha: new Date().toISOString().split('T')[0] });
    } catch { toast.error(tx('Error al guardar el ingreso', 'Error saving income')); }
  };

  const guardarGasto = async () => {
    if (!nuevoGasto.descripcion || !nuevoGasto.valorUnitario) { toast.error(tx('Completa los campos obligatorios', 'Complete the required fields')); return; }
    const total = (parseFloat(nuevoGasto.valorUnitario) * parseInt(nuevoGasto.cantidad)) - parseFloat(nuevoGasto.descuento || 0);
    const catCodigo = nuevoGasto.categoria || "51957005";
    const conceptoBase = `${nuevoGasto.descripcion}${nuevoGasto.proveedor ? ` — ${nuevoGasto.proveedor}` : ""}`;
    try {
      const g = await administracionService.agregarItemPresupuesto({
        pais_id: paisId,
        pais: paisNombre,
        mes, anio: año,
        tipo_gasto: "otros_gastos", // tipo_gasto sigue siendo el genérico fijo del backend; la categoría real va en su propia columna
        categoria: catCodigo,
        concepto: conceptoBase,
        monto: total, moneda: "USD", tasa_cambio: tasaCambio,
        notas: nuevoGasto.observaciones || null,
        centro_costo: nuevoGasto.centro_costo || paisNombre
      });
      setGastos([{ id: g.id, concepto: conceptoBase, monto: total, categoria: catCodigo, fecha: nuevoGasto.fecha }, ...gastos]);
      toast.success(tx('Gasto guardado', 'Expense saved'));
      setModalGasto(false);
      setNuevoGasto({ fecha: new Date().toISOString().split('T')[0], proveedor:"", categoria:"", descripcion:"", cantidad:1, valorUnitario:0, descuento:0, formaPago:"Efectivo", observaciones:"", centro_costo:"" });
    } catch { toast.error(tx('Error al guardar el gasto', 'Error saving expense')); }
  };

  const eliminarGasto = async (id) => {
    if (!window.confirm("Delete this expense?")) return;
    try {
      await administracionService.eliminarItemPresupuesto(id);
      setGastos(gastos.filter(g => g.id !== id));
      toast.success(tx('Eliminado', 'Deleted'));
    } catch { toast.error(tx('Error al eliminar', 'Error deleting')); }
  };

  const nav = [
    { key:"dashboard",  icon:<FaHome />,              label:tx('Panel', 'Dashboard')    },
    { key:"cajas",      icon:<FaUniversity />,         label:tx('Caja y Bancos', 'Cash & Banks') },
    { key:"traslados",  icon:<FaExchangeAlt />,        label:tx('Traslados', 'Transfers')    },
    { key:"ingresos",   icon:<FaArrowDown />,          label:tx('Ingresos', 'Income')       },
    { key:"gastos",     icon:<FaFileInvoiceDollar />,  label:tx('Gastos', 'Expenses')     },
    { key:"reporte",    icon:<FaChartBar />,           label:tx('Reportes', 'Reports')      },
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
          <h2 style={{ fontFamily:"'Cinzel',serif", fontSize:13, color:"white", margin:"0 0 4px", letterSpacing:1 }}>{tx('Administración', 'Administration')}</h2>
          <p style={{ fontSize:11, color:"rgba(255,255,255,0.5)", margin:0 }}>OA · {año}</p>
        </div>

        <nav style={{ paddingTop:8 }}>
          <div className="adm-section-divider">{tx('Principal', 'Main')}</div>
          {nav.map(item => (
            <div key={item.key} className={`adm-nav ${seccion===item.key?"active":""}`} onClick={()=>setSeccion(item.key)}>
              <span style={{ fontSize:14, width:18, textAlign:"center" }}>{item.icon}</span>
              {item.label}
            </div>
          ))}
          <div className="adm-section-divider" style={{ marginTop:8 }}>Regional</div>
          <div className="adm-nav" onClick={()=>navigate("/informe-regional")}>
            <span style={{ fontSize:14, width:18, textAlign:"center" }}><FaGlobe /></span>
            {tx('Informe Regional', 'HQ Report')}
          </div>
        </nav>

        {/* País del usuario */}
        <div style={{ padding:"14px 20px", borderTop:"1px solid rgba(255,255,255,0.1)", marginTop:"auto" }}>
          <div style={{ fontSize:10, color:"rgba(255,255,255,0.4)", letterSpacing:1, textTransform:"uppercase", marginBottom:4 }}>{tx('País', 'Country')}</div>
          <div style={{ color:"white", fontSize:13, fontWeight:700, fontFamily:"'Lato',sans-serif" }}>{paisNombre || tx('Cargando...', 'Loading...')}</div>
          <div style={{ color:"rgba(255,255,255,0.4)", fontSize:11, marginTop:2 }}>{user?.region || ""}</div>
        </div>

        

        <div className="adm-back" onClick={()=>navigate("/home")}>
          <FaArrowLeft style={{ fontSize:11 }} /> {tx('Volver al Inicio', 'Back to Home')}
        </div>
      </div>

      {/* ── MAIN ── */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>

        {/* TOPBAR */}
        <div style={{ background:"white", borderBottom:"1px solid #e8edf5", padding:"0 28px", height:60, display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
          <span style={{ fontFamily:"'Cinzel',serif", fontSize:16, color:"#1a2d5a", fontWeight:600 }}>
            { seccion==="dashboard" ? tx('Panel', 'Dashboard')
            : seccion==="cajas"     ? tx('Caja y Bancos', 'Cash & Banks')
            : seccion==="traslados" ? tx('Traslados de Dinero', 'Money Transfers')
            : seccion==="ingresos"  ? tx('Ingresos — Recibos de Caja', 'Income — Cash Receipts')
            : seccion==="gastos"    ? tx('Compras y Gastos', 'Purchases & Expenses')
            :                         tx('Reportes', 'Reports') }
          </span>
          <div style={{ display:"flex", gap:10 }}>
            { seccion==="traslados" ? <button className="adm-btn adm-btn-p adm-btn-sm" onClick={()=>setModalTraslado(true)}><FaPlus /> {tx('Nuevo Traslado', 'New Transfer')}</button> : null }
            { seccion==="ingresos"  ? <button className="adm-btn adm-btn-s adm-btn-sm" onClick={()=>setModalIngreso(true)}><FaPlus /> {tx('Nuevo Recibo', 'New Receipt')}</button> : null }
            { seccion==="gastos"    ? <button className="adm-btn adm-btn-p adm-btn-sm" onClick={()=>setModalGasto(true)}><FaPlus /> {tx('Nuevo Gasto', 'New Expense')}</button> : null }
          </div>
        </div>

        {/* AÑO SELECTOR */}
        <div style={{ background:"white", borderBottom:"1px solid #e8edf5", padding:"10px 28px", display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", flexShrink:0 }}>
          <span style={{ fontSize:11, fontWeight:700, color:"#8a97b0", letterSpacing:1, textTransform:"uppercase", marginRight:4 }}>{tx('Año:', 'Year:')}</span>
          {AÑOS_DISPONIBLES.map(a => (
            <button
              key={a}
              className={`adm-mes-btn ${año===a?"active":""}`}
              onClick={() => setAño(a)}
            >
              {a}
            </button>
          ))}
        </div>

        {/* MES SELECTOR */}
        <div style={{ background:"white", borderBottom:"1px solid #e8edf5", padding:"10px 28px", display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", flexShrink:0 }}>
          <span style={{ fontSize:11, fontWeight:700, color:"#8a97b0", letterSpacing:1, textTransform:"uppercase", marginRight:4 }}>{tx('Mes:', 'Month:')}</span>
          {MESES.map((m, idx) => {
            const mesActualIdx = new Date().getMonth();
            const esFuturo = año === AÑO_ACTUAL && idx > mesActualIdx;
            return (
              <button
                key={m}
                className={`adm-mes-btn ${mes===m?"active":""}`}
                onClick={() => !esFuturo && setMes(m)}
                style={{ opacity: esFuturo ? 0.35 : 1, cursor: esFuturo ? "not-allowed" : "pointer" }}
                title={esFuturo ? tx('Mes aún no disponible', 'Month not available yet') : ""}
              >
                {mesAbr(m)}
              </button>
            );
          })}
        </div>

        {/* CONTENT */}
        <div style={{ flex:1, overflowY:"auto", padding:"24px 28px" }}>

          {/* ── DASHBOARD ── */}
          {seccion==="dashboard" && (
            <div key={`dash-${mes}`}>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:20 }}>
                <div className="adm-stat">
                  <div className="adm-stat-lbl">{tx('Efectivo Disponible', 'Cash Available')}</div>
                  <div className="adm-stat-val" style={{ color:"#4CAF50" }}>${saldoCaja.toLocaleString()}</div>
                  <div style={{ fontSize:11, color:"#b0bcd0", marginTop:4 }}>USD · {tx('Caja Chica', 'Petty Cash')}</div>
                </div>
                <div className="adm-stat">
                  <div className="adm-stat-lbl">{tx('Saldo Bancario', 'Bank Balance')}</div>
                  <div className="adm-stat-val" style={{ color:P }}>${saldoBanco.toLocaleString()}</div>
                  <div style={{ fontSize:11, color:"#b0bcd0", marginTop:4 }}>USD · {tx('Cuenta Bancaria', 'Bank Account')}</div>
                </div>
                <div className="adm-stat">
                  <div className="adm-stat-lbl">{tx('Ingresos Totales', 'Total Income')}</div>
                  <div className="adm-stat-val" style={{ color:"#4CAF50" }}>${totalIngresos.toLocaleString()}</div>
                  <div style={{ fontSize:11, color:"#b0bcd0", marginTop:4 }}>{plural(ingresos.length, 'recibo', 'receipt')}</div>
                </div>
                <div className="adm-stat">
                  <div className="adm-stat-lbl">{tx('Gastos Totales', 'Total Expenses')}</div>
                  <div className="adm-stat-val" style={{ color:"#f44336" }}>${totalGastos.toLocaleString()}</div>
                  <div style={{ fontSize:11, color:"#b0bcd0", marginTop:4 }}>{plural(gastos.length, 'registro', 'record')}</div>
                </div>
              </div>

              {/* Balance neto */}
              <div className="adm-card">
                <div className="adm-card-hdr">
                  <h3 className="adm-card-ttl">{tx('Balance Neto', 'Net Balance')} — {mesNombre(mes)} {año}</h3>
                </div>
                <div style={{ padding:"24px", display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:24 }}>
                  <div style={{ textAlign:"center" }}>
                    <div style={{ fontSize:11, color:"#8a97b0", marginBottom:6, textTransform:"uppercase", letterSpacing:0.8 }}>{tx('Ingresos', 'Income')}</div>
                    <div style={{ fontSize:32, fontWeight:700, color:"#4CAF50" }}>${totalIngresos.toLocaleString()}</div>
                  </div>
                  <div style={{ textAlign:"center" }}>
                    <div style={{ fontSize:11, color:"#8a97b0", marginBottom:6, textTransform:"uppercase", letterSpacing:0.8 }}>{tx('Gastos', 'Expenses')}</div>
                    <div style={{ fontSize:32, fontWeight:700, color:"#f44336" }}>${totalGastos.toLocaleString()}</div>
                  </div>
                  <div style={{ textAlign:"center", borderLeft:"2px solid #eef2f7", paddingLeft:24 }}>
                    <div style={{ fontSize:11, color:"#8a97b0", marginBottom:6, textTransform:"uppercase", letterSpacing:0.8 }}>{tx('Balance Neto', 'Net Balance')}</div>
                    <div style={{ fontSize:32, fontWeight:700, color:saldoNeto>=0?"#4CAF50":"#f44336" }}>
                      {saldoNeto<0?"-":""}${Math.abs(saldoNeto).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Balance por categoría (Iglesia / Casa / Misión / Misioneros / General) */}
              <div className="adm-card">
                <div className="adm-card-hdr">
                  <h3 className="adm-card-ttl">{tx('Balance por Categoría', 'Balance by Category')} — {mesNombre(mes)} {año}</h3>
                </div>
                <div style={{ padding: "24px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
                  {(() => {
                    const categorias = ['Iglesia', 'Casa', 'Mision', 'Misioneros', 'General'];
                    const colores = { Iglesia: '#673AB7', Casa: '#009688', Mision: '#FF9800', Misioneros: '#2196F3', General: '#607D8B' };
                    const etiquetas = {
                      Iglesia: tx('Iglesia', 'Church'),
                      Casa: tx('Casa', 'House'),
                      Mision: tx('Misión', 'Mission'),
                      Misioneros: tx('Misioneros', 'Missionaries'),
                      General: tx('General', 'General'),
                    };
                    return categorias.map(cat => {
                      const totalCat = gastos
                        .filter(g => CATEGORIA_DEL_GASTO[g.categoria] === cat)
                        .reduce((s, g) => s + (g.monto || 0), 0);
                      return (
                        <div key={cat} style={{ textAlign: "center", padding: "16px", background: `${colores[cat]}0d`, borderRadius: 10, border: `1px solid ${colores[cat]}30` }}>
                          <div style={{ fontSize: 11, color: "#8a97b0", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.8 }}>{etiquetas[cat]}</div>
                          <div style={{ fontSize: 24, fontWeight: 700, color: colores[cat] }}>${totalCat.toLocaleString()}</div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Quick actions */}
              <div className="adm-card">
                <div className="adm-card-hdr"><h3 className="adm-card-ttl">{tx('Acciones Rápidas', 'Quick Actions')}</h3></div>
                <div style={{ padding:"20px 24px", display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
                  {[
                    { icon:<FaArrowDown />, label:tx('Registrar Ingreso', 'Register Income'),   color:"#4CAF50", action:()=>{setSeccion("ingresos"); setModalIngreso(true);} },
                    { icon:<FaFileInvoiceDollar />, label:tx('Registrar Gasto', 'Register Expense'), color:P, action:()=>{setSeccion("gastos"); setModalGasto(true);} },
                    { icon:<FaExchangeAlt />, label:tx('Transferir Dinero', 'Transfer Money'),  color:"#FF9800", action:()=>{setSeccion("traslados"); setModalTraslado(true);} },
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
            </div>
          )}

          {/* ── CAJAS Y BANCOS ── */}
          {seccion==="cajas" && (
            <div key={`cajas-${mes}`} className="adm-card">
              <div className="adm-card-hdr"><h3 className="adm-card-ttl">{tx('Cuentas Bancarias y Efectivo', 'Bank Accounts & Cash')}</h3></div>
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>{tx('Código de Cuenta', 'Account Code')}</th>
                    <th>{tx('Cuenta / Caja', 'Account / Cash Register')}</th>
                    <th style={{ textAlign:"right" }}>{tx('Saldo (USD)', 'Balance (USD)')}</th>
                    <th style={{ textAlign:"center" }}>{tx('Tipo', 'Type')}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ color:"#8a97b0", fontSize:12 }}>11050501</td>
                    <td style={{ fontWeight:700 }}>{tx('Caja Chica', 'Petty Cash')}</td>
                    <td style={{ textAlign:"right", fontWeight:700, color:"#4CAF50", fontSize:16 }}>${saldoCaja.toLocaleString()}</td>
                    <td style={{ textAlign:"center" }}><span className="adm-badge adm-badge-in">{tx('Efectivo', 'Cash')}</span></td>
                  </tr>
                  <tr>
                    <td style={{ color:"#8a97b0", fontSize:12 }}>11200501</td>
                    <td style={{ fontWeight:700 }}>{tx('Cuenta Bancaria (Ahorros)', 'Bank Account (Savings)')}</td>
                    <td style={{ textAlign:"right", fontWeight:700, color:P, fontSize:16 }}>${saldoBanco.toLocaleString()}</td>
                    <td style={{ textAlign:"center" }}><span className="adm-badge adm-badge-tr">{tx('Banco', 'Bank')}</span></td>
                  </tr>
                  <tr style={{ background:"#f0f4fa" }}>
                    <td colSpan={2} style={{ fontWeight:700, color:"#5a6a85", fontSize:12, textTransform:"uppercase" }}>{tx('Total', 'Total')}</td>
                    <td style={{ textAlign:"right", fontWeight:700, fontSize:18, color:P }}>${(saldoCaja+saldoBanco).toLocaleString()}</td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* ── TRASLADOS ── */}
          {seccion==="traslados" && (
            <div key={`traslados-${mes}`} className="adm-card">
              <div className="adm-card-hdr">
                <h3 className="adm-card-ttl">{tx('Traslados de Dinero', 'Money Transfers')}</h3>
                <span style={{ fontSize:12, color:"#8a97b0" }}>{tx('Registra retiros de efectivo y traslados entre cuentas', 'Record cash withdrawals and transfers between accounts')}</span>
              </div>
              {traslados.length===0 ? (
                <div style={{ padding:"48px", textAlign:"center", color:"#b0bcd0" }}>
                  <FaExchangeAlt style={{ fontSize:36, marginBottom:12, opacity:0.3 }} />
                  <div style={{ fontWeight:700 }}>{tx('No hay traslados registrados', 'No transfers recorded')}</div>
                </div>
              ) : (
                <table className="adm-table">
                  <thead>
                    <tr>
                      <th>{tx('Fecha', 'Date')}</th>
                      <th>{tx('Desde', 'From')}</th>
                      <th>{tx('Hacia', 'To')}</th>
                      <th style={{ textAlign:"right" }}>{tx('Monto (USD)', 'Amount (USD)')}</th>
                      <th>{tx('Notas', 'Notes')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {traslados.map(t => (
                      <tr key={t.id}>
                        <td style={{ color:"#8a97b0", fontSize:12 }}>{t.fecha}</td>
                        <td style={{ fontWeight:600 }}>{t.de==="banco"?tx('Cuenta Bancaria','Bank Account'):tx('Caja Chica','Petty Cash')}</td>
                        <td style={{ fontWeight:600 }}>{t.a==="caja"?tx('Caja Chica','Petty Cash'):tx('Cuenta Bancaria','Bank Account')}</td>
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
            <div key={`ingresos-${mes}`} className="adm-card">
              <div className="adm-card-hdr">
                <h3 className="adm-card-ttl">{tx('Recibos de Caja — Ingresos', 'Cash Receipts — Income')}</h3>
                <span style={{ fontSize:12, color:"#8a97b0" }}>{tx('Registrar dinero recibido de la sede', 'Record money received from headquarters')}</span>
              </div>
              {ingresos.length===0 ? (
                <div style={{ padding:"48px", textAlign:"center", color:"#b0bcd0" }}>
                  <FaArrowDown style={{ fontSize:36, marginBottom:12, opacity:0.3 }} />
                  <div style={{ fontWeight:700 }}>{tx('No hay ingresos registrados', 'No income recorded')}</div>
                </div>
              ) : (
                <table className="adm-table">
                  <thead>
                    <tr>
                      <th style={{ width:40 }}></th>
                      <th>No.</th>
                      <th>{tx('Fecha', 'Date')}</th>
                      <th>{tx('Tipo', 'Type')}</th>
                      <th>{tx('Origen', 'Origin')}</th>
                      <th>{tx('Dónde', 'Where')}</th>
                      <th style={{ textAlign:"right" }}>{tx('Monto (USD)', 'Amount (USD)')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ingresos.map((ing,i) => (
                      <tr key={ing.id}>
                        <td>
                          <button onClick={() => eliminarIngreso(ing.id)} style={{ background:"#fff0f0", border:"none", borderRadius:6, padding:"4px 8px", cursor:"pointer", color:"#f44336" }}>
                            <FaTrash style={{ fontSize:11 }} />
                          </button>
                        </td>
                        <td style={{ color:"#8a97b0", fontSize:12 }}>{ing.numero || `RC-${i+1}`}</td>
                        <td style={{ color:"#8a97b0", fontSize:12 }}>{ing.fecha}</td>
                        <td>{ing.tipo}</td>
                        <td style={{ fontWeight:600 }}>{ing.origen}</td>
                        <td><span className="adm-badge adm-badge-tr">{ing.dondeIngresa==="caja"?tx('Caja Chica','Petty Cash'):tx('Banco','Bank')}</span></td>
                        <td style={{ textAlign:"right", fontWeight:700, color:"#4CAF50" }}>${parseFloat(ing.valorRecibido||0).toLocaleString()}</td>
                      </tr>
                    ))}
                    <tr style={{ background:"#f0f4fa" }}>
                      <td colSpan={6} style={{ fontWeight:700, color:"#5a6a85", fontSize:12, textTransform:"uppercase" }}>{tx('Ingresos Totales', 'Total Income')}</td>
                      <td style={{ textAlign:"right", fontWeight:700, fontSize:16, color:"#4CAF50" }}>${totalIngresos.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* ── GASTOS ── */}
          {seccion==="gastos" && (
            <div key={`gastos-${mes}`}>
              {/* Filtros estilo Siigo */}
              <div style={{ background:"white", borderRadius:12, border:"1px solid #e8edf5", padding:"16px 20px", marginBottom:16 }}>
                <div style={{ display:"flex", alignItems:"center", gap:4, marginBottom:12, fontSize:12, color:"#8a97b0", cursor:"pointer" }}>
                  <FaFilter /> {tx('Ocultar criterios de búsqueda', 'Hide search criteria')}
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
                  <div>
                    <label style={labelCls}>{tx('Buscar', 'Search')}</label>
                    <div style={{ display:"flex", alignItems:"center", gap:8, border:"1.5px solid #dde3ef", borderRadius:8, padding:"8px 12px" }}>
                      <FaSearch style={{ color:"#b0bcd0", fontSize:13 }} />
                      <input type="text" placeholder={tx('Descripción...', 'Description...')} value={busqueda} onChange={e=>setBusqueda(e.target.value)}
                        style={{ border:"none", outline:"none", fontSize:13, fontFamily:"'Lato',sans-serif", color:"#1a2d5a", width:"100%" }} />
                    </div>
                  </div>
                  <div>
                    <label style={labelCls}>{tx('Categoría', 'Category')}</label>
                    <select value={filtroTipo} onChange={e=>setFiltroTipo(e.target.value)}
                      style={{ ...inputCls, marginBottom:0 }} className="adm-input">
                      <option value="">{tx('Todas', 'All')}</option>
                      {CATEGORIAS_GASTO.map(c=><option key={c.codigo} value={c.codigo}>{c.nombre}</option>)}
                    </select>
                  </div>
                  <div style={{ display:"flex", alignItems:"flex-end", gap:10 }}>
                    <button className="adm-btn adm-btn-p" style={{ flex:1, justifyContent:"center" }}>{tx('Buscar', 'Search')}</button>
                    <button className="adm-btn adm-btn-o" onClick={()=>{setBusqueda(""); setFiltroTipo("");}}>{tx('Limpiar', 'Clear')}</button>
                  </div>
                </div>
              </div>

              <div className="adm-card">
                <div className="adm-card-hdr">
                  <h3 className="adm-card-ttl">{tx('Compras y Gastos', 'Purchases, Expenses')} — {mesNombre(mes)}</h3>
                  <span style={{ fontSize:12, color:"#8a97b0" }}>{plural(gastosFiltrados.length, 'registro', 'record')}</span>
                </div>
                {gastosFiltrados.length===0 ? (
                  <div style={{ padding:"48px", textAlign:"center", color:"#b0bcd0" }}>
                    <FaFileInvoiceDollar style={{ fontSize:36, marginBottom:12, opacity:0.3 }} />
                    <div style={{ fontWeight:700 }}>{tx('No se encontraron gastos', 'No expenses found')}</div>
                  </div>
                ) : (
                  <table className="adm-table">
                    <thead>
                      <tr>
                        <th>{tx('Tipo', 'Type')}</th>
                        <th>{tx('N.° de Recibo', 'Receipt No.')}</th>
                        <th>{tx('Fecha', 'Date')}</th>
                        <th>{tx('Descripción', 'Description')}</th>
                        <th style={{ textAlign:"right" }}>{tx('Monto (USD)', 'Amount (USD)')}</th>
                        <th style={{ textAlign:"center", width:60 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {gastosFiltrados.map((g,i) => (
                        <tr key={g.id}>
                          <td><span className="adm-badge adm-badge-out">
                            {CATEGORIAS_GASTO.find(c=>c.codigo===g.categoria)?.nombre.split(' (')[0] || tx('Sin categoría','Uncategorized')}
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
                        <td colSpan={4} style={{ fontWeight:700, color:"#5a6a85", fontSize:12, textTransform:"uppercase" }}>{tx('Gastos Totales', 'Total Expenses')}</td>
                        <td style={{ textAlign:"right", fontWeight:700, fontSize:16, color:"#f44336" }}>${totalGastos.toLocaleString()}</td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* ── REPORTES ── */}
          {seccion==="reporte" && (
            <div key={`reporte-${mes}`}>
              {/* Resumen del mes */}
              <div className="adm-card" style={{ marginBottom:16 }}>
                <div className="adm-card-hdr">
                  <h3 className="adm-card-ttl">{tx('Resumen Financiero', 'Financial Summary')} — {mesNombre(mes)} {año}</h3>
                  <button className="adm-btn adm-btn-o adm-btn-sm" onClick={() => window.print()}><FaPrint /> {tx('Imprimir', 'Print')}</button>
                </div>
                <div style={{ padding:"20px 24px" }}>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16, marginBottom:20 }}>
                    <div style={{ background:"#f0faf4", borderRadius:10, padding:"16px 20px", borderLeft:"4px solid #4CAF50" }}>
                      <div style={{ fontSize:11, color:"#4CAF50", fontWeight:700, marginBottom:4 }}>{tx('TOTAL DE INGRESOS', 'TOTAL INCOME')}</div>
                      <div style={{ fontSize:28, fontWeight:700, color:"#1a2d5a" }}>${totalIngresos.toLocaleString()}</div>
                      <div style={{ fontSize:11, color:"#8a97b0" }}>{plural(ingresos.length, 'recibo', 'receipt')}</div>
                    </div>
                    <div style={{ background:"#fff5f5", borderRadius:10, padding:"16px 20px", borderLeft:"4px solid #f44336" }}>
                      <div style={{ fontSize:11, color:"#f44336", fontWeight:700, marginBottom:4 }}>{tx('TOTAL DE GASTOS', 'TOTAL EXPENSES')}</div>
                      <div style={{ fontSize:28, fontWeight:700, color:"#1a2d5a" }}>${totalGastos.toLocaleString()}</div>
                      <div style={{ fontSize:11, color:"#8a97b0" }}>{plural(gastos.length, 'registro', 'record')}</div>
                    </div>
                    <div style={{ background:saldoNeto>=0?"#f0faf4":"#fff5f5", borderRadius:10, padding:"16px 20px", borderLeft:`4px solid ${saldoNeto>=0?"#4CAF50":"#f44336"}` }}>
                      <div style={{ fontSize:11, color:saldoNeto>=0?"#4CAF50":"#f44336", fontWeight:700, marginBottom:4 }}>{tx('BALANCE NETO', 'NET BALANCE')}</div>
                      <div style={{ fontSize:28, fontWeight:700, color:"#1a2d5a" }}>{saldoNeto<0?"-":""}${Math.abs(saldoNeto).toLocaleString()}</div>
                      <div style={{ fontSize:11, color:"#8a97b0" }}>DOP</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reporte de ingresos */}
              <div className="adm-card" style={{ marginBottom:16 }}>
                <div className="adm-card-hdr">
                  <h3 className="adm-card-ttl">{tx('Reporte de Ingresos', 'Income Report')}</h3>
                </div>
                {ingresos.length === 0 ? (
                  <div style={{ padding:"30px", textAlign:"center", color:"#b0bcd0" }}>{tx('Sin ingresos registrados en', 'No income recorded for')} {mesNombre(mes)}</div>
                ) : (
                  <table className="adm-table">
                    <thead>
                      <tr>
                        <th>No.</th>
                        <th>{tx('Fecha', 'Date')}</th>
                        <th>{tx('Tipo', 'Type')}</th>
                        <th>{tx('Origen', 'Origin')}</th>
                        <th>{tx('Cuenta', 'Account')}</th>
                        <th style={{ textAlign:"right" }}>{tx('Monto (USD)', 'Amount (USD)')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ingresos.map((ing, i) => (
                        <tr key={ing.id}>
                          <td style={{ color:"#8a97b0", fontSize:12 }}>{ing.numero || `RC-${String(i+1).padStart(3,'0')}`}</td>
                          <td style={{ color:"#8a97b0", fontSize:12 }}>{ing.fecha}</td>
                          <td style={{ fontSize:12 }}>{ing.tipo}</td>
                          <td style={{ fontWeight:600 }}>{ing.origen}</td>
                          <td><span className="adm-badge adm-badge-tr">{ing.dondeIngresa==="caja"?tx('Caja Chica','Petty Cash'):tx('Banco','Bank')}</span></td>
                          <td style={{ textAlign:"right", fontWeight:700, color:"#4CAF50" }}>${parseFloat(ing.valorRecibido||0).toLocaleString()}</td>
                        </tr>
                      ))}
                      <tr style={{ background:"#f8faff", fontWeight:700 }}>
                        <td colSpan="5" style={{ textAlign:"right", paddingRight:16, fontSize:13 }}>{tx('TOTAL', 'TOTAL')}</td>
                        <td style={{ textAlign:"right", color:"#4CAF50", fontSize:15 }}>${totalIngresos.toLocaleString()}</td>
                      </tr>
                    </tbody>
                  </table>
                )}
              </div>

              {/* Reporte de gastos */}
              <div className="adm-card">
                <div className="adm-card-hdr">
                  <h3 className="adm-card-ttl">{tx('Reporte de Gastos', 'Expenses Report')}</h3>
                </div>
                {gastos.length === 0 ? (
                  <div style={{ padding:"30px", textAlign:"center", color:"#b0bcd0" }}>{tx('Sin gastos registrados en', 'No expenses recorded for')} {mesNombre(mes)}</div>
                ) : (
                  <table className="adm-table">
                    <thead>
                      <tr>
                        <th>{tx('Fecha', 'Date')}</th>
                        <th>{tx('Tipo', 'Type')}</th>
                        <th>{tx('Centro de Costo', 'Cost Center')}</th>
                        <th>{tx('Descripción', 'Description')}</th>
                        <th>{tx('Proveedor', 'Provider')}</th>
                        <th>{tx('Pago', 'Payment')}</th>
                        <th style={{ textAlign:"right" }}>{tx('Monto (USD)', 'Amount (USD)')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gastos.map(g => (
                        <tr key={g.id}>
                          <td style={{ color:"#8a97b0", fontSize:12 }}>{g.fecha}</td>
                          <td style={{ fontSize:12 }}>{CATEGORIAS_GASTO.find(c=>c.codigo===g.categoria)?.nombre.split(' (')[0] || g.categoria || "—"}</td>
                          <td style={{ fontSize:12, color:"#8a97b0" }}>{g.centro_costo || paisNombre || "—"}</td>
                          <td style={{ fontWeight:600 }}>{g.concepto || g.descripcion}</td>
                          <td style={{ color:"#5a6a85" }}>{g.proveedor || "—"}</td>
                          <td><span className="adm-badge adm-badge-p">{g.metodoPago || g.metodo_pago || tx('Efectivo','Cash')}</span></td>
                          <td style={{ textAlign:"right", fontWeight:700, color:"#f44336" }}>${parseFloat(g.monto || g.total || 0).toLocaleString()}</td>
                        </tr>
                      ))}
                      <tr style={{ background:"#f8faff", fontWeight:700 }}>
                        <td colSpan="6" style={{ textAlign:"right", paddingRight:16, fontSize:13 }}>{tx('TOTAL', 'TOTAL')}</td>
                        <td style={{ textAlign:"right", color:"#f44336", fontSize:15 }}>${totalGastos.toLocaleString()}</td>
                      </tr>
                    </tbody>
                  </table>
                )}
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
              <h3 className="adm-modal-ttl">{tx('Nuevo Traslado de Dinero', 'New Money Transfer')}</h3>
              <button onClick={()=>setModalTraslado(false)} style={{ background:"none", border:"none", fontSize:18, cursor:"pointer", color:"#8a97b0" }}><FaTimes /></button>
            </div>
            <div className="adm-modal-body">
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
                <div>
                  <label style={labelCls}>{tx('Desde', 'From')}</label>
                  <select value={nuevoTraslado.de} onChange={e=>setNuevoTraslado({...nuevoTraslado, de:e.target.value})} style={{...inputCls, marginBottom:0}} className="adm-input">
                    <option value="banco">{tx('Cuenta Bancaria', 'Bank Account')}</option>
                    <option value="caja">{tx('Caja Chica', 'Petty Cash')}</option>
                  </select>
                </div>
                <div>
                  <label style={labelCls}>{tx('Hacia', 'To')}</label>
                  <select value={nuevoTraslado.a} onChange={e=>setNuevoTraslado({...nuevoTraslado, a:e.target.value})} style={{...inputCls, marginBottom:0}} className="adm-input">
                    <option value="caja">{tx('Caja Chica', 'Petty Cash')}</option>
                    <option value="banco">{tx('Cuenta Bancaria', 'Bank Account')}</option>
                  </select>
                </div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
                <div>
                  <label style={labelCls}>{tx('Fecha', 'Date')}</label>
                  <input type="date" value={nuevoTraslado.fecha} onChange={e=>setNuevoTraslado({...nuevoTraslado, fecha:e.target.value})} style={{...inputCls, marginBottom:0}} className="adm-input" />
                </div>
                <div>
                  <label style={labelCls}>{tx('Monto (USD)', 'Amount (USD)')}</label>
                  <input type="number" placeholder="0.00" value={nuevoTraslado.valor} onChange={e=>setNuevoTraslado({...nuevoTraslado, valor:e.target.value})} style={{...inputCls, marginBottom:0}} className="adm-input" />
                </div>
              </div>
              <label style={labelCls}>{tx('Notas', 'Notes')}</label>
              <textarea value={nuevoTraslado.observaciones} onChange={e=>setNuevoTraslado({...nuevoTraslado, observaciones:e.target.value})}
                style={{...inputCls, minHeight:70, resize:"vertical", marginBottom:0}} className="adm-input" placeholder={tx('Notas opcionales...', 'Optional notes...')} />
            </div>
            <div className="adm-modal-ftr">
              <button className="adm-btn adm-btn-p" style={{ flex:1, justifyContent:"center" }} onClick={guardarTraslado}><FaSave /> {tx('Guardar', 'Save')}</button>
              <button className="adm-btn adm-btn-o" style={{ flex:1, justifyContent:"center" }} onClick={()=>setModalTraslado(false)}>{tx('Cancelar', 'Cancel')}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL INGRESO ── */}
      {modalIngreso && (
        <div className="adm-overlay" onClick={()=>setModalIngreso(false)}>
          <div className="adm-modal" onClick={e=>e.stopPropagation()}>
            <div className="adm-modal-hdr">
              <h3 className="adm-modal-ttl">{tx('Nuevo Recibo de Caja — Ingreso', 'New Cash Receipt — Income')} <span style={{ fontSize:12, color:"#8a97b0", fontWeight:400 }}>#{(ingresos.length + 1).toString().padStart(3,'0')}</span></h3>
              <button onClick={()=>setModalIngreso(false)} style={{ background:"none", border:"none", fontSize:18, cursor:"pointer", color:"#8a97b0" }}><FaTimes /></button>
            </div>
            <div className="adm-modal-body">
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <div>
                  <label style={labelCls}>{tx('Tipo', 'Type')}</label>
                  <select value={nuevoIngreso.tipo} onChange={e=>setNuevoIngreso({...nuevoIngreso, tipo:e.target.value})} style={{...inputCls}} className="adm-input">
                    <option>RC-1-Recibo de caja</option>
                    <option>RC-2-Anticipo</option>
                    <option>RC-3-Otro</option>
                  </select>
                </div>
                <div>
                  <label style={labelCls}>{tx('Fecha', 'Date')}</label>
                  <input type="date" value={nuevoIngreso.fecha} onChange={e=>setNuevoIngreso({...nuevoIngreso, fecha:e.target.value})} style={{...inputCls}} className="adm-input" />
                </div>
              </div>
              <label style={labelCls}>{tx('Origen (Cliente / Remitente)', 'Origin (Client / Sender)')}</label>
              <input type="text" value={nuevoIngreso.origen} onChange={e=>setNuevoIngreso({...nuevoIngreso, origen:e.target.value})} style={{...inputCls}} className="adm-input" placeholder={tx('Ej. World Olivet Assembly INC', 'e.g. World Olivet Assembly INC')} />
              <label style={labelCls}>{tx('Dónde entra el dinero', 'Where the money enters')}</label>
              <select value={nuevoIngreso.dondeIngresa} onChange={e=>setNuevoIngreso({...nuevoIngreso, dondeIngresa:e.target.value})} style={{...inputCls}} className="adm-input">
                <option value="banco">{tx('Cuenta Bancaria', 'Bank Account')}</option>
                <option value="caja">{tx('Caja Chica', 'Petty Cash')}</option>
              </select>
              <label style={labelCls}>{tx('Monto Recibido (DOP)', 'Amount Received (DOP)')}</label>
              <input type="number" placeholder="0.00" value={nuevoIngreso.valorRecibido} onChange={e=>setNuevoIngreso({...nuevoIngreso, valorRecibido:e.target.value})} style={{...inputCls}} className="adm-input" />
              <label style={labelCls}>{tx('Comisión', 'Commission')}</label>
              <input type="number" placeholder="0.00" value={nuevoIngreso.comision} onChange={e=>setNuevoIngreso({...nuevoIngreso, comision:e.target.value})} style={{...inputCls}} className="adm-input" />
              <label style={labelCls}>{tx('Notas', 'Notes')}</label>
              <textarea value={nuevoIngreso.observaciones} onChange={e=>setNuevoIngreso({...nuevoIngreso, observaciones:e.target.value})}
                style={{...inputCls, minHeight:70, resize:"vertical", marginBottom:0}} className="adm-input" placeholder={tx('Notas opcionales...', 'Optional notes...')} />
            </div>
            <div className="adm-modal-ftr">
              <button className="adm-btn adm-btn-s" style={{ flex:1, justifyContent:"center" }} onClick={guardarIngreso}><FaSave /> {tx('Guardar y Registrar', 'Save & Record')}</button>
              <button className="adm-btn adm-btn-o" style={{ flex:1, justifyContent:"center" }} onClick={()=>setModalIngreso(false)}>{tx('Cancelar', 'Cancel')}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL GASTO (estilo factura de compra Siigo) ── */}
      {modalGasto && (
        <div className="adm-overlay" onClick={()=>setModalGasto(false)}>
          <div className="adm-modal" onClick={e=>e.stopPropagation()} style={{ maxWidth:640 }}>
            <div className="adm-modal-hdr">
              <h3 className="adm-modal-ttl">{tx('Nueva Compra / Gasto', 'New Purchase / Expense')}</h3>
              <button onClick={()=>setModalGasto(false)} style={{ background:"none", border:"none", fontSize:18, cursor:"pointer", color:"#8a97b0" }}><FaTimes /></button>
            </div>
            <div className="adm-modal-body">
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <div>
                  <label style={labelCls}>{tx('Fecha', 'Date')}</label>
                  <input type="date" value={nuevoGasto.fecha} onChange={e=>setNuevoGasto({...nuevoGasto, fecha:e.target.value})} style={{...inputCls}} className="adm-input" />
                </div>
                <div>
                  <label style={labelCls}>{tx('Forma de Pago', 'Payment Method')}</label>
                  <select value={nuevoGasto.formaPago} onChange={e=>setNuevoGasto({...nuevoGasto, formaPago:e.target.value})} style={{...inputCls}} className="adm-input">
                    {FORMAS_PAGO.map(f=><option key={f}>{f}</option>)}
                  </select>
                </div>
              </div>
              <label style={labelCls}>{tx('Proveedor', 'Supplier / Provider')}</label>
              <input type="text" placeholder={tx('Ej. nombre de persona o empresa', 'e.g. Person or company name')} value={nuevoGasto.proveedor} onChange={e=>setNuevoGasto({...nuevoGasto, proveedor:e.target.value})} style={{...inputCls}} className="adm-input" />
              <label style={labelCls}>{tx('Centro de Costo (País)', 'Cost Center (Country)')}</label>
              <select value={nuevoGasto.centro_costo} onChange={e=>setNuevoGasto({...nuevoGasto, centro_costo:e.target.value})} style={{...inputCls}} className="adm-input">
                <option value="">{paisNombre || tx('Selecciona un país...', 'Select country...')}</option>
                {listaPaises.map(p => <option key={p.id} value={p.nombre}>{p.nombre}</option>)}
              </select>
              <label style={labelCls}>{tx('Categoría', 'Category')}</label>
              <select value={nuevoGasto.categoria} onChange={e=>setNuevoGasto({...nuevoGasto, categoria:e.target.value})} style={{...inputCls}} className="adm-input">
                <option value="">{tx('Selecciona categoría...', 'Select category...')}</option>
                {CATEGORIAS_GASTO.map(c=><option key={c.codigo} value={c.codigo}>{c.nombre}</option>)}
              </select>

              {/* Detalle del gasto */}
              <div style={{ border:"1px solid #e8edf5", borderRadius:8, overflow:"hidden", marginBottom:12 }}>
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                  <thead>
                    <tr style={{ background:"#fafbfd" }}>
                      <th style={{ padding:"8px 12px", fontSize:11, fontWeight:700, color:"#8a97b0", textAlign:"left", letterSpacing:0.8 }}>{tx('Descripción *', 'Description *')}</th>
                      <th style={{ padding:"8px 12px", fontSize:11, fontWeight:700, color:"#8a97b0", textAlign:"right", letterSpacing:0.8, width:70 }}>{tx('Cant.', 'Qty')}</th>
                      <th style={{ padding:"8px 12px", fontSize:11, fontWeight:700, color:"#8a97b0", textAlign:"right", letterSpacing:0.8, width:100 }}>{tx('Valor Unitario', 'Unit Value')}</th>
                      <th style={{ padding:"8px 12px", fontSize:11, fontWeight:700, color:"#8a97b0", textAlign:"right", letterSpacing:0.8, width:80 }}>{tx('Descuento', 'Discount')}</th>
                      <th style={{ padding:"8px 12px", fontSize:11, fontWeight:700, color:"#8a97b0", textAlign:"right", letterSpacing:0.8, width:100 }}>{tx('Total', 'Total')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding:"8px 12px" }}>
                        <input type="text" placeholder={tx('Descripción...', 'Description...')} value={nuevoGasto.descripcion} onChange={e=>setNuevoGasto({...nuevoGasto, descripcion:e.target.value})}
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
                    { label:tx('Total Bruto','Gross Total'), val: nuevoGasto.valorUnitario*nuevoGasto.cantidad },
                    { label:tx('Descuentos','Discounts'),   val: nuevoGasto.descuento },
                    { label:tx('Subtotal','Subtotal'),    val: (nuevoGasto.valorUnitario*nuevoGasto.cantidad)-nuevoGasto.descuento, bold:true },
                  ].map(r => (
                    <div key={r.label} style={{ display:"flex", justifyContent:"space-between", padding:"5px 0", borderBottom:"1px solid #f0f4fa" }}>
                      <span style={{ fontSize:12, color:"#8a97b0" }}>{r.label}:</span>
                      <span style={{ fontSize:r.bold?15:12, fontWeight:r.bold?700:400, color:r.bold?P:"#1a2d5a" }}>${r.val.toLocaleString()}</span>
                    </div>
                  ))}
                  <div style={{ display:"flex", justifyContent:"space-between", padding:"10px 0", marginTop:4 }}>
                    <span style={{ fontWeight:700, fontSize:13 }}>{tx('Total Neto:', 'Net Total:')}</span>
                    <span style={{ fontWeight:700, fontSize:18, color:P }}>${((nuevoGasto.valorUnitario*nuevoGasto.cantidad)-nuevoGasto.descuento).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <label style={labelCls}>{tx('Notas', 'Notes')}</label>
              <textarea value={nuevoGasto.observaciones} onChange={e=>setNuevoGasto({...nuevoGasto, observaciones:e.target.value})}
                style={{...inputCls, minHeight:60, resize:"vertical", marginBottom:0}} className="adm-input" placeholder={tx('Notas opcionales...', 'Optional notes...')} />
            </div>
            <div className="adm-modal-ftr">
              <button className="adm-btn adm-btn-p" style={{ flex:1, justifyContent:"center" }} onClick={guardarGasto}><FaSave /> {tx('Guardar', 'Save')}</button>
              <button className="adm-btn adm-btn-o" style={{ flex:1, justifyContent:"center" }} onClick={()=>setModalGasto(false)}>{tx('Cancelar', 'Cancel')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
