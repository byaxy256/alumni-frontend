// src/components/AlumniApp.tsx


import { useState, useEffect } from 'react';
import { Home, Heart, Calendar, Users, Newspaper, Gift, Award, User, MessageSquare, Search, Bell } from 'lucide-react';
import type { User as UserType } from '../App';
import { Avatar, AvatarFallback } from './ui/avatar';
import { AlumniDashboard } from './alumni-user/AlumniDashboard';
import { AlumniDonations } from './alumni-user/AlumniDonations';
import { AlumniEvents } from './alumni-user/AlumniEvents';
import { AlumniConnect } from './alumni-user/AlumniConnect';
import { AlumniNews } from './alumni-user/AlumniNews';
import { AlumniBenefits } from './alumni-user/AlumniBenefits';
import { AlumniChapters } from './alumni-user/AlumniChapters';
import { AlumniProfile } from './alumni-user/AlumniProfile';
import { MentorshipHub } from './alumni-user/MentorshipHub';
import { UnifiedNotifications } from './shared/UnifiedNotifications';
import { UcuBadgeLogo } from './UcuBadgeLogo';

interface AlumniAppProps {
  user: UserType;
  onLogout: () => void;
}

type AlumniScreen = 'dashboard' | 'donations' | 'events' | 'connect' | 'news' | 'benefits' | 'chapters' | 'profile' | 'mentorship' | 'notifications';

// --- IMPROVEMENT 2: Single source of truth for all navigation items ---
const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, mobile: true },
    { id: 'donations', label: 'Donations', icon: Heart, mobile: true },
    { id: 'events', label: 'Events', icon: Calendar, mobile: false },
    { id: 'connect', label: 'Connect', icon: Users, mobile: true },
    { id: 'mentorship', label: 'Mentorship', icon: MessageSquare, mobile: true },
    { id: 'news', label: 'News', icon: Newspaper, mobile: false },
    { id: 'benefits', label: 'Benefits', icon: Gift, mobile: false },
    { id: 'chapters', label: 'Chapters', icon: Award, mobile: false },
];

export const AlumniApp = ({ user, onLogout }: AlumniAppProps) => {
  const [currentScreen, setCurrentScreen] = useState<AlumniScreen>('dashboard');

  // Handle deep linking from push notifications
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.split('/').pop() || 'dashboard';
      handleNavigate(path);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // --- IMPROVEMENT 1: Centralized navigation handler ---
  const handleNavigate = (targetScreen: string) => {
    // This function ensures that only valid screen names can be set, preventing errors.
    const validScreens = [...navItems.map(item => item.id), 'profile', 'notifications'];
    if (validScreens.includes(targetScreen)) {
        setCurrentScreen(targetScreen as AlumniScreen);
    } else {
        console.warn(`Attempted to navigate to an unknown screen: ${targetScreen}`);
        setCurrentScreen('dashboard'); // Fallback to dashboard
    }
    // Update browser history for deep linking
    window.history.pushState({}, '', `/${targetScreen}`);
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'dashboard':
        return <AlumniDashboard user={user} onNavigate={handleNavigate} />;
      case 'donations':
        return <AlumniDonations user={user} onBack={() => handleNavigate('dashboard')} onNavigate={handleNavigate} />;
      case 'events':
        return <AlumniEvents user={user} onBack={() => handleNavigate('dashboard')} />;
      case 'connect':
        return <AlumniConnect user={user} onBack={() => handleNavigate('dashboard')} />;
      case 'news':
        return <AlumniNews user={user} onBack={() => handleNavigate('dashboard')} />;
      case 'benefits':
        return <AlumniBenefits user={user} onBack={() => handleNavigate('dashboard')} />;
      case 'chapters':
        return <AlumniChapters user={user} onBack={() => handleNavigate('dashboard')} />;
      case 'profile':
        return <AlumniProfile user={user} onBack={() => handleNavigate('dashboard')} onLogout={onLogout} />;
      case 'mentorship':
        return <MentorshipHub user={user} onBack={() => handleNavigate('dashboard')} />;
      case 'notifications':
        return <UnifiedNotifications user={user} onBack={() => handleNavigate('dashboard')} />;
      default:
        return <AlumniDashboard user={user} onNavigate={handleNavigate} />;
    }
  };

  // --- Your UI is preserved, but now uses the centralized logic ---
  return (
    <div className="min-h-screen bg-white text-gray-900 flex">
      {/* Sidebar: deep blue, white text, active = lighter blue */}
      <aside className="hidden md:flex md:flex-col w-64 bg-[#0b2a4a] fixed h-screen shadow-xl">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <UcuBadgeLogo className="h-9 w-9" />
            <div>
              <h1 className="text-sm font-semibold text-white">Alumni Circle</h1>
              <p className="text-xs text-white/70 mt-0.5">Alumni Portal</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    currentScreen === item.id
                      ? 'bg-[#1e40af] text-white'
                      : 'text-white/90 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
        <div className="p-4 border-t border-white/10">
          <button
            onClick={() => handleNavigate('profile')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              currentScreen === 'profile'
                ? 'bg-[#1e40af] text-white'
                : 'text-white/90 hover:bg-white/10 hover:text-white'
            }`}
          >
            <User className="w-5 h-5" />
            <span>Profile</span>
          </button>
        </div>
      </aside>

      {/* Main: white + top header on desktop */}
      <main className="flex-1 md:ml-64 pb-20 md:pb-0 flex flex-col bg-white">
        <div className="hidden md:flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-white shrink-0">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 text-gray-500 w-full max-w-sm">
            <Search className="w-4 h-4 shrink-0" />
            <span className="text-sm">Search</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => handleNavigate('notifications')} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600" aria-label="Notifications">
              <Bell className="w-5 h-5" />
            </button>
            <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-600" aria-label="Messages">
              <MessageSquare className="w-5 h-5" />
            </button>
            <Avatar className="h-9 w-9 border border-gray-200">
              <AvatarFallback className="bg-[#0b2a4a] text-white text-sm">
                {(user?.full_name || user?.name || 'A').toString().split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          {renderScreen()}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-2 z-50 shadow-lg">
        <div className="flex justify-around items-center max-w-lg mx-auto">
          {navItems.filter(item => item.mobile).map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className={`flex flex-col items-center gap-1 p-2 w-1/5 ${currentScreen === item.id ? 'text-[#0b2a4a]' : 'text-gray-500'}`}
              >
                <Icon size={20} />
                <span className="text-xs">{item.label}</span>
              </button>
            );
          })}
          <button
            key="profile"
            onClick={() => handleNavigate('profile')}
            className={`flex flex-col items-center gap-1 p-2 w-1/5 ${currentScreen === 'profile' ? 'text-[#0b2a4a]' : 'text-gray-500'}`}
          >
            <User size={20} />
            <span className="text-xs">Profile</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
