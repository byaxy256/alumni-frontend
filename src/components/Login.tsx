// src/components/Login.tsx
import { useState, type KeyboardEvent } from 'react';
import { api } from '../api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { ArrowLeft, Eye, EyeOff, Lock, Mail, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { UcuBadgeLogo } from './UcuBadgeLogo';

interface LoginProps {
  onLoginSuccess: (user: any, token: string) => void;
  onBack: () => void;
  switchToSignup?: () => void;
}

export default function Login({ onLoginSuccess, onBack, switchToSignup }: LoginProps) {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [adminSecret, setAdminSecret] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [step, setStep] = useState<'credentials' | 'twoFactor'>('credentials');
  const [pendingLogin, setPendingLogin] = useState<{
    credential: string;
    password: string;
    adminSecret?: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [needsAdminSecret, setNeedsAdminSecret] = useState(false);

  const heroImage =
    'https://images.unsplash.com/photo-1523240798132-8757214e76aa?auto=format&fit=crop&w=2000&q=80';

  const handleCredentialStep = async () => {
    if (!emailOrPhone || !password) {
      toast.error('Please fill all fields');
      return;
    }

    if (needsAdminSecret && !adminSecret) {
      toast.error('Admin secret is required');
      return;
    }

    const credential = emailOrPhone.trim();
    const normalizedCredential = credential.includes('@')
      ? credential.toLowerCase()
      : credential;

    setPendingLogin({
      credential: normalizedCredential,
      password,
      adminSecret: adminSecret || undefined,
    });

    setStep('twoFactor');
    setTwoFactorCode('');

    try {
      await api.requestLogin2FA(normalizedCredential, adminSecret || undefined);
      toast.success('2FA code sent. Enter it to continue.');
    } catch (err: any) {
      if (err?.status === 404) {
        toast.info('Enter your authentication code to continue.');
      } else {
        const errorMsg = err?.message || 'Proceed with your 2FA code.';
        toast.info(errorMsg);
      }
    }
  };

  const handle2FAVerification = async () => {
    if (!pendingLogin) {
      toast.error('Please enter your credentials first');
      setStep('credentials');
      return;
    }

    if (!/^\d{6}$/.test(twoFactorCode.trim())) {
      toast.error('Enter a valid 6-digit verification code');
      return;
    }

    setLoading(true);
    try {
      const data = await api.loginWith2FA(
        pendingLogin.credential,
        pendingLogin.password,
        twoFactorCode.trim(),
        pendingLogin.adminSecret
      );

      toast.success('Login successful');
      onLoginSuccess(data.user, data.token);
      setNeedsAdminSecret(false);
      setStep('credentials');
      setPendingLogin(null);
      setTwoFactorCode('');
    } catch (err: any) {
      console.error('Login error', err);
      const errorMsg = err?.message || err?.response?.data?.error || 'Login failed';
      if (errorMsg?.includes('Admin secret required')) {
        setNeedsAdminSecret(true);
        setStep('credentials');
        toast.error('Admin secret required to login');
      } else {
        toast.error(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      void handleCredentialStep();
    }
  };

  const handleCodeKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      void handle2FAVerification();
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#0f1b2d] text-white" style={{ fontFamily: 'Manrope, Inter, system-ui, sans-serif' }}>
      {/* Back button */}
      <button
        onClick={onBack}
        aria-label="Go back"
        style={{
          position: 'absolute',
          top: '1.25rem',
          left: '1.25rem',
          zIndex: 30,
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '0.5rem 0.95rem',
          borderRadius: '9999px',
          border: '1px solid rgba(255,255,255,0.2)',
          background: 'rgba(13,22,38,0.45)',
          color: '#fff',
          fontSize: '0.85rem',
          cursor: 'pointer',
          backdropFilter: 'blur(8px)',
        }}
      >
        <ArrowLeft style={{ width: '1rem', height: '1rem' }} />
        Back
      </button>

      <div className="hidden lg:block" style={{ position: 'absolute', inset: 0 }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            width: '62%',
            backgroundImage: `linear-gradient(to bottom, rgba(10,17,28,0.15), rgba(10,17,28,0.55)), url('${heroImage}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(90deg, rgba(6,14,24,0.16) 0%, rgba(7,16,28,0.5) 38%, rgba(9,18,30,0.9) 63%, rgba(9,18,30,1) 100%)',
          }}
        />
      </div>

      <div className="block lg:hidden" style={{ position: 'absolute', inset: 0 }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `linear-gradient(180deg, rgba(8,15,24,0.55), rgba(8,15,24,0.9)), url('${heroImage}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      </div>

      <div
        style={{
          position: 'relative',
          zIndex: 5,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          padding: '5rem 1rem 2rem',
        }}
      >
        <div
          className="hidden lg:block"
          style={{
            position: 'absolute',
            left: '5.5%',
            bottom: '10%',
            maxWidth: '37rem',
          }}
        >
          <p
            style={{
              fontSize: '3.35rem',
              fontWeight: 700,
              color: '#ffffff',
              lineHeight: 1.12,
              letterSpacing: '-0.02em',
              textShadow: '0 8px 36px rgba(0,0,0,0.45)',
              marginBottom: '1.2rem',
              marginTop: 0,
            }}
          >
            Connect &amp; Empower
            <br />
            Our Alumni Community
          </p>
          <p
            style={{
              fontSize: '1.8rem',
              fontWeight: 500,
              color: 'rgba(255,255,255,0.92)',
              lineHeight: 1.3,
              margin: 0,
            }}
          >
            Access exclusive resources and opportunities for alumni.
          </p>
        </div>

        <div
          style={{
            width: '100%',
            maxWidth: '33rem',
            borderRadius: '2rem',
            border: '1px solid rgba(255,255,255,0.14)',
            background: 'linear-gradient(170deg, rgba(36,50,75,0.9) 0%, rgba(20,31,50,0.92) 58%, rgba(17,27,44,0.94) 100%)',
            boxShadow: '0 24px 80px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.1)',
            backdropFilter: 'blur(14px)',
            padding: '2rem 1.6rem 1.45rem',
            marginRight: '0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.72rem', marginBottom: '1.35rem' }}>
            <span style={{ width: '2.35rem', height: '2.35rem', display: 'inline-block' }}>
              <UcuBadgeLogo />
            </span>
            <span style={{ fontSize: '1.95rem', fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>
              Alumni{' '}
              <span style={{ fontWeight: 400, color: 'rgba(255,255,255,0.84)' }}>Platform</span>
            </span>
          </div>

          <h2 style={{ fontSize: '2.75rem', fontWeight: 700, color: '#fff', margin: '0 0 0.35rem', lineHeight: 1.05 }}>
            Welcome Back!
          </h2>
          <p style={{ fontSize: '1.12rem', color: 'rgba(255,255,255,0.72)', marginBottom: '1.35rem' }}>
            {step === 'credentials' ? 'Sign in to your account' : 'Enter your 2FA verification code'}
          </p>

          {step === 'credentials' ? (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div>
                  <Label style={{ display: 'block', marginBottom: '0.38rem', color: 'rgba(255,255,255,0.85)', fontSize: '0.95rem' }}>
                    Email
                  </Label>
                  <div style={{ position: 'relative' }}>
                    <Mail style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', width: '1rem', height: '1rem', color: 'rgba(255,255,255,0.5)' }} />
                    <Input
                      value={emailOrPhone}
                      onChange={(event) => setEmailOrPhone(event.target.value)}
                      onKeyDown={handlePasswordKeyDown}
                      placeholder="Enter your email"
                      style={{ height: '3.25rem', borderRadius: '0.82rem', border: '1px solid rgba(255,255,255,0.16)', background: 'rgba(10,18,33,0.65)', color: '#fff', paddingLeft: '2.65rem', fontSize: '1rem' }}
                      className="placeholder:text-white/35"
                    />
                  </div>
                </div>

                <div>
                  <Label style={{ display: 'block', marginBottom: '0.38rem', color: 'rgba(255,255,255,0.85)', fontSize: '0.95rem' }}>
                    Password
                  </Label>
                  <div style={{ position: 'relative' }}>
                    <Lock style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', width: '1rem', height: '1rem', color: 'rgba(255,255,255,0.5)' }} />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      onKeyDown={handlePasswordKeyDown}
                      placeholder="Enter your password"
                      style={{ height: '3.25rem', borderRadius: '0.82rem', border: '1px solid rgba(255,255,255,0.16)', background: 'rgba(10,18,33,0.65)', color: '#fff', paddingLeft: '2.65rem', paddingRight: '6.1rem', fontSize: '1rem' }}
                      className="placeholder:text-white/35"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      style={{ position: 'absolute', right: '2.95rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.62)' }}
                    >
                      {showPassword ? <EyeOff style={{ width: '1rem', height: '1rem' }} /> : <Eye style={{ width: '1rem', height: '1rem' }} />}
                    </button>
                    <button
                      type="button"
                      style={{ position: 'absolute', right: '0.84rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.76rem', color: 'rgba(255,255,255,0.58)' }}
                    >
                      Forgot Password?
                    </button>
                  </div>
                </div>

                {needsAdminSecret && (
                  <div>
                    <Label style={{ display: 'block', marginBottom: '0.38rem', color: 'rgba(255,255,255,0.85)', fontSize: '0.95rem' }}>
                      Admin Secret
                    </Label>
                    <Input
                      type="password"
                      value={adminSecret}
                      onChange={(event) => setAdminSecret(event.target.value)}
                      onKeyDown={handlePasswordKeyDown}
                      placeholder="Required for first staff login"
                      style={{ height: '3.25rem', borderRadius: '0.82rem', border: '1px solid rgba(255,255,255,0.16)', background: 'rgba(10,18,33,0.65)', color: '#fff', fontSize: '1rem' }}
                      className="placeholder:text-white/35"
                    />
                  </div>
                )}
              </div>

              <Button
                onClick={handleCredentialStep}
                disabled={loading}
                style={{ height: '3.15rem', width: '100%', borderRadius: '9999px', border: 'none', background: 'linear-gradient(90deg,#f35d2f 0%,#f8b52f 100%)', color: '#fff', fontSize: '1.7rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 10px 30px rgba(236,120,44,0.4)', marginTop: '0.95rem' }}
              >
                Continue
              </Button>
            </>
          ) : (
            <>
              <div style={{ marginBottom: '0.6rem' }}>
                <Label style={{ display: 'block', marginBottom: '0.45rem', color: 'rgba(255,255,255,0.84)', fontSize: '0.95rem' }}>
                  Verification Code
                </Label>
                <div style={{ position: 'relative' }}>
                  <ShieldCheck style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', width: '1rem', height: '1rem', color: 'rgba(255,255,255,0.55)' }} />
                  <Input
                    value={twoFactorCode}
                    onChange={(event) => setTwoFactorCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                    onKeyDown={handleCodeKeyDown}
                    inputMode="numeric"
                    placeholder="Enter 6-digit code"
                    style={{ height: '3.25rem', borderRadius: '0.82rem', border: '1px solid rgba(255,255,255,0.16)', background: 'rgba(10,18,33,0.65)', color: '#fff', paddingLeft: '2.65rem', letterSpacing: '0.22em', fontSize: '1.05rem' }}
                    className="placeholder:text-white/35"
                  />
                </div>
                <p style={{ marginTop: '0.6rem', fontSize: '0.83rem', color: 'rgba(255,255,255,0.62)' }}>
                  Enter the code from your authenticator app or email.
                </p>
              </div>

              <Button
                onClick={handle2FAVerification}
                disabled={loading}
                style={{ height: '3.15rem', width: '100%', borderRadius: '9999px', border: 'none', background: 'linear-gradient(90deg,#f35d2f 0%,#f8b52f 100%)', color: '#fff', fontSize: '1.3rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 10px 30px rgba(236,120,44,0.4)', marginTop: '0.45rem' }}
              >
                {loading ? 'Verifying…' : 'Sign In'}
              </Button>

              <button
                type="button"
                onClick={() => setStep('credentials')}
                style={{ marginTop: '0.7rem', width: '100%', background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: '3px' }}
              >
                Back to credentials
              </button>
            </>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', margin: '1.15rem 0 1rem', color: 'rgba(255,255,255,0.4)' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.16)' }} />
            <span style={{ fontSize: '0.82rem' }}>or</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.16)' }} />
          </div>

          <div>
            <button
              type="button"
              onClick={() => toast.info('Google sign-in is not configured yet.')}
              style={{ height: '3.15rem', width: '100%', borderRadius: '0.82rem', border: '1px solid rgba(255,255,255,0.22)', background: 'rgba(10,18,33,0.55)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', fontSize: '1.02rem', cursor: 'pointer' }}
            >
              <span style={{ width: '1.15rem', height: '1.15rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden="true">
                  <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.651 32.657 29.24 36 24 36c-6.627 0-12-5.373-12-12S17.373 12 24 12c3.059 0 5.851 1.154 7.966 3.034l5.657-5.657C34.067 6.054 29.292 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.651-.389-3.917Z" />
                  <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.851 1.154 7.966 3.034l5.657-5.657C34.067 6.054 29.292 4 24 4c-7.682 0-14.361 4.337-17.694 10.691Z" />
                  <path fill="#4CAF50" d="M24 44c5.19 0 9.881-1.989 13.409-5.223l-6.19-5.238C29.147 35.091 26.715 36 24 36c-5.219 0-9.617-3.317-11.283-7.946l-6.522 5.025C9.497 39.556 16.227 44 24 44Z" />
                  <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.05 12.05 0 0 1-4.084 5.539l6.19 5.238C36.971 39.17 44 34 44 24c0-1.341-.138-2.651-.389-3.917Z" />
                </svg>
              </span>
              Continue with Google
            </button>
          </div>

          <p style={{ marginTop: '1rem', textAlign: 'center', fontSize: '1rem', color: 'rgba(255,255,255,0.72)' }}>
            New to the platform?{' '}
            <button
              onClick={switchToSignup}
              style={{ background: 'none', border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: '3px' }}
            >
              Create an account
            </button>
          </p>

          <p style={{ marginTop: '1.1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.12)', textAlign: 'center', fontSize: '0.84rem', color: 'rgba(255,255,255,0.45)' }}>
            © 2026 Alumni Platform · Terms · Privacy
          </p>
        </div>
      </div>
    </div>
  );
}
