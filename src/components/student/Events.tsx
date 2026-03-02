import { useEffect, useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ArrowLeft, Calendar, MapPin, Users, Clock, Loader2 } from 'lucide-react';
import { ImageWithFallback } from '../figma_image/ImageWithFallback';
import { API_BASE } from '../../api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { PaymentPINPrompt } from './PaymentPINPrompt';
import { toast } from 'sonner';

interface EventsProps {
  onBack: () => void;
}

export function Events({ onBack }: EventsProps) {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState<number | null>(null);
  const [registered, setRegistered] = useState<Set<number>>(new Set());
  const [showPayment, setShowPayment] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState('mtn');
  const [accessNumber, setAccessNumber] = useState('');

  // PIN prompt state — same pattern as LoanDetails / PaymentHistory
  const [showPINPrompt, setShowPINPrompt] = useState(false);
  const [pendingTransactionId, setPendingTransactionId] = useState<string | null>(null);
  const [pendingEventId, setPendingEventId] = useState<number | null>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';

  const sanitizeAccessNumber = (value: string) => {
    const upper = value.toUpperCase();
    const letter = upper[0];
    if (letter !== 'A' && letter !== 'B') return '';
    const digits = upper.slice(1).replace(/\D/g, '').slice(0, 5);
    return `${letter}${digits}`;
  };

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch(`${API_BASE}/content/events?audience=students`);
        if (!res.ok) throw new Error('Failed to fetch events');
        const raw = await res.json();
        const items = Array.isArray(raw) ? raw : raw?.content || [];
        const mapped = items.map((it: any) => ({
          id: it.id,
          title: it.title,
          date: it.date ? new Date(it.date).toLocaleDateString() : '',
          time: it.time || '',
          location: it.location || '',
          description: it.description || it.content || '',
          hasImage: !!it.hasImage,
          attendees: it.attendees || 0,
          registrationFee: it.registrationFee || 0,
          category: it.category || 'Event',
          status: 'upcoming',
        }));
        setEvents(mapped);
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

    const accessPattern = /^[AB]\d{5}$/;
    if (!accessPattern.test(accessNumber)) {
      toast.error('Access number must be in format A12345 or B12345.');
      return;
    }

    setRegistering(selectedEvent.id);
    try {
      const res = await fetch(`${API_BASE}/payments/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: selectedEvent.registrationFee,
          provider: paymentMethod,
          phone: accessNumber,
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
      setAccessNumber('');
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

      <div className="p-4 space-y-4 pb-20">
        {loading ? (
          <div className="text-center py-10">
            <Loader2 className="mx-auto h-8 w-8 animate-spin" />
          </div>
        ) : events.length === 0 ? (
          <Card className="p-6 text-center text-gray-600">No upcoming events</Card>
        ) : (
          events.map((event) => (
            <Card key={event.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative h-48 bg-gray-200">
                {event.hasImage ? (
                  <ImageWithFallback
                    src={`${API_BASE}/content/events/${event.id}/image`}
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                ) : null}
                <div className="absolute top-3 right-3">
                  <Badge className="bg-accent text-accent-foreground">{event.category}</Badge>
                </div>
              </div>

              <div className="p-4">
                <h3 className="text-lg mb-2">{event.title}</h3>

                <div className="space-y-2 mb-4">
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

                <p className="text-sm text-gray-700 mb-4">{event.description}</p>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div>
                    <p className="text-xs text-gray-500">Registration Fee</p>
                    <p className="text-base" style={{ color: '#0b2a4a' }}>
                      {event.registrationFee === 0
                        ? 'Free'
                        : `UGX ${event.registrationFee.toLocaleString()}`}
                    </p>
                  </div>
                  <Button
                    style={{ backgroundColor: '#c79b2d' }}
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
            </Card>
          ))
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
                    <span style={{ color: '#c79b2d' }}>
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
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-4 h-4"
                      />
                      <span className="font-medium">MTN Mobile Money</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio" name="payment" value="airtel"
                        checked={paymentMethod === 'airtel'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-4 h-4"
                      />
                      <span className="font-medium">Airtel Money</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accessNumber">Access Number</Label>
                  <Input
                    id="accessNumber"
                    type="text"
                    placeholder="A12345 or B12345"
                    value={accessNumber}
                    onChange={(e) => setAccessNumber(sanitizeAccessNumber(e.target.value))}
                    maxLength={6}
                  />
                  <p className="text-xs text-gray-500">Format: A or B followed by 5 digits</p>
                </div>

                <div className="flex gap-2 sticky bottom-0 bg-background pt-2">
                  <Button variant="outline" className="flex-1" onClick={() => setShowPayment(false)}>
                    Cancel
                  </Button>
                  <Button
                    style={{ backgroundColor: '#c79b2d' }}
                    className="flex-1"
                    onClick={handlePaymentSubmit}
                    disabled={registering === selectedEvent.id || !accessNumber}
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
          phoneNumber={accessNumber}
          amount={selectedEvent?.registrationFee ?? 0}
          provider={paymentMethod as 'mtn' | 'airtel'}
          onSuccess={handlePINSuccess}
          onCancel={() => {
            setShowPINPrompt(false);
            setPendingTransactionId(null);
            setPendingEventId(null);
            setAccessNumber('');
            toast.info('Payment cancelled.');
          }}
        />
      )}
    </div>
  );
}
