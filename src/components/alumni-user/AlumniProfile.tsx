import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import type { User } from '../../App';
import { ArrowLeft, User as UserIcon, Mail, Phone, Briefcase, Calendar, LogOut, Edit } from 'lucide-react';
import { Textarea } from '../ui/textarea';
import { api } from '../../api';
import { toast } from 'sonner';
import { useState } from 'react';

interface AlumniProfileProps {
  user: User;
  onBack: () => void;
  onLogout: () => void;
}

export function AlumniProfile({ user, onBack, onLogout }: AlumniProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [about, setAbout] = useState(user.meta?.bio || user.meta?.about || '');
  const [fullName, setFullName] = useState(user.full_name || user.name || '');
  const [email, setEmail] = useState(user.email || '');
  const [phone, setPhone] = useState(user.phone || user.phoneNumber || '');
  const [workRole, setWorkRole] = useState(user.meta?.field || user.course || '');
  const [graduationYear, setGraduationYear] = useState(user.graduationYear || user.meta?.graduationYear || user.meta?.graduation_year || '');
  const [experienceYears, setExperienceYears] = useState(user.meta?.experienceYears || user.meta?.experience_years || '');
  const [workplace, setWorkplace] = useState(user.meta?.company || user.meta?.workplace || user.meta?.currentWorkplace || '');
  const [saving, setSaving] = useState(false);

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
        full_name: fullName,
        email,
        phone,
        meta: newMeta,
      };

      const res = await api.updateProfile(payload, token);
      const updatedUser = res.user;
      localStorage.setItem('user', JSON.stringify(updatedUser));
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
          <button onClick={onBack} className="md:hidden p-2 hover:bg-gray-100 rounded-lg">
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
              <p className="text-gray-600 mb-2">{workRole || 'Work role not set'}</p>
              <p className="text-sm text-gray-500">Class of {user.graduationYear}</p>
              <p className="text-sm text-gray-500">Experience: {experienceYears || 0} yrs</p>
              <p className="text-sm text-gray-500">Workplace: {workplace || 'Not set'}</p>
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
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={!isEditing}
                    className="flex-1"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={!isEditing}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="workRole">Work Role</Label>
              <div className="flex items-center gap-2 mt-1">
                <Briefcase className="w-4 h-4 text-gray-400" />
                <Input
                  id="workRole"
                  value={workRole}
                  onChange={(e) => setWorkRole(e.target.value)}
                  disabled={!isEditing}
                  placeholder="e.g., Data Analyst, Software Engineer"
                  className="flex-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="graduation">Graduation Year</Label>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="w-4 h-4 text-gray-400" />
                <Input
                  id="graduation"
                  value={graduationYear}
                  onChange={(e) => setGraduationYear(e.target.value)}
                  disabled={!isEditing}
                  className="flex-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="experience">Years of Experience</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  id="experience"
                  type="number"
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(e.target.value)}
                  disabled={!isEditing}
                  className="flex-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="workplace">Current Workplace</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  id="workplace"
                  value={workplace}
                  onChange={(e) => setWorkplace(e.target.value)}
                  disabled={!isEditing}
                  className="flex-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="about">About</Label>
              <Textarea
                id="about"
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                disabled={!isEditing}
                placeholder="Share a short bio to help students know you."
                className="mt-1"
                rows={4}
              />
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
          <div className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              Change Password
            </Button>
            <Button variant="outline" className="w-full justify-start">
              Notification Preferences
            </Button>
            <Button variant="outline" className="w-full justify-start">
              Privacy Settings
            </Button>
          </div>
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
