import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './css/CrearProducto.css';
import Toast from '../components/ui/Toast';
const API_URL = 'http://88.15.46.106:8000/api';

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

    return file;
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

  const handleMainImageChange = useCallback((e) => {
    try {
      const file = Array.isArray(e.target.files) ? e.target.files[0] : e.target.files[0];
      if (!file) return;
      
      if (mainImagePreview) {
        URL.revokeObjectURL(mainImagePreview);
      }

      setMainImage(file);
      const previewURL = URL.createObjectURL(file);
      setMainImagePreview(previewURL);
      
      localStorage.setItem('hasMainImage', 'true');
    } catch (error) {
      console.error("Error al manejar la imagen principal:", error);
      alert("Error al procesar la imagen principal. Por favor, intenta con otra imagen.");
    }
  }, [mainImagePreview]);

  const handleGalleryImagesChange = useCallback((e) => {
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

      filesToAdd.forEach(file => {
        newImages.push(file);
        try {
          newPreviews.push(URL.createObjectURL(file));
        } catch (err) {
          console.error("Error creando URL para preview:", err);
          newPreviews.push("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAABmJLR0QA/wD/AP+gvaeTAAAAxklEQVR4nO3bsQ3CMBRF0UBYgIqePWAIamZgFkZgAqrUoXCBBVhEyvecc+tI77ePFNlxAAAAAAAAeKhp+Y5vZ9y3Le9TpkmS430/Z908Z9yXZO9TpkmSfb/Oz5/35N24LjCttX7vU0q5tDiG31VVm4jY/O1dMCRDMiRDMiRDMiRDMiRDMiRDMiRDMiRDMiRDMiRDMiRDMiRDMiRDMiRDMiRDMiRDMiRDMiRDMiRDMiRDMiRDMqRNRFxbHMN/VNUhIp6tbwEAAAAAAACAlQ/sBg5j3UsCgQAAAABJRU5ErkJggg==");
        }
      });

      setGalleryImages(newImages);
      setGalleryPreviews(newPreviews);
      
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

    Object.keys(formData).forEach(key => {
      if (formData[key]) {
        productoData.append(key, formData[key]);
      }
    });

    if (mainImage) {
      productoData.append('imagen', mainImage);
      console.log("Imagen principal agregada:", mainImage.name);
    }

    if (galleryImages.length > 0) {
      const imagenesArray = [];
      
      for (let i = 0; i < galleryImages.length; i++) {
        const timestamp = Date.now();
        const imageName = `galeria_${timestamp}_${i}.jpg`;
        
        productoData.append(`imagenes_files[]`, galleryImages[i]);
        
        imagenesArray.push(imageName);
      }
      
      productoData.append('imagenes', JSON.stringify(imagenesArray));
      
      console.log("Imágenes de galería agregadas:", galleryImages.length);
      console.log("JSON de imágenes:", JSON.stringify(imagenesArray));
    }

    localStorage.removeItem('productoFormData');
    localStorage.removeItem('hasMainImage');
    localStorage.removeItem('galleryImageCount');
    
    onSubmit(productoData);
  }, [formData, mainImage, galleryImages, onSubmit]);

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
        }
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
        console.error('Encabezados:', error.response.headers);
      } else if (error.request) {
        console.error('No se recibió respuesta del servidor');
      } else {
        console.error('Error al configurar la petición:', error.message);
      }
      
      let errorMsg = 'Error al guardar el producto. Por favor, intenta de nuevo.';
      
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
        <div className="spinner-container">
          <div className="spinner">
            <i className="fas fa-spinner fa-spin fa-3x"></i>
            <p className="mt-2">Cargando categorías...</p>
          </div>
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