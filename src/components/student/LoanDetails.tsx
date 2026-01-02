// src/components/student/LoanDetails.tsx
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ArrowLeft, Calendar, DollarSign, TrendingDown, CreditCard, Loader2, FileWarning, Download, CheckCircle2 } from 'lucide-react';
import type { User } from '../../App';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useState, useEffect } from 'react';
import { API_BASE } from '../../api';
import { PaymentPINPrompt } from './PaymentPINPrompt';

interface Loan {
  id: number;
  amount_requested: number;
  outstanding_balance: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  repaymentPeriod?: number;
  chopConsented?: boolean;
}

interface Payment {
  id: number;
  amount: number;
  status: 'SUCCESSFUL' | string;
  created_at: string;
}

interface RepaymentItem {
  status: 'paid' | 'upcoming';
  month: string;
  date: string;
  amount: number;
}

export function LoanDetails({ user, onBack }: { user: User; onBack: () => void; }) {
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [mobileMoneyNumber, setMobileMoneyNumber] = useState('');
  const [accessNumber, setAccessNumber] = useState('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [showPINPrompt, setShowPINPrompt] = useState(false);
  const [pendingTransactionId, setPendingTransactionId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [activeLoan, setActiveLoan] = useState<Loan | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<Payment[]>([]);
  const [repaymentSchedule, setRepaymentSchedule] = useState<RepaymentItem[]>([]);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setActiveLoan(null);
      try {
        const token = localStorage.getItem('token') || '';
        if (!token) throw new Error('Authentication token not found.');
        const headers = { Authorization: `Bearer ${token}` };

        // Fetch loans
        const loanRes = await fetch(`${API_BASE}/loans/mine`, { headers, cache: 'no-cache' });
        if (!loanRes.ok) throw new Error(`Failed to fetch your loans: ${loanRes.statusText}`);
        const allLoans: Loan[] = await loanRes.json();
        const firstActiveLoan = allLoans.find(l => l.status === 'approved');
        if (!firstActiveLoan) {
          setActiveLoan(null);
          setPaymentHistory([]);
          setRepaymentSchedule([]);
          return;
        }
        setActiveLoan(firstActiveLoan);

        // Fetch payment history for the active loan
        try {
          const historyRes = await fetch(`${API_BASE}/payments/loan/${firstActiveLoan.id}`, { headers, cache: 'no-cache' });
          if (historyRes.ok) {
            const history: Payment[] = await historyRes.json();
            setPaymentHistory(history || []);
          } else {
            setPaymentHistory([]);
          }
        } catch (err) {
          setPaymentHistory([]);
        }

        // Build a 3-month repayment schedule
        const schedule: RepaymentItem[] = [];
        const REPAYMENT_MONTHS = 3;
        if (firstActiveLoan.amount_requested > 0) {
          const installmentAmount = Math.ceil(firstActiveLoan.amount_requested / REPAYMENT_MONTHS);
          const startDate = new Date();
          for (let i = 1; i <= REPAYMENT_MONTHS; i++) {
            const dueDate = new Date(startDate);
            dueDate.setMonth(startDate.getMonth() + i);
            schedule.push({
              month: `Installment ${i}`,
              date: `Due by ${dueDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`,
              amount: installmentAmount,
              status: 'upcoming',
            });
          }
        }
        setRepaymentSchedule(schedule);
      } catch (err: any) {
        console.error('Error fetching loan details', err);
        toast.error(err?.message || 'Could not load loan details.');
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [user]);

  const handleMakePayment = async () => {
    if (!activeLoan) {
      toast.error('No active loan found to make a payment for.');
      return;
    }
    
    if (!paymentAmount || Number(paymentAmount) <= 0) {
      toast.error('Please enter a valid amount.');
      return;
    }

    if (!mobileMoneyNumber) {
      toast.error('Please enter a mobile money number.');
      return;
    }

    if (!accessNumber) {
      toast.error('Please enter your access number.');
      return;
    }

    const accessPattern = /^[AB]\d{5}$/;
    if (!accessPattern.test(accessNumber)) {
      toast.error('Access number must be A12345 or B12345 format.');
      return;
    }

    try {
      setIsSubmittingPayment(true);
      const token = localStorage.getItem('token') || '';
      const payload = {
        amount: Number(paymentAmount),
        provider: 'mtn',
        phone: mobileMoneyNumber,
        loanId: activeLoan.id,
      };

      const res = await fetch(`${API_BASE}/payments/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Payment initiation failed.');

      if (res.status === 202) {
        setShowPaymentDialog(false);
        // transaction_id comes from backend (snake_case)
        if (data?.transaction_id) {
          setPendingTransactionId(data.transaction_id);
          setShowPINPrompt(true);
          toast.success('Enter your PIN to complete payment');
        } else {
          toast.error('Failed to get transaction ID');
        }
      } else {
        toast.error('Payment initiation failed');
      }
    } catch (err: any) {
      toast.error(err.message || 'Payment failed');
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const handleDownloadReceipt = (paymentId: number) => {
    const token = localStorage.getItem('token') || '';
    const url = `${API_BASE}/payments/${paymentId}/receipt`;
    const promise = fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (res) => {
        if (!res.ok) {
          const payload = await res.json().catch(() => ({}));
          throw new Error(payload.error || 'Could not download receipt.');
        }
        return res.blob();
      })
      .then((blob) => {
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `Receipt-Payment-${paymentId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(downloadUrl);
        a.remove();
      });

    toast.promise(promise, {
      loading: 'Generating your receipt...',
      success: 'Receipt download started!',
      error: (err) => err.message || 'Failed to download receipt.',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="ml-4">Loading Loan Details...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="p-4">
          <button onClick={onBack} className="flex items-center gap-2 text-gray-600 mb-4">
            <ArrowLeft size={20} /><span className="text-sm">Back</span>
          </button>
          <div className="flex items-center justify-between">
            <h2 className="text-lg">Loan Details</h2>
            {activeLoan && (
              <Badge style={{ backgroundColor: '#c79b2d' }} className="text-white capitalize">
                {activeLoan.status}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {activeLoan ? (
        <div className="p-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Loan Summary</CardTitle>
              <p className="text-xs text-gray-500">ID: LOAN-{activeLoan.id}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Principal Amount</p>
                  <p className="text-base">UGX {Number(activeLoan.amount_requested ?? 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Amount Paid</p>
                  <p className="text-base text-green-600">UGX {Number((activeLoan.amount_requested ?? 0) - (activeLoan.outstanding_balance ?? 0)).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Outstanding Balance</p>
                  <p className="text-base font-bold" style={{ color: '#0b2a4a' }}>
                    UGX {Number(activeLoan.outstanding_balance ?? 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Interest Rate</p>
                  <p className="text-base">0%</p>
                </div>
              </div>
              <div className="pt-2 border-t">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-xs text-gray-500">Repayment Progress</p>
                  <p className="text-xs">
                    {activeLoan.amount_requested ? Math.round(((activeLoan.amount_requested - activeLoan.outstanding_balance) / activeLoan.amount_requested) * 100) : 0}%
                  </p>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="h-2 rounded-full" style={{ backgroundColor: '#c79b2d', width: `${activeLoan.amount_requested ? ((activeLoan.amount_requested - activeLoan.outstanding_balance) / activeLoan.amount_requested) * 100 : 0}%` }}></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Calendar size={20} className="text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm">Next Chop Deduction</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Automatic deductions are scheduled. You will be notified before each payment.
                  </p>
                  <Badge variant="outline" className="mt-2 text-xs">
                    {activeLoan.chopConsented ? 'Consent Given' : 'Pending Consent'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
              <DialogTrigger asChild>
                <Button className="w-full" style={{ backgroundColor: '#0b2a4a' }}>
                  <DollarSign size={16} className="mr-2" /> Make Payment
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Make Loan Payment</DialogTitle></DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount (UGX)</Label>
                    <Input id="amount" type="number" placeholder="Enter amount" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} />
                    <p className="text-xs text-gray-500">Outstanding: UGX {Number(activeLoan.outstanding_balance ?? 0).toLocaleString()}</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mobileNumber">Mobile Money Number</Label>
                    <Input id="mobileNumber" type="tel" placeholder="+256 XXX XXX XXX" value={mobileMoneyNumber} onChange={(e) => setMobileMoneyNumber(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accessNumber">Access Number</Label>
                    <Input id="accessNumber" type="text" placeholder="A12345 or B12345" value={accessNumber} onChange={(e) => setAccessNumber(e.target.value.toUpperCase())} maxLength={6} />
                    <p className="text-xs text-gray-500">Format: A or B followed by 5 digits</p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>Cancel</Button>
                  <Button onClick={handleMakePayment} style={{ backgroundColor: '#c79b2d' }} disabled={isSubmittingPayment}>
                    {isSubmittingPayment ? (
                      <>
                        <Loader2 size={16} className="mr-2 animate-spin" /> Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard size={16} className="mr-2" /> Pay Now
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button variant="outline" onClick={() => toast.info('Downloading receipt...')}>
              <TrendingDown size={16} className="mr-2" /> Download Receipt
            </Button>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">Payment History</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {paymentHistory.length > 0 ? (
                paymentHistory.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle2 size={20} className="text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">UGX {Number(payment.amount).toLocaleString()}</p>
                        <p className="text-xs text-gray-500">
                          Paid on {new Date(payment.created_at).toLocaleDateString('en-GB')}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleDownloadReceipt(payment.id)}>
                      <Download size={14} className="mr-2" /> Receipt
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-500">No successful payments have been made for this loan yet.</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Disbursement History</CardTitle></CardHeader>
            <CardContent>
              <div className="text-sm text-gray-500">No disbursement history available.</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">About Chop Deductions</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm text-gray-600">
              <div>
                <p className="text-gray-900 text-sm mb-1">What is a Chop deduction?</p>
                <p className="text-xs">A "chop" is an automatic deduction from your future university disbursements to repay your loan. This ensures timely repayment without manual intervention.</p>
              </div>
              <div>
                <p className="text-gray-900 text-sm mb-1">When will I be notified?</p>
                <p className="text-xs">You will receive a notification 7 days before each scheduled deduction, showing the exact amount that will be deducted.</p>
              </div>
              <div>
                <p className="text-gray-900 text-sm mb-1">Can I appeal a deduction?</p>
                <p className="text-xs">Yes, you may appeal within 14 days if your financial circumstances change significantly. Contact the Alumni Office for the appeals process.</p>
              </div>
              <div>
                <p className="text-gray-900 text-sm mb-1">Privacy & Data Protection</p>
                <p className="text-xs">All your financial data is encrypted and stored securely. Only authorized Alumni Office staff can access your loan information.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="p-4">
          <Card className="text-center p-8">
            <FileWarning className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No Active Loan Found</h3>
            <p className="mt-1 text-sm text-gray-500">You do not currently have an approved and active loan.</p>
            <Button onClick={onBack} className="mt-6">Back to Dashboard</Button>
          </Card>
        </div>
      )}
      
      {showPINPrompt && pendingTransactionId && (
        <PaymentPINPrompt
          phoneNumber={mobileMoneyNumber}
          amount={Number(paymentAmount)}
          provider="mtn"
          onCancel={() => {
            setShowPINPrompt(false);
            setPendingTransactionId(null);
            setPaymentAmount('');
            setMobileMoneyNumber('');
            setAccessNumber('');
          }}
          onSuccess={async () => {
            if (!pendingTransactionId) {
              toast.error('No transaction ID found');
              return;
            }
            try {
              const token = localStorage.getItem('token') || '';
              const res = await fetch(`${API_BASE}/payments/confirm`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ transactionId: pendingTransactionId }),
              });
              if (!res.ok) throw new Error('Failed to confirm payment');
              setShowPINPrompt(false);
              setPendingTransactionId(null);
              setPaymentAmount('');
              setMobileMoneyNumber('');
              setAccessNumber('');
              toast.success('Payment confirmed successfully!');
              
              // Wait a moment for backend to process
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              // Refresh payment history
              const loanRes = await fetch(`${API_BASE}/loans/mine`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              if (loanRes.ok) {
                const allLoans: Loan[] = await loanRes.json();
                const firstActiveLoan = allLoans.find(l => l.status === 'approved');
                if (firstActiveLoan) {
                  setActiveLoan(firstActiveLoan);
                  const historyRes = await fetch(`${API_BASE}/payments/loan/${firstActiveLoan.id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                  });
                  if (historyRes.ok) {
                    const history: Payment[] = await historyRes.json();
                    setPaymentHistory(history || []);
                  }
                }
              }
            } catch (err: any) {
              toast.error(err.message || 'Failed to confirm payment');
            }
          }}
        />
      )}
    </div>
  );
}