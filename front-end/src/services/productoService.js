const API_URL = 'http://88.15.26.49:8000/api';

// Función para obtener el token de autenticación
const getAuthToken = () => {
  return localStorage.getItem('token');
};

export const obtenerProductos = async () => {
  try {
    const response = await fetch(`${API_URL}/productos`);
    if (!response.ok) {
      throw new Error('Error al obtener productos');
    }
    return await response.json();
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

export const obtenerProductoPorId = async (id) => {
  try {
    const response = await fetch(`${API_URL}/productos/${id}`);
    if (!response.ok) {
      throw new Error('Error al obtener el producto');
    }
    return await response.json();
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

export const obtenerProductosPorCategoria = async (idCategoria) => {
  try {
    const response = await fetch(`${API_URL}/productos/categoria/${idCategoria}`);
    if (!response.ok) {
      throw new Error('Error al obtener productos por categoría');
    }
    return await response.json();
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

export const crearProducto = async (datosProducto) => {
  const token = getAuthToken();
  
  try {
    const response = await fetch(`${API_URL}/productos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(datosProducto)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al crear el producto');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

export const actualizarProducto = async (id, datosProducto) => {
  const token = getAuthToken();
  
  try {
    const response = await fetch(`${API_URL}/productos/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(datosProducto)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al actualizar el producto');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

export const eliminarProducto = async (id) => {
  const token = getAuthToken();
  
  try {
    const response = await fetch(`${API_URL}/productos/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al eliminar el producto');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};