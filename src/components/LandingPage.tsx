import { Button } from './ui/button';
import {
  GraduationCap,
  Heart,
  Users,
  BarChart3,
  Shield,
  Zap,
  Sun,
  Globe
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

export default function LandingPage({ onGetStarted, onLogin }: LandingPageProps) {
  const features = [
    {
      icon: Heart,
      title: 'Financial Support',
      description: 'Quick access to student loans and emergency funding',
      iconBg: 'bg-rose-500/90',
      iconBgLight: 'bg-rose-500/15',
    },
    {
      icon: Users,
      title: 'Mentorship Network',
      description: 'Connect with experienced alumni in your field',
      iconBg: 'bg-sky-500/90',
      iconBgLight: 'bg-sky-500/15',
    },
    {
      icon: BarChart3,
      title: 'Real-time Analytics',
      description: 'Track payments and manage finances efficiently',
      iconBg: 'bg-violet-500/90',
      iconBgLight: 'bg-violet-500/15',
    },
    {
      icon: Shield,
      title: 'Secure Platform',
      description: 'Enterprise-grade security for all transactions',
      iconBg: 'bg-emerald-500/90',
      iconBgLight: 'bg-emerald-500/15',
    },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#e8f0ff] via-[#f4f8ff] to-[#dbe9ff] dark:from-[#0b1a2f] dark:via-[#0b1a2f] dark:to-[#0f2a44]">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-10 dark:opacity-10"
        style={{
          backgroundImage:
            'url(https://images.unsplash.com/photo-1608485439523-25b28d982428?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1bml2ZXJzaXR5JTIwc3R1ZGVudHMlMjBncmFkdWF0aW9ufGVufDF8fHx8MTc2MjY1NDc4MHww&ixlib=rb-4.1.0&q=80&w=1600)',
        }}
      />

      <div className="relative z-10 min-h-screen flex flex-col">
        <header className="px-6 py-4 border-b border-white/10 dark:border-white/10">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-sky-500/15 dark:bg-sky-400/90 flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-[#0b1a2f] dark:text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-[#0b1a2f] dark:text-white">Alumni Aid</h1>
                <p className="text-xs text-slate-600 dark:text-white/70">Uganda Christian University</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                type="button"
                className="w-10 h-10 rounded-full bg-white/70 border border-white/40 text-[#0b1a2f] dark:bg-white/10 dark:border-white/15 dark:text-white flex items-center justify-center"
                aria-label="Theme"
              >
                <Sun className="w-4 h-4" />
              </button>
              <button
                onClick={onLogin}
                className="text-[#0b1a2f]/80 hover:text-[#0b1a2f] dark:text-white/90 dark:hover:text-white text-sm font-semibold"
              >
                Sign In
              </button>
            </div>
          </div>
        </header>

        <section className="flex-1 flex items-center justify-center px-6 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/70 dark:bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-8 border border-white/40 dark:border-white/10">
              <Zap className="w-4 h-4 text-sky-500 dark:text-sky-300" />
              <span className="text-sm text-[#0b1a2f]/80 dark:text-white/90">Trusted by 5,000+ Alumni</span>
            </div>

            <h1 className="text-4xl md:text-6xl mb-6 leading-tight font-semibold text-[#0b1a2f] dark:text-white">
              Empower Students,
              <br />
              <span className="text-sky-500 dark:text-sky-300">Connect Communities</span>
            </h1>

            <p className="text-lg md:text-xl mb-10 max-w-2xl mx-auto text-[#1e3a5a]/80 dark:text-white/70">
              A comprehensive platform connecting UCU alumni with students through
              financial support, mentorship programs, and community engagement.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-14">
              <Button
                size="lg"
                onClick={onGetStarted}
                className="bg-sky-500 hover:bg-sky-600 text-white dark:bg-sky-400 dark:hover:bg-sky-500 dark:text-[#0b1a2f] text-base px-8 rounded-full shadow-[0_12px_32px_rgba(14,116,196,0.3)]"
              >
                Get Started Free
              </Button>
              <button
                onClick={onLogin}
                className="text-[#0b1a2f]/80 hover:text-[#0b1a2f] dark:text-white/90 dark:hover:text-white text-base px-6 flex items-center justify-center gap-3"
              >
                <span className="w-9 h-9 rounded-full border border-sky-500/40 dark:border-white/20 flex items-center justify-center">
                  <Globe className="w-4 h-4 text-sky-500 dark:text-white" />
                </span>
                Explore Platform
              </button>
            </div>

            <div className="grid grid-cols-3 gap-10 max-w-2xl mx-auto">
              <div className="text-center">
                <p className="text-2xl mb-1 font-semibold text-sky-600 dark:text-sky-300">2.5K+</p>
                <p className="text-sm text-slate-600 dark:text-white/70">Students Supported</p>
              </div>
              <div className="text-center">
                <p className="text-2xl mb-1 font-semibold text-sky-600 dark:text-sky-300">5K+</p>
                <p className="text-sm text-slate-600 dark:text-white/70">Active Alumni</p>
              </div>
              <div className="text-center">
                <p className="text-2xl mb-1 font-semibold text-sky-600 dark:text-sky-300">UGX 2B+</p>
                <p className="text-sm text-slate-600 dark:text-white/70">Total Disbursed</p>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 pb-24">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-semibold mb-2 text-[#0b1a2f] dark:text-white">Everything You Need</h2>
              <p className="text-slate-600 dark:text-white/60">
                Powerful features designed to streamline alumni relations and student support
              </p>
            </div>
            <div className="grid md:grid-cols-4 gap-6">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={index}
                    className="p-6 bg-white/85 dark:bg-white/5 border border-white/60 dark:border-white/10 rounded-2xl shadow-[0_12px_30px_rgba(15,36,68,0.12)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.25)]"
                  >
                    <div className={`w-12 h-12 rounded-2xl ${feature.iconBgLight} dark:${feature.iconBg} flex items-center justify-center mb-5`}>
                      <Icon className="w-6 h-6 text-[#0b1a2f] dark:text-white" />
                    </div>
                    <h3 className="text-base font-semibold mb-2 text-[#0b1a2f] dark:text-white">{feature.title}</h3>
                    <p className="text-sm text-slate-600 dark:text-white/60">{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="px-6 pb-24">
          <div className="max-w-5xl mx-auto">
            <div className="bg-gradient-to-r from-[#2bb8ff] to-[#63c9ff] rounded-2xl p-8 md:p-12 text-center text-[#0b1a2f] shadow-[0_20px_60px_rgba(66,195,255,0.35)]">
              <h3 className="text-2xl font-semibold mb-3">Ready to Make an Impact?</h3>
              <p className="text-base mb-6 text-[#0b1a2f]/80">
                Join thousands of UCU students and alumni building a stronger community together.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  onClick={onGetStarted}
                  className="bg-white text-[#0b1a2f] hover:bg-white/90 text-base px-8 rounded-full"
                >
                  Create Free Account
                </Button>
                <button
                  onClick={onLogin}
                  className="text-[#0b1a2f] font-medium text-base"
                >
                  Learn More
                </button>
              </div>
            </div>
          </div>
        </section>

        <footer className="p-6 border-t border-white/40 dark:border-white/10">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-slate-600 dark:text-white/60 text-sm">
            <p>© 2025 Uganda Christian University Alumni Office</p>
            <button onClick={onLogin} className="text-slate-600 hover:text-[#0b1a2f] dark:text-white/60 dark:hover:text-white">
              Login
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
