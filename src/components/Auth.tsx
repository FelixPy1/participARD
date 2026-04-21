import { useState } from 'react';
import { AlertCircle, CheckCircle, X, Mail, Lock, User, Shield } from 'lucide-react';

interface AuthProps {
  onSuccess: () => void;
  onClose: () => void;
}

export function Auth({ onSuccess, onClose }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('student');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isLogin) {
        const response = await fetch('http://localhost:3001/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        
        if (!response.ok) throw new Error(data.error || 'Error al iniciar sesión');
        
        localStorage.setItem('participARD_user', JSON.stringify(data.user));
        
        setSuccess('Sesión iniciada correctamente');
        setTimeout(onSuccess, 1000);
      } else {
        const roleName = role === 'institution' ? 'Rol_Administradores' : 'Rol_Estudiantes';
        const response = await fetch('http://localhost:3001/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, fullName, password, role: roleName })
        });
        const data = await response.json();
        
        if (!response.ok) throw new Error(data.error || 'Error al registrar cuenta');

        setSuccess('Cuenta creada correctamente. Puedes iniciar sesión ahora.');
        setEmail('');
        setPassword('');
        setTimeout(() => setIsLogin(true), 2000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión con el Servidor SQL (Verifica si Node.js está encendido).');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-md bg-[#0a0f1e]/90 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-[0_0_50px_rgba(16,185,129,0.15)] transition-all animate-in zoom-in-95 duration-300">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all"
        >
          <X size={20} />
        </button>

        <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">
          {isLogin ? 'Bienvenido de nuevo' : 'Únete a participARD'}
        </h2>
        <p className="text-white/50 mb-8 text-sm">
          {isLogin ? 'Ingresa tus credenciales para continuar.' : 'Comienza a transformar tu futuro hoy mismo.'}
        </p>

        {error && (
          <div className="flex gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 mb-6 animate-in slide-in-from-top-2">
            <AlertCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-300 font-medium">{error}</p>
          </div>
        )}

        {success && (
          <div className="flex gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 mb-6 animate-in slide-in-from-top-2">
            <CheckCircle size={18} className="text-emerald-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-emerald-300 font-medium">{success}</p>
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-5">
          {!isLogin && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/70 uppercase tracking-wider ml-1">Nombre completo</label>
              <div className="relative">
                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 focus:bg-white/10 focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium"
                  placeholder="Ej. Juan Pérez"
                  required={!isLogin}
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-white/70 uppercase tracking-wider ml-1">Correo Electrónico</label>
            <div className="relative">
              <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 focus:bg-white/10 focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium"
                placeholder="tu@email.com"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-white/70 uppercase tracking-wider ml-1">Contraseña</label>
            <div className="relative">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 focus:bg-white/10 focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {!isLogin && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/70 uppercase tracking-wider ml-1">Tipo de Perfil</label>
              <div className="relative">
                <Shield size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-emerald-500/50 focus:bg-white/10 focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium appearance-none"
                >
                  <option value="student" className="bg-[#0a0f1e]">🎓 Estudiante</option>
                  <option value="institution" className="bg-[#0a0f1e]">🏛️ Institución Administrativa</option>
                </select>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full relative group overflow-hidden px-4 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all duration-300"
          >
            <span className="relative z-10 text-white font-bold text-sm tracking-wide">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  PROCESANDO...
                </span>
              ) : isLogin ? 'INICIAR SESIÓN' : 'REGISTRARSE'}
            </span>
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/5 text-center">
          <p className="text-sm text-white/40">
            {isLogin ? '¿Aún no tienes acceso?' : '¿Ya eres parte de participARD?'}{' '}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
                setSuccess('');
              }}
              className="text-emerald-400 hover:text-emerald-300 font-bold ml-1 transition-colors hover:underline"
            >
              {isLogin ? 'Crear una cuenta' : 'Inicia sesión'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
