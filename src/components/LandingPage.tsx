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

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

export default function LandingPage({ onGetStarted, onLogin }: LandingPageProps) {
  return (
    <div className="landing-shell relative min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 text-foreground">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-purple-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UcuBadgeLogo className="h-9 w-9 rounded-md" imageClassName="object-contain" />
            <div>
              <p className="text-sm font-semibold text-gray-900">UGANDA</p>
              <p className="text-xs text-gray-600">Christian University</p>
              <p className="text-xs text-gray-500">Alumni Circle</p>
            </div>
          </div>
          <Button onClick={onLogin} variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
            <Users className="w-4 h-4 mr-2" />
            Log In
          </Button>
        </div>
      </header>

      <main className="relative z-10">
        {/* Hero Section with Image */}
        <section className="relative px-6 py-16 md:py-24">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl md:text-6xl font-serif font-bold mb-6 leading-tight">
                <span className="text-gray-900">Support students.</span>
                <br />
                <span className="text-amber-600">Stay connected.</span>
                <br />
                <span className="text-gray-900">Grow together.</span>
              </h1>
              <p className="text-gray-700 text-lg mb-8 max-w-lg">
                A modern alumni platform that brings UCU graduates together to donate, mentor, and stay close to the UCU community.
              </p>
              <Button
                onClick={onGetStarted}
                className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-3 text-lg font-semibold"
              >
                Donate Now
              </Button>
            </div>
            
            <div className="relative">
              <div className="rounded-2xl overflow-hidden bg-gray-200 aspect-square">
                <img
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-wU4bc4HI0fIkuHntFUcmwepKq0P4Fo.png"
                  alt="Alumni community"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Features Cards */}
        <section className="px-6 py-16 bg-white/50">
          <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6">
            <div className="rounded-2xl bg-white p-8 border border-gray-200 shadow-sm">
              <div className="h-12 w-12 rounded-lg bg-amber-100 flex items-center justify-center mb-4">
                <Coins className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Student Support</h3>
              <p className="text-gray-600 text-sm mb-4">Emergency loans, Support campaigns</p>
              <div className="space-y-2">
                <p className="text-2xl font-bold text-gray-900">UGX 320,000,000+</p>
                <p className="text-sm text-gray-600 flex items-center gap-1">
                  <Heart className="w-4 h-4 text-amber-600" />
                  1.5k+ donors
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-8 border border-gray-200 shadow-sm">
              <div className="h-12 w-12 rounded-lg bg-pink-100 flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-pink-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Alumni Network</h3>
              <p className="text-gray-600 text-sm mb-4">Find classmates, mentors, and social chapters</p>
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-pink-600" />
                <p className="text-2xl font-bold text-gray-900">240+</p>
                <p className="text-gray-600">Active members</p>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-8 border border-gray-200 shadow-sm">
              <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center mb-4">
                <ShieldCheck className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Secure & Trusted</h3>
              <p className="text-gray-600 text-sm mb-4">Built with advanced security and privacy protection</p>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <p className="text-gray-600">Privacy</p>
              </div>
            </div>
          </div>
        </section>

        {/* Funding Campaigns and Upcoming Events */}
        <section className="px-6 py-16">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12">
            {/* Funding Campaigns */}
            <div>
              <h2 className="text-3xl font-serif font-bold text-gray-900 mb-8">Funding Campaigns</h2>
              
              {/* Stats Bar */}
              <div className="rounded-xl bg-gradient-to-r from-blue-900 to-amber-600 p-6 text-white mb-8 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Coins className="w-6 h-6" />
                  <div>
                    <p className="text-sm opacity-90">Total Contributions</p>
                    <p className="text-2xl font-bold">UGX 1,250,000</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm opacity-90">6 Active Campaigns</p>
                  <p className="text-2xl font-bold">3 Events</p>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative mb-8">
                <Search className="absolute left-4 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search funding campaigns, events or news..."
                  className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-600"
                />
              </div>

              {/* Campaign Items */}
              <div className="space-y-4">
                {[
                  { title: "Scholarship Drive for Laptops", current: "UGX 4,250,000", target: "UGX/ 5,300,000", percent: 80 },
                  { title: "Financial Aid Support", current: "UGX 3,200,000", target: "UGX/ 6,000,000", percent: 53 },
                  { title: "General Scholarship Fund", current: "UGX 2,900,000", target: "UGX/ 5,000,000", percent: 58 }
                ].map((campaign, idx) => (
                  <div key={idx} className="bg-white rounded-lg p-6 border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-900">{campaign.title}</h4>
                      <Button className="bg-blue-700 hover:bg-blue-800 text-white px-6">Donate</Button>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                      <span>{campaign.current}</span>
                      <span>{campaign.target}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-600 to-amber-600 h-2 rounded-full"
                        style={{ width: `${campaign.percent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Events */}
            <div>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-serif font-bold text-gray-900">Upcoming Events</h2>
                <ArrowRight className="w-6 h-6 text-gray-600" />
              </div>

              {/* Event Cards */}
              <div className="space-y-4 mb-8">
                {[
                  { title: "Career Networking Night", date: "Thursday, April 27", location: "Kampala", avatar: "👨" },
                  { title: "Community Service Day", date: "Saturday, May 4", location: "Naguru", avatar: "👨" }
                ].map((event, idx) => (
                  <div key={idx} className="bg-white rounded-lg p-6 border border-gray-200 flex gap-4">
                    <div className="text-3xl">{event.avatar}</div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">{event.title}</h4>
                      <p className="text-sm text-gray-600 flex items-center gap-2 mb-1">
                        <Calendar className="w-4 h-4" />
                        {event.date}
                      </p>
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {event.location}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3 font-semibold">
                View All Events
              </Button>

              {/* Bottom Stats */}
              <div className="bg-white rounded-lg p-6 border border-gray-200 mt-8 flex items-center justify-around text-center">
                <div>
                  <Coins className="w-6 h-6 text-amber-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">UGX</p>
                  <p className="text-sm text-gray-600">Total Contributions</p>
                </div>
                <div className="h-12 w-px bg-gray-200" />
                <div>
                  <Users className="w-6 h-6 text-pink-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">240+</p>
                  <p className="text-sm text-gray-600">Mentors</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
