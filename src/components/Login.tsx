// src/components/Login.tsx
import { useState, type KeyboardEvent, type ReactNode } from 'react';
import axios from 'axios';
import { signInWithPopup } from 'firebase/auth';
import { api, API_BASE } from '../api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { ArrowLeft, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { auth, googleProvider, hasFirebaseEnv } from '../lib/firebase';

interface LoginProps {
  onLoginSuccess: (user: any, token: string) => void;
  onBack: () => void;
  switchToSignup?: () => void;
}

function FieldShell({
  icon,
  title,
  children,
  trailing,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
  trailing?: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-[20px] border border-white/12 bg-[#1d2736]/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4 text-white/84">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/8 text-white/78">
            {icon}
          </div>
          <span className="text-[1.08rem] font-medium">{title}</span>
        </div>
        {trailing}
      </div>
      <div className="px-4 py-3">{children}</div>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden="true">
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.651 32.657 29.24 36 24 36c-6.627 0-12-5.373-12-12S17.373 12 24 12c3.059 0 5.851 1.154 7.966 3.034l5.657-5.657C34.067 6.054 29.292 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.651-.389-3.917Z" />
      <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.851 1.154 7.966 3.034l5.657-5.657C34.067 6.054 29.292 4 24 4c-7.682 0-14.361 4.337-17.694 10.691Z" />
      <path fill="#4CAF50" d="M24 44c5.19 0 9.881-1.989 13.409-5.223l-6.19-5.238C29.147 35.091 26.715 36 24 36c-5.219 0-9.617-3.317-11.283-7.946l-6.522 5.025C9.497 39.556 16.227 44 24 44Z" />
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.05 12.05 0 0 1-4.084 5.539l6.19 5.238C36.971 39.17 44 34 44 24c0-1.341-.138-2.651-.389-3.917Z" />
    </svg>
  );
}

function PlatformMark() {
  return (
    <svg viewBox="0 0 56 56" className="h-11 w-11 text-white" aria-hidden="true" fill="none">
      <path d="M13.5 40.5L27.9 14h6L19.5 40.5h-6Z" fill="currentColor" opacity="0.98" />
      <path d="M24.6 31.4L32.5 17.5l8.2 5.3-8 13.8h-8.1Z" fill="currentColor" opacity="0.84" />
      <path d="M23.2 34.2h9.8L40.9 46h-8.2l-4.7-6.7L23.4 46h-8.1l7.9-11.8Z" fill="currentColor" opacity="0.96" />
    </svg>
  );
}

export default function Login({ onLoginSuccess, onBack, switchToSignup }: LoginProps) {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [adminSecret, setAdminSecret] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [needsAdminSecret, setNeedsAdminSecret] = useState(false);

  const heroImage =
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
      const normalizedCredential = credential.includes('@')
        ? credential.toLowerCase()
        : credential;
      const data = await api.login(normalizedCredential, password, adminSecret || undefined);

      toast.success('Login successful');
      onLoginSuccess(data.user, data.token);
      setNeedsAdminSecret(false);
    } catch (err: any) {
      console.error('Login error', err);
      const errorMsg = err?.message || err?.response?.data?.error || 'Login failed';

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

  return (
    <div className="min-h-screen bg-[#141d29] text-white">
      <div className="relative mx-auto min-h-screen max-w-[1600px] overflow-hidden bg-[#182131] lg:grid lg:grid-cols-[1.12fr_0.88fr]">
        <section
          className="relative hidden min-h-screen overflow-hidden lg:block"
          style={{
            backgroundImage: `linear-gradient(180deg, rgba(20, 26, 38, 0.28), rgba(14, 20, 30, 0.72)), url('${heroImage}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(243,104,46,0.32),transparent_25%),linear-gradient(180deg,rgba(18,23,34,0.08),rgba(18,23,34,0.25))]" />
          <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#182131] via-[#182131]/55 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-44 bg-gradient-to-t from-[#111827]/80 via-[#111827]/24 to-transparent" />

          <div className="relative z-10 flex h-full items-end px-12 pb-24 xl:px-16 xl:pb-28">
            <div className="max-w-[35rem]">
              <h1 className="text-[4rem] font-semibold leading-[1.04] tracking-[-0.065em] text-white xl:text-[4.35rem]">
                Connect &amp; Empower
                <br />
                Our Alumni Community
              </h1>
              <p className="mt-7 max-w-[30rem] text-[1.2rem] leading-8 text-white/78">
                Access exclusive resources and opportunities for alumni.
              </p>
            </div>
          </div>
        </section>

        <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#1d2737] px-5 py-8 sm:px-6 lg:px-0">
          <div className="absolute inset-0 bg-[linear-gradient(180deg,#263144_0%,#1d2737_48%,#182131_100%)]" />
          <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:30px_30px]" />

          <div className="relative z-10 flex w-full items-center justify-center lg:justify-end lg:pr-16 xl:pr-24">
            <Card className="relative w-full max-w-[38.5rem] gap-0 overflow-hidden rounded-[32px] border border-white/12 bg-[linear-gradient(180deg,rgba(52,63,82,0.94)_0%,rgba(31,40,56,0.98)_100%)] text-white shadow-[0_34px_90px_rgba(5,8,16,0.48)] backdrop-blur-xl lg:translate-x-[-1.2rem]">
              <div className="absolute inset-x-0 top-0 h-px bg-white/12" />

              <CardHeader className="space-y-0 px-8 pt-8 sm:px-11 sm:pt-10">
                <button
                  onClick={onBack}
                  className="absolute left-5 top-5 rounded-full p-2 text-white/72 transition hover:bg-white/8 hover:text-white lg:hidden"
                  title="Go back"
                  aria-label="Go back"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>

                <div className="flex items-center gap-4 text-left">
                  <PlatformMark />
                  <div className="text-[1.9rem] leading-none tracking-[-0.05em] text-white">
                    <span className="font-semibold">Alumni</span>{' '}
                    <span className="font-normal text-white/82">Platform</span>
                  </div>
                </div>

                <div className="pt-14 text-left sm:pt-16">
                  <CardTitle className="text-[3rem] font-semibold tracking-[-0.05em] text-white sm:text-[3.35rem]">
                    Welcome Back!
                  </CardTitle>
                  <CardDescription className="mt-3 text-[1.22rem] text-white/68">
                    Sign in to your account
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent className="space-y-5 px-8 pb-8 pt-8 sm:px-11 sm:pb-10">
                <FieldShell icon={<Mail className="h-[18px] w-[18px]" />} title="Email">
                  <Input
                    value={emailOrPhone}
                    onChange={(e) => setEmailOrPhone(e.target.value)}
                    onKeyDown={handlePasswordKeyDown}
                    placeholder="Enter your email or phone"
                    className="h-12 border-0 bg-transparent px-1 text-base text-white placeholder:text-white/36 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </FieldShell>

                <FieldShell
                  icon={<LockKeyhole className="h-[18px] w-[18px]" />}
                  title="Password"
                  trailing={
                    <button type="button" className="text-sm text-white/46 transition hover:text-white/80">
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
                      className="h-12 border-0 bg-transparent px-1 pr-12 text-base text-white placeholder:text-white/36 focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-0 top-1/2 -translate-y-1/2 rounded-full p-2 text-white/52 transition hover:bg-white/8 hover:text-white/82"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </FieldShell>

                {needsAdminSecret && (
                  <FieldShell icon={<ShieldCheck className="h-[18px] w-[18px]" />} title="Admin Secret">
                    <Input
                      type="password"
                      value={adminSecret}
                      onChange={(e) => setAdminSecret(e.target.value)}
                      placeholder="Required for first staff login"
                      className="h-12 border-0 bg-transparent px-1 text-base text-white placeholder:text-white/36 focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                  </FieldShell>
                )}

                <Button
                  onClick={handleLogin}
                  disabled={loading}
                  className="mt-2 h-[4.35rem] w-full rounded-full border-0 bg-[linear-gradient(90deg,#f15b2b_0%,#ffba2e_100%)] text-[1.22rem] font-semibold text-white shadow-[0_18px_36px_rgba(242,103,44,0.24)] hover:brightness-105"
                >
                  {loading ? 'Signing In...' : 'Sign In'}
                </Button>

                <div className="flex items-center gap-4 py-2">
                  <div className="h-px flex-1 bg-white/14" />
                  <span className="text-lg text-white/62">or</span>
                  <div className="h-px flex-1 bg-white/14" />
                </div>

                <Button
                  variant="outline"
                  disabled={loading || !hasFirebaseEnv}
                  onClick={handleGoogleLogin}
                  className="h-[4.15rem] w-full rounded-[18px] border-white/12 bg-[#1a2434] text-[1.1rem] font-medium text-white hover:bg-[#202c3f] hover:text-white"
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
                    className="text-[1.08rem] font-semibold text-white transition hover:text-[#ffbe53]"
                  >
                    Create an account
                  </button>
                </div>

                <div className="border-t border-white/10 pt-7 text-center text-sm text-white/42">
                  <p>© 2026 Alumni Platform · Terms · Privacy</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}
