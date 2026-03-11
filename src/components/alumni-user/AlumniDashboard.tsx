
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback } from '../ui/avatar';
import type { User } from '../../App';
import { 
  Heart, 
  Calendar, 
  Users, 
  Newspaper, 
  Gift, 
  Award,
  MessageSquare,
  TrendingUp,
  ChevronRight,
  DollarSign,
  Loader2,
  UserCheck,
  Mail,
  Phone
} from 'lucide-react';

import { useState, useEffect } from 'react';
import { api, API_BASE } from '../../api';
import { toast } from 'sonner';


interface AlumniDashboardProps {
  user: User;
  onNavigate: (screen: any) => void;
}


export function AlumniDashboard({ user, onNavigate }: AlumniDashboardProps) {
  const [studentsInField, setStudentsInField] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [donationStats, setDonationStats] = useState({
    totalDonated: 0,
    studentsHelped: 0,
    currentYear: 0,
  });

  const displayName = user.full_name || user.name || 'Alumni';
  const displayCourse = user.course || user.meta?.course || user.meta?.field || 'Alumni';
  const displayGradYear = user.graduationYear || user.meta?.graduationYear || user.meta?.graduation_year || 'N/A';

  // Load students in the same field as the alumni
  useEffect(() => {
    const loadStudents = async () => {
      try {
        const token = localStorage.getItem('token') || '';
        // Get user's field from meta
        const userField = user.meta?.field || 'General';
        const students = await api.getStudentsByField(userField, token);
        setStudentsInField(students);
      } catch (error) {
        console.error('Error loading students:', error);
        setStudentsInField([]);
      } finally {
        setLoadingStudents(false);
      }
    };

    const fetchDonationStats = async () => {
      try {
        const token = localStorage.getItem('token') || '';
        const response = await fetch(`${API_BASE}/donations/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setDonationStats(data);
        }
      } catch (error) {
        console.error('Failed to fetch donation stats:', error);
      }
    };

    loadStudents();
    fetchDonationStats();

    // Real-time notification polling every 5 seconds
    const notificationInterval = setInterval(async () => {
      try {
        const token = localStorage.getItem('token') || '';
        const response = await fetch(`${API_BASE}/notifications/mine`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-cache' as RequestCache
        });
        if (response.ok) {
          const notifications = await response.json();
          if (Array.isArray(notifications)) {
            const unreadNotifications = notifications.filter((n: any) => !n.read);
            setUnreadCount(unreadNotifications.length);
            // Show toast for new notifications (less than 10 seconds old)
            unreadNotifications.forEach((notif: any) => {
              const notifTime = new Date(notif.created_at).getTime();
              const now = Date.now();
              if (now - notifTime < 10000) {
                toast.info(notif.title, {
                  description: notif.message,
                  duration: 5000,
                });
              }
            });
          }
        }
      } catch (error) {
        console.error('Error polling notifications:', error);
      }
    }, 5000);

    return () => clearInterval(notificationInterval);
  }, [user.meta?.field]);

  const quickActions = [
    {
      id: 'donations',
      title: 'Make a Donation',
      subtitle: 'Support current students',
      icon: Heart,
      iconBg: 'var(--primary)',
      action: () => onNavigate('donations')
    },
    {
      id: 'mentorship',
      title: 'Mentor Students',
      subtitle: 'Share your experience',
      icon: MessageSquare,
      iconBg: 'var(--brand-purple)',
      action: () => onNavigate('mentorship')
    },
    {
      id: 'events',
      title: 'Upcoming Events',
      subtitle: 'Reunions & networking',
      icon: Calendar,
      iconBg: 'var(--brand-blue)',
      action: () => onNavigate('events')
    },
    {
      id: 'connect',
      title: 'Alumni Network',
      subtitle: 'Connect with classmates',
      icon: Users,
      iconBg: 'var(--accent-primary-mix)',
      action: () => onNavigate('connect')
    },
    {
      id: 'news',
      title: 'UCU News',
      subtitle: 'Latest updates',
      icon: Newspaper,
      iconBg: 'var(--accent-primary-mix)',
      action: () => onNavigate('news')
    },
    {
      id: 'benefits',
      title: 'Alumni Benefits',
      subtitle: 'Exclusive perks',
      icon: Gift,
      iconBg: 'var(--indigo-mix)',
      action: () => onNavigate('benefits')
    },
  ];

  const upcomingEvents = [
    {
      id: '1',
      title: 'Class of 2020 Reunion',
      date: 'Dec 15, 2025',
      location: 'UCU Main Campus',
      attendees: 45,
    },
    {
      id: '2',
      title: 'Alumni Networking Dinner',
      date: 'Jan 10, 2026',
      location: 'Serena Hotel',
      attendees: 120,
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-6">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-[#0b2a4a] via-[#0b2a4a] to-[#1e40af] text-white p-6 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6 flex justify-between items-start">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 shrink-0 rounded-full bg-white/20 border border-white/30 flex items-center justify-center">
                <span className="text-base font-bold text-white select-none">
                  {(displayName || 'A').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="opacity-90 text-sm mb-1">Welcome back,</p>
                <h1 className="text-2xl md:text-3xl">{displayName}</h1>
                <p className="text-sm opacity-80 mt-1">
                  {displayCourse} • Class of {displayGradYear}
                </p>
              </div>
            </div>
            <button 
              onClick={() => {
                console.log('Notification icon clicked, navigating to notifications');
                onNavigate('notifications');
              }} 
              className="relative p-2 rounded-full bg-white/10 hover:bg-white/20 transition cursor-pointer z-10"
              aria-label="View notifications"
            >
              <Mail className="w-6 h-6" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center font-semibold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </div>

          {/* Donation Impact Card */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-full bg-white/20">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h2 className="text-lg">Your Impact</h2>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs opacity-80">Total Donated</p>
                <p className="text-xl mt-1">UGX {donationStats.totalDonated.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs opacity-80">Students Helped</p>
                <p className="text-xl mt-1">{donationStats.studentsHelped}</p>
              </div>
              <div>
                <p className="text-xs opacity-80">This Year</p>
                <p className="text-xl mt-1">UGX {donationStats.currentYear.toLocaleString()}</p>
              </div>
            </div>
            <Button
              onClick={() => onNavigate('donations')}
              className="w-full mt-4 bg-accent hover:bg-accent/90"
            >
              <Heart className="w-4 h-4 mr-2" />
              Donate Now
            </Button>
          </Card>
        </div>
      </div>

      <div className="px-6 md:px-8 -mt-6 pb-6">
        <div className="max-w-6xl mx-auto">
          {/* Quick Actions Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  onClick={action.action}
                  className="group"
                >
                  <Card className="p-5 hover:shadow-xl transition-all duration-300 border border-border bg-card overflow-hidden relative h-full">
                    <div className="relative">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"
                        style={{ backgroundColor: action.iconBg }}
                      >
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-sm text-gray-900 mb-1">{action.title}</h3>
                      <p className="text-xs text-gray-500">{action.subtitle}</p>
                      <ChevronRight className="w-4 h-4 text-gray-400 absolute top-4 right-0 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Card>
                </button>
              );
            })}
          </div>

          {/* Upcoming Events */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg text-gray-900">Upcoming Events</h2>
              <button 
                onClick={() => onNavigate('events')}
                className="text-sm text-primary hover:underline"
              >
                View All
              </button>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {upcomingEvents.map((event) => (
                <Card
                  key={event.id}
                  className="p-5 hover:shadow-md transition-shadow cursor-pointer border border-border bg-card"
                  onClick={() => onNavigate('events')}
                >
                  <div className="flex gap-4">
                    <div className="w-14 h-14 rounded-xl bg-accent flex flex-col items-center justify-center text-primary flex-shrink-0">
                      <span className="text-sm">{event.date.split(' ')[1]}</span>
                      <span className="text-xs opacity-80">{event.date.split(' ')[0]}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm text-gray-900 mb-1">{event.title}</h3>
                      <p className="text-xs text-gray-600 mb-2">{event.location}</p>
                      <div className="flex items-center gap-2">
                        <Users className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-500">{event.attendees} attending</span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  </div>
                </Card>
              ))}
            </div>
          </div>


          {/* Mentorship Stats */}
          <Card className="p-5 bg-card border border-border mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg text-foreground">Mentorship Program</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Currently mentoring 3 students
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--brand-purple)' }}>
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center">
                <p className="text-2xl text-foreground">3</p>
                <p className="text-xs text-muted-foreground">Mentees</p>
              </div>
              <div className="text-center">
                <p className="text-2xl text-foreground">24</p>
                <p className="text-xs text-muted-foreground">Sessions</p>
              </div>
              <div className="text-center">
                <p className="text-2xl text-foreground">4.8</p>
                <p className="text-xs text-muted-foreground">Rating</p>
              </div>
            </div>
            <Button
              onClick={() => onNavigate('mentorship')}
              variant="outline"
              className="w-full border-border text-foreground hover:bg-muted"
            >
              Mentorship Hub
            </Button>
          </Card>

          {/* Students in Field Section */}
          <Card className="p-5 bg-card border border-border">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg text-foreground">Students in Your Field</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {user.meta?.field || 'General'} students looking for mentorship
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--brand-blue)' }}>
                <UserCheck className="w-6 h-6 text-white" />
              </div>
            </div>
            
            {loadingStudents ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
              </div>
            ) : studentsInField.length > 0 ? (
              <>
                <div className="text-center mb-4">
                  <p className="text-2xl text-foreground">{studentsInField.length}</p>
                  <p className="text-xs text-muted-foreground">Students Available</p>
                </div>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {studentsInField.slice(0, 5).map((student) => (
                    <div key={student.id} className="flex items-center gap-3 p-3 bg-white/50 rounded-lg">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-white text-xs" style={{ backgroundColor: 'var(--brand-blue)' }}>
                          {student.name.split(' ').map((n: string) => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{student.name}</p>
                        <p className="text-xs text-muted-foreground">{student.course} • Year {student.year}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" className="h-8 w-8 p-0 border-blue-300">
                          <Mail className="w-3 h-3" style={{ color: 'var(--brand-blue)' }} />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {studentsInField.length > 5 && (
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">
                        +{studentsInField.length - 5} more students
                      </p>
                    </div>
                  )}
                </div>
                <Button
                  onClick={() => onNavigate('mentorship')}
                  className="w-full mt-4 bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  Start Mentoring
                </Button>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground mb-2">No students found in your field</p>
                <p className="text-xs text-muted-foreground">Students from other fields might still benefit from your expertise.</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
