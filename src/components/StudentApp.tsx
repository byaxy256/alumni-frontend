import { useState, useEffect } from 'react';
import { StudentDashboard } from './student/StudentDashboard';
import { ApplyLoanSupport } from './student/ApplyLoanSupport';
import { LoanDetails } from './student/LoanDetails';
import { PaymentHistory } from './student/PaymentHistory';
import { Mentorship } from './student/Mentorship';
import { UnifiedNotifications } from './shared/UnifiedNotifications';
import { StudentProfile } from './student/StudentProfile';
import { StudentFund } from './student/StudentFund';
import { StudentDisbursements } from './student/StudentDisbursements';
import { News } from './student/News';
import { Events } from './student/Events';
import type { User } from '../App';
import { Home, FileText, DollarSign, History, Users, Bell, User as UserIcon, Wallet, Calendar, Settings, Search, MessageCircle } from 'lucide-react';
import { MobileHeader } from './MobileHeader';
import { UcuBadgeLogo } from './UcuBadgeLogo';
import { Avatar, AvatarFallback } from './ui/avatar';

type StudentScreen = 'dashboard' | 'apply-loan' | 'apply-benefit' | 'loans' | 'payment-history' | 'mentorship' | 'notifications' | 'profile' | 'fund' | 'disbursements' | 'news' | 'events';

export const StudentApp = ({ user, onLogout }: { user: User; onLogout: () => void }) => {
  const [currentScreen, setCurrentScreen] = useState<StudentScreen>('dashboard');
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

  // --- THE FIX: A robust navigation handler ---
  const handleNavigate = (targetScreen: string) => {
    // This maps different button IDs to the correct screen components
    if (targetScreen === 'apply' || targetScreen === 'apply-loan') {
      setCurrentScreen('apply-loan');
    } else if (targetScreen === 'benefits' || targetScreen === 'apply-benefit') {
      setCurrentScreen('apply-benefit');
    } else if (targetScreen === 'loan-details') {
      setCurrentScreen('loans');
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
      case 'apply-loan':
        return <ApplyLoanSupport user={user} onBack={() => handleNavigate('dashboard')} applicationType="loan" />;
      case 'apply-benefit':
        return <ApplyLoanSupport user={user} onBack={() => handleNavigate('dashboard')} applicationType="benefit" />;
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
      case 'disbursements':
        return <StudentDisbursements user={user} onBack={() => handleNavigate('dashboard')} />;
      case 'news':
        return <News onBack={() => handleNavigate('dashboard')} />;
      case 'events':
        return <Events onBack={() => handleNavigate('dashboard')} />;
      default:
        return <StudentDashboard user={user} onNavigate={handleNavigate} />;
    }
  };

  const screenTitles: Record<StudentScreen, string> = {
    dashboard: 'Dashboard',
    'apply-loan': 'Apply for Loan',
    'apply-benefit': 'Apply for Benefit',
    loans: 'Loans',
    'payment-history': 'Payments',
    mentorship: 'Mentorship',
    notifications: 'Notifications',
    profile: 'Profile',
    fund: 'Student Fund',
    disbursements: 'Disbursements',
    news: 'News',
    events: 'Events',
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'apply', label: 'Apply', icon: FileText },
    { id: 'loan-details', label: 'Loans', icon: DollarSign },
    { id: 'payment-history', label: 'Payments', icon: History },
    { id: 'fund', label: 'Student Fund', icon: Wallet },
    { id: 'disbursements', label: 'Disbursements', icon: DollarSign },
    { id: 'mentorship', label: 'Mentorship', icon: Users },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'news', label: 'News', icon: FileText },
  ];

  // Your JSX is preserved, but now uses the new `handleNavigate` function
  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Mobile header */}
      <div className="md:hidden w-full fixed top-0 left-0 right-0 z-40">
        <MobileHeader
          title={screenTitles[currentScreen]}
          onMenu={() => setIsMobileMenuOpen(true)}
          showNotifications={false}
        />
      </div>

      {/* Mobile drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-gradient-to-b from-[#0b2a4a] via-[#0b2a4a] to-[#020617] text-slate-100 p-4 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <UcuBadgeLogo className="h-9 w-9" />
                <div>
                  <h1 className="text-sm font-semibold text-white">Alumni Circle</h1>
                  <p className="text-xs text-slate-300 mt-1">Student Dashboard</p>
                </div>
              </div>
              <button
                className="text-slate-300 hover:text-white"
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      handleNavigate(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      currentScreen === item.id || (currentScreen === 'loans' && item.id === 'loan-details')
                        ? 'bg-white/10 text-white'
                        : 'text-slate-200 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
            <div className="mt-4 border-t border-white/10 pt-4 space-y-2">
              <button
                onClick={() => {
                  handleNavigate('profile');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  currentScreen === 'profile'
                    ? 'bg-white/10 text-white'
                    : 'text-slate-200 hover:bg-white/5 hover:text-white'
                }`}
              >
                <UserIcon className="w-5 h-5" />
                <span>Profile</span>
              </button>
              <button
                onClick={() => {
                  handleNavigate('dashboard');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-slate-200 hover:bg-white/5 hover:text-white"
              >
                <Settings className="w-5 h-5" />
                <span>Settings</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      <aside className="hidden md:flex md:flex-col w-64 bg-gradient-to-b from-[#0b2a4a] via-[#0b2a4a] to-[#020617] text-slate-100 fixed h-screen shadow-2xl">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <UcuBadgeLogo className="h-9 w-9" />
              <div>
                <h1 className="text-sm font-semibold text-white">Alumni Circle</h1>
                <p className="text-xs text-slate-300 mt-1">Student Dashboard</p>
              </div>
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
                    currentScreen === item.id || (currentScreen === 'loans' && item.id === 'loan-details')
                      ? 'bg-white/12 text-white'
                      : 'text-slate-200 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
        <div className="p-4 border-t border-white/10 space-y-2">
          <button
            onClick={() => handleNavigate('profile')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              currentScreen === 'profile'
                ? 'bg-white/10 text-white'
                : 'text-slate-200 hover:bg-white/5 hover:text-white'
            }`}
          >
            <UserIcon className="w-5 h-5" />
            <span>Profile</span>
          </button>
          <button
            onClick={() => handleNavigate('dashboard')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-slate-200 hover:bg-white/5 hover:text-white"
          >
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </button>
        </div>
      </aside>
      <main className="flex-1 md:ml-64 pb-20 md:pb-0 pt-14 md:pt-0 flex flex-col bg-white">
        {/* Top header: search + icons (desktop only) */}
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
              <MessageCircle className="w-5 h-5" />
            </button>
            <Avatar className="h-9 w-9 border border-gray-200">
              <AvatarFallback className="bg-[#0b2a4a] text-white text-sm">
                {(user?.full_name || 'S').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          {renderScreen()}
        </div>
      </main>
      {/* Mobile bottom nav removed in favor of drawer */}
    </div>
  );
};
