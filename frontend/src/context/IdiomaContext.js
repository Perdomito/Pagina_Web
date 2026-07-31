import React, { createContext, useContext, useEffect, useState } from 'react';
import translations from '../utils/translations';
import dbValueMap from '../utils/dbValues';

const IdiomaContext = createContext(null);

export function IdiomaProvider({ children }) {
  const [idioma, setIdioma] = useState(() => {
    const guardado = localStorage.getItem('idioma');
    return guardado === 'en' || guardado === 'es' ? guardado : 'es';
  });

  useEffect(() => {
    localStorage.setItem('idioma', idioma);
    document.documentElement.lang = idioma;
  }, [idioma]);

  // Devuelve la traducción de la clave; si falta, cae a español y por último a la clave
  const t = (clave) => translations[idioma]?.[clave] ?? translations.es[clave] ?? clave;

  // Traduce un VALOR de la BD solo para mostrarlo (roles, tipos, Caja/Banco...).
  // Si el valor no está en el mapa se muestra tal cual. Nunca usar el resultado
  // para enviarlo a la API: la BD siempre recibe el valor original.
  const tv = (valor) => {
    if (valor === null || valor === undefined || valor === '') return valor;
    const entrada = dbValueMap[String(valor).trim().toLowerCase()];
    return entrada ? entrada[idioma] : valor;
  };

  return (
    <IdiomaContext.Provider value={{ idioma, setIdioma, t, tv }}>
      {children}
    </IdiomaContext.Provider>
  );
}

export function useIdioma() {
  const ctx = useContext(IdiomaContext);
  if (!ctx) {
    throw new Error('useIdioma debe usarse dentro de <IdiomaProvider>');
  }
  return ctx;
}
