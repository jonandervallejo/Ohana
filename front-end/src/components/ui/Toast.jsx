import React, { useEffect } from 'react';
import './css/Toast.css';

const Toast = ({ mensaje, tipo = 'success', mostrar, setMostrar, duracion = 1500 }) => {
  useEffect(() => {
    if (mostrar) {
      const timer = setTimeout(() => {
        setMostrar(false);
      }, duracion);
      
      return () => clearTimeout(timer);
    }
  }, [mostrar, setMostrar, duracion]);
  
  if (!mostrar) return null;
  
  return (
    <div className={`toast toast-${tipo}`}>
      <div className="toast-contenido">
        {tipo === 'success' && (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
            <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
          </svg>
        )}
        {tipo === 'error' && (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
            <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z"/>
          </svg>
        )}
        <span>{mensaje}</span>
      </div>
    </div>
  );
};

export default Toast;