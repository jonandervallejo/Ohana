import React from 'react';
import Navbar from '../comunes/Navbar';
import './css/Layout.css';

const Layout = ({ children }) => {
  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default Layout;