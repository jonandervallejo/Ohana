import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './css/EditarProducto.css';
import Toast from '../components/ui/Toast';
import Layout from '../components/layout/Layout';
import { API_URL, resourceUrl } from '../config/config'; // Importar de config

const BASE_URL = 'https://ohanatienda.ddns.net'; // URL base fijo para producción

const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

// Componente para una imagen arrastrable
const DraggableImage = ({ image, index, moveImage, setAsMain, removeImage, isMain }) => {
    const ref = useRef(null);
    
    const handleDragStart = (e) => {
      e.dataTransfer.setData('text/plain', index.toString());
      e.dataTransfer.effectAllowed = 'move';
      e.target.classList.add('is-dragging');
    };
  
    const handleDragOver = (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      e.target.closest('.draggable-image-container').classList.add('drop-indicator');
    };
  
    const handleDragLeave = (e) => {
      e.target.closest('.draggable-image-container').classList.remove('drop-indicator');
    };
  
    const handleDrop = (e) => {
      e.preventDefault();
      e.target.closest('.draggable-image-container').classList.remove('drop-indicator');
      const sourceIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
      moveImage(sourceIndex, index);
    };
    
    const handleDragEnd = (e) => {
      document.querySelectorAll('.draggable-image-container').forEach(item => {
        item.classList.remove('is-dragging');
        item.classList.remove('drop-indicator');
      });
    };
  
    return (
      <div 
        ref={ref} 
        className={`draggable-image-container ${isMain ? 'is-main' : ''}`}
        draggable="true"
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onDragEnd={handleDragEnd}
      >
        <img 
          src={image.url} 
          alt={`Imagen ${index + 1}`} 
          className="draggable-image"
          loading="lazy"
          onError={(e) => {
            // Fallback si la imagen no carga
            console.error(`Error cargando imagen: ${image.url}`);
            e.target.src = '/assets/placeholder-product.png';
          }}
        />
        
        <div className="image-actions">
          {!isMain && (
            <button 
              type="button"
              className="btn-set-main"
              onClick={() => setAsMain(index)}
              title="Establecer como principal"
            >
              <i className="fas fa-star"></i>
            </button>
          )}
          <button 
            type="button"
            className="btn-remove-image"
            onClick={() => removeImage(index)}
            title="Eliminar imagen"
          >
            <i className="fas fa-trash"></i>
          </button>
        </div>
        
        {isMain && <div className="main-badge">Principal</div>}
        
        <div className="drag-handle">
          <i className="fas fa-grip-lines"></i>
        </div>
      </div>
    );
  };

const EditarProducto = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [producto, setProducto] = useState(null);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    id_categoria: '',
    talla: '',
    tipo: '',
  });
  
  // Definir las opciones para el tipo de producto
  const tipoOptions = [
    { value: 'Mujer', label: 'Mujer' },
    { value: 'Hombre', label: 'Hombre' },
    { value: 'Unisex', label: 'Unisex' }
  ];
  
  const [mainImage, setMainImage] = useState(null);
  const [carouselImages, setCarouselImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [imagesToRemove, setImagesToRemove] = useState([]);
  
  const [toastInfo, setToastInfo] = useState({
    mostrar: false,
    mensaje: '',
    tipo: 'success'
  });

  
  const cargarCategorias = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/categorias`);
      setCategorias(response.data);
    } catch (error) {
      console.error('Error al cargar categorías:', error);
      setError('No se pudieron cargar las categorías. Por favor, intenta de nuevo.');
    }
  }, []);
  
  // Función para normalizar URLs
  const normalizeUrl = (url) => {
    if (!url) return '';
    
    // Convertir URLs relativas a absolutas
    if (!url.startsWith('http')) {
      return `${BASE_URL}/${url.replace(/^\/+/, '')}`;
    }
    
    // Reemplazar localhost o 127.0.0.1 con dominio correcto
    url = url.replace(
      /https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/g, 
      BASE_URL
    );
    
    // Asegurar que usamos HTTPS
    url = url.replace(/^http:\/\//, 'https://');
    
    return url;
  };
  
  useEffect(() => {
    const cargarProducto = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/productos/${id}`);
            const producto = response.data;
            setProducto(producto);
            
            setFormData({
                nombre: producto.nombre || '',
                descripcion: producto.descripcion || '',
                precio: producto.precio || '',
                id_categoria: producto.id_categoria || '',
                talla: producto.talla || '',
                tipo: producto.tipo || '',
            });
            
            // Imagen principal
            if (producto.imagen) {
                const mainImgUrl = normalizeUrl(producto.imagen);
                const mainImg = {
                    id: 'main',
                    url: mainImgUrl,
                    file: null,
                    isOriginal: true,
                    path: producto.imagen
                };
                setMainImage(mainImg);
            }
            
            // Imágenes de carrusel
            if (producto.imagenes && producto.imagenes.length > 0) {
                const carouselImgs = producto.imagenes.map((img, index) => {
                    // Asegurar que la ruta es absoluta y usa HTTPS
                    const imgUrl = normalizeUrl(img.ruta);
                    
                    return {
                        id: `carousel-${index}`,
                        url: imgUrl,
                        file: null,
                        isOriginal: true,
                        path: img.ruta,
                        orden: img.orden || index
                    };
                });
                
                carouselImgs.sort((a, b) => a.orden - b.orden);
                setCarouselImages(carouselImgs);
            }
            
        } catch (error) {
            console.error('Error al cargar el producto:', error);
            setError('No se pudo cargar el producto. Por favor, intenta de nuevo.');
        } finally {
            setLoading(false);
        }
    };
    
    cargarProducto();
    cargarCategorias();
    
    document.title = 'Editar Producto - Ohana';
    
    return () => {
      document.title = 'Ohana';
    };
}, [id, cargarCategorias]);


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Función mejorada de compresión de imágenes
  const compressImage = (file, maxWidth = 800) => { // Reducido a 800px para imágenes más pequeñas
    return new Promise((resolve, reject) => {
      // Si el archivo es muy pequeño, no comprimir
      if (file.size < 300 * 1024) { // Reducido a 300KB
        resolve({
          file: file,
          url: URL.createObjectURL(file)
        });
        return;
      }
      
      // Crear un nombre de archivo seguro sin caracteres especiales
      const timestamp = Date.now();
      const fileExt = file.name.split('.').pop().toLowerCase();
      const mimeType = fileExt === 'png' ? 'image/png' : 'image/jpeg';
      const safeName = `product_${timestamp}.${fileExt === 'png' ? 'png' : 'jpg'}`;
      
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Más compresión para imágenes grandes
          if (width > maxWidth) {
            const ratio = width / height;
            width = maxWidth;
            height = Math.round(width / ratio);
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // Calidad reducida para JPEG (0.7 = 70%)
          canvas.toBlob((blob) => {
            if (!blob) {
              console.error("Error al comprimir la imagen");
              resolve({
                file: file,
                url: URL.createObjectURL(file)
              });
              return;
            }
            
            const optimizedFile = new File([blob], safeName, {
              type: mimeType,
              lastModified: timestamp
            });
            
            console.log(`Imagen comprimida: ${Math.round(file.size/1024)}KB → ${Math.round(optimizedFile.size/1024)}KB`);
            
            resolve({
              file: optimizedFile,
              url: URL.createObjectURL(blob)
            });
          }, mimeType, 0.7); // Calidad reducida a 70%
        };
        
        img.onerror = () => {
          console.error("Error cargando imagen para compresión");
          resolve({
            file: file,
            url: URL.createObjectURL(file)
          });
        };
      };
      
      reader.onerror = (error) => {
        console.error("Error leyendo el archivo:", error);
        reject(error);
      };
    });
  };
  
  const handleMainImageChange = async (e) => {
    try {
      const file = e.target.files[0];
      if (!file) return;
      
      if (!file.type.startsWith('image/')) {
        setError('Por favor, selecciona un archivo de imagen válido.');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        setError('La imagen no debe superar los 5MB.');
        return;
      }
      
      // Crear un nombre de archivo seguro
      const fileExt = file.name.split('.').pop().toLowerCase();
      const safeFile = new File([file], `main_${Date.now()}.${fileExt}`, {
        type: file.type,
        lastModified: file.lastModified
      });
      
      // Comprimir imagen antes de subir
      const processed = await compressImage(safeFile);
      
      if (mainImage && mainImage.isOriginal) {
        setImagesToRemove(prev => [...prev, mainImage.path]);
      }
      
      setMainImage({
        id: 'main-new',
        url: processed.url,
        file: processed.file,
        isOriginal: false
      });
      
    } catch (error) {
      console.error('Error al procesar la imagen principal:', error);
      setError('Error al procesar la imagen. Intenta con otra imagen más pequeña.');
    }
  };
  
  const handleCarouselImagesChange = async (e) => {
    try {
      const files = Array.from(e.target.files);
      if (files.length === 0) return;
      
      const invalidFiles = files.filter(file => !file.type.startsWith('image/'));
      if (invalidFiles.length > 0) {
        setError('Algunos archivos seleccionados no son imágenes válidas.');
        return;
      }
      
      const largeFiles = files.filter(file => file.size > 5 * 1024 * 1024);
      if (largeFiles.length > 0) {
        setError('Algunas imágenes exceden el tamaño máximo de 5MB.');
        return;
      }
      
      // Procesar y comprimir cada imagen
      const processedImages = [];
      
      for (const file of files) {
        try {
          // Crear un nombre de archivo seguro
          const fileExt = file.name.split('.').pop().toLowerCase();
          const safeFile = new File([file], `gallery_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`, {
            type: file.type,
            lastModified: file.lastModified
          });
          
          const processed = await compressImage(safeFile);
          processedImages.push({
            id: `new-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
            url: processed.url,
            file: processed.file,
            isOriginal: false
          });
        } catch (err) {
          console.error("Error procesando imagen:", err);
        }
      }
      
      setNewImages(prev => [...prev, ...processedImages]);
      setCarouselImages(prev => [...prev, ...processedImages]);
      
    } catch (error) {
      console.error('Error al procesar las imágenes de carrusel:', error);
      setError('Error al procesar algunas imágenes. Intenta de nuevo con imágenes más pequeñas.');
    }
  };
  
  const moveImage = (dragIndex, hoverIndex) => {
    const draggedImage = carouselImages[dragIndex];
    
    setCarouselImages(prev => {
      const newImages = [...prev];
      newImages.splice(dragIndex, 1);
      newImages.splice(hoverIndex, 0, draggedImage);
      return newImages;
    });
  };
  
  const setAsMain = (index) => {
    const selectedImage = carouselImages[index];
    
    // Si hay una imagen principal actual y es original, añadirla a la lista de eliminación
    if (mainImage && mainImage.isOriginal) {
      setImagesToRemove(prev => [...prev, mainImage.path]);
    }
    
    const currentMainForCarousel = mainImage ? {
      ...mainImage,
      id: `carousel-${Date.now()}`
    } : null;
    
    // Establecer la imagen seleccionada como principal
    setMainImage(selectedImage);
    
    // Quitar la imagen seleccionada del carrusel
    const newCarouselImages = [...carouselImages];
    newCarouselImages.splice(index, 1);
    
    // Añadir la antigua imagen principal al carrusel si existe
    if (currentMainForCarousel) {
      newCarouselImages.push(currentMainForCarousel);
    }
    
    setCarouselImages(newCarouselImages);
  };
  
  const removeImage = (index) => {
    const imageToRemove = carouselImages[index];
    
    // Si es una imagen original, añadirla a la lista de eliminación
    if (imageToRemove.isOriginal) {
      setImagesToRemove(prev => [...prev, imageToRemove.path]);
    }
    
    // Quitar la imagen del carrusel
    setCarouselImages(prev => prev.filter((_, i) => i !== index));
    
    // Si es una imagen nueva, quitarla también de newImages
    if (!imageToRemove.isOriginal) {
      setNewImages(prev => prev.filter(img => img.id !== imageToRemove.id));
    }
  };
  
  const removeMainImage = () => {
    if (mainImage) {
      // Si es una imagen original, añadirla a la lista de eliminación
      if (mainImage.isOriginal) {
        setImagesToRemove(prev => [...prev, mainImage.path]);
      }
      setMainImage(null);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
  
    // Validación de campos obligatorios
    if (!formData.nombre || !formData.descripcion || !formData.precio) {
      setError('Por favor completa los campos obligatorios.');
      return;
    }
  
    try {
      setGuardando(true);
      setError('');
  
      const token = localStorage.getItem('token');
      const datosEnvio = new FormData();
  
      // Añadir campos del formulario
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null && formData[key] !== undefined && formData[key] !== '') {
          datosEnvio.append(key, formData[key]);
        }
      });
  
      // Manejar imagen principal
      if (mainImage && !mainImage.isOriginal && mainImage.file) {
        // Verificar una vez más si la imagen es válida
        const imgFile = mainImage.file;
        if (imgFile.size > 2 * 1024 * 1024) { // Si es mayor a 2MB
          const recompressed = await compressImage(imgFile, 600); // Comprimir aún más
          datosEnvio.append('imagen_principal', recompressed.file);
        } else {
          datosEnvio.append('imagen_principal', imgFile);
        }
      } else if (mainImage && mainImage.isOriginal && mainImage.path) {
        // Normalizar la ruta
        const normalizedPath = mainImage.path.replace(/^\/+/, '').trim();
        datosEnvio.append('imagen_a_principal', normalizedPath);
        console.log("Usando imagen de servidor como principal:", normalizedPath);
      } else if (!mainImage) {
        // No hay imagen principal
        datosEnvio.append('eliminar_imagen_principal', 'true');
        console.log("Eliminando imagen principal");
      }
  
      // Añadir nuevas imágenes para el carrusel - con verificación extra
      const processedNewImages = await Promise.all(newImages.map(async (img, index) => {
        if (!img.file) return null;
        
        // Recomprimir si es necesario
        if (img.file.size > 2 * 1024 * 1024) { // Si es mayor a 2MB
          const recompressed = await compressImage(img.file, 600);
          return { index, file: recompressed.file };
        }
        
        return { index, file: img.file };
      }));
      
      // Filtrar los null y añadir al FormData
      processedNewImages
        .filter(item => item !== null)
        .forEach(item => {
          datosEnvio.append(`imagenes_nuevas[${item.index}]`, item.file);
          console.log(`Añadiendo nueva imagen de carrusel: ${item.file.name} (${Math.round(item.file.size/1024)}KB)`);
        });
  
      // Añadir orden de imágenes
      const ordenImagenes = {};
      carouselImages.forEach((img, index) => {
        ordenImagenes[img.id] = index;
      });
      datosEnvio.append('orden_imagenes', JSON.stringify(ordenImagenes));
      
      // Añadir imágenes a eliminar - mejorado para evitar rutas vacías o duplicadas
      const uniqueImagesToRemove = [...new Set(
        imagesToRemove
          .filter(path => path && path.trim() !== '') // Filtrar valores nulos o vacíos
          .map(path => path.replace(/^\/+/, '').trim()) // Normalizar rutas
      )];
      
      uniqueImagesToRemove.forEach((path, index) => {
        datosEnvio.append(`imagenes_eliminar[${index}]`, path);
        console.log(`Eliminando imagen: ${path}`);
      });
  
      // Laravel espera PUT para actualización
      datosEnvio.append('_method', 'PUT');
  
      // Debug de datos que se envían al servidor
      console.log("Datos a enviar al servidor:");
      for (let [key, value] of datosEnvio.entries()) {
        console.log(`${key}: ${value instanceof File ? `Archivo: ${value.name} (${Math.round(value.size/1024)}KB)` : value}`);
      }
  
      // Incluir timeout para peticiones largas
      const response = await axios.post(`${API_URL}/productos/${id}`, datosEnvio, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
        timeout: 60000 // 60 segundos de timeout para dar tiempo a la subida
      });
  
      // Mostrar mensaje de éxito
      setToastInfo({
        mostrar: true,
        mensaje: `Producto "${formData.nombre}" actualizado con éxito`,
        tipo: 'success'
      });
  
      // Redirigir después de un tiempo
      setTimeout(() => {
        navigate('/productos');
      }, 2500);
  
    } catch (error) {
      console.error('Error al actualizar producto:', error);
      
      // Mostrar mensaje de error detallado
      let errorMsg = 'Error al actualizar el producto. Por favor, intenta de nuevo con imágenes más pequeñas.';
      
      if (error.response) {
        console.log('Detalles del error:', error.response.data);
        
        if (error.response.data.errors) {
          errorMsg = Object.values(error.response.data.errors).flat().join('. ');
        } else if (error.response.data.message || error.response.data.error) {
          errorMsg = error.response.data.message || error.response.data.error;
        }
      } else if (error.code === 'ECONNABORTED') {
        errorMsg = 'La operación tomó demasiado tiempo. Intenta con imágenes más pequeñas.';
      }
      
      setError(errorMsg);
      setToastInfo({
        mostrar: true,
        mensaje: 'Error al actualizar el producto. Prueba con imágenes más pequeñas.',
        tipo: 'error'
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setGuardando(false);
    }
  };
  
  const handleVolverClick = () => {
    navigate('/productos');
  };
  
  const closeError = () => {
    setError('');
  };
  
  const contenido = (
    <>
      <div className="page-header">
        <h1>Editar Producto</h1>
        <button 
          className="btn-volver" 
          onClick={handleVolverClick}
          disabled={guardando}
        >
          <i className="fas fa-arrow-left"></i> Volver a Productos
        </button>
      </div>
      
      {error && (
        <div className="error-banner">
          <i className="fas fa-exclamation-circle"></i>
          <span>{error}</span>
          <button onClick={closeError} className="close-error">×</button>
        </div>
      )}
      
      {loading ? (
        <div className="spinner-container">
          <div className="spinner">
            <i className="fas fa-spinner fa-spin fa-3x"></i>
            <p className="mt-2">Cargando datos del producto...</p>
          </div>
        </div>
      ) : (
        <div className="form-container">
          <div className="formulario-producto-container">
            <h2>Editar Producto: {producto?.nombre}</h2>
            
            <form onSubmit={handleSubmit} encType="multipart/form-data">
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="nombre">Nombre *</label>
                  <input
                    type="text"
                    id="nombre"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="precio">Precio *</label>
                  <input
                    type="number"
                    id="precio"
                    name="precio"
                    value={formData.precio}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="id_categoria">Categoría *</label>
                  <select
                    id="id_categoria"
                    name="id_categoria"
                    value={formData.id_categoria}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Selecciona una categoría</option>
                    {categorias.map(categoria => (
                      <option key={categoria.id} value={categoria.id}>
                        {categoria.nombre_cat}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="tipo">Tipo</label>
                  <select
                    id="tipo"
                    name="tipo"
                    value={formData.tipo}
                    onChange={handleChange}
                    className="form-select"
                  >
                    <option value="">Selecciona el tipo</option>
                    {tipoOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group full-width">
                  <label htmlFor="descripcion">Descripción *</label>
                  <textarea
                    id="descripcion"
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="talla">Talla</label>
                  <input
                    type="text"
                    id="talla"
                    name="talla"
                    value={formData.talla}
                    onChange={handleChange}
                  />
                </div>
              </div>
              
              <div className="images-section">
                <h3>Imágenes del Producto</h3>
                
                <div className="main-image-section">
                  <label className="section-label">Imagen Principal</label>

                  <p className="drag-instructions">
                    <i className="fas fa-info-circle"></i> Si cambias la imagen Principal, esta se eliminará.
                  </p>
                  
                  {mainImage ? (
                    <div className="main-image-container">
                      <img 
                        src={mainImage.url} 
                        alt="Imagen principal" 
                        className="main-image-preview"
                        onError={(e) => {
                          console.error(`Error cargando imagen principal: ${mainImage.url}`);
                          e.target.src = '/assets/placeholder-product.png';
                        }}
                      />
                      <div className="main-image-actions">
                        <button 
                          type="button" 
                          className="btn-change-image"
                          onClick={() => document.getElementById('main-image-input').click()}
                        >
                          <i className="fas fa-exchange-alt"></i> Cambiar
                        </button>
                        <button 
                          type="button" 
                          className="btn-remove-main"
                          onClick={removeMainImage}
                        >
                          <i className="fas fa-trash"></i> Eliminar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="main-image-upload">
                      <label htmlFor="main-image-input" className="upload-area">
                        <i className="fas fa-cloud-upload-alt"></i>
                        <span>Subir imagen principal</span>
                        <p className="upload-hint">Haz clic para seleccionar</p>
                      </label>
                    </div>
                  )}
                  
                  <input
                    type="file"
                    id="main-image-input"
                    onChange={handleMainImageChange}
                    accept="image/*"
                    style={{ display: 'none' }}
                  />
                </div>
                
                <div className="carousel-images-section">
                  <div className="section-header">
                    <label className="section-label">Imágenes de Carrusel</label>
                    <button 
                      type="button"
                      className="btn-add-images"
                      onClick={() => document.getElementById('carousel-images-input').click()}
                    >
                      <i className="fas fa-plus"></i> Añadir imágenes
                    </button>
                  </div>
                  
                  <input
                    type="file"
                    id="carousel-images-input"
                    onChange={handleCarouselImagesChange}
                    accept="image/*"
                    multiple
                    style={{ display: 'none' }}
                  />
                  
                  <div className="carousel-container">
                    <p className="drag-instructions">
                      <i className="fas fa-info-circle"></i> Haz clic en la estrella para establecer como principal.
                    </p>
                    
                    <div className="carousel-images-grid">
                      {carouselImages.length > 0 ? (
                        carouselImages.map((image, index) => (
                          <DraggableImage
                            key={image.id}
                            image={image}
                            index={index}
                            moveImage={moveImage}
                            setAsMain={setAsMain}
                            removeImage={removeImage}
                            isMain={false}
                          />
                        ))
                      ) : (
                        <div className="no-images-message">
                          <p>No hay imágenes de carrusel. Añade algunas para mostrar más vistas del producto.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn-cancelar" 
                  onClick={handleVolverClick}
                  disabled={guardando}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn-guardar" 
                  disabled={guardando}
                >
                  {guardando ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      <Toast
        mensaje={toastInfo.mensaje}
        tipo={toastInfo.tipo}
        mostrar={toastInfo.mostrar}
        setMostrar={(mostrar) => setToastInfo(prev => ({ ...prev, mostrar }))}
        duracion={3000} 
      />
    </>
  );

  return (
    <Layout>
      <div className="editar-producto-page">
        {contenido}
      </div>
    </Layout>
  );
};

export default EditarProducto;