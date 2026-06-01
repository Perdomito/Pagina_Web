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
  FaBars
} from "react-icons/fa";
import toast from 'react-hot-toast';
import axios from '../api/axios';
import colors from '../utils/colors';
import MenuLateral from '../components/MenuLateral';
import SelectorIdiomaGoogle from '../components/SelectorIdiomaGoogle';

export default function Home() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [permisosUsuario, setPermisosUsuario] = useState([]);
  const [menuAbierto, setMenuAbierto] = useState(false);

  useEffect(() => {
    cargarPermisos();
  }, []);

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
    toast.success('Session closed');
    navigate("/");
  };

  const getRolLabel = (rol_id) => {
    if (rol_id === 1) return 'Administrator';
    if (rol_id === 2) return 'Pastor';
    return 'Missionary';
  };

  const modulosConPermisos = [
    {
      titulo: "Members",
      desc: "Records, follow-up & visits.",
      ruta: "/miembros",
      icon: <FaUsers size={32} />,
      color: "#dae93d",
      permiso: "miembros",
      animacion: "bounce"
    },
    {
      titulo: "Bible Studies",
      desc: "Weekly control & tracking.",
      ruta: "/estudios-biblicos",
      icon: <FaBook size={32} />,
      color: "#f67195",
      permiso: "estudios_biblicos",
      animacion: "flip"
    },
    {
      titulo: "Reports",
      desc: "Results & goals achieved.",
      ruta: "/reportes",
      icon: <FaChartBar size={32} />,
      color: colors.success,
      permiso: "reportes",
      animacion: "pulse"
    },
    {
      titulo: "Contacts",
      desc: "New & follow-up.",
      ruta: "/contactos",
      icon: <FaAddressBook size={32} />,
      color: "#7ee2f3",
      permiso: "contactos",
      animacion: "shake"
    },
    {
      titulo: "Administration",
      desc: "Budget & financial control.",
      ruta: "/administracion",
      icon: <FaMoneyBillWave size={32} />,
      color: colors.danger,
      permiso: "administracion",
      animacion: "spin-slow"
    },
    {
      titulo: "Statistics",
      desc: "Charts & reports by country.",
      ruta: "/estadisticas",
      icon: <FaChartLine size={32} />,
      color: "#673AB7",
      permiso: "reportes",
      animacion: "pulse"
    },
    {
      titulo: "Settings",
      desc: "Users, roles & permissions.",
      ruta: "/configuracion",
      icon: <FaCog size={32} />,
      color: "#607D8B",
      permiso: "configuracion",
      animacion: "spin"
    }
  ];

  const tarjetasPermitidas = modulosConPermisos.filter(tarjeta =>
    permisosUsuario.includes(tarjeta.permiso)
  );

  return (
    <div style={{
      minHeight: "100vh",
      background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryLight})`,
      padding: "20px",
      fontFamily: "'Lato', sans-serif"
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Lato:wght@300;400;700&display=swap');

        /* ── Google Translate oculto ── */
        .goog-te-banner-frame { display: none !important; }
        body { top: 0 !important; font-family: 'Lato', sans-serif; }
        .skiptranslate { display: none !important; }
        .goog-te-gadget { display: none !important; }

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
            <p className="home-subtitle">Control Panel</p>
          </div>
        </div>

        {/* Derecha: idioma + usuario + sign out */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <SelectorIdiomaGoogle />

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
            <FaUser size={14} />
            <div>
              <div style={{ fontSize: "14px", fontWeight: "700", fontFamily: "'Lato', sans-serif" }}>
                {user?.nombre}
              </div>
              <div style={{ fontSize: "11px", opacity: 0.75, letterSpacing: "0.5px" }}>
                {getRolLabel(user?.rol_id)}
                {user?.pais && ` · ${user.pais}`}
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
            Sign Out
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
