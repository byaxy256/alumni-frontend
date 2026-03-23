import { useEffect, useState } from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Textarea } from '../ui/textarea';
import { toast } from 'sonner';
import { API_BASE, apiCall } from '../../api';
import { ExternalLink, Loader2 } from 'lucide-react';

type AcademicItem = {
  id: string;
  type: string;
  student_name: string;
  student_uid: string;
  student_email: string;
  access_number: string;
  program: string;
  academic_verification_status?: string;
  academic_verification_comment?: string;
  payload?: Record<string, any>;
  source?: {
    attachments?: Array<Record<string, any>>;
    reason?: string;
  } | null;
};

type TranscriptItem = {
  id: string;
  student_name: string;
  student_uid: string;
  program: string;
  transcript_program_status?: string;
  payload?: Record<string, any>;
};

type MentorshipItem = {
  id: string;
  student_name: string;
  mentor_name: string;
  field: string;
  mentorship_application_status: string;
  mentorship_comment?: string;
  requested_at?: string;
};

function attachmentUrl(attachment: any) {
  const root = API_BASE.replace(/\/api\/?$/, '');
  const value = attachment?.viewUrl || attachment?.view_url || attachment?.url || attachment?.storage_path || '';
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  return `${root}${value.startsWith('/') ? '' : '/'}${value}`;
}

interface SecretaryAcademicsPanelProps {
  defaultTab?: 'academic' | 'transcript' | 'mentorship';
}

export function SecretaryAcademicsPanel({ defaultTab = 'academic' }: SecretaryAcademicsPanelProps) {
  const [loading, setLoading] = useState(true);
  const [academicItems, setAcademicItems] = useState<AcademicItem[]>([]);
  const [transcriptItems, setTranscriptItems] = useState<TranscriptItem[]>([]);
  const [mentorshipItems, setMentorshipItems] = useState<MentorshipItem[]>([]);
  const [selectedAcademic, setSelectedAcademic] = useState<AcademicItem | null>(null);
  const [selectedTranscript, setSelectedTranscript] = useState<TranscriptItem | null>(null);
  const [selectedMentorship, setSelectedMentorship] = useState<MentorshipItem | null>(null);
  const [comment, setComment] = useState('');
  const [decision, setDecision] = useState<'approve' | 'reject' | 'in_review'>('approve');
  const [transcriptStatus, setTranscriptStatus] = useState('in_progress');
  const [transcriptStudentUid, setTranscriptStudentUid] = useState('');
  const [transcriptStudentName, setTranscriptStudentName] = useState('');
  const [transcriptProgram, setTranscriptProgram] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showAcademicDialog, setShowAcademicDialog] = useState(false);
  const [showTranscriptDialog, setShowTranscriptDialog] = useState(false);
  const [showMentorshipDialog, setShowMentorshipDialog] = useState(false);
  const [showCreateTranscript, setShowCreateTranscript] = useState(false);

  async function loadAll() {
    try {
      setLoading(true);
      const [academic, transcript, mentorship] = await Promise.all([
        apiCall('/office/academic-verification', 'GET'),
        apiCall('/office/transcript-program', 'GET'),
        apiCall('/office/mentorship-applications', 'GET'),
      ]);
      setAcademicItems(Array.isArray(academic) ? academic : []);
      setTranscriptItems(Array.isArray(transcript) ? transcript : []);
      setMentorshipItems(Array.isArray(mentorship) ? mentorship : []);
    } catch (error: any) {
      console.error('Failed to load secretary academics queues:', error);
      toast.error(error?.message || 'Failed to load secretary academics dashboard');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAll();
  }, []);

  async function submitAcademicReview() {
    if (!selectedAcademic) return;
    try {
      setSubmitting(true);
      await apiCall(`/office/academic-verification/${selectedAcademic.id}`, 'POST', {
        decision,
        comment,
      });
      toast.success('Academic verification updated.');
      setShowAcademicDialog(false);
      setSelectedAcademic(null);
      setComment('');
      await loadAll();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update academic verification');
    } finally {
      setSubmitting(false);
    }
  }

  async function submitTranscriptUpdate() {
    if (!selectedTranscript) return;
    try {
      setSubmitting(true);
      await apiCall(`/office/transcript-program/${selectedTranscript.id}`, 'PATCH', {
        status: transcriptStatus,
        comment,
      });
      toast.success('Transcript record updated.');
      setShowTranscriptDialog(false);
      setSelectedTranscript(null);
      setComment('');
      await loadAll();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update transcript record');
    } finally {
      setSubmitting(false);
    }
  }

  async function createTranscriptCase() {
    if (!transcriptStudentUid.trim()) {
      toast.error('Student UID is required.');
      return;
    }

    try {
      setSubmitting(true);
      await apiCall('/office/transcript-program', 'POST', {
        student_uid: transcriptStudentUid.trim(),
        payload: {
          studentName: transcriptStudentName,
          program: transcriptProgram,
        },
      });
      toast.success('Transcript case created.');
      setShowCreateTranscript(false);
      setTranscriptStudentUid('');
      setTranscriptStudentName('');
      setTranscriptProgram('');
      await loadAll();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to create transcript case');
    } finally {
      setSubmitting(false);
    }
  }

  async function submitMentorshipReview() {
    if (!selectedMentorship) return;
    try {
      setSubmitting(true);
      await apiCall(`/office/mentorship-applications/${selectedMentorship.id}`, 'PATCH', {
        status: decision,
        comment,
      });
      toast.success('Mentorship application updated.');
      setShowMentorshipDialog(false);
      setSelectedMentorship(null);
      setComment('');
      await loadAll();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update mentorship application');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 p-4 lg:p-8">
      <Card className="border-border/60 bg-card/95">
        <CardHeader>
          <CardTitle>Secretary Academics Workbench</CardTitle>
          <p className="text-sm text-muted-foreground">
            Review academic documents, manage transcript program cases, and vet mentorship applications.
          </p>
        </CardHeader>
      </Card>

      {loading ? (
        <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-border/60 bg-card">
          <Loader2 className="mr-3 h-5 w-5 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Loading secretary academics queues...</span>
        </div>
      ) : (
        <Tabs defaultValue={defaultTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="academic">Academic Verification</TabsTrigger>
            <TabsTrigger value="transcript">Transcript Program</TabsTrigger>
            <TabsTrigger value="mentorship">Mentorship</TabsTrigger>
          </TabsList>

          <TabsContent value="academic" className="space-y-4">
            {academicItems.map((item) => (
              <Card key={item.id} className="border-border/60 bg-card/95">
                <CardContent className="space-y-4 p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold">{item.student_name}</h3>
                        <Badge variant="outline" className="capitalize">{item.type}</Badge>
                        <Badge>{item.academic_verification_status || 'pending'}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {item.program || 'No program captured'} · {item.access_number || 'No access number'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {item.source?.reason || item.payload?.reason || 'Academic verification pending.'}
                      </p>
                      <div className="space-y-2">
                        {item.source?.attachments?.map((attachment, index) => (
                          <a
                            key={`${attachment.originalname || index}-${index}`}
                            href={attachmentUrl(attachment)}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 px-4 py-3 text-sm hover:bg-muted/35"
                          >
                            <span>{attachment.originalname || `Attachment ${index + 1}`}</span>
                            <ExternalLink className="h-4 w-4 text-muted-foreground" />
                          </a>
                        ))}
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedAcademic(item);
                          setDecision('approve');
                          setComment(item.academic_verification_comment || '');
                          setShowAcademicDialog(true);
                        }}
                      >
                        Review
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {!academicItems.length && (
              <Card className="border-border/60 bg-card/95">
                <CardContent className="p-6 text-sm text-muted-foreground">
                  No academic verification items are waiting right now.
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="transcript" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => setShowCreateTranscript(true)}>Create Transcript Case</Button>
            </div>
            {transcriptItems.map((item) => (
              <Card key={item.id} className="border-border/60 bg-card/95">
                <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold">{item.student_name || item.payload?.studentName || item.student_uid}</h3>
                      <Badge>{item.transcript_program_status || 'pending'}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Student UID: {item.student_uid} · Program: {item.program || item.payload?.program || '—'}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedTranscript(item);
                      setTranscriptStatus(item.transcript_program_status || 'in_progress');
                      setComment('');
                      setShowTranscriptDialog(true);
                    }}
                  >
                    Update Status
                  </Button>
                </CardContent>
              </Card>
            ))}
            {!transcriptItems.length && (
              <Card className="border-border/60 bg-card/95">
                <CardContent className="p-6 text-sm text-muted-foreground">
                  No transcript program records yet.
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="mentorship" className="space-y-4">
            {mentorshipItems.map((item) => (
              <Card key={item.id} className="border-border/60 bg-card/95">
                <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold">{item.student_name}</h3>
                      <Badge>{item.mentorship_application_status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Requested mentor: {item.mentor_name} · Field: {item.field || 'General'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {item.requested_at ? new Date(item.requested_at).toLocaleString() : 'Request time unavailable'}
                    </p>
                    {item.mentorship_comment ? (
                      <p className="text-sm text-muted-foreground">Latest note: {item.mentorship_comment}</p>
                    ) : null}
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedMentorship(item);
                      setDecision(item.mentorship_application_status === 'in_review' ? 'in_review' : 'approve');
                      setComment(item.mentorship_comment || '');
                      setShowMentorshipDialog(true);
                    }}
                  >
                    Review
                  </Button>
                </CardContent>
              </Card>
            ))}
            {!mentorshipItems.length && (
              <Card className="border-border/60 bg-card/95">
                <CardContent className="p-6 text-sm text-muted-foreground">
                  No mentorship applications are waiting right now.
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}

      <Dialog open={showAcademicDialog} onOpenChange={setShowAcademicDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Academic Verification Decision</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button variant={decision === 'approve' ? 'default' : 'outline'} onClick={() => setDecision('approve')}>
                Approve
              </Button>
              <Button variant={decision === 'reject' ? 'destructive' : 'outline'} onClick={() => setDecision('reject')}>
                Reject
              </Button>
            </div>
            <div className="space-y-2">
              <Label>Comment</Label>
              <Textarea value={comment} onChange={(event) => setComment(event.target.value)} rows={4} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAcademicDialog(false)}>Cancel</Button>
            <Button onClick={submitAcademicReview} disabled={submitting}>
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showTranscriptDialog} onOpenChange={setShowTranscriptDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Transcript Program Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={transcriptStatus}
                onChange={(event) => setTranscriptStatus(event.target.value)}
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Comment</Label>
              <Textarea value={comment} onChange={(event) => setComment(event.target.value)} rows={4} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTranscriptDialog(false)}>Cancel</Button>
            <Button onClick={submitTranscriptUpdate} disabled={submitting}>
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showMentorshipDialog} onOpenChange={setShowMentorshipDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Mentorship Application</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button variant={decision === 'approve' ? 'default' : 'outline'} onClick={() => setDecision('approve')}>
                Approve
              </Button>
              <Button variant={decision === 'in_review' ? 'secondary' : 'outline'} onClick={() => setDecision('in_review')}>
                Mark In Review
              </Button>
              <Button variant={decision === 'reject' ? 'destructive' : 'outline'} onClick={() => setDecision('reject')}>
                Reject
              </Button>
            </div>
            <div className="space-y-2">
              <Label>Comment</Label>
              <Textarea value={comment} onChange={(event) => setComment(event.target.value)} rows={4} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMentorshipDialog(false)}>Cancel</Button>
            <Button onClick={submitMentorshipReview} disabled={submitting}>
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCreateTranscript} onOpenChange={setShowCreateTranscript}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Transcript Program Case</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Student UID</Label>
              <Input value={transcriptStudentUid} onChange={(event) => setTranscriptStudentUid(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Student Name</Label>
              <Input value={transcriptStudentName} onChange={(event) => setTranscriptStudentName(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Program</Label>
              <Input value={transcriptProgram} onChange={(event) => setTranscriptProgram(event.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateTranscript(false)}>Cancel</Button>
            <Button onClick={createTranscriptCase} disabled={submitting}>
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Create Case
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
