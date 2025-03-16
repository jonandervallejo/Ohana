import React from 'react';
import './css/Inicio.css';

const Inicio = () => {
  return (
    <div className="inicio-page">
      <h1>Panel de Control</h1>
      
      <div className="dashboard-summary">
        <div className="summary-card">
          <h3>Total Productos</h3>
          <p className="summary-value">120</p>
        </div>
        
        <div className="summary-card">
          <h3>Ventas Hoy</h3>
          <p className="summary-value">€1,250</p>
        </div>
        
        <div className="summary-card">
          <h3>Clientes</h3>
          <p className="summary-value">45</p>
        </div>
        
        <div className="summary-card">
          <h3>Pedidos Pendientes</h3>
          <p className="summary-value">8</p>
        </div>
      </div>
      
      <div className="recent-activity">
        <h2>Actividad Reciente</h2>
        <ul className="activity-list">
          <li className="activity-item">
            <span className="activity-time">10:45</span>
            <span className="activity-desc">Nueva venta - €78.50</span>
          </li>
          <li className="activity-item">
            <span className="activity-time">09:30</span>
            <span className="activity-desc">Producto actualizado - Camiseta Verano</span>
          </li>
          <li className="activity-item">
            <span className="activity-time">08:15</span>
            <span className="activity-desc">Nuevo pedido #1082</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Inicio;