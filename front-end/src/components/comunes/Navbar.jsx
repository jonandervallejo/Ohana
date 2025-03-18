import React, { useContext, useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom'; 
import { AuthContext } from '../../context/AuthContext';
import './Navbar.css';

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
  const { usuario, logout } = useContext(AuthContext);
  const [menuVisible, setMenuVisible] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const menuRef = useRef(null);
  const userIconRef = useRef(null);

  const toggleMenu = () => {
    setMenuVisible(!menuVisible);
  };

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
    setMenuVisible(false);
  };

  const confirmLogout = () => {
    logout();
    setShowLogoutConfirm(false);
    window.location.href = '/login';
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        menuVisible &&
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        userIconRef.current &&
        !userIconRef.current.contains(event.target)
      ) {
        setMenuVisible(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [menuVisible]);

  return (
    <>
      <nav className="navbar">
        <div className="navbar-logo">
          <h2>TiendaRopa</h2>
        </div>
        <ul className="navbar-menu">
          <li className="navbar-item">
            <Link to="/" className="navbar-link">Inicio</Link>
          </li>
          <li className="navbar-item">
            <Link to="/productos" className="navbar-link">Productos</Link>
          </li>
          <li className="navbar-item">
            <Link to="/ventas" className="navbar-link">Ventas</Link>
          </li>
          <li className="navbar-item">
            <Link to="/inventario" className="navbar-link">Inventario</Link>
          </li>
        </ul>
        {usuario && (
          <div 
            className="navbar-user" 
            onClick={toggleMenu} 
            ref={userIconRef}
          >
            {userIcon}
            <span className="navbar-user-name">{usuario.nombre}</span>
            {menuVisible && (
              <div className="navbar-user-menu" ref={menuRef}>
                <ul>
                  <li onClick={handleLogoutClick} className="menu-item">
                    {logoutIcon}
                    <span className="menu-text">Cerrar sesión</span>
                  </li>
                  <li className="menu-item">
                    {settingsIcon}
                    <span className="menu-text">Ajustes</span>
                  </li>
                </ul>
              </div>
            )}
          </div>
        )}
      </nav>
      
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