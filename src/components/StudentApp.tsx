import { useState, useEffect } from 'react';
import { StudentDashboard } from './student/StudentDashboard';
import { ApplyLoanSupport } from './student/ApplyLoanSupport';
import { LoanDetails } from './student/LoanDetails';
import { PaymentHistory } from './student/PaymentHistory';
import { Mentorship } from './student/Mentorship';
import { UnifiedNotifications } from './shared/UnifiedNotifications';
import { StudentProfile } from './student/StudentProfile';
import { StudentFund } from './student/StudentFund';
import { News } from './student/News';
import { Events } from './student/Events';
import type { User } from '../App';
import { Home, FileText, DollarSign, History, Users, Bell, User as UserIcon, Wallet, Calendar } from 'lucide-react';
import { MobileHeader } from './MobileHeader';

type StudentScreen = 'dashboard' | 'apply' | 'loans' | 'payment-history' | 'mentorship' | 'notifications' | 'profile' | 'fund' | 'news' | 'events';

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
    if (['apply', 'benefits'].includes(targetScreen)) {
      setCurrentScreen('apply');
    } else if (targetScreen === 'loan-details') {
      setCurrentScreen('loans'); // Map the 'loan-details' ID from the nav to the 'loans' screen
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
    apply: 'Apply',
    loans: 'Loans',
    'payment-history': 'Payments',
    mentorship: 'Mentorship',
    notifications: 'Notifications',
    profile: 'Profile',
    fund: 'Student Fund',
    news: 'News',
    events: 'Events',
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'apply', label: 'Apply', icon: FileText },
    { id: 'loan-details', label: 'Loans', icon: DollarSign },
    { id: 'payment-history', label: 'Payments', icon: History },
    { id: 'fund', label: 'Student Fund', icon: Wallet },
    { id: 'mentorship', label: 'Mentorship', icon: Users },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'news', label: 'News', icon: FileText },
  ];

  // Your JSX is preserved, but now uses the new `handleNavigate` function
  return (
    <div className="min-h-screen bg-gray-50 flex">
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
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-white border-r border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-primary">Alumni Circle</h1>
                <p className="text-sm text-gray-600 mt-1">Student Portal</p>
              </div>
              <button
                className="text-gray-500 hover:text-gray-700"
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
                        ? 'bg-primary text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
            <div className="mt-4 border-t border-gray-200 pt-4">
              <button
                onClick={() => {
                  handleNavigate('profile');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  currentScreen === 'profile' ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <UserIcon className="w-5 h-5" />
                <span>Profile</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      <aside className="hidden md:flex md:flex-col w-64 bg-white border-r border-gray-200 fixed h-screen">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-primary">Alumni Circle</h1>
              <p className="text-sm text-gray-600 mt-1">Student Portal</p>
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
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${currentScreen === item.id || (currentScreen === 'loans' && item.id === 'loan-details') ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
        <div className="p-4 border-t border-gray-200">
          <button onClick={() => handleNavigate('profile')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${currentScreen === 'profile' ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-100'}`}>
            <UserIcon className="w-5 h-5" />
            <span>Profile</span>
          </button>
        </div>
      </aside>
      <main className="flex-1 md:ml-64 pb-20 md:pb-0 pt-14 md:pt-0">
        {renderScreen()}
      </main>
      {/* Mobile bottom nav removed in favor of drawer */}
    </div>
  );
};
