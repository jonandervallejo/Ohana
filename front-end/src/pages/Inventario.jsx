import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ReactPaginate from 'react-paginate';
import { obtenerInventarios, actualizarInventario, obtenerTodosLosProductos, obtenerProductosConStock } from '../services/productoService';
import Toast from '../components/ui/Toast'; // Importar el componente Toast
import './css/Inventario.css';

const API_URL = 'http://88.15.26.49:8000/api';

const Inventario = () => {
  const [productos, setProductos] = useState([]); // Productos disponibles
  const [productosFiltrados, setProductosFiltrados] = useState([]);
  const [categorias, setCategorias] = useState([]); // Categorías de productos
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null); // Categoría seleccionada
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [inventarios, setInventarios] = useState([]);
  const [inventariosFiltrados, setInventariosFiltrados] = useState([]);
  const [inventarioEditando, setInventarioEditando] = useState(null);
  const [nuevoInventario, setNuevoInventario] = useState({
    productoId: '',
    talla: '',
    color: '',
    stock: ''
  });
  const [paginaActual, setPaginaActual] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [inventariosPorPagina] = useState(5);

  // Estados para el select personalizado
  const [productoSearch, setProductoSearch] = useState('');
  const [showProductoDropdown, setShowProductoDropdown] = useState(false);
  const selectRef = useRef(null);

  // Estado para el toast
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
    const cargarCategorias = async () => {
      try {
        const response = await axios.get(`${API_URL}/categorias`);
        setCategorias(response.data);
      } catch (error) {
        console.error('Error al cargar categorías:', error);
        setError('No se pudieron cargar las categorías. Por favor, intenta de nuevo.');
      }
    };

    cargarCategorias();
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
        inventario.producto.descripcion.toLowerCase().includes(busqueda.toLowerCase())
      );
      setInventariosFiltrados(resultados);
    }
  }, [busqueda, inventarios]);

  // Cerrar el dropdown cuando se hace clic fuera
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

  // Función para filtrar productos para el dropdown
  const productosFiltradosDropdown = productos
    .filter(producto => 
      producto.nombre.toLowerCase().includes(productoSearch.toLowerCase()))
    .slice(0, 5); // Limitar a 5 productos

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

  // Añadir esta nueva función para cancelar la edición
  const handleCancelEdit = () => {
    setInventarioEditando(null);
    setNuevoInventario({
      productoId: '',
      talla: '',
      color: '',
      stock: ''
    });
    setProductoSearch('');
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
        setNuevoInventario({
          productoId: '',
          talla: '',
          color: '',
          stock: ''
        });
        setProductoSearch('');
        const inventariosActualizados = await obtenerInventarios();
        setInventarios(inventariosActualizados);
        setInventariosFiltrados(inventariosActualizados);
        setTotalPaginas(Math.ceil(inventariosActualizados.length / inventariosPorPagina));
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

  const handleEditInventario = (inventario) => {
    setInventarioEditando(inventario);
    setNuevoInventario({
      productoId: inventario.id_producto,
      talla: inventario.talla,
      color: inventario.color,
      stock: inventario.stock
    });
    
    // Buscar el nombre del producto y establecerlo en el campo de búsqueda
    const productoSeleccionado = productos.find(p => p.id === inventario.id_producto);
    if (productoSeleccionado) {
      setProductoSearch(productoSeleccionado.nombre);
    }
  };

  const handleUpdateInventario = async (e) => {
    e.preventDefault();
    try {
      const response = await actualizarInventario(inventarioEditando.id, nuevoInventario);
      if (response.message) {
        setToastInfo({
          mostrar: true,
          mensaje: 'Inventario actualizado exitosamente',
          tipo: 'success'
        });
        setInventarioEditando(null);
        setNuevoInventario({
          productoId: '',
          talla: '',
          color: '',
          stock: ''
        });
        setProductoSearch('');
        const inventariosActualizados = await obtenerInventarios();
        setInventarios(inventariosActualizados);
        setInventariosFiltrados(inventariosActualizados);
        setTotalPaginas(Math.ceil(inventariosActualizados.length / inventariosPorPagina));
      }
    } catch (error) {
      console.error('Error al actualizar inventario:', error);
      setToastInfo({
        mostrar: true,
        mensaje: 'Error al actualizar inventario',
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

  return (
    <div className="container mt-4">
      <h1>Inventario</h1>
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

      <h2>Inventarios Existentes</h2>
      {cargando ? (
        <div className="cargando">Cargando inventarios...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : (
        <>
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
                    <button
                      className="btn btn-warning"
                      onClick={() => handleEditInventario(inventario)}
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
        </>
      )}

      <h2>{inventarioEditando ? 'Editar Inventario' : 'Agregar Inventario'}</h2>
      <form onSubmit={inventarioEditando ? handleUpdateInventario : handleSubmit}>
        <div className="form-group">
          <label htmlFor="productoId">Producto</label>
          <div className="custom-select-container" ref={selectRef}>
            <input
              type="text"
              className="form-control"
              placeholder="Buscar producto..."
              value={productoSearch}
              onChange={handleProductoSearchChange}
              onClick={() => !inventarioEditando && setShowProductoDropdown(true)}
              disabled={!!inventarioEditando}
            />
            {showProductoDropdown && !inventarioEditando && (
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
          <button type="submit" className="btn btn-primary">
            {inventarioEditando ? 'Actualizar Inventario' : 'Agregar Inventario'}
          </button>
          
          {inventarioEditando && (
            <button 
              type="button" 
              className="btn btn-secondary ml-2" 
              onClick={handleCancelEdit}
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      {/* Mostrar Toast de notificación */}
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