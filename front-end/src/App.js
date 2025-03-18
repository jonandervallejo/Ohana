import React, { useContext } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import LoginPage from './pages/Login';
import ProductosPage from './pages/Productos';
import Inicio from './pages/Inicio';
import Navbar from './components/comunes/Navbar'; 
import VentasPage from './pages/Ventas';
import InventarioPage from './pages/Inventario';
import ResetPassword from './pages/ResetPassword';
import NewPassword from './pages/NewPassword';
import './App.css';

// Componente de carga mejorado
const LoadingSpinner = () => (
  <div className="loading-container">
    <div className="loading-spinner"></div>
    <p>Cargando...</p>
  </div>
);

const PrivateRoute = ({ element: Element, ...rest }) => {
  const { usuario, loading } = useContext(AuthContext);

  if (loading) {
    return <LoadingSpinner />;
  }

  return usuario ? <Element {...rest} /> : <Navigate to="/login" />;
};

const AppContent = () => {
  const location = useLocation();
  const { loading } = useContext(AuthContext);
  // Add new-password to the routes that don't show navbar
  const showNavbarAndFooter = !['/login', '/reset-password', '/password/reset', '/new-password'].some(path => 
    location.pathname.startsWith(path)
  );

  return (
    <>
      {showNavbarAndFooter && <Navbar />}
      <div className={showNavbarAndFooter ? "app-content" : ""}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<PrivateRoute element={Inicio} />} />
          <Route path="/productos" element={<PrivateRoute element={ProductosPage} />} />
          <Route path="/ventas" element={<PrivateRoute element={VentasPage} />} />
          <Route path="/inventario" element={<PrivateRoute element={InventarioPage} />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/password/reset" element={<ResetPassword />} />
          {/* Change this route to match the Laravel redirect URL */}
          <Route path="/new-password/:token" element={<NewPassword />} />
          <Route path="*" element={loading ? <LoadingSpinner /> : <Navigate to="/login" />} />
        </Routes>
      </div>
      {showNavbarAndFooter && (
        <footer className="footer">
          <div className="container">
            <p>&copy; 2025 Mi Aplicación. Todos los derechos reservados.</p>
          </div>
        </footer>
      )}
    </>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
};

export default App;