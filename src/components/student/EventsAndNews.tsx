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
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <div className="sticky top-0 z-10" style={{ background: '#0b2a4a', borderBottom: '1px solid rgba(0,0,0,0.3)' }}>
        <div className="p-4">
          <Button onClick={onBack} variant="ghost" size="sm" className="gap-2 mb-2 text-white hover:bg-white/15 hover:text-white">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <h1 className="text-xl font-semibold text-white">Events & News</h1>
          <p className="text-sm text-white/75 mt-0.5">Join events and read the latest updates</p>
          <Tabs value={tab} onValueChange={(v) => setTab(v as 'events' | 'news')} className="mt-4">
            <TabsList className="h-auto w-full justify-start gap-3 rounded-none border-b border-white/25 bg-transparent p-0 shadow-none">
              <TabsTrigger
                value="events"
                className="gap-2 rounded-t-md border-b-2 border-transparent bg-transparent px-3 py-2 text-white/90 shadow-none hover:text-white data-[state=active]:border-white data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:font-semibold data-[state=active]:shadow-none"
              >
                <Calendar className="w-4 h-4" />
                Events
              </TabsTrigger>
              <TabsTrigger
                value="news"
                className="gap-2 rounded-t-md border-b-2 border-transparent bg-transparent px-3 py-2 text-white/90 shadow-none hover:text-white data-[state=active]:border-white data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:font-semibold data-[state=active]:shadow-none"
              >
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
