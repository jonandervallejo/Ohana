const API_URL = 'https://ohanatienda.ddns.net/api';

export const obtenerPedidosPendientes = async () => {
  try {
    // Verificamos si hay conectividad
    if (!navigator.onLine) {
      console.error('No hay conexión a internet');
      return 0;
    }
    
    // Agregamos un timeout para la petición
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 segundos de timeout
    
    const response = await fetch(`${API_URL}/pedidos-pendientes`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      mode: 'cors', // Explícitamente indicamos que es una petición CORS
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Error en la petición: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('La petición ha excedido el tiempo de espera');
      return 0; // Devolvemos 0 como valor por defecto
    }
    console.error('Error al obtener pedidos pendientes:', error);
    return 0; // Devolvemos 0 como valor por defecto en caso de error
  }
};