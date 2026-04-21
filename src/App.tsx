import { useState, useEffect } from 'react';
import { Auth } from './components/Auth';
import { AdminDashboard } from './components/AdminDashboard';
import { MainLayout } from './components/MainLayout';

// Se redefine UserProfile ya que no usaremos la interfaz de Supabase para el login nativo
export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const storedUser = localStorage.getItem('participARD_user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
        setShowAuth(false);
      }
    } catch (error) {
      console.error('Lector de guardado local falló:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem('participARD_user');
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080d1a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin mx-auto mb-4"></div>
          <p className="text-white/60">Cargando...</p>
        </div>
      </div>
    );
  }

  if (user?.role === 'Rol_Administradores' || user?.role === 'admin') {
    return <AdminDashboard profile={user as any} onLogout={handleLogout} />;
  }

  return (
    <>
      <MainLayout user={user as any} onLogout={handleLogout} onLoginClick={() => setShowAuth(true)} />
      {showAuth && !user && (
        <Auth onSuccess={checkAuth} onClose={() => setShowAuth(false)} />
      )}
    </>
  );
}

export default App;
