import { useState, useEffect } from 'react';
import { StudentDashboard } from './student/StudentDashboard';
import { ApplyLoanSupport } from './student/ApplyLoanSupport';
import { LoanDetails } from './student/LoanDetails';
import { PaymentHistory } from './student/PaymentHistory';
import { Mentorship } from './student/Mentorship';
import { UnifiedNotifications } from './shared/UnifiedNotifications';
import { StudentProfile } from './student/StudentProfile';
import { StudentFund } from './student/StudentFund';
import { EventsAndNews } from './student/EventsAndNews';
import type { User } from '../App';
import { Home, FileText, DollarSign, History, Users, Bell, User as UserIcon, Wallet, Calendar, ShoppingBag, Menu, LogOut } from 'lucide-react';
import { AlumniShop } from './shared/AlumniShop';
import { UcuBadgeLogo } from './UcuBadgeLogo';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

type StudentScreen = 'dashboard' | 'apply' | 'loans' | 'payment-history' | 'mentorship' | 'notifications' | 'profile' | 'fund' | 'events-news' | 'shop';

export const StudentApp = ({ user, onLogout }: { user: User; onLogout: () => void }) => {
  const [currentScreen, setCurrentScreen] = useState<StudentScreen>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const studentNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'apply', label: 'Apply', icon: FileText },
    { id: 'loan-details', label: 'Loans', icon: DollarSign },
    { id: 'payment-history', label: 'Payments', icon: History },
    { id: 'fund', label: 'Student Fund', icon: Wallet },
    { id: 'mentorship', label: 'Mentorship', icon: Users },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'shop', label: 'Shop', icon: ShoppingBag },
    { id: 'events-news', label: 'Events & News', icon: Calendar },
  ] as const;

  // Handle deep linking from push notifications
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.split('/').pop() || 'dashboard';
      handleNavigate(path);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // --- THE FIX: A robust navigation handler ---
  const handleNavigate = (targetScreen: string) => {
    if (['apply', 'benefits'].includes(targetScreen)) {
      setCurrentScreen('apply');
    } else if (targetScreen === 'loan-details') {
      setCurrentScreen('loans');
    } else if (targetScreen === 'events' || targetScreen === 'news') {
      setCurrentScreen('events-news');
    } else {
      setCurrentScreen(targetScreen as StudentScreen);
    }
    // Update browser history for deep linking
    window.history.pushState({}, '', `/${targetScreen}`);
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'dashboard':
        return <StudentDashboard user={user} onNavigate={handleNavigate} />;
      case 'apply':
        return <ApplyLoanSupport user={user} onBack={() => handleNavigate('dashboard')} />;
      case 'loans':
        return <LoanDetails user={user} onBack={() => handleNavigate('dashboard')} />;
      case 'payment-history':
        return <PaymentHistory user={user} onBack={() => handleNavigate('dashboard')} />;
      case 'mentorship':
        return <Mentorship user={user} onBack={() => handleNavigate('dashboard')} />;
      case 'notifications':
        return <UnifiedNotifications user={user} onBack={() => handleNavigate('dashboard')} />;
      case 'profile':
        return <StudentProfile user={user} onBack={() => handleNavigate('dashboard')} onLogout={onLogout} />;
      case 'fund':
        return <StudentFund user={user} onBack={() => handleNavigate('dashboard')} />;
      case 'events-news':
        return <EventsAndNews onBack={() => handleNavigate('dashboard')} />;
      case 'shop':
        return <AlumniShop title="Alumni Shop" />;
      default:
        return <StudentDashboard user={user} onNavigate={handleNavigate} />;
    }
  };

  // Your JSX is preserved, but now uses the new `handleNavigate` function
  return (
    <div className="min-h-screen flex" style={{ background: 'var(--background)' }}>
      <aside className="hidden md:flex md:flex-col w-64 bg-[#0b2a4a] fixed h-screen shadow-xl">
        <div className="p-6">
          <div className="flex items-center justify-start">
            <div>
              <h1 className="text-white">Alumni circle</h1>
              <p className="text-sm text-white/80 mt-1">Student Portal</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-1">
            {studentNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${currentScreen === item.id || (currentScreen === 'loans' && item.id === 'loan-details') ? 'bg-white/20 text-white shadow-sm' : 'text-white hover:bg-white/10 hover:text-white'}`}
                >
                  <Icon className="w-5 h-5 text-white" />
                  <span className="text-white">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
        <div className="p-4">
          <button onClick={() => handleNavigate('profile')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${currentScreen === 'profile' ? 'bg-white/20 text-white shadow-sm' : 'text-white hover:bg-white/10 hover:text-white'}`}>
            <UserIcon className="w-5 h-5 text-white" />
            <span className="text-white">Profile</span>
          </button>
        </div>
      </aside>

      <div className="md:hidden fixed top-0 left-0 right-0 border-b border-black/20 z-40" style={{ backgroundColor: '#8A1F3A' }}>
        <div className="flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-3">
            <UcuBadgeLogo className="h-8 w-8" />
            <div>
              <h1 className="text-sm text-white">Alumni Circle</h1>
              <p className="text-xs text-white/80">Student Portal</p>
            </div>
          </div>
          <DropdownMenu open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="bg-black/20 text-white hover:bg-black/30">
                <Menu className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 border-black/30 text-white" style={{ backgroundColor: '#8A1F3A' }}>
              {studentNavItems.map((item) => {
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
                <UserIcon className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="focus:bg-black/15 focus:text-white" onClick={onLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <main className="flex-1 md:ml-64 pt-16 md:pt-0 pb-20 md:pb-0">
        {renderScreen()}
      </main>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-2 z-50 shadow-lg">
        <div className="flex justify-around items-center max-w-lg mx-auto">
          {studentNavItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const isActive = currentScreen === item.id || (currentScreen === 'loans' && item.id === 'loan-details');
            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className={`flex flex-col items-center gap-1 p-2 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
              >
                <Icon size={18} />
                <span className="text-xs">{item.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
