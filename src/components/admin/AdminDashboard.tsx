import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Users, DollarSign, AlertCircle, Activity } from 'lucide-react';
import { ResponsiveContainer } from 'recharts';


const stats: Array<any> = [];
const monthlyData: Array<any> = [];
const userDistribution: Array<any> = [];
const recentActivity: Array<any> = [];

export default function AdminDashboard() {
  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Admin Dashboard</h1>
          <p className="text-muted-foreground">System overview and key metrics</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-center">
                <p className="text-muted-foreground">No metrics available. Connect analytics to display data.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <p className="text-muted-foreground">{stat.label}</p>
                      <div className="flex items-baseline gap-2">
                        <h2>{stat.value}</h2>
                        <span className={`text-sm ${stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                          {stat.change}
                        </span>
                      </div>
                    </div>
                    <Icon className={`w-8 h-8 ${stat.color}`} />
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Disbursements vs Repayments</CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyData.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">No chart data available. Connect reporting or run the admin sync.</div>
            ) : (
              <div className="py-12 text-center">Chart would render here</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {userDistribution.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">No distribution data available.</div>
            ) : (
              <div className="py-12 text-center">Chart would render here</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent System Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.length === 0 ? (
              <div className="py-6 text-center text-muted-foreground">No recent activity to display.</div>
            ) : (
              recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start gap-4 pb-4 border-b last:border-0">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    activity.status === 'success' ? 'bg-green-500' :
                    activity.status === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="truncate">{activity.action}</p>
                    <p className="text-sm text-muted-foreground">{activity.user}</p>
                  </div>
                  {activity.amount && (
                    <p className="text-sm text-muted-foreground">{activity.amount}</p>
                  )}
                  <p className="text-sm text-muted-foreground whitespace-nowrap">{activity.time}</p>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
