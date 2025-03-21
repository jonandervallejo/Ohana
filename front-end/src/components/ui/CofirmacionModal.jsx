import React from 'react';
import ReactDOM from 'react-dom';
import './css/ConfirmacionModal.css';

const ConfirmacionModal = ({ titulo = 'Confirmación', mensaje, onConfirm, onCancel, confirmText = 'Confirmar', cancelText = 'Cancelar', tipo = 'warning' }) => {
  // Prevenir scroll en el fondo cuando el modal está abierto
  React.useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  // Cerrar modal con ESC
  React.useEffect(() => {
    const handleEsc = (event) => {
      if (event.keyCode === 27) onCancel();
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onCancel]);

  return ReactDOM.createPortal(
    <div className="modal-overlay confirmacion-modal">
      <div className={`modal-content modal-${tipo}`}>
        <div className="modal-header">
          {tipo === 'warning' && (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
              <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/>
            </svg>
          )}
          {tipo === 'danger' && (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
              <path d="M5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z"/>
            </svg>
          )}
          <h2>{titulo}</h2>
          <button className="btn-cerrar" onClick={onCancel}>×</button>
        </div>
        <div className="modal-body">
          <p>{mensaje}</p>
        </div>
        <div className="modal-actions">
          <button 
            className={`btn-${tipo === 'danger' ? 'eliminar' : 'confirmar'}`} 
            onClick={onConfirm}
          >
            {confirmText}
          </button>
          <button 
            className="btn-cancelar" 
            onClick={onCancel}
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmacionModal;