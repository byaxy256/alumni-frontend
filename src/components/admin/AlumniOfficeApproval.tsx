import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Check, X, Clock, Mail, Phone, User, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
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
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [allUsers, setAllUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
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
      setPendingUsers(alumniOffice.filter((u: { meta: { approved: boolean; }; }) => u.meta?.approved !== true));
    } catch (err) {
      console.error('Failed to load pending alumni office accounts:', err);
      toast.error('Failed to load pending accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (uid: string, approved: boolean) => {
    try {
      setProcessing(true);
      const token = localStorage.getItem('token');
      await apiCall('/admin/approve-alumni-office', 'POST', { uid, approved }, token || undefined);
      
      toast.success(approved ? 'Alumni office account approved' : 'Alumni office account rejected');
      
      // Reload the list
      await loadAllAlumniOffice();
      
      setShowApproveDialog(false);
      setShowRejectDialog(false);
      setSelectedUser(null);
    } catch (err: any) {
      console.error('Failed to update approval status:', err);
      toast.error(err.message || 'Failed to update approval status');
    } finally {
      setProcessing(false);
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
    if (!createForm.fullName || !createForm.email || !createForm.password || !createForm.adminSecret) {
      toast.error('Full name, email, password, and admin secret are required.');
      return;
    }
    try {
      setCreating(true);
      const payload = {
        full_name: createForm.fullName,
        email: createForm.email,
        phone: createForm.phone || '',
        password: createForm.password,
        role: 'alumni_office',
        meta: {
          staff_id: createForm.staffId || null,
          approved: false,
          suspended: false,
        },
        adminSecret: createForm.adminSecret,
      };
      await apiCall('/auth/register', 'POST', payload);
      toast.success('Alumni office account created. Approve it below.');
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
        <h1 className="text-3xl font-bold">Alumni Office Account Approval</h1>
        <p className="text-muted-foreground">Review and approve alumni office staff registrations</p>
        <div className="text-sm text-muted-foreground mt-1">
          Pending: {pendingUsers.length} • Total Alumni Office: {allUsers.length}
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

      {allUsers.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Clock className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No Alumni Office Users</h3>
            <p className="text-muted-foreground">There are no alumni office accounts yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allUsers.map((user) => {
            const isPending = user.meta?.approved !== true;
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
                      {isPending ? (
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                          <Clock className="w-3 h-3 mr-1" />
                          Pending Review
                        </Badge>
                      ) : isSuspended ? (
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                          Suspended
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Approved
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
                  {isPending ? (
                    <>
                      <Button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowApproveDialog(true);
                        }}
                        className="flex-1 bg-green-500 hover:bg-green-600 text-black border border-green-600 transition-colors"
                        size="sm"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowRejectDialog(true);
                        }}
                        variant="destructive"
                        className="flex-1"
                        size="sm"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        onClick={() => handleSuspend(user.uid, !isSuspended)}
                        className="flex-1"
                        variant={isSuspended ? 'secondary' : 'outline'}
                        size="sm"
                        disabled={processing}
                      >
                        {isSuspended ? 'Unsuspend User' : 'Suspend User'}
                      </Button>
                      <Button
                        onClick={() => handleDelete(user.uid)}
                        variant="destructive"
                        className="flex-1"
                        size="sm"
                        disabled={processing}
                      >
                        Delete User
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
            );
          })}
        </div>
      )}

      {/* Approve Dialog */}
      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Alumni Office Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve <strong>{selectedUser?.full_name}</strong> ({selectedUser?.email}) as an alumni office staff member?
              <br /><br />
              They will gain access to manage applications, view student records, and perform other alumni office functions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedUser && handleApproval(selectedUser.uid, true)}
              disabled={processing}
              className="bg-green-500 hover:bg-green-600 text-black border border-green-600 transition-colors"
            >
              {processing ? 'Approving...' : 'Approve Account'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Alumni Office Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject <strong>{selectedUser?.full_name}</strong> ({selectedUser?.email})?
              <br /><br />
              This account will be marked as rejected and they will not be able to access alumni office features.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedUser && handleApproval(selectedUser.uid, false)}
              disabled={processing}
              className="bg-red-600 hover:bg-red-700"
            >
              {processing ? 'Rejecting...' : 'Reject Account'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
