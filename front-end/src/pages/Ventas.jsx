import React, { useState, useEffect } from 'react';
import './css/Ventas.css';
import Toast from '../components/ui/Toast';
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
  
  // Estado para la confirmación modal
  const [confirmDelete, setConfirmDelete] = useState({
    show: false,
    ventaId: null
  });

  const obtenerVentas = async () => {
    try {
      setCargando(true);
      // Use the api instance with the correct base URL
      const response = await api.get('/ventas');
      console.log('Datos de ventas recibidos:', response.data);
      setVentas(response.data);
    } catch (error) {
      setError('Error al cargar las ventas: ' + (error.response?.data?.message || error.message));
      console.error('Error completo:', error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    obtenerVentas();
  }, []);

  // Función para formatear fecha mejorada para preservar la hora original
  const formatearFecha = (fechaStr) => {
    try {
      // Verificar si existe la fecha o si es "Sin fecha"
      if (!fechaStr || fechaStr === 'Sin fecha') {
        console.error('Fecha no proporcionada o inválida');
        return 'Fecha no disponible';
      }
      
      // Si ya tiene formato MySQL "YYYY-MM-DD HH:MM:SS" (como lo envía el backend)
      if (typeof fechaStr === 'string' && fechaStr.includes(' ') && fechaStr.includes('-') && fechaStr.includes(':')) {
        const [datePart, timePart] = fechaStr.split(' ');
        const [year, month, day] = datePart.split('-');
        const [hours, minutes] = timePart.split(':').slice(0, 2); // Ignorar segundos
        return `${day}/${month}/${year} | ${hours}:${minutes}`;
      }
      
      // Si tiene formato ISO con T (2023-09-20T14:23:00)
      if (typeof fechaStr === 'string' && fechaStr.includes('T')) {
        const [datePart, timePart] = fechaStr.split('T');
        const [year, month, day] = datePart.split('-');
        const [hours, minutes] = timePart.split(':').slice(0, 2); // Ignorar segundos
        return `${day}/${month}/${year} | ${hours}:${minutes}`;
      }
      
      // IMPORTANTE: No crear un objeto Date si se puede evitar
      // porque eso es lo que causa que la hora se actualice
      if (typeof fechaStr === 'string') {
        console.error('Formato de fecha no reconocido:', fechaStr);
        return 'Fecha no disponible';
      }
      
      // Último recurso - usar objeto Date
      const fecha = new Date(fechaStr);
      
      // Verificar si la fecha es válida
      if (isNaN(fecha.getTime())) {
        console.error('Fecha inválida:', fechaStr);
        return 'Fecha no disponible';
      }
      
      // Formatear día, mes y año
      const dia = fecha.getDate().toString().padStart(2, '0');
      const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
      const anio = fecha.getFullYear();
      
      // Formatear hora y minutos
      const hora = fecha.getHours().toString().padStart(2, '0');
      const minutos = fecha.getMinutes().toString().padStart(2, '0');
      
      // Devolver formato: DD/MM/YYYY | HH:MM
      return `${dia}/${mes}/${anio} | ${hora}:${minutos}`;
    } catch (error) {
      console.error('Error al formatear fecha:', error, 'para fecha:', fechaStr);
      return 'Fecha no disponible';
    }
  };

  // Calcular el precio total de una venta - Convert to Number before multiplication
  const calcularTotal = (productos) => {
    return productos.reduce((total, producto) => {
      return total + (Number(producto.precio_unitario) * producto.cantidad);
    }, 0).toFixed(2);
  };

  // Función para completar venta en el ámbito del componente
  const handleCompletarVenta = async (id) => {
    try {
      const response = await api.put(`/ventas/${id}/completar`);
      setToastInfo({
        mostrar: true,
        mensaje: `Venta #${id} completada exitosamente. Stock actualizado.`,
        tipo: 'success'
      });
      console.log("Stock actualizado:", response.data.stock_actualizado);
      // Recargar las ventas
      obtenerVentas();
    } catch (error) {
      console.error('Error al completar la venta:', error);
      setToastInfo({
        mostrar: true,
        mensaje: 'Error al completar la venta: ' + (error.response?.data?.error || error.message),
        tipo: 'error'
      });
    }
  };

  // Función para cancelar venta en el ámbito del componente
  const handleCancelarVenta = async (id) => {
    try {
      const response = await api.put(`/ventas/${id}/cancelar`);
      setToastInfo({
        mostrar: true,
        mensaje: `Venta #${id} cancelada exitosamente.`,
        tipo: 'success'
      });
      // Recargar las ventas
      obtenerVentas();
    } catch (error) {
      console.error('Error al cancelar la venta:', error);
      setToastInfo({
        mostrar: true,
        mensaje: 'Error al cancelar la venta: ' + (error.response?.data?.error || error.message),
        tipo: 'error'
      });
    }
  };
  
  // Función para manejar la confirmación
  const confirmarEliminar = (id) => {
    setConfirmDelete({
      show: true,
      ventaId: id
    });
  };

  // Función para cancelar la eliminación
  const cancelarEliminar = () => {
    setConfirmDelete({
      show: false,
      ventaId: null
    });
  };

  // Función para confirmar la eliminación
  const confirmarEliminacion = () => {
    if (confirmDelete.ventaId) {
      handleEliminarVenta(confirmDelete.ventaId);
      setConfirmDelete({
        show: false,
        ventaId: null
      });
    }
  };

  // Función para eliminar venta (nueva)
  const handleEliminarVenta = async (id) => {
    try {
      await api.delete(`/ventas/${id}`);
      
      // Actualizamos primero el estado local para una UI más responsive
      setVentas(ventas.filter(venta => venta.id !== id));
      
      // Mostramos el toast de éxito
      setToastInfo({
        mostrar: true,
        mensaje: `Venta #${id} eliminada exitosamente.`,
        tipo: 'success'
      });
      
      // Recargamos las ventas para asegurar sincronización con el servidor
      obtenerVentas();
    } catch (error) {
      console.error('Error al eliminar la venta:', error);
      setToastInfo({
        mostrar: true,
        mensaje: 'Error al eliminar la venta: ' + (error.response?.data?.error || error.message),
        tipo: 'error'
      });
    }
  };

  if (cargando) {
    return (
      <div className="container mt-4 text-center">
        <div className="spinner">
          <i className="fas fa-spinner fa-spin fa-3x"></i>
          <p className="mt-2">Cargando ventas...</p>
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
    <div className="container ventas-container">
      <h1 className="ventas-titulo">Registro de Ventas</h1>
      
      {ventas.length === 0 ? (
        <div className="sin-ventas">
          <i className="fas fa-shopping-cart"></i>
          <p>No hay ventas registradas</p>
        </div>
      ) : (
        <div className="ventas-grid">
          {ventas.map((venta) => (
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
      )}
      
      {confirmDelete.show && (
        <div className="modal-overlay">
          <div className="modal-confirm">
            <h3>Confirmar eliminación</h3>
            <p>¿Estás seguro de que deseas eliminar la venta #{confirmDelete.ventaId}?</p>
            <div className="modal-actions">
              <button className="btn-cancelar" onClick={cancelarEliminar}>
                Cancelar
              </button>
              <button className="btn-eliminar" onClick={confirmarEliminacion}>
                Eliminar
              </button>
            </div>
          </div>
        </div>
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