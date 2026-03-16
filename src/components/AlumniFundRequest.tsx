import { useState } from 'react';
import type { User } from '../App';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { apiCall } from '../api';
import { toast } from 'sonner';
import { Send } from 'lucide-react';

interface AlumniFundRequestProps {
  user: User;
}

export function AlumniFundRequest({ user }: AlumniFundRequestProps) {
  const [amount, setAmount] = useState('');
  const [purpose, setPurpose] = useState('');
  const [neededBy, setNeededBy] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !purpose) {
      toast.error('Please provide at least an amount and purpose for the request.');
      return;
    }
    setSubmitting(true);
    try {
      await apiCall('/admin/fund-requests', 'POST', {
        amount: Number(amount),
        purpose,
        neededBy: neededBy || null,
        notes: notes || null,
      });
      toast.success('Fund request sent to admin for review.');
      setAmount('');
      setPurpose('');
      setNeededBy('');
      setNotes('');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to submit fund request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 lg:py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Request Funds</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Submit a funding request to the admin on behalf of the alumni office. Provide clear details so it can be
          reviewed and approved quickly.
        </p>
      </div>

      <Card className="border border-border bg-card shadow-sm">
        <CardHeader>
          <CardTitle>New fund request</CardTitle>
          <CardDescription>
            These requests are routed to the administrator. You&apos;ll be notified once a decision is made.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label className="mb-1.5 block">Requested amount (UGX)</Label>
                <Input
                  type="number"
                  min="0"
                  step="1000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 5,000,000"
                  className="h-10"
                />
              </div>
              <div>
                <Label className="mb-1.5 block">Needed by (optional)</Label>
                <Input
                  type="date"
                  value={neededBy}
                  onChange={(e) => setNeededBy(e.target.value)}
                  className="h-10"
                />
              </div>
            </div>

            <div>
              <Label className="mb-1.5 block">Purpose</Label>
              <Input
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="Brief title for this request (e.g. Alumni mentorship retreat, seed fund for innovation challenge)"
                className="h-10"
              />
            </div>

            <div>
              <Label className="mb-1.5 block">Details for the admin (optional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Add context such as objectives, beneficiaries, timelines, and how the funds will be used."
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-muted-foreground">
                Request will be submitted as <span className="font-medium">{user.name}</span>.
              </p>
              <Button type="submit" disabled={submitting} className="gap-2">
                <Send className="w-4 h-4" />
                {submitting ? 'Sending request...' : 'Send request to admin'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

