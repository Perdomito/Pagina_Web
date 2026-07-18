// ============================================
// TRADUCCIONES DEL SISTEMA (es / en)
// Índice que fusiona el diccionario core con los
// módulos por página (utils/translations/*.js).
// Se consumen via useIdioma() -> t('clave').
// ============================================

import core from './translations/core';
import miembros from './translations/miembros';
import contactos from './translations/contactos';
import auth from './translations/auth';
import administracion from './translations/administracion';
import informeRegional from './translations/informeRegional';
import reportes from './translations/reportes';
import estadisticas from './translations/estadisticas';
import estudiosBiblicos from './translations/estudiosBiblicos';
import configuracion from './translations/configuracion';

const modulos = [
  core, miembros, contactos, auth, administracion,
  informeRegional, reportes, estadisticas, estudiosBiblicos, configuracion,
];

export const translations = {
  es: Object.assign({}, ...modulos.map(m => m.es)),
  en: Object.assign({}, ...modulos.map(m => m.en)),
};

export default translations;
