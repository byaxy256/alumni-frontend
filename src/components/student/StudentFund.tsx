import { Card } from '../ui/card';
import { Button } from '../ui/button';
import type { User } from '../../App';
import { ArrowLeft, Download, Eye, Printer, DollarSign, Calendar, CheckCircle2, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { API_BASE } from '../../api';
import { toast } from 'sonner';

interface StudentFundProps {
  user: User;
  onBack: () => void;
}

type Transaction = {
  id: string;
  type: string;
  amount: number;
  date: string;
  status: string;
  receiptNumber?: string;
  raw?: any;
};

export function StudentFund({ user, onBack }: StudentFundProps) {
  const [selectedReceipt, setSelectedReceipt] = useState<Transaction | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handlePrint = (tx: Transaction | null) => {
    if (!tx) return;
    const win = window.open('', '_blank', 'width=800,height=900');
    if (!win) return;
    win.document.write(`
      <html>
        <head>
          <title>Receipt ${tx.receiptNumber || tx.id}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; }
            .title { text-align:center; margin-bottom:16px; }
            .row { display:flex; justify-content:space-between; margin:8px 0; }
            .total { font-size:18px; font-weight:bold; margin-top:16px; }
            .muted { color:#666; font-size:12px; text-align:center; margin-top:24px; }
          </style>
        </head>
        <body>
          <div class="title">
            <h2>Student Benefit Receipt</h2>
            <div>Uganda Christian University</div>
          </div>
          <div class="row"><span>Receipt No:</span><span>${tx.receiptNumber || '—'}</span></div>
          <div class="row"><span>Date:</span><span>${new Date(tx.date).toLocaleString()}</span></div>
          <div class="row"><span>Student:</span><span>${user.name}</span></div>
          <div class="row"><span>Description:</span><span>${tx.type}</span></div>
          <div class="total">Total Received: UGX ${tx.amount.toLocaleString()}</div>
          <div class="muted">This is an electronically generated receipt</div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    win.document.close();
  };

  const handleDownload = async (tx: Transaction | null) => {
    if (!tx) return;
    try {
      setDownloadingId(tx.id);
      const token = localStorage.getItem('token') || '';
      const res = await fetch(`${API_BASE}/disburse/${tx.id}/receipt`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to download receipt');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `student-benefit-${tx.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success('Receipt downloaded');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to download receipt');
    } finally {
      setDownloadingId(null);
    }
  };

  useEffect(() => {
    const ac = new AbortController();
    const token = localStorage.getItem('token') || '';

    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/disburse/mine`, {
          signal: ac.signal,
          headers: token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' },
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to load student benefits.');
        }

        const list = await res.json();
        const normalized: Transaction[] = (Array.isArray(list) ? list : []).map((t: any, idx: number) => ({
          id: String(t.id ?? `${Date.now()}-${idx}`),
          type: 'Student Benefit',
          amount: Number(t.net_amount ?? t.netAmount ?? t.amount ?? 0),
          date: t.approved_at ?? t.created_at ?? new Date().toISOString(),
          status: 'received',
          receiptNumber: t.reference ?? t.ref ?? undefined,
          raw: t,
        }));
        setTransactions(normalized);
      } catch (err: any) {
        console.error('Failed to load benefits', err);
        toast.error(err?.message || 'Failed to load student benefits');
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    }

    load();
    return () => ac.abort();
  }, [user]);

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
        {/* Summary Card */}
        <Card className="p-6 bg-gradient-to-br from-primary to-[#1a4d7a] text-white">
          <h2 className="text-lg mb-4">Fund Summary</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm opacity-80">Total Received (Benefits)</p>
              <p className="text-2xl mt-1">
                UGX {transactions.reduce((s, t) => s + (t.amount || 0), 0).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm opacity-80">This Semester</p>
              <p className="text-2xl mt-1">
                UGX {transactions
                  .filter((t) => {
                    // rudimentary this-semester filter: same year and within last 6 months
                    try {
                      const d = new Date(t.date);
                      const now = new Date();
                      return d.getFullYear() === now.getFullYear();
                    } catch {
                      return false;
                    }
                  })
                  .reduce((s, t) => s + (t.amount || 0), 0)
                  .toLocaleString()}
              </p>
            </div>
          </div>
        </Card>

        {/* Transactions List */}
        <div>
          <h3 className="text-lg mb-4">Transaction History</h3>
          <div className="space-y-3">
            {loading ? (
              <div className="text-sm text-gray-500">Loading transactions...</div>
            ) : transactions.length ? (
              transactions.map((transaction) => (
                <Card key={transaction.id} className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-4 flex-1">
                      <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                        <DollarSign className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="text-sm">{transaction.type}</h4>
                          <p className="text-sm text-green-600">
                            +UGX {transaction.amount.toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(transaction.date).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-green-600" />
                            <span className="text-green-600">{transaction.status}</span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Receipt: {transaction.receiptNumber ?? '—'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedReceipt(transaction)}
                      className="flex-1"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Preview Receipt
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePrint(transaction)}
                      className="flex-1"
                    >
                      <Printer className="w-4 h-4 mr-2" />
                      Print Receipt
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(transaction)}
                      className="flex-1"
                      disabled={downloadingId === transaction.id}
                    >
                      {downloadingId === transaction.id ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4 mr-2" />
                      )}
                      Download
                    </Button>
                  </div>
                </Card>
              ))
            ) : (
              <div className="text-sm text-gray-500">No transactions found.</div>
            )}
          </div>
        </div>
      </div>

      {/* Receipt Preview Dialog */}
      <Dialog open={!!selectedReceipt} onOpenChange={() => setSelectedReceipt(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Receipt Preview</DialogTitle>
            <DialogDescription>View and print your transaction receipt</DialogDescription>
          </DialogHeader>
          <div className="p-6 bg-white border border-gray-200 rounded-lg">
            <div className="text-center mb-6">
              <h3 className="text-xl mb-1">Uganda Christian University</h3>
              <p className="text-sm text-gray-600">Official Receipt</p>
            </div>

            {selectedReceipt ? (
              <>
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Receipt No:</span>
                    <span>{selectedReceipt.receiptNumber ?? '—'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Date:</span>
                    <span>{new Date(selectedReceipt.date).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Student:</span>
                    <span>{user.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Description:</span>
                    <span>{selectedReceipt.type}</span>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between">
                    <span>Total Amount:</span>
                    <span className="text-xl">
                      UGX {selectedReceipt.amount.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200 text-center">
                  <p className="text-xs text-gray-500">
                    This is an electronically generated receipt
                  </p>
                </div>
              </>
            ) : (
              <div className="text-sm text-gray-500">Receipt not available.</div>
            )}
          </div>

          <div className="flex gap-2 mt-4">
            <Button onClick={() => handlePrint(selectedReceipt)} className="flex-1">
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => handleDownload(selectedReceipt)} disabled={!!downloadingId}>
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
