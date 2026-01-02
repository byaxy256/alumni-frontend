// src/components/student/PaymentHistory.tsx

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ArrowLeft, CheckCircle2, Calendar, CreditCard, Smartphone, Building2, Download, Loader2, FileWarning } from 'lucide-react';
import type { User } from '../../App';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { API_BASE } from '../../api';
import { PaymentPINPrompt } from './PaymentPINPrompt';

// --- Type Definitions ---
interface PaymentItem {
  id: string;
  created_at: string;
  amount: number;
  status: 'SUCCESSFUL' | 'PENDING' | 'FAILED';
  receiptNumber?: string;
  method?: string;
}

interface Loan {
    id: number;
    outstanding_balance: number;
}

export function PaymentHistory({ user, onBack }: { user: User; onBack: () => void; }) {
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'mtn' | 'airtel' | 'bank'>('mtn');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPINPrompt, setShowPINPrompt] = useState(false);
  const [pendingTransactionId, setPendingTransactionId] = useState<string | null>(null);

  const [paymentHistory, setPaymentHistory] = useState<PaymentItem[]>([]);
  const [activeLoan, setActiveLoan] = useState<Loan | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptPreviewUrl, setReceiptPreviewUrl] = useState<string | null>(null);
  const [receiptPaymentId, setReceiptPaymentId] = useState<string | null>(null);
  const [isFetchingReceipt, setIsFetchingReceipt] = useState(false);
  const [previewingId, setPreviewingId] = useState<string | null>(null);

  const sanitizeAccessNumber = (value: string) => {
    const upper = value.toUpperCase();
    const letter = upper[0];
    if (letter !== 'A' && letter !== 'B') return '';
    const digits = upper.slice(1).replace(/\D/g, '').slice(0, 5);
    return `${letter}${digits}`;
  };

  // --- This is the corrected, simplified useEffect for fetching data ---
  const fetchHistory = async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token') || '';
      if (!token) throw new Error("Authentication token not found.");
      const headers = { Authorization: `Bearer ${token}` };

      const loanRes = await fetch(`${API_BASE}/loans/mine`, { headers, cache: 'no-cache', signal });
      if (!loanRes.ok) throw new Error("Could not fetch active loan.");
      const allLoans: any[] = await loanRes.json();
      const firstActiveLoan = allLoans.find(l => l.status === 'approved');
      
      if (firstActiveLoan) {
        setActiveLoan(firstActiveLoan);
        const historyRes = await fetch(`${API_BASE}/payments/loan/${firstActiveLoan.id}`, { headers, cache: 'no-cache', signal });
        if (historyRes.ok) {
          const historyData: PaymentItem[] = await historyRes.json();
          setPaymentHistory(historyData);
        } else {
          setPaymentHistory([]);
        }
      } else {
        setActiveLoan(null);
        setPaymentHistory([]);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        toast.error(err.message || "Failed to load payment history.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReceipt = async (paymentId: string) => {
    try {
      const token = localStorage.getItem('token') || '';
      if (!token) throw new Error('Missing auth token');
      setDownloadingId(paymentId);

      const res = await fetch(`${API_BASE}/payments/${paymentId}/receipt`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Could not download receipt.');
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `receipt-${paymentId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success('Receipt downloaded');
    } catch (err: any) {
      toast.error(err.message || 'Failed to download receipt');
    } finally {
      setDownloadingId(null);
    }
  };

  const cleanupReceiptPreview = () => {
    if (receiptPreviewUrl) {
      URL.revokeObjectURL(receiptPreviewUrl);
    }
    setReceiptPreviewUrl(null);
    setReceiptPaymentId(null);
  };

  const fetchAndShowReceipt = async (paymentId: string, token: string) => {
    try {
      setPreviewingId(paymentId);
      setIsFetchingReceipt(true);
      setReceiptPaymentId(paymentId);
      const res = await fetch(`${API_BASE}/payments/${paymentId}/receipt`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Could not load receipt.');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setReceiptPreviewUrl(url);
      setShowReceiptModal(true);
      return url;
    } finally {
      setIsFetchingReceipt(false);
      setPreviewingId(null);
    }
  };

  const printFromUrl = (url?: string) => {
    if (!url) return;
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.src = url;
    iframe.onload = () => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (err) {
        console.warn('print error', err);
      }
      setTimeout(() => iframe.remove(), 500);
    };
    document.body.appendChild(iframe);
  };

  const triggerDownloadFromUrl = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  useEffect(() => {
    const ac = new AbortController();
    fetchHistory(ac.signal);
    return () => ac.abort();
  }, [user]);

  const handleMakePayment = async () => {
    if (!amount || Number(amount) <= 0) { toast.error('Enter a valid amount'); return; }
    if (!activeLoan) { toast.error('No active loan found to make a payment for.'); return; }

    if (paymentMethod === 'bank') {
        toast.success("Bank transfer details noted.", { description: "Please complete the transfer and use your Student ID as the reference." });
        setShowPaymentDialog(false);
        setAmount('');
        return;
    }
    
    const accessPattern = /^[AB]\d{5}$/;
    if ((paymentMethod === 'mtn' || paymentMethod === 'airtel') && !accessPattern.test(phoneNumber)) {
      toast.error('Access number must be A12345 or B12345 format.');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token') || '';
      const payload = { amount: Number(amount), provider: paymentMethod, phone: phoneNumber, loanId: activeLoan.id };
      const res = await fetch(`${API_BASE}/payments/initiate`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Payment initiation failed.');
      
      // On 202 response, show PIN prompt
      if (res.status === 202) {
        setShowPaymentDialog(false);
        setShowPINPrompt(true);
        if (data?.transactionId) {
          setPendingTransactionId(data.transactionId);
        }
      } else {
        toast.success('Request sent! Check your phone to approve the payment.');
        setShowPaymentDialog(false);
      }
    } catch (err: any) {
      toast.error(err.message || 'Payment failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- YOUR ENTIRE ORIGINAL JSX IS PRESERVED AND RESTORED BELOW ---
  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-6">
      <div className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="text-primary">Payment History</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {activeLoan ? (
          <Card className="p-6 bg-gradient-to-br from-primary to-[#1a4d7a] text-white">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm opacity-90">Outstanding Loan Balance</p>
                <p className="text-3xl mt-1">UGX {Number(activeLoan.outstanding_balance || 0).toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center"><CreditCard className="w-6 h-6" /></div>
            </div>
            <Button onClick={() => setShowPaymentDialog(true)} className="w-full bg-accent hover:bg-accent/90">Make Payment Now</Button>
          </Card>
        ) : (
          <Card className="p-6 text-center">
            <FileWarning className="mx-auto h-10 w-10 text-gray-400" />
            <p className="mt-2 text-sm text-gray-600">You have no active loan to make payments for.</p>
          </Card>
        )}

        <Card className="p-5">
          <h3 className="text-sm mb-3">Accepted Payment Methods</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-yellow-50 rounded-lg"><Smartphone className="w-8 h-8 mx-auto mb-2 text-yellow-600" /><p className="text-xs">MTN Money</p></div>
            <div className="text-center p-3 bg-red-50 rounded-lg"><Smartphone className="w-8 h-8 mx-auto mb-2 text-red-600" /><p className="text-xs">Airtel Money</p></div>
            <div className="text-center p-3 bg-blue-50 rounded-lg"><Building2 className="w-8 h-8 mx-auto mb-2 text-blue-600" /><p className="text-xs">Bank Transfer</p></div>
          </div>
        </Card>

        <div>
          <h3 className="text-lg mb-4">Transaction History</h3>
          <div className="space-y-3">
            {paymentHistory.length > 0 ? (
              paymentHistory.map((payment) => (
                <Card key={payment.id} className="p-5">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex gap-4 flex-1">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-green-100">
                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="text-sm font-medium">Loan Repayment</h4>
                          <p className="text-sm font-semibold">UGX {payment.amount.toLocaleString()}</p>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-600">
                          <div className="flex items-center gap-1"><Calendar className="w-3 h-3" /><span>{new Date(payment.created_at).toLocaleDateString()}</span></div>
                          {payment.method && <><span>•</span><span>{payment.method}</span></>}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="default">Completed</Badge>
                          {payment.receiptNumber && <span className="text-xs text-gray-500">Receipt: {payment.receiptNumber}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-3 border-t border-gray-200">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          const token = localStorage.getItem('token') || '';
                          if (!token) throw new Error('Missing auth token');
                          await fetchAndShowReceipt(String(payment.id), token);
                        } catch (err: any) {
                          toast.error(err?.message || 'Failed to load receipt preview');
                        }
                      }}
                      className="flex-1"
                      disabled={previewingId === String(payment.id) || isFetchingReceipt}
                    >
                      {previewingId === String(payment.id) ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4 mr-2 rotate-90" />
                      )}
                      Preview Receipt
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadReceipt(payment.id)}
                      className="flex-1"
                      disabled={payment.status !== 'SUCCESSFUL' || downloadingId === String(payment.id)}
                    >
                      {downloadingId === String(payment.id) ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4 mr-2" />
                      )}
                      Download Receipt
                    </Button>
                  </div>
                </Card>
              ))
            ) : (
              <div className="text-center py-6 border-2 border-dashed rounded-lg">
                <p className="text-sm text-gray-500">No successful payments found.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Make a Payment</DialogTitle>
            <DialogDescription>Choose your payment method and complete the transaction</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Amount (UGX)</Label>
              <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={String(activeLoan?.outstanding_balance || '')} />
            </div>
            <div>
              <Label>Payment Method</Label>
              <RadioGroup value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)} className="space-y-2">
                <Card className={paymentMethod === 'mtn' ? 'border-2 border-yellow-500' : ''}>
                  <CardContent className="p-4"><RadioGroupItem value="mtn" id="mtn" className="mr-2" /><Label htmlFor="mtn">MTN Access Number</Label></CardContent>
                </Card>
                <Card className={paymentMethod === 'airtel' ? 'border-2 border-red-500' : ''}>
                  <CardContent className="p-4"><RadioGroupItem value="airtel" id="airtel" className="mr-2" /><Label htmlFor="airtel">Airtel Access Number</Label></CardContent>
                </Card>
                <Card className={paymentMethod === 'bank' ? 'border-2 border-blue-500' : ''}>
                  <CardContent className="p-4"><RadioGroupItem value="bank" id="bank" className="mr-2" /><Label htmlFor="bank">Bank Transfer</Label></CardContent>
                </Card>
              </RadioGroup>
            </div>
            {paymentMethod === 'bank' && (
              <div className="bg-blue-50 p-4 rounded-lg text-sm border border-blue-200">
                <p className="mb-2 font-semibold">Please transfer the amount to:</p>
                <p><strong>Account Name:</strong> UCU Alumni Fund</p>
                <p><strong>Account Number:</strong> 1234567890</p>
                <p><strong>Bank:</strong> Stanbic Bank Uganda</p>
                <p className="mt-2 text-xs text-gray-600">Important: Use your Student ID as the payment reference.</p>
              </div>
            )}
            {(paymentMethod === 'mtn' || paymentMethod === 'airtel') && (
              <div>
                <Label htmlFor="phone">Access Number</Label>
                <Input
                  id="phone"
                  type="text"
                  inputMode="numeric"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(sanitizeAccessNumber(e.target.value))}
                  placeholder="A12345 or B12345"
                  maxLength={6}
                />
              </div>
            )}
            <Button onClick={handleMakePayment} className="w-full" disabled={!amount || isSubmitting || (paymentMethod !== 'bank' && !phoneNumber)}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isSubmitting ? 'Processing...' : 'Proceed to Payment'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* PIN Prompt Modal */}
      {showPINPrompt && (
        <PaymentPINPrompt
          phoneNumber={phoneNumber}
          amount={Number(amount)}
          provider={paymentMethod as 'mtn' | 'airtel'}
          onSuccess={async () => {
            try {
              if (!pendingTransactionId) {
                toast.error('Missing transaction ID; cannot record payment.');
                setShowPINPrompt(false);
                return;
              }
              
              const token = localStorage.getItem('token') || '';
              const confirmRes = await fetch(`${API_BASE}/payments/confirm`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ transactionId: pendingTransactionId }),
              });
              
              const confirmData = await confirmRes.json().catch(() => ({}));
              if (!confirmRes.ok) {
                throw new Error(confirmData.error || 'Failed to record payment.');
              }
              
              // Show success message
              toast.success('Payment completed successfully!');
              
              // Reset form and close modals
              setShowPINPrompt(false);
              setShowPaymentDialog(false);
              setAmount('');
              setPhoneNumber('');
              setPendingTransactionId(null);
              
              // Refresh all data immediately
              await fetchHistory();
              
              // If receipt available, show it
              if (confirmData?.paymentId) {
                const url = await fetchAndShowReceipt(String(confirmData.paymentId), token);
                printFromUrl(url);
              }
            } catch (err: any) {
              toast.error(err.message || 'Failed to record payment.');
              setShowPINPrompt(false);
            }
          }}
          onCancel={() => {
            setShowPINPrompt(false);
            toast.info('Payment cancelled.');
          }}
        />
      )}

      <Dialog
        open={showReceiptModal}
        onOpenChange={(open) => {
          setShowReceiptModal(open);
          if (!open) {
            cleanupReceiptPreview();
          }
        }}
      >
        <DialogContent className="max-w-3xl w-full">
          <DialogHeader>
            <DialogTitle>Payment Receipt</DialogTitle>
            <DialogDescription>
              Preview your payment receipt and download a PDF copy.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!receiptPreviewUrl || isFetchingReceipt}
                onClick={() => {
                  if (receiptPreviewUrl) {
                    triggerDownloadFromUrl(receiptPreviewUrl, `receipt-${receiptPaymentId || 'payment'}.pdf`);
                  }
                }}
              >
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            </div>
            <div className="h-[70vh] w-full border rounded-lg overflow-hidden bg-gray-50">
              {isFetchingReceipt && (
                <div className="h-full flex items-center justify-center text-gray-600">
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Loading receipt preview...
                </div>
              )}
              {!isFetchingReceipt && receiptPreviewUrl && (
                <iframe
                  title="Receipt Preview"
                  src={receiptPreviewUrl}
                  className="w-full h-full"
                  aria-label="Payment receipt PDF preview"
                />
              )}
              {!isFetchingReceipt && !receiptPreviewUrl && (
                <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                  Receipt not available.
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}