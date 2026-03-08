import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { DollarSign, Wallet, Users, FileText, TrendingUp, AlertCircle, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import type { User } from '../../App';
import { API_BASE } from '../../api';

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
  const [me, setMe] = useState<User | null>(null);

  // Derived metrics
  const pendingApplications =
    supportRequests.filter(sr => (sr.status ?? '').toLowerCase() === 'pending').length +
    loans.filter(l => (l.status ?? '').toLowerCase() === 'pending').length;

  const totalRaised = Number(donationStats.totalRaised || 0);
  const totalDisbursed = disbursements.reduce((sum, d) => sum + Number(d.net_amount || 0), 0);
  const totalFundBalance = totalRaised - totalDisbursed;

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

  const financialBreakdown = [
    { name: 'Total Revenue', value: Math.max(totalRaised, 0), color: '#0b2a4a' },
    { name: 'Total Expenses', value: Math.max(totalDisbursed, 0), color: '#c79b2d' },
    { name: 'Available Balance', value: Math.max(totalFundBalance, 0), color: '#10b981' },
  ].filter((item) => item.value > 0);

  const totalFinancialValue = financialBreakdown.reduce((sum, item) => sum + item.value, 0);

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
    const ac = new AbortController();
    const token = localStorage.getItem('token') || '';
    const headers = { Authorization: `Bearer ${token}` };

    async function loadAll() {
      setLoading(true);
      try {
        const [loansRes, supportRes, notifsRes, meRes, donationsRes, disburseRes] = await Promise.all([
          fetch(`${API_BASE}/loans`, { headers, signal: ac.signal }),
          fetch(`${API_BASE}/support`, { headers, signal: ac.signal }),
          fetch(`${API_BASE}/notifications/mine`, { headers, signal: ac.signal }),
          fetch(`${API_BASE}/auth/me`, { headers, signal: ac.signal }),
          fetch(`${API_BASE}/donations/all-stats`, { headers, signal: ac.signal }),
          fetch(`${API_BASE}/disburse`, { headers, signal: ac.signal }),
        ]);

        const loansJson = loansRes.ok ? await loansRes.json() : [];
        const supportJson = supportRes.ok ? await supportRes.json() : [];
        const notifsJson = notifsRes.ok ? await notifsRes.json() : [];
        const meJson = meRes.ok ? await meRes.json() : null;
        const donationsJson = donationsRes.ok ? await donationsRes.json() : {};
        const disburseJson = disburseRes.ok ? await disburseRes.json() : [];

        setLoans(Array.isArray(loansJson) ? loansJson : []);
        setSupportRequests(Array.isArray(supportJson) ? supportJson : []);
        setNotifications(Array.isArray(notifsJson) ? notifsJson : []);
        setMe(meJson?.user || null);
        setDonationStats(donationsJson || {});
        setDisbursements(Array.isArray(disburseJson) ? disburseJson : []);
      } catch (err: any) {
        console.error('Dashboard fetch error', err);
      } finally {
        setLoading(false);
      }
    }

    loadAll();
    const interval = window.setInterval(loadAll, 60000);
    const refreshOnFocus = () => {
      if (!document.hidden) loadAll();
    };
    window.addEventListener('visibilitychange', refreshOnFocus);
    window.addEventListener('focus', refreshOnFocus);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('visibilitychange', refreshOnFocus);
      window.removeEventListener('focus', refreshOnFocus);
      ac.abort();
    };
  }, []);

  return (
    <div className="p-4 lg:p-6 space-y-6 pb-20 lg:pb-6">
      {/* Welcome Section */}
      <div>
        <h2 className="text-xl lg:text-2xl">Welcome back, {me?.name?.split?.(' ')[0] ?? user?.name?.split?.(' ')[0] ?? 'Guest'}!</h2>
        <p className="text-sm text-gray-600">Here's what's happening with the Alumni Fund</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <DollarSign size={20} className="text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500">Total Fund Balance</p>
            <p className="text-lg lg:text-xl mt-1" style={{ color: '#0b2a4a' }}>
              {loading ? 'Updating...' : formatCompactUGX(totalFundBalance)}
            </p>
            <Badge variant="outline" className="mt-2 text-xs text-blue-600 border-blue-600">
              {loading ? 'Syncing...' : 'Database synced'}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                <AlertCircle size={20} className="text-yellow-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500">Pending Applications</p>
            <p className="text-lg lg:text-xl mt-1">{loading ? '...' : pendingApplications}</p>
            <Button
              variant="link"
              size="sm"
              className="p-0 h-auto mt-2 text-xs"
              style={{ color: '#c79b2d' }}
              onClick={() => onNavigate('applications')}
            >
              Review Now →
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <Wallet size={20} className="text-green-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500">Total Revenue</p>
            <p className="text-lg lg:text-xl mt-1">{loading ? '...' : formatCompactUGX(totalRaised)}</p>
            <p className="text-xs text-gray-500 mt-2">{loading ? 'Updating...' : `${Number(donationStats.donationCount || 0)} confirmed donations`}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-full" style={{ backgroundColor: '#c79b2d20' }}>
                <div className="w-full h-full flex items-center justify-center">
                  <TrendingUp size={20} style={{ color: '#c79b2d' }} />
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-500">Total Disbursed</p>
            <p className="text-lg lg:text-xl mt-1">
              {loading ? 'Updating...' : formatCompactUGX(totalDisbursed)}
            </p>
            <p className="text-xs text-gray-500 mt-2">Net approved disbursements</p>
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
                <Bar dataKey="applications" fill="#0b2a4a" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base lg:text-lg">Financial Breakdown</CardTitle>
            <CardDescription>Total revenue, total expenses, and available balance</CardDescription>
          </CardHeader>
          <CardContent>
            {financialBreakdown.length ? (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="50%" height={200}>
                  <PieChart>
                    <Pie
                      data={financialBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {financialBreakdown.map((entry, index) => (
                        <Cell key={`financial-cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {financialBreakdown.map((item) => {
                    const share = totalFinancialValue > 0 ? Math.round((item.value / totalFinancialValue) * 100) : 0;
                    return (
                      <div key={item.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded" style={{ backgroundColor: item.color }} />
                          <span>{item.name}</span>
                        </div>
                        <span className="text-gray-600">{formatCompactUGX(item.value)} ({share}%)</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No financial data yet.</div>
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
              <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Clock size={16} className="text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-medium">{activity.user}</span> {activity.action}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{activity.target}</p>
                  <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
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
            <div className="p-3 rounded-lg bg-blue-50">
              <p className="text-xs text-gray-500">Total Revenue</p>
              <p className="text-lg mt-1" style={{ color: '#0b2a4a' }}>
                {loading ? '...' : formatCompactUGX(totalRaised)}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-yellow-50">
              <p className="text-xs text-gray-500">Total Expenses</p>
              <p className="text-lg mt-1" style={{ color: '#c79b2d' }}>
                {loading ? '...' : formatCompactUGX(totalDisbursed)}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-green-50">
              <p className="text-xs text-gray-500">Available Balance</p>
              <p className="text-lg mt-1 text-green-700">
                {loading ? '...' : formatCompactUGX(totalFundBalance)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
