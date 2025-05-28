import axios from 'axios';

const API_URL = 'https://ohanatienda.ddns.net/api';

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
    console.log('Obteniendo todos los productos...');
    
    // Primer paso: solicitar información de paginación para saber cuántos productos hay en total
    const infoResponse = await axios.get(`${API_URL}/productos`, {
      params: { per_page: 1 }
    });
    
    let totalProductos = 1000; // Valor por defecto alto
    
    // Extraer el total de productos si está disponible
    if (infoResponse.data && infoResponse.data.total) {
      totalProductos = infoResponse.data.total;
      console.log(`Total de productos en el sistema según API: ${totalProductos}`);
    }
    
    // Segundo paso: solicitar todos los productos de una vez
    const response = await axios.get(`${API_URL}/productos`, {
      params: {
        per_page: totalProductos + 50, // Añadir margen por si se crearon nuevos productos
        page: 1
      }
    });
    
    // Verificar el formato de la respuesta
    if (response.data && response.data.data && Array.isArray(response.data.data)) {
      console.log(`Productos cargados: ${response.data.data.length} de ${response.data.total}`);
      return response.data.data;
    } 
    // Si la respuesta es un array directamente
    else if (Array.isArray(response.data)) {
      console.log(`Productos cargados (formato directo): ${response.data.length}`);
      return response.data;
    }
    
    console.warn('La respuesta no contiene un array de productos:', response.data);
    
    // Intentar recuperar datos de manera alternativa
    return await obtenerTodosLosProductosAlternativo();
    
  } catch (error) {
    console.error('Error al obtener todos los productos:', error);
    console.error('Detalles del error:', error.response?.data || 'No hay detalles adicionales');
    
    // Intentar el método alternativo
    return await obtenerTodosLosProductosAlternativo();
  }
};

// Método alternativo para obtener todos los productos en caso de fallo
async function obtenerTodosLosProductosAlternativo() {
  try {
    console.log('Usando método alternativo para obtener productos...');
    // Intentar obtener productos en múltiples páginas
    let todosLosProductos = [];
    let page = 1;
    let hayMasProductos = true;
    const perPage = 100;
    
    while (hayMasProductos) {
      console.log(`Obteniendo página ${page} con ${perPage} productos por página...`);
      
      const pageResponse = await axios.get(`${API_URL}/productos`, {
        params: {
          per_page: perPage,
          page: page
        }
      });
      
      let productosEnPagina = [];
      
      if (pageResponse.data && Array.isArray(pageResponse.data.data)) {
        productosEnPagina = pageResponse.data.data;
      } else if (Array.isArray(pageResponse.data)) {
        productosEnPagina = pageResponse.data;
      }
      
      if (productosEnPagina.length === 0) {
        hayMasProductos = false;
        console.log('No hay más productos disponibles.');
      } else {
        console.log(`Obtenidos ${productosEnPagina.length} productos en la página ${page}`);
        todosLosProductos = [...todosLosProductos, ...productosEnPagina];
        page++;
      }
      
      // Si obtenemos menos que el máximo por página, ya no hay más
      if (productosEnPagina.length < perPage) {
        hayMasProductos = false;
      }
      
      // Evitar bucles infinitos o demasiadas peticiones
      if (page > 20) {
        console.warn('Demasiadas páginas, deteniendo obtención de productos.');
        hayMasProductos = false;
      }
    }
    
    console.log(`Total de productos obtenidos con método alternativo: ${todosLosProductos.length}`);
    return todosLosProductos;
  } catch (error) {
    console.error('También falló el método alternativo:', error);
    return [];
  }
}

export const obtenerProductosPorCategoria = async (categoriaId, params = {}) => {
  try {
    console.log('Obteniendo todos los productos para la categoría:', categoriaId);
    
    // Primer paso: solicitar información de paginación para saber cuántos productos hay en la categoría
    const infoResponse = await axios.get(`${API_URL}/productos/categoria/${categoriaId}`, {
      params: { per_page: 1, ...params }
    });
    
    let totalProductos = 1000; // Valor por defecto alto
    
    // Extraer el total de productos si está disponible
    if (infoResponse.data && infoResponse.data.total) {
      totalProductos = infoResponse.data.total;
      console.log(`Total de productos en la categoría ${categoriaId}: ${totalProductos}`);
    }
    
    // Segundo paso: solicitar todos los productos de la categoría de una vez
    const response = await axios.get(`${API_URL}/productos/categoria/${categoriaId}`, {
      params: {
        ...params,
        per_page: totalProductos + 50, // Añadir margen por si se crearon nuevos productos
        page: 1
      },
      headers: {
        'Accept': 'application/json',
      }
    });
    
    // Verificar el formato de la respuesta
    if (response.data && response.data.data && Array.isArray(response.data.data)) {
      console.log(`Productos cargados para categoría ${categoriaId}: ${response.data.data.length} de ${response.data.total}`);
      return response.data.data;
    } 
    // Si la respuesta es un array directamente
    else if (Array.isArray(response.data)) {
      console.log(`Productos cargados para categoría ${categoriaId} (formato directo): ${response.data.length}`);
      return response.data;
    }
    
    console.warn(`La respuesta para categoría ${categoriaId} no contiene un array de productos:`, response.data);
    
    // Intentar recuperar datos de manera alternativa
    return await obtenerProductosPorCategoriaAlternativo(categoriaId, params);
    
  } catch (error) {
    console.error(`Error al obtener productos para la categoría ${categoriaId}:`, error);
    console.error('Detalles del error:', error.response?.data || 'No hay detalles adicionales');
    
    // Intentar el método alternativo
    return await obtenerProductosPorCategoriaAlternativo(categoriaId, params);
  }
};

// Método alternativo para obtener todos los productos de una categoría en caso de fallo
async function obtenerProductosPorCategoriaAlternativo(categoriaId, params = {}) {
  try {
    console.log(`Usando método alternativo para obtener productos de categoría ${categoriaId}...`);
    // Intentar obtener productos en múltiples páginas
    let todosLosProductos = [];
    let page = 1;
    let hayMasProductos = true;
    const perPage = 100;
    
    while (hayMasProductos) {
      console.log(`Obteniendo página ${page} con ${perPage} productos por página para categoría ${categoriaId}...`);
      
      const pageResponse = await axios.get(`${API_URL}/productos/categoria/${categoriaId}`, {
        params: {
          ...params,
          per_page: perPage,
          page: page
        },
        headers: {
          'Accept': 'application/json',
        }
      });
      
      let productosEnPagina = [];
      
      if (pageResponse.data && Array.isArray(pageResponse.data.data)) {
        productosEnPagina = pageResponse.data.data;
      } else if (Array.isArray(pageResponse.data)) {
        productosEnPagina = pageResponse.data;
      }
      
      if (productosEnPagina.length === 0) {
        hayMasProductos = false;
        console.log(`No hay más productos disponibles para categoría ${categoriaId}.`);
      } else {
        console.log(`Obtenidos ${productosEnPagina.length} productos en la página ${page} para categoría ${categoriaId}`);
        todosLosProductos = [...todosLosProductos, ...productosEnPagina];
        page++;
      }
      
      // Si obtenemos menos que el máximo por página, ya no hay más
      if (productosEnPagina.length < perPage) {
        hayMasProductos = false;
      }
      
      // Evitar bucles infinitos o demasiadas peticiones
      if (page > 20) {
        console.warn(`Demasiadas páginas para categoría ${categoriaId}, deteniendo obtención de productos.`);
        hayMasProductos = false;
      }
    }
    
    console.log(`Total de productos obtenidos con método alternativo para categoría ${categoriaId}: ${todosLosProductos.length}`);
    return todosLosProductos;
  } catch (error) {
    console.error(`También falló el método alternativo para categoría ${categoriaId}:`, error);
    return [];
  }
}

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