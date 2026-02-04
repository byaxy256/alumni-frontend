import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Plus, DollarSign, TrendingUp, Target, Calendar, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { Progress } from '../ui/progress';

const projects = [
  {
    id: 1,
    name: 'Engineering Lab Equipment Fund',
    type: 'restricted',
    target: 50000000,
    raised: 35000000,
    expenses: 28000000,
    donors: 45,
    startDate: '2024-01-15',
    endDate: '2024-12-31',
    status: 'active',
  },
  {
    id: 2,
    name: 'General Student Support',
    type: 'unrestricted',
    target: 100000000,
    raised: 78000000,
    expenses: 65000000,
    donors: 234,
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    status: 'active',
  },
  {
    id: 3,
    name: 'Library Renovation',
    type: 'restricted',
    target: 30000000,
    raised: 32000000,
    expenses: 30000000,
    donors: 67,
    startDate: '2023-08-01',
    endDate: '2024-02-28',
    status: 'completed',
  },
  {
    id: 4,
    name: 'Scholarship Fund 2024',
    type: 'restricted',
    target: 75000000,
    raised: 45000000,
    expenses: 40000000,
    donors: 123,
    startDate: '2024-03-01',
    endDate: '2024-11-30',
    status: 'active',
  },
];

const transactions = [
  { id: 1, date: '2024-11-03', description: 'Donation from Alumni Class of 2015', project: 'Engineering Lab Equipment Fund', amount: 5000000, type: 'income', ledgerCode: 'DON-001' },
  { id: 2, date: '2024-11-02', description: 'Lab equipment purchase - Microscopes', project: 'Engineering Lab Equipment Fund', amount: -3500000, type: 'expense', ledgerCode: 'EXP-LAB-034' },
  { id: 3, date: '2024-11-01', description: 'Graduand fees collection', project: 'General Student Support', amount: 8000000, type: 'income', ledgerCode: 'FEE-GRAD-045' },
  { id: 4, date: '2024-10-30', description: 'Student loan disbursement - Sarah Nakato', project: 'General Student Support', amount: -5000000, type: 'expense', ledgerCode: 'LOAN-234' },
  { id: 5, date: '2024-10-28', description: 'Merch sales - Homecoming event', project: 'General Student Support', amount: 2500000, type: 'income', ledgerCode: 'MERCH-EVENT-12' },
];

export default function ProjectManagement() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showTransactionDialog, setShowTransactionDialog] = useState(false);

  const handleCreateProject = () => {
    toast.success('Project created successfully');
    setShowCreateDialog(false);
  };

  const handleRecordTransaction = () => {
    toast.success('Transaction recorded');
    setShowTransactionDialog(false);
  };

  const formatCurrency = (amount: number) => {
    return `UGX ${Math.abs(amount).toLocaleString()}`;
  };

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2>Project & Income Management</h2>
          <p className="text-muted-foreground">Manage fund projects, track income and expenses</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showTransactionDialog} onOpenChange={setShowTransactionDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <DollarSign className="w-4 h-4 mr-2" />
                Record Transaction
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record Income/Expense</DialogTitle>
                <DialogDescription>Add a new transaction to a project</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="transactionType">Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">Income</SelectItem>
                      <SelectItem value="expense">Expense</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="project">Project</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.filter(p => p.status === 'active').map((project) => (
                        <SelectItem key={project.id} value={project.id.toString()}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (UGX)</Label>
                  <Input id="amount" type="number" placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" placeholder="Enter transaction details" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ledgerCode">Ledger Code</Label>
                  <Input id="ledgerCode" placeholder="e.g., DON-001, EXP-LAB-034" />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleRecordTransaction}>Record Transaction</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
                <DialogDescription>Set up a new fundraising project or fund</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Project Name</Label>
                  <Input id="name" placeholder="e.g., Engineering Lab Equipment Fund" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Project Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="restricted">Restricted (Specific Purpose)</SelectItem>
                      <SelectItem value="unrestricted">Unrestricted (General Fund)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="target">Target Amount (UGX)</Label>
                  <Input id="target" type="number" placeholder="0" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input id="startDate" type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <Input id="endDate" type="date" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" placeholder="Project description and goals" />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreateProject}>Create Project</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {projects.map((project) => {
          const progress = (project.raised / project.target) * 100;
          const available = project.raised - project.expenses;
          
          return (
            <Card key={project.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle>{project.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant={project.type === 'restricted' ? 'default' : 'secondary'}>
                        {project.type}
                      </Badge>
                      <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                        {project.status}
                      </Badge>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon">
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Progress</span>
                    <span className="text-sm">{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Target</p>
                    <p>{formatCurrency(project.target)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Raised</p>
                    <p className="text-green-600">{formatCurrency(project.raised)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Expenses</p>
                    <p className="text-orange-600">{formatCurrency(project.expenses)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Available</p>
                    <p className="text-primary">{formatCurrency(available)}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Target className="w-4 h-4" />
                    <span>{project.donors} donors</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(project.endDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <p>{transaction.description}</p>
                  <div className="flex items-center gap-4 mt-1">
                    <p className="text-sm text-muted-foreground">{transaction.project}</p>
                    <Badge variant="outline" className="text-xs">
                      {transaction.ledgerCode}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`${transaction.type === 'income' ? 'text-green-600' : 'text-orange-600'}`}>
                    {transaction.type === 'income' ? '+' : '-'} {formatCurrency(transaction.amount)}
                  </p>
                  <p className="text-sm text-muted-foreground">{transaction.date}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
