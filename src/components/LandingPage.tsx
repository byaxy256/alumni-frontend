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
    <div className="min-h-screen relative bg-[#0b1a2f] text-white">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            'url(https://ucu.ac.ug/wp-content/uploads/2025/04/masters.jpg)',
          backgroundAttachment: 'fixed',
        }}
      />
      <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />
      <div className="absolute inset-0 bg-gradient-to-br from-[#0b1a2f]/85 via-[#0b1a2f]/75 to-[#143a5f]/75" />

      <div className="relative z-10 min-h-screen flex flex-col">
        <header className="px-6 py-4 border-b border-white/10">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#c79b2d] flex items-center justify-center">
                <GraduationCap className="w-7 h-7 text-[#0b1a2f]" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">Alumni Connect</h1>
                <p className="text-xs text-white/70">Uganda Christian University</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={onLogin}
              className="bg-white/10 border-white/30 text-white hover:bg-white/20"
            >
              Login
            </Button>
          </div>
        </header>

        <section className="flex-1 flex items-center justify-center px-6 py-16">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <Award className="w-4 h-4 text-[#c79b2d]" />
              <span className="text-sm text-white">Empowering Students, Connecting Alumni</span>
            </div>

            <h1 className="text-4xl md:text-6xl mb-6 leading-tight">
              Building Futures
              <br />
              <span className="text-[#c79b2d]">Together</span>
            </h1>

            <p className="text-lg md:text-xl text-white/85 mb-8 max-w-2xl mx-auto">
              A comprehensive platform connecting UCU alumni with current students
              through donations, mentorship, and financial support programs.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button
                size="lg"
                onClick={onGetStarted}
                className="bg-[#c79b2d] hover:bg-[#b78a22] text-[#0b1a2f] text-base px-8"
              >
                Get Started
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={onLogin}
                className="bg-white/10 border-white/30 text-white hover:bg-white/20 text-base px-8"
              >
                I have an account
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <p className="text-3xl text-white mb-1">2,500+</p>
                <p className="text-sm text-white/70">Students Supported</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <p className="text-3xl text-white mb-1">5,000+</p>
                <p className="text-sm text-white/70">Active Alumni</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <p className="text-3xl text-white mb-1">UGX 2B+</p>
                <p className="text-sm text-white/70">Total Disbursed</p>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 pb-16">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-4 gap-4">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <Card
                    key={index}
                    className="p-6 bg-white/10 backdrop-blur-sm border-white/20 text-center hover:bg-white/15 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mx-auto mb-3">
                      <Icon className="w-6 h-6 text-[#c79b2d]" />
                    </div>
                    <h3 className="text-base text-white mb-2">{feature.title}</h3>
                    <p className="text-sm text-white/70">{feature.description}</p>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        <footer className="p-6 border-t border-white/10">
          <div className="max-w-7xl mx-auto text-center">
            <p className="text-sm text-white/60">
              © 2025 Uganda Christian University Alumni Office. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
