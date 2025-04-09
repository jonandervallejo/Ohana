import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './css/TarjetaProducto.css';
import DetalleProductoModal from './DetalleProductoModal';
import Toast from '../ui/Toast';

const API_BASE_URL = 'http://88.15.46.106:8000';

const TarjetaProducto = ({ producto, esGestion = false, onProductoActualizado, onProductoEliminado }) => {
  const navigate = useNavigate();
  const [mostrarDetalles, setMostrarDetalles] = useState(false);
  const [mostrarToast, setMostrarToast] = useState(false);
  const [mensajeToast, setMensajeToast] = useState('');
  const [tipoToast, setTipoToast] = useState('success');
  const [productoActual, setProductoActual] = useState(producto);
  
  const tarjetaRef = useRef(null);
  
  const handleEditar = () => {
    navigate(`/productos/editar/${producto.id}`);
  };
  
  const handleEliminar = () => {
    // En lugar de mostrar su propio modal, simplemente llama a la función del padre
    if (onProductoEliminado) {
      onProductoEliminado(producto);
    }
  };

  const handleVerDetalles = () => {
    setMostrarDetalles(true);
  };

  if (!producto) {
    return <div className="error-producto">Producto no disponible</div>;
  }

  const getImageUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${API_BASE_URL}/${path}`;
  };

  const productoMostrado = productoActual;

  return (
    <>
      <div className="tarjeta-producto" ref={tarjetaRef}>
        {esGestion && (
          <div className="acciones-gestion">
            <button className="btn-accion btn-editar" onClick={handleEditar}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708l-3-3zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207l6.5-6.5zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.5.5 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11l.178-.178z"/>
              </svg>
            </button>
            <button className="btn-accion btn-eliminar" onClick={handleEliminar}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
              </svg>
            </button>
          </div>
        )}
        
        {productoMostrado.imagen && (
          <div className="imagen-container">
            <img 
              src={getImageUrl(productoMostrado.imagen)}
              alt={productoMostrado.nombre} 
              className="imagen-producto"
              onError={(e) => {
                console.error("Error cargando imagen:", productoMostrado.imagen);
                e.target.src = '/placeholder-image.png';
                e.target.onerror = null;
              }}
            />
            {esGestion && productoMostrado.stocks && (
              <div className="badge-stock">
                Stock: {productoMostrado.stocks.reduce((total, item) => total + item.stock, 0)}
              </div>
            )}
          </div>
        )}
        
        <div className="info-producto">
          <h3>{productoMostrado.nombre}</h3>
          <p className="categoria">
            <span className="etiqueta-categoria">
              {productoMostrado.categoria ? productoMostrado.categoria.nombre_cat : 'Sin categoría'}
            </span>
          </p>
          <p className="precio">{productoMostrado.precio}€</p>
          <p className="descripcion">{productoMostrado.descripcion}</p>
          
          {esGestion ? (
            <div className="detalles-gestion">
              <p className="detalle-item"><strong>Talla:</strong> {productoMostrado.talla || 'N/A'}</p>
              <button className="btn-detalle" onClick={handleVerDetalles}>Ver detalles</button>
            </div>
          ) : (
            <button className="btn-ver-detalle" onClick={handleVerDetalles}>Ver detalle</button>
          )}
        </div>
        
        {mostrarDetalles && (
          <DetalleProductoModal 
            producto={productoMostrado}
            getImageUrl={getImageUrl}
            onClose={() => setMostrarDetalles(false)} 
          />
        )}
      </div>
      
      <Toast 
        mensaje={mensajeToast}
        tipo={tipoToast}
        mostrar={mostrarToast}
        setMostrar={setMostrarToast}
        duracion={1500}
      />
    </>
  );
};

export default TarjetaProducto;