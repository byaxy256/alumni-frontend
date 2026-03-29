import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { CheckCircle, AlertCircle, Users, Award, Clock } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { UcuBadgeLogo } from '../UcuBadgeLogo';

export function SecretaryAcademicsDashboard() {
  // Academic verification data
  const verificationData = [
    { semester: '2024-Easter', verified: 245, pending: 18, rejected: 5 },
    { semester: '2024-Advent', verified: 268, pending: 12, rejected: 3 },
    { semester: '2025-Easter', verified: 312, pending: 22, rejected: 4 },
  ];

  // Benefit eligibility breakdown
  const benefitTypes = [
    { name: 'Full Scholarship', value: 35, color: '#3b82f6' },
    { name: 'Partial Support', value: 28, color: '#8b5cf6' },
    { name: 'Academic Sponsorship', value: 22, color: '#06b6d4' },
    { name: 'Mentorship Program', value: 15, color: '#10b981' },
  ];

  // Mentor assignment status
  const mentorStatus = [
    { month: 'Jan', assigned: 32, pending: 8, completed: 28 },
    { month: 'Feb', assigned: 38, pending: 5, completed: 35 },
    { month: 'Mar', assigned: 45, pending: 6, completed: 42 },
  ];

  const recentVerifications = [
    { student: 'Sarah Nakato', accessNum: 'A12345', semester: '2025-Easter', status: 'Verified', date: '2025-02-03' },
    { student: 'Michael Bwire', accessNum: 'B67890', semester: '2025-Easter', status: 'Verified', date: '2025-02-02' },
    { student: 'Grace Mutua', accessNum: 'A54321', semester: '2025-Easter', status: 'Pending Review', date: '2025-02-01' },
    { student: 'David Okello', accessNum: 'B12345', semester: '2025-Easter', status: 'Verified', date: '2025-01-31' },
    { student: 'Patricia Namuwaya', accessNum: 'A98765', semester: '2024-Advent', status: 'Rejected', date: '2025-01-30' },
  ];

  const mentorAssignments = [
    { mentee: 'Faith Nakayima', mentor: 'Prof. James Mwase', year: '2nd', assigned: '2025-01-15', status: 'Active' },
    { mentee: 'Grace Kipchoge', mentor: 'Dr. Mary Ssemwanga', year: '3rd', assigned: '2025-01-10', status: 'Active' },
    { mentee: 'Robert Kiwanuka', mentor: 'Dr. Henry Otim', year: '1st', assigned: '2025-02-01', status: 'Pending Mentor Confirmation' },
    { mentee: 'Catherine Ouma', mentor: 'Prof. Sarah Kamanja', year: '4th', assigned: '2025-01-05', status: 'Active' },
    { mentee: 'James Ssettimba', mentor: 'Unassigned', year: '2nd', assigned: '2025-02-03', status: 'Awaiting Assignment' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Teal/Cyan Header */}
      <div className="bg-gradient-to-r from-[#06b6d4] to-[#0891b2] text-white p-6 rounded-b-3xl shadow-lg mb-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <UcuBadgeLogo className="h-9 w-9" imageClassName="object-contain p-0.5" />
            <div>
              <h2 className="text-2xl font-semibold">Secretary for Academics Dashboard</h2>
              <p className="text-sm opacity-80 mt-1">Manage academic verification, benefits, and mentorship programs</p>
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
                <CheckCircle className="w-4 h-4" />
                Verified Students
              </p>
              <p className="text-2xl font-bold text-cyan-600">825</p>
              <p className="text-sm text-green-600">This semester</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Pending Review
              </p>
              <p className="text-2xl font-bold text-amber-600">22</p>
              <p className="text-sm text-muted-foreground">Awaiting processing</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Users className="w-4 h-4" />
                Active Mentorships
              </p>
              <p className="text-2xl font-bold text-purple-600">45</p>
              <p className="text-sm text-green-600">Ongoing programs</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Award className="w-4 h-4" />
                Eligibility Rate
              </p>
              <p className="text-2xl font-bold text-teal-600">94.2%</p>
              <p className="text-sm text-green-600">vs 91% last year</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Verification Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Academic Verification Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={verificationData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="semester" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="verified" fill="#06b6d4" name="Verified" />
              <Bar dataKey="pending" fill="#f59e0b" name="Pending" />
              <Bar dataKey="rejected" fill="#ef4444" name="Rejected" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Benefit Types & Mentor Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Benefit Types Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={benefitTypes}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {benefitTypes.map((entry) => (
                    <Cell key={`cell-${entry.name}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mentorship Assignment Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={mentorStatus}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="assigned" stroke="#3b82f6" strokeWidth={2} name="Assigned" />
                <Line type="monotone" dataKey="pending" stroke="#f59e0b" strokeWidth={2} name="Pending" />
                <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2} name="Completed" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Verifications */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Verifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentVerifications.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/5">
                <div>
                  <p className="font-semibold">{item.student}</p>
                  <p className="text-xs text-muted-foreground">{item.accessNum} • {item.semester}</p>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-bold px-2 py-1 rounded ${
                    item.status === 'Verified' ? 'bg-green-100 text-green-800' :
                    item.status === 'Pending Review' ? 'bg-amber-100 text-amber-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {item.status}
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">{item.date}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Mentorship Assignments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Mentor Assignments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {mentorAssignments.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/5">
                <div className="flex-1">
                  <p className="font-semibold">{item.mentee}</p>
                  <p className="text-xs text-muted-foreground">Year {item.year} • Mentor: {item.mentor}</p>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-bold px-2 py-1 rounded ${
                    item.status === 'Active' ? 'bg-green-100 text-green-800' :
                    item.status === 'Awaiting Assignment' ? 'bg-red-100 text-red-800' :
                    'bg-amber-100 text-amber-800'
                  }`}>
                    {item.status}
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">{item.assigned}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Academic Processing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" />
            Document Processing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex justify-between mb-2">
                <p className="font-semibold text-blue-900">Transcripts Awaiting Review</p>
                <span className="text-lg font-bold text-blue-600">34</span>
              </div>
              <div className="w-full bg-blue-200 rounded h-2">
                <div className="bg-blue-600 h-2 rounded" style={{ width: '55%' }} />
              </div>
              <Button size="sm" className="w-full mt-2" variant="outline">Review Now</Button>
            </div>
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex justify-between mb-2">
                <p className="font-semibold text-purple-900">Benefit Requests Pending</p>
                <span className="text-lg font-bold text-purple-600">18</span>
              </div>
              <div className="w-full bg-purple-200 rounded h-2">
                <div className="bg-purple-600 h-2 rounded" style={{ width: '38%' }} />
              </div>
              <Button size="sm" className="w-full mt-2" variant="outline">Process</Button>
            </div>
            <div className="p-3 bg-cyan-50 border border-cyan-200 rounded-lg">
              <div className="flex justify-between mb-2">
                <p className="font-semibold text-cyan-900">Mentorship Forms to Match</p>
                <span className="text-lg font-bold text-cyan-600">12</span>
              </div>
              <div className="w-full bg-cyan-200 rounded h-2">
                <div className="bg-cyan-600 h-2 rounded" style={{ width: '28%' }} />
              </div>
              <Button size="sm" className="w-full mt-2" variant="outline">Match</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Academic Programs */}
      <Card>
        <CardHeader>
          <CardTitle>Active Programs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 border rounded-lg">
              <p className="font-semibold text-sm mb-2">Scholarship Program</p>
              <div className="space-y-1 text-xs">
                <p>Active: <span className="font-bold">156</span></p>
                <p>Pending: <span className="font-bold text-amber-600">8</span></p>
                <Button size="sm" className="w-full mt-2" variant="outline">Manage</Button>
              </div>
            </div>
            <div className="p-3 border rounded-lg">
              <p className="font-semibold text-sm mb-2">Mentorship Program</p>
              <div className="space-y-1 text-xs">
                <p>Pairs: <span className="font-bold">45</span></p>
                <p>Unmatched: <span className="font-bold text-red-600">3</span></p>
                <Button size="sm" className="w-full mt-2" variant="outline">Manage</Button>
              </div>
            </div>
            <div className="p-3 border rounded-lg">
              <p className="font-semibold text-sm mb-2">Transcript Program</p>
              <div className="space-y-1 text-xs">
                <p>Holders: <span className="font-bold">89</span></p>
                <p>Pending: <span className="font-bold text-amber-600">12</span></p>
                <Button size="sm" className="w-full mt-2" variant="outline">Manage</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
