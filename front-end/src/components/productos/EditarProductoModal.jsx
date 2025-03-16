import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import './css/Modal.css'; 
import './css/EditarModal.css';

const EditarProductoModal = ({ producto, getImageUrl, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    id_categoria: '',
    talla: '',
    tipo: '',
  });
  
  const [errorMsg, setErrorMsg] = useState('');
  
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    setFormData({
      nombre: producto.nombre || '',
      descripcion: producto.descripcion || '',
      precio: producto.precio || '',
      id_categoria: producto.id_categoria || '',
      talla: producto.talla || '',
      tipo: producto.tipo || '',
    });
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [producto]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.nombre || !formData.descripcion || !formData.precio) {
      setErrorMsg('Por favor completa los campos obligatorios.');
      return;
    }
    
    const datosEnvio = {
      ...formData,
      precio: parseFloat(formData.precio),
      id_categoria: parseInt(formData.id_categoria) || null
    };
    
    onSave(datosEnvio);
  };
  
  return ReactDOM.createPortal(
    <div className="modal-overlay edicion-producto-modal" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Editar producto</h2>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {errorMsg && <div className="error-message">{errorMsg}</div>}
          
          <form onSubmit={handleSubmit} className="form-editar">
            <div className="form-grid">
              <div className="form-imagen">
                <img 
                  src={getImageUrl(producto.imagen)} 
                  alt={producto.nombre} 
                  className="preview-imagen"
                />
                <button type="button" className="btn-cambiar-imagen">
                  Cambiar imagen
                </button>
              </div>
              
              <div className="form-campos">
                <div className="form-group">
                  <label htmlFor="nombre">Nombre*</label>
                  <input
                    type="text"
                    id="nombre"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="descripcion">Descripción*</label>
                  <textarea
                    id="descripcion"
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={handleChange}
                    rows="3"
                    required
                  />
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="precio">Precio*</label>
                    <input
                      type="number"
                      id="precio"
                      name="precio"
                      value={formData.precio}
                      onChange={handleChange}
                      step="0.01"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="id_categoria">Categoría*</label>
                    <select
                      id="id_categoria"
                      name="id_categoria"
                      value={formData.id_categoria}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Seleccionar...</option>
                      <option value={producto.id_categoria}>
                        {producto.categoria && producto.categoria.nombre_cat
                          ? producto.categoria.nombre_cat 
                          : 'Categoría actual'}
                      </option>
                    </select>
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="tipo">Tipo</label>
                    <input
                      type="text"
                      id="tipo"
                      name="tipo"
                      value={formData.tipo}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="talla">Talla</label>
                    <input
                      type="text"
                      id="talla"
                      name="talla"
                      value={formData.talla}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                
                <div className="form-footer">
                  <button type="button" className="btn-cancelar" onClick={onClose}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn-guardar">
                    Guardar cambios
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default EditarProductoModal;