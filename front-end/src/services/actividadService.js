const API_URL = 'https://ohanatienda.ddns.net/api';

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