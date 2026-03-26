import { useEffect, useMemo, useState } from 'react';
import { Button } from './ui/button';
import { API_BASE } from '../api';
import { toast } from 'sonner';
import { UcuBadgeLogo } from './UcuBadgeLogo';

type DonationCause = {
  id: string;
  name: string;
};

const DEFAULT_CAUSES: DonationCause[] = [
  { id: 'student-loans', name: 'Student Loan Fund' },
  { id: 'scholarships', name: 'Merit Scholarships' },
  { id: 'emergency', name: 'Emergency Relief' },
];

interface GuestDonateProps {
  initialCause?: string | null;
  onBack: () => void;
}

export default function GuestDonate({ initialCause, onBack }: GuestDonateProps) {
  const [causes, setCauses] = useState<DonationCause[]>(DEFAULT_CAUSES);
  const [loadingCauses, setLoadingCauses] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [cause, setCause] = useState(initialCause?.trim() ? String(initialCause) : 'Student Loan Fund');

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        setLoadingCauses(true);
        const res = await fetch(`${API_BASE}/donations/causes`);
        const json = res.ok ? await res.json().catch(() => null) : null;
        if (cancelled) return;
        const next = Array.isArray(json)
          ? json
              .map((c: any) => ({ id: String(c.id || c.name || Math.random()), name: String(c.name || 'Campaign') }))
              .filter((c: DonationCause) => !!c.name)
          : DEFAULT_CAUSES;
        setCauses(next.length ? next : DEFAULT_CAUSES);
      } catch {
        // keep defaults
      } finally {
        if (!cancelled) setLoadingCauses(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const normalizedAmount = useMemo(() => Number(amount || 0), [amount]);

  const submit = async () => {
    if (!fullName.trim() || !email.trim() || !phone.trim() || !Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
      toast.error('Please fill your name, email, phone and a valid amount.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(`${API_BASE}/donations/public`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          email,
          phone,
          amount: normalizedAmount,
          cause,
          payment_method: 'guest',
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Failed to submit donation');

      toast.success('Thank you! Your donation was received successfully.');
      onBack();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to submit donation');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--brand-blue-soft-10)] text-foreground">
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UcuBadgeLogo className="h-9 w-9" imageClassName="object-contain" />
            <div>
              <p className="text-sm font-bold" style={{ color: '#1f2d4f' }}>Alumni Circle</p>
              <p className="text-xs" style={{ color: '#445072' }}>Donation</p>
            </div>
          </div>
          <Button onClick={onBack} variant="outline" className="border-[#d9dff0] text-[#2f3e67] hover:bg-[#f1f5ff]">
            Back
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="rounded-2xl border border-[#d9dff0] bg-white shadow-sm p-6 md:p-8">
          <h1 className="text-2xl font-semibold" style={{ color: '#25345c' }}>Donate</h1>
          <p className="mt-1 text-sm" style={{ color: '#657393' }}>Donate without creating an account.</p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-[#25345c]">Cause</label>
              <select
                aria-label="Donation cause"
                value={cause}
                disabled={loadingCauses}
                onChange={(e) => setCause(e.target.value)}
                className="mt-2 w-full rounded-xl border border-[#d9dff0] px-3 py-2 text-sm text-[#25345c] outline-none focus:ring-2 focus:ring-[#bc8b37]"
              >
                {causes.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-[#25345c]">Full name</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-2 w-full rounded-xl border border-[#d9dff0] px-3 py-2 text-sm text-[#25345c] outline-none focus:ring-2 focus:ring-[#bc8b37]"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-[#25345c]">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full rounded-xl border border-[#d9dff0] px-3 py-2 text-sm text-[#25345c] outline-none focus:ring-2 focus:ring-[#bc8b37]"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-[#25345c]">Phone</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-2 w-full rounded-xl border border-[#d9dff0] px-3 py-2 text-sm text-[#25345c] outline-none focus:ring-2 focus:ring-[#bc8b37]"
                placeholder="07xx..."
              />
            </div>
            <div>
              <label className="text-sm font-medium text-[#25345c]">Amount (UGX)</label>
              <input
                type="number"
                min="0"
                step="1000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-2 w-full rounded-xl border border-[#d9dff0] px-3 py-2 text-sm text-[#25345c] outline-none focus:ring-2 focus:ring-[#bc8b37]"
                placeholder="e.g. 50,000"
              />
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              className="border-[#d9dff0] text-[#2f3e67] hover:bg-[#f1f5ff]"
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={submit}
              disabled={submitting}
              className="bg-[#0b2a4a] hover:bg-[#123a66] text-white font-semibold"
            >
              {submitting ? 'Submitting…' : 'Donate'}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

