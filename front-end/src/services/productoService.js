const API_URL = 'http://88.15.26.49:8000/api';

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