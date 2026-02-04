import { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { ArrowLeft, AlertCircle, CheckCircle2, Info, FileText, DollarSign, Loader2, Users, Bell } from 'lucide-react';
import type { User } from '../../App';
import { toast } from 'sonner';
import { API_BASE } from '../../api';

interface UnifiedNotificationsProps {
  user: User;
  onBack: () => void;
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  created_at: string;
  read?: boolean;
  target_path?: string;
}

export function UnifiedNotifications({ onBack }: UnifiedNotificationsProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token') || '';
      const response = await fetch(`${API_BASE}/notifications/mine`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-cache' as RequestCache
      });
      if (response.ok) {
        const data = await response.json();
        setNotifications(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    
    // Poll for new notifications every 5 seconds
    const interval = setInterval(fetchNotifications, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const getIcon = (title: string | undefined) => {
    const titleLower = (title || '').toLowerCase();
    if (titleLower.includes('approved') || titleLower.includes('accepted') || titleLower.includes('success')) {
      return <CheckCircle2 size={20} className="text-green-600" />;
    } else if (titleLower.includes('declined') || titleLower.includes('rejected')) {
      return <AlertCircle size={20} className="text-red-600" />;
    } else if (titleLower.includes('message')) {
      return <Info size={20} className="text-blue-600" />;
    } else if (titleLower.includes('request') || titleLower.includes('student') || titleLower.includes('mentor')) {
      return <Users size={20} className="text-blue-600" />;
    } else {
      return <Bell size={20} className="text-gray-600" />;
    }
  };

  const getBgColor = (title: string | undefined) => {
    const titleLower = (title || '').toLowerCase();
    if (titleLower.includes('approved') || titleLower.includes('accepted') || titleLower.includes('success')) {
      return 'bg-green-100';
    } else if (titleLower.includes('declined') || titleLower.includes('rejected')) {
      return 'bg-red-100';
    } else if (titleLower.includes('message') || titleLower.includes('request') || titleLower.includes('student')) {
      return 'bg-blue-100';
    } else {
      return 'bg-gray-100';
    }
  };

  const getCategory = (title: string | undefined) => {
    const titleLower = (title || '').toLowerCase();
    if (titleLower.includes('mentor') || titleLower.includes('student')) return 'mentorship';
    if (titleLower.includes('message')) return 'message';
    if (titleLower.includes('loan')) return 'loan';
    if (titleLower.includes('payment')) return 'payment';
    if (titleLower.includes('donation')) return 'donation';
    if (titleLower.includes('event')) return 'event';
    return 'general';
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'loan':
      case 'payment':
      case 'donation':
        return <DollarSign size={14} />;
      case 'message':
        return <Info size={14} />;
      case 'mentorship':
        return <Users size={14} />;
      default:
        return <FileText size={14} />;
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const token = localStorage.getItem('token') || '';
      const response = await fetch(`${API_BASE}/notifications/read-all`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        toast.success('All notifications marked as read');
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Failed to mark notifications as read');
    }
  };

  const handleNotificationClick = async (notification: NotificationItem) => {
    if (!notification.read) {
      try {
        const token = localStorage.getItem('token') || '';
        await fetch(`${API_BASE}/notifications/${notification.id}/read`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}` }
        });
        setNotifications(prev => prev.map(n => 
          n.id === notification.id ? { ...n, read: true } : n
        ));
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }

    // Navigate based on category so clicks open the right page (e.g., mentorship chat)
    const category = getCategory(notification.title);
    const targetPath = notification.target_path || (() => {
      if (category === 'mentorship' || category === 'message') return '/mentorship';
      if (category === 'payment') return '/payment-history';
      if (category === 'loan') return '/loans';
      if (category === 'donation') return '/fund';
      if (category === 'event') return '/events';
      return '/dashboard';
    })();

    // Push state + dispatch popstate so the app router picks it up
    window.history.pushState({}, '', targetPath);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="p-4">
          <button onClick={onBack} className="flex items-center gap-2 text-gray-600 mb-4">
            <ArrowLeft size={20} />
            <span className="text-sm">Back</span>
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Notifications</h2>
              <p className="text-xs text-gray-500 mt-1">
                {notifications.filter((n) => !n.read).length} unread
              </p>
            </div>
            {notifications.length > 0 && (
              <Button variant="ghost" size="sm" onClick={handleMarkAllRead}>
                Mark all read
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {notifications.map((notification) => {
          const category = getCategory(notification.title);
          return (
            <Card 
              key={notification.id} 
              className={`${!notification.read ? 'border-l-4' : ''} cursor-pointer hover:shadow-md transition-shadow`} 
              style={!notification.read ? { borderLeftColor: '#0b2a4a' } : {}}
              onClick={() => handleNotificationClick(notification)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-full ${getBgColor(notification.title)} flex items-center justify-center flex-shrink-0`}>
                    {getIcon(notification.title)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className={`text-sm ${!notification.read ? 'font-semibold' : 'font-medium'}`}>
                        {notification.title}
                      </p>
                      {!notification.read && (
                        <div className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0 mt-1"></div>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">{notification.message}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        <span className="flex items-center gap-1">
                          {getCategoryIcon(category)}
                          {category}
                        </span>
                      </Badge>
                      <span className="text-xs text-gray-500">{formatDate(notification.created_at)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {notifications.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 mx-auto flex items-center justify-center mb-4">
                <CheckCircle2 size={32} className="text-gray-400" />
              </div>
              <p className="text-sm text-gray-600">No notifications</p>
              <p className="text-xs text-gray-500 mt-1">You're all caught up!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
