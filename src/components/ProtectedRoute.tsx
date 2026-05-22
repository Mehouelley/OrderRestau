import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../contexts/AuthContext';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const location = useLocation();

  // En train de vérifier l'authentification
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Vérification...</div>;
  }

  // Non authentifié
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
