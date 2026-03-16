// Combined Events & News for students – one menu item
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Button } from '../ui/button';
import { ArrowLeft, Calendar, Newspaper } from 'lucide-react';
import { News } from './News';
import { Events } from './Events';

interface EventsAndNewsProps {
  onBack: () => void;
}

export function EventsAndNews({ onBack }: EventsAndNewsProps) {
  const [tab, setTab] = useState<'events' | 'news'>('events');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <div className="bg-white dark:bg-card border-b border-border sticky top-0 z-10">
        <div className="p-4">
          <Button onClick={onBack} variant="ghost" size="sm" className="gap-2 mb-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <h1 className="text-xl font-semibold text-foreground">Events & News</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Join events and read the latest updates</p>
          <Tabs value={tab} onValueChange={(v) => setTab(v as 'events' | 'news')} className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="events" className="gap-2">
                <Calendar className="w-4 h-4" />
                Events
              </TabsTrigger>
              <TabsTrigger value="news" className="gap-2">
                <Newspaper className="w-4 h-4" />
                News
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
      <div className="p-0 pb-20">
        {tab === 'events' && <Events onBack={onBack} embedded />}
        {tab === 'news' && <News onBack={onBack} embedded />}
      </div>
    </div>
  );
}
