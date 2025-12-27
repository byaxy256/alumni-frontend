import { Button } from './ui/button';
import { Card } from './ui/card';
import { GraduationCap, Heart, Users, TrendingUp, Shield, Award } from 'lucide-react';

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
    <div className="min-h-screen bg-gradient-to-br from-primary to-[#1a4d7a] relative overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-10"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1608485439523-25b28d982428?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1bml2ZXJzaXR5JTIwc3R1ZGVudHMlMjBncmFkdWF0aW9ufGVufDF8fHx8MTc2MjY1NDc4MHww&ixlib=rb-4.1.0&q=80&w=1080)',
        }}
      ></div>

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="p-6">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center">
                <GraduationCap className="w-7 h-7 text-accent-foreground" />
              </div>
              <div>
                <h1 className="text-xl text-white">Alumni Connect</h1>
                <p className="text-xs text-white/80">Uganda Christian University</p>
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

        {/* Hero Section */}
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <Award className="w-4 h-4 text-accent" />
              <span className="text-sm text-white">Empowering Students, Connecting Alumni</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl text-white mb-6">
              Building Futures<br />
              <span className="text-accent">Together</span>
            </h1>
            
            <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              A comprehensive platform connecting UCU alumni with current students through donations, 
              mentorship, and financial support programs.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button 
                size="lg" 
                onClick={onGetStarted}
                className="bg-accent hover:bg-accent/90 text-accent-foreground text-base px-8"
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

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <p className="text-3xl text-white mb-1">2,500+</p>
                <p className="text-sm text-white/80">Students Supported</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <p className="text-3xl text-white mb-1">5,000+</p>
                <p className="text-sm text-white/80">Active Alumni</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <p className="text-3xl text-white mb-1">UGX 2B+</p>
                <p className="text-sm text-white/80">Total Disbursed</p>
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="px-6 pb-12">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-4 gap-4">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <Card 
                    key={index} 
                    className="p-6 bg-white/10 backdrop-blur-sm border-white/20 text-center hover:bg-white/15 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center mx-auto mb-3">
                      <Icon className="w-6 h-6 text-accent" />
                    </div>
                    <h3 className="text-base text-white mb-2">{feature.title}</h3>
                    <p className="text-sm text-white/70">{feature.description}</p>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
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
