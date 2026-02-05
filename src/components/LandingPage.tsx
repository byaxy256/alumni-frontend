import { Button } from './ui/button';
import { 
  GraduationCap, 
  Award
} from 'lucide-react';
import { ThemeToggle } from './ui/ThemeToggle';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

export default function LandingPage({ onGetStarted, onLogin }: LandingPageProps) {
  return (
    <div className="min-h-screen landing-shell relative overflow-hidden">
      <div className="landing-orb blue" />
      <div className="landing-orb gold" />
      <div className="landing-orb teal" />

      <div className="relative z-10 min-h-screen flex flex-col">
        <header className="p-5">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl accent-soft flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h1 className="text-lg text-foreground">Alumni Circle</h1>
                <p className="text-xs text-muted-foreground">Uganda Christian University</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Button variant="outline" onClick={onLogin} className="btn-glass">
                Login
              </Button>
            </div>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center px-5 py-10">
          <div className="max-w-xl w-full mx-auto text-center">
            <div className="inline-flex items-center gap-2 glass-panel px-4 py-2 rounded-full mb-6">
              <Award className="w-4 h-4 text-accent" />
              <span className="text-sm text-foreground">Empowering Students, Connecting Alumni</span>
            </div>

            <h1 className="text-4xl md:text-5xl text-foreground mb-4 leading-tight">
              Alumni Circle
            </h1>
            <p className="text-base md:text-lg text-muted-foreground mb-8">
              Support students. Stay connected. Grow together.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
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
