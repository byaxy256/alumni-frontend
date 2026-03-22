// src/components/AlumniApp.tsx


import { useState, useEffect } from 'react';
import { Home, Heart, Calendar, Users, Gift, Award, User, MessageSquare, ShoppingBag, Wallet, Menu, LogOut } from 'lucide-react';
import type { User as UserType } from '../App';
import { AlumniDashboard } from './alumni-user/AlumniDashboard';
import { AlumniDonations } from './alumni-user/AlumniDonations';
import { AlumniEventsAndNews } from './alumni-user/AlumniEventsAndNews';
import { AlumniConnect } from './alumni-user/AlumniConnect';
import { AlumniBenefits } from './alumni-user/AlumniBenefits';
import { AlumniChapters } from './alumni-user/AlumniChapters';
import { AlumniProfile } from './alumni-user/AlumniProfile';
import { MentorshipHub } from './alumni-user/MentorshipHub';
import { AlumniSacco } from './alumni-user/AlumniSacco';
import { UnifiedNotifications } from './shared/UnifiedNotifications';
import { AlumniShop } from './shared/AlumniShop';
import { UcuBadgeLogo } from './UcuBadgeLogo';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

interface AlumniAppProps {
  user: UserType;
  onLogout: () => void;
}

type AlumniScreen = 'dashboard' | 'donations' | 'eventsNews' | 'connect' | 'benefits' | 'chapters' | 'profile' | 'mentorship' | 'notifications' | 'shop' | 'sacco';

// --- IMPROVEMENT 2: Single source of truth for all navigation items ---
const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, mobile: true },
    { id: 'donations', label: 'Donations', icon: Heart, mobile: true },
    { id: 'sacco', label: 'SACCO', icon: Wallet, mobile: true },
    { id: 'eventsNews', label: 'News & Events', icon: Calendar, mobile: false },
    { id: 'connect', label: 'Connect', icon: Users, mobile: true },
    { id: 'mentorship', label: 'Mentorship', icon: MessageSquare, mobile: true },
    { id: 'shop', label: 'Shop', icon: ShoppingBag, mobile: true },
    { id: 'benefits', label: 'Benefits', icon: Gift, mobile: false },
    { id: 'chapters', label: 'Chapters', icon: Award, mobile: false },
];

export const AlumniApp = ({ user, onLogout }: AlumniAppProps) => {
  const [currentScreen, setCurrentScreen] = useState<AlumniScreen>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
      case 'eventsNews':
        return <AlumniEventsAndNews onBack={() => handleNavigate('dashboard')} />;
      case 'connect':
        return <AlumniConnect user={user} onBack={() => handleNavigate('dashboard')} />;
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
      <aside className="hidden md:flex md:flex-col w-64 bg-sidebar border-r border-sidebar-border fixed h-screen z-50 text-white">

        <div className="p-4 border-b border-sidebar-border flex items-center">
          <div className="flex items-center gap-3">
            <UcuBadgeLogo className="h-9 w-9" />
            <div>
              <h1 className="text-white text-sm">Alumni Connect</h1>
              <p className="text-xs text-white/80 mt-0.5">Alumni Portal</p>
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
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    currentScreen === item.id
                      ? 'bg-white/15 text-white'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <button
            onClick={() => handleNavigate('profile')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              currentScreen === 'profile'
                ? 'bg-white/15 text-white'
                : 'text-white/80 hover:bg-white/10 hover:text-white'
            }`}
          >
            <User className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">Profile</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 pb-28 md:pb-0 pt-20 md:pt-0 md:ml-64">
        {renderScreen()}
      </main>

      {/* Mobile Bottom Navigation with Blue Header */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border px-2 py-2 z-50 shadow-lg backdrop-blur">
        {/* Mobile Header Bar with Hamburger Navigation */}
        <div className="fixed top-0 left-0 right-0 md:hidden bg-[var(--brand-blue)] text-white p-3 flex items-center justify-between z-40 shadow-md rounded-b-2xl">
          <div className="flex items-center gap-2">
            <UcuBadgeLogo className="h-7 w-7" />
            <div>
              <h1 className="text-sm font-semibold">Alumni Connect</h1>
              <p className="text-xs opacity-75">Alumni Portal</p>
            </div>
          </div>
          <DropdownMenu open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="bg-black/20 text-white hover:bg-black/30">
                <Menu className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 border-black/30 text-white" style={{ backgroundColor: '#8A1F3A' }}>
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <DropdownMenuItem
                    key={item.id}
                    className="focus:bg-black/15 focus:text-white"
                    onClick={() => {
                      handleNavigate(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {item.label}
                  </DropdownMenuItem>
                );
              })}
              <DropdownMenuItem
                className="focus:bg-black/15 focus:text-white"
                onClick={() => {
                  handleNavigate('profile');
                  setIsMobileMenuOpen(false);
                }}
              >
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="focus:bg-black/15 focus:text-white" onClick={onLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
