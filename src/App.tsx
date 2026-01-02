// src/App.tsx

import { useState, useEffect, ReactNode } from 'react';
import { Analytics } from '@vercel/analytics/react';
import LandingPage from './components/LandingPage';
import SignUp from './components/SignUp';
import Login from './components/Login';
import { StudentApp } from './components/StudentApp';
import { AlumniApp } from './components/AlumniApp';

import { AlumniOfficeApp } from './components/AlumniOfficeApp';
import { AdminApp } from './components/AdminApp';
import { Toaster } from './components/ui/sonner';
import { GraduationCap } from 'lucide-react';

// This is the correct, complete User type definition
export type User = {
  field: string;
  graduationYear: ReactNode;
  id: number;
  uid: string;
  role: 'student' | 'alumni' | 'alumni_office' | 'admin';
  email_verified?: boolean;
  full_name?: string;
  email?: string;
  phone?: string;
  national_id?: string;
  university_id?: string;
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
  const [user, setUser] = useState<User | null>(null);
  const [showLanding, setShowLanding] = useState(true);
  const [showSignUp, setShowSignUp] = useState(false);



  const [showLogin, setShowLogin] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

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

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-[#1a4d7a]">
        <div className="text-white text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/20 flex items-center justify-center">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Your component rendering logic is preserved exactly
  if (showLanding && !user) {
    return (
      <>
        <LandingPage onGetStarted={handleGetStarted} onLogin={handleGoToLogin} />
        <Toaster />
        <Analytics />
      </>
    );
  }

  if (showSignUp && !user) {
    return (
      <>
        <SignUp onBack={handleBackToLanding} onSignUpComplete={handleSignUpComplete} switchToLogin={handleGoToLogin} />
        <Toaster />
        <Analytics />
      </>
    );
  }

  if (showLogin && !user) {
    return (
      <>
        <Login onLoginSuccess={handleLogin} onBack={handleBackToLanding} switchToSignup={handleGetStarted} />
        <Toaster />
        <Analytics />
      </>
    );
  }

  if (user) {
    console.log('User logged in with role:', user.role, 'Full user:', user);
    
    if (user.role === 'student') return <><StudentApp user={user} onLogout={handleLogout} /><Toaster /><Analytics /></>;
    if (user.role === 'alumni') return <><AlumniApp user={user} onLogout={handleLogout} /><Toaster /><Analytics /></>;
    if (user.role === 'alumni_office') return <><AlumniOfficeApp user={user} onLogout={handleLogout} /><Toaster /><Analytics /></>;
    if (user.role === 'admin') return <><AdminApp user={user} onLogout={handleLogout} /><Toaster /><Analytics /></>;
    
    // Fallback if role is invalid
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-[#1a4d7a]">
        <div className="text-white text-center">
          <h2 className="text-xl font-bold mb-4">Invalid user role</h2>
          <p className="mb-4">Your account role "{user.role}" is not recognized</p>
          <button 
            onClick={handleLogout}
            className="px-4 py-2 bg-white text-blue-600 rounded font-semibold hover:bg-gray-100"
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
      <Analytics />
    </>
  );
}
