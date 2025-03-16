import React, { useContext } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import LoginPage from './pages/Login';
import ProductosPage from './pages/Productos';
import Inicio from './pages/Inicio';
import Navbar from './components/comunes/Navbar'; 
import './App.css';

const PrivateRoute = ({ element: Element, ...rest }) => {
  const { usuario, loading } = useContext(AuthContext);

  if (loading) {
    return <div>Cargando...</div>;
  }

  return usuario ? <Element {...rest} /> : <Navigate to="/login" />;
};

const AppContent = () => {
  const location = useLocation();
  const showNavbarAndFooter = location.pathname !== '/login';

  return (
    <>
      {showNavbarAndFooter && <Navbar />}
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Inicio />} />
        <Route path="/productos" element={<PrivateRoute element={ProductosPage} />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
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