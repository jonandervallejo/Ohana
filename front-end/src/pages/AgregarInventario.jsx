import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { obtenerProductosConStock } from '../services/productoService';
import Toast from '../components/ui/Toast'; // Importar el componente Toast
import './css/Inventario.css';

const API_URL = 'http://88.15.26.49:8000/api';

const AgregarInventario = () => {
  const [productos, setProductos] = useState([]);
  const [nuevoInventario, setNuevoInventario] = useState({
    productoId: '',
    talla: '',
    color: '',
    stock: ''
  });

  // Estado para el toast
  const [toastInfo, setToastInfo] = useState({
    mostrar: false,
    mensaje: '',
    tipo: 'success'
  });

  useEffect(() => {
    const cargarProductos = async () => {
      try {
        const response = await obtenerProductosConStock();
        if (response) {
          setProductos(response);
        } else {
          setProductos([]);
        }
      } catch (err) {
        console.error('Error al cargar los productos', err);
      }
    };

    cargarProductos();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNuevoInventario({
      ...nuevoInventario,
      [name]: value
    });
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
      }
    } catch (error) {
      console.error('Error al crear inventario', error);
      setToastInfo({
        mostrar: true,
        mensaje: 'Error al crear inventario',
        tipo: 'error'
      });
    }
  };

  return (
    <div className="container mt-4">
      <h1>Agregar Inventario</h1>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="productoId">Producto</label>
          <select
            id="productoId"
            name="productoId"
            value={nuevoInventario.productoId}
            onChange={handleInputChange}
            className="form-control"
            required
          >
            <option value="">Selecciona un producto</option>
            {productos.map(producto => (
              <option key={producto.id} value={producto.id}>
                {producto.nombre}
              </option>
            ))}
          </select>
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
        <button type="submit" className="btn btn-primary">Agregar Inventario</button>
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

export default AgregarInventario;