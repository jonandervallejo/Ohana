import axios from 'axios';

// Base API URL for all requests
const API_URL = 'http://88.15.46.106:8000/api';

// Create an axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 10000 // 10 seconds timeout
});

// Add a response interceptor for general error handling
api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Estadísticas methods
export const obtenerVentasHoy = async () => {
  try {
    const response = await api.get('/estadisticas/ventas-hoy');
    return response.data.total_ventas;
  } catch (error) {
    console.error('Error al obtener ventas del día:', error);
    return 0; // Default value in case of error
  }
};

// Ventas methods
export const obtenerVentas = async () => {
  const response = await api.get('/ventas');
  return response.data;
};

export const completarVenta = async (id) => {
  const response = await api.put(`/ventas/${id}/completar`);
  return response.data;
};

export const cancelarVenta = async (id) => {
  const response = await api.put(`/ventas/${id}/cancelar`);
  return response.data;
};

export const obtenerDetallesVenta = async (id) => {
  const response = await api.get(`/ventas/${id}`);
  return response.data;
};

export const obtenerEstadisticasVentas = async () => {
  const response = await api.get('/ventas-estadisticas');
  return response.data;
};

// Export the axios instance as default for general use
export default api;