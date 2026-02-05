import { Button } from './ui/button';
import { Card } from './ui/card';
import {
  GraduationCap,
  Heart,
  Users,
  TrendingUp,
  Shield,
  Zap,
  Sun
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
    },
    {
      icon: Users,
      title: 'Mentorship Network',
      description: 'Connect with experienced alumni in your field',
    },
    {
      icon: TrendingUp,
      title: 'Real-time Analytics',
      description: 'Track payments and manage finances efficiently',
    },
    {
      icon: Shield,
      title: 'Secure Platform',
      description: 'Enterprise-grade security for all transactions',
    },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-primary to-[#1a4d7a]">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-10"
        style={{
          backgroundImage:
            'url(https://images.unsplash.com/photo-1608485439523-25b28d982428?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1bml2ZXJzaXR5JTIwc3R1ZGVudHMlMjBncmFkdWF0aW9ufGVufDF8fHx8MTc2MjY1NDc4MHww&ixlib=rb-4.1.0&q=80&w=1600)',
        }}
      />

      <div className="relative z-10 min-h-screen flex flex-col">
        <header className="px-6 py-5 border-b border-white/10">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center">
                <GraduationCap className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl text-white">Alumni Aid</h1>
                <p className="text-xs text-white/70">Uganda Christian University</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                type="button"
                className="w-10 h-10 rounded-full bg-white/10 border border-white/15 text-white flex items-center justify-center"
                aria-label="Theme indicator"
              >
                <Sun className="w-4 h-4" />
              </button>
              <button
                onClick={onLogin}
                className="text-white/90 hover:text-white text-sm font-semibold"
              >
                Sign In
              </button>
            </div>
          </div>
        </header>

        <section className="flex-1 flex items-center justify-center px-6 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-8 border border-white/10">
              <Zap className="w-4 h-4 text-[#42c3ff]" />
              <span className="text-sm text-white/90">Trusted by 5,000+ Alumni</span>
            </div>

            <h1 className="text-4xl md:text-6xl text-white mb-6 leading-tight">
              Empower Students,
              <br />
              <span className="text-[#42c3ff]">Connect Communities</span>
            </h1>

            <p className="text-lg md:text-xl text-white/70 mb-10 max-w-2xl mx-auto">
              A comprehensive platform connecting UCU alumni with students through
              financial support, mentorship programs, and community engagement.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-14">
              <Button
                size="lg"
                onClick={onGetStarted}
                className="bg-[#42c3ff] hover:bg-[#2bb8ff] text-[#0b2a4a] text-base px-8 rounded-full"
              >
                Get Started Free
              </Button>
              <button
                onClick={onLogin}
                className="text-white/90 hover:text-white text-base px-6 flex items-center justify-center gap-2"
              >
                <span className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center">
                  <GraduationCap className="w-4 h-4 text-white" />
                </span>
                Explore Platform
              </button>
            </div>

            <div className="grid grid-cols-3 gap-10 max-w-2xl mx-auto">
              <div className="text-center">
                <p className="text-2xl text-[#42c3ff] mb-1 font-semibold">2.5K+</p>
                <p className="text-sm text-white/70">Students Supported</p>
              </div>
              <div className="text-center">
                <p className="text-2xl text-[#42c3ff] mb-1 font-semibold">5K+</p>
                <p className="text-sm text-white/70">Active Alumni</p>
              </div>
              <div className="text-center">
                <p className="text-2xl text-[#42c3ff] mb-1 font-semibold">UGX 2B+</p>
                <p className="text-sm text-white/70">Total Disbursed</p>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 pb-20">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-2xl text-white mb-2">Everything You Need</h2>
              <p className="text-white/60">
                Powerful features designed to streamline alumni relations and student support
              </p>
            </div>
            <div className="grid md:grid-cols-4 gap-6">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <Card
                    key={index}
                    className="p-6 bg-white/10 backdrop-blur-sm border-white/15 text-left hover:bg-white/15 transition-colors rounded-2xl"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-base text-white mb-2">{feature.title}</h3>
                    <p className="text-sm text-white/60">{feature.description}</p>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        <section className="px-6 pb-20">
          <div className="max-w-5xl mx-auto">
            <div className="bg-gradient-to-r from-[#2bb8ff] to-[#63c9ff] rounded-2xl p-8 md:p-12 text-center text-[#0b2a4a] shadow-lg">
              <h3 className="text-2xl font-semibold mb-3">Ready to Make an Impact?</h3>
              <p className="text-base mb-6 text-[#0b2a4a]/80">
                Join thousands of UCU students and alumni building a stronger community together.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  onClick={onGetStarted}
                  className="bg-white text-[#0b2a4a] hover:bg-white/90 text-base px-8 rounded-full"
                >
                  Create Free Account
                </Button>
                <button
                  onClick={onLogin}
                  className="text-[#0b2a4a] font-medium text-base"
                >
                  Learn More
                </button>
              </div>
            </div>
          </div>
        </section>

        <footer className="p-6 border-t border-white/10">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-white/60 text-sm">
            <p>© 2025 Uganda Christian University Alumni Office</p>
            <button className="text-white/60 hover:text-white">Login</button>
          </div>
        </footer>
      </div>
    </div>
  );
}import { Button } from './ui/button';
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
    },
    {
      icon: Users,
      title: 'Mentorship Network',
      description: 'Connect with experienced alumni in your field',
      iconBg: 'bg-sky-500/90',
    },
    {
      icon: BarChart3,
      title: 'Real-time Analytics',
      description: 'Track payments and manage finances efficiently',
      iconBg: 'bg-violet-500/90',
    },
    {
      icon: Shield,
      title: 'Secure Platform',
      description: 'Enterprise-grade security for all transactions',
      iconBg: 'bg-emerald-500/90',
    },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#0b1a2f] via-[#0b1a2f] to-[#0f2a44]">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-10"
        style={{
          backgroundImage:
            'url(https://images.unsplash.com/photo-1608485439523-25b28d982428?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1bml2ZXJzaXR5JTIwc3R1ZGVudHMlMjBncmFkdWF0aW9ufGVufDF8fHx8MTc2MjY1NDc4MHww&ixlib=rb-4.1.0&q=80&w=1600)',
        }}
      />

      <div className="relative z-10 min-h-screen flex flex-col">
        <header className="px-6 py-4 border-b border-white/10">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-sky-400/90 flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg text-white font-semibold">Alumni Aid</h1>
                <p className="text-xs text-white/70">Uganda Christian University</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                type="button"
                className="w-10 h-10 rounded-full bg-white/10 border border-white/15 text-white flex items-center justify-center"
                aria-label="Theme"
              >
                <Sun className="w-4 h-4" />
              </button>
              <button
                onClick={onLogin}
                className="text-white/90 hover:text-white text-sm font-semibold"
              >
                Sign In
              </button>
            </div>
          </div>
        </header>

        <section className="flex-1 flex items-center justify-center px-6 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-8 border border-white/10">
              <Zap className="w-4 h-4 text-sky-300" />
              <span className="text-sm text-white/90">Trusted by 5,000+ Alumni</span>
            </div>

            <h1 className="text-4xl md:text-6xl text-white mb-6 leading-tight font-semibold">
              Empower Students,
              <br />
              <span className="text-sky-300">Connect Communities</span>
            </h1>

            <p className="text-lg md:text-xl text-white/70 mb-10 max-w-2xl mx-auto">
              A comprehensive platform connecting UCU alumni with students through
              financial support, mentorship programs, and community engagement.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-14">
              <Button
                size="lg"
                onClick={onGetStarted}
                className="bg-sky-400 hover:bg-sky-500 text-[#0b1a2f] text-base px-8 rounded-full shadow-[0_10px_30px_rgba(66,195,255,0.35)]"
              >
                Get Started Free
              </Button>
              <button
                onClick={onLogin}
                className="text-white/90 hover:text-white text-base px-6 flex items-center justify-center gap-3"
              >
                <span className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center">
                  <Globe className="w-4 h-4 text-white" />
                </span>
                Explore Platform
              </button>
            </div>

            <div className="grid grid-cols-3 gap-10 max-w-2xl mx-auto">
              <div className="text-center">
                <p className="text-2xl text-sky-300 mb-1 font-semibold">2.5K+</p>
                <p className="text-sm text-white/70">Students Supported</p>
              </div>
              <div className="text-center">
                <p className="text-2xl text-sky-300 mb-1 font-semibold">5K+</p>
                <p className="text-sm text-white/70">Active Alumni</p>
              </div>
              <div className="text-center">
                <p className="text-2xl text-sky-300 mb-1 font-semibold">UGX 2B+</p>
                <p className="text-sm text-white/70">Total Disbursed</p>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 pb-24">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl text-white font-semibold mb-2">Everything You Need</h2>
              <p className="text-white/60">
                Powerful features designed to streamline alumni relations and student support
              </p>
            </div>
            <div className="grid md:grid-cols-4 gap-6">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={index}
                    className="p-6 bg-white/5 border border-white/10 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.25)]"
                  >
                    <div className={`w-12 h-12 rounded-2xl ${feature.iconBg} flex items-center justify-center mb-5`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-base text-white font-semibold mb-2">{feature.title}</h3>
                    <p className="text-sm text-white/60">{feature.description}</p>
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

        <footer className="p-6 border-t border-white/10">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-white/60 text-sm">
            <p>© 2025 Uganda Christian University Alumni Office</p>
            <button onClick={onLogin} className="text-white/60 hover:text-white">
              Login
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
