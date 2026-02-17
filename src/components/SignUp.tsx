// src/components/SignUp.tsx
import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { GraduationCap, ArrowLeft } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';

type UserType = 'student' | 'alumni' | 'alumni_office' | '';

interface SignUpProps {
  onBack: () => void;
  onSignUpComplete: () => void;
}

export default function SignUp({ onBack, onSignUpComplete }: SignUpProps) {
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
    staffId: '',
    password: '',
    confirmPassword: '',
  });

  const update = (field: string, val: string) => setForm(f => ({ ...f, [field]: val }));

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


    if (userType === 'alumni_office' && !form.staffId) {
      toast.error('Staff ID is required');
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
    if (!/[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>/?]/.test(form.password)) {
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
          staffId: form.staffId || null,
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-[#1a4d7a] p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center relative">
          <button onClick={onBack} className="absolute left-6 top-6 p-2 hover:bg-gray-100 rounded-lg transition" title="Go back">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent flex items-center justify-center">
            <GraduationCap className="w-8 h-8 text-accent-foreground" />
          </div>
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
                  <label className={`p-3 border rounded w-full ${userType === 'alumni_office' ? 'border-primary' : ''}`}>
                    <RadioGroupItem value="alumni_office" id="alumni_office" />
                    <div className="ml-2">Alumni Office Staff</div>
                  </label>
                </div>
              </RadioGroup>
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
                  {userType === 'alumni_office' && (
                    <>
                      <Label>Staff ID</Label>
                      <Input value={form.staffId} onChange={(e) => update('staffId', e.target.value)} />
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
