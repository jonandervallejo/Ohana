import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { API_URL, BASE_URL } from '../config/config';
import { obtenerTodosLosProductos, obtenerProductosPorCategoria, eliminarProducto } from '../services/productoService';
import TarjetaProducto from '../components/productos/TarjetaProducto';
import ConfirmacionModal from '../components/ui/CofirmacionModal';
import { FaChevronLeft, FaChevronRight, FaSearch } from 'react-icons/fa';
import './css/Productos.css';

const ProductosPage = () => {
  const [productos, setProductos] = useState([]);  // Todos los productos
  const [productosFiltrados, setProductosFiltrados] = useState([]);  // Productos filtrados
  const [categorias, setCategorias] = useState([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [paginaActual, setPaginaActual] = useState(0);
  const [itemsPorPagina] = useState(6);
  const [procesandoEliminacion, setProcesandoEliminacion] = useState(false);
  const [intentosDeRecarga, setIntentosDeRecarga] = useState(0);
  const [cargandoCategoria, setCargandoCategoria] = useState(false);
  
  // Estados para el filtro de fecha
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [mostrarFiltroFecha, setMostrarFiltroFecha] = useState(false);
  
  const [modalConfirmacion, setModalConfirmacion] = useState({
    mostrar: false,
    producto: null
  });

  // Cargar categorías al inicio
  useEffect(() => {
    const cargarCategorias = async () => {
      try {
        const categoriasResponse = await api.get('/categorias');
        setCategorias(categoriasResponse.data);
      } catch (err) {
        console.error('Error al cargar categorías:', err);
        setError('Error al cargar las categorías. Por favor, intenta de nuevo.');
      }
    };
    
    cargarCategorias();
  }, []);

  // Cargar productos (todos o por categoría)
  useEffect(() => {
    const cargarProductos = async () => {
      try {
        setCargando(true);
        setError(null);
        
        let productosData = [];
        
        // Si hay categoría seleccionada, cargar productos de esa categoría
        if (categoriaSeleccionada) {
          setCargandoCategoria(true);
          console.log(`Cargando productos de la categoría ID: ${categoriaSeleccionada}`);
          productosData = await obtenerProductosPorCategoria(categoriaSeleccionada);
          setCargandoCategoria(false);
        } else {
          // Si no hay categoría seleccionada, cargar todos los productos
          console.log("Cargando todos los productos...");
          productosData = await obtenerTodosLosProductos();
        }
        
        if (productosData.length === 0 && intentosDeRecarga < 2) {
          console.log(`No se obtuvieron productos, reintentando (${intentosDeRecarga + 1}/2)...`);
          setIntentosDeRecarga(prev => prev + 1);
          return;
        }
        
        console.log(`Cargados ${productosData.length} productos`);
        setProductos(productosData);
        
        // Aplicar otros filtros al conjunto de productos cargados
        aplicarFiltros(productosData);
        
        setCargando(false);
      } catch (err) {
        console.error('Error al cargar datos:', err);
        setError('Error al cargar los datos. Por favor, intenta de nuevo.');
        setCargando(false);
        
        if (intentosDeRecarga < 2) {
          console.log(`Error al cargar datos, reintentando (${intentosDeRecarga + 1}/2)...`);
          setIntentosDeRecarga(prev => prev + 1);
        }
      }
    };

    cargarProductos();
  }, [categoriaSeleccionada, intentosDeRecarga]);

  // Función para aplicar filtros (búsqueda y fecha)
  const aplicarFiltros = (productosAFiltrar) => {
    if (!productosAFiltrar || productosAFiltrar.length === 0) {
      setProductosFiltrados([]);
      return;
    }
    
    console.log(`Aplicando filtros adicionales a ${productosAFiltrar.length} productos...`);
    
    // Empezar con todos los productos que ya están filtrados por categoría
    let resultados = [...productosAFiltrar];
    
    // Aplicar filtro de búsqueda
    if (busqueda.trim() !== '') {
      const terminoBusqueda = busqueda.toLowerCase().trim();
      resultados = resultados.filter(producto =>
        (producto.nombre?.toLowerCase() || '').includes(terminoBusqueda) ||
        (producto.descripcion?.toLowerCase() || '').includes(terminoBusqueda)
      );
      console.log(`Productos después de filtrar por búsqueda "${busqueda}": ${resultados.length}`);
    }
    
    // Aplicar filtros de fecha
    if (fechaInicio || fechaFin) {
      resultados = resultados.filter(producto => {
        if (!producto.created_at) return false;
        
        const fechaProducto = new Date(producto.created_at);
        let cumpleFechaInicio = true;
        let cumpleFechaFin = true;
        
        if (fechaInicio) {
          const fechaInicioObj = new Date(fechaInicio);
          cumpleFechaInicio = fechaProducto >= fechaInicioObj;
        }
        
        if (fechaFin) {
          const fechaFinObj = new Date(fechaFin);
          // Ajustar para incluir todo el día final
          fechaFinObj.setHours(23, 59, 59, 999);
          cumpleFechaFin = fechaProducto <= fechaFinObj;
        }
        
        return cumpleFechaInicio && cumpleFechaFin;
      });
      console.log(`Productos después de filtrar por fechas: ${resultados.length}`);
    }
    
    // Actualizar productos filtrados con los resultados
    setProductosFiltrados(resultados);
    
    // Resetear página si estamos en una página que ya no existe con los nuevos filtros
    const nuevasPaginas = Math.ceil(resultados.length / itemsPorPagina);
    if (paginaActual > 0 && paginaActual >= nuevasPaginas) {
      console.log(`Reseteando página actual de ${paginaActual} a 0 porque no hay suficientes resultados`);
      setPaginaActual(0);
    }
  };

  // Replicar filtros cuando cambian búsqueda o fechas
  useEffect(() => {
    aplicarFiltros(productos);
  }, [busqueda, fechaInicio, fechaFin, productos]);

  // Manejador para cambiar la categoría
  const handleCategoriaChange = (e) => {
    const valor = e.target.value;
    console.log(`Cambiando categoría a: ${valor}`);
    setCategoriaSeleccionada(valor);
    setPaginaActual(0); // Resetear a la primera página
  };

  // Manejador para la búsqueda
  const handleBusqueda = (valor) => {
    console.log(`Cambiando búsqueda a: ${valor}`);
    setBusqueda(valor);
    setPaginaActual(0); // Resetear a la primera página
  };

  const limpiarFiltros = () => {
    console.log("Limpiando todos los filtros");
    setCategoriaSeleccionada('');
    setBusqueda('');
    setFechaInicio('');
    setFechaFin('');
    setPaginaActual(0);
    setMostrarFiltroFecha(false);
  };
  
  const toggleFiltroFecha = () => {
    setMostrarFiltroFecha(!mostrarFiltroFecha);
  };
  
  const aplicarFiltroFecha = () => {
    console.log(`Aplicando filtro fecha: ${fechaInicio} - ${fechaFin}`);
    setPaginaActual(0);
    setMostrarFiltroFecha(false);
  };
  
  const limpiarFiltroFecha = () => {
    console.log("Limpiando filtro de fecha");
    setFechaInicio('');
    setFechaFin('');
    setPaginaActual(0);
  };
  
  const handleProductoActualizado = (productoActualizado) => {
    // Actualizar tanto en la lista completa como en los filtrados
    setProductos(prevProductos => {
      return prevProductos.map(p => p.id === productoActualizado.id ? productoActualizado : p);
    });
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
      
      // Eliminar el producto de la lista local
      setProductos(prevProductos => {
        return prevProductos.filter(p => p.id !== producto.id);
      });
      
    } catch (error) {
      console.error("Error al eliminar el producto:", error);
      setError(`No se pudo eliminar el producto: ${error.message || 'Error desconocido'}`);
    } finally {
      setProcesandoEliminacion(false);
    }
  };

  // Paginación en el cliente
  const indiceUltimoProducto = (paginaActual + 1) * itemsPorPagina;
  const indicePrimerProducto = indiceUltimoProducto - itemsPorPagina;
  
  // Obtener solo los productos para la página actual a partir de los productos filtrados
  const productosActuales = productosFiltrados.slice(indicePrimerProducto, indiceUltimoProducto);
  const totalProductos = productosFiltrados.length;
  const totalPaginas = Math.ceil(totalProductos / itemsPorPagina);
  
  const handlePageClick = (data) => {
    if (data.selected >= 0 && data.selected < totalPaginas) {
      setPaginaActual(data.selected);
      window.scrollTo(0, 0);
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
          margin: '0 auto'
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
      
      {/* Dashboard de estadísticas */}
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
          <div className="search-input-wrapper">
            <span className="search-icon">
              <FaSearch />
            </span>
            <input
              type="text"
              placeholder="Buscar por nombre o descripción..."
              value={busqueda}
              onChange={(e) => handleBusqueda(e.target.value)}
              className="search-input"
            />
            {busqueda && (
              <button 
                className="clear-search" 
                onClick={() => handleBusqueda('')}
              >
                ×
              </button>
            )}
          </div>
        </div>
        
        {/* Selector de categoría con estilo mejorado */}
        <div className="categoria-filter">
          <div className="categoria-wrapper">
            <span className="categoria-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18"></path>
                <path d="M3 12h18"></path>
                <path d="M3 18h18"></path>
              </svg>
            </span>
            <select
              value={categoriaSeleccionada}
              onChange={handleCategoriaChange}
              className="categoria-select filter-select"
              disabled={cargandoCategoria}
            >
              <option value="">Todas las categorías</option>
              {categorias.map(categoria => (
                <option key={categoria.id} value={categoria.id}>
                  {categoria.nombre_cat}
                </option>
              ))}
            </select>
            {cargandoCategoria && (
              <span className="categoria-loading-indicator">
                <i className="fas fa-spinner fa-spin"></i>
              </span>
            )}
          </div>
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
      
      {productosActuales.length === 0 ? (
        <div className="sin-resultados">
          <i className="fas fa-box-open"></i>
          <p>No hay productos disponibles con los filtros aplicados</p>
        </div>
      ) : (
        <div className="grid-productos">
          {productosActuales.map(producto => (
            <div key={producto.id} className="producto-item">
              <TarjetaProducto 
                producto={producto} 
                esGestion={true}
                onProductoActualizado={handleProductoActualizado}
                onProductoEliminado={confirmarEliminacion}
                baseUrl={BASE_URL}
              />
            </div>
          ))}
        </div>
      )}

      {totalPaginas > 1 && (
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
            Mostrando {productosFiltrados.length > 0 ? paginaActual * itemsPorPagina + 1 : 0}-{Math.min((paginaActual + 1) * itemsPorPagina, totalProductos)} de {totalProductos} productos
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