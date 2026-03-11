// src/components/SignUp.tsx
import { useState } from 'react';
import axios from 'axios';
import { signInWithPopup } from 'firebase/auth';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { ArrowLeft } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';
import { API_BASE } from '../api';
import { auth, googleProvider, hasFirebaseEnv } from '../lib/firebase';
import { UcuBadgeLogo } from './UcuBadgeLogo';

type UserType = 'student' | 'alumni' | '';

interface SignUpProps {
  onBack: () => void;
  onSignUpComplete: () => void;
  onLoginSuccess: (user: any, token: string) => void;
}

export default function SignUp({ onBack, onSignUpComplete, onLoginSuccess }: SignUpProps) {
  const [step, setStep] = useState(1);
  const [userType, setUserType] = useState<UserType>('');
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    accessNumber: '',
    program: '',
    yearOfStudy: '',
    graduationYear: '',
    course: '',
    department: '',
    password: '',
    confirmPassword: '',
  });

  const update = (field: string, val: string) => setForm(f => ({ ...f, [field]: val }));

  const handleGoogleSignup = async () => {
    if (!userType) {
      toast.error('Select whether you are signing up as a student or alumni first');
      return;
    }
    if (!hasFirebaseEnv) {
      toast.error('Google sign-in is not configured. Missing Firebase frontend environment variables.');
      return;
    }

    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      const res = await axios.post(`${API_BASE}/auth/google`, { idToken, requestedRole: userType });
      toast.success('Google signup successful');
      onLoginSuccess(res.data.user, res.data.token);
    } catch (err: any) {
      console.error('Google signup error:', err);
      const errorMsg = err?.response?.data?.error || err?.message || 'Google signup failed';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    if (step === 1) {
      if (!userType) {
        toast.error('Please select account type');
        return;
      }
      setStep(2);
      return;
    }

    // Step 2 validation
    if (!form.firstName || !form.lastName || !form.email || !form.phone) {
      toast.error('Please fill all required fields');
      return;
    }

    if (userType === 'student' && !form.accessNumber) {
      toast.error('Access Number is required for students');
      return;
    }



    if (!form.password) {
      toast.error('Password is required');
      return;
    }
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (!/[A-Z]/.test(form.password)) {
      toast.error('Password must include at least one capital letter');
      return;
    }
    if (!/[0-9]/.test(form.password)) {
      toast.error('Password must include at least one number');
      return;
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(form.password)) {
      toast.error('Password must include at least one special character');
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      // Build payload aligned with backend `meta`
      const payload = {
        full_name: `${form.firstName} ${form.lastName}`,
        email: form.email,
        phone: form.phone,
        password: form.password,
        role: userType,
        meta: {
          accessNumber: form.accessNumber || null,
          program: form.program || null,
          yearOfStudy: form.yearOfStudy || null,
          graduationYear: form.graduationYear || null,
          course: form.course || null,
          department: form.department || null,
          staffId: null,
        }
      };

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data?.error || 'Registration failed');
        setLoading(false);
        return;
      }

      toast.success('Registration successful! Redirecting to login...');
      setTimeout(() => {
        onSignUpComplete();
      }, 600);

    } catch (err) {
      console.error('Signup error:', err);
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-background via-[color:var(--hover-50)] to-[color:var(--accent-soft-16)] dark:from-background dark:via-[#1b131a] dark:to-[#181f32] p-4">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-primary/20 blur-[100px] dark:bg-primary/30" />
        <div className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-[color:var(--brand-hero-to)]/20 blur-[110px] dark:bg-[color:var(--brand-hero-to)]/35" />
        <div className="absolute top-1/3 left-1/2 h-60 w-60 -translate-x-1/2 rounded-full bg-accent/20 blur-[100px] dark:bg-accent/25" />
      </div>

      <Card className="relative w-full max-w-2xl border-white/25 dark:border-white/10 bg-white/70 dark:bg-[#1b141d]/78 backdrop-blur-2xl shadow-[0_30px_80px_rgba(0,0,0,0.22)] dark:shadow-[0_40px_100px_rgba(0,0,0,0.55)]">
        <CardHeader className="text-center relative">
          <button onClick={onBack} className="absolute left-6 top-6 p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition" title="Go back">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <UcuBadgeLogo className="w-16 h-16 mx-auto mb-4" />
          <CardTitle>Create Account</CardTitle>
          <CardDescription>Step {step} of 2</CardDescription>
        </CardHeader>

        <CardContent>
          {step === 1 && (
            <>
              <Label className="mb-2">I am a...</Label>
              <RadioGroup value={userType} onValueChange={(v: UserType) => setUserType(v)}>
                <div className="flex gap-3">
                  <label className={`p-3 border rounded w-full ${userType === 'student' ? 'border-primary' : ''}`}>
                    <RadioGroupItem value="student" id="student" />
                    <div className="ml-2">Student</div>
                  </label>
                  <label className={`p-3 border rounded w-full ${userType === 'alumni' ? 'border-primary' : ''}`}>
                    <RadioGroupItem value="alumni" id="alumni" />
                    <div className="ml-2">Alumni</div>
                  </label>
                </div>
              </RadioGroup>

              <div className="mt-6 border-t pt-6">
                <Button variant="outline" className="w-full" onClick={handleGoogleSignup} disabled={loading || !userType}>
                  Continue with Google as {userType || '...'}
                </Button>
                <p className="text-xs text-center text-gray-500 mt-2">
                  Google signup uses the role you choose here.
                </p>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>First Name</Label>
                  <Input value={form.firstName} onChange={(e) => update('firstName', e.target.value)} />
                </div>
                <div>
                  <Label>Last Name</Label>
                  <Input value={form.lastName} onChange={(e) => update('lastName', e.target.value)} />
                </div>
              </div>

              <div className="mt-3">
                <Label>Email</Label>
                <Input value={form.email} onChange={(e) => update('email', e.target.value)} />
              </div>

              <div className="mt-3">
                <Label>Phone</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => update('phone', e.target.value.replace(/\\D/g, '').slice(0, 10))}
                  maxLength={10}
                  placeholder="10-digit phone number"
                />
              </div>

              {userType === 'student' && (
                <>
                  <div className="mt-3">
                    <Label>Access Number *</Label>
                    <Input 
                      value={form.accessNumber} 
                      onChange={(e) => update('accessNumber', e.target.value.toUpperCase())} 
                      placeholder="e.g., A12345 or B67890"
                      maxLength={6}
                    />
                    <p className="text-xs text-gray-500 mt-1">Format: Letter (A/B) + 5 digits</p>
                  </div>
                </>
              )}

              {userType !== 'student' && userType !== '' && (
                <div className="mt-3">
                  {userType === 'alumni' && (
                    <>
                      <Label>Graduation Year</Label>
                      <Input type="number" value={form.graduationYear} onChange={(e) => update('graduationYear', e.target.value)} />
                    </>
                  )}
                </div>
              )}

              {userType === 'student' && (
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    <Label>Program</Label>
                    <Input value={form.program} onChange={(e) => update('program', e.target.value)} placeholder="e.g., BSIT" />
                  </div>
                  <div>
                    <Label>Year of Study</Label>
                    <Select value={form.yearOfStudy} onValueChange={(v: string) => update('yearOfStudy', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Year 1</SelectItem>
                        <SelectItem value="2">Year 2</SelectItem>
                        <SelectItem value="3">Year 3</SelectItem>
                        <SelectItem value="4">Year 4</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <Label>Password</Label>
                <Input type="password" value={form.password} onChange={(e) => update('password', e.target.value)} placeholder="At least 8 chars" />
              </div>
              <div>
                <Label>Confirm Password</Label>
                <Input type="password" value={form.confirmPassword} onChange={(e) => update('confirmPassword', e.target.value)} placeholder="Confirm password" />
                </div>
              </div>

              <div className="mt-6 border-t pt-6">
                <Button variant="outline" className="w-full" onClick={handleGoogleSignup} disabled={loading}>
                  Continue with Google as {userType}
                </Button>
                {!hasFirebaseEnv && (
                  <p className="text-xs text-red-600 mt-2">
                    Google sign-in is unavailable because Firebase env vars are missing.
                  </p>
                )}
              </div>
            </>
          )}

          <div className="flex gap-3 mt-6 pt-6 border-t">
            {step > 1 && <Button variant="outline" onClick={() => setStep(1)}>Back</Button>}
            <Button onClick={handleNext} disabled={loading} className="ml-auto">{step === 1 ? 'Next' : 'Register'}</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
