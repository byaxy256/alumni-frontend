import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { AlertCircle, DollarSign } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { UcuBadgeLogo } from '../UcuBadgeLogo';
import { API_BASE } from '../../api';

interface FinancialRecord {
  _id?: string;
  status?: string;
  approved_amount?: number;
  disbursedAmount?: number;
  amount_disbursed?: number;
  amountRequested?: number;
  amount_requested?: number;
  amount?: number;
  createdAt?: string;
}

interface DisbursementRecord {
  _id?: string;
  student_id?: string;
  original_amount?: number;
  deduction_amount?: number;
  net_amount?: number;
  createdAt?: string;
  deduction_reason?: string;
}

export function FinanceDashboard() {
  const [loanRecords, setLoanRecords] = useState<FinancialRecord[]>([]);
  const [supportRecords, setSupportRecords] = useState<FinancialRecord[]>([]);
  const [disbursementRecords, setDisbursementRecords] = useState<DisbursementRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFinancialData();
  }, []);

  const loadFinancialData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const [loansRes, supportRes, disburseRes] = await Promise.all([
        fetch(`${API_BASE}/loans`, { headers }),
        fetch(`${API_BASE}/support`, { headers }),
        fetch(`${API_BASE}/disburse`, { headers }),
      ]);

      setLoanRecords(loansRes.ok ? await loansRes.json() : []);
      setSupportRecords(supportRes.ok ? await supportRes.json() : []);
      setDisbursementRecords(disburseRes.ok ? await disburseRes.json() : []);
    } catch (error) {
      console.error('Error loading financial data:', error);
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

  const grossApprovedTotal = disbursementRecords.reduce((sum, d) => sum + Number(d.original_amount || 0), 0);
  const automatedDeductionsTotal = disbursementRecords.reduce((sum, d) => sum + Number(d.deduction_amount || 0), 0);
  const netPaidOutTotal = disbursementRecords.reduce((sum, d) => sum + Number(d.net_amount || 0), 0);
  const totalLoansRequested = loanRecords.reduce((sum, l) => sum + getAmount(l), 0);

  const financialTrends = useMemo(() => {
    const monthMap = new Map<string, { approved: number; disbursed: number; deductions: number; date: Date }>();
    disbursementRecords.forEach((record) => {
      const date = new Date(record.createdAt || Date.now());
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      const month = date.toLocaleDateString('en-US', { month: 'short' });
      const existing = monthMap.get(key) || { approved: 0, disbursed: 0, deductions: 0, date: new Date(date.getFullYear(), date.getMonth(), 1) };
      existing.approved += Number(record.original_amount || 0);
      existing.disbursed += Number(record.net_amount || 0);
      existing.deductions += Number(record.deduction_amount || 0);
      monthMap.set(key, existing);
      (monthMap.get(key) as any).month = month;
    });

    return Array.from(monthMap.values())
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(-6)
      .map((item) => ({
        month: item.date.toLocaleDateString('en-US', { month: 'short' }),
        approved: item.approved,
        disbursed: item.disbursed,
        deductions: item.deductions,
      }));
  }, [disbursementRecords]);

  const deductionData = useMemo(() => {
    const colors = ['#ef4444', '#f59e0b', '#8b5cf6', '#6b7280', '#3b82f6', '#10b981'];
    const reasonMap = new Map<string, number>();
    disbursementRecords.forEach((record) => {
      const reason = String(record.deduction_reason || 'other').trim() || 'other';
      const amount = Number(record.deduction_amount || 0);
      reasonMap.set(reason, (reasonMap.get(reason) || 0) + amount);
    });

    const total = Array.from(reasonMap.values()).reduce((sum, v) => sum + v, 0) || 1;
    return Array.from(reasonMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, amount], index) => ({
        name,
        value: Number(((amount / total) * 100).toFixed(1)),
        color: colors[index % colors.length],
      }));
  }, [disbursementRecords]);

  const pendingFinanceReviewCount = loanRecords.filter(
    (loan) => String(loan.status || '').toLowerCase() === 'pending'
  ).length;

  const awaitingApprovalCount = supportRecords.filter(
    (support) => String(support.status || '').toLowerCase() === 'reviewed'
  ).length;

  const readyToDisburseCount = loanRecords.filter(
    (loan) => String(loan.status || '').toLowerCase() === 'approved'
  ).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Gold/Financial Header */}
      <div className="bg-gradient-to-r from-[#b1882a] to-[#C79A2B] text-white p-6 rounded-b-3xl shadow-lg mb-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <UcuBadgeLogo className="h-9 w-9" imageClassName="object-contain p-0.5" />
            <div>
              <h2 className="text-2xl font-semibold">Finance Dashboard</h2>
              <p className="text-sm opacity-80 mt-1">Monitor fund flow, deductions, and financial accountability</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">

      {/* Key Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Gross Approved</p>
              <p className="text-2xl font-bold text-green-600">{loading ? 'Loading...' : formatCurrency(grossApprovedTotal)}</p>
              <p className="text-sm text-muted-foreground">Before deductions</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total Deductions</p>
              <p className="text-2xl font-bold text-red-600">{loading ? 'Loading...' : formatCurrency(automatedDeductionsTotal)}</p>
              <p className="text-sm text-muted-foreground">SACCO, insurance, fees</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Net Disbursed</p>
              <p className="text-2xl font-bold text-blue-600">{loading ? 'Loading...' : formatCurrency(netPaidOutTotal)}</p>
              <p className="text-sm text-muted-foreground">After all deductions</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total Pending</p>
              <p className="text-2xl font-bold text-amber-600">{loading ? 'Loading...' : formatCurrency(totalLoansRequested - loansDisbursedTotal)}</p>
              <p className="text-sm text-muted-foreground">Not yet approved</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Trend Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Fund Flow Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={financialTrends}>
              <defs>
                <linearGradient id="colorApproved" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorDisbursed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value as number)} />
              <Legend />
              <Area type="monotone" dataKey="approved" stroke="#10b981" fillOpacity={1} fill="url(#colorApproved)" name="Gross Approved" />
              <Area type="monotone" dataKey="disbursed" stroke="#3b82f6" fillOpacity={1} fill="url(#colorDisbursed)" name="Net Disbursed" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Deduction Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Deduction Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={deductionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {deductionData.map((entry) => (
                    <Cell key={`cell-${entry.name}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Deduction Details */}
        <Card>
          <CardHeader>
            <CardTitle>Deduction Categories</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {deductionData.map((item) => (
              <div key={item.name} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="font-medium">{item.name}</span>
                </div>
                <span className="text-lg font-bold">{item.value}%</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Fund Allocation by Category */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Fund Allocation by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={financialTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value as number)} />
              <Legend />
              <Bar dataKey="approved" fill="#10b981" name="Gross Approved" />
              <Bar dataKey="deductions" fill="#ef4444" name="Deductions" />
              <Bar dataKey="disbursed" fill="#3b82f6" name="Net Disbursed" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Approval Workflow Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            Approval Workflow Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-blue-900">Pending Finance Review</p>
                <span className="text-2xl font-bold text-blue-600">{pendingFinanceReviewCount}</span>
              </div>
              <div className="w-full bg-blue-200 rounded h-2">
                <div className="bg-blue-600 h-2 rounded" style={{ width: `${Math.min(100, pendingFinanceReviewCount * 4)}%` }} />
              </div>
              <Button size="sm" className="w-full mt-3" variant="outline">Review Now</Button>
            </div>
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-amber-900">Awaiting Approval</p>
                <span className="text-2xl font-bold text-amber-600">{awaitingApprovalCount}</span>
              </div>
              <div className="w-full bg-amber-200 rounded h-2">
                <div className="bg-amber-600 h-2 rounded" style={{ width: `${Math.min(100, awaitingApprovalCount * 5)}%` }} />
              </div>
              <Button size="sm" className="w-full mt-3" variant="outline">Process</Button>
            </div>
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-green-900">Ready to Disburse</p>
                <span className="text-2xl font-bold text-green-600">{readyToDisburseCount}</span>
              </div>
              <div className="w-full bg-green-200 rounded h-2">
                <div className="bg-green-600 h-2 rounded" style={{ width: `${Math.min(100, readyToDisburseCount * 3)}%` }} />
              </div>
              <Button size="sm" className="w-full mt-3" variant="outline">Disburse</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compliance & Reconciliation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Financial Reconciliation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
            <span>Total Loans Requested:</span>
            <span className="font-bold">{loading ? 'Loading...' : formatCurrency(totalLoansRequested)}</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
            <span>Total Loans Disbursed:</span>
            <span className="font-bold text-blue-600">{loading ? 'Loading...' : formatCurrency(loansDisbursedTotal)}</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
            <span>Support Requests Disbursed:</span>
            <span className="font-bold text-green-600">{loading ? 'Loading...' : formatCurrency(supportDisbursedTotal)}</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg font-bold border-2 border-purple-300">
            <span>Combined Disbursed Total:</span>
            <span className="text-lg">{loading ? 'Loading...' : formatCurrency(loansDisbursedTotal + supportDisbursedTotal)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Disbursements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {disbursementRecords.slice(0, 8).map((record, idx) => (
              <div key={record._id || idx} className="flex justify-between items-center p-3 border rounded-lg hover:bg-accent/5">
                <div>
                  <p className="font-medium">{record.student_id}</p>
                  <p className="text-xs text-muted-foreground">{record.deduction_reason || 'Standard deductions'}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">{formatCurrency(Number(record.net_amount || 0))}</p>
                  <p className="text-xs text-muted-foreground">-{formatCurrency(Number(record.deduction_amount || 0))}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
