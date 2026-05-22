import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuthStore } from './contexts/AuthContext';
import LayoutClient from './components/LayoutClient';
import LayoutResto from './components/LayoutResto';
import LayoutCuisine from './components/LayoutCuisine';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing';
import Restaurants from './pages/client/Restaurants';
import RestaurantDetail from './pages/client/RestaurantDetail';
import MenuDigital from './pages/client/MenuDigital';
import Paiement from './pages/client/Paiement';
import Dashboard from './pages/resto/Dashboard';
import Commandes from './pages/resto/Commandes';
import MenuManagement from './pages/resto/MenuManagement';
import TablesQR from './pages/resto/TablesQR';
import Statistiques from './pages/resto/Statistiques';
import Parametres from './pages/resto/Parametres';
import KitchenDisplay from './pages/cuisine/KitchenDisplay';
import KitchenAccess from './pages/cuisine/KitchenAccess';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

function AppRoutes() {
  return (
    <Routes>
      {/* Landing page */}
      <Route path="/" element={<Landing />} />

      {/* Client interface - PUBLIC, no account needed */}
      {/* Browse restaurants */}
      <Route path="/restaurants" element={<Restaurants />} />
      {/* Restaurant detail + table selection */}
      <Route path="/restaurant/:slug" element={<RestaurantDetail />} />
      {/* Menu (from QR code with table, or from remote with emporter) */}
      <Route element={<LayoutClient />}>
        <Route path="/menu/:restaurantSlug/:tableId" element={<MenuDigital />} />
      </Route>
      {/* Payment */}
      <Route path="/paiement/:commandeId" element={<Paiement />} />

      {/* Restaurant dashboard - PROTECTED, account required */}
      <Route
        element={
          <ProtectedRoute>
            <LayoutResto />
          </ProtectedRoute>
        }
      >
        <Route path="/resto/dashboard" element={<Dashboard />} />
        <Route path="/resto/commandes" element={<Commandes />} />
        <Route path="/resto/menu" element={<MenuManagement />} />
        <Route path="/resto/tables" element={<TablesQR />} />
        <Route path="/resto/stats" element={<Statistiques />} />
        <Route path="/resto/parametres" element={<Parametres />} />
      </Route>

      {/* Kitchen display - access via code or account */}
      <Route path="/cuisine/access" element={<KitchenAccess />} />
      <Route element={<LayoutCuisine />}>
        <Route path="/cuisine/:restaurantSlug" element={<KitchenDisplay />} />
      </Route>

      {/* Auth */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    // Vérifier la session au montage
    const checkAuth = async () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        // Attendre que me() se termine avant de marquer comme prêt
        await useAuthStore.getState().me();
      }
      // Marquer l'app comme prête (authentifié ou non)
      setAppReady(true);
    };
    
    checkAuth();
  }, []);

  // Afficher un écran de chargement pendant la vérification d'authentification
  if (!appReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
