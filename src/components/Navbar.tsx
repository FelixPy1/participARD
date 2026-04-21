import { useState, useEffect } from 'react';
import { Menu, X, ChevronDown, BookOpen, Trophy, GraduationCap, Calendar, MapPin, Bell, Search, LogOut } from 'lucide-react';
import { UserProfile } from '../supabaseClient';

interface NavbarProps {
  user?: UserProfile;
  onLogout?: () => void;
  onNavigate?: (page: 'home' | 'activities' | 'documentation') => void;
  currentPage?: string;
}

const navLinks = [
  { label: 'Inicio', href: '#', page: 'home' },
  {
    label: 'Actividades',
    href: '#',
    page: 'activities',
    dropdown: [
      { label: 'Concursos', icon: Trophy },
      { label: 'Becas', icon: GraduationCap },
      { label: 'Ferias', icon: Calendar },
      { label: 'Eventos', icon: MapPin },
    ],
  },
  { label: 'Documentación', href: '#', page: 'documentation' },
  { label: 'Acerca de', href: '#' },
];

export function Navbar({ user, onLogout, onNavigate, currentPage }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#0a0f1e]/95 backdrop-blur-md shadow-lg shadow-black/20 border-b border-white/5'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-18">
          <a href="#" className="flex items-center gap-2 group" onClick={(e) => {
            e.preventDefault();
            onNavigate?.('home');
          }}>
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:scale-105 transition-transform duration-200">
              <BookOpen size={16} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="text-white font-bold text-lg tracking-tight">
              Particip<span className="text-emerald-400">ARD</span>
            </span>
          </a>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <div
                key={link.label}
                className="relative"
                onMouseEnter={() => link.dropdown && setActiveDropdown(link.label)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <a
                  href={link.href}
                  onClick={(e) => {
                    e.preventDefault();
                    if (link.page) onNavigate?.(link.page as any);
                  }}
                  className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeDropdown === link.label
                      ? 'text-white bg-white/10'
                      : 'text-white/70 hover:text-white hover:bg-white/8'
                  }`}
                >
                  {link.label}
                  {link.dropdown && (
                    <ChevronDown
                      size={14}
                      className={`transition-transform duration-200 ${
                        activeDropdown === link.label ? 'rotate-180 text-emerald-400' : ''
                      }`}
                    />
                  )}
                </a>

                {link.dropdown && activeDropdown === link.label && (
                  <div className="absolute top-full left-0 mt-2 w-52 bg-[#0d1526] border border-white/10 rounded-xl shadow-2xl shadow-black/40 overflow-hidden animate-fadeIn">
                    <div className="p-1.5">
                      {link.dropdown.map((item) => (
                        <a
                          key={item.label}
                          href="#"
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/8 transition-all duration-150 group"
                        >
                          <item.icon size={15} className="text-emerald-400 group-hover:scale-110 transition-transform" />
                          {item.label}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <>
                <span className="text-white/60 text-sm">{user.full_name || user.email}</span>
                <div className="w-px h-5 bg-white/10 mx-1"></div>
                <button
                  onClick={onLogout}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white/80 hover:text-white hover:bg-white/8 transition-all duration-200 flex items-center gap-2"
                >
                  <LogOut size={14} />
                  Salir
                </button>
              </>
            ) : (
              <>
                <button className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/8 transition-all duration-200">
                  <Search size={17} />
                </button>
                <button className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/8 transition-all duration-200 relative">
                  <Bell size={17} />
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
                </button>
                <div className="w-px h-5 bg-white/10 mx-1"></div>
                <a
                  href="#"
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white/80 hover:text-white hover:bg-white/8 transition-all duration-200"
                >
                  Ingresar
                </a>
                <a
                  href="#"
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-white transition-all duration-200 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-400/30"
                >
                  Registrarse
                </a>
              </>
            )}
          </div>

          <button
            className="md:hidden p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/8 transition-all duration-200"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-[#0a0f1e]/98 backdrop-blur-md border-t border-white/5">
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => {
                  e.preventDefault();
                  if (link.page) onNavigate?.(link.page as any);
                  setMobileOpen(false);
                }}
                className="flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium text-white/70 hover:text-white hover:bg-white/8 transition-all duration-200"
              >
                {link.label}
                {link.dropdown && <ChevronDown size={14} className="text-white/40" />}
              </a>
            ))}
            <div className="pt-3 border-t border-white/8 flex flex-col gap-2">
              {user ? (
                <button
                  onClick={onLogout}
                  className="px-4 py-3 rounded-xl text-sm font-medium text-center text-white/80 hover:bg-white/8 transition-all flex items-center justify-center gap-2"
                >
                  <LogOut size={14} />
                  Cerrar sesión
                </button>
              ) : (
                <>
                  <a href="#" className="px-4 py-3 rounded-xl text-sm font-medium text-center text-white/80 hover:bg-white/8 transition-all">
                    Ingresar
                  </a>
                  <a href="#" className="px-4 py-3 rounded-xl text-sm font-semibold text-center bg-emerald-500 text-white hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/25">
                    Registrarse
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
