import React, { useState } from 'react';
import { FaGlobe } from 'react-icons/fa';
import toast from 'react-hot-toast';
import colors from '../utils/colors';
import { useIdioma } from '../context/IdiomaContext';

export default function SelectorIdioma() {
  const { idioma, setIdioma, t } = useIdioma();
  const [mostrandoMenu, setMostrandoMenu] = useState(false);

  const idiomas = [
    { codigo: 'es', nombre: 'Español', bandera: '🇪🇸' },
    { codigo: 'en', nombre: 'English', bandera: '🇬🇧' }
  ];

  const idiomaSeleccionado = idiomas.find(i => i.codigo === idioma) || idiomas[0];

  const cambiarIdioma = (nuevoIdioma) => {
    setIdioma(nuevoIdioma);
    setMostrandoMenu(false);
    toast.success(nuevoIdioma === 'es' ? '🇪🇸 Español' : '🇬🇧 English');
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setMostrandoMenu(!mostrandoMenu)}
        title={t('idioma')}
        style={{
          background: "rgba(255,255,255,0.15)",
          backdropFilter: "blur(10px)",
          border: "none",
          borderRadius: "12px",
          padding: "12px 16px",
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
        <FaGlobe />
        {idiomaSeleccionado.bandera} {idiomaSeleccionado.codigo.toUpperCase()}
      </button>

      {mostrandoMenu && (
        <>
          {/* Overlay para cerrar al hacer click fuera */}
          <div
            onClick={() => setMostrandoMenu(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 9
            }}
          />

          {/* Dropdown */}
          <div
            style={{
              position: 'absolute',
              top: '60px',
              right: 0,
              background: 'white',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              overflow: 'hidden',
              zIndex: 10,
              minWidth: '180px'
            }}
          >
            {idiomas.map((opcion) => (
              <button
                key={opcion.codigo}
                onClick={() => cambiarIdioma(opcion.codigo)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: 'none',
                  background: idioma === opcion.codigo ? colors.backgroundGray : 'white',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: colors.textPrimary,
                  transition: 'all 0.3s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
                onMouseOver={(e) => {
                  if (idioma !== opcion.codigo) {
                    e.currentTarget.style.background = colors.backgroundGray;
                  }
                }}
                onMouseOut={(e) => {
                  if (idioma !== opcion.codigo) {
                    e.currentTarget.style.background = 'white';
                  }
                }}
              >
                <span style={{ fontSize: '20px' }}>{opcion.bandera}</span>
                {opcion.nombre}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
