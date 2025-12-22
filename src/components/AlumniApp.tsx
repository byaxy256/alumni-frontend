// src/components/AlumniApp.tsx


import { useState } from 'react';
import { Home, Heart, Calendar, Users, Newspaper, Gift, Award, User, MessageSquare, LogOut } from 'lucide-react';
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
import { AlumniNotifications } from './alumni-user/AlumniNotifications';
import { ThemeToggle } from './ui/ThemeToggle';

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

  // --- IMPROVEMENT 1: Centralized navigation handler ---
  const handleNavigate = (targetScreen: string) => {
    // This function ensures that only valid screen names can be set, preventing errors.
    const validScreens = [...navItems.map(item => item.id), 'profile'];
    if (validScreens.includes(targetScreen)) {
        setCurrentScreen(targetScreen as AlumniScreen);
    } else {
        console.warn(`Attempted to navigate to an unknown screen: ${targetScreen}`);
        setCurrentScreen('dashboard'); // Fallback to dashboard
    }
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'dashboard':
        return <AlumniDashboard user={user} onNavigate={handleNavigate} />;
      case 'donations':
        return <AlumniDonations user={user} onBack={() => handleNavigate('dashboard')} />;
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
        return <AlumniNotifications user={user} onBack={() => handleNavigate('dashboard')} />;
      default:
        return <AlumniDashboard user={user} onNavigate={handleNavigate} />;
    }
  };

  // --- Your UI is preserved, but now uses the centralized logic ---
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Navigation */}
      <aside className="hidden md:flex md:flex-col w-64 bg-white border-r border-gray-200 fixed h-screen">

        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h1 className="text-primary">Alumni Connect</h1>
            <p className="text-sm text-gray-600 mt-1">Alumni Portal</p>
          </div>
          <ThemeToggle />
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
                    currentScreen === item.id ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={() => handleNavigate('profile')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              currentScreen === 'profile' ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <User className="w-5 h-5" />
            <span>Profile</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 pb-20 md:pb-0"> {/* Added padding-bottom for mobile */}
        {renderScreen()}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-2 z-50 shadow-lg">
        <div className="flex justify-around items-center max-w-lg mx-auto">
          {/* We now filter the main navItems array for mobile */}
          {navItems.filter(item => item.mobile).map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className={`flex flex-col items-center gap-1 p-2 w-1/5 ${ // Added width for better spacing
                  currentScreen === item.id ? 'text-primary' : 'text-gray-500'
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
                  currentScreen === 'profile' ? 'text-primary' : 'text-gray-500'
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