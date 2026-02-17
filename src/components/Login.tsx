// src/components/Login.tsx
import { useState } from 'react';
import { api } from '../api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { GraduationCap, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

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
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!emailOrPhone || !password) {
      toast.error('Please fill all fields');
      return;
    }
    setLoading(true);

    try {
      const credential = emailOrPhone.trim();
      const normalizedCredential = credential.includes('@') ? credential.toLowerCase() : credential;
      const data = await api.login(normalizedCredential, password);
      console.log('Login response:', data);
      
      toast.success('Login successful');
      onLoginSuccess(data.user, data.token);

    } catch (err: any) {
      console.error('Login error', err);
      const errorMsg = err?.message || err?.response?.data?.error || 'Login failed';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    toast('Continue with Google is not implemented yet.');
  };

  // --- No changes are needed for the UI (JSX) ---
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-[#1a4d7a] p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center relative">
          <button
            onClick={onBack}
            className="absolute left-6 top-6 p-2 hover:bg-gray-100 rounded-lg"
            title="Go back"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent flex items-center justify-center">
            <GraduationCap className="w-8 h-8 text-accent-foreground" />
          </div>
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

          <Button onClick={handleLogin} className="w-full" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</Button>

          <div className="flex items-center gap-3 justify-center">
            <Button variant="outline" onClick={handleGoogle}>Continue with Google</Button>
          </div>

          <p className="text-xs text-center text-gray-500">
            Don't have an account? <button onClick={switchToSignup} className="text-primary hover:underline">Sign up</button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
