import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import axios from 'axios';
import { toast } from 'sonner';

interface AccountSettingsProps {
  onClose?: () => void;
}

type ViewMode = 'main' | 'change-password' | 'notifications' | 'privacy';

export function AccountSettings({ onClose }: AccountSettingsProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('main');
  const [loading, setLoading] = useState(false);
  const [loadingPreferences, setLoadingPreferences] = useState(true);
  
  // Change password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Notification preferences state
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [donationUpdates, setDonationUpdates] = useState(true);
  const [mentorshipAlerts, setMentorshipAlerts] = useState(true);
  
  // Privacy settings state
  const [profileVisibility, setProfileVisibility] = useState<'public' | 'alumni-only' | 'private'>('alumni-only');
  const [showEmail, setShowEmail] = useState(false);
  const [showPhone, setShowPhone] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

  // Load user preferences on mount
  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/auth/preferences`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const { notifications, privacy } = response.data;
      
      if (notifications) {
        setEmailNotifications(notifications.email ?? true);
        setPushNotifications(notifications.push ?? true);
        setDonationUpdates(notifications.donationUpdates ?? true);
        setMentorshipAlerts(notifications.mentorshipAlerts ?? true);
      }
      
      if (privacy) {
        setProfileVisibility(privacy.profileVisibility ?? 'alumni-only');
        setShowEmail(privacy.showEmail ?? false);
        setShowPhone(privacy.showPhone ?? false);
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
      await axios.post(`${API_BASE_URL}/api/auth/change-password`, {
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
      await axios.put(`${API_BASE_URL}/api/auth/preferences`, {
        notifications: {
          email: emailNotifications,
          push: pushNotifications,
          donationUpdates,
          mentorshipAlerts
        }
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Notification preferences saved');
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
      await axios.put(`${API_BASE_URL}/api/auth/preferences`, {
        privacy: {
          profileVisibility,
          showEmail,
          showPhone
        }
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Privacy settings saved');
      setViewMode('main');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save privacy settings');
    } finally {
      setLoading(false);
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

        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <p className="font-medium">Email Notifications</p>
              <p className="text-sm text-gray-600">Receive updates via email</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={emailNotifications}
                onChange={(e) => setEmailNotifications(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <p className="font-medium">Push Notifications</p>
              <p className="text-sm text-gray-600">Receive in-app notifications</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={pushNotifications}
                onChange={(e) => setPushNotifications(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <p className="font-medium">Donation Updates</p>
              <p className="text-sm text-gray-600">Get notified about donation impacts</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={donationUpdates}
                onChange={(e) => setDonationUpdates(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium">Mentorship Alerts</p>
              <p className="text-sm text-gray-600">Updates from mentors/mentees</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={mentorshipAlerts}
                onChange={(e) => setMentorshipAlerts(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
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
              onChange={(e) => setProfileVisibility(e.target.value as any)}
              className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="public">Public - Anyone can view</option>
              <option value="alumni-only">Alumni Only - Only verified alumni</option>
              <option value="private">Private - Only you</option>
            </select>
          </div>

          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <p className="font-medium">Show Email Address</p>
              <p className="text-sm text-gray-600">Display your email on profile</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={showEmail}
                onChange={(e) => setShowEmail(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium">Show Phone Number</p>
              <p className="text-sm text-gray-600">Display your phone on profile</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={showPhone}
                onChange={(e) => setShowPhone(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
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
