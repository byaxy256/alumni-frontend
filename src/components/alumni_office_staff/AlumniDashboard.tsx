import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { FileText, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import type { User } from '../../App';
import { useOfficeRealtimeData } from '../office/useOfficeRealtimeData';

interface AlumniDashboardProps {
  user: User;
  onNavigate: (screen: string) => void;
}

const formatCompactUGX = (value: number): string => {
  if (value >= 1_000_000) return `UGX ${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `UGX ${(value / 1_000).toFixed(1)}K`;
  return `UGX ${value.toLocaleString()}`;
};

const getAmount = (item: Record<string, any>) =>
  Number(
    item?.disbursedAmount ??
      item?.amount_disbursed ??
      item?.approved_amount ??
      item?.amountRequested ??
      item?.amount_requested ??
      item?.amount ??
      item?.net_amount ??
      item?.original_amount ??
      0,
  );

const toDate = (item: Record<string, any>): Date | null => {
  const raw = item?.createdAt ?? item?.created_at ?? item?.updatedAt ?? item?.approved_at ?? null;
  if (!raw) return null;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export default function AlumniDashboard({ user, onNavigate }: AlumniDashboardProps) {
  const { loading, loans, supports, disbursements, notifications, users, donations, monthlyPipeline, statusBreakdown } =
    useOfficeRealtimeData();

  const pendingApplications = [...loans, ...supports].filter(
    (item) => String(item?.status || '').toLowerCase() === 'pending',
  ).length;

  const pendingFundRequests = supports.filter(
    (item) => String(item?.status || '').toLowerCase() === 'pending',
  ).length;

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const reviewedThisMonth = [...loans, ...supports].filter((item) => {
    const status = String(item?.status || '').toLowerCase();
    const date = toDate(item);
    return date && date >= startOfMonth && status !== 'pending';
  }).length;

  const approvedItems = [...loans, ...supports].filter((item) => {
    const status = String(item?.status || '').toLowerCase();
    return ['approved', 'active', 'disbursed', 'paid'].includes(status);
  });

  const approvedCount = approvedItems.length;
  const approvedAmount = approvedItems.reduce((sum, item) => sum + getAmount(item), 0);

  const grossApprovedTotal = disbursements.reduce((sum, item) => sum + Number(item?.original_amount || item?.net_amount || 0), 0);
  const automatedDeductionsTotal = disbursements.reduce((sum, item) => sum + Number(item?.deduction_amount || item?.deduction || 0), 0);
  const netPaidOutTotal = disbursements.reduce((sum, item) => sum + Number(item?.net_amount || 0), 0);
  const totalFundBalance = Math.max(grossApprovedTotal - netPaidOutTotal, 0);

  const activeDonors = Number(donations?.donorCount || 0);
  const totalAlumni = users.filter((entry) => String(entry?.role || '').toLowerCase() === 'alumni').length;

  const applicationTrend = monthlyPipeline.map((item) => ({
    month: item.month,
    applications: item.count,
  }));

  const pieData = statusBreakdown.length
    ? statusBreakdown.slice(0, 5).map((entry) => ({ name: entry.name, value: entry.value }))
    : [{ name: 'no-data', value: 1 }];

  const applicationTableRows = [...loans, ...supports]
    .slice(0, 6)
    .map((item, index) => ({
      id: item?.id || item?._id || String(index),
      applicant: item?.name || item?.applicant_name || item?.studentName || item?.student_uid || 'Applicant',
      type: item?.loanType ? 'Loan' : item?.supportType ? 'Support' : item?.category || 'Request',
      amount: getAmount(item),
    }));

  const awaitingRows = [...loans, ...supports]
    .filter((item) => String(item?.status || '').toLowerCase() === 'pending')
    .slice(0, 6)
    .map((item, index) => ({
      id: item?.id || item?._id || String(index),
      type: item?.loanType ? 'Loan' : item?.supportType ? 'Support' : item?.category || 'Request',
      applicant: item?.name || item?.applicant_name || item?.studentName || item?.student_uid || 'Applicant',
      date: toDate(item),
    }));

  const recentComments = notifications.slice(0, 6).map((item, index) => ({
    id: item?.id || item?._id || String(index),
    applicant: item?.actor || item?.user?.name || 'System',
    type: item?.target || 'Workflow',
    decision: item?.action || 'updated',
  }));

  const welcomeName = user?.name?.split?.(' ')[0] || user?.full_name?.split?.(' ')[0] || 'Team';

  return (
    <div className="min-h-screen bg-white p-4 lg:p-6">
      <div className="mb-6 rounded-xl bg-[#1a3563] text-white p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl lg:text-3xl font-semibold">Welcome back, {welcomeName}!</h2>
            <p className="text-white/80 mt-2 text-sm lg:text-base">Here is what is happening with the Alumni Fund</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="border-0 text-white rounded-lg overflow-hidden shadow-md" style={{ background: 'linear-gradient(135deg, #2f5288 0%, #355C9A 100%)' }}>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3"><div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center"><FileText size={20} /></div><span className="text-sm font-medium">Pending Applications</span></div>
            <p className="text-3xl lg:text-4xl font-bold">{loading ? '...' : pendingApplications}</p>
            <Button variant="ghost" size="sm" className="p-0 h-auto mt-3 text-xs text-white/90 hover:text-white" onClick={() => onNavigate('applications')}>Review Now →</Button>
          </CardContent>
        </Card>

        <Card className="border-0 text-white rounded-lg overflow-hidden shadow-md" style={{ background: 'linear-gradient(135deg, #742033 0%, #8A1F3A 100%)' }}>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3"><div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center"><AlertCircle size={20} /></div><span className="text-sm font-medium">Pending Fund Requests</span></div>
            <p className="text-3xl lg:text-4xl font-bold">{loading ? '...' : pendingFundRequests}</p>
            <Button variant="ghost" size="sm" className="p-0 h-auto mt-3 text-xs text-white/90 hover:text-white" onClick={() => onNavigate('request-funds')}>Review Now →</Button>
          </CardContent>
        </Card>

        <Card className="border-0 text-white rounded-lg overflow-hidden shadow-md" style={{ background: 'linear-gradient(135deg, #b1882a 0%, #C79A2B 100%)' }}>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3"><div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center"><CheckCircle size={20} /></div><span className="text-sm font-medium">Reviewed This Month</span></div>
            <p className="text-3xl lg:text-4xl font-bold">{loading ? '...' : reviewedThisMonth}</p>
          </CardContent>
        </Card>

        <Card className="border-0 text-white rounded-lg overflow-hidden shadow-md" style={{ background: 'linear-gradient(135deg, #356642 0%, #3F7A4A 100%)' }}>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3"><div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center"><TrendingUp size={20} /></div><span className="text-sm font-medium">Total Approved</span></div>
            <p className="text-3xl lg:text-4xl font-bold">{loading ? '...' : approvedCount}</p>
            <p className="text-xs text-white/80 mt-2">{loading ? '...' : formatCompactUGX(approvedAmount)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <Card className="border border-slate-200 rounded-lg shadow-sm"><CardContent className="p-4"><p className="text-xs text-muted-foreground mb-2">Total Approved (Before Deductions)</p><p className="text-2xl font-bold text-[#0b2a4a]">{loading ? '...' : formatCompactUGX(grossApprovedTotal)}</p><p className="text-xs text-muted-foreground mt-2">Approved principal before automated deductions.</p></CardContent></Card>
          <Card className="border border-slate-200 rounded-lg shadow-sm"><CardContent className="p-4"><p className="text-xs text-muted-foreground mb-2">Automated Deductions</p><p className="text-2xl font-bold text-[#8A1F3A]">{loading ? '...' : formatCompactUGX(automatedDeductionsTotal)}</p><p className="text-xs text-muted-foreground mt-2">Total deducted before payout.</p></CardContent></Card>
        </div>
        <Card className="border border-slate-200 rounded-lg shadow-sm"><CardContent className="p-4"><p className="text-xs text-muted-foreground mb-2">Queue Value</p><p className="text-2xl font-bold text-[#0b2a4a]">{loading ? '...' : formatCompactUGX(totalFundBalance)}</p><p className="text-xs text-muted-foreground mt-2">Available queue value after deductions.</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <Card className="border border-slate-200 rounded-lg shadow-sm">
          <CardHeader><CardTitle className="text-lg font-semibold">Application Trends</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={applicationTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="applications" stroke="#355C9A" strokeWidth={2} dot={{ fill: '#355C9A', r: 5 }} activeDot={{ r: 7 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 rounded-lg shadow-sm">
          <CardHeader><CardTitle className="text-lg font-semibold">Queue Value Distribution</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="45%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2} dataKey="value">
                    {pieData.map((_, index) => (
                      <Cell key={index} fill={['#3b82f6', '#f97316', '#ef4444', '#22c55e', '#8b5cf6'][index % 5]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-3">
                {pieData.map((item, index) => (
                  <div key={`${item.name}-${index}`} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ['#3b82f6', '#f97316', '#ef4444', '#22c55e', '#8b5cf6'][index % 5] }} />
                    <span className="text-sm capitalize">{item.name}</span>
                  </div>
                ))}
                <div className="pt-2 text-xs text-muted-foreground">Active donors: {activeDonors} • Alumni: {totalAlumni}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border border-slate-200 rounded-lg shadow-sm">
          <CardHeader className="flex items-center justify-between pb-3"><CardTitle className="text-lg font-semibold">Application Trends</CardTitle><Button variant="ghost" size="sm" className="text-primary text-sm">View All →</Button></CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200"><tr className="text-muted-foreground"><th className="text-left py-2 px-2">Applicant</th><th className="text-left py-2 px-2">Type</th><th className="text-left py-2 px-2">Requested Amount</th></tr></thead>
              <tbody>
                {applicationTableRows.map((row) => (
                  <tr key={row.id} className="border-b border-slate-200 hover:bg-slate-50"><td className="py-3 px-2">{row.applicant}</td><td className="py-3 px-2">{row.type}</td><td className="py-3 px-2">{formatCompactUGX(row.amount)}</td></tr>
                ))}
                {!applicationTableRows.length && <tr><td className="py-3 px-2 text-muted-foreground" colSpan={3}>No applications available.</td></tr>}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 rounded-lg shadow-sm">
          <CardHeader className="flex items-center justify-between pb-3"><CardTitle className="text-lg font-semibold">Requests Awaiting Review</CardTitle><Button variant="ghost" size="sm" className="text-primary text-sm">All →</Button></CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200"><tr className="text-muted-foreground"><th className="text-left py-2 px-2">Type</th><th className="text-left py-2 px-2">Applicant</th><th className="text-left py-2 px-2">Date</th></tr></thead>
              <tbody>
                {awaitingRows.map((row) => (
                  <tr key={row.id} className="border-b border-slate-200 hover:bg-slate-50"><td className="py-3 px-2">{row.type}</td><td className="py-3 px-2">{row.applicant}</td><td className="py-3 px-2">{row.date ? row.date.toLocaleDateString() : '—'}</td></tr>
                ))}
                {!awaitingRows.length && <tr><td className="py-3 px-2 text-muted-foreground" colSpan={3}>No pending requests.</td></tr>}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-slate-200 rounded-lg shadow-sm mt-4">
        <CardHeader className="flex items-center justify-between pb-3"><CardTitle className="text-lg font-semibold">Recent Comments</CardTitle><Button variant="ghost" size="sm" className="text-primary text-sm">View All →</Button></CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200"><tr className="text-muted-foreground"><th className="text-left py-2 px-2">Applicant Name</th><th className="text-left py-2 px-2">Type</th><th className="text-left py-2 px-2">Decision</th></tr></thead>
            <tbody>
              {recentComments.map((row) => (
                <tr key={row.id} className="border-b border-slate-200 hover:bg-slate-50"><td className="py-3 px-2">{row.applicant}</td><td className="py-3 px-2">{row.type}</td><td className="py-3 px-2"><span className="px-2 py-1 bg-slate-100 text-slate-800 rounded text-xs font-medium capitalize">{row.decision}</span></td></tr>
              ))}
              {!recentComments.length && <tr><td className="py-3 px-2 text-muted-foreground" colSpan={3}>No recent comments.</td></tr>}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
