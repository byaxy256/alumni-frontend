import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { TrendingUp, Users, FolderOpen, Zap } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { UcuBadgeLogo } from '../UcuBadgeLogo';
import { useOfficeRealtimeData } from './useOfficeRealtimeData';

export function VicePresidentDashboard() {
  const { loading, loans, supports, disbursements, users, monthlyPipeline } = useOfficeRealtimeData();

  const activeInitiatives = monthlyPipeline.reduce((sum, month) => sum + month.count, 0);
  const onTrack = disbursements.length;
  const atRisk = [...loans, ...supports].filter((r) => String(r?.status || '').toLowerCase() === 'pending').length;
  const teamMembers = users.filter((u) => String(u?.role || '').toLowerCase().includes('office')).length;

  const healthByMonth = monthlyPipeline.map((item) => ({
    month: item.month,
    onTrack: item.disbursed > 0 ? Math.round((item.disbursed / Math.max(item.requested, 1)) * 100) : 0,
    atRisk: item.count,
  }));

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-r from-[#6d28d9] to-[#7c3aed] text-white p-6 rounded-b-3xl shadow-lg mb-6">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <UcuBadgeLogo className="h-9 w-9" imageClassName="object-contain p-0.5" />
          <div>
            <h2 className="text-2xl font-semibold">Vice President Dashboard</h2>
            <p className="text-sm opacity-80 mt-1">Real-time executive oversight of operations and outcomes</p>
          </div>
        </div>
      </div>

      <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground flex items-center gap-2"><FolderOpen className="w-4 h-4" />Active Cases</p><p className="text-2xl font-bold text-purple-600">{loading ? '...' : activeInitiatives}</p></CardContent></Card>
          <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground flex items-center gap-2"><TrendingUp className="w-4 h-4" />Disbursements</p><p className="text-2xl font-bold text-green-600">{loading ? '...' : onTrack}</p></CardContent></Card>
          <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground flex items-center gap-2"><Zap className="w-4 h-4" />Pending Items</p><p className="text-2xl font-bold text-amber-600">{loading ? '...' : atRisk}</p></CardContent></Card>
          <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground flex items-center gap-2"><Users className="w-4 h-4" />Office Team</p><p className="text-2xl font-bold text-blue-600">{loading ? '...' : teamMembers}</p></CardContent></Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>Monthly Request vs Disbursement</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyPipeline}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="requested" fill="#6d28d9" name="Requested" />
                  <Bar dataKey="disbursed" fill="#10b981" name="Disbursed" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Operational Health Trend</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={healthByMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="onTrack" stroke="#10b981" strokeWidth={2} name="Execution %" />
                  <Line type="monotone" dataKey="atRisk" stroke="#f59e0b" strokeWidth={2} name="Pending Count" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
