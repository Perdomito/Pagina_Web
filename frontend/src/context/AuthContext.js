import React, { createContext, useState, useContext, useEffect } from 'react';
import { USUARIOS } from '../data/mockData';

const AuthContext = createContext();

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
    // Verificar si hay un usuario guardado en localStorage
    const storedUser = localStorage.getItem('user');
    
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // FUNCIÓN DE LOGIN - SIN CONEXIÓN A API
  // Esta función verifica las credenciales contra los datos mock
  // En el futuro, esto será reemplazado por una llamada a la API
  const login = async (email, password) => {
    try {
      // Simular delay de red
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Buscar usuario en los datos mock
      const usuario = USUARIOS.find(
        u => u.email === email && u.password === password
      );
      
      if (usuario) {
        // Crear objeto de usuario sin la contraseña
        const userData = {
          id: usuario.id,
          nombre: usuario.nombre,
          email: usuario.email,
          rol: usuario.rol,
          pais: usuario.pais
        };
        
        // Guardar en localStorage
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        
        return { success: true };
      } else {
        return { 
          success: false, 
          message: 'Credenciales incorrectas' 
        };
      }
    } catch (error) {
      return { 
        success: false, 
        message: 'Error al iniciar sesión' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  const isAdmin = () => user?.rol === 'admin';
  const isPastor = () => user?.rol === 'pastor';
  const isMiembro = () => user?.rol === 'miembro';

  const value = {
    user,
    login,
    logout,
    loading,
    isAdmin,
    isPastor,
    isMiembro
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ============================================
// NOTA PARA FUTURA INTEGRACIÓN CON API:
// ============================================
// Cuando se implemente el backend, la función login deberá:
// 1. Hacer una petición POST a /api/auth/login
// 2. Enviar { email, password } en el body
// 3. Recibir { token, user } en la respuesta
// 4. Guardar el token en localStorage
// 5. Configurar axios para incluir el token en todas las peticiones
//
// Ejemplo:
// const response = await axios.post('/api/auth/login', { email, password });
// const { token, user: userData } = response.data;
// localStorage.setItem('token', token);
// localStorage.setItem('user', JSON.stringify(userData));
