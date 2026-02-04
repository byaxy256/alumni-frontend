import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { AlertCircle, TrendingUp, Users, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface LoanMetric {
  status: string;
  count: number;
}

interface OverdueStudent {
  name: string;
  accessNumber: string;
  outstanding: number;
  daysSincePayment: number;
}

export default function AlumniOfficeOperations() {
  const [loanMetrics, setLoanMetrics] = useState<LoanMetric[]>([]);
  const [overdueList, setOverdueList] = useState<OverdueStudent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOperationalData();
  }, []);

  const loadOperationalData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Load simple metrics for operations
      const response = await fetch('http://localhost:4000/api/reports/operational-summary', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setLoanMetrics(data.loanMetrics || []);
        setOverdueList(data.overdueList || []);
      }
    } catch (error) {
      console.error('Error loading operational data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `UGX ${(amount / 1000000).toFixed(1)}M`;
  };

  // Sample data for operational view
  const activeLoansData = [
    { semester: '2024-Easter', active: 120, pending: 15, disbursed: 115 },
    { semester: '2024-Advent', active: 135, pending: 12, disbursed: 128 },
    { semester: '2025-Easter', active: 145, pending: 18, disbursed: 140 },
  ];

  const recentRepayments = [
    { date: '2025-02-03', student: 'John Doe', amount: 500000, method: 'Bank Transfer' },
    { date: '2025-02-02', student: 'Jane Smith', amount: 750000, method: 'MTN Money' },
    { date: '2025-02-01', student: 'Peter Johnson', amount: 1000000, method: 'Airtel Money' },
    { date: '2025-01-31', student: 'Mary Brown', amount: 450000, method: 'Bank Transfer' },
    { date: '2025-01-30', student: 'David Wilson', amount: 600000, method: 'MTN Money' },
  ];

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Alumni Office - Operational Dashboard</h2>
        <p className="text-muted-foreground">Manage loans, track repayments, and monitor student progress</p>
      </div>

      {/* Quick Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Active Loans</p>
              <p className="text-2xl text-primary font-bold">456</p>
              <p className="text-sm text-green-600">All semesters</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Pending Approval</p>
              <p className="text-2xl text-amber-600 font-bold">23</p>
              <p className="text-sm text-muted-foreground">Awaiting review</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Overdue Students</p>
              <p className="text-2xl text-red-600 font-bold">12</p>
              <p className="text-sm text-muted-foreground">3+ months no payment</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Month Repayments</p>
              <p className="text-2xl text-green-600 font-bold">UGX 45.2M</p>
              <p className="text-sm text-green-600">+18% from last month</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Loans by Semester */}
      <Card>
        <CardHeader>
          <CardTitle>Active Loans by Semester</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={activeLoansData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="semester" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="active" fill="#3b82f6" name="Active" />
              <Bar dataKey="pending" fill="#f59e0b" name="Pending" />
              <Bar dataKey="disbursed" fill="#10b981" name="Disbursed" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent Repayments */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Repayments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentRepayments.map((payment, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/5 transition">
                <div>
                  <p className="font-semibold">{payment.student}</p>
                  <p className="text-sm text-muted-foreground">{payment.date} • {payment.method}</p>
                </div>
                <p className="text-green-600 font-bold">{formatCurrency(payment.amount)}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Overdue Follow-ups */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            Overdue Students Requiring Follow-up
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { name: 'Alice Kamoga', access: 'A12345', outstanding: 2500000, days: 125 },
              { name: 'Robert Ssemanda', access: 'B67890', outstanding: 3200000, days: 98 },
              { name: 'Patricia Nyambura', access: 'A54321', outstanding: 1800000, days: 145 },
              { name: 'James Okello', access: 'B12345', outstanding: 2100000, days: 87 },
              { name: 'Grace Mutua', access: 'A98765', outstanding: 2800000, days: 156 },
            ].map((student, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-red-200 rounded-lg bg-red-50/30">
                <div className="flex-1">
                  <p className="font-semibold text-red-900">{student.name}</p>
                  <p className="text-sm text-red-700">Access #: {student.access} • {student.days} days no payment</p>
                </div>
                <div className="text-right">
                  <p className="text-red-600 font-bold">{formatCurrency(student.outstanding)}</p>
                  <Button size="sm" variant="outline" className="mt-2">Contact</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Loan Status Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Loan Status Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { status: 'Active', count: 456, color: 'bg-blue-100 text-blue-800' },
              { status: 'Pending', count: 23, color: 'bg-amber-100 text-amber-800' },
              { status: 'Completed', count: 234, color: 'bg-green-100 text-green-800' },
              { status: 'Rejected', count: 8, color: 'bg-red-100 text-red-800' },
            ].map((item) => (
              <div key={item.status} className={`p-4 rounded-lg ${item.color}`}>
                <p className="text-sm font-semibold">{item.status}</p>
                <p className="text-2xl font-bold">{item.count}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" />
            Pending Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="font-semibold text-amber-900">23 Loan Applications Pending Approval</p>
              <p className="text-sm text-amber-700">Review and approve/reject by end of week</p>
            </div>
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="font-semibold text-red-900">12 Students with Overdue Payments</p>
              <p className="text-sm text-red-700">Initiate follow-up communication</p>
            </div>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="font-semibold text-blue-900">45 Beneficiaries Pending Onboarding</p>
              <p className="text-sm text-blue-700">Schedule onboarding sessions</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
