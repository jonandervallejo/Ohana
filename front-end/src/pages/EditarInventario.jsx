import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { obtenerInventarios, actualizarInventario } from '../services/productoService';
import Toast from '../components/ui/Toast';
import './css/Inventario.css';

const EditarInventario = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [inventario, setInventario] = useState(null);
  const [formData, setFormData] = useState({
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
    const cargarInventario = async () => {
      try {
        setCargando(true);
        const inventarios = await obtenerInventarios();
        const inventarioEncontrado = inventarios.find(inv => inv.id === parseInt(id));
        
        if (inventarioEncontrado) {
          setInventario(inventarioEncontrado);
          setFormData({
            talla: inventarioEncontrado.talla,
            color: inventarioEncontrado.color,
            stock: inventarioEncontrado.stock
          });
        } else {
          setError('Inventario no encontrado');
        }
      } catch (err) {
        setError('Error al cargar el inventario');
        console.error(err);
      } finally {
        setCargando(false);
      }
    };

    cargarInventario();
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await actualizarInventario(id, formData);
      if (response.message) {
        setToastInfo({
          mostrar: true,
          mensaje: 'Inventario actualizado exitosamente',
          tipo: 'success'
        });
        
        // Esperar antes de redirigir
        setTimeout(() => {
          navigate('/inventario');
        }, 2000);
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

  if (cargando) return <div className="container mt-4"><div className="cargando">Cargando inventario...</div></div>;
  if (error) return <div className="container mt-4"><div className="error">{error}</div></div>;
  if (!inventario) return <div className="container mt-4"><div className="error">Inventario no encontrado</div></div>;

  return (
    <div className="container mt-4">
      {/* Header con título y botón de volver */}
      <div className="header-container">
        <h1 className="inventory-title">Editar Inventario</h1>
        <Link to="/inventario" className="volver-btn btn btn-secondary">
          <i className="fas fa-arrow-left"></i> Volver
        </Link>
      </div>

      <div className="producto-info">
        <h3>{inventario.producto.nombre}</h3>
        <p className="text-muted">{inventario.producto.categoria?.nombre}</p>
      </div>

      <form id="editar-inventario-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="talla">Talla</label>
          <input
            type="text"
            id="talla"
            name="talla"
            value={formData.talla}
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
            value={formData.color}
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
            value={formData.stock}
            onChange={handleInputChange}
            className="form-control"
            required
          />
        </div>
        <div className="form-buttons">
          <button type="submit" className="btn btn-primary btn-block">
            Actualizar Inventario
          </button>
          <button 
            type="button" 
            className="btn btn-secondary btn-block mt-2" 
            onClick={() => navigate('/inventario')}
          >
            Cancelar
          </button>
        </div>
      </form>

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

export default EditarInventario;