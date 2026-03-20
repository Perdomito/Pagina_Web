import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaPlus, FaEdit, FaTrash, FaTimes } from "react-icons/fa";
import toast from 'react-hot-toast';
import miembrosService from '../services/MiembrosService';
import administracionService from '../services/AdministracionService';

export default function Miembros() {
  const navigate = useNavigate();
  const [miembros, setMiembros] = useState([]);
  const [paises, setPaises] = useState([]);
  const [filtro, setFiltro] = useState("");
  const [loading, setLoading] = useState(true);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [miembroEditando, setMiembroEditando] = useState(null);
  const [formData, setFormData] = useState({
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
    ministerio_of: ''
  });

  // Cargar países y miembros al inicio
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
      console.error('Error al cargar datos:', error);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const miembrosFiltrados = miembros.filter(m =>
    m.nombre?.toLowerCase().includes(filtro.toLowerCase()) ||
    m.pais_nombre?.toLowerCase().includes(filtro.toLowerCase()) ||
    m.ciudad?.toLowerCase().includes(filtro.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (miembroEditando) {
        await miembrosService.update(miembroEditando.id, formData);
        toast.success('Miembro actualizado');
      } else {
        await miembrosService.create(formData);
        toast.success('Miembro creado');
      }
      
      cargarDatos();
      cerrarModal();
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.response?.data?.error || 'Error al guardar miembro');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("¿Estás seguro de eliminar este miembro?")) {
      try {
        await miembrosService.delete(id);
        toast.success("Miembro eliminado");
        cargarDatos();
      } catch (error) {
        toast.error('Error al eliminar');
      }
    }
  };

  const abrirModal = (miembro = null) => {
    if (miembro) {
      setMiembroEditando(miembro);
      setFormData({
        nombre: miembro.nombre,
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
        ministerio_of: miembro.ministerio_of || ''
      });
    } else {
      setMiembroEditando(null);
      setFormData({
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
        ministerio_of: ''
      });
    }
    setMostrarModal(true);
  };

  const cerrarModal = () => {
    setMostrarModal(false);
    setMiembroEditando(null);
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0E5A61, #15777F)", padding: "20px" }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
            <button onClick={() => navigate("/home")} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "8px", padding: "10px 15px", color: "white", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
              <FaArrowLeft /> Volver
            </button>
            <h1 style={{ color: "white", margin: 0 }}>Gestión de Miembros</h1>
          </div>
          <button onClick={() => abrirModal()} style={{ background: "#4CAF50", border: "none", borderRadius: "8px", padding: "12px 20px", color: "white", cursor: "pointer", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px" }}>
            <FaPlus /> Agregar Miembro
          </button>
        </div>

        {/* Filtro */}
        <div style={{ background: "white", padding: "20px", borderRadius: "12px", marginBottom: "20px" }}>
          <input type="text" placeholder="Buscar por nombre, país o ciudad..." value={filtro} onChange={(e) => setFiltro(e.target.value)} style={{ width: "100%", padding: "12px", border: "1px solid #ddd", borderRadius: "8px", fontSize: "14px" }} />
        </div>

        {/* Tabla */}
        {loading ? (
          <div style={{ background: "white", padding: "40px", borderRadius: "12px", textAlign: "center" }}>
            Cargando...
          </div>
        ) : (
          <div style={{ background: "white", borderRadius: "12px", overflow: "hidden", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f5f5f5" }}>
                    <th style={{ padding: "15px", textAlign: "left", fontWeight: "600" }}>Nombre</th>
                    <th style={{ padding: "15px", textAlign: "left", fontWeight: "600" }}>Identidad</th>
                    <th style={{ padding: "15px", textAlign: "left", fontWeight: "600" }}>País</th>
                    <th style={{ padding: "15px", textAlign: "left", fontWeight: "600" }}>Ciudad</th>
                    <th style={{ padding: "15px", textAlign: "left", fontWeight: "600" }}>Edad</th>
                    <th style={{ padding: "15px", textAlign: "left", fontWeight: "600" }}>Tipo</th>
                    <th style={{ padding: "15px", textAlign: "center", fontWeight: "600" }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {miembrosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ padding: "40px", textAlign: "center", color: "#999" }}>
                        No hay miembros registrados
                      </td>
                    </tr>
                  ) : (
                    miembrosFiltrados.map((miembro) => (
                      <tr key={miembro.id} style={{ borderTop: "1px solid #eee" }}>
                        <td style={{ padding: "15px" }}>{miembro.nombre}</td>
                        <td style={{ padding: "15px" }}>{miembro.identidad || '-'}</td>
                        <td style={{ padding: "15px" }}>{miembro.pais_nombre || '-'}</td>
                        <td style={{ padding: "15px" }}>{miembro.ciudad || '-'}</td>
                        <td style={{ padding: "15px" }}>{miembro.edad || '-'}</td>
                        <td style={{ padding: "15px" }}>
                          <span style={{ background: miembro.tipo_miembro === 'Comprometido' ? '#4CAF50' : miembro.tipo_miembro === 'Registrado' ? '#2196F3' : '#FF9800', color: "white", padding: "4px 12px", borderRadius: "12px", fontSize: "12px" }}>
                            {miembro.tipo_miembro}
                          </span>
                        </td>
                        <td style={{ padding: "15px", textAlign: "center" }}>
                          <button onClick={() => abrirModal(miembro)} style={{ background: "#2196F3", border: "none", borderRadius: "6px", padding: "6px 12px", color: "white", cursor: "pointer", marginRight: "8px" }}>
                            <FaEdit />
                          </button>
                          <button onClick={() => handleDelete(miembro.id)} style={{ background: "#f44336", border: "none", borderRadius: "6px", padding: "6px 12px", color: "white", cursor: "pointer" }}>
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

        <p style={{ color: "white", textAlign: "center", marginTop: "20px", fontSize: "13px" }}>
          Total de miembros: {miembrosFiltrados.length}
        </p>
      </div>

      {/* Modal */}
      {mostrarModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
          <div style={{ background: "white", borderRadius: "12px", padding: "30px", width: "90%", maxWidth: "700px", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ margin: 0 }}>{miembroEditando ? 'Editar Miembro' : 'Nuevo Miembro'}</h2>
              <button onClick={cerrarModal} style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "#666" }}>
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Datos Básicos */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "15px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "600" }}>Nombre *</label>
                  <input type="text" required value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})} style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "6px" }} />
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "600" }}>Identidad</label>
                  <input type="text" value={formData.identidad} onChange={(e) => setFormData({...formData, identidad: e.target.value})} style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "6px" }} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "15px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "600" }}>País *</label>
                  <select required value={formData.pais_id} onChange={(e) => setFormData({...formData, pais_id: e.target.value})} style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "6px" }}>
                    <option value="">Seleccionar país...</option>
                    {paises.map(pais => (
                      <option key={pais.id} value={pais.id}>{pais.nombre}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "600" }}>Ciudad</label>
                  <input type="text" value={formData.ciudad} onChange={(e) => setFormData({...formData, ciudad: e.target.value})} style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "6px" }} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "15px", marginBottom: "15px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "600" }}>Edad</label>
                  <input type="number" value={formData.edad} onChange={(e) => setFormData({...formData, edad: e.target.value})} style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "6px" }} />
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "600" }}>Estado Civil</label>
                  <select value={formData.estado_civil} onChange={(e) => setFormData({...formData, estado_civil: e.target.value})} style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "6px" }}>
                    <option value="">Seleccionar...</option>
                    <option value="Soltero/a">Soltero/a</option>
                    <option value="Casado/a">Casado/a</option>
                    <option value="Divorciado/a">Divorciado/a</option>
                    <option value="Viudo/a">Viudo/a</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "600" }}>Profesión</label>
                  <input type="text" value={formData.profesion} onChange={(e) => setFormData({...formData, profesion: e.target.value})} style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "6px" }} />
                </div>
              </div>

              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "600" }}>Evangelizado Por</label>
                <input type="text" value={formData.evangelizado_por} onChange={(e) => setFormData({...formData, evangelizado_por: e.target.value})} style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "6px" }} />
              </div>

              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "600" }}>Tipo de Miembro *</label>
                <select required value={formData.tipo_miembro} onChange={(e) => setFormData({...formData, tipo_miembro: e.target.value})} style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "6px" }}>
                  <option value="Registrado">Registrado</option>
                  <option value="Comprometido">Comprometido</option>
                  <option value="Voluntario">Voluntario</option>
                </select>
              </div>

              {/* Campos Condicionales según Tipo de Miembro */}
              {formData.tipo_miembro === 'Comprometido' && (
                <div style={{ marginBottom: "15px", padding: "15px", background: "#e8f5e9", borderRadius: "8px" }}>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "600", color: "#2e7d32" }}>Cargo o Función</label>
                  <input type="text" value={formData.cargo_funcion} onChange={(e) => setFormData({...formData, cargo_funcion: e.target.value})} style={{ width: "100%", padding: "10px", border: "1px solid #a5d6a7", borderRadius: "6px" }} placeholder="Ej: Pastor, Líder de Célula, etc." />
                </div>
              )}

              {formData.tipo_miembro === 'Registrado' && (
                <div style={{ marginBottom: "15px", padding: "15px", background: "#e3f2fd", borderRadius: "8px" }}>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "600", color: "#1565c0" }}>Avance Audio</label>
                  <input type="text" value={formData.avance_audio} onChange={(e) => setFormData({...formData, avance_audio: e.target.value})} style={{ width: "100%", padding: "10px", border: "1px solid #90caf9", borderRadius: "6px" }} placeholder="Ej: Audio 5, Lección 3, etc." />
                </div>
              )}

              {formData.tipo_miembro === 'Voluntario' && (
                <div style={{ marginBottom: "15px", padding: "15px", background: "#fff3e0", borderRadius: "8px" }}>
                  <div style={{ marginBottom: "10px" }}>
                    <label style={{ display: "block", marginBottom: "5px", fontWeight: "600", color: "#e65100" }}>Ministerio OF</label>
                    <input type="text" value={formData.ministerio_of} onChange={(e) => setFormData({...formData, ministerio_of: e.target.value})} style={{ width: "100%", padding: "10px", border: "1px solid #ffcc80", borderRadius: "6px" }} placeholder="Ej: Alabanza, Multimedia, etc." />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "5px", fontWeight: "600", color: "#e65100" }}>Avance Audio</label>
                    <input type="text" value={formData.avance_audio} onChange={(e) => setFormData({...formData, avance_audio: e.target.value})} style={{ width: "100%", padding: "10px", border: "1px solid #ffcc80", borderRadius: "6px" }} placeholder="Ej: Audio 5, Lección 3, etc." />
                  </div>
                </div>
              )}

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "600" }}>Comentarios</label>
                <textarea value={formData.comentarios} onChange={(e) => setFormData({...formData, comentarios: e.target.value})} style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "6px", minHeight: "80px" }} placeholder="Observaciones o notas adicionales..." />
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button type="submit" style={{ flex: 1, padding: "12px", background: "#4CAF50", color: "white", border: "none", borderRadius: "6px", fontWeight: "600", cursor: "pointer" }}>
                  {miembroEditando ? 'Actualizar' : 'Crear'}
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
