import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  FaUsers,
  FaBook,
  FaChartBar,
  FaAddressBook,
  FaMoneyBillWave,
  FaSignOutAlt,
  FaUser,
  FaCog,
  FaChartLine,
  FaHammer,
  //FaBook, 
  FaBars,
  FaBell
} from "react-icons/fa";
import toast from 'react-hot-toast';
import axios from '../api/axios';
import colors from '../utils/colors';
import MenuLateral from '../components/MenuLateral';
import SelectorIdioma from '../components/SelectorIdioma';
import { useIdioma } from '../context/IdiomaContext';

export default function Home() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t, idioma } = useIdioma();
  const [permisosUsuario, setPermisosUsuario] = useState([]);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [notificaciones, setNotificaciones] = useState([]);
  const [mostrarNotif, setMostrarNotif] = useState(false);

  useEffect(() => {
    cargarPermisos();
    if (user?.rol_id === 2) {
      cargarNotificaciones();
    }
  }, []);

  const cargarNotificaciones = async () => {
    try {
      const response = await axios.get('/notificaciones');
      setNotificaciones(response.data || []);
    } catch (error) {
      // Backend pendiente — mock temporal
      setNotificaciones([
        { id: 1, mensaje: 'New member registered: Luis Perdomo', fecha: new Date().toISOString(), leida: false },
        { id: 2, mensaje: 'Member changed mission city: Ana García → Santo Domingo', fecha: new Date().toISOString(), leida: false },
      ]);
    }
  };

  const marcarLeida = async (id) => {
    try {
        await axios.patch('/notificaciones/' + id + '/leer');
    } catch (e) {}
    setNotificaciones(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n));
  };

  const marcarTodasLeidas = () => {
    notificaciones.forEach(n => marcarLeida(n.id));
  };

  const cargarPermisos = async () => {
    try {
      const response = await axios.get('/auth/mis-permisos');
      const permisosActivos = (response.data.permisos || [])
        .filter(p => p.activo)
        .map(p => p.nombre);
      setPermisosUsuario(permisosActivos);
    } catch (error) {
      console.error('Error loading permissions:', error);
      setPermisosUsuario(['estudios_biblicos', 'reportes', 'administracion', 'miembros', 'contactos', 'configuracion']);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success(t('sesionCerrada'));
    navigate("/");
  };

  const getRolLabel = (rol_id) => {
    if (rol_id === 1) return t('administrador');
    if (rol_id === 2) return t('pastor');
    return t('misionero');
  };

  const modulosConPermisos = [
    {
      titulo: t('miembros'),
      desc: t('miembrosDesc'),
      ruta: "/miembros",
      icon: <FaUsers size={32} />,
      color: "#dae93d",
      permiso: "miembros",
      animacion: "bounce"
    },
    {
      titulo: t('estudiosBiblicos'),
      desc: t('estudiosBiblicosDesc'),
      ruta: "/estudios-biblicos",
      icon: <FaBook size={32} />,
      color: "#f67195",
      permiso: "estudios_biblicos",
      animacion: "flip"
    },
    {
      titulo: t('reportes'),
      desc: t('reportesDesc'),
      ruta: "/reportes",
      icon: <FaChartBar size={32} />,
      color: colors.success,
      permiso: "reportes",
      animacion: "pulse"
    },
    {
      titulo: t('contactos'),
      desc: t('contactosDesc'),
      ruta: "/contactos",
      icon: <FaAddressBook size={32} />,
      color: "#7ee2f3",
      permiso: "contactos",
      animacion: "shake"
    },
    {
      titulo: t('administracion'),
      desc: t('administracionDesc'),
      ruta: "/administracion",
      icon: <FaMoneyBillWave size={32} />,
      color: colors.danger,
      permiso: "administracion",
      animacion: "spin-slow"
    },
    {
      titulo: t('estadisticas'),
      desc: t('estadisticasDesc'),
      ruta: "/estadisticas",
      icon: <FaChartLine size={32} />,
      color: "#673AB7",
      permiso: "reportes",
      animacion: "pulse"
    },
    {
      titulo: t('configuracion'),
      desc: t('configuracionDesc'),
      ruta: "/configuracion",
      icon: <FaCog size={32} />,
      color: "#607D8B",
      permiso: "configuracion",
      animacion: "spin"
    }
  ];

  const tarjetasPermitidas = modulosConPermisos.filter(tarjeta => {
    if (!permisosUsuario.includes(tarjeta.permiso)) return false;
    // Administración solo para admin (1) o tesorero (4)
    if (tarjeta.permiso === 'administracion' && user?.rol_id !== 1 && user?.rol_id !== 4) return false;
    // Configuración solo para admin (1) o pastor (2)
    if (tarjeta.permiso === 'configuracion' && user?.rol_id !== 1 && user?.rol_id !== 2) return false;
    return true;
  });


  // Devuelve el código ISO del país para usar con flagcdn.com
  const getCodigoPais = (paisNombre) => {
    if (!paisNombre) return null;
    const n = paisNombre.toLowerCase();
    if (n.includes('colombia')) return 'co';
    if (n.includes('dominicana') || n.includes('dominican')) return 'do';
    if (n.includes('méxico') || n.includes('mexico')) return 'mx';
    if (n.includes('argentina')) return 'ar';
    if (n.includes('chile')) return 'cl';
    if (n.includes('perú') || n.includes('peru')) return 'pe';
    if (n.includes('ecuador')) return 'ec';
    if (n.includes('bolivia')) return 'bo';
    if (n.includes('venezuela')) return 've';
    if (n.includes('paraguay')) return 'py';
    if (n.includes('uruguay')) return 'uy';
    if (n.includes('guatemala')) return 'gt';
    if (n.includes('honduras')) return 'hn';
    if (n.includes('costa rica')) return 'cr';
    if (n.includes('panamá') || n.includes('panama')) return 'pa';
    if (n.includes('cuba')) return 'cu';
    if (n.includes('haití') || n.includes('haiti')) return 'ht';
    if (n.includes('nicaragua')) return 'ni';
    if (n.includes('salvador')) return 'sv';
    if (n.includes('brasil') || n.includes('brazil')) return 'br';
    if (n.includes('italia') || n.includes('italy')) return 'it';
    if (n.includes('españa') || n.includes('spain')) return 'es';
    return null;
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryLight})`,
      padding: "20px",
      fontFamily: "'Lato', sans-serif"
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Lato:wght@300;400;700&display=swap');

        body { font-family: 'Lato', sans-serif; }

        /* ── Animaciones ── */
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin      { to { transform: rotate(360deg); } }
        @keyframes spin-slow { to { transform: rotate(360deg); } }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50%      { transform: scale(1.1); }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-10px); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25%      { transform: translateX(-5px); }
          75%      { transform: translateX(5px); }
        }
        @keyframes flip {
          0%   { transform: rotateY(0deg); }
          50%  { transform: rotateY(180deg); }
          100% { transform: rotateY(360deg); }
        }

        .icon-spin      { animation: spin 2s linear infinite; }
        .icon-spin-slow { animation: spin-slow 3s linear infinite; }
        .icon-pulse     { animation: pulse 2s ease-in-out infinite; }
        .icon-bounce    { animation: bounce 2s ease-in-out infinite; }
        .icon-shake     { animation: shake 1.5s ease-in-out infinite; }
        .icon-flip      { animation: flip 3s ease-in-out infinite; }

        /* ── Tarjetas ── */
        .card-hover {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .card-hover:hover {
          transform: translateY(-8px);
          box-shadow: 0 16px 36px rgba(0,0,0,0.18) !important;
        }
        .card-hover:hover .icon-container {
          transform: scale(1.1);
        }

        /* ── Header título ── */
        .home-title {
          font-family: 'Cinzel', serif;
          font-size: 30px;
          font-weight: 700;
          color: white;
          margin: 0;
          letter-spacing: 1px;
          text-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }
        .home-subtitle {
          font-family: 'Lato', sans-serif;
          font-size: 12px;
          font-weight: 300;
          color: rgba(255,255,255,0.8);
          letter-spacing: 2.5px;
          text-transform: capitalize;
          margin: 4px 0 0;
        }
          
        .card-title {
          font-family: 'Lato', serif;
          font-size: 18px;
          font-weight: 600;
          margin: 0 0 8px;
          color: #1a2d5a;
          letter-spacing: 0.5px;
        }
   .card-desc {
  font-family: 'Lato', sans-serif;
  font-size: 13px;
  color: #7a8aaa;
  margin: 0;
  line-height: 1.5;
  text-transform: none;
}

        .header-logo {
          width: 44px;
          height: 44px;
          object-fit: contain;
          object-position: left center;
          filter: brightness(0) invert(1);
          opacity: 0.9;
        }

        .footer-ps {
          margin-top: 48px;
          text-align: center;
          font-family: 'Lato', sans-serif;
          font-size: 11px;
          color: rgba(255,255,255,0.35);
          letter-spacing: 0.5px;
          transition: color 0.3s;
          user-select: none;
        }
        .footer-ps:hover { color: rgba(255, 255, 255, 0.65); }
      `}</style>

      {/* Menú Lateral */}
      <MenuLateral
        isOpen={menuAbierto}
        onClose={() => setMenuAbierto(false)}
        permisos={permisosUsuario}
      />

      {/* ── HEADER ── */}
      <div style={{
        maxWidth: "1200px",
        margin: "0 auto 32px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        animation: "fadeIn 0.6s ease"
      }}>
        {/* Izquierda: hamburguesa + logo + título */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            onClick={() => setMenuAbierto(true)}
            style={{
              background: "rgba(255,255,255,0.15)",
              backdropFilter: "blur(10px)",
              border: "none",
              borderRadius: "12px",
              width: "48px",
              height: "48px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              cursor: "pointer",
              transition: "all 0.3s"
            }}
            onMouseOver={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.25)"}
            onMouseOut={(e)  => e.currentTarget.style.background = "rgba(255,255,255,0.15)"}
          >
            <FaBars size={20} />
          </button>

          <img
            src="/Logo_RD-removebg-preview.png"
            alt="Emanuel Church"
            className="header-logo"
            onError={(e) => { e.target.style.display = 'none'; }}
          />

          <div>
            <h1 className="home-title">Emanuel Church</h1>
            <p className="home-subtitle">{t('panelControl')}</p>
          </div>
        </div>

        {/* Derecha: idioma + usuario + sign out */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {true && (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setMostrarNotif(!mostrarNotif)}
                style={{
                  background: "rgba(255,255,255,0.15)",
                  backdropFilter: "blur(10px)",
                  border: "none",
                  borderRadius: "12px",
                  width: "48px",
                  height: "48px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  cursor: "pointer",
                  position: "relative"
                }}
              >
                <FaBell size={18} />
                {notificaciones.filter(n => !n.leida).length > 0 && (
                  <span style={{
                    position: "absolute",
                    top: "8px",
                    right: "8px",
                    background: "#E24B4A",
                    color: "white",
                    borderRadius: "50%",
                    width: "16px",
                    height: "16px",
                    fontSize: "10px",
                    fontWeight: "700",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}>
                    {notificaciones.filter(n => !n.leida).length}
                  </span>
                )}
              </button>

              {mostrarNotif && (
                <div style={{
                  position: "absolute",
                  top: "56px",
                  right: 0,
                  width: "320px",
                  background: "white",
                  borderRadius: "14px",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
                  zIndex: 1000,
                  overflow: "hidden"
                }}>
                  <div style={{
                    padding: "14px 18px",
                    borderBottom: "1px solid #eee",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}>
                    <span style={{ fontWeight: "700", fontSize: "14px", color: "#1a5490" }}>{t('notificaciones')}</span>
                    {notificaciones.filter(n => !n.leida).length > 0 && (
                      <button onClick={marcarTodasLeidas} style={{ background: "none", border: "none", color: "#1a5490", fontSize: "12px", cursor: "pointer", fontWeight: "600" }}>
                        {t('marcarTodasLeidas')}
                      </button>
                    )}
                  </div>
                  {notificaciones.length === 0 ? (
                    <div style={{ padding: "24px", textAlign: "center", color: "#999", fontSize: "13px" }}>
                      {t('sinNotificaciones')}
                    </div>
                  ) : (
                    notificaciones.map(n => (
                      <div
                        key={n.id}
                        onClick={() => marcarLeida(n.id)}
                        style={{
                          padding: "12px 18px",
                          borderBottom: "1px solid #f5f5f5",
                          background: n.leida ? "white" : "#f0f6ff",
                          cursor: "pointer",
                          display: "flex",
                          gap: "10px",
                          alignItems: "flex-start"
                        }}
                      >
                        <div style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          background: n.leida ? "#ccc" : "#1a5490",
                          marginTop: "5px",
                          flexShrink: 0
                        }} />
                        <div>
                          <div style={{ fontSize: "13px", color: "#333", lineHeight: "1.4" }}>{n.mensaje}</div>
                          <div style={{ fontSize: "11px", color: "#999", marginTop: "3px" }}>
                            {new Date(n.fecha).toLocaleDateString(idioma === 'es' ? 'es-ES' : 'en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
          <SelectorIdioma />

          <div style={{
            background: "rgba(255,255,255,0.15)",
            backdropFilter: "blur(10px)",
            padding: "10px 18px",
            borderRadius: "12px",
            color: "white",
            display: "flex",
            alignItems: "center",
            gap: "10px"
          }}>
            <div style={{ width:34, height:34, borderRadius:"50%", background:"rgba(255,255,255,0.2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, overflow:"hidden" }}>
              {getCodigoPais(user?.pais_nombre) ? (
                <img
                  src={`https://flagcdn.com/w80/${getCodigoPais(user?.pais_nombre)}.png`}
                  alt={user?.pais_nombre}
                  title={user?.pais_nombre}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              ) : (
                <FaUser size={14} />
              )}
            </div>
            <div>
              <div style={{ fontSize: "14px", fontWeight: "700", fontFamily: "'Lato', sans-serif", lineHeight:1.2 }}>
                {user?.nombre?.split(' ')[0]}
              </div>
              <div style={{ fontSize: "11px", opacity: 0.7, letterSpacing: "0.3px" }}>
                {getRolLabel(user?.rol_id)}
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            style={{
              background: "rgba(255,255,255,0.15)",
              backdropFilter: "blur(10px)",
              border: "none",
              borderRadius: "12px",
              padding: "10px 20px",
              color: "white",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "13px",
              fontWeight: "700",
              fontFamily: "'Lato', sans-serif",
              letterSpacing: "0.5px",
              transition: "all 0.3s"
            }}
            onMouseOver={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.25)"}
            onMouseOut={(e)  => e.currentTarget.style.background = "rgba(255,255,255,0.15)"}
          >
            <FaSignOutAlt />
            {t('cerrarSesion')}
          </button>
        </div>
      </div>

      {/* ── TARJETAS ── */}
      <div style={{
        maxWidth: "1200px",
        margin: "0 auto",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: "24px"
      }}>
        {tarjetasPermitidas.map((card, i) => (
          <div
            key={i}
            className="card-hover"
            style={{
              background: "white",
              padding: "30px",
              borderRadius: "18px",
              boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
              animation: `slideUp ${0.4 + i * 0.08}s ease`,
              cursor: "pointer",
              position: "relative",
              overflow: "hidden"
            }}
            onClick={() => navigate(card.ruta)}
          >
            {/* Barra de color superior */}
            <div style={{
              position: "absolute",
              top: 0, left: 0, right: 0,
              height: "4px",
              background: card.color,
              borderRadius: "18px 18px 0 0"
            }} />

            {/* Icono */}
            <div
              className="icon-container"
              style={{
                width: "62px",
                height: "62px",
                borderRadius: "14px",
                background: `${card.color}18`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: card.color,
                marginBottom: "20px",
                transition: "transform 0.3s"
              }}
            >
              <div className={`icon-${card.animacion}`}>
                {card.icon}
              </div>
            </div>

            <h2 className="card-title">{card.titulo}</h2>
            <p className="card-desc">{card.desc}</p>

            {/* Flecha */}
            <div style={{
              position: "absolute",
              bottom: "20px",
              right: "20px",
              width: "30px",
              height: "30px",
              borderRadius: "50%",
              background: `${card.color}18`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: card.color,
              fontSize: "16px",
              fontWeight: "bold"
            }}>
              →
            </div>
          </div>
        ))}
      </div>

      {/* ── FOOTER ── */}
      <p className="footer-ps">© {new Date().getFullYear()} Emanuel Church · OA Mundial</p>
    </div>
  );
}
