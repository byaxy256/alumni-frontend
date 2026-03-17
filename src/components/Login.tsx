// src/components/Login.tsx
import { useState } from 'react';
import { api } from '../api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { ArrowLeft, Eye, EyeOff, Lock, Mail } from 'lucide-react';
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
  const [loading, setLoading] = useState(false);
  const [needsAdminSecret, setNeedsAdminSecret] = useState(false);

  const heroImage =
    'https://images.unsplash.com/photo-1523240798132-8757214e76aa?auto=format&fit=crop&w=1800&q=80';

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
      console.log('Login response:', data);
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

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        minHeight: '100vh',
        width: '100%',
        overflow: 'hidden',
        background: '#0b1a2e',
        fontFamily: 'Manrope, Inter, system-ui, sans-serif',
      }}
    >
      {/* Back button */}
      <button
        onClick={onBack}
        aria-label="Go back"
        style={{
          position: 'absolute',
          top: '1rem',
          left: '1rem',
          zIndex: 30,
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '0.45rem 0.85rem',
          borderRadius: '0.6rem',
          border: 'none',
          background: 'rgba(0,0,0,0.45)',
          color: '#fff',
          fontSize: '0.85rem',
          cursor: 'pointer',
          backdropFilter: 'blur(6px)',
        }}
      >
        <ArrowLeft style={{ width: '1rem', height: '1rem' }} />
        Back
      </button>

      {/* LEFT PANEL — hero image (62%, desktop only) */}
      <div
        className="login-left"
        style={{
          position: 'relative',
          display: 'none',
          flexDirection: 'column',
          minHeight: '100vh',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url('${heroImage}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(to bottom, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.05) 40%, rgba(0,0,0,0.62) 100%)',
          }}
        />
        <div
          style={{
            position: 'relative',
            zIndex: 10,
            marginTop: 'auto',
            padding: '0 3.5rem 4rem',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              fontSize: '1.05rem',
              fontWeight: 600,
              color: '#ffffff',
              letterSpacing: '0.04em',
              textShadow: '0 2px 14px rgba(0,0,0,0.85)',
              marginBottom: '0.9rem',
            }}
          >
            Uganda Christian University Alumni
          </p>
          <h1
            style={{
              fontSize: 'clamp(2.2rem, 4vw, 4rem)',
              fontWeight: 800,
              lineHeight: 1.06,
              color: '#ffffff',
              textShadow: '0 4px 28px rgba(0,0,0,0.9)',
              margin: 0,
            }}
          >
            Connect &amp; Empower
            <br />
            Our Alumni Community
          </h1>
        </div>
      </div>

      {/* RIGHT PANEL — sign-in form (38%, full width on mobile) */}
      <div
        className="login-right"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          overflowY: 'auto',
          padding: '3rem 1.5rem',
          background:
            'linear-gradient(160deg, #172643 0%, #0f1d36 55%, #0b1424 100%)',
        }}
      >
        <div style={{ width: '100%', maxWidth: '430px' }}>

          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
            <span style={{ width: '2.5rem', height: '2.5rem', display: 'inline-block' }}>
              <UcuBadgeLogo />
            </span>
            <span style={{ fontSize: '1.45rem', fontWeight: 700, color: '#fff', letterSpacing: '-0.01em' }}>
              Alumni{' '}
              <span style={{ fontWeight: 400, color: 'rgba(255,255,255,0.72)' }}>Platform</span>
            </span>
          </div>

          <h2 style={{ fontSize: '2rem', fontWeight: 700, color: '#fff', margin: '0 0 0.2rem' }}>
            Welcome Back!
          </h2>
          <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.6)', marginBottom: '1.8rem' }}>
            Sign in to your account
          </p>

          {/* Fields */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* Email */}
            <div>
              <Label style={{ display: 'block', marginBottom: '0.4rem', color: 'rgba(255,255,255,0.78)', fontSize: '0.875rem' }}>
                Email
              </Label>
              <div style={{ position: 'relative' }}>
                <Mail style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: '1rem', height: '1rem', color: 'rgba(255,255,255,0.45)' }} />
                <Input
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  placeholder="Enter your email"
                  style={{ height: '3rem', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.17)', background: 'rgba(12,22,44,0.75)', color: '#fff', paddingLeft: '2.5rem', fontSize: '0.95rem' }}
                  className="placeholder:text-white/35"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <Label style={{ display: 'block', marginBottom: '0.4rem', color: 'rgba(255,255,255,0.78)', fontSize: '0.875rem' }}>
                Password
              </Label>
              <div style={{ position: 'relative' }}>
                <Lock style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: '1rem', height: '1rem', color: 'rgba(255,255,255,0.45)' }} />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  placeholder="Enter your password"
                  style={{ height: '3rem', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.17)', background: 'rgba(12,22,44,0.75)', color: '#fff', paddingLeft: '2.5rem', paddingRight: '5.5rem', fontSize: '0.95rem' }}
                  className="placeholder:text-white/35"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  style={{ position: 'absolute', right: '2.8rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.55)' }}
                >
                  {showPassword ? <EyeOff style={{ width: '1rem', height: '1rem' }} /> : <Eye style={{ width: '1rem', height: '1rem' }} />}
                </button>
                <button
                  type="button"
                  style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}
                >
                  Forgot?
                </button>
              </div>
            </div>

            {/* Admin secret (conditional) */}
            {needsAdminSecret && (
              <div>
                <Label style={{ display: 'block', marginBottom: '0.4rem', color: 'rgba(255,255,255,0.78)', fontSize: '0.875rem' }}>
                  Admin Secret
                </Label>
                <Input
                  type="password"
                  value={adminSecret}
                  onChange={(e) => setAdminSecret(e.target.value)}
                  placeholder="Required for first staff login"
                  style={{ height: '3rem', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.17)', background: 'rgba(12,22,44,0.75)', color: '#fff' }}
                  className="placeholder:text-white/35"
                />
              </div>
            )}

            {/* Sign In button */}
            <Button
              onClick={handleLogin}
              disabled={loading}
              style={{ height: '3rem', width: '100%', borderRadius: '9999px', border: 'none', background: 'linear-gradient(90deg,#e8612b 0%,#f0a824 100%)', color: '#fff', fontSize: '1rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 6px 22px rgba(225,90,35,0.42)', marginTop: '0.3rem' }}
            >
              {loading ? 'Signing In…' : 'Sign In'}
            </Button>
          </div>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '1.4rem 0', color: 'rgba(255,255,255,0.4)' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.16)' }} />
            <span style={{ fontSize: '0.82rem' }}>or</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.16)' }} />
          </div>

          {/* Social buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={() => toast.info('Google sign-in is not configured yet.')}
              style={{ height: '3rem', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(12,22,44,0.6)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer' }}
            >
              <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fbbc05' }}>G</span>
              Google
            </button>
            <button
              type="button"
              onClick={() => toast.info('Apple sign-in is not configured yet.')}
              style={{ height: '3rem', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(12,22,44,0.6)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer' }}
            >
              <span style={{ fontSize: '1.1rem' }}>&#xf8ff;</span>
              Apple
            </button>
          </div>

          {/* Sign-up */}
          <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.88rem', color: 'rgba(255,255,255,0.6)' }}>
            New to the platform?{' '}
            <button
              onClick={switchToSignup}
              style={{ background: 'none', border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: '3px' }}
            >
              Create an account
            </button>
          </p>

          {/* Footer */}
          <p style={{ marginTop: '1.8rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', textAlign: 'center', fontSize: '0.74rem', color: 'rgba(255,255,255,0.35)' }}>
            © 2026 Alumni Platform · Terms · Privacy
          </p>
        </div>
      </div>

      {/* Responsive CSS: show left panel and fix widths on desktop */}
      <style>{`
        @media (min-width: 768px) {
          .login-left  { display: flex !important; width: 62% !important; }
          .login-right { width: 38% !important; flex: none !important; min-width: 360px; }
        }
      `}</style>
    </div>
  );
}
