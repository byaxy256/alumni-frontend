import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { FileText, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
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
  amount_disbursed?: number;
  approved_amount?: number;
  amount_requested?: number;
  status?: string;
  createdAt?: string;
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
};

type DisbursementItem = {
  id?: string;
  student_uid?: string;
  net_amount?: number;
  original_amount?: number;
  deduction?: number;
  approved_at?: string;
  created_at?: string;
};

// Helper function to format numbers
function formatCompactUGX(value: number): string {
  if (value >= 1_000_000) {
    return 'UGX ' + (value / 1_000_000).toFixed(1) + 'M';
  } else if (value >= 1_000) {
    return 'UGX ' + (value / 1_000).toFixed(1) + 'K';
  }
  return 'UGX ' + value.toLocaleString();
}

export default function AlumniDashboard({ user, onNavigate }: AlumniDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [supportRequests, setSupportRequests] = useState<SupportRequest[]>([]);
  const [disbursements, setDisbursements] = useState<DisbursementItem[]>([]);
  const [me, setMe] = useState<User | null>(null);

  // Derived metrics
  const pendingApplications =
    supportRequests.filter(sr => (sr.status ?? '').toLowerCase() === 'pending').length +
    loans.filter(l => (l.status ?? '').toLowerCase() === 'pending').length;



  const totalDisbursed = disbursements.reduce((sum, d) => sum + Number(d.net_amount || 0), 0);
  const grossApprovedTotal = disbursements.reduce((sum, d) => sum + Number(d.original_amount || d.net_amount || 0), 0);
  const automatedDeductionsTotal = disbursements.reduce((sum, d) => sum + Number(d.deduction || 0), 0);
  const totalFundBalance = grossApprovedTotal - totalDisbursed;

  // Monthly applications data for chart
  const monthlyApplications = [
    { month: 'June', applications: 8 },
    { month: 'Pending', applications: 12 },
    { month: 'Approved', applications: 14 },
    { month: 'Rejected', applications: 5 },
    { month: 'November', applications: 10 },
  ];



  useEffect(() => {
    let cancelled = false;
    const ac = new AbortController();
    const token = localStorage.getItem('token') || '';
    const headers = { Authorization: `Bearer ${token}` };

    async function loadAll(silent = false) {
      if (!silent) setLoading(true);
      try {
        const [loansRes, supportRes, meRes, disburseRes] = await Promise.all([
          fetch(`${API_BASE}/loans`, { headers, signal: ac.signal, cache: 'no-store' }),
          fetch(`${API_BASE}/support`, { headers, signal: ac.signal, cache: 'no-store' }),
          fetch(`${API_BASE}/auth/me`, { headers, signal: ac.signal, cache: 'no-store' }),
          fetch(`${API_BASE}/disburse`, { headers, signal: ac.signal, cache: 'no-store' }),
        ]);

        const loansJson = loansRes.ok ? await loansRes.json() : [];
        const supportJson = supportRes.ok ? await supportRes.json() : [];
        const meJson = meRes.ok ? await meRes.json() : null;
        const disburseJson = disburseRes.ok ? await disburseRes.json() : [];

        if (cancelled) return;
        setLoans(Array.isArray(loansJson) ? loansJson : []);
        setSupportRequests(Array.isArray(supportJson) ? supportJson : []);
        setMe(meJson?.user || null);
        setDisbursements(Array.isArray(disburseJson) ? disburseJson : []);
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
    <div className="min-h-screen bg-white p-4 lg:p-6">
      {/* Welcome Section */}
      <div className="mb-6 rounded-xl bg-[#1a3563] text-white p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl lg:text-3xl font-semibold">Welcome back, {me?.name?.split?.(' ')[0] ?? user?.name?.split?.(' ')[0] ?? 'Ronald'}!</h2>
            <p className="text-white/80 mt-2 text-sm lg:text-base">Here's what's happening with the Alumni Fund</p>
          </div>
        </div>
      </div>

      {/* Key Stat Cards - Matching screenshot exactly */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Pending Applications */}
        <Card className="border-0 text-white rounded-lg overflow-hidden shadow-md" style={{ background: 'linear-gradient(135deg, #2f5288 0%, #355C9A 100%)' }}>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                <FileText size={20} />
              </div>
              <span className="text-sm font-medium">Pending Applications</span>
            </div>
            <p className="text-3xl lg:text-4xl font-bold">{loading ? '...' : pendingApplications}</p>
            <Button
              variant="ghost"
              size="sm"
              className="p-0 h-auto mt-3 text-xs text-white/90 hover:text-white"
              onClick={() => onNavigate('applications')}
            >
              Review Now →
            </Button>
          </CardContent>
        </Card>

        {/* Pending Fund Requests */}
        <Card className="border-0 text-white rounded-lg overflow-hidden shadow-md" style={{ background: 'linear-gradient(135deg, #742033 0%, #8A1F3A 100%)' }}>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                <AlertCircle size={20} />
              </div>
              <span className="text-sm font-medium">Pending Fund Requests</span>
            </div>
            <p className="text-3xl lg:text-4xl font-bold">{loading ? '...' : supportRequests.filter(sr => (sr.status ?? '').toLowerCase() === 'pending').length}</p>
            <Button
              variant="ghost"
              size="sm"
              className="p-0 h-auto mt-3 text-xs text-white/90 hover:text-white"
              onClick={() => onNavigate('fund-request')}
            >
              Review Now →
            </Button>
          </CardContent>
        </Card>

        {/* Reviewed This Month */}
        <Card className="border-0 text-white rounded-lg overflow-hidden shadow-md" style={{ background: 'linear-gradient(135deg, #b1882a 0%, #C79A2B 100%)' }}>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                <CheckCircle size={20} />
              </div>
              <span className="text-sm font-medium">Reviewed This Month</span>
            </div>
            <p className="text-3xl lg:text-4xl font-bold">14</p>
          </CardContent>
        </Card>

        {/* Total Approved */}
        <Card className="border-0 text-white rounded-lg overflow-hidden shadow-md" style={{ background: 'linear-gradient(135deg, #356642 0%, #3F7A4A 100%)' }}>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                <TrendingUp size={20} />
              </div>
              <span className="text-sm font-medium">Total Approved</span>
            </div>
            <p className="text-3xl lg:text-4xl font-bold">10</p>
            <p className="text-xs text-white/80 mt-2">UGX 430,000</p>
          </CardContent>
        </Card>
      </div>

      {/* Accountability totals - Match screenshot styling */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <Card className="border border-slate-200 rounded-lg shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-2">Total Approved (Before Deductions)</p>
              <p className="text-2xl font-bold text-[#0b2a4a]">{loading ? '...' : formatCompactUGX(grossApprovedTotal)}</p>
              <p className="text-xs text-muted-foreground mt-2">Approved principal before any automated deductions.</p>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 rounded-lg shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-2">Automated Deductions</p>
              <p className="text-2xl font-bold text-[#8A1F3A]">{loading ? '...' : formatCompactUGX(automatedDeductionsTotal)}</p>
              <p className="text-xs text-muted-foreground mt-2">Total amount automatically deducted before payout.</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border border-slate-200 rounded-lg shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-2">Queue Value</p>
            <p className="text-2xl font-bold text-[#0b2a4a]">{loading ? '...' : formatCompactUGX(totalFundBalance)}</p>
            <p className="text-xs text-muted-foreground mt-2">Actual money available in the queue after deductions.</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Application Trends */}
        <Card className="border border-slate-200 rounded-lg shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Application Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={monthlyApplications}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="applications"
                  stroke="#355C9A"
                  strokeWidth={2}
                  dot={{ fill: '#355C9A', r: 5 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Queue Value Pie Chart */}
        <Card className="border border-slate-200 rounded-lg shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Queue Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="40%" height={200}>
                <PieChart>
                  <Pie
                    data={[
                      { value: Math.round(totalFundBalance * 0.6) },
                      { value: Math.round(totalFundBalance * 0.25) },
                      { value: Math.round(totalFundBalance * 0.15) },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    <Cell fill="#3b82f6" />
                    <Cell fill="#f97316" />
                    <Cell fill="#ef4444" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#3b82f6]" />
                  <span className="text-sm">Active</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#f97316]" />
                  <span className="text-sm">Pending</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#ef4444]" />
                  <span className="text-sm">Hold</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Application Trends Table */}
        <Card className="border border-slate-200 rounded-lg shadow-sm">
          <CardHeader className="flex items-center justify-between pb-3">
            <CardTitle className="text-lg font-semibold">Application Trends</CardTitle>
            <Button variant="ghost" size="sm" className="text-primary text-sm">
              View All →
            </Button>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200">
                <tr className="text-muted-foreground">
                  <th className="text-left py-2 px-2">Applicant</th>
                  <th className="text-left py-2 px-2">Type</th>
                  <th className="text-left py-2 px-2">Requested Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-200 hover:bg-slate-50">
                  <td className="py-3 px-2">Lydia Kato</td>
                  <td className="py-3 px-2">Loan</td>
                  <td className="py-3 px-2">UGX 150,000</td>
                </tr>
                <tr className="border-b border-slate-200 hover:bg-slate-50">
                  <td className="py-3 px-2">Lydia Kato</td>
                  <td className="py-3 px-2">Support & Benefit</td>
                  <td className="py-3 px-2">UGX 200,000</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="py-3 px-2">Jonathan Sancha</td>
                  <td className="py-3 px-2">Fund Request</td>
                  <td className="py-3 px-2">UGX 450,000</td>
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Requests Awaiting Review */}
        <Card className="border border-slate-200 rounded-lg shadow-sm">
          <CardHeader className="flex items-center justify-between pb-3">
            <CardTitle className="text-lg font-semibold">Requests Awaiting Review</CardTitle>
            <Button variant="ghost" size="sm" className="text-primary text-sm">
              All →
            </Button>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200">
                <tr className="text-muted-foreground">
                  <th className="text-left py-2 px-2">Type</th>
                  <th className="text-left py-2 px-2">Applicant</th>
                  <th className="text-left py-2 px-2">Date</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-200 hover:bg-slate-50">
                  <td className="py-3 px-2">Fund Request</td>
                  <td className="py-3 px-2">Lydia Kato</td>
                  <td className="py-3 px-2">8 May 2021</td>
                </tr>
                <tr className="border-b border-slate-200 hover:bg-slate-50">
                  <td className="py-3 px-2">Loan</td>
                  <td className="py-3 px-2">Marta Nsubuga</td>
                  <td className="py-3 px-2">6 May 2021</td>
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      {/* Recent Comments Section */}
      <Card className="border border-slate-200 rounded-lg shadow-sm mt-4">
        <CardHeader className="flex items-center justify-between pb-3">
          <CardTitle className="text-lg font-semibold">Recent Comments</CardTitle>
          <Button variant="ghost" size="sm" className="text-primary text-sm">
            View All →
          </Button>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200">
              <tr className="text-muted-foreground">
                <th className="text-left py-2 px-2">Applicant Name</th>
                <th className="text-left py-2 px-2">Type</th>
                <th className="text-left py-2 px-2">Decision</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-200 hover:bg-slate-50">
                <td className="py-3 px-2">Lydia Kato</td>
                <td className="py-3 px-2">Loan</td>
                <td className="py-3 px-2">
                  <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs font-medium">Pending</span>
                </td>
              </tr>
              <tr className="border-b border-slate-200 hover:bg-slate-50">
                <td className="py-3 px-2">Grace Mugisha</td>
                <td className="py-3 px-2">Support</td>
                <td className="py-3 px-2">
                  <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">Rejected</span>
                </td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="py-3 px-2">Daniel Kimathi</td>
                <td className="py-3 px-2">Loan</td>
                <td className="py-3 px-2">
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">Approved</span>
                </td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
