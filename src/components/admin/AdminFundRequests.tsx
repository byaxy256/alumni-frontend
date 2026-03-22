import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { apiCall } from '../../api';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface FundRequest {
  id: string;
  amount: number;
  purpose: string;
  neededBy?: string | null;
  notes?: string | null;
  status?: string;
  createdAt?: string;
  requestedByName?: string;
}

export default function AdminFundRequests() {
  const [requests, setRequests] = useState<FundRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token') || undefined;
      const data = await apiCall('/admin/fund-requests', 'GET', undefined, token);
      setRequests(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to load fund requests', err);
      setError(err?.message || 'Failed to load fund requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleApprove = async (requestId: string) => {
    setApprovingId(requestId);
    try {
      const token = localStorage.getItem('token') || undefined;
      await apiCall(`/admin/fund-requests/${requestId}/approve`, 'PUT', {}, token);
      toast.success('Fund request approved');
      await loadRequests();
    } catch (err: any) {
      console.error('Failed to approve request', err);
      toast.error(err?.message || 'Failed to approve request');
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async (requestId: string) => {
    const commentInput = window.prompt('Optional: Add a comment for rejection', '');

    if (commentInput === null) {
      return;
    }

    setRejectingId(requestId);
    try {
      const token = localStorage.getItem('token') || undefined;
      await apiCall(`/admin/fund-requests/${requestId}/reject`, 'PUT', { comment: commentInput.trim() || null }, token);
      toast.success('Fund request rejected');
      await loadRequests();
    } catch (err: any) {
      console.error('Failed to reject request', err);
      toast.error(err?.message || 'Failed to reject request');
    } finally {
      setRejectingId(null);
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Requested Funds</h1>
          <p className="text-muted-foreground text-base mt-1.5">
            Review and approve/reject funding requests from the alumni office
          </p>
        </div>
        <Button onClick={loadRequests} variant="outline" disabled={loading} className="text-sm">
          Refresh
        </Button>
      </div>

      <Card className="!bg-[#0b2a4a] !text-white !border-[#355C9A] shadow-sm">
        <CardHeader className="bg-gradient-to-r from-[#091f37] to-[#2d4d81] border-b border-blue-200/20">
          <CardTitle className="text-white text-xl">Fund Requests</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center gap-2 text-white/90 text-base">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading fund requests...
            </div>
          ) : error ? (
            <p className="text-base text-red-200">{error}</p>
          ) : requests.length === 0 ? (
            <p className="text-base text-white/80">No fund requests have been submitted yet.</p>
          ) : (
            <div className="space-y-3">
              {requests.map((req) => {
                const isPending = !req.status || req.status.toLowerCase() === 'pending';
                const isApproved = req.status?.toLowerCase() === 'approved';
                const isRejected = req.status?.toLowerCase() === 'rejected';

                return (
                  <Card key={req.id} className="!bg-[#1f4a83] !text-white !border-[#6f95c8] hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <p className="text-base font-semibold text-white">
                              {req.purpose || 'Funding request'}
                            </p>
                            <p className="text-sm text-white/85 mt-1">
                              Requested by <span className="font-medium">{req.requestedByName || 'Alumni Office'}</span>
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-white">
                              UGX {Number(req.amount || 0).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {isApproved && (
                            <Badge className="bg-green-100 text-green-700 border-green-300">
                              ✓ Approved
                            </Badge>
                          )}
                          {isRejected && (
                            <Badge className="bg-red-100 text-red-700 border-red-300">
                              ✗ Rejected
                            </Badge>
                          )}
                          {isPending && (
                            <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">
                              Pending
                            </Badge>
                          )}
                        </div>

                        <div className="text-sm text-white/80">
                          {req.neededBy
                            ? `Needed by ${new Date(req.neededBy).toLocaleDateString()}`
                            : req.createdAt
                            ? `Requested ${new Date(req.createdAt).toLocaleDateString()}`
                            : null}
                        </div>

                        {req.notes && (
                          <p className="text-sm text-white bg-[#16365e] p-2 rounded border border-blue-200/20">
                            {req.notes}
                          </p>
                        )}

                        {isPending && (
                          <div className="flex gap-2 pt-2">
                            <Button
                              onClick={() => handleApprove(req.id)}
                              disabled={approvingId === req.id || rejectingId === req.id}
                              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold text-sm border border-green-300/40"
                            >
                              {approvingId === req.id ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                  Approving...
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Approve
                                </>
                              )}
                            </Button>
                            <Button
                              onClick={() => handleReject(req.id)}
                              disabled={approvingId === req.id || rejectingId === req.id}
                              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold text-sm border border-red-300/40"
                            >
                              {rejectingId === req.id ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                  Rejecting...
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Reject
                                </>
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

