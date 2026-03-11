
import { useState } from 'react';
import AlumniDashboard from './alumni/AlumniDashboard';
import ApplicationsQueue from './alumni/ApplicationsQueue';
import ImportAssistant from './alumni/ImportAssistant';
import BroadcastEmail from './alumni/BroadcastEmail';
import ProjectManagement from './alumni/ProjectManagement';
import MerchEvents from './alumni/MerchEvents';
import Footprints from './alumni/Footprints';
import Reports from './alumni/Reports';
import ManageContent from './alumni/ManageContent';
import type { User } from '../App';
import { Button } from './ui/button';
import { LogOut, Menu, Home, FileText, Upload, Mail, FolderOpen, ShoppingBag, BarChart3, Settings2Icon, Settings } from 'lucide-react';
import { UcuBadgeLogo } from './UcuBadgeLogo';



type AlumniScreen = 'dashboard' | 'applications' | 'import' | 'broadcast' | 'projects' | 'merch' | 'footprints' | 'reports' | 'manage-content';

export const AlumniOfficeApp = ({ user, onLogout }: { user: User; onLogout: () => void }) => {
  const [currentScreen, setCurrentScreen] = useState<AlumniScreen>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'applications', label: 'Applications', icon: FileText },
    { id: 'import', label: 'Import Data', icon: Upload },
    { id: 'broadcast', label: 'Broadcast', icon: Mail },
    { id: 'projects', label: 'Projects', icon: FolderOpen },
    { id: 'merch', label: 'Merch & Events', icon: ShoppingBag },

    { id: 'manage-content', label: 'Manage Content', icon: Settings2Icon },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
  ];

  const renderScreen = () => {
    switch (currentScreen) {
      case 'dashboard':
        return <AlumniDashboard user={user} onNavigate={(screen) => setCurrentScreen(screen as AlumniScreen)} />;
      case 'applications':
        return <ApplicationsQueue />;
      case 'import':
        return <ImportAssistant />;
      case 'broadcast':
        return <BroadcastEmail />;
      case 'projects':
        return <ProjectManagement />;
      case 'merch':
        return <MerchEvents />;


      case 'footprints':
        return <Footprints />;
      case 'reports':
        return <Reports />;
      case 'manage-content':
        return <ManageContent />;
      default:
        return <AlumniDashboard user={user} onNavigate={(screen) => setCurrentScreen(screen as AlumniScreen)} />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-[#0b2a4a] text-white">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <UcuBadgeLogo className="w-9 h-9" />
            <div>
              <h1 className="text-sm font-semibold">Alumni Circle</h1>
              <p className="text-xs text-slate-200">Alumni Office</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-white"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={20} />
          </Button>
        </div>
      </div>

      {/* Mobile sidebar drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
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
                  <p className="text-xs text-slate-300 mt-1">Alumni Office</p>
                  <p className="text-[11px] text-slate-400 truncate max-w-[160px]">{user.name}</p>
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
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentScreen === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentScreen(item.id as AlumniScreen);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive ? 'bg-white/10 text-white' : 'text-slate-200 hover:bg-white/5 hover:text-white'
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
                  setCurrentScreen('dashboard');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-slate-200 hover:bg-white/5 hover:text-white"
              >
                <Settings className="w-5 h-5" />
                <span>Settings</span>
              </button>
              <button
                onClick={() => {
                  onLogout();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-slate-200 hover:bg-white/5 hover:text-white"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-72 bg-gradient-to-b from-[#0b2a4a] via-[#0b2a4a] to-[#020617] text-slate-100 fixed inset-y-0 shadow-2xl">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <UcuBadgeLogo className="h-9 w-9" />
              <div>
                <h1 className="text-sm font-semibold text-white">Alumni Circle</h1>
                <p className="text-xs text-slate-300 mt-1">Alumni Office</p>
                <p className="text-[11px] text-slate-400 truncate max-w-[160px]">{user.name}</p>
              </div>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentScreen === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentScreen(item.id as AlumniScreen)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive ? 'bg-white/12 text-white' : 'text-slate-200 hover:bg-white/5 hover:text-white'
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
            onClick={() => setCurrentScreen('dashboard')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-slate-200 hover:bg-white/5 hover:text-white"
          >
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </button>
          <Button
            onClick={onLogout}
            variant="ghost"
            className="w-full justify-start text-slate-200 hover:bg-white/5 hover:text-white"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 lg:ml-72 pt-14 lg:pt-0 lg:pb-4">
        {renderScreen()}
      </main>
    </div>
  );
}
