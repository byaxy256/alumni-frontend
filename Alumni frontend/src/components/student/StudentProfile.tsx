// src/components/student/StudentProfile.tsx
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import type { User } from '../../App';
import { ArrowLeft, LogOut, Edit, User as UserIcon, Lock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import PINManagement from '../shared/PINManagement';
import { AccountSettings } from '../shared/AccountSettings';

interface StudentProfileProps {
  user: User;
  onBack: () => void;
  onLogout: () => void;
}

export function StudentProfile({ user, onBack, onLogout }: StudentProfileProps) {
  const [profile, setProfile] = useState({
    fullName: '',
    email: '',
    phone: '',
    course: '',
    semester: '',
    universityId: '',
  });

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPinManagement, setShowPinManagement] = useState(false);
  const [showAccountSettings, setShowAccountSettings] = useState(false);

  useEffect(() => {
    try {
      const savedUser = JSON.parse(localStorage.getItem('user') || 'null');
      setProfile({
        fullName: savedUser?.full_name ?? user.name ?? '',
        email: savedUser?.email ?? user.email ?? '',
        phone: savedUser?.phone ?? user.phoneNumber ?? '',
        course: savedUser?.meta?.course ?? user.course ?? '',
        semester: savedUser?.meta?.semester ?? '',
        universityId: savedUser?.meta?.university_id ?? '',
      });
    } catch {
      setProfile({
        fullName: user.name ?? '',
        email: user.email ?? '',
        phone: user.phoneNumber ?? '',
        course: user.course ?? '',
        semester: '',
        universityId: '',
      });
    }
  }, [user]);

  // --- FIX: The entire handleSave function is now correct ---
  const handleSave = async () => {
    setLoading(true);
    
    // FIX: Re-declared the missing 'token' and created the 'payload' object
    const token = localStorage.getItem('token') || '';
    const savedUserMeta = JSON.parse(localStorage.getItem('user') || '{}')?.meta || {};
    
    const payload = {
        full_name: profile.fullName,
        email: profile.email,
        phone: profile.phone,
        semester: profile.semester ? parseInt(profile.semester) : undefined,
        program: profile.course,
        university_id: profile.universityId,
        meta: { 
          ...savedUserMeta, 
          course: profile.course,
          semester: profile.semester ? parseInt(profile.semester) : undefined,
          university_id: profile.universityId,
        },
    };

    // FIX: Corrected the try...catch...finally block structure
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      const res = await fetch(`${API_URL}/api/auth/me`, {
        method: 'PUT', // Solution 1: Using 'PUT' to match the backend route
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload), // Use the correctly defined payload
      });

      const json = await res.json();
      if (!res.ok) {
        toast.error(json?.error || 'Failed to save profile.');
        return;
      }

      localStorage.setItem('user', JSON.stringify(json.user || {}));
      toast.success('Profile updated successfully!');
      setIsEditing(false);

    } catch (err) {
      console.error('Profile save error:', err);
      toast.error('A network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 p-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Button onClick={onBack} variant="ghost" size="icon" className="md:hidden">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold text-slate-800">My Profile</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
        <Card className="p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 flex-shrink-0">
              <UserIcon className="w-10 h-10" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-slate-900 mb-1">{profile.fullName}</h2>
              <p className="text-slate-600 mb-2">{profile.course || 'Course not set'}</p>
              <p className="text-sm text-slate-500">{profile.email}</p>
              <div className="mt-4 flex items-center gap-3">
                <Button onClick={() => setIsEditing(!isEditing)} size="sm">
                  <Edit className="w-4 h-4 mr-2" />
                  {isEditing ? 'Cancel' : 'Edit Profile'}
                </Button>
                <Button variant="outline" size="sm" onClick={onLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-slate-900 mb-6">Personal Information</h3>
          <div className="space-y-6">
            <div>
              <Label htmlFor="fullName" className="text-slate-600">Full Name</Label>
              <Input 
                id="fullName"
                name="fullName"
                value={profile.fullName} 
                disabled={!isEditing} 
                onChange={handleInputChange} 
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="email" className="text-slate-600">Email Address</Label>
              <Input 
                id="email"
                name="email"
                type="email"
                value={profile.email} 
                disabled={!isEditing} 
                onChange={handleInputChange} 
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="phone" className="text-slate-600">Phone Number</Label>
              <Input 
                id="phone"
                name="phone"
                value={profile.phone} 
                disabled={!isEditing} 
                onChange={handleInputChange} 
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="course" className="text-slate-600">Course / Program</Label>
              <Input 
                id="course"
                name="course"
                value={profile.course} 
                disabled={!isEditing} 
                onChange={handleInputChange} 
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="semester" className="text-slate-600">Current Semester</Label>
              <Input 
                id="semester"
                name="semester"
                type="number"
                min="1"
                max="10"
                value={profile.semester} 
                disabled={!isEditing} 
                onChange={handleInputChange} 
                className="mt-1"
                placeholder="e.g., 5"
              />
            </div>
            <div>
              <Label htmlFor="accessNumber" className="text-slate-600">Access Number</Label>
              <Input 
                id="accessNumber"
                name="accessNumber"
                value={profile.accessNumber || (user?.meta?.accessNumber || '')} 
                disabled={true}
                className="mt-1"
                placeholder="Auto-populated from signup"
              />
              <p className="text-xs text-gray-500 mt-1">Access number is set during registration and cannot be changed</p>
            </div>

            {isEditing && (
              <div className="flex items-center gap-4 pt-4 border-t border-slate-200">
                <Button onClick={handleSave} disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
              </div>
            )}
          </div>
        </Card>

        {/* Account Settings */}
        <Card className="p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-slate-900 mb-4">Account Settings</h3>
          {showAccountSettings ? (
            <AccountSettings onClose={() => setShowAccountSettings(false)} />
          ) : (
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => setShowAccountSettings(true)}
            >
              Manage Account Settings
            </Button>
          )}
        </Card>

        {/* Payment PIN Management */}
        <Card className="p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              Payment PIN
            </h3>
          </div>
          {showPinManagement ? (
            <PINManagement onClose={() => setShowPinManagement(false)} />
          ) : (
            <div>
              <p className="text-sm text-slate-600 mb-4">
                Manage your payment PIN for secure loan payments and transactions.
              </p>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => setShowPinManagement(true)}
              >
                Manage Payment PIN
              </Button>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}