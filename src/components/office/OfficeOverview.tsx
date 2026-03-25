import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Bell,
  FileCheck,
  GraduationCap,
  Loader2,
  Megaphone,
  Users,
  Wallet,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
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

type QueueItem = {
  id: string;
  type?: string;
  requested_amount?: number;
  overall_status?: string;
};

type ContentItem = {
  id: string;
  type?: string;
  title?: string;
  published?: boolean;
  date?: string;
};

type AcademicItem = {
  academic_verification_status?: string;
};

type TranscriptItem = {
  transcript_program_status?: string;
};

type MentorshipItem = {
  mentorship_application_status?: string;
};

const CHART_COLORS = ['#8A1F3A', '#D4A62A', '#355C9A', '#6E4AA3', '#3B7A57'];

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

const quickActionsByRole: Record<OfficeRole, Array<{ label: string; target: string }>> = {
  administrator: [
    { label: 'Open first review queue', target: 'fund-queue' },
    { label: 'Review full applications list', target: 'applications' },
    { label: 'Request office funds', target: 'fund-request' },
    { label: 'Open reports', target: 'reports' },
  ],
  general_secretary: [
    { label: 'Open oversight queue', target: 'fund-queue' },
    { label: 'Check latest reviewed case', target: 'fund-queue' },
    { label: 'View oversight reports', target: 'reports' },
  ],
  finance: [
    { label: 'Open finance review', target: 'finance-review' },
    { label: 'Open disbursement queue', target: 'finance-disbursement' },
    { label: 'View finance reports', target: 'reports' },
  ],
  president: [
    { label: 'Open executive queue', target: 'fund-queue' },
    { label: 'Review release decisions', target: 'fund-queue' },
    { label: 'View oversight reports', target: 'reports' },
  ],
  publicity: [
    { label: 'Manage announcements', target: 'content' },
    { label: 'Open event tools', target: 'merch' },
    { label: 'Start a broadcast', target: 'broadcast' },
    { label: 'View publicity reports', target: 'reports' },
  ],
  secretary_academics: [
    { label: 'Review academic documents', target: 'academic' },
    { label: 'Manage transcript cases', target: 'transcript' },
    { label: 'Open mentorship review', target: 'mentorship' },
    { label: 'View academic reports', target: 'reports' },
  ],
};

function sumRequestedAmount(items: QueueItem[]) {
  return items.reduce((sum, item) => sum + Number(item.requested_amount || 0), 0);
}

function EmptyChartState({ label }: { label: string }) {
  return (
    <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
      {label}
    </div>
  );
}

export function OfficeOverview({ role, navigationItems, onNavigate }: OfficeOverviewProps) {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<Record<string, number>>({});
  const [roleQueues, setRoleQueues] = useState<{ primary: QueueItem[]; secondary: QueueItem[] }>({ primary: [], secondary: [] });
  const [contentItems, setContentItems] = useState<{ news: ContentItem[]; events: ContentItem[] }>({ news: [], events: [] });
  const [academicData, setAcademicData] = useState<{
    academic: AcademicItem[];
    transcript: TranscriptItem[];
    mentorship: MentorshipItem[];
  }>({ academic: [], transcript: [], mentorship: [] });

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        setLoading(true);
        const summaryResponse = await apiCall('/office/dashboard-summary', 'GET');
        if (cancelled) return;
        setSummary(summaryResponse?.summary || {});

        if (role === 'general_secretary' || role === 'president') {
          const queueItems = await apiCall('/office/fund-workflow', 'GET');
          if (!cancelled) {
            setRoleQueues({ primary: Array.isArray(queueItems) ? queueItems : [], secondary: [] });
          }
        } else if (role === 'finance') {
          const [reviewQueue, disbursementQueue] = await Promise.all([
            apiCall('/office/fund-workflow?queue=review', 'GET'),
            apiCall('/office/fund-workflow?queue=disbursement', 'GET'),
          ]);
          if (!cancelled) {
            setRoleQueues({
              primary: Array.isArray(reviewQueue) ? reviewQueue : [],
              secondary: Array.isArray(disbursementQueue) ? disbursementQueue : [],
            });
          }
        } else if (role === 'publicity') {
          const [newsRes, eventsRes] = await Promise.all([
            apiCall('/content/admin/news', 'GET'),
            apiCall('/content/admin/events', 'GET'),
          ]);
          if (!cancelled) {
            setContentItems({
              news: Array.isArray(newsRes?.content) ? newsRes.content : [],
              events: Array.isArray(eventsRes?.content) ? eventsRes.content : [],
            });
          }
        } else if (role === 'secretary_academics') {
          const [academic, transcript, mentorship] = await Promise.all([
            apiCall('/office/academic-verification', 'GET'),
            apiCall('/office/transcript-program', 'GET'),
            apiCall('/office/mentorship-applications', 'GET'),
          ]);
          if (!cancelled) {
            setAcademicData({
              academic: Array.isArray(academic) ? academic : [],
              transcript: Array.isArray(transcript) ? transcript : [],
              mentorship: Array.isArray(mentorship) ? mentorship : [],
            });
          }
        }
      } catch (error) {
        console.error('Failed to load office dashboard summary:', error);
        if (!cancelled) {
          setSummary({});
          setRoleQueues({ primary: [], secondary: [] });
          setContentItems({ news: [], events: [] });
          setAcademicData({ academic: [], transcript: [], mentorship: [] });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadDashboard();
    return () => {
      cancelled = true;
    };
  }, [role]);

  const roleMeta = roleCopy[role];
  const RoleIcon = roleMeta.icon;
  const tools = navigationItems.filter((item) => item.id !== 'dashboard');

  const dashboardData = useMemo(() => {
    if (role === 'general_secretary') {
      const items = roleQueues.primary;
      const typeCounts = ['loan', 'support', 'student_benefit'].map((type) => ({
        name: type.replace(/_/g, ' '),
        value: items.filter((item) => item.type === type).length,
      }));
      const amountByType = ['loan', 'support', 'student_benefit'].map((type) => ({
        name: type.replace(/_/g, ' '),
        value: items
          .filter((item) => item.type === type)
          .reduce((sum, item) => sum + Number(item.requested_amount || 0), 0),
      }));

      return {
        cards: [
          { label: 'Oversight Queue', value: items.length, helper: 'administrator-approved requests waiting for review' },
          { label: 'Loan Cases', value: items.filter((item) => item.type === 'loan').length, helper: 'loan requests at secretary stage' },
          { label: 'Support & Benefit', value: items.filter((item) => item.type !== 'loan').length, helper: 'support and benefit cases to comment on' },
          { label: 'Queue Value', value: `UGX ${sumRequestedAmount(items).toLocaleString()}`, helper: 'total requested amount awaiting oversight' },
        ],
        primaryChartTitle: 'Oversight Queue by Request Type',
        primaryChartType: 'bar' as const,
        primaryChartData: typeCounts,
        primaryDataKey: 'value',
        secondaryChartTitle: 'Requested Amount by Type',
        secondaryChartType: 'pie' as const,
        secondaryChartData: amountByType.filter((item) => item.value > 0),
      };
    }

    if (role === 'finance') {
      const reviewItems = roleQueues.primary;
      const disbursementItems = roleQueues.secondary;
      const reviewAmount = sumRequestedAmount(reviewItems);
      const disbursementAmount = sumRequestedAmount(disbursementItems);
      const pipelineData = [
        { name: 'Review', value: reviewItems.length, amount: reviewAmount },
        { name: 'Disbursement', value: disbursementItems.length, amount: disbursementAmount },
      ];
      const typeMix = ['loan', 'support', 'student_benefit'].map((type) => ({
        name: type.replace(/_/g, ' '),
        value: [...reviewItems, ...disbursementItems].filter((item) => item.type === type).length,
      }));

      return {
        cards: [
          { label: 'Finance Review Queue', value: reviewItems.length, helper: 'requests needing financial feasibility review' },
          { label: 'Disbursement Queue', value: disbursementItems.length, helper: 'president-approved requests ready for release' },
          { label: 'Review Value', value: `UGX ${reviewAmount.toLocaleString()}`, helper: 'amount currently awaiting finance review' },
          { label: 'Disbursement Value', value: `UGX ${disbursementAmount.toLocaleString()}`, helper: 'amount ready for payout processing' },
        ],
        primaryChartTitle: 'Finance Pipeline',
        primaryChartType: 'bar' as const,
        primaryChartData: pipelineData,
        primaryDataKey: 'value',
        secondaryChartTitle: 'Request Mix in Finance',
        secondaryChartType: 'pie' as const,
        secondaryChartData: typeMix.filter((item) => item.value > 0),
      };
    }

    if (role === 'president') {
      const items = roleQueues.primary;
      const typeCounts = ['loan', 'support', 'student_benefit'].map((type) => ({
        name: type.replace(/_/g, ' '),
        value: items.filter((item) => item.type === type).length,
      }));
      const statusCounts = [
        { name: 'Awaiting decision', value: items.length },
        { name: 'Unread notifications', value: summary.unread_notifications || 0 },
      ].filter((item) => item.value > 0);

      return {
        cards: [
          { label: 'Executive Queue', value: items.length, helper: 'finance-cleared requests waiting on executive action' },
          { label: 'Total Queue Value', value: `UGX ${sumRequestedAmount(items).toLocaleString()}`, helper: 'amount awaiting presidential decision' },
          { label: 'Unread Notifications', value: summary.unread_notifications || 0, helper: 'workflow updates and student communication' },
          { label: 'Total Fund Applications', value: summary.total_fund_applications || 0, helper: 'full office workflow volume' },
        ],
        primaryChartTitle: 'Executive Queue by Request Type',
        primaryChartType: 'bar' as const,
        primaryChartData: typeCounts,
        primaryDataKey: 'value',
        secondaryChartTitle: 'Decision Focus',
        secondaryChartType: 'pie' as const,
        secondaryChartData: statusCounts,
      };
    }

    if (role === 'publicity') {
      const newsItems = contentItems.news;
      const eventItems = contentItems.events;
      const publishedNews = newsItems.filter((item) => item.published).length;
      const publishedEvents = eventItems.filter((item) => item.published).length;
      const upcomingEvents = eventItems.filter((item) => item.date && new Date(item.date) >= new Date()).length;
      const contentMix = [
        { name: 'News', value: newsItems.length },
        { name: 'Events', value: eventItems.length },
      ];
      const publishState = [
        { name: 'Published', value: publishedNews + publishedEvents },
        { name: 'Draft', value: newsItems.length + eventItems.length - (publishedNews + publishedEvents) },
      ].filter((item) => item.value > 0);

      return {
        cards: [
          { label: 'News Posts', value: newsItems.length, helper: 'stories and announcements in the newsroom' },
          { label: 'Events', value: eventItems.length, helper: 'public-facing events under management' },
          { label: 'Published Items', value: publishedNews + publishedEvents, helper: 'currently visible communication content' },
          { label: 'Upcoming Events', value: upcomingEvents, helper: 'events still ahead on the calendar' },
        ],
        primaryChartTitle: 'Communication Mix',
        primaryChartType: 'bar' as const,
        primaryChartData: contentMix,
        primaryDataKey: 'value',
        secondaryChartTitle: 'Publish State',
        secondaryChartType: 'pie' as const,
        secondaryChartData: publishState,
      };
    }

    if (role === 'secretary_academics') {
      const academic = academicData.academic;
      const transcript = academicData.transcript;
      const mentorship = academicData.mentorship;
      const workflowVolumes = [
        { name: 'Academic', value: academic.length },
        { name: 'Transcript', value: transcript.length },
        { name: 'Mentorship', value: mentorship.length },
      ];
      const statusMix = [
        { name: 'Pending academic', value: academic.filter((item) => !item.academic_verification_status || item.academic_verification_status === 'pending').length },
        { name: 'Transcript active', value: transcript.filter((item) => ['pending', 'in_progress'].includes(item.transcript_program_status || 'pending')).length },
        { name: 'Mentorship in review', value: mentorship.filter((item) => ['pending', 'in_review'].includes(item.mentorship_application_status || 'pending')).length },
      ].filter((item) => item.value > 0);

      return {
        cards: [
          { label: 'Academic Reviews', value: academic.length, helper: 'student benefit records needing academic verification' },
          { label: 'Transcript Cases', value: transcript.length, helper: 'transcript holder matters currently tracked' },
          { label: 'Mentorship Applications', value: mentorship.length, helper: 'mentorship cases requiring academic screening' },
          { label: 'Unread Notifications', value: summary.unread_notifications || 0, helper: 'office and student updates to respond to' },
        ],
        primaryChartTitle: 'Academic Workload by Section',
        primaryChartType: 'bar' as const,
        primaryChartData: workflowVolumes,
        primaryDataKey: 'value',
        secondaryChartTitle: 'Cases Needing Attention',
        secondaryChartType: 'pie' as const,
        secondaryChartData: statusMix,
      };
    }

    return {
      cards: [],
      primaryChartTitle: '',
      primaryChartType: 'bar' as const,
      primaryChartData: [],
      primaryDataKey: 'value',
      secondaryChartTitle: '',
      secondaryChartType: 'pie' as const,
      secondaryChartData: [],
    };
  }, [role, roleQueues, contentItems, academicData, summary]);

  const roleActions = quickActionsByRole[role];

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
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {dashboardData.cards.map((card) => (
            <Card key={card.label} className="border-border/60 bg-card shadow-sm">
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">{card.label}</p>
                <p className="mt-3 text-3xl font-semibold">{typeof card.value === 'number' ? card.value.toLocaleString() : card.value}</p>
                <p className="mt-2 text-xs text-muted-foreground">{card.helper}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.25fr,0.95fr]">
        <Card className="border-border/60 bg-card shadow-sm">
          <CardHeader>
            <CardTitle>{dashboardData.primaryChartTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            {dashboardData.primaryChartData.length ? (
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dashboardData.primaryChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey={dashboardData.primaryDataKey} radius={[10, 10, 0, 0]} fill="#8A1F3A" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyChartState label="No chart data is available for this role yet." />
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card shadow-sm">
          <CardHeader>
            <CardTitle>{dashboardData.secondaryChartTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            {dashboardData.secondaryChartData.length ? (
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dashboardData.secondaryChartData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={55}
                      outerRadius={88}
                      paddingAngle={3}
                    >
                      {dashboardData.secondaryChartData.map((entry, index) => (
                        <Cell key={`${entry.name}-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyChartState label="Nothing is waiting in this role right now." />
            )}
            {dashboardData.secondaryChartData.length ? (
              <div className="mt-2 space-y-2 text-sm">
                {dashboardData.secondaryChartData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                      <span>{entry.name}</span>
                    </div>
                    <span className="text-muted-foreground">{entry.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

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
            <CardTitle>Priority Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {roleActions.map((action) => (
              <Button
                key={action.label}
                variant="outline"
                className="w-full justify-start"
                onClick={() => onNavigate(action.target)}
              >
                {action.label}
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
              <p>Fund approval queues stay hidden so this dashboard remains focused on communication work.</p>
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
