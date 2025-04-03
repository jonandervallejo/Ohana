import React, { useEffect, useRef } from 'react';
import './css/DetalleModal.css';
import { FaTimes, FaTag, FaCalendarAlt, FaEdit } from 'react-icons/fa';

const DetalleProductoModal = ({ producto, getImageUrl, onClose }) => {
  const modalRef = useRef(null);
  
  useEffect(() => {
    const handleMouseLeave = () => {
      onClose();
    };
    
    const parentCard = modalRef.current?.closest('.tarjeta-producto');
    if (parentCard) {
      parentCard.addEventListener('mouseleave', handleMouseLeave);
    }
    
    // También podemos añadir un manejador para cerrar con Escape
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      if (parentCard) {
        parentCard.removeEventListener('mouseleave', handleMouseLeave);
      }
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);
  
  // Función para formatear fecha
  const formatearFecha = (fecha) => {
    if (!fecha) return 'N/A';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(fecha).toLocaleDateString('es-ES', options);
  };
  
  return (
    <div className="detalle-producto-modal" ref={modalRef}>
      <div className="modal-content">
        <div className="modal-header">
          <h2>Detalles del producto</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        <div className="modal-body">
          <div className="detalle-grid">
            <div className="detalle-imagen-container">
              <div className="imagen-badge">
                <span>ID: {producto.id}</span>
              </div>
              <img 
                src={getImageUrl(producto.imagen)} 
                alt={producto.nombre} 
                className="imagen-detalle"
                onError={(e) => {
                  e.target.src = '/placeholder-image.png';
                  e.target.onerror = null;
                }}
              />
            </div>
            
            <div className="detalle-info">
              <h3 className="detalle-titulo">{producto.nombre}</h3>
              
              <div className="detalle-categoria">
                <FaTag className="detalle-icon" />
                <span className="detalle-categoria-etiqueta">
                  {producto.categoria ? producto.categoria.nombre_cat : 'Sin categoría'}
                </span>
              </div>
              
              <div className="detalle-precio-container">
                <span className="detalle-precio-label">Precio</span>
                <span className="detalle-precio">{producto.precio}€</span>
              </div>
              
              <div className="detalle-divider"></div>
              
              <div className="detalle-descripcion-container">
                <h4>Descripción</h4>
                <p className="detalle-descripcion">{producto.descripcion || 'No hay descripción disponible para este producto.'}</p>
              </div>
              
              <div className="detalle-specs-container">
                <h4>Especificaciones</h4>
                <div className="detalle-specs">
                  <div className="detalle-spec-item">
                    <span className="spec-label">Tipo:</span>
                    <span className="spec-value">{producto.tipo || 'N/A'}</span>
                  </div>
                  <div className="detalle-spec-item">
                    <span className="spec-label">Talla:</span>
                    <span className="spec-value">{producto.talla || 'N/A'}</span>
                  </div>
                </div>
              </div>
              
              <div className="detalle-fechas">
                <div className="fecha-item">
                  <FaCalendarAlt className="fecha-icon" />
                  <div>
                    <span className="fecha-label">Creado:</span>
                    <span className="fecha-valor">{formatearFecha(producto.created_at)}</span>
                  </div>
                </div>
                
                <div className="fecha-item">
                  <FaEdit className="fecha-icon" />
                  <div>
                    <span className="fecha-label">Actualizado:</span>
                    <span className="fecha-valor">{formatearFecha(producto.updated_at)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetalleProductoModal;