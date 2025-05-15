import axios from 'axios';
import { API_URL } from '../config/config';

// Crear instancia de axios con la URL base en HTTPS
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para asegurar que todas las URLs son HTTPS
api.interceptors.request.use(config => {
  // Si la URL comienza con HTTP, convertirla a HTTPS
  if (config.url && typeof config.url === 'string') {
    // Asegurar que estamos usando la baseURL correcta
    if (!config.url.startsWith('http')) {
      return config;
    }
    
    // Convertir a HTTPS si es necesario
    if (config.url.startsWith('http:')) {
      config.url = config.url.replace('http:', 'https:');
    }
  }
  
  return config;
});

export default api;