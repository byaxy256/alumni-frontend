import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { TrendingUp, Users, Award, Zap } from 'lucide-react';
import { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { UcuBadgeLogo } from '../UcuBadgeLogo';
import { API_BASE } from '../../api';

interface FinancialRecord {
  status?: string;
  approved_amount?: number;
  disbursedAmount?: number;
  amount_disbursed?: number;
  amountRequested?: number;
  amount_requested?: number;
  amount?: number;
}

interface DisbursementRecord {
  original_amount?: number;
  deduction_amount?: number;
  net_amount?: number;
}

export function PresidentDashboard() {
  const [loanRecords, setLoanRecords] = useState<FinancialRecord[]>([]);
  const [supportRecords, setSupportRecords] = useState<FinancialRecord[]>([]);
  const [disbursementRecords, setDisbursementRecords] = useState<DisbursementRecord[]>([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPresidentialData();
  }, []);

  const loadPresidentialData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const [loansRes, supportRes, disburseRes, usersRes] = await Promise.all([
        fetch(`${API_BASE}/loans`, { headers }),
        fetch(`${API_BASE}/support`, { headers }),
        fetch(`${API_BASE}/disburse`, { headers }),
        fetch(`${API_BASE}/users`, { headers }),
      ]);

      setLoanRecords(loansRes.ok ? await loansRes.json() : []);
      setSupportRecords(supportRes.ok ? await supportRes.json() : []);
      setDisbursementRecords(disburseRes.ok ? await disburseRes.json() : []);
      setUsers(usersRes.ok ? await usersRes.json() : []);
    } catch (error) {
      console.error('Error loading presidential data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `UGX ${(amount / 1000000).toFixed(1)}M`;
  };

  const isDisbursedStatus = (status: string) => {
    const s = (status || '').toLowerCase();
    return ['approved', 'active', 'paid', 'disbursed'].includes(s);
  };

  const getAmount = (item: FinancialRecord) =>
    Number(
      item.disbursedAmount ??
      item.amount_disbursed ??
      item.approved_amount ??
      item.amountRequested ??
      item.amount_requested ??
      item.amount ??
      0
    );

  const loansDisbursedTotal = loanRecords
    .filter((loan) => isDisbursedStatus(String(loan.status || '')))
    .reduce((sum, loan) => sum + getAmount(loan), 0);

  const supportDisbursedTotal = supportRecords
    .filter((request) => isDisbursedStatus(String(request.status || '')))
    .reduce((sum, request) => sum + getAmount(request), 0);

  const pendingApplications = loanRecords.filter(
    (l) => (l.status || '').toLowerCase() === 'pending'
  ).length;

  const grossApprovedTotal = disbursementRecords.reduce((sum, d) => sum + Number(d.original_amount || 0), 0);
  const automatedDeductionsTotal = disbursementRecords.reduce((sum, d) => sum + Number(d.deduction_amount || 0), 0);
  const netPaidOutTotal = disbursementRecords.reduce((sum, d) => sum + Number(d.net_amount || 0), 0);

  // Strategic data for presidential overview
  const performanceTrends = [
    { month: 'Jan', beneficiaries: 245, fundUtilization: 78, satisfaction: 92 },
    { month: 'Feb', beneficiaries: 268, fundUtilization: 82, satisfaction: 94 },
    { month: 'Mar', beneficiaries: 285, fundUtilization: 85, satisfaction: 96 },
    { month: 'Apr', beneficiaries: 310, fundUtilization: 88, satisfaction: 95 },
    { month: 'May', beneficiaries: 340, fundUtilization: 90, satisfaction: 97 },
  ];

  // Strategic impact areas
  const impactData = [
    { name: 'Education Access', value: 35, color: '#3b82f6' },
    { name: 'Financial Stability', value: 28, color: '#10b981' },
    { name: 'Health Support', value: 18, color: '#ef4444' },
    { name: 'Emergency Relief', value: 19, color: '#f59e0b' },
  ];

  const strategyItems = [
    { goal: 'Expand to 500 Beneficiaries', current: 340, target: 500, progress: 68 },
    { goal: 'Increase Fund Utilization', current: 90, target: 95, progress: 95 },
    { goal: 'Achieve 98% Satisfaction', current: 97, target: 98, progress: 99 },
    { goal: 'Reduce Processing Time', current: 3.2, target: 2, progress: 62 },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Maroon/President Header */}
      <div className="bg-gradient-to-r from-[#742033] to-[#8A1F3A] text-white p-6 rounded-b-3xl shadow-lg mb-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <UcuBadgeLogo className="h-9 w-9" imageClassName="object-contain p-0.5" />
            <div>
              <h2 className="text-2xl font-semibold">President Dashboard</h2>
              <p className="text-sm opacity-80 mt-1">Strategic overview and organization impact metrics</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">

      {/* Strategic KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Users className="w-4 h-4" />
                Active Beneficiaries
              </p>
              <p className="text-2xl font-bold text-blue-600">340</p>
              <p className="text-sm text-green-600">+39% this year</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Fund Utilization
              </p>
              <p className="text-2xl font-bold text-green-600">90%</p>
              <p className="text-sm text-muted-foreground">Target: 95%</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Award className="w-4 h-4" />
                Satisfaction Rate
              </p>
              <p className="text-2xl font-bold text-purple-600">97%</p>
              <p className="text-sm text-green-600">+5% improvement</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Total Impact
              </p>
              <p className="text-2xl font-bold text-emerald-600">{loading ? 'Loading...' : formatCurrency(loansDisbursedTotal + supportDisbursedTotal)}</p>
              <p className="text-sm text-muted-foreground">YTD disbursed</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Strategic Objectives */}
      <Card>
        <CardHeader>
          <CardTitle>Strategic Objectives & Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {strategyItems.map((item, idx) => (
            <div key={idx} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-sm">{item.goal}</span>
                <span className="text-xs bg-slate-100 px-2 py-1 rounded">{item.progress}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2.5">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2.5 rounded-full transition-all"
                  style={{ width: `${item.progress}%` }}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Performance Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Organization Performance Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={performanceTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="beneficiaries" stroke="#3b82f6" strokeWidth={2} name="Beneficiaries" />
              <Line yAxisId="right" type="monotone" dataKey="satisfaction" stroke="#8b5cf6" strokeWidth={2} name="Satisfaction %" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Impact Allocation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Strategic Impact Areas</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={impactData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {impactData.map((entry) => (
                    <Cell key={`cell-${entry.name}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Financial Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Financial Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs text-muted-foreground">Gross Approved (YTD)</p>
              <p className="text-xl font-bold text-blue-600">{loading ? 'Loading...' : formatCurrency(grossApprovedTotal)}</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
              <p className="text-xs text-muted-foreground">Net Disbursed to Beneficiaries</p>
              <p className="text-xl font-bold text-purple-600">{loading ? 'Loading...' : formatCurrency(netPaidOutTotal)}</p>
            </div>
            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
              <p className="text-xs text-muted-foreground">Operational Deductions</p>
              <p className="text-xl font-bold text-red-600">{loading ? 'Loading...' : formatCurrency(automatedDeductionsTotal)}</p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
              <p className="text-xs text-muted-foreground">Loans Outstanding</p>
              <p className="text-xl font-bold text-emerald-600">UGX 156.8M</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Risk & Compliance Status */}
      <Card>
        <CardHeader>
          <CardTitle>Risk & Compliance Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 border border-green-300 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-green-900">Compliance Status</p>
                <span className="text-2xl">✓</span>
              </div>
              <p className="text-sm text-green-700">All audit requirements met</p>
              <p className="text-xs text-green-600 mt-1">Last audit: Feb 2025</p>
            </div>
            <div className="p-4 bg-amber-50 border border-amber-300 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-amber-900">Risk Level</p>
                <span className="text-2xl text-amber-600">LOW</span>
              </div>
              <p className="text-sm text-amber-700">Operational risks monitored</p>
              <p className="text-xs text-amber-600 mt-1">22 items tracked</p>
            </div>
            <div className="p-4 bg-blue-50 border border-blue-300 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-blue-900">Policy Status</p>
                <span className="text-2xl">✓</span>
              </div>
              <p className="text-sm text-blue-700">All policies up to date</p>
              <p className="text-xs text-blue-600 mt-1">Next review: May 2025</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Executive Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Executive Actions Required</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex justify-between items-center">
              <div>
                <p className="font-semibold text-blue-900">Approve Q2 Strategic Plan</p>
                <p className="text-xs text-blue-700 mt-1">Due: End of March</p>
              </div>
              <Button size="sm">Review</Button>
            </div>
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg flex justify-between items-center">
              <div>
                <p className="font-semibold text-purple-900">Annual Stakeholder Report</p>
                <p className="text-xs text-purple-700 mt-1">Due: End of Quarter</p>
              </div>
              <Button size="sm">Generate</Button>
            </div>
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex justify-between items-center">
              <div>
                <p className="font-semibold text-green-900">Board Meeting Presentation</p>
                <p className="text-xs text-green-700 mt-1">Next: March 15</p>
              </div>
              <Button size="sm">Prepare</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Organization Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Organization Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <p className="text-2xl font-bold text-slate-900">340</p>
              <p className="text-xs text-muted-foreground">Active Members</p>
            </div>
            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <p className="text-2xl font-bold text-slate-900">12</p>
              <p className="text-xs text-muted-foreground">Staff Members</p>
            </div>
            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <p className="text-2xl font-bold text-slate-900">28</p>
              <p className="text-xs text-muted-foreground">Partners</p>
            </div>
            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <p className="text-2xl font-bold text-slate-900">97%</p>
              <p className="text-xs text-muted-foreground">Satisfaction</p>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
