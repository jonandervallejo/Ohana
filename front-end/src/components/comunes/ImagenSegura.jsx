import React, { useState, useEffect } from 'react';
import { resourceUrl } from '../../config/config';

/**
 * Componente para renderizar imágenes de forma segura, manejando:
 * - Conversión automática de HTTP a HTTPS
 * - Resolución de URLs relativas a absolutas
 * - Manejo de errores de carga con imagen de respaldo
 * - Soporte para dominio correcto (ohanatienda.ddns.net)
 */
const ImagenSegura = ({ 
  src, 
  alt, 
  className = '', 
  fallbackSrc = '/assets/placeholder-product.png',
  ...props 
}) => {
  const [imgSrc, setImgSrc] = useState(null);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!src) {
      setImgSrc(fallbackSrc);
      return;
    }
    
    let processedUrl;
    try {
      // Primero intentar usar el helper resourceUrl
      processedUrl = resourceUrl(src);
      
      // Asegurar siempre HTTPS
      if (processedUrl && processedUrl.startsWith('http:')) {
        processedUrl = processedUrl.replace('http:', 'https:');
      }
      
      // Si contiene localhost o 127.0.0.1, reemplazar con dominio de producción
      if (processedUrl && (processedUrl.includes('localhost') || processedUrl.includes('127.0.0.1'))) {
        processedUrl = processedUrl.replace(
          /https?:\/\/(localhost|127\.0\.0\.1)(?::\d+)?/,
          'https://ohanatienda.ddns.net'
        );
      }
    } catch (err) {
      console.error("Error al procesar URL con resourceUrl:", err);
      
      // Fallback para procesar URL manualmente
      processedUrl = src;
      
      // Convertir URLs relativas a absolutas
      if (processedUrl && !processedUrl.startsWith('http') && !processedUrl.startsWith('data:') && !processedUrl.startsWith('/assets')) {
        if (processedUrl.startsWith('/')) {
          processedUrl = `https://ohanatienda.ddns.net${processedUrl}`;
        } else {
          processedUrl = `https://ohanatienda.ddns.net/${processedUrl}`;
        }
      }
      
      // Asegurar HTTPS
      if (processedUrl && processedUrl.startsWith('http:')) {
        processedUrl = processedUrl.replace('http:', 'https:');
      }
    }
    
    setImgSrc(processedUrl);
    setError(false);
    setRetryCount(0);
  }, [src, fallbackSrc]);

  const handleError = () => {
    // Máximo 2 intentos para evitar bucles infinitos
    if (retryCount >= 2) {
      console.warn(`No se pudo cargar la imagen después de ${retryCount} intentos:`, imgSrc);
      setImgSrc(fallbackSrc);
      return;
    }
    
    console.warn('Error cargando imagen:', imgSrc);
    setRetryCount(prev => prev + 1);
    
    // Intentar diferentes variaciones de la URL
    if (imgSrc && !error) {
      setError(true);
      
      // Estrategia 1: Forzar HTTPS
      if (imgSrc.startsWith('http:')) {
        const httpsUrl = imgSrc.replace('http:', 'https:');
        console.log('Reintentando con HTTPS:', httpsUrl);
        setImgSrc(httpsUrl);
        return;
      }
      
      // Estrategia 2: Reemplazar dominio local por dominio de producción
      if (imgSrc.includes('localhost') || imgSrc.includes('127.0.0.1')) {
        const prodUrl = imgSrc.replace(
          /https?:\/\/(localhost|127\.0\.0\.1)(?::\d+)?/,
          'https://ohanatienda.ddns.net'
        );
        console.log('Reintentando con dominio de producción:', prodUrl);
        setImgSrc(prodUrl);
        return;
      }
      
      // Estrategia 3: Probar con URL relativa desde dominio de producción
      if (imgSrc.startsWith('https://ohanatienda.ddns.net/')) {
        const relPath = imgSrc.replace('https://ohanatienda.ddns.net/', '');
        if (relPath.includes('/')) {
          const simplePath = relPath.split('/').pop();
          const newUrl = `https://ohanatienda.ddns.net/uploads/productos/carrusel/${simplePath}`;
          console.log('Reintentando con ruta simplificada:', newUrl);
          setImgSrc(newUrl);
          return;
        }
      }
    }
    
    // Si todas las estrategias fallan, usar imagen de respaldo
    setImgSrc(fallbackSrc);
  };

  return (
    <img 
      src={imgSrc || fallbackSrc}
      alt={alt || "Imagen de producto"} 
      className={className}
      onError={handleError}
      loading="lazy"
      {...props}
    />
  );
};

export default ImagenSegura;