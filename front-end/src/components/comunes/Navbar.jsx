import React, { useContext, useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom'; 
import { AuthContext } from '../../context/AuthContext';
import './css/Navbar.css';

const userIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width="24"
    height="24"
    fill="currentColor"
  >
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
  </svg>
);

const logoutIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width="30"
    height="30"
    fill="#9c1000"
  >
    <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
  </svg>
);

const settingsIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width="24"
    height="24"
    fill="gray"
  >
    <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
  </svg>
);

const homeIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
  </svg>
);

const productIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
    <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 18H6V4h12v16zm-7-2h2v-2h-2v2zm-1-4h4v-2h-4v2zm5-4H7V8h8v2z"/>
  </svg>
);

const salesIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
    <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>
  </svg>
);

const inventoryIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
    <path d="M20 2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM8 20H4v-4h4v4zm0-6H4v-4h4v4zm0-6H4V4h4v4zm6 12h-4v-4h4v4zm0-6h-4v-4h4v4zm0-6h-4V4h4v4zm6 12h-4v-4h4v4zm0-6h-4v-4h4v4zm0-6h-4V4h4v4z"/>
  </svg>
);

const hamburgerIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
    <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
  </svg>
);

const ConfirmDialog = ({ isOpen, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;
  
  return (
    <div className="confirm-dialog-overlay">
      <div className="confirm-dialog">
        <h3>Confirmar</h3>
        <p>{message}</p>
        <div className="confirm-dialog-buttons">
          <button onClick={onCancel} className="btn btn-cancel">Cancelar</button>
          <button onClick={onConfirm} className="btn btn-confirm">Confirmar</button>
        </div>
      </div>
    </div>
  );
};

const Navbar = () => {
  const { usuario, logout, isAdmin, isTecnico, ROLE_ADMIN, ROLE_TECNICO } = useContext(AuthContext);
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false); 
  
  const sidebarRef = useRef(null);
  const userMenuRef = useRef(null); 

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleUserMenu = (e) => {
    e.stopPropagation(); 
    setUserMenuOpen(!userMenuOpen);
  };

  const handleLogoutClick = () => {
    setUserMenuOpen(false); 
    setShowLogoutConfirm(true);
  };

  const handleSettingsClick = () => {
    setUserMenuOpen(false);
    navigate('/ajustes');
  };

  const confirmLogout = () => {
    logout();
    setShowLogoutConfirm(false);
    navigate('/login');
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  const handleNavLinkClick = () => {
    if (window.innerWidth <= 1023) {
      setSidebarOpen(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        sidebarOpen &&
        sidebarRef.current && 
        !sidebarRef.current.contains(event.target) &&
        event.target.className !== 'mobile-menu-button' &&
        !event.target.closest('.mobile-menu-button') &&
        !event.target.closest('.mobile-header-menu-button')
      ) {
        setSidebarOpen(false);
      }

      if (
        userMenuOpen &&
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target) &&
        !event.target.closest('.user-menu-trigger')
      ) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [sidebarOpen, userMenuOpen]);

  return (
    <>
      <header className="mobile-header">
        <button className="mobile-header-menu-button" onClick={toggleSidebar}>
          {hamburgerIcon}
        </button>
        <h2 className="mobile-header-title">Ohana</h2>
        {/* Removido el indicador de rol numérico */}
      </header>
      
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`} ref={sidebarRef}>
        <div className="sidebar-header">
          <h2>Ohana</h2>
          {/* Removido el indicador de rol numérico */}
          <button className="close-sidebar" onClick={toggleSidebar}>×</button>
        </div>
        
        <ul className="sidebar-menu">
          <li className="sidebar-item">
            <Link to="/" className="sidebar-link" onClick={handleNavLinkClick}>
              {homeIcon}
              <span>Inicio</span>
            </Link>
          </li>
          <li className="sidebar-item">
            <Link to="/productos" className="sidebar-link" onClick={handleNavLinkClick}>
              {productIcon}
              <span>Productos</span>
            </Link>
          </li>
          <li className="sidebar-item">
            <Link to="/ventas" className="sidebar-link" onClick={handleNavLinkClick}>
              {salesIcon}
              <span>Ventas</span>
            </Link>
          </li>
          <li className="sidebar-item">
            <Link to="/inventario" className="sidebar-link" onClick={handleNavLinkClick}>
              {inventoryIcon}
              <span>Inventario</span>
            </Link>
          </li>
          
          {/* Opciones específicas para administradores */}
          {usuario && usuario.id_rol === ROLE_ADMIN && (
            <li className="sidebar-item">
              <Link to="/usuarios" className="sidebar-link" onClick={handleNavLinkClick}>
                {userIcon}
                <span>Gestionar Usuarios</span>
              </Link>
            </li>
          )}
        </ul>
        
        {usuario && (
          <div className="sidebar-footer">
            <div className="user-dropdown-container">
              <div 
                className={`user-menu-trigger ${userMenuOpen ? 'active' : ''}`}
                onClick={toggleUserMenu}
              >
                <div className="sidebar-user-info">
                  <div className="user-avatar">
                    {usuario.nombre.charAt(0).toUpperCase()}
                  </div>
                  <span>
                    {usuario.nombre} 
                    {usuario.id_rol === ROLE_ADMIN && <small className="role-text"> (Admin)</small>}
                    {usuario.id_rol === ROLE_TECNICO && <small className="role-text"> (Técnico)</small>}
                  </span>
                  <div className={`user-menu-arrow ${userMenuOpen ? 'open' : ''}`}>
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      viewBox="0 0 24 24" 
                      width="16" 
                      height="16"
                      fill="currentColor"
                    >
                      <path d="M7 10l5 5 5-5z" />
                    </svg>
                  </div>
                </div>
              </div>
              {userMenuOpen && (
                <div className="user-menu-popup" ref={userMenuRef}>
                  <div 
                    className="user-menu-item" 
                    onClick={handleSettingsClick}
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      viewBox="0 0 24 24" 
                      width="20" 
                      height="20" 
                      fill="#718096"
                    >
                      <path d="M19.43 12.98c.04-.32.07-.64.07-.98 0-.34-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98 0 .33.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"/>
                    </svg>
                    <span>Ajustes</span>
                  </div>
                  <div 
                    className="user-menu-item logout-item" 
                    onClick={handleLogoutClick}
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      viewBox="0 0 24 24" 
                      width="20" 
                      height="20" 
                      fill="#e74c3c"
                    >
                      <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
                    </svg>
                    <span>Cerrar sesión</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {sidebarOpen && <div className="sidebar-overlay" onClick={toggleSidebar}></div>}
      
      <ConfirmDialog 
        isOpen={showLogoutConfirm}
        message="¿Estás seguro de que deseas cerrar sesión?"
        onConfirm={confirmLogout}
        onCancel={cancelLogout}
      />
    </>
  );
};

export default Navbar;