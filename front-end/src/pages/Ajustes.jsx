import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { FaEye, FaEyeSlash, FaSave, FaLock } from 'react-icons/fa';
import './css/Ajustes.css';

const Ajustes = () => {
  const { usuario, token, setUsuario } = useContext(AuthContext);
  const [userData, setUserData] = useState({
    nombre: '',
    apellido1: '',
    apellido2: '',
    email: '',
    telefono: '',
  });
  
  const [passwordData, setPasswordData] = useState({
    password_actual: '',
    password: '',
    password_confirmation: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  useEffect(() => {
    if (usuario) {
      setUserData({
        nombre: usuario.nombre || '',
        apellido1: usuario.apellido1 || '',
        apellido2: usuario.apellido2 || '',
        email: usuario.email || '',
        telefono: usuario.telefono || ''
      });
    }
  }, [usuario]);
  
  const handleUserDataChange = (e) => {
    setUserData({
      ...userData,
      [e.target.name]: e.target.value
    });
  };
  
  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    });
  };
  
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await fetch('http://ohanatienda.ddns.net:8000/api/profile/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(userData)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSuccess('Datos actualizados correctamente');
        setUsuario(data.usuario);
      } else {
        setError(data.message || 'Error al actualizar el perfil');
      }
    } catch (error) {
      setError('Error de conexión. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (passwordData.password !== passwordData.password_confirmation) {
      setError('Las contraseñas no coinciden');
      return;
    }
    
    if (passwordData.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await fetch('http://ohanatienda.ddns.net:8000/api/profile/password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(passwordData)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSuccess('Contraseña actualizada correctamente');
        setPasswordData({
          password_actual: '',
          password: '',
          password_confirmation: '',
        });
      } else {
        setError(data.message || 'Error al cambiar la contraseña');
      }
    } catch (error) {
      setError('Error de conexión. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="ajustes-container">
      <h1 className="ajustes-title">Ajustes de cuenta</h1>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      
      <div className="ajustes-grid">
        <div className="ajustes-panel">
          <h2>Datos personales</h2>
          <form onSubmit={handleUpdateProfile}>
            <div className="form-group">
              <label htmlFor="nombre">Nombre</label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={userData.nombre}
                onChange={handleUserDataChange}
                className="form-control"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="apellido1">Primer apellido</label>
              <input
                type="text"
                id="apellido1"
                name="apellido1"
                value={userData.apellido1 || ''}
                onChange={handleUserDataChange}
                className="form-control"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="apellido2">Segundo apellido</label>
              <input
                type="text"
                id="apellido2"
                name="apellido2"
                value={userData.apellido2 || ''}
                onChange={handleUserDataChange}
                className="form-control"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="email">Correo electrónico</label>
              <input
                type="email"
                id="email"
                name="email"
                value={userData.email}
                className="form-control"
                readOnly
                disabled
              />
              <small>El correo electrónico no puede ser cambiado</small>
            </div>
            
            <div className="form-group">
              <label htmlFor="telefono">Teléfono</label>
              <input
                type="text"
                id="telefono"
                name="telefono"
                value={userData.telefono || ''}
                onChange={handleUserDataChange}
                className="form-control"
              />
            </div>
            
            <button 
              type="submit" 
              className="btn-save"
              disabled={loading}
            >
              {loading ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </form>
        </div>
        
        <div className="ajustes-panel">
          <h2>Cambiar contraseña</h2>
          <form onSubmit={handleChangePassword}>
            <div className="form-group">
              <label htmlFor="password_actual">Contraseña actual</label>
              <div className="password-container">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  id="password_actual"
                  name="password_actual"
                  value={passwordData.password_actual}
                  onChange={handlePasswordChange}
                  className="form-control"
                  required
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Nueva contraseña</label>
              <div className="password-container">
                <input
                  type={showNewPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={passwordData.password}
                  onChange={handlePasswordChange}
                  className="form-control"
                  required
                  minLength="8"
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="password_confirmation">Confirmar nueva contraseña</label>
              <div className="password-container">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="password_confirmation"
                  name="password_confirmation"
                  value={passwordData.password_confirmation}
                  onChange={handlePasswordChange}
                  className="form-control"
                  required
                  minLength="8"
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>
            
            <button 
              type="submit" 
              className="btn-change-password"
              disabled={loading}
            >
              <FaLock /> {loading ? 'Cambiando...' : 'Cambiar contraseña'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Ajustes;