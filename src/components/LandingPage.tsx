import { useEffect, useMemo, useState } from 'react';
import { Button } from './ui/button';
import {
  Users,
  Heart,
  ShieldCheck,
  ArrowRight,
  Coins,
  Calendar,
  MapPin,
  Search
} from 'lucide-react';
import { UcuBadgeLogo } from './UcuBadgeLogo';
import { API_BASE } from '../api';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
  onDonate: (cause?: string) => void;
}

type EventItem = {
  id: string;
  title: string;
  date: string;
  location: string;
};

type DonationCause = {
  id: string;
  name: string;
  raised: number;
  goal: number;
};

const DEFAULT_CAUSES: DonationCause[] = [
  { id: 'student-loans', name: 'Student Loan Fund', raised: 4250000, goal: 5300000 },
  { id: 'scholarships', name: 'Merit Scholarships', raised: 3200000, goal: 6000000 },
  { id: 'emergency', name: 'Emergency Relief', raised: 2900000, goal: 5000000 },
];

function formatUgx(value: number) {
  return `UGX ${Number(value || 0).toLocaleString()}`;
}

export default function LandingPage({ onGetStarted, onLogin, onDonate }: LandingPageProps) {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [causes, setCauses] = useState<DonationCause[]>(DEFAULT_CAUSES);
  const [totalContributions, setTotalContributions] = useState<number>(0);
  const [mentorCount, setMentorCount] = useState<number>(240);
  const [search, setSearch] = useState('');

  const goDonate = (cause?: string) => onDonate(cause);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        const [eventsRes, causesRes, statsRes] = await Promise.all([
          fetch(`${API_BASE}/content/events`),
          fetch(`${API_BASE}/donations/causes`),
          fetch(`${API_BASE}/donations/public-stats`),
        ]);

        const eventsJson = eventsRes.ok ? await eventsRes.json() : { content: [] };
        const causesJson = causesRes.ok ? await causesRes.json() : DEFAULT_CAUSES;
        const statsJson = statsRes.ok ? await statsRes.json() : null;

        if (cancelled) return;

        const normalizedEvents = Array.isArray(eventsJson?.content)
          ? eventsJson.content
              .map((event: any) => ({
                id: String(event.id || event._id || Math.random()),
                title: String(event.title || 'Untitled Event'),
                date: String(event.date || ''),
                location: String(event.location || 'UCU'),
              }))
              .filter((event: EventItem) => !!event.date)
              .sort((a: EventItem, b: EventItem) => new Date(a.date).getTime() - new Date(b.date).getTime())
              .slice(0, 2)
          : [];

        const normalizedCauses = Array.isArray(causesJson)
          ? causesJson
              .map((cause: any) => ({
                id: String(cause.id || cause.name || Math.random()),
                name: String(cause.name || 'Campaign'),
                raised: Number(cause.raised || 0),
                goal: Number(cause.goal || 0),
              }))
              .slice(0, 3)
          : DEFAULT_CAUSES;

        const contributions = Number(
          statsJson?.totalContributions || normalizedCauses.reduce((sum, cause) => sum + cause.raised, 0)
        );

        setEvents(normalizedEvents);
        setCauses(normalizedCauses.length ? normalizedCauses : DEFAULT_CAUSES);
        setTotalContributions(contributions);

        if (typeof statsJson?.activeMentors === 'number' && statsJson.activeMentors > 0) {
          setMentorCount(statsJson.activeMentors);
        }
      } catch (error) {
        console.error('Failed to fetch landing-page metrics:', error);
      }
    };

    void fetchData();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredCauses = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return causes;
    return causes.filter((cause) => cause.name.toLowerCase().includes(query));
  }, [causes, search]);

  const activeCampaigns = causes.filter((cause) => cause.raised > 0).length;

  return (
    <div className="landing-shell relative min-h-screen text-foreground">
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UcuBadgeLogo className="h-9 w-9" imageClassName="object-contain" />
            <div>
              <p className="text-sm font-bold" style={{ color: '#1f2d4f' }}>Alumni Circle</p>
              <p className="text-xs" style={{ color: '#445072' }}>Uganda Christian University</p>
            </div>
          </div>
          <Button onClick={onLogin} variant="outline" className="border-[#d9dff0] text-[#2f3e67] hover:bg-[#f1f5ff]">
            Log In
          </Button>
        </div>
      </header>

      <main className="relative z-10">
        <section className="relative px-6 py-10 md:py-14">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-10 lg:gap-14 xl:gap-16 items-center">
            <div className="order-2 lg:order-1">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold mb-6 leading-tight" style={{ color: '#232f55' }}>
                <div>Support students.</div>
                <div style={{ color: '#b37b2a' }}>Stay connected.</div>
                <div>Grow together.</div>
              </h1>
              <p className="text-base md:text-lg mb-8 max-w-xl leading-relaxed" style={{ color: '#596786' }}>
                A modern alumni platform that brings UCU graduates together to donate, mentor, and stay close to the UCU community.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  onClick={onGetStarted}
                  className="bg-[#0b2a4a] hover:bg-[#123a66] text-white px-6 py-2.5 text-sm md:text-base font-semibold rounded-xl shadow-md shadow-[#0b2a4a]/25"
                >
                  Get Started
                </Button>
                <Button
                  type="button"
                  onClick={onLogin}
                  variant="outline"
                  className="border-[#d9dff0] bg-[#f6f8ff] text-[#2f3e67] px-6 py-2.5 text-sm md:text-base rounded-xl font-semibold transition-colors hover:!bg-[#eef3ff] hover:!border-[#b9c7e6] hover:!text-[#0b2a4a]"
                >
                  I have an account
                </Button>
              </div>
            </div>

            <div className="relative order-1 lg:order-2 flex justify-center lg:justify-end">
              <div className="w-full max-w-[560px]">
                <div className="overflow-hidden rounded-3xl border border-[#d0d9ee] bg-white shadow-[0_24px_60px_-18px_rgba(31,45,79,0.32)] ring-1 ring-black/5">
                  <div className="aspect-[4/3] w-full">
                    <img
                      src="/images/bishop-tucker-building.png"
                      alt="Bishop Tucker Building, Uganda Christian University"
                      className="h-full w-full object-cover object-center"
                    />
                  </div>
                  <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-white/30 via-transparent to-transparent" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 py-8">
          <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6">
            <div className="rounded-2xl p-8 border shadow-sm" style={{ background: '#f8f7fb', borderColor: '#d9dff0' }}>
              <div className="h-12 w-12 rounded-lg flex items-center justify-center mb-4" style={{ background: '#f6e8c8' }}>
                <Coins className="w-6 h-6" style={{ color: '#b37b2a' }} />
              </div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold mb-1" style={{ color: '#25345c' }}>Student Support</h3>
                  <p className="text-sm leading-relaxed mb-4" style={{ color: '#657393' }}>Emergency loans, Support campaigns</p>
                </div>
                <Button
                  type="button"
                  onClick={() => goDonate('Student Loan Fund')}
                  className="bg-[#355fa8] hover:bg-[#2d4f8a] text-white px-5 h-10 rounded-xl font-semibold shadow-sm"
                >
                  Donate
                </Button>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold" style={{ color: '#25345c' }}>{formatUgx(totalContributions || 320000000)}+</p>
                <p className="text-sm flex items-center gap-1" style={{ color: '#657393' }}>
                  <Heart className="w-4 h-4 text-red-500" />
                  Real-time donor activity
                </p>
              </div>
            </div>

            <div className="rounded-2xl p-8 border shadow-sm" style={{ background: '#f8f7fb', borderColor: '#d9dff0' }}>
              <div className="h-12 w-12 rounded-lg flex items-center justify-center mb-4" style={{ background: '#efe7ff' }}>
                <Users className="w-6 h-6" style={{ color: '#6d4eb5' }} />
              </div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold mb-1" style={{ color: '#25345c' }}>Alumni Network</h3>
                  <p className="text-sm leading-relaxed mb-4" style={{ color: '#657393' }}>Find classmates, mentors, and social chapters</p>
                </div>
                <Button
                  type="button"
                  onClick={() => goDonate('Merit Scholarships')}
                  className="bg-[#355fa8] hover:bg-[#2d4f8a] text-white px-5 h-10 rounded-xl font-semibold shadow-sm"
                >
                  Donate
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" style={{ color: '#6d4eb5' }} />
                <p className="text-2xl font-bold" style={{ color: '#25345c' }}>{mentorCount}+</p>
                <p className="text-sm" style={{ color: '#657393' }}>Active mentors</p>
              </div>
            </div>

            <div className="rounded-2xl p-8 border shadow-sm" style={{ background: '#f8f7fb', borderColor: '#d9dff0' }}>
              <div className="h-12 w-12 rounded-lg flex items-center justify-center mb-4" style={{ background: '#e7efff' }}>
                <ShieldCheck className="w-6 h-6" style={{ color: '#355fa8' }} />
              </div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold mb-1" style={{ color: '#25345c' }}>Secure & Trusted</h3>
                  <p className="text-sm leading-relaxed mb-4" style={{ color: '#657393' }}>Built with advanced security and privacy protection</p>
                </div>
                <Button
                  type="button"
                  onClick={() => goDonate('Emergency Relief')}
                  className="bg-[#355fa8] hover:bg-[#2d4f8a] text-white px-5 h-10 rounded-xl font-semibold shadow-sm"
                >
                  Donate
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" style={{ color: '#355fa8' }} />
                <p className="text-sm" style={{ color: '#657393' }}>Privacy</p>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 py-10 bg-transparent">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 xl:gap-20 items-start">
            <div className="min-w-0 pr-0 lg:pr-2">
              <h2 className="text-3xl font-serif font-bold mb-8" style={{ color: '#25345c' }}>Funding Campaigns</h2>

              <div
                className="mb-8 rounded-2xl border border-[#d9dff0] p-1 shadow-sm"
                style={{ background: 'linear-gradient(90deg, rgba(32,55,104,0.10) 0%, rgba(143,63,89,0.10) 55%, rgba(180,132,52,0.10) 100%)' }}
              >
                <div className="grid grid-cols-3 divide-x divide-[#e8ecf7] rounded-xl bg-white/90 px-2 py-4 backdrop-blur sm:px-4 sm:py-5">
                  <div className="flex flex-col items-center justify-center gap-1 px-1 text-center">
                    <Coins className="h-4 w-4 text-[#b37b2a] sm:h-5 sm:w-5" />
                    <p className="text-[10px] font-medium uppercase tracking-wide text-[#657393] sm:text-xs">Contributions</p>
                    <p className="text-sm font-bold leading-tight text-[#25345c] sm:text-base">{formatUgx(totalContributions || 1250000)}</p>
                  </div>
                  <div className="flex flex-col items-center justify-center gap-1 px-1 text-center">
                    <Heart className="h-4 w-4 text-[#8f3f59] sm:h-5 sm:w-5" />
                    <p className="text-[10px] font-medium uppercase tracking-wide text-[#657393] sm:text-xs">Active</p>
                    <p className="text-xl font-bold tabular-nums text-[#25345c] sm:text-2xl">{activeCampaigns}</p>
                  </div>
                  <div className="flex flex-col items-center justify-center gap-1 px-1 text-center">
                    <Calendar className="h-4 w-4 text-[#355fa8] sm:h-5 sm:w-5" />
                    <p className="text-[10px] font-medium uppercase tracking-wide text-[#657393] sm:text-xs">Events</p>
                    <p className="text-xl font-bold tabular-nums text-[#25345c] sm:text-2xl">{events.length}</p>
                  </div>
                </div>
              </div>

              <div className="relative mb-8">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search funding campaigns, events or news..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-lg border border-[#d9dff0] bg-white text-[#25345c] placeholder-[#8a95b0] focus:outline-none focus:ring-2 focus:ring-[#bc8b37]"
                />
              </div>

              <div className="space-y-4 w-full">
                {filteredCauses.map((campaign) => {
                  const percent = campaign.goal > 0 ? Math.min(100, Math.round((campaign.raised / campaign.goal) * 100)) : 0;
                  return (
                  <div key={campaign.id} className="bg-white rounded-lg p-6 border border-[#d9dff0] shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold" style={{ color: '#25345c' }}>{campaign.name}</h4>
                      <Button className="bg-[#355fa8] hover:bg-[#2d4f8a] text-white px-6 min-w-[108px]" onClick={() => goDonate(campaign.name)}>Donate</Button>
                    </div>
                    <div className="flex items-center justify-between text-sm mb-2" style={{ color: '#657393' }}>
                      <span>{formatUgx(campaign.raised)}</span>
                      <span>{formatUgx(campaign.goal)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-600 to-amber-600 h-2 rounded-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                )})}
              </div>
            </div>

            <div className="min-w-0 border-t border-[#e8ecf7] pt-10 lg:border-l lg:border-t-0 lg:pl-12 xl:pl-16 lg:pt-0">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-serif font-bold" style={{ color: '#25345c' }}>Upcoming Events</h2>
                <div className="flex items-center gap-2 text-[#657393]">
                  <span className="text-sm font-semibold">View All Events</span>
                  <ArrowRight className="w-6 h-6 shrink-0" />
                </div>
              </div>

              <div className="space-y-4 mb-8">
                {(events.length ? events : [
                  { id: 'fallback-1', title: 'Career Networking Night', date: '2026-04-27', location: 'Kampala' },
                  { id: 'fallback-2', title: 'Community Service Day', date: '2026-05-04', location: 'Naguru' },
                ]).map((event) => (
                  <div key={event.id} className="bg-white rounded-lg p-6 border border-[#d9dff0] flex gap-4 shadow-sm">
                    <div className="text-3xl">👨</div>
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1" style={{ color: '#25345c' }}>{event.title}</h4>
                      <p className="text-sm flex items-center gap-2 mb-1" style={{ color: '#657393' }}>
                        <Calendar className="w-4 h-4" />
                        {new Date(event.date).toLocaleDateString('en-GB', { weekday: 'long', month: 'short', day: 'numeric' })}
                      </p>
                      <p className="text-sm flex items-center gap-2" style={{ color: '#657393' }}>
                        <MapPin className="w-4 h-4" />
                        {event.location}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="h-2" />

              <div className="mt-8 rounded-xl border border-[#d9dff0] bg-[#f8f9fc] px-4 py-4 text-center shadow-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-[#657393]">Alumni mentors</p>
                <p className="mt-1 text-2xl font-bold text-[#25345c]">{mentorCount}+</p>
                <p className="text-sm text-[#657393]">ready to guide students</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {null}
    </div>
  );
}
