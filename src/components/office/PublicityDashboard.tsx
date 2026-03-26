import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Eye, MessageCircle, Share2, Calendar } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { UcuBadgeLogo } from '../UcuBadgeLogo';
import { useOfficeRealtimeData } from './useOfficeRealtimeData';

const chartColors = ['#ec4899', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b'];

export function PublicityDashboard() {
  const { loading, notifications, monthlyPipeline, statusBreakdown, users } = useOfficeRealtimeData();

  const totalViews = notifications.length;
  const totalShares = notifications.filter((item) => String(item?.action || '').toLowerCase().includes('share')).length;
  const totalComments = notifications.filter((item) => String(item?.action || '').toLowerCase().includes('comment')).length;
  const publishedItems = notifications.filter((item) => String(item?.action || '').toLowerCase().includes('publish')).length;
  const recentActivity = notifications.slice(0, 8);

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-r from-[#ec4899] to-[#db2777] text-white p-6 rounded-b-3xl shadow-lg mb-6">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <UcuBadgeLogo className="h-9 w-9" imageClassName="object-contain p-0.5" />
          <div>
            <h2 className="text-2xl font-semibold">Publicity Dashboard</h2>
            <p className="text-sm opacity-80 mt-1">Real-time communication and audience activity</p>
          </div>
        </div>
      </div>

      <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground flex items-center gap-2"><Eye className="w-4 h-4" />Total Activity</p><p className="text-2xl font-bold text-pink-600">{loading ? '...' : totalViews}</p></CardContent></Card>
          <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground flex items-center gap-2"><Share2 className="w-4 h-4" />Share Events</p><p className="text-2xl font-bold text-purple-600">{loading ? '...' : totalShares}</p></CardContent></Card>
          <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground flex items-center gap-2"><MessageCircle className="w-4 h-4" />Comment Events</p><p className="text-2xl font-bold text-blue-600">{loading ? '...' : totalComments}</p></CardContent></Card>
          <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground flex items-center gap-2"><Calendar className="w-4 h-4" />Published Updates</p><p className="text-2xl font-bold text-amber-600">{loading ? '...' : publishedItems}</p></CardContent></Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>Monthly Content Throughput</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyPipeline}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#ec4899" strokeWidth={2} name="Items" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Status Distribution</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={statusBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={95} label>
                    {statusBreakdown.map((entry, index) => (
                      <Cell key={`${entry.name}-${index}`} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Recent Communication Activity</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {recentActivity.map((item, index) => (
              <div key={item.id || index} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-semibold">{item.actor || 'System'}</p>
                  <p className="text-xs text-muted-foreground">{item.action || 'updated item'} • {item.target || 'content'}</p>
                </div>
                <p className="text-xs text-muted-foreground">{item.createdAt ? new Date(item.createdAt).toLocaleString() : 'recent'}</p>
              </div>
            ))}
            {!recentActivity.length && <p className="text-sm text-muted-foreground">No recent activity yet.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Audience Snapshot</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="text-center p-3 bg-slate-50 rounded-lg"><p className="text-2xl font-bold">{users.length}</p><p className="text-xs text-muted-foreground">Users</p></div>
              <div className="text-center p-3 bg-slate-50 rounded-lg"><p className="text-2xl font-bold">{notifications.length}</p><p className="text-xs text-muted-foreground">Notifications</p></div>
              <div className="text-center p-3 bg-slate-50 rounded-lg"><p className="text-2xl font-bold">{statusBreakdown.length}</p><p className="text-xs text-muted-foreground">Status Types</p></div>
              <div className="text-center p-3 bg-slate-50 rounded-lg"><p className="text-2xl font-bold">{monthlyPipeline.length}</p><p className="text-xs text-muted-foreground">Tracked Months</p></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
