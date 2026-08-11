
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { IdiomaProvider, useIdioma } from './context/IdiomaContext';

import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import Home from './pages/Home';
import Miembros from './pages/Miembros';
import Iglesias from './pages/Iglesias';
import EstudiosLista from './pages/EstudiosLista';
import EstudiosBiblicos from './pages/EstudiosBiblicos';
import Estadisticas from './pages/Estadisticas';
import Reportes from './pages/Reportes';
import Contactos from './pages/Contactos';
import Administracion from './pages/Administracion';
import Configuracion from './pages/Configuracion';
import InformeRegional from './pages/InformeRegional';
import SeguimientoLeyes from './pages/SeguimientoLeyes';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const { t } = useIdioma();

  if (loading) {
    return (
      <div style={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0E5A61, #15777F)",
        color: "white",
        fontSize: "18px"
      }}>
        {t('cargando')}
      </div>
    );
  }
  
  return user ? children : <Navigate to="/" />;
};

function AppRoutes() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/home" element={<PrivateRoute><Home /></PrivateRoute>} />
        <Route path="/miembros" element={<PrivateRoute><Miembros /></PrivateRoute>} />
        <Route path="/iglesias" element={<PrivateRoute><Iglesias /></PrivateRoute>} />
        <Route path="/estudios-biblicos" element={<PrivateRoute><EstudiosBiblicos /></PrivateRoute>} />
        <Route path="/estudios" element={<PrivateRoute><EstudiosLista /></PrivateRoute>} />
        <Route path="/estadisticas" element={<PrivateRoute><Estadisticas /></PrivateRoute>} />
        <Route path="/reportes" element={<PrivateRoute><Reportes /></PrivateRoute>} />
        <Route path="/contactos" element={<PrivateRoute><Contactos /></PrivateRoute>} />
        <Route path="/administracion" element={<PrivateRoute><Administracion /></PrivateRoute>} />
        <Route path="/configuracion" element={<PrivateRoute><Configuracion /></PrivateRoute>} />
        <Route path="/seguimiento-leyes" element={<PrivateRoute><SeguimientoLeyes /></PrivateRoute>} />
        <Route path="/informe-regional" element={<InformeRegional />} />
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  return (
    <IdiomaProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </IdiomaProvider>
  );
}

export default App;
