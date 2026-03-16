// Alumni SACCO - optional savings scheme: mobile (chop from phone) or bank
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { ArrowLeft, Wallet, Smartphone, Building2, Loader2, Plus, History, CheckCircle2 } from 'lucide-react';
import type { User } from '../../App';
import { API_BASE } from '../../api';
import { toast } from 'sonner';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';

interface SaccoEnrollment {
  _id: string;
  user_uid: string;
  status: string;
  contribution_method: 'mobile' | 'bank';
  mobile_phone?: string;
  bank_name?: string;
  bank_account?: string;
  amount_per_cycle: number;
  frequency: string;
  next_deduction_at?: string;
}

interface SaccoContribution {
  _id: string;
  amount: number;
  method: string;
  transaction_ref?: string;
  status: string;
  created_at: string;
}

interface SaccoMe {
  enrollment: SaccoEnrollment | null;
  totalSaved: number;
  contributions: SaccoContribution[];
}

const BANK_DETAILS = {
  account_name: 'UCU Alumni SACCO',
  account_number: '1234567890',
  bank_name: 'Stanbic Bank Uganda',
  branch: 'Kampala Main',
};

export function AlumniSacco({ user, onBack }: { user: User; onBack: () => void }) {
  const [data, setData] = useState<SaccoMe | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [contributing, setContributing] = useState(false);
  const [showEnrollForm, setShowEnrollForm] = useState(false);
  const [showContributeForm, setShowContributeForm] = useState(false);
  const [pendingTxId, setPendingTxId] = useState<string | null>(null);

  // Enroll form
  const [enrollMethod, setEnrollMethod] = useState<'mobile' | 'bank'>('mobile');
  const [enrollPhone, setEnrollPhone] = useState('');
  const [enrollBankName, setEnrollBankName] = useState('');
  const [enrollBankAccount, setEnrollBankAccount] = useState('');
  const [enrollAmount, setEnrollAmount] = useState('');
  const [enrollFreq, setEnrollFreq] = useState<'weekly' | 'monthly'>('monthly');

  // Contribute form
  const [contributeMethod, setContributeMethod] = useState<'mobile' | 'bank'>('mobile');
  const [contributePhone, setContributePhone] = useState('');
  const [contributeAmount, setContributeAmount] = useState('');

  const fetchSacco = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/sacco/me`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else setData({ enrollment: null, totalSaved: 0, contributions: [] });
    } catch {
      setData({ enrollment: null, totalSaved: 0, contributions: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSacco();
  }, []);

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(enrollAmount);
    if (!amount || amount <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    if (enrollMethod === 'mobile' && (!enrollPhone || enrollPhone.replace(/\D/g, '').length < 9)) {
      toast.error('Enter a valid mobile number');
      return;
    }
    if (enrollMethod === 'bank' && (!enrollBankName || !enrollBankAccount)) {
      toast.error('Enter bank name and account number');
      return;
    }
    setEnrolling(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/sacco/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          contribution_method: enrollMethod,
          mobile_phone: enrollMethod === 'mobile' ? enrollPhone : undefined,
          bank_name: enrollMethod === 'bank' ? enrollBankName : undefined,
          bank_account: enrollMethod === 'bank' ? enrollBankAccount : undefined,
          amount_per_cycle: amount,
          frequency: enrollFreq,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Enrollment failed');
      }
      toast.success('You are now enrolled in SACCO');
      setShowEnrollForm(false);
      fetchSacco();
    } catch (err: any) {
      toast.error(err.message || 'Enrollment failed');
    } finally {
      setEnrolling(false);
    }
  };

  const handleContribute = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(contributeAmount);
    if (!amount || amount <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    if (contributeMethod === 'mobile' && (!contributePhone || contributePhone.replace(/\D/g, '').length < 9)) {
      toast.error('Enter a valid mobile number');
      return;
    }
    setContributing(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/sacco/contribute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          amount,
          method: contributeMethod,
          phone: contributeMethod === 'mobile' ? contributePhone : undefined,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Contribution failed');

      if (contributeMethod === 'mobile' && json.need_pin && json.transaction_id) {
        setPendingTxId(json.transaction_id);
        toast.info('Enter your PIN on your phone to complete the payment');
        setShowContributeForm(false);
      } else if (contributeMethod === 'bank') {
        toast.success('Use the bank details below to complete your payment. Quote reference: ' + (json.transaction_ref || ''));
        setShowContributeForm(false);
        fetchSacco();
      } else {
        toast.success('Contribution initiated');
        fetchSacco();
      }
    } catch (err: any) {
      toast.error(err.message || 'Contribution failed');
    } finally {
      setContributing(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!pendingTxId) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/payments/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ transactionId: pendingTxId }),
      });
      if (res.ok) {
        toast.success('Payment confirmed');
        setPendingTxId(null);
        fetchSacco();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Confirmation failed');
      }
    } catch {
      toast.error('Confirmation failed');
    }
  };

  const handleOptOut = async () => {
    if (!confirm('Opt out of SACCO? You can re-enroll anytime.')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/sacco/me`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: 'opted_out' }),
      });
      if (!res.ok) throw new Error('Failed to opt out');
      toast.success('You have opted out of SACCO');
      fetchSacco();
    } catch {
      toast.error('Failed to opt out');
    }
  };

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const enrolled = data?.enrollment && data.enrollment.status === 'active';

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="w-5 h-5" /></Button>
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Wallet className="w-6 h-6" style={{ color: 'var(--chat-header-blue)' }} />
            Alumni SACCO
          </h1>
          <p className="text-sm text-muted-foreground">Optional savings scheme — save via mobile money or bank</p>
        </div>
      </div>

      {pendingTxId && (
        <Card className="border-2 border-primary/30">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-2">Complete the payment on your phone with your PIN, then click below.</p>
            <div className="flex gap-2">
              <Button onClick={handleConfirmPayment}>I&apos;ve completed the payment</Button>
              <Button variant="outline" onClick={() => setPendingTxId(null)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!enrolled && !showEnrollForm && (
        <Card>
          <CardHeader>
            <CardTitle>Join SACCO</CardTitle>
            <CardDescription>
              Save regularly with money chopped from your phone or via bank. Optional — you choose the amount and frequency.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
              <li>Set your own amount and frequency (weekly or monthly)</li>
              <li>Pay via MTN Mobile Money (deducted from your phone) or bank transfer</li>
              <li>Track your savings and contribution history</li>
              <li>Opt out anytime</li>
            </ul>
            <Button onClick={() => setShowEnrollForm(true)} className="gap-2">
              <Plus className="w-4 h-4" /> Join SACCO
            </Button>
          </CardContent>
        </Card>
      )}

      {!enrolled && showEnrollForm && (
        <Card>
          <CardHeader>
            <CardTitle>Enroll in SACCO</CardTitle>
            <CardDescription>Choose how you want to save: mobile money (chopped from your number) or bank.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleEnroll} className="space-y-4">
              <div>
                <Label>Contribution method</Label>
                <RadioGroup value={enrollMethod} onValueChange={(v) => setEnrollMethod(v as 'mobile' | 'bank')} className="flex gap-4 mt-2">
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="mobile" id="em-mobile" />
                    <Label htmlFor="em-mobile" className="flex items-center gap-1 font-normal"><Smartphone className="w-4 h-4" /> Mobile Money</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="bank" id="em-bank" />
                    <Label htmlFor="em-bank" className="flex items-center gap-1 font-normal"><Building2 className="w-4 h-4" /> Bank</Label>
                  </div>
                </RadioGroup>
              </div>
              {enrollMethod === 'mobile' && (
                <div>
                  <Label>Mobile number (MTN)</Label>
                  <Input placeholder="07XXXXXXXX" value={enrollPhone} onChange={(e) => setEnrollPhone(e.target.value)} className="mt-1" />
                </div>
              )}
              {enrollMethod === 'bank' && (
                <>
                  <div>
                    <Label>Bank name</Label>
                    <Input placeholder="e.g. Stanbic Bank" value={enrollBankName} onChange={(e) => setEnrollBankName(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label>Account number</Label>
                    <Input placeholder="Account number" value={enrollBankAccount} onChange={(e) => setEnrollBankAccount(e.target.value)} className="mt-1" />
                  </div>
                </>
              )}
              <div>
                <Label>Amount per cycle (UGX)</Label>
                <Input type="number" min="1000" placeholder="e.g. 50000" value={enrollAmount} onChange={(e) => setEnrollAmount(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>Frequency</Label>
                <RadioGroup value={enrollFreq} onValueChange={(v) => setEnrollFreq(v as 'weekly' | 'monthly')} className="flex gap-4 mt-2">
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="weekly" id="ef-weekly" />
                    <Label htmlFor="ef-weekly" className="font-normal">Weekly</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="monthly" id="ef-monthly" />
                    <Label htmlFor="ef-monthly" className="font-normal">Monthly</Label>
                  </div>
                </RadioGroup>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={enrolling}>{enrolling ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enroll'}</Button>
                <Button type="button" variant="outline" onClick={() => setShowEnrollForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {enrolled && data?.enrollment && (
        <>
          <Card className="border-2" style={{ borderColor: 'var(--chat-header-blue)', background: 'linear-gradient(135deg, rgba(11,42,74,0.06) 0%, rgba(26,77,122,0.06) 100%)' }}>
            <CardContent className="pt-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total saved</p>
                  <p className="text-2xl font-bold" style={{ color: 'var(--chat-header-blue)' }}>
                    UGX {data.totalSaved.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {data.enrollment.contribution_method === 'mobile' ? 'Mobile' : 'Bank'} · UGX {data.enrollment.amount_per_cycle.toLocaleString()} {data.enrollment.frequency}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => { setShowContributeForm(true); setContributeAmount(''); setContributePhone(''); }} className="gap-2">
                    <Plus className="w-4 h-4" /> Contribute now
                  </Button>
                  <Button variant="outline" onClick={handleOptOut}>Opt out</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {showContributeForm && (
            <Card>
              <CardHeader>
                <CardTitle>One-time contribution</CardTitle>
                <CardDescription>Add to your SACCO savings via mobile money (chopped from your phone) or bank.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleContribute} className="space-y-4">
                  <div>
                    <Label>Method</Label>
                    <RadioGroup value={contributeMethod} onValueChange={(v) => setContributeMethod(v as 'mobile' | 'bank')} className="flex gap-4 mt-2">
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="mobile" id="cm-mobile" />
                        <Label htmlFor="cm-mobile" className="font-normal flex items-center gap-1"><Smartphone className="w-4 h-4" /> Mobile (chop from phone)</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="bank" id="cm-bank" />
                        <Label htmlFor="cm-bank" className="font-normal flex items-center gap-1"><Building2 className="w-4 h-4" /> Bank</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  {contributeMethod === 'mobile' && (
                    <div>
                      <Label>MTN Mobile Money number</Label>
                      <Input placeholder="07XXXXXXXX" value={contributePhone} onChange={(e) => setContributePhone(e.target.value)} className="mt-1" />
                    </div>
                  )}
                  <div>
                    <Label>Amount (UGX)</Label>
                    <Input type="number" min="1000" placeholder="e.g. 50000" value={contributeAmount} onChange={(e) => setContributeAmount(e.target.value)} className="mt-1" />
                  </div>
                  {contributeMethod === 'bank' && (
                    <div className="rounded-lg bg-muted/50 p-3 text-sm">
                      <p className="font-medium mb-1">Bank details</p>
                      <p>{BANK_DETAILS.bank_name} · {BANK_DETAILS.branch}</p>
                      <p>Account: {BANK_DETAILS.account_name} — {BANK_DETAILS.account_number}</p>
                      <p className="text-muted-foreground mt-1">Use your transaction reference when transferring.</p>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button type="submit" disabled={contributing}>{contributing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit'}</Button>
                    <Button type="button" variant="outline" onClick={() => setShowContributeForm(false)}>Cancel</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><History className="w-5 h-5" /> Contribution history</CardTitle>
              <CardDescription>Recent SACCO contributions</CardDescription>
            </CardHeader>
            <CardContent>
              {data.contributions.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No contributions yet.</p>
              ) : (
                <ul className="space-y-2">
                  {data.contributions.map((c) => (
                    <li key={c._id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div className="flex items-center gap-2">
                        {c.status === 'completed' ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <span className="w-4 h-4 rounded-full bg-muted" />}
                        <span className="text-sm">UGX {c.amount.toLocaleString()} · {c.method}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(c.created_at).toLocaleDateString()} {c.status}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {enrolled && data?.contributions.length === 0 && !showContributeForm && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-4">Make your first contribution to start building your savings.</p>
            <Button onClick={() => setShowContributeForm(true)} className="gap-2"><Plus className="w-4 h-4" /> Contribute now</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
