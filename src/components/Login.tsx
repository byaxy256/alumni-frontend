// src/components/Login.tsx
import { useState } from 'react';
import { api } from '../api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { ArrowLeft, Eye, EyeOff, Lock, Mail } from 'lucide-react';
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
  const heroImage = 'https://images.unsplash.com/photo-1523240798132-8757214e76aa?auto=format&fit=crop&w=1800&q=80';

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

  return (
    <div className="min-h-screen bg-[#0a1424] p-0 md:p-4">
      <button
        onClick={onBack}
        className="absolute top-4 left-4 z-20 flex items-center gap-2 rounded-lg bg-black/35 px-3 py-2 text-white backdrop-blur hover:bg-black/50"
        title="Go back"
        aria-label="Go back"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm">Back</span>
      </button>

      <div className="mx-auto flex min-h-screen max-w-[1520px] overflow-hidden rounded-none md:min-h-[92vh] md:rounded-[28px] border border-white/10 bg-[#111827] shadow-[0_20px_90px_rgba(0,0,0,0.45)]">
        <section
          className="relative hidden md:flex md:w-[68%] lg:w-[70%]"
          style={{
            backgroundImage: `linear-gradient(180deg, rgba(8,14,28,0.12) 0%, rgba(8,14,28,0.24) 36%, rgba(8,14,28,0.58) 100%), url('${heroImage}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center center'
          }}
        >
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#06101c]/30 via-transparent to-[#050c17]/24" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[50%] bg-gradient-to-t from-[#050814]/92 via-[#050814]/46 to-transparent" />
          <div className="pointer-events-none absolute bottom-0 left-0 h-56 w-56 rounded-full bg-[#ef6d3b]/24 blur-3xl" />

          <div className="relative z-10 flex w-full items-end justify-center px-10 pb-16 text-center text-white lg:px-16 lg:pb-24">
            <div className="max-w-[760px]" style={{ fontFamily: 'Manrope, sans-serif' }}>
              <p className="text-lg font-medium tracking-[0.01em] text-white/96 lg:text-[1.4rem]">
                Uganda Christian University Alumni
              </p>
              <h2 className="mt-4 text-[3.2rem] font-extrabold leading-[1.02] tracking-tight text-white drop-shadow-[0_10px_24px_rgba(0,0,0,0.75)] lg:text-[4.8rem]">
                Connect & Empower
                <br />
                Our Alumni Community
              </h2>
            </div>
          </div>
        </section>

        <section className="relative flex w-full items-center justify-center bg-[radial-gradient(120%_100%_at_50%_0%,#2d3e58_0%,#18263b_42%,#101827_100%)] p-6 sm:p-8 md:w-[32%] lg:w-[30%]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_16%,rgba(255,255,255,0.05),transparent_30%),radial-gradient(circle_at_82%_82%,rgba(255,255,255,0.04),transparent_24%)]" />
          <div className="pointer-events-none absolute h-[88%] w-[88%] rounded-[36px] border border-white/8 bg-white/[0.03] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]" />

          <div className="relative w-full max-w-[460px] rounded-[32px] border border-white/18 bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.07))] p-6 text-white backdrop-blur-2xl shadow-[0_24px_70px_rgba(0,0,0,0.46)] sm:p-8 before:pointer-events-none before:absolute before:inset-0 before:rounded-[32px] before:border before:border-white/8">
            <div className="mb-7 flex items-center gap-3">
              <UcuBadgeLogo className="h-8 w-8" />
              <p className="text-[1.7rem] font-semibold tracking-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>
                Alumni <span className="font-medium text-white/90">Platform</span>
              </p>
            </div>

            <h1 className="text-[2.45rem] font-semibold tracking-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>Welcome Back!</h1>
            <p className="mt-2 text-[1.05rem] text-white/75">Sign in to your account</p>

            <div className="mt-7 space-y-4">
              <div>
                <Label className="mb-2 block text-white/85">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/65" />
                  <Input
                    value={emailOrPhone}
                    onChange={(e) => setEmailOrPhone(e.target.value)}
                    placeholder="Enter your email"
                    className="h-12 rounded-xl border-white/20 bg-[#0f1b30]/72 pl-10 text-white placeholder:text-white/45"
                  />
                </div>
              </div>

              <div>
                <Label className="mb-2 block text-white/85">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/65" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="h-12 rounded-xl border-white/20 bg-[#0f1b30]/72 pl-10 pr-24 text-white placeholder:text-white/45"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-12 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/65 hover:text-white/85">
                    Forgot?
                  </button>
                </div>
              </div>

              {needsAdminSecret && (
                <div>
                  <Label className="mb-2 block text-white/85">Admin Secret</Label>
                  <Input
                    type="password"
                    value={adminSecret}
                    onChange={(e) => setAdminSecret(e.target.value)}
                    placeholder="Required for first staff login"
                    className="h-12 rounded-xl border-white/20 bg-[#0f1b30]/72 text-white placeholder:text-white/45"
                  />
                </div>
              )}

              <Button
                onClick={handleLogin}
                disabled={loading}
                className="h-12 w-full rounded-full border-0 bg-gradient-to-r from-[#f06b3b] to-[#f2a72b] text-base font-semibold text-white shadow-[0_8px_24px_rgba(245,128,52,0.45)] hover:brightness-105"
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>
            </div>

            <div className="my-5 flex items-center gap-3 text-white/65">
              <div className="h-px flex-1 bg-white/20" />
              <span>or</span>
              <div className="h-px flex-1 bg-white/20" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => toast.info('Google sign-in is not configured for this build yet.')}
                className="flex h-12 items-center justify-center gap-2 rounded-xl border border-white/25 bg-[#0f1b30]/65 text-white transition hover:bg-[#172844]"
              >
                <span className="text-lg font-semibold leading-none text-[#fbbc05]">G</span>
                <span className="text-sm">Google</span>
              </button>
              <button
                type="button"
                onClick={() => toast.info('Apple sign-in is not configured for this build yet.')}
                className="flex h-12 items-center justify-center gap-2 rounded-xl border border-white/25 bg-[#0f1b30]/65 text-white transition hover:bg-[#172844]"
              >
                <span className="text-base"></span>
                <span className="text-sm">Apple</span>
              </button>
            </div>

            <p className="mt-6 text-center text-white/75">
              New to the platform?{' '}
              <button onClick={switchToSignup} className="font-semibold text-white hover:underline">
                Create an account
              </button>
            </p>

            <div className="mt-6 border-t border-white/15 pt-5 text-center text-xs text-white/55">
              © 2026 Alumni Platform · Terms · Privacy
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
