import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaPlus, FaEdit, FaTrash, FaTimes, FaSearch } from "react-icons/fa";
import toast from 'react-hot-toast';
import contactosService from '../services/ContactosService';
import miembrosService from '../services/MiembrosService';
import administracionService from '../services/AdministracionService';

const PRIMARY       = "#1a5490";
const PRIMARY_LIGHT = "#2a72b8";

const inputStyle = {
  width: "100%", padding: "10px 12px",
  border: "1.5px solid #dde3ef", borderRadius: "8px",
  fontSize: "14px", fontFamily: "'Lato', sans-serif",
  color: "#1a2d5a", outline: "none", boxSizing: "border-box"
};

const labelStyle = {
  display: "block", marginBottom: "5px",
  fontWeight: "700", fontSize: "11px",
  letterSpacing: "1px", textTransform: "uppercase", color: "#5a6a85"
};

const ESTADOS = ["New", "Pending", "In Progress", "Converted", "Inactive"];

const estadoColor = (estado) => ({
  "New":         "#2196F3",
  "Pending":     "#FF9800",
  "In Progress": "#9C27B0",
  "Converted":   "#4CAF50",
  "Inactive":    "#9E9E9E",
}[estado] || "#2196F3");

export default function Contactos() {
  const navigate = useNavigate();
  const [contactos, setContactos]         = useState([]);
  const [miembros, setMiembros]           = useState([]);
  const [paises, setPaises]               = useState([]);
  const [loading, setLoading]             = useState(true);
  const [filtro, setFiltro]               = useState("");
  const [mostrarModal, setMostrarModal]   = useState(false);
  const [contactoEditando, setContactoEditando] = useState(null);

  const emptyForm = {
    miembro_responsable_id: '',
    nombre: '',
    telefono: '',
    pais_id: '',
    profesion: '',
    notas: '',
    estado: 'New'
  };
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => { cargarDatos(); }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [contactosData, miembrosData, paisesData] = await Promise.all([
        contactosService.getAll(),
        miembrosService.getAll(),
        administracionService.getAllPaises()
      ]);
      setContactos(contactosData);
      setMiembros(miembrosData);
      setPaises(paisesData);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error loading data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (contactoEditando) {
        await contactosService.update(contactoEditando.id, formData);
        toast.success('Contact updated');
      } else {
        await contactosService.create(formData);
        toast.success('Contact created');
      }
      cargarDatos();
      cerrarModal();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error saving contact');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this contact?")) {
      try {
        await contactosService.delete(id);
        toast.success("Contact deleted");
        cargarDatos();
      } catch { toast.error('Error deleting contact'); }
    }
  };

  const abrirModal = (contacto = null) => {
    if (contacto) {
      setContactoEditando(contacto);
      setFormData({
        miembro_responsable_id: contacto.miembro_responsable_id || contacto.miembro_id || '',
        nombre:     contacto.nombre     || '',
        telefono:   contacto.telefono   || '',
        pais_id:    contacto.pais_id    || '',
        profesion:  contacto.profesion  || '',
        notas:      contacto.notas      || '',
        estado:     contacto.estado     || 'New'
      });
    } else {
      setContactoEditando(null);
      setFormData(emptyForm);
    }
    setMostrarModal(true);
  };

  const cerrarModal = () => { setMostrarModal(false); setContactoEditando(null); };

  const set = (field) => (e) => setFormData(prev => ({ ...prev, [field]: e.target.value }));

  const contactosFiltrados = contactos.filter(c =>
    c.nombre?.toLowerCase().includes(filtro.toLowerCase()) ||
    c.telefono?.toLowerCase().includes(filtro.toLowerCase()) ||
    c.pais_nombre?.toLowerCase().includes(filtro.toLowerCase())
  );

  return (
    <div style={{ minHeight:"100vh", background:`linear-gradient(135deg, ${PRIMARY}, ${PRIMARY_LIGHT})`, padding:"20px", fontFamily:"'Lato', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Lato:wght@300;400;700&display=swap');
        .ct-input:focus { border-color: ${PRIMARY} !important; box-shadow: 0 0 0 3px rgba(26,84,144,0.1); }
        .row-hover:hover td { background: #f5f8ff !important; }
      `}</style>

      <div style={{ maxWidth:"1400px", margin:"0 auto" }}>

        {/* ── HEADER ── */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"28px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"15px" }}>
            <button onClick={() => navigate("/home")}
              style={{ background:"rgba(255,255,255,0.18)", backdropFilter:"blur(10px)", border:"none", borderRadius:"10px", padding:"10px 20px", color:"white", cursor:"pointer", display:"flex", alignItems:"center", gap:"8px", fontFamily:"'Lato',sans-serif", fontWeight:"700", fontSize:"13px" }}>
              <FaArrowLeft /> Back
            </button>
            <h1 style={{ color:"white", margin:0, fontFamily:"'Cinzel',serif", fontSize:"26px", fontWeight:"700", letterSpacing:"1px" }}>
              Contact Management
            </h1>
          </div>
          <button onClick={() => abrirModal()}
            style={{ background:"#4CAF50", border:"none", borderRadius:"10px", padding:"12px 22px", color:"white", cursor:"pointer", fontWeight:"700", fontFamily:"'Lato',sans-serif", display:"flex", alignItems:"center", gap:"8px", fontSize:"14px", boxShadow:"0 4px 12px rgba(76,175,80,0.3)" }}>
            <FaPlus /> Add Contact
          </button>
        </div>

        {/* ── BUSCADOR ── */}
        <div style={{ background:"white", padding:"16px 20px", borderRadius:"14px", marginBottom:"20px", boxShadow:"0 2px 12px rgba(0,0,0,0.08)", display:"flex", alignItems:"center", gap:"10px" }}>
          <FaSearch style={{ color:"#b0bcd0", fontSize:"14px", flexShrink:0 }} />
          <input type="text" placeholder="Search by name, phone or country..."
            value={filtro} onChange={e => setFiltro(e.target.value)}
            style={{ ...inputStyle, border:"none", padding:"0" }}
            className="ct-input" />
        </div>

        {/* ── TABLA ── */}
        {loading ? (
          <div style={{ textAlign:"center", color:"white", padding:"60px", fontSize:"16px" }}>Loading...</div>
        ) : (
          <div style={{ background:"white", borderRadius:"14px", overflow:"hidden", boxShadow:"0 4px 20px rgba(0,0,0,0.1)" }}>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead>
                  <tr style={{ borderBottom:"2px solid #dde3ef" }}>
                    {["Name","Phone","Country","Responsible Member","Status","Actions"].map(col => (
                      <th key={col} style={{ padding:"14px 16px", color:PRIMARY, textAlign: col==="Actions" ? "center" : "left", fontFamily:"'Lato',sans-serif", fontWeight:"700", fontSize:"12px", letterSpacing:"1px", textTransform:"uppercase", background:"#fafbfd" }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {contactosFiltrados.length === 0 ? (
                    <tr><td colSpan="6" style={{ padding:"40px", textAlign:"center", color:"#8a97b0" }}>No contacts found.</td></tr>
                  ) : (
                    contactosFiltrados.map((c, i) => (
                      <tr key={c.id} className="row-hover" style={{ borderBottom:"1px solid #eef2f7", background: i%2===0 ? "white" : "#fafbfd" }}>
                        <td style={{ padding:"14px 16px", fontWeight:"600", color:"#1a2d5a" }}>{c.nombre}</td>
                        <td style={{ padding:"14px 16px", color:"#5a6a85" }}>{c.telefono || '—'}</td>
                        <td style={{ padding:"14px 16px", color:"#5a6a85" }}>{c.pais_nombre || '—'}</td>
                        <td style={{ padding:"14px 16px", color:"#5a6a85" }}>{c.miembro_responsable || c.miembro_nombre || '—'}</td>
                        <td style={{ padding:"14px 16px" }}>
                          <span style={{ background: estadoColor(c.estado), color:"white", padding:"4px 12px", borderRadius:"20px", fontSize:"11px", fontWeight:"700", letterSpacing:"0.5px" }}>
                            {c.estado || 'New'}
                          </span>
                        </td>
                        <td style={{ padding:"14px 16px", textAlign:"center" }}>
                          <button onClick={() => abrirModal(c)} style={{ background:PRIMARY, border:"none", borderRadius:"7px", padding:"7px 13px", color:"white", cursor:"pointer", marginRight:"8px" }}><FaEdit /></button>
                          <button onClick={() => handleDelete(c.id)} style={{ background:"#f44336", border:"none", borderRadius:"7px", padding:"7px 13px", color:"white", cursor:"pointer" }}><FaTrash /></button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <p style={{ textAlign:"center", color:"#8a97b0", padding:"14px", fontSize:"12px", margin:0 }}>
              Total contacts: {contactosFiltrados.length}
            </p>
          </div>
        )}
      </div>

      {/* ── MODAL ── */}
      {mostrarModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", display:"flex", justifyContent:"center", alignItems:"center", zIndex:1000, padding:"20px" }}>
          <div style={{ background:"white", borderRadius:"16px", width:"100%", maxWidth:"540px", maxHeight:"90vh", overflowY:"auto", boxShadow:"0 20px 60px rgba(0,0,0,0.3)" }}>

            {/* Header */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"22px 28px 16px", borderBottom:"1px solid #eef2f7" }}>
              <h2 style={{ margin:0, fontFamily:"'Cinzel',serif", fontSize:"18px", color:PRIMARY }}>
                {contactoEditando ? 'Edit Contact' : 'New Contact'}
              </h2>
              <button onClick={cerrarModal} style={{ background:"none", border:"none", fontSize:"20px", cursor:"pointer", color:"#8a97b0" }}><FaTimes /></button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ padding:"22px 28px", display:"flex", flexDirection:"column", gap:"16px" }}>

                {/* Nombre */}
                <div>
                  <label style={labelStyle}>Full Name *</label>
                  <input className="ct-input" type="text" required
                    value={formData.nombre} onChange={set('nombre')}
                    style={inputStyle} placeholder="Contact's full name" />
                </div>

                {/* Responsable */}
                <div>
                  <label style={labelStyle}>Responsible Member *</label>
                  <select className="ct-input" required
                    value={formData.miembro_responsable_id} onChange={set('miembro_responsable_id')}
                    style={inputStyle}>
                    <option value="">Select member...</option>
                    {miembros.map(m => (
                      <option key={m.id} value={m.id}>{m.nombre}</option>
                    ))}
                  </select>
                </div>

                {/* Teléfono + País */}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"14px" }}>
                  <div>
                    <label style={labelStyle}>Phone</label>
                    <input className="ct-input" type="text"
                      value={formData.telefono} onChange={set('telefono')}
                      style={inputStyle} placeholder="+1 809 000 0000" />
                  </div>
                  <div>
                    <label style={labelStyle}>Country</label>
                    <select className="ct-input"
                      value={formData.pais_id} onChange={set('pais_id')}
                      style={inputStyle}>
                      <option value="">Select country...</option>
                      {paises.map(p => (
                        <option key={p.id} value={p.id}>{p.nombre}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Profesión + Estado */}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"14px" }}>
                  <div>
                    <label style={labelStyle}>Profession</label>
                    <input className="ct-input" type="text"
                      value={formData.profesion} onChange={set('profesion')}
                      style={inputStyle} placeholder="e.g. Teacher, Engineer..." />
                  </div>
                  <div>
                    <label style={labelStyle}>Status</label>
                    <select className="ct-input"
                      value={formData.estado} onChange={set('estado')}
                      style={inputStyle}>
                      {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                  </div>
                </div>

                {/* Notas */}
                <div>
                  <label style={labelStyle}>Notes</label>
                  <textarea className="ct-input"
                    value={formData.notas} onChange={set('notas')}
                    style={{ ...inputStyle, minHeight:"80px", resize:"vertical" }}
                    placeholder="Additional observations..." />
                </div>
              </div>

              {/* Botones */}
              <div style={{ display:"flex", gap:"12px", padding:"0 28px 24px" }}>
                <button type="submit"
                  style={{ flex:1, padding:"13px", background:`linear-gradient(135deg, ${PRIMARY}, ${PRIMARY_LIGHT})`, color:"white", border:"none", borderRadius:"10px", fontWeight:"700", fontFamily:"'Lato',sans-serif", fontSize:"14px", cursor:"pointer", boxShadow:"0 4px 14px rgba(26,84,144,0.3)" }}>
                  {contactoEditando ? 'Update Contact' : 'Create Contact'}
                </button>
                <button type="button" onClick={cerrarModal}
                  style={{ flex:1, padding:"13px", background:"#f0f4fa", color:"#5a6a85", border:"none", borderRadius:"10px", fontWeight:"700", fontFamily:"'Lato',sans-serif", fontSize:"14px", cursor:"pointer" }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
