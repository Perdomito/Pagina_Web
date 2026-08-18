import React, { useState, useEffect } from 'react';

export default function AvisoModoEscritorio() {
  const [esMovil, setEsMovil] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const revisar = () => setEsMovil(window.innerWidth < 768);
    revisar();
    window.addEventListener('resize', revisar);
    return () => window.removeEventListener('resize', revisar);
  }, []);

  useEffect(() => {
    if (esMovil) setVisible(true);
  }, [esMovil]);

  if (!esMovil || !visible) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 99999,
      background: 'rgba(15, 30, 55, 0.96)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '28px 24px',
      textAlign: 'center',
      fontFamily: "'Lato', sans-serif",
      color: 'white'
    }}>
      <div style={{ fontSize: '42px', marginBottom: '16px' }}>💻</div>
      <h2 style={{
        fontFamily: "'Cinzel', serif",
        fontSize: '20px',
        marginBottom: '14px',
        lineHeight: 1.3
      }}>
        Esta pantalla se ve mejor en modo Escritorio
      </h2>
      <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.6, maxWidth: '360px', marginBottom: '10px' }}>
        Antes de continuar, activa <strong>"Sitio de escritorio"</strong> desde el menú de tu navegador
        (⋮ arriba a la derecha → "Sitio de escritorio" o "Versión de escritorio"), y luego recarga la página.
      </p>
      <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '28px' }}>
        This screen looks better in Desktop mode. Enable "Desktop site" from your browser menu (⋮), then reload.
      </p>
      <button
        onClick={() => setVisible(false)}
        style={{
          background: 'transparent',
          border: '1.5px solid rgba(255,255,255,0.4)',
          color: 'white',
          borderRadius: '8px',
          padding: '10px 20px',
          fontSize: '13px',
          cursor: 'pointer',
          letterSpacing: '0.5px'
        }}
      >
        Entiendo, continuar de todos modos
      </button>
    </div>
  );
}
