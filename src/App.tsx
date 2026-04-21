import { useState, useEffect } from 'react';
import { supabase, UserProfile, getProfile } from './supabaseClient';
import { Auth } from './components/Auth';
import { AdminDashboard } from './components/AdminDashboard';
import { MainLayout } from './components/MainLayout';

function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const profile = await getProfile(session.user.id);
        setUser(profile);
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
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

  if (!user) {
    return <Auth onSuccess={checkAuth} />;
  }

  if (user.role === 'admin') {
    return <AdminDashboard profile={user} onLogout={handleLogout} />;
  }

  return <MainLayout user={user} onLogout={handleLogout} />;
}

export default App;
