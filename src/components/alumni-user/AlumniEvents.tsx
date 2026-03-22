import { useEffect, useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ArrowLeft, Calendar, MapPin, Users, Clock, Loader2 } from 'lucide-react';
import { ImageWithFallback } from '../figma_image/ImageWithFallback';
import { API_BASE, api } from '../../api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { PaymentPINPrompt } from '../student/PaymentPINPrompt';
import { toast } from 'sonner';

interface AlumniEventsProps {
  onBack: () => void;
}

export function AlumniEvents({ onBack }: AlumniEventsProps) {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState<number | null>(null);
  const [registered, setRegistered] = useState<Set<number>>(new Set());
  const [showPayment, setShowPayment] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<'mtn'>('mtn');
  const [phoneNumber, setPhoneNumber] = useState('');

  // PIN prompt state — same pattern as LoanDetails / PaymentHistory
  const [showPINPrompt, setShowPINPrompt] = useState(false);
  const [pendingTransactionId, setPendingTransactionId] = useState<string | null>(null);
  const [pendingEventId, setPendingEventId] = useState<number | null>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';

  const sanitizePhone = (value: string) => value.replace(/\D/g, '').slice(0, 12);
  const normalizeUgMsisdn = (value: string) => {
    const digits = String(value || '').replace(/\D/g, '');
    if (digits.startsWith('256') && digits.length >= 12) return digits.slice(0, 12);
    if (digits.startsWith('0') && digits.length >= 10) return `256${digits.slice(-9)}`;
    if (digits.length === 9) return `256${digits}`;
    return digits;
  };

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch(`${API_BASE}/content/events?audience=alumni`);
        if (!res.ok) throw new Error('Failed to fetch events');
        const raw = await res.json();
        const items = Array.isArray(raw) ? raw : raw?.content || [];
        const mapped = items.map((it: any) => ({
          id: it.id,
          title: it.title,
          date: it.date ? new Date(it.date).toLocaleDateString() : '',
          dateRaw: it.date || it.event_date || null,
          time: it.time || '',
          location: it.location || '',
          description: it.description || it.content || '',
          hasImage: !!it.hasImage,
          attendees: it.attendees || 0,
          registrationFee: it.registrationFee || 0,
          category: it.category || 'Event',
          status: 'upcoming',
        }));

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const expired = mapped.filter((event: any) => {
          if (!event.dateRaw) return false;
          const when = new Date(event.dateRaw);
          return Number.isFinite(when.getTime()) && when < todayStart;
        });

        if (expired.length > 0 && token) {
          await Promise.allSettled(
            expired.map((event: any) => api.deleteContent('events', String(event.id), token))
          );
        }

        const upcoming = mapped
          .filter((event: any) => {
            if (!event.dateRaw) return true;
            const when = new Date(event.dateRaw);
            return Number.isFinite(when.getTime()) ? when >= todayStart : true;
          })
          .sort((a: any, b: any) => {
            const ta = a.dateRaw ? new Date(a.dateRaw).getTime() : Number.MAX_SAFE_INTEGER;
            const tb = b.dateRaw ? new Date(b.dateRaw).getTime() : Number.MAX_SAFE_INTEGER;
            return ta - tb;
          });

        setEvents(upcoming);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
    const interval = setInterval(fetchEvents, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleRegister = async (eventId: number, fee: number) => {
    if (fee > 0) {
      const event = events.find(e => e.id === eventId);
      setSelectedEvent(event);
      setShowPayment(true);
      return;
    }

    // Free event — register directly
    setRegistering(eventId);
    try {
      const res = await fetch(`${API_BASE}/content/events/${eventId}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.message || 'Failed to register');
        return;
      }
      setRegistered(prev => new Set(prev).add(eventId));
      setEvents(prev =>
        prev.map(ev => ev.id === eventId ? { ...ev, attendees: (ev.attendees || 0) + 1 } : ev)
      );
      toast.success('✅ Successfully registered for the event!');
    } catch (err) {
      console.error('Registration error:', err);
      toast.error('Error registering for event');
    } finally {
      setRegistering(null);
    }
  };

  // Step 1 — initiate payment via the same endpoint used by loan payments
  const handlePaymentSubmit = async () => {
    if (!selectedEvent) { toast.error('No event selected. Please try again.'); return; }
    if (!token) { toast.error('Please log in to continue.'); return; }

    if (phoneNumber.length < 10) {
      toast.error('Please enter a valid phone number.');
      return;
    }

    setRegistering(selectedEvent.id);
    try {
      const msisdn = normalizeUgMsisdn(phoneNumber);
      const res = await fetch(`${API_BASE}/payments/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: selectedEvent.registrationFee,
          provider: paymentMethod,
          phone: msisdn,
          eventId: selectedEvent.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Payment initiation failed.');

      if (res.status === 202 && data?.transaction_id) {
        setPendingTransactionId(data.transaction_id);
        setPendingEventId(selectedEvent.id);
        setShowPayment(false);
        setShowPINPrompt(true);
      } else {
        toast.error('Payment initiation failed. Please try again.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error processing payment');
    } finally {
      setRegistering(null);
    }
  };

  // Step 2 — called after PIN is verified successfully
  const handlePINSuccess = async () => {
    if (!pendingTransactionId || !pendingEventId) {
      toast.error('Missing transaction details. Please try again.');
      setShowPINPrompt(false);
      return;
    }
    try {
      // Confirm the payment with the backend
      const confirmRes = await fetch(`${API_BASE}/payments/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ transactionId: pendingTransactionId }),
      });
      if (!confirmRes.ok) {
        const err = await confirmRes.json().catch(() => ({}));
        throw new Error(err.error || 'Payment confirmation failed.');
      }

      // Complete the event registration
      const regRes = await fetch(`${API_BASE}/content/events/${pendingEventId}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (!regRes.ok) {
        const err = await regRes.json().catch(() => ({}));
        throw new Error(err.message || 'Registration after payment failed.');
      }

      setRegistered(prev => new Set(prev).add(pendingEventId!));
      setEvents(prev =>
        prev.map(ev =>
          ev.id === pendingEventId ? { ...ev, attendees: (ev.attendees || 0) + 1 } : ev
        )
      );
      toast.success('✅ Payment confirmed! You are registered for the event!');
    } catch (err: any) {
      toast.error(err.message || 'Error completing registration');
    } finally {
      setShowPINPrompt(false);
      setPendingTransactionId(null);
      setPendingEventId(null);
      setSelectedEvent(null);
      setPhoneNumber('');
    }
  };

  return (

    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="p-4">
          <button onClick={onBack} className="flex items-center gap-2 text-gray-600 mb-4">
            <ArrowLeft size={20} />
            <span className="text-sm">Back</span>
          </button>
          <div>
            <h2 className="text-lg">Upcoming Events</h2>
            <p className="text-sm text-gray-600 mt-1">{events.length} events available</p>
          </div>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-6 pb-20">
        {loading ? (
          <div className="text-center py-10">
            <Loader2 className="mx-auto h-8 w-8 animate-spin" />
          </div>
        ) : events.length === 0 ? (
          <Card className="p-6 text-center text-gray-600">No upcoming events</Card>
        ) : (
          events.map((event, idx) => {
            // Color palette for cards
            const colors = [
              'bg-gradient-to-r from-blue-100 to-blue-200',
              'bg-gradient-to-r from-pink-100 to-pink-200',
              'bg-gradient-to-r from-green-100 to-green-200',
              'bg-gradient-to-r from-yellow-100 to-yellow-200',
              'bg-gradient-to-r from-purple-100 to-purple-200',
              'bg-gradient-to-r from-orange-100 to-orange-200',
            ];
            const cardColor = colors[idx % colors.length];
            return (
              <div
                key={event.id}
                className={`rounded-2xl shadow-md flex flex-row overflow-hidden ${cardColor}`}
                style={{ minHeight: 180 }}
              >
                {/* Image section */}
                <div className="w-48 min-w-[8rem] h-full flex items-center justify-center bg-gray-200">
                  {event.hasImage ? (
                    <ImageWithFallback
                      src={`${API_BASE}/content/events/${event.id}/image`}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl">
                      <Calendar className="w-12 h-12" />
                    </div>
                  )}
                </div>
                {/* Details section */}
                <div className="flex-1 p-6 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl font-bold mb-2 text-gray-800">{event.title}</h3>
                    <div className="flex flex-wrap gap-4 mb-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" /><span>{event.date}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4" /><span>{event.time}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" /><span>{event.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users className="w-4 h-4" /><span>{event.attendees} registered</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 mb-2 line-clamp-3">{event.description}</p>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <p className="text-xs text-gray-500">Registration Fee</p>
                      <p className="text-base font-semibold" style={{ color: 'var(--primary)' }}>
                        {event.registrationFee === 0
                          ? 'Free'
                          : `UGX ${event.registrationFee.toLocaleString()}`}
                      </p>
                    </div>
                    <Button
                      style={{ backgroundColor: 'var(--accent)' }}
                      onClick={() => handleRegister(event.id, event.registrationFee)}
                      disabled={registering === event.id || registered.has(event.id)}
                      className="flex gap-2"
                    >
                      {registering === event.id ? (
                        <><Loader2 className="w-4 h-4 animate-spin" />Registering...</>
                      ) : registered.has(event.id) ? (
                        '✓ Registered'
                      ) : (
                        'Register Now'
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Payment Modal */}
      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent className="sm:max-w-md h-[90svh] max-h-[90svh] sm:h-auto sm:max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle>Event Registration Payment</DialogTitle>
            <DialogDescription>
              Complete your registration for {selectedEvent?.title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 flex-1 min-h-0 overflow-y-auto pr-1 pb-4 overscroll-contain touch-pan-y">
            {selectedEvent && (
              <>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Event:</span>
                    <span className="font-semibold">{selectedEvent.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Date:</span>
                    <span>{selectedEvent.date}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Amount to Pay:</span>
                    <span style={{ color: 'var(--accent)' }}>
                      UGX {selectedEvent.registrationFee.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Payment Method</Label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio" name="payment" value="mtn"
                        checked={paymentMethod === 'mtn'}
                        onChange={() => setPaymentMethod('mtn')}
                        className="w-4 h-4"
                      />
                      <span className="font-medium">MTN Mobile Money</span>
                    </label>
                    <p className="text-xs text-gray-500">Airtel payments are not supported yet.</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone number</Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    placeholder="07XXXXXXXX or 2567XXXXXXXX"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(sanitizePhone(e.target.value))}
                  />
                  <p className="text-xs text-gray-500">We’ll send an MTN Mobile Money prompt to this number.</p>
                </div>

                <div className="flex gap-2 sticky bottom-0 bg-background pt-2">
                  <Button variant="outline" className="flex-1" onClick={() => setShowPayment(false)}>
                    Cancel
                  </Button>
                  <Button
                    style={{ backgroundColor: 'var(--accent)' }}
                    className="flex-1"
                    onClick={handlePaymentSubmit}
                    disabled={registering === selectedEvent.id || !phoneNumber}
                  >
                    {registering === selectedEvent.id ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</>
                    ) : (
                      `Pay UGX ${selectedEvent.registrationFee.toLocaleString()}`
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* PIN Prompt — same component used by loan payments */}
      {showPINPrompt && pendingTransactionId && (
        <PaymentPINPrompt
          phoneNumber={phoneNumber}
          amount={selectedEvent?.registrationFee ?? 0}
          provider={'mtn'}
          onSuccess={handlePINSuccess}
          onCancel={() => {
            setShowPINPrompt(false);
            setPendingTransactionId(null);
            setPendingEventId(null);
            setPhoneNumber('');
            toast.info('Payment cancelled.');
          }}
        />
      )}
    </div>
  );
}
