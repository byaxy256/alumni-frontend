import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import type { User } from '../../App';
import { ArrowLeft, Calendar, DollarSign, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { API_BASE } from '../../api';
import { toast } from 'sonner';

interface StudentFundProps {
  user: User;
  onBack: () => void;
}

type SupportRequest = {
  id: string;
  amount_requested: number;
  status: string;
  created_at: string;
  reason?: string;
  current_stage?: string;
  overall_status?: string;
  administrator_comment?: string;
  general_secretary_comment?: string;
  finance_review_comment?: string;
  president_comment?: string;
  finance_disbursement_comment?: string;
  academic_verification_status?: string;
  academic_verification_comment?: string;
  approved_amount?: number;
  disbursed_amount?: number;
  approval_logs?: Array<{
    stage?: string;
    decision?: string;
    comment?: string | null;
    timestamp?: string;
  }>;
};

export function StudentFund({ user, onBack }: StudentFundProps) {
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ac = new AbortController();
    const token = localStorage.getItem('token') || '';

    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/support/mine`, {
          signal: ac.signal,
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to load support requests.');
        }

        const list = await res.json();
        const normalized: SupportRequest[] = (Array.isArray(list) ? list : []).map((r: any, idx: number) => ({
          id: String(r.id ?? r._id ?? `${Date.now()}-${idx}`),
          amount_requested: Number(r.amount_requested ?? r.amountRequested ?? 0),
          status: r.status || 'pending',
          created_at: r.created_at || r.createdAt || new Date().toISOString(),
          reason: r.reason || r.purpose || '',
          current_stage: r.current_stage,
          overall_status: r.overall_status,
          administrator_comment: r.administrator_comment,
          general_secretary_comment: r.general_secretary_comment,
          finance_review_comment: r.finance_review_comment,
          president_comment: r.president_comment,
          finance_disbursement_comment: r.finance_disbursement_comment,
          academic_verification_status: r.academic_verification_status,
          academic_verification_comment: r.academic_verification_comment,
          approved_amount: Number(r.approved_amount || 0) || undefined,
          disbursed_amount: Number(r.disbursed_amount || 0) || undefined,
          approval_logs: Array.isArray(r.approval_logs) ? r.approval_logs : [],
        }));
        setRequests(normalized);
      } catch (err: any) {
        console.error('Failed to load support requests', err);
        toast.error(err?.message || 'Failed to load support requests');
        setRequests([]);
      } finally {
        setLoading(false);
      }
    }

    load();
    return () => ac.abort();
  }, [user]);

  const totalRequested = requests.reduce((s, r) => s + (r.amount_requested || 0), 0);
  const totalApproved = requests
    .filter(r => ['approved', 'disbursed'].includes(r.status))
    .reduce((s, r) => s + Number(r.approved_amount || r.disbursed_amount || r.amount_requested || 0), 0);

  const latestComment = (request: SupportRequest) =>
    request.finance_disbursement_comment ||
    request.president_comment ||
    request.finance_review_comment ||
    request.general_secretary_comment ||
    request.administrator_comment ||
    request.academic_verification_comment ||
    '';

  return (
    <div className="min-h-screen pb-20 md:pb-6" style={{ background: 'var(--background)' }}>
      <div className="p-4 sticky top-0 z-10" style={{ background: 'linear-gradient(135deg, #0b2a4a 0%, #1a4d7a 100%)', borderBottom: '1px solid rgba(255,255,255,0.12)' }}>
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-white/15 rounded-lg text-white"
            title="Go back"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="sr-only">Go back</span>
          </button>
          <h1 className="text-white">Student Fund</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <Card className="p-6 text-white" style={{ background: 'linear-gradient(135deg, #0b2a4a 0%, #1a4d7a 100%)' }}>
          <h2 className="text-lg mb-4">Support Summary</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm opacity-80">Total Requested</p>
              <p className="text-2xl mt-1">UGX {totalRequested.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm opacity-80">Approved</p>
              <p className="text-2xl mt-1">UGX {totalApproved.toLocaleString()}</p>
            </div>
          </div>
        </Card>

        <div>
          <h3 className="text-lg mb-4">Support Requests</h3>
          <div className="space-y-3">
            {loading ? (
              <div className="text-sm text-gray-500 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading requests...
              </div>
            ) : requests.length ? (
              requests.map((r) => (
                <Card key={r.id} className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-4 flex-1">
                      <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                        <DollarSign className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="text-sm">Support Request</h4>
                          <p className="text-sm text-green-600">UGX {r.amount_requested.toLocaleString()}</p>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(r.created_at).toLocaleDateString()}</span>
                          </div>
                          <Badge className="capitalize" variant="secondary">
                            {(r.overall_status || r.status || 'pending')?.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Current stage: {String(r.current_stage || r.status || 'submitted').replace(/_/g, ' ')}
                        </p>
                        {r.academic_verification_status && r.academic_verification_status !== 'not_required' ? (
                          <p className="text-xs text-gray-500 mt-1">
                            Academic verification: {r.academic_verification_status.replace(/_/g, ' ')}
                          </p>
                        ) : null}
                        {r.reason && (
                          <p className="text-xs text-gray-500 mt-2 line-clamp-2">Reason: {r.reason}</p>
                        )}
                        {latestComment(r) ? (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">Latest note: {latestComment(r)}</p>
                        ) : null}
                        {r.approval_logs?.length ? (
                          <div className="mt-3 rounded-xl border border-border/60 bg-muted/20 p-3">
                            <p className="text-xs font-medium text-foreground mb-2">Workflow timeline</p>
                            <div className="space-y-2">
                              {r.approval_logs.map((log, index) => (
                                <div key={`${log.stage || 'stage'}-${index}`} className="text-xs text-gray-500">
                                  <span className="font-medium text-foreground">
                                    {String(log.stage || 'submitted').replace(/_/g, ' ')}
                                  </span>
                                  {' · '}
                                  {String(log.decision || 'updated').replace(/_/g, ' ')}
                                  {log.timestamp ? ` · ${new Date(log.timestamp).toLocaleString()}` : ''}
                                  {log.comment ? (
                                    <>
                                      {' — '}
                                      {log.comment}
                                    </>
                                  ) : null}
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <div className="text-sm text-gray-500">No support requests found.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
