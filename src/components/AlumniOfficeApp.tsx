
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
import { LogOut, Menu, Home, FileText, Upload, Mail, FolderOpen, ShoppingBag, BarChart3, Settings2Icon } from 'lucide-react';
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
    <div className="min-h-screen bg-background text-foreground">
      {/* Header with top menu bar (staff) */}
      <header className="sticky top-0 z-40 w-full border-b border-border bg-[#0b2a4a] text-white">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <UcuBadgeLogo className="w-10 h-10" />
            <div>
              <h1 className="text-sm font-semibold">Alumni Circle</h1>
              <p className="text-xs text-slate-200">Alumni Office • {user.name}</p>
            </div>
          </div>

          {/* Mobile menu trigger */}
          <div className="lg:hidden">
            <Button
              variant="ghost"
              size="icon"
              className="text-white"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <Menu size={20} />
            </Button>
          </div>

          {/* Desktop right side actions */}
          <div className="hidden lg:flex items-center gap-2">
            <Button variant="ghost" onClick={onLogout} className="text-white hover:bg-white/10">
              <LogOut size={16} className="mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Desktop top nav bar */}
        <div className="hidden lg:block border-t border-white/10 bg-[#0b2a4a]">
          <nav className="px-4 py-2">
            <div className="flex gap-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentScreen === item.id;
                return (
                  <Button
                    key={item.id}
                    variant={isActive ? 'default' : 'ghost'}
                    size="sm"
                    className={
                      isActive
                        ? 'bg-white text-[#0b2a4a]'
                        : 'text-slate-100 hover:bg-white/10 hover:text-white'
                    }
                    onClick={() => setCurrentScreen(item.id as AlumniScreen)}
                  >
                    <Icon size={16} className="mr-2" />
                    {item.label}
                  </Button>
                );
              })}
            </div>
          </nav>
        </div>

        {/* Mobile dropdown menu under header */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-white/10 bg-[#0b2a4a]">
            <nav className="px-2 py-2 space-y-1">
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
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
                      isActive ? 'bg-white text-[#0b2a4a]' : 'text-slate-100 hover:bg-white/10'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
              <button
                onClick={() => {
                  onLogout();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-100 hover:bg-white/10"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </nav>
          </div>
        )}
      </header>

      <main className="lg:pb-4 bg-white min-h-screen">
        {renderScreen()}
      </main>
    </div>
  );
}
