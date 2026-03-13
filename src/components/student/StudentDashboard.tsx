// src/components/student/StudentDashboard.tsx

import { useState, useEffect, useMemo } from 'react';
import { Card } from '../ui/card';
import type { User } from '../../App';
import { DollarSign, Gift, Users, Newspaper, Bell, ChevronRight, Loader2, FileText, Wallet, Sun, Moon } from 'lucide-react';
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
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
    document.documentElement.dataset.theme = next ? 'dark' : 'light';
    document.documentElement.style.colorScheme = next ? 'dark' : 'light';
    try {
      localStorage.setItem('theme', next ? 'dark' : 'light');
    } catch (error) {
      console.error('Failed to save theme preference', error);
    }
  };

  useEffect(() => {
    const syncThemeState = () => setIsDark(document.documentElement.classList.contains('dark'));
    window.addEventListener('focus', syncThemeState);
    document.addEventListener('visibilitychange', syncThemeState);
    return () => {
      window.removeEventListener('focus', syncThemeState);
      document.removeEventListener('visibilitychange', syncThemeState);
    };
  }, []);

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
  const totalApplications = loans.length + supportRequests.length;
  const myLoansCount = loans.length;
  const myMentorsCount = mentors.length;
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

  return (
    <>
    <div className="min-h-screen bg-[#f3f5fb] dark:bg-background">

      {/* ── Coloured Hero Header ── */}
      <div className="bg-[#0f3a68] dark:bg-sidebar text-white dark:text-sidebar-foreground px-6 pt-6 pb-5 rounded-b-2xl shadow-lg relative overflow-hidden">

        <div className="relative max-w-5xl mx-auto flex justify-between items-start">
          <div>
            <p className="text-white/80 dark:text-sidebar-foreground/75 text-sm mb-1">Welcome back,</p>
            <h1 className="text-3xl font-semibold leading-tight">{me?.full_name?.split(' ')[0] || 'Student'}</h1>
            <p className="text-white/70 dark:text-sidebar-foreground/70 text-sm mt-0.5">{me?.program || 'No program specified'}</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Dark mode toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition"
              aria-label="Toggle dark mode"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            {/* Notifications */}
            <button onClick={handleViewAllNotifications} className="relative p-2 rounded-full bg-white/10 hover:bg-white/20 transition">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-400 rounded-full border-2 border-[#0f3a68] dark:border-sidebar" />
              )}
            </button>
          </div>
        </div>

        <div className="relative max-w-5xl mx-auto mt-4 h-px bg-white/45 dark:bg-sidebar-foreground/45" />

        {/* Colored strip (requested): loans / mentors / applications */}
        <div className="relative max-w-5xl mx-auto mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl px-4 py-3 bg-[#3f5eb7] text-white border border-white/15">
            <p className="text-xs text-white/80">My Loans</p>
            <p className="text-xl font-bold mt-0.5">{myLoansCount}</p>
          </div>
          <div className="rounded-xl px-4 py-3 bg-[#9c4f7a] text-white border border-white/15">
            <p className="text-xs text-white/80">My Mentors</p>
            <p className="text-xl font-bold mt-0.5">{myMentorsCount}</p>
          </div>
          <div className="rounded-xl px-4 py-3 bg-[#7aa4c2] text-white border border-white/15">
            <p className="text-xs text-white/80">Applications</p>
            <p className="text-xl font-bold mt-0.5">{totalApplications}</p>
          </div>
        </div>
      </div>

      {/* ── Body (pulled up to overlap hero bottom) ── */}
      <div className="max-w-5xl mx-auto px-6 -mt-6 pb-8 space-y-6">

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map(a => {
            const Icon = a.icon;
            return (
              <button key={a.id} onClick={() => onNavigate(a.id)} className="group text-left">
                <Card className="p-5 hover:shadow-lg transition-all border border-border bg-card overflow-hidden relative hover:-translate-y-0.5">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
                    style={{ backgroundColor: a.iconBg }}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-sm text-foreground mb-1 font-semibold">{a.title}</h3>
                  <p className="text-xs text-muted-foreground">{a.subtitle}</p>
                </Card>
              </button>
            );
          })}
        </div>

        {/* Recent Notifications */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-base font-semibold text-foreground">Recent Notifications</h2>
            <button onClick={handleViewAllNotifications} className="text-xs text-primary hover:underline flex items-center gap-1">
              View All <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2">
            {notifications.length > 0 ? (
              notifications.slice(0, 4).map((notification) => (
                <Card
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className="p-4 hover:shadow-md transition-shadow cursor-pointer border border-border bg-card relative"
                >
                  {!notification.read && (
                    <span className="absolute top-3 right-3 w-2 h-2 bg-destructive rounded-full" />
                  )}
                  <div className="flex gap-3 items-start">
                    <div className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center bg-primary/10">
                      <Bell className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm text-foreground ${!notification.read ? 'font-semibold' : ''}`}>{notification.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{notification.message}</p>
                      <p className="text-xs text-muted-foreground/70 mt-1">{notification.time}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
                  </div>
                </Card>
              ))
            ) : (
              <Card className="p-4 border border-border bg-card text-sm text-muted-foreground text-center">
                No notifications yet.
              </Card>
            )}
          </div>
        </div>

        {/* My Applications */}
        <div>
          <h2 className="text-base font-semibold text-foreground mb-3">My Applications</h2>
          <div className="space-y-3">
            {allApplications.length > 0 ? (
              allApplications.map((app) => (
                <Card key={`${app.type}-${app.id}`} className="p-4 bg-card border border-border">
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
              <div className="text-center py-6 border-2 border-dashed border-border rounded-xl">
                <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">No submitted applications yet.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>

    {/* Notification detail dialog */}
    <Dialog open={!!selectedNotification} onOpenChange={(isOpen: any) => !isOpen && setSelectedNotification(null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{selectedNotification?.title}</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">{selectedNotification?.time}</DialogDescription>
        </DialogHeader>
        <div className="py-4"><p className="text-sm text-foreground">{selectedNotification?.message}</p></div>
      </DialogContent>
    </Dialog>
    </>
  );
}
