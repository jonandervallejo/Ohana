import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './css/CrearProducto.css';
import Toast from '../components/ui/Toast';
import { API_URL, resourceUrl } from '../config/config';

const ImageSelector = React.memo(({ label, buttonText, icon, multiple, onChange, previews, onRemove }) => {
  const fileInputRef = useRef(null);

  const handleClick = () => {
    fileInputRef.current.click();
  };

  const processImageFile = (file) => {
    const sizeInMB = file.size / (1024 * 1024);
    if (sizeInMB > 5) {
      alert(`La imagen "${file.name}" es demasiado grande (${sizeInMB.toFixed(2)}MB). El tamaño máximo es 5MB.`);
      return null;
    }

    if (!file.type.startsWith('image/') && !file.type.includes('image')) {
      alert(`El archivo "${file.name}" no es una imagen válida.`);
      return null;
    }

    // Crear un nombre de archivo seguro sin caracteres especiales
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop().toLowerCase();
    const safeName = `producto_${timestamp}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
    
    return new File([file], safeName, {
      type: file.type,
      lastModified: timestamp
    });
  };

  const handleFileChange = (e) => {
    const files = e.target.files;
    
    if (!files || files.length === 0) return;
    
    if (multiple) {
      const processedFiles = [];
      
      for (let i = 0; i < files.length; i++) {
        const processedFile = processImageFile(files[i]);
        if (processedFile) {
          processedFiles.push(processedFile);
        }
      }
      
      if (processedFiles.length > 0) {
        onChange({
          target: {
            files: processedFiles
          }
        });
      }
    } 
    else {
      const processedFile = processImageFile(files[0]);
      if (processedFile) {
        onChange({
          target: {
            files: [processedFile]
          }
        });
      }
    }
  };
  
  return (
    <div className="form-group">
      <label>{label}</label>
      <div className="file-input-container">
        <button 
          type="button" 
          className="upload-button"
          onClick={handleClick}
        >
          <i className={`fas ${icon}`}></i> {buttonText}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          accept="image/*"
          multiple={multiple}
          className="image-input"
          style={{display: 'none'}}
        />
      </div>

      {previews && previews.length > 0 && (
        <div className={multiple ? "gallery-preview" : "main-image-preview"}>
          {previews.map((preview, index) => (
            <div 
              key={`image-${index}`} 
              className={multiple ? "gallery-image-container" : "main-image-container"}
            >
              <img src={preview} alt={multiple ? `Galería ${index + 1}` : "Vista previa"} />
              <button 
                type="button" 
                className="remove-image" 
                onClick={() => onRemove(index)}
                aria-label="Eliminar imagen"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

const FormularioProducto = ({ categorias, onSubmit, onCancel, guardando }) => {
  const storedData = localStorage.getItem('productoFormData');
  const initialFormData = storedData ? JSON.parse(storedData) : {
    nombre: '',
    descripcion: '',
    precio: '',
    id_categoria: '',
    tipo: '',
    talla: ''
  };

  // Definir las opciones para el tipo de producto
  const tipoOptions = [
    { value: 'Mujer', label: 'Mujer' },
    { value: 'Hombre', label: 'Hombre' },
    { value: 'Unisex', label: 'Unisex' }
  ];

  const [formData, setFormData] = useState(initialFormData);
  const [mainImage, setMainImage] = useState(null);
  const [mainImagePreview, setMainImagePreview] = useState('');
  const [galleryImages, setGalleryImages] = useState([]);
  const [galleryPreviews, setGalleryPreviews] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    localStorage.setItem('productoFormData', JSON.stringify(formData));
  }, [formData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Función mejorada para comprimir imágenes si son muy grandes
  const compressImage = (file, maxWidth = 800) => {
    return new Promise((resolve, reject) => {
      // Si el archivo es pequeño (< 300KB), no comprimir
      if (file.size < 300 * 1024) {
        resolve(file);
        return;
      }
      
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Comprimir si la imagen es grande
          if (width > maxWidth) {
            const ratio = width / height;
            width = maxWidth;
            height = Math.round(width / ratio);
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // Crear nombre de archivo seguro
          const timestamp = Date.now();
          const fileExt = file.name.split('.').pop().toLowerCase();
          const safeName = `producto_${timestamp}.${fileExt === 'png' ? 'png' : 'jpg'}`;
          const mimeType = fileExt === 'png' ? 'image/png' : 'image/jpeg';
          
          // Convertir a blob con calidad reducida
          canvas.toBlob((blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            
            const newFile = new File([blob], safeName, {
              type: mimeType,
              lastModified: timestamp,
            });
            
            console.log(`Imagen comprimida: ${Math.round(file.size/1024)}KB → ${Math.round(newFile.size/1024)}KB`);
            resolve(newFile);
          }, fileExt === 'png' ? 'image/png' : 'image/jpeg', 0.7); // Calidad 70%
        };
        
        img.onerror = (err) => {
          console.error("Error al cargar imagen:", err);
          resolve(file); // Usar original si falla
        };
      };
      
      reader.onerror = (error) => {
        console.error("Error al leer archivo:", error);
        resolve(file); // Usar original si falla
      };
    });
  };

  const handleMainImageChange = useCallback(async (e) => {
    try {
      const file = Array.isArray(e.target.files) ? e.target.files[0] : e.target.files[0];
      if (!file) return;
      
      if (mainImagePreview) {
        URL.revokeObjectURL(mainImagePreview);
      }
      
      // Comprimir imagen principal si es necesario
      const processedFile = await compressImage(file);
      setMainImage(processedFile);
      
      const previewURL = URL.createObjectURL(processedFile);
      setMainImagePreview(previewURL);
      
      localStorage.setItem('hasMainImage', 'true');
    } catch (error) {
      console.error("Error al manejar la imagen principal:", error);
      alert("Error al procesar la imagen principal. Por favor, intenta con otra imagen más pequeña.");
    }
  }, [mainImagePreview]);

  const handleGalleryImagesChange = useCallback(async (e) => {
    try {
      const files = Array.isArray(e.target.files) ? e.target.files : Array.from(e.target.files || []);
      if (!files.length) return;
      
      const newImages = [...galleryImages];
      const newPreviews = [...galleryPreviews];

      const remainingSlots = 5 - newImages.length;
      
      if (remainingSlots <= 0) {
        alert('Has alcanzado el límite máximo de 5 imágenes en la galería.');
        return;
      }
      
      const filesToAdd = files.slice(0, remainingSlots);
      
      // Procesar y comprimir cada imagen
      for (const file of filesToAdd) {
        try {
          const processedFile = await compressImage(file);
          newImages.push(processedFile);
          newPreviews.push(URL.createObjectURL(processedFile));
        } catch (err) {
          console.error("Error procesando imagen:", err);
          // Si falla, intentar usar un placeholder
          newPreviews.push("/assets/placeholder-product.png");
        }
      }

      setGalleryImages(newImages);
      setGalleryPreviews(newPreviews);
      
      localStorage.setItem('galleryImageCount', newImages.length);
    } catch (error) {
      console.error("Error al manejar las imágenes de la galería:", error);
      alert("Error al procesar las imágenes. Intenta con imágenes más pequeñas.");
    }
  }, [galleryImages, galleryPreviews]);

  const removeMainImage = useCallback(() => {
    if (mainImagePreview) {
      URL.revokeObjectURL(mainImagePreview);
    }
    setMainImage(null);
    setMainImagePreview('');
    localStorage.removeItem('hasMainImage');
  }, [mainImagePreview]);

  const removeGalleryImage = useCallback((index) => {
    if (galleryPreviews[index] && galleryPreviews[index].startsWith('blob:')) {
      URL.revokeObjectURL(galleryPreviews[index]);
    }
    setGalleryImages(prev => prev.filter((_, i) => i !== index));
    setGalleryPreviews(prev => prev.filter((_, i) => i !== index));
    
    const newCount = galleryImages.length - 1;
    localStorage.setItem('galleryImageCount', newCount > 0 ? newCount : '');
  }, [galleryImages, galleryPreviews]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.nombre || !formData.descripcion || !formData.precio || !formData.id_categoria) {
      setError('Por favor, completa todos los campos obligatorios');
      return;
    }

    const productoData = new FormData();

    Object.keys(formData).forEach(key => {
      if (formData[key]) {
        productoData.append(key, formData[key]);
      }
    });

    if (mainImage) {
      // Verificar si necesita más compresión
      if (mainImage.size > 1 * 1024 * 1024) { // Si es mayor a 1MB
        const recompressed = await compressImage(mainImage, 600);
        productoData.append('imagen', recompressed);
        console.log("Imagen principal comprimida:", recompressed.name);
      } else {
        productoData.append('imagen', mainImage);
        console.log("Imagen principal agregada:", mainImage.name);
      }
    }

    if (galleryImages.length > 0) {
      const imagenesArray = [];
      
      for (let i = 0; i < galleryImages.length; i++) {
        // Verificar si necesita más compresión
        let imgFile = galleryImages[i];
        if (imgFile.size > 1 * 1024 * 1024) { // Si es mayor a 1MB
          imgFile = await compressImage(imgFile, 600);
        }
        
        productoData.append(`imagenes_files[]`, imgFile);
        
        const timestamp = Date.now();
        const imageName = `galeria_${timestamp}_${i}.jpg`;
        imagenesArray.push(imageName);
      }
      
      productoData.append('imagenes', JSON.stringify(imagenesArray));
      
      console.log("Imágenes de galería agregadas:", galleryImages.length);
    }

    localStorage.removeItem('productoFormData');
    localStorage.removeItem('hasMainImage');
    localStorage.removeItem('galleryImageCount');
    
    onSubmit(productoData);
  }, [formData, mainImage, galleryImages, onSubmit]);

  useEffect(() => {
    return () => {
      // Limpieza de URLs de objetos al desmontar
      if (mainImagePreview && mainImagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(mainImagePreview);
      }
      galleryPreviews.forEach(url => {
        if (url && url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [mainImagePreview, galleryPreviews]);

  return (
    <div className="formulario-producto-container">
      <h2>Nuevo Producto</h2>

      {error && <div className="error-mensaje">{error}</div>}

      <form onSubmit={handleSubmit} encType="multipart/form-data">
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

        <ImageSelector
          label="Imagen Principal *"
          buttonText="Tomar/Seleccionar imagen principal"
          icon="fa-camera"
          multiple={false}
          onChange={handleMainImageChange}
          previews={mainImagePreview ? [mainImagePreview] : []}
          onRemove={() => removeMainImage()}
        />

        <ImageSelector
          label="Imágenes de Galería (máx. 5)"
          buttonText="Añadir imágenes a la galería"
          icon="fa-images"
          multiple={true}
          onChange={handleGalleryImagesChange}
          previews={galleryPreviews}
          onRemove={removeGalleryImage}
        />

        <div className="form-actions">
          <button 
            type="button" 
            className="btn-cancelar" 
            onClick={onCancel}
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            className="btn-guardar" 
            disabled={guardando}
          >
            {guardando ? 'Guardando...' : 'Guardar Producto'}
          </button>
        </div>
      </form>
    </div>
  );
};

const CrearProducto = () => {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const navigate = useNavigate();
  
  const [toastInfo, setToastInfo] = useState({
    mostrar: false,
    mensaje: '',
    tipo: 'success'
  });

  const fetchCategorias = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/categorias`);
      setCategorias(response.data);
    } catch (error) {
      console.error('Error al cargar categorías:', error);
      setError('No se pudieron cargar las categorías. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = 'Crear Nuevo Producto';
    fetchCategorias();
    
    return () => {
      document.title = 'Gestión de Productos';
    };
  }, [fetchCategorias]);

  const handleGuardarProducto = useCallback(async (productoData) => {
    try {
      setGuardando(true);
      setError('');
      
      const token = localStorage.getItem('token');
      
      console.log("Enviando formulario con estos datos:");
      for (let [key, value] of productoData.entries()) {
        if (value instanceof File) {
          console.log(`${key}: Archivo - ${value.name} (${Math.round(value.size / 1024)}KB)`);
        } else {
          console.log(`${key}: ${value}`);
        }
      }
      
      const response = await axios.post(`${API_URL}/productos`, productoData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
        timeout: 60000 // 60 segundos de timeout
      });
      
      console.log("Respuesta del servidor:", response.data);
      
      const nombreProducto = productoData.get('nombre');
      
      setToastInfo({
        mostrar: true,
        mensaje: `¡Producto "${nombreProducto}" creado con éxito!`,
        tipo: 'success'
      });
      
      setTimeout(() => {
        navigate('/productos');
      }, 2500);
      
    } catch (error) {
      console.error('Error al guardar producto:', error);
      
      if (error.response) {
        console.error('Respuesta del servidor:', error.response.data);
        console.error('Estado HTTP:', error.response.status);
      }
      
      let errorMsg = 'Error al guardar el producto. Intenta usar imágenes más pequeñas.';
      
      if (error.response) {
        if (error.response.data.errors) {
          errorMsg = Object.values(error.response.data.errors).flat().join('. ');
        } else if (error.response.data.message) {
          errorMsg = error.response.data.message;
        }
      } else if (error.code === 'ECONNABORTED') {
        errorMsg = 'La operación tomó demasiado tiempo. Intenta con imágenes más pequeñas.';
      }
      
      setError(errorMsg);
      
      setToastInfo({
        mostrar: true,
        mensaje: 'Error al crear el producto. Revisa los datos e intenta nuevamente.',
        tipo: 'error'
      });
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setGuardando(false);
    }
  }, [navigate]);

  const handleCancel = useCallback(() => {
    localStorage.removeItem('productoFormData');
    localStorage.removeItem('hasMainImage');
    localStorage.removeItem('galleryImageCount');
    navigate('/productos');
  }, [navigate]);

  const handleVolverClick = useCallback(() => {
    localStorage.removeItem('productoFormData');
    localStorage.removeItem('hasMainImage');
    localStorage.removeItem('galleryImageCount');
    navigate('/productos');
  }, [navigate]);

  const closeError = useCallback(() => {
    setError('');
  }, []);

  if (loading) {
    return (
      <div className="crear-producto-page">
        <div className="spinner-container" style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'center',
          minHeight: '500px',
          width: '100%',
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          padding: '2rem',
          margin: '0 auto'
        }}>
          <div className="spinner">
            <i className="fas fa-spinner fa-spin fa-3x"></i>
            <p className="mt-2">Cargando categorías...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="crear-producto-page">
      <div className="page-header">
        <h1>Crear Nuevo Producto</h1>
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
      
      <div className="form-container">
        <FormularioProducto 
          categorias={categorias} 
          onSubmit={handleGuardarProducto}
          onCancel={handleCancel}
          guardando={guardando}
        />
      </div>
      
      <Toast
        mensaje={toastInfo.mensaje}
        tipo={toastInfo.tipo}
        mostrar={toastInfo.mostrar}
        setMostrar={(mostrar) => setToastInfo(prev => ({ ...prev, mostrar }))}
        duracion={3000} 
      />
    </div>
  );
};

export default CrearProducto;