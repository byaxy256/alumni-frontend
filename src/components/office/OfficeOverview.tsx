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
  | 'vice_president'
  | 'publicity'
  | 'secretary_academics'
  | 'projects_manager';

interface OfficeNavItem {
  id: string;
  label: string;
  shortLabel: string;
  icon: any;
  description: string;
}

interface OfficeOverviewProps {
  role: OfficeRole;
  displayName: string;
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
  }
> = {
  administrator: {
    title: 'Administrator Dashboard',
    subtitle: 'Main operations center for applications, requests, and internal coordination.',
    icon: Wallet,
  },
  general_secretary: {
    title: 'General Secretary Dashboard',
    subtitle: 'Operational approvals and second-stage workflow accountability.',
    icon: FileCheck,
  },
  finance: {
    title: 'Finance Dashboard',
    subtitle: 'Finance review, disbursements, and transaction control in one workspace.',
    icon: Wallet,
  },
  president: {
    title: 'President Dashboard',
    subtitle: 'Executive approval center for high-priority reviews and release decisions.',
    icon: Bell,
  },
  vice_president: {
    title: 'Vice President Dashboard',
    subtitle: 'Executive fallback approval center with the same review authority.',
    icon: Bell,
  },
  publicity: {
    title: 'Publicity Dashboard',
    subtitle: 'Newsroom, announcements, communications, and event visibility operations.',
    icon: Megaphone,
  },
  secretary_academics: {
    title: 'Secretary Academics Dashboard',
    subtitle: 'Academic verification, transcript workflow, and mentorship decisions.',
    icon: GraduationCap,
  },
  projects_manager: {
    title: 'Projects Manager Dashboard',
    subtitle: 'Project portfolio management, milestone tracking, and delivery updates.',
    icon: Users,
  },
};

const quickActionsByRole: Record<OfficeRole, Array<{ label: string; target: string }>> = {
  administrator: [
    { label: 'Open applications queue', target: 'applications' },
    { label: 'Open request funds module', target: 'request-funds' },
    { label: 'Review notifications', target: 'notifications' },
    { label: 'Open reports', target: 'reports' },
  ],
  general_secretary: [
    { label: 'Open approvals queue', target: 'approvals' },
    { label: 'Inspect applications', target: 'applications' },
    { label: 'Open request funds', target: 'request-funds' },
    { label: 'View oversight reports', target: 'reports' },
  ],
  finance: [
    { label: 'Open finance review', target: 'finance-review' },
    { label: 'Open disbursements', target: 'disbursements' },
    { label: 'View transactions', target: 'transactions' },
    { label: 'View finance reports', target: 'reports' },
  ],
  president: [
    { label: 'Open executive review', target: 'executive-review' },
    { label: 'Review fund requests', target: 'fund-requests' },
    { label: 'View oversight reports', target: 'reports' },
  ],
  vice_president: [
    { label: 'Open executive review', target: 'executive-review' },
    { label: 'Review fund requests', target: 'fund-requests' },
    { label: 'View oversight reports', target: 'reports' },
  ],
  publicity: [
    { label: 'Manage news', target: 'news' },
    { label: 'Open events', target: 'events' },
    { label: 'Publish announcements', target: 'announcements' },
    { label: 'Start communications', target: 'communications' },
    { label: 'View publicity reports', target: 'reports' },
  ],
  secretary_academics: [
    { label: 'Review academic verification', target: 'academic-verification' },
    { label: 'Review student benefits', target: 'student-benefit-reviews' },
    { label: 'Manage transcript cases', target: 'transcript' },
    { label: 'Open mentorship review', target: 'mentorship' },
    { label: 'View academic reports', target: 'reports' },
  ],
  projects_manager: [
    { label: 'Open projects module', target: 'projects' },
    { label: 'Review milestones', target: 'milestones' },
    { label: 'Post project updates', target: 'updates' },
    { label: 'View project reports', target: 'reports' },
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

export function OfficeOverview({ role, displayName, navigationItems, onNavigate }: OfficeOverviewProps) {
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

        if (role === 'administrator' || role === 'general_secretary' || role === 'president' || role === 'vice_president') {
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
        } else if (role === 'projects_manager') {
          try {
            const projects = await apiCall('/office/projects', 'GET');
            if (!cancelled) {
              setRoleQueues({
                primary: Array.isArray(projects) ? projects : [],
                secondary: [],
              });
            }
          } catch {
            if (!cancelled) {
              setRoleQueues({ primary: [], secondary: [] });
            }
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
    if (role === 'administrator') {
      const items = roleQueues.primary;
      const typeCounts = ['loan', 'support', 'student_benefit'].map((type) => ({
        name: type.replace(/_/g, ' '),
        value: items.filter((item) => item.type === type).length,
      }));

      return {
        cards: [
          { label: 'Pending Applications', value: summary.pending_fund_applications || items.length, helper: 'applications waiting operational handling' },
          { label: 'Approved Applications', value: summary.approved_fund_applications || 0, helper: 'applications approved across workflows' },
          { label: 'Rejected Applications', value: summary.rejected_fund_applications || 0, helper: 'applications rejected at any stage' },
          { label: 'Total Beneficiaries', value: summary.total_recipients || 0, helper: 'students who received support or loans' },
          { label: 'Available Funds', value: `UGX ${Number(summary.total_fund_balance || 0).toLocaleString()}`, helper: 'current net available fund balance' },
          { label: 'Total Disbursed', value: `UGX ${Number(summary.total_disbursed || 0).toLocaleString()}`, helper: 'total amount disbursed to beneficiaries' },
        ],
        primaryChartTitle: 'Application Trends by Type',
        primaryChartType: 'bar' as const,
        primaryChartData: typeCounts,
        primaryDataKey: 'value',
        secondaryChartTitle: 'Workflow Status Mix',
        secondaryChartType: 'pie' as const,
        secondaryChartData: [
          { name: 'Pending', value: summary.pending_fund_applications || items.length },
          { name: 'Approved', value: summary.approved_fund_applications || 0 },
          { name: 'Rejected', value: summary.rejected_fund_applications || 0 },
        ].filter((item) => item.value > 0),
      };
    }

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
          { label: 'Pending Applications', value: items.length, helper: 'requests awaiting secretary review' },
          { label: 'Pending Fund Requests', value: items.length, helper: 'fund requests currently in your queue' },
          { label: 'Approved by Administrator', value: items.length, helper: 'cases moved from administrator stage' },
          { label: 'Total Commented Cases', value: items.filter((item: any) => Object.values(item?.comments || {}).some(Boolean)).length, helper: 'cases with workflow comments attached' },
          { label: 'Reviewed This Month', value: summary.general_secretary_reviewed_this_month || 0, helper: 'monthly throughput for secretary reviews' },
          { label: 'Queue Value', value: `UGX ${sumRequestedAmount(items).toLocaleString()}`, helper: 'requested value currently awaiting review' },
        ],
        primaryChartTitle: 'Application Trends by Type',
        primaryChartType: 'bar' as const,
        primaryChartData: typeCounts,
        primaryDataKey: 'value',
        secondaryChartTitle: 'Requests Awaiting Review Value',
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

    if (role === 'president' || role === 'vice_president') {
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
          { label: 'Pending Executive Reviews', value: items.length, helper: 'finance-cleared requests waiting decision' },
          { label: 'Approved Releases', value: summary.executive_approved || 0, helper: 'requests approved at executive stage' },
          { label: 'Rejected Requests', value: summary.executive_rejected || 0, helper: 'requests rejected by executive review' },
          { label: 'Total Reviewed', value: summary.executive_reviewed_total || items.length, helper: 'all executive-reviewed requests this period' },
          { label: 'Queue Value', value: `UGX ${sumRequestedAmount(items).toLocaleString()}`, helper: 'requested value awaiting decision' },
          { label: 'Unread Notifications', value: summary.unread_notifications || 0, helper: 'new comments and workflow updates' },
        ],
        primaryChartTitle: 'Executive Queue by Request Type',
        primaryChartType: 'bar' as const,
        primaryChartData: typeCounts,
        primaryDataKey: 'value',
        secondaryChartTitle: 'Executive Decision Mix',
        secondaryChartType: 'pie' as const,
        secondaryChartData: statusCounts,
      };
    }

    if (role === 'projects_manager') {
      const projects = roleQueues.primary;
      const active = projects.filter((item: any) => ['active', 'in_progress'].includes(String((item as any)?.status || ''))).length;
      const completed = projects.filter((item: any) => String((item as any)?.status || '') === 'completed').length;
      const delayed = projects.filter((item: any) => ['delayed', 'blocked'].includes(String((item as any)?.status || ''))).length;
      const budgetTracked = projects.reduce((sum: number, item: any) => sum + Number((item as any)?.budget || (item as any)?.requested_amount || 0), 0);

      return {
        cards: [
          { label: 'Total Projects', value: projects.length, helper: 'projects under office portfolio tracking' },
          { label: 'Active Projects', value: active, helper: 'projects currently being executed' },
          { label: 'Completed Projects', value: completed, helper: 'projects closed successfully' },
          { label: 'Delayed Projects', value: delayed, helper: 'projects needing escalation or recovery' },
          { label: 'Total Budget Tracked', value: `UGX ${budgetTracked.toLocaleString()}`, helper: 'sum of tracked budgets across projects' },
          { label: 'Notifications', value: summary.unread_notifications || 0, helper: 'project alerts and pending updates' },
        ],
        primaryChartTitle: 'Project Status Distribution',
        primaryChartType: 'bar' as const,
        primaryChartData: [
          { name: 'Active', value: active },
          { name: 'Completed', value: completed },
          { name: 'Delayed', value: delayed },
        ],
        primaryDataKey: 'value',
        secondaryChartTitle: 'Budget vs Volume',
        secondaryChartType: 'pie' as const,
        secondaryChartData: [
          { name: 'Budget Tracked', value: budgetTracked },
          { name: 'Project Count', value: projects.length },
        ].filter((item) => item.value > 0),
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
  const recentRows = useMemo(() => {
    if (['administrator', 'general_secretary', 'finance', 'president', 'vice_president'].includes(role)) {
      return roleQueues.primary.slice(0, 6).map((item) => ({
        name: (item as any).student_name || (item as any).access_number || item.id,
        type: item.type || 'request',
        status: item.overall_status || 'pending',
        value: Number(item.requested_amount || 0),
      }));
    }
    if (role === 'publicity') {
      return contentItems.news.slice(0, 6).map((item) => ({
        name: item.title || 'Untitled post',
        type: 'news',
        status: item.published ? 'published' : 'draft',
        value: 0,
      }));
    }
    if (role === 'secretary_academics') {
      return academicData.academic.slice(0, 6).map((item, index) => ({
        name: `Academic Case ${index + 1}`,
        type: 'verification',
        status: item.academic_verification_status || 'pending',
        value: 0,
      }));
    }
    return roleQueues.primary.slice(0, 6).map((item: any, index) => ({
      name: item.name || item.title || `Project ${index + 1}`,
      type: 'project',
      status: item.status || 'active',
      value: Number(item.budget || 0),
    }));
  }, [role, roleQueues, contentItems, academicData]);

  const awaitingRows = useMemo(() => {
    if (role === 'finance') {
      return roleQueues.secondary.slice(0, 6).map((item) => ({
        name: (item as any).student_name || (item as any).access_number || item.id,
        type: item.type || 'request',
        status: item.overall_status || 'pending',
        value: Number(item.requested_amount || 0),
      }));
    }
    if (role === 'publicity') {
      return contentItems.events.slice(0, 6).map((item) => ({
        name: item.title || 'Untitled event',
        type: 'event',
        status: item.published ? 'published' : 'draft',
        value: 0,
      }));
    }
    if (role === 'secretary_academics') {
      return academicData.mentorship.slice(0, 6).map((item, index) => ({
        name: `Mentorship ${index + 1}`,
        type: 'mentorship',
        status: item.mentorship_application_status || 'pending',
        value: 0,
      }));
    }
    return roleQueues.primary.slice(0, 6).map((item) => ({
      name: (item as any).student_name || (item as any).access_number || item.id,
      type: item.type || 'request',
      status: item.current_stage || item.overall_status || 'pending',
      value: Number(item.requested_amount || 0),
    }));
  }, [role, roleQueues, contentItems, academicData]);

  return (
    <div className="space-y-6 p-4 lg:p-8 lg:pb-10">
      <section className="rounded-3xl bg-[#0b2a4a] text-white shadow-lg">
        <div className="grid gap-6 p-6 lg:p-8">
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
                <p className="text-sm text-white/90">Welcome back, {displayName.split(' ')[0]}!</p>
              </div>
            </div>
          </div>
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
        <Card className="border-border/60 bg-card shadow-sm xl:col-span-2">
          <CardHeader>
            <CardTitle>{role === 'general_secretary' ? 'Recent Applications' : 'Recent Work Items'}</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-border/70 text-muted-foreground">
                  <th className="py-2 text-left font-medium">Item</th>
                  <th className="py-2 text-left font-medium">Type</th>
                  <th className="py-2 text-left font-medium">Status</th>
                  <th className="py-2 text-right font-medium">Value</th>
                </tr>
              </thead>
              <tbody>
                {recentRows.length ? recentRows.map((row) => (
                  <tr key={`${row.name}-${row.type}`} className="border-b border-border/40">
                    <td className="py-3">{row.name}</td>
                    <td className="py-3 capitalize text-muted-foreground">{row.type.replace(/_/g, ' ')}</td>
                    <td className="py-3 capitalize">{row.status.replace(/_/g, ' ')}</td>
                    <td className="py-3 text-right">{row.value ? `UGX ${row.value.toLocaleString()}` : '—'}</td>
                  </tr>
                )) : (
                  <tr>
                    <td className="py-4 text-muted-foreground" colSpan={4}>No recent records found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card shadow-sm xl:col-span-2">
          <CardHeader>
            <CardTitle>{role === 'general_secretary' ? 'Requests Awaiting Review' : 'Pending Queue'}</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-border/70 text-muted-foreground">
                  <th className="py-2 text-left font-medium">Item</th>
                  <th className="py-2 text-left font-medium">Type</th>
                  <th className="py-2 text-left font-medium">Stage</th>
                  <th className="py-2 text-right font-medium">Value</th>
                </tr>
              </thead>
              <tbody>
                {awaitingRows.length ? awaitingRows.map((row) => (
                  <tr key={`${row.name}-${row.status}`} className="border-b border-border/40">
                    <td className="py-3">{row.name}</td>
                    <td className="py-3 capitalize text-muted-foreground">{row.type.replace(/_/g, ' ')}</td>
                    <td className="py-3 capitalize">{row.status.replace(/_/g, ' ')}</td>
                    <td className="py-3 text-right">{row.value ? `UGX ${row.value.toLocaleString()}` : '—'}</td>
                  </tr>
                )) : (
                  <tr>
                    <td className="py-4 text-muted-foreground" colSpan={4}>No pending records found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card shadow-sm">
          <CardHeader>
            <CardTitle>Operational Modules</CardTitle>
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

    </div>
  );
}
