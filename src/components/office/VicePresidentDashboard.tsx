import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { TrendingUp, Users, FolderOpen, Zap, Award, Calendar } from 'lucide-react';
import { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { UcuBadgeLogo } from '../UcuBadgeLogo';

export function VicePresidentDashboard() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setLoading(false), 500);
  }, []);

  // Vice President operational data
  const operationalTrends = [
    { quarter: 'Q1 2025', initiatives: 8, completed: 5, budget: 45 },
    { quarter: 'Q2 2024', initiatives: 7, completed: 6, budget: 38 },
    { quarter: 'Q3 2024', initiatives: 9, completed: 7, budget: 52 },
    { quarter: 'Q4 2024', initiatives: 6, completed: 5, budget: 41 },
  ];

  const strategicGoals = [
    { goal: 'Increase Member Engagement', current: 78, target: 90, progress: 87 },
    { goal: 'Launch New Programs', current: 4, target: 6, progress: 67 },
    { goal: 'Build Partnership Network', current: 15, target: 25, progress: 60 },
    { goal: 'Improve Operational Efficiency', current: 82, target: 95, progress: 86 },
  ];

  const initiativeStatus = [
    { quarter: 'Q1 2025', onTrack: 8, atRisk: 1, blocked: 0, completed: 0 },
    { quarter: 'Q2 2024', onTrack: 5, atRisk: 1, blocked: 0, completed: 1 },
    { quarter: 'Q3 2024', onTrack: 6, atRisk: 2, blocked: 0, completed: 1 },
    { quarter: 'Q4 2024', onTrack: 4, atRisk: 1, blocked: 1, completed: 1 },
  ];

  const recentInitiatives = [
    { name: 'Alumni Mentorship Expansion', status: 'On Track', progress: 78, lead: 'Secretary Academics', date: 'Mar 28' },
    { name: 'Q2 Fundraising Campaign', status: 'On Track', progress: 65, lead: 'Finance Officer', date: 'Apr 15' },
    { name: 'Campus Engagement Program', status: 'At Risk', progress: 42, lead: 'Publicity', date: 'Apr 22' },
    { name: 'Alumni Network Expansion', status: 'On Track', progress: 88, lead: 'General Secretary', date: 'Mar 10' },
    { name: 'Corporate Partnership Initiative', status: 'At Risk', progress: 35, lead: 'Finance Officer', date: 'May 30' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Deep Purple Header */}
      <div className="bg-gradient-to-r from-[#6d28d9] to-[#7c3aed] text-white p-6 rounded-b-3xl shadow-lg mb-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <UcuBadgeLogo className="h-9 w-9" imageClassName="object-contain p-0.5" />
            <div>
              <h2 className="text-2xl font-semibold">Vice President Dashboard</h2>
              <p className="text-sm opacity-80 mt-1">Oversight of operations, initiatives, and strategic goals</p>
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
                <FolderOpen className="w-4 h-4" />
                Active Initiatives
              </p>
              <p className="text-2xl font-bold text-purple-600">9</p>
              <p className="text-sm text-muted-foreground">This quarter</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                On Track
              </p>
              <p className="text-2xl font-bold text-green-600">8</p>
              <p className="text-sm text-green-600">89% success rate</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Zap className="w-4 h-4" />
                At Risk
              </p>
              <p className="text-2xl font-bold text-amber-600">1</p>
              <p className="text-sm text-amber-600">Needs attention</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Award className="w-4 h-4" />
                Team Members
              </p>
              <p className="text-2xl font-bold text-blue-600">28</p>
              <p className="text-sm text-muted-foreground">All departments</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Strategic Goals Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Strategic Goals & Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {strategicGoals.map((goal, idx) => (
            <div key={idx} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-sm">{goal.goal}</span>
                <span className="text-xs bg-purple-100 px-2 py-1 rounded text-purple-800">{goal.progress}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2.5">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2.5 rounded-full transition-all"
                  style={{ width: `${goal.progress}%` }}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Initiative Trends & Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Initiative Completion Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={operationalTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="quarter" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="initiatives" fill="#6d28d9" name="Initiated" />
                <Bar dataKey="completed" fill="#10b981" name="Completed" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Initiative Health Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={initiativeStatus}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="quarter" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="onTrack" stroke="#10b981" strokeWidth={2} name="On Track" />
                <Line type="monotone" dataKey="atRisk" stroke="#f59e0b" strokeWidth={2} name="At Risk" />
                <Line type="monotone" dataKey="blocked" stroke="#ef4444" strokeWidth={2} name="Blocked" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Initiatives */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Initiative Portfolio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentInitiatives.map((init, idx) => (
              <div key={idx} className="p-3 border rounded-lg hover:bg-accent/5 transition">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <p className="font-semibold">{init.name}</p>
                    <p className="text-xs text-muted-foreground">Lead: {init.lead} • Due: {init.date}</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded ${
                    init.status === 'On Track' ? 'bg-green-100 text-green-800' :
                    'bg-amber-100 text-amber-800'
                  }`}>
                    {init.status}
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded h-2">
                  <div 
                    className={`h-2 rounded ${
                      init.status === 'On Track' ? 'bg-green-600' : 'bg-amber-600'
                    }`}
                    style={{ width: `${init.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Department Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Department Coordination</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 border rounded-lg">
              <p className="font-semibold text-sm mb-2">Finance Department</p>
              <div className="space-y-1 text-xs">
                <p>Active Projects: <span className="font-bold">6</span></p>
                <p>Budget Utilization: <span className="font-bold text-blue-600">68%</span></p>
                <Button size="sm" className="w-full mt-2" variant="outline">Coordinate</Button>
              </div>
            </div>
            <div className="p-3 border rounded-lg">
              <p className="font-semibold text-sm mb-2">General Secretary</p>
              <div className="space-y-1 text-xs">
                <p>Active Projects: <span className="font-bold">8</span></p>
                <p>Timeline Health: <span className="font-bold text-green-600">100%</span></p>
                <Button size="sm" className="w-full mt-2" variant="outline">Coordinate</Button>
              </div>
            </div>
            <div className="p-3 border rounded-lg">
              <p className="font-semibold text-sm mb-2">Publicity Department</p>
              <div className="space-y-1 text-xs">
                <p>Active Projects: <span className="font-bold">5</span></p>
                <p>Engagement Reach: <span className="font-bold text-purple-600">15.8K</span></p>
                <Button size="sm" className="w-full mt-2" variant="outline">Coordinate</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Executive Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Vice Presidential Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg flex justify-between items-center">
              <div>
                <p className="font-semibold text-purple-900">Review At-Risk Initiative</p>
                <p className="text-xs text-purple-700 mt-1">Campus Engagement Program - needs intervention</p>
              </div>
              <Button size="sm">Review</Button>
            </div>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex justify-between items-center">
              <div>
                <p className="font-semibold text-blue-900">Approve Q2 Budget Allocation</p>
                <p className="text-xs text-blue-700 mt-1">UGX 58M across all departments</p>
              </div>
              <Button size="sm">Approve</Button>
            </div>
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex justify-between items-center">
              <div>
                <p className="font-semibold text-green-900">Conduct Department Heads Meeting</p>
                <p className="text-xs text-green-700 mt-1">Scheduled: March 28, 2025</p>
              </div>
              <Button size="sm">Schedule</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Organization Health */}
      <Card>
        <CardHeader>
          <CardTitle>Organization Health Index</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="text-center p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
              <p className="text-2xl font-bold text-green-600">92%</p>
              <p className="text-xs text-muted-foreground">Member Satisfaction</p>
            </div>
            <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
              <p className="text-2xl font-bold text-blue-600">88%</p>
              <p className="text-xs text-muted-foreground">Goal Achievement</p>
            </div>
            <div className="text-center p-3 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
              <p className="text-2xl font-bold text-purple-600">85%</p>
              <p className="text-xs text-muted-foreground">Team Efficiency</p>
            </div>
            <div className="text-center p-3 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg border border-amber-200">
              <p className="text-2xl font-bold text-amber-600">76%</p>
              <p className="text-xs text-muted-foreground">Budget Optimization</p>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
