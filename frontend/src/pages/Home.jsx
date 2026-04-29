import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  FaUsers, 
  FaBook,
  FaBookOpen, 
  FaChartBar, 
  FaAddressBook, 
  FaMoneyBillWave, 
  FaSignOutAlt, 
  FaUser, 
  FaCog,
  FaChartLine,
  FaHammer
} from "react-icons/fa";
import toast from 'react-hot-toast';
import axios from '../api/axios';

export default function Home() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [permisosUsuario, setPermisosUsuario] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarPermisos();
  }, []);

  const cargarPermisos = async () => {
    try {
      const response = await axios.get('/auth/mis-permisos');
      setPermisosUsuario(response.data.permisos);
    } catch (error) {
      console.error('Error al cargar permisos:', error);
      setPermisosUsuario(['estudios_biblicos', 'reportes', 'administracion', 'miembros', 'contactos', 'configuracion']);
    } finally {
      setCargando(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('Sesión cerrada');
    navigate("/");
  };

  const modulosConPermisos = [
    { 
      titulo: "Miembros", 
      desc: "Registros, seguimiento, visitas.", 
      ruta: "/miembros",
      icon: <FaUsers size={32} />,
      color: "#2196F3",
      permiso: "miembros",
      animacion: "bounce"
    },
    { 
      titulo: "Estudios Bíblicos", 
      desc: "Control semanal tipo Excel.", 
      ruta: "/estudios-biblicos",
      icon: <FaBook size={32} />,
      color: "#4CAF50",
      permiso: "estudios_biblicos",
      animacion: "flip"
    },
    { 
      titulo: "Reportes", 
      desc: "Resultados y metas cumplidas.", 
      ruta: "/reportes",
      icon: <FaChartBar size={32} />,
      color: "#4CAF50",
      permiso: "reportes",
      animacion: "pulse"
    },
    { 
      titulo: "Contactos", 
      desc: "Nuevos, pendientes y seguimiento.", 
      ruta: "/contactos",
      icon: <FaAddressBook size={32} />,
      color: "#9C27B0",
      permiso: "contactos",
      animacion: "shake"
    },
    { 
      titulo: "Administración", 
      desc: "Presupuesto, control financiero.", 
      ruta: "/administracion",
      icon: <FaMoneyBillWave size={32} />,
      color: "#F44336",
      permiso: "administracion",
      animacion: "spin-slow"
    },
    { 
      titulo: "Estadísticas", 
      desc: "Gráficos y reportes por país.", 
      ruta: "/estadisticas",
      icon: <FaChartLine size={32} />,
      color: "#673AB7",
      permiso: "reportes",
      animacion: "pulse"
    },
    { 
      titulo: "Estudios", 
      desc: "🚧 En construcción - Próximamente", 
      ruta: null,
      icon: <FaHammer size={32} />,
      color: "#FF9800",
      permiso: "estudios_biblicos",
      animacion: "shake",
      enConstruccion: true
    },
    { 
      titulo: "Configuración", 
      desc: "Usuarios, roles y permisos.", 
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

  if (cargando) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #0E5A61, #15777F)" }}>
        <div style={{ fontSize: "18px", color: "white" }}>Cargando...</div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0E5A61, #15777F)",
        padding: "20px"
      }}
    >
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
          }

          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }

          @keyframes spin-slow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }

          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
          }

          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }

          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
          }

          @keyframes flip {
            0% { transform: rotateY(0deg); }
            50% { transform: rotateY(180deg); }
            100% { transform: rotateY(360deg); }
          }

          .icon-spin {
            animation: spin 2s linear infinite;
          }

          .icon-spin-slow {
            animation: spin-slow 3s linear infinite;
          }

          .icon-pulse {
            animation: pulse 2s ease-in-out infinite;
          }

          .icon-bounce {
            animation: bounce 2s ease-in-out infinite;
          }

          .icon-shake {
            animation: shake 1.5s ease-in-out infinite;
          }

          .icon-flip {
            animation: flip 3s ease-in-out infinite;
          }

          .card-hover {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }

          .card-hover:hover {
            transform: translateY(-8px);
            box-shadow: 0 12px 24px rgba(0,0,0,0.15) !important;
          }

          .card-hover:hover .icon-container {
            transform: scale(1.1);
          }
          
          .card-construccion {
            opacity: 0.7;
            cursor: not-allowed;
          }
          
          .card-construccion:hover {
            transform: none;
          }
        `}
      </style>

      {/* Header con info de usuario */}
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto 30px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          animation: "fadeIn 0.6s ease"
        }}
      >
        <div style={{ color: "white" }}>
          <h1 style={{ margin: 0, fontSize: "32px", fontWeight: "700" }}>
            Iglesia Emanuel
          </h1>
          <p style={{ margin: "5px 0 0", opacity: 0.9, fontSize: "14px" }}>
            Panel de Control
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <div
            style={{
              background: "rgba(255,255,255,0.15)",
              backdropFilter: "blur(10px)",
              padding: "12px 20px",
              borderRadius: "12px",
              color: "white",
              display: "flex",
              alignItems: "center",
              gap: "10px"
            }}
          >
            <FaUser />
            <div>
              <div style={{ fontSize: "14px", fontWeight: "600" }}>{user?.nombre}</div>
              <div style={{ fontSize: "12px", opacity: 0.8 }}>
                {user?.rol_id === 1 ? 'Administrador' : 
                 user?.rol_id === 2 ? 'Pastor' : 'Misionero'} 
                {user?.pais && ` • ${user.pais}`}
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
              padding: "12px 20px",
              color: "white",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "14px",
              fontWeight: "600",
              transition: "all 0.3s"
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.25)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.15)";
            }}
          >
            <FaSignOutAlt />
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Tarjetas de módulos */}
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "25px"
        }}
      >
        {tarjetasPermitidas.map((card, i) => (
          <div
            key={i}
            className={`card-hover ${card.enConstruccion ? 'card-construccion' : ''}`}
            style={{
              background: "white",
              padding: "30px",
              borderRadius: "16px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              animation: `slideUp ${0.5 + i * 0.1}s ease`,
              cursor: card.enConstruccion ? "not-allowed" : "pointer",
              position: "relative",
              overflow: "hidden"
            }}
            onClick={() => {
              if (card.enConstruccion) {
                toast.info('🚧 Módulo en construcción');
              } else {
                navigate(card.ruta);
              }
            }}
          >
            {/* Acento de color */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "4px",
                background: card.color
              }}
            />

            {/* Icono con animación */}
            <div
              className="icon-container"
              style={{
                width: "60px",
                height: "60px",
                borderRadius: "12px",
                background: `${card.color}15`,
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

            {/* Contenido */}
            <h2
              style={{
                margin: "0 0 10px",
                fontSize: "22px",
                fontWeight: "700",
                color: "#1a1a1a"
              }}
            >
              {card.titulo}
            </h2>
            <p
              style={{
                margin: 0,
                color: "#666",
                fontSize: "14px",
                lineHeight: "1.5"
              }}
            >
              {card.desc}
            </p>

            {/* Flecha indicadora */}
            {!card.enConstruccion && (
              <div
                style={{
                  position: "absolute",
                  bottom: "20px",
                  right: "20px",
                  width: "30px",
                  height: "30px",
                  borderRadius: "50%",
                  background: `${card.color}15`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: card.color,
                  fontSize: "16px",
                  fontWeight: "bold"
                }}
              >
                →
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <p
        style={{
          marginTop: "50px",
          textAlign: "center",
          color: "rgba(255,255,255,0.7)",
          fontSize: "13px"
        }}
      >
        © {new Date().getFullYear()} Iglesia Emanuel • Sistema de Gestión
      </p>
    </div>
  );
}
