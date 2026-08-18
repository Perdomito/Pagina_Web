import React, { createContext, useState, useEffect, useContext } from 'react';
import API from '../api/axios';

export const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);


 
  const login = async (email, password) => {
    try {
      const response = await API.post('/auth/login', { email, password });
      const { token, usuario } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(usuario));
      setUser(usuario);

      return usuario;
    } catch (error) {
      // Si nunca llegó una respuesta real del servidor (típico cuando el
      // Space de Hugging Face estaba "dormido" y recién está arrancando),
      // reintentamos una vez automáticamente antes de rendirnos.
      if (!error.response) {
        try {
          const response = await API.post('/auth/login', { email, password });
          const { token, usuario } = response.data;

          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(usuario));
          setUser(usuario);

          return usuario;
        } catch (segundoError) {
          const mensaje = segundoError.response?.data?.detail || segundoError.message;
          throw new Error(mensaje);
        }
      }

      const mensaje = error.response?.data?.detail || error.message;
      throw new Error(mensaje);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete API.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
