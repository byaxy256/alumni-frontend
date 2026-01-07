import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Check, X, Clock, Mail, Phone, User, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { apiCall } from '../../api';

interface PendingUser {
  uid: string;
  full_name: string;
  email: string;
  phone?: string;
  meta?: {
    staff_id?: string;
    approved?: boolean;
  };
  created_at: string;
}

export default function AlumniOfficeApproval() {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadPendingUsers();
  }, []);

  const loadPendingUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const users = await apiCall('/admin/pending-alumni-office', 'GET', undefined, token || undefined);
      setPendingUsers(users);
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
      await loadPendingUsers();
      
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
      </div>

      {pendingUsers.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Clock className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No Pending Requests</h3>
            <p className="text-muted-foreground">All alumni office account requests have been reviewed.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pendingUsers.map((user) => (
            <Card key={user.uid} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="w-5 h-5" />
                      {user.full_name}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                        <Clock className="w-3 h-3 mr-1" />
                        Pending Review
                      </Badge>
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
                    onClick={() => {
                      setSelectedUser(user);
                      setShowApproveDialog(true);
                    }}
                    className="flex-1 bg-green-600 hover:bg-amber-500 text-white transition-colors"
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
                </div>
              </CardContent>
            </Card>
          ))}
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
              className="bg-green-600 hover:bg-amber-500 text-white transition-colors"
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
