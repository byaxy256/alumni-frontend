import { useMemo, useState } from 'react';
import {
  BarChart3,
  Bell,
  BookOpenCheck,
  BriefcaseBusiness,
  FileCheck2,
  FileText,
  FolderOpen,
  GraduationCap,
  Home,
  LogOut,
  Mail,
  Megaphone,
  Menu,
  Newspaper,
  Receipt,
  Send,
  Settings2Icon,
  ShoppingBag,
  Upload,
  UserCheck,
  Users,
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
import { OfficeOverview } from './office/OfficeOverview';
import { FundWorkflowQueue } from './office/FundWorkflowQueue';
import { SecretaryAcademicsPanel } from './office/SecretaryAcademicsPanel';
import { FinanceDashboard } from './office/FinanceDashboard';
import { PresidentDashboard } from './office/PresidentDashboard';
import { PublicityDashboard } from './office/PublicityDashboard';
import { SecretaryAcademicsDashboard } from './office/SecretaryAcademicsDashboard';
import { VicePresidentDashboard } from './office/VicePresidentDashboard';
import { ProjectsManagerDashboard } from './office/ProjectsManagerDashboard';
import AlumniDashboard from './alumni_office_staff/AlumniDashboard';
import ApplicationsQueue from './alumni_office_staff/ApplicationsQueue';
import ImportAssistant from './alumni_office_staff/ImportAssistant';
import BroadcastEmail from './alumni_office_staff/BroadcastEmail';
import ProjectManagement from './alumni_office_staff/ProjectManagement';
import MerchEvents from './alumni_office_staff/MerchEvents';
import ManageContent from './alumni_office_staff/ManageContent';
import Reports from './alumni_office_staff/Reports';
import { UnifiedNotifications } from './shared/UnifiedNotifications';

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
  | 'applications'
  | 'request-funds'
  | 'approvals'
  | 'reports'
  | 'notifications'
  | 'import'
  | 'broadcast'
  | 'projects'
  | 'content'
  | 'news'
  | 'events'
  | 'announcements'
  | 'communications'
  | 'academic-verification'
  | 'student-benefit-reviews'
  | 'transcript'
  | 'mentorship'
  | 'finance-review'
  | 'disbursements'
  | 'transactions'
  | 'beneficiaries'
  | 'fund-requests'
  | 'executive-review'
  | 'milestones'
  | 'updates';

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

function normalizeRole(role: User['role']): OfficeRole | null {
  if (role === 'alumni_office') return 'administrator';
  if (
    ![
      'administrator',
      'general_secretary',
      'finance',
      'president',
      'vice_president',
      'publicity',
      'secretary_academics',
      'projects_manager',
    ].includes(role as string)
  ) {
    return null;
  }
  return role as OfficeRole;
}

function getNavigation(role: OfficeRole): OfficeNavItem[] {
  switch (role) {
    case 'administrator':
      return [
        { id: 'dashboard', label: 'Dashboard', shortLabel: 'Home', icon: Home, description: 'Operational overview and KPIs.' },
        { id: 'applications', label: 'Applications', shortLabel: 'Apps', icon: FileText, description: 'Process loan and support applications.' },
        { id: 'request-funds', label: 'Request Funds', shortLabel: 'Funds', icon: Wallet, description: 'Manage first-stage workflow requests.' },
        { id: 'import', label: 'Import Data', shortLabel: 'Import', icon: Upload, description: 'Import student, alumni, and office records.' },
        { id: 'broadcast', label: 'Broadcast', shortLabel: 'Comms', icon: Mail, description: 'Send communication campaigns and notices.' },
        { id: 'projects', label: 'Projects', shortLabel: 'Projects', icon: FolderOpen, description: 'Track project progress and outcomes.' },
        { id: 'content', label: 'Manage Content', shortLabel: 'Content', icon: Settings2Icon, description: 'Manage announcements and media content.' },
        { id: 'reports', label: 'Reports', shortLabel: 'Reports', icon: BarChart3, description: 'View fund and workflow analytics.' },
        { id: 'notifications', label: 'Notifications', shortLabel: 'Alerts', icon: Bell, description: 'Review internal office alerts and updates.' },
      ];
    case 'general_secretary':
      return [
        { id: 'dashboard', label: 'Dashboard', shortLabel: 'Home', icon: Home, description: 'Operational review KPIs and queue value.' },
        { id: 'applications', label: 'Applications', shortLabel: 'Apps', icon: FileText, description: 'Inspect application details and context.' },
        { id: 'request-funds', label: 'Request Funds', shortLabel: 'Funds', icon: Wallet, description: 'Open fund requests awaiting secretary action.' },
        { id: 'approvals', label: 'Approvals', shortLabel: 'Approve', icon: FileCheck2, description: 'Approve or reject reviewed cases.' },
        { id: 'reports', label: 'Reports', shortLabel: 'Reports', icon: BarChart3, description: 'Track throughput, approvals, and value trends.' },
        { id: 'notifications', label: 'Notifications', shortLabel: 'Alerts', icon: Bell, description: 'See new workflow comments and decisions.' },
      ];
    case 'finance':
      return [
        { id: 'dashboard', label: 'Dashboard', shortLabel: 'Home', icon: Home, description: 'Finance KPIs and operational pipeline.' },
        { id: 'finance-review', label: 'Finance Review', shortLabel: 'Review', icon: Wallet, description: 'Validate financial viability of requests.' },
        { id: 'disbursements', label: 'Disbursements', shortLabel: 'Disburse', icon: Send, description: 'Process approved fund releases.' },
        { id: 'transactions', label: 'Transactions', shortLabel: 'Txns', icon: Receipt, description: 'Track transaction records and references.' },
        { id: 'beneficiaries', label: 'Beneficiaries', shortLabel: 'Beneficiaries', icon: Users, description: 'Monitor funded beneficiaries and payout status.' },
        { id: 'reports', label: 'Reports', shortLabel: 'Reports', icon: BarChart3, description: 'View finance trends and disbursement metrics.' },
        { id: 'notifications', label: 'Notifications', shortLabel: 'Alerts', icon: Bell, description: 'Receive review and disbursement alerts.' },
      ];
    case 'president':
    case 'vice_president':
      return [
        { id: 'dashboard', label: 'Dashboard', shortLabel: 'Home', icon: Home, description: 'Executive KPI overview and queue value.' },
        { id: 'applications', label: 'Applications', shortLabel: 'Apps', icon: FileText, description: 'Inspect case details before decisions.' },
        { id: 'fund-requests', label: 'Fund Requests', shortLabel: 'Funds', icon: Wallet, description: 'Review incoming executive-stage requests.' },
        { id: 'executive-review', label: 'Executive Review', shortLabel: 'Review', icon: UserCheck, description: 'Approve or reject release recommendations.' },
        { id: 'reports', label: 'Reports', shortLabel: 'Reports', icon: BarChart3, description: 'Track executive decisions and outcomes.' },
        { id: 'notifications', label: 'Notifications', shortLabel: 'Alerts', icon: Bell, description: 'Monitor decision updates and escalations.' },
      ];
    case 'publicity':
      return [
        { id: 'dashboard', label: 'Dashboard', shortLabel: 'Home', icon: Home, description: 'PR performance and publishing metrics.' },
        { id: 'news', label: 'News', shortLabel: 'News', icon: Newspaper, description: 'Manage and publish news posts.' },
        { id: 'events', label: 'Events', shortLabel: 'Events', icon: ShoppingBag, description: 'Manage event content and schedules.' },
        { id: 'announcements', label: 'Announcements', shortLabel: 'Announce', icon: Megaphone, description: 'Publish official announcements.' },
        { id: 'communications', label: 'Communications', shortLabel: 'Comms', icon: Mail, description: 'Run email and outreach communications.' },
        { id: 'reports', label: 'Reports', shortLabel: 'Reports', icon: BarChart3, description: 'Track audience engagement and output.' },
        { id: 'notifications', label: 'Notifications', shortLabel: 'Alerts', icon: Bell, description: 'PR alerts and publication reminders.' },
      ];
    case 'secretary_academics':
      return [
        { id: 'dashboard', label: 'Dashboard', shortLabel: 'Home', icon: Home, description: 'Academic operations summary and queues.' },
        { id: 'academic-verification', label: 'Academic Verification', shortLabel: 'Verify', icon: BookOpenCheck, description: 'Verify documents for benefit eligibility.' },
        { id: 'student-benefit-reviews', label: 'Student Benefit Reviews', shortLabel: 'Benefits', icon: FileCheck2, description: 'Review benefit-related academic cases.' },
        { id: 'transcript', label: 'Transcript Program', shortLabel: 'Transcript', icon: GraduationCap, description: 'Manage transcript holder records and decisions.' },
        { id: 'mentorship', label: 'Mentorship', shortLabel: 'Mentor', icon: Users, description: 'Review mentorship applications and progress.' },
        { id: 'reports', label: 'Reports', shortLabel: 'Reports', icon: BarChart3, description: 'See verification and mentorship trends.' },
        { id: 'notifications', label: 'Notifications', shortLabel: 'Alerts', icon: Bell, description: 'Academic queue alerts and updates.' },
      ];
    case 'projects_manager':
      return [
        { id: 'dashboard', label: 'Dashboard', shortLabel: 'Home', icon: Home, description: 'Project health, status, and budget metrics.' },
        { id: 'projects', label: 'Projects', shortLabel: 'Projects', icon: FolderOpen, description: 'Manage ongoing projects and track deliverables.' },
        { id: 'milestones', label: 'Milestones', shortLabel: 'Milestones', icon: BriefcaseBusiness, description: 'Track milestone completion and blockers.' },
        { id: 'updates', label: 'Updates', shortLabel: 'Updates', icon: Send, description: 'Publish project status and outcomes.' },
        { id: 'reports', label: 'Reports', shortLabel: 'Reports', icon: BarChart3, description: 'Review project performance analytics.' },
        { id: 'notifications', label: 'Notifications', shortLabel: 'Alerts', icon: Bell, description: 'Receive project and milestone alerts.' },
      ];
  }
}

export function OfficeRoleApp({ user, onLogout }: OfficeRoleAppProps) {
  const [currentScreen, setCurrentScreen] = useState<OfficeScreen>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const role = normalizeRole(user.role);
  if (!role) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--brand-blue-soft-10)] px-6">
        <div className="max-w-md w-full rounded-2xl border border-border bg-card p-6 text-center space-y-3">
          <h1 className="text-lg font-semibold text-foreground">Role not configured</h1>
          <p className="text-sm text-muted-foreground">
            Your account role <span className="font-medium">"{String(user.role)}"</span> is not mapped to an internal office dashboard yet.
          </p>
          <Button onClick={onLogout} className="w-full">Logout</Button>
        </div>
      </div>
    );
  }
  const navigationItems = useMemo(() => getNavigation(role), [role]);
  const roleLabel = roleLabels[role];
  const displayName = user.name || user.full_name || user.email || 'Staff';

  const renderScreen = () => {
    switch (currentScreen) {
      case 'dashboard':
        // Render role-specific dashboards
        if (role === 'administrator') {
          return <AlumniDashboard user={user} onNavigate={(screen) => setCurrentScreen(screen as OfficeScreen)} />;
        } else if (role === 'finance') {
          return <FinanceDashboard />;
        } else if (role === 'president' || role === 'vice_president') {
          return role === 'vice_president' ? <VicePresidentDashboard /> : <PresidentDashboard />;
        } else if (role === 'general_secretary') {
          return <AlumniDashboard user={user} onNavigate={(screen) => setCurrentScreen(screen as OfficeScreen)} />;
        } else if (role === 'publicity') {
          return <PublicityDashboard />;
        } else if (role === 'secretary_academics') {
          return <SecretaryAcademicsDashboard />;
        } else if (role === 'projects_manager') {
          return <ProjectsManagerDashboard />;
        } else {
          // Default to AlumniDashboard for other roles
          return <AlumniDashboard user={user} onNavigate={(screen) => setCurrentScreen(screen as OfficeScreen)} />;
        }
      case 'request-funds':
      case 'approvals':
      case 'fund-requests':
      case 'executive-review':
        return <FundWorkflowQueue role={role} />;
      case 'finance-review':
        return <FundWorkflowQueue role={role} mode="review" />;
      case 'disbursements':
        return <FundWorkflowQueue role={role} mode="disbursement" />;
      case 'transactions':
      case 'beneficiaries':
        return <Reports />;
      case 'reports':
        return <Reports />;
      case 'news':
      case 'announcements':
      case 'content':
        return <ManageContent />;
      case 'communications':
      case 'broadcast':
        return <BroadcastEmail />;
      case 'events':
        return <MerchEvents />;
      case 'academic-verification':
        return <SecretaryAcademicsPanel defaultTab="academic" />;
      case 'transcript':
        return <SecretaryAcademicsPanel defaultTab="transcript" />;
      case 'mentorship':
        return <SecretaryAcademicsPanel defaultTab="mentorship" />;
      case 'applications':
      case 'student-benefit-reviews':
        return <ApplicationsQueue />;
      case 'import':
        return <ImportAssistant />;
      case 'projects':
      case 'milestones':
      case 'updates':
        return <ProjectManagement />;
      case 'notifications':
        return <UnifiedNotifications user={user} onBack={() => setCurrentScreen('dashboard')} />;
      default:
        return (
          <OfficeOverview
            role={role}
            displayName={displayName}
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
