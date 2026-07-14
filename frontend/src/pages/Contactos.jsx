import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaPlus, FaEdit, FaTrash, FaTimes } from "react-icons/fa";
import toast from 'react-hot-toast';
import contactosService from '../services/ContactosService';
import estudiosService from '../services/EstudiosService';
import miembrosService from '../services/MiembrosService';
import administracionService from '../services/AdministracionService';

export default function Contactos() {
  const navigate = useNavigate();
  const [contactos, setContactos] = useState([]);
  const [miembros, setMiembros] = useState([]);
  const [paises, setPaises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alertaEliminar, setAlertaEliminar] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [mostrarModal, setMostrarModal] = useState(false);
  const [contactoEditando, setContactoEditando] = useState(null);
  const [formData, setFormData] = useState({
    miembro_responsable_id: '',
    miembro_responsable: '',
    nombre: '',
    telefono: '',
    pais_id: '',
    notas: '',
  });

  useEffect(() => {
    cargarDatos();
  }, []);

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
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      miembro_responsable: formData.miembro_responsable,
      miembro_responsable_id: formData.miembro_responsable_id || null,
      nombre: formData.nombre,
      telefono: formData.telefono || null,
      pais_id: formData.pais_id === '' ? null : Number(formData.pais_id),
      notas: formData.notas || null,
    };
    try {
      if (contactoEditando) {
        await contactosService.update(contactoEditando.id, payload);
        toast.success('Contacto actualizado');
      } else {
        await contactosService.create(payload);
        toast.success('Contacto creado');
      }
      cargarDatos();
      cerrarModal();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al guardar');
    }
  };

  const handleDelete = async (id) => {
    try {
      const tieneEstudios = await estudiosService.tieneEstudios(id);
      if (tieneEstudios) {
        setAlertaEliminar(true);
        return;
      }
    } catch {}
    if (!window.confirm("Delete this contact?")) return;
    try {
      await contactosService.delete(id);
      toast.success("Contact deleted");
      cargarDatos();
    } catch {
      toast.error('Error deleting contact');
    }
  };

  const abrirModal = (contacto = null) => {
    if (contacto) {
      setContactoEditando(contacto);
      setFormData({
        miembro_responsable_id: contacto.miembro_responsable_id || '',
        miembro_responsable: contacto.miembro_responsable || '',
        nombre: contacto.nombre,
        telefono: contacto.telefono || '',
        pais_id: contacto.pais_id || '',
        notas: contacto.notas || '',
      });
    } else {
      setContactoEditando(null);
      setFormData({
        miembro_responsable_id: '',
        miembro_responsable: '',
        nombre: '',
        telefono: '',
        pais_id: '',
        notas: '',
      });
    }
    setMostrarModal(true);
  };

  const cerrarModal = () => {
    setMostrarModal(false);
    setContactoEditando(null);
  };

  // Filtrar por búsqueda
  const contactosFiltrados = contactos.filter(c => {
    const q = busqueda.toLowerCase().trim();
    if (!q) return true;
    return (
      c.nombre?.toLowerCase().includes(q) ||
      c.telefono?.toLowerCase().includes(q) ||
      c.miembro_responsable?.toLowerCase().includes(q) ||
      c.pais_nombre?.toLowerCase().includes(q)
    );
  });

  // Detectar duplicados
  const nombreCount = {};
  const telefonoCount = {};
  contactos.forEach(c => {
    const n = c.nombre?.trim().toLowerCase();
    if (n) nombreCount[n] = (nombreCount[n] || 0) + 1;
    const t = c.telefono?.trim();
    if (t && t !== '-') telefonoCount[t] = (telefonoCount[t] || 0) + 1;
  });
  const esDuplicadoNombre = (c) => nombreCount[c.nombre?.trim().toLowerCase()] > 1;
  const esDuplicadoTel = (c) => c.telefono && c.telefono !== '-' && telefonoCount[c.telefono?.trim()] > 1;
  const tieneDuplicado = (c) => esDuplicadoNombre(c) || esDuplicadoTel(c);
  const totalDuplicados = contactos.filter(tieneDuplicado).length;

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0E5A61, #15777F)", padding: "20px" }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
            <button onClick={() => navigate("/home")} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "8px", padding: "10px 15px", color: "white", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
              <FaArrowLeft /> Volver
            </button>
            <h1 style={{ color: "white", margin: 0 }}>Contact Management</h1>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
            <button onClick={() => abrirModal()} style={{ background: "#4CAF50", border: "none", borderRadius: "8px", padding: "12px 20px", color: "white", cursor: "pointer", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px" }}>
              <FaPlus /> Add Contact
            </button>
            <div style={{ display: "flex", gap: "8px" }}>
              <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: "6px", padding: "4px 12px", color: "white", fontSize: "12px" }}>
                <strong>{contactos.length}</strong> contact{contactos.length !== 1 ? 's' : ''}
              </div>
              {totalDuplicados > 0 && (
                <div style={{ background: "rgba(255,152,0,0.3)", border: "1px solid rgba(255,152,0,0.6)", borderRadius: "6px", padding: "4px 12px", color: "white", fontSize: "12px" }}>
                  ⚠️ <strong>{totalDuplicados}</strong> duplicate{totalDuplicados !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          </div>
        </div>



        {/* Search bar */}
        <div style={{ marginBottom: "16px" }}>
          <input
            type="text"
            placeholder="🔍  Search by name, phone, country or missionary..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            style={{ width: "100%", padding: "13px 18px", borderRadius: "10px", border: "none", fontSize: "15px", boxSizing: "border-box", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
          />
          {busqueda && (
            <div style={{ marginTop: "8px", color: "rgba(255,255,255,0.8)", fontSize: "13px" }}>
              {contactosFiltrados.length} result{contactosFiltrados.length !== 1 ? 's' : ''} for "{busqueda}"
            </div>
          )}
        </div>

        {loading ? (
          <div style={{ background: "white", padding: "40px", borderRadius: "12px", textAlign: "center" }}>
            Cargando...
          </div>
        ) : (
          <div style={{ background: "white", borderRadius: "12px", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f5f5f5" }}>
                  <th style={{ padding: "15px", textAlign: "left" }}>Name</th>
                  <th style={{ padding: "15px", textAlign: "left" }}>Phone</th>
                  <th style={{ padding: "15px", textAlign: "left" }}>Country</th>
                  <th style={{ padding: "15px", textAlign: "left" }}>Responsible Member</th>
                  <th style={{ padding: "15px", textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {contactosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ padding: "40px", textAlign: "center", color: "#999" }}>
                      {busqueda ? `No results for "${busqueda}"` : 'No contacts registered'}
                    </td>
                  </tr>
                ) : (
                  contactosFiltrados.map(c => {
                    const duplicado = tieneDuplicado(c);
                    return (
                    <tr key={c.id} style={{ borderTop: "1px solid #eee", background: duplicado ? "#fff8e1" : "white" }}>
                      <td style={{ padding: "15px", color: esDuplicadoNombre(c) ? "#e65100" : "inherit", fontWeight: esDuplicadoNombre(c) ? "600" : "normal" }}>
                        {c.nombre}
                        {esDuplicadoNombre(c) && <span style={{ marginLeft: "8px", fontSize: "11px", background: "#ff9800", color: "white", borderRadius: "4px", padding: "1px 6px" }}>duplicate</span>}
                      </td>
                      <td style={{ padding: "15px", color: esDuplicadoTel(c) ? "#e65100" : "inherit", fontWeight: esDuplicadoTel(c) ? "600" : "normal" }}>
                        {c.telefono || '-'}
                        {esDuplicadoTel(c) && <span style={{ marginLeft: "8px", fontSize: "11px", background: "#ff9800", color: "white", borderRadius: "4px", padding: "1px 6px" }}>duplicate</span>}
                      </td>
                      <td style={{ padding: "15px" }}>{c.pais_nombre || '-'}</td>
                      <td style={{ padding: "15px" }}>{c.miembro_responsable || '-'}</td>
                      <td style={{ padding: "15px", textAlign: "center" }}>
                        <button onClick={() => abrirModal(c)} style={{ background: "#2196F3", border: "none", borderRadius: "6px", padding: "6px 12px", color: "white", cursor: "pointer", marginRight: "8px" }}>
                          <FaEdit />
                        </button>
                        <button onClick={() => handleDelete(c.id)} style={{ background: "#f44336", border: "none", borderRadius: "6px", padding: "6px 12px", color: "white", cursor: "pointer" }}>
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal advertencia borrado */}
      {alertaEliminar && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 2000 }}>
          <div style={{ background: "white", borderRadius: "16px", padding: "35px", maxWidth: "420px", width: "90%", textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>⚠️</div>
            <h3 style={{ margin: "0 0 12px", color: "#d32f2f", fontSize: "20px" }}>Cannot Delete Contact</h3>
            <p style={{ margin: "0 0 24px", color: "#555", lineHeight: "1.6" }}>This contact has Bible study records and cannot be deleted.</p>
            <button
              onClick={() => setAlertaEliminar(false)}
              style={{ background: "#134069", color: "white", border: "none", borderRadius: "8px", padding: "12px 32px", fontSize: "15px", fontWeight: "600", cursor: "pointer" }}
            >
              Understood
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {mostrarModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
          <div style={{ background: "white", borderRadius: "12px", padding: "30px", width: "90%", maxWidth: "500px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ margin: 0 }}>{contactoEditando ? 'Edit Contact' : 'New Contact'}</h2>
              <button onClick={cerrarModal} style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer" }}>
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "600" }}>Name *</label>
                <input type="text" required value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})} style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "6px" }} />
              </div>

              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "600" }}>Responsible Member *</label>
                <select required value={formData.miembro_responsable_id} onChange={(e) => {
                  const miembro = miembros.find(m => m.id === e.target.value);
                  setFormData({...formData, miembro_responsable_id: e.target.value, miembro_responsable: miembro?.nombre || ''});
                }} style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "6px" }}>
                  <option value="">Select...</option>
                  {miembros.map(m => (
                    <option key={m.id} value={m.id}>{m.nombre}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "600" }}>Phone</label>
                <input type="text" value={formData.telefono} onChange={(e) => setFormData({...formData, telefono: e.target.value})} style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "6px" }} />
              </div>

              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "600" }}>Country</label>
                <select value={formData.pais_id} onChange={(e) => setFormData({...formData, pais_id: e.target.value})} style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "6px" }}>
                  <option value="">Select country...</option>
                  {paises.map(pais => (
                    <option key={pais.id} value={pais.id}>{pais.nombre}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "600" }}>Notes</label>
                <textarea value={formData.notas} onChange={(e) => setFormData({...formData, notas: e.target.value})} style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "6px", minHeight: "80px" }} />
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button type="submit" style={{ flex: 1, padding: "12px", background: "#4CAF50", color: "white", border: "none", borderRadius: "6px", fontWeight: "600", cursor: "pointer" }}>
                  {contactoEditando ? 'Update' : 'Create'}
                </button>
                <button type="button" onClick={cerrarModal} style={{ flex: 1, padding: "12px", background: "#999", color: "white", border: "none", borderRadius: "6px", fontWeight: "600", cursor: "pointer" }}>
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