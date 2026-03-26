import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { TrendingUp, Users, Award, Zap } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { UcuBadgeLogo } from '../UcuBadgeLogo';
import { useOfficeRealtimeData } from './useOfficeRealtimeData';

const colors = ['#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6'];

const formatCurrency = (amount: number) => `UGX ${(amount / 1_000_000).toFixed(1)}M`;

export function PresidentDashboard() {
  const { loading, loans, supports, disbursements, users, monthlyPipeline, statusBreakdown } = useOfficeRealtimeData();

  const totalRequested = monthlyPipeline.reduce((sum, item) => sum + item.requested, 0);
  const totalDisbursed = monthlyPipeline.reduce((sum, item) => sum + item.disbursed, 0);
  const beneficiaries = new Set(
    disbursements
      .map((d) => d?.student_id || d?.student_uid || d?._id)
      .filter(Boolean),
  ).size;
  const pendingCases = [...loans, ...supports].filter((item) => String(item?.status || '').toLowerCase() === 'pending').length;

  const utilizationPct = totalRequested > 0 ? Math.min(100, Math.round((totalDisbursed / totalRequested) * 100)) : 0;
  const readinessPct = Math.max(0, 100 - pendingCases);

  const performanceSeries = monthlyPipeline.map((item) => ({
    month: item.month,
    beneficiaries: item.count,
    utilization: item.requested > 0 ? Number(((item.disbursed / item.requested) * 100).toFixed(1)) : 0,
    throughput: item.requested,
  }));

  const impactData = [
    { name: 'Loans', value: loans.length },
    { name: 'Support', value: supports.length },
    { name: 'Disbursed', value: disbursements.length },
    { name: 'Pending', value: pendingCases },
  ].filter((item) => item.value > 0);

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-r from-[#742033] to-[#8A1F3A] text-white p-6 rounded-b-3xl shadow-lg mb-6">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <UcuBadgeLogo className="h-9 w-9" imageClassName="object-contain p-0.5" />
          <div>
            <h2 className="text-2xl font-semibold">President Dashboard</h2>
            <p className="text-sm opacity-80 mt-1">Executive real-time organization performance</p>
          </div>
        </div>
      </div>

      <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground flex items-center gap-2"><Users className="w-4 h-4" />Active Beneficiaries</p><p className="text-2xl font-bold text-blue-600">{loading ? '...' : beneficiaries}</p></CardContent></Card>
          <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground flex items-center gap-2"><Zap className="w-4 h-4" />Fund Utilization</p><p className="text-2xl font-bold text-green-600">{loading ? '...' : `${utilizationPct}%`}</p></CardContent></Card>
          <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground flex items-center gap-2"><Award className="w-4 h-4" />Readiness</p><p className="text-2xl font-bold text-purple-600">{loading ? '...' : `${readinessPct}%`}</p></CardContent></Card>
          <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground flex items-center gap-2"><TrendingUp className="w-4 h-4" />Total Disbursed</p><p className="text-2xl font-bold text-emerald-600">{loading ? '...' : formatCurrency(totalDisbursed)}</p></CardContent></Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>Monthly Executive Trend</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={performanceSeries}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="beneficiaries" stroke="#3b82f6" strokeWidth={2} name="Case Count" />
                  <Line yAxisId="right" type="monotone" dataKey="utilization" stroke="#10b981" strokeWidth={2} name="Utilization %" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Impact Distribution</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie data={impactData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={105} label>
                    {impactData.map((entry, index) => (
                      <Cell key={`${entry.name}-${index}`} fill={colors[index % colors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Executive Snapshot</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="text-center p-3 bg-slate-50 rounded-lg"><p className="text-2xl font-bold">{beneficiaries}</p><p className="text-xs text-muted-foreground">Beneficiaries</p></div>
              <div className="text-center p-3 bg-slate-50 rounded-lg"><p className="text-2xl font-bold">{users.length}</p><p className="text-xs text-muted-foreground">Users</p></div>
              <div className="text-center p-3 bg-slate-50 rounded-lg"><p className="text-2xl font-bold">{statusBreakdown.length}</p><p className="text-xs text-muted-foreground">Status Types</p></div>
              <div className="text-center p-3 bg-slate-50 rounded-lg"><p className="text-2xl font-bold">{formatCurrency(totalRequested)}</p><p className="text-xs text-muted-foreground">Requested Value</p></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
