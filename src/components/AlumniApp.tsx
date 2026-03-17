// src/components/AlumniApp.tsx


import { useState, useEffect } from 'react';
import { Home, Heart, Calendar, Users, Newspaper, Gift, Award, User, MessageSquare, ShoppingBag, Wallet, Menu, X } from 'lucide-react';
import type { User as UserType } from '../App';
import { AlumniDashboard } from './alumni-user/AlumniDashboard';
import { AlumniDonations } from './alumni-user/AlumniDonations';
import { AlumniEvents } from './alumni-user/AlumniEvents';
import { AlumniConnect } from './alumni-user/AlumniConnect';
import { AlumniNews } from './alumni-user/AlumniNews';
import { AlumniBenefits } from './alumni-user/AlumniBenefits';
import { AlumniChapters } from './alumni-user/AlumniChapters';
import { AlumniProfile } from './alumni-user/AlumniProfile';
import { MentorshipHub } from './alumni-user/MentorshipHub';
import { AlumniSacco } from './alumni-user/AlumniSacco';
import { UnifiedNotifications } from './shared/UnifiedNotifications';
import { AlumniShop } from './shared/AlumniShop';
import { UcuBadgeLogo } from './UcuBadgeLogo';

interface AlumniAppProps {
  user: UserType;
  onLogout: () => void;
}

type AlumniScreen = 'dashboard' | 'donations' | 'events' | 'connect' | 'news' | 'benefits' | 'chapters' | 'profile' | 'mentorship' | 'notifications' | 'shop' | 'sacco';

// --- IMPROVEMENT 2: Single source of truth for all navigation items ---
const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, mobile: true },
    { id: 'donations', label: 'Donations', icon: Heart, mobile: true },
    { id: 'sacco', label: 'SACCO', icon: Wallet, mobile: true },
    { id: 'events', label: 'Events', icon: Calendar, mobile: false },
    { id: 'connect', label: 'Connect', icon: Users, mobile: true },
    { id: 'mentorship', label: 'Mentorship', icon: MessageSquare, mobile: true },
    { id: 'shop', label: 'Shop', icon: ShoppingBag, mobile: true },
    { id: 'news', label: 'News', icon: Newspaper, mobile: false },
    { id: 'benefits', label: 'Benefits', icon: Gift, mobile: false },
    { id: 'chapters', label: 'Chapters', icon: Award, mobile: false },
];

export const AlumniApp = ({ user, onLogout }: AlumniAppProps) => {
  const [currentScreen, setCurrentScreen] = useState<AlumniScreen>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
      case 'sacco':
        return <AlumniSacco user={user} onBack={() => handleNavigate('dashboard')} />;
      case 'notifications':
        return <UnifiedNotifications user={user} onBack={() => handleNavigate('dashboard')} />;
      case 'shop':
        return <AlumniShop title="Alumni Shop" />;
      default:
        return <AlumniDashboard user={user} onNavigate={handleNavigate} />;
    }
  };

  // --- Your UI is preserved, but now uses the centralized logic ---
  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar Navigation */}
      <aside className={`hidden md:flex md:flex-col bg-sidebar border-r border-sidebar-border fixed h-screen transition-all duration-300 z-50 ${sidebarOpen ? 'w-64' : 'w-20'}`}>

        <div className={`p-4 border-b border-sidebar-border flex items-center ${sidebarOpen ? 'justify-between' : 'justify-center'}`}>
          <div className={`flex items-center gap-3 ${sidebarOpen ? 'block' : 'hidden'}`}>
            <UcuBadgeLogo className="h-9 w-9" />
            <div>
              <h1 className="text-sidebar-foreground text-sm">Alumni Connect</h1>
              <p className="text-xs text-sidebar-foreground/75 mt-0.5">Alumni Portal</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
            aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        
        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors justify-start ${
                    currentScreen === item.id
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                      : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  } ${!sidebarOpen ? 'justify-center px-0' : ''}`}
                  title={!sidebarOpen ? item.label : undefined}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {sidebarOpen && <span className="text-sm">{item.label}</span>}
                </button>
              );
            })}
          </div>
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <button
            onClick={() => handleNavigate('profile')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors justify-start ${
              currentScreen === 'profile'
                ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
            } ${!sidebarOpen ? 'justify-center px-0' : ''}`}
            title={!sidebarOpen ? "Profile" : undefined}
          >
            <User className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span className="text-sm">Profile</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 pb-28 md:pb-0 pt-20 md:pt-0 md:mt-0 transition-all duration-300 ${sidebarOpen ? 'md:ml-64' : 'md:ml-20'}`}>
        {renderScreen()}
      </main>

      {/* Mobile Bottom Navigation with Blue Header */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border px-2 py-2 z-50 shadow-lg backdrop-blur">
        {/* Mobile Header Bar with Sidebar Toggle */}
        <div className="fixed top-0 left-0 right-0 md:hidden bg-[#0b2a4a] text-white p-3 flex items-center justify-between z-40 shadow-md rounded-b-2xl">
          <div className="flex items-center gap-2">
            <UcuBadgeLogo className="h-7 w-7" />
            <div>
              <h1 className="text-sm font-semibold">Alumni Connect</h1>
              <p className="text-xs opacity-75">Alumni Portal</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        <div className="flex justify-around items-center max-w-lg mx-auto">
          {/* We now filter the main navItems array for mobile */}
          {navItems.filter(item => item.mobile).map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className={`flex flex-col items-center gap-1 p-2 w-1/5 ${ // Added width for better spacing
                  currentScreen === item.id ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <Icon size={20} />
                <span className="text-xs">{item.label}</span> {/* Added labels for mobile */}
              </button>
            );
          })}
           <button
                key="profile"
                onClick={() => handleNavigate('profile')}
                className={`flex flex-col items-center gap-1 p-2 w-1/5 ${
                  currentScreen === 'profile' ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <User size={20} />
                <span className="text-xs">Profile</span>
              </button>
        </div>
      </nav>
    </div>
  );
}
