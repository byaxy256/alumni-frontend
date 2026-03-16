import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { apiCall } from '../../api';
import { Loader2 } from 'lucide-react';

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

  useEffect(() => {
    const load = async () => {
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
    load();
  }, []);

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Requested Funds</h1>
        <p className="text-muted-foreground text-sm">
          View funding requests submitted by the alumni office. Use this list to review and process approvals.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fund requests from Alumni Office</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading fund requests...
            </div>
          ) : error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : requests.length === 0 ? (
            <p className="text-sm text-muted-foreground">No fund requests have been submitted yet.</p>
          ) : (
            <div className="space-y-3">
              {requests.map((req) => (
                <Card key={req.id} className="border border-border/80 bg-background">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {req.purpose || 'Funding request'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Requested by {req.requestedByName || 'Alumni Office'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-primary">
                          UGX {Number(req.amount || 0).toLocaleString()}
                        </p>
                        {req.status && (
                          <Badge variant="outline" className="text-xs mt-1 capitalize">
                            {req.status}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {req.neededBy
                          ? `Needed by ${new Date(req.neededBy).toLocaleDateString()}`
                          : req.createdAt
                          ? `Requested ${new Date(req.createdAt).toLocaleDateString()}`
                          : null}
                      </span>
                    </div>
                    {req.notes && (
                      <p className="text-xs text-muted-foreground mt-1">{req.notes}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

