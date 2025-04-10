import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { obtenerProductos, obtenerProductosPorCategoria, eliminarProducto } from '../services/productoService';
import TarjetaProducto from '../components/productos/TarjetaProducto';
import ConfirmacionModal from '../components/ui/CofirmacionModal';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import './css/Productos.css';

const API_URL = 'http://88.15.46.106:8000/api';

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
  const [totalProductos, setTotalProductos] = useState(0);
  const [procesandoEliminacion, setProcesandoEliminacion] = useState(false);
  const [necesitaRecargar, setNecesitaRecargar] = useState(false);
  
  // Estados para el filtro de fecha
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [mostrarFiltroFecha, setMostrarFiltroFecha] = useState(false);
  
  const [modalConfirmacion, setModalConfirmacion] = useState({
    mostrar: false,
    producto: null
  });

  const cargarProductos = async () => {
    try {
      setCargando(true);
      let params = {
        page: paginaActual + 1,
        per_page: 6
      };
      
      // Agregar filtros de fecha si están presentes
      if (fechaInicio) {
        params.fecha_inicio = fechaInicio;
      }
      
      if (fechaFin) {
        params.fecha_fin = fechaFin;
      }
      
      let response;
      if (categoriaSeleccionada) {
        response = await obtenerProductosPorCategoria(categoriaSeleccionada, params);
      } else {
        response = await obtenerProductos(params);
      }
      
      if (response && response.data) {
        setProductos(response.data);
        setTotalPaginas(response.last_page);
        
        // Actualizar el total de productos usando el campo 'total' de la respuesta
        if (response.total) {
          setTotalProductos(response.total);
        }
      } else {
        setProductos([]);
        setTotalPaginas(1);
      }
      setError(null);
    } catch (err) {
      setError('Error al cargar los productos');
      console.error('Error completo:', err);
    } finally {
      setCargando(false);
      setNecesitaRecargar(false);
    }
  };

  // Efecto para cargar productos cuando cambian los filtros o cuando se necesita recargar
  useEffect(() => {
    cargarProductos();
  }, [categoriaSeleccionada, paginaActual, necesitaRecargar]);

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

    setProductosFiltrados(resultados);
  }, [busqueda, productos]);

  const filtrarPorCategoria = (idCategoria) => {
    setCategoriaSeleccionada(idCategoria);
    setPaginaActual(0);
    setMostrarCategorias(false);
  };

  const limpiarFiltros = () => {
    setCategoriaSeleccionada(null);
    setBusqueda('');
    setFechaInicio('');
    setFechaFin('');
    setPaginaActual(0);
    setMostrarCategorias(false);
    setMostrarFiltroFecha(false);
    setNecesitaRecargar(true);
  };
  
  const toggleCategorias = () => {
    setMostrarCategorias(!mostrarCategorias);
    if (mostrarFiltroFecha) setMostrarFiltroFecha(false);
  };
  
  const toggleFiltroFecha = () => {
    setMostrarFiltroFecha(!mostrarFiltroFecha);
    if (mostrarCategorias) setMostrarCategorias(false);
  };
  
  const aplicarFiltroFecha = () => {
    setPaginaActual(0);
    setMostrarFiltroFecha(false);
    setNecesitaRecargar(true);
  };
  
  const limpiarFiltroFecha = () => {
    setFechaInicio('');
    setFechaFin('');
    setPaginaActual(0);
    setNecesitaRecargar(true);
  };
  
  const handleProductoActualizado = (productoActualizado) => {
    setProductos(productos.map(p => 
      p.id === productoActualizado.id ? productoActualizado : p
    ));
  };

  const confirmarEliminacion = (producto) => {
    setModalConfirmacion({
      mostrar: true,
      producto: producto
    });
  };

  const cancelarEliminacion = () => {
    setModalConfirmacion({
      mostrar: false,
      producto: null
    });
  };

  const eliminarProductoConfirmado = async () => {
    if (procesandoEliminacion) return;
  
    try {
      setProcesandoEliminacion(true);
      const producto = modalConfirmacion.producto;
      if (!producto) return;
      
      setModalConfirmacion({
        mostrar: false,
        producto: null
      });
      
      await eliminarProducto(producto.id);
      setNecesitaRecargar(true);
      
    } catch (error) {
      console.error("Error al eliminar el producto:", error);
      setError(`No se pudo eliminar el producto: ${error.message || 'Error desconocido'}`);
    } finally {
      setProcesandoEliminacion(false);
    }
  };

  const handlePageClick = (data) => {
    // Asegúrate de que no navegamos a páginas inválidas
    if (data.selected >= 0 && data.selected < totalPaginas) {
      setPaginaActual(data.selected);
      window.scrollTo(0, 0); // Scroll al inicio al cambiar de página
    }
  };
  
  // Formatear fecha para mostrar en el botón
  const obtenerTextoFiltroFecha = () => {
    if (fechaInicio && fechaFin) {
      return `Del ${formatearFecha(fechaInicio)} al ${formatearFecha(fechaFin)}`;
    } else if (fechaInicio) {
      return `Desde ${formatearFecha(fechaInicio)}`;
    } else if (fechaFin) {
      return `Hasta ${formatearFecha(fechaFin)}`;
    }
    return 'Filtrar por fecha de creación';
  };
  
  // Función para formatear fecha
  const formatearFecha = (fecha) => {
    if (!fecha) return '';
    const f = new Date(fecha);
    return `${f.getDate()}/${f.getMonth() + 1}/${f.getFullYear()}`;
  };

  if (cargando) {
    return (
      <div className="container ventas-container">
        <div className="spinner-container" style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
          minHeight: '500px',
          width: '100%',
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          padding: '2rem',
          margin: '0 auto'  // Centra el contenedor horizontalmente
        }}>
          <div className="spinner">
            <i className="fas fa-spinner fa-spin fa-3x"></i>
            <p className="mt-2">Cargando productos...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="productos-page">
        <div className="error-container">
          <i className="fas fa-exclamation-triangle"></i>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="productos-page">
      {/* Header con título y botón de nuevo producto */}
      <div className="gestion-header">
        <h1>Gestión de Productos</h1>
        <Link to="/productos/crear" className="btn-add-user" aria-label="Crear nuevo producto">
          <span className="icon-plus">+</span> Nuevo Producto
        </Link>
      </div>
      
      {/* Dashboard de estadísticas - MOVIDO ANTES DE LOS FILTROS */}
      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-value">{totalProductos}</div>
          <div className="stat-label">Total Productos</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{categorias.length}</div>
          <div className="stat-label">Categorías</div>
        </div>
      </div>
      
      {/* Filtros separados debajo del dashboard */}
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
                onClick={() => {
                  setCategoriaSeleccionada(null);
                  setMostrarCategorias(false);
                  setPaginaActual(0);
                  setNecesitaRecargar(true);
                }}
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
        
        <div className="fecha-dropdown">
          <button 
            className={`dropdown-toggle fecha-toggle ${fechaInicio || fechaFin ? 'active-filter' : ''}`}
            onClick={toggleFiltroFecha}
          >
            <span className="fecha-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </span>
            {fechaInicio || fechaFin ? obtenerTextoFiltroFecha() : 'Filtrar por fecha de creación'}
            <span className="arrow-down">▼</span>
          </button>
          
          {mostrarFiltroFecha && (
            <div className="fecha-menu">
              <div className="fecha-filter-container">
                <div className="fecha-filter-title">Filtrar por fecha de creación</div>
                <div className="fecha-input-group">
                  <label htmlFor="fecha-inicio">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
                    </svg>
                    Desde:
                  </label>
                  <input
                    type="date"
                    id="fecha-inicio"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    className="fecha-input"
                  />
                </div>
                
                <div className="fecha-input-group">
                  <label htmlFor="fecha-fin">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 8l4 4m0 0l-4 4m4-4h14"></path>
                    </svg>
                    Hasta:
                  </label>
                  <input
                    type="date"
                    id="fecha-fin"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                    className="fecha-input"
                  />
                </div>
                
                <div className="fecha-actions">
                  <button 
                    className="btn-aplicar"
                    onClick={aplicarFiltroFecha}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 10.5l3 3L22 4"></path>
                      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                    </svg>
                    Aplicar filtro
                  </button>
                  
                  {(fechaInicio || fechaFin) && (
                    <button 
                      className="btn-limpiar"
                      onClick={limpiarFiltroFecha}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                      Limpiar
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        
        {(categoriaSeleccionada || busqueda || fechaInicio || fechaFin) && (
          <button 
            className="btn-limpiar-todos"
            onClick={limpiarFiltros}
          >
            Limpiar filtros
          </button>
        )}
      </div>
      
      {productosFiltrados.length === 0 ? (
        <div className="sin-resultados">
          <i className="fas fa-box-open"></i>
          <p>No hay productos disponibles con los filtros aplicados</p>
        </div>
      ) : (
        <div className="grid-productos">
          {productosFiltrados.map(producto => (
            <div key={producto.id} className="producto-item">
              <TarjetaProducto 
                producto={producto} 
                esGestion={true}
                onProductoActualizado={handleProductoActualizado}
                onProductoEliminado={confirmarEliminacion}
              />
            </div>
          ))}
        </div>
      )}

      {productosFiltrados.length > 0 && (
        <div className="pagination-container">
          <div className="pagination">
            <button 
              className="pagination-button"
              onClick={() => handlePageClick({selected: paginaActual - 1})}
              disabled={paginaActual === 0}
            >
              <FaChevronLeft />
            </button>
            
            {(() => {
              // Determinamos el rango de páginas a mostrar (máximo 5)
              let startPage = Math.max(0, Math.min(paginaActual - 2, totalPaginas - 5));
              let endPage = Math.min(startPage + 4, totalPaginas - 1);
              
              // Si no tenemos suficientes páginas al final, ajustamos el inicio
              if (endPage - startPage < 4) {
                startPage = Math.max(0, endPage - 4);
              }
              
              // Crear un array con los números de página a mostrar
              const pages = [];
              
              // Primera página y elipsis si no es visible en el rango actual
              if (startPage > 0) {
                pages.push(
                  <button
                    key="first"
                    className="pagination-button"
                    onClick={() => handlePageClick({selected: 0})}
                  >
                    1
                  </button>
                );
                
                if (startPage > 1) {
                  pages.push(<span key="ellipsis-start" className="pagination-ellipsis">...</span>);
                }
              }
              
              // Botones del rango principal
              for (let i = startPage; i <= endPage; i++) {
                pages.push(
                  <button
                    key={i}
                    className={`pagination-button ${paginaActual === i ? 'active' : ''}`}
                    onClick={() => handlePageClick({selected: i})}
                  >
                    {i + 1}
                  </button>
                );
              }
              
              // Última página y elipsis si no es visible en el rango actual
              if (endPage < totalPaginas - 1) {
                if (endPage < totalPaginas - 2) {
                  pages.push(<span key="ellipsis-end" className="pagination-ellipsis">...</span>);
                }
                
                pages.push(
                  <button
                    key="last"
                    className="pagination-button"
                    onClick={() => handlePageClick({selected: totalPaginas - 1})}
                  >
                    {totalPaginas}
                  </button>
                );
              }
              
              return pages;
            })()}
            
            <button 
              className="pagination-button"
              onClick={() => handlePageClick({selected: paginaActual + 1})}
              disabled={paginaActual === totalPaginas - 1}
            >
              <FaChevronRight />
            </button>
          </div>
          
          <div className="pagination-info">
            Mostrando {paginaActual * 6 + 1}-{Math.min((paginaActual + 1) * 6, totalProductos)} de {totalProductos} productos
          </div>
        </div>
      )}

      {modalConfirmacion.mostrar && (
        <ConfirmacionModal 
          titulo="Eliminar producto"
          mensaje={`¿Estás seguro de que deseas eliminar el producto "${modalConfirmacion.producto?.nombre}"? Esta acción no se puede deshacer.`}
          onConfirm={eliminarProductoConfirmado}
          onCancel={cancelarEliminacion}
          confirmText="Eliminar"
          cancelText="Cancelar"
          tipo="danger"
        />
      )}
    </div>
  );
};

export default ProductosPage;