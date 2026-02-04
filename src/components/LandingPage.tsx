import { Button } from './ui/button';
import { Card } from './ui/card';
import { 
  GraduationCap, 
  Heart, 
  Users, 
  TrendingUp,
  Shield, 
  Award
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

export default function LandingPage({ onGetStarted, onLogin }: LandingPageProps) {
  const features = [
    {
      icon: Heart,
      title: 'Student Support',
      description: 'Providing loans and financial aid to students in need',
    },
    {
      icon: Users,
      title: 'Alumni Network',
      description: 'Connect with thousands of UCU alumni worldwide',
    },
    {
      icon: TrendingUp,
      title: 'Mentorship',
      description: 'Get guidance from experienced alumni in your field',
    },
    {
      icon: Shield,
      title: 'Secure & Transparent',
      description: 'Bank-level security with full audit trails',
    },
  ];

  return (
    <div className="min-h-screen landing-shell relative overflow-hidden">
      <div className="landing-orb blue" />
      <div className="landing-orb gold" />
      <div className="landing-orb teal" />

      <div className="relative z-10 min-h-screen flex flex-col">
        <header className="p-6">
          <div className="max-w-7xl mx-auto glass-panel rounded-2xl px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-accent/20 flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h1 className="text-lg text-foreground">Alumni Connect</h1>
                <p className="text-xs text-muted-foreground">Uganda Christian University</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={onLogin}
              className="btn-glass"
            >
              Login
            </Button>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 glass-panel px-4 py-2 rounded-full mb-6">
                <Award className="w-4 h-4 text-accent" />
                <span className="text-sm text-foreground">Empowering Students, Connecting Alumni</span>
              </div>

              <h1 className="text-4xl md:text-6xl text-foreground mb-6 leading-tight">
                Building Futures
                <br />
                <span className="text-accent">Together</span>
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl">
                A modern platform connecting UCU alumni with current students through donations,
                mentorship, and financial support programs.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <Button
                  size="lg"
                  onClick={onGetStarted}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground text-base px-8 shadow-lg"
                >
                  Get Started
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={onLogin}
                  className="btn-glass text-base px-8"
                >
                  I have an account
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-4 max-w-xl">
                <div className="glass-panel rounded-2xl p-4">
                  <p className="text-2xl text-foreground mb-1">2,500+</p>
                  <p className="text-xs text-muted-foreground">Students Supported</p>
                </div>
                <div className="glass-panel rounded-2xl p-4">
                  <p className="text-2xl text-foreground mb-1">5,000+</p>
                  <p className="text-xs text-muted-foreground">Active Alumni</p>
                </div>
                <div className="glass-panel rounded-2xl p-4">
                  <p className="text-2xl text-foreground mb-1">UGX 2B+</p>
                  <p className="text-xs text-muted-foreground">Total Disbursed</p>
                </div>
              </div>
            </div>

            <div className="glass-panel rounded-2xl p-6 lg:p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest">Alumni Pulse</p>
                  <h3 className="text-xl text-foreground">Giving Momentum</h3>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="h-2 w-2 rounded-full bg-accent" />
                  Live
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl surface-soft p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-foreground">Scholarship Fund</p>
                      <p className="text-xs text-muted-foreground">Monthly goal reached</p>
                    </div>
                    <p className="text-sm text-foreground">96%</p>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-background">
                    <div className="h-2 rounded-full bg-accent" style={{ width: "96%" }} />
                  </div>
                </div>

                <div className="rounded-2xl surface-soft p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-foreground">Mentorship Matches</p>
                      <p className="text-xs text-muted-foreground">This semester</p>
                    </div>
                    <p className="text-sm text-foreground">212</p>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-background">
                    <div className="h-2 rounded-full bg-primary" style={{ width: "72%" }} />
                  </div>
                </div>

                <div className="rounded-2xl surface-soft p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-foreground">New Alumni</p>
                      <p className="text-xs text-muted-foreground">Joined this week</p>
                    </div>
                    <p className="text-sm text-foreground">38</p>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-background">
                    <div className="h-2 rounded-full bg-accent" style={{ width: "64%" }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 pb-12">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-4 gap-4">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <Card
                    key={index}
                    className="p-6 glass-panel text-center transition-colors"
                  >
                    <div className="w-12 h-12 rounded-2xl accent-soft flex items-center justify-center mx-auto mb-3">
                      <Icon className="w-6 h-6 text-accent" />
                    </div>
                    <h3 className="text-base text-foreground mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>

        <footer className="p-6 border-t border-border">
          <div className="max-w-7xl mx-auto text-center">
            <p className="text-sm text-muted-foreground">
              © 2025 Uganda Christian University Alumni Office. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
