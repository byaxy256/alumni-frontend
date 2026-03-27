import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { CheckCircle, AlertCircle, Calendar, Users } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { UcuBadgeLogo } from '../UcuBadgeLogo';
import { useOfficeRealtimeData } from './useOfficeRealtimeData';

export function ProjectsManagerDashboard() {
  const { loading, loans, supports, disbursements, users, monthlyPipeline } = useOfficeRealtimeData();

  const activeProjects = [...loans, ...supports].length;
  const completed = disbursements.length;
  const atRisk = [...loans, ...supports].filter((r) => String(r?.status || '').toLowerCase() === 'pending').length;
  const teamSize = users.filter((u) => String(u?.role || '').toLowerCase().includes('office')).length;

  const budgetSeries = monthlyPipeline.map((item) => ({
    month: item.month,
    allocated: item.requested,
    spent: item.disbursed,
  }));

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-r from-[#14b8a6] to-[#0d9488] text-white p-6 rounded-b-3xl shadow-lg mb-6">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <UcuBadgeLogo className="h-9 w-9" imageClassName="object-contain p-0.5" />
          <div>
            <h2 className="text-2xl font-semibold">Projects Manager Dashboard</h2>
            <p className="text-sm opacity-80 mt-1">Live project execution and resource metrics</p>
          </div>
        </div>
      </div>

      <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground flex items-center gap-2"><Calendar className="w-4 h-4" />Active Cases</p><p className="text-2xl font-bold text-teal-600">{loading ? '...' : activeProjects}</p></CardContent></Card>
          <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground flex items-center gap-2"><CheckCircle className="w-4 h-4" />Completed</p><p className="text-2xl font-bold text-green-600">{loading ? '...' : completed}</p></CardContent></Card>
          <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground flex items-center gap-2"><AlertCircle className="w-4 h-4" />Pending</p><p className="text-2xl font-bold text-amber-600">{loading ? '...' : atRisk}</p></CardContent></Card>
          <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground flex items-center gap-2"><Users className="w-4 h-4" />Team Size</p><p className="text-2xl font-bold text-blue-600">{loading ? '...' : teamSize}</p></CardContent></Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>Execution Throughput</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyPipeline}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#14b8a6" name="Case Count" />
                  <Bar dataKey="disbursed" fill="#3b82f6" name="Disbursed" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Budget Utilization</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={budgetSeries}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="allocated" stroke="#0d9488" strokeWidth={2} name="Requested" />
                  <Line type="monotone" dataKey="spent" stroke="#10b981" strokeWidth={2} name="Spent" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
