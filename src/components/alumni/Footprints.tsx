import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Search, Filter, Download, Shield, Activity } from 'lucide-react';
import { toast } from 'sonner';

// Firestore
import { getFirestore, collection, query, orderBy, onSnapshot } from 'firebase/firestore';

type Footprint = {
  id: string;
  timestamp: string; // ISO string for display
  user: string;
  action: string;
  details: string;
  category: string;
  ipAddress?: string;
};

const categoryColors: Record<string, string> = {
  approval: 'bg-green-100 text-green-800',
  import: 'bg-blue-100 text-blue-800',
  review: 'bg-yellow-100 text-yellow-800',
  user_management: 'bg-purple-100 text-purple-800',
  broadcast: 'bg-pink-100 text-pink-800',
  project: 'bg-indigo-100 text-indigo-800',
  transaction: 'bg-cyan-100 text-cyan-800',
  merch: 'bg-orange-100 text-orange-800',
  event: 'bg-teal-100 text-teal-800',
  consent: 'bg-lime-100 text-lime-800',
  report: 'bg-slate-100 text-slate-800',
  auth: 'bg-gray-100 text-gray-800',
};

export default function Footprints() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [footprints, setFootprints] = useState<Footprint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const db = getFirestore();
    const q = query(collection(db, 'footprints'), orderBy('ts', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const items: Footprint[] = snap.docs.map((doc) => {
        const d = doc.data() as any;
        let tsStr = '';
        if (d?.ts?.toDate && typeof d.ts.toDate === 'function') {
          tsStr = d.ts.toDate().toISOString();
        } else if (d?.ts instanceof Date) {
          tsStr = d.ts.toISOString();
        } else if (typeof d?.ts === 'string') {
          tsStr = d.ts;
        } else {
          tsStr = new Date().toISOString();
        }

        return {
          id: doc.id,
          timestamp: tsStr,
          user: d.user || d.actor || 'system',
          action: d.action || d.event || '',
          details: d.details || '',
          category: d.category || 'auth',
          ipAddress: d.ipAddress || d.ip || '',
        };
      });
      setFootprints(items);
      setLoading(false);
    }, (err) => {
      console.error('Footprints subscription error', err);
      toast.error('Failed to load footprints');
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const filteredFootprints = footprints.filter(footprint => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      footprint.action.toLowerCase().includes(q) ||
      footprint.details.toLowerCase().includes(q) ||
      footprint.user.toLowerCase().includes(q);

    const matchesCategory = categoryFilter === 'all' || footprint.category === categoryFilter;

    let matchesDate = true;
    if (dateFilter !== 'all') {
      const footprintDate = new Date(footprint.timestamp);
      const today = new Date();

      if (dateFilter === 'today') {
        matchesDate = footprintDate.toDateString() === today.toDateString();
      } else if (dateFilter === 'week') {
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        matchesDate = footprintDate >= weekAgo;
      } else if (dateFilter === 'month') {
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        matchesDate = footprintDate >= monthAgo;
      }
    }

    return matchesSearch && matchesCategory && matchesDate;
  });

  const handleExport = () => {
    // lightweight CSV export from current filtered list
    if (!filteredFootprints.length) {
      toast.error('No footprints to export');
      return;
    }
    const headers = ['timestamp', 'user', 'category', 'action', 'details', 'ipAddress'];
    const rows = filteredFootprints.map(f =>
      headers.map(h => `"${(f as any)[h] ?? ''}"`).join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `footprints_${new Date().toISOString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Footprints exported to CSV');
  };

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2">
            <Activity className="w-6 h-6" />
            Digital Logbook (Footprints)
          </h2>
          <p className="text-muted-foreground">Immutable activity log of all system actions</p>
        </div>
        <Button onClick={handleExport} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export Logs
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Activities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search activities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="approval">Approvals</SelectItem>
                <SelectItem value="import">Imports</SelectItem>
                <SelectItem value="review">Reviews</SelectItem>
                <SelectItem value="user_management">User Management</SelectItem>
                <SelectItem value="broadcast">Broadcasts</SelectItem>
                <SelectItem value="project">Projects</SelectItem>
                <SelectItem value="transaction">Transactions</SelectItem>
                <SelectItem value="merch">Merchandise</SelectItem>
                <SelectItem value="event">Events</SelectItem>
                <SelectItem value="consent">Consents</SelectItem>
                <SelectItem value="report">Reports</SelectItem>
                <SelectItem value="auth">Authentication</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Activity Log</CardTitle>
            <Badge variant="secondary">{filteredFootprints.length} activities</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>IP Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">Loading...</TableCell>
                  </TableRow>
                ) : filteredFootprints.length ? (
                  filteredFootprints.map((footprint) => (
                    <TableRow key={footprint.id}>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {new Date(footprint.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-sm">{footprint.user}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={categoryColors[footprint.category] || ''}>
                          {footprint.category.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>{footprint.action}</TableCell>
                      <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                        {footprint.details}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{footprint.ipAddress}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      No activities found matching your filters
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div className="space-y-1 text-sm">
                <p className="text-muted-foreground">
                  <strong>Immutable Audit Trail:</strong> All footprint entries are permanently recorded and cannot be modified or deleted.
                  Each action is timestamped, linked to the authenticated user, and includes the IP address for security verification.
                </p>
                <p className="text-muted-foreground">
                  Records are retained for 7 years in compliance with Uganda data protection regulations.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
