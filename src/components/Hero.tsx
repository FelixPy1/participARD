import { useState, useEffect } from 'react';
import { ArrowRight, Play } from 'lucide-react';

interface Particle {
  id: number;
  left: number;
  top: number;
  delay: number;
  duration: number;
  size: number;
  opacity: number;
}

function AnimatedBackground() {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const newParticles: Particle[] = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: -(Math.random() * 40), // Delay negativo para fast-forward
      duration: 25 + Math.random() * 20, // Mayor duración (lentas)
      size: 2 + Math.random() * 4,
      opacity: 0.2 + Math.random() * 0.4,
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/8 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/6 rounded-full blur-3xl" />

      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full bg-emerald-400 animate-fall"
          style={{
            left: `${particle.left}%`,
            top: `-50px`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            opacity: particle.opacity,
            animation: `fall ${particle.duration}s linear infinite`,
            animationDelay: `${particle.delay}s`,
            filter: 'blur(0.5px)',
            boxShadow: `0 0 ${particle.size * 2}px rgba(52, 211, 153, 0.4)`,
          }}
        />
      ))}

      {particles.slice(0, 25).map((particle) => (
        <div
          key={`drift-${particle.id}`}
          className="absolute rounded-full bg-emerald-300 opacity-20 animate-drift"
          style={{
            left: `${(particle.left + 30) % 100}%`,
            top: `${particle.top}%`,
            width: `${particle.size * 1.5}px`,
            height: `${particle.size * 1.5}px`,
            animation: `drift ${particle.duration * 1.5}s ease-in-out infinite both`,
            animationDelay: `${particle.delay + 0.5}s`,
            filter: 'blur(1.5px)',
          }}
        />
      ))}
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative min-h-screen bg-[#080d1a] flex items-center overflow-hidden pt-20">
      <AnimatedBackground />

      {/* Se restauran los tamaños pero se expande la ocupación hacia izquierda y derecha con max-w-[1536px] */}
      <div className="relative max-w-[1536px] mx-auto px-6 sm:px-10 lg:px-16 py-12 lg:py-20 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-12 items-center">
          
          {/* Lado Izquierdo: Texto y Llamados a la acción */}
          <div className="max-w-2xl relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-8 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-emerald-400 text-xs font-semibold tracking-wide uppercase">
                En vivo · República Dominicana
              </span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-6xl xl:text-7xl font-extrabold text-white leading-[1.1] tracking-tight mb-6">
              Tu próxima gran
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 pb-2">
                oportunidad
              </span>
              te está esperando
            </h1>

            <p className="text-lg sm:text-xl text-white/60 leading-relaxed mb-10 max-w-xl font-light">
              Descubre concursos, becas, ferias y eventos educativos en tiempo real diseñados para 
              estudiantes de toda la República Dominicana.
            </p>

            <div className="flex flex-wrap gap-4">
              <a
                href="#"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-white font-semibold text-sm transition-all duration-300 shadow-[0_0_20px_rgba(52,211,153,0.3)] hover:shadow-[0_0_25px_rgba(52,211,153,0.5)] hover:-translate-y-1"
              >
                Explorar actividades
                <ArrowRight size={18} />
              </a>
              <a
                href="#"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white font-medium text-sm transition-all duration-300 backdrop-blur-sm hover:-translate-y-1"
              >
                <Play size={16} className="text-emerald-400" />
                Ver un ejemplo
              </a>
            </div>
            
            {/* Estadísticas Integradas al lado izquierdo */}
            <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-6 border-t border-white/10 pt-10">
              {[
                { value: '+50', label: 'Actividades' },
                { value: '12', label: 'Instituciones' },
                { value: '32', label: 'Provincias' },
                { value: '24h', label: 'Actualización' },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-sm text-emerald-400/80 font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Lado Derecho: Diseño Visual Profesional (Mockup UI) restaurado */}
          <div className="relative hidden lg:block h-[600px] w-full">
            {/* Sombras y desenfoques de fondo */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-emerald-500/20 rounded-full blur-[100px]" />
            <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-cyan-500/20 rounded-full blur-[80px]" />

            {/* Tarjeta Flotante Principal */}
            <div 
              className="absolute top-[45%] right-4 -translate-y-1/2 w-[380px] bg-[#0a0f1e]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl shadow-black/50 z-20"
              style={{ animation: 'float 6s ease-in-out infinite' }}
            >
              <div className="flex justify-between items-start mb-6">
                <div className="flex gap-3 items-center">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                    <span className="text-2xl">🎓</span>
                  </div>
                  <div>
                    <div className="text-xs text-emerald-400 font-semibold mb-1 uppercase tracking-wider">Beca Completa</div>
                    <div className="text-white font-bold text-lg">Ingeniería de Software</div>
                  </div>
                </div>
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm text-white/60">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/5">🏛️</div>
                  Instituto Tecnológico (INTEC)
                </div>
                <div className="flex items-center gap-3 text-sm text-white/60">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/5">📍</div>
                  Santo Domingo, RD
                </div>
              </div>

              <div className="w-full bg-white/5 rounded-lg p-3 flex justify-between items-center border border-white/5">
                <span className="text-xs text-white/40">Cierra en 3 días</span>
                <span className="text-xs font-semibold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-1 rounded">Postulaciones Abiertas</span>
              </div>
            </div>

            {/* Tarjeta Flotante Secundaria (Detrás) */}
            <div 
              className="absolute top-1/4 left-4 w-[320px] bg-[#0a0f1e]/60 backdrop-blur-md border border-white/5 rounded-2xl p-5 shadow-xl -rotate-6 z-10"
              style={{ animation: 'floatReverse 8s ease-in-out infinite' }}
            >
              <div className="flex gap-3 items-center mb-4">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30">
                  <span className="text-xl">🏆</span>
                </div>
                <div>
                  <div className="text-[10px] text-cyan-400 font-semibold mb-0.5 uppercase tracking-wider">Concurso Nacional</div>
                  <div className="text-white/90 font-bold text-sm">Feria Académica 2026</div>
                </div>
              </div>
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 w-3/4 rounded-full" />
              </div>
            </div>

            {/* Micro-elemento decorativo (Participantes) */}
            <div 
              className="absolute bottom-1/4 left-10 bg-[#0a0f1e]/70 backdrop-blur-md border border-white/10 rounded-xl p-3 flex items-center gap-3 z-30 shadow-lg"
              style={{ animation: 'float 7s ease-in-out infinite 1s' }}
            >
              <div className="relative w-12 h-8">
                <img src="https://i.pravatar.cc/100?img=33" alt="User" className="w-8 h-8 rounded-full border-2 border-[#080d1a] absolute right-0" />
                <img src="https://i.pravatar.cc/100?img=47" alt="User" className="w-8 h-8 rounded-full border-2 border-[#080d1a] absolute right-4 z-10" />
              </div>
              <div className="text-xs text-white/80 pr-2">
                <strong className="text-white block">+1,200</strong> estudiantes unidos
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Añadir los keyframes para animaciones de tarjetas (sólo funcionales en este scope) */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        @keyframes floatReverse {
          0%, 100% { transform: translateY(0) rotate(-6deg); }
          50% { transform: translateY(15px) rotate(-6deg); }
        }
      `}</style>
    </section>
  );
}
