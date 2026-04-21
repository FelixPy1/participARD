import { BookOpen, Instagram, Facebook, Twitter, Youtube, Send } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-[#080d1a] border-t border-white/6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <BookOpen size={15} className="text-white" strokeWidth={2.5} />
              </div>
              <span className="text-white font-bold text-lg">
                Particip<span className="text-emerald-400">ARD</span>
              </span>
            </div>
            <p className="text-sm text-white/40 leading-relaxed mb-6">
              La plataforma educativa que conecta a los estudiantes dominicanos con las mejores
              actividades, concursos y becas del país en tiempo real.
            </p>
            <div className="flex items-center gap-2">
              {[Instagram, Facebook, Twitter, Youtube, Send].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-8 h-8 rounded-lg bg-white/6 hover:bg-emerald-500/20 border border-white/8 hover:border-emerald-500/30 flex items-center justify-center text-white/40 hover:text-emerald-400 transition-all duration-200"
                >
                  <Icon size={14} />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-4 tracking-wide">PLATAFORMA</h4>
            <ul className="space-y-2.5">
              {['Inicio', 'Actividades', 'Concursos', 'Becas', 'Instituciones'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-sm text-white/40 hover:text-white/80 transition-colors duration-150">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-4 tracking-wide">INFORMACIÓN</h4>
            <ul className="space-y-2.5">
              {['Acerca de nosotros', '¿Cómo funciona?', 'Preguntas frecuentes', 'Términos de uso', 'Privacidad'].map(
                (item) => (
                  <li key={item}>
                    <a href="#" className="text-sm text-white/40 hover:text-white/80 transition-colors duration-150">
                      {item}
                    </a>
                  </li>
                )
              )}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-4 tracking-wide">NOVEDADES</h4>
            <p className="text-sm text-white/40 mb-4 leading-relaxed">
              Recibe las nuevas actividades directamente en tu correo.
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="tucorreo@gmail.com"
                className="flex-1 px-3 py-2.5 rounded-lg bg-white/6 border border-white/8 text-white/70 placeholder:text-white/25 text-sm focus:outline-none focus:border-emerald-500/50 focus:bg-white/8 transition-all duration-200"
              />
              <button className="px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold transition-all duration-200 shadow-lg shadow-emerald-500/25 hover:-translate-y-0.5 whitespace-nowrap">
                Suscribirme
              </button>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-xs text-white/25">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Plataforma activa · 48 actividades disponibles ahora mismo
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-white/25">
            <a href="#" className="hover:text-white/50 transition-colors">Política de privacidad</a>
            <a href="#" className="hover:text-white/50 transition-colors">Términos y condiciones</a>
            <a href="#" className="hover:text-white/50 transition-colors">Contacto</a>
          </div>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/15">
          <span>© 2025 ParticipARD · Todos los derechos reservados</span>
          <span>Hecho con orgullo en la República Dominicana</span>
        </div>
      </div>
    </footer>
  );
}
