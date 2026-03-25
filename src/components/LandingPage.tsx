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
import { toast } from 'sonner';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
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

export default function LandingPage({ onGetStarted, onLogin }: LandingPageProps) {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [causes, setCauses] = useState<DonationCause[]>(DEFAULT_CAUSES);
  const [totalContributions, setTotalContributions] = useState<number>(0);
  const [mentorCount, setMentorCount] = useState<number>(240);
  const [search, setSearch] = useState('');
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [donateLoading, setDonateLoading] = useState(false);
  const [donateForm, setDonateForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    amount: '',
    cause: 'Student Loan Fund',
  });

  const openDonateModal = (cause?: string) => {
    setDonateForm((prev) => ({
      ...prev,
      cause: cause || prev.cause,
    }));
    setShowDonateModal(true);
  };

  const submitGuestDonation = async () => {
    const amount = Number(donateForm.amount || 0);
    if (!donateForm.full_name.trim() || !donateForm.email.trim() || !donateForm.phone.trim() || !Number.isFinite(amount) || amount <= 0) {
      toast.error('Please fill your name, email, phone and a valid amount.');
      return;
    }

    try {
      setDonateLoading(true);
      const res = await fetch(`${API_BASE}/donations/public`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: donateForm.full_name,
          email: donateForm.email,
          phone: donateForm.phone,
          amount,
          cause: donateForm.cause,
          payment_method: 'guest',
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to submit donation');
      }

      toast.success('Thank you! Your donation was received successfully.');
      setShowDonateModal(false);
      setDonateForm((prev) => ({ ...prev, amount: '' }));

      const statsRes = await fetch(`${API_BASE}/donations/public-stats`);
      if (statsRes.ok) {
        const statsJson = await statsRes.json();
        if (typeof statsJson?.totalContributions === 'number') {
          setTotalContributions(statsJson.totalContributions);
        }
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to submit donation');
    } finally {
      setDonateLoading(false);
    }
  };

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
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 lg:gap-10 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold mb-6 leading-tight" style={{ color: '#232f55' }}>
                <div>Support students.</div>
                <div style={{ color: '#b37b2a' }}>Stay connected.</div>
                <div>Grow together.</div>
              </h1>
              <p className="text-base md:text-lg mb-8 max-w-xl leading-relaxed" style={{ color: '#596786' }}>
                A modern alumni platform that brings UCU graduates together to donate, mentor, and stay close to the UCU community.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Button onClick={onGetStarted} className="bg-[#bc8b37] hover:bg-[#a9792d] text-white px-8 py-3 text-base font-semibold rounded-xl">
                  Get Started
                </Button>
                <Button onClick={onLogin} variant="outline" className="border-[#d9dff0] bg-[#f6f8ff] text-[#2f3e67] hover:bg-[#eef3ff] px-8 py-3 rounded-xl">
                  I have an account
                </Button>
              </div>
            </div>

            <div className="relative">
              <div className="mx-auto w-full max-w-[620px] max-h-[420px] rounded-3xl overflow-hidden border border-[#d6ddf0] bg-[#eef2ff] aspect-[16/10] shadow-lg">
                <img
                  src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1400&q=80"
                  alt="Alumni community"
                  className="w-full h-full object-cover"
                />
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
              <h3 className="text-lg font-semibold mb-1" style={{ color: '#25345c' }}>Student Support</h3>
              <p className="text-sm leading-relaxed mb-4" style={{ color: '#657393' }}>Emergency loans, Support campaigns</p>
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
              <h3 className="text-lg font-semibold mb-1" style={{ color: '#25345c' }}>Alumni Network</h3>
              <p className="text-sm leading-relaxed mb-4" style={{ color: '#657393' }}>Find classmates, mentors, and social chapters</p>
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
              <h3 className="text-lg font-semibold mb-1" style={{ color: '#25345c' }}>Secure & Trusted</h3>
              <p className="text-sm leading-relaxed mb-4" style={{ color: '#657393' }}>Built with advanced security and privacy protection</p>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" style={{ color: '#355fa8' }} />
                <p className="text-sm" style={{ color: '#657393' }}>Privacy</p>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 py-10 bg-transparent">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-serif font-bold mb-8" style={{ color: '#25345c' }}>Funding Campaigns</h2>

              <div className="rounded-xl p-6 text-white mb-8 flex items-center justify-between" style={{ background: 'linear-gradient(90deg, #203768 0%, #8f3f59 52%, #b48434 100%)' }}>
                <div className="flex items-center gap-3">
                  <Coins className="w-6 h-6" />
                  <div>
                    <p className="text-sm opacity-90">Total Contributions</p>
                    <p className="text-2xl font-bold">{formatUgx(totalContributions || 1250000)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm opacity-90">{activeCampaigns} Active Campaigns</p>
                  <p className="text-2xl font-bold">{events.length} Events</p>
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

              <div className="space-y-4">
                {filteredCauses.map((campaign) => {
                  const percent = campaign.goal > 0 ? Math.min(100, Math.round((campaign.raised / campaign.goal) * 100)) : 0;
                  return (
                  <div key={campaign.id} className="bg-white rounded-lg p-6 border border-[#d9dff0] shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold" style={{ color: '#25345c' }}>{campaign.name}</h4>
                      <Button className="bg-[#355fa8] hover:bg-[#2d4f8a] text-white px-6 min-w-[108px]" onClick={() => openDonateModal(campaign.name)}>Donate</Button>
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

            <div>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-serif font-bold" style={{ color: '#25345c' }}>Upcoming Events</h2>
                <ArrowRight className="w-6 h-6" style={{ color: '#657393' }} />
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

              <Button className="w-full bg-[#bc8b37] hover:bg-[#a9792d] text-white py-3 font-semibold" onClick={() => openDonateModal()}>
                View All Events
              </Button>

              <div className="bg-white rounded-lg p-6 border border-[#d9dff0] mt-8 flex items-center justify-around text-center shadow-sm">
                <div>
                  <Coins className="w-6 h-6 mx-auto mb-2" style={{ color: '#bc8b37' }} />
                  <p className="text-2xl font-bold" style={{ color: '#25345c' }}>UGX</p>
                  <p className="text-sm" style={{ color: '#657393' }}>Total Contributions</p>
                </div>
                <div className="h-12 w-px bg-gray-200" />
                <div>
                  <Users className="w-6 h-6 mx-auto mb-2" style={{ color: '#6d4eb5' }} />
                  <p className="text-2xl font-bold" style={{ color: '#25345c' }}>{mentorCount}+</p>
                  <p className="text-sm" style={{ color: '#657393' }}>Mentors</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {showDonateModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4">
          <div className="w-full max-w-md rounded-2xl border border-[#d9dff0] bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-semibold" style={{ color: '#25345c' }}>Donate</h3>
            <p className="mt-1 text-sm" style={{ color: '#657393' }}>You can donate without creating an account.</p>

            <div className="mt-4 space-y-3">
              <input
                type="text"
                placeholder="Full Name"
                value={donateForm.full_name}
                onChange={(event) => setDonateForm((prev) => ({ ...prev, full_name: event.target.value }))}
                className="w-full rounded-lg border border-[#d9dff0] px-3 py-2 text-sm text-[#25345c] outline-none focus:ring-2 focus:ring-[#bc8b37]"
              />
              <input
                type="email"
                placeholder="Email"
                value={donateForm.email}
                onChange={(event) => setDonateForm((prev) => ({ ...prev, email: event.target.value }))}
                className="w-full rounded-lg border border-[#d9dff0] px-3 py-2 text-sm text-[#25345c] outline-none focus:ring-2 focus:ring-[#bc8b37]"
              />
              <input
                type="tel"
                placeholder="Phone"
                value={donateForm.phone}
                onChange={(event) => setDonateForm((prev) => ({ ...prev, phone: event.target.value }))}
                className="w-full rounded-lg border border-[#d9dff0] px-3 py-2 text-sm text-[#25345c] outline-none focus:ring-2 focus:ring-[#bc8b37]"
              />
              <input
                type="number"
                placeholder="Amount (UGX)"
                value={donateForm.amount}
                onChange={(event) => setDonateForm((prev) => ({ ...prev, amount: event.target.value }))}
                className="w-full rounded-lg border border-[#d9dff0] px-3 py-2 text-sm text-[#25345c] outline-none focus:ring-2 focus:ring-[#bc8b37]"
              />
              <select
                aria-label="Donation Cause"
                value={donateForm.cause}
                onChange={(event) => setDonateForm((prev) => ({ ...prev, cause: event.target.value }))}
                className="w-full rounded-lg border border-[#d9dff0] px-3 py-2 text-sm text-[#25345c] outline-none focus:ring-2 focus:ring-[#bc8b37]"
              >
                {causes.map((cause) => (
                  <option key={cause.id} value={cause.name}>{cause.name}</option>
                ))}
              </select>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                className="border-[#d9dff0] text-[#2f3e67]"
                onClick={() => setShowDonateModal(false)}
                disabled={donateLoading}
              >
                Cancel
              </Button>
              <Button
                className="bg-[#bc8b37] hover:bg-[#a9792d] text-white"
                onClick={submitGuestDonation}
                disabled={donateLoading}
              >
                {donateLoading ? 'Submitting...' : 'Donate'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
