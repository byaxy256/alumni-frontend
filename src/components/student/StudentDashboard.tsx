// src/components/student/StudentDashboard.tsx

import { useState, useEffect, useMemo } from 'react';
import { Card } from '../ui/card';
import type { User } from '../../App';
import { DollarSign, Gift, Users, Newspaper, Bell, ChevronRight, Loader2, FileText, Wallet } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { API_BASE } from '../../api';
import { toast } from 'sonner';


// --- Type Definitions ---
interface Loan { id: string; amount_requested: number; status: string; created_at: string; [key: string]: any; }
interface SupportRequest { id: string; amount_requested: number; status: string; created_at: string; [key: string]: any; }
interface NotificationItem { id: string; title: string; message: string; time: string; read: boolean; }

export function StudentDashboard({ user, onNavigate }: { user: User; onNavigate: (screen: string) => void; }) {
  const [me, setMe] = useState<User | null>(user);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [supportRequests, setSupportRequests] = useState<SupportRequest[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [mentors, setMentors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);

  // This is the correct, robust data-fetching logic.
  const fetchAll = async () => {
      // setLoading(true); // Can be commented out for smoother refetches
      try {
        const token = localStorage.getItem('token') || '';
        console.log('Token from localStorage:', token ? token.substring(0, 20) + '...' : 'NO TOKEN');
        const fetchOptions = { headers: { Authorization: `Bearer ${token}` }, cache: 'no-cache' as RequestCache };
        
        const [meRes, loansRes, supportRes, notifsRes, mentorsRes] = await Promise.all([
          fetch(`${API_BASE}/auth/me`, fetchOptions),
          fetch(`${API_BASE}/loans/mine`, fetchOptions),
          fetch(`${API_BASE}/support/mine`, fetchOptions).catch(() => null),
          fetch(`${API_BASE}/notifications/mine`, fetchOptions).catch(() => null),
          fetch(`${API_BASE}/mentors/my-mentors`, fetchOptions).catch(() => null),
        ]);

        if (meRes.ok) { const meJson = await meRes.json(); if (meJson.user) setMe(meJson.user); }
        const loansJson = loansRes.ok ? await loansRes.json() : [];
        const supportJson = supportRes && supportRes.ok ? (await supportRes.json()) : [];
        const mentorsJson = mentorsRes && mentorsRes.ok ? (await mentorsRes.json()) : [];
        setLoans(Array.isArray(loansJson) ? loansJson : []);
        setSupportRequests(Array.isArray(supportJson) ? supportJson : []);
        setMentors(Array.isArray(mentorsJson) ? mentorsJson : []);
        
        const notifsJson = notifsRes && notifsRes.ok ? (await notifsRes.json()) : [];
        setNotifications(Array.isArray(notifsJson) ? notifsJson.map((n: any) => ({
            id: n.id, title: n.title, message: n.message, time: n.created_at, read: !!n.read
        })) : []);
      } catch (err: any) {
        if (err.name !== 'AbortError') toast.error("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    fetchAll();
    const onAppSubmitted = () => fetchAll();
    window.addEventListener('application:submitted', onAppSubmitted);

    // Real-time notification polling every 5 seconds
    const notificationInterval = setInterval(async () => {
      try {
        const token = localStorage.getItem('token') || '';
        const response = await fetch(`${API_BASE}/notifications/mine`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-cache' as RequestCache
        });
        if (response.ok) {
          const notifsJson = await response.json();
          const newNotifications = Array.isArray(notifsJson) ? notifsJson.map((n: any) => ({
            id: n.id, title: n.title, message: n.message, time: n.created_at, read: !!n.read
          })) : [];
          
          // Check for new unread notifications
          const oldUnreadIds = notifications.filter(n => !n.read).map(n => n.id);
          const newUnreadNotifs = newNotifications.filter((n: NotificationItem) => 
            !n.read && !oldUnreadIds.includes(n.id)
          );
          
          // Show toast for new notifications
          if (newUnreadNotifs.length > 0) {
            newUnreadNotifs.forEach((notif: NotificationItem) => {
              toast.info(notif.title, {
                description: notif.message,
                duration: 5000,
              });
            });
          }
          
          setNotifications(newNotifications);
        }
      } catch (error) {
        console.error('Error polling notifications:', error);
      }
    }, 5000);

    return () => {
      window.removeEventListener('application:submitted', onAppSubmitted);
      clearInterval(notificationInterval);
    };
  }, [notifications]);

  const handleNotificationClick = async (notification: NotificationItem) => {
    setSelectedNotification(notification);
    // Mark as read if not already read
    if (!notification.read) {
      try {
        const token = localStorage.getItem('token') || '';
        await fetch(`${API_BASE}/notifications/${notification.id}/read`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}` }
        });
        // Update local state
        setNotifications(prev => prev.map(n => 
          n.id === notification.id ? { ...n, read: true } : n
        ));
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }
  };

  const handleViewAllNotifications = () => {
    onNavigate('notifications');
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const activeLoan = loans.find(l => l.status === 'approved' || l.status === 'active');
  const totalApplications = loans.length + supportRequests.length;
  const activeLoansCount = loans.filter(l => l.status === 'approved' || l.status === 'active').length;
  const allApplications = useMemo(() => {
    const combined = [
      ...loans.map(l => ({ ...l, type: 'Loan' })),
      ...supportRequests.map(sr => ({ ...sr, type: 'Support' }))
    ];
    return combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [loans, supportRequests]);
  
  const quickActions = [
    { id: 'apply-loan', title: 'Student Loan', subtitle: 'Apply for financial aid', icon: DollarSign, iconBg: 'var(--primary)' },
    { id: 'loans', title: 'My Loans', subtitle: 'View loans & payments', icon: Wallet, iconBg: 'var(--brand-blue)' },
    { id: 'apply-benefit', title: 'Student Benefit', subtitle: 'Emergency support', icon: Gift, iconBg: 'var(--accent-primary-mix)' },
    { id: 'mentorship', title: 'Pick a Mentor', subtitle: 'View profiles before requesting', icon: Users, iconBg: 'var(--brand-purple)' },
    { id: 'news', title: 'News', subtitle: 'Latest updates', icon: Newspaper, iconBg: 'var(--brand-blue)' },
  ];
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="ml-4">Loading Dashboard...</p>
      </div>
    );
  }

  const loanBalance = activeLoan ? (activeLoan.amount_requested || 0) : 0;
  const deductionsTotal = supportRequests.filter(sr => sr.status !== 'rejected').reduce((s, sr) => s + (sr.amount_requested || 0), 0);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-6 py-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Welcome back, {me?.full_name?.split(' ')[0] || 'Student'}</h1>
            <p className="text-sm text-gray-500 mt-0.5">Student Dashboard</p>
          </div>
          <button onClick={handleViewAllNotifications} className="relative p-2 rounded-full hover:bg-gray-100 transition">
            <Bell className="w-6 h-6 text-gray-600" />
            {unreadCount > 0 && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />}
          </button>
        </div>

        {/* Metric cards: blue, red, green */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card className="border-0 shadow-md overflow-hidden">
            <div className="p-5 text-white" style={{ backgroundColor: 'var(--card-metric-blue)' }}>
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5" />
                <span className="text-sm font-medium opacity-90">Loans Balance</span>
              </div>
              <p className="text-2xl font-bold">UGX {(loanBalance || 0).toLocaleString()}</p>
              <p className="text-xs opacity-90 mt-1">This Semester</p>
            </div>
          </Card>
          <Card className="border-0 shadow-md overflow-hidden">
            <div className="p-5 text-white" style={{ backgroundColor: 'var(--card-metric-red)' }}>
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-5 h-5" />
                <span className="text-sm font-medium opacity-90">Deductions</span>
              </div>
              <p className="text-2xl font-bold">UGX {deductionsTotal.toLocaleString()}</p>
              <p className="text-xs opacity-90 mt-1">This Semester</p>
            </div>
          </Card>
          <Card className="border-0 shadow-md overflow-hidden">
            <div className="p-5 text-white" style={{ backgroundColor: 'var(--card-metric-green)' }}>
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5" />
                <span className="text-sm font-medium opacity-90">Mentorship</span>
              </div>
              <p className="text-xl font-bold">{mentors.length > 0 ? 'Active' : '—'}</p>
              <p className="text-xs opacity-90 mt-1">{mentors.length} mentor{mentors.length !== 1 ? 's' : ''}</p>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {quickActions.map(a => {
              const Icon = a.icon;
              return (
                <button key={a.id} onClick={() => onNavigate(a.id)} className="group text-left">
                  <Card className="p-5 hover:shadow-lg transition-all border border-gray-200 bg-white overflow-hidden relative hover:-translate-y-0.5">
                    <div className="relative">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3 text-white"
                        style={{ backgroundColor: a.iconBg }}
                      >
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-sm text-foreground mb-1 font-semibold">{a.title}</h3>
                      <p className="text-xs text-muted-foreground">{a.subtitle}</p>
                    </div>
                  </Card>
                </button>
              );
            })}
          </div>

          <div className="mb-6">
            <h2 className="text-lg text-gray-900 font-semibold mb-4">Recent Notices</h2>
            <div className="space-y-2">
              {notifications.slice(0, 2).map((n) => (
                <Card key={n.id} className="p-4 border border-gray-200 bg-white flex items-center gap-3">
                  <input type="checkbox" className="rounded border-gray-300" readOnly checked={n.read} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{n.title}</p>
                    <p className="text-xs text-gray-500">{n.time}</p>
                  </div>
                </Card>
              ))}
              {notifications.length === 0 && (
                <Card className="p-4 border border-gray-200 bg-white text-sm text-gray-500">No recent notices.</Card>
              )}
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-lg text-gray-900 font-semibold mb-4">My Applications</h2>
            <div className="space-y-3">
              {allApplications.length > 0 ? (
                allApplications.map((app) => (
                  <Card key={`${app.type}-${app.id}`} className="p-4 bg-white border border-gray-200">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-foreground">{app.type} Application</p>
                        <p className="text-sm text-muted-foreground">Amount: UGX {(app.amount_requested || 0).toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Submitted: {new Date(app.created_at || new Date()).toLocaleDateString()}</p>
                      </div>
                      <Badge className={`capitalize ${app.status === 'pending' ? 'bg-accent/20 text-accent-foreground' : ''} ${app.status === 'approved' ? 'bg-primary/20 text-primary' : ''} ${app.status === 'rejected' ? 'bg-destructive/20 text-destructive' : ''}`}>
                        {app.status || 'pending'}
                      </Badge>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="text-center py-4 border-2 border-dashed rounded-lg">
                  <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">You have no submitted applications.</p>
                </div>
              )}
            </div>
          </div>

          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg text-foreground">Recent Notifications</h2>
              <button onClick={handleViewAllNotifications} className="text-sm text-primary hover:underline">View All</button>
            </div>
            <div className="space-y-3">
              {notifications.length > 0 ? (
                notifications.slice(0, 3).map((notification) => (
                  <Card key={notification.id} onClick={() => handleNotificationClick(notification)} className="p-4 hover:shadow-md transition-shadow cursor-pointer border border-gray-200 bg-white relative">
                    {!notification.read && <div className="absolute top-4 right-4 w-2 h-2 bg-red-500 rounded-full"></div>}
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-accent/20"><Bell className="w-5 h-5 text-accent" /></div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm text-foreground ${!notification.read ? 'font-semibold' : ''}`}>{notification.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">{notification.message}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
                    </div>
                  </Card>
                ))
              ) : (
                <div className="text-sm text-center text-muted-foreground py-4">No notifications</div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-6">
            <Card className="p-4 text-center border border-border" style={{ backgroundColor: 'var(--brand-blue-soft-10)' }}>
              <p className="text-2xl font-bold" style={{ color: 'var(--brand-blue)' }}>{totalApplications}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--brand-blue)' }}>Total Applications</p>
            </Card>
            <Card className="p-4 text-center border border-border" style={{ backgroundColor: 'var(--accent-soft-20)' }}>
              <p className="text-2xl font-bold text-primary">{activeLoansCount}</p>
              <p className="text-xs text-primary mt-1">Active Loans</p>
            </Card>
            <Card className="p-4 text-center border border-border" style={{ backgroundColor: 'var(--brand-purple-soft-10)' }}>
              <p className="text-2xl font-bold" style={{ color: 'var(--brand-purple)' }}>{mentors.length}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--brand-purple)' }}>Mentors</p>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={!!selectedNotification} onOpenChange={(isOpen: any) => !isOpen && setSelectedNotification(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedNotification?.title}</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">{selectedNotification?.time}</DialogDescription>
          </DialogHeader>
          <div className="py-4"><p className="text-sm text-foreground">{selectedNotification?.message}</p></div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
