import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { FileText, Download, TrendingUp, Users, DollarSign, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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
    description: 'Detailed breakdown of all income sources and expenditures',
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
    description: 'List of students with overdue loan repayments',
    icon: AlertCircle,
    lastGenerated: '2024-11-02',
    format: ['PDF', 'Excel'],
  },
  {
    id: 'disbursements',
    name: 'Disbursements Report',
    description: 'All loan and support disbursements with chop details',
    icon: FileText,
    lastGenerated: '2024-11-03',
    format: ['PDF', 'Excel'],
  },
  {
    id: 'project-performance',
    name: 'Project Performance Report',
    description: 'Progress and financial status of all projects',
    icon: TrendingUp,
    lastGenerated: '2024-10-30',
    format: ['PDF', 'Excel'],
  },
];

const incomeData = [
  { month: 'Jul', graduandFees: 8000000, donations: 12000000, merchEvents: 2500000, other: 1500000 },
  { month: 'Aug', graduandFees: 9500000, donations: 15000000, merchEvents: 3200000, other: 2000000 },
  { month: 'Sep', graduandFees: 7800000, donations: 13500000, merchEvents: 2800000, other: 1800000 },
  { month: 'Oct', graduandFees: 10200000, donations: 18000000, merchEvents: 4100000, other: 2500000 },
  { month: 'Nov', graduandFees: 8500000, donations: 16500000, merchEvents: 3500000, other: 2200000 },
];

const expenseBreakdown = [
  { name: 'Loan Disbursements', value: 65000000, color: '#0b2a4a' },
  { name: 'Support Grants', value: 25000000, color: '#c79b2d' },
  { name: 'Operational Costs', value: 8000000, color: '#2d5a7b' },
  { name: 'Project Expenses', value: 15000000, color: '#e6c86f' },
  { name: 'Other', value: 3000000, color: '#8a9ba8' },
];

const topDonors = [
  { name: 'Alumni Class of 2015', amount: 25000000, contributions: 12 },
  { name: 'UCU Faculty Fundraiser', amount: 18000000, contributions: 45 },
  { name: 'Anonymous Donor #234', amount: 15000000, contributions: 3 },
  { name: 'Corporate Partnership - XYZ Ltd', amount: 12000000, contributions: 1 },
  { name: 'Alumni Class of 2010', amount: 10000000, contributions: 8 },
];

export default function Reports() {
  const handleGenerateReport = (reportId: string, format: string) => {
    toast.success(`Generating ${format} report...`);
    // Simulate download
    setTimeout(() => {
      toast.success(`${format} report downloaded successfully`);
    }, 1500);
  };

  const formatCurrency = (amount: number) => {
    return `UGX ${(amount / 1000000).toFixed(1)}M`;
  };

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div>
        <h2>Reports & Analytics</h2>
        <p className="text-muted-foreground">Generate downloadable reports and view fund analytics</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total Income (Oct)</p>
              <p className="text-2xl text-primary">UGX 34.8M</p>
              <p className="text-sm text-green-600">+15% from Sept</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total Expenses (Oct)</p>
              <p className="text-2xl text-orange-600">UGX 28.2M</p>
              <p className="text-sm text-muted-foreground">81% of income</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Active Loans</p>
              <p className="text-2xl text-primary">456</p>
              <p className="text-sm text-muted-foreground">23 pending approval</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total Donors</p>
              <p className="text-2xl text-accent">1,847</p>
              <p className="text-sm text-green-600">+234 this month</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Income by Source</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={incomeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`} />
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                <Legend />
                <Bar dataKey="graduandFees" stackId="a" fill="#0b2a4a" name="Graduand Fees" />
                <Bar dataKey="donations" stackId="a" fill="#c79b2d" name="Donations" />
                <Bar dataKey="merchEvents" stackId="a" fill="#2d5a7b" name="Merch & Events" />
                <Bar dataKey="other" stackId="a" fill="#8a9ba8" name="Other" />
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
                    <span className="text-accent">#{index + 1}</span>
                  </div>
                  <div>
                    <p>{donor.name}</p>
                    <p className="text-sm text-muted-foreground">{donor.contributions} contributions</p>
                  </div>
                </div>
                <p className="text-accent">{formatCurrency(donor.amount)}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Report Generation */}
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
                        >
                          <Download className="w-4 h-4 mr-2" />
                          {format}
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
