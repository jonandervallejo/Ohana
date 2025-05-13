import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './css/EditarProducto.css';
import Toast from '../components/ui/Toast';
import Layout from '../components/layout/Layout';

const API_URL = 'http://ohanatienda.ddns.net:8000/api';
const BASE_URL = API_URL.replace('/api', '');

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
            
            if (producto.imagen) {
                const mainImg = {
                    id: 'main',
                    url: `${BASE_URL}/${producto.imagen}`,
                    file: null,
                    isOriginal: true,
                    path: producto.imagen
                };
                setMainImage(mainImg);
            }
            
            if (producto.imagenes && producto.imagenes.length > 0) {
                const carouselImgs = producto.imagenes.map((img, index) => ({
                    id: `carousel-${index}`,
                    url: `${BASE_URL}/${img.ruta}`,
                    file: null,
                    isOriginal: true,
                    path: img.ruta,
                    orden: img.orden
                }));
                
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
}, [id]);


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const processImage = (file) => {
    return new Promise((resolve) => {
      if (file.size <= 1024 * 1024) {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve({
            file: file,
            url: e.target.result
          });
        };
        reader.readAsDataURL(file);
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          if (width > 1200 || height > 1200) {
            const ratio = width / height;
            if (width > height) {
              width = 1200;
              height = Math.round(width / ratio);
            } else {
              height = 1200;
              width = Math.round(height * ratio);
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob((blob) => {
            const optimizedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            
            resolve({
              file: optimizedFile,
              url: canvas.toDataURL('image/jpeg', 0.8)
            });
          }, 'image/jpeg', 0.8);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };
  
  const handleMainImageChange = async (e) => {
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
    
    try {
      const processed = await processImage(file);
      
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
      console.error('Error al procesar la imagen:', error);
      setError('Error al procesar la imagen. Intenta con otra.');
    }
  };
  
  const handleCarouselImagesChange = async (e) => {
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
    
    try {
      const processedImages = await Promise.all(
        files.map(async (file) => {
          const processed = await processImage(file);
          return {
            id: `new-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            url: processed.url,
            file: processed.file,
            isOriginal: false
          };
        })
      );
      
      setNewImages(prev => [...prev, ...processedImages]);
      setCarouselImages(prev => [...prev, ...processedImages]);
    } catch (error) {
      console.error('Error al procesar las imágenes:', error);
      setError('Error al procesar algunas imágenes. Intenta de nuevo.');
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
    
    if (mainImage && mainImage.isOriginal) {
      setImagesToRemove(prev => [...prev, mainImage.path]);
    }
    
    const currentMainForCarousel = mainImage ? {
      ...mainImage,
      id: `carousel-${Date.now()}`
    } : null;
    
    setMainImage(selectedImage);
    
    const newCarouselImages = [...carouselImages];
    newCarouselImages.splice(index, 1);
    
    if (currentMainForCarousel) {
      newCarouselImages.push(currentMainForCarousel);
    }
    
    setCarouselImages(newCarouselImages);
  };
  
  const removeImage = (index) => {
    const imageToRemove = carouselImages[index];
    
    if (imageToRemove.isOriginal) {
      setImagesToRemove(prev => [...prev, imageToRemove.path]);
    }
    
    setCarouselImages(prev => prev.filter((_, i) => i !== index));
    
    if (!imageToRemove.isOriginal) {
      setNewImages(prev => prev.filter(img => img.id !== imageToRemove.id));
    }
  };
  
  const removeMainImage = () => {
    if (mainImage) {
      if (mainImage.isOriginal) {
        setImagesToRemove(prev => [...prev, mainImage.path]);
      }
      setMainImage(null);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (!formData.nombre || !formData.descripcion || !formData.precio) {
      setError('Por favor completa los campos obligatorios.');
      return;
    }
  
  
    try {
      setGuardando(true);
      setError('');
  
      const token = localStorage.getItem('token');
      const datosEnvio = new FormData();
  
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null && formData[key] !== undefined) {
          datosEnvio.append(key, formData[key]);
        }
      });
  
      if (mainImage && !mainImage.isOriginal && mainImage.file) {
        datosEnvio.append('imagen_principal', mainImage.file);
      }
      else if (mainImage && mainImage.isOriginal && mainImage.path) {
        datosEnvio.append('imagen_a_principal', mainImage.path);
        console.log("Estableciendo imagen de carrusel como principal:", mainImage.path);
      }
      
      if (!mainImage && !imagesToRemove.some(path => path === producto.imagen)) {
        datosEnvio.append('eliminar_imagen_principal', 'true');
        console.log("Eliminando imagen principal");
      }
  
      newImages.forEach((img, index) => {
        if (img.file) {
          datosEnvio.append(`imagenes_nuevas[${index}]`, img.file);
        }
      });
  
      const ordenImagenes = {};
      carouselImages.forEach((img, index) => {
        ordenImagenes[img.id] = index;
      });
      datosEnvio.append('orden_imagenes', JSON.stringify(ordenImagenes));
  
      imagesToRemove.forEach((path, index) => {
        datosEnvio.append(`imagenes_eliminar[${index}]`, path);
      });
  
      datosEnvio.append('_method', 'PUT');
  
      console.log("Enviando datos al servidor:");
      for (let [key, value] of datosEnvio.entries()) {
        console.log(`${key}: ${value instanceof File ? `Archivo: ${value.name}` : value}`);
      }
  
      const response = await axios.post(`${API_URL}/productos/${id}`, datosEnvio, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });
  
      setToastInfo({
        mostrar: true,
        mensaje: `Producto "${formData.nombre}" actualizado con éxito`,
        tipo: 'success'
      });
  
      setTimeout(() => {
        navigate('/productos');
      }, 2500);
  
    } catch (error) {
      console.error('Error al actualizar producto:', error);
  
      let errorMsg = 'Error al actualizar el producto. Por favor, intenta de nuevo.';
      if (error.response) {
        if (error.response.data.errors) {
          errorMsg = Object.values(error.response.data.errors).flat().join('. ');
        } else if (error.response.data.message) {
          errorMsg = error.response.data.message;
        }
      }
      setError(errorMsg);
      setToastInfo({
        mostrar: true,
        mensaje: 'Error al actualizar el producto. Revisa los datos e intenta nuevamente.',
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
                
                {/* MODIFICADO: Cambio de input texto a select para tipo */}
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