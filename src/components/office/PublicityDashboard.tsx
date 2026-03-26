import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { TrendingUp, Share2, Eye, MessageCircle, Calendar, Zap } from 'lucide-react';
import { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { UcuBadgeLogo } from '../UcuBadgeLogo';

export function PublicityDashboard() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate data loading
    setTimeout(() => setLoading(false), 500);
  }, []);

  // Engagement trend data
  const engagementTrends = [
    { week: 'Week 1', views: 2400, shares: 240, engagement: 65 },
    { week: 'Week 2', views: 3210, shares: 321, engagement: 72 },
    { week: 'Week 3', views: 2290, shares: 229, engagement: 68 },
    { week: 'Week 4', views: 3800, shares: 380, engagement: 85 },
    { week: 'Week 5', views: 4100, shares: 410, engagement: 88 },
  ];

  // Content type performance
  const contentPerformance = [
    { type: 'News', value: 32, color: '#3b82f6' },
    { type: 'Events', value: 28, color: '#8b5cf6' },
    { type: 'Announcements', value: 22, color: '#ec4899' },
    { type: 'Stories', value: 18, color: '#f59e0b' },
  ];

  // Platform distribution
  const platformData = [
    { month: 'Jan', website: 45, email: 38, social: 52 },
    { month: 'Feb', website: 52, email: 42, social: 58 },
    { month: 'Mar', website: 48, email: 45, social: 62 },
    { month: 'Apr', website: 61, email: 48, social: 70 },
    { month: 'May', website: 68, email: 52, social: 78 },
  ];

  const recentPosts = [
    { title: 'General Secretary Elections 2025', date: '2025-02-03', views: 1240, shares: 124, engagement: '9.8%' },
    { title: 'Alumni Mentorship Program Launch', date: '2025-02-01', views: 856, shares: 85, engagement: '7.2%' },
    { title: 'May Fundraising Event Announcement', date: '2025-01-28', views: 2100, shares: 210, engagement: '12.4%' },
    { title: 'Alumni Success Story: John Kamoga', date: '2025-01-25', views: 1540, shares: 154, engagement: '10.1%' },
    { title: 'Q1 Scholarship Fund Report', date: '2025-01-20', views: 980, shares: 98, engagement: '8.3%' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Magenta/Pink Header */}
      <div className="bg-gradient-to-r from-[#ec4899] to-[#db2777] text-white p-6 rounded-b-3xl shadow-lg mb-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <UcuBadgeLogo className="h-9 w-9" imageClassName="object-contain p-0.5" />
            <div>
              <h2 className="text-2xl font-semibold">Publicity Dashboard</h2>
              <p className="text-sm opacity-80 mt-1">Manage content, track engagement, and monitor audience reach</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Total Views
              </p>
              <p className="text-2xl font-bold text-pink-600">15.8K</p>
              <p className="text-sm text-green-600">+24% this month</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Share2 className="w-4 h-4" />
                Total Shares
              </p>
              <p className="text-2xl font-bold text-purple-600">1.58K</p>
              <p className="text-sm text-green-600">+18% this month</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                Engagement Rate
              </p>
              <p className="text-2xl font-bold text-blue-600">9.2%</p>
              <p className="text-sm text-green-600">+2.1% improvement</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Published Posts
              </p>
              <p className="text-2xl font-bold text-amber-600">28</p>
              <p className="text-sm text-muted-foreground">This month</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Engagement Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Engagement Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={engagementTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="views" stroke="#3b82f6" strokeWidth={2} name="Views" />
              <Line yAxisId="left" type="monotone" dataKey="shares" stroke="#8b5cf6" strokeWidth={2} name="Shares" />
              <Line yAxisId="right" type="monotone" dataKey="engagement" stroke="#ec4899" strokeWidth={2} name="Engagement %" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Content Performance & Platform Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Content Type Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={contentPerformance}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ type, value }) => `${type}: ${value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {contentPerformance.map((entry) => (
                    <Cell key={`cell-${entry.type}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Platform Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={platformData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="website" fill="#3b82f6" name="Website" />
                <Bar dataKey="email" fill="#8b5cf6" name="Email" />
                <Bar dataKey="social" fill="#ec4899" name="Social Media" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Posts */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Posts Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentPosts.map((post, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/5 transition">
                <div className="flex-1">
                  <p className="font-semibold">{post.title}</p>
                  <p className="text-xs text-muted-foreground">{post.date}</p>
                </div>
                <div className="text-right space-y-1">
                  <div className="flex gap-3 text-sm">
                    <span className="text-blue-600 font-semibold">{post.views} views</span>
                    <span className="text-purple-600 font-semibold">{post.shares} shares</span>
                  </div>
                  <p className="text-sm font-bold text-pink-600">{post.engagement}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Editorial Calendar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Editorial Calendar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-semibold text-blue-900">Scheduled Posts</p>
              <p className="text-2xl font-bold text-blue-600">12</p>
              <p className="text-xs text-blue-700 mt-1">Next 2 weeks</p>
            </div>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm font-semibold text-amber-900">Events to Cover</p>
              <p className="text-2xl font-bold text-amber-600">5</p>
              <p className="text-xs text-amber-700 mt-1">March & April</p>
            </div>
            <div className="p-3 bg-pink-50 border border-pink-200 rounded-lg">
              <p className="text-sm font-semibold text-pink-900">Content Ideas</p>
              <p className="text-2xl font-bold text-pink-600">23</p>
              <p className="text-xs text-pink-700 mt-1">Pending review</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            Publishing Tasks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex justify-between items-center">
              <div>
                <p className="font-semibold text-blue-900">Draft: Annual Report Article</p>
                <p className="text-xs text-blue-700 mt-1">Due: March 28</p>
              </div>
              <Button size="sm">Edit</Button>
            </div>
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg flex justify-between items-center">
              <div>
                <p className="font-semibold text-purple-900">Schedule: May Event Announcement</p>
                <p className="text-xs text-purple-700 mt-1">Publish: April 1</p>
              </div>
              <Button size="sm">Schedule</Button>
            </div>
            <div className="p-3 bg-pink-50 border border-pink-200 rounded-lg flex justify-between items-center">
              <div>
                <p className="font-semibold text-pink-900">Create: Alumni Success Stories Gallery</p>
                <p className="text-xs text-pink-700 mt-1">Due: April 15</p>
              </div>
              <Button size="sm">Create</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audience Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Audience Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <p className="text-2xl font-bold text-slate-900">8.4K</p>
              <p className="text-xs text-muted-foreground">Newsletter Subscribers</p>
            </div>
            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <p className="text-2xl font-bold text-slate-900">12.3K</p>
              <p className="text-xs text-muted-foreground">Social Followers</p>
            </div>
            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <p className="text-2xl font-bold text-slate-900">45.2K</p>
              <p className="text-xs text-muted-foreground">Website Visitors</p>
            </div>
            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <p className="text-2xl font-bold text-slate-900">9.2%</p>
              <p className="text-xs text-muted-foreground">Avg Engagement</p>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
