import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaPlus } from "react-icons/fa";
import toast from 'react-hot-toast';
import administracionService from '../services/AdministracionService';
import iglesiasService from '../services/IglesiasService';
import { useAuth } from '../context/AuthContext';
import { useIdioma } from '../context/IdiomaContext';

const PRIMARY = "#1a5490";

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  border: "1.5px solid #dde3ef",
  borderRadius: "8px",
  fontSize: "14px",
  fontFamily: "'Lato', sans-serif",
  color: "#1a2d5a",
  outline: "none",
  boxSizing: "border-box"
};

const labelStyle = {
  display: "block",
  marginBottom: "5px",
  fontWeight: "700",
  fontSize: "13px",
  letterSpacing: "0.5px",
  color: "#5a6a85"
};

const celdaStyle = { padding: "10px 12px", fontSize: "13px" };

export default function Iglesias() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, idioma } = useIdioma();
  const tx = (es, en) => (idioma === 'en' ? en : es);

  const [paises, setPaises] = useState([]);
  const [paisSeleccionado, setPaisSeleccionado] = useState('');
  const [ciudadesPais, setCiudadesPais] = useState([]);
  const [iglesias, setIglesias] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  const [nuevaIglesia, setNuevaIglesia] = useState({
    ciudad_id: '', nombre: '', pastor_encargado_nombre: '', fecha_apertura: ''
  });
  const [guardandoNueva, setGuardandoNueva] = useState(false);

  const [editandoId, setEditandoId] = useState(null);
  const [edicion, setEdicion] = useState({ nombre: '', pastor_encargado_nombre: '', fecha_apertura: '' });
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);

  useEffect(() => {
    administracionService.getAllPaises()
      .then(data => {
        setPaises(data || []);
        if (user?.pais_id && !paisSeleccionado) {
          setPaisSeleccionado(String(user.pais_id));
        }
      })
      .catch(() => setPaises([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!paisSeleccionado) {
      setCiudadesPais([]);
      setIglesias([]);
      return;
    }
    const pais = paises.find(p => String(p.id) === String(paisSeleccionado));
    let cancelado = false;

    setCargando(true);
    iglesiasService.getAll({ pais_id: paisSeleccionado })
      .then(data => { if (!cancelado) setIglesias(data || []); })
      .catch(() => { if (!cancelado) setIglesias([]); })
      .finally(() => { if (!cancelado) setCargando(false); });

    const iso = pais?.iso || pais?.codigo_iso;
    if (iso) {
      administracionService.getCiudadesPorPaisIso2(iso)
        .then(data => { if (!cancelado) setCiudadesPais(data || []); })
        .catch(() => { if (!cancelado) setCiudadesPais([]); });
    } else {
      setCiudadesPais([]);
    }

    return () => { cancelado = true; };
  }, [paisSeleccionado, paises]);

  const recargarIglesias = () => {
    if (!paisSeleccionado) return;
    iglesiasService.getAll({ pais_id: paisSeleccionado })
      .then(data => setIglesias(data || []))
      .catch(() => {});
  };

  const iglesiasFiltradas = useMemo(
    () => iglesias.filter(ig => (ig.nombre || '').toLowerCase().includes(busqueda.trim().toLowerCase())),
    [iglesias, busqueda]
  );

  const agregarIglesia = async () => {
    if (!nuevaIglesia.ciudad_id || !nuevaIglesia.nombre.trim()) {
      toast.error(tx('Selecciona la ciudad y escribe el nombre de la iglesia', 'Select the city and enter the church name'));
      return;
    }
    setGuardandoNueva(true);
    try {
      await iglesiasService.crear({
        nombre: nuevaIglesia.nombre.trim(),
        ciudad_id: Number(nuevaIglesia.ciudad_id),
        pais_id: Number(paisSeleccionado),
        pastor_encargado_nombre: nuevaIglesia.pastor_encargado_nombre || null,
        fecha_apertura: nuevaIglesia.fecha_apertura || null,
        activa: true,
      });
      setNuevaIglesia({ ciudad_id: '', nombre: '', pastor_encargado_nombre: '', fecha_apertura: '' });
      recargarIglesias();
      toast.success(tx('Iglesia agregada', 'Church added'));
    } catch (error) {
      toast.error(error.response?.data?.detail ? String(error.response.data.detail).slice(0, 160) : tx('No se pudo agregar la iglesia', 'Could not add the church'));
    } finally {
      setGuardandoNueva(false);
    }
  };

  const iniciarEdicion = (ig) => {
    setEditandoId(ig.id);
    setEdicion({
      nombre: ig.nombre || '',
      pastor_encargado_nombre: ig.pastor_encargado_nombre || '',
      fecha_apertura: ig.fecha_apertura ? ig.fecha_apertura.slice(0, 10) : '',
    });
  };

  const cancelarEdicion = () => setEditandoId(null);

  const guardarEdicion = async (id) => {
    setGuardandoEdicion(true);
    try {
      await iglesiasService.actualizar(id, {
        nombre: edicion.nombre.trim(),
        pastor_encargado_nombre: edicion.pastor_encargado_nombre || null,
        fecha_apertura: edicion.fecha_apertura || null,
      });
      setEditandoId(null);
      recargarIglesias();
      toast.success(tx('Iglesia actualizada', 'Church updated'));
    } catch (error) {
      toast.error(error.response?.data?.detail ? String(error.response.data.detail).slice(0, 160) : tx('No se pudo guardar', 'Could not save'));
    } finally {
      setGuardandoEdicion(false);
    }
  };

  const eliminarIglesia = async (ig) => {
    if (!window.confirm(tx(`¿Eliminar "${ig.nombre}"? Los miembros que la tenían asignada quedarán sin iglesia.`, `Delete "${ig.nombre}"? Members assigned to it will be left without a church.`))) return;
    try {
      await iglesiasService.eliminar(ig.id);
      recargarIglesias();
      toast.success(tx('Iglesia eliminada', 'Church deleted'));
    } catch (error) {
      toast.error(tx('No se pudo eliminar', 'Could not delete'));
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(135deg, ${PRIMARY}, #2a72b8)`, padding: "30px 20px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>

        {/* ── HEADER ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
            <button
              onClick={() => navigate("/miembros")}
              style={{ background: "rgba(255,255,255,0.18)", backdropFilter: "blur(10px)", border: "none", borderRadius: "10px", padding: "18px 20px", color: "white", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontFamily: "'Lato', sans-serif", fontWeight: "700", fontSize: "13px" }}
            >
              <FaArrowLeft /> {t('volver')}
            </button>
            <h1 style={{ color: "white", margin: 0, fontFamily: "'Cinzel', serif", fontSize: "26px", fontWeight: "700", letterSpacing: "1px" }}>
              {tx('Iglesias', 'Churches')}
            </h1>
          </div>
          {user?.pais_nombre && (
            <p style={{ margin: 0, color: "rgba(255,255,255,0.6)", fontSize: "12px", fontFamily: "'Lato',sans-serif" }}>
              {user.pais_nombre} · {user.region || ""}
            </p>
          )}
        </div>

        {/* ── SELECTOR DE PAÍS + BUSCADOR ── */}
        <div style={{ background: "white", padding: "18px 20px", borderRadius: "14px", marginBottom: "20px", boxShadow: "0 2px 12px rgba(0,0,0,0.08)", display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 240px" }}>
            <label style={labelStyle}>{tx('País', 'Country')}</label>
            <select
              value={paisSeleccionado}
              onChange={(e) => setPaisSeleccionado(e.target.value)}
              style={inputStyle}
            >
              <option value="">{tx('Selecciona un país...', 'Select a country...')}</option>
              {paises.map(p => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </div>
          <div style={{ flex: "1 1 240px" }}>
            <label style={labelStyle}>{tx('Buscar iglesia', 'Search church')}</label>
            <input
              type="text"
              placeholder={tx('Buscar por nombre...', 'Search by name...')}
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              disabled={!paisSeleccionado}
              style={inputStyle}
            />
          </div>
        </div>

        {!paisSeleccionado ? (
          <div style={{ background: "white", borderRadius: "14px", padding: "40px", textAlign: "center", color: "#8a97b0" }}>
            {tx('Selecciona un país para ver y agregar sus iglesias.', 'Select a country to view and add its churches.')}
          </div>
        ) : (
          <>
            {/* ── AGREGAR IGLESIA ── */}
            <div style={{ background: "white", padding: "20px", borderRadius: "14px", marginBottom: "20px", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
              <h2 style={{ margin: "0 0 14px", fontFamily: "'Cinzel', serif", fontSize: "17px", color: PRIMARY }}>
                {tx('Agregar iglesia', 'Add church')}
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px", marginBottom: "12px" }}>
                <div>
                  <label style={labelStyle}>{tx('Ciudad', 'City')}</label>
                  <select
                    value={nuevaIglesia.ciudad_id}
                    onChange={(e) => setNuevaIglesia({ ...nuevaIglesia, ciudad_id: e.target.value })}
                    style={inputStyle}
                  >
                    <option value="">{tx('Selecciona ciudad...', 'Select city...')}</option>
                    {ciudadesPais.map(c => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>{tx('Nombre de la iglesia', 'Church name')}</label>
                  <input
                    type="text"
                    placeholder={tx('Ej. Iglesia Emanuel - Santiago', 'E.g. Emanuel Church - Santiago')}
                    value={nuevaIglesia.nombre}
                    onChange={(e) => setNuevaIglesia({ ...nuevaIglesia, nombre: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>{tx('Pastor encargado', 'Lead pastor')}</label>
                  <input
                    type="text"
                    placeholder={tx('Nombre del pastor', "Pastor's name")}
                    value={nuevaIglesia.pastor_encargado_nombre}
                    onChange={(e) => setNuevaIglesia({ ...nuevaIglesia, pastor_encargado_nombre: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>{tx('Fecha de apertura', 'Opening date')}</label>
                  <input
                    type="date"
                    value={nuevaIglesia.fecha_apertura}
                    onChange={(e) => setNuevaIglesia({ ...nuevaIglesia, fecha_apertura: e.target.value })}
                    style={inputStyle}
                  />
                </div>
              </div>
              <button
                onClick={agregarIglesia}
                disabled={guardandoNueva}
                style={{ background: "#4CAF50", border: "none", borderRadius: "10px", padding: "10px 20px", color: "white", cursor: guardandoNueva ? "default" : "pointer", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", opacity: guardandoNueva ? 0.6 : 1 }}
              >
                <FaPlus /> {guardandoNueva ? tx('Guardando...', 'Saving...') : tx('Agregar iglesia', 'Add church')}
              </button>
            </div>

            {/* ── TABLA ── */}
            <div style={{ background: "white", borderRadius: "14px", overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
              {cargando ? (
                <div style={{ padding: "40px", textAlign: "center", color: "#8a97b0" }}>{tx('Cargando...', 'Loading...')}</div>
              ) : iglesiasFiltradas.length === 0 ? (
                <div style={{ padding: "40px", textAlign: "center", color: "#8a97b0" }}>
                  {tx('Todavía no hay iglesias registradas en este país.', 'No churches registered in this country yet.')}
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#f4f6fb", color: "#8a97b0", textAlign: "left" }}>
                        <th style={celdaStyle}>{tx('Ciudad', 'City')}</th>
                        <th style={celdaStyle}>{tx('Iglesia', 'Church')}</th>
                        <th style={celdaStyle}>{tx('Pastor', 'Pastor')}</th>
                        <th style={celdaStyle}>{tx('Apertura', 'Opened')}</th>
                        <th style={celdaStyle}>{tx('Miembros', 'Members')}</th>
                        <th style={celdaStyle}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {iglesiasFiltradas.map(ig => {
                        const editando = editandoId === ig.id;
                        return (
                          <tr key={ig.id} style={{ borderBottom: "1px solid #eef1f7" }}>
                            <td style={celdaStyle}>{ig.ciudad_nombre || "—"}</td>
                            <td style={{ ...celdaStyle, fontWeight: "700", color: "#1a2d5a" }}>
                              {editando ? (
                                <input
                                  type="text"
                                  value={edicion.nombre}
                                  onChange={(e) => setEdicion({ ...edicion, nombre: e.target.value })}
                                  style={{ ...inputStyle, padding: "6px 8px" }}
                                />
                              ) : ig.nombre}
                            </td>
                            <td style={celdaStyle}>
                              {editando ? (
                                <input
                                  type="text"
                                  placeholder={tx('Nombre del pastor', "Pastor's name")}
                                  value={edicion.pastor_encargado_nombre}
                                  onChange={(e) => setEdicion({ ...edicion, pastor_encargado_nombre: e.target.value })}
                                  style={{ ...inputStyle, padding: "6px 8px" }}
                                />
                              ) : (ig.pastor_encargado_nombre || "—")}
                            </td>
                            <td style={celdaStyle}>
                              {editando ? (
                                <input
                                  type="date"
                                  value={edicion.fecha_apertura}
                                  onChange={(e) => setEdicion({ ...edicion, fecha_apertura: e.target.value })}
                                  style={{ ...inputStyle, padding: "6px 8px" }}
                                />
                              ) : (ig.fecha_apertura || "—")}
                            </td>
                            <td style={celdaStyle}>{ig.cantidad_miembros || 0}</td>
                            <td style={celdaStyle}>
                              {editando ? (
                                <div style={{ display: "flex", gap: "8px" }}>
                                  <button
                                    onClick={() => guardarEdicion(ig.id)}
                                    disabled={guardandoEdicion}
                                    style={{ background: PRIMARY, color: "white", border: "none", borderRadius: "6px", padding: "5px 10px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}
                                  >
                                    {tx('Guardar', 'Save')}
                                  </button>
                                  <button
                                    onClick={cancelarEdicion}
                                    style={{ background: "transparent", color: "#8a97b0", border: "none", cursor: "pointer", fontSize: "12px" }}
                                  >
                                    {tx('Cancelar', 'Cancel')}
                                  </button>
                                </div>
                              ) : (
                                <div style={{ display: "flex", gap: "10px" }}>
                                  <button
                                    onClick={() => iniciarEdicion(ig)}
                                    style={{ background: "transparent", border: "none", color: PRIMARY, cursor: "pointer", fontWeight: "700", fontSize: "12px" }}
                                  >
                                    {tx('Editar', 'Edit')}
                                  </button>
                                  <button
                                    onClick={() => eliminarIglesia(ig)}
                                    style={{ background: "transparent", border: "none", color: "#c0392b", cursor: "pointer", fontWeight: "700", fontSize: "12px" }}
                                  >
                                    {tx('Eliminar', 'Delete')}
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
