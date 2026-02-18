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
    .filter(r => r.status === 'approved')
    .reduce((s, r) => s + (r.amount_requested || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-6">
      <div className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg"
            title="Go back"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="sr-only">Go back</span>
          </button>
          <h1 className="text-primary">Student Fund</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <Card className="p-6 bg-gradient-to-br from-primary to-[#1a4d7a] text-white">
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
                            {r.status?.replace('_', ' ') || 'pending'}
                          </Badge>
                        </div>
                        {r.reason && (
                          <p className="text-xs text-gray-500 mt-2 line-clamp-2">Reason: {r.reason}</p>
                        )}
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
