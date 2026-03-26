import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { CheckCircle, AlertCircle, Users, Award } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { UcuBadgeLogo } from '../UcuBadgeLogo';
import { useOfficeRealtimeData } from './useOfficeRealtimeData';

const colors = ['#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

export function SecretaryAcademicsDashboard() {
  const { loading, loans, supports, users, monthlyPipeline, statusBreakdown } = useOfficeRealtimeData();

  const verifiedCount = [...loans, ...supports].filter((r) => String(r?.status || '').toLowerCase() === 'approved').length;
  const pendingCount = [...loans, ...supports].filter((r) => String(r?.status || '').toLowerCase() === 'pending').length;
  const mentorshipCount = users.filter((u) => String(u?.role || '').toLowerCase().includes('mentor')).length;
  const eligibilityRate = verifiedCount + pendingCount > 0 ? ((verifiedCount / (verifiedCount + pendingCount)) * 100).toFixed(1) : '0.0';

  const recentReviews = [...loans, ...supports]
    .slice(0, 10)
    .map((item, idx) => ({
      id: item?.id || item?._id || String(idx),
      student: item?.name || item?.studentName || item?.student_uid || 'Student',
      status: String(item?.status || 'pending'),
      date: item?.createdAt || item?.created_at || null,
      amount: Number(item?.amountRequested ?? item?.amount_requested ?? item?.amount ?? 0),
    }));

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-r from-[#06b6d4] to-[#0891b2] text-white p-6 rounded-b-3xl shadow-lg mb-6">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <UcuBadgeLogo className="h-9 w-9" imageClassName="object-contain p-0.5" />
          <div>
            <h2 className="text-2xl font-semibold">Secretary for Academics Dashboard</h2>
            <p className="text-sm opacity-80 mt-1">Live academic verification and mentorship operations</p>
          </div>
        </div>
      </div>

      <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground flex items-center gap-2"><CheckCircle className="w-4 h-4" />Verified</p><p className="text-2xl font-bold text-cyan-600">{loading ? '...' : verifiedCount}</p></CardContent></Card>
          <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground flex items-center gap-2"><AlertCircle className="w-4 h-4" />Pending</p><p className="text-2xl font-bold text-amber-600">{loading ? '...' : pendingCount}</p></CardContent></Card>
          <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground flex items-center gap-2"><Users className="w-4 h-4" />Mentors</p><p className="text-2xl font-bold text-purple-600">{loading ? '...' : mentorshipCount}</p></CardContent></Card>
          <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground flex items-center gap-2"><Award className="w-4 h-4" />Eligibility Rate</p><p className="text-2xl font-bold text-teal-600">{loading ? '...' : `${eligibilityRate}%`}</p></CardContent></Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>Verification Pipeline</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyPipeline}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#06b6d4" name="Cases" />
                  <Bar dataKey="requested" fill="#8b5cf6" name="Requested" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Status Mix</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={statusBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={95} label>
                    {statusBreakdown.map((entry, index) => (
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
          <CardHeader><CardTitle>Recent Academic Reviews</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {recentReviews.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-semibold">{item.student}</p>
                  <p className="text-xs text-muted-foreground">Status: {item.status}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">UGX {item.amount.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{item.date ? new Date(item.date).toLocaleDateString() : 'recent'}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
