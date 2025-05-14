import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './css/ResetPassword.css';

const ResetPassword = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus({ type: '', message: '' });

    try {
      const response = await fetch('https://ohanatienda.ddns.net/api/password/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus({
          type: 'success',
          message: 'Se ha enviado un correo con las instrucciones.'
        });
        setEmail('');
      } else {
        setStatus({
          type: 'error',
          message: data.message || 'No se pudo procesar tu solicitud.'
        });
      }
    } catch (error) {
      setStatus({
        type: 'error',
        message: 'Error al conectar con el servidor.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="reset-password-page">
      <div className="reset-password-container">
        <div className="reset-header">
          <div className="reset-logo">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 13v7a1 1 0 01-1 1H4a1 1 0 01-1-1v-7h2v6h14v-6h2zM9 14h6v3H9v-3zM19 7h-3V5a3 3 0 00-6 0v2H7c-.6 0-1 .4-1 1v8h2v-7h12v7h2V8c0-.6-.4-1-1-1zm-5 0h-4V5a2 2 0 114 0v2z"/>
            </svg>
            <h1>Ohana</h1>
          </div>
          <h2>Restablecer Contraseña</h2>
          <p>Ingresa tu correo para recibir instrucciones</p>
        </div>
        
        <div className="reset-form-wrapper">
          {status.message && (
            <div className={`status-message ${status.type}`}>
              {status.message}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Correo Electrónico</label>
              <div className="input-field">
                <input
                  type="email"
                  id="email"
                  className="form-control"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@empresa.com"
                  required
                  disabled={isSubmitting || status.type === 'success'}
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn-reset"
              disabled={isSubmitting || status.type === 'success'}
            >
              {isSubmitting ? 'Procesando...' : 'Enviar'}
            </button>
            
            <Link to="/login" className="back-to-login">
              Volver a Iniciar Sesión
            </Link>
          </form>
        </div>
        
        <div className="reset-footer">
          <p className="copyright">© 2025 Ohana</p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;