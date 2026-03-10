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
import { ThemeToggle } from './ui/ThemeToggle';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

export default function LandingPage({ onGetStarted, onLogin }: LandingPageProps) {
  return (
    <div className="relative min-h-screen overflow-x-clip bg-background text-foreground">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-32 h-96 w-96 rounded-full bg-primary opacity-20 blur-[120px] dark:opacity-45" />
        <div className="absolute top-32 -left-20 h-80 w-80 rounded-full bg-accent opacity-16 blur-[120px] dark:opacity-28" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-[#5a1a25] opacity-22 blur-[140px] dark:opacity-42" />
      </div>
      <div className="absolute inset-0 bg-[#f8f5f0]/74 dark:bg-black/42" />

      <header className="sticky top-0 z-40 bg-[#fff9f2]/94 dark:bg-card/92 backdrop-blur-2xl border-b border-primary/10 dark:border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl flex items-center justify-center bg-primary">
              <GraduationCap className="h-6 w-6 text-accent" />
            </div>
            <div>
              <p className="text-lg font-semibold">Alumni Circle</p>
              <p className="text-xs text-foreground/70 dark:text-muted-foreground">Uganda Christian University</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button onClick={onLogin} variant="outline" className="border-primary/30 text-foreground hover:bg-primary/5 dark:border-accent/35 dark:hover:bg-accent/10">
              Login
            </Button>
          </div>
        </div>
      </header>

      <main className="pt-6 relative z-10">
        <section className="pt-28 pb-16 px-6">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-xs text-foreground/80 mb-6 dark:border-accent/25 dark:bg-accent/10 dark:text-foreground">
                <Sparkles className="h-4 w-4 text-accent" />
                Built for UCU alumni + students
              </div>
              <h1 className="text-4xl md:text-6xl font-semibold leading-tight mb-6 text-foreground">
                Support students.
                <br />
                <span className="text-accent">Stay connected.</span>
                <br />
                Grow together.
              </h1>
              <p className="text-lg text-foreground/80 dark:text-foreground/90 mb-8 max-w-xl">
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
                  className="border-primary/30 text-foreground hover:bg-primary/5 dark:border-accent/35 dark:hover:bg-accent/10 px-8"
                >
                  I have an account
                </Button>
              </div>
              <div className="mt-10 flex items-center gap-6 text-sm text-foreground/80 dark:text-foreground/85">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-accent" /> 5,000+ alumni
                </div>
                <div className="flex items-center gap-2">
                  <HeartHandshake className="h-4 w-4 text-accent" /> UGX 2B+ support
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-6 rounded-3xl border border-black/10 bg-black/5 blur-xl dark:border-border dark:bg-white/5" />
              <div className="relative rounded-3xl border border-black/10 bg-white/80 p-6 dark:border-border dark:bg-card/95">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2 text-sm text-foreground/70 dark:text-muted-foreground">
                    <span className="h-2 w-2 rounded-full bg-accent" /> Live Activity
                  </div>
                  <div className="text-xs text-foreground/50 dark:text-muted-foreground">Alumni Circle App</div>
                </div>
                <div className="space-y-4">
                  <div className="rounded-2xl bg-black/5 p-4 border border-black/10 dark:bg-white/5 dark:border-white/10">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-foreground">Scholarship Drive</p>
                        <p className="text-xs text-foreground/60 dark:text-muted-foreground">This month</p>
                      </div>
                      <p className="text-sm text-accent">92%</p>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-black/10 dark:bg-white/10">
                      <div className="h-2 rounded-full bg-accent w-[92%]" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-2xl bg-black/5 p-4 border border-black/10 dark:bg-white/5 dark:border-white/10">
                      <div className="flex items-center gap-2 text-foreground/70 dark:text-muted-foreground text-xs">
                        <CalendarCheck className="h-4 w-4" /> Events
                      </div>
                      <p className="text-xl mt-2 text-foreground">12</p>
                      <p className="text-xs text-foreground/60 dark:text-muted-foreground">Upcoming</p>
                    </div>
                    <div className="rounded-2xl bg-black/5 p-4 border border-black/10 dark:bg-white/5 dark:border-white/10">
                      <div className="flex items-center gap-2 text-foreground/70 dark:text-muted-foreground text-xs">
                        <MessageCircle className="h-4 w-4" /> Mentors
                      </div>
                      <p className="text-xl mt-2 text-foreground">240+</p>
                      <p className="text-xs text-foreground/60 dark:text-muted-foreground">Active</p>
                    </div>
                  </div>
                  <div className="rounded-2xl bg-black/5 p-4 border border-black/10 dark:bg-white/5 dark:border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-accent/20 flex items-center justify-center">
                        <CreditCard className="h-5 w-5 text-accent" />
                      </div>
                      <div>
                        <p className="text-sm text-foreground">Quick Donate</p>
                        <p className="text-xs text-foreground/60 dark:text-muted-foreground">Instant mobile pay</p>
                      </div>
                    </div>
                    <Button className="bg-primary/10 text-foreground hover:bg-primary/20 dark:bg-accent/20 dark:hover:bg-accent/30">Send</Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 pb-24 pt-12">
          <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-black/10 bg-white/80 p-6 dark:border-border dark:bg-card/90">
              <div className="h-11 w-11 rounded-xl bg-accent/20 flex items-center justify-center mb-4">
                <GraduationCapIcon className="h-5 w-5 text-accent" />
              </div>
              <h3 className="text-lg mb-2">Student Support</h3>
              <p className="text-sm text-foreground/80 dark:text-foreground/85">Flexible giving, emergency funds, and tuition support.</p>
            </div>
            <div className="rounded-2xl border border-black/10 bg-white/80 p-6 dark:border-border dark:bg-card/90">
              <div className="h-11 w-11 rounded-xl bg-accent/20 flex items-center justify-center mb-4">
                <Users className="h-5 w-5 text-accent" />
              </div>
              <h3 className="text-lg mb-2">Alumni Network</h3>
              <p className="text-sm text-foreground/80 dark:text-foreground/85">Find classmates, mentors, and regional chapters.</p>
            </div>
            <div className="rounded-2xl border border-black/10 bg-white/80 p-6 dark:border-border dark:bg-card/90">
              <div className="h-11 w-11 rounded-xl bg-accent/20 flex items-center justify-center mb-4">
                <ShieldCheck className="h-5 w-5 text-accent" />
              </div>
              <h3 className="text-lg mb-2">Secure & Trusted</h3>
              <p className="text-sm text-foreground/80 dark:text-foreground/85">Built with audit trails and bank‑level protection.</p>
            </div>
          </div>
        </section>

        <section className="px-6 pb-28">
          <div className="max-w-5xl mx-auto rounded-3xl border border-white/10 bg-gradient-to-r from-[#7a1f2a] to-[#4f1420] p-10 md:p-14">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h2 className="text-3xl font-semibold mb-2">Ready to make an impact?</h2>
                <p className="text-white/80">Create your account and start supporting students today.</p>
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
