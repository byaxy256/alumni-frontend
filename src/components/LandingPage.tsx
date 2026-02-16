import { Button } from './ui/button';
import {
  GraduationCap,
  Users,
  HeartHandshake,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  CreditCard,
  MessageCircle,
  CalendarCheck,
  GraduationCapIcon
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

export default function LandingPage({ onGetStarted, onLogin }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-primary text-white">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-32 h-96 w-96 rounded-full bg-[#1f4b7a] opacity-35 blur-[120px]" />
        <div className="absolute top-32 -left-20 h-80 w-80 rounded-full bg-accent opacity-20 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-[#0f2a44] opacity-40 blur-[140px]" />
      </div>

      <header className="sticky top-0 z-30 bg-primary/80 backdrop-blur border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-accent flex items-center justify-center">
              <GraduationCap className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-lg font-semibold">Alumni Circle</p>
              <p className="text-xs text-white/70">Uganda Christian University</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={onLogin} variant="outline" className="border-white/30 text-white hover:bg-white/10">
              Login
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="pt-20 pb-16 px-6">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs text-white/80 mb-6">
                <Sparkles className="h-4 w-4 text-accent" />
                Built for UCU alumni + students
              </div>
              <h1 className="text-4xl md:text-6xl font-semibold leading-tight mb-6">
                Support students.
                <br />
                <span className="text-accent">Stay connected.</span>
                <br />
                Grow together.
              </h1>
              <p className="text-lg text-white/70 mb-8 max-w-xl">
                A modern alumni platform that feels like an app: fast, personal, and built for real impact. Donate, mentor, and stay close to the UCU community.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={onGetStarted}
                  size="lg"
                  className="bg-accent text-primary hover:bg-accent/90 px-8"
                >
                  Get Started <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button
                  onClick={onLogin}
                  size="lg"
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 px-8"
                >
                  I have an account
                </Button>
              </div>
              <div className="mt-10 flex items-center gap-6 text-sm text-white/70">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-accent" /> 5,000+ alumni
                </div>
                <div className="flex items-center gap-2">
                  <HeartHandshake className="h-4 w-4 text-accent" /> UGX 2B+ support
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-6 rounded-3xl border border-white/10 bg-white/5 blur-xl" />
              <div className="relative rounded-3xl border border-white/10 bg-[#0f1624] p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <span className="h-2 w-2 rounded-full bg-accent" /> Live Activity
                  </div>
                  <div className="text-xs text-white/50">Alumni Circle App</div>
                </div>
                <div className="space-y-4">
                  <div className="rounded-2xl bg-white/5 p-4 border border-white/10">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm">Scholarship Drive</p>
                        <p className="text-xs text-white/60">This month</p>
                      </div>
                        <p className="text-sm text-accent">92%</p>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-white/10">
                      <div className="h-2 rounded-full bg-accent w-[92%]" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-2xl bg-white/5 p-4 border border-white/10">
                      <div className="flex items-center gap-2 text-white/70 text-xs">
                        <CalendarCheck className="h-4 w-4" /> Events
                      </div>
                      <p className="text-xl mt-2">12</p>
                      <p className="text-xs text-white/60">Upcoming</p>
                    </div>
                    <div className="rounded-2xl bg-white/5 p-4 border border-white/10">
                      <div className="flex items-center gap-2 text-white/70 text-xs">
                        <MessageCircle className="h-4 w-4" /> Mentors
                      </div>
                      <p className="text-xl mt-2">240+</p>
                      <p className="text-xs text-white/60">Active</p>
                    </div>
                  </div>
                    <div className="rounded-2xl bg-white/5 p-4 border border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-accent/20 flex items-center justify-center">
                        <CreditCard className="h-5 w-5 text-accent" />
                      </div>
                      <div>
                        <p className="text-sm">Quick Donate</p>
                        <p className="text-xs text-white/60">Instant mobile pay</p>
                      </div>
                    </div>
                    <Button className="bg-white/10 text-white hover:bg-white/20">Send</Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 pb-20">
          <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="h-11 w-11 rounded-xl bg-accent/20 flex items-center justify-center mb-4">
                <GraduationCapIcon className="h-5 w-5 text-accent" />
              </div>
              <h3 className="text-lg mb-2">Student Support</h3>
              <p className="text-sm text-white/70">Flexible giving, emergency funds, and tuition support.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="h-11 w-11 rounded-xl bg-accent/20 flex items-center justify-center mb-4">
                <Users className="h-5 w-5 text-accent" />
              </div>
              <h3 className="text-lg mb-2">Alumni Network</h3>
              <p className="text-sm text-white/70">Find classmates, mentors, and regional chapters.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="h-11 w-11 rounded-xl bg-accent/20 flex items-center justify-center mb-4">
                <ShieldCheck className="h-5 w-5 text-accent" />
              </div>
              <h3 className="text-lg mb-2">Secure & Trusted</h3>
              <p className="text-sm text-white/70">Built with audit trails and bank‑level protection.</p>
            </div>
          </div>
        </section>

        <section className="px-6 pb-24">
          <div className="max-w-5xl mx-auto rounded-3xl border border-white/10 bg-gradient-to-r from-[#1a2a40] to-[#0f1a2b] p-10 md:p-14">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h2 className="text-3xl font-semibold mb-2">Ready to make an impact?</h2>
                <p className="text-white/70">Create your account and start supporting students today.</p>
              </div>
              <Button
                onClick={onGetStarted}
                size="lg"
                className="bg-accent text-primary hover:bg-accent/90 px-8"
              >
                Create Free Account
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
