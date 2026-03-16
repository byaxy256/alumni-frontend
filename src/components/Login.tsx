// src/components/Login.tsx
import { useState, type KeyboardEvent, type ReactNode } from 'react';
import axios from 'axios';
import { signInWithPopup } from 'firebase/auth';
import { api } from '../api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { ArrowLeft, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE } from '../api';
import { auth, googleProvider, hasFirebaseEnv } from '../lib/firebase';
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
  const loginHeroImage =
    'https://ucu.ac.ug/wp-content/uploads/2024/10/WhatsApp-Image-2024-10-25-at-11.38.09-AM.jpeg';

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

  const handleGoogleLogin = async () => {
    if (!hasFirebaseEnv) {
      toast.error('Google sign-in is not configured. Missing Firebase frontend environment variables.');
      return;
    }

    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      const res = await axios.post(`${API_BASE}/auth/google`, { idToken });
      toast.success('Login successful');
      onLoginSuccess(res.data.user, res.data.token);
    } catch (err: any) {
      console.error('Google login error', err);
      const errorMsg = err?.response?.data?.error || err?.message || 'Google login failed';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      void handleLogin();
    }
  };

  const FormFieldShell = ({
    icon,
    title,
    children,
    trailing,
  }: {
    icon: ReactNode;
    title: string;
    children: ReactNode;
    trailing?: ReactNode;
  }) => (
    <div className="rounded-[20px] border border-white/12 bg-white/[0.035] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4 text-white/86">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/8 text-white/80">
            {icon}
          </div>
          <span className="text-[1.08rem] font-medium">{title}</span>
        </div>
        {trailing}
      </div>
      <div className="px-4 py-3">{children}</div>
    </div>
  );

  const GoogleMark = () => (
    <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden="true">
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.651 32.657 29.24 36 24 36c-6.627 0-12-5.373-12-12S17.373 12 24 12c3.059 0 5.851 1.154 7.966 3.034l5.657-5.657C34.067 6.054 29.292 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.651-.389-3.917Z" />
      <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.851 1.154 7.966 3.034l5.657-5.657C34.067 6.054 29.292 4 24 4c-7.682 0-14.361 4.337-17.694 10.691Z" />
      <path fill="#4CAF50" d="M24 44c5.19 0 9.881-1.989 13.409-5.223l-6.19-5.238C29.147 35.091 26.715 36 24 36c-5.219 0-9.617-3.317-11.283-7.946l-6.522 5.025C9.497 39.556 16.227 44 24 44Z" />
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.05 12.05 0 0 1-4.084 5.539l6.19 5.238C36.971 39.17 44 34 44 24c0-1.341-.138-2.651-.389-3.917Z" />
    </svg>
  );

  return (
    <div className="min-h-screen bg-[#10192a] px-0 py-0 text-white lg:px-6 lg:py-6">
      <div className="mx-auto grid min-h-screen max-w-[1500px] overflow-hidden bg-[#121b2d] lg:min-h-[940px] lg:grid-cols-[1.08fr_0.92fr] lg:rounded-[34px] lg:border lg:border-white/8 lg:shadow-[0_28px_90px_rgba(5,11,22,0.45)]">
        <section
          className="relative hidden min-h-[940px] overflow-hidden lg:flex"
          style={{
            backgroundImage: `linear-gradient(180deg, rgba(18, 24, 36, 0.3), rgba(14, 20, 31, 0.74)), url('${loginHeroImage}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(247,126,56,0.32),transparent_28%),radial-gradient(circle_at_top_right,rgba(255,255,255,0.14),transparent_30%)]" />
          <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-[#111827]/88 via-[#111827]/28 to-transparent" />
          <div className="relative z-10 flex w-full items-end p-10 xl:p-14">
            <div className="max-w-[30rem]">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-white/64">Uganda Christian University</p>
              <h1 className="text-5xl font-semibold leading-[1.08] tracking-[-0.04em] text-white xl:text-[4.2rem]">
                Connect and empower our alumni community
              </h1>
              <p className="mt-6 max-w-xl text-xl leading-8 text-white/78">
                Access mentorship, giving, news, and student support in one modern UCU alumni platform.
              </p>
            </div>
          </div>
        </section>

        <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[linear-gradient(180deg,#172235_0%,#111a29_100%)] px-4 py-8 sm:px-6 lg:min-h-[940px] lg:px-10">
          <div className="absolute inset-0 opacity-70">
            <div className="absolute inset-y-0 left-0 w-px bg-white/8 lg:hidden" />
            <div className="absolute inset-x-10 top-0 h-px bg-white/8" />
            <div className="absolute right-0 top-0 h-full w-[1px] bg-white/5" />
          </div>

          <Card className="relative w-full max-w-[39rem] rounded-[30px] border-white/10 bg-[linear-gradient(180deg,rgba(51,63,86,0.92)_0%,rgba(33,42,61,0.94)_100%)] text-white shadow-[0_34px_80px_rgba(0,0,0,0.4)] backdrop-blur-xl">
            <CardHeader className="space-y-0 px-8 pt-8 sm:px-10 sm:pt-10">
              <button
                onClick={onBack}
                className="absolute left-6 top-6 rounded-full p-2 text-white/72 transition hover:bg-white/8 hover:text-white"
                title="Go back"
                aria-label="Go back"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-3">
                <UcuBadgeLogo className="h-12 w-12 rounded-xl border-white/12 bg-white/6 p-1" imageClassName="rounded-lg object-cover" />
                <div className="text-left">
                  <div className="text-[1.9rem] leading-none tracking-[-0.05em] text-white">
                    <span className="font-semibold">Alumni</span>{' '}
                    <span className="font-normal text-white/84">Platform</span>
                  </div>
                  <p className="mt-1 text-sm text-white/54">Alumni Circle</p>
                </div>
              </div>

              <div className="pt-12 text-left">
                <CardTitle className="text-[2.65rem] font-semibold tracking-[-0.04em] text-white">
                  Welcome Back!
                </CardTitle>
                <CardDescription className="mt-3 text-[1.15rem] text-white/66">
                  Sign in to your account
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-5 px-8 pb-8 pt-8 sm:px-10 sm:pb-10">
              <FormFieldShell icon={<Mail className="h-4.5 w-4.5" />} title="Email">
                <Input
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                  placeholder="Enter your email or phone"
                  className="h-12 border-0 bg-transparent px-1 text-base text-white placeholder:text-white/38 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </FormFieldShell>

              <FormFieldShell
                icon={<LockKeyhole className="h-4.5 w-4.5" />}
                title="Password"
                trailing={
                  <button type="button" className="text-sm text-white/48 transition hover:text-white/80">
                    Forgot Password?
                  </button>
                }
              >
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={handlePasswordKeyDown}
                    placeholder="Enter your password"
                    className="h-12 border-0 bg-transparent px-1 pr-12 text-base text-white placeholder:text-white/38 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 rounded-full p-2 text-white/52 transition hover:bg-white/7 hover:text-white/80"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </FormFieldShell>

              {needsAdminSecret && (
                <FormFieldShell icon={<ShieldCheck className="h-4.5 w-4.5" />} title="Admin Secret">
                  <Input
                    type="password"
                    value={adminSecret}
                    onChange={(e) => setAdminSecret(e.target.value)}
                    placeholder="Required for first staff login"
                    className="h-12 border-0 bg-transparent px-1 text-base text-white placeholder:text-white/38 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </FormFieldShell>
              )}

              <Button
                onClick={handleLogin}
                disabled={loading}
                className="h-16 w-full rounded-full border-0 bg-[linear-gradient(90deg,#f2672c_0%,#ffb62e_100%)] text-[1.2rem] font-semibold text-white shadow-[0_18px_36px_rgba(242,103,44,0.24)] hover:brightness-105"
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>

              <div className="flex items-center gap-4 py-1">
                <div className="h-px flex-1 bg-white/14" />
                <span className="text-lg text-white/62">or</span>
                <div className="h-px flex-1 bg-white/14" />
              </div>

              <Button
                variant="outline"
                disabled={loading || !hasFirebaseEnv}
                onClick={handleGoogleLogin}
                className="h-16 w-full rounded-[18px] border-white/12 bg-[#182233] text-[1.12rem] font-medium text-white hover:bg-[#1f2b40] hover:text-white"
              >
                <GoogleMark />
                Continue with Google
              </Button>

              {!hasFirebaseEnv && (
                <p className="text-center text-sm text-amber-300/90">
                  Google sign-in is unavailable because Firebase env vars are missing.
                </p>
              )}

              <div className="space-y-2 pt-2 text-center">
                <p className="text-base text-white/58">New to the platform?</p>
                <button
                  type="button"
                  onClick={() => switchToSignup?.()}
                  className="text-[1.08rem] font-semibold text-white transition hover:text-[#ffbc4f]"
                >
                  Create an account
                </button>
              </div>

              <div className="border-t border-white/10 pt-6 text-center text-sm text-white/44">
                <p>© 2026 Alumni Platform · Terms · Privacy</p>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
