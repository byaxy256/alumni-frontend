import { useMemo, useState } from 'react';
import {
  BarChart3,
  Bell,
  BookOpenCheck,
  FileCheck2,
  FileText,
  FolderOpen,
  GraduationCap,
  Home,
  LogOut,
  Mail,
  Megaphone,
  Menu,
  NotebookPen,
  Send,
  Settings2Icon,
  ShoppingBag,
  Upload,
  Wallet,
} from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { UcuBadgeLogo } from './UcuBadgeLogo';
import type { User } from '../App';
import { AlumniOfficeApp } from './AlumniOfficeApp';
import { OfficeOverview } from './office/OfficeOverview';
import { FundWorkflowQueue } from './office/FundWorkflowQueue';
import { SecretaryAcademicsPanel } from './office/SecretaryAcademicsPanel';
import ApplicationsQueue from './alumni_office_staff/ApplicationsQueue';
import ImportAssistant from './alumni_office_staff/ImportAssistant';
import BroadcastEmail from './alumni_office_staff/BroadcastEmail';
import ProjectManagement from './alumni_office_staff/ProjectManagement';
import MerchEvents from './alumni_office_staff/MerchEvents';
import ManageContent from './alumni_office_staff/ManageContent';
import Reports from './alumni_office_staff/Reports';

type OfficeRole =
  | 'administrator'
  | 'general_secretary'
  | 'finance'
  | 'president'
  | 'vice_president'
  | 'publicity'
  | 'secretary_academics'
  | 'projects_manager';

type OfficeScreen =
  | 'dashboard'
  | 'fund-queue'
  | 'finance-review'
  | 'finance-disbursement'
  | 'reports'
  | 'content'
  | 'broadcast'
  | 'academic'
  | 'transcript'
  | 'mentorship'
  | 'applications'
  | 'import'
  | 'projects'
  | 'merch';

interface OfficeRoleAppProps {
  user: User;
  onLogout: () => void;
}

interface OfficeNavItem {
  id: OfficeScreen;
  label: string;
  shortLabel: string;
  icon: any;
  description: string;
}

const roleLabels: Record<OfficeRole, string> = {
  administrator: 'Administrator Dashboard',
  general_secretary: 'General Secretary Dashboard',
  finance: 'Finance Dashboard',
  president: 'President Dashboard',
  vice_president: 'Vice President Dashboard',
  publicity: 'Publicity Dashboard',
  secretary_academics: 'Secretary Academics Dashboard',
  projects_manager: 'Projects Manager Dashboard',
};

function normalizeRole(role: User['role']): OfficeRole {
  if (role === 'alumni_office') return 'administrator';
  if (!['administrator', 'general_secretary', 'finance', 'president', 'vice_president', 'publicity', 'secretary_academics', 'projects_manager'].includes(role as string)) {
    return 'administrator';
  }
  return role as OfficeRole;
}

function getNavigation(role: OfficeRole): OfficeNavItem[] {
  switch (role) {
    case 'administrator':
      return [
        { id: 'dashboard', label: 'Dashboard', shortLabel: 'Home', icon: Home, description: 'See the full operational overview for the office.' },
        { id: 'fund-queue', label: 'First Review', shortLabel: 'Review', icon: FileCheck2, description: 'Review newly submitted student fund requests first.' },
        { id: 'applications', label: 'Applications', shortLabel: 'Apps', icon: FileText, description: 'Work through loan and support applications from the office queue.' },
        { id: 'import', label: 'Import Data', shortLabel: 'Import', icon: Upload, description: 'Bring in student, alumni, and office records safely.' },
        { id: 'broadcast', label: 'Broadcast', shortLabel: 'Send', icon: Mail, description: 'Send office-wide communication and campaign updates.' },
        { id: 'projects', label: 'Projects', shortLabel: 'Projects', icon: FolderOpen, description: 'Track daily office initiatives and delivery progress.' },
        { id: 'merch', label: 'Merch & Events', shortLabel: 'Events', icon: ShoppingBag, description: 'Manage event operations and office merchandise.' },
        { id: 'content', label: 'Manage Content', shortLabel: 'Content', icon: Settings2Icon, description: 'Publish and update communication content when needed.' },
        { id: 'reports', label: 'Reports', shortLabel: 'Reports', icon: BarChart3, description: 'See analytics, fund performance, and office activity.' },
      ];
    case 'general_secretary':
      return [
        { id: 'dashboard', label: 'Dashboard', shortLabel: 'Home', icon: Home, description: 'See the oversight summary for reviewed fund requests.' },
        { id: 'fund-queue', label: 'Oversight Queue', shortLabel: 'Queue', icon: NotebookPen, description: 'Review requests already approved by the administrator.' },
        { id: 'reports', label: 'Reports', shortLabel: 'Reports', icon: BarChart3, description: 'View oversight analytics and workflow trends.' },
      ];
    case 'finance':
      return [
        { id: 'dashboard', label: 'Dashboard', shortLabel: 'Home', icon: Home, description: 'Monitor finance readiness and outgoing disbursements.' },
        { id: 'finance-review', label: 'Finance Review', shortLabel: 'Review', icon: Wallet, description: 'Check financial readiness before requests go to the president.' },
        { id: 'finance-disbursement', label: 'Disbursement', shortLabel: 'Pay', icon: Send, description: 'Record releases after presidential approval.' },
        { id: 'reports', label: 'Reports', shortLabel: 'Reports', icon: BarChart3, description: 'Track fund balance, income, and disbursement activity.' },
      ];
    case 'president':
      return [
        { id: 'dashboard', label: 'Dashboard', shortLabel: 'Home', icon: Home, description: 'Executive view of requests awaiting presidential action.' },
        { id: 'fund-queue', label: 'Executive Queue', shortLabel: 'Queue', icon: Bell, description: 'Approve or reject finance-cleared requests for release.' },
        { id: 'reports', label: 'Reports', shortLabel: 'Reports', icon: BarChart3, description: 'Review high-level office and fund analytics.' },
      ];
    case 'vice_president':
      return [
        { id: 'dashboard', label: 'Dashboard', shortLabel: 'Home', icon: Home, description: 'Vice executive view of requests awaiting approval.' },
        { id: 'fund-queue', label: 'Executive Queue', shortLabel: 'Queue', icon: Bell, description: 'Approve or reject finance-cleared requests for release.' },
        { id: 'reports', label: 'Reports', shortLabel: 'Reports', icon: BarChart3, description: 'Review high-level office and fund analytics.' },
      ];
    case 'publicity':
      return [
        { id: 'dashboard', label: 'Dashboard', shortLabel: 'Home', icon: Home, description: 'Track communication work, news volume, and event visibility.' },
        { id: 'content', label: 'Manage Content', shortLabel: 'Content', icon: Megaphone, description: 'Create and publish news, announcements, and public updates.' },
        { id: 'merch', label: 'Events', shortLabel: 'Events', icon: ShoppingBag, description: 'Manage event listings, registrations, and public-facing event content.' },
        { id: 'broadcast', label: 'Broadcast', shortLabel: 'Send', icon: Mail, description: 'Send broadcast messages and campaign communication.' },
        { id: 'reports', label: 'Reports', shortLabel: 'Reports', icon: BarChart3, description: 'See communication performance and engagement analytics.' },
      ];
    case 'secretary_academics':
      return [
        { id: 'dashboard', label: 'Dashboard', shortLabel: 'Home', icon: Home, description: 'Watch academic verification, transcript, and mentorship workload.' },
        { id: 'academic', label: 'Academic Review', shortLabel: 'Review', icon: BookOpenCheck, description: 'Verify academic documents for student benefit applications.' },
        { id: 'transcript', label: 'Transcript Program', shortLabel: 'Transcript', icon: GraduationCap, description: 'Manage transcript holder records and decisions.' },
        { id: 'mentorship', label: 'Mentorship', shortLabel: 'Mentor', icon: NotebookPen, description: 'Approve or reject mentorship applications and notes.' },
        { id: 'reports', label: 'Reports', shortLabel: 'Reports', icon: BarChart3, description: 'See academic workflow trends and pending cases.' },
      ];
    case 'projects_manager':
      return [
        { id: 'dashboard', label: 'Dashboard', shortLabel: 'Home', icon: Home, description: 'Track office projects, milestones, and progress.' },
        { id: 'projects', label: 'Projects', shortLabel: 'Projects', icon: FolderOpen, description: 'Manage ongoing projects and track deliverables.' },
        { id: 'reports', label: 'Reports', shortLabel: 'Reports', icon: BarChart3, description: 'View project analytics and completion metrics.' },
      ];
  }
}

export function OfficeRoleApp({ user, onLogout }: OfficeRoleAppProps) {
  const [currentScreen, setCurrentScreen] = useState<OfficeScreen>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const role = normalizeRole(user.role);
  const navigationItems = useMemo(() => getNavigation(role), [role]);
  const roleLabel = roleLabels[role];
  const displayName = user.name || user.full_name || user.email || 'Staff';

  const renderScreen = () => {
    switch (currentScreen) {
      case 'dashboard':
        return (
          <OfficeOverview
            role={role}
            navigationItems={navigationItems}
            onNavigate={(screen) => setCurrentScreen(screen as OfficeScreen)}
          />
        );
      case 'fund-queue':
        return <FundWorkflowQueue role={role} />;
      case 'finance-review':
        return <FundWorkflowQueue role={role} mode="review" />;
      case 'finance-disbursement':
        return <FundWorkflowQueue role={role} mode="disbursement" />;
      case 'reports':
        return <Reports />;
      case 'content':
        return <ManageContent />;
      case 'broadcast':
        return <BroadcastEmail />;
      case 'academic':
        return <SecretaryAcademicsPanel defaultTab="academic" />;
      case 'transcript':
        return <SecretaryAcademicsPanel defaultTab="transcript" />;
      case 'mentorship':
        return <SecretaryAcademicsPanel defaultTab="mentorship" />;
      case 'applications':
        return <ApplicationsQueue />;
      case 'import':
        return <ImportAssistant />;
      case 'projects':
        return <ProjectManagement />;
      case 'merch':
        return <MerchEvents />;
      default:
        return (
          <OfficeOverview
            role={role}
            navigationItems={navigationItems}
            onNavigate={(screen) => setCurrentScreen(screen as OfficeScreen)}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[var(--brand-blue-soft-10)] text-foreground">
      <aside
        className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col border-r border-black/20 text-white"
        style={{ backgroundColor: '#8A1F3A' }}
      >
        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex items-center justify-between h-16 flex-shrink-0 px-6 border-b border-black/20">
            <div className="flex items-center gap-3">
              <UcuBadgeLogo className="h-9 w-9" />
              <h1 className="text-white font-semibold text-sm">{roleLabel}</h1>
            </div>
          </div>

          <div className="px-6 py-4 border-b border-black/20">
            <p className="text-sm text-white font-medium">Welcome back, {displayName.split(' ')[0]}!</p>
            <p className="text-xs text-white/70 mt-1">Role: {roleLabel.replace(' Dashboard', '')}</p>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentScreen === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentScreen(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${
                    isActive
                      ? 'bg-[#0b2a4a] text-white shadow-sm font-medium'
                      : 'text-white/90 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-sm">{item.label}</div>
                    <div className="text-[11px] text-white/70 truncate">{item.description}</div>
                  </div>
                </button>
              );
            })}
          </nav>

          <div className="flex-shrink-0 p-4 border-t border-black/20">
            <Button onClick={onLogout} variant="ghost" className="w-full justify-start text-white hover:bg-white/10">
              <LogOut className="w-5 h-5 mr-3" />
              <span className="text-sm">Logout</span>
            </Button>
          </div>
        </div>
      </aside>

      <div className="lg:hidden fixed top-0 left-0 right-0 border-b border-black/10 z-40 shadow-sm" style={{ backgroundColor: '#8A1F3A' }}>
        <div className="flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-3">
            <UcuBadgeLogo className="h-8 w-8" />
            <h1 className="text-white font-semibold text-sm">{roleLabel}</h1>
          </div>
          <DropdownMenu open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="bg-black/20 text-white hover:bg-black/30">
                <Menu className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 border-black/30 text-white" style={{ backgroundColor: '#8A1F3A' }}>
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <DropdownMenuItem
                    key={item.id}
                    className="focus:bg-black/15 focus:text-white"
                    onClick={() => {
                      setCurrentScreen(item.id);
                      setMobileMenuOpen(false);
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
      </div>

      <main className="lg:pl-72 pt-16 lg:pt-0 min-h-screen">
        {renderScreen()}
      </main>

      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 border-t border-black/30 px-2 py-2 z-50 text-white"
        style={{ backgroundColor: '#8A1F3A' }}
      >
        <div className="flex justify-around items-center max-w-lg mx-auto">
          {navigationItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const isActive = currentScreen === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentScreen(item.id)}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-full transition ${
                  isActive ? 'bg-[#0b2a4a] text-white shadow-sm' : 'text-white/85'
                }`}
              >
                <Icon size={18} />
                <span className="text-[10px]">{item.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
