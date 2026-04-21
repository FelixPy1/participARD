import { useState, useEffect } from 'react';
import { LogOut, BookOpen } from 'lucide-react';
import { supabase, UserProfile } from '../supabaseClient';
import { Hero } from './Hero';
import { Footer } from './Footer';
import { Navbar } from './Navbar';
import { ActivitiesPage } from './ActivitiesPage';
import { DocumentationPage } from './DocumentationPage';

interface MainLayoutProps {
  user: UserProfile;
  onLogout: () => void;
}

export function MainLayout({ user, onLogout }: MainLayoutProps) {
  const [currentPage, setCurrentPage] = useState<'home' | 'activities' | 'documentation'>('home');

  const handleNavigate = (page: typeof currentPage) => {
    setCurrentPage(page);
  };

  return (
    <div className="min-h-screen bg-[#080d1a]">
      <Navbar user={user} onNavigate={handleNavigate} onLogout={onLogout} currentPage={currentPage} />

      {currentPage === 'home' && (
        <>
          <Hero />
          <Footer />
        </>
      )}

      {currentPage === 'activities' && <ActivitiesPage user={user} onLogout={onLogout} />}

      {currentPage === 'documentation' && <DocumentationPage user={user} onLogout={onLogout} />}
    </div>
  );
}
