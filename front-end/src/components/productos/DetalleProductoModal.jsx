import React, { useEffect, useRef } from 'react';
import './css/DetalleModal.css';

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
    
    return () => {
      if (parentCard) {
        parentCard.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, [onClose]);
  
  return (
    <div className="detalle-producto-modal" ref={modalRef}>
      <div className="modal-content">
        <div className="modal-header">
          <h2>Detalles del producto</h2>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="detalle-grid">
            <div className="detalle-imagen">
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
              
              <div className="detalle-precio-categoria">
                <span className="detalle-precio">{producto.precio}€</span>
                <span className="detalle-categoria-etiqueta">
                  {producto.categoria ? producto.categoria.nombre_cat : 'Sin categoría'}
                </span>
              </div>
              
              <p className="detalle-descripcion">{producto.descripcion}</p>
              
              <div className="detalle-specs">
                <div className="detalle-spec-item">
                  <span className="spec-label">ID:</span>
                  <span className="spec-value">{producto.id}</span>
                </div>
                <div className="detalle-spec-item">
                  <span className="spec-label">Tipo:</span>
                  <span className="spec-value">{producto.tipo || 'N/A'}</span>
                </div>
                <div className="detalle-spec-item">
                  <span className="spec-label">Talla:</span>
                  <span className="spec-value">{producto.talla || 'N/A'}</span>
                </div>
                {producto.created_at && (
                  <div className="detalle-spec-item">
                    <span className="spec-label">Creado:</span>
                    <span className="spec-value">
                      {new Date(producto.created_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {producto.updated_at && (
                  <div className="detalle-spec-item">
                    <span className="spec-label">Actualizado:</span>
                    <span className="spec-value">
                      {new Date(producto.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {producto.stocks && producto.stocks.length > 0 && (
                    <div className="detalle-stock-section">
                      <h4 className="stock-title">Inventario disponible</h4>
                      <div className="stock-grid">
                        {producto.stocks.map((item, index) => (
                          <div key={index} className="stock-item">
                            <span className="stock-color">{item.color}</span>
                            <span className="stock-talla">{item.talla}</span>
                            <span className="stock-cantidad">{item.stock} unidades</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
};

export default DetalleProductoModal;