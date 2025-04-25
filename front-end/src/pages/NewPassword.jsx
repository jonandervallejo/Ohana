import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa'; 
import './css/Login.css'; 
import './css/NewPassword.css';

const NewPassword = () => {
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const { token } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const emailFromUrl = params.get('email');
    
    if (emailFromUrl) {
      setEmail(emailFromUrl);
    }
    
    if (!token) {
      setTokenValid(false);
      setError('El enlace para restablecer la contraseña no es válido o ha expirado.');
    }
  }, [token, location.search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== passwordConfirmation) {
      setError('Las contraseñas no coinciden.');
      return;
    }
  
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
  
    if (!email) {
      setError('El correo electrónico es requerido.');
      return;
    }
  
    setLoading(true);
    setError('');
  
    try {
      console.log("Enviando solicitud de restablecimiento para:", email);
      
      const response = await fetch('http://ohanatienda.ddns.net:8000/api/password/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          password: password,
          password_confirmation: passwordConfirmation,
          token: token
        }),
      });
  
      const data = await response.json();
      
      console.log("Respuesta del servidor:", response.status, data);
  
      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        if (data.message && data.message.includes("token")) {
          setError('El enlace de restablecimiento ha expirado o ya fue utilizado. Solicita uno nuevo.');
        } else if (data.message && data.message.includes("reciente")) {
          setError('No puedes cambiar la contraseña tan seguido. Por favor, inténtalo más tarde.');
        } else if (data.errors && data.errors.password) {
          setError(`Error de contraseña: ${data.errors.password[0]}`);
        } else {
          setError(data.message || 'No se pudo restablecer la contraseña. Intenta solicitar un nuevo enlace.');
        }
      }
    } catch (error) {
      console.error("Error de conexión:", error);
      setError('Error al conectar con el servidor. Verifica tu conexión a internet.');
    } finally {
      setLoading(false);
    }
  };

  if (!tokenValid) {
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
            <p className="login-subheader">Enlace no válido</p>
          </div>
          
          <div className="login-form">
            <div className="error-message">
              {error}
            </div>
            
            <button 
              className="btn-login"
              onClick={() => navigate('/login')}
            >
              Volver al inicio de sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
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
            <p className="login-subheader">¡Contraseña actualizada!</p>
          </div>
          
          <div className="login-form">
            <div className="success-message">
              Tu contraseña ha sido actualizada correctamente. <br />
              Serás redirigido al inicio de sesión en unos segundos...
            </div>
            
            <button 
              className="btn-login"
              onClick={() => navigate('/login')}
            >
              Ir al inicio de sesión
            </button>
          </div>
          
          <div className="login-footer">
            <p className="copyright">&copy; {new Date().getFullYear()} Ohana</p>
          </div>
        </div>
      </div>
    );
  }

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
          <p className="login-subheader">Crea una nueva contraseña segura</p>
        </div>
        
        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label htmlFor="email">Correo Electrónico</label>
            <div className="input-field">
              <input
                type="email"
                id="email"
                className="form-control"
                value={email}
                readOnly
                disabled
                style={{ backgroundColor: "#f5f5f5", opacity: 0.9 }}
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Nueva contraseña</label>
            <div className="password-container">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Mínimo 8 caracteres"
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
          
          <div className="form-group">
            <label htmlFor="passwordConfirmation">Confirmar contraseña</label>
            <div className="password-container">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="passwordConfirmation"
                className="form-control"
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                required
                placeholder="Confirma tu nueva contraseña"
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
            className="btn-login"
            disabled={loading}
          >
            {loading ? 'Procesando...' : 'Cambiar contraseña'}
          </button>
          
          <Link to="/login" className="reset-password-link">
            Volver al inicio de sesión
          </Link>
        </form>
        
        <div className="login-footer">
          <p className="copyright">&copy; {new Date().getFullYear()} Ohana</p>
        </div>
      </div>
    </div>
  );
};

export default NewPassword;