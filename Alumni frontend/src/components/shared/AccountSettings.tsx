import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import axios from 'axios';
import { toast } from 'sonner';
import { API_BASE } from '../../api';

interface AccountSettingsProps {
  onClose?: () => void;
}

type ViewMode = 'main' | 'change-password' | 'notifications' | 'privacy';

function getLocalPrefs() {
  const storedPrefsRaw = typeof window !== 'undefined' ? localStorage.getItem('preferences') : null;
  const storedPrefs = storedPrefsRaw ? JSON.parse(storedPrefsRaw) : {};
  const userRaw = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
  const meta = userRaw ? JSON.parse(userRaw)?.meta || {} : {};
  return {
    notifications: storedPrefs.notifications || meta.notifications || {
      email: true,
      push: true,
      donationUpdates: true,
      mentorshipAlerts: true,
    },
    privacy: storedPrefs.privacy || meta.privacy || {
      profileVisibility: 'alumni-only',
      showEmail: false,
      showPhone: false,
    },
  };
}

function writePrefs(prefs: { notifications?: any; privacy?: any }) {
  const existingRaw = typeof window !== 'undefined' ? localStorage.getItem('preferences') : null;
  const existing = existingRaw ? JSON.parse(existingRaw) : {};
  const next = { ...existing, ...prefs };
  localStorage.setItem('preferences', JSON.stringify(next));
}

export function AccountSettings({ onClose }: AccountSettingsProps) {
  const initial = getLocalPrefs();
  const [viewMode, setViewMode] = useState<ViewMode>('main');
  const [loading, setLoading] = useState(false);
  const [, setLoadingPreferences] = useState(true);
  
  // Change password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Notification preferences state
  const [emailNotifications, setEmailNotifications] = useState(initial.notifications.email ?? true);
  const [pushNotifications, setPushNotifications] = useState(initial.notifications.push ?? true);
  const [donationUpdates, setDonationUpdates] = useState(initial.notifications.donationUpdates ?? true);
  const [mentorshipAlerts, setMentorshipAlerts] = useState(initial.notifications.mentorshipAlerts ?? true);
  
  // Privacy settings state
  const [profileVisibility, setProfileVisibility] = useState<'public' | 'alumni-only' | 'private'>(initial.privacy.profileVisibility ?? 'alumni-only');
  const [showEmail, setShowEmail] = useState(initial.privacy.showEmail ?? false);
  const [showPhone, setShowPhone] = useState(initial.privacy.showPhone ?? false);

  // Load user preferences on mount
  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      // Apply local snapshot first to avoid flicker/reset on refresh
      const local = getLocalPrefs();
      if (local.notifications) {
        setEmailNotifications(local.notifications.email ?? true);
        setPushNotifications(local.notifications.push ?? true);
        setDonationUpdates(local.notifications.donationUpdates ?? true);
        setMentorshipAlerts(local.notifications.mentorshipAlerts ?? true);
      }
      if (local.privacy) {
        setProfileVisibility(local.privacy.profileVisibility ?? 'alumni-only');
        setShowEmail(local.privacy.showEmail ?? false);
        setShowPhone(local.privacy.showPhone ?? false);
      }

      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE}/auth/preferences`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const { notifications, privacy } = response.data;
      
      if (notifications) {
        setEmailNotifications(notifications.email ?? true);
        setPushNotifications(notifications.push ?? true);
        setDonationUpdates(notifications.donationUpdates ?? true);
        setMentorshipAlerts(notifications.mentorshipAlerts ?? true);

        writePrefs({ notifications });

        const userRaw = localStorage.getItem('user');
        if (userRaw) {
          const user = JSON.parse(userRaw);
          user.meta = user.meta || {};
          user.meta.notifications = notifications;
          localStorage.setItem('user', JSON.stringify(user));
        }
      }
      
      if (privacy) {
        setProfileVisibility(privacy.profileVisibility ?? 'alumni-only');
        setShowEmail(privacy.showEmail ?? false);
        setShowPhone(privacy.showPhone ?? false);

        writePrefs({ privacy });

        const userRaw = localStorage.getItem('user');
        if (userRaw) {
          const user = JSON.parse(userRaw);
          user.meta = user.meta || {};
          user.meta.privacy = privacy;
          localStorage.setItem('user', JSON.stringify(user));
        }
      }
      
      setLoadingPreferences(false);
    } catch (err: any) {
      console.error('Error loading preferences:', err);
      setLoadingPreferences(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE}/auth/change-password`, {
        currentPassword,
        newPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setViewMode('main');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotifications = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_BASE}/auth/preferences`, {
        notifications: {
          email: emailNotifications,
          push: pushNotifications,
          donationUpdates,
          mentorshipAlerts
        }
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Persist to local storage user meta for immediate reuse
      const userRaw = localStorage.getItem('user');
      if (userRaw) {
        const user = JSON.parse(userRaw);
        user.meta = user.meta || {};
        user.meta.notifications = {
          email: emailNotifications,
          push: pushNotifications,
          donationUpdates,
          mentorshipAlerts
        };
        localStorage.setItem('user', JSON.stringify(user));
      }

      writePrefs({
        notifications: {
          email: emailNotifications,
          push: pushNotifications,
          donationUpdates,
          mentorshipAlerts,
        },
      });

      toast.success('Notification preferences saved');
      await loadPreferences();
      setViewMode('main');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePrivacy = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_BASE}/auth/preferences`, {
        privacy: {
          profileVisibility,
          showEmail,
          showPhone
        }
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Persist to local storage user meta for immediate reuse
      const userRaw = localStorage.getItem('user');
      if (userRaw) {
        const user = JSON.parse(userRaw);
        user.meta = user.meta || {};
        user.meta.privacy = {
          profileVisibility,
          showEmail,
          showPhone
        };
        localStorage.setItem('user', JSON.stringify(user));
      }

      writePrefs({
        privacy: {
          profileVisibility,
          showEmail,
          showPhone,
        },
      });

      toast.success('Privacy settings saved');
      await loadPreferences();
      setViewMode('main');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save privacy settings');
    } finally {
      setLoading(false);
    }
  };

  const persistPrivacy = async (updates: Partial<{ profileVisibility: 'public' | 'alumni-only' | 'private'; showEmail: boolean; showPhone: boolean }>) => {
    const next = {
      profileVisibility,
      showEmail,
      showPhone,
      ...updates,
    };

    setProfileVisibility(next.profileVisibility as any);
    setShowEmail(next.showEmail);
    setShowPhone(next.showPhone);

    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_BASE}/auth/preferences`, {
        privacy: next
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const userRaw = localStorage.getItem('user');
      if (userRaw) {
        const user = JSON.parse(userRaw);
        user.meta = user.meta || {};
        user.meta.privacy = next;
        localStorage.setItem('user', JSON.stringify(user));
      }

      writePrefs({ privacy: next });

      // Trigger profile reload
      window.dispatchEvent(new CustomEvent('privacyChanged', { detail: next }));
    } catch (err: any) {
      console.error('Auto-save privacy failed', err);
      toast.error(err.response?.data?.error || 'Failed to save privacy');
    }
  };

  if (viewMode === 'change-password') {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Change Password</h2>
          {onClose && (
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
          )}
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <Label htmlFor="currentPassword">Current Password</Label>
            <Input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
          </div>

          <div>
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="mt-1"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setViewMode('main')} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Changing...' : 'Change Password'}
            </Button>
          </div>
        </form>
      </div>
    );
  }

  if (viewMode === 'notifications') {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Notification Preferences</h2>
          {onClose && (
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
          )}
        </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="font-medium">Email Notifications</p>
              <p className="text-sm text-gray-600">Receive updates via email</p>
            </div>
              <button
                type="button"
                onClick={() => setEmailNotifications(!emailNotifications)}
                className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  emailNotifications ? 'bg-blue-600' : 'bg-gray-200 ring-1 ring-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-1 ring-gray-300 transition-transform duration-200 ${
                    emailNotifications ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
          </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="font-medium">Push Notifications</p>
              <p className="text-sm text-gray-600">Receive in-app notifications</p>
            </div>
              <button
                type="button"
                onClick={() => setPushNotifications(!pushNotifications)}
                className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  pushNotifications ? 'bg-blue-600' : 'bg-gray-200 ring-1 ring-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-1 ring-gray-300 transition-transform duration-200 ${
                    pushNotifications ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="font-medium">Donation Updates</p>
              <p className="text-sm text-gray-600">Get notified about donation impacts</p>
            </div>
              <button
                type="button"
                onClick={() => setDonationUpdates(!donationUpdates)}
                className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  donationUpdates ? 'bg-blue-600' : 'bg-gray-200 ring-1 ring-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-1 ring-gray-300 transition-transform duration-200 ${
                    donationUpdates ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="font-medium">Mentorship Alerts</p>
              <p className="text-sm text-gray-600">Updates from mentors/mentees</p>
            </div>
              <button
                type="button"
                onClick={() => setMentorshipAlerts(!mentorshipAlerts)}
                className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  mentorshipAlerts ? 'bg-blue-600' : 'bg-gray-200 ring-1 ring-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-1 ring-gray-300 transition-transform duration-200 ${
                    mentorshipAlerts ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => setViewMode('main')} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSaveNotifications} disabled={loading} className="flex-1">
              {loading ? 'Saving...' : 'Save Preferences'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (viewMode === 'privacy') {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Privacy Settings</h2>
          {onClose && (
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="profileVisibility">Profile Visibility</Label>
            <select
              id="profileVisibility"
              value={profileVisibility}
              onChange={(e) => persistPrivacy({ profileVisibility: e.target.value as any })}
              className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="public">Public - Anyone can view</option>
              <option value="alumni-only">Alumni Only - Only verified alumni</option>
              <option value="private">Private - Only you</option>
            </select>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Show Email Address</p>
                <p className="text-sm text-gray-600">Display your email on profile</p>
              </div>
                <button
                  type="button"
                  onClick={() => persistPrivacy({ showEmail: !showEmail })}
                  className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    showEmail ? 'bg-blue-600' : 'bg-gray-200 ring-1 ring-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-1 ring-gray-300 transition-transform duration-200 ${
                      showEmail ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Show Phone Number</p>
                <p className="text-sm text-gray-600">Display your phone on profile</p>
              </div>
                <button
                  type="button"
                  onClick={() => persistPrivacy({ showPhone: !showPhone })}
                  className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    showPhone ? 'bg-blue-600' : 'bg-gray-200 ring-1 ring-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-1 ring-gray-300 transition-transform duration-200 ${
                      showPhone ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => setViewMode('main')} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSavePrivacy} disabled={loading} className="flex-1">
              {loading ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Account Settings</h2>
        {onClose && (
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        )}
      </div>

      <div className="space-y-3">
        <Button 
          variant="outline" 
          className="w-full justify-start"
          onClick={() => setViewMode('change-password')}
        >
          Change Password
        </Button>
        <Button 
          variant="outline" 
          className="w-full justify-start"
          onClick={() => setViewMode('notifications')}
        >
          Notification Preferences
        </Button>
        <Button 
          variant="outline" 
          className="w-full justify-start"
          onClick={() => setViewMode('privacy')}
        >
          Privacy Settings
        </Button>
      </div>
    </div>
  );
}
