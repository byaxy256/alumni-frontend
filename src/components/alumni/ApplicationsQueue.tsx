// src/components/alumni-office/ApplicationsQueue.tsx

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Search, Eye, Check, X, AlertCircle, FileText, Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { Checkbox } from '../ui/checkbox';
import { API_BASE } from '../../api';

// --- Type Definitions (Updated to include more details from backend JOIN) ---
type Application = {
  id: number;
  applicationId: string;
  type: 'loan' | 'support';
  student: { name: string; id: string; program: string; year: number; email: string; phone: string; };
  amount: number;
  purpose: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  submittedDate: string;
  repaymentPeriod?: number;
  // This will hold the original, raw data for detailed views
  raw: any; 
};

type RawData = { id: number; student_uid: string; full_name: string; email: string; phone: string; amount_requested: number; created_at: string; status: 'pending' | 'under_review' | 'approved' | 'rejected'; program: string; semester: number; reason?: string; [key: string]: any; };

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
  const [infoRequestMessage, setInfoRequestMessage] = useState('');
  const [selectedApplications, setSelectedApplications] = useState<number[]>([]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token') || '';
      const headers = { Authorization: `Bearer ${token}` };

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
        student: { name: loan.full_name, id: loan.university_id || 'N/A', email: loan.email, phone: loan.phone, program: loan.program, year: Math.ceil(loan.semester / 2) },
        amount: Number(loan.amount_requested),
        purpose: 'Tuition & other fees',
        status: loan.status,
        submittedDate: new Date(loan.created_at).toLocaleDateString(),
        repaymentPeriod: loan.repaymentPeriod,
        raw: loan,
      }));

      const normalizedSupport: Application[] = rawSupport.map(req => ({
        id: req.id,
        applicationId: `SUPP-${req.id}`,
        type: 'support',
        student: { name: req.full_name, id: req.university_id || 'N/A', email: req.email, phone: req.phone, program: req.program, year: Math.ceil(req.semester / 2) },
        amount: Number(req.amount_requested),
        purpose: req.reason || 'N/A',
        status: req.status,
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
      const endpoint = `${API_BASE}/${app.type === 'loan' ? 'loans' : 'support'}/${app.id}/status`;
      const body = { status: newStatus, ...(reason && { reason }) };
      
      const res = await fetch(endpoint, {
        method: 'PATCH',
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
    updateApplicationStatus(selectedApplication, 'approved');
    setShowApproveDialog(false);
    setSelectedApplication(null);
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

  const toggleApplicationSelection = (id: number) => {
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
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="p-4 lg:p-6">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-lg lg:text-xl">Applications Queue</h2>
                    <p className="text-xs text-gray-500 mt-1">{filteredApplications.length} applications matching filters</p>
                </div>
                {selectedApplications.length > 0 && (
                <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleBulkAction()} style={{ backgroundColor: '#c79b2d' }}>
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
                    <SelectTrigger className="w-full lg:w-[180px]">
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="under_review">Under Review</SelectItem>
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
                          <Badge style={application.type === 'loan' ? { backgroundColor: '#0b2a4a' } : { backgroundColor: '#c79b2d' }} className="text-white text-xs capitalize">
                            {application.type}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{application.student.program} - Year {application.student.year}</p>
                        <p className="text-xs text-gray-400">Applied: {application.submittedDate}</p>
                      </div>
                      <div className="text-left lg:text-right">
                        <p className="text-lg font-bold" style={{ color: '#0b2a4a' }}>UGX {application.amount.toLocaleString()}</p>
                        {application.type === 'loan' && <p className="text-xs text-gray-500">{application.repaymentPeriod} months repayment</p>}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Purpose:</p>
                      <p className="text-sm text-gray-800">{application.purpose}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-4">
                       <Button size="sm" variant="outline" onClick={() => { setSelectedApplication(application); setIsDetailsDialogOpen(true); }}>
                         <Eye size={16} className="mr-2" /> View Details
                       </Button>
                       <Button size="sm" onClick={() => handleApprove(application)} style={{ backgroundColor: '#c79b2d' }}>
                         <Check size={16} className="mr-2" /> Approve
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
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Application Details - {selectedApplication.applicationId}</DialogTitle>
              <DialogDescription>Submitted on {selectedApplication.submittedDate}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <h4 className="text-sm font-semibold mb-2">Student Information</h4>
                <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg text-sm">
                  <div><p className="text-xs text-gray-500">Name</p><p>{selectedApplication.student.name}</p></div>
                  <div><p className="text-xs text-gray-500">Student ID</p><p>{selectedApplication.student.id}</p></div>
                  <div><p className="text-xs text-gray-500">Program</p><p>{selectedApplication.student.program}</p></div>
                  <div><p className="text-xs text-gray-500">Year</p><p>Year {selectedApplication.student.year}</p></div>
                  <div><p className="text-xs text-gray-500">Email</p><p className="text-xs">{selectedApplication.student.email}</p></div>
                  <div><p className="text-xs text-gray-500">Phone</p><p className="text-xs">{selectedApplication.student.phone}</p></div>
                </div>
              </div>
              {/* Other sections can be added here, using data from `selectedApplication.raw` */}
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
                    Are you sure you want to approve application {selectedApplication.applicationId} for <strong>UGX {selectedApplication.amount.toLocaleString()}</strong>?
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={confirmApproval} style={{ backgroundColor: '#c79b2d' }}>Approve</AlertDialogAction>
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
    </div>
  );
}