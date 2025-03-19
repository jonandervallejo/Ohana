import React, { useContext } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Layout from './components/layout/Layout';
import LoginPage from './pages/Login';
import ProductosPage from './pages/Productos';
import Inicio from './pages/Inicio';
import VentasPage from './pages/Ventas';
import InventarioPage from './pages/Inventario';
import ResetPassword from './pages/ResetPassword';
import NewPassword from './pages/NewPassword';
import './App.css';
import Footer from './components/comunes/Footer'; // Importar el nuevo footer
import Ajustes from './pages/Ajustes';
import ScrollToTop from './components/comunes/ScrollToTop'; // Importar componente

const LoadingSpinner = () => (
  <div className="loading-container">
    <div className="loading-spinner"></div>
    <p>Cargando...</p>
  </div>
);

const withLayout = (Component) => {
  return (props) => {
    const { usuario, loading } = useContext(AuthContext);
    
    if (loading) {
      return <LoadingSpinner />;
    }
    
    return usuario ? (
      <Layout>
        <Component {...props} />
      </Layout>
    ) : <Navigate to="/login" />;
  };
};

const AppContent = () => {
  const location = useLocation();
  const { loading } = useContext(AuthContext);
  const publicRoutes = ['/login', '/reset-password', '/password/reset', '/new-password'];
  const isPublicRoute = publicRoutes.some(path => location.pathname.startsWith(path));

  const InicioWithLayout = withLayout(Inicio);
  const ProductosWithLayout = withLayout(ProductosPage);
  const VentasWithLayout = withLayout(VentasPage);
  const InventarioWithLayout = withLayout(InventarioPage);
  const AjustesWithLayout = withLayout(Ajustes);

  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<InicioWithLayout />} />
        <Route path="/productos" element={<ProductosWithLayout />} />
        <Route path="/ventas" element={<VentasWithLayout />} />
        <Route path="/inventario" element={<InventarioWithLayout />} />
        <Route path="/ajustes" element={<AjustesWithLayout />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/password/reset" element={<ResetPassword />} />
        <Route path="/new-password/:token" element={<NewPassword />} />
        <Route path="*" element={loading ? <LoadingSpinner /> : <Navigate to="/login" />} />
      </Routes>
      
      {!isPublicRoute && <Footer />} {/* Reemplazar el footer antiguo */}
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