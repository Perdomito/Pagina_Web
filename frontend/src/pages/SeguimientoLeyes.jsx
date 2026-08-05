import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaPlus, FaSave } from "react-icons/fa";
import toast from "react-hot-toast";

import contactosService from "../services/ContactosService";
import miembrosService from "../services/MiembrosService";
import seguimientoLeyesService from "../services/SeguimientoLeyesService";
import { useIdioma } from "../context/IdiomaContext";
import colors from "../utils/colors";

const ETAPA_KEYS = {
  "Contacto": "sl_etapaContacto",
  "Termino Romanos 8": "sl_etapaRomanos8",
  "Potencial": "sl_etapaPotencial",
  "Examen de Romanos": "sl_etapaExamen",
  "Ley 1": "sl_etapaLey1",
  "Ley 2": "sl_etapaLey2",
  "Ley 3": "sl_etapaLey3",
  "Ley 4": "sl_etapaLey4",
  "Camino al Discipulo": "sl_etapaCamino",
  "Entrevista": "sl_etapaEntrevista",
  "Miembro": "sl_etapaMiembro",
};

const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: "10px",
  border: `1px solid ${colors.border}`,
  fontSize: "14px",
  boxSizing: "border-box",
  color: colors.primary,
  fontFamily: "'Lato', sans-serif"
};

const cardStyle = {
  background: colors.background,
  borderRadius: "14px",
  border: `1px solid ${colors.border}`,
  boxShadow: "0 6px 20px rgba(19,64,105,0.08)"
};

export default function SeguimientoLeyes() {
  const navigate = useNavigate();
  const { t } = useIdioma();
  const [loading, setLoading] = useState(true);
  const [procesos, setProcesos] = useState([]);
  const [contactos, setContactos] = useState([]);
  const [miembros, setMiembros] = useState([]);
  const [etapas, setEtapas] = useState([]);
  const [filtroEstado, setFiltroEstado] = useState("");
  const [soloAlertas, setSoloAlertas] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [seleccionadoId, setSeleccionadoId] = useState(null);
  const [notaAvance, setNotaAvance] = useState("");
  const [mostrarModal, setMostrarModal] = useState(false);
  const [guardandoDetalle, setGuardandoDetalle] = useState(false);
  const [formDetalle, setFormDetalle] = useState({
    miembro_contacto_id: "",
    miembro_estudios_id: "",
    tipo_miembro_destino: "Registrado",
    notas_generales: ""
  });
  const [formNuevo, setFormNuevo] = useState({
    contacto_id: "",
    miembro_contacto_id: "",
    miembro_estudios_id: "",
    tipo_miembro_destino: "Registrado",
    notas_generales: ""
  });

  const traducirEtapa = (etapa) => t(ETAPA_KEYS[etapa] || etapa);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [procesosData, contactosData, miembrosData, etapasData] = await Promise.all([
        seguimientoLeyesService.getAll(),
        contactosService.getAll(),
        miembrosService.getAll(),
        seguimientoLeyesService.getEtapas()
      ]);
      setProcesos(procesosData || []);
      setContactos(contactosData || []);
      setMiembros(miembrosData || []);
      setEtapas(etapasData || []);
      if (!seleccionadoId && procesosData?.length) {
        setSeleccionadoId(procesosData[0].id);
      } else if (seleccionadoId && !procesosData.some((item) => item.id === seleccionadoId)) {
        setSeleccionadoId(procesosData[0]?.id || null);
      }
    } catch (error) {
      console.error(error);
      toast.error(t("sl_errorCargar"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const procesosFiltrados = useMemo(() => {
    return procesos.filter((item) => {
      if (soloAlertas && !item.abandono_alerta) return false;
      if (filtroEstado && item.estado_actual !== filtroEstado) return false;
      if (!busqueda.trim()) return true;
      const q = busqueda.toLowerCase();
      return (
        item.contacto_nombre?.toLowerCase().includes(q) ||
        item.miembro_contacto_nombre?.toLowerCase().includes(q) ||
        item.miembro_estudios_nombre?.toLowerCase().includes(q)
      );
    });
  }, [busqueda, filtroEstado, procesos, soloAlertas]);

  const seleccionado = procesos.find((item) => item.id === seleccionadoId) || null;

  useEffect(() => {
    if (seleccionado) {
      setFormDetalle({
        miembro_contacto_id: seleccionado.miembro_contacto_id || "",
        miembro_estudios_id: seleccionado.miembro_estudios_id || "",
        tipo_miembro_destino: seleccionado.tipo_miembro_destino || "Registrado",
        notas_generales: seleccionado.notas_generales || ""
      });
    }
  }, [seleccionado]);

  const resumen = useMemo(() => ({
    activos: procesos.filter((item) => item.estado_actual !== "Miembro").length,
    alertas: procesos.filter((item) => item.abandono_alerta).length,
    miembros: procesos.filter((item) => item.estado_actual === "Miembro").length
  }), [procesos]);

  const opcionesDestino = [
    { value: "Comprometido", label: t("sl_miembroDestinoComprometido") },
    { value: "Registrado", label: t("sl_miembroDestinoRegistrado") },
    { value: "Compañerismo-Ministerio", label: t("sl_miembroDestinoCompanerismo") }
  ];

  const etapasRestantes = seleccionado
    ? etapas.filter((etapa) => etapa.orden > seleccionado.etapa_actual_orden)
    : [];

  const crearProceso = async (e) => {
    e.preventDefault();
    try {
      await seguimientoLeyesService.create({
        ...formNuevo,
        contacto_id: Number(formNuevo.contacto_id)
      });
      toast.success(t("sl_exitoCrear"));
      setMostrarModal(false);
      setFormNuevo({
        contacto_id: "",
        miembro_contacto_id: "",
        miembro_estudios_id: "",
        tipo_miembro_destino: "Registrado",
        notas_generales: ""
      });
      await cargarDatos();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.detail || t("sl_errorCrear"));
    }
  };

  const guardarDetalle = async () => {
    if (!seleccionado) return;
    try {
      setGuardandoDetalle(true);
      const actualizado = await seguimientoLeyesService.update(seleccionado.id, formDetalle);
      setProcesos((prev) => prev.map((item) => (item.id === actualizado.id ? actualizado : item)));
      toast.success(t("sl_exitoActualizar"));
      await cargarDatos();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.detail || t("sl_errorActualizar"));
    } finally {
      setGuardandoDetalle(false);
    }
  };

  const avanzar = async (etapa) => {
    if (!seleccionado) return;
    try {
      await seguimientoLeyesService.avanzar(seleccionado.id, {
        etapa: etapa.nombre,
        notas: notaAvance || null
      });
      setNotaAvance("");
      toast.success(`${t("sl_guardarAvance")}: ${traducirEtapa(etapa.nombre)}`);
      await cargarDatos();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.detail || t("sl_errorActualizar"));
    }
  };

  const contactoOptions = contactos.filter((contacto) => {
    return !procesos.some((item) => item.contacto_id === contacto.id && item.activo);
  });

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(160deg, ${colors.primary} 0%, ${colors.primaryLight} 38%, ${colors.backgroundGray} 38%)`, padding: "24px" }}>
      <div style={{ maxWidth: "1580px", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", marginBottom: "22px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <button onClick={() => navigate("/home")} style={{ background: "rgba(255,255,255,0.18)", color: "white", border: "none", borderRadius: "10px", padding: "10px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontWeight: 700 }}>
              <FaArrowLeft /> {t("volver")}
            </button>
            <div>
              <h1 style={{ margin: 0, color: "white", fontSize: "26px", fontFamily: "'Cinzel', serif" }}>{t("sl_titulo")}</h1>
              <div style={{ color: "rgba(255,255,255,0.78)", fontSize: "13px" }}>{t("sl_subtitulo")}</div>
            </div>
          </div>
          <button onClick={() => setMostrarModal(true)} style={{ background: colors.success, color: "white", border: "none", borderRadius: "10px", padding: "12px 18px", cursor: "pointer", fontWeight: 800, display: "flex", alignItems: "center", gap: "8px" }}>
            <FaPlus /> {t("sl_nuevoProceso")}
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "14px", marginBottom: "20px" }}>
          {[
            { label: t("sl_cardActivos"), value: resumen.activos, color: colors.primary },
            { label: t("sl_cardAlertas"), value: resumen.alertas, color: colors.danger },
            { label: t("sl_cardMiembros"), value: resumen.miembros, color: colors.success }
          ].map((item) => (
            <div key={item.label} style={{ ...cardStyle, padding: "18px 20px" }}>
              <div style={{ color: "#7a8aa4", fontSize: "12px", marginBottom: "6px", fontWeight: 700 }}>{item.label}</div>
              <div style={{ fontSize: "34px", fontWeight: 800, color: item.color }}>{item.value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "420px minmax(0, 1fr)", gap: "18px", alignItems: "start" }}>
          <div style={{ ...cardStyle, padding: "18px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 170px 150px", gap: "10px", marginBottom: "14px" }}>
              <input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder={t("sl_buscarContacto")}
                style={inputStyle}
              />
              <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} style={inputStyle}>
                <option value="">{t("sl_filtroTodos")}</option>
                {etapas.map((etapa) => (
                  <option key={etapa.orden} value={etapa.nombre}>{traducirEtapa(etapa.nombre)}</option>
                ))}
              </select>
              <button
                onClick={() => setSoloAlertas((prev) => !prev)}
                style={{
                  border: "none",
                  borderRadius: "10px",
                  cursor: "pointer",
                  fontWeight: 700,
                  background: soloAlertas ? "#ffd6d6" : "#eef3fa",
                  color: soloAlertas ? "#b71c1c" : "#34506e"
                }}
              >
                {soloAlertas ? t("sl_filtroAlertas") : t("sl_filtroTodos")}
              </button>
            </div>

            {loading ? (
              <div style={{ padding: "24px", color: "#6c7a93" }}>{t("cargando")}</div>
            ) : procesosFiltrados.length === 0 ? (
              <div style={{ padding: "24px", color: "#6c7a93" }}>{t("sl_sinProcesos")}</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "70vh", overflowY: "auto" }}>
                {procesosFiltrados.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSeleccionadoId(item.id)}
                    style={{
                      textAlign: "left",
                      borderRadius: "12px",
                      border: item.id === seleccionadoId ? `2px solid ${colors.primary}` : `1px solid ${item.abandono_alerta ? "#f1b5b5" : colors.border}`,
                      background: item.abandono_alerta ? "#fff1f1" : "white",
                      padding: "14px",
                      cursor: "pointer"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontWeight: 800, color: colors.primary, marginBottom: "4px" }}>{item.contacto_nombre}</div>
                        <div style={{ color: "#6f7e96", fontSize: "12px" }}>{traducirEtapa(item.estado_actual)}</div>
                      </div>
                      {item.abandono_alerta && (
                        <div style={{ background: "#d32f2f", color: "white", fontSize: "11px", borderRadius: "999px", padding: "4px 10px", fontWeight: 800 }}>
                          {t("sl_alertaAbandono")}
                        </div>
                      )}
                    </div>
                    <div style={{ marginTop: "10px", fontSize: "12px", color: item.abandono_alerta ? "#b71c1c" : "#6f7e96" }}>
                      {t("sl_contactadoPor")}: {item.miembro_contacto_nombre || "-"} · {t("sl_estudiosPor")}: {item.miembro_estudios_nombre || "-"}
                    </div>
                    <div style={{ marginTop: "6px", fontSize: "12px", color: item.abandono_alerta ? "#b71c1c" : "#6f7e96" }}>
                      {t("sl_diasInactivo").replace("{dias}", item.dias_inactivo)}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={{ ...cardStyle, padding: "20px" }}>
            {!seleccionado ? (
              <div style={{ color: "#6c7a93", padding: "24px" }}>{t("sl_sinSeleccion")}</div>
            ) : (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", alignItems: "flex-start", marginBottom: "18px" }}>
                  <div>
                    <h2 style={{ margin: "0 0 8px", color: colors.primary }}>{seleccionado.contacto_nombre}</h2>
                    <div style={{ color: "#6c7a93", fontSize: "13px" }}>
                      {t("sl_estadoActual")}: <strong>{traducirEtapa(seleccionado.estado_actual)}</strong>
                    </div>
                    <div style={{ color: "#6c7a93", fontSize: "13px", marginTop: "4px" }}>
                      {t("sl_desde")}: {new Date(seleccionado.fecha_inicio).toLocaleDateString()}
                    </div>
                    <div style={{ color: "#6c7a93", fontSize: "13px", marginTop: "4px" }}>
                      {t("sl_telefono")}: {seleccionado.contacto_telefono || "-"}
                    </div>
                  </div>
                  {seleccionado.abandono_alerta && (
                    <div style={{ background: "#ffebee", color: "#c62828", border: "1px solid #ef9a9a", padding: "10px 14px", borderRadius: "12px", fontWeight: 800 }}>
                      {t("sl_alertaAbandono")}
                    </div>
                  )}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "14px", marginBottom: "18px" }}>
                  <div>
                    <label style={{ display: "block", marginBottom: "6px", fontWeight: 700, color: "#54657d" }}>{t("sl_contactadoPor")}</label>
                    <select value={formDetalle.miembro_contacto_id} onChange={(e) => setFormDetalle((prev) => ({ ...prev, miembro_contacto_id: e.target.value }))} style={inputStyle}>
                      <option value="">-</option>
                      {miembros.map((miembro) => <option key={miembro.id} value={miembro.id}>{miembro.nombre}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "6px", fontWeight: 700, color: "#54657d" }}>{t("sl_estudiosPor")}</label>
                    <select value={formDetalle.miembro_estudios_id} onChange={(e) => setFormDetalle((prev) => ({ ...prev, miembro_estudios_id: e.target.value }))} style={inputStyle}>
                      <option value="">-</option>
                      {miembros.map((miembro) => <option key={miembro.id} value={miembro.id}>{miembro.nombre}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "6px", fontWeight: 700, color: "#54657d" }}>{t("sl_tipoDestino")}</label>
                    <select value={formDetalle.tipo_miembro_destino} onChange={(e) => setFormDetalle((prev) => ({ ...prev, tipo_miembro_destino: e.target.value }))} style={inputStyle}>
                      {opcionesDestino.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "6px", fontWeight: 700, color: "#54657d" }}>{t("sl_convertidoMiembro")}</label>
                    <div style={{ ...inputStyle, background: colors.backgroundGray }}>{seleccionado.miembro_convertido_nombre || "-"}</div>
                  </div>
                </div>

                <div style={{ marginBottom: "18px" }}>
                  <label style={{ display: "block", marginBottom: "6px", fontWeight: 700, color: "#54657d" }}>{t("sl_notas")}</label>
                  <textarea rows="3" value={formDetalle.notas_generales} onChange={(e) => setFormDetalle((prev) => ({ ...prev, notas_generales: e.target.value }))} style={{ ...inputStyle, resize: "vertical" }} />
                </div>

                <div style={{ marginBottom: "20px", display: "flex", justifyContent: "flex-end" }}>
                  <button onClick={guardarDetalle} disabled={guardandoDetalle} style={{ background: colors.primary, color: "white", border: "none", borderRadius: "10px", padding: "11px 18px", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
                    <FaSave /> {t("guardar")}
                  </button>
                </div>

                <div style={{ marginBottom: "18px" }}>
                  <div style={{ fontWeight: 800, color: colors.primary, marginBottom: "8px" }}>{t("sl_avanzarA")}</div>
                  <textarea rows="2" value={notaAvance} onChange={(e) => setNotaAvance(e.target.value)} placeholder={t("sl_notasAvance")} style={{ ...inputStyle, resize: "vertical", marginBottom: "10px" }} />
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {etapasRestantes.map((etapa) => (
                      <button key={etapa.orden} onClick={() => avanzar(etapa)} style={{ border: "none", background: etapa.nombre === "Miembro" ? colors.success : colors.primaryLight, color: "white", borderRadius: "999px", padding: "10px 14px", fontWeight: 700, cursor: "pointer" }}>
                        {traducirEtapa(etapa.nombre)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div style={{ fontWeight: 800, color: colors.primary, marginBottom: "10px" }}>{t("sl_historial")}</div>
                  {seleccionado.historial?.length ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {seleccionado.historial.map((item) => (
                        <div key={item.id} style={{ borderLeft: `4px solid ${colors.primaryLight}`, background: colors.backgroundGray, padding: "12px 14px", borderRadius: "0 12px 12px 0" }}>
                          <div style={{ fontWeight: 800, color: colors.primary }}>{traducirEtapa(item.etapa)}</div>
                          <div style={{ fontSize: "12px", color: "#6c7a93", marginTop: "4px" }}>{new Date(item.fecha_evento).toLocaleString()}</div>
                          {item.notas && <div style={{ marginTop: "6px", color: "#334a68", fontSize: "14px" }}>{item.notas}</div>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ color: "#6c7a93" }}>{t("sl_sinHistorial")}</div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {mostrarModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(10,20,30,0.55)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000, padding: "20px" }}>
          <form onSubmit={crearProceso} style={{ width: "100%", maxWidth: "720px", ...cardStyle, padding: "22px" }}>
            <h3 style={{ marginTop: 0, color: colors.primary }}>{t("sl_nuevoProceso")}</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "14px" }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ display: "block", marginBottom: "6px", fontWeight: 700, color: "#54657d" }}>{t("sl_contacto")}</label>
                <select required value={formNuevo.contacto_id} onChange={(e) => setFormNuevo((prev) => ({ ...prev, contacto_id: e.target.value }))} style={inputStyle}>
                  <option value="">-</option>
                  {contactoOptions.map((contacto) => (
                    <option key={contacto.id} value={contacto.id}>
                      {contacto.nombre} {contacto.telefono ? `· ${contacto.telefono}` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "6px", fontWeight: 700, color: "#54657d" }}>{t("sl_contactadoPor")}</label>
                <select value={formNuevo.miembro_contacto_id} onChange={(e) => setFormNuevo((prev) => ({ ...prev, miembro_contacto_id: e.target.value }))} style={inputStyle}>
                  <option value="">-</option>
                  {miembros.map((miembro) => <option key={miembro.id} value={miembro.id}>{miembro.nombre}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "6px", fontWeight: 700, color: "#54657d" }}>{t("sl_estudiosPor")}</label>
                <select value={formNuevo.miembro_estudios_id} onChange={(e) => setFormNuevo((prev) => ({ ...prev, miembro_estudios_id: e.target.value }))} style={inputStyle}>
                  <option value="">-</option>
                  {miembros.map((miembro) => <option key={miembro.id} value={miembro.id}>{miembro.nombre}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "6px", fontWeight: 700, color: "#54657d" }}>{t("sl_tipoDestino")}</label>
                <select value={formNuevo.tipo_miembro_destino} onChange={(e) => setFormNuevo((prev) => ({ ...prev, tipo_miembro_destino: e.target.value }))} style={inputStyle}>
                  {opcionesDestino.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ display: "block", marginBottom: "6px", fontWeight: 700, color: "#54657d" }}>{t("sl_notas")}</label>
                <textarea rows="4" value={formNuevo.notas_generales} onChange={(e) => setFormNuevo((prev) => ({ ...prev, notas_generales: e.target.value }))} style={{ ...inputStyle, resize: "vertical" }} />
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "18px" }}>
              <button type="button" onClick={() => setMostrarModal(false)} style={{ background: "#eef3fa", color: "#28415f", border: "none", borderRadius: "10px", padding: "11px 16px", fontWeight: 700, cursor: "pointer" }}>
                {t("cancelar")}
              </button>
              <button type="submit" style={{ background: colors.primary, color: "white", border: "none", borderRadius: "10px", padding: "11px 16px", fontWeight: 800, cursor: "pointer" }}>
                {t("sl_crear")}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
