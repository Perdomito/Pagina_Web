import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaPlus, FaEdit, FaTrash, FaTimes, FaInfoCircle } from "react-icons/fa";
import toast from 'react-hot-toast';
import miembrosService from '../services/MiembrosService';
import administracionService from '../services/AdministracionService';

const PRIMARY = "#1a5490";
const PRIMARY_LIGHT = "#2a72b8";

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  border: "1.5px solid #dde3ef",
  borderRadius: "8px",
  fontSize: "16px",
  fontFamily: "'Lato', sans-serif",
  color: "#1a2d5a",
  outline: "none",
  boxSizing: "border-box"
};

const labelStyle = {
  display: "block",
  marginBottom: "5px",
  fontWeight: "700",
  fontSize: "14px",
  letterSpacing: "1px",
  textTransform: "capitalize",
  color: "#5a6a85"
};

export default function Miembros() {
  const navigate = useNavigate();
  const [miembros, setMiembros] = useState([]);
  const [paises, setPaises] = useState([]);
  const [filtro, setFiltro] = useState("");
  const [loading, setLoading] = useState(true);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [miembroEditando, setMiembroEditando] = useState(null);
  const [pestanaActiva, setPestanaActiva] = useState('basic');

  const [mostrarModalInfo, setMostrarModalInfo] = useState(false);
  const [miembroParaInfo, setMiembroParaInfo] = useState(null);
  const [infoAdicional, setInfoAdicional] = useState(null);
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [guardandoInfo, setGuardandoInfo] = useState(false);
  const [infoFormData, setInfoFormData] = useState({
    nombre_padre: '',
    telefono_padre: '',
    nombre_madre: '',
    telefono_madre: '',
    tipo_sangre: '',
    correo_electronico: ''
  });

  const infoFormVacio = {
    nombre_padre: '',
    telefono_padre: '',
    nombre_madre: '',
    telefono_madre: '',
    tipo_sangre: '',
    correo_electronico: ''
  };

  const emptyForm = {
    // Básicos
    nombre: '',
    identidad: '',
    pais_id: '',
    ciudad: '',
    edad: '',
    tipo_miembro: 'Registrado',
    evangelizado_por: '',
    estado_civil: '',
    profesion: '',
    comentarios: '',
    cargo_funcion: '',
    avance_audio: '',
    ministerio_of: '',
    // Extra (Jasen)
    nombre_padre: '',
    telefono_padre: '',
    nombre_madre: '',
    telefono_madre: '',
    tipo_sangre: '',
    correo_electronico: ''
  };

  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [miembrosData, paisesData] = await Promise.all([
        miembrosService.getAll(),
        administracionService.getAllPaises()
      ]);
      setMiembros(miembrosData);
      setPaises(paisesData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error loading data');
    } finally {
      setLoading(false);
    }
  };

  const paisesMap = useMemo(() => {
    const m = new Map();
    paises.forEach(p => m.set(p.id, p));
    return m;
  }, [paises]);

  const miembrosFiltrados = miembros.filter(m => {
    const p = paisesMap.get(m.pais_id);
    const paisLabel = (p?.iso || p?.nombre || '').toLowerCase();
    const t = filtro.toLowerCase();
    return (
      m.nombre?.toLowerCase().includes(t) ||
      m.ciudad?.toLowerCase().includes(t) ||
      paisLabel.includes(t)
    );
  });

  const buildPayload = (data) => {
    const id = data.nombre.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim().replace(/\s+/g, '.') || 'unknown';
    return {
      id: data.identidad?.trim() || id,
      nombre: data.nombre,
      identidad: data.identidad || null,
      pais: null,
      ciudad: data.ciudad || null,
      edad: data.edad === '' || data.edad === null ? null : Number(data.edad),
      evangelizado_por: data.evangelizado_por || null,
      estado_civil: data.estado_civil || null,
      profesion: data.profesion || null,
      comentarios: data.comentarios || null,
      tipo_miembro: data.tipo_miembro,
      pais_id: data.pais_id === '' || data.pais_id === null ? null : Number(data.pais_id),
      ciudad_id: null,
      cargo_funcion: data.cargo_funcion || null,
      ministerio_of: data.ministerio_of || null,
      avance_audio: data.avance_audio || null
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = buildPayload(formData);
      if (miembroEditando) {
        await miembrosService.update(miembroEditando.id, payload);
        toast.success('Member updated');
      } else {
        await miembrosService.create(payload);
        toast.success('Member created');
      }
      cargarDatos();
      cerrarModal();
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.response?.data?.error || 'Error saving member');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this member?")) {
      try {
        await miembrosService.delete(id);
        toast.success("Member deleted");
        cargarDatos();
      } catch (error) {
        toast.error('Error deleting member');
      }
    }
  };

  const abrirModal = (miembro = null) => {
    setPestanaActiva('basic');
    if (miembro) {
      setMiembroEditando(miembro);
      setFormData({
        nombre: miembro.nombre || '',
        identidad: miembro.identidad || '',
        pais_id: miembro.pais_id || '',
        ciudad: miembro.ciudad || '',
        edad: miembro.edad || '',
        tipo_miembro: miembro.tipo_miembro || 'Registrado',
        evangelizado_por: miembro.evangelizado_por || '',
        estado_civil: miembro.estado_civil || '',
        profesion: miembro.profesion || '',
        comentarios: miembro.comentarios || '',
        cargo_funcion: miembro.cargo_funcion || '',
        avance_audio: miembro.avance_audio || '',
        ministerio_of: miembro.ministerio_of || '',
        nombre_padre: miembro.nombre_padre || '',
        telefono_padre: miembro.telefono_padre || '',
        nombre_madre: miembro.nombre_madre || '',
        telefono_madre: miembro.telefono_madre || '',
        tipo_sangre: miembro.tipo_sangre || '',
        correo_electronico: miembro.correo_electronico || ''
      });
    } else {
      setMiembroEditando(null);
      setFormData(emptyForm);
    }
    setMostrarModal(true);
  };

  const cerrarModal = () => {
    setMostrarModal(false);
    setMiembroEditando(null);
    setPestanaActiva('basic');
  };

  const abrirModalInfo = async (miembro) => {
    setMiembroParaInfo(miembro);
    setInfoAdicional(null);
    setInfoFormData(infoFormVacio);
    setMostrarModalInfo(true);
    setLoadingInfo(true);
    try {
      const data = await miembrosService.getInfoAdicional(miembro.id);
      if (data) {
        setInfoAdicional(data);
        setInfoFormData({
          nombre_padre: data.nombre_padre || '',
          telefono_padre: data.telefono_padre || '',
          nombre_madre: data.nombre_madre || '',
          telefono_madre: data.telefono_madre || '',
          tipo_sangre: data.tipo_sangre || '',
          correo_electronico: data.correo_electronico || ''
        });
      }
    } catch (error) {
      console.error('Error loading additional info:', error);
      toast.error('Error loading additional info');
    } finally {
      setLoadingInfo(false);
    }
  };

  const cerrarModalInfo = () => {
    setMostrarModalInfo(false);
    setMiembroParaInfo(null);
    setInfoAdicional(null);
    setInfoFormData(infoFormVacio);
  };

  const handleGuardarInfoAdicional = async (e) => {
    e.preventDefault();
    if (!miembroParaInfo) return;

    try {
      setGuardandoInfo(true);
      if (infoAdicional) {
        await miembrosService.updateInfoAdicional(miembroParaInfo.id, infoFormData);
        toast.success('Additional info updated');
      } else {
        await miembrosService.createInfoAdicional({
          id: miembroParaInfo.id,
          ...infoFormData
        });
        toast.success('Additional info created');
      }
      cerrarModalInfo();
    } catch (error) {
      console.error('Error saving additional info:', error);
      toast.error(error.response?.data?.detail || 'Error saving additional info');
    } finally {
      setGuardandoInfo(false);
    }
  };

const set = (field) => (e) => setFormData(prev => ({ ...prev, [field]: e.target.value }));
  const tipoBadge = (tipo) => {
    const map = {
      Comprometido: '#4CAF50',
      Registrado:   '#2196F3',
      Voluntario:   '#FF9800'
    };
    return map[tipo] || '#999';
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: `linear-gradient(135deg, ${PRIMARY}, ${PRIMARY_LIGHT})`,
      padding: "20px",
      fontFamily: "'Lato', sans-serif"
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Lato:wght@300;400;700&display=swap');

        .mbr-input:focus {
          border-color: ${PRIMARY} !important;
          box-shadow: 0 0 0 3px rgba(26,84,144,0.1);
        }
        .tab-btn {
          flex: 1;
          padding: 10px;
          border: none;
          background: #f0f4fa;
          color: #5a6a85;
          font-family: 'Lato', sans-serif;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: capitalize;
          cursor: pointer;
          transition: all 0.2s;
          border-bottom: 3px solid transparent;
        }
        .tab-btn.active {
          background: white;
          color: ${PRIMARY};
          border-bottom-color: ${PRIMARY};
        }
        .tab-btn:first-child { border-radius: 8px 0 0 0; }
        .tab-btn:last-child  { border-radius: 0 8px 0 0; }
        .row-hover:hover { background: #f5f8ff !important; }
      `}</style>

      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>

        {/* ── HEADER ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
            <button
              onClick={() => navigate("/home")}
              style={{ background: "rgba(255,255,255,0.18)", backdropFilter: "blur(10px)", border: "none", borderRadius: "10px", padding: "18px 20px", color: "white", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontFamily: "'Lato', sans-serif", fontWeight: "700", fontSize: "13px" }}
            >
              <FaArrowLeft /> Back
            </button>
            <div>
              <h1 style={{ color: "white", margin: 0, fontFamily: "'Cinzel', serif", fontSize: "26px", fontWeight: "700", letterSpacing: "1px" }}>
                Member Management
              </h1>
            </div>
          </div>

          <button
            onClick={() => abrirModal()}
            style={{ background: "#4CAF50", border: "none", borderRadius: "10px", padding: "12px 22px", color: "white", cursor: "pointer", fontWeight: "700", fontFamily: "'Lato', sans-serif", display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", boxShadow: "0 4px 12px rgba(76,175,80,0.3)" }}
          >
            <FaPlus /> Add Member
          </button>
        </div>

        {/* ── BUSCADOR ── */}
        <div style={{ background: "white", padding: "18px 20px", borderRadius: "14px", marginBottom: "20px", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
          <input
            type="text"
            placeholder="Search by name, country or city..."
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            style={{ ...inputStyle, border: "1.5px solid #dde3ef" }}
            className="mbr-input"
          />
        </div>

        {/* ── TABLA ── */}
        {loading ? (
          <div style={{ textAlign: "center", color: "white", padding: "60px", fontSize: "16px" }}>Loading...</div>
        ) : (
          <div style={{ background: "white", borderRadius: "14px", overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#72a9e9", borderBottom: "2px solid #dde3ef" }}>
                    {["Name", "ID", "Country", "City", "Age", "Type", "Actions"].map(col => (
                      <th key={col} style={{ padding: "14px 16px", color: "white", textAlign: col === "Actions" ? "center" : "left", fontFamily: "'Lato', sans-serif", fontWeight: "700", fontSize: "14px", letterSpacing: "1px", textTransform: "capitalize", color: PRIMARY }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {miembrosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ padding: "40px", textAlign: "center", color: "#8a97b0", fontFamily: "'Lato', sans-serif" }}>
                        No members found.
                      </td>
                    </tr>
                  ) : (
                    miembrosFiltrados.map((miembro, i) => (
                      <tr key={miembro.id} className="row-hover" style={{ borderBottom: "1px solid #eef2f7", background: i % 2 === 0 ? "white" : "#fafbfd" }}>
                        <td style={{ padding: "14px 16px", fontWeight: "600", color: "#1a2d5a", fontFamily: "'Lato', sans-serif" }}>{miembro.nombre}</td>
                        <td style={{ padding: "14px 16px", color: "#5a6a85", fontSize: "13px" }}>{miembro.identidad}</td>
                        <td style={{ padding: "14px 16px", color: "#5a6a85" }}>{paisesMap.get(miembro.pais_id)?.iso || '-'}</td>
                        <td style={{ padding: "14px 16px", color: "#5a6a85" }}>{miembro.ciudad}</td>
                        <td style={{ padding: "14px 16px", color: "#5a6a85" }}>{miembro.edad}</td>
                        <td style={{ padding: "14px 16px" }}>
                          <span style={{ background: tipoBadge(miembro.tipo_miembro), color: "white", padding: "4px 12px", borderRadius: "20px", fontSize: "13px", fontWeight: "700", letterSpacing: "0.5px" }}>
                            {miembro.tipo_miembro}
                          </span>
                        </td>
                        <td style={{ padding: "14px 16px", textAlign: "center" }}>
                          <button onClick={() => abrirModalInfo(miembro)} title="Additional info" style={{ background: "#009688", border: "none", borderRadius: "7px", padding: "7px 13px", color: "white", cursor: "pointer", marginRight: "8px" }}>
                            <FaInfoCircle />
                          </button>
                          <button onClick={() => abrirModal(miembro)} style={{ background: PRIMARY, border: "none", borderRadius: "7px", padding: "7px 13px", color: "white", cursor: "pointer", marginRight: "8px" }}>
                            <FaEdit />
                          </button>
                          <button onClick={() => handleDelete(miembro.id)} style={{ background: "#f44336", border: "none", borderRadius: "7px", padding: "7px 13px", color: "white", cursor: "pointer" }}>
                            <FaTrash />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <p style={{ color: "rgba(255,255,255,0.7)", textAlign: "center", marginTop: "20px", fontSize: "14px", letterSpacing: "0.5px" }}>
          Total members: {miembrosFiltrados.length}
        </p>
      </div>

      {/* ── MODAL ── */}
      {mostrarModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000, padding: "20px" }}>
          <div style={{ background: "white", borderRadius: "16px", width: "100%", maxWidth: "720px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>

            {/* Modal header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px 28px 16px", borderBottom: "1px solid #eef2f7" }}>
              <h2 style={{ margin: 0, fontFamily: "'Cinzel', serif", fontSize: "20px", color: PRIMARY }}>
                {miembroEditando ? 'Edit Member' : 'New Member'}
              </h2>
              <button onClick={cerrarModal} style={{ background: "none", border: "none", fontSize: "22px", cursor: "pointer", color: "#8a97b0" }}>
                <FaTimes />
              </button>
            </div>

            {/* Pestañas */}
            <div style={{ display: "flex", borderBottom: "1px solid #eef2f7" }}>
              <button className={`tab-btn ${pestanaActiva === 'basic' ? 'active' : ''}`} onClick={() => setPestanaActiva('basic')}>
                Basic Info
              </button>

            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ padding: "24px 28px" }}>

                {/* ── PESTAÑA BASIC INFO ── */}
                {pestanaActiva === 'basic' && (
                  <>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                      <div>
                        <label style={labelStyle}>Full Name *</label>
                        <input className="mbr-input" type="text" required value={formData.nombre} onChange={set('nombre')} style={inputStyle} placeholder="Full name" />
                      </div>
                      <div>
                        <label style={labelStyle}>ID / Identity</label>
                        <input className="mbr-input" type="text" value={formData.identidad} onChange={set('identidad')} style={inputStyle} placeholder="ID number" />
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                      <div>
                        <label style={labelStyle}>Country *</label>
                        <select required value={formData.pais_id} onChange={set('pais_id')} style={inputStyle} className="mbr-input">
                          <option value="">Select country...</option>
                          {paises.map(pais => (
                            <option key={pais.id} value={pais.id}>{pais.nombre}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label style={labelStyle}>City</label>
                        <input className="mbr-input" type="text" value={formData.ciudad} onChange={set('ciudad')} style={inputStyle} placeholder="City" />
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                      <div>
                        <label style={labelStyle}>Age</label>
                        <input className="mbr-input" type="number" value={formData.edad} onChange={set('edad')} style={inputStyle} />
                      </div>
                      <div>
                        <label style={labelStyle}>Marital Status</label>
                        <select value={formData.estado_civil} onChange={set('estado_civil')} style={inputStyle} className="mbr-input">
                          <option value="">Select...</option>
                          <option value="Single">Single</option>
                          <option value="Married">Married</option>
                          <option value="Divorced">Divorced</option>
                          <option value="Widowed">Widowed</option>
                        </select>
                      </div>
                      <div>
                        <label style={labelStyle}>Profession</label>
                        <input className="mbr-input" type="text" value={formData.profesion} onChange={set('profesion')} style={inputStyle} placeholder="Profession" />
                      </div>
                    </div>

                    <div style={{ marginBottom: "16px" }}>
                      <label style={labelStyle}>Evangelized By</label>
                      <input className="mbr-input" type="text" value={formData.evangelizado_por} onChange={set('evangelizado_por')} style={inputStyle} placeholder="Name of person who evangelized" />
                    </div>

                    <div style={{ marginBottom: "16px" }}>
                      <label style={labelStyle}>Member Type *</label>
                      <select required value={formData.tipo_miembro} onChange={set('tipo_miembro')} style={inputStyle} className="mbr-input">
                      <option value="Registrado">Registered (RM)</option>
                      <option value="Comprometido">Committed (CM)</option>
                      <option value="Voluntario">Volunteer (VM)</option>
                      </select>
                    </div>

                    {formData.tipo_miembro === 'Comprometido' && (
                      <div style={{ marginBottom: "16px", padding: "16px", background: "#e8f5e9", borderRadius: "10px", border: "1px solid #a5d6a7" }}>
                        <label style={{ ...labelStyle, color: "#2e7d32" }}>Role / Function</label>
                        <input className="mbr-input" type="text" value={formData.cargo_funcion} onChange={set('cargo_funcion')} style={{ ...inputStyle, border: "1.5px solid #a5d6a7" }} placeholder="e.g. Pastor, Cell Leader..." />
                      </div>
                    )}

                    {formData.tipo_miembro === 'Registrado' && (
                      <div style={{ marginBottom: "16px", padding: "16px", background: "#e3f2fd", borderRadius: "10px", border: "1px solid #90caf9" }}>
                        <label style={{ ...labelStyle, color: "#1565c0" }}>Audio Progress</label>
                        <input className="mbr-input" type="text" value={formData.avance_audio} onChange={set('avance_audio')} style={{ ...inputStyle, border: "1.5px solid #90caf9" }} placeholder="e.g. Audio 5, Lesson 3..." />
                      </div>
                    )}

                    {formData.tipo_miembro === 'Voluntario' && (
                      <div style={{ marginBottom: "16px", padding: "16px", background: "#fff3e0", borderRadius: "10px", border: "1px solid #ffcc80" }}>
                        <div style={{ marginBottom: "12px" }}>
                          <label style={{ ...labelStyle, color: "#e65100" }}>Ministry OF</label>
                          <input className="mbr-input" type="text" value={formData.ministerio_of} onChange={set('ministerio_of')} style={{ ...inputStyle, border: "1.5px solid #ffcc80" }} placeholder="e.g. Worship, Multimedia..." />
                        </div>
                        <div>
                          <label style={{ ...labelStyle, color: "#e65100" }}>Audio Progress</label>
                          <input className="mbr-input" type="text" value={formData.avance_audio} onChange={set('avance_audio')} style={{ ...inputStyle, border: "1.5px solid #ffcc80" }} placeholder="e.g. Audio 5, Lesson 3..." />
                        </div>
                      </div>
                    )}

                    <div>
                      <label style={labelStyle}>Comments</label>
                      <textarea value={formData.comentarios} onChange={set('comentarios')} style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }} placeholder="Observations or additional notes..." />
                    </div>
                  </>
                )}


              </div>

              {/* Botones */}
              <div style={{ display: "flex", gap: "12px", padding: "0 28px 24px" }}>
                <button
                  type="submit"
                  style={{ flex: 1, padding: "13px", background: `linear-gradient(135deg, ${PRIMARY}, ${PRIMARY_LIGHT})`, color: "white", border: "none", borderRadius: "10px", fontWeight: "700", fontFamily: "'Lato', sans-serif", fontSize: "14px", cursor: "pointer", letterSpacing: "0.5px", boxShadow: "0 4px 14px rgba(26,84,144,0.3)" }}
                >
                  {miembroEditando ? 'Update Member' : 'Create Member'}
                </button>
                <button
                  type="button"
                  onClick={cerrarModal}
                  style={{ flex: 1, padding: "13px", background: "#f0f4fa", color: "#5a6a85", border: "none", borderRadius: "10px", fontWeight: "700", fontFamily: "'Lato', sans-serif", fontSize: "14px", cursor: "pointer" }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL INFO ADICIONAL ── */}
      {mostrarModalInfo && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000, padding: "20px" }}>
          <div style={{ background: "white", borderRadius: "16px", width: "100%", maxWidth: "640px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px 28px 16px", borderBottom: "1px solid #eef2f7" }}>
              <h2 style={{ margin: 0, fontFamily: "'Cinzel', serif", fontSize: "20px", color: PRIMARY }}>
                Additional Info {miembroParaInfo ? `of ${miembroParaInfo.nombre}` : ''}
              </h2>
              <button onClick={cerrarModalInfo} style={{ background: "none", border: "none", fontSize: "22px", cursor: "pointer", color: "#8a97b0" }}>
                <FaTimes />
              </button>
            </div>

            {loadingInfo ? (
              <div style={{ padding: "60px", textAlign: "center", color: "#8a97b0" }}>Loading...</div>
            ) : (
              <form onSubmit={handleGuardarInfoAdicional}>
                <div style={{ padding: "24px 28px" }}>
                  {!infoAdicional && (
                    <div style={{ marginBottom: "20px", padding: "14px 16px", background: "#fff8e1", borderRadius: "10px", borderLeft: "4px solid #FF9800", color: "#856404", fontSize: "13px", fontFamily: "'Lato', sans-serif" }}>
                      No additional info yet. Fill in the fields to create it.
                    </div>
                  )}

                  <p style={{ ...labelStyle, color: PRIMARY, fontSize: "14px", marginBottom: "12px" }}>— Father's Information</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
                    <div>
                      <label style={labelStyle}>Father's Name</label>
                      <input className="mbr-input" type="text" value={infoFormData.nombre_padre} onChange={(e) => setInfoFormData({...infoFormData, nombre_padre: e.target.value})} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Father's Phone</label>
                      <input className="mbr-input" type="tel" value={infoFormData.telefono_padre} onChange={(e) => setInfoFormData({...infoFormData, telefono_padre: e.target.value})} style={inputStyle} />
                    </div>
                  </div>

                  <p style={{ ...labelStyle, color: PRIMARY, fontSize: "14px", marginBottom: "12px" }}>— Mother's Information</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
                    <div>
                      <label style={labelStyle}>Mother's Name</label>
                      <input className="mbr-input" type="text" value={infoFormData.nombre_madre} onChange={(e) => setInfoFormData({...infoFormData, nombre_madre: e.target.value})} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Mother's Phone</label>
                      <input className="mbr-input" type="tel" value={infoFormData.telefono_madre} onChange={(e) => setInfoFormData({...infoFormData, telefono_madre: e.target.value})} style={inputStyle} />
                    </div>
                  </div>

                  <p style={{ ...labelStyle, color: PRIMARY, fontSize: "14px", marginBottom: "12px" }}>— Health & Contact</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <div>
                      <label style={labelStyle}>Blood Type</label>
                      <select value={infoFormData.tipo_sangre} onChange={(e) => setInfoFormData({...infoFormData, tipo_sangre: e.target.value})} style={inputStyle} className="mbr-input">
                        <option value="">Select...</option>
                        {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Email</label>
                      <input className="mbr-input" type="email" value={infoFormData.correo_electronico} onChange={(e) => setInfoFormData({...infoFormData, correo_electronico: e.target.value})} style={inputStyle} placeholder="email@example.com" />
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "12px", padding: "0 28px 24px" }}>
                  <button
                    type="submit"
                    disabled={guardandoInfo}
                    style={{ flex: 1, padding: "13px", background: guardandoInfo ? "#9E9E9E" : "#009688", color: "white", border: "none", borderRadius: "10px", fontWeight: "700", fontFamily: "'Lato', sans-serif", fontSize: "14px", cursor: guardandoInfo ? "not-allowed" : "pointer", boxShadow: guardandoInfo ? "none" : "0 4px 14px rgba(0,150,136,0.3)" }}
                  >
                    {guardandoInfo ? 'Saving...' : (infoAdicional ? 'Update' : 'Create')}
                  </button>
                  <button
                    type="button"
                    onClick={cerrarModalInfo}
                    style={{ flex: 1, padding: "13px", background: "#f0f4fa", color: "#5a6a85", border: "none", borderRadius: "10px", fontWeight: "700", fontFamily: "'Lato', sans-serif", fontSize: "14px", cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
