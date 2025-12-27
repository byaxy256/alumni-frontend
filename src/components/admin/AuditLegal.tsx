import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Download, FileText, Shield, Search, Calendar, Filter } from 'lucide-react';
import { toast } from 'sonner';

const auditLogs = [
  { id: 1, timestamp: '2024-11-03 14:23:45', user: 'admin@ucu.ac.ug', action: 'Loan Disbursement Approved', details: 'Sarah Nakato - UGX 5,000,000', ipAddress: '196.43.128.45' },
  { id: 2, timestamp: '2024-11-03 13:15:22', user: 'alumni.office@ucu.ac.ug', action: 'User Verified', details: 'Grace Namugga - Alumni Office', ipAddress: '196.43.128.46' },
  { id: 3, timestamp: '2024-11-03 12:45:10', user: 'admin@ucu.ac.ug', action: 'System Config Updated', details: 'MTN API Keys - Payment Gateway', ipAddress: '196.43.128.45' },
  { id: 4, timestamp: '2024-11-03 11:30:55', user: 'alumni.office@ucu.ac.ug', action: 'CSV Import Completed', details: '234 alumni records imported', ipAddress: '196.43.128.47' },
  { id: 5, timestamp: '2024-11-03 10:22:33', user: 'admin@ucu.ac.ug', action: 'User Suspended', details: 'Peter Obua - Loan default', ipAddress: '196.43.128.45' },
  { id: 6, timestamp: '2024-11-03 09:15:18', user: 'alumni.office@ucu.ac.ug', action: 'Broadcast Email Sent', details: 'Scholarship announcement - 1,234 recipients', ipAddress: '196.43.128.46' },
  { id: 7, timestamp: '2024-11-02 16:45:22', user: 'admin@ucu.ac.ug', action: 'Chop Deduction Processed', details: 'Mary Achieng - UGX 850,000', ipAddress: '196.43.128.45' },
  { id: 8, timestamp: '2024-11-02 15:30:12', user: 'alumni.office@ucu.ac.ug', action: 'Application Approved', details: 'David Musoke - Support Request', ipAddress: '196.43.128.47' },
];

const consentForms = [
  { id: 1, studentName: 'Sarah Nakato', studentId: 'UCU/2021/0456', formType: 'Chop Consent', signedDate: '2024-10-28', status: 'signed' },
  { id: 2, studentName: 'Mary Achieng', studentId: 'UCU/2020/0789', formType: 'Loan Agreement', signedDate: '2024-11-01', status: 'signed' },
  { id: 3, studentName: 'David Musoke', studentId: 'UCU/2022/0234', formType: 'Chop Consent', signedDate: '2024-10-30', status: 'pending' },
  { id: 4, studentName: 'Moses Oketch', studentId: 'UCU/2021/0567', formType: 'Loan Agreement', signedDate: '2024-10-25', status: 'signed' },
];

export default function AuditLegal() {
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         log.details.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  const handleExportLogs = () => {
    toast.success('Audit logs exported to CSV');
  };

  const handleExportConsent = (studentName: string) => {
    toast.success(`Consent form for ${studentName} downloaded`);
  };

  const handleExportAllConsent = () => {
    toast.success('All consent forms exported as ZIP');
  };

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div>
        <h1>Audit & Legal Documents</h1>
        <p className="text-muted-foreground">Immutable activity logs and student consent forms</p>
      </div>

      {/* Audit Logs Section */}
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Digital Audit Log (Footprints)
            </CardTitle>
            <Button onClick={handleExportLogs} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export Logs
            </Button>
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
                <SelectItem value="Loan Disbursement Approved">Loan Disbursements</SelectItem>
                <SelectItem value="System Config Updated">Config Changes</SelectItem>
                <SelectItem value="User Verified">User Verifications</SelectItem>
                <SelectItem value="CSV Import Completed">Data Imports</SelectItem>
                <SelectItem value="Broadcast Email Sent">Broadcasts</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Logs Table */}
          <div className="overflow-x-auto">
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
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">{log.timestamp}</TableCell>
                    <TableCell>{log.user}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{log.action}</Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{log.details}</TableCell>
                    <TableCell className="text-muted-foreground">{log.ipAddress}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="text-sm text-muted-foreground">
            <p>Total logs: {filteredLogs.length} | All logs are immutable and tamper-proof</p>
          </div>
        </CardContent>
      </Card>

      {/* Consent Forms Section */}
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Student Consent Forms
            </CardTitle>
            <Button onClick={handleExportAllConsent} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export All Forms
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Form Type</TableHead>
                  <TableHead>Signed Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {consentForms.map((form) => (
                  <TableRow key={form.id}>
                    <TableCell>
                      <div>
                        <p>{form.studentName}</p>
                        <p className="text-sm text-muted-foreground">{form.studentId}</p>
                      </div>
                    </TableCell>
                    <TableCell>{form.formType}</TableCell>
                    <TableCell className="text-muted-foreground">{form.signedDate}</TableCell>
                    <TableCell>
                      <Badge variant={form.status === 'signed' ? 'default' : 'secondary'}>
                        {form.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleExportConsent(form.studentName)}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="mt-6 p-4 bg-muted rounded-lg space-y-2">
            <h4>Legal Compliance Notes</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>All consent forms are digitally signed with timestamp verification</li>
              <li>Forms include student acknowledgment of chop deduction terms</li>
              <li>Privacy policy acceptance is recorded with each application</li>
              <li>Documents are stored with 256-bit AES encryption</li>
              <li>Audit logs are retained for 7 years per Uganda data protection regulations</li>
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
