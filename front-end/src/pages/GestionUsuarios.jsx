import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import './css/GestionUsuarios.css';
import { FaSearch, FaPlus, FaEdit, FaTrash, FaUserCog, FaExclamationTriangle, FaCheck, FaFilter, FaChevronLeft, FaChevronRight, FaUser } from 'react-icons/fa';
import ConfirmacionModal from '../components/ui/CofirmacionModal';

const GestionUsuarios = () => {
  const { usuario, isAdmin, ROLE_ADMIN, ROLE_TECNICO, ROLE_CLIENTE } = useContext(AuthContext);
  const [usuarios, setUsuarios] = useState([]);
  const [filteredUsuarios, setFilteredUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroRol, setFiltroRol] = useState('todos');
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6; // Display 6 users per page
  
  // State for delete confirmation modal
  const [confirmDelete, setConfirmDelete] = useState({
    show: false,
    userId: null,
    userName: ''
  });
  
  const [formData, setFormData] = useState({
    nombre: '',
    apellido1: '',
    apellido2: '',
    email: '',
    password: '',
    id_rol: ROLE_TECNICO,
    telefono: ''
  });

  useEffect(() => {
    fetchUsuarios();
  }, []);

  useEffect(() => {
    // Apply both text search and role filter
    let filtered = usuarios;
    
    // First apply role filter if not "todos"
    if (filtroRol !== 'todos') {
      const rolId = parseInt(filtroRol);
      filtered = filtered.filter(user => user.id_rol === rolId);
    }
    
    // Then apply text search if present
    if (busqueda.trim() !== '') {
      const searchTerm = busqueda.toLowerCase();
      filtered = filtered.filter(user => 
        user.nombre?.toLowerCase().includes(searchTerm) ||
        user.apellido1?.toLowerCase().includes(searchTerm) ||
        user.apellido2?.toLowerCase().includes(searchTerm) ||
        user.email?.toLowerCase().includes(searchTerm) ||
        renderRol(user.id_rol).toLowerCase().includes(searchTerm)
      );
    }
    
    // Reset to first page when filters change
    setCurrentPage(1);
    setFilteredUsuarios(filtered);
  }, [busqueda, usuarios, filtroRol]);

  // Pagination calculation
  const indexOfLastUser = currentPage * itemsPerPage;
  const indexOfFirstUser = indexOfLastUser - itemsPerPage;
  const currentUsers = filteredUsuarios.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsuarios.length / itemsPerPage);

  // Pagination handlers
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

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
      
      // First fetch the regular users (admins and technicians)
      const response = await fetch('http://88.15.46.106:8000/api/usuarios', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      
      console.log('Código de estado de respuesta:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }));
        throw new Error(errorData.message || `Error HTTP: ${response.status}`);
      }
      
      let usersData = await response.json().catch(e => {
        console.error('Error al parsear respuesta:', e);
        return [];
      });
      
      // Now fetch clients if available
      try {
        const clientsResponse = await fetch('http://88.15.46.106:8000/api/clientes', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });
        
        if (clientsResponse.ok) {
          const clientsData = await clientsResponse.json();
          if (Array.isArray(clientsData)) {
            // Add clients to the users array
            usersData = [...usersData, ...clientsData];
            console.log('Clientes cargados:', clientsData.length);
          }
        }
      } catch (clientError) {
        console.warn('No se pudieron cargar los clientes:', clientError);
        // Continue without clients, don't fail the whole operation
      }
      
      console.log('Total de usuarios cargados:', usersData.length);
      
      // No longer filtering out clients
      const allUsers = Array.isArray(usersData) ? usersData : [];
      
      setUsuarios(allUsers);
      setFilteredUsuarios(allUsers);
    } catch (error) {
      console.error('Error detallado cargando usuarios:', error);
      setError(`Error al cargar los usuarios: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Rest of your existing functions...
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  const handleRolFilterChange = (e) => {
    setFiltroRol(e.target.value);
  };

  const handleOpenCreateForm = () => {
    setFormData({
      nombre: '',
      apellido1: '',
      apellido2: '',
      email: '',
      password: '',
      id_rol: ROLE_TECNICO,
      telefono: ''
    });
    setEditingUser(null);
    setShowForm(true);
  };

  const handleOpenEditForm = (user) => {
    setFormData({
      id: user.id,
      nombre: user.nombre || '',
      apellido1: user.apellido1 || '',
      apellido2: user.apellido2 || '',
      email: user.email || '',
      password: '', 
      id_rol: user.id_rol || ROLE_TECNICO,
      telefono: user.telefono || ''
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
        ? `http://88.15.46.106:8000/api/usuarios/${editingUser.id}` 
        : 'http://88.15.46.106:8000/api/usuarios';
      
      const method = isEdit ? 'PUT' : 'POST';
      
      const payload = { ...formData };
      
      // Ensure apellido1 is never empty
      if (!payload.apellido1 || payload.apellido1.trim() === '') {
        payload.apellido1 = '-'; // Default value if empty
      }
      
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

  const confirmarEliminarUsuario = (userId, userName) => {
    setConfirmDelete({
      show: true,
      userId: userId,
      userName: userName
    });
  };

  const cancelarEliminar = () => {
    setConfirmDelete({
      show: false,
      userId: null,
      userName: ''
    });
  };

  const handleDeleteUser = async (userId) => {
    setActionLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://88.15.46.106:8000/api/usuarios/${userId}`, {
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
      
      setSuccessMessage(`Usuario ${confirmDelete.userName} eliminado correctamente`);
      
      await fetchUsuarios();
      
    } catch (error) {
      console.error('Error eliminando usuario:', error);
      setError(error.message || 'Error al eliminar el usuario. Intente nuevamente.');
    } finally {
      setActionLoading(false);
    }
  };

  // Updated to include ROLE_CLIENTE
  const renderRol = (idRol) => {
    switch (parseInt(idRol)) {
      case ROLE_ADMIN:
        return 'Administrador';
      case ROLE_TECNICO:
        return 'Técnico';
      case ROLE_CLIENTE:
        return 'Cliente';
      default:
        return 'Desconocido';
    }
  };

  // Pagination component
  const Pagination = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5; // Show max 5 page numbers
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    // Adjust start page if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    
    return (
      <div className="pagination-container">
        <div className="pagination">
          <button 
            className="pagination-button"
            onClick={goToPreviousPage}
            disabled={currentPage === 1 || actionLoading}
          >
            <FaChevronLeft />
          </button>
          
          {startPage > 1 && (
            <>
              <button
                className="pagination-button"
                onClick={() => handlePageChange(1)}
              >
                1
              </button>
              {startPage > 2 && <span className="pagination-ellipsis">...</span>}
            </>
          )}
          
          {pageNumbers.map(number => (
            <button
              key={number}
              className={`pagination-button ${currentPage === number ? 'active' : ''}`}
              onClick={() => handlePageChange(number)}
              disabled={actionLoading}
            >
              {number}
            </button>
          ))}
          
          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && <span className="pagination-ellipsis">...</span>}
              <button
                className="pagination-button"
                onClick={() => handlePageChange(totalPages)}
              >
                {totalPages}
              </button>
            </>
          )}
          
          <button 
            className="pagination-button"
            onClick={goToNextPage}
            disabled={currentPage === totalPages || actionLoading}
          >
            <FaChevronRight />
          </button>
        </div>
        
        <div className="pagination-info">
          Mostrando {indexOfFirstUser + 1}-{Math.min(indexOfLastUser, filteredUsuarios.length)} de {filteredUsuarios.length} usuarios
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="productos-page">
        <div className="spinner-container" style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          marginLeft: '200px',
          position: 'center',
          minHeight: '500px',
          width: '100%',
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          padding: '2rem'
        }}>
          <div className="spinner">
            <i className="fas fa-spinner fa-spin fa-3x"></i>
            <p className="mt-2">Cargando usuarios...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !usuarios.length) {
    return (
      <div className="gestion-usuarios-container">
        <div className="error-container">
          <i className="fas fa-exclamation-triangle"></i>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="gestion-usuarios-container">
      {/* Header con título y botón de nuevo usuario */}
      <div className="header-container">
        <h1 className="inventory-title">Gestión de Usuarios</h1>
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
      
      {/* Filtros separados debajo del título */}
      <div className="filtros-container">
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
        
        <div className="role-filter-container">
          <FaFilter className="filter-icon" />
          <select
            value={filtroRol}
            onChange={handleRolFilterChange}
            className="role-filter"
            disabled={actionLoading}
          >
            <option value="todos">Todos los roles</option>
            <option value={ROLE_ADMIN}>Administradores</option>
            <option value={ROLE_TECNICO}>Técnicos</option>
            <option value={ROLE_CLIENTE}>Clientes</option>
          </select>
        </div>
      </div>
      
      {error && (
        <div className="error-container">
          <i className="fas fa-exclamation-triangle"></i>
          <p>{error}</p>
        </div>
      )}
      
      {successMessage && (
        <div className="success-message">
          <FaCheck style={{ marginRight: '8px' }} />
          {successMessage}
        </div>
      )}
      
      {filteredUsuarios.length === 0 ? (
        <div className="sin-resultados">
          <i className="fas fa-users-slash"></i>
          <p>
            {(busqueda || filtroRol !== 'todos') ? 
              'No se encontraron usuarios que coincidan con los filtros' : 
              'No hay usuarios para mostrar'
            }
          </p>
        </div>
      ) : (
        <>
          <div className="usuarios-table-container">
            <table className="usuarios-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Teléfono</th>
                  <th>Rol</th>
                  {isAdmin() && <th>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {currentUsers.map(user => (
                  <tr key={user.id}>
                    <td>{`${user.nombre || ''} ${user.apellido1 || ''} ${user.apellido2 || ''}`}</td>
                    <td>{user.email}</td>
                    <td>{user.telefono || 'N/A'}</td>
                    <td>
                      {user.id_rol === ROLE_ADMIN ? (
                        <span className="badge-admin">{renderRol(user.id_rol)}</span>
                      ) : user.id_rol === ROLE_TECNICO ? (
                        <span className="badge-tecnico">{renderRol(user.id_rol)}</span>
                      ) : (
                        <span className="badge-cliente">{renderRol(user.id_rol)}</span>
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
                          onClick={() => confirmarEliminarUsuario(user.id, user.nombre)}
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
          
          {/* Pagination */}
          {filteredUsuarios.length > itemsPerPage && <Pagination />}
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
                <label htmlFor="apellido1">Primer Apellido*</label>
                <input
                  type="text"
                  id="apellido1"
                  name="apellido1"
                  value={formData.apellido1}
                  onChange={handleFormChange}
                  required
                  disabled={actionLoading}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="apellido2">Segundo Apellido</label>
                <input
                  type="text"
                  id="apellido2"
                  name="apellido2"
                  value={formData.apellido2}
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
                  <option value={ROLE_CLIENTE}>Cliente</option>
                </select>
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
      
      {confirmDelete.show && (
        <ConfirmacionModal 
          titulo="Eliminar usuario"
          mensaje={`¿Estás seguro de que deseas eliminar al usuario ${confirmDelete.userName}?`}
          onConfirm={() => {
            handleDeleteUser(confirmDelete.userId);
            cancelarEliminar();
          }}
          onCancel={cancelarEliminar}
          confirmText={<><FaTrash /> Eliminar</>}
          cancelText="Cancelar"
          tipo="danger"
        />
      )}
    </div>
  );
};

export default GestionUsuarios;