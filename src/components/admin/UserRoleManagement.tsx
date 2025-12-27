import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';
import { Search, UserPlus, Shield, Eye, Ban, CheckCircle, XCircle, Filter } from 'lucide-react';
import { toast } from 'sonner';

const users = [
  { id: 1, name: 'Sarah Nakato', email: 'sarah.nakato@ucu.ac.ug', role: 'Alumni Office', status: 'active', lastLogin: '2 hours ago', verified: true },
  { id: 2, name: 'John Okello', email: 'john.okello@student.ucu.ac.ug', role: 'Student', status: 'active', lastLogin: '1 day ago', verified: true },
  { id: 3, name: 'Mary Achieng', email: 'mary.achieng@ucu.ac.ug', role: 'Alumni Office', status: 'active', lastLogin: '3 hours ago', verified: true },
  { id: 4, name: 'David Musoke', email: 'david.musoke@student.ucu.ac.ug', role: 'Student', status: 'active', lastLogin: '5 mins ago', verified: true },
  { id: 5, name: 'Grace Namugga', email: 'grace.namugga@ucu.ac.ug', role: 'Alumni Office', status: 'pending', lastLogin: 'Never', verified: false },
  { id: 6, name: 'Peter Obua', email: 'peter.obua@student.ucu.ac.ug', role: 'Student', status: 'suspended', lastLogin: '2 weeks ago', verified: true },
  { id: 7, name: 'Jane Atim', email: 'jane.atim@ucu.ac.ug', role: 'Alumni Office', status: 'pending', lastLogin: 'Never', verified: false },
  { id: 8, name: 'Moses Oketch', email: 'moses.oketch@student.ucu.ac.ug', role: 'Student', status: 'active', lastLogin: '3 days ago', verified: true },
];

export default function UserRoleManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<typeof users[0] | null>(null);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleVerifyUser = (userId: number) => {
    toast.success('User verified successfully');
  };

  const handleSuspendUser = (userId: number) => {
    toast.warning('User suspended');
  };

  const handleActivateUser = (userId: number) => {
    toast.success('User activated');
  };

  const handleGrantRole = (role: string) => {
    toast.success(`Role updated to ${role}`);
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
                <SelectItem value="Student">Students</SelectItem>
                <SelectItem value="Alumni Office">Alumni Office</SelectItem>
                <SelectItem value="Admin">Admins</SelectItem>
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
                <SelectItem value="suspended">Suspended</SelectItem>
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
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <div className="flex items-center gap-2">
                          <p>{user.name}</p>
                          {user.verified && <CheckCircle className="w-4 h-4 text-green-600" />}
                        </div>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'Admin' ? 'default' : 'secondary'}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          user.status === 'active' ? 'default' :
                          user.status === 'pending' ? 'secondary' : 'destructive'
                        }
                      >
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{user.lastLogin}</TableCell>
                    <TableCell>
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
                            <DialogTitle>User Details: {user.name}</DialogTitle>
                            <DialogDescription>View and manage user account</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Email</Label>
                                <p className="text-sm">{user.email}</p>
                              </div>
                              <div>
                                <Label>Role</Label>
                                <p className="text-sm">{user.role}</p>
                              </div>
                              <div>
                                <Label>Status</Label>
                                <p className="text-sm">{user.status}</p>
                              </div>
                              <div>
                                <Label>Last Login</Label>
                                <p className="text-sm">{user.lastLogin}</p>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label>Change Role</Label>
                              <Select onValueChange={handleGrantRole}>
                                <SelectTrigger>
                                  <SelectValue placeholder={user.role} />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Student">Student</SelectItem>
                                  <SelectItem value="Alumni Office">Alumni Office</SelectItem>
                                  <SelectItem value="Admin">Admin</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="flex flex-col gap-2 pt-4">
                              {!user.verified && (
                                <Button onClick={() => handleVerifyUser(user.id)} className="w-full">
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Verify User
                                </Button>
                              )}
                              {user.status === 'suspended' ? (
                                <Button onClick={() => handleActivateUser(user.id)} variant="outline" className="w-full">
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Activate User
                                </Button>
                              ) : (
                                <Button onClick={() => handleSuspendUser(user.id)} variant="destructive" className="w-full">
                                  <Ban className="w-4 h-4 mr-2" />
                                  Suspend User
                                </Button>
                              )}
                              <Button variant="outline" className="w-full">
                                <Shield className="w-4 h-4 mr-2" />
                                View Footprints
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
