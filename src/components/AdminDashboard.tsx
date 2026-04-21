import { useState, useEffect } from 'react';
import { supabase, UserProfile } from '../supabaseClient';
import { LogOut, BarChart3, Users, AlertTriangle, Activity, Database } from 'lucide-react';

interface AdminDashboardProps {
  profile: UserProfile;
  onLogout: () => void;
}

export function AdminDashboard({ profile, onLogout }: AdminDashboardProps) {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalActivities: 0,
    totalEnrollments: 0,
    activeAlerts: 0,
  });
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'alerts' | 'logs'>('overview');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [usersResult, activitiesResult, enrollmentsResult, alertsResult] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact' }),
        supabase.from('activities').select('id', { count: 'exact' }),
        supabase.from('activity_enrollments').select('id', { count: 'exact' }),
        supabase.from('system_alerts').select('*').eq('is_resolved', false),
      ]);

      setStats({
        totalUsers: usersResult.count || 0,
        totalActivities: activitiesResult.count || 0,
        totalEnrollments: enrollmentsResult.count || 0,
        activeAlerts: alertsResult.data?.length || 0,
      });

      setAlerts(alertsResult.data || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const resolveAlert = async (alertId: string) => {
    try {
      await supabase
        .from('system_alerts')
        .update({ is_resolved: true, resolved_at: new Date().toISOString() })
        .eq('id', alertId);

      fetchDashboardData();
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLogout();
  };

  return (
    <div className="min-h-screen bg-[#080d1a]">
      {/* Header */}
      <header className="bg-[#0a0f1e] border-b border-white/5 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Panel de Administración</h1>
            <p className="text-sm text-white/50 mt-1">Bienvenido, {profile.full_name || profile.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/6 hover:bg-white/12 text-white/70 hover:text-white transition-all duration-200"
          >
            <LogOut size={16} />
            Cerrar sesión
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { icon: Users, label: 'Usuarios', value: stats.totalUsers, color: 'emerald' },
            { icon: Activity, label: 'Actividades', value: stats.totalActivities, color: 'blue' },
            { icon: Database, label: 'Inscripciones', value: stats.totalEnrollments, color: 'purple' },
            { icon: AlertTriangle, label: 'Alertas activas', value: stats.activeAlerts, color: 'red' },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="bg-[#0a0f1e] border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all duration-200">
                <div className="flex items-center justify-between mb-4">
                  <Icon size={24} className={`text-${stat.color}-400`} />
                </div>
                <p className="text-white/60 text-sm font-medium mb-1">{stat.label}</p>
                <p className="text-3xl font-bold text-white">{loading ? '-' : stat.value}</p>
              </div>
            );
          })}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-white/10">
          {['overview', 'alerts', 'logs'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-3 font-medium text-sm transition-all duration-200 ${
                activeTab === tab
                  ? 'text-emerald-400 border-b-2 border-emerald-400'
                  : 'text-white/50 hover:text-white/80'
              }`}
            >
              {tab === 'overview' ? 'Resumen' : tab === 'alerts' ? 'Alertas' : 'Registros'}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#0a0f1e] border border-white/10 rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <BarChart3 size={18} className="text-emerald-400" />
                Estado del Sistema
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-white/60 text-sm">Espacio en BD</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full w-2/3 bg-emerald-500 rounded-full"></div>
                    </div>
                    <span className="text-white text-sm font-medium">65%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/60 text-sm">Usuarios activos</span>
                  <span className="text-white text-sm font-medium">{stats.totalUsers}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/60 text-sm">Salud general</span>
                  <span className="px-2 py-1 rounded text-xs font-medium bg-emerald-500/20 text-emerald-400">Óptimo</span>
                </div>
              </div>
            </div>

            <div className="bg-[#0a0f1e] border border-white/10 rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-4">Últimas acciones</h3>
              <div className="space-y-2 text-sm">
                <p className="text-white/40">Sistema inicializado correctamente</p>
                <p className="text-white/40">Respaldo automático completado</p>
                <p className="text-white/40">Índices optimizados</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="bg-[#0a0f1e] border border-white/10 rounded-2xl p-6">
            <h3 className="text-white font-semibold mb-4">Alertas del sistema</h3>
            {alerts.length === 0 ? (
              <p className="text-white/40 text-sm">No hay alertas activas</p>
            ) : (
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div key={alert.id} className={`flex items-start gap-4 p-4 rounded-lg border ${
                    alert.severity === 'critical' ? 'bg-red-500/10 border-red-500/20' :
                    alert.severity === 'warning' ? 'bg-yellow-500/10 border-yellow-500/20' :
                    'bg-blue-500/10 border-blue-500/20'
                  }`}>
                    <div className="flex-1">
                      <p className="text-white font-medium text-sm">{alert.title}</p>
                      <p className="text-white/60 text-xs mt-1">{alert.message}</p>
                    </div>
                    <button
                      onClick={() => resolveAlert(alert.id)}
                      className="px-3 py-1 rounded text-xs font-medium bg-white/10 hover:bg-white/20 text-white transition-all whitespace-nowrap"
                    >
                      Resolver
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="bg-[#0a0f1e] border border-white/10 rounded-2xl p-6">
            <h3 className="text-white font-semibold mb-4">Registros del sistema</h3>
            <p className="text-white/40 text-sm">El sistema está registrando todas las actividades para auditoría</p>
          </div>
        )}
      </div>
    </div>
  );
}
