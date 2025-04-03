import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { obtenerInventarios, eliminarInventario } from '../services/productoService';
import Toast from '../components/ui/Toast';
import ConfirmacionModal from '../components/ui/CofirmacionModal';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import './css/Inventario.css';

const Inventario = () => {
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [inventarios, setInventarios] = useState([]);
  const [inventariosFiltrados, setInventariosFiltrados] = useState([]);
  const [paginaActual, setPaginaActual] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [inventariosPorPagina] = useState(4);
  const [confirmarEliminacion, setConfirmarEliminacion] = useState(null);

  const [toastInfo, setToastInfo] = useState({
    mostrar: false,
    mensaje: '',
    tipo: 'success'
  });

  useEffect(() => {
    const cargarInventarios = async () => {
      try {
        setCargando(true);
        const response = await obtenerInventarios();
        setInventarios(response);
        setInventariosFiltrados(response);
        setTotalPaginas(Math.ceil(response.length / inventariosPorPagina));
      } catch (error) {
        setError('Error al cargar inventarios');
        console.error(error);
      } finally {
        setCargando(false);
      }
    };

    cargarInventarios();
  }, [inventariosPorPagina]);

  useEffect(() => {
    if (busqueda.trim() === '') {
      setInventariosFiltrados(inventarios);
    } else {
      const resultados = inventarios.filter(inventario =>
        inventario.producto.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        inventario.producto.descripcion?.toLowerCase().includes(busqueda.toLowerCase())
      );
      setInventariosFiltrados(resultados);
    }
    
    // Actualizar el total de páginas cuando cambia el filtro
    setTotalPaginas(Math.ceil(
      (busqueda.trim() === '' ? inventarios.length : inventariosFiltrados.length) / inventariosPorPagina
    ));
    
    // Reset a la primera página cuando cambia el filtro
    setPaginaActual(0);
  }, [busqueda, inventarios]);

  const handleConfirmarEliminacion = (inventario) => {
    setConfirmarEliminacion(inventario);
  };

  const handleCancelarEliminacion = () => {
    setConfirmarEliminacion(null);
  };

  const handleEliminarInventario = async () => {
    if (!confirmarEliminacion) return;
    
    try {
      await eliminarInventario(confirmarEliminacion.id);
      setToastInfo({
        mostrar: true,
        mensaje: 'Inventario eliminado exitosamente',
        tipo: 'success'
      });
      
      const inventariosActualizados = await obtenerInventarios();
      setInventarios(inventariosActualizados);
      setInventariosFiltrados(inventariosActualizados);
      setTotalPaginas(Math.ceil(inventariosActualizados.length / inventariosPorPagina));
      
      setConfirmarEliminacion(null);
    } catch (error) {
      console.error('Error al eliminar inventario:', error);
      setToastInfo({
        mostrar: true,
        mensaje: 'Error al eliminar inventario',
        tipo: 'error'
      });
    }
  };

  const handleSearchChange = (e) => {
    setBusqueda(e.target.value);
  };

  const handlePageClick = (data) => {
    // Asegúrate de que no navegamos a páginas inválidas
    if (data.selected >= 0 && data.selected < totalPaginas) {
      setPaginaActual(data.selected);
      window.scrollTo(0, 0); // Scroll al inicio al cambiar de página
    }
  };

  const indiceUltimoInventario = (paginaActual + 1) * inventariosPorPagina;
  const indicePrimerInventario = indiceUltimoInventario - inventariosPorPagina;
  const inventariosActuales = inventariosFiltrados.slice(indicePrimerInventario, indiceUltimoInventario);
  const totalInventarios = inventariosFiltrados.length;

  if (cargando) {
    return (
      <div className="container mt-4 text-center">
        <div className="spinner-container">
          <div className="spinner">
            <i className="fas fa-spinner fa-spin fa-3x"></i>
            <p className="mt-2">Cargando inventarios...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-4">
        <div className="error-container">
          <i className="fas fa-exclamation-triangle"></i>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="header-container">
        <h1 className="inventory-title">Inventario</h1>
        <Link to="/crear-inventario" className="crear-btn">
          <i className="fas fa-plus"></i> Crear
        </Link>
      </div>
      
      <div className="filtros-container">
        <div className="search-container">
          <input
            type="text"
            placeholder="Buscar por nombre o descripción..."
            value={busqueda}
            onChange={handleSearchChange}
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
      </div>

      <h2 className="inventory-subtitle">Inventarios Existentes</h2>
      
      {inventariosActuales.length > 0 ? (
        <>
          <div className="table-responsive">
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Talla</th>
                  <th>Color</th>
                  <th>Stock</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {inventariosActuales.map((inventario) => (
                  <tr key={inventario.id}>
                    <td>{inventario.producto.nombre}</td>
                    <td>{inventario.talla}</td>
                    <td>{inventario.color}</td>
                    <td>{inventario.stock}</td>
                    <td>
                      <div className="btn-group">
                        <Link
                          to={`/editar-inventario/${inventario.id}`}
                          className="btn btn-warning btn-sm"
                          title="Editar"
                        >
                          <i className="fas fa-edit"></i>
                        </Link>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleConfirmarEliminacion(inventario)}
                          title="Eliminar"
                        >
                          <i className="fas fa-trash-alt"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="pagination-container">
            <div className="pagination">
              <button 
                className="pagination-button"
                onClick={() => handlePageClick({selected: paginaActual - 1})}
                disabled={paginaActual === 0}
              >
                <FaChevronLeft />
              </button>
              
              {/* Calculamos qué páginas mostrar para evitar duplicados */}
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
              Mostrando {paginaActual * inventariosPorPagina + 1}-{Math.min((paginaActual + 1) * inventariosPorPagina, totalInventarios)} de {totalInventarios} inventarios
            </div>
          </div>
        </>
      ) : (
        <div className="sin-resultados">
          <i className="fas fa-box-open"></i>
          <p>No hay inventarios disponibles con los filtros aplicados</p>
        </div>
      )}

      {confirmarEliminacion && (
        <ConfirmacionModal 
          titulo="Eliminar inventario"
          mensaje={`¿Estás seguro de que deseas eliminar el inventario de ${confirmarEliminacion.producto.nombre} con talla ${confirmarEliminacion.talla} y color ${confirmarEliminacion.color}?`}
          onConfirm={handleEliminarInventario}
          onCancel={handleCancelarEliminacion}
          confirmText={<><i className="fas fa-trash-alt"></i> Eliminar</>}
          cancelText="Cancelar"
          tipo="danger"
        />
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

export default Inventario;