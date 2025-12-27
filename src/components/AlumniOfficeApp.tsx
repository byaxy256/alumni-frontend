
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
import { LogOut, Menu, Home, FileText, Upload, Mail, FolderOpen, ShoppingBag, FileSearch, BarChart3, Settings2Icon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { ThemeToggle } from './ui/ThemeToggle';

interface AlumniOfficeAppProps {
  user: User;
  onLogout: () => void;
}


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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#c79b2d' }}>
              <span className="text-white text-sm">UCU</span>
            </div>
            <div>
              <h1 className="text-sm" style={{ color: '#0b2a4a' }}>Alumni Connect Office</h1>
              <p className="text-xs text-gray-500">{user.name}</p>
            </div>
          </div>

          {/* Mobile Menu */}
          <div className="lg:hidden">
            <DropdownMenu open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu size={20} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <DropdownMenuItem
                      key={item.id}
                      onClick={() => {
                        setCurrentScreen(item.id as AlumniScreen);
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      {item.label}
                    </DropdownMenuItem>
                  );
                })}
                <DropdownMenuItem onClick={onLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>


          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" onClick={onLogout}>
              <LogOut size={16} className="mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden lg:block border-t">
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
                    onClick={() => setCurrentScreen(item.id as AlumniScreen)}
                    style={isActive ? { backgroundColor: '#0b2a4a' } : {}}
                  >
                    <Icon size={16} className="mr-2" />
                    {item.label}
                  </Button>
                );
              })}
            </div>
          </nav>
        </div>
      </header>

      <main className="lg:pb-4">
        {renderScreen()}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-2 z-50">
        <div className="flex justify-around items-center max-w-lg mx-auto">
          {navigationItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const isActive = currentScreen === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentScreen(item.id as AlumniScreen)}
                className={`flex flex-col items-center gap-1 p-2 ${isActive ? 'text-[#0b2a4a]' : 'text-gray-500'}`}
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
}
