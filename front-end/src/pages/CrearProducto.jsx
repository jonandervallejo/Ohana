import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './css/CrearProducto.css';
import Toast from '../components/ui/Toast'; // Importamos el componente Toast

const API_URL = 'http://88.15.26.49:8000/api';

// Componente mejorado para manejar la selección de imágenes (compatible con móviles)
const ImageSelector = React.memo(({ label, buttonText, icon, multiple, onChange, previews, onRemove }) => {
  const fileInputRef = useRef(null);

  const handleClick = () => {
    fileInputRef.current.click();
  };

  // Captura y optimización de imágenes
  const processImageFile = (file) => {
    // Revisamos el tamaño de la imagen
    const sizeInMB = file.size / (1024 * 1024);
    if (sizeInMB > 5) {
      alert(`La imagen "${file.name}" es demasiado grande (${sizeInMB.toFixed(2)}MB). El tamaño máximo es 5MB.`);
      return null;
    }

    // Verificamos tipo de archivo - más permisivo para móviles
    if (!file.type.startsWith('image/') && !file.type.includes('image')) {
      alert(`El archivo "${file.name}" no es una imagen válida.`);
      return null;
    }

    return file;
  };

  const handleFileChange = (e) => {
    const files = e.target.files;
    
    if (!files || files.length === 0) return;
    
    // Para selección múltiple
    if (multiple) {
      const processedFiles = [];
      
      for (let i = 0; i < files.length; i++) {
        const processedFile = processImageFile(files[i]);
        if (processedFile) {
          processedFiles.push(processedFile);
        }
      }
      
      if (processedFiles.length > 0) {
        // En lugar de DataTransfer, pasamos los archivos directamente
        onChange({
          target: {
            files: processedFiles
          }
        });
      }
    } 
    // Para selección única
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
  
  // Permitir captura directa desde cámara en móviles
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
          // Eliminamos el atributo capture para mejor compatibilidad
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

// Mover FormularioProducto fuera del componente principal
const FormularioProducto = ({ categorias, onSubmit, onCancel, guardando }) => {
  // Recuperar datos almacenados
  const storedData = localStorage.getItem('productoFormData');
  const initialFormData = storedData ? JSON.parse(storedData) : {
    nombre: '',
    descripcion: '',
    precio: '',
    id_categoria: '',
    tipo: '',
    talla: ''
  };

  const [formData, setFormData] = useState(initialFormData);
  const [mainImage, setMainImage] = useState(null);
  const [mainImagePreview, setMainImagePreview] = useState('');
  const [galleryImages, setGalleryImages] = useState([]);
  const [galleryPreviews, setGalleryPreviews] = useState([]);
  const [error, setError] = useState('');

  // Persistir datos del formulario
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

  const handleMainImageChange = useCallback((e) => {
    try {
      // En móviles, e.target.files puede ser un array
      const file = Array.isArray(e.target.files) ? e.target.files[0] : e.target.files[0];
      if (!file) return;
      
      // Limpiar URL previa
      if (mainImagePreview) {
        URL.revokeObjectURL(mainImagePreview);
      }

      // Guardar archivo e imagen de vista previa
      setMainImage(file);
      const previewURL = URL.createObjectURL(file);
      setMainImagePreview(previewURL);
      
      // Persistir la información de que hay una imagen
      localStorage.setItem('hasMainImage', 'true');
    } catch (error) {
      console.error("Error al manejar la imagen principal:", error);
      alert("Error al procesar la imagen principal. Por favor, intenta con otra imagen.");
    }
  }, [mainImagePreview]);

  const handleGalleryImagesChange = useCallback((e) => {
    try {
      // En móviles, e.target.files puede ser un array directamente
      const files = Array.isArray(e.target.files) ? e.target.files : Array.from(e.target.files || []);
      if (!files.length) return;
      
      const newImages = [...galleryImages];
      const newPreviews = [...galleryPreviews];

      // Limitar la cantidad de imágenes a 5 en total
      const remainingSlots = 5 - newImages.length;
      
      if (remainingSlots <= 0) {
        alert('Has alcanzado el límite máximo de 5 imágenes en la galería.');
        return;
      }
      
      // Solo agregar hasta el límite permitido
      const filesToAdd = files.slice(0, remainingSlots);

      filesToAdd.forEach(file => {
        newImages.push(file);
        try {
          newPreviews.push(URL.createObjectURL(file));
        } catch (err) {
          console.error("Error creando URL para preview:", err);
          // Usar una imagen placeholder si falla
          newPreviews.push("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAABmJLR0QA/wD/AP+gvaeTAAAAxklEQVR4nO3bsQ3CMBRF0UBYgIqePWAIamZgFkZgAqrUoXCBBVhEyvecc+tI77ePFNlxAAAAAAAAeKhp+Y5vZ9y3Le9TpkmS430/Z908Z9yXZO9TpkmSfb/Oz5/35N24LjCttX7vU0q5tDiG31VVm4jY/O1dMCRDMiRDMiRDMiRDMiRDMiRDMiRDMiRDMiRDMiRDMiRDMiRDMiRDMiRDMiRDMiRDMiRDMiRDMiRDMiRDMiRDMqRNRFxbHMN/VNUhIp6tbwEAAAAAAACAlQ/sBg5j3UsCgQAAAABJRU5ErkJggg==");
        }
      });

      setGalleryImages(newImages);
      setGalleryPreviews(newPreviews);
      
      // Persistir cantidad de imágenes
      localStorage.setItem('galleryImageCount', newImages.length);
    } catch (error) {
      console.error("Error al manejar las imágenes de la galería:", error);
      alert("Error al procesar las imágenes de la galería. Por favor, intenta con otras imágenes.");
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
    URL.revokeObjectURL(galleryPreviews[index]);
    setGalleryImages(prev => prev.filter((_, i) => i !== index));
    setGalleryPreviews(prev => prev.filter((_, i) => i !== index));
    
    const newCount = galleryImages.length - 1;
    localStorage.setItem('galleryImageCount', newCount > 0 ? newCount : '');
  }, [galleryImages, galleryPreviews]);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    setError('');

    if (!formData.nombre || !formData.descripcion || !formData.precio || !formData.id_categoria) {
      setError('Por favor, completa todos los campos obligatorios');
      return;
    }

    const productoData = new FormData();

    // Agregar datos del formulario
    Object.keys(formData).forEach(key => {
      if (formData[key]) {
        productoData.append(key, formData[key]);
      }
    });

    // Agregar imagen principal si existe
    if (mainImage) {
      productoData.append('imagen', mainImage);
      console.log("Imagen principal agregada:", mainImage.name);
    }

    // Agregar imágenes de galería si existen - MODIFICADO
    if (galleryImages.length > 0) {
      // Convertir las imágenes de galería a un array JSON para el backend
      const imagenesArray = [];
      
      // Agregar cada imagen individualmente a FormData con un nombre único
      for (let i = 0; i < galleryImages.length; i++) {
        const timestamp = Date.now();
        const imageName = `galeria_${timestamp}_${i}.jpg`;
        
        // Agregar la imagen al FormData para envío
        productoData.append(`imagenes_files[]`, galleryImages[i]);
        
        // Guardar la referencia en el array
        imagenesArray.push(imageName);
      }
      
      // Guardar el array como JSON en el campo imagenes
      productoData.append('imagenes', JSON.stringify(imagenesArray));
      
      console.log("Imágenes de galería agregadas:", galleryImages.length);
      console.log("JSON de imágenes:", JSON.stringify(imagenesArray));
    }

    // Limpiar datos guardados localmente
    localStorage.removeItem('productoFormData');
    localStorage.removeItem('hasMainImage');
    localStorage.removeItem('galleryImageCount');
    
    onSubmit(productoData);
  }, [formData, mainImage, galleryImages, onSubmit]);

  // Limpiar URLs al desmontar
  useEffect(() => {
    return () => {
      if (mainImagePreview) {
        URL.revokeObjectURL(mainImagePreview);
      }
      galleryPreviews.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

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
          <input
            type="text"
            id="tipo"
            name="tipo"
            value={formData.tipo}
            onChange={handleChange}
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

        <ImageSelector
          label="Imagen Principal"
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

// Componente principal
const CrearProducto = () => {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const navigate = useNavigate();
  
  // Estado para el toast
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
      
      // Mostrar en consola lo que estamos enviando (para depuración)
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
        }
      });
      
      console.log("Respuesta del servidor:", response.data);
      
      // Obtener el nombre del producto para el mensaje de éxito
      const nombreProducto = productoData.get('nombre');
      
      // Mostrar toast con mensaje de éxito
      setToastInfo({
        mostrar: true,
        mensaje: `¡Producto "${nombreProducto}" creado con éxito!`,
        tipo: 'success'
      });
      
      // Redirigir después de un breve retraso
      setTimeout(() => {
        navigate('/productos');
      }, 2500);
      
    } catch (error) {
      console.error('Error al guardar producto:', error);
      
      // Logging detallado para diagnóstico
      if (error.response) {
        console.error('Respuesta del servidor:', error.response.data);
        console.error('Estado HTTP:', error.response.status);
        console.error('Encabezados:', error.response.headers);
      } else if (error.request) {
        console.error('No se recibió respuesta del servidor');
      } else {
        console.error('Error al configurar la petición:', error.message);
      }
      
      // Obtener mensaje de error del servidor si existe
      let errorMsg = 'Error al guardar el producto. Por favor, intenta de nuevo.';
      
      if (error.response) {
        if (error.response.data.errors) {
          errorMsg = Object.values(error.response.data.errors).flat().join('. ');
        } else if (error.response.data.message) {
          errorMsg = error.response.data.message;
        }
      }
      
      setError(errorMsg);
      
      // Mostrar toast con mensaje de error
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
      
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando categorías...</p>
        </div>
      ) : (
        <div className="form-container">
          <FormularioProducto 
            categorias={categorias} 
            onSubmit={handleGuardarProducto}
            onCancel={handleCancel}
            guardando={guardando}
          />
        </div>
      )}
      
      {/* Mostrar Toast de notificación */}
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