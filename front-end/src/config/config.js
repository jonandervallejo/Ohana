/**
 * Configuración global de la aplicación
 */

// URLs base - usar HTTPS
export const API_URL = 'https://ohanatienda.ddns.net/api';
export const BASE_URL = 'https://ohanatienda.ddns.net';

// Función para construir URLs de API
export const apiUrl = (path) => {
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  return `${API_URL}/${cleanPath}`;
};

// Función para construir URLs de recursos (imágenes)
export const resourceUrl = (path) => {
  if (!path) return '/assets/placeholder-product.png';
  
  // Corregir URLs que usan localhost o 127.0.0.1
  if (path.includes('localhost') || path.includes('127.0.0.1')) {
    // Extraer la ruta después del puerto y construir con el dominio correcto
    const urlParts = path.split(/localhost(:\d+)?|127\.0\.0\.1(:\d+)?/);
    if (urlParts.length > 1) {
      // La parte después de localhost o 127.0.0.1 está en urlParts[1] o más adelante
      const relativePath = urlParts[urlParts.length - 1].replace(/^\/+/, '');
      return `${BASE_URL}/${relativePath}`;
    }
  }
  
  if (path.startsWith('http')) {
    // Asegurarse de que todas las URLs son HTTPS
    return path.replace('http:', 'https:');
  }
  
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  return `${BASE_URL}/${cleanPath}`;
};

// Nueva función para verificar si una URL tiene dominio local
export const hasLocalDomain = (url) => {
  return url && typeof url === 'string' && 
    (url.includes('localhost') || url.includes('127.0.0.1'));
};

// Nueva función para obtener la ruta base de las imágenes
export const getImagePath = () => `${BASE_URL}/uploads/productos/`;