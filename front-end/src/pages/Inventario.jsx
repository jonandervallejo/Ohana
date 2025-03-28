import React, { useState, useEffect } from 'react';
import ReactPaginate from 'react-paginate';
import { Link } from 'react-router-dom';
import { obtenerInventarios, eliminarInventario } from '../services/productoService';
import Toast from '../components/ui/Toast';
import ConfirmacionModal from '../components/ui/CofirmacionModal';
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
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [confirmarEliminacion, setConfirmarEliminacion] = useState(null);

  const [toastInfo, setToastInfo] = useState({
    mostrar: false,
    mensaje: '',
    tipo: 'success'
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

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
  }, []);

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
    setPaginaActual(data.selected);
  };

  const indiceUltimoInventario = (paginaActual + 1) * inventariosPorPagina;
  const indicePrimerInventario = indiceUltimoInventario - inventariosPorPagina;
  const inventariosActuales = inventariosFiltrados.slice(indicePrimerInventario, indiceUltimoInventario);

  const pageRangeDisplayed = windowWidth < 768 ? 1 : 5;
  const marginPagesDisplayed = windowWidth < 768 ? 1 : 2;

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
      {cargando ? (
        <div className="cargando">Cargando inventarios...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : (
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
                {inventariosActuales.length > 0 ? (
                  inventariosActuales.map((inventario) => (
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
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center">
                      No hay inventarios disponibles
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="pagination-container">
            <ReactPaginate
              previousLabel={'←'}
              nextLabel={'→'}
              breakLabel={'...'}
              breakClassName={'break-me'}
              pageCount={totalPaginas}
              marginPagesDisplayed={marginPagesDisplayed}
              pageRangeDisplayed={pageRangeDisplayed}
              onPageChange={handlePageClick}
              containerClassName={'pagination'}
              subContainerClassName={'pages pagination'}
              activeClassName={'active'}
              previousClassName={'pagination-prev'}
              nextClassName={'pagination-next'}
              pageLinkClassName={'pagination-link'}
              previousLinkClassName={'pagination-link'}
              nextLinkClassName={'pagination-link'}
            />
          </div>
        </>
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