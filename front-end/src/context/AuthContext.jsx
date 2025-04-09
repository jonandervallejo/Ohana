import React, { createContext, useState, useEffect, useRef } from 'react';

const AuthContext = createContext();

// Constantes para tiempos de expiración (en milisegundos)
const FILE_SELECTION_EXPIRY = 6000; // 2 minutos
const TOKEN_CHECK_DELAY = 5000; // 5 segundos

// Constantes para roles
const ROLE_ADMIN = 1;
const ROLE_TECNICO = 2;
const ROLE_CLIENTE = 3;

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuarioState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setTokenState] = useState(localStorage.getItem('token'));
  // Referencia para rastrear si estamos seleccionando archivos
  const isSelectingFiles = useRef(false);
  // Referencia para el último tiempo de selección de archivos
  const lastFileSelectionTime = useRef(0);

  const checkUserLoggedIn = async (force = false) => {
    const now = Date.now();
    const timeSinceLastSelection = now - lastFileSelectionTime.current;
    
    if (timeSinceLastSelection < FILE_SELECTION_EXPIRY && !force) {
      console.log(`Omitiendo verificación (selección hace ${Math.round(timeSinceLastSelection/100)}s)`);
      return;
    }
    
    // Si estamos seleccionando archivos y no es una verificación forzada, saltamos
    if (isSelectingFiles.current && !force) {
      console.log("Omitiendo verificación de token durante selección de archivos");
      return;
    }

    // También verificar la variable global
    if (window._isSelectingFiles && !force) {
      console.log("Omitiendo verificación de token (variable global)");
      return;
    }

    // Verificar si hay una marca de tiempo guardada en localStorage
    const storedTimestamp = localStorage.getItem('fileSelectionTimestamp');
    if (storedTimestamp) {
      const storedTime = parseInt(storedTimestamp, 10);
      const elapsed = now - storedTime;
      
      if (elapsed < FILE_SELECTION_EXPIRY && !force) {
        console.log(`Omitiendo verificación basada en localStorage (hace ${Math.round(elapsed/1000)}s)`);
        return;
      }
    }

    // También verificar la ruta actual
    if (window.location.pathname.includes('/crear-producto') && !force) {
      console.log("En ruta de crear producto, verificación de token retrasada");
      return;
    }

    const token = localStorage.getItem('token');
    
    if (token) {
      try {
        console.log("Verificando token...");
        const response = await fetch('http://88.15.46.106:8000/api/user', {
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
          
          // Verificar el rol del usuario - rechazar clientes (id_rol = 3)
          if (data.id_rol === ROLE_CLIENTE) {
            console.log("Cliente intentando acceder. Acceso denegado.");
            localStorage.removeItem('token');
            setUsuarioState(null);
            setTokenState(null);
            alert("Los clientes no tienen acceso a este sistema. Por favor, utilice la aplicación para clientes.");
            window.location.href = '/login';
            return;
          }
          
          setUsuarioState(data);
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
            
            // Solo limpiar si no estamos en rutas sensibles
            if (!window.location.pathname.includes('/crear-producto') && 
                !window.location.pathname.includes('/editar-producto')) {
              localStorage.removeItem('token');
              setUsuarioState(null);
              setTokenState(null);
            } else {
              console.log("En ruta sensible, evitando limpiar token");
            }
          }
        }
      } catch (error) {
        console.error('Error de red al verificar usuario:', error);
        // No eliminar el token en caso de error de red
        // para evitar desconexiones por problemas temporales
      }
    } else {
      console.log("No hay token almacenado");
      setUsuarioState(null);
    }
    setLoading(false);
  };

  // Inicializar la variable global al montar el componente
  useEffect(() => {
    // Inicializar la variable global
    window._isSelectingFiles = false;

    // Configurar detector para inputs de tipo file
    const handleFileInputClick = (e) => {
      if (e.target.type === 'file' || (e.target.tagName === 'BUTTON' && e.target.closest('.file-input-container'))) {
        console.log("Detectada selección de archivos");
        isSelectingFiles.current = true;
        window._isSelectingFiles = true;
        
        // Guardar timestamp actual
        const now = Date.now();
        lastFileSelectionTime.current = now;
        localStorage.setItem('fileSelectionTimestamp', now.toString());
      }
    };

    document.addEventListener('click', handleFileInputClick, true);
    
    // Verificar timestamp guardado al iniciar
    const storedTimestamp = localStorage.getItem('fileSelectionTimestamp');
    if (storedTimestamp) {
      const storedTime = parseInt(storedTimestamp, 10);
      const now = Date.now();
      const elapsed = now - storedTime;
      
      // Si ha pasado menos del tiempo de expiración, considerar que aún estamos en selección
      if (elapsed < FILE_SELECTION_EXPIRY) {
        console.log(`Restaurando estado de selección de archivos (hace ${Math.round(elapsed/1000)}s)`);
        isSelectingFiles.current = true;
        window._isSelectingFiles = true;
        lastFileSelectionTime.current = storedTime;
      }
    }
    
    return () => document.removeEventListener('click', handleFileInputClick, true);
  }, []);

  useEffect(() => {
    checkUserLoggedIn();
    
    // Verificar cuando la ventana recupera el foco
    const handleFocus = () => {
      // Solo procesamos el evento focus si no estamos en ruta sensible
      if (window.location.pathname.includes('/crear-producto')) {
        console.log("En ruta sensible, omitiendo verificación en focus");
        return;
      }
      
      // Verificar timestamp de última selección
      const now = Date.now();
      const timeSinceLastSelection = now - lastFileSelectionTime.current;
      
      if (timeSinceLastSelection < FILE_SELECTION_EXPIRY) {
        console.log(`Omitiendo verificación en focus (selección hace ${Math.round(timeSinceLastSelection/1000)}s)`);
        return;
      }
      
      // Esperar un momento para permitir que la selección de archivos se complete
      setTimeout(() => {
        // Si estábamos seleccionando archivos, restablecer el estado
        if (isSelectingFiles.current || window._isSelectingFiles) {
          console.log("Restableciendo estado de selección de archivos");
          
          // En lugar de restablecer inmediatamente, guardar timestamp actual
          const now = Date.now();
          lastFileSelectionTime.current = now;
          localStorage.setItem('fileSelectionTimestamp', now.toString());
          
          // Darle más tiempo al navegador para procesar antes de verificar
          setTimeout(() => {
            // Solo verificar si ha pasado el tiempo de expiración
            const elapsed = Date.now() - lastFileSelectionTime.current;
            if (elapsed >= FILE_SELECTION_EXPIRY) {
              isSelectingFiles.current = false;
              window._isSelectingFiles = false;
              checkUserLoggedIn();
            }
          }, TOKEN_CHECK_DELAY);
        } else {
          checkUserLoggedIn();
        }
      }, 500);
    };
    
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Función para actualizar los datos del usuario
  const setUsuario = (nuevosDatos) => {
    setUsuarioState(prevState => ({
      ...prevState,
      ...nuevosDatos
    }));
  };

  // Exponer funciones para control externo de selección de archivos
  const startFileSelection = () => {
    isSelectingFiles.current = true;
    window._isSelectingFiles = true;
    
    // Guardar timestamp actual
    const now = Date.now();
    lastFileSelectionTime.current = now;
    localStorage.setItem('fileSelectionTimestamp', now.toString());
    
    console.log("Inicio de selección de archivos marcado");
  };

  const endFileSelection = () => {
    // En lugar de finalizar la selección, solo actualizamos el timestamp
    // para que el período de gracia comience de nuevo
    const now = Date.now();
    lastFileSelectionTime.current = now;
    localStorage.setItem('fileSelectionTimestamp', now.toString());
    
    console.log("Timestamp de selección de archivos actualizado");
    
    // Solo después de un tiempo considerable finalizamos realmente
    setTimeout(() => {
      isSelectingFiles.current = false;
      window._isSelectingFiles = false;
      console.log("Fin de selección de archivos marcado");
    }, FILE_SELECTION_EXPIRY);
  };

  const login = async (email, password) => {
    try {
      const response = await fetch('http://88.15.46.106:8000/api/login', {
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
        // Verificar que no sea un cliente (id_rol = 3)
        if (data.usuario && data.usuario.id_rol === ROLE_CLIENTE) {
          return { 
            success: false, 
            message: 'Los clientes no tienen acceso a este sistema. Por favor, utilice la aplicación para clientes.' 
          };
        }
        
        localStorage.setItem('token', data.token);
        setTokenState(data.token);
        setUsuarioState(data.usuario);
        return { success: true };
      } else {
        return { success: false, message: data.message || 'Error al iniciar sesión' };
      }
    } catch (error) {
      console.error('Error de red al iniciar sesión:', error);
      return { success: false, message: 'Error de conexión. Intente nuevamente.' };
    }
  };

  const logout = async () => {
    const currentToken = localStorage.getItem('token');
    
    if (currentToken) {
      try {
        await fetch('http://88.15.46.106:8000/api/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${currentToken}`,
            'Accept': 'application/json'
          }
        });
      } catch (error) {
        console.error('Error al notificar logout al servidor:', error);
      }
    }
    
    localStorage.removeItem('token');
    localStorage.removeItem('fileSelectionTimestamp');
    setUsuarioState(null);
    setTokenState(null);
  };
  
  // Funciones auxiliares para verificar roles
  const isAdmin = () => {
    return usuario && usuario.id_rol === ROLE_ADMIN;
  };
  
  const isTecnico = () => {
    return usuario && usuario.id_rol === ROLE_TECNICO;
  };
  
  const getRole = () => {
    if (!usuario) return null;
    
    switch (usuario.id_rol) {
      case ROLE_ADMIN:
        return 'admin';
      case ROLE_TECNICO:
        return 'tecnico';
      default:
        return 'unknown';
    }
  };

  return (
    <AuthContext.Provider value={{ 
      usuario, 
      token,
      loading, 
      login, 
      logout,
      setUsuario,
      startFileSelection,
      endFileSelection,
      checkUserLoggedIn,
      // Añadimos las funciones de verificación de roles
      isAdmin,
      isTecnico,
      getRole,
      // Constantes de roles
      ROLE_ADMIN,
      ROLE_TECNICO,
      ROLE_CLIENTE
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext };