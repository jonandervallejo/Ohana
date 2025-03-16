import React, { useContext, useState } from 'react';
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
    width="24"
    height="24"
    fill="red"
  >
    <path d="M10 2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h6c1.1 0 2-.9 2-2v-4h-2v4H4V4h6v4h2V4c0-1.1-.9-2-2-2zm10.59 10.59L16 12l4.59-4.59L20 6l-6 6 6 6 1.41-1.41z" />
  </svg>
);

const Navbar = () => {
  const { usuario, logout } = useContext(AuthContext);
  const [menuVisible, setMenuVisible] = useState(false);

  const toggleMenu = () => {
    setMenuVisible(!menuVisible);
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/login'; // Redirigir al login después de cerrar sesión
  };

  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <h2>TiendaRopa</h2>
      </div>
      <ul className="navbar-menu">
        <li className="navbar-item">
          <a href="/" className="navbar-link">Inicio</a>
        </li>
        <li className="navbar-item">
          <a href="/productos" className="navbar-link">Productos</a>
        </li>
        <li className="navbar-item">
          <a href="/ventas" className="navbar-link">Ventas</a>
        </li>
        <li className="navbar-item">
          <a href="/inventario" className="navbar-link">Inventario</a>
        </li>
      </ul>
      {usuario && (
        <div className="navbar-user" onClick={toggleMenu}>
          {userIcon}
          <span className="navbar-user-name">{usuario.nombre}</span>
          {menuVisible && (
            <div className="navbar-user-menu">
              <ul>
                <li onClick={handleLogout}>
                  {logoutIcon}
                </li>
                <li>Settings</li>
              </ul>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;