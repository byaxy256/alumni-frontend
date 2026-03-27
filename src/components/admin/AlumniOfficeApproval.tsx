import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Mail, Phone, User, Calendar, Activity, Wifi } from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE, apiCall } from '../../api';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

interface PendingUser {
  uid: string;
  full_name: string;
  email: string;
  phone?: string;
  role?: string;
  last_login?: string;
  updated_at?: string;
  meta?: {
    staff_id?: string;
    approved?: boolean;
    suspended?: boolean;
    office_role?: string;
    staff_role?: string;
    last_seen?: string;
  };
  created_at: string;
}

interface AuditLogItem {
  _id?: string;
  action?: string;
  details?: string;
  timestamp?: string;
  user_uid?: string;
  user_email?: string;
}

export default function AlumniOfficeApproval() {
  const officeRoles = [
    'administrator',
    'general_secretary',
    'finance',
    'president',
    'vice_president',
    'publicity',
    'secretary_academics',
    'projects_manager',
    'alumni_office',
  ];
  const [allUsers, setAllUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [activityLoading, setActivityLoading] = useState(false);
  const [recentActivity, setRecentActivity] = useState<AuditLogItem[]>([]);
  const [createForm, setCreateForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    staffId: '',
    password: '',
    adminSecret: '',
    role: 'administrator',
  });

  useEffect(() => {
    loadAllAlumniOffice();
    loadRecentActivity();
  }, []);

  const loadAllAlumniOffice = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const users = await apiCall('/auth/users', 'GET', undefined, token || undefined);
      const officeUsers = (users || []).filter((u: PendingUser) => officeRoles.includes(u.role || ''));
      setAllUsers(officeUsers);
    } catch (err) {
      console.error('Failed to load alumni office accounts:', err);
      toast.error('Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  const loadRecentActivity = async () => {
    try {
      setActivityLoading(true);
      const token = localStorage.getItem('token');
      const logs = await apiCall('/admin/audit-logs?limit=12', 'GET', undefined, token || undefined);
      setRecentActivity(Array.isArray(logs) ? logs : []);
    } catch (err) {
      console.error('Failed to load activity logs:', err);
      setRecentActivity([]);
    } finally {
      setActivityLoading(false);
    }
  };

  const handleSuspend = async (uid: string, suspended: boolean) => {
    try {
      setProcessing(true);
      const token = localStorage.getItem('token');
      await apiCall(`/admin/users/${encodeURIComponent(uid)}/suspend`, 'PATCH', { suspended }, token || undefined);
      toast.success(suspended ? 'User suspended' : 'User unsuspended');
      await loadAllAlumniOffice();
    } catch (err: any) {
      console.error('Failed to update suspension:', err);
      toast.error(err.message || 'Failed to update suspension');
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (uid: string) => {
    try {
      setProcessing(true);
      const token = localStorage.getItem('token');
      await apiCall(`/admin/users/${encodeURIComponent(uid)}`, 'DELETE', undefined, token || undefined);
      toast.success('User deleted');
      await loadAllAlumniOffice();
    } catch (err: any) {
      console.error('Failed to delete user:', err);
      toast.error(err.message || 'Failed to delete user');
    } finally {
      setProcessing(false);
    }
  };

  const handleCreateAccount = async () => {
    if (!createForm.fullName || !createForm.email || !createForm.password) {
      toast.error('Full name, email, and password are required.');
      return;
    }
    try {
      setCreating(true);
      const token = localStorage.getItem('token') || '';
      const staffPayload = {
        full_name: createForm.fullName,
        email: createForm.email,
        phone: createForm.phone || '',
        password: createForm.password,
        role: createForm.role,
        staff_id: createForm.staffId || '',
        adminSecret: createForm.adminSecret || '',
      };

      const createViaLegacyRegister = async () => {
        const legacyPayload = {
          full_name: createForm.fullName,
          email: createForm.email,
          phone: createForm.phone || '',
          password: createForm.password,
          role: 'alumni_office',
          adminSecret: createForm.adminSecret || '',
          meta: {
            staff_id: createForm.staffId || '',
            approved: true,
            suspended: false,
            must_change_password: true,
            admin_secret_verified: false,
            office_role: createForm.role,
          },
        };

        const legacyRes = await fetch(`${API_BASE}/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(legacyPayload),
        });

        const legacyData = await legacyRes.json().catch(() => ({}));
        if (!legacyRes.ok) {
          throw new Error(legacyData.error || legacyData.message || 'Failed to create account');
        }
      };

      const response = await fetch(`${API_BASE}/admin/office-accounts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(staffPayload),
      });

      if (response.status === 404 || response.status >= 500) {
        try {
          await createViaLegacyRegister();
        } catch (legacyError: any) {
          const message = String(legacyError?.message || '');
          if (
            message.toLowerCase().includes('server error') ||
            message.toLowerCase().includes('validation failed') ||
            message.toLowerCase().includes('`role`')
          ) {
            throw new Error(
              'Your backend is still running the old auth/register logic and does not yet support the new internal office roles. Redeploy the latest backend, then try again.'
            );
          }
          throw legacyError;
        }
      } else {
        const responseData = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(responseData.error || responseData.message || 'Failed to create account');
        }
      }

      toast.success('Office account created successfully.');
      setCreateForm({ fullName: '', email: '', phone: '', staffId: '', password: '', adminSecret: '', role: 'administrator' });
      await loadAllAlumniOffice();
    } catch (err: any) {
      console.error('Failed to create alumni office account:', err);
      toast.error(err?.error || err?.message || 'Failed to create account');
    } finally {
      setCreating(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const resolveLastSeen = (user: PendingUser): string | null => {
    return user.last_login || user.meta?.last_seen || user.updated_at || null;
  };

  const formatRelativeTime = (isoDate?: string | null) => {
    if (!isoDate) return '—';
    const dt = new Date(isoDate);
    if (Number.isNaN(dt.getTime())) return '—';
    const diffMs = Date.now() - dt.getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const onlineUsers = allUsers.filter((user) => {
    if (user.meta?.suspended) return false;
    const lastSeen = resolveLastSeen(user);
    if (!lastSeen) return false;
    const time = new Date(lastSeen).getTime();
    if (!Number.isFinite(time)) return false;
    return Date.now() - time <= 15 * 60 * 1000;
  });

  const activeTodayCount = allUsers.filter((user) => {
    const lastSeen = resolveLastSeen(user);
    if (!lastSeen) return false;
    const time = new Date(lastSeen).getTime();
    if (!Number.isFinite(time)) return false;
    return Date.now() - time <= 24 * 60 * 60 * 1000;
  }).length;

  if (loading) {
    return (
      <div className="p-4 lg:p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading pending accounts...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Internal Office Accounts</h1>
        <p className="text-muted-foreground">Create and manage the six internal office roles from here.</p>
        <div className="text-sm text-muted-foreground mt-1">
          Total Staff: {allUsers.length}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>How Staff Access Their Accounts</CardTitle>
          <CardDescription>These are real accounts created by admin. Staff do not register from the public signup page.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>1. Create the account here and assign one of the office roles.</p>
          <p>2. Give the staff member their email or phone plus the temporary password you set.</p>
          <p>3. They use the normal sign in page.</p>
          <p>4. On first login, the system asks for the admin secret, then forces them to set a new permanent password.</p>
          <p>5. After that, they sign in normally and go straight to the correct role dashboard automatically.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Create Internal Office Account</CardTitle>
          <CardDescription>Admins create staff accounts here. Public signup remains only for students and alumni.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Full Name</Label>
            <Input value={createForm.fullName} onChange={(e) => setCreateForm(f => ({ ...f, fullName: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" value={createForm.email} onChange={(e) => setCreateForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input value={createForm.phone} onChange={(e) => setCreateForm(f => ({ ...f, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))} maxLength={10} />
          </div>
          <div className="space-y-2">
            <Label>Staff ID</Label>
            <Input value={createForm.staffId} onChange={(e) => setCreateForm(f => ({ ...f, staffId: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Temporary Password</Label>
            <Input type="password" value={createForm.password} onChange={(e) => setCreateForm(f => ({ ...f, password: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Office Role</Label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              title="Office Role"
              aria-label="Office Role"
              value={createForm.role}
              onChange={(e) => setCreateForm(f => ({ ...f, role: e.target.value }))}
            >
              <option value="administrator">Administrator</option>
              <option value="general_secretary">General Secretary</option>
              <option value="finance">Finance</option>
              <option value="president">President</option>
              <option value="vice_president">Vice President</option>
              <option value="publicity">Publicity</option>
              <option value="secretary_academics">Secretary Academics</option>
              <option value="projects_manager">Projects Manager</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Admin Secret</Label>
            <Input type="password" value={createForm.adminSecret} onChange={(e) => setCreateForm(f => ({ ...f, adminSecret: e.target.value }))} />
            <p className="text-xs text-muted-foreground">
              Used once on the staff member&apos;s first login. If your backend already has `ADMIN_REGISTRATION_SECRET`, this can match that secret.
            </p>
          </div>
          <div className="md:col-span-2 flex justify-end">
            <Button onClick={handleCreateAccount} disabled={creating}>
              {creating ? 'Creating...' : 'Create Account'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi className="w-5 h-5" />
            Online Sessions & Activity
          </CardTitle>
          <CardDescription>Track who is currently online and recent admin/system activity.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-lg border p-3 bg-green-50">
              <p className="text-xs text-muted-foreground">Online Now</p>
              <p className="text-2xl font-semibold text-green-700">{onlineUsers.length}</p>
            </div>
            <div className="rounded-lg border p-3 bg-blue-50">
              <p className="text-xs text-muted-foreground">Active in 24h</p>
              <p className="text-2xl font-semibold text-blue-700">{activeTodayCount}</p>
            </div>
            <div className="rounded-lg border p-3 bg-slate-50">
              <p className="text-xs text-muted-foreground">Recent Activity Entries</p>
              <p className="text-2xl font-semibold text-slate-700">{recentActivity.length}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-lg border">
              <div className="px-3 py-2 border-b text-sm font-medium">Current Online Sessions</div>
              <div className="max-h-56 overflow-y-auto divide-y">
                {onlineUsers.length === 0 ? (
                  <p className="p-3 text-sm text-muted-foreground">No active sessions right now.</p>
                ) : (
                  onlineUsers.map((u) => (
                    <div key={u.uid} className="p-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium">{u.full_name}</p>
                        <p className="text-xs text-muted-foreground">{(u.meta?.staff_role || u.meta?.office_role || u.role || '').replace(/_/g, ' ')}</p>
                      </div>
                      <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">Online</Badge>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-lg border">
              <div className="px-3 py-2 border-b text-sm font-medium flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Recent Activity
              </div>
              <div className="max-h-56 overflow-y-auto divide-y">
                {activityLoading ? (
                  <p className="p-3 text-sm text-muted-foreground">Loading activity...</p>
                ) : recentActivity.length === 0 ? (
                  <p className="p-3 text-sm text-muted-foreground">No recent activity found.</p>
                ) : (
                  recentActivity.map((log, idx) => (
                    <div key={log._id || `${log.user_uid || 'log'}-${idx}`} className="p-3">
                      <p className="text-sm font-medium">{log.action || 'Activity'}</p>
                      <p className="text-xs text-muted-foreground truncate">{log.details || log.user_email || 'No details'}</p>
                      <p className="text-[11px] text-muted-foreground mt-1">{formatRelativeTime(log.timestamp)}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allUsers.map((user) => {
            const isSuspended = user.meta?.suspended === true;
            const displayRole = (user.meta?.staff_role || user.meta?.office_role || user.role || 'office').replace(/_/g, ' ');
            return (
            <Card key={user.uid} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="w-5 h-5" />
                      {user.full_name}
                    </CardTitle>
                    <CardDescription className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="capitalize">
                        {displayRole}
                      </Badge>
                      {isSuspended ? (
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                          Suspended
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Active
                        </Badge>
                      )}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    <span className="truncate">{user.email}</span>
                  </div>
                  {user.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="w-4 h-4" />
                      <span>{user.phone}</span>
                    </div>
                  )}
                  {user.meta?.staff_id && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <User className="w-4 h-4" />
                      <span>Staff ID: {user.meta.staff_id}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(user.created_at)}</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-3 border-t">
                  <Button
                    onClick={() => handleSuspend(user.uid, !isSuspended)}
                    className="flex-1"
                    variant={isSuspended ? 'secondary' : 'outline'}
                    size="sm"
                    disabled={processing}
                  >
                    {isSuspended ? 'Unsuspend' : 'Suspend'}
                  </Button>
                  <Button
                    onClick={() => handleDelete(user.uid)}
                    variant="destructive"
                    className="flex-1"
                    size="sm"
                    disabled={processing}
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
            );
          })}
        </div>

    </div>
  );
}
