import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Loader2, Bell, Megaphone, Wallet, FileCheck, GraduationCap, Users } from 'lucide-react';
import { apiCall } from '../../api';

type OfficeRole =
  | 'administrator'
  | 'general_secretary'
  | 'finance'
  | 'president'
  | 'publicity'
  | 'secretary_academics';

interface OfficeOverviewProps {
  role: OfficeRole;
  onNavigate: (screen: string) => void;
}

const roleCopy: Record<OfficeRole, { title: string; subtitle: string; icon: any }> = {
  administrator: {
    title: 'Administrator dashboard',
    subtitle: 'First review of student fund requests and daily office operations.',
    icon: Wallet,
  },
  general_secretary: {
    title: 'General secretary dashboard',
    subtitle: 'Oversight queue for administrator-approved requests.',
    icon: FileCheck,
  },
  finance: {
    title: 'Finance dashboard',
    subtitle: 'Review financial readiness and complete final disbursements.',
    icon: Wallet,
  },
  president: {
    title: 'President dashboard',
    subtitle: 'Executive approval and high-level oversight only.',
    icon: Bell,
  },
  publicity: {
    title: 'Publicity dashboard',
    subtitle: 'Manage news, events, announcements, and public communication.',
    icon: Megaphone,
  },
  secretary_academics: {
    title: 'Secretary academics dashboard',
    subtitle: 'Academic verification, transcript program, and mentorship screening.',
    icon: GraduationCap,
  },
};

const quickActionByRole: Record<OfficeRole, Array<{ id: string; label: string }>> = {
  administrator: [
    { id: 'fund-queue', label: 'Open first review queue' },
    { id: 'reports', label: 'View office reports' },
  ],
  general_secretary: [
    { id: 'fund-queue', label: 'Open oversight queue' },
    { id: 'reports', label: 'View review analytics' },
  ],
  finance: [
    { id: 'finance-review', label: 'Open finance review queue' },
    { id: 'finance-disbursement', label: 'Open disbursement queue' },
  ],
  president: [
    { id: 'fund-queue', label: 'Open executive queue' },
    { id: 'reports', label: 'View high-level analytics' },
  ],
  publicity: [
    { id: 'content', label: 'Manage news and events' },
    { id: 'broadcast', label: 'Open broadcast center' },
  ],
  secretary_academics: [
    { id: 'academic', label: 'Review academic documents' },
    { id: 'transcript', label: 'Manage transcript program' },
    { id: 'mentorship', label: 'Review mentorship applications' },
  ],
};

export function OfficeOverview({ role, onNavigate }: OfficeOverviewProps) {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<Record<string, number>>({});

  useEffect(() => {
    let cancelled = false;

    async function loadSummary() {
      try {
        setLoading(true);
        const response = await apiCall('/office/dashboard-summary', 'GET');
        if (!cancelled) {
          setSummary(response?.summary || {});
        }
      } catch (error) {
        console.error('Failed to load office dashboard summary:', error);
        if (!cancelled) {
          setSummary({});
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadSummary();
    return () => {
      cancelled = true;
    };
  }, [role]);

  const roleMeta = roleCopy[role];
  const RoleIcon = roleMeta.icon;

  const cards = useMemo(() => {
    if (role === 'publicity') {
      return [
        { label: 'Communication Items', value: summary.communication_items || 0 },
        { label: 'Unread Notifications', value: summary.unread_notifications || 0 },
      ];
    }

    if (role === 'secretary_academics') {
      return [
        { label: 'Academic Reviews', value: summary.academic_verification_count || 0 },
        { label: 'Transcript Cases', value: summary.transcript_count || 0 },
        { label: 'Mentorship Applications', value: summary.mentorship_count || 0 },
      ];
    }

    return [
      { label: 'Fund Queue', value: summary.fund_queue_count || 0 },
      { label: 'Total Fund Applications', value: summary.total_fund_applications || 0 },
      { label: 'Unread Notifications', value: summary.unread_notifications || 0 },
    ];
  }, [role, summary]);

  return (
    <div className="space-y-6 p-4 lg:p-8">
      <Card className="border-border/60 bg-card/95 shadow-sm">
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent)]/15 text-[var(--accent)]">
                  <RoleIcon className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle>{roleMeta.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">{roleMeta.subtitle}</p>
                </div>
              </div>
            </div>
            <Badge variant="outline" className="capitalize">
              {role.replace(/_/g, ' ')}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {loading ? (
        <div className="flex min-h-[180px] items-center justify-center rounded-2xl border border-border/60 bg-card">
          <Loader2 className="mr-3 h-5 w-5 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Loading dashboard summary...</span>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => (
            <Card key={card.label} className="border-border/60 bg-card/95">
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">{card.label}</p>
                <p className="mt-3 text-3xl font-semibold">{card.value.toLocaleString()}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="border-border/60 bg-card/95">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {quickActionByRole[role].map((action) => (
            <Button key={action.id} variant="outline" className="justify-start" onClick={() => onNavigate(action.id)}>
              {action.label}
            </Button>
          ))}
        </CardContent>
      </Card>

      {role === 'secretary_academics' && (
        <Card className="border-border/60 bg-card/95">
          <CardContent className="flex items-start gap-4 p-5">
            <Users className="mt-1 h-5 w-5 text-[var(--accent)]" />
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                Mentorship applications now pass through secretary academics screening first.
              </p>
              <p>
                Approved mentorship applications are then released to the selected mentor for final engagement.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
