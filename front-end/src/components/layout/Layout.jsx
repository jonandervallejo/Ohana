import React from 'react';
import Navbar from '../comunes/Navbar';
import { ThemeProvider } from '../../context/ThemeContext';
import './css/Layout.css';

const Layout = ({ children }) => {
  return (
    <ThemeProvider>
      <div className="app-container">
        <Navbar />
        <main className="main-content">
          {children}
        </main>
      </div>
    </ThemeProvider>
  );
};

export default Layout;