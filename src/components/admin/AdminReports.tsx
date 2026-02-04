import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { FileText, Download, TrendingUp, Users, DollarSign, AlertCircle, BarChart3, PieChart as PieChartIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useEffect, useMemo, useState } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const reportTypes = [
  {
    id: 'fund-summary',
    name: 'Fund Summary Report',
    description: 'Complete overview of all fund balances, income, and expenses',
    icon: DollarSign,
    lastGenerated: '2024-11-01',
    format: ['PDF', 'Excel'],
  },
  {
    id: 'income-expense',
    name: 'Income vs Expense Report',
    description: 'Detailed breakdown of all income sources and expenditures (6 months)',
    icon: TrendingUp,
    lastGenerated: '2024-10-28',
    format: ['PDF', 'Excel'],
  },
  {
    id: 'donor-list',
    name: 'Donor List & Contributions',
    description: 'Complete list of donors with contribution history',
    icon: Users,
    lastGenerated: '2024-10-25',
    format: ['PDF', 'Excel', 'CSV'],
  },
  {
    id: 'defaulters',
    name: 'Loan Defaulters Report',
    description: 'List of students with overdue loan repayments (3+ months)',
    icon: AlertCircle,
    lastGenerated: '2024-11-02',
    format: ['PDF', 'Excel'],
  },
  {
    id: 'disbursements',
    name: 'Disbursements Report',
    description: 'All loan and support disbursements with CHOP deduction details',
    icon: FileText,
    lastGenerated: '2024-11-03',
    format: ['PDF', 'Excel'],
  },
  {
    id: 'project-performance',
    name: 'Project Performance Report',
    description: 'Progress and financial status of all programs (Loans & Support)',
    icon: BarChart3,
    lastGenerated: '2024-10-30',
    format: ['PDF', 'Excel'],
  },
];

type FundSummary = {
  generatedDate: string;
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  incomeBreakdown: {
    donations: number;
    loanRepayments: number;
  };
  expenseBreakdown: {
    loanDisbursements: number;
    supportGrants: number;
  };
  activeLoanCount: number;
  pendingApplications: number;
  totalDonors: number;
};

type IncomeExpensePoint = {
  month: string;
  income: number;
  expenses: number;
};

type DonorEntry = {
  name: string;
  email?: string;
  totalContributions: number;
  contributionCount: number;
  lastContribution: string;
};

export default function AdminReports() {
  const [loadingReport, setLoadingReport] = useState<string | null>(null);
  const [summary, setSummary] = useState<FundSummary | null>(null);
  const [incomeExpense, setIncomeExpense] = useState<IncomeExpensePoint[]>([]);
  const [topDonors, setTopDonors] = useState<DonorEntry[]>([]);
  const [dashboardLoading, setDashboardLoading] = useState(true);

  const handleGenerateReport = async (reportId: string, format: string) => {
    const reportKey = `${reportId}-${format}`;
    setLoadingReport(reportKey);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('You must be logged in to generate reports');
        setLoadingReport(null);
        return;
      }

      // Map reportId to backend endpoint
      const endpointMap: { [key: string]: string } = {
        'fund-summary': 'fund-summary',
        'income-expense': 'income-expense',
        'donor-list': 'donors',
        'defaulters': 'defaulters',
        'disbursements': 'disbursements',
        'project-performance': 'project-performance',
      };

      const endpoint = endpointMap[reportId];
      if (!endpoint) {
        toast.error('Invalid report type');
        setLoadingReport(null);
        return;
      }

      toast.info(`Generating ${format.toUpperCase()} report...`);

      const response = await fetch(`${API_URL}/api/reports/${endpoint}/${format.toLowerCase()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate report');
      }

      // Get filename from Content-Disposition header or create default
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `${reportId}-${Date.now()}.${format === 'Excel' ? 'csv' : format.toLowerCase()}`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename=(.+)/);
        if (filenameMatch) {
          filename = filenameMatch[1].replace(/"/g, '');
        }
      }

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`${format.toUpperCase()} report downloaded successfully!`);
    } catch (error: any) {
      console.error('Report generation error:', error);
      toast.error(error.message || 'Failed to generate report');
    } finally {
      setLoadingReport(null);
    }
  };

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setDashboardLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
          toast.error('You must be logged in to view reports');
          return;
        }

        const [summaryRes, incomeExpenseRes, donorsRes] = await Promise.all([
          fetch(`${API_URL}/api/reports/fund-summary/json`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_URL}/api/reports/income-expense/json`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_URL}/api/reports/donors/json`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (!summaryRes.ok) throw new Error('Failed to load fund summary');
        if (!incomeExpenseRes.ok) throw new Error('Failed to load income vs expense');
        if (!donorsRes.ok) throw new Error('Failed to load donors');

        const summaryData = (await summaryRes.json()) as FundSummary;
        const incomeExpenseData = await incomeExpenseRes.json();
        const donorsData = await donorsRes.json();

        setSummary(summaryData);
        setIncomeExpense(incomeExpenseData.months || []);
        setTopDonors((donorsData.donors || []).slice(0, 5));
      } catch (error: any) {
        console.error('Failed to load report dashboard:', error);
        toast.error(error.message || 'Failed to load report dashboard');
      } finally {
        setDashboardLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const formatCurrency = (amount: number) => {
    const safeAmount = Number.isFinite(amount) ? amount : 0;
    return `UGX ${(safeAmount / 1000000).toFixed(1)}M`;
  };

  const expenseBreakdown = useMemo(() => {
    if (!summary) return [];
    return [
      { name: 'Loan Disbursements', value: summary.expenseBreakdown.loanDisbursements, color: '#0b2a4a' },
      { name: 'Support Grants', value: summary.expenseBreakdown.supportGrants, color: '#c79b2d' },
    ];
  }, [summary]);

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Reports & Analytics Hub</h2>
        <p className="text-muted-foreground">System-wide financial reports, risk analysis, and performance metrics</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total Income</p>
              <p className="text-2xl text-primary font-bold">
                {dashboardLoading ? 'Loading...' : formatCurrency(summary?.totalIncome ?? 0)}
              </p>
              <p className="text-sm text-muted-foreground">All-time</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total Expenses</p>
              <p className="text-2xl text-orange-600 font-bold">
                {dashboardLoading ? 'Loading...' : formatCurrency(summary?.totalExpenses ?? 0)}
              </p>
              <p className="text-sm text-muted-foreground">
                {dashboardLoading || !summary ? '—' : `${summary.totalIncome ? Math.round((summary.totalExpenses / summary.totalIncome) * 100) : 0}% of income`}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Active Loans</p>
              <p className="text-2xl text-primary font-bold">
                {dashboardLoading ? 'Loading...' : summary?.activeLoanCount ?? 0}
              </p>
              <p className="text-sm text-muted-foreground">
                {dashboardLoading ? '—' : `${summary?.pendingApplications ?? 0} pending approval`}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total Donors</p>
              <p className="text-2xl text-accent font-bold">
                {dashboardLoading ? 'Loading...' : summary?.totalDonors ?? 0}
              </p>
              <p className="text-sm text-muted-foreground">All-time</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Income vs Expense (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={incomeExpense}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`} />
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                <Legend />
                <Bar dataKey="income" fill="#0b2a4a" name="Income" />
                <Bar dataKey="expenses" fill="#c79b2d" name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expense Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={expenseBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {expenseBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Donors */}
      <Card>
        <CardHeader>
          <CardTitle>Top Donors (Last 6 Months)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topDonors.map((donor, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                    <span className="text-accent font-bold">#{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-semibold">{donor.name}</p>
                    <p className="text-sm text-muted-foreground">{donor.contributionCount} contributions</p>
                  </div>
                </div>
                <p className="text-accent font-bold">{formatCurrency(donor.totalContributions)}</p>
              </div>
            ))}
            {!dashboardLoading && topDonors.length === 0 && (
              <div className="text-sm text-muted-foreground">No donor data available.</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Report Generation Hub */}
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-bold mb-2">Generate System Reports</h3>
          <p className="text-muted-foreground">Export comprehensive reports in PDF, Excel, or CSV format for auditing, analysis, and stakeholder reporting.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reportTypes.map((report) => {
            const Icon = report.icon;
            return (
              <Card key={report.id}>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold">{report.name}</h4>
                      <p className="text-sm text-muted-foreground">{report.description}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Last generated: {report.lastGenerated}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {report.format.map((format) => (
                      <Button
                        key={format}
                        size="sm"
                        variant="outline"
                        onClick={() => handleGenerateReport(report.id, format)}
                        disabled={loadingReport === `${report.id}-${format}`}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        {loadingReport === `${report.id}-${format}` ? 'Generating...' : format}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
