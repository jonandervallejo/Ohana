import React, { useState, useEffect } from 'react';
import { obtenerProductos, obtenerProductosPorCategoria } from '../services/productoService';
import TarjetaProducto from '../components/productos/TarjetaProducto';
import './css/Productos.css';

const ProductosPage = () => {
  const [productos, setProductos] = useState([]);
  const [productosFiltrados, setProductosFiltrados] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [mostrarCategorias, setMostrarCategorias] = useState(false);

  useEffect(() => {
    const cargarProductos = async () => {
      try {
        setCargando(true);
        let data;
        
        if (categoriaSeleccionada) {
          data = await obtenerProductosPorCategoria(categoriaSeleccionada);
        } else {
          data = await obtenerProductos();
        }
        
        setProductos(data);
        setProductosFiltrados(data);
        
        if (!categoriaSeleccionada) {
          const categoriasUnicas = {};
          data.forEach(producto => {
            if (producto.categoria && !categoriasUnicas[producto.categoria.id]) {
              categoriasUnicas[producto.categoria.id] = producto.categoria;
            }
          });
          
          setCategorias(Object.values(categoriasUnicas));
        }
      } catch (err) {
        setError('Error al cargar los productos');
        console.error(err);
      } finally {
        setCargando(false);
      }
    };

    cargarProductos();
  }, [categoriaSeleccionada]);
  
  useEffect(() => {
    if (busqueda.trim() === '') {
      setProductosFiltrados(productos);
    } else {
      const resultados = productos.filter(producto => 
        producto.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        producto.descripcion.toLowerCase().includes(busqueda.toLowerCase())
      );
      setProductosFiltrados(resultados);
    }
  }, [busqueda, productos]);

  const filtrarPorCategoria = (idCategoria) => {
    setCategoriaSeleccionada(idCategoria);
    setMostrarCategorias(false);
  };

  const limpiarFiltros = () => {
    setCategoriaSeleccionada(null);
    setBusqueda('');
    setMostrarCategorias(false);
  };
  
  const handleNuevoProducto = () => {
    alert('Funcionalidad para añadir nuevo producto');
  };
  
  const toggleCategorias = () => {
    setMostrarCategorias(!mostrarCategorias);
  };
  
  const handleProductoActualizado = (productoActualizado) => {
    setProductos(productos.map(p => 
      p.id === productoActualizado.id ? productoActualizado : p
    ));
  };

  const handleProductoEliminado = (productoId) => {
    setProductos(productos.filter(p => p.id !== productoId));
  };

  return (
    <div className="productos-page">
      <div className="productos-header">
        <h1>Gestión de Productos</h1>
        <button className="btn-primary btn-nuevo" onClick={handleNuevoProducto}>
          <i className="fas fa-plus"></i> Nuevo Producto
        </button>
      </div>
      
      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-value">{productos.length}</div>
          <div className="stat-label">Total Productos</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{categorias.length}</div>
          <div className="stat-label">Categorías</div>
        </div>
      </div>
      
      <div className="filtros-container">
        <div className="search-container">
          <input
            type="text"
            placeholder="Buscar por nombre o descripción..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="search-input"
          />
          {busqueda && (
            <button 
              className="clear-search" 
              onClick={() => setBusqueda('')}
            >
              ×
            </button>
          )}
        </div>
        
        <div className="categoria-dropdown">
          <button 
            className="dropdown-toggle"
            onClick={toggleCategorias}
          >
            {categoriaSeleccionada ? 
              `Categoría: ${categorias.find(cat => cat.id === categoriaSeleccionada)?.nombre_cat}` : 
              'Todas las categorías'}
            <span className="arrow-down">▼</span>
          </button>
          
          {mostrarCategorias && (
            <div className="dropdown-menu">
              <div 
                className={`dropdown-item ${categoriaSeleccionada === null ? 'selected' : ''}`}
                onClick={limpiarFiltros}
              >
                Todas las categorías
              </div>
              {categorias.map(categoria => (
                <div 
                  key={categoria.id} 
                  className={`dropdown-item ${categoriaSeleccionada === categoria.id ? 'selected' : ''}`}
                  onClick={() => filtrarPorCategoria(categoria.id)}
                >
                  {categoria.nombre_cat}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {cargando ? (
        <div className="cargando">Cargando productos...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : productosFiltrados.length === 0 ? (
        <div className="sin-resultados">No hay productos disponibles con los filtros aplicados</div>
      ) : (
        <div className="grid-productos">
          {productosFiltrados.map(producto => (
            <div key={producto.id} className="producto-item">
              <TarjetaProducto 
                producto={producto} 
                esGestion={true}
                onProductoActualizado={handleProductoActualizado}
                onProductoEliminado={handleProductoEliminado}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductosPage;