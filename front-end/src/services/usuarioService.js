const API_URL = 'https://ohanatienda.ddns.net/api';

export const obtenerUsuarios = async () => {
  try {
    const response = await fetch(`${API_URL}/usuarios`);
    if (!response.ok) {
      throw new Error('Error al obtener usuarios');
    }
    return await response.json();
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

export const obtenerUsuarioPorId = async (id) => {
  try {
    const response = await fetch(`${API_URL}/usuarios/${id}`);
    if (!response.ok) {
      throw new Error('Error al obtener el usuario');
    }
    return await response.json();
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

export const obtenerTotalClientes = async () => {
  try {
    console.log('Solicitando total de clientes a:', `${API_URL}/usuarios/contar-clientes`);
    const response = await fetch(`${API_URL}/usuarios/contar-clientes`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error HTTP ${response.status}: ${errorText}`);
      throw new Error(`Error al obtener el total de clientes: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Datos recibidos:', data);
    return data.total_clientes;
  } catch (error) {
    console.error('Error al obtener total de clientes:', error);
    // Devolvemos 0 en lugar de propagar el error para que la aplicación no se rompa
    return 0;
  }
};