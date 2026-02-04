import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Download, FileText, Shield, Search, RefreshCw, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { apiCall } from '../../api';

interface AuditLog {
  _id: string;
  timestamp: string;
  user_uid: string;
  user_email?: string;
  user_role?: string;
  action: string;
  details: string;
  ip_address?: string;
  metadata?: Record<string, any>;
}

interface FinancialStatement {
  loan_id: string;
  student_uid: string;
  student_name: string;
  email?: string;
  amount?: number;
  status?: string;
  url: string;
  filename?: string;
  uploaded_at?: string;
}

export default function AuditLegal() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [financialStatements, setFinancialStatements] = useState<FinancialStatement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statementsLoading, setStatementsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');

  useEffect(() => {
    loadAuditLogs();
    loadFinancialStatements();
  }, [actionFilter]);

  const loadAuditLogs = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({ limit: '100' });
      if (actionFilter !== 'all') {
        params.append('action', actionFilter);
      }
      
      const logs = await apiCall(`/admin/audit-logs?${params.toString()}`, 'GET', undefined, token || undefined);
      setAuditLogs(logs);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadFinancialStatements = async () => {
    try {
      setStatementsLoading(true);
      const token = localStorage.getItem('token');
      const statements = await apiCall('/admin/financial-statements', 'GET', undefined, token || undefined);
      setFinancialStatements(statements || []);
    } catch (err) {
      console.error('Failed to load financial statements:', err);
      toast.error('Failed to load financial statements');
    } finally {
      setStatementsLoading(false);
    }
  };

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = !searchQuery ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.user_email?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return timestamp;
    }
  };

  const getActionBadgeColor = (action: string) => {
    if (action.includes('APPROVED') || action.includes('LOGIN')) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    if (action.includes('REJECTED') || action.includes('SUSPENDED') || action.includes('LOGOUT')) return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    if (action.includes('UPDATED') || action.includes('MODIFIED')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    if (action.includes('DISBURSED') || action.includes('DONATION')) return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  };

  const handleExportLogs = () => {
    if (!auditLogs.length) {
      toast.info('No logs to export');
      return;
    }

    const csvHeader = ['timestamp','user_email','user_role','action','details','ip_address'];
    const rows = auditLogs.map(l => [
      formatTimestamp(l.timestamp).replace(/,/g,' '),
      l.user_email || '',
      l.user_role || '',
      l.action,
      (l.details || '').replace(/\n/g,' '),
      l.ip_address || ''
    ]);

    const csv = [csvHeader.join(','), ...rows.map(r => r.map(val => `"${String(val).replace(/"/g,'""')}"`).join(','))].join('\n');
    downloadBlob(csv, 'audit-logs.csv', 'text/csv');
    toast.success('Audit logs exported');
  };

  const handleExportStatements = () => {
    if (!financialStatements.length) {
      toast.info('No financial statements to export');
      return;
    }

    const csvHeader = ['student_name','email','amount','status','uploaded_at','filename','url'];
    const rows = financialStatements.map(s => [
      s.student_name,
      s.email || '',
      s.amount ? s.amount : '',
      s.status || '',
      s.uploaded_at ? formatTimestamp(s.uploaded_at) : '',
      s.filename || '',
      s.url
    ]);
    const csv = [csvHeader.join(','), ...rows.map(r => r.map(val => `"${String(val).replace(/"/g,'""')}"`).join(','))].join('\n');
    downloadBlob(csv, 'financial-statements.csv', 'text/csv');
    toast.success('Financial statements exported');
  };

  const handleViewStatement = (url: string) => {
    if (!url) {
      toast.error('No file URL available');
      return;
    }
    window.open(url, '_blank');
  };

  const downloadBlob = (data: string, filename: string, type: string) => {
    const blob = new Blob([data], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div>
        <h1>Audit & Legal Documents</h1>
        <p className="text-muted-foreground">Immutable activity logs and financial statements from loan applications</p>
      </div>

      {/* Audit Logs Section */}
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Digital Audit Log (Footprints)
            </CardTitle>
            <div className="flex gap-2">
              <Button 
                onClick={() => loadAuditLogs(true)} 
                variant="outline" 
                size="sm"
                disabled={refreshing}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button onClick={handleExportLogs} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export Logs
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="USER_LOGIN">Login</SelectItem>
                <SelectItem value="USER_LOGOUT">Logout</SelectItem>
                <SelectItem value="APPLICATION_APPROVED">Applications Approved</SelectItem>
                <SelectItem value="APPLICATION_REJECTED">Applications Rejected</SelectItem>
                <SelectItem value="LOAN_DISBURSED">Loan Disbursements</SelectItem>
                <SelectItem value="DONATION_RECEIVED">Donations</SelectItem>
                <SelectItem value="USER_CREATED">User Registration</SelectItem>
                <SelectItem value="USER_UPDATED">User Updates</SelectItem>
                <SelectItem value="ALUMNI_OFFICE_APPROVED">Alumni Office Approvals</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Logs Table */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Loading audit logs...</span>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No audit logs found</p>
                <p className="text-sm">Activity will appear here as system actions occur</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log._id}>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {formatTimestamp(log.timestamp)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{log.user_email || 'Unknown'}</div>
                          {log.user_role && (
                            <div className="text-xs text-muted-foreground capitalize">{log.user_role}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getActionBadgeColor(log.action)}>{log.action}</Badge>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="truncate" title={log.details}>{log.details}</div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{log.ip_address || 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          <div className="text-sm text-muted-foreground">
            <p>Total logs: {filteredLogs.length} | All logs are immutable and tamper-proof</p>
          </div>
        </CardContent>
      </Card>

      {/* Financial Statements Section */}
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Financial Statements
            </CardTitle>
            <Button onClick={handleExportStatements} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export All
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto">
            {statementsLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Loading financial statements...</span>
              </div>
            ) : financialStatements.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No financial statements found</p>
                <p className="text-sm">Uploaded statements from loan applications will appear here</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead>File</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {financialStatements.map((statement) => (
                    <TableRow key={`${statement.loan_id}-${statement.filename || statement.url}`}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{statement.student_name}</p>
                          <p className="text-sm text-muted-foreground">{statement.student_uid}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{statement.email || '—'}</TableCell>
                      <TableCell className="text-sm">{statement.amount ? `UGX ${statement.amount.toLocaleString()}` : '—'}</TableCell>
                      <TableCell>
                        <Badge variant={statement.status === 'approved' ? 'default' : 'secondary'} className="capitalize">
                          {statement.status || 'pending'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{statement.uploaded_at ? formatTimestamp(statement.uploaded_at) : '—'}</TableCell>
                      <TableCell className="space-x-2 whitespace-nowrap">
                        {statement.url ? (
                          <>
                            <Button size="sm" variant="secondary" onClick={() => handleViewStatement(statement.url)}>
                              <ExternalLink className="w-4 h-4 mr-2" />
                              View
                            </Button>
                            <Button size="sm" variant="outline" asChild>
                              <a href={statement.url} target="_blank" rel="noreferrer" download>
                                <Download className="w-4 h-4 mr-2" />
                                Download
                              </a>
                            </Button>
                          </>
                        ) : (
                          <span className="text-sm text-muted-foreground">No file available</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          <div className="mt-6 p-4 bg-muted rounded-lg space-y-2">
            <h4>Document Review Notes</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Verify uploads match student identity and requested amounts</li>
              <li>Download files for offline review or attach to case notes</li>
              <li>All files are stored in secured uploads and surfaced here for auditability</li>
              <li>Use the audit log above to track who accessed or approved each case</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* FAQ Section */}
      <Card>
        <CardHeader>
          <CardTitle>Chop System FAQ & Privacy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4>What is "chop" and how does it work?</h4>
            <p className="text-sm text-muted-foreground">
              "Chop" is an automatic deduction mechanism where loan repayments are deducted directly from a student's 
              university disbursements (stipends, allowances, etc.). This ensures timely repayment and reduces default rates.
            </p>
          </div>

          <div className="space-y-2">
            <h4>Appeals Process</h4>
            <p className="text-sm text-muted-foreground">
              Students may appeal chop deductions within 7 days of notification by submitting a formal request through 
              the Alumni Office. Appeals are reviewed by a committee and decisions are communicated within 14 business days.
            </p>
          </div>

          <div className="space-y-2">
            <h4>Data Privacy & Security</h4>
            <p className="text-sm text-muted-foreground">
              All student data is protected under Uganda's Data Protection and Privacy Act. We collect only necessary 
              information, use end-to-end encryption, and never share data with third parties without explicit consent. 
              Students can request data deletion after loan completion per GDPR-equivalent rights.
            </p>
          </div>

          <div className="space-y-2">
            <h4>Grace Period & Late Fees</h4>
            <p className="text-sm text-muted-foreground">
              A 30-day grace period is provided before late fees apply. Late fees are calculated at 2% per month on 
              outstanding balances. Students are notified 7 days before grace period expiration.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
