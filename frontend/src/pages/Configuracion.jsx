import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaPlus, FaEdit, FaTrash, FaSave, FaTimes, FaUser, FaLock, FaShieldAlt, FaUserShield } from "react-icons/fa";
import toast from 'react-hot-toast';
import configuracionService from '../services/ConfiguracionService';
import { useAuth } from '../context/AuthContext';

export default function Configuracion() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [tabActivo, setTabActivo] = useState("usuarios");
  const [cargando, setCargando] = useState(false);
  
  // Estados de datos
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permisos, setPermisos] = useState([]);
  const [paises, setPaises] = useState([]);
  
  // Estados de modales
  const [mostrandoModal, setMostrandoModal] = useState(false);
  const [tipoModal, setTipoModal] = useState("");
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [rolSeleccionado, setRolSeleccionado] = useState(null);
  const [usuarioPermisos, setUsuarioPermisos] = useState(null);
  
  // Estados de formularios
  const [nuevoUsuario, setNuevoUsuario] = useState({
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
        configuracionService.getAllUsuarios(),
        configuracionService.getAllRoles(),
        configuracionService.getAllPermisos(),
        configuracionService.getAllPaises()
      ]);
      
      setUsuarios(usuariosData);
      setRoles(rolesData);
      setPermisos(permisosData);
      setPaises(paisesData);
      
    } catch (error) {
      console.error('Error al cargar datos:', error);
      toast.error('Error al cargar datos');
    } finally {
      setCargando(false);
    }
  };
  
  const abrirModalNuevoUsuario = () => {
    setTipoModal("nuevo_usuario");
    setUsuarioEditando(null);
    setNuevoUsuario({ nombre: "", email: "", password: "", rol_id: "", pais_id: "" });
    setMostrandoModal(true);
  };
  
  const abrirModalEditarUsuario = (usuario) => {
    setTipoModal("editar_usuario");
    setUsuarioEditando(usuario);
    setNuevoUsuario({
      nombre: usuario.nombre,
      email: usuario.email,
      password: "",
      rol_id: usuario.rol_id,
      pais_id: usuario.pais_id || ""
    });
    setMostrandoModal(true);
  };
  
  const guardarUsuario = async () => {
    if (!nuevoUsuario.nombre || !nuevoUsuario.email || !nuevoUsuario.rol_id) {
      toast.error("Complete todos los campos obligatorios");
      return;
    }
    
    if (tipoModal === "nuevo_usuario" && !nuevoUsuario.password) {
      toast.error("La contraseña es obligatoria");
      return;
    }
    
    try {
      if (tipoModal === "nuevo_usuario") {
        await configuracionService.crearUsuario(nuevoUsuario);
        toast.success("Usuario creado");
      } else {
        await configuracionService.actualizarUsuario(usuarioEditando.id, nuevoUsuario);
        toast.success("Usuario actualizado");
      }
      
      await cargarDatosIniciales();
      setMostrandoModal(false);
    } catch (error) {
      console.error('Error al guardar usuario:', error);
      toast.error("Error al guardar usuario");
    }
  };
  
  const eliminarUsuario = async (id) => {
    if (!window.confirm("¿Eliminar este usuario?")) return;
    
    try {
      await configuracionService.eliminarUsuario(id);
      toast.success("Usuario eliminado");
      await cargarDatosIniciales();
    } catch (error) {
      console.error('Error al eliminar:', error);
      toast.error("Error al eliminar usuario");
    }
  };
  
  const verPermisosRol = async (rol) => {
    try {
      const permisosRol = await configuracionService.getPermisosRol(rol.id);
      setRolSeleccionado({ ...rol, permisos: permisosRol });
      setUsuarioPermisos(null);
      setTabActivo("permisos_rol");
    } catch (error) {
      console.error('Error al cargar permisos:', error);
      toast.error("Error al cargar permisos");
    }
  };
  
  const verPermisosPersonalizados = async (usuario) => {
    try {
      const [permisosRol, permisosUsuario] = await Promise.all([
        configuracionService.getPermisosRol(usuario.rol_id),
        configuracionService.getPermisosUsuario(usuario.id)
      ]);
      
      setUsuarioPermisos({
        ...usuario,
        permisosRol,
        permisosPersonalizados: permisosUsuario
      });
      setRolSeleccionado(null);
      setTabActivo("permisos_usuario");
    } catch (error) {
      console.error('Error al cargar permisos:', error);
      toast.error("Error al cargar permisos del usuario");
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
      toast.error("Error al actualizar permiso");
    }
  };
  
  const togglePermisoUsuario = async (permisoId, tieneAccesoActual) => {
    try {
      await configuracionService.actualizarPermisoUsuario(usuarioPermisos.id, permisoId, !tieneAccesoActual);
      
      const permisosActualizados = await configuracionService.getPermisosUsuario(usuarioPermisos.id);
      setUsuarioPermisos({ ...usuarioPermisos, permisosPersonalizados: permisosActualizados });
      
      toast.success("Permiso actualizado");
    } catch (error) {
      console.error('Error al actualizar permiso:', error);
      toast.error("Error al actualizar permiso");
    }
  };
  
  const tienePermisoPersonalizado = (permisoId) => {
    return usuarioPermisos?.permisosPersonalizados?.find(p => p.permiso_id === permisoId);
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
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f7fa" }}>
        <div style={{ fontSize: "18px", color: "#666" }}>Cargando...</div>
      </div>
    );
  }
  
  return (
    <div style={{ minHeight: "100vh", background: "#f5f7fa", padding: "20px" }}>
      <style>{`
        .tab-button {
          padding: 15px 30px;
          border: none;
          background: transparent;
          color: #666;
          font-weight: 600;
          font-size: 15px;
          cursor: pointer;
          border-bottom: 3px solid transparent;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .tab-button:hover {
          color: #0E5A61;
        }
        
        .tab-button.active {
          color: #0E5A61;
          border-bottom-color: #0E5A61;
        }
        
        .card {
          background: white;
          border-radius: 12px;
          padding: 25px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
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
        
        .btn-primary {
          background: #0E5A61;
          color: white;
        }
        
        .btn-success {
          background: #4CAF50;
          color: white;
        }
        
        .btn-danger {
          background: #f44336;
          color: white;
        }
        
        .btn-warning {
          background: #FF9800;
          color: white;
        }
        
        .btn-info {
          background: #2196F3;
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
          border-color: #0E5A61;
        }
        
        .usuario-card {
          padding: 20px;
          border: 2px solid #f0f0f0;
          border-radius: 12px;
          margin-bottom: 15px;
          transition: all 0.3s;
        }
        
        .usuario-card:hover {
          border-color: #0E5A61;
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
          background-color: #4CAF50;
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
          color: #2196F3;
        }
        
        .badge-personalizado {
          background: #fff3e0;
          color: #FF9800;
        }
      `}</style>

      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Header */}
        <div className="card" style={{ marginBottom: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <button onClick={() => navigate("/home")} style={{ background: "none", border: "none", color: "#0E5A61", fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px", padding: 0 }}>
                <FaArrowLeft /> Volver
              </button>
              <h1 style={{ margin: 0, color: "#0E5A61", fontSize: "28px" }}>⚙️ Configuración</h1>
              <p style={{ color: "#666", margin: "5px 0 0", fontSize: "14px" }}>
                Gestión de usuarios, roles y permisos
              </p>
            </div>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="card" style={{ marginBottom: "20px", padding: "0" }}>
          <div style={{ display: "flex", borderBottom: "1px solid #f0f0f0", flexWrap: "wrap" }}>
            <button
              onClick={() => { setTabActivo("usuarios"); setRolSeleccionado(null); setUsuarioPermisos(null); }}
              className={`tab-button ${tabActivo === "usuarios" ? 'active' : ''}`}
            >
              <FaUser /> Usuarios
            </button>
            <button
              onClick={() => { setTabActivo("roles"); setRolSeleccionado(null); setUsuarioPermisos(null); }}
              className={`tab-button ${tabActivo === "roles" ? 'active' : ''}`}
            >
              <FaLock /> Roles
            </button>
            {rolSeleccionado && (
              <button
                onClick={() => setTabActivo("permisos_rol")}
                className={`tab-button ${tabActivo === "permisos_rol" ? 'active' : ''}`}
              >
                <FaShieldAlt /> Permisos del rol {rolSeleccionado.nombre}
              </button>
            )}
            {usuarioPermisos && (
              <button
                onClick={() => setTabActivo("permisos_usuario")}
                className={`tab-button ${tabActivo === "permisos_usuario" ? 'active' : ''}`}
              >
                <FaUserShield /> Permisos de {usuarioPermisos.nombre}
              </button>
            )}
          </div>
        </div>
        
        {/* TAB USUARIOS */}
        {tabActivo === "usuarios" && (
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" }}>
              <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "700" }}>👥 Usuarios del Sistema</h2>
              <button onClick={abrirModalNuevoUsuario} className="btn btn-success">
                <FaPlus /> Nuevo Usuario
              </button>
            </div>
            
            {usuarios.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px", color: "#999" }}>
                Sin usuarios registrados
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
                          {obtenerNombreRol(usuario.rol_id)}
                        </span>
                        {usuario.pais_id && (
                          <span style={{ padding: "4px 12px", background: "#4CAF50", color: "white", borderRadius: "12px", fontSize: "12px", fontWeight: "600" }}>
                            📍 {obtenerNombrePais(usuario.pais_id)}
                          </span>
                        )}
                        <span style={{ padding: "4px 12px", background: usuario.activo ? "#4CAF50" : "#f44336", color: "white", borderRadius: "12px", fontSize: "12px", fontWeight: "600" }}>
                          {usuario.activo ? "✓ Activo" : "✗ Inactivo"}
                        </span>
                      </div>
                    </div>
                    
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                      <button onClick={() => verPermisosPersonalizados(usuario)} className="btn btn-info" style={{ fontSize: "13px", padding: "8px 16px" }}>
                        <FaUserShield /> Permisos
                      </button>
                      <button onClick={() => abrirModalEditarUsuario(usuario)} className="btn btn-warning" style={{ fontSize: "13px", padding: "8px 16px" }}>
                        <FaEdit /> Editar
                      </button>
                      {usuario.id !== user?.id && (
                        <button onClick={() => eliminarUsuario(usuario.id)} className="btn btn-danger" style={{ fontSize: "13px", padding: "8px 16px" }}>
                          <FaTrash /> Eliminar
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
        {tabActivo === "roles" && (
          <div className="card">
            <h2 style={{ margin: "0 0 25px", fontSize: "20px", fontWeight: "700" }}>🔐 Roles del Sistema</h2>
            
            {roles.map(rol => (
              <div key={rol.id} style={{ padding: "20px", border: "2px solid #f0f0f0", borderRadius: "12px", marginBottom: "15px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: "18px", fontWeight: "700", marginBottom: "5px", color: "#333" }}>
                      {rol.nombre === 'admin' ? '👑' : rol.nombre === 'pastor' ? '🌍' : '👤'} {rol.nombre.charAt(0).toUpperCase() + rol.nombre.slice(1)}
                    </div>
                    <div style={{ fontSize: "14px", color: "#666" }}>
                      {rol.descripcion}
                    </div>
                  </div>
                  
                  <button onClick={() => verPermisosRol(rol)} className="btn btn-primary" style={{ fontSize: "13px", padding: "8px 16px" }}>
                    <FaShieldAlt /> Ver Permisos
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* TAB PERMISOS ROL */}
        {tabActivo === "permisos_rol" && rolSeleccionado && (
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "700" }}>
                  ✅ Permisos del rol {rolSeleccionado.nombre}
                </h2>
                <p style={{ color: "#666", fontSize: "13px", margin: "5px 0 0" }}>
                  Define a qué módulos tiene acceso este rol por defecto
                </p>
              </div>
            </div>
            
            {permisos.map(permiso => {
              const permisoRol = rolSeleccionado.permisos?.find(p => p.permiso_id === permiso.id);
              const tieneAcceso = permisoRol?.tiene_acceso || false;
              
              return (
                <div key={permiso.id} className="permiso-item">
                  <div>
                    <div style={{ fontWeight: "600", color: "#333", marginBottom: "3px" }}>
                      {permiso.nombre.split('_').map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1)).join(' ')}
                    </div>
                    <div style={{ fontSize: "12px", color: "#999" }}>
                      {permiso.descripcion}
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
        {tabActivo === "permisos_usuario" && usuarioPermisos && (
          <div className="card">
            <div style={{ marginBottom: "25px" }}>
              <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "700" }}>
                🔑 Permisos personalizados de {usuarioPermisos.nombre}
              </h2>
              <p style={{ color: "#666", fontSize: "13px", margin: "5px 0 0" }}>
                Rol base: <strong>{obtenerNombreRol(usuarioPermisos.rol_id)}</strong>
              </p>
              <p style={{ color: "#999", fontSize: "12px", margin: "5px 0 0", fontStyle: "italic" }}>
                Los permisos personalizados se SUMAN a los del rol. Los azules son del rol, los naranjas son personalizados.
              </p>
            </div>
            
            {permisos.map(permiso => {
              const permisoPersonalizado = tienePermisoPersonalizado(permiso.id);
              const permisoRolActivo = tienePermisoRol(permiso.id);
              const tieneAcceso = permisoPersonalizado ? permisoPersonalizado.tiene_acceso : !!permisoRolActivo;
              
              return (
                <div key={permiso.id} className="permiso-item">
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: "600", color: "#333", marginBottom: "3px" }}>
                      {permiso.nombre.split('_').map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1)).join(' ')}
                      {permisoRolActivo && <span className="permiso-badge badge-rol">Rol</span>}
                      {permisoPersonalizado && <span className="permiso-badge badge-personalizado">Personalizado</span>}
                    </div>
                    <div style={{ fontSize: "12px", color: "#999" }}>
                      {permiso.descripcion}
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
                {tipoModal === "nuevo_usuario" ? "➕ Nuevo Usuario" : "✏️ Editar Usuario"}
              </h3>
              
              <input
                type="text"
                className="input"
                placeholder="Nombre completo"
                value={nuevoUsuario.nombre}
                onChange={(e) => setNuevoUsuario({...nuevoUsuario, nombre: e.target.value})}
              />
              
              <input
                type="email"
                className="input"
                placeholder="Email"
                value={nuevoUsuario.email}
                onChange={(e) => setNuevoUsuario({...nuevoUsuario, email: e.target.value})}
              />
              
              <input
                type="password"
                className="input"
                placeholder={tipoModal === "nuevo_usuario" ? "Contraseña" : "Nueva contraseña (dejar vacío para no cambiar)"}
                value={nuevoUsuario.password}
                onChange={(e) => setNuevoUsuario({...nuevoUsuario, password: e.target.value})}
              />
              
              <select
                className="input"
                value={nuevoUsuario.rol_id}
                onChange={(e) => setNuevoUsuario({...nuevoUsuario, rol_id: parseInt(e.target.value)})}
              >
                <option value="">Selecciona un rol</option>
                {roles.map(rol => (
                  <option key={rol.id} value={rol.id}>{rol.nombre}</option>
                ))}
              </select>
              
              <select
                className="input"
                value={nuevoUsuario.pais_id}
                onChange={(e) => setNuevoUsuario({...nuevoUsuario, pais_id: parseInt(e.target.value)})}
              >
                <option value="">Selecciona un país (opcional)</option>
                {paises.map(pais => (
                  <option key={pais.id} value={pais.id}>{pais.nombre}</option>
                ))}
              </select>
              
              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={guardarUsuario} className="btn btn-success" style={{ flex: 1, justifyContent: "center" }}>
                  <FaSave /> Guardar
                </button>
                <button onClick={() => setMostrandoModal(false)} className="btn btn-danger" style={{ flex: 1, justifyContent: "center" }}>
                  <FaTimes /> Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
