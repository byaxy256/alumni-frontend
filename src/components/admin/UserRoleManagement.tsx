import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';
import { Search, UserPlus, Shield, Eye, Mail, Copy, Filter } from 'lucide-react';
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
}

export default function UserRoleManagement() {
  const [users, setUsers] = useState<BackendUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<BackendUser | null>(null);

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
      const derivedStatus = user.role === 'alumni_office' && user.meta?.approved === false ? 'pending' : 'active';
      const matchesStatus = statusFilter === 'all' || derivedStatus === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email).then(() => toast.success('Email copied'));
  };

  const handleContact = (email: string) => {
    window.location.href = `mailto:${email}`;
  };

  const handleGrantRole = (role: string) => {
    toast.success(`Role updated to ${role}`);
  };

  const formatLastLogin = (value?: string) => {
    if (!value) return '—';
    try {
      return new Date(value).toLocaleString();
    } catch {
      return value;
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
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
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
                    const derivedStatus = user.role === 'alumni_office' && user.meta?.approved === false ? 'pending' : 'active';
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
                          <Badge variant={derivedStatus === 'active' ? 'default' : 'secondary'} className="capitalize">
                            {derivedStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {formatLastLogin(user.last_login)}
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
                                    <p>{formatLastLogin(user.last_login)}</p>
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

                                <Button variant="outline" className="w-full">
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
    </div>
  );
}
