import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { DollarSign, Users, FileText, TrendingUp, AlertCircle, Clock } from 'lucide-react';
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

export default function AlumniDashboard({ user, onNavigate }: AlumniDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [supportRequests, setSupportRequests] = useState<SupportRequest[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [me, setMe] = useState<User | null>(null);

  // Derived metrics
  const pendingApplications =
    supportRequests.filter(sr => (sr.status ?? '').toLowerCase() === 'pending').length +
    loans.filter(l => (l.status ?? '').toLowerCase() === 'pending').length;

  // Treat approved loans as active for dashboard purposes
  const activeLoans = loans.filter(l => {
    const status = (l.status ?? '').toLowerCase();
    return status === 'active' || status === 'approved';
  }).length;
  const totalDisbursed = loans.reduce(
    (s, l) => s + Number((l as any).disbursedAmount ?? (l as any).disbursed_amount ?? l.amount ?? 0),
    0
  );

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

  // income breakdown best-effort: group by source field if available in supportRequests/loans
  const incomeBreakdown = (() => {
    // fallback static when no data
    if (!supportRequests.length && !loans.length) {
      return [
        { name: 'Graduand Fees', value: 45, color: '#0b2a4a' },
        { name: 'Donations', value: 33, color: '#c79b2d' },
        { name: 'Events', value: 32, color: '#3b82f6' },
        { name: 'Merchandise', value: 15, color: '#10b981' },
      ];
    }
    // naive distribution: count support requests by simple heuristics
    const counts: Record<string, number> = { graduand: 0, donations: 0, events: 0, merch: 0 };
    supportRequests.forEach(r => {
      const details = JSON.stringify(r).toLowerCase();
      if (details.includes('graduand') || details.includes('fee')) counts.graduand += Number(r.amountRequested ?? 0);
      else if (details.includes('donation')) counts.donations += Number(r.amountRequested ?? 0);
      else if (details.includes('event')) counts.events += Number(r.amountRequested ?? 0);
      else counts.merch += Number(r.amountRequested ?? 0);
    });
    // if counts are zero fallback to loan-based totals
    const total =
      counts.graduand + counts.donations + counts.events + counts.merch ||
      loans.reduce((s, l) => s + Number(l.amount ?? l.disbursedAmount ?? 0), 0);

    if (!total) {
      return [
        { name: 'Graduand Fees', value: 45, color: '#0b2a4a' },
        { name: 'Donations', value: 33, color: '#c79b2d' },
        { name: 'Events', value: 32, color: '#3b82f6' },
        { name: 'Merchandise', value: 15, color: '#10b981' },
      ];
    }

    return [
      { name: 'Graduand Fees', value: Math.round((counts.graduand / total) * 100) || 10, color: '#0b2a4a' },
      { name: 'Donations', value: Math.round((counts.donations / total) * 100) || 10, color: '#c79b2d' },
      { name: 'Events', value: Math.round((counts.events / total) * 100) || 10, color: '#3b82f6' },
      { name: 'Merchandise', value: Math.round((counts.merch / total) * 100) || 10, color: '#10b981' },
    ];
  })();

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

  console.log('AlumniDashboard loading with token:', token ? 'present' : 'missing');

  async function loadAll() {
    setLoading(true);
    try {
      const [loansRes, supportRes, notifsRes, meRes] = await Promise.all([
        fetch(`${API_BASE}/loans`, { headers, signal: ac.signal }),
        fetch(`${API_BASE}/support`, { headers, signal: ac.signal }),
        fetch(`${API_BASE}/notifications/mine`, { headers, signal: ac.signal }),
        fetch(`${API_BASE}/auth/me`, { headers, signal: ac.signal }),
      ]);
      console.log('API Responses:', {
        loans: loansRes.status,
        support: supportRes.status,
        notifs: notifsRes.status,
        me: meRes.status,
      });

      const loansJson = loansRes.ok ? await loansRes.json() : [];
      const supportJson = supportRes.ok ? await supportRes.json() : [];
      const notifsJson = notifsRes.ok ? await notifsRes.json() : [];
      const meJson = meRes.ok ? await meRes.json() : null;
      console.log('Fetched data:', {
        loans: Array.isArray(loansJson) ? loansJson.length : 0,
        support: Array.isArray(supportJson) ? supportJson.length : 0,
        notifs: Array.isArray(notifsJson) ? notifsJson.length : 0,
      });

      // Store all loans and support requests (don't filter - we need all data for charts and calculations)
      setLoans(Array.isArray(loansJson) ? loansJson : []);
      setSupportRequests(Array.isArray(supportJson) ? supportJson : []);
      setNotifications(Array.isArray(notifsJson) ? notifsJson : []);
      setMe(meJson || null);
    } catch (err: any) {
      console.error('Dashboard fetch error', err);
    } finally {
      setLoading(false);
    }
  }

  loadAll();
  return () => ac.abort();
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
              UGX {(totalDisbursed / 1000000).toFixed(1)}M
            </p>
            <Badge variant="outline" className="mt-2 text-xs text-green-600 border-green-600">
              {loading ? 'Updating...' : '+8.5% this month'}
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
                <Users size={20} className="text-green-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500">Active Loans</p>
            <p className="text-lg lg:text-xl mt-1">{loading ? '...' : activeLoans}</p>
            <p className="text-xs text-gray-500 mt-2">Students supported</p>
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
              UGX {(totalDisbursed / 1000000).toFixed(0)}M
            </p>
            <p className="text-xs text-gray-500 mt-2">Since inception</p>
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
            <CardTitle className="text-base lg:text-lg">Income Sources</CardTitle>
            <CardDescription>Distribution by category (best-effort)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="50%" height={200}>
                <PieChart>
                  <Pie
                    data={incomeBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {incomeBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {incomeBreakdown.map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded" style={{ backgroundColor: item.color }}></div>
                      <span>{item.name}</span>
                    </div>
                    <span className="text-gray-600">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
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

      {/* Income Breakdown Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base lg:text-lg">Fund Sources Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div>
                <p className="text-sm">Graduand Fees</p>
                <p className="text-xs text-gray-600">Annual registration fees</p>
              </div>
              <p className="text-base" style={{ color: '#0b2a4a' }}>{Math.round((incomeBreakdown[0]?.value ?? 45))}%</p>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div>
                <p className="text-sm">Donations</p>
                <p className="text-xs text-gray-600">Alumni contributions</p>
              </div>
              <p className="text-base" style={{ color: '#c79b2d' }}>{Math.round((incomeBreakdown[1]?.value ?? 33))}%</p>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div>
                <p className="text-sm">Event Revenue</p>
                <p className="text-xs text-gray-600">Conferences & gatherings</p>
              </div>
              <p className="text-base text-green-600">{Math.round((incomeBreakdown[2]?.value ?? 32))}%</p>
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <div>
                <p className="text-sm">Merchandise Sales</p>
                <p className="text-xs text-gray-600">Branded products</p>
              </div>
              <p className="text-base text-purple-600">{Math.round((incomeBreakdown[3]?.value ?? 15))}%</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
