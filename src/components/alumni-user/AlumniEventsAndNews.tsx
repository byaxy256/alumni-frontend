// Combined Events & News for alumni – one menu item
import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { Button } from '../ui/button';
import { ArrowLeft, Calendar, Newspaper } from 'lucide-react';
import { AlumniEvents } from './AlumniEvents';
import { AlumniNews } from './AlumniNews';

interface AlumniEventsAndNewsProps {
  onBack: () => void;
}

export function AlumniEventsAndNews({ onBack }: AlumniEventsAndNewsProps) {
  const [tab, setTab] = useState<'events' | 'news'>('events');

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <div
        className="sticky top-0 z-10"
        style={{
          background: 'linear-gradient(135deg, var(--brand-blue) 0%, color-mix(in oklab, var(--brand-blue) 70%, black) 100%)',
          borderBottom: '1px solid rgba(255,255,255,0.12)',
        }}
      >
        <div className="p-4">
          <Button onClick={onBack} variant="ghost" size="sm" className="gap-2 mb-2 text-white hover:bg-white/15 hover:text-white">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <h1 className="text-xl font-semibold text-white">News & Events</h1>
          <p className="text-sm text-white/75 mt-0.5">Join events and read the latest updates</p>

          <Tabs value={tab} onValueChange={(v) => setTab(v as 'events' | 'news')} className="mt-4">
            <TabsList className="h-auto w-full justify-start gap-6 rounded-none border-b border-white/25 bg-transparent p-0 shadow-none">
              <TabsTrigger
                value="events"
                className="gap-2 rounded-none border-b-2 border-transparent bg-transparent px-0 pb-2.5 pt-0 text-white/85 shadow-none hover:text-white data-[state=active]:border-white data-[state=active]:text-white data-[state=active]:shadow-none"
              >
                <Calendar className="w-4 h-4" />
                Events
              </TabsTrigger>
              <TabsTrigger
                value="news"
                className="gap-2 rounded-none border-b-2 border-transparent bg-transparent px-0 pb-2.5 pt-0 text-white/85 shadow-none hover:text-white data-[state=active]:border-white data-[state=active]:text-white data-[state=active]:shadow-none"
              >
                <Newspaper className="w-4 h-4" />
                News
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="p-0 pb-20">
        {tab === 'events' && <AlumniEvents onBack={onBack} />}
        {tab === 'news' && <AlumniNews onBack={onBack} />}
      </div>
    </div>
  );
}

