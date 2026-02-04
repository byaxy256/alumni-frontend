import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import type { User } from '../../App';
import { ArrowLeft, Mail, Phone, Briefcase, Calendar, LogOut, Edit, Lock } from 'lucide-react';
import { Textarea } from '../ui/textarea';
import { api, API_BASE } from '../../api';
import axios from 'axios';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import PINManagement from '../shared/PINManagement';
import { AccountSettings } from '../shared/AccountSettings';

interface AlumniProfileProps {
  user: User;
  onBack: () => void;
  onLogout: () => void;
}

export function AlumniProfile({ user, onBack, onLogout }: AlumniProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showPinManagement, setShowPinManagement] = useState(false);
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const [about, setAbout] = useState(user.meta?.bio || user.meta?.about || '');
  const [email, setEmail] = useState(user.email || '');
  const [phone, setPhone] = useState(user.phone || user.phoneNumber || '');
  const [workRole, setWorkRole] = useState(user.meta?.field || user.course || '');
  const [graduationYear, setGraduationYear] = useState(user.graduationYear || user.meta?.graduationYear || user.meta?.graduation_year || '');
  const [experienceYears, setExperienceYears] = useState(user.meta?.experienceYears || user.meta?.experience_years || '');
  const [workplace, setWorkplace] = useState(user.meta?.company || user.meta?.workplace || user.meta?.currentWorkplace || '');
  const [saving, setSaving] = useState(false);
  const localPrefsRaw = typeof window !== 'undefined' ? localStorage.getItem('preferences') : null;
  const localPrefs = localPrefsRaw ? JSON.parse(localPrefsRaw) : {};
  const localUserRaw = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
  const localPrivacy = (localUserRaw ? JSON.parse(localUserRaw)?.meta?.privacy : undefined) || localPrefs.privacy;
  const [privacy, setPrivacy] = useState<{ profileVisibility: 'public' | 'alumni-only' | 'private'; showEmail: boolean; showPhone: boolean }>(
    localPrivacy || {
      profileVisibility: 'alumni-only',
      showEmail: false,
      showPhone: false,
    }
  );

  const isProfilePrivate = privacy.profileVisibility === 'private';

  useEffect(() => {
    const loadPrivacy = async () => {
      try {
        // Prefer API for latest, fallback to localStorage snapshot
        const token = localStorage.getItem('token');
        if (token) {
          const res = await axios.get(`${API_BASE}/auth/preferences`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.data?.privacy) {
            setPrivacy({
              profileVisibility: res.data.privacy.profileVisibility ?? 'alumni-only',
              showEmail: res.data.privacy.showEmail ?? false,
              showPhone: res.data.privacy.showPhone ?? false,
            });
            return;
          }
        }

        const userRaw = localStorage.getItem('user');
        if (userRaw) {
          const user = JSON.parse(userRaw);
          if (user.meta?.privacy) {
            setPrivacy({
              profileVisibility: user.meta.privacy.profileVisibility ?? 'alumni-only',
              showEmail: user.meta.privacy.showEmail ?? false,
              showPhone: user.meta.privacy.showPhone ?? false,
            });
          }
        }
      } catch (err) {
        console.error('Failed to load privacy preferences', err);
      }
    };

    loadPrivacy();

    // Listen for privacy changes from settings
    const handlePrivacyChange = (e: CustomEvent) => {
      setPrivacy(e.detail);
    };

    window.addEventListener('privacyChanged', handlePrivacyChange as any);
    return () => {
      window.removeEventListener('privacyChanged', handlePrivacyChange as any);
    };
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token') || '';
      const newMeta = {
        ...user.meta,
        bio: about,
        about,
        field: workRole,
        graduationYear,
        graduation_year: graduationYear,
        experienceYears: Number(experienceYears) || 0,
        experience_years: Number(experienceYears) || 0,
        company: workplace,
        workplace,
        currentWorkplace: workplace,
      };

      const payload = {
        full_name: user.full_name || user.name || '',
        email,
        phone,
        meta: newMeta,
      };
      const res = await api.updateProfile(payload, token);
      const updatedUser = res.user;

      // Preserve locally-stored preferences which may not be returned by the profile update API
      const existingUserRaw = localStorage.getItem('user');
      const existingUser = existingUserRaw ? JSON.parse(existingUserRaw) : null;
      const prefsRaw = localStorage.getItem('preferences');
      const prefs = prefsRaw ? JSON.parse(prefsRaw) : {};

      const preservedPrivacy = prefs.privacy || existingUser?.meta?.privacy;
      const preservedNotifications = prefs.notifications || existingUser?.meta?.notifications;

      const mergedUser = {
        ...updatedUser,
        meta: {
          ...(updatedUser?.meta || {}),
          ...(preservedPrivacy ? { privacy: preservedPrivacy } : {}),
          ...(preservedNotifications ? { notifications: preservedNotifications } : {}),
        },
      };

      localStorage.setItem('user', JSON.stringify(mergedUser));
      toast.success('Profile updated');
      setIsEditing(false);
      window.location.reload();
    } catch (error) {
      console.error('Profile save failed:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-6">
      <div className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button onClick={onBack} className="md:hidden p-2 hover:bg-gray-100 rounded-lg" title="Go back">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-primary">Profile</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Profile Header */}
        <Card className="p-6">
          <div className="flex items-start gap-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-3xl flex-shrink-0">
              {(user.name ?? '').split(' ').map(n => n.charAt(0)).join('')}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl text-gray-900 mb-1">{user.name}</h2>
              <p className="text-gray-600 mb-2">{isProfilePrivate && !isEditing ? 'Hidden (profile set to private)' : workRole || 'Work role not set'}</p>
              <p className="text-sm text-gray-500">Class of {isProfilePrivate && !isEditing ? 'Hidden' : user.graduationYear}</p>
              <p className="text-sm text-gray-500">Experience: {isProfilePrivate && !isEditing ? 'Hidden' : (experienceYears || 0)} yrs</p>
              <p className="text-sm text-gray-500">Workplace: {isProfilePrivate && !isEditing ? 'Hidden' : (workplace || 'Not set')}</p>
              <Button
                onClick={() => setIsEditing(!isEditing)}
                variant="outline"
                size="sm"
                className="mt-4"
              >
                <Edit className="w-4 h-4 mr-2" />
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </Button>
            </div>
          </div>
        </Card>

        {/* Profile Information */}
        <Card className="p-6">
          <h3 className="text-lg text-gray-900 mb-4">Personal Information</h3>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Mail className="w-4 h-4 text-gray-400" />
                  {privacy.showEmail || isEditing ? (
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={!isEditing}
                      className="flex-1"
                    />
                  ) : (
                    <div className="flex-1 px-3 py-2 rounded-lg bg-gray-50 text-sm text-gray-600 border border-dashed border-gray-200">
                      Hidden (privacy settings)
                    </div>
                  )}
                </div>
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Phone className="w-4 h-4 text-gray-400" />
                  {privacy.showPhone || isEditing ? (
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      disabled={!isEditing}
                      className="flex-1"
                    />
                  ) : (
                    <div className="flex-1 px-3 py-2 rounded-lg bg-gray-50 text-sm text-gray-600 border border-dashed border-gray-200">
                      Hidden (privacy settings)
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="workRole">Work Role</Label>
              <div className="flex items-center gap-2 mt-1">
                <Briefcase className="w-4 h-4 text-gray-400" />
                  {isProfilePrivate && !isEditing ? (
                    <div className="flex-1 px-3 py-2 rounded-lg bg-gray-50 text-sm text-gray-600 border border-dashed border-gray-200">
                      Hidden (profile private)
                    </div>
                  ) : (
                    <Input
                      id="workRole"
                      value={workRole}
                      onChange={(e) => setWorkRole(e.target.value)}
                      disabled={!isEditing}
                      placeholder="e.g., Data Analyst, Software Engineer"
                      className="flex-1"
                    />
                  )}
              </div>
            </div>

            <div>
              <Label htmlFor="graduation">Graduation Year</Label>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="w-4 h-4 text-gray-400" />
                  {isProfilePrivate && !isEditing ? (
                    <div className="flex-1 px-3 py-2 rounded-lg bg-gray-50 text-sm text-gray-600 border border-dashed border-gray-200">
                      Hidden (profile private)
                    </div>
                  ) : (
                    <Input
                      id="graduation"
                      value={graduationYear}
                      onChange={(e) => setGraduationYear(e.target.value)}
                      disabled={!isEditing}
                      className="flex-1"
                    />
                  )}
              </div>
            </div>

            <div>
              <Label htmlFor="experience">Years of Experience</Label>
              <div className="flex items-center gap-2 mt-1">
                  {isProfilePrivate && !isEditing ? (
                    <div className="flex-1 px-3 py-2 rounded-lg bg-gray-50 text-sm text-gray-600 border border-dashed border-gray-200">
                      Hidden (profile private)
                    </div>
                  ) : (
                    <Input
                      id="experience"
                      type="number"
                      value={experienceYears}
                      onChange={(e) => setExperienceYears(e.target.value)}
                      disabled={!isEditing}
                      className="flex-1"
                    />
                  )}
              </div>
            </div>

            <div>
              <Label htmlFor="workplace">Current Workplace</Label>
              <div className="flex items-center gap-2 mt-1">
                  {isProfilePrivate && !isEditing ? (
                    <div className="flex-1 px-3 py-2 rounded-lg bg-gray-50 text-sm text-gray-600 border border-dashed border-gray-200">
                      Hidden (profile private)
                    </div>
                  ) : (
                    <Input
                      id="workplace"
                      value={workplace}
                      onChange={(e) => setWorkplace(e.target.value)}
                      disabled={!isEditing}
                      className="flex-1"
                    />
                  )}
              </div>
            </div>

            <div>
              <Label htmlFor="about">About</Label>
                {isProfilePrivate && !isEditing ? (
                  <div className="px-3 py-2 rounded-lg bg-gray-50 text-sm text-gray-600 border border-dashed border-gray-200">
                    Hidden (profile private)
                  </div>
                ) : (
                  <Textarea
                    id="about"
                    value={about}
                    onChange={(e) => setAbout(e.target.value)}
                    disabled={!isEditing}
                    placeholder="Share a short bio to help students know you."
                    className="mt-1"
                    rows={4}
                  />
                )}
            </div>

            {isEditing && (
              <Button className="w-full md:w-auto" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            )}
          </div>
        </Card>

        {/* Account Settings */}
        <Card className="p-6">
          <h3 className="text-lg text-gray-900 mb-4">Account Settings</h3>
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
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg text-gray-900 flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              Payment PIN
            </h3>
          </div>
          {showPinManagement ? (
            <PINManagement onClose={() => setShowPinManagement(false)} />
          ) : (
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Manage your payment PIN for secure donations and transactions.
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

        {/* Logout */}
        <Card className="p-6 border-red-200 bg-red-50">
          <Button
            onClick={onLogout}
            variant="destructive"
            className="w-full"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </Card>
      </div>
    </div>
  );
}
