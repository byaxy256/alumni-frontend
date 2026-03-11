import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { DollarSign, Users, FileText, TrendingUp, AlertCircle, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import type { User } from '../../App';
import { API_BASE } from '../../api';
import { UcuBadgeLogo } from '../UcuBadgeLogo';

interface AlumniDashboardProps {
  user: User;
  onNavigate: (screen: string) => void;
}

type Loan = {
  id: string;
  amount?: number;
  disbursedAmount?: number;
  status?: string;
  createdAt?: string;
  // other fields...
};

type SupportRequest = {
  id: string;
  amountRequested?: number;
  status?: string;
  createdAt?: string;
  // other fields...
};

type NotificationItem = {
  id: string;
  actor?: string;
  action?: string;
  target?: string;
  createdAt?: string;
  // other fields...
};

type DonationStats = {
  totalRaised?: number;
  donorCount?: number;
  donationCount?: number;
  byCause?: Record<string, number>;
};

type DisbursementItem = {
  id?: string;
  student_uid?: string;
  net_amount?: number;
  original_amount?: number;
  approved_at?: string;
  created_at?: string;
};

export default function AlumniDashboard({ user, onNavigate }: AlumniDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [supportRequests, setSupportRequests] = useState<SupportRequest[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [donationStats, setDonationStats] = useState<DonationStats>({});
  const [disbursements, setDisbursements] = useState<DisbursementItem[]>([]);
  const [totalAlumni, setTotalAlumni] = useState(0);
  const [me, setMe] = useState<User | null>(null);

  // Derived metrics
  const pendingApplications =
    supportRequests.filter(sr => (sr.status ?? '').toLowerCase() === 'pending').length +
    loans.filter(l => (l.status ?? '').toLowerCase() === 'pending').length;

  const totalRaised = Number(donationStats.totalRaised || 0);
  const totalDisbursed = disbursements.reduce((sum, d) => sum + Number(d.net_amount || 0), 0);
  const totalFundBalance = totalRaised - totalDisbursed;
  const activeDonors = Number(donationStats.donorCount || 0);
  const resolvedTotalAlumni = Math.max(totalAlumni, activeDonors);
  const nonDonorAlumni = Math.max(resolvedTotalAlumni - activeDonors, 0);

  const formatCompactUGX = (value: number) => {
    if (value >= 1000000000) return `UGX ${(value / 1000000000).toFixed(1)}B`;
    if (value >= 1000000) return `UGX ${(value / 1000000).toFixed(1)}M`;
    return `UGX ${Math.round(value).toLocaleString()}`;
  };

  // monthly applications received derived from supportRequests & loans createdAt
  const monthlyApplications = (() => {
    // build last 5 months labels
    const months: { month: string; applications: number }[] = [];
    const now = new Date();
    for (let i = 4; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleString(undefined, { month: 'short' });
      months.push({ month: label, applications: 0 });
    }

    // Count applications (both loans and support requests)
    const allApplications = [...loans, ...supportRequests];
    allApplications.forEach(app => {
      const dateStr = (app as any).createdAt || (app as any).created_at || '';
      if (!dateStr) return;
      const d = new Date(dateStr);
      const label = d.toLocaleString(undefined, { month: 'short' });
      const idx = months.findIndex(m => m.month === label);
      if (idx >= 0) months[idx].applications += 1;
    });

    return months;
  })();

  const donorsBreakdown = [
    { name: 'Active Donors', value: activeDonors, color: 'var(--chart-1)' },
    { name: 'Other Alumni', value: nonDonorAlumni, color: 'var(--chart-2)' },
  ].filter((item) => item.value > 0);

  const totalDonorValue = donorsBreakdown.reduce((sum, item) => sum + item.value, 0);

  const recentActivities = notifications.slice(0, 6).map((n, idx) => ({
    id: n.id ?? idx,
    type: 'notification',
    user: n.actor ?? 'System',
    action: n.action ?? 'Notification',
    target: n.target ?? '',
    time: n.createdAt ? new Date(n.createdAt).toLocaleString() : 'just now',
  }));

  // src/components/AlumniDashboard.tsx

  useEffect(() => {
    let cancelled = false;
    const ac = new AbortController();
    const token = localStorage.getItem('token') || '';
    const headers = { Authorization: `Bearer ${token}` };

    async function loadAll(silent = false) {
      if (!silent) setLoading(true);
      try {
        const [loansRes, supportRes, notifsRes, meRes, donationsRes, disburseRes, usersRes] = await Promise.all([
          fetch(`${API_BASE}/loans`, { headers, signal: ac.signal, cache: 'no-store' }),
          fetch(`${API_BASE}/support`, { headers, signal: ac.signal, cache: 'no-store' }),
          fetch(`${API_BASE}/notifications/mine`, { headers, signal: ac.signal, cache: 'no-store' }),
          fetch(`${API_BASE}/auth/me`, { headers, signal: ac.signal, cache: 'no-store' }),
          fetch(`${API_BASE}/donations/all-stats`, { headers, signal: ac.signal, cache: 'no-store' }),
          fetch(`${API_BASE}/disburse`, { headers, signal: ac.signal, cache: 'no-store' }),
          fetch(`${API_BASE}/auth/users`, { headers, signal: ac.signal, cache: 'no-store' }),
        ]);

        const loansJson = loansRes.ok ? await loansRes.json() : [];
        const supportJson = supportRes.ok ? await supportRes.json() : [];
        const notifsJson = notifsRes.ok ? await notifsRes.json() : [];
        const meJson = meRes.ok ? await meRes.json() : null;
        const donationsJson = donationsRes.ok ? await donationsRes.json() : {};
        const disburseJson = disburseRes.ok ? await disburseRes.json() : [];
        const usersJson = usersRes.ok ? await usersRes.json() : [];

        if (cancelled) return;
        setLoans(Array.isArray(loansJson) ? loansJson : []);
        setSupportRequests(Array.isArray(supportJson) ? supportJson : []);
        setNotifications(Array.isArray(notifsJson) ? notifsJson : []);
        setMe(meJson?.user || null);
        setDonationStats(donationsJson || {});
        setDisbursements(Array.isArray(disburseJson) ? disburseJson : []);
        if (Array.isArray(usersJson)) {
          setTotalAlumni(usersJson.filter((u: any) => u?.role === 'alumni').length);
        } else {
          setTotalAlumni(0);
        }
      } catch (err: any) {
        if (!cancelled) {
          console.error('Dashboard fetch error', err);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadAll();

    const intervalId = window.setInterval(() => {
      loadAll(true);
    }, 60000);

    const handleFocus = () => loadAll(true);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        loadAll(true);
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      cancelled = true;
      ac.abort();
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  return (
    <div className="p-4 lg:p-6 space-y-6 pb-20 lg:pb-6">
      {/* Welcome Section */}
      <div className="flex items-center gap-3">
        <UcuBadgeLogo className="w-11 h-11" imageClassName="object-contain p-0.5" />
        <div>
          <h2 className="text-xl lg:text-2xl">Welcome back, {me?.name?.split?.(' ')[0] ?? user?.name?.split?.(' ')[0] ?? 'Guest'}!</h2>
          <p className="text-sm text-muted-foreground">Here's what's happening with the Alumni Fund</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
                <DollarSign size={20} className="text-primary" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Total Fund Balance</p>
            <p className="text-lg lg:text-xl mt-1 text-primary">
              {loading ? 'Updating...' : formatCompactUGX(totalFundBalance)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                <AlertCircle size={20} className="text-accent" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Pending Applications</p>
            <p className="text-lg lg:text-xl mt-1">{loading ? '...' : pendingApplications}</p>
            <Button
              variant="link"
              size="sm"
              className="p-0 h-auto mt-2 text-xs text-accent"
              onClick={() => onNavigate('applications')}
            >
              Review Now →
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'color-mix(in oklab, var(--brand-blue) 20%, transparent)' }}
              >
                <Users size={20} style={{ color: 'var(--brand-blue)' }} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Total Alumni</p>
            <p className="text-lg lg:text-xl mt-1">{loading ? '...' : resolvedTotalAlumni.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-2">{loading ? 'Updating...' : `${activeDonors.toLocaleString()} active donors`}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div
                className="w-10 h-10 rounded-full"
                style={{ backgroundColor: 'color-mix(in oklab, var(--brand-purple) 24%, transparent)' }}
              >
                <div className="w-full h-full flex items-center justify-center">
                  <TrendingUp size={20} style={{ color: 'var(--brand-purple)' }} />
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Total Disbursed</p>
            <p className="text-lg lg:text-xl mt-1">
              {loading ? 'Updating...' : formatCompactUGX(totalDisbursed)}
            </p>
            <p className="text-xs text-muted-foreground mt-2">Net approved disbursements</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base lg:text-lg">Monthly Applications Received</CardTitle>
            <CardDescription>Last 5 months</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyApplications}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="applications" fill="var(--chart-1)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base lg:text-lg">Donor Coverage</CardTitle>
            <CardDescription>Active donors vs total alumni</CardDescription>
          </CardHeader>
          <CardContent>
            {donorsBreakdown.length ? (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="50%" height={200}>
                  <PieChart>
                    <Pie
                      data={donorsBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {donorsBreakdown.map((entry, index) => (
                        <Cell key={`donor-cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {donorsBreakdown.map((item) => {
                    const share = totalDonorValue > 0 ? Math.round((item.value / totalDonorValue) * 100) : 0;
                    return (
                      <div key={item.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded" style={{ backgroundColor: item.color }} />
                          <span>{item.name}</span>
                        </div>
                        <span className="text-muted-foreground">{item.value.toLocaleString()} ({share}%)</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No alumni/donor data yet.</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base lg:text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Button onClick={() => onNavigate('applications')} variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <FileText size={24} />
              <span className="text-xs">Review Applications</span>
            </Button>
            <Button onClick={() => onNavigate('import')} variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <Users size={24} />
              <span className="text-xs">Import Data</span>
            </Button>
            <Button onClick={() => onNavigate('broadcast')} variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <TrendingUp size={24} />
              <span className="text-xs">Send Broadcast</span>
            </Button>
            <Button onClick={() => onNavigate('reports')} variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <DollarSign size={24} />
              <span className="text-xs">Generate Report</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base lg:text-lg">Recent Activity</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => onNavigate('footprints')}>
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <div>Loading recent activity...</div>
          ) : recentActivities.length ? (
            recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                  <Clock size={16} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-medium">{activity.user}</span> {activity.action}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{activity.target}</p>
                  <p className="text-xs text-muted-foreground/80 mt-1">{activity.time}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-muted-foreground">No recent activity</div>
          )}
        </CardContent>
      </Card>

      {/* Financial Totals */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base lg:text-lg">Financial Totals</CardTitle>
          <CardDescription>Current totals from the database</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 rounded-lg border border-primary/20 bg-primary/10">
              <p className="text-xs text-muted-foreground">Total Revenue</p>
              <p className="text-lg mt-1 text-primary">
                {loading ? '...' : formatCompactUGX(totalRaised)}
              </p>
            </div>
            <div className="p-3 rounded-lg border border-accent/25 bg-accent/15">
              <p className="text-xs text-muted-foreground">Total Expenses</p>
              <p className="text-lg mt-1 text-accent">
                {loading ? '...' : formatCompactUGX(totalDisbursed)}
              </p>
            </div>
            <div className="p-3 rounded-lg border border-border bg-muted/60">
              <p className="text-xs text-muted-foreground">Available Balance</p>
              <p className="text-lg mt-1 text-foreground">
                {loading ? '...' : formatCompactUGX(totalFundBalance)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
