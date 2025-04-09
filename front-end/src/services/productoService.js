import axios from 'axios';

const API_URL = 'http://88.15.46.106:8000/api';

// Función para obtener el token de autenticación
const getAuthToken = () => {
  return localStorage.getItem('token');
};

export const obtenerProductos = async (params = {}) => {
  try {
    console.log('Enviando filtros a la API de productos:', params);
    
    // Asegurarnos de enviar fechas correctamente
    let formattedParams = { ...params };
    
    // Eliminamos parámetros vacíos
    Object.keys(formattedParams).forEach(key => {
      if (formattedParams[key] === '' || formattedParams[key] === null || formattedParams[key] === undefined) {
        delete formattedParams[key];
      }
    });
    
    console.log('Parámetros formateados:', formattedParams);
    
    const response = await axios.get(`${API_URL}/productos`, { 
      params: formattedParams,
      // Asegurarnos de que los parámetros se serialicen correctamente
      paramsSerializer: params => {
        return Object.entries(params)
          .filter(([_, value]) => value !== null && value !== undefined && value !== '')
          .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
          .join('&');
      },
      headers: {
        'Accept': 'application/json',
      }
    });
    console.log('Respuesta recibida de la API:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error al obtener productos:', error);
    console.error('Detalles del error:', error.response?.data || 'No hay detalles adicionales');
    throw error;
  }
};

export const obtenerTodosLosProductos = async () => {
  try {
    const response = await axios.get(`${API_URL}/productos`);
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error('Error al obtener todos los productos:', error);
    throw error;
  }
};

export const obtenerProductosPorCategoria = async (categoriaId, params = {}) => {
  try {
    console.log('Enviando filtros a la API para categoría:', categoriaId, params);
    
    // Asegurarnos de enviar fechas correctamente
    let formattedParams = { ...params };
    
    // Eliminamos parámetros vacíos
    Object.keys(formattedParams).forEach(key => {
      if (formattedParams[key] === '' || formattedParams[key] === null || formattedParams[key] === undefined) {
        delete formattedParams[key];
      }
    });
    
    console.log('Parámetros formateados para categoría:', formattedParams);
    
    const response = await axios.get(`${API_URL}/productos/categoria/${categoriaId}`, {
      params: formattedParams,
      // Asegurarnos de que los parámetros se serialicen correctamente
      paramsSerializer: params => {
        return Object.entries(params)
          .filter(([_, value]) => value !== null && value !== undefined && value !== '')
          .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
          .join('&');
      },
      headers: {
        'Accept': 'application/json',
      }
    });
    console.log('Respuesta recibida para categoría:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error al obtener productos por categoría:', error);
    console.error('Detalles del error:', error.response?.data || 'No hay detalles adicionales');
    throw error;
  }
};

export const obtenerProductoPorId = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/productos/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener producto por ID:', error);
    throw error;
  }
};

export const crearProducto = async (datosProducto) => {
  const token = getAuthToken();
  
  try {
    const response = await axios.post(`${API_URL}/productos`, datosProducto, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error al crear producto:', error);
    throw error;
  }
};

export const actualizarProducto = async (id, datosProducto) => {
  const token = getAuthToken();
  
  try {
    const response = await axios.put(`${API_URL}/productos/${id}`, datosProducto, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    throw error;
  }
};

export const eliminarProducto = async (id) => {
  const token = getAuthToken();
  
  try {
    const response = await axios.delete(`${API_URL}/productos/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    throw error;
  }
};

export const obtenerProductosConStock = async () => {
  try {
    const token = getAuthToken();
    const response = await axios.get(`${API_URL}/productos`, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Accept': 'application/json',
      }
    });
    // Asegurar que siempre devuelve un array
    if (Array.isArray(response.data)) {
      return response.data;
    } else if (response.data && Array.isArray(response.data.data)) {
      return response.data.data;
    } else {
      console.warn('La respuesta no contiene un array de productos:', response.data);
      return [];
    }
  } catch (error) {
    console.error('Error al obtener productos con stock:', error);
    console.error('Detalles del error:', error.response?.data || 'No hay detalles adicionales');
    return [];
  }
};

export const obtenerInventarios = async () => {
  try {
    const response = await axios.get(`${API_URL}/inventarios`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener inventarios:', error);
    throw error;
  }
};

export const actualizarInventario = async (id, inventario) => {
  try {
    const token = getAuthToken();
    const response = await axios.put(`${API_URL}/inventarios/${id}`, inventario, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error al actualizar inventario:', error);
    throw error;
  }
};

export const eliminarInventario = async (id) => {
  const token = getAuthToken();
  
  try {
    const response = await axios.delete(`${API_URL}/stock/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error al eliminar inventario:', error);
    throw error;
  }
};