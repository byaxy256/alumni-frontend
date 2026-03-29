import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { CheckCircle, AlertCircle, Zap, Calendar, TrendingUp, Users } from 'lucide-react';
import { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { UcuBadgeLogo } from '../UcuBadgeLogo';

export function ProjectsManagerDashboard() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setLoading(false), 500);
  }, []);

  // Project health data
  const projectHealth = [
    { month: 'Jan', active: 8, onTrack: 7, atRisk: 1, completed: 2 },
    { month: 'Feb', active: 9, onTrack: 8, atRisk: 1, completed: 1 },
    { month: 'Mar', active: 10, onTrack: 9, atRisk: 1, completed: 2 },
  ];

  // Budget tracking
  const budgetData = [
    { project: 'Alumni Network', allocated: 15, spent: 12, progress: 80 },
    { project: 'Mentorship Program', allocated: 10, spent: 7, progress: 70 },
    { project: 'Tech Infrastructure', allocated: 25, spent: 18, progress: 72 },
    { project: 'Event Series', allocated: 12, spent: 8, progress: 67 },
    { project: 'Research Initiative', allocated: 18, spent: 14, progress: 78 },
  ];

  // Milestone completion
  const milestoneData = [
    { month: 'Q1', total: 12, completed: 10, onTrack: 2, delayed: 0 },
    { month: 'Q2', total: 15, completed: 12, onTrack: 2, delayed: 1 },
    { month: 'Q3', total: 14, completed: 11, onTrack: 2, delayed: 1 },
  ];

  const activeProjects = [
    { name: 'Alumni Network Expansion', status: 'On Track', progress: 78, budget: 'UGX 12M/15M', team: 6, due: 'Mar 31' },
    { name: 'Mentorship Program v2', status: 'On Track', progress: 70, budget: 'UGX 7M/10M', team: 4, due: 'Apr 15' },
    { name: 'Tech Infrastructure Upgrade', status: 'At Risk', progress: 72, budget: 'UGX 18M/25M', team: 8, due: 'May 30' },
    { name: 'Q2 Annual Event Series', status: 'On Track', progress: 67, budget: 'UGX 8M/12M', team: 5, due: 'May 15' },
    { name: 'Donor Engagement Research', status: 'On Track', progress: 78, budget: 'UGX 14M/18M', team: 3, due: 'Apr 10' },
  ];

  const teamMembers = [
    { name: 'Alice Kamoga', role: 'Project Lead', projects: 3, utilization: '85%' },
    { name: 'Robert Ssemanda', role: 'Developer', projects: 2, utilization: '90%' },
    { name: 'Grace Mutua', role: 'Coordinator', projects: 4, utilization: '95%' },
    { name: 'David Okello', role: 'Analyst', projects: 2, utilization: '75%' },
    { name: 'Patricia Namuwaya', role: 'QA Lead', projects: 3, utilization: '88%' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Teal/Turquoise Header */}
      <div className="bg-gradient-to-r from-[#14b8a6] to-[#0d9488] text-white p-6 rounded-b-3xl shadow-lg mb-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <UcuBadgeLogo className="h-9 w-9" imageClassName="object-contain p-0.5" />
            <div>
              <h2 className="text-2xl font-semibold">Projects Manager Dashboard</h2>
              <p className="text-sm opacity-80 mt-1">Track projects, manage teams, and monitor deliverables</p>
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
                <Calendar className="w-4 h-4" />
                Active Projects
              </p>
              <p className="text-2xl font-bold text-teal-600">10</p>
              <p className="text-sm text-muted-foreground">All in progress</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                On Track
              </p>
              <p className="text-2xl font-bold text-green-600">9</p>
              <p className="text-sm text-green-600">90% success rate</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                At Risk
              </p>
              <p className="text-2xl font-bold text-amber-600">1</p>
              <p className="text-sm text-amber-600">Tech Infrastructure</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Users className="w-4 h-4" />
                Team Members
              </p>
              <p className="text-2xl font-bold text-blue-600">18</p>
              <p className="text-sm text-muted-foreground">Across projects</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Project Health & Budget */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Project Health Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={projectHealth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="onTrack" fill="#10b981" name="On Track" />
                <Bar dataKey="atRisk" fill="#f59e0b" name="At Risk" />
                <Bar dataKey="completed" fill="#3b82f6" name="Completed" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Milestone Completion Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={milestoneData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2} name="Completed" />
                <Line type="monotone" dataKey="onTrack" stroke="#3b82f6" strokeWidth={2} name="On Track" />
                <Line type="monotone" dataKey="delayed" stroke="#ef4444" strokeWidth={2} name="Delayed" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Budget Allocation */}
      <Card>
        <CardHeader>
          <CardTitle>Project Budget Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {budgetData.map((proj, idx) => (
            <div key={idx} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-sm">{proj.project}</span>
                <span className="text-xs text-muted-foreground">
                  UGX {proj.spent}M / {proj.allocated}M
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2.5">
                <div 
                  className="bg-gradient-to-r from-teal-500 to-cyan-500 h-2.5 rounded-full transition-all"
                  style={{ width: `${(proj.spent / proj.allocated) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Active Projects */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Active Projects Portfolio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {activeProjects.map((proj, idx) => (
              <div key={idx} className="p-3 border rounded-lg hover:bg-accent/5 transition">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <p className="font-semibold">{proj.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Team: {proj.team} • Budget: {proj.budget} • Due: {proj.due}
                    </p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded ${
                    proj.status === 'On Track' ? 'bg-green-100 text-green-800' :
                    'bg-amber-100 text-amber-800'
                  }`}>
                    {proj.status}
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded h-2">
                  <div 
                    className={`h-2 rounded ${
                      proj.status === 'On Track' ? 'bg-green-600' : 'bg-amber-600'
                    }`}
                    style={{ width: `${proj.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Team Members */}
      <Card>
        <CardHeader>
          <CardTitle>Team Utilization</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {teamMembers.map((member, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/5">
                <div>
                  <p className="font-semibold">{member.name}</p>
                  <p className="text-xs text-muted-foreground">{member.role} • {member.projects} projects</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-teal-600">{member.utilization}</p>
                  <div className="w-24 h-2 bg-slate-200 rounded mt-1">
                    <div 
                      className="h-2 bg-teal-600 rounded"
                      style={{ width: member.utilization }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Milestones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Upcoming Milestones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex justify-between items-center">
              <div>
                <p className="font-semibold text-green-900">Alumni Network v1.0 Launch</p>
                <p className="text-xs text-green-700 mt-1">Alumni Network Expansion • Ready for deployment</p>
              </div>
              <Button size="sm">Deploy</Button>
            </div>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex justify-between items-center">
              <div>
                <p className="font-semibold text-blue-900">Tech Infrastructure Go-Live</p>
                <p className="text-xs text-blue-700 mt-1">Tech Infrastructure • May 15, 2025</p>
              </div>
              <Button size="sm">Review</Button>
            </div>
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg flex justify-between items-center">
              <div>
                <p className="font-semibold text-purple-900">Research Publication</p>
                <p className="text-xs text-purple-700 mt-1">Research Initiative • April 10, 2025</p>
              </div>
              <Button size="sm">Preview</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Project Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Portfolio Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="text-center p-3 bg-gradient-to-br from-green-50 to-teal-50 rounded-lg border border-green-200">
              <p className="text-2xl font-bold text-green-600">90%</p>
              <p className="text-xs text-muted-foreground">Success Rate</p>
            </div>
            <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
              <p className="text-2xl font-bold text-blue-600">78%</p>
              <p className="text-xs text-muted-foreground">Budget Efficiency</p>
            </div>
            <div className="text-center p-3 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg border border-amber-200">
              <p className="text-2xl font-bold text-amber-600">85%</p>
              <p className="text-xs text-muted-foreground">On-Time Delivery</p>
            </div>
            <div className="text-center p-3 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
              <p className="text-2xl font-bold text-purple-600">89%</p>
              <p className="text-xs text-muted-foreground">Team Satisfaction</p>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
