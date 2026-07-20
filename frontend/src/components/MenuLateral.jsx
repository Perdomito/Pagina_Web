import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaTimes, 
  FaUsers, 
  FaBook, 
  FaChartBar, 
  FaAddressBook, 
  FaMoneyBillWave, 
  FaCog, 
  FaChartLine, 
  FaHammer
} from 'react-icons/fa';
import colors from '../utils/colors';

export default function MenuLateral({ isOpen, onClose, permisos = [] }) {
  const navigate = useNavigate();

  const modulos = [
    { 
      titulo: "Members",
      desc: "Records, follow-up & visits.",
      ruta: "/miembros",
      icon: <FaUsers size={20} />,
      permiso: "miembros"
    },
    { 
      titulo: "Bible Studies",
      desc: "Weekly control & tracking.",
      ruta: "/estudios-biblicos",
      icon: <FaBook size={20} />,
      permiso: "estudios_biblicos"
    },
    { 
      titulo: "Reports",
      desc: "Results & goals achieved.",
      ruta: "/reportes",
      icon: <FaChartBar size={20} />,
      permiso: "reportes"
    },
    { 
      titulo: "Contacts",
      desc: "New & follow-up contacts.",
      ruta: "/contactos",
      icon: <FaAddressBook size={20} />,
      permiso: "contactos"
    },
    { 
      titulo: "Administration",
      desc: "Budget & financial control.",
      ruta: "/administracion",
      icon: <FaMoneyBillWave size={20} />,
      permiso: "administracion"
    },
    { 
      titulo: "Statistics",
      desc: "Charts & reports by country.",
      ruta: "/estadisticas",
      icon: <FaChartLine size={20} />,
      permiso: "reportes"
    },
    { 
      titulo: "Studies",
      desc: "🚧 Under construction - Coming soon",
      ruta: null,
      icon: <FaHammer size={20} />,
      permiso: "estudios_biblicos",
      enConstruccion: true
    },
    { 
      titulo: "Settings",
      desc: "Users, roles & permissions.",
      ruta: "/configuracion",
      icon: <FaCog size={20} />,
      permiso: "configuracion"
    }
  ];

  const modulosPermitidos = modulos.filter(mod => permisos.includes(mod.permiso));

  const handleNavigation = (modulo) => {
    if (modulo.enConstruccion) {
      return;
    }
    navigate(modulo.ruta);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: 999,
          animation: 'fadeIn 0.3s ease'
        }}
        onClick={onClose}
      />

      {/* Menú lateral */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: '320px',
          background: colors.background,
          boxShadow: '4px 0 20px rgba(0,0,0,0.1)',
          zIndex: 1000,
          animation: 'slideInLeft 0.3s ease',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <style>
          {`
            @keyframes slideInLeft {
              from { transform: translateX(-100%); }
              to { transform: translateX(0); }
            }
            
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
          `}
        </style>

        {/* Header del menú */}
        <div
          style={{
            background: colors.primary,
            color: 'white',
            padding: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>
            Menú
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '8px',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'white',
              transition: 'all 0.3s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
            }}
          >
            <FaTimes size={18} />
          </button>
        </div>

        {/* Lista de módulos */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '10px'
          }}
        >
          {modulosPermitidos.map((modulo, index) => (
            <div
              key={index}
              onClick={() => handleNavigation(modulo)}
              style={{
                padding: '15px',
                margin: '5px 0',
                borderRadius: '10px',
                cursor: modulo.enConstruccion ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s',
                background: modulo.enConstruccion ? '#f5f5f5' : 'transparent',
                opacity: modulo.enConstruccion ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '15px'
              }}
              onMouseOver={(e) => {
                if (!modulo.enConstruccion) {
                  e.currentTarget.style.background = colors.backgroundGray;
                }
              }}
              onMouseOut={(e) => {
                if (!modulo.enConstruccion) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: `${colors.primary}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: colors.primary
                }}
              >
                {modulo.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ 
                  fontSize: '15px', 
                  fontWeight: '600', 
                  color: colors.textPrimary,
                  marginBottom: '3px'
                }}>
                  {modulo.titulo}
                </div>
                <div style={{ 
                  fontSize: '12px', 
                  color: colors.textSecondary,
                  lineHeight: '1.3'
                }}>
                  {modulo.desc}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer del menú */}
        <div
          style={{
            padding: '15px 20px',
            borderTop: `1px solid ${colors.border}`,
            fontSize: '12px',
            color: colors.textLight,
            textAlign: 'center'
          }}
        >
          © {new Date().getFullYear()} Emanuel Church
        </div>
      </div>
    </>
  );
}
