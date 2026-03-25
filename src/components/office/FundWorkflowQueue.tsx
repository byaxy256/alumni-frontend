import { useEffect, useMemo, useState } from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { toast } from 'sonner';
import { API_BASE, apiCall } from '../../api';
import { AlertCircle, CheckCircle2, ExternalLink, Loader2, Wallet } from 'lucide-react';

type OfficeRole =
  | 'administrator'
  | 'general_secretary'
  | 'finance'
  | 'president'
  | 'vice_president'
  | 'publicity'
  | 'secretary_academics'
  | 'projects_manager';

type QueueMode = 'default' | 'review' | 'disbursement';

type QueueItem = {
  id: string;
  type: string;
  student_uid: string;
  student_name: string;
  student_email: string;
  student_phone: string;
  access_number: string;
  program: string;
  current_stage: string;
  current_stage_label: string;
  overall_status: string;
  status: string;
  requested_amount: number;
  approved_amount?: number | null;
  disbursed_amount?: number | null;
  disbursed_to?: string | null;
  transaction_reference?: string | null;
  comments: Record<string, string>;
  academic_verification_status?: string;
  academic_verification_comment?: string;
  submitted_at: string;
  approval_logs: Array<Record<string, any>>;
  source?: {
    id: string;
    status: string;
    attachments?: Array<Record<string, any>>;
    reason?: string;
    guarantor?: { name?: string; phone?: string; relation?: string } | null;
  } | null;
  payload?: Record<string, any>;
};

interface FundWorkflowQueueProps {
  role: OfficeRole;
  mode?: QueueMode;
}

const queueTitle: Record<string, string> = {
  administrator: 'Administrator Request Funds Queue',
  general_secretary: 'General Secretary Approvals Queue',
  secretary_academics: 'Secretary Academics Verification Queue',
  president: 'President Executive Review Queue',
  vice_president: 'Vice President Executive Review Queue',
  finance_review: 'Finance Review Queue',
  finance_disbursement: 'Finance Disbursements Queue',
};

function buildAttachmentUrl(attachment: any): string {
  const root = API_BASE.replace(/\/api\/?$/, '');
  const candidate = attachment?.viewUrl || attachment?.view_url || attachment?.url || attachment?.storage_path || '';
  if (!candidate) return '';
  if (/^https?:\/\//i.test(candidate)) return candidate;
  return `${root}${candidate.startsWith('/') ? '' : '/'}${candidate}`;
}

function actionLabelForStage(stage: string) {
  if (stage === 'finance_disbursement') return 'Disburse';
  return 'Approve';
}

export function FundWorkflowQueue({ role, mode = 'default' }: FundWorkflowQueueProps) {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<QueueItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<QueueItem | null>(null);
  const [decision, setDecision] = useState<'approve' | 'reject' | 'disburse'>('approve');
  const [comment, setComment] = useState('');
  const [approvedAmount, setApprovedAmount] = useState('');
  const [disbursedAmount, setDisbursedAmount] = useState('');
  const [disbursedTo, setDisbursedTo] = useState('');
  const [transactionReference, setTransactionReference] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  const queueKey = useMemo(() => {
    if (role === 'finance' && mode === 'review') return 'finance_review';
    if (role === 'finance' && mode === 'disbursement') return 'finance_disbursement';
    return role;
  }, [mode, role]);

  async function loadItems() {
    try {
      setLoading(true);
      const suffix =
        role === 'finance' && mode !== 'default'
          ? `?queue=${mode === 'review' ? 'review' : 'disbursement'}`
          : '';
      const data = await apiCall(`/office/fund-workflow${suffix}`, 'GET');
      setItems(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Failed to load fund queue:', error);
      toast.error(error?.message || 'Failed to load fund queue');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadItems();
  }, [mode, role]);

  const heading = queueTitle[queueKey] || 'Fund Workflow Queue';

  const latestComment = (item: QueueItem) => {
    const commentEntry = [
      item.comments?.finance_disbursement,
      item.comments?.president,
      item.comments?.finance_review,
      item.comments?.secretary_academics,
      item.comments?.general_secretary,
      item.comments?.administrator,
    ].find(Boolean);
    return commentEntry || '';
  };

  const openActionDialog = (item: QueueItem, nextDecision: 'approve' | 'reject' | 'disburse') => {
    setSelectedItem(item);
    setDecision(nextDecision);
    setComment('');
    setApprovedAmount(item.approved_amount ? String(item.approved_amount) : String(item.requested_amount || ''));
    setDisbursedAmount(item.disbursed_amount ? String(item.disbursed_amount) : String(item.approved_amount || item.requested_amount || ''));
    setDisbursedTo(item.disbursed_to || '');
    setTransactionReference(item.transaction_reference || '');
    setShowActionDialog(true);
  };

  const submitDecision = async () => {
    if (!selectedItem) return;

    if (decision === 'disburse') {
      if (!disbursedAmount || !disbursedTo.trim() || !transactionReference.trim()) {
        toast.error('Please complete the disbursement fields before continuing.');
        return;
      }
    }

    if (selectedItem.current_stage === 'finance_review' && decision === 'approve' && !comment.trim()) {
      toast.error('Finance review comment is required before approval.');
      return;
    }

    try {
      setSubmitting(true);
      await apiCall(`/office/fund-workflow/${selectedItem.id}/decision`, 'POST', {
        decision,
        comment,
        approvedAmount: approvedAmount ? Number(approvedAmount) : undefined,
        disbursedAmount: disbursedAmount ? Number(disbursedAmount) : undefined,
        disbursedTo,
        transactionReference,
      });
      toast.success(`Application ${decision === 'disburse' ? 'disbursed' : `${decision}d`} successfully.`);
      setShowActionDialog(false);
      setSelectedItem(null);
      await loadItems();
    } catch (error: any) {
      console.error('Failed to update fund workflow:', error);
      toast.error(error?.message || 'Failed to update fund workflow');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 p-4 lg:p-8">
      <Card className="border-border/60 bg-card/95">
        <CardHeader>
          <CardTitle>{heading}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {items.length.toLocaleString()} applications are currently waiting at this stage.
          </p>
        </CardHeader>
      </Card>

      {loading ? (
        <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-border/60 bg-card">
          <Loader2 className="mr-3 h-5 w-5 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Loading workflow queue...</span>
        </div>
      ) : items.length === 0 ? (
        <Card className="border-border/60 bg-card/95">
          <CardContent className="flex min-h-[180px] flex-col items-center justify-center gap-3 p-6 text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
            <div>
              <p className="font-medium">Queue cleared</p>
              <p className="text-sm text-muted-foreground">There are no applications waiting in this queue right now.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {items.map((item) => {
            const canDisburse = item.current_stage === 'finance_disbursement';
            const stageComment = latestComment(item);

            return (
              <Card key={item.id} className="border-border/60 bg-card/95 shadow-sm">
                <CardContent className="space-y-4 p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-lg font-semibold">{item.student_name}</h3>
                        <Badge variant="outline" className="capitalize">
                          {item.type}
                        </Badge>
                        <Badge variant="secondary">{item.current_stage_label}</Badge>
                        <Badge
                          className={
                            item.overall_status === 'rejected'
                              ? 'bg-red-100 text-red-700'
                              : item.overall_status === 'disbursed'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-blue-100 text-blue-700'
                          }
                        >
                          {item.overall_status.replace(/_/g, ' ')}
                        </Badge>
                      </div>

                      <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2 xl:grid-cols-4">
                        <p>Access No: {item.access_number || '—'}</p>
                        <p>Program: {item.program || '—'}</p>
                        <p>Email: {item.student_email || '—'}</p>
                        <p>Phone: {item.student_phone || '—'}</p>
                      </div>

                      <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Wallet className="h-4 w-4 text-[var(--accent)]" />
                          Requested amount: UGX {Number(item.requested_amount || 0).toLocaleString()}
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">
                          {item.source?.reason || item.payload?.reason || item.payload?.purpose || 'No reason was provided.'}
                        </p>
                        {stageComment && (
                          <div className="mt-3 rounded-xl bg-background/80 p-3 text-sm">
                            <span className="font-medium">Latest comment:</span> {stageComment}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-col gap-2 lg:w-44">
                      <Button variant="outline" onClick={() => { setSelectedItem(item); setShowDetailsDialog(true); }}>
                        View Details
                      </Button>
                      <Button onClick={() => openActionDialog(item, canDisburse ? 'disburse' : 'approve')}>
                        {actionLabelForStage(item.current_stage)}
                      </Button>
                      <Button variant="destructive" onClick={() => openActionDialog(item, 'reject')}>
                        Reject
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="border-border/60">
                  <CardContent className="space-y-2 p-4 text-sm">
                    <p><span className="font-medium">Student:</span> {selectedItem.student_name}</p>
                    <p><span className="font-medium">Access No:</span> {selectedItem.access_number || '—'}</p>
                    <p><span className="font-medium">Program:</span> {selectedItem.program || '—'}</p>
                    <p><span className="font-medium">Submitted:</span> {new Date(selectedItem.submitted_at).toLocaleString()}</p>
                  </CardContent>
                </Card>
                <Card className="border-border/60">
                  <CardContent className="space-y-2 p-4 text-sm">
                    <p><span className="font-medium">Requested amount:</span> UGX {Number(selectedItem.requested_amount || 0).toLocaleString()}</p>
                    <p><span className="font-medium">Approved amount:</span> {selectedItem.approved_amount ? `UGX ${Number(selectedItem.approved_amount).toLocaleString()}` : '—'}</p>
                    <p><span className="font-medium">Academic verification:</span> {selectedItem.academic_verification_status || 'not required'}</p>
                    {selectedItem.academic_verification_comment ? (
                      <p><span className="font-medium">Academic comment:</span> {selectedItem.academic_verification_comment}</p>
                    ) : null}
                  </CardContent>
                </Card>
              </div>

              {selectedItem.source?.guarantor && (
                <Card className="border-border/60">
                  <CardHeader>
                    <CardTitle className="text-base">Guarantor</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p>Name: {selectedItem.source.guarantor.name || '—'}</p>
                    <p>Phone: {selectedItem.source.guarantor.phone || '—'}</p>
                    <p>Relation: {selectedItem.source.guarantor.relation || '—'}</p>
                  </CardContent>
                </Card>
              )}

              <Card className="border-border/60">
                <CardHeader>
                  <CardTitle className="text-base">Supporting Documents</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {selectedItem.source?.attachments?.length ? (
                    selectedItem.source.attachments.map((attachment, index) => {
                      const href = buildAttachmentUrl(attachment);
                      return (
                        <a
                          key={`${attachment.originalname || index}-${index}`}
                          href={href}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 px-4 py-3 text-sm hover:bg-muted/35"
                        >
                          <span>{attachment.originalname || `Attachment ${index + 1}`}</span>
                          <ExternalLink className="h-4 w-4 text-muted-foreground" />
                        </a>
                      );
                    })
                  ) : (
                    <div className="rounded-xl border border-dashed border-border/60 p-4 text-sm text-muted-foreground">
                      No documents attached.
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border/60">
                <CardHeader>
                  <CardTitle className="text-base">Approval Timeline</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {selectedItem.approval_logs?.length ? (
                    selectedItem.approval_logs.map((entry, index) => (
                      <div key={`${entry.stage || 'stage'}-${index}`} className="rounded-xl border border-border/60 bg-muted/20 p-4 text-sm">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline">{String(entry.stage || 'stage').replace(/_/g, ' ')}</Badge>
                          <Badge className={entry.decision === 'reject' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}>
                            {String(entry.decision || '').replace(/_/g, ' ')}
                          </Badge>
                        </div>
                        <p className="mt-2 text-muted-foreground">
                          {entry.comment || 'No comment added.'}
                        </p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {entry.timestamp ? new Date(entry.timestamp).toLocaleString() : '—'}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed border-border/60 p-4 text-sm text-muted-foreground">
                      No approval entries yet.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {decision === 'reject'
                ? 'Reject application'
                : decision === 'disburse'
                  ? 'Record disbursement'
                  : 'Approve application'}
            </DialogTitle>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 text-sm">
                <p className="font-medium">{selectedItem.student_name}</p>
                <p className="mt-1 text-muted-foreground">
                  {selectedItem.type} application · UGX {Number(selectedItem.requested_amount || 0).toLocaleString()}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="workflow-comment">
                  Comment {selectedItem.current_stage === 'finance_review' && decision === 'approve' ? '*' : ''}
                </Label>
                <Textarea
                  id="workflow-comment"
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="Leave a review note, oversight comment, or rejection reason."
                  rows={4}
                />
              </div>

              {(decision === 'approve' || decision === 'disburse') && (
                <div className="space-y-2">
                  <Label htmlFor="approved-amount">Approved Amount</Label>
                  <Input
                    id="approved-amount"
                    type="number"
                    value={approvedAmount}
                    onChange={(event) => setApprovedAmount(event.target.value)}
                  />
                </div>
              )}

              {decision === 'disburse' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="disbursed-amount">Disbursed Amount *</Label>
                    <Input
                      id="disbursed-amount"
                      type="number"
                      value={disbursedAmount}
                      onChange={(event) => setDisbursedAmount(event.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="disbursed-to">Recipient Account / Mobile Money Number *</Label>
                    <Input
                      id="disbursed-to"
                      value={disbursedTo}
                      onChange={(event) => setDisbursedTo(event.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="transaction-reference">Transaction Reference *</Label>
                    <Input
                      id="transaction-reference"
                      value={transactionReference}
                      onChange={(event) => setTransactionReference(event.target.value)}
                    />
                  </div>

                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="mt-0.5 h-4 w-4" />
                      <p>
                        Once you submit this disbursement, the request is marked completed and the student receives a final confirmation.
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowActionDialog(false)}>
              Cancel
            </Button>
            <Button variant={decision === 'reject' ? 'destructive' : 'default'} onClick={submitDecision} disabled={submitting}>
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {decision === 'reject' ? 'Reject Request' : decision === 'disburse' ? 'Save Disbursement' : 'Approve & Continue'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
