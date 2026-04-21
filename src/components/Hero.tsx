import { useState, useEffect } from 'react';
import { ArrowRight, Play } from 'lucide-react';

interface Particle {
  id: number;
  left: number;
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
      delay: Math.random() * 6,
      duration: 12 + Math.random() * 8,
      size: 2 + Math.random() * 4,
      opacity: 0.3 + Math.random() * 0.4,
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
            width: `${particle.size * 1.5}px`,
            height: `${particle.size * 1.5}px`,
            animation: `drift ${particle.duration * 1.5}s ease-in-out infinite`,
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
    <section className="relative min-h-screen bg-[#080d1a] flex items-center overflow-hidden">
      <AnimatedBackground />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-emerald-400 text-xs font-medium tracking-wide uppercase">
              En vivo · República Dominicana
            </span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-[1.08] tracking-tight mb-6">
            Tu próxima gran
            <br />
            <span className="text-emerald-400">oportunidad</span>
            <br />
            te está esperando
          </h1>

          <p className="text-lg text-white/55 leading-relaxed mb-10 max-w-xl">
            Concursos, becas, ferias y eventos educativos en tiempo real para
            estudiantes de toda la República Dominicana.
          </p>

          <div className="flex flex-wrap gap-3">
            <a
              href="#"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-emerald-500/30 hover:shadow-emerald-400/40 hover:-translate-y-0.5"
            >
              Ver actividades
              <ArrowRight size={16} />
            </a>
            <a
              href="#"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/8 hover:bg-white/12 border border-white/10 hover:border-white/20 text-white/80 hover:text-white font-semibold text-sm transition-all duration-200 hover:-translate-y-0.5"
            >
              <Play size={14} className="text-emerald-400" />
              ¿Cómo funciona?
            </a>
          </div>
        </div>

        <div className="mt-20 grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/5 rounded-2xl overflow-hidden border border-white/5">
          {[
            { value: '48', label: 'Actividades activas' },
            { value: '12', label: 'Instituciones' },
            { value: '32', label: 'Provincias' },
            { value: '3', label: 'Nuevas hoy' },
          ].map((stat) => (
            <div key={stat.label} className="bg-[#0a0f1e] px-6 py-6 hover:bg-white/3 transition-colors duration-200">
              <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-sm text-white/40 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
