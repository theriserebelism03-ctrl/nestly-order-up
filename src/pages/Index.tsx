import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { CartProvider } from '@/contexts/CartContext';
import StudentDashboard from './StudentDashboard';
import ChefDashboard from './ChefDashboard';
import AdminDashboard from './AdminDashboard';

export default function Index() {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 rounded-2xl gradient-primary animate-pulse" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  if (role === 'chef') return <ChefDashboard />;
  if (role === 'admin') return <AdminDashboard />;

  return (
    <CartProvider>
      <StudentDashboard />
    </CartProvider>
  );
}
