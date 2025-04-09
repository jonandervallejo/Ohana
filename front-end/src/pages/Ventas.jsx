import React, { useState, useEffect } from 'react';
import './css/Ventas.css';
import Toast from '../components/ui/Toast';
import ConfirmacionModal from '../components/ui/CofirmacionModal';
import api from '../services/estadisticaService';

const Ventas = () => {
  const [ventas, setVentas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [toastInfo, setToastInfo] = useState({
    mostrar: false,
    mensaje: '',
    tipo: 'success'
  });

  const [filtroProducto, setFiltroProducto] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroFechaInicio, setFiltroFechaInicio] = useState('');
  const [filtroFechaFin, setFiltroFechaFin] = useState('');
  
  const [paginaActual, setPaginaActual] = useState(1);
  const ventasPorPagina = 6;

  const [confirmDelete, setConfirmDelete] = useState({
    show: false,
    ventaId: null
  });

  const obtenerVentas = async () => {
    try {
      setCargando(true);
      const response = await api.get('/ventas');
      setVentas(response.data);
    } catch (error) {
      setError('Error al cargar las ventas: ' + (error.response?.data?.message || error.message));
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    obtenerVentas();
  }, []);
  
  useEffect(() => {
    setPaginaActual(1);
  }, [filtroProducto, filtroEstado, filtroFechaInicio, filtroFechaFin]);

  const formatearFecha = (fechaStr) => {
    try {
      if (!fechaStr || fechaStr === 'Sin fecha') {
        return 'Fecha no disponible';
      }

      if (typeof fechaStr === 'string' && fechaStr.includes('T')) {
        const [datePart, timePart] = fechaStr.split('T');
        const [year, month, day] = datePart.split('-');
        const [hours, minutes] = timePart.split(':').slice(0, 2);
        return `${day}/${month}/${year} | ${hours}:${minutes}`;
      }

      const fecha = new Date(fechaStr);
      if (isNaN(fecha.getTime())) {
        return 'Fecha no disponible';
      }

      const dia = fecha.getDate().toString().padStart(2, '0');
      const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
      const anio = fecha.getFullYear();
      const hora = fecha.getHours().toString().padStart(2, '0');
      const minutos = fecha.getMinutes().toString().padStart(2, '0');
      return `${dia}/${mes}/${anio} | ${hora}:${minutos}`;
    } catch {
      return 'Fecha no disponible';
    }
  };

  const fechaEnRango = (fechaVenta) => {
    if (!filtroFechaInicio && !filtroFechaFin) return true;
    
    try {
      const fechaStr = typeof fechaVenta === 'string' ? fechaVenta : fechaVenta.toISOString();
      const [datePart] = fechaStr.split('T');
      
      if (filtroFechaInicio && !filtroFechaFin) {
        return datePart >= filtroFechaInicio;
      }
      
      if (!filtroFechaInicio && filtroFechaFin) {
        return datePart <= filtroFechaFin;
      }
      
      return datePart >= filtroFechaInicio && datePart <= filtroFechaFin;
    } catch {
      return false;
    }
  };

  const calcularTotal = (productos) => {
    return productos.reduce((total, producto) => {
      return total + (Number(producto.precio_unitario) * producto.cantidad);
    }, 0).toFixed(2);
  };

  const handleCompletarVenta = async (id) => {
    try {
      await api.put(`/ventas/${id}/completar`);
      setToastInfo({
        mostrar: true,
        mensaje: `Venta #${id} completada exitosamente.`,
        tipo: 'success'
      });
      obtenerVentas();
    } catch (error) {
      setToastInfo({
        mostrar: true,
        mensaje: 'Error al completar la venta: ' + (error.response?.data?.error || error.message),
        tipo: 'error'
      });
    }
  };

  const handleCancelarVenta = async (id) => {
    try {
      await api.put(`/ventas/${id}/cancelar`);
      setToastInfo({
        mostrar: true,
        mensaje: `Venta #${id} cancelada exitosamente.`,
        tipo: 'success'
      });
      obtenerVentas();
    } catch (error) {
      setToastInfo({
        mostrar: true,
        mensaje: 'Error al cancelar la venta: ' + (error.response?.data?.error || error.message),
        tipo: 'error'
      });
    }
  };

  const confirmarEliminar = (id) => {
    setConfirmDelete({
      show: true,
      ventaId: id
    });
  };

  const cancelarEliminar = () => {
    setConfirmDelete({
      show: false,
      ventaId: null
    });
  };

  const handleEliminarVenta = async (id) => {
    try {
      await api.delete(`/ventas/${id}`);
      setVentas(ventas.filter(venta => venta.id !== id));
      setToastInfo({
        mostrar: true,
        mensaje: `Venta #${id} eliminada exitosamente.`,
        tipo: 'success'
      });
    } catch (error) {
      setToastInfo({
        mostrar: true,
        mensaje: 'Error al eliminar la venta: ' + (error.response?.data?.error || error.message),
        tipo: 'error'
      });
    }
  };

  const limpiarFiltroFecha = () => {
    setFiltroFechaInicio('');
    setFiltroFechaFin('');
  };
  
  const limpiarFiltros = () => {
    setFiltroProducto('');
    setFiltroEstado('');
    setFiltroFechaInicio('');
    setFiltroFechaFin('');
  };

  const ventasFiltradas = ventas.filter((venta) => {
    const coincideProducto = venta.productos.some(producto =>
      producto.nombre.toLowerCase().includes(filtroProducto.toLowerCase())
    );
    const coincideEstado = filtroEstado ? venta.estado === filtroEstado : true;
    const estaEnRangoFecha = fechaEnRango(venta.fecha);
    
    return coincideProducto && coincideEstado && estaEnRangoFecha;
  });
  
  const indiceUltimaVenta = paginaActual * ventasPorPagina;
  const indicePrimeraVenta = indiceUltimaVenta - ventasPorPagina;
  const ventasActuales = ventasFiltradas.slice(indicePrimeraVenta, indiceUltimaVenta);
  const totalPaginas = Math.ceil(ventasFiltradas.length / ventasPorPagina);
  
  const cambiarPagina = (numeroPagina) => {
    setPaginaActual(numeroPagina);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (cargando) {
    return (
      <div className="container ventas-container">
        <div className="spinner-container">
          <div className="spinner">
            <i className="fas fa-spinner fa-spin fa-3x"></i>
            <p className="mt-2">Cargando ventas...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container ventas-container">
        <div className="error-container">
          <i className="fas fa-exclamation-triangle"></i>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container ventas-container">
      {/* Header con título y botones de acción */}
      <div className="header-container">
        <h1 className="inventory-title">Gestión de Ventas</h1>
        <div className="header-actions">
          {/* Aquí podrías añadir botones de acción como "Nueva venta" */}
          {(filtroProducto || filtroEstado || filtroFechaInicio || filtroFechaFin) && (
            <button 
              className="btn-limpiar-todos"
              onClick={limpiarFiltros}
            >
              <i className="fas fa-times-circle"></i> Limpiar filtros
            </button>
          )}
        </div>
      </div>
      
      {/* Filtros separados debajo del título */}
      <div className="filtros-container">
        <div className="search-container">
          <input
            type="text"
            placeholder="Buscar por producto..."
            value={filtroProducto}
            onChange={(e) => setFiltroProducto(e.target.value)}
            className="search-input"
          />
          {filtroProducto && (
            <button
              className="clear-search"
              onClick={() => setFiltroProducto('')}
            >
              ×
            </button>
          )}
        </div>
        
        <div className="filtro-fecha-rango">
          <div className="fecha-rango-input">
            <label htmlFor="fecha-inicio">Desde:</label>
            <input
              id="fecha-inicio"
              type="date"
              value={filtroFechaInicio}
              onChange={(e) => setFiltroFechaInicio(e.target.value)}
              className="datepicker-input"
            />
          </div>
          
          <div className="fecha-rango-input">
            <label htmlFor="fecha-fin">Hasta:</label>
            <input
              id="fecha-fin"
              type="date"
              value={filtroFechaFin}
              onChange={(e) => setFiltroFechaFin(e.target.value)}
              className="datepicker-input"
            />
          </div>
          
          {(filtroFechaInicio || filtroFechaFin) && (
            <button 
              className="btn-limpiar-fecha" 
              onClick={limpiarFiltroFecha}
              title="Limpiar filtro de fechas"
            >
              <i className="fas fa-times-circle"></i>
            </button>
          )}
        </div>
        
        <div className="estado-filter">
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="estado-select"
          >
            <option value="">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="completada">Completada</option>
            <option value="cancelada">Cancelada</option>
          </select>
        </div>
      </div>

      <h2 className="ventas-subtitle">Listado de Ventas</h2>

      {ventasFiltradas.length === 0 ? (
        <div className="sin-ventas">
          <i className="fas fa-shopping-cart"></i>
          <p>No hay ventas registradas</p>
        </div>
      ) : (
        <>
          <div className="ventas-grid">
            {ventasActuales.map((venta) => (
              <div key={venta.id} className="venta-card">
                <div className="venta-header">
                  <button
                    className="btn-eliminar-fancy"
                    onClick={() => confirmarEliminar(venta.id)}
                    title="Eliminar venta"
                  >
                    <i className="fas fa-trash-alt"></i>
                  </button>
                  <h2>{venta.cliente.nombre} {venta.cliente.apellidos}</h2>
                  <span className="venta-fecha">
                    {formatearFecha(venta.fecha)}
                  </span>
                </div>

                <div className="venta-info">
                  <p className="venta-id"><strong>ID Venta:</strong> #{venta.id}</p>
                  <p className={`venta-estado ${venta.estado}`}>
                    <span className="estado-dot"></span>
                    {venta.estado.charAt(0).toUpperCase() + venta.estado.slice(1)}
                  </p>
                </div>

                <div className="productos-lista">
                  <h3>Productos</h3>
                  <table className="productos-tabla">
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th>Talla/Color</th>
                        <th>Cant.</th>
                        <th>Precio</th>
                        <th>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {venta.productos.map((producto, index) => (
                        <tr key={index}>
                          <td>{producto.nombre}</td>
                          <td>{producto.talla} / {producto.color}</td>
                          <td>{producto.cantidad}</td>
                          <td>{Number(producto.precio_unitario).toFixed(2)}€</td>
                          <td>{(Number(producto.precio_unitario) * producto.cantidad).toFixed(2)}€</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="venta-footer">
                  <div className="total-container">
                    <span>Total</span>
                    <span className="total-precio">{calcularTotal(venta.productos)}€</span>
                  </div>

                  {venta.estado === 'pendiente' && (
                    <div className="acciones-venta">
                      <button
                        className="btn-completar"
                        onClick={() => handleCompletarVenta(venta.id)}
                      >
                        <i className="fas fa-check-circle"></i> Completar venta
                      </button>
                      <button
                        className="btn-cancelar"
                        onClick={() => handleCancelarVenta(venta.id)}
                      >
                        <i className="fas fa-times-circle"></i> Cancelar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {totalPaginas > 1 && (
            <div className="paginacion">
              <button 
                onClick={() => cambiarPagina(paginaActual - 1)} 
                disabled={paginaActual === 1}
                className="btn-pagina"
                aria-label="Página anterior"
              >
                <i className="fas fa-chevron-left"></i>
              </button>
              
              {[...Array(totalPaginas).keys()].map(num => {
                const pageNum = num + 1;
                
                if (
                  pageNum === 1 || 
                  pageNum === totalPaginas ||
                  (pageNum >= paginaActual - 1 && pageNum <= paginaActual + 1) ||
                  (paginaActual <= 3 && pageNum <= 5) ||
                  (paginaActual >= totalPaginas - 2 && pageNum >= totalPaginas - 4)
                ) {
                  return (
                    <button 
                      key={pageNum} 
                      onClick={() => cambiarPagina(pageNum)}
                      className={`btn-pagina ${paginaActual === pageNum ? 'active' : ''}`}
                      aria-label={`Página ${pageNum}`}
                      aria-current={paginaActual === pageNum ? "page" : undefined}
                    >
                      {pageNum}
                    </button>
                  );
                }
                
                if (
                  (pageNum === 2 && paginaActual > 4) ||
                  (pageNum === totalPaginas - 1 && paginaActual < totalPaginas - 3)
                ) {
                  return <span key={`ellipsis-${pageNum}`} className="pagina-ellipsis">...</span>;
                }
                
                return null;
              })}
              
              <button 
                onClick={() => cambiarPagina(paginaActual + 1)} 
                disabled={paginaActual === totalPaginas}
                className="btn-pagina"
                aria-label="Página siguiente"
              >
                <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          )}
          
          <div className="paginacion-info">
            Mostrando {indicePrimeraVenta + 1} - {Math.min(indiceUltimaVenta, ventasFiltradas.length)} de {ventasFiltradas.length} ventas
          </div>
        </>
      )}

      {confirmDelete.show && (
        <ConfirmacionModal 
          titulo="Eliminar venta"
          mensaje={`¿Estás seguro de que deseas eliminar la venta #${confirmDelete.ventaId}?`}
          onConfirm={() => {
            handleEliminarVenta(confirmDelete.ventaId);
            cancelarEliminar();
          }}
          onCancel={cancelarEliminar}
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

export default Ventas;