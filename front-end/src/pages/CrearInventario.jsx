import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { obtenerProductosConStock } from '../services/productoService';
import Toast from '../components/ui/Toast';
import './css/Inventario.css';

const API_URL = 'http://88.15.46.106:8000/api';

const CrearInventario = () => {
  const navigate = useNavigate();
  const [productos, setProductos] = useState([]);
  const [productosFiltrados, setProductosFiltrados] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [nuevoInventario, setNuevoInventario] = useState({
    productoId: '',
    talla: '',
    color: '',
    stock: ''
  });

  const [productoSearch, setProductoSearch] = useState('');
  const [showProductoDropdown, setShowProductoDropdown] = useState(false);
  const selectRef = useRef(null);

  const [toastInfo, setToastInfo] = useState({
    mostrar: false,
    mensaje: '',
    tipo: 'success'
  });

  useEffect(() => {
    const cargarProductos = async () => {
      try {
        setCargando(true);
        const response = await obtenerProductosConStock();
        if (response) {
          setProductos(response);
          setProductosFiltrados(response);
        } else {
          setProductos([]);
        }
      } catch (err) {
        setError('Error al cargar los productos');
        console.error(err);
      } finally {
        setCargando(false);
      }
    };

    cargarProductos();
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setShowProductoDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [selectRef]);

  // Añadir verificación de array antes de filtrar
  const productosFiltradosDropdown = Array.isArray(productos) 
  ? productos
      .filter(producto => producto && producto.nombre && 
        producto.nombre.toLowerCase().includes(productoSearch.toLowerCase()))
      .slice(0, 5)
  : [];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNuevoInventario({
      ...nuevoInventario,
      [name]: value
    });
  };

  const handleProductoSearchChange = (e) => {
    setProductoSearch(e.target.value);
    setShowProductoDropdown(true);
  };

  const selectProducto = (producto) => {
    setNuevoInventario({
      ...nuevoInventario,
      productoId: producto.id
    });
    setProductoSearch(producto.nombre);
    setShowProductoDropdown(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_URL}/stock`, nuevoInventario);
      if (response.status === 201) {
        setToastInfo({
          mostrar: true,
          mensaje: 'Inventario creado exitosamente',
          tipo: 'success'
        });
        
        setTimeout(() => {
          navigate('/inventario');
        }, 2000);
      }
    } catch (error) {
      console.error('Error al crear inventario:', error);
      setToastInfo({
        mostrar: true,
        mensaje: 'Error al crear inventario',
        tipo: 'error'
      });
    }
  };

  return (
    <div className="container mt-4">
      <div className="header-container">
        <h1 className="inventory-title">Crear Nuevo Inventario</h1>
        <Link to="/inventario" className="volver-btn btn btn-secondary">
          <i className="fas fa-arrow-left"></i> Volver
        </Link>
      </div>

      {cargando ? (
        <div className="spinner-container">
          <div className="spinner">
            <i className="fas fa-spinner fa-spin fa-3x"></i>
            <p className="mt-2">Cargando productos...</p>
          </div>
        </div>
      ) : error ? (
        <div className="error-container">
          <i className="fas fa-exclamation-triangle"></i>
          <p>{error}</p>
        </div>
      ) : (
        <form id="inventario-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="productoId">Producto</label>
            <div className="custom-select-container" ref={selectRef}>
              <input
                type="text"
                className="form-control"
                placeholder="Buscar producto..."
                value={productoSearch}
                onChange={handleProductoSearchChange}
                onClick={() => setShowProductoDropdown(true)}
              />
              {showProductoDropdown && (
                <div className="custom-select-options">
                  {productosFiltradosDropdown.length > 0 ? (
                    productosFiltradosDropdown.map(producto => (
                      <div 
                        key={producto.id} 
                        className="custom-select-option"
                        onClick={() => selectProducto(producto)}
                      >
                        {producto.nombre}
                      </div>
                    ))
                  ) : (
                    <div className="custom-select-option no-results">
                      No hay resultados
                    </div>
                  )}
                </div>
              )}
              <input 
                type="hidden" 
                name="productoId" 
                value={nuevoInventario.productoId} 
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="talla">Talla</label>
            <input
              type="text"
              id="talla"
              name="talla"
              value={nuevoInventario.talla}
              onChange={handleInputChange}
              className="form-control"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="color">Color</label>
            <input
              type="text"
              id="color"
              name="color"
              value={nuevoInventario.color}
              onChange={handleInputChange}
              className="form-control"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="stock">Stock</label>
            <input
              type="number"
              id="stock"
              name="stock"
              value={nuevoInventario.stock}
              onChange={handleInputChange}
              className="form-control"
              required
            />
          </div>
          <div className="form-buttons">
            <button type="submit" className="btn btn-primary btn-block">
              Crear Inventario
            </button>
            <button 
              type="button" 
              className="btn btn-secondary btn-block mt-2" 
              onClick={() => navigate('/inventario')}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <Toast
        mensaje={toastInfo.mensaje}
        tipo={toastInfo.tipo}
        mostrar={toastInfo.mostrar}
        setMostrar={(mostrar) => setToastInfo(prev => ({ ...prev, mostrar }))}
        duracion={3000} 
      />
    </div>
  );
};

export default CrearInventario;