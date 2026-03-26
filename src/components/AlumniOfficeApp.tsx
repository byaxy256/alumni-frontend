
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
import { LogOut, Menu, Home, FileText, Upload, Mail, FolderOpen, ShoppingBag, BarChart3, Settings2Icon, DollarSign, Bell, ChevronDown, ClipboardCheck } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { UcuBadgeLogo } from './UcuBadgeLogo';
import { AlumniFundRequest } from './AlumniFundRequest';

type AlumniScreen = 'dashboard' | 'applications' | 'import' | 'broadcast' | 'projects' | 'merch' | 'footprints' | 'reports' | 'manage-content' | 'fund-request';

export const AlumniOfficeApp = ({
  user,
  onLogout,
  headerTitle = 'Administrator Dashboard',
}: {
  user: User;
  onLogout: () => void;
  headerTitle?: string;
}) => {
  const [currentScreen, setCurrentScreen] = useState<AlumniScreen>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigationItems: { key: string; screen: AlumniScreen; label: string; icon: any }[] = [
    { key: 'dashboard', screen: 'dashboard', label: 'Dashboard', icon: Home },
    { key: 'applications', screen: 'applications', label: 'Applications', icon: FileText },
    { key: 'fund-request', screen: 'fund-request', label: 'Request Funds', icon: DollarSign },
    { key: 'approvals', screen: 'applications', label: 'Approvals', icon: ClipboardCheck },
    { key: 'reports-main', screen: 'reports', label: 'Reports', icon: BarChart3 },
    { key: 'notifications', screen: 'footprints', label: 'Notifications', icon: Bell },
    { key: 'reports-secondary', screen: 'reports', label: 'Reports', icon: FileText },
  ];

  const utilityItems: { key: string; screen: AlumniScreen; label: string; icon: any }[] = [
    { key: 'import', screen: 'import', label: 'Import Data', icon: Upload },
    { key: 'broadcast', screen: 'broadcast', label: 'Broadcast', icon: Mail },
    { key: 'projects', screen: 'projects', label: 'Projects', icon: FolderOpen },
    { key: 'merch', screen: 'merch', label: 'Merch & Events', icon: ShoppingBag },
    { key: 'manage-content', screen: 'manage-content', label: 'Manage Content', icon: Settings2Icon },
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
    <div className="min-h-screen bg-[#d7d8e1] p-2 lg:p-6 text-foreground">
      <div className="mx-auto max-w-[1500px] overflow-hidden rounded-[18px] border border-[#c3c8d7] bg-[#eef0f6] shadow-[0_20px_40px_rgba(13,28,60,0.12)]">
        <div className="hidden lg:grid lg:grid-cols-[240px_1fr] min-h-[820px]">
          <aside className="bg-gradient-to-b from-[#17305f] via-[#173564] to-[#1b325e] text-white flex flex-col">
            <div className="h-[78px] border-b border-white/12 flex items-center px-4 gap-3">
              <UcuBadgeLogo className="w-9 h-9" />
              <p className="text-[25px] leading-none text-white/95">{headerTitle}</p>
            </div>

            <div className="px-4 py-4 border-b border-white/12">
              <p className="text-sm text-white/90">Welcome back, {user?.name?.split(' ')[0] || 'Ronald'}!</p>
              <p className="text-xs text-white/70">Role: General Secretary</p>
            </div>

            <nav className="px-3 py-3 space-y-1 flex-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentScreen === item.screen;
                return (
                  <button
                    key={item.key}
                    onClick={() => setCurrentScreen(item.screen)}
                    className={`w-full text-left px-3 py-2 rounded-xl transition flex items-center gap-3 ${
                      isActive ? 'bg-[#10274e] text-white shadow-inner' : 'text-white/86 hover:bg-white/10'
                    }`}
                  >
                    <span className="w-5 h-5 rounded border border-white/45 inline-flex items-center justify-center">
                      <Icon size={12} />
                    </span>
                    <span className="text-sm">{item.label}</span>
                  </button>
                );
              })}

              <div className="pt-3 mt-2 border-t border-white/12 space-y-1">
                {utilityItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.key}
                      onClick={() => setCurrentScreen(item.screen)}
                      className="w-full text-left px-3 py-2 rounded-xl transition flex items-center gap-3 text-white/80 hover:bg-white/10"
                    >
                      <Icon size={15} />
                      <span className="text-sm">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </nav>

            <div className="p-3 border-t border-white/12">
              <button
                onClick={onLogout}
                className="w-full text-left px-3 py-2 rounded-xl text-white/85 hover:bg-white/10 flex items-center gap-3"
              >
                <LogOut size={16} />
                <span className="text-sm">Logout</span>
              </button>
            </div>
          </aside>

          <section className="flex flex-col min-w-0">
            <header className="h-[78px] bg-gradient-to-r from-[#1a3562] to-[#1f3f72] text-white flex items-center justify-between px-6 border-b border-[#152d55]">
              <div />
              <div className="flex items-center gap-5">
                <button 
                  className="hover:text-white/85 transition"
                  title="Notifications"
                  aria-label="Notifications"
                >
                  <Bell size={16} />
                </button>
                <button className="flex items-center gap-2 text-sm">
                  <span>{user?.name?.split(' ')[0] || 'Ronald'}</span>
                  <ChevronDown size={14} />
                </button>
              </div>
            </header>

            <main className="flex-1 overflow-y-auto">
              {renderScreen()}
            </main>
          </section>
        </div>

        <div className="lg:hidden min-h-screen bg-[#eef0f6]">
          <header className="sticky top-0 z-40 w-full border-b border-black/40 text-white shadow-none bg-[#1b3563]">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <UcuBadgeLogo className="w-8 h-8" />
                <h1 className="text-sm text-white">{headerTitle}</h1>
              </div>

              <DropdownMenu open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="bg-black/20 text-white hover:bg-black/30"
                  >
                    <Menu size={20} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 border-black/30 text-white" style={{ backgroundColor: '#1b3563' }}>
                  {[...navigationItems, ...utilityItems].map((item) => {
                    const Icon = item.icon;
                    return (
                      <DropdownMenuItem
                        className="focus:bg-black/15 focus:text-white"
                        key={item.key}
                        onClick={() => {
                          setCurrentScreen(item.screen);
                          setIsMobileMenuOpen(false);
                        }}
                      >
                        <Icon className="mr-2 h-4 w-4" />
                        {item.label}
                      </DropdownMenuItem>
                    );
                  })}
                  <DropdownMenuItem className="focus:bg-black/15 focus:text-white" onClick={onLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <main className="pb-20">{renderScreen()}</main>
        </div>
      </div>
    </div>
  );
}
