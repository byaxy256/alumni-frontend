// src/components/alumni-office/ApplicationsQueue.tsx

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Search, Eye, Check, X, AlertCircle, FileText, Download, Loader2, ExternalLink, Paperclip } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { Checkbox } from '../ui/checkbox';
import { API_BASE } from '../../api';

const UPLOAD_BASE = API_BASE.replace(/\/api\/?$/, '');
function documentFullUrl(att: any): string {
  const url = att?.viewUrl || att?.view_url || att?.url || att?.storage_path || '';
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      const parsed = new URL(url);
      if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
        return `${UPLOAD_BASE}${parsed.pathname}`;
      }
    } catch {
      return url;
    }
    return url;
  }
  return `${UPLOAD_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
}

// --- Type Definitions (Updated to include more details from backend JOIN) ---
type Application = {
  id: string | number;
  applicationId: string;
  type: 'loan' | 'support';
  student: { name: string; id: string; program: string; year: number; email: string; phone: string; };
  guarantor?: { name?: string; phone?: string; relation?: string };
  documentsCount?: number;
  documentsRequired?: number;
  amount: number;
  purpose: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'info_requested';
  submittedDate: string;
  repaymentPeriod?: number;
  // This will hold the original, raw data for detailed views
  raw: any; 
};

type RawData = { id: number; student_uid: string; full_name: string; email: string; phone: string; amount_requested: number; created_at: string; status: string; program: string; semester: number; reason?: string; [key: string]: any; };

type OfficeWorkflowApplication = {
  id: string;
  type: 'loan' | 'support' | 'student_benefit';
  student_name: string;
  access_number?: string;
  student_email?: string;
  student_phone?: string;
  program?: string;
  requested_amount?: number;
  overall_status?: string;
  current_stage?: string;
  submitted_at?: string;
  source?: {
    reason?: string;
    guarantor?: { name?: string; phone?: string; relation?: string } | null;
    attachments?: any[];
  } | null;
  payload?: Record<string, any>;
};

function getCurrentRole() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const role = parsed?.role;
    const officeRole = parsed?.meta?.office_role;
    if (role === 'alumni_office') return officeRole || 'administrator';
    return role || null;
  } catch {
    return null;
  }
}

const WORKFLOW_ROLES = new Set([
  'administrator',
  'general_secretary',
  'secretary_academics',
  'finance',
  'president',
  'vice_president',
  'admin',
]);

function mapWorkflowStatus(item: OfficeWorkflowApplication): Application['status'] {
  const overall = String(item.overall_status || '').toLowerCase();
  if (overall === 'rejected') return 'rejected';
  if (overall === 'completed' || overall === 'disbursed') return 'approved';
  if (overall === 'under_review' || overall === 'ready_for_disbursement') return 'under_review';
  return 'pending';
}

function nextStageLabel(stage?: string): string {
  const stageMap: Record<string, string> = {
    administrator: 'General Secretary',
    general_secretary: 'Secretary Academics',
    secretary_academics: 'Finance',
    finance_review: 'President',
    executive_review: 'Finance Disbursement',
    finance_disbursement: 'Completed',
  };
  return stageMap[String(stage || '')] || 'Next Stage';
}

function isWorkflowApplication(app: Application): boolean {
  return Boolean(app.raw?.current_stage);
}

function StatusBadge({ status }: { status: Application['status'] }) {
  const config: Record<string, { label: string; className: string }> = {
    pending: { label: 'Pending', className: 'bg-amber-100 text-amber-800 border-amber-300' },
    under_review: { label: 'Under Review', className: 'bg-blue-100 text-blue-800 border-blue-300' },
    info_requested: { label: 'Info Requested', className: 'bg-orange-100 text-orange-800 border-orange-300' },
    approved: { label: 'Approved', className: 'bg-green-100 text-green-800 border-green-300' },
    rejected: { label: 'Rejected', className: 'bg-red-100 text-red-800 border-red-300' },
  };
  const { label, className } = config[status] || { label: status, className: 'bg-gray-100 text-gray-800 border-gray-300' };
  return <Badge variant="outline" className={`text-xs capitalize border ${className}`}>{label}</Badge>;
}

export default function ApplicationsQueue() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('pending');
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showRequestInfoDialog, setShowRequestInfoDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [approvalComment, setApprovalComment] = useState('');
  const [infoRequestMessage, setInfoRequestMessage] = useState('');
  const [selectedApplications, setSelectedApplications] = useState<Array<string | number>>([]);
  const [documentViewer, setDocumentViewer] = useState<{ url: string; name: string; mimetype?: string } | null>(null);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token') || '';
      const headers = { Authorization: `Bearer ${token}` };
      const role = getCurrentRole();

      if (role && WORKFLOW_ROLES.has(role)) {
        const queueSuffix = role === 'finance' ? '?queue=review' : '';
        const queueRes = await fetch(`${API_BASE}/office/fund-workflow${queueSuffix}`, { headers });
        if (!queueRes.ok) {
          throw new Error('Failed to fetch office applications queue');
        }

        const queueData: OfficeWorkflowApplication[] = await queueRes.json();
        const normalizedQueue: Application[] = (Array.isArray(queueData) ? queueData : []).map((item) => {
          const payload = item.payload || {};
          const submittedAt = item.submitted_at || new Date().toISOString();
          return {
            id: item.id,
            applicationId: `${String(item.type || 'APP').toUpperCase()}-${String(item.id).slice(-6)}`,
            type: item.type === 'loan' ? 'loan' : 'support',
            student: {
              name: item.student_name || 'Unknown Student',
              id: item.access_number || 'N/A',
              email: item.student_email || payload.email || '',
              phone: item.student_phone || payload.phone || '',
              program: item.program || payload.program || 'N/A',
              year: Number(payload.year || payload.level || 1),
            },
            guarantor: {
              name: item.source?.guarantor?.name || '',
              phone: item.source?.guarantor?.phone || '',
              relation: item.source?.guarantor?.relation || '',
            },
            documentsCount: Number(item.source?.attachments?.length || 0),
            documentsRequired: 2,
            amount: Number(item.requested_amount || 0),
            purpose: item.source?.reason || payload.reason || payload.purpose || 'N/A',
            status: mapWorkflowStatus(item),
            submittedDate: new Date(submittedAt).toLocaleDateString(),
            raw: {
              ...item,
              attachments: item.source?.attachments || [],
              created_at: submittedAt,
            },
          };
        });

        if (normalizedQueue.length > 0 || role !== 'administrator') {
          setApplications(normalizedQueue.sort((a, b) => new Date(String(b.raw.created_at)).getTime() - new Date(String(a.raw.created_at)).getTime()));
          return;
        }
      }

      const [loansRes, supportRes] = await Promise.all([
        fetch(`${API_BASE}/loans`, { headers }),
        fetch(`${API_BASE}/support`, { headers }),
      ]);

      if (!loansRes.ok || !supportRes.ok) {
        // Handle individual errors gracefully
        console.error({ loansStatus: loansRes.status, supportStatus: supportRes.status });
        throw new Error('Failed to fetch one or more application types');
      }

      const rawLoans: RawData[] = await loansRes.json();
      const rawSupport: RawData[] = await supportRes.json();

      const normalizedLoans: Application[] = rawLoans.map(loan => ({
        id: loan.id,
        applicationId: `LOAN-${loan.id}`,
        type: 'loan',
        student: { name: loan.full_name, id: loan.accessNumber || loan.meta?.accessNumber || loan.university_id || 'N/A', email: loan.email, phone: loan.phone, program: loan.program, year: Math.ceil(loan.semester / 2) },
        guarantor: { name: loan.guarantor_name || loan.guarantor || loan.guarantorName || '', phone: loan.guarantor_phone || loan.guarantorPhone || '', relation: loan.guarantor_relation || loan.guarantorRelation || '' },
        documentsCount: Number(loan.documents_count ?? loan.documentsCount ?? 0),
        documentsRequired: Number(loan.documents_required ?? loan.documentsRequired ?? 2),
        amount: Number(loan.amount_requested),
        purpose: loan.purpose || 'Tuition & other fees',
        status: (loan.status === 'info_requested' ? 'info_requested' : loan.status) as Application['status'],
        submittedDate: new Date(loan.created_at).toLocaleDateString(),
        repaymentPeriod: loan.repaymentPeriod,
        raw: loan,
      }));

      const normalizedSupport: Application[] = rawSupport.map(req => ({
        id: req.id,
        applicationId: `SUPP-${req.id}`,
        type: 'support',
        student: { name: req.full_name, id: req.accessNumber || req.meta?.accessNumber || req.university_id || 'N/A', email: req.email, phone: req.phone, program: req.program, year: Math.ceil(req.semester / 2) },
        guarantor: { name: req.guarantor_name || req.guarantor || req.guarantorName || '', phone: req.guarantor_phone || req.guarantorPhone || '', relation: req.guarantor_relation || req.guarantorRelation || '' },
        documentsCount: Number(req.documents_count ?? req.documentsCount ?? 0),
        documentsRequired: Number(req.documents_required ?? req.documentsRequired ?? 2),
        amount: Number(req.amount_requested),
        purpose: req.reason || 'N/A',
        status: (req.status === 'info_requested' ? 'info_requested' : req.status) as Application['status'],
        submittedDate: new Date(req.created_at).toLocaleDateString(),
        raw: req,
      }));

      setApplications([...normalizedLoans, ...normalizedSupport].sort((a, b) => new Date(b.raw.created_at).getTime() - new Date(a.raw.created_at).getTime()));
    } catch (err) {
      toast.error('Failed to load applications.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);
  
  const filteredApplications = useMemo(() => {
    return applications
      .filter(app => filterStatus === 'all' || app.status.toLowerCase() === filterStatus.toLowerCase())
      .filter(app => {
        const query = searchQuery.toLowerCase();
        if (!query) return true;
        return (
          app.student.name.toLowerCase().includes(query) ||
          app.applicationId.toLowerCase().includes(query) ||
          app.student.id.toLowerCase().includes(query) ||
          app.type.toLowerCase().includes(query)
        );
      });
  }, [applications, searchQuery, filterStatus]);

  const updateApplicationStatus = async (app: Application, newStatus: 'approved' | 'rejected', reason?: string) => {
    try {
      const token = localStorage.getItem('token') || '';

      if (isWorkflowApplication(app)) {
        const decision = newStatus === 'approved' ? 'approve' : 'reject';
        const endpoint = `${API_BASE}/office/fund-workflow/${app.id}/decision`;
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            decision,
            comment: reason || '',
            approvedAmount: app.amount,
          }),
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload?.error || 'Failed to move application in workflow');
        }

        toast.success(
          newStatus === 'approved'
            ? `Application forwarded to ${nextStageLabel(app.raw?.current_stage)}.`
            : `Application ${app.applicationId} has been rejected.`
        );
        await fetchApplications();
        return;
      }

      const isLoan = app.type === 'loan';
      const endpoint = isLoan
        ? `${API_BASE}/loans/${app.id}/status`
        : `${API_BASE}/support/${app.id}`;
      const body = { status: newStatus, ...(reason && { reason }) };
      
      const res = await fetch(endpoint, {
        method: isLoan ? 'PATCH' : 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error(await res.json().then(d => d.error || 'Failed to update status'));
      
      toast.success(`Application ${app.applicationId} has been ${newStatus}.`);
      fetchApplications();
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    }
  };

  const handleApprove = (application: Application) => {
    setSelectedApplication(application);
    setShowApproveDialog(true);
  };

  const confirmApproval = () => {
    if (!selectedApplication) return;
    updateApplicationStatus(selectedApplication, 'approved', approvalComment);
    setShowApproveDialog(false);
    setSelectedApplication(null);
    setApprovalComment('');
  };

  const handleReject = (application: Application) => {
    setSelectedApplication(application);
    setShowRejectDialog(true);
  };

  const confirmRejection = () => {
    if (!selectedApplication) return;
    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    updateApplicationStatus(selectedApplication, 'rejected', rejectionReason);
    setShowRejectDialog(false);
    setSelectedApplication(null);
    setRejectionReason('');
  };

  const handleRequestInfo = (application: Application) => {
    setSelectedApplication(application);
    setShowRequestInfoDialog(true);
  };

  const sendInfoRequest = () => {
    if (!selectedApplication || !infoRequestMessage.trim()) {
      toast.error("Please enter a message for the student.");
      return;
    }
    console.log(`Sending message to ${selectedApplication.student.email}: ${infoRequestMessage}`);
    toast.success(`Information request sent to ${selectedApplication.student.name}.`);
    setShowRequestInfoDialog(false);
    setInfoRequestMessage('');
    setSelectedApplication(null);
  };

  const handleBulkAction = () => {
    toast.info('Bulk actions are not yet implemented.');
  };

  const toggleApplicationSelection = (id: string | number) => {
    setSelectedApplications((prev) => prev.includes(id) ? prev.filter((appId) => appId !== id) : [...prev, id]);
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="ml-4">Loading applications...</p>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-black">
      <div className="bg-[#0b2a4a] text-white border-b border-black/30 sticky top-0 z-10">
        <div className="p-4 lg:p-6">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-lg lg:text-xl text-white">Applications Queue</h2>
                    <p className="text-xs text-white/80 mt-1">{filteredApplications.length} applications matching filters</p>
                </div>
                {selectedApplications.length > 0 && (
                <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleBulkAction()} style={{ backgroundColor: 'var(--accent)' }}>
                        <Check size={16} className="mr-2" /> Approve ({selectedApplications.length})
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleBulkAction()}>
                        <X size={16} className="mr-2" /> Reject
                    </Button>
                </div>
                )}
            </div>
            <div className="flex flex-col lg:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <Input placeholder="Search by name, ID, type (loan/support)..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-full lg:w-[180px] bg-black text-white border-white/15">
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent className="bg-black text-white border-white/15">
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="under_review">Under Review</SelectItem>
                        <SelectItem value="info_requested">Info Requested</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
      </div>

      <div className="p-4 lg:p-6 space-y-4 pb-20 lg:pb-6">
        {filteredApplications.length > 0 ? (
          filteredApplications.map((application) => (
            <Card key={application.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-start gap-4">
                  <Checkbox checked={selectedApplications.includes(application.id)} onCheckedChange={() => toggleApplicationSelection(application.id)} className="mt-1" />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-2 mb-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-base font-semibold">{application.student.name}</p>
                          <Badge variant="outline" className="text-xs">{application.student.id}</Badge>
                          <Badge style={application.type === 'loan' ? { backgroundColor: 'var(--primary)' } : { backgroundColor: 'var(--accent)' }} className="text-white text-xs capitalize">
                            {application.type}
                          </Badge>
                          <StatusBadge status={application.status} />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{application.student.program} - Year {application.student.year}</p>
                        <p className="text-xs text-gray-400">Applied: {application.submittedDate}</p>
                      </div>
                      <div className="text-left lg:text-right">
                        <p className="text-lg font-bold" style={{ color: 'var(--primary)' }}>UGX {application.amount.toLocaleString()}</p>
                        {application.type === 'loan' && <p className="text-xs text-gray-500">{application.repaymentPeriod} months repayment</p>}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Purpose:</p>
                      <p className="text-sm text-gray-800">{application.purpose}</p>
                    </div>
                    {application.guarantor?.name && (
                      <div className="mt-2 text-sm text-gray-700">
                        <p className="text-xs text-gray-500">Guarantor</p>
                        <p>{application.guarantor.name} {application.guarantor.relation ? `(${application.guarantor.relation})` : ''} {application.guarantor.phone ? `- ${application.guarantor.phone}` : ''}</p>
                      </div>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-600">
                      <span className="inline-flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5" />
                        Documents:
                        <span className="ml-1 rounded-full border px-2 py-0.5 text-green-700 border-green-300 bg-green-50">
                          {application.documentsCount ?? 0}/{application.documentsRequired ?? 2}
                        </span>
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-4">
                       <Button size="sm" variant="outline" onClick={() => { setSelectedApplication(application); setIsDetailsDialogOpen(true); }}>
                         <Eye size={16} className="mr-2" /> View Details
                       </Button>
                       <Button size="sm" onClick={() => handleApprove(application)} style={{ backgroundColor: 'var(--accent)' }}>
                         <Check size={16} className="mr-2" /> {isWorkflowApplication(application) ? `Forward to ${nextStageLabel(application.raw?.current_stage)}` : 'Approve'}
                       </Button>
                       <Button size="sm" variant="outline" onClick={() => handleReject(application)}>
                         <X size={16} className="mr-2" /> Reject
                       </Button>
                       <Button size="sm" variant="outline" onClick={() => handleRequestInfo(application)}>
                         <AlertCircle size={16} className="mr-2" /> Request Info
                       </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-10 border-2 border-dashed rounded-lg">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No Applications Found</h3>
            <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter criteria.</p>
          </div>
        )}
      </div>
      
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        {selectedApplication && (
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                Review Application – {selectedApplication.applicationId}
                <StatusBadge status={selectedApplication.status} />
              </DialogTitle>
              <DialogDescription>
                Submitted {selectedApplication.submittedDate} · {selectedApplication.type === 'loan' ? 'Loan' : 'Support'} · UGX {selectedApplication.amount.toLocaleString()}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <h4 className="text-sm font-semibold mb-2">Summary</h4>
                <div className="grid grid-cols-2 gap-2 p-3 bg-gray-50 rounded-lg text-sm">
                  <div><p className="text-xs text-gray-500">Type</p><p className="capitalize">{selectedApplication.type}</p></div>
                  <div><p className="text-xs text-gray-500">Amount</p><p className="font-medium">UGX {selectedApplication.amount.toLocaleString()}</p></div>
                  <div className="col-span-2"><p className="text-xs text-gray-500">Purpose</p><p>{selectedApplication.purpose}</p></div>
                  {selectedApplication.type === 'loan' && selectedApplication.repaymentPeriod && (
                    <div><p className="text-xs text-gray-500">Repayment</p><p>{selectedApplication.repaymentPeriod} months</p></div>
                  )}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-2">Student Information</h4>
                <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg text-sm">
                  <div><p className="text-xs text-gray-500">Name</p><p>{selectedApplication.student.name}</p></div>
                  <div><p className="text-xs text-gray-500">Access Number</p><p>{selectedApplication.student.id}</p></div>
                  <div><p className="text-xs text-gray-500">Program</p><p>{selectedApplication.student.program}</p></div>
                  <div><p className="text-xs text-gray-500">Year</p><p>Year {selectedApplication.student.year}</p></div>
                  <div><p className="text-xs text-gray-500">Email</p><p className="text-xs break-all">{selectedApplication.student.email}</p></div>
                  <div><p className="text-xs text-gray-500">Phone</p><p className="text-xs">{selectedApplication.student.phone}</p></div>
                  {selectedApplication.guarantor?.name && (
                    <div className="col-span-2 mt-2">
                      <p className="text-xs text-gray-500">Guarantor</p>
                      <p className="text-sm">{selectedApplication.guarantor.name} {selectedApplication.guarantor.relation ? `(${selectedApplication.guarantor.relation})` : ''} {selectedApplication.guarantor.phone ? `– ${selectedApplication.guarantor.phone}` : ''}</p>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Paperclip className="w-4 h-4" />
                  Documents ({selectedApplication.documentsCount ?? 0}/{selectedApplication.documentsRequired ?? 2})
                </h4>
                {(() => {
                  const attachments = selectedApplication.raw?.attachments || [];
                  if (attachments.length === 0) {
                    return <p className="text-sm text-gray-500 p-3 bg-gray-50 rounded-lg">No documents attached.</p>;
                  }
                  return (
                    <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
                      {attachments.map((att: any, idx: number) => {
                        const fullUrl = documentFullUrl(att);
                        const name = att.originalname || att.fieldname || `Document ${idx + 1}`;
                        const isPdf = (att.mimetype || '').toLowerCase().includes('pdf') || (name || '').toLowerCase().endsWith('.pdf');
                        return (
                          <div key={idx} className="flex items-center justify-between gap-2 text-sm">
                            <span className="truncate flex-1">{name}</span>
                            {fullUrl && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="shrink-0 text-primary hover:underline"
                                onClick={() => setDocumentViewer({ url: fullUrl, name, mimetype: att.mimetype })}
                              >
                                <Eye className="w-4 h-4 mr-1" /> View
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
              <div className="flex flex-wrap gap-2 pt-2 border-t">
                <Button size="sm" onClick={() => { setShowApproveDialog(true); setIsDetailsDialogOpen(false); setSelectedApplication(selectedApplication); }} style={{ backgroundColor: 'var(--accent)' }}>
                  <Check size={16} className="mr-2" /> {isWorkflowApplication(selectedApplication) ? `Forward to ${nextStageLabel(selectedApplication.raw?.current_stage)}` : 'Approve'}
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setShowRejectDialog(true); setIsDetailsDialogOpen(false); setSelectedApplication(selectedApplication); }}>
                  <X size={16} className="mr-2" /> Reject
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setShowRequestInfoDialog(true); setIsDetailsDialogOpen(false); setSelectedApplication(selectedApplication); }}>
                  <AlertCircle size={16} className="mr-2" /> Request info
                </Button>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
      
      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        {selectedApplication && (
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>Approve Application</AlertDialogTitle>
                  <AlertDialogDescription>
                    {isWorkflowApplication(selectedApplication)
                      ? <>This will move <strong>{selectedApplication.applicationId}</strong> to <strong>{nextStageLabel(selectedApplication.raw?.current_stage)}</strong>.</>
                      : <>Are you sure you want to approve application {selectedApplication.applicationId} for <strong>UGX {selectedApplication.amount.toLocaleString()}</strong>?</>}
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <Textarea
                placeholder="Add a review comment (recommended)..."
                value={approvalComment}
                onChange={(e) => setApprovalComment(e.target.value)}
                rows={3}
              />
              <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={confirmApproval} style={{ backgroundColor: 'var(--accent)' }}>
                    {isWorkflowApplication(selectedApplication) ? 'Forward Application' : 'Approve'}
                  </AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
        )}
      </AlertDialog>

      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        {selectedApplication && (
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>Reject Application</AlertDialogTitle>
                  <AlertDialogDescription>
                    Please provide a reason for rejecting this application. The student will be notified.
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <Textarea placeholder="Enter reason for rejection..." value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} rows={4} />
              <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setRejectionReason('')}>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={confirmRejection} className="bg-red-600 hover:bg-red-700">Reject Application</AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
        )}
      </AlertDialog>
      
      <Dialog open={showRequestInfoDialog} onOpenChange={setShowRequestInfoDialog}>
        {selectedApplication && (
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Request More Information</DialogTitle>
                    <DialogDescription>
                        Send a message to {selectedApplication.student.name} regarding application {selectedApplication.applicationId}.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Textarea placeholder="e.g., Please upload a clearer copy of your student ID..." value={infoRequestMessage} onChange={(e) => setInfoRequestMessage(e.target.value)} rows={5} />
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
                    <Button onClick={sendInfoRequest}>Send Request</Button>
                </DialogFooter>
            </DialogContent>
        )}
      </Dialog>

      <Dialog open={!!documentViewer} onOpenChange={(open) => !open && setDocumentViewer(null)}>
        {documentViewer && (
          <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>{documentViewer.name}</DialogTitle>
            </DialogHeader>
            <div className="flex-1 min-h-0 overflow-auto rounded border bg-muted/30">
              {(documentViewer.mimetype || '').toLowerCase().includes('pdf') || documentViewer.name.toLowerCase().endsWith('.pdf') ? (
                <iframe src={documentViewer.url} title={documentViewer.name} className="w-full h-[70vh] border-0" />
              ) : (
                <img src={documentViewer.url} alt={documentViewer.name} className="w-full h-auto object-contain max-h-[70vh]" />
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDocumentViewer(null)}>Close</Button>
              <a href={documentViewer.url} target="_blank" rel="noopener noreferrer">
                <Button variant="secondary"><ExternalLink className="w-4 h-4 mr-2" /> Open in new tab</Button>
              </a>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
