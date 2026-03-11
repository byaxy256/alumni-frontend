import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { FileText, Download, TrendingUp, Users, DollarSign, AlertCircle, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const REFRESH_INTERVAL_MS = 60000;

const reportTypes = [
  {
    id: 'fund-summary',
    name: 'Fund Summary Report',
    description: 'Complete overview of all fund balances, income, and expenses',
    icon: DollarSign,
    format: ['PDF', 'Excel'],
  },
  {
    id: 'income-expense',
    name: 'Income vs Expense Report',
    description: 'Detailed 6-month income and expenditure trends',
    icon: TrendingUp,
    format: ['PDF', 'Excel'],
  },
  {
    id: 'donor-list',
    name: 'Donor List & Contributions',
    description: 'Complete list of donors with contribution history',
    icon: Users,
    format: ['PDF', 'Excel', 'CSV'],
  },
  {
    id: 'defaulters',
    name: 'Loan Defaulters Report',
    description: 'List of students with overdue loan repayments',
    icon: AlertCircle,
    format: ['PDF', 'Excel'],
  },
  {
    id: 'disbursements',
    name: 'Disbursements Report',
    description: 'All loan and support disbursements with CHOP details',
    icon: FileText,
    format: ['PDF', 'Excel'],
  },
  {
    id: 'project-performance',
    name: 'Project Performance Report',
    description: 'Progress and financial status of all projects',
    icon: BarChart3,
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
  totalContributions: number;
  contributionCount: number;
};

type DonationStats = {
  byCause?: Record<string, number>;
};

export default function Reports() {
  const [loadingReport, setLoadingReport] = useState<string | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [summary, setSummary] = useState<FundSummary | null>(null);
  const [incomeExpense, setIncomeExpense] = useState<IncomeExpensePoint[]>([]);
  const [topDonors, setTopDonors] = useState<DonorEntry[]>([]);
  const [donationStats, setDonationStats] = useState<DonationStats>({});
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);

  const formatCurrency = (amount: number) => {
    const safeAmount = Number.isFinite(amount) ? amount : 0;
    if (safeAmount >= 1000000000) return `UGX ${(safeAmount / 1000000000).toFixed(1)}B`;
    if (safeAmount >= 1000000) return `UGX ${(safeAmount / 1000000).toFixed(1)}M`;
    return `UGX ${Math.round(safeAmount).toLocaleString()}`;
  };

  const formatMonth = (value: string) => {
    if (/^\d{4}-\d{2}$/.test(value)) {
      const [year, month] = value.split('-').map(Number);
      const date = new Date(year, month - 1, 1);
      return date.toLocaleDateString(undefined, { month: 'short' });
    }
    return value;
  };

  const loadDashboardData = useCallback(async (silent = false) => {
    const token = localStorage.getItem('token');
    if (!token) {
      if (!silent) toast.error('You must be logged in to view reports');
      setDashboardLoading(false);
      return;
    }

    try {
      if (!silent) setDashboardLoading(true);

      const [summaryRes, incomeRes, donorsRes, donationStatsRes] = await Promise.all([
        fetch(`${API_URL}/api/reports/fund-summary/json`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        }),
        fetch(`${API_URL}/api/reports/income-expense/json`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        }),
        fetch(`${API_URL}/api/reports/donors/json`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        }),
        fetch(`${API_URL}/api/donations/all-stats`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        }),
      ]);

      if (!summaryRes.ok) throw new Error('Failed to load fund summary');
      if (!incomeRes.ok) throw new Error('Failed to load income/expense trend');
      if (!donorsRes.ok) throw new Error('Failed to load donor data');
      if (!donationStatsRes.ok) throw new Error('Failed to load donation source data');

      const summaryData = (await summaryRes.json()) as FundSummary;
      const incomeData = await incomeRes.json();
      const donorsData = await donorsRes.json();
      const donationStatsData = (await donationStatsRes.json()) as DonationStats;

      setSummary(summaryData);
      setIncomeExpense(Array.isArray(incomeData?.months) ? incomeData.months : []);
      setTopDonors(Array.isArray(donorsData?.donors) ? donorsData.donors.slice(0, 5) : []);
      setDonationStats(donationStatsData || {});
      setLastUpdatedAt(new Date());
    } catch (error: any) {
      console.error('Failed to load reports dashboard:', error);
      if (!silent) {
        toast.error(error?.message || 'Failed to load reports dashboard');
      }
    } finally {
      setDashboardLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData(false);

    const intervalId = window.setInterval(() => {
      loadDashboardData(true);
    }, REFRESH_INTERVAL_MS);

    const onFocus = () => loadDashboardData(true);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') loadDashboardData(true);
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [loadDashboardData]);

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

      const endpointMap: Record<string, string> = {
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

      const response = await fetch(`${API_URL}/api/reports/${endpoint}/${format.toLowerCase()}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to generate report');
      }

      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `${reportId}-${Date.now()}.${format === 'Excel' ? 'csv' : format.toLowerCase()}`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename=(.+)/);
        if (filenameMatch) filename = filenameMatch[1].replace(/"/g, '');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success(`${format.toUpperCase()} report downloaded successfully`);
    } catch (error: any) {
      console.error('Report generation error:', error);
      toast.error(error.message || 'Failed to generate report');
    } finally {
      setLoadingReport(null);
    }
  };

  const trendData = useMemo(
    () =>
      incomeExpense.map((point) => ({
        month: formatMonth(point.month),
        income: Number(point.income || 0),
        expenses: Number(point.expenses || 0),
      })),
    [incomeExpense],
  );

  const incomeSourceData = useMemo(() => {
    const colors = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)'];
    const causeEntries = Object.entries(donationStats.byCause || {}).filter(([, value]) => Number(value) > 0);

    const fromCauses = causeEntries.map(([name, value], index) => ({
      name,
      value: Number(value),
      color: colors[index % colors.length],
    }));

    if (summary?.incomeBreakdown?.loanRepayments) {
      fromCauses.push({
        name: 'Loan Repayments',
        value: Number(summary.incomeBreakdown.loanRepayments),
        color: 'var(--brand-purple)',
      });
    }

    if (fromCauses.length) return fromCauses;

    return [
      { name: 'Donations', value: Number(summary?.incomeBreakdown?.donations || 0), color: 'var(--chart-2)' },
      { name: 'Loan Repayments', value: Number(summary?.incomeBreakdown?.loanRepayments || 0), color: 'var(--chart-3)' },
    ].filter((item) => item.value > 0);
  }, [donationStats.byCause, summary]);

  const expenseBreakdown = useMemo(() => {
    if (!summary) return [];
    return [
      {
        name: 'Loan Disbursements',
        value: Number(summary.expenseBreakdown.loanDisbursements || 0),
        color: 'var(--chart-1)',
      },
      {
        name: 'Support Grants',
        value: Number(summary.expenseBreakdown.supportGrants || 0),
        color: 'var(--chart-2)',
      },
    ].filter((item) => item.value > 0);
  }, [summary]);

  const latestMonth = trendData.length ? trendData[trendData.length - 1] : null;
  const previousMonth = trendData.length > 1 ? trendData[trendData.length - 2] : null;
  const incomeDeltaPct =
    latestMonth && previousMonth && previousMonth.income > 0
      ? Math.round(((latestMonth.income - previousMonth.income) / previousMonth.income) * 100)
      : null;

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div>
        <h2>Reports & Analytics</h2>
        <p className="text-muted-foreground">Live financial analytics sourced from your database</p>
        {lastUpdatedAt ? (
          <p className="text-xs text-muted-foreground mt-1">
            Auto-updated {lastUpdatedAt.toLocaleTimeString()}
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total Income</p>
              <p className="text-2xl text-primary">{dashboardLoading ? 'Loading...' : formatCurrency(summary?.totalIncome || 0)}</p>
              <p className="text-sm text-muted-foreground">
                {incomeDeltaPct === null ? '—' : `${incomeDeltaPct >= 0 ? '+' : ''}${incomeDeltaPct}% vs previous month`}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total Expenses</p>
              <p className="text-2xl text-accent">{dashboardLoading ? 'Loading...' : formatCurrency(summary?.totalExpenses || 0)}</p>
              <p className="text-sm text-muted-foreground">
                {dashboardLoading || !summary
                  ? '—'
                  : `${summary.totalIncome > 0 ? Math.round((summary.totalExpenses / summary.totalIncome) * 100) : 0}% of income`}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Active Loans</p>
              <p className="text-2xl text-primary">{dashboardLoading ? 'Loading...' : summary?.activeLoanCount || 0}</p>
              <p className="text-sm text-muted-foreground">
                {dashboardLoading ? '—' : `${summary?.pendingApplications || 0} pending approval`}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total Donors</p>
              <p className="text-2xl text-accent">{dashboardLoading ? 'Loading...' : summary?.totalDonors || 0}</p>
              <p className="text-sm text-muted-foreground">All-time contributors</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Income vs Expense (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `${Math.round(Number(value) / 1000000)}M`} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Legend />
                <Bar dataKey="income" fill="var(--chart-1)" name="Income" />
                <Bar dataKey="expenses" fill="var(--chart-2)" name="Expenses" />
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
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={100}
                  dataKey="value"
                >
                  {expenseBreakdown.map((entry, index) => (
                    <Cell key={`expense-cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Income by Source</CardTitle>
        </CardHeader>
        <CardContent>
          {incomeSourceData.length ? (
            <div className="space-y-3">
              {incomeSourceData.map((source) => (
                <div key={source.name} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: source.color }} />
                    <span className="text-sm">{source.name}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{formatCurrency(source.value)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No income source data available yet.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top Donors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topDonors.map((donor, index) => (
              <div key={`${donor.name}-${index}`} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                    <span className="text-accent">#{index + 1}</span>
                  </div>
                  <div>
                    <p>{donor.name}</p>
                    <p className="text-sm text-muted-foreground">{donor.contributionCount} contributions</p>
                  </div>
                </div>
                <p className="text-accent">{formatCurrency(donor.totalContributions)}</p>
              </div>
            ))}
            {!dashboardLoading && !topDonors.length && (
              <p className="text-sm text-muted-foreground">No donor activity available yet.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Generate Reports</CardTitle>
        </CardHeader>
        <CardContent>
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
                        <h4>{report.name}</h4>
                        <p className="text-sm text-muted-foreground">{report.description}</p>
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
        </CardContent>
      </Card>
    </div>
  );
}
