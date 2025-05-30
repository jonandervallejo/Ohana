import React, { useContext } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Layout from './components/layout/Layout';
import LoginPage from './pages/Login';
import '@fortawesome/fontawesome-free/css/all.min.css';
import ProductosPage from './pages/Productos';
import CrearProductoPage from './pages/CrearProducto';
import Inicio from './pages/Inicio';
import VentasPage from './pages/Ventas';
import InventarioPage from './pages/Inventario';
import EditarInventarioPage from './pages/EditarInventario';
import CrearInventarioPage from './pages/CrearInventario';
import ResetPassword from './pages/ResetPassword';
import NewPassword from './pages/NewPassword';
import './App.css';
import Footer from './components/comunes/Footer';
import Ajustes from './pages/Ajustes';
import ScrollToTop from './components/comunes/ScrollToTop';
import EditarProducto from './pages/EditarProducto';
import GestionUsuarios from './pages/GestionUsuarios'; // Nueva importación
import RequireAdmin from './components/RequireAdmin'; // Nueva importación

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

// HOC para proteger rutas admin
const withAdminCheck = (Component) => {
  return (props) => {
    const { isAdmin, loading } = useContext(AuthContext);
    
    if (loading) {
      return <LoadingSpinner />;
    }
    
    return isAdmin() ? (
      <Component {...props} />
    ) : <Navigate to="/" />;
  };
};

const AppContent = () => {
  const location = useLocation();
  const { loading } = useContext(AuthContext);
  const publicRoutes = ['/login', '/reset-password', '/password/reset', '/new-password'];
  const isPublicRoute = publicRoutes.some(path => location.pathname.startsWith(path));

  const InicioWithLayout = withLayout(Inicio);
  const ProductosWithLayout = withLayout(ProductosPage);
  const CrearProductoWithLayout = withLayout(CrearProductoPage);
  const EditarProductoWithLayout = withLayout(EditarProducto);
  const VentasWithLayout = withLayout(VentasPage);
  const InventarioWithLayout = withLayout(InventarioPage);
  const CrearInventarioWithLayout = withLayout(CrearInventarioPage);
  const EditarInventarioWithLayout = withLayout(EditarInventarioPage);
  const AjustesWithLayout = withLayout(Ajustes);
  
  // Proteger con permisos de admin
  const GestionUsuariosWithAdmin = withLayout(withAdminCheck(GestionUsuarios));

  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<InicioWithLayout />} />
        <Route path="/productos" element={<ProductosWithLayout />} />
        <Route path="/productos/editar/:id" element={<EditarProductoWithLayout />} />
        <Route path="/productos/crear" element={<CrearProductoWithLayout />} />
        <Route path="/ventas" element={<VentasWithLayout />} />
        <Route path="/inventario" element={<InventarioWithLayout />} />
        <Route path="/crear-inventario" element={<CrearInventarioWithLayout />} />
        <Route path="/editar-inventario/:id" element={<EditarInventarioWithLayout />} />
        <Route path="/ajustes" element={<AjustesWithLayout />} />
        
        {/* Nueva ruta para gestión de usuarios */}
        <Route path="/usuarios" element={<GestionUsuariosWithAdmin />} />
        
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/password/reset" element={<ResetPassword />} />
        <Route path="/new-password/:token" element={<NewPassword />} />
        <Route path="*" element={loading ? <LoadingSpinner /> : <Navigate to="/login" />} />
      </Routes>
      
      {!isPublicRoute && <Footer />}
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