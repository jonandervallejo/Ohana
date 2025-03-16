import React from 'react';
import ReactDOM from 'react-dom';
import './css/ConfirmacionModal.css';

const ConfirmacionModal = ({ mensaje, onConfirm, onCancel }) => {
  return ReactDOM.createPortal(
    <div className="modal-overlay confirmacion-modal">
      <div className="modal-content">
        <h2>Confirmación</h2>
        <p>{mensaje}</p>
        <div className="modal-actions">
          <button className="btn-confirmar" onClick={onConfirm}>Confirmar</button>
          <button className="btn-cancelar" onClick={onCancel}>Cancelar</button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmacionModal;