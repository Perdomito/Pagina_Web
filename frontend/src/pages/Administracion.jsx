import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaPlus, FaTrash, FaCheckCircle, FaTimesCircle, FaExclamationTriangle, FaSave } from "react-icons/fa";
import toast from 'react-hot-toast';
import administracionService from '../services/AdministracionService';
import { useAuth } from '../context/AuthContext';

export default function Administracion() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [paisSeleccionado, setPaisSeleccionado] = useState(1);
  const [paisNombre, setPaisNombre] = useState("");
  const [añoSeleccionado] = useState(2026);
  const [mesSeleccionado, setMesSeleccionado] = useState("ENERO");
  const [tabActivo, setTabActivo] = useState("presupuesto");
  
  const [tasaCambio, setTasaCambio] = useState(58.00);
  const [montoRecibidoUSD, setMontoRecibidoUSD] = useState(0);
  const [gastos, setGastos] = useState([]);
  const [cotizaciones, setCotizaciones] = useState([]);
  
  const [cargando, setCargando] = useState(false);
  const [mostrandoModal, setMostrandoModal] = useState(false);
  const [tipoModal, setTipoModal] = useState("");
  const [nuevoItem, setNuevoItem] = useState({ concepto: "", monto: "", solicitante: "" });
  
  const meses = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
  
  useEffect(() => {
    if (user) {
      const pais = user.pais_id || 1;
      setPaisSeleccionado(pais);
      cargarDatosIniciales(pais);
      cargarNombrePais(pais);
    }
  }, [user]);
  
  useEffect(() => {
    if (paisSeleccionado && mesSeleccionado) {
      cargarDatosMes();
    }
  }, [mesSeleccionado, paisSeleccionado]);
  
  const cargarNombrePais = async (pais_id) => {
    try {
      const paises = await administracionService.getAllPaises();
      const pais = paises.find(p => p.id === pais_id);
      if (pais) {
        setPaisNombre(pais.nombre);
      }
    } catch (error) {
      console.error('Error al cargar nombre del país:', error);
    }
  };
  
  const cargarDatosIniciales = async (pais_id) => {
    try {
      setCargando(true);
      const tasa = await administracionService.getTasaCambio();
      setTasaCambio(parseFloat(tasa));
      
      const cotizacionesData = await administracionService.getAllCotizaciones();
      setCotizaciones(cotizacionesData);
      
      toast.success("Datos cargados correctamente");
    } catch (error) {
      console.error('Error al cargar datos:', error);
      toast.error("Error al cargar datos iniciales");
    } finally {
      setCargando(false);
    }
  };
  
  const cargarDatosMes = async () => {
    try {
      setCargando(true);
      
      const detalles = await administracionService.getDetallePresupuesto(
        paisSeleccionado,
        mesSeleccionado,
        añoSeleccionado
      );
      
      const gastosDelMes = detalles.map(d => ({
        id: d.id,
        concepto: d.concepto,
        monto: parseFloat(d.monto),
        tipo: d.tipo
      }));
      
      setGastos(gastosDelMes);
      setMontoRecibidoUSD(0);
      
    } catch (error) {
      console.error('Error al cargar datos del mes:', error);
    } finally {
      setCargando(false);
    }
  };
  
  const guardarMontoRecibido = async (nuevoMonto) => {
    setMontoRecibidoUSD(nuevoMonto);
  };
  
  const abrirModalAgregar = (tipo) => {
    setTipoModal(tipo);
    setNuevoItem({ concepto: "", monto: "", solicitante: "" });
    setMostrandoModal(true);
  };
  
  const agregarItem = async () => {
    if (tipoModal === "cotizacion") {
      if (!nuevoItem.solicitante || !nuevoItem.concepto || !nuevoItem.monto) {
        toast.error("Complete todos los campos");
        return;
      }
      
      try {
        const datos = {
          fecha: new Date().toISOString().split('T')[0],
          solicitante: nuevoItem.solicitante,
          concepto: nuevoItem.concepto,
          monto: parseFloat(nuevoItem.monto)
        };
        
        const nuevaCotizacion = await administracionService.crearCotizacion(datos);
        setCotizaciones([...cotizaciones, nuevaCotizacion]);
        toast.success("Cotización creada");
        setMostrandoModal(false);
      } catch (error) {
        console.error('Error al crear cotización:', error);
        toast.error("Error al crear cotización");
      }
    } else {
      if (!nuevoItem.concepto || !nuevoItem.monto) {
        toast.error("Complete todos los campos");
        return;
      }
      
      try {
        const datos = {
          pais_id: paisSeleccionado,
          mes: mesSeleccionado,
          anio: añoSeleccionado,
          tipo: tipoModal,
          concepto: nuevoItem.concepto,
          monto: parseFloat(nuevoItem.monto),
          moneda: "DOP",
          tasa_cambio: tasaCambio
        };
        
        const gastoGuardado = await administracionService.agregarItemPresupuesto(datos);
        
        setGastos([...gastos, {
          id: gastoGuardado.id,
          concepto: nuevoItem.concepto,
          monto: parseFloat(nuevoItem.monto),
          tipo: tipoModal
        }]);
        
        toast.success("Gasto agregado");
        setMostrandoModal(false);
      } catch (error) {
        console.error('Error al agregar gasto:', error);
        toast.error("Error al guardar gasto");
      }
    }
  };
  
  const eliminarGasto = async (id) => {
    if (!window.confirm("¿Eliminar este gasto?")) return;
    
    try {
      await administracionService.eliminarItemPresupuesto(id);
      setGastos(gastos.filter(g => g.id !== id));
      toast.success("Gasto eliminado");
    } catch (error) {
      console.error('Error al eliminar:', error);
      toast.error("Error al eliminar");
    }
  };
  
  const aprobarCotizacion = async (id) => {
    try {
      const cotizacion = cotizaciones.find(c => c.id === id);
      
      if (!cotizacion) {
        toast.error("Cotización no encontrada");
        return;
      }
      
      await administracionService.aprobarCotizacion(id, mesSeleccionado, añoSeleccionado);
      
      const datos = {
        pais_id: paisSeleccionado,
        mes: mesSeleccionado,
        anio: añoSeleccionado,
        tipo: "otro_gasto",
        concepto: `${cotizacion.concepto} (${cotizacion.solicitante})`,
        monto: parseFloat(cotizacion.monto),
        moneda: "DOP",
        tasa_cambio: tasaCambio
      };
      
      const gastoGuardado = await administracionService.agregarItemPresupuesto(datos);
      
      cotizacion.estado = "aprobado";
      cotizacion.agregado_a_gastos = true;
      setCotizaciones([...cotizaciones]);
      
      setGastos([...gastos, {
        id: gastoGuardado.id,
        concepto: datos.concepto,
        monto: parseFloat(cotizacion.monto),
        tipo: "otro_gasto"
      }]);
      
      toast.success("Cotización aprobada y agregada a gastos");
    } catch (error) {
      console.error('Error al aprobar:', error);
      toast.error("Error al aprobar cotización");
    }
  };
  
  const rechazarCotizacion = async (id) => {
    try {
      await administracionService.rechazarCotizacion(id);
      const cotizacion = cotizaciones.find(c => c.id === id);
      cotizacion.estado = "rechazado";
      setCotizaciones([...cotizaciones]);
      toast.success("Cotización rechazada");
    } catch (error) {
      console.error('Error al rechazar:', error);
      toast.error("Error al rechazar cotización");
    }
  };
  
  const actualizarTasaCambio = async (nuevaTasa) => {
    setTasaCambio(nuevaTasa);
    try {
      await administracionService.actualizarTasaCambio(nuevaTasa);
    } catch (error) {
      console.error('Error al actualizar tasa:', error);
    }
  };
  
  const totalGastado = gastos.reduce((sum, g) => sum + g.monto, 0);
  const presupuestoDOP = montoRecibidoUSD * tasaCambio;
  const restante = presupuestoDOP - totalGastado;
  const alertaPresupuesto = restante < 0;
  
  if (cargando && !paisSeleccionado) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f7fa" }}>
        <div style={{ fontSize: "18px", color: "#666" }}>Cargando...</div>
      </div>
    );
  }
  
  return (
    <div style={{ minHeight: "100vh", background: "#f5f7fa", padding: "20px" }}>
      <style>{`
        .tab-button {
          padding: 12px 24px;
          border: none;
          background: transparent;
          color: #666;
          font-weight: 600;
          font-size: 15px;
          cursor: pointer;
          border-bottom: 3px solid transparent;
          transition: all 0.3s;
        }
        
        .tab-button:hover {
          color: #0E5A61;
        }
        
        .tab-button.active {
          color: #0E5A61;
          border-bottom-color: #0E5A61;
        }
        
        .mes-button {
          padding: 10px 18px;
          border: 2px solid #e0e0e0;
          background: white;
          color: #666;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          border-radius: 8px;
          transition: all 0.3s;
        }
        
        .mes-button:hover {
          border-color: #0E5A61;
          color: #0E5A61;
        }
        
        .mes-button.active {
          background: #0E5A61;
          color: white;
          border-color: #0E5A61;
        }
        
        .card {
          background: white;
          border-radius: 12px;
          padding: 25px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
        
        .gasto-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px;
          border-bottom: 1px solid #f0f0f0;
          transition: background 0.2s;
        }
        
        .gasto-item:hover {
          background: #f8f9fa;
        }
        
        .gasto-item:last-child {
          border-bottom: none;
        }
        
        .btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          font-size: 14px;
        }
        
        .btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        
        .btn-success {
          background: #4CAF50;
          color: white;
        }
        
        .btn-danger {
          background: #f44336;
          color: white;
        }
        
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        
        .modal-content {
          background: white;
          padding: 30px;
          border-radius: 16px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.2);
          max-width: 500px;
          width: 90%;
        }
        
        .input {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          font-size: 14px;
          margin-bottom: 15px;
          box-sizing: border-box;
          transition: border-color 0.3s;
        }
        
        .input:focus {
          outline: none;
          border-color: #0E5A61;
        }
      `}</style>

      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div className="card" style={{ marginBottom: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <div>
              <button onClick={() => navigate("/home")} style={{ background: "none", border: "none", color: "#0E5A61", fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px", padding: 0 }}>
                <FaArrowLeft /> Volver
              </button>
              <h1 style={{ margin: 0, color: "#0E5A61", fontSize: "28px" }}>💼 Administración Financiera</h1>
              <p style={{ color: "#666", margin: "5px 0 0", fontSize: "14px" }}>
                {paisNombre} • Año {añoSeleccionado}
              </p>
            </div>
            
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "13px", color: "#666", marginBottom: "5px" }}>Tasa de Cambio</div>
              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <span style={{ fontSize: "16px", color: "#666" }}>1 USD =</span>
                <input
                  type="number"
                  step="0.01"
                  value={tasaCambio}
                  onChange={(e) => actualizarTasaCambio(parseFloat(e.target.value))}
                  style={{
                    fontSize: "20px",
                    fontWeight: "700",
                    color: "#0E5A61",
                    border: "2px solid #e0e0e0",
                    borderRadius: "8px",
                    padding: "5px 10px",
                    width: "100px",
                    textAlign: "center"
                  }}
                />
                <span style={{ fontSize: "16px", color: "#666" }}>DOP</span>
              </div>
            </div>
          </div>
          
          <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: "20px" }}>
            <div style={{ fontSize: "14px", color: "#666", marginBottom: "12px", fontWeight: "600" }}>📅 Selecciona el mes:</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))", gap: "10px" }}>
              {meses.map(mes => (
                <button
                  key={mes}
                  onClick={() => setMesSeleccionado(mes)}
                  className={`mes-button ${mesSeleccionado === mes ? 'active' : ''}`}
                >
                  {mes.charAt(0) + mes.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <div className="card" style={{ marginBottom: "20px", padding: "0" }}>
          <div style={{ display: "flex", borderBottom: "1px solid #f0f0f0" }}>
            <button
              onClick={() => setTabActivo("presupuesto")}
              className={`tab-button ${tabActivo === "presupuesto" ? 'active' : ''}`}
            >
              💰 Presupuesto
            </button>
            <button
              onClick={() => setTabActivo("gastos")}
              className={`tab-button ${tabActivo === "gastos" ? 'active' : ''}`}
            >
              💸 Gastos
            </button>
            <button
              onClick={() => setTabActivo("cotizaciones")}
              className={`tab-button ${tabActivo === "cotizaciones" ? 'active' : ''}`}
            >
              📝 Cotizaciones
            </button>
          </div>
        </div>
        
        {tabActivo === "presupuesto" && (
          <div className="card">
            <h2 style={{ margin: "0 0 20px", fontSize: "20px", fontWeight: "700" }}>
              Presupuesto de {mesSeleccionado.charAt(0) + mesSeleccionado.slice(1).toLowerCase()} {añoSeleccionado}
            </h2>
            
            <div style={{ marginBottom: "30px" }}>
              <label style={{ display: "block", fontWeight: "600", marginBottom: "10px", color: "#333" }}>
                💵 Presupuesto recibido (USD):
              </label>
              <input
                type="number"
                className="input"
                placeholder="Ingrese el monto en USD..."
                value={montoRecibidoUSD || ""}
                onChange={(e) => guardarMontoRecibido(parseFloat(e.target.value) || 0)}
                style={{ marginBottom: "10px" }}
              />
              <div style={{ fontSize: "14px", color: "#666" }}>
                Equivalente: <strong style={{ color: "#0E5A61" }}>${presupuestoDOP.toLocaleString()} DOP</strong>
              </div>
            </div>
            
            {montoRecibidoUSD > 0 && (
              <div style={{ padding: "20px", background: "#e8f5e9", borderRadius: "12px", textAlign: "center" }}>
                <div style={{ fontSize: "14px", color: "#666", marginBottom: "5px" }}>Presupuesto disponible</div>
                <div style={{ fontSize: "36px", fontWeight: "700", color: "#4CAF50" }}>
                  ${presupuestoDOP.toLocaleString()} DOP
                </div>
              </div>
            )}
          </div>
        )}
        
        {tabActivo === "gastos" && (
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" }}>
              <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "700" }}>
                Gastos de {mesSeleccionado.charAt(0) + mesSeleccionado.slice(1).toLowerCase()}
              </h2>
              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={() => abrirModalAgregar("gasto_fijo")} className="btn btn-success">
                  <FaPlus /> Gasto Fijo
                </button>
                <button onClick={() => abrirModalAgregar("pago_misionero")} className="btn btn-success">
                  <FaPlus /> Misionero
                </button>
                <button onClick={() => abrirModalAgregar("otro_gasto")} className="btn btn-success">
                  <FaPlus /> Otro Gasto
                </button>
              </div>
            </div>
            
            {alertaPresupuesto && (
              <div style={{ padding: "15px", background: "#ffebee", borderRadius: "8px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px", borderLeft: "4px solid #f44336" }}>
                <FaExclamationTriangle style={{ color: "#f44336", fontSize: "20px" }} />
                <div>
                  <div style={{ fontWeight: "700", color: "#f44336", fontSize: "15px" }}>⚠️ ALERTA: Presupuesto excedido</div>
                  <div style={{ fontSize: "13px", color: "#666", marginTop: "3px" }}>
                    Has gastado <strong>${Math.abs(restante).toLocaleString()} DOP</strong> más del presupuesto asignado
                  </div>
                </div>
              </div>
            )}
            
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px", marginBottom: "25px" }}>
              <div style={{ padding: "20px", background: "#e3f2fd", borderRadius: "12px", textAlign: "center" }}>
                <div style={{ fontSize: "13px", color: "#666", marginBottom: "5px" }}>💰 Presupuesto</div>
                <div style={{ fontSize: "24px", fontWeight: "700", color: "#2196F3" }}>
                  ${presupuestoDOP.toLocaleString()}
                </div>
              </div>
              
              <div style={{ padding: "20px", background: "#ffebee", borderRadius: "12px", textAlign: "center" }}>
                <div style={{ fontSize: "13px", color: "#666", marginBottom: "5px" }}>💸 Gastado</div>
                <div style={{ fontSize: "24px", fontWeight: "700", color: "#f44336" }}>
                  ${totalGastado.toLocaleString()}
                </div>
              </div>
              
              <div style={{ padding: "20px", background: alertaPresupuesto ? "#ffebee" : "#e8f5e9", borderRadius: "12px", textAlign: "center" }}>
                <div style={{ fontSize: "13px", color: "#666", marginBottom: "5px" }}>✅ Restante</div>
                <div style={{ fontSize: "24px", fontWeight: "700", color: alertaPresupuesto ? "#f44336" : "#4CAF50" }}>
                  ${restante.toLocaleString()}
                </div>
              </div>
            </div>
            
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "15px", color: "#333" }}>Lista de gastos:</h3>
              {gastos.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px", color: "#999" }}>
                  Sin gastos registrados para este mes
                </div>
              ) : (
                gastos.map(gasto => (
                  <div key={gasto.id} className="gasto-item">
                    <div>
                      <div style={{ fontWeight: "600", color: "#333", marginBottom: "3px" }}>{gasto.concepto}</div>
                      <div style={{ fontSize: "12px", color: "#999" }}>
                        {gasto.tipo === "gasto_fijo" ? "🏢 Gasto Fijo" : gasto.tipo === "pago_misionero" ? "👤 Pago Misionero" : "📦 Otro Gasto"}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                      <span style={{ fontWeight: "700", fontSize: "16px", color: "#0E5A61" }}>
                        ${gasto.monto.toLocaleString()}
                      </span>
                      <button onClick={() => eliminarGasto(gasto.id)} style={{ background: "none", border: "none", color: "#f44336", cursor: "pointer", fontSize: "16px" }}>
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
        
        {tabActivo === "cotizaciones" && (
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "700" }}>Cotizaciones</h2>
                <p style={{ color: "#666", fontSize: "13px", margin: "5px 0 0" }}>
                  Solicitudes de misioneros. Al aprobar, se agregan automáticamente a gastos.
                </p>
              </div>
              <button onClick={() => abrirModalAgregar("cotizacion")} className="btn btn-success">
                <FaPlus /> Nueva Cotización
              </button>
            </div>
            
            <div style={{ display: "grid", gap: "15px" }}>
              {cotizaciones.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px", color: "#999" }}>
                  Sin cotizaciones registradas
                </div>
              ) : (
                cotizaciones.map(cot => (
                  <div key={cot.id} style={{ 
                    background: "white", 
                    padding: "20px", 
                    borderRadius: "12px", 
                    border: "2px solid #e0e0e0",
                    borderLeftWidth: "5px",
                    borderLeftColor: cot.estado === "aprobado" ? "#4CAF50" : cot.estado === "rechazado" ? "#f44336" : "#FF9800"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "18px", fontWeight: "700", marginBottom: "5px", color: "#333" }}>
                          {cot.concepto}
                        </div>
                        <div style={{ fontSize: "14px", color: "#666", marginBottom: "10px" }}>
                          👤 {cot.solicitante} • {new Date(cot.fecha).toLocaleDateString('es-DO')}
                        </div>
                        <div style={{ fontSize: "28px", fontWeight: "700", color: "#0E5A61" }}>
                          ${parseFloat(cot.monto).toLocaleString()} DOP
                        </div>
                        {cot.agregado_a_gastos && (
                          <div style={{ marginTop: "10px", fontSize: "13px", color: "#4CAF50", fontWeight: "600" }}>
                            ✓ Ya agregada a gastos
                          </div>
                        )}
                      </div>
                      
                      <div style={{ display: "flex", gap: "10px", flexDirection: "column" }}>
                        {cot.estado === "pendiente" && (
                          <>
                            <button onClick={() => aprobarCotizacion(cot.id)} className="btn btn-success" style={{ fontSize: "13px", padding: "8px 16px" }}>
                              <FaCheckCircle /> Aprobar
                            </button>
                            <button onClick={() => rechazarCotizacion(cot.id)} className="btn btn-danger" style={{ fontSize: "13px", padding: "8px 16px" }}>
                              <FaTimesCircle /> Rechazar
                            </button>
                          </>
                        )}
                        {cot.estado === "aprobado" && (
                          <div style={{ padding: "10px 20px", background: "#4CAF50", color: "white", borderRadius: "8px", fontWeight: "600", fontSize: "13px" }}>
                            ✓ Aprobada
                          </div>
                        )}
                        {cot.estado === "rechazado" && (
                          <div style={{ padding: "10px 20px", background: "#f44336", color: "white", borderRadius: "8px", fontWeight: "600", fontSize: "13px" }}>
                            ✗ Rechazada
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
        
        {mostrandoModal && (
          <div className="modal-overlay" onClick={() => setMostrandoModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3 style={{ margin: "0 0 20px", fontSize: "20px", fontWeight: "700" }}>
                {tipoModal === "cotizacion" ? "➕ Nueva Cotización" : 
                 tipoModal === "gasto_fijo" ? "➕ Nuevo Gasto Fijo" :
                 tipoModal === "pago_misionero" ? "➕ Nuevo Pago Misionero" :
                 "➕ Nuevo Otro Gasto"}
              </h3>
              
              {tipoModal === "cotizacion" && (
                <>
                  <input
                    type="text"
                    className="input"
                    placeholder="Nombre del solicitante"
                    value={nuevoItem.solicitante}
                    onChange={(e) => setNuevoItem({...nuevoItem, solicitante: e.target.value})}
                  />
                  <input
                    type="text"
                    className="input"
                    placeholder="Concepto (ej: Materiales, Comida...)"
                    value={nuevoItem.concepto}
                    onChange={(e) => setNuevoItem({...nuevoItem, concepto: e.target.value})}
                  />
                </>
              )}
              
              {tipoModal !== "cotizacion" && (
                <input
                  type="text"
                  className="input"
                  placeholder="Concepto del gasto"
                  value={nuevoItem.concepto}
                  onChange={(e) => setNuevoItem({...nuevoItem, concepto: e.target.value})}
                />
              )}
              
              <input
                type="number"
                className="input"
                placeholder="Monto en DOP"
                value={nuevoItem.monto}
                onChange={(e) => setNuevoItem({...nuevoItem, monto: e.target.value})}
              />
              
              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={agregarItem} className="btn btn-success" style={{ flex: 1, justifyContent: "center" }}>
                  <FaSave /> Guardar
                </button>
                <button onClick={() => setMostrandoModal(false)} className="btn btn-danger" style={{ flex: 1, justifyContent: "center" }}>
                  <FaTimesCircle /> Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
