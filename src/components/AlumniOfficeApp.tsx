
import { useState } from 'react';
import AlumniDashboard from './alumni_office_staff/AlumniDashboard';
import ApplicationsQueue from './alumni_office_staff/ApplicationsQueue';
import ImportAssistant from './alumni_office_staff/ImportAssistant';
import BroadcastEmail from './alumni_office_staff/BroadcastEmail';
import ProjectManagement from './alumni_office_staff/ProjectManagement';
import MerchEvents from './alumni_office_staff/MerchEvents';
import Footprints from './alumni_office_staff/Footprints';
import Reports from './alumni_office_staff/Reports';
import ManageContent from './alumni_office_staff/ManageContent';
import type { User } from '../App';
import { Button } from './ui/button';
import { LogOut, Menu, Home, FileText, Upload, Mail, FolderOpen, ShoppingBag, BarChart3, Settings2Icon, DollarSign } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { UcuBadgeLogo } from './UcuBadgeLogo';
import { AlumniFundRequest } from './AlumniFundRequest';

type AlumniScreen = 'dashboard' | 'applications' | 'import' | 'broadcast' | 'projects' | 'merch' | 'footprints' | 'reports' | 'manage-content' | 'fund-request';

export const AlumniOfficeApp = ({ user, onLogout }: { user: User; onLogout: () => void }) => {
  const [currentScreen, setCurrentScreen] = useState<AlumniScreen>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'applications', label: 'Applications', icon: FileText },
    { id: 'fund-request', label: 'Request Funds', icon: DollarSign },
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
      case 'fund-request':
        return <AlumniFundRequest user={user} />;
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
    <div className="min-h-screen bg-[var(--brand-purple-soft-10)] text-foreground">
      {/* Header */}
      <header
        className="sticky top-0 z-40 w-full border-b border-white/15 backdrop-blur text-white shadow-sm"
        style={{ backgroundColor: 'var(--brand-purple)' }}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <UcuBadgeLogo className="w-10 h-10" />
            <div>
              <h1 className="text-sm text-white">Alumni Circle Office Staff</h1>
              <p className="text-xs text-white/80">{user.name}</p>
            </div>
          </div>

          {/* Mobile Menu */}
          <div className="lg:hidden">
            <DropdownMenu open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="bg-white/90 text-[var(--brand-purple)] hover:bg-white"
                >
                  <Menu size={20} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-[var(--brand-purple)] border-white/20 text-white">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <DropdownMenuItem
                      className="focus:bg-white/15 focus:text-white"
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
                <DropdownMenuItem className="focus:bg-white/15 focus:text-white" onClick={onLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>


          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center gap-2">
            <Button variant="ghost" onClick={onLogout} className="text-white hover:bg-white/15">
              <LogOut size={16} className="mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden lg:block border-t border-white/15">
          <nav className="px-4 py-2">
            <div className="flex gap-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentScreen === item.id;
                return (
                  <Button
                    key={item.id}
                    variant="ghost"
                    size="sm"
                    className={isActive ? 'bg-white/20 text-white hover:bg-white/25' : 'text-white/90 hover:bg-white/15 hover:text-white'}
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
      </header>

      <main className="lg:pb-4">
        {renderScreen()}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#2f5288]/95 border-t border-white/15 px-2 py-2 z-50 backdrop-blur text-white">
        <div className="flex justify-around items-center max-w-lg mx-auto">
          {navigationItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const isActive = currentScreen === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentScreen(item.id as AlumniScreen)}
                className={`flex flex-col items-center gap-1 p-2 ${isActive ? 'text-white' : 'text-white/80'}`}
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
