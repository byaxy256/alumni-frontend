import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Users, DollarSign, FileText, TrendingUp, BookOpen, UserCheck, RefreshCw } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { apiCall } from '../../api';

interface DashboardStats {
  users: {
    total: number;
    students: number;
    alumni: number;
    alumni_office: number;
    admins: number;
    newLast30Days: number;
  };
  donations: {
    totalAmount: number;
    totalCount: number;
    donorCount: number;
    last30DaysAmount: number;
    last30DaysCount: number;
  };
  applications: {
    total: number;
    pending: number;
    approved: number;
  };
  disbursements: {
    totalAmount: number;
    totalCount: number;
    pending: number;
  };
  mentorships: {
    active: number;
    total: number;
  };
}

interface Activity {
  type: string;
  action: string;
  user: string;
  amount?: string;
  time: string;
  status: string;
}

interface TrendData {
  month: string;
  donations: number;
  disbursements: number;
  applications: number;
  newUsers: number;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6'];

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadDashboardData(true);
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      const token = localStorage.getItem('token');
      
      console.log('Loading dashboard data with token:', token ? 'present' : 'missing');
      
      const [statsRes, trendsRes, activityRes] = await Promise.all([
        apiCall('/admin/dashboard-stats', 'GET', undefined, token || undefined),
        apiCall('/admin/trends', 'GET', undefined, token || undefined),
        apiCall('/admin/recent-activity?limit=15', 'GET', undefined, token || undefined)
      ]);
      
      console.log('Dashboard stats:', statsRes);
      console.log('Trends:', trendsRes);
      console.log('Activity:', activityRes);
      
      setStats(statsRes);
      setTrends(trendsRes);
      setActivity(activityRes);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      if (!isRefresh) {
        alert('Failed to load dashboard data. Check console for details.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="p-4 lg:p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const userDistribution = [
    { name: 'Students', value: stats.users.students },
    { name: 'Alumni', value: stats.users.alumni },
    { name: 'Alumni Office', value: stats.users.alumni_office },
    { name: 'Admins', value: stats.users.admins }
  ];

  const statCards = [
    {
      label: 'Total Users',
      value: stats.users.total.toLocaleString(),
      change: `+${stats.users.newLast30Days} this month`,
      icon: Users,
      color: 'text-blue-600'
    },
    {
      label: 'Total Donations',
      value: stats.donations.totalAmount >= 1000000 
        ? `UGX ${(stats.donations.totalAmount / 1000000).toFixed(1)}M`
        : `UGX ${stats.donations.totalAmount.toLocaleString()}`,
      change: `${stats.donations.totalCount} donations`,
      icon: DollarSign,
      color: 'text-green-600'
    },
    {
      label: 'Applications',
      value: stats.applications.total.toLocaleString(),
      change: `${stats.applications.pending} pending`,
      icon: FileText,
      color: 'text-orange-600'
    },
    {
      label: 'Disbursements',
      value: stats.disbursements.totalAmount >= 1000000
        ? `UGX ${(stats.disbursements.totalAmount / 1000000).toFixed(1)}M`
        : `UGX ${stats.disbursements.totalAmount.toLocaleString()}`,
      change: `${stats.disbursements.totalCount} total`,
      icon: TrendingUp,
      color: 'text-purple-600'
    },
    {
      label: 'Active Mentorships',
      value: stats.mentorships.active.toLocaleString(),
      change: `${stats.mentorships.total} total`,
      icon: UserCheck,
      color: 'text-indigo-600'
    },
    {
      label: 'Active Donors',
      value: stats.donations.donorCount.toLocaleString(),
      change: `${stats.donations.last30DaysCount} recent`,
      icon: BookOpen,
      color: 'text-teal-600'
    }
  ];

  const formatTime = (time: string) => {
    const date = new Date(time);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">System overview and key metrics</p>
        </div>
        <button
          onClick={() => loadDashboardData(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
                    <div className="flex items-baseline gap-2">
                      <h2 className="text-2xl font-bold">{stat.value}</h2>
                    </div>
                    <p className="text-xs text-muted-foreground">{stat.change}</p>
                  </div>
                  <Icon className={`w-10 h-10 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value: any) => {
                    if (typeof value === 'number' && value > 1000000) {
                      return `UGX ${(value / 1000000).toFixed(1)}M`;
                    }
                    return value.toLocaleString();
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="donations" stroke="#10b981" name="Donations" strokeWidth={2} />
                <Line type="monotone" dataKey="disbursements" stroke="#3b82f6" name="Disbursements" strokeWidth={2} />
                <Line type="monotone" dataKey="newUsers" stroke="#f59e0b" name="New Users" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={userDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {userDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Applications & Disbursements Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Applications & Disbursements Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip 
                formatter={(value: any, name: string) => {
                  if (name === 'Disbursements (UGX)' && typeof value === 'number') {
                    return `UGX ${(value / 1000000).toFixed(2)}M`;
                  }
                  return value.toLocaleString();
                }}
              />
              <Legend />
              <Bar dataKey="applications" fill="#8b5cf6" name="Applications" />
              <Bar dataKey="disbursements" fill="#3b82f6" name="Disbursements (UGX)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent System Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {activity.length === 0 ? (
              <div className="py-6 text-center text-muted-foreground">No recent activity to display.</div>
            ) : (
              activity.map((act, index) => (
                <div key={index} className="flex items-start gap-3 pb-3 border-b last:border-0 hover:bg-muted/50 p-2 rounded transition-colors">
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                    act.status === 'success' ? 'bg-green-500' :
                    act.status === 'warning' ? 'bg-yellow-500' : 
                    act.status === 'info' ? 'bg-blue-500' : 'bg-gray-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{act.action}</p>
                    <p className="text-xs text-muted-foreground truncate">{act.user}</p>
                  </div>
                  {act.amount && (
                    <p className="text-sm font-semibold text-muted-foreground flex-shrink-0">{act.amount}</p>
                  )}
                  <p className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">{formatTime(act.time)}</p>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
