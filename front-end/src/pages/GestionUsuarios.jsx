import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import './css/GestionUsuarios.css';
import { FaSearch, FaPlus, FaEdit, FaTrash, FaUserCog, FaExclamationTriangle, FaCheck, FaLock, FaLockOpen } from 'react-icons/fa';

const GestionUsuarios = () => {
  const { usuario, isAdmin, ROLE_ADMIN, ROLE_TECNICO, ROLE_CLIENTE } = useContext(AuthContext);
  const [usuarios, setUsuarios] = useState([]);
  const [filteredUsuarios, setFilteredUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    nombre: '',
    apellidos: '',
    email: '',
    password: '',
    id_rol: ROLE_TECNICO,
    telefono: '',
    activo: true
  });

  useEffect(() => {
    fetchUsuarios();
  }, []);

  useEffect(() => {
    if (busqueda.trim() === '') {
      setFilteredUsuarios(usuarios);
    } else {
      const searchTerm = busqueda.toLowerCase();
      const filtered = usuarios.filter(user => 
        user.nombre?.toLowerCase().includes(searchTerm) ||
        user.apellidos?.toLowerCase().includes(searchTerm) ||
        user.email?.toLowerCase().includes(searchTerm) ||
        renderRol(user.id_rol).toLowerCase().includes(searchTerm)
      );
      setFilteredUsuarios(filtered);
    }
  }, [busqueda, usuarios]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const fetchUsuarios = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      
      console.log('Intentando cargar usuarios con token:', token ? 'Token presente' : 'Token ausente');
      
      const response = await fetch('http://88.15.26.49:8000/api/usuarios', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      
      console.log('Código de estado de respuesta:', response.status);
      
      const data = await response.json().catch(e => {
        console.error('Error al parsear respuesta:', e);
        return { message: 'Error al procesar la respuesta del servidor' };
      });
      
      if (!response.ok) {
        throw new Error(data.message || `Error HTTP: ${response.status}`);
      }
      
      console.log('Datos recibidos:', data.length, 'usuarios');
      
      const filteredData = Array.isArray(data) 
        ? data.filter(user => user.id_rol !== ROLE_CLIENTE)
        : [];
      
      setUsuarios(filteredData);
      setFilteredUsuarios(filteredData);
    } catch (error) {
      console.error('Error detallado cargando usuarios:', error);
      setError(`Error al cargar los usuarios: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleOpenCreateForm = () => {
    setFormData({
      nombre: '',
      apellidos: '',
      email: '',
      password: '',
      id_rol: ROLE_TECNICO,
      telefono: '',
      activo: true
    });
    setEditingUser(null);
    setShowForm(true);
  };

  const handleOpenEditForm = (user) => {
    setFormData({
      id: user.id,
      nombre: user.nombre || '',
      apellidos: user.apellidos || '',
      email: user.email || '',
      password: '', 
      id_rol: user.id_rol || ROLE_TECNICO,
      telefono: user.telefono || '',
      activo: user.activo !== false 
    });
    setEditingUser(user);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingUser(null);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    setError(null);
    setActionLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const isEdit = !!editingUser;
      
      const url = isEdit 
        ? `http://88.15.26.49:8000/api/usuarios/${editingUser.id}` 
        : 'http://88.15.26.49:8000/api/usuarios';
      
      const method = isEdit ? 'PUT' : 'POST';
      
      const payload = { ...formData };
      if (isEdit && !payload.password) {
        delete payload.password;
      }
      
      console.log(`Enviando solicitud ${method} a ${url}`);
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json().catch(e => {
        console.error('Error al parsear respuesta:', e);
        return { message: 'Error al procesar la respuesta del servidor' };
      });
      
      if (!response.ok) {
        throw new Error(data.message || `Error HTTP: ${response.status}`);
      }
      
      setSuccessMessage(isEdit 
        ? `Usuario ${formData.nombre} actualizado correctamente` 
        : `Usuario ${formData.nombre} creado correctamente`);
      
      await fetchUsuarios();
      handleCloseForm();
      
    } catch (error) {
      console.error('Error guardando usuario:', error);
      setError(error.message || 'Error al guardar el usuario. Intente nuevamente.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`¿Está seguro de que desea eliminar al usuario ${userName}?`)) {
      return;
    }
    
    setActionLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://88.15.26.49:8000/api/usuarios/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      
      const data = await response.json().catch(e => {
        return { message: 'Error al procesar la respuesta del servidor' };
      });
      
      if (!response.ok) {
        throw new Error(data.message || `Error HTTP: ${response.status}`);
      }
      
      setSuccessMessage(`Usuario ${userName} eliminado correctamente`);
      
      await fetchUsuarios();
      
    } catch (error) {
      console.error('Error eliminando usuario:', error);
      setError(error.message || 'Error al eliminar el usuario. Intente nuevamente.');
    } finally {
      setActionLoading(false);
    }
  };

  const renderRol = (idRol) => {
    switch (parseInt(idRol)) {
      case ROLE_ADMIN:
        return 'Administrador';
      case ROLE_TECNICO:
        return 'Técnico';
      default:
        return 'Desconocido';
    }
  };

  return (
    <div className="gestion-usuarios-container">
      <div className="gestion-header">
        <h1>Gestión de Usuarios</h1>
        <div className="gestion-actions">
          <div className="search-container">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Buscar usuarios..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="search-input"
            />
          </div>
          
          {isAdmin() && (
            <button 
              className="btn-add-user"
              onClick={handleOpenCreateForm}
              disabled={actionLoading}
            >
              <FaPlus /> Nuevo Usuario
            </button>
          )}
        </div>
      </div>
      
      {error && (
        <div className="error-message">
          <FaExclamationTriangle style={{ marginRight: '8px' }} />
          {error}
        </div>
      )}
      
      {successMessage && (
        <div className="success-message">
          <FaCheck style={{ marginRight: '8px' }} />
          {successMessage}
        </div>
      )}
      
      {loading ? (
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Cargando usuarios...</p>
        </div>
      ) : (
        <>
          {filteredUsuarios.length === 0 ? (
            <div className="no-results">
              {busqueda ? 
                'No se encontraron usuarios que coincidan con la búsqueda' : 
                'No hay usuarios para mostrar'
              }
            </div>
          ) : (
            <div className="usuarios-table-container">
              <table className="usuarios-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>Teléfono</th>
                    <th>Rol</th>
                    <th>Estado</th>
                    {isAdmin() && <th>Acciones</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredUsuarios.map(user => (
                    <tr key={user.id} className={!user.activo ? 'inactive-user' : ''}>
                      <td>{`${user.nombre || ''} ${user.apellidos || ''}`}</td>
                      <td>{user.email}</td>
                      <td>{user.telefono || 'N/A'}</td>
                      <td>
                        {user.id_rol === ROLE_ADMIN ? 
                          <span className="badge-admin">{renderRol(user.id_rol)}</span> : 
                          <span className="badge-tecnico">{renderRol(user.id_rol)}</span>
                        }
                      </td>
                      <td className={user.activo !== false ? 'user-active' : 'user-inactive'}>
                        {user.activo !== false ? (
                          <span><FaLock style={{ marginRight: '5px' }} /> Activo</span>
                        ) : (
                          <span><FaLockOpen style={{ marginRight: '5px' }} /> Inactivo</span>
                        )}
                      </td>
                      {isAdmin() && (
                        <td className="actions-cell">
                          <button 
                            className="btn-action edit"
                            onClick={() => handleOpenEditForm(user)}
                            title="Editar usuario"
                            disabled={actionLoading}
                          >
                            <FaEdit />
                          </button>
                          
                          <button 
                            className="btn-action delete"
                            onClick={() => handleDeleteUser(user.id, user.nombre)}
                            title="Eliminar usuario"
                            disabled={actionLoading || user.id === usuario.id}
                          >
                            <FaTrash />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
      
      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
              <button className="modal-close" onClick={handleCloseForm} disabled={actionLoading}>&times;</button>
            </div>
            <form onSubmit={handleSaveUser} className="user-form">
              <div className="form-group">
                <label htmlFor="nombre">Nombre*</label>
                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleFormChange}
                  required
                  disabled={actionLoading}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="apellidos">Apellidos</label>
                <input
                  type="text"
                  id="apellidos"
                  name="apellidos"
                  value={formData.apellidos}
                  onChange={handleFormChange}
                  disabled={actionLoading}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="email">Email*</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  required
                  disabled={actionLoading}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="password">
                  {editingUser ? 'Contraseña (dejar vacío para mantener)' : 'Contraseña*'}
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleFormChange}
                  required={!editingUser}
                  disabled={actionLoading}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="telefono">Teléfono</label>
                <input
                  type="tel"
                  id="telefono"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleFormChange}
                  disabled={actionLoading}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="id_rol">Rol*</label>
                <select
                  id="id_rol"
                  name="id_rol"
                  value={formData.id_rol}
                  onChange={handleFormChange}
                  required
                  disabled={actionLoading}
                >
                  <option value={ROLE_TECNICO}>Técnico</option>
                  <option value={ROLE_ADMIN}>Administrador</option>
                </select>
              </div>
              
              <div className="form-group checkbox-group">
                <label htmlFor="activo">
                  <input
                    type="checkbox"
                    id="activo"
                    name="activo"
                    checked={formData.activo}
                    onChange={handleFormChange}
                    disabled={actionLoading}
                  />
                  Usuario activo
                </label>
              </div>
              
              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn-cancel" 
                  onClick={handleCloseForm}
                  disabled={actionLoading}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn-save"
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Procesando...' : (editingUser ? 'Actualizar' : 'Crear')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionUsuarios;