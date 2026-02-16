import { Button } from './ui/button';
import { ArrowRight, Users, Zap, Shield, BookOpen, TrendingUp, GraduationCap } from 'lucide-react';
import { ThemeToggle } from './ui/ThemeToggle';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

export default function LandingPage({ onGetStarted, onLogin }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors">
      {/* Navigation */}
      <nav className="fixed w-full top-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-red-800 to-red-900 rounded-lg flex items-center justify-center shadow-md">
              <GraduationCap className="w-7 h-7 text-yellow-400" />
            </div>
            <div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">Alumni Circle</span>
              <p className="text-xs text-gray-600 dark:text-gray-400">Uganda Christian University</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button
              onClick={onLogin}
              variant="outline"
              className="text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Sign In
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-24 px-6 bg-gradient-to-br from-white via-red-50/30 to-yellow-50/20 dark:from-gray-900 dark:via-red-950/20 dark:to-yellow-950/10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block mb-6 px-5 py-2.5 bg-gradient-to-r from-red-100 to-yellow-100 dark:from-red-900/30 dark:to-yellow-900/30 rounded-full border border-red-200 dark:border-red-800">
              <span className="text-sm font-semibold text-red-800 dark:text-red-300">Join 5,000+ UCU Alumni</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
              Empowering Students,
              <br />
              <span className="bg-gradient-to-r from-red-700 to-yellow-600 dark:from-red-500 dark:to-yellow-400 bg-clip-text text-transparent">
                Connecting Alumni
              </span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-12 max-w-3xl mx-auto">
              A comprehensive platform connecting UCU alumni with current students through 
              financial support, mentorship programs, and community engagement.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={onGetStarted}
                size="lg"
                className="bg-gradient-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900 text-white text-base px-10 py-6 shadow-lg"
              >
                Get Started Free <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                onClick={onLogin}
                variant="outline"
                size="lg"
                className="border-2 border-red-700 dark:border-red-600 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 text-base px-10 py-6"
              >
                I have an account
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-3 gap-10 mt-20 max-w-4xl mx-auto">
            <div className="text-center p-6 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700">
              <p className="text-5xl font-bold bg-gradient-to-r from-red-700 to-yellow-600 bg-clip-text text-transparent mb-2">2,500+</p>
              <p className="text-gray-700 dark:text-gray-300 font-medium">Students Supported</p>
            </div>
            <div className="text-center p-6 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700">
              <p className="text-5xl font-bold bg-gradient-to-r from-red-700 to-yellow-600 bg-clip-text text-transparent mb-2">5,000+</p>
              <p className="text-gray-700 dark:text-gray-300 font-medium">Active Alumni</p>
            </div>
            <div className="text-center p-6 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700">
              <p className="text-5xl font-bold bg-gradient-to-r from-red-700 to-yellow-600 bg-clip-text text-transparent mb-2">UGX 2B+</p>
              <p className="text-gray-700 dark:text-gray-300 font-medium">Total Disbursed</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 bg-white dark:bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Everything You Need</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">Powerful features for the UCU community</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-8 bg-gradient-to-br from-red-50 to-white dark:from-red-950/20 dark:to-gray-800 rounded-2xl border border-red-100 dark:border-red-900/50 hover:shadow-xl transition-all">
              <div className="w-14 h-14 bg-gradient-to-br from-red-700 to-red-800 rounded-xl flex items-center justify-center mb-4 shadow-md">
                <Users className="w-7 h-7 text-yellow-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Alumni Network</h3>
              <p className="text-gray-600 dark:text-gray-400">Connect with thousands of UCU alumni worldwide</p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 bg-gradient-to-br from-yellow-50 to-white dark:from-yellow-950/20 dark:to-gray-800 rounded-2xl border border-yellow-100 dark:border-yellow-900/50 hover:shadow-xl transition-all">
              <div className="w-14 h-14 bg-gradient-to-br from-yellow-600 to-yellow-700 rounded-xl flex items-center justify-center mb-4 shadow-md">
                <BookOpen className="w-7 h-7 text-red-800" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Mentorship</h3>
              <p className="text-gray-600 dark:text-gray-400">Get guidance from experienced mentors in your field</p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 bg-gradient-to-br from-red-50 to-white dark:from-red-950/20 dark:to-gray-800 rounded-2xl border border-red-100 dark:border-red-900/50 hover:shadow-xl transition-all">
              <div className="w-14 h-14 bg-gradient-to-br from-red-700 to-red-800 rounded-xl flex items-center justify-center mb-4 shadow-md">
                <Zap className="w-7 h-7 text-yellow-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Financial Support</h3>
              <p className="text-gray-600 dark:text-gray-400">Access loans, grants, and emergency funding</p>
            </div>

            {/* Feature 4 */}
            <div className="p-8 bg-gradient-to-br from-yellow-50 to-white dark:from-yellow-950/20 dark:to-gray-800 rounded-2xl border border-yellow-100 dark:border-yellow-900/50 hover:shadow-xl transition-all">
              <div className="w-14 h-14 bg-gradient-to-br from-yellow-600 to-yellow-700 rounded-xl flex items-center justify-center mb-4 shadow-md">
                <TrendingUp className="w-7 h-7 text-red-800" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Career Growth</h3>
              <p className="text-gray-600 dark:text-gray-400">Track your progress and advance your career</p>
            </div>

            {/* Feature 5 */}
            <div className="p-8 bg-gradient-to-br from-red-50 to-white dark:from-red-950/20 dark:to-gray-800 rounded-2xl border border-red-100 dark:border-red-900/50 hover:shadow-xl transition-all">
              <div className="w-14 h-14 bg-gradient-to-br from-red-700 to-red-800 rounded-xl flex items-center justify-center mb-4 shadow-md">
                <Shield className="w-7 h-7 text-yellow-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Secure Platform</h3>
              <p className="text-gray-600 dark:text-gray-400">Bank-level security for all your transactions</p>
            </div>

            {/* Feature 6 */}
            <div className="p-8 bg-gradient-to-br from-yellow-50 to-white dark:from-yellow-950/20 dark:to-gray-800 rounded-2xl border border-yellow-100 dark:border-yellow-900/50 hover:shadow-xl transition-all">
              <div className="w-14 h-14 bg-gradient-to-br from-yellow-600 to-yellow-700 rounded-xl flex items-center justify-center mb-4 shadow-md">
                <GraduationCap className="w-7 h-7 text-red-800" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Student Success</h3>
              <p className="text-gray-600 dark:text-gray-400">Helping students achieve their academic goals</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-red-800 to-red-900 dark:from-red-900 dark:to-red-950">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-4xl font-bold mb-4">Ready to Join Our Community?</h2>
          <p className="text-lg text-red-100 mb-10">Start your journey with Alumni Circle today</p>
          <Button
            onClick={onGetStarted}
            size="lg"
            className="bg-yellow-500 hover:bg-yellow-600 text-red-900 text-base px-10 py-6 font-bold shadow-lg"
          >
            Create Free Account <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-gray-900 dark:bg-black text-white border-t border-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-red-800 to-red-900 rounded-lg flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-yellow-400" />
                </div>
                <h3 className="font-bold text-lg">Alumni Circle</h3>
              </div>
              <p className="text-gray-400 text-sm">Connecting alumni with students for mutual growth</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-yellow-400 transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-yellow-400 transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-yellow-400 transition-colors">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-yellow-400 transition-colors">About</a></li>
                <li><a href="#" className="hover:text-yellow-400 transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-yellow-400 transition-colors">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-yellow-400 transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-yellow-400 transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-yellow-400 transition-colors">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center">
            <p className="text-gray-400 text-sm">© 2025 Uganda Christian University Alumni Office. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
