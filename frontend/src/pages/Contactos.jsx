import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaPlus, FaEdit, FaTrash, FaTimes } from "react-icons/fa";
import toast from 'react-hot-toast';
import contactosService from '../services/ContactosService';
import miembrosService from '../services/MiembrosService';

export default function Contactos() {
  const navigate = useNavigate();
  const [contactos, setContactos] = useState([]);
  const [miembros, setMiembros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [contactoEditando, setContactoEditando] = useState(null);
  const [formData, setFormData] = useState({
    miembro_id: '',
    nombre: '',
    telefono: '',
    pais_id: '',
    notas: '',
    estado: 'Nuevo'
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [contactosData, miembrosData] = await Promise.all([
        contactosService.getAll(),
        miembrosService.getAll()
      ]);
      setContactos(contactosData);
      setMiembros(miembrosData);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (contactoEditando) {
        await contactosService.update(contactoEditando.id, formData);
        toast.success('Contacto actualizado');
      } else {
        await contactosService.create(formData);
        toast.success('Contacto creado');
      }
      cargarDatos();
      cerrarModal();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al guardar');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("¿Eliminar este contacto?")) {
      try {
        await contactosService.delete(id);
        toast.success("Contacto eliminado");
        cargarDatos();
      } catch (error) {
        toast.error('Error al eliminar');
      }
    }
  };

  const abrirModal = (contacto = null) => {
    if (contacto) {
      setContactoEditando(contacto);
      setFormData({
        miembro_id: contacto.miembro_id,
        nombre: contacto.nombre,
        telefono: contacto.telefono || '',
        pais_id: contacto.pais_id || '',
        notas: contacto.notas || '',
        estado: contacto.estado || 'Nuevo'
      });
    } else {
      setContactoEditando(null);
      setFormData({
        miembro_id: '',
        nombre: '',
        telefono: '',
        pais_id: '',
        notas: '',
        estado: 'Nuevo'
      });
    }
    setMostrarModal(true);
  };

  const cerrarModal = () => {
    setMostrarModal(false);
    setContactoEditando(null);
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0E5A61, #15777F)", padding: "20px" }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
            <button onClick={() => navigate("/home")} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "8px", padding: "10px 15px", color: "white", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
              <FaArrowLeft /> Volver
            </button>
            <h1 style={{ color: "white", margin: 0 }}>Gestión de Contactos</h1>
          </div>
          <button onClick={() => abrirModal()} style={{ background: "#4CAF50", border: "none", borderRadius: "8px", padding: "12px 20px", color: "white", cursor: "pointer", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px" }}>
            <FaPlus /> Agregar Contacto
          </button>
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
                  <th style={{ padding: "15px", textAlign: "left" }}>Nombre</th>
                  <th style={{ padding: "15px", textAlign: "left" }}>Teléfono</th>
                  <th style={{ padding: "15px", textAlign: "left" }}>País</th>
                  <th style={{ padding: "15px", textAlign: "left" }}>Miembro Responsable</th>
                  <th style={{ padding: "15px", textAlign: "left" }}>Estado</th>
                  <th style={{ padding: "15px", textAlign: "center" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {contactos.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: "40px", textAlign: "center", color: "#999" }}>
                      No hay contactos registrados
                    </td>
                  </tr>
                ) : (
                  contactos.map(c => (
                    <tr key={c.id} style={{ borderTop: "1px solid #eee" }}>
                      <td style={{ padding: "15px" }}>{c.nombre}</td>
                      <td style={{ padding: "15px" }}>{c.telefono || '-'}</td>
                      <td style={{ padding: "15px" }}>{c.pais_nombre || '-'}</td>
                      <td style={{ padding: "15px" }}>{c.miembro_nombre || '-'}</td>
                      <td style={{ padding: "15px" }}>
                        <span style={{ background: c.activo ? '#4CAF50' : '#f44336', color: "white", padding: "4px 12px", borderRadius: "12px", fontSize: "12px" }}>
                          {c.estado || 'Nuevo'}
                        </span>
                      </td>
                      <td style={{ padding: "15px", textAlign: "center" }}>
                        <button onClick={() => abrirModal(c)} style={{ background: "#2196F3", border: "none", borderRadius: "6px", padding: "6px 12px", color: "white", cursor: "pointer", marginRight: "8px" }}>
                          <FaEdit />
                        </button>
                        <button onClick={() => handleDelete(c.id)} style={{ background: "#f44336", border: "none", borderRadius: "6px", padding: "6px 12px", color: "white", cursor: "pointer" }}>
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {mostrarModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
          <div style={{ background: "white", borderRadius: "12px", padding: "30px", width: "90%", maxWidth: "500px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ margin: 0 }}>{contactoEditando ? 'Editar Contacto' : 'Nuevo Contacto'}</h2>
              <button onClick={cerrarModal} style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer" }}>
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "600" }}>Nombre *</label>
                <input type="text" required value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})} style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "6px" }} />
              </div>

              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "600" }}>Miembro Responsable *</label>
                <select required value={formData.miembro_id} onChange={(e) => setFormData({...formData, miembro_id: e.target.value})} style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "6px" }}>
                  <option value="">Seleccionar...</option>
                  {miembros.map(m => (
                    <option key={m.id} value={m.id}>{m.nombre}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "600" }}>Teléfono</label>
                <input type="text" value={formData.telefono} onChange={(e) => setFormData({...formData, telefono: e.target.value})} style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "6px" }} />
              </div>

              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "600" }}>País ID</label>
                <input type="number" value={formData.pais_id} onChange={(e) => setFormData({...formData, pais_id: e.target.value})} style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "6px" }} placeholder="1-8" />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "600" }}>Notas</label>
                <textarea value={formData.notas} onChange={(e) => setFormData({...formData, notas: e.target.value})} style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "6px", minHeight: "80px" }} />
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button type="submit" style={{ flex: 1, padding: "12px", background: "#4CAF50", color: "white", border: "none", borderRadius: "6px", fontWeight: "600", cursor: "pointer" }}>
                  {contactoEditando ? 'Actualizar' : 'Crear'}
                </button>
                <button type="button" onClick={cerrarModal} style={{ flex: 1, padding: "12px", background: "#999", color: "white", border: "none", borderRadius: "6px", fontWeight: "600", cursor: "pointer" }}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}