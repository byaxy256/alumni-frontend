import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Mail, Phone, User, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { apiCall } from '../../api';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

interface PendingUser {
  uid: string;
  full_name: string;
  email: string;
  phone?: string;
  role?: string;
  meta?: {
    staff_id?: string;
    approved?: boolean;
    suspended?: boolean;
  };
  created_at: string;
}

export default function AlumniOfficeApproval() {
  const [allUsers, setAllUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    staffId: '',
    password: '',
    adminSecret: '',
  });

  useEffect(() => {
    loadAllAlumniOffice();
  }, []);

  const loadAllAlumniOffice = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const users = await apiCall('/auth/users', 'GET', undefined, token || undefined);
      const alumniOffice = (users || []).filter((u: PendingUser) => u.role === 'alumni_office');
      setAllUsers(alumniOffice);
    } catch (err) {
      console.error('Failed to load alumni office accounts:', err);
      toast.error('Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = async (uid: string, suspended: boolean) => {
    try {
      setProcessing(true);
      const token = localStorage.getItem('token');
      await apiCall('/admin/alumni-office/suspend', 'POST', { uid, suspended }, token || undefined);
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
      await apiCall(`/admin/alumni-office/${uid}`, 'DELETE', undefined, token || undefined);
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
      const payload = {
        full_name: createForm.fullName,
        email: createForm.email,
        phone: createForm.phone || '',
        password: createForm.password,
        role: 'alumni_office',
        meta: {
          staff_id: createForm.staffId || null,
          approved: true,
          suspended: false,
        },
        ...(createForm.adminSecret ? { adminSecret: createForm.adminSecret } : {}),
      };
      await apiCall('/auth/register', 'POST', payload, token || undefined);
      toast.success('Alumni office account created successfully.');
      setCreateForm({ fullName: '', email: '', phone: '', staffId: '', password: '', adminSecret: '' });
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
        <h1 className="text-3xl font-bold">Alumni Office Account Management</h1>
        <p className="text-muted-foreground">Create and manage alumni office staff accounts</p>
        <div className="text-sm text-muted-foreground mt-1">
          Total Staff: {allUsers.length}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create Alumni Office Account</CardTitle>
          <CardDescription>Admins can create staff accounts here (requires admin secret).</CardDescription>
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
            <Input value={createForm.phone} onChange={(e) => setCreateForm(f => ({ ...f, phone: e.target.value.replace(/\\D/g, '').slice(0, 10) }))} maxLength={10} />
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
            <Label>Admin Secret</Label>
            <Input type="password" value={createForm.adminSecret} onChange={(e) => setCreateForm(f => ({ ...f, adminSecret: e.target.value }))} />
          </div>
          <div className="md:col-span-2 flex justify-end">
            <Button onClick={handleCreateAccount} disabled={creating}>
              {creating ? 'Creating...' : 'Create Account'}
            </Button>
          </div>
        </CardContent>
      </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allUsers.map((user) => {
            const isSuspended = user.meta?.suspended === true;
            return (
            <Card key={user.uid} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="w-5 h-5" />
                      {user.full_name}
                    </CardTitle>
                    <CardDescription className="mt-2">
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
