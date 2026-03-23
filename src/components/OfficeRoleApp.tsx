import { useMemo, useState } from 'react';
import { BarChart3, Bell, BookOpenCheck, FileCheck2, GraduationCap, Home, LogOut, Megaphone, Menu, NotebookPen, Send, Wallet } from 'lucide-react';
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
import BroadcastEmail from './alumni_office_staff/BroadcastEmail';
import ManageContent from './alumni_office_staff/ManageContent';
import Reports from './alumni_office_staff/Reports';

type OfficeRole =
  | 'administrator'
  | 'general_secretary'
  | 'finance'
  | 'president'
  | 'publicity'
  | 'secretary_academics';

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
  | 'mentorship';

interface OfficeRoleAppProps {
  user: User;
  onLogout: () => void;
}

const roleLabels: Record<OfficeRole, string> = {
  administrator: 'Administrator',
  general_secretary: 'General Secretary',
  finance: 'Finance',
  president: 'President',
  publicity: 'Publicity',
  secretary_academics: 'Secretary Academics',
};

function normalizeRole(role: User['role']): OfficeRole {
  if (role === 'alumni_office') return 'administrator';
  return role as OfficeRole;
}

function getNavigation(role: OfficeRole) {
  switch (role) {
    case 'administrator':
      return [
        { id: 'dashboard', label: 'Dashboard', icon: Home },
        { id: 'fund-queue', label: 'First Review', icon: FileCheck2 },
        { id: 'reports', label: 'Reports', icon: BarChart3 },
      ] as const;
    case 'general_secretary':
      return [
        { id: 'dashboard', label: 'Dashboard', icon: Home },
        { id: 'fund-queue', label: 'Oversight Queue', icon: NotebookPen },
        { id: 'reports', label: 'Reports', icon: BarChart3 },
      ] as const;
    case 'finance':
      return [
        { id: 'dashboard', label: 'Dashboard', icon: Home },
        { id: 'finance-review', label: 'Finance Review', icon: Wallet },
        { id: 'finance-disbursement', label: 'Disbursement', icon: Send },
        { id: 'reports', label: 'Reports', icon: BarChart3 },
      ] as const;
    case 'president':
      return [
        { id: 'dashboard', label: 'Dashboard', icon: Home },
        { id: 'fund-queue', label: 'Executive Queue', icon: Bell },
        { id: 'reports', label: 'Reports', icon: BarChart3 },
      ] as const;
    case 'publicity':
      return [
        { id: 'dashboard', label: 'Dashboard', icon: Home },
        { id: 'content', label: 'Manage Content', icon: Megaphone },
        { id: 'broadcast', label: 'Broadcast', icon: Send },
      ] as const;
    case 'secretary_academics':
      return [
        { id: 'dashboard', label: 'Dashboard', icon: Home },
        { id: 'academic', label: 'Academic Review', icon: BookOpenCheck },
        { id: 'transcript', label: 'Transcript Program', icon: GraduationCap },
        { id: 'mentorship', label: 'Mentorship', icon: NotebookPen },
      ] as const;
  }
}

export function OfficeRoleApp({ user, onLogout }: OfficeRoleAppProps) {
  const [currentScreen, setCurrentScreen] = useState<OfficeScreen>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const role = normalizeRole(user.role);
  const navigationItems = useMemo(() => getNavigation(role), [role]);

  const renderScreen = () => {
    switch (currentScreen) {
      case 'dashboard':
        return <OfficeOverview role={role} onNavigate={(screen) => setCurrentScreen(screen as OfficeScreen)} />;
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
      default:
        return <OfficeOverview role={role} onNavigate={(screen) => setCurrentScreen(screen as OfficeScreen)} />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 w-full border-b border-border/70 bg-card/95 backdrop-blur">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <UcuBadgeLogo className="h-10 w-10" />
            <div>
              <h1 className="text-sm font-semibold">Alumni Circle Internal Office</h1>
              <p className="text-xs text-muted-foreground">
                {roleLabels[role]} · {user.name || user.full_name || user.email || 'Staff'}
              </p>
            </div>
          </div>

          <div className="lg:hidden">
            <DropdownMenu open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <DropdownMenuItem
                      key={item.id}
                      onClick={() => {
                        setCurrentScreen(item.id as OfficeScreen);
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

          <div className="hidden lg:flex items-center gap-2">
            <Button variant="ghost" onClick={onLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        <div className="hidden border-t border-border/60 lg:block">
          <nav className="px-4 py-2">
            <div className="flex flex-wrap gap-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentScreen === item.id;
                return (
                  <Button
                    key={item.id}
                    variant={isActive ? 'default' : 'ghost'}
                    size="sm"
                    className="rounded-full"
                    onClick={() => setCurrentScreen(item.id as OfficeScreen)}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {item.label}
                  </Button>
                );
              })}
            </div>
          </nav>
        </div>
      </header>

      <main>{renderScreen()}</main>
    </div>
  );
}
