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
  amount_disbursed?: number;
  approved_amount?: number;
  amount_requested?: number;
  status?: string;
  createdAt?: string;
  // other fields...
};

type SupportRequest = {
  id: string;
  amountRequested?: number;
  amount_requested?: number;
  approved_amount?: number;
  disbursedAmount?: number;
  amount?: number;
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
  const isDisbursedStatus = (status: string) => {
    const s = (status || '').toLowerCase();
    return ['approved', 'active', 'paid', 'disbursed'].includes(s);
  };
  const getMoney = (item: any) =>
    Number(
      item?.disbursedAmount ??
      item?.amount_disbursed ??
      item?.approved_amount ??
      item?.amountRequested ??
      item?.amount_requested ??
      item?.amount ??
      0
    );
  const totalLoansDisbursed = loans
    .filter((loan) => isDisbursedStatus(String(loan.status || '')))
    .reduce((sum, loan) => sum + getMoney(loan), 0);
  const totalSupportDisbursed = supportRequests
    .filter((request) => isDisbursedStatus(String(request.status || '')))
    .reduce((sum, request) => sum + getMoney(request), 0);
  const totalProgramDisbursed = totalLoansDisbursed + totalSupportDisbursed;
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
    { name: 'Active Donors', value: activeDonors, color: '#355C9A' },
    { name: 'Other Alumni', value: nonDonorAlumni, color: '#8A1F3A' },
  ].filter((item) => item.value > 0);

  const totalDonorValue = donorsBreakdown.reduce((sum, item) => sum + item.value, 0);

  const recentActivities = notifications
    .map((notification, idx) => {
      const item = notification as any;
      const actor = item.actor ?? item.user ?? item.createdBy ?? item.created_by ?? item.sender ?? 'System';
      const action = item.action ?? item.type ?? item.category ?? 'Notification';
      const target =
        item.target ??
        item.message ??
        item.title ??
        item.body ??
        item.content ??
        item.text ??
        item.description ??
        '';
      const createdAt = item.createdAt ?? item.created_at ?? item.updatedAt ?? item.updated_at;

      return {
        id: item.id ?? item._id ?? idx,
        type: 'notification',
        user: String(actor || 'System'),
        action: String(action || 'Notification'),
        target: String(target || ''),
        time: createdAt ? new Date(createdAt).toLocaleString() : 'just now',
      };
    })
    .filter((activity) => activity.user || activity.action || activity.target)
    .slice(0, 6);

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
    <div className="min-h-screen bg-background">
      {/* Blue Header Section */}
      <div className="bg-[#0b2a4a] text-white p-6 rounded-none shadow-lg mb-6">
        <div>
          <div className="mb-4">
            <h2 className="text-2xl font-semibold">Welcome back, {me?.name?.split?.(' ')[0] ?? user?.name?.split?.(' ')[0] ?? 'Guest'}!</h2>
            <p className="text-sm opacity-80 mt-1">Here's what's happening with the Alumni Fund</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 lg:p-6 space-y-6 pb-20 lg:pb-6 max-w-6xl mx-auto">

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <Card className="border-white/20 text-white" style={{ background: 'linear-gradient(145deg, #2f5288 0%, #355C9A 100%)' }}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-full bg-white/18 border border-white/35 flex items-center justify-center">
                <DollarSign size={20} className="text-white" />
              </div>
            </div>
            <p className="text-xs text-white/80">Total Fund Balance</p>
            <p className="text-lg lg:text-xl mt-1 text-white">
              {loading ? 'Updating...' : formatCompactUGX(totalFundBalance)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-white/20 text-white" style={{ background: 'linear-gradient(145deg, #742033 0%, #8A1F3A 100%)' }}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-full bg-white/18 border border-white/35 flex items-center justify-center">
                <AlertCircle size={20} className="text-white" />
              </div>
            </div>
            <p className="text-xs text-white/80">Pending Applications</p>
            <p className="text-lg lg:text-xl mt-1 text-white">{loading ? '...' : pendingApplications}</p>
            <Button
              variant="link"
              size="sm"
              className="p-0 h-auto mt-2 text-xs text-white/90 hover:text-white"
              onClick={() => onNavigate('applications')}
            >
              Review Now →
            </Button>
          </CardContent>
        </Card>

        <Card className="border-white/20 text-white" style={{ background: 'linear-gradient(145deg, #b1882a 0%, #C79A2B 100%)' }}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-full bg-white/18 border border-white/35 flex items-center justify-center">
                <Users size={20} className="text-white" />
              </div>
            </div>
            <p className="text-xs text-white/80">Total Alumni</p>
            <p className="text-lg lg:text-xl mt-1 text-white">{loading ? '...' : resolvedTotalAlumni.toLocaleString()}</p>
            <p className="text-xs text-white/80 mt-2">{loading ? 'Updating...' : `${activeDonors.toLocaleString()} active donors`}</p>
          </CardContent>
        </Card>

        <Card className="border-white/20 text-white" style={{ background: 'linear-gradient(145deg, #356642 0%, #3F7A4A 100%)' }}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-full bg-white/18 border border-white/35 flex items-center justify-center">
                <TrendingUp size={20} className="text-white" />
              </div>
            </div>
            <p className="text-xs text-white/80">Total Disbursed</p>
            <p className="text-lg lg:text-xl mt-1 text-white">
              {loading ? 'Updating...' : formatCompactUGX(totalDisbursed)}
            </p>
            <p className="text-xs text-white/80 mt-2">Net approved disbursements</p>
          </CardContent>
        </Card>
      </div>

      {/* Accountability totals for disbursements */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="border border-slate-200/80">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Loans Disbursed (Total)</p>
            <p className="text-xl mt-1 text-[#0b2a4a]">{loading ? 'Updating...' : formatCompactUGX(totalLoansDisbursed)}</p>
          </CardContent>
        </Card>
        <Card className="border border-slate-200/80">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Support Disbursed (Total)</p>
            <p className="text-xl mt-1 text-[#0b2a4a]">{loading ? 'Updating...' : formatCompactUGX(totalSupportDisbursed)}</p>
          </CardContent>
        </Card>
        <Card className="border border-slate-200/80 bg-slate-50/70">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Loans + Support Disbursed</p>
            <p className="text-xl mt-1 text-[#0b2a4a]">{loading ? 'Updating...' : formatCompactUGX(totalProgramDisbursed)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-slate-200/80">
          <CardHeader>
            <CardTitle className="text-base lg:text-lg">Monthly Applications Received</CardTitle>
            <CardDescription>Last 5 months</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyApplications}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(53, 92, 154, 0.14)" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="applications" fill="#355C9A" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80">
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
            <Button onClick={() => onNavigate('applications')} variant="outline" className="h-auto p-4 flex flex-col items-center gap-2 text-white border-white/20 hover:opacity-95" style={{ background: 'linear-gradient(145deg, #2f5288 0%, #355C9A 100%)' }}>
              <FileText size={24} />
              <span className="text-xs">Review Applications</span>
            </Button>
            <Button onClick={() => onNavigate('import')} variant="outline" className="h-auto p-4 flex flex-col items-center gap-2 text-white border-white/20 hover:opacity-95" style={{ background: 'linear-gradient(145deg, #742033 0%, #8A1F3A 100%)' }}>
              <Users size={24} />
              <span className="text-xs">Import Data</span>
            </Button>
            <Button onClick={() => onNavigate('broadcast')} variant="outline" className="h-auto p-4 flex flex-col items-center gap-2 text-white border-white/20 hover:opacity-95" style={{ background: 'linear-gradient(145deg, #b1882a 0%, #C79A2B 100%)' }}>
              <TrendingUp size={24} />
              <span className="text-xs">Send Broadcast</span>
            </Button>
            <Button onClick={() => onNavigate('reports')} variant="outline" className="h-auto p-4 flex flex-col items-center gap-2 text-white border-white/20 hover:opacity-95" style={{ background: 'linear-gradient(145deg, #356642 0%, #3F7A4A 100%)' }}>
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
      <Card className="border-slate-200/80">
        <CardHeader>
          <CardTitle className="text-base lg:text-lg">Financial Totals</CardTitle>
          <CardDescription>Current totals from the database</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl border border-white/20 text-white" style={{ background: 'linear-gradient(145deg, #2f5288 0%, #355C9A 100%)' }}>
              <p className="text-xs text-white/80">Total Revenue</p>
              <p className="text-lg mt-1 text-white">
                {loading ? '...' : formatCompactUGX(totalRaised)}
              </p>
            </div>
            <div className="p-3 rounded-xl border border-white/20 text-white" style={{ background: 'linear-gradient(145deg, #742033 0%, #8A1F3A 100%)' }}>
              <p className="text-xs text-white/80">Total Expenses</p>
              <p className="text-lg mt-1 text-white">
                {loading ? '...' : formatCompactUGX(totalDisbursed)}
              </p>
            </div>
            <div className="p-3 rounded-xl border border-white/20 text-white" style={{ background: 'linear-gradient(145deg, #b1882a 0%, #C79A2B 100%)' }}>
              <p className="text-xs text-white/80">Available Balance</p>
              <p className="text-lg mt-1 text-white">
                {loading ? '...' : formatCompactUGX(totalFundBalance)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
