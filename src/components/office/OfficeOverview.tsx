import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Bell,
  BookOpenCheck,
  FileCheck,
  GraduationCap,
  Loader2,
  Megaphone,
  Users,
  Wallet,
} from 'lucide-react';
import { apiCall } from '../../api';

type OfficeRole =
  | 'administrator'
  | 'general_secretary'
  | 'finance'
  | 'president'
  | 'publicity'
  | 'secretary_academics';

interface OfficeNavItem {
  id: string;
  label: string;
  shortLabel: string;
  icon: any;
  description: string;
}

interface OfficeOverviewProps {
  role: OfficeRole;
  navigationItems: OfficeNavItem[];
  onNavigate: (screen: string) => void;
}

const roleCopy: Record<
  OfficeRole,
  {
    title: string;
    subtitle: string;
    icon: any;
    responsibilities: string[];
  }
> = {
  administrator: {
    title: 'Administrator Dashboard',
    subtitle: 'Daily office operations, first review queue, and the full alumni office toolset.',
    icon: Wallet,
    responsibilities: [
      'Handle the first review of student fund requests.',
      'Run day-to-day office operations and application follow-up.',
      'Access the full alumni office operations modules from one dashboard.',
    ],
  },
  general_secretary: {
    title: 'General Secretary Dashboard',
    subtitle: 'Oversight review, comments, and second-stage accountability in the fund workflow.',
    icon: FileCheck,
    responsibilities: [
      'Review only administrator-approved requests.',
      'Add comments and oversight guidance before finance review.',
      'Track queue health and request movement across the office.',
    ],
  },
  finance: {
    title: 'Finance Dashboard',
    subtitle: 'Handle financial readiness review and final disbursement recording in separate queues.',
    icon: Wallet,
    responsibilities: [
      'Check whether funds are available before executive approval.',
      'Record disbursement details after presidential approval.',
      'Watch fund totals, disbursement activity, and finance reporting.',
    ],
  },
  president: {
    title: 'President Dashboard',
    subtitle: 'Executive oversight of finance-cleared requests without editing operational content.',
    icon: Bell,
    responsibilities: [
      'Review only requests that finance has already cleared.',
      'Approve or reject release decisions with executive comments.',
      'Track high-level office and fund status from a single view.',
    ],
  },
  publicity: {
    title: 'Publicity Dashboard',
    subtitle: 'Manage communication, announcements, events, and public-facing alumni messaging.',
    icon: Megaphone,
    responsibilities: [
      'Create and publish news, announcements, and public updates.',
      'Manage event visibility and public communication workflows.',
      'Run broadcasts and watch communication activity from one dashboard.',
    ],
  },
  secretary_academics: {
    title: 'Secretary Academics Dashboard',
    subtitle: 'Academic verification, transcript handling, and mentorship application review.',
    icon: GraduationCap,
    responsibilities: [
      'Verify academic documents for student benefit applications.',
      'Handle the transcript holder program and track statuses.',
      'Review mentorship applications before they move forward.',
    ],
  },
};

export function OfficeOverview({ role, navigationItems, onNavigate }: OfficeOverviewProps) {
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
  const tools = navigationItems.filter((item) => item.id !== 'dashboard');

  const cards = useMemo(() => {
    if (role === 'publicity') {
      return [
        { label: 'News & Events', value: summary.communication_items || 0, helper: 'published communication items' },
        { label: 'Unread Notifications', value: summary.unread_notifications || 0, helper: 'messages needing attention' },
        { label: 'Active Tools', value: tools.length, helper: 'communication modules available' },
      ];
    }

    if (role === 'secretary_academics') {
      return [
        { label: 'Academic Reviews', value: summary.academic_verification_count || 0, helper: 'benefit applications awaiting verification' },
        { label: 'Transcript Cases', value: summary.transcript_count || 0, helper: 'transcript holder records in progress' },
        { label: 'Mentorship Applications', value: summary.mentorship_count || 0, helper: 'mentorship requests needing screening' },
      ];
    }

    if (role === 'finance') {
      return [
        { label: 'Finance Queue', value: summary.fund_queue_count || 0, helper: 'requests waiting on finance action' },
        { label: 'Total Fund Applications', value: summary.total_fund_applications || 0, helper: 'tracked across the workflow' },
        { label: 'Unread Notifications', value: summary.unread_notifications || 0, helper: 'alerts from office workflow' },
      ];
    }

    return [
      { label: 'Fund Queue', value: summary.fund_queue_count || 0, helper: 'requests on your current review stage' },
      { label: 'Total Fund Applications', value: summary.total_fund_applications || 0, helper: 'loan, support, and benefit cases' },
      { label: 'Unread Notifications', value: summary.unread_notifications || 0, helper: 'items that still need your attention' },
    ];
  }, [role, summary, tools.length]);

  return (
    <div className="space-y-6 p-4 lg:p-8 lg:pb-10">
      <section className="rounded-3xl bg-[#0b2a4a] text-white shadow-lg">
        <div className="grid gap-6 p-6 lg:grid-cols-[1.5fr,1fr] lg:p-8">
          <div className="space-y-4">
            <Badge className="w-fit bg-[#d4a62a] text-[#2b1d0e] hover:bg-[#d4a62a]">
              Internal Office
            </Badge>
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/12">
                <RoleIcon className="h-7 w-7" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold lg:text-3xl">{roleMeta.title}</h2>
                <p className="max-w-2xl text-sm text-white/80 lg:text-base">{roleMeta.subtitle}</p>
              </div>
            </div>
          </div>

          <Card className="border-white/10 bg-white/10 text-white shadow-none backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Role Focus</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-white/85">
              {roleMeta.responsibilities.map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <div className="mt-1 h-2 w-2 rounded-full bg-[#d4a62a]" />
                  <p>{item}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      {loading ? (
        <div className="flex min-h-[180px] items-center justify-center rounded-3xl border border-border/60 bg-card">
          <Loader2 className="mr-3 h-5 w-5 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Loading dashboard summary...</span>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => (
            <Card key={card.label} className="border-border/60 bg-card shadow-sm">
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">{card.label}</p>
                <p className="mt-3 text-3xl font-semibold">{card.value.toLocaleString()}</p>
                <p className="mt-2 text-xs text-muted-foreground">{card.helper}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.3fr,0.9fr]">
        <Card className="border-border/60 bg-card shadow-sm">
          <CardHeader>
            <CardTitle>Role Tools</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {tools.map((tool) => {
              const Icon = tool.icon;
              return (
                <button
                  key={tool.id}
                  onClick={() => onNavigate(tool.id)}
                  className="rounded-2xl border border-border/70 bg-background p-4 text-left transition hover:border-[#8A1F3A]/40 hover:shadow-sm"
                >
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#8A1F3A]/10 text-[#8A1F3A]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-semibold">{tool.label}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{tool.description}</p>
                </button>
              );
            })}
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card shadow-sm">
          <CardHeader>
            <CardTitle>Quick Launch</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {tools.slice(0, 4).map((tool) => (
              <Button
                key={tool.id}
                variant="outline"
                className="w-full justify-start"
                onClick={() => onNavigate(tool.id)}
              >
                <tool.icon className="mr-2 h-4 w-4" />
                {tool.label}
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>

      {role === 'secretary_academics' && (
        <Card className="border-border/60 bg-card shadow-sm">
          <CardContent className="flex items-start gap-4 p-5">
            <Users className="mt-1 h-5 w-5 text-[#8A1F3A]" />
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Mentorship applications now pass through secretary academics screening before they move to mentor engagement.</p>
              <p>Academic verification comments and transcript decisions should be entered clearly so students can track outcomes on their dashboard.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {role === 'publicity' && (
        <Card className="border-border/60 bg-card shadow-sm">
          <CardContent className="flex items-start gap-4 p-5">
            <Megaphone className="mt-1 h-5 w-5 text-[#8A1F3A]" />
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Publicity only sees PR-focused tools here: communication content, event visibility, and broadcasting.</p>
              <p>Fund approval queues stay hidden so this dashboard stays clean and true to the role.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {role === 'finance' && (
        <Card className="border-border/60 bg-card shadow-sm">
          <CardContent className="space-y-2 p-5 text-sm text-muted-foreground">
            <p>Finance is split into two separate working areas on purpose:</p>
            <p>1. Finance Review checks readiness before presidential approval.</p>
            <p>2. Disbursement records the actual release after approval.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
