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
  const [paymentMethod, setPaymentMethod] = useState('mtn');
  const token = (typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '');

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

    setRegistering(eventId);
    try {
      const res = await fetch(`${API_BASE}/content/events/${eventId}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.message || 'Failed to register');
        return;
      }

      setRegistered(prev => new Set(prev).add(eventId));
      setEvents(prev => prev.map(ev => ev.id === eventId ? { ...ev, attendees: (ev.attendees || 0) + 1 } : ev));
      alert('✅ Successfully registered for the event!');
    } catch (err) {
      console.error('Registration error:', err);
      alert('Error registering for event');
    } finally {
      setRegistering(null);
    }
  };

  const handlePaymentSubmit = async () => {
    if (!selectedEvent) {
      alert('No event selected. Please close the modal and try again.');
      return;
    }
    if (!token) {
      alert('Please log in to continue with payment.');
      return;
    }

    setRegistering(selectedEvent.id);
    try {
      const payRes = await fetch(`${API_BASE}/content/events/${selectedEvent.id}/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          method: paymentMethod
        })
      });

      if (!payRes.ok) {
        let errText = 'Payment initialization failed';
        try {
          const err = await payRes.json();
          errText = err.message || err.error || errText;
        } catch {
          // ignore
        }
        alert(errText);
        return;
      }

      const confirmRes = await fetch(`${API_BASE}/content/events/${selectedEvent.id}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
      });

      if (confirmRes.ok) {
        setRegistered(prev => new Set(prev).add(selectedEvent.id));
        setEvents(prev => prev.map(ev => ev.id === selectedEvent.id ? { ...ev, attendees: (ev.attendees || 0) + 1 } : ev));
        setShowPayment(false);
        setSelectedEvent(null);
        alert('✅ Payment successful! You are registered for the event!');
      } else {
        let errText = 'Payment confirmation failed';
        try {
          const err = await confirmRes.json();
          errText = err.message || err.error || errText;
        } catch {
          // ignore
        }
        alert(errText);
      }
    } catch (err) {
      console.error('Payment error:', err);
      alert('Error processing payment');
    } finally {
      setRegistering(null);
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
          <div className="text-center py-10"><Loader2 className="mx-auto h-8 w-8 animate-spin" /></div>
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
                  <Badge className="bg-accent text-accent-foreground">
                    {event.category}
                  </Badge>
                </div>
              </div>

              <div className="p-4">
                <h3 className="text-lg mb-2">{event.title}</h3>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>{event.date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>{event.time}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>{event.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="w-4 h-4" />
                    <span>{event.attendees} registered</span>
                  </div>
                </div>

                <p className="text-sm text-gray-700 mb-4">{event.description}</p>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div>
                    <p className="text-xs text-gray-500">Registration Fee</p>
                    <p className="text-base" style={{ color: '#0b2a4a' }}>
                      {event.registrationFee === 0 ? 'Free' : `UGX ${event.registrationFee.toLocaleString()}`}
                    </p>
                  </div>
                  <Button
                    style={{ backgroundColor: '#c79b2d' }}
                    onClick={() => handleRegister(event.id, event.registrationFee)}
                    disabled={registering === event.id || registered.has(event.id)}
                    className="flex gap-2"
                  >
                    {registering === event.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Registering...
                      </>
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

      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Event Registration Payment</DialogTitle>
            <DialogDescription>Complete your registration for {selectedEvent?.title}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
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
                    <span style={{ color: '#c79b2d' }}>UGX {selectedEvent.registrationFee.toLocaleString()}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Payment Method</Label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="payment"
                        value="mtn"
                        checked={paymentMethod === 'mtn'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-4 h-4"
                      />
                      <span className="font-medium">MTN Mobile Money</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="payment"
                        value="airtel"
                        checked={paymentMethod === 'airtel'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-4 h-4"
                      />
                      <span className="font-medium">Airtel Money</span>
                    </label>
                  </div>
                </div>

                <Button onClick={handlePaymentSubmit} disabled={registering === selectedEvent.id}>
                  {registering === selectedEvent.id ? 'Processing...' : 'Pay & Register'}
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
