const API_URL = 'http://88.15.26.49:8000/api';

export const obtenerActividadReciente = async () => {
  try {
    const response = await fetch(`${API_URL}/actividad-reciente`);
    if (!response.ok) {
      throw new Error('Error al obtener actividad reciente');
    }
    return await response.json();
  } catch (error) {
    console.error('Error:', error);
    // Devolvemos un array vacío en caso de error
    return [];
  }
};