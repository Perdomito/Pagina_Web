import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaPlus, FaEdit, FaTrash, FaTimes, FaLayerGroup, FaBroom } from "react-icons/fa";
import toast from 'react-hot-toast';
import contactosService from '../services/ContactosService';
import { useAuth } from '../context/AuthContext';
import estudiosService from '../services/EstudiosService';
import miembrosService from '../services/MiembrosService';
import administracionService from '../services/AdministracionService';
import { useIdioma } from '../context/IdiomaContext';
import axios from '../api/axios';

export default function Contactos() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t, idioma } = useIdioma();
  const tx = (es, en) => (idioma === 'en' ? en : es); // texto bilingüe directo, para etiquetas nuevas que aún no están en el diccionario del traductor
  const [contactos, setContactos] = useState([]);
  const [miembros, setMiembros] = useState([]);
  const [paises, setPaises] = useState([]);
  const [estudiosPorContacto, setEstudiosPorContacto] = useState({}); // contacto_id -> {anio, mes} de su ultima actividad
  const [loading, setLoading] = useState(true);
  const [alertaEliminar, setAlertaEliminar] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [filtroPais, setFiltroPais] = useState('');
  const [procesandoLimpieza, setProcesandoLimpieza] = useState(false);
  const [ordenColumna, setOrdenColumna] = useState(null);
  const [ordenDireccion, setOrdenDireccion] = useState('asc');
  const [mostrarModal, setMostrarModal] = useState(false);
  const [contactoDetalle, setContactoDetalle] = useState(null);
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
      const [contactosData, miembrosData, paisesData, estudiosData] = await Promise.all([
        contactosService.getAll(),
        miembrosService.getAll(),
        administracionService.getAllPaises(),
        axios.get('/estudios-diarios').then(r => r.data).catch(() => [])
      ]);
      setContactos(contactosData);
      setMiembros(miembrosData);
      setPaises(paisesData);

      // Para cada contacto, guardar TODOS sus estudios (para calcular estado, capítulo máximo y el detalle)
      const porContacto = {};
      estudiosData.forEach(e => {
        if (!e.contacto_id) return;
        if (!porContacto[e.contacto_id]) porContacto[e.contacto_id] = [];
        porContacto[e.contacto_id].push(e);
      });
      setEstudiosPorContacto(porContacto);
    } catch (error) {
      console.error('Error:', error);
      toast.error(t('ct_errorCargarDatos'));
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
      telefono: limpiarTelefono(formData.telefono) || null,
      pais_id: formData.pais_id === '' ? null : Number(formData.pais_id),
      notas: formData.notas || null,
    };
    try {
      if (contactoEditando) {
        await contactosService.update(contactoEditando.id, payload);
        toast.success(t('ct_contactoActualizado'));
      } else {
        await contactosService.create(payload);
        toast.success(t('ct_contactoCreado'));
      }
      cargarDatos();
      cerrarModal();
    } catch (error) {
      toast.error(error.response?.data?.error || t('ct_errorGuardar'));
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
    if (!window.confirm(t('confirmarEliminar'))) return;
    try {
      await contactosService.delete(id);
      toast.success(t('ct_contactoEliminado'));
      cargarDatos();
    } catch {
      toast.error(t('ct_errorEliminarContacto'));
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

  // Limpia el teléfono: deja solo dígitos, y el + inicial si lo tenía
  const limpiarTelefono = (tel) => {
    if (!tel) return tel;
    const tienesMas = tel.trim().startsWith('+');
    const soloDigitos = tel.replace(/\D/g, '');
    return (tienesMas ? '+' : '') + soloDigitos;
  };

  // Filtrar por búsqueda
  // Filtrar por país del usuario
  const contactosPorPaisUsuario = (user?.rol_id === 1 || !user?.pais_id)
    ? contactos
    : contactos.filter(c => c.pais_id === user.pais_id);

  const contactosPorPais = !filtroPais
    ? contactosPorPaisUsuario
    : contactosPorPaisUsuario.filter(c => String(c.pais_id) === String(filtroPais));

  const contactosFiltrados = contactosPorPais.filter(c => {
    const q = busqueda.toLowerCase().trim();
    if (!q) return true;
    return (
      c.nombre?.toLowerCase().includes(q) ||
      c.telefono?.toLowerCase().includes(q) ||
      c.miembro_responsable?.toLowerCase().includes(q) ||
      c.pais_nombre?.toLowerCase().includes(q)
    );
  });

  // Detectar duplicados: mismo nombre Y mismo teléfono (no solo uno de los dos)
  const claveDuplicado = (c) => `${c.nombre?.trim().toLowerCase()}|${limpiarTelefono(c.telefono)}`;
  const duplicadoCount = {};
  contactos.forEach(c => {
    if (!c.nombre || !c.telefono) return; // sin nombre+telefono no se considera duplicado
    const clave = claveDuplicado(c);
    duplicadoCount[clave] = (duplicadoCount[clave] || 0) + 1;
  });
  const tieneDuplicado = (c) => c.nombre && c.telefono && duplicadoCount[claveDuplicado(c)] > 1;
  const totalDuplicados = contactosPorPais.filter(tieneDuplicado).length;

  // Teléfono inválido: menos de 10 dígitos (o nombre que en realidad es un número)
  const esTelefonoInvalido = (c) => {
    if (!c.telefono) return false;
    const digitos = c.telefono.replace(/\D/g, '');
    return digitos.length > 0 && digitos.length < 10;
  };
  const esNombreInvalido = (c) => c.nombre && /^\d+$/.test(c.nombre.trim());
  const esInvalido = (c) => esTelefonoInvalido(c) || esNombreInvalido(c);
  const totalInvalidos = contactosPorPais.filter(esInvalido).length;

  // Extrae el número de capítulo de textos como "Cap. 8" o "Cap. 1:1-7" (el primer número que aparezca)
  const numeroCapitulo = (capitulo) => {
    if (!capitulo) return 0;
    const m = String(capitulo).match(/\d+/);
    return m ? parseInt(m[0]) : 0;
  };

  // Estado: Finalizado si llegó al capítulo 8 o más; si no, activo (estudio en los últimos 2 meses) o sin estudio (3+ meses)
  const estadoEstudio = (c) => {
    const lista = estudiosPorContacto[c.id];
    if (!lista || lista.length === 0) return null; // nunca tuvo estudio registrado

    const capMax = Math.max(...lista.map(e => numeroCapitulo(e.capitulo)));
    if (capMax >= 8) return 'finalizado';

    const claveMax = Math.max(...lista.map(e => e.anio * 12 + e.mes));
    const hoy = new Date();
    const claveHoy = hoy.getFullYear() * 12 + (hoy.getMonth() + 1);
    const mesesSinActividad = claveHoy - claveMax;
    if (mesesSinActividad <= 2) return 'activo';
    return 'sin_estudio';
  };

  // Orden de columnas al hacer clic en el encabezado
  const RANGO_ESTADO = { activo: 1, finalizado: 2, sin_estudio: 3 }; // null (sin registro) queda al final
  const alClicColumna = (columna) => {
    if (ordenColumna === columna) {
      setOrdenDireccion(ordenDireccion === 'asc' ? 'desc' : 'asc');
    } else {
      setOrdenColumna(columna);
      setOrdenDireccion('asc');
    }
  };
  const contactosOrdenados = !ordenColumna ? contactosFiltrados : [...contactosFiltrados].sort((a, b) => {
    let valA, valB;
    if (ordenColumna === 'estado') {
      valA = RANGO_ESTADO[estadoEstudio(a)] || 99;
      valB = RANGO_ESTADO[estadoEstudio(b)] || 99;
    } else {
      valA = (a[ordenColumna] || '').toString().toLowerCase();
      valB = (b[ordenColumna] || '').toString().toLowerCase();
    }
    const cmp = valA < valB ? -1 : valA > valB ? 1 : 0;
    return ordenDireccion === 'asc' ? cmp : -cmp;
  });
  const flechaOrden = (columna) => ordenColumna === columna ? (ordenDireccion === 'asc' ? ' ▲' : ' ▼') : '';

  // Fusionar duplicados: por cada grupo de nombre+telefono repetido, dejar el mas completo y borrar el resto
  const fusionarDuplicados = async () => {
    const grupos = {};
    contactosPorPais.forEach(c => {
      if (!tieneDuplicado(c)) return;
      const clave = claveDuplicado(c);
      if (!grupos[clave]) grupos[clave] = [];
      grupos[clave].push(c);
    });
    const totalGrupos = Object.keys(grupos).length;
    if (totalGrupos === 0) {
      toast.error(tx('No hay duplicados para fusionar', 'No duplicates to merge'));
      return;
    }
    if (!window.confirm(`${totalGrupos} grupo(s) de duplicados. Se conservará el registro más completo de cada uno y se borrará el resto. ¿Continuar?`)) return;

    setProcesandoLimpieza(true);
    let borrados = 0;
    const puntuar = (c) => [c.telefono, c.pais_id, c.notas, c.miembro_responsable_id].filter(Boolean).length;
    try {
      for (const clave of Object.keys(grupos)) {
        const grupo = grupos[clave].slice().sort((a, b) => puntuar(b) - puntuar(a));
        const [conservar, ...borrar] = grupo;
        for (const c of borrar) {
          try {
            await contactosService.delete(c.id);
            borrados++;
          } catch { /* puede fallar si tiene estudios asociados; se deja tal cual */ }
        }
      }
      toast.success(`${borrados} contacto(s) duplicado(s) eliminado(s)`);
      cargarDatos();
    } finally {
      setProcesandoLimpieza(false);
    }
  };

  // Eliminar contactos con telefono invalido o nombre que es un numero
  const eliminarInvalidos = async () => {
    const invalidos = contactosPorPais.filter(esInvalido);
    if (invalidos.length === 0) {
      toast.error(tx('No hay contactos inválidos', 'No invalid contacts found'));
      return;
    }
    if (!window.confirm(`${invalidos.length} contacto(s) con teléfono inválido o nombre numérico. Se eliminarán. ¿Continuar?`)) return;
    setProcesandoLimpieza(true);
    let borrados = 0;
    try {
      for (const c of invalidos) {
        try {
          await contactosService.delete(c.id);
          borrados++;
        } catch { /* se deja si tiene estudios asociados */ }
      }
      toast.success(`${borrados} contacto(s) inválido(s) eliminado(s)`);
      cargarDatos();
    } finally {
      setProcesandoLimpieza(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0E5A61, #15777F)", padding: "20px" }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
            <button onClick={() => navigate("/home")} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "8px", padding: "10px 15px", color: "white", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
              <FaArrowLeft /> {t('volver')}
            </button>
            <div>
              <h1 style={{ color: "white", margin: 0 }}>{t('ct_titulo')}</h1>
              {user?.pais_nombre && (
                <p style={{ margin: "2px 0 0", color: "rgba(255,255,255,0.6)", fontSize: "12px", fontFamily: "'Lato',sans-serif" }}>
                  {user.pais_nombre} · {user.region || ""}
                </p>
              )}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
            <button onClick={() => abrirModal()} style={{ background: "#4CAF50", border: "none", borderRadius: "8px", padding: "12px 20px", color: "white", cursor: "pointer", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px" }}>
              <FaPlus /> {t('ct_agregarContacto')}
            </button>
            <div style={{ display: "flex", gap: "8px" }}>
              <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: "6px", padding: "4px 12px", color: "white", fontSize: "12px" }}>
                <strong>{contactosPorPais.length}</strong> {t(contactosPorPais.length !== 1 ? 'ct_contactos' : 'ct_contacto')}
              </div>
              {totalDuplicados > 0 && (
                <div style={{ background: "rgba(255,152,0,0.3)", border: "1px solid rgba(255,152,0,0.6)", borderRadius: "6px", padding: "4px 12px", color: "white", fontSize: "12px" }}>
                  ⚠️ <strong>{totalDuplicados}</strong> {t(totalDuplicados !== 1 ? 'ct_duplicados' : 'ct_duplicado')}
                </div>
              )}
              {totalInvalidos > 0 && (
                <div style={{ background: "rgba(244,67,54,0.3)", border: "1px solid rgba(244,67,54,0.6)", borderRadius: "6px", padding: "4px 12px", color: "white", fontSize: "12px" }}>
                  ⚠️ <strong>{totalInvalidos}</strong> {tx('inválidos', 'invalid')}
                </div>
              )}
            </div>
            {(totalDuplicados > 0 || totalInvalidos > 0) && (
              <div style={{ display: "flex", gap: "8px" }}>
                {totalDuplicados > 0 && (
                  <button onClick={fusionarDuplicados} disabled={procesandoLimpieza} style={{ background: "#ff9800", border: "none", borderRadius: "6px", padding: "8px 14px", color: "white", cursor: procesandoLimpieza ? "not-allowed" : "pointer", fontSize: "12px", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px", opacity: procesandoLimpieza ? 0.6 : 1 }}>
                    <FaLayerGroup /> {tx('Fusionar duplicados', 'Merge duplicates')}
                  </button>
                )}
                {totalInvalidos > 0 && (
                  <button onClick={eliminarInvalidos} disabled={procesandoLimpieza} style={{ background: "#f44336", border: "none", borderRadius: "6px", padding: "8px 14px", color: "white", cursor: procesandoLimpieza ? "not-allowed" : "pointer", fontSize: "12px", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px", opacity: procesandoLimpieza ? 0.6 : 1 }}>
                    <FaBroom /> {tx('Eliminar inválidos', 'Remove invalid')}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>



        {/* Search bar + filtro de pais */}
        <div style={{ marginBottom: "16px", display: "flex", gap: "10px" }}>
          <input
            type="text"
            placeholder={t('ct_buscarPlaceholder')}
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            style={{ flex: 1, padding: "13px 18px", borderRadius: "10px", border: "none", fontSize: "15px", boxSizing: "border-box", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
          />
          <select
            value={filtroPais}
            onChange={e => setFiltroPais(e.target.value)}
            style={{ padding: "13px 14px", borderRadius: "10px", border: "none", fontSize: "14px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", minWidth: "180px" }}
          >
            <option value="">{tx('Todos los países', 'All countries')}</option>
            {paises.map(p => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>
        </div>
        {busqueda && (
          <div style={{ marginTop: "-8px", marginBottom: "16px", color: "rgba(255,255,255,0.8)", fontSize: "13px" }}>
            {contactosFiltrados.length} {t(contactosFiltrados.length !== 1 ? 'ct_resultados' : 'ct_resultado')} {t('ct_para')} "{busqueda}"
          </div>
        )}

        {loading ? (
          <div style={{ background: "white", padding: "40px", borderRadius: "12px", textAlign: "center" }}>
            {t('cargando')}
          </div>
        ) : (
          <div style={{ background: "white", borderRadius: "12px", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f5f5f5" }}>
                  <th onClick={() => alClicColumna('nombre')} style={{ padding: "15px", textAlign: "left", cursor: "pointer", userSelect: "none" }}>{tx('Nombre', 'Name')}{flechaOrden('nombre')}</th>
                  <th onClick={() => alClicColumna('telefono')} style={{ padding: "15px", textAlign: "left", cursor: "pointer", userSelect: "none" }}>{tx('Teléfono', 'Phone')}{flechaOrden('telefono')}</th>
                  <th onClick={() => alClicColumna('pais_nombre')} style={{ padding: "15px", textAlign: "left", cursor: "pointer", userSelect: "none" }}>{tx('País', 'Country')}{flechaOrden('pais_nombre')}</th>
                  <th onClick={() => alClicColumna('miembro_responsable')} style={{ padding: "15px", textAlign: "left", cursor: "pointer", userSelect: "none" }}>{tx('Misionero Responsable', 'Responsible Member')}{flechaOrden('miembro_responsable')}</th>
                  <th onClick={() => alClicColumna('estado')} style={{ padding: "15px", textAlign: "center", cursor: "pointer", userSelect: "none" }}>{tx('Estado', 'Status')}{flechaOrden('estado')}</th>
                  <th style={{ padding: "15px", textAlign: "center" }}>{tx('Acciones', 'Actions')}</th>
                </tr>
              </thead>
              <tbody>
                {contactosOrdenados.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: "40px", textAlign: "center", color: "#999" }}>
                      {busqueda ? `No results for "${busqueda}"` : 'No contacts registered for this country'}
                    </td>
                  </tr>
                ) : (
                  contactosOrdenados.map(c => {
                    const duplicado = tieneDuplicado(c);
                    const invalido = esInvalido(c);
                    const estado = estadoEstudio(c);
                    return (
                    <tr key={c.id} style={{ borderTop: "1px solid #eee", background: invalido ? "#ffebee" : (duplicado ? "#fff8e1" : "white") }}>
                      <td style={{ padding: "15px", color: duplicado ? "#e65100" : "inherit", fontWeight: duplicado ? "600" : "normal" }}>
                        <span onClick={() => setContactoDetalle(c)} style={{ cursor: "pointer", textDecoration: "underline", textDecorationStyle: "dotted", textUnderlineOffset: "3px" }} title={tx('Ver detalle', 'View detail')}>
                          {c.nombre}
                        </span>
                        {duplicado && <span style={{ marginLeft: "8px", fontSize: "11px", background: "#ff9800", color: "white", borderRadius: "4px", padding: "1px 6px" }}>{t('ct_duplicado')}</span>}
                        {invalido && <span style={{ marginLeft: "8px", fontSize: "11px", background: "#f44336", color: "white", borderRadius: "4px", padding: "1px 6px" }}>{tx('inválido', 'invalid')}</span>}
                      </td>
                      <td style={{ padding: "15px", color: duplicado ? "#e65100" : "inherit", fontWeight: duplicado ? "600" : "normal" }}>
                        {c.telefono || '-'}
                      </td>
                      <td style={{ padding: "15px" }}>{c.pais_nombre || '-'}</td>
                      <td style={{ padding: "15px" }}>{c.miembro_responsable || '-'}</td>
                      <td style={{ padding: "15px", textAlign: "center" }}>
                        {estado === 'finalizado' && <span style={{ fontSize: "11px", background: "#e3f2fd", color: "#1565c0", borderRadius: "12px", padding: "3px 10px", fontWeight: "600" }}>{tx('Finalizado', 'Finished')}</span>}
                        {estado === 'activo' && <span style={{ fontSize: "11px", background: "#e8f5e9", color: "#2e7d32", borderRadius: "12px", padding: "3px 10px", fontWeight: "600" }}>{tx('Activo', 'Active')}</span>}
                        {estado === 'sin_estudio' && <span style={{ fontSize: "11px", background: "#fff3e0", color: "#e65100", borderRadius: "12px", padding: "3px 10px", fontWeight: "600" }}>{tx('Sin estudio', 'No study')}</span>}
                        {estado === null && <span style={{ fontSize: "11px", color: "#999" }}>—</span>}
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

      {/* Modal de detalle del contacto */}
      {contactoDetalle && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1500 }} onClick={() => setContactoDetalle(null)}>
          <div style={{ background: "white", borderRadius: "16px", padding: "30px", width: "90%", maxWidth: "480px", maxHeight: "85vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
              <div>
                <h2 style={{ margin: 0, color: "#134069" }}>{contactoDetalle.nombre}</h2>
                {(() => {
                  const est = estadoEstudio(contactoDetalle);
                  const estilos = {
                    finalizado: { background: "#e3f2fd", color: "#1565c0", texto: tx('Finalizado', 'Finished') },
                    activo: { background: "#e8f5e9", color: "#2e7d32", texto: tx('Activo', 'Active') },
                    sin_estudio: { background: "#fff3e0", color: "#e65100", texto: tx('Sin estudio', 'No study') },
                  };
                  if (!est) return <span style={{ fontSize: "12px", color: "#999" }}>{tx('Sin estudio registrado', 'No study recorded')}</span>;
                  const e = estilos[est];
                  return <span style={{ display: "inline-block", marginTop: "6px", fontSize: "12px", fontWeight: "600", background: e.background, color: e.color, borderRadius: "12px", padding: "3px 12px" }}>{e.texto}</span>;
                })()}
              </div>
              <button onClick={() => setContactoDetalle(null)} style={{ background: "none", border: "none", fontSize: "22px", cursor: "pointer", color: "#999" }}>
                <FaTimes />
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px", fontSize: "14px" }}>
              <div>
                <div style={{ color: "#999", fontSize: "11px", textTransform: "uppercase" }}>{tx('Teléfono', 'Phone')}</div>
                <div>{contactoDetalle.telefono || '-'}</div>
              </div>
              <div>
                <div style={{ color: "#999", fontSize: "11px", textTransform: "uppercase" }}>{tx('País', 'Country')}</div>
                <div>{contactoDetalle.pais_nombre || '-'}</div>
              </div>
              <div>
                <div style={{ color: "#999", fontSize: "11px", textTransform: "uppercase" }}>{tx('Misionero responsable', 'Responsible')}</div>
                <div>{contactoDetalle.miembro_responsable || '-'}</div>
              </div>
              <div>
                <div style={{ color: "#999", fontSize: "11px", textTransform: "uppercase" }}>{tx('Capítulo actual', 'Current chapter')}</div>
                <div>
                  {(() => {
                    const lista = estudiosPorContacto[contactoDetalle.id];
                    if (!lista || lista.length === 0) return '-';
                    const maximo = lista.reduce((max, e) => numeroCapitulo(e.capitulo) > numeroCapitulo(max.capitulo) ? e : max, lista[0]);
                    return maximo.capitulo;
                  })()}
                </div>
              </div>
            </div>

            {contactoDetalle.notas && (
              <div style={{ marginBottom: "20px", fontSize: "13px", color: "#555", background: "#f7f7f7", borderRadius: "8px", padding: "10px 14px" }}>
                {contactoDetalle.notas}
              </div>
            )}

            <div style={{ fontWeight: "600", marginBottom: "10px", fontSize: "14px" }}>{tx('Historial de estudios', 'Study history')}</div>
            {(!estudiosPorContacto[contactoDetalle.id] || estudiosPorContacto[contactoDetalle.id].length === 0) ? (
              <div style={{ color: "#999", fontSize: "13px" }}>{tx('Sin estudio registrado', 'No study recorded')}</div>
            ) : (
              <table style={{ width: "100%", fontSize: "13px", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #eee" }}>
                    <th style={{ textAlign: "left", padding: "6px 4px" }}>{tx('Fecha', 'Date')}</th>
                    <th style={{ textAlign: "left", padding: "6px 4px" }}>{tx('Capítulo', 'Chapter')}</th>
                  </tr>
                </thead>
                <tbody>
                  {[...estudiosPorContacto[contactoDetalle.id]]
                    .sort((a, b) => (b.anio * 12 + b.mes) - (a.anio * 12 + a.mes) || b.dia - a.dia)
                    .map((e, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid #f5f5f5" }}>
                        <td style={{ padding: "6px 4px" }}>{e.dia}/{e.mes}/{e.anio}</td>
                        <td style={{ padding: "6px 4px" }}>{e.capitulo}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}