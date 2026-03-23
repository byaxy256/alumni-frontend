// src/App.tsx

import { useState, useEffect, ReactNode } from 'react';
import LandingPage from './components/LandingPage';
import SignUp from './components/SignUp';
import Login from './components/Login';
import ResetPassword from './components/ResetPassword';
import { StudentApp } from './components/StudentApp';
import { AlumniApp } from './components/AlumniApp';
import { AdminApp } from './components/AdminApp';
import { OfficeRoleApp } from './components/OfficeRoleApp';
import { Toaster } from './components/ui/sonner';
// import { GraduationCap } from 'lucide-react';
import { LoadingSpinner } from './components/ui/loading-spinner';
// import { GraduationCap } from 'lucide-react';
import { initPushNotifications } from './firebaseMessaging';
import { apiCall } from './api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Label } from './components/ui/label';
import { Input } from './components/ui/input';
import { Button } from './components/ui/button';
import { toast } from 'sonner';

const INACTIVITY_TIMEOUT_MS = 60 * 60 * 1000; // 1 hour
const OFFICE_ROLES = new Set([
  'alumni_office',
  'administrator',
  'general_secretary',
  'finance',
  'president',
  'publicity',
  'secretary_academics',
]);

// This is the correct, complete User type definition
export type User = {
  field: string;
  graduationYear: ReactNode;
  id: number;
  uid: string;
  role:
    | 'student'
    | 'alumni'
    | 'alumni_office'
    | 'admin'
    | 'administrator'
    | 'general_secretary'
    | 'finance'
    | 'president'
    | 'publicity'
    | 'secretary_academics';
  email_verified?: boolean;
  full_name?: string;
  email?: string;
  phone?: string;
  national_id?: string;
  university_id?: string;
  accessNumber?: string;
  grad_year?: number;
  program?: string;
  semester?: number;
  final_semester?: number;
  cgpa?: number;
  created_at?: string;
  updated_at?: string;
  meta?: any;
  name?: string; 
  course?: string;
  phoneNumber?: string;
};





export default function App() {
  const forcedScreen = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('screen')
    : null;
  const [user, setUser] = useState<User | null>(null);
  const [showLanding, setShowLanding] = useState(forcedScreen !== 'login' && forcedScreen !== 'signup');
  const [showSignUp, setShowSignUp] = useState(forcedScreen === 'signup');



  const [showLogin, setShowLogin] = useState(forcedScreen === 'login');
  const [passwordResetToken, setPasswordResetToken] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return new URLSearchParams(window.location.search).get('reset_token');
  });
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const handleLogin = (userData: any, token: string) => {
    const meta = userData.meta ?? {};
    const fullName = userData.full_name || userData.name || meta.full_name || '';
    const course = userData.course || meta.course || meta.field || '';
    const graduationYear = userData.graduationYear || userData.grad_year || meta.graduationYear || meta.graduation_year || '';

    const transformedUser: User = {
      id: Number(userData.id || 0),
      uid: userData.uid || '',
      full_name: fullName,
      name: fullName,
      email: userData.email || '',
      role: (userData.role || 'student') as User['role'],
      phone: userData.phone || '',
      meta,
      course,
      graduationYear,
      field: ''
    };

    setUser(transformedUser);
    localStorage.setItem('user', JSON.stringify(transformedUser));
    localStorage.setItem('token', token);
    initPushNotifications(transformedUser);
    const requiresReset =
      OFFICE_ROLES.has(transformedUser.role) &&
      transformedUser.meta?.must_change_password === true;
    setMustChangePassword(requiresReset);
    
    setShowLogin(false);
    setShowLanding(false);
    setShowSignUp(false);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setShowLanding(true);
    setShowLogin(false);
    setShowSignUp(false);
    setMustChangePassword(false);
  };

  const handleForcePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Fill all password fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New password and confirm password do not match');
      return;
    }
    if (!/[A-Z]/.test(newPassword) || !/\d/.test(newPassword) || !/[^A-Za-z0-9]/.test(newPassword) || newPassword.length < 8) {
      toast.error('Password must be 8+ chars with capital letter, number and special character');
      return;
    }

    try {
      setChangingPassword(true);
      await apiCall('/auth/change-password', 'POST', { currentPassword, newPassword });

      const nextUser = user
        ? {
            ...user,
            meta: {
              ...(user.meta || {}),
              must_change_password: false,
            },
          }
        : null;
      if (nextUser) {
        setUser(nextUser);
        localStorage.setItem('user', JSON.stringify(nextUser));
      }

      setMustChangePassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Password changed successfully');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  // Your navigation functions are preserved exactly
  const handleGetStarted = () => {
    setShowLanding(false);
    setShowSignUp(true);
    setShowLogin(false);
  };

  const handleGoToLogin = () => {
    setShowSignUp(false);
    setShowLanding(false);
    setShowLogin(true);
  };

  const handleBackToLanding = () => {
    setShowSignUp(false);
    setShowLogin(false);
    setShowLanding(true);
  };

  const handleSignUpComplete = () => {
    setShowSignUp(false);
    setShowLogin(true);
    setShowLanding(false);
  };

  // FIX: Corrected and consolidated the useEffect hook for checking authentication.
  useEffect(() => {
    const savedUserJson = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (savedUserJson && token) {
      try {
        const savedUser = JSON.parse(savedUserJson);
        // The user is already in storage, so we can just use handleLogin to set the state
        handleLogin(savedUser, token);
      } catch (error) {
        console.error("Failed to parse user from localStorage", error);
        handleLogout(); // Clear corrupted data
      }
    }
    // This is crucial to stop the loading screen from showing forever
    setIsCheckingAuth(false);
  }, []);

  useEffect(() => {
    if (user) {
      initPushNotifications(user);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    let timeoutId: number | null = null;
    const activityEvents: Array<keyof WindowEventMap> = [
      'mousemove',
      'mousedown',
      'keydown',
      'scroll',
      'touchstart',
      'click',
    ];

    const logoutForInactivity = () => {
      toast.info('You were logged out after 1 hour of inactivity.');
      handleLogout();
    };

    const resetInactivityTimer = () => {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
      timeoutId = window.setTimeout(logoutForInactivity, INACTIVITY_TIMEOUT_MS);
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        resetInactivityTimer();
      }
    };

    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, resetInactivityTimer, { passive: true });
    });
    document.addEventListener('visibilitychange', handleVisibility);
    resetInactivityTimer();

    return () => {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, resetInactivityTimer);
      });
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [user]);

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size={64} label="Checking authentication..." />
      </div>
    );
  }

  const clearResetTokenFromUrl = () => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('reset_token');
      window.history.replaceState({}, '', url.pathname + url.search + url.hash);
    } catch {
      window.history.replaceState({}, '', '/');
    }
    setPasswordResetToken(null);
  };

  if (passwordResetToken && !user) {
    return (
      <>
        <ResetPassword
          token={passwordResetToken}
          onSuccess={() => {
            clearResetTokenFromUrl();
            setShowLogin(true);
            setShowLanding(false);
            setShowSignUp(false);
          }}
          onBack={() => {
            clearResetTokenFromUrl();
            setShowLogin(true);
            setShowLanding(false);
            setShowSignUp(false);
          }}
        />
        <Toaster />
      </>
    );
  }

  // Your component rendering logic is preserved exactly
  if (showLanding && !user) {
    return (
      <>
        <LandingPage onGetStarted={handleGetStarted} onLogin={handleGoToLogin} />
        <Toaster />
      </>
    );
  }

  if (showSignUp && !user) {
    return (
      <>
        <SignUp onBack={handleBackToLanding} onSignUpComplete={handleSignUpComplete} onLoginSuccess={handleLogin} />
        <Toaster />
      </>
    );
  }

  if (showLogin && !user) {
    return (
      <>
        <Login onLoginSuccess={handleLogin} onBack={handleBackToLanding} switchToSignup={handleGetStarted} />
        <Toaster />
      </>
    );
  }

  if (user && mustChangePassword) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Set New Password</CardTitle>
              <CardDescription>
                This is your first staff login. Use your temporary password, then set a new password to continue.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Temporary Password</Label>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
              <div>
                <Label>New Password</Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div>
                <Label>Confirm New Password</Label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <Button className="w-full" onClick={handleForcePasswordChange} disabled={changingPassword}>
                {changingPassword ? 'Updating...' : 'Update Password'}
              </Button>
            </CardContent>
          </Card>
        </div>
        <Toaster />
      </>
    );
  }

  if (user) {
    console.log('User logged in with role:', user.role, 'Full user:', user);
    
    if (user.role === 'student') return <><StudentApp user={user} onLogout={handleLogout} /><Toaster /></>;
    if (user.role === 'alumni') return <><AlumniApp user={user} onLogout={handleLogout} /><Toaster /></>;
    if (
      ['alumni_office', 'administrator', 'general_secretary', 'finance', 'president', 'publicity', 'secretary_academics'].includes(
        user.role
      )
    ) {
      return <><OfficeRoleApp user={user} onLogout={handleLogout} /><Toaster /></>;
    }
    if (user.role === 'admin') return <><AdminApp user={user} onLogout={handleLogout} /><Toaster /></>;
    
    // Fallback if role is invalid
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-foreground text-center">
          <h2 className="text-xl font-bold mb-4">Invalid user role</h2>
          <p className="mb-6 text-muted-foreground">Your account role "{user.role}" is not recognized</p>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md font-semibold hover:bg-primary/90"
          >
            Log Out
          </button>
        </div>
      </div>
    );
  }

  // Fallback to the landing page if no other condition is met
  return (
    <>
      <LandingPage onGetStarted={handleGetStarted} onLogin={handleGoToLogin} />
      <Toaster />
    </>
  );
}
