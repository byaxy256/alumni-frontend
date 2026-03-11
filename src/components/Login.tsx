// src/components/Login.tsx
import { useState } from 'react';
import { api } from '../api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { UcuBadgeLogo } from './UcuBadgeLogo';

// The props interface remains the same. It correctly expects a function from the parent.
interface LoginProps {
  onLoginSuccess: (user: any, token: string) => void;
  onBack: () => void;
  switchToSignup?: () => void;
}

/**
 * This rewritten Login component follows a best practice: it is a "dumb" component.
 * Its only job is to gather credentials, send them to the API, and report the result 
 * (success or failure) to its parent component (App.tsx).
 * 
 * It does NOT manage localStorage or the global user state itself. This prevents bugs
 * and ensures App.tsx is the single source of truth for authentication.
 */
export default function Login({ onLoginSuccess, onBack, switchToSignup }: LoginProps) {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [adminSecret, setAdminSecret] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [needsAdminSecret, setNeedsAdminSecret] = useState(false);

  const handleLogin = async () => {
    if (!emailOrPhone || !password) {
      toast.error('Please fill all fields');
      return;
    }
    if (needsAdminSecret && !adminSecret) {
      toast.error('Admin secret is required');
      return;
    }
    setLoading(true);

    try {
      const credential = emailOrPhone.trim();
      const normalizedCredential = credential.includes('@') ? credential.toLowerCase() : credential;
      const data = await api.login(normalizedCredential, password, adminSecret || undefined);
      console.log('Login response:', data);
      
      toast.success('Login successful');
      onLoginSuccess(data.user, data.token);
      setNeedsAdminSecret(false);

    } catch (err: any) {
      console.error('Login error', err);
      const errorMsg = err?.message || err?.response?.data?.error || 'Login failed';
      
      // Check if this is an admin secret error
      if (errorMsg?.includes('Admin secret required')) {
        setNeedsAdminSecret(true);
        toast.error('Admin secret required to login');
      } else {
        toast.error(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  // --- No changes are needed for the UI (JSX) ---
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-background via-[color:var(--hover-50)] to-[color:var(--accent-soft-16)] dark:from-background dark:via-[#1b131a] dark:to-[#181f32] p-4">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-primary/20 blur-[100px] dark:bg-primary/30" />
        <div className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-[color:var(--brand-hero-to)]/20 blur-[110px] dark:bg-[color:var(--brand-hero-to)]/35" />
        <div className="absolute top-1/3 left-1/2 h-60 w-60 -translate-x-1/2 rounded-full bg-accent/20 blur-[100px] dark:bg-accent/25" />
      </div>

      <Card className="relative w-full max-w-md border-white/25 dark:border-white/10 bg-white/70 dark:bg-[#1b141d]/78 backdrop-blur-2xl shadow-[0_30px_80px_rgba(0,0,0,0.22)] dark:shadow-[0_40px_100px_rgba(0,0,0,0.55)]">
        <CardHeader className="text-center relative">
          <button
            onClick={onBack}
            className="absolute left-6 top-6 p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg"
            title="Go back"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <UcuBadgeLogo className="w-16 h-16 mx-auto mb-4" />
          <CardTitle>Welcome Back</CardTitle>
          <CardDescription>Login to Alumni Aid</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div>
            <Label>Email or Phone</Label>
            <Input value={emailOrPhone} onChange={(e) => setEmailOrPhone(e.target.value)} placeholder="student@ucu.ac.ug or +256..." />
          </div>

          <div>
            <Label>Password</Label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {needsAdminSecret && (
            <div>
              <Label>Admin Secret</Label>
              <Input
                type="password"
                value={adminSecret}
                onChange={(e) => setAdminSecret(e.target.value)}
                placeholder="Required for first staff login"
              />
            </div>
          )}

          <Button onClick={handleLogin} className="w-full" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</Button>

          <p className="text-xs text-center text-gray-500">
            Don't have an account? <button onClick={switchToSignup} className="text-primary hover:underline">Sign up</button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
