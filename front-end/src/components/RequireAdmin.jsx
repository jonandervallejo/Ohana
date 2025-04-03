import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const RequireAdmin = ({ children }) => {
  const { usuario, isAdmin, loading } = useContext(AuthContext);

  // Mostrar indicador de carga mientras se verifica el usuario
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Verificando permisos...</p>
      </div>
    );
  }

  // Si no es admin, redirigir al inicio
  if (!usuario || !isAdmin()) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default RequireAdmin;