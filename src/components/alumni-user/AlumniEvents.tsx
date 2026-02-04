import { useEffect, useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { ArrowLeft, Calendar, MapPin, Users, Loader2 } from 'lucide-react';
import { API_BASE } from '../../api';
import { ImageWithFallback } from '../figma_image/ImageWithFallback';

interface AlumniEventsProps {
  onBack: () => void;
}

export function AlumniEvents({ onBack }: AlumniEventsProps) {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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
          attendees: it.attendees || 0,
          hasImage: !!it.hasImage,
        }));
        setEvents(mapped);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-6">
      <div className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg" title="Go back">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-primary">Upcoming Events</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-4">
        {loading ? (
          <div className="text-center py-10"><Loader2 className="mx-auto h-8 w-8 animate-spin" /></div>
        ) : events.length === 0 ? (
          <Card className="p-6 text-center text-gray-600">No upcoming events</Card>
        ) : (
          events.map((event) => (
            <Card key={event.id} className="p-6">
              <div className="flex gap-4">
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
                  {event.hasImage ? (
                    <ImageWithFallback
                      src={`${API_BASE}/content/events/${event.id}/image`}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary to-accent text-white flex flex-col items-center justify-center">
                      <span className="text-sm">{event.date}</span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg mb-2">{event.title}</h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{event.date}{event.time ? ` • ${event.time}` : ''}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{event.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>{event.attendees} attending</span>
                    </div>
                  </div>
                  <Button className="mt-4">RSVP</Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
