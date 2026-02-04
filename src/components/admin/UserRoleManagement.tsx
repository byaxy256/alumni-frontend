import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '../ui/alert-dialog';
import { Search, UserPlus, Shield, Eye, Mail, Copy, Filter, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { apiCall } from '../../api';

interface BackendUser {
  uid: string;
  full_name: string;
  email: string;
  phone?: string;
  role: 'student' | 'alumni' | 'admin' | 'alumni_office';
  meta?: { approved?: boolean; [key: string]: any };
  last_login?: string;
  created_at?: string;
  updated_at?: string;
}

interface AuditLog {
  _id: string;
  timestamp: string;
  user_uid: string;
  user_email?: string;
  user_role?: string;
  action: string;
  details: string;
  ip_address?: string;
}

export default function UserRoleManagement() {
  const [users, setUsers] = useState<BackendUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<BackendUser | null>(null);
  const [showFootprints, setShowFootprints] = useState(false);
  const [footprintsUser, setFootprintsUser] = useState<BackendUser | null>(null);
  const [footprints, setFootprints] = useState<AuditLog[]>([]);
  const [footprintsLoading, setFootprintsLoading] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const data = await apiCall('/auth/users', 'GET', undefined, token || undefined);
        setUsers(data || []);
      } catch (err) {
        console.error('Failed to load users', err);
        toast.error('Failed to load users');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const name = user.full_name?.toLowerCase() || '';
      const email = user.email?.toLowerCase() || '';
      const matchesSearch = name.includes(searchQuery.toLowerCase()) || email.includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === 'all' || user.role === roleFilter.toLowerCase();
      const derivedStatus = user.role === 'alumni_office' && user.meta?.approved === false ? 'pending' : 'verified';
      const matchesStatus = statusFilter === 'all' || derivedStatus === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  const statusCounts = useMemo(() => {
    const counts = { all: users.length, pending: 0, verified: 0 };
    users.forEach(user => {
      const derivedStatus = user.role === 'alumni_office' && user.meta?.approved === false ? 'pending' : 'verified';
      counts[derivedStatus] += 1;
    });
    return counts;
  }, [users]);

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email).then(() => toast.success('Email copied'));
  };

  const handleContact = (email: string) => {
    window.location.href = `mailto:${email}`;
  };

  const handleGrantRole = (role: string) => {
    toast.success(`Role updated to ${role}`);
  };

  const loadFootprints = async (user: BackendUser) => {
    try {
      setFootprintsLoading(true);
      setFootprintsUser(user);
      setShowFootprints(true);
      const token = localStorage.getItem('token');
      const logs = await apiCall(`/admin/audit-logs?user=${user.uid}&limit=100`, 'GET', undefined, token || undefined);
      setFootprints(logs || []);
    } catch (err) {
      console.error('Failed to load footprints:', err);
      toast.error('Failed to load user footprints');
    } finally {
      setFootprintsLoading(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return timestamp;
    }
  };

  const getActionBadgeColor = (action: string) => {
    if (action.includes('APPROVED') || action.includes('LOGIN')) return 'bg-green-100 text-green-800';
    if (action.includes('REJECTED') || action.includes('SUSPENDED') || action.includes('LOGOUT')) return 'bg-red-100 text-red-800';
    if (action.includes('UPDATED') || action.includes('MODIFIED')) return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-800';
  };

  const formatLastLogin = (value?: string, fallback?: string, fallback2?: string) => {
    const chosen = value || fallback || fallback2;
    if (!chosen) return '—';
    try {
      return new Date(chosen).toLocaleString();
    } catch {
      return chosen;
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1>User & Role Management</h1>
          <p className="text-muted-foreground">Manage user accounts, roles, and permissions</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription>Create a new user account with specific role and permissions</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" placeholder="Enter full name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="Enter email address" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="alumni">Alumni Office</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full">Create User</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('all')}
            >
              All Users ({statusCounts.all})
            </Button>
            <Button
              variant={statusFilter === 'pending' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('pending')}
            >
              Pending ({statusCounts.pending})
            </Button>
            <Button
              variant={statusFilter === 'verified' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('verified')}
            >
              Verified ({statusCounts.verified})
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="student">Students</SelectItem>
                <SelectItem value="alumni">Alumni</SelectItem>
                <SelectItem value="alumni_office">Alumni Office</SelectItem>
                <SelectItem value="admin">Admins</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading users...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => {
                    const derivedStatus = user.role === 'alumni_office' && user.meta?.approved === false ? 'pending' : 'verified';
                    return (
                      <TableRow key={user.uid}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{user.full_name}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="capitalize">
                            {user.role.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={derivedStatus === 'verified' ? 'default' : 'secondary'} className="capitalize">
                            {derivedStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {formatLastLogin(user.last_login, user.updated_at, user.created_at)}
                        </TableCell>
                        <TableCell className="space-x-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedUser(user)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>User Details: {user.full_name}</DialogTitle>
                                <DialogDescription>View user account details</DialogDescription>
                              </DialogHeader>
                              <div className="space-y-3 text-sm">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>Email</Label>
                                    <p>{user.email}</p>
                                  </div>
                                  <div>
                                    <Label>Phone</Label>
                                    <p>{user.phone || '—'}</p>
                                  </div>
                                  <div>
                                    <Label>Role</Label>
                                    <p className="capitalize">{user.role.replace('_', ' ')}</p>
                                  </div>
                                  <div>
                                    <Label>Status</Label>
                                    <p className="capitalize">{derivedStatus}</p>
                                  </div>
                                  <div>
                                    <Label>UID</Label>
                                    <p>{user.uid}</p>
                                  </div>
                                  <div>
                                    <Label>Last Login</Label>
                                    <p>{formatLastLogin(user.last_login, user.updated_at, user.created_at)}</p>
                                  </div>
                                </div>

                                <div className="flex gap-2">
                                  <Button size="sm" variant="outline" onClick={() => handleCopyEmail(user.email)}>
                                    <Copy className="w-4 h-4 mr-1" /> Copy Email
                                  </Button>
                                  <Button size="sm" variant="secondary" onClick={() => handleContact(user.email)}>
                                    <Mail className="w-4 h-4 mr-1" /> Contact
                                  </Button>
                                </div>

                                <div className="space-y-2">
                                  <Label>Change Role (not yet wired)</Label>
                                  <Select onValueChange={handleGrantRole}>
                                    <SelectTrigger>
                                      <SelectValue placeholder={user.role.replace('_', ' ')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="student">Student</SelectItem>
                                      <SelectItem value="alumni">Alumni</SelectItem>
                                      <SelectItem value="alumni_office">Alumni Office</SelectItem>
                                      <SelectItem value="admin">Admin</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <p className="text-xs text-muted-foreground">Role updates require backend endpoint to apply.</p>
                                </div>

                                <Button variant="outline" className="w-full" onClick={() => loadFootprints(user)}>
                                  <Shield className="w-4 h-4 mr-2" /> View Footprints
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Footprints Dialog */}
      <AlertDialog open={showFootprints} onOpenChange={setShowFootprints}>
        <AlertDialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              User Footprints: {footprintsUser?.full_name}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Digital audit trail of all actions performed by {footprintsUser?.email}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4">
            {footprintsLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Loading footprints...</span>
              </div>
            ) : footprints.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No footprints found</p>
                <p className="text-sm">This user has no recorded activity yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>IP Address</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {footprints.map((log) => (
                      <TableRow key={log._id}>
                        <TableCell className="text-sm whitespace-nowrap">{formatTimestamp(log.timestamp)}</TableCell>
                        <TableCell>
                          <Badge className={getActionBadgeColor(log.action)}>
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm max-w-md whitespace-pre-wrap break-words">{log.details}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{log.ip_address || '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowFootprints(false)}>Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
