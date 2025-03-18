import React, { createContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkUserLoggedIn = async () => {
    const token = localStorage.getItem('token');
    
    if (token) {
      try {
        console.log("Verificando token...");
        const response = await fetch('http://88.15.26.49:8000/api/user', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });
        
        // Para depuración
        console.log("Respuesta del servidor:", response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log("Datos del usuario:", data);
          setUsuario(data);
        } else {
          // Intentar leer el mensaje de error
          try {
            const errorData = await response.json();
            console.error('Error de autenticación:', errorData);
          } catch (e) {
            console.error('Token inválido o expirado. Código de estado:', response.status);
          }
          
          // No eliminamos inmediatamente el token en caso de errores 401 o 403
          // para evitar ciclos de logout innecesarios
          if (response.status === 401 || response.status === 403) {
            console.log("Token expirado o no autorizado");
            localStorage.removeItem('token');
            setUsuario(null);
          }
        }
      } catch (error) {
        console.error('Error de red al verificar usuario:', error);
        // No eliminar el token en caso de error de red
        // para evitar desconexiones por problemas temporales
      }
    } else {
      console.log("No hay token almacenado");
      setUsuario(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    checkUserLoggedIn();
    
    // También podemos verificar cuando la ventana recupera el foco
    // útil cuando el usuario vuelve después de un tiempo
    const handleFocus = () => {
      checkUserLoggedIn();
    };
    
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const login = async (email, password) => {
    try {
      const response = await fetch('http://88.15.26.49:8000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      console.log("Respuesta de login:", data);
      
      if (response.ok) {
        localStorage.setItem('token', data.token);
        setUsuario(data.usuario);
        return { success: true };
      } else {
        return { success: false, message: data.message || 'Error al iniciar sesión' };
      }
    } catch (error) {
      console.error('Error de red al iniciar sesión:', error);
      return { success: false, message: 'Error de conexión. Intente nuevamente.' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUsuario(null);
  };

  return (
    <AuthContext.Provider value={{ usuario, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext };