import { useState, useEffect } from 'react';
import { supabase, UserProfile } from '../supabaseClient';
import { Search, Filter, MapPin, Calendar, Users, ArrowRight } from 'lucide-react';

interface Activity {
  id: string;
  title: string;
  description: string;
  type_id: string;
  institution_id: string;
  start_date: string;
  end_date: string;
  location: string;
  province: string;
  max_enrollments: number;
  status: string;
}

interface ActivitiesPageProps {
  user: UserProfile | null;
  onLogout: () => void;
}

export function ActivitiesPage({ user, onLogout }: ActivitiesPageProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedType, setSelectedType] = useState('');

  useEffect(() => {
    fetchActivities();
  }, [selectedProvince, selectedType]);

  const fetchActivities = async () => {
    try {
      let query = supabase
        .from('activities')
        .select('*')
        .eq('status', 'active');

      if (selectedProvince) {
        query = query.eq('province', selectedProvince);
      }

      if (selectedType) {
        query = query.eq('type_id', selectedType);
      }

      const { data, error } = await query;

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredActivities = activities.filter(activity =>
    activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    activity.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEnroll = async (activityId: string) => {
    if (!user) {
      alert('Debes iniciar sesión para inscribirte en una actividad');
      return;
    }

    try {
      const { error } = await supabase
        .from('activity_enrollments')
        .insert([
          {
            activity_id: activityId,
            student_id: user.id,
          },
        ]);

      if (error) throw error;
      alert('Inscrito correctamente');
      fetchActivities();
    } catch (error) {
      console.error('Error enrolling:', error);
      alert('Error al inscribirse');
    }
  };

  return (
    <div className="min-h-screen bg-[#080d1a]">
      {/* Header */}
      <header className="bg-[#0a0f1e] border-b border-white/5 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Actividades</h1>
            <p className="text-sm text-white/50 mt-1">Descubre las mejores oportunidades</p>
          </div>
          {user && (
            <button
              onClick={onLogout}
              className="px-4 py-2 rounded-lg bg-white/6 hover:bg-white/12 text-white/70 hover:text-white transition-all"
            >
              Cerrar sesión
            </button>
          )}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-white/40" size={18} />
            <input
              type="text"
              placeholder="Buscar actividades..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/6 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-3 text-white/40" size={18} />
            <select
              value={selectedProvince}
              onChange={(e) => setSelectedProvince(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/6 border border-white/10 text-white focus:outline-none focus:border-emerald-500/50"
            >
              <option value="">Todas las provincias</option>
              <option value="Santo Domingo">Santo Domingo</option>
              <option value="Santiago">Santiago</option>
              <option value="La Altagracia">La Altagracia</option>
            </select>
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-3 text-white/40" size={18} />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/6 border border-white/10 text-white focus:outline-none focus:border-emerald-500/50"
            >
              <option value="">Todos los tipos</option>
              <option value="concursos">Concursos</option>
              <option value="becas">Becas</option>
              <option value="ferias">Ferias</option>
              <option value="eventos">Eventos</option>
            </select>
          </div>
        </div>

        {/* Activities Grid */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-white/60">Cargando actividades...</p>
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-white/60">No se encontraron actividades</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredActivities.map((activity) => (
              <div
                key={activity.id}
                className="bg-[#0a0f1e] border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all duration-200 flex flex-col"
              >
                <h3 className="text-lg font-semibold text-white mb-2">{activity.title}</h3>

                <p className="text-sm text-white/60 mb-4 flex-grow">{activity.description}</p>

                <div className="space-y-2 mb-6 text-sm">
                  <div className="flex items-center gap-2 text-white/50">
                    <MapPin size={16} />
                    <span>{activity.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/50">
                    <Calendar size={16} />
                    <span>{new Date(activity.start_date).toLocaleDateString('es-ES')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/50">
                    <Users size={16} />
                    <span>{activity.max_enrollments} lugares</span>
                  </div>
                </div>

                <button
                  onClick={() => handleEnroll(activity.id)}
                  className="w-full px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2"
                >
                  Inscribirse
                  <ArrowRight size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
