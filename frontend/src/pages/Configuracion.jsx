import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaPlus, FaEdit, FaTrash, FaSave, FaTimes, FaUser, FaLock, FaShieldAlt, FaUserShield, FaGlobe } from "react-icons/fa";
import toast from 'react-hot-toast';
import configuracionService from '../services/ConfiguracionService';
import { useAuth } from '../context/AuthContext';
import { useIdioma } from '../context/IdiomaContext';

export default function Configuracion() {
  const navigate = useNavigate();
  const { user } = useAuth();
  // Módulos del sistema — hardcoded para no depender del backend
  const MODULOS_SISTEMA = [
    { id: 1, nombre: 'bible_studies',  label: 'Bible Studies',  icono: '📖' },
    { id: 2, nombre: 'reports',        label: 'Reports',        icono: '📊' },
    { id: 3, nombre: 'members',        label: 'Members',        icono: '👥' },
    { id: 4, nombre: 'contacts',       label: 'Contacts',       icono: '📞' },
    { id: 5, nombre: 'administration', label: 'Administration', icono: '💰' },
    { id: 6, nombre: 'statistics',     label: 'Statistics',     icono: '📈' },
    { id: 7, nombre: 'settings',       label: 'Settings',       icono: '⚙️' },
    { id: 8, nombre: 'Seguimiento de Leyes', label: 'Seguimiento de Leyes', icono: '⚖️' },
  ];
  const { t, tv, idioma, setIdioma } = useIdioma();
  const tx = (es, en) => (idioma === 'en' ? en : es); // bilingüe directo para textos sin clave en el diccionario central
  
  const [tabActive, setTabActive] = useState("usuarios");
  const [cargando, setCargando] = useState(false);
  
  // Estados de datos
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permisos, setPermissions] = useState([]);
  const [paises, setPaises] = useState([]);
  
  // Estados de modales
  const [mostrandoModal, setMostrandoModal] = useState(false);
  const [tipoModal, setTipoModal] = useState("");
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [rolSeleccionado, setRolSeleccionado] = useState(null);
  const [usuarioPermisos, setUsuarioPermissions] = useState(null);
  
  // Estados de formularios
  const [nuevoUsuario, setNuevoUsuario] = useState({
    id: "",
    nombre: "",
    email: "",
    password: "",
    rol_id: "",
    pais_id: ""
  });
  
  useEffect(() => {
    cargarDatosIniciales();
  }, []);
  
  const cargarDatosIniciales = async () => {
    try {
      setCargando(true);
      const [usuariosData, rolesData, permisosData, paisesData] = await Promise.all([
        configuracionService.getAllUsuarios().catch(() => []),
        configuracionService.getAllRoles().catch(() => []),
        configuracionService.getAllPermisos().catch(() => []),
        configuracionService.getAllPaises().catch(() => [])
      ]);
      setUsuarios(Array.isArray(usuariosData) ? usuariosData : []);
      setRoles(Array.isArray(rolesData) ? rolesData : []);
      setPermissions(Array.isArray(permisosData) ? permisosData : []);
      setPaises(Array.isArray(paisesData) ? paisesData : []);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      toast.error(t('error'));
    } finally {
      setCargando(false);
    }
  };
  
const generarIdUsuario = () => {
    let max = 0;
    usuarios.forEach(u => {
      const m = String(u.id || '').match(/^U(\d+)$/i);
      if (m) max = Math.max(max, parseInt(m[1], 10));
    });
    return 'U' + String(max + 1).padStart(3, '0');
  };

  const abrirModalNuevoUsuario = () => {
    setTipoModal("nuevo_usuario");
    setUsuarioEditando(null);
    setNuevoUsuario({ id: generarIdUsuario(), nombre: "", email: "", password: "", rol_id: "", pais_id: "", activo: true });
    setMostrandoModal(true);
  };
  
  const abrirModalEditUsuario = (usuario) => {
    setTipoModal("editar_usuario");
    setUsuarioEditando(usuario);
    setNuevoUsuario({
      nombre: usuario.nombre,
      email: usuario.email,
      password: "",
          rol_id: usuario.rol_id || usuario.rol,
      pais_id: usuario.pais_id || "",
      activo: usuario.activo
    });
    setMostrandoModal(true);
  };
  
  const guardarUsuario = async () => {
    if (tipoModal === 'nuevo_usuario' && !nuevoUsuario.id) {
      toast.error("User ID is required");
      return;
    }
    if (!nuevoUsuario.nombre || !nuevoUsuario.email || !nuevoUsuario.rol_id) {
      toast.error(t('camposObligatorios'));
      return;
    }

    if (tipoModal === "nuevo_usuario" && !nuevoUsuario.password) {
      toast.error(t('cf_passwordObligatoria'));
      return;
    }
    
    if (tipoModal === "nuevo_usuario" && usuarios.some(u => (u.email || '').toLowerCase() === (nuevoUsuario.email || '').trim().toLowerCase())) {
      toast.error("This email is already registered");
      return;
    }

    try {
      if (tipoModal === "nuevo_usuario") {
        await configuracionService.crearUsuario({
          ...nuevoUsuario,
          rol: nuevoUsuario.rol_id,  // backend espera 'rol' no 'rol_id'
          pais_id: nuevoUsuario.pais_id === "" ? null : nuevoUsuario.pais_id,
          activo: nuevoUsuario.activo !== false
        });
        toast.success(t('cf_usuarioCreado'));
      } else {
        const datosActualizar = {
          ...nuevoUsuario,
          rol: nuevoUsuario.rol_id,
          pais_id: nuevoUsuario.pais_id === "" ? null : nuevoUsuario.pais_id
        };
        // No mandar password vacío: el backend lo tomaría como contraseña nueva
        if (!datosActualizar.password) delete datosActualizar.password;
        await configuracionService.actualizarUsuario(usuarioEditando.id, datosActualizar);
        toast.success(t('cf_usuarioActualizado'));
      }

      await cargarDatosIniciales();
      setMostrandoModal(false);
    } catch (error) {
      console.error('Error al guardar usuario:', error);
      toast.error(t('cf_errorGuardarUsuario'));
    }
  };

  const eliminarUsuario = async (id) => {
    if (!window.confirm(t('cf_confirmarEliminarUsuario'))) return;

    try {
      await configuracionService.eliminarUsuario(id);
      toast.success(t('cf_usuarioEliminado'));
      await cargarDatosIniciales();
    } catch (error) {
      console.error('Error al eliminar:', error);
      toast.error(t('cf_errorEliminarUsuario'));
    }
  };

  const verPermisosRol = async (rol) => {
    try {
      const permisosRol = await configuracionService.getPermisosRol(rol.id).catch(() => []);
      const permisosBase = MODULOS_SISTEMA.map(m => {
        const fromBD = Array.isArray(permisosRol) ? permisosRol.find(p => p.permiso_id === m.id) : null;
        return {
          permiso_id: m.id,
          nombre: m.nombre,
          label: m.label,
          icono: m.icono,
          tiene_acceso: fromBD?.tiene_acceso || false
        };
      });
      setRolSeleccionado({ ...rol, permisos: permisosBase });
      setUsuarioPermissions(null);
      setTabActive("permisos_rol");
    } catch (error) {
      console.error('Error al cargar permisos:', error);
      toast.error(t('cf_errorCargarPermisos'));
      // Aun si falla, mostrar módulos hardcodeados
      const permisosBase = MODULOS_SISTEMA.map(m => ({
        permiso_id: m.id, nombre: m.nombre, label: m.label, icono: m.icono, tiene_acceso: false
      }));
      setRolSeleccionado({ ...rol, permisos: permisosBase });
      setUsuarioPermissions(null);
      setTabActive("permisos_rol");
    }
  };
  
  const verPermisosPersonalizados = async (usuario) => {
    try {
const [permisosRol, permisosUsuario] = await Promise.all([
        configuracionService.getPermisosRol(usuario.rol_id || usuario.rol),
        configuracionService.getPermisosUsuario(usuario.id)
      ]);
      
      setUsuarioPermissions({
        ...usuario,
        permisosRol,
        permisosPersonalizados: permisosUsuario
      });
      setRolSeleccionado(null);
      setTabActive("permisos_usuario");
    } catch (error) {
      console.error('Error al cargar permisos:', error);
      toast.error(t('cf_errorCargarPermisosUsuario'));
    }
  };

  const togglePermisoRol = async (permisoId, tieneAcceso) => {
    try {
      await configuracionService.actualizarPermisoRol(rolSeleccionado.id, permisoId, !tieneAcceso);

      const permisosActualizados = rolSeleccionado.permisos.map(p =>
        p.permiso_id === permisoId ? { ...p, tiene_acceso: !tieneAcceso } : p
      );

      setRolSeleccionado({ ...rolSeleccionado, permisos: permisosActualizados });

    } catch (error) {
      console.error('Error al actualizar permiso:', error);
      toast.error(t('cf_errorActualizarPermiso'));
    }
  };

  const togglePermisoUsuario = async (permisoId, tieneAccesoActual) => {
    try {
      await configuracionService.actualizarPermisoUsuario(usuarioPermisos.id, permisoId, !tieneAccesoActual);

      const permisosActualizados = await configuracionService.getPermisosUsuario(usuarioPermisos.id);
      setUsuarioPermissions({ ...usuarioPermisos, permisosPersonalizados: permisosActualizados });
      
      toast.success(t('cf_permisoActualizado'));
    } catch (error) {
      console.error('Error al actualizar permiso:', error);
      const detalle = error.response?.data?.detail;
      toast.error(detalle ? String(detalle).slice(0, 140) : t('cf_errorActualizarPermiso'));
    }
  };
  
  const tienePermisoPersonalizado = (permisoId) => {
    return usuarioPermisos?.permisosPersonalizados?.find(p => p.permiso_id === permisoId);
  };

  const quitarPersonalizacion = async (permisoId) => {
    try {
      await configuracionService.eliminarPermisoUsuario(usuarioPermisos.id, permisoId);
      const permisosActualizados = await configuracionService.getPermisosUsuario(usuarioPermisos.id);
      setUsuarioPermissions({ ...usuarioPermisos, permisosPersonalizados: permisosActualizados });
      toast.success(tx('Vuelve a heredar del rol', 'Back to inheriting from role'));
    } catch (error) {
      toast.error(tx('No se pudo quitar la personalización', "Couldn't remove the customization"));
    }
  };
  
  const tienePermisoRol = (permisoId) => {
    return usuarioPermisos?.permisosRol?.find(p => p.permiso_id === permisoId && p.tiene_acceso);
  };
  
  const obtenerNombreRol = (rol_id) => {
    const rol = roles.find(r => r.id === rol_id);
    return rol ? rol.nombre : 'N/A';
  };
  
  const obtenerNombrePais = (pais_id) => {
    const pais = paises.find(p => p.id === pais_id);
    return pais ? pais.nombre : 'N/A';
  };
  
  if (cargando) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(160deg, #134069 0%, #1a5490 40%, #f4f6fb 40%)" }}>
        <div style={{ fontSize: "18px", color: "#666" }}>{t('cargando')}</div>
      </div>
    );
  }
  
  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #134069 0%, #1a5490 40%, #f4f6fb 40%)", padding: "28px", fontFamily: "'Lato', sans-serif" }}>
      <style>{`
        .tab-button {
          padding: 12px 24px;
          border: none;
          background: transparent;
          color: #5a6a85;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          border-bottom: 3px solid transparent;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: 'Lato', sans-serif;
        }
        .tab-button:hover { color: #134069; }
        .tab-button.active { color: #134069; border-bottom-color: #134069; }
        .card {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 2px 12px rgba(19,64,105,0.08);
          border: 1px solid #e8edf5;
        }
        .btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border: none;
          border-radius: 8px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 13px;
          font-family: 'Lato', sans-serif;
        }
        .btn:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
        .btn-primary { background: #134069; color: white; }
        .btn-success { background: #134069; color: white; }
        .btn-danger { background: white; color: #d32f2f; border: 1.5px solid #d32f2f; }
        .btn-outline { background: white; color: #134069; border: 1.5px solid #134069; }
        
        .btn-warning {
          background: #134069;
          color: white;
        }
        
        .btn-info {
          background: #134069;
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
          justifyContent: center;
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
          border-color: #134069;
        }
        
        .usuario-card {
          padding: 20px;
          border: 2px solid #f0f0f0;
          border-radius: 12px;
          margin-bottom: 15px;
          transition: all 0.3s;
        }
        
        .usuario-card:hover {
          border-color: #134069;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }
        
        .permiso-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px;
          border-bottom: 1px solid #f0f0f0;
        }
        
        .permiso-item:last-child {
          border-bottom: none;
        }
        
        .switch {
          position: relative;
          display: inline-block;
          width: 50px;
          height: 24px;
        }
        
        .switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        
        .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #ccc;
          transition: .4s;
          border-radius: 24px;
        }
        
        .slider:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: .4s;
          border-radius: 50%;
        }
        
        input:checked + .slider {
          background-color: #134069;
        }
        
        input:checked + .slider:before {
          transform: translateX(26px);
        }
        
        .permiso-badge {
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          margin-left: 10px;
        }
        
        .badge-rol {
          background: #e3f2fd;
          color: #134069;
        }
        
        .badge-personalizado {
          background: #fff3e0;
          color: #134069;
        }
      `}</style>

      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
          <button onClick={() => navigate("/home")} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "8px", padding: "8px 14px", color: "white", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: "700", fontFamily: "'Lato',sans-serif" }}>
            <FaArrowLeft /> {t('volver')}
          </button>
          <div>
            <h1 style={{ margin: 0, color: "white", fontSize: "20px", fontFamily: "'Cinzel',serif", fontWeight: "600", letterSpacing: "1px" }}>
              ⚙️ {t('configuracion')}
            </h1>
            <p style={{ color: "rgba(255,255,255,0.6)", margin: "2px 0 0", fontSize: "12px", fontFamily: "'Lato',sans-serif" }}>
              {t('gestionUsuariosRolesPermisos')}
            </p>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="card" style={{ marginBottom: "20px", padding: "0" }}>
          <div style={{ display: "flex", borderBottom: "1px solid #f0f0f0", flexWrap: "wrap" }}>
            <button
              onClick={() => { setTabActive("usuarios"); setRolSeleccionado(null); setUsuarioPermissions(null); }}
              className={`tab-button ${tabActive === "usuarios" ? 'active' : ''}`}
            >
              <FaUser /> {t('usuariosTab')}
            </button>
            <button
              onClick={() => { setTabActive("roles"); setRolSeleccionado(null); setUsuarioPermissions(null); }}
              className={`tab-button ${tabActive === "roles" ? 'active' : ''}`}
            >
              <FaLock /> {t('rolesTab')}
            </button>
            <button
              onClick={() => { setTabActive("idioma"); setRolSeleccionado(null); setUsuarioPermissions(null); }}
              className={`tab-button ${tabActive === "idioma" ? 'active' : ''}`}
            >
              <FaGlobe /> {t('idiomaTab')}
            </button>
            {rolSeleccionado && (
              <button
                onClick={() => setTabActive("permisos_rol")}
                className={`tab-button ${tabActive === "permisos_rol" ? 'active' : ''}`}
              >
                <FaShieldAlt /> {t('permisosDelRol')} {rolSeleccionado.nombre}
              </button>
            )}
            {usuarioPermisos && (
              <button
                onClick={() => setTabActive("permisos_usuario")}
                className={`tab-button ${tabActive === "permisos_usuario" ? 'active' : ''}`}
              >
                <FaUserShield /> {t('permisosDe')} {usuarioPermisos.nombre}
              </button>
            )}
          </div>
        </div>

        {/* TAB IDIOMA */}
        {tabActive === "idioma" && (
          <div className="card">
            <h2 style={{ margin: "0 0 8px", fontSize: "20px", fontWeight: "700" }}>🌐 {t('idiomaTitulo')}</h2>
            <p style={{ color: "#666", margin: "0 0 25px", fontSize: "14px" }}>
              {t('idiomaDesc')}
            </p>
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
              {[
                { codigo: 'es', nombre: t('español'), bandera: '🇪🇸' },
                { codigo: 'en', nombre: t('ingles'), bandera: '🇬🇧' }
              ].map(op => (
                <button
                  key={op.codigo}
                  onClick={() => {
                    setIdioma(op.codigo);
                    toast.success(op.codigo === 'es' ? 'Idioma cambiado a Español' : 'Language changed to English');
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "18px 28px",
                    borderRadius: "12px",
                    border: idioma === op.codigo ? "2px solid #0E5A61" : "2px solid #e0e0e0",
                    background: idioma === op.codigo ? "#e8f2f2" : "white",
                    cursor: "pointer",
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#333",
                    transition: "all 0.2s",
                    minWidth: "180px"
                  }}
                >
                  <span style={{ fontSize: "26px" }}>{op.bandera}</span>
                  {op.nombre}
                  {idioma === op.codigo && <span style={{ marginLeft: "auto", color: "#0E5A61" }}>✓</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* TAB USUARIOS */}
        {tabActive === "usuarios" && (
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" }}>
              <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "700" }}>👥 {t('usuariosSistema')}</h2>
              <button onClick={abrirModalNuevoUsuario} className="btn btn-success">
                <FaPlus /> {t('nuevoUsuario')}
              </button>
            </div>
            
            {usuarios.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px", color: "#999" }}>
                {t('cf_sinUsuarios')}
              </div>
            ) : (
              usuarios.map(usuario => (
                <div key={usuario.id} className="usuario-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "18px", fontWeight: "700", marginBottom: "5px", color: "#333" }}>
                        {usuario.nombre}
                      </div>
                      <div style={{ fontSize: "14px", color: "#666", marginBottom: "8px" }}>
                        📧 {usuario.email}
                      </div>
                      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                        <span style={{ padding: "4px 12px", background: "#2196F3", color: "white", borderRadius: "12px", fontSize: "12px", fontWeight: "600" }}>
                          {tv(obtenerNombreRol(usuario.rol_id || usuario.rol))}
                        </span>
                        {usuario.pais_id && (
                          <span style={{ padding: "4px 12px", background: "#2e7d32", color: "white", borderRadius: "12px", fontSize: "12px", fontWeight: "600" }}>
                            📍 {obtenerNombrePais(usuario.pais_id)}
                          </span>
                        )}
                        <span style={{ padding: "4px 12px", background: usuario.activo ? "#e8f5e9" : "#ffebee", color: usuario.activo ? "#2e7d32" : "#c62828", borderRadius: "12px", fontSize: "12px", fontWeight: "600" }}>
                          {usuario.activo ? `✓ ${tv('activo')}` : `✗ ${tv('inactivo')}`}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                      <button onClick={() => verPermisosPersonalizados(usuario)} className="btn btn-info" style={{ fontSize: "13px", padding: "8px 16px" }}>
                        <FaUserShield /> {t('cf_permisos')}
                      </button>
                      <button onClick={() => abrirModalEditUsuario(usuario)} className="btn btn-warning" style={{ fontSize: "13px", padding: "8px 16px" }}>
                        <FaEdit /> {t('editar')}
                      </button>
                      {usuario.id !== user?.id && (
                        <button onClick={() => eliminarUsuario(usuario.id)} className="btn btn-danger" style={{ fontSize: "13px", padding: "8px 16px" }}>
                          <FaTrash /> {t('eliminar')}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
        
        {/* TAB ROLES */}
        {tabActive === "roles" && (
          <div className="card">
            <h2 style={{ margin: "0 0 25px", fontSize: "20px", fontWeight: "700" }}>🔐 {t('cf_rolesSistema')}</h2>

            {roles.map(rol => (
              <div key={rol.id} style={{ padding: "20px", border: "2px solid #f0f0f0", borderRadius: "12px", marginBottom: "15px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: "18px", fontWeight: "700", marginBottom: "5px", color: "#333" }}>
                      {rol.nombre === 'admin' ? '👑' : rol.nombre === 'pastor' ? '🌍' : '👤'} {tv(rol.nombre)}
                    </div>
                    <div style={{ fontSize: "14px", color: "#666" }}>
                      {rol.descripcion}
                    </div>
                  </div>

                  <button onClick={() => verPermisosRol(rol)} className="btn btn-primary" style={{ fontSize: "13px", padding: "8px 16px" }}>
                    <FaShieldAlt /> {t('cf_verPermisos')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* TAB PERMISOS ROL */}
        {tabActive === "permisos_rol" && rolSeleccionado && (
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "700" }}>
                  ✅ {t('permisosDelRol')} {tv(rolSeleccionado.nombre)}
                </h2>
                <p style={{ color: "#666", fontSize: "13px", margin: "5px 0 0" }}>
                  {t('cf_defineModulosRol')}
                </p>
              </div>
            </div>
            
            {MODULOS_SISTEMA.map(permiso => {
              const permisoRol = rolSeleccionado.permisos?.find(p => p.permiso_id === permiso.id);
              const tieneAcceso = permisoRol?.tiene_acceso || false;
              
              return (
                <div key={permiso.id} className="permiso-item">
                  <div>
                    <div style={{ fontWeight: "600", color: "#333", marginBottom: "3px" }}>
                      {permiso.icono} {permiso.id === 8 ? tx('Seguimiento de Leyes', 'Laws Tracking') : tv(permiso.nombre.replace(/_/g, ' '))}
                    </div>
                    <div style={{ fontSize: "12px", color: "#999" }}>
                      {permiso.descripcion || ''}
                    </div>
                  </div>

                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={tieneAcceso}
                      onChange={() => togglePermisoRol(permiso.id, tieneAcceso)}
                    />
                    <span className="slider"></span>
                  </label>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB PERMISOS USUARIO */}
        {tabActive === "permisos_usuario" && usuarioPermisos && (
          <div className="card">
            <div style={{ marginBottom: "25px" }}>
              <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "700" }}>
                🔑 {t('cf_permisosPersonalizadosDe')} {usuarioPermisos.nombre}
              </h2>
              <p style={{ color: "#666", fontSize: "13px", margin: "5px 0 0" }}>
                {t('cf_rolBase')}: <strong>{tv(obtenerNombreRol(usuarioPermisos.rol_id || usuarioPermisos.rol))}</strong>
              </p>
              <p style={{ color: "#999", fontSize: "12px", margin: "5px 0 0", fontStyle: "italic" }}>
                {t('cf_permisosSumanExplicacion')}
              </p>
            </div>
            
            {MODULOS_SISTEMA.map(permiso => {
              const permisoPersonalizado = tienePermisoPersonalizado(permiso.id);
              const permisoRolActive = tienePermisoRol(permiso.id);
              const tieneAcceso = permisoPersonalizado ? permisoPersonalizado.tiene_acceso : !!permisoRolActive;
              
              return (
                <div key={permiso.id} className="permiso-item">
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: "600", color: "#333", marginBottom: "3px" }}>
                      {permiso.icono} {permiso.id === 8 ? tx('Seguimiento de Leyes', 'Laws Tracking') : tv(permiso.nombre.replace(/_/g, ' '))}
                      {permisoRolActive && <span className="permiso-badge badge-rol">{t('cf_badgeRol')}</span>}
                      {permisoPersonalizado && <span className="permiso-badge badge-personalizado">{t('cf_badgePersonalizado')}</span>}
                      {permisoPersonalizado && (
                        <button
                          onClick={() => quitarPersonalizacion(permiso.id)}
                          style={{ marginLeft: "8px", background: "none", border: "none", color: "#8a97b0", fontSize: "11px", textDecoration: "underline", cursor: "pointer" }}
                        >
                          {tx('Quitar personalización', 'Remove customization')}
                        </button>
                      )}
                    </div>
                    <div style={{ fontSize: "12px", color: "#999" }}>
                      {permiso.descripcion || ''}
                    </div>
                  </div>
                  
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={tieneAcceso}
                      onChange={() => togglePermisoUsuario(permiso.id, tieneAcceso)}
                    />
                    <span className="slider"></span>
                  </label>
                </div>
              );
            })}
          </div>
        )}
        
        {/* MODAL NUEVO/EDITAR USUARIO */}
        {mostrandoModal && (
          <div className="modal-overlay" onClick={() => setMostrandoModal(false)} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3 style={{ margin: "0 0 20px", fontSize: "20px", fontWeight: "700" }}>
                {tipoModal === "nuevo_usuario" ? `➕ ${t('nuevoUsuario')}` : `✏️ ${t('cf_editarUsuarioTitulo')}`}
              </h3>
              
              {tipoModal === "nuevo_usuario" && (
                <input
                  type="text"
                  className="input"
                  placeholder="User ID (e.g. LP01)"
                  value={nuevoUsuario.id}
                  onChange={(e) => setNuevoUsuario({...nuevoUsuario, id: e.target.value.toUpperCase()})}
                  style={{ marginBottom: 12 }}
                />
              )}
              <input
                type="text"
                className="input"
                placeholder={t('cf_nombreCompleto')}
                value={nuevoUsuario.nombre}
                onChange={(e) => setNuevoUsuario({...nuevoUsuario, nombre: e.target.value})}
              />

              <input
                type="email"
                className="input"
                placeholder={t('cf_email')}
                value={nuevoUsuario.email}
                onChange={(e) => setNuevoUsuario({...nuevoUsuario, email: e.target.value})}
              />

              <input
                type="password"
                className="input"
                placeholder={tipoModal === "nuevo_usuario" ? t('contrasena') : t('cf_nuevaContrasenaOpcional')}
                value={nuevoUsuario.password}
                onChange={(e) => setNuevoUsuario({...nuevoUsuario, password: e.target.value})}
              />

              <select
                className="input"
                value={nuevoUsuario.rol_id}
                onChange={(e) => setNuevoUsuario({...nuevoUsuario, rol_id: parseInt(e.target.value)})}
              >
                <option value="">{t('cf_seleccionaRol')}</option>
                {roles.map(rol => (
                  <option key={rol.id} value={rol.id}>{tv(rol.nombre)}</option>
                ))}
              </select>

              <select
                className="input"
                value={nuevoUsuario.pais_id}
                onChange={(e) => setNuevoUsuario({...nuevoUsuario, pais_id: parseInt(e.target.value)})}
              >
                <option value="">{t('cf_seleccionaPais')}</option>
                {paises.map(pais => (
                  <option key={pais.id} value={pais.id}>{pais.nombre}</option>
                ))}
              </select>
              
              <label style={{ display: "flex", alignItems: "center", gap: "8px", margin: "4px 0 12px", fontSize: "14px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={!!nuevoUsuario.activo}
                  onChange={(e) => setNuevoUsuario({...nuevoUsuario, activo: e.target.checked})}
                />
                Active user
              </label>
              
              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={guardarUsuario} className="btn btn-success" style={{ flex: 1, justifyContent: "center" }}>
                  <FaSave /> {t('guardar')}
                </button>
                <button onClick={() => setMostrandoModal(false)} className="btn btn-outline" style={{ flex: 1, justifyContent: "center" }}>
                  <FaTimes /> {t('cancelar')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
