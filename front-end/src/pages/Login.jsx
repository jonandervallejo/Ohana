import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './css/Login.css';
import { FaEye, FaEyeSlash, FaLock, FaLockOpen, FaUserLock } from 'react-icons/fa'; 

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSecure, setIsSecure] = useState(false);
  
  const { login, ROLE_CLIENTE } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    setIsSecure(window.location.protocol === 'https:');
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const result = await login(email, password);
      if (result.success) {
        navigate('/');
      } else {
        if (result.message && result.message.includes('clientes no tienen acceso')) {
          setError(
            <div className="client-error">
              <FaUserLock style={{ marginRight: '8px' }} />
              Los clientes no tienen acceso a este sistema. Por favor, utilice la aplicación para clientes.
            </div>
          );
        } else {
          setError(result.message || 'Error al iniciar sesión');
        }
      }
    } catch (error) {
      setError('Error al conectar con el servidor. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <div className="login-logo">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 13v7a1 1 0 01-1 1H4a1 1 0 01-1-1v-7h2v6h14v-6h2zM9 14h6v3H9v-3zM19 7h-3V5a3 3 0 00-6 0v2H7c-.6 0-1 .4-1 1v8h2v-7h12v7h2V8c0-.6-.4-1-1-1zm-5 0h-4V5a2 2 0 114 0v2z"/>
            </svg>
            <h1>Ohana</h1>
          </div>
          <p className="login-subheader">Acceso al sistema de gestión</p>
          
          <div style={{ 
            padding: '8px', 
            margin: '10px 0', 
            borderRadius: '4px',
            backgroundColor: isSecure ? '#e8f5e9' : '#ffebee',
            color: isSecure ? '#2e7d32' : '#c62828',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {isSecure ? (
              <>
                <FaLock style={{ marginRight: '8px' }} /> 
                <span>Conexión segura (HTTPS)</span>
              </>
            ) : (
              <>
                <FaLockOpen style={{ marginRight: '8px' }} /> 
                <span>Conexión no segura (HTTP)</span>
              </>
            )}
          </div>
          
        </div>
        
        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="error-message">{error}</div>}
          <div className="form-group">
            <label htmlFor="email">Correo Electrónico</label>
            <input
              type="email"
              id="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ejemplo@empresa.com"
              required
              autoFocus
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <div className="password-container">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresa tu contraseña"
                required
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>
          
          <button type="submit" className="btn-login" disabled={isLoading}>
            {isLoading ? 'Cargando...' : 'Iniciar Sesión'}
          </button>
          
          <Link to="/reset-password" className="reset-password-link">
            ¿Olvidaste tu contraseña?
          </Link>
        </form>
        
        <div className="login-footer">
          <p className="copyright">© 2025 Ohana</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;