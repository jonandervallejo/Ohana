const API_URL = 'http://88.15.26.49:8000/api';

export const obtenerVentasHoy = async () => {
  try {
    const response = await fetch(`${API_URL}/estadisticas/ventas-hoy`);
    if (!response.ok) {
      throw new Error('Error al obtener ventas del día');
    }
    const data = await response.json();
    return data.total_ventas;
  } catch (error) {
    console.error('Error:', error);
    return 0; // Valor por defecto en caso de error
  }
};