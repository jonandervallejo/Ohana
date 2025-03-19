import React, { useState, useEffect } from 'react';
import { obtenerProductos } from '../services/productoService';
import { obtenerTotalClientes } from '../services/usuarioService';
import { obtenerVentasHoy } from '../services/estadisticaService';
import { obtenerActividadReciente } from '../services/actividadService';
import { obtenerPedidosPendientes } from '../services/compraService';
import './css/Inicio.css';

const Inicio = () => {
  const [productos, setProductos] = useState([]);
  const [totalClientes, setTotalClientes] = useState(0);
  const [ventasHoy, setVentasHoy] = useState(0);
  const [actividades, setActividades] = useState([]);
  const [pedidosPendientes, setPedidosPendientes] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [cargandoActividad, setCargandoActividad] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setCargando(true);
        
        // Cargamos los datos por separado para que un error no afecte al otro
        let productosData = [];
        try {
          productosData = await obtenerProductos();
          setProductos(productosData);
        } catch (err) {
          console.error('Error al cargar productos:', err);
        }
        
        try {
          const totalClientesData = await obtenerTotalClientes();
          setTotalClientes(totalClientesData);
        } catch (err) {
          console.error('Error al cargar total de clientes:', err);
        }
        
        try {
          const ventasHoyData = await obtenerVentasHoy();
          setVentasHoy(ventasHoyData);
        } catch (err) {
          console.error('Error al cargar ventas de hoy:', err);
        }

        try {
          const pedidosPendientesData = await obtenerPedidosPendientes();
          setPedidosPendientes(pedidosPendientesData);
        } catch (err) {
          console.error('Error al cargar pedidos pendientes:', err);
        }
        
      } catch (err) {
        setError('Error al cargar los datos');
        console.error(err);
      } finally {
        setCargando(false);
      }
    };

    const cargarActividad = async () => {
      try {
        setCargandoActividad(true);
        const actividadData = await obtenerActividadReciente();
        setActividades(actividadData);
      } catch (err) {
        console.error('Error al cargar actividad reciente:', err);
      } finally {
        setCargandoActividad(false);
      }
    };

    cargarDatos();
    cargarActividad();
  }, []);

  // Función para formatear el precio
  const formatearPrecio = (precio) => {
    return `€${parseFloat(precio).toFixed(2)}`;
  };

  return (
    <div className="inicio-page">
      <h1>Panel de Control</h1>
      
      <div className="dashboard-summary">
        <div className="summary-card">
          <h3>Total Productos</h3>
          <p className="summary-value">{cargando ? 'Cargando...' : error ? 'Error' : productos.length}</p>
        </div>
        
        <div className="summary-card">
          <h3>Ventas Hoy</h3>
          <p className="summary-value">{cargando ? 'Cargando...' : error ? 'Error' : formatearPrecio(ventasHoy)}</p>
        </div>
        
        <div className="summary-card">
          <h3>Clientes</h3>
          <p className="summary-value">{cargando ? 'Cargando...' : error ? 'Error' : totalClientes}</p>
        </div>
        
        <div className="summary-card">
          <h3>Pedidos Pendientes</h3>
          <p className="summary-value">{cargando ? 'Cargando...' : error ? 'Error' : pedidosPendientes}</p>
        </div>
      </div>
      
      <div className="recent-activity">
        <h2>Actividad Reciente</h2>
        {cargandoActividad ? (
          <p>Cargando actividad reciente...</p>
        ) : (
          <ul className="activity-list">
            {actividades.length > 0 ? (
              actividades.map((actividad, index) => (
                <li key={index} className={`activity-item activity-${actividad.tipo}`}>
                  <span className="activity-time">{actividad.tiempo_formateado}</span>
                  <span className="activity-desc">{actividad.descripcion}</span>
                </li>
              ))
            ) : (
              <li className="activity-item">
                <span className="activity-desc">No hay actividad reciente</span>
              </li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Inicio;