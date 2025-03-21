import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import ReactPaginate from 'react-paginate';
import { obtenerProductos, obtenerProductosPorCategoria } from '../services/productoService';
import TarjetaProducto from '../components/productos/TarjetaProducto';
import './css/Productos.css';

const API_URL = 'http://88.15.26.49:8000/api';

const ProductosPage = () => {
  const [productos, setProductos] = useState([]);
  const [productosFiltrados, setProductosFiltrados] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [mostrarCategorias, setMostrarCategorias] = useState(false);
  const [paginaActual, setPaginaActual] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [filtroStock, setFiltroStock] = useState(false); // Estado para el filtro de stock

  useEffect(() => {
    const cargarProductos = async () => {
      try {
        setCargando(true);
        let response;
        
        if (categoriaSeleccionada) {
          response = await obtenerProductosPorCategoria(categoriaSeleccionada, paginaActual + 1, 6);
        } else {
          response = await obtenerProductos(paginaActual + 1, 6);
        }
        
        if (response && response.data) {
          setProductos(response.data);
          setTotalPaginas(response.last_page);
        } else {
          setProductos([]);
          setTotalPaginas(1);
        }
      } catch (err) {
        setError('Error al cargar los productos');
        console.error(err);
      } finally {
        setCargando(false);
      }
    };

    cargarProductos();
  }, [categoriaSeleccionada, paginaActual]);

  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const response = await axios.get(`${API_URL}/categorias`);
        setCategorias(response.data);
      } catch (error) {
        console.error('Error al cargar categorías:', error);
        setError('No se pudieron cargar las categorías. Por favor, intenta de nuevo.');
      }
    };

    fetchCategorias();
  }, []);

  useEffect(() => {
    let resultados = productos;

    if (busqueda.trim() !== '') {
      resultados = resultados.filter(producto => 
        producto.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        producto.descripcion.toLowerCase().includes(busqueda.toLowerCase())
      );
    }

    if (filtroStock) {
      resultados = resultados.filter(producto => producto.stock > 0);
    }

    setProductosFiltrados(resultados);
  }, [busqueda, productos, filtroStock]);

  const filtrarPorCategoria = (idCategoria) => {
    setCategoriaSeleccionada(idCategoria);
    setPaginaActual(0); // Resetear a la primera página al cambiar de categoría
    setMostrarCategorias(false);
  };

  const limpiarFiltros = () => {
    setCategoriaSeleccionada(null);
    setBusqueda('');
    setPaginaActual(0); // Resetear a la primera página al limpiar filtros
    setMostrarCategorias(false);
    setFiltroStock(false); // Resetear el filtro de stock
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

  const handlePageClick = (data) => {
    setPaginaActual(data.selected);
  };

  return (
    <div className="productos-page">
      <div className="productos-header">
        <h1>Gestión de Productos</h1>
        <Link to="/productos/crear" className="btn-nuevo" aria-label="Crear nuevo producto">
          <div className="icon-container">
            <span className="icon-plus">+</span>
          </div>
          <span>Nuevo Producto</span>
        </Link>
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

      <div className="productos-pagination">
        <ReactPaginate
          previousLabel={'Anterior'}
          nextLabel={'Siguiente'}
          breakLabel={'...'}
          breakClassName={'break-me'}
          pageCount={totalPaginas}
          marginPagesDisplayed={2}
          pageRangeDisplayed={5}
          onPageChange={handlePageClick}
          containerClassName={'pagination'}
          subContainerClassName={'pages pagination'}
          activeClassName={'active'}
        />
      </div>
    </div>
  );
};

export default ProductosPage;