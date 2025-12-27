


import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import type { User } from '../../App';
import { 
  ArrowLeft, 
  MessageSquare, 
  Send, 
  Loader2, 
  Search, 
  Paperclip,
  Mic,
  MoreVertical,
  Check,
  CheckCheck,
  Download,
  Image,
  FileText,
  Video,
  Phone,
  VideoIcon,
  PhoneCall
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { API_BASE } from '../../api';
import { toast } from 'sonner';
import { EmojiPicker } from '../ui/emoji-picker';


interface MentorshipHubProps {
  user: User;
  onBack: () => void;
}

interface Mentee {
  id: string;
  name: string;
  course: string;
  lastMessage?: string;
  unread: number;
  avatar?: string;
  lastSeen?: string;
  isOnline?: boolean;
}

interface MentorRequest {
  id: string;
  name: string;
  course: string;
  field: string;
  year?: string;
}


interface Message {
  id: number;
  sender_id: string;
  message_text: string;
  created_at: string;
  status?: 'sending' | 'sent' | 'delivered' | 'read';
  type?: 'text' | 'image' | 'file' | 'voice' | 'video';
  attachment?: {
    url: string;
    name: string;
    type: string;
    size: number;
  };
  reply_to?: number;
  is_edited?: boolean;
}

interface FieldStudent {
  id: string;
  name: string;
  field: string;
  year?: string;
  graduationYear?: string;
}


export function MentorshipHub({ user, onBack }: MentorshipHubProps) {
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [mentees, setMentees] = useState<Mentee[]>([]);
  const [pendingRequests, setPendingRequests] = useState<MentorRequest[]>([]);
  const [fieldStudents, setFieldStudents] = useState<FieldStudent[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [fieldStudentsLoading, setFieldStudentsLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const [activeTab, setActiveTab] = useState<'requests' | 'mentees'>('requests');
  const [viewingProfile, setViewingProfile] = useState<MentorRequest | FieldStudent | Mentee | null>(null);
  const [viewingMode, setViewingMode] = useState<'request' | 'approved' | 'browse' | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);


  // Load pending requests from API
  const loadPendingRequests = async () => {
    try {
      setRequestsLoading(true);
      const token = localStorage.getItem('token') || '';
      const response = await fetch(`${API_BASE}/mentors/my-mentors`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load requests');
      }

      const requestsData: any[] = await response.json();
      const mappedRequests: MentorRequest[] = requestsData.map((req: any) => ({
        id: req.id,
        name: req.name,
        course: req.field || req.course || 'General',
        field: req.field || 'General',
        year: req.year,
      }));
      setPendingRequests(mappedRequests);
    } catch (error) {
      console.error('Error loading requests:', error);
      setPendingRequests([]);
    } finally {
      setRequestsLoading(false);
    }
  };

  // Load approved mentees from API
  const loadMentees = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token') || '';
      const response = await fetch(`${API_BASE}/mentors/my-approved-mentees`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load mentees');
      }

      const menteesData: any[] = await response.json();
      const transformedMentees: Mentee[] = menteesData.map(mentee => ({
        id: mentee.id,
        name: mentee.name,
        course: mentee.field || 'General',
        lastMessage: mentee.lastMessage || 'No messages yet',
        unread: mentee.unread || 0,
        isOnline: mentee.isOnline || false,
        lastSeen: mentee.lastSeen || 'Unknown'
      }));
      
      setMentees(transformedMentees);
    } catch (error) {
      console.error('Error loading mentees:', error);
      setMentees([]);
    } finally {
      setLoading(false);
    }
  };

  // Approve request
  const handleApprove = async (studentId: string) => {
    try {
      console.log('Approving student:', studentId);
      const token = localStorage.getItem('token') || '';
      console.log('Token exists:', !!token);
      
      const response = await fetch(`${API_BASE}/mentors/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ studentId }),
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error response:', errorData);
        throw new Error(errorData.error || 'Failed to approve request');
      }

      const data = await response.json();
      console.log('Success response:', data);
      
      toast.success('Request approved!');
      await loadPendingRequests();
      await loadMentees();
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to approve request');
    }
  };

  // Reject request
  const handleReject = async (studentId: string) => {
    try {
      console.log('Rejecting student:', studentId);
      const token = localStorage.getItem('token') || '';
      const response = await fetch(`${API_BASE}/mentors/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ studentId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to reject request');
      }

      const data = await response.json();
      console.log('Reject success:', data);
      
      toast.success('Request rejected');
      await loadPendingRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to reject request');
    }
  };

  // Remove approved mentee
  const handleRemoveMentee = async (studentId: string) => {
    try {
      setRemovingId(studentId);
      const token = localStorage.getItem('token') || '';
      const response = await fetch(`${API_BASE}/mentors/remove-approved`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ studentId }),
      });

      if (!response.ok) {
        throw new Error('Failed to remove mentee');
      }

      toast.success('Mentee removed');
      await loadMentees();
    } catch (error) {
      console.error('Error removing mentee:', error);
      toast.error('Failed to remove mentee');
    } finally {
      setRemovingId(null);
    }
  };

  const loadFieldStudents = async () => {
    const mentorField = (user as any)?.meta?.field;
    if (!mentorField) {
      setFieldStudents([]);
      return;
    }

    try {
      setFieldStudentsLoading(true);
      const token = localStorage.getItem('token') || '';
      const response = await fetch(`${API_BASE}/mentors/students-by-field?field=${encodeURIComponent(mentorField)}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load students');
      }

      const students: any[] = await response.json();
      const mapped: FieldStudent[] = students.map(student => ({
        id: student.id,
        name: student.name,
        field: student.course || student.field || mentorField,
        year: student.year,
        graduationYear: student.graduationYear,
      }));
      setFieldStudents(mapped);
    } catch (error) {
      console.error('Error loading students by field:', error);
      toast.error('Could not load students in your field');
      setFieldStudents([]);
    } finally {
      setFieldStudentsLoading(false);
    }
  };

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);


  // Load data on component mount
  useEffect(() => {
    loadPendingRequests();
    loadMentees();
    loadFieldStudents();

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
            // Show toast for new notifications
            unreadNotifications.slice(0, 1).forEach((notif: any) => {
              // Only show if it's a new notification (less than 10 seconds old)
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

    // Real-time pending requests and mentees polling every 8 seconds
    const requestsInterval = setInterval(() => {
      loadPendingRequests();
      loadMentees();
    }, 8000);

    return () => {
      clearInterval(notificationInterval);
      clearInterval(requestsInterval);
    };
  }, []);

  // Load messages when a student is selected
  const loadMessages = async (studentId: string) => {
    try {
      const token = localStorage.getItem('token') || '';
      const response = await fetch(`${API_BASE}/chat/${studentId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load messages');
      }

      const chatHistory: Message[] = await response.json();
      console.log('Loaded messages:', chatHistory);
      setMessages(chatHistory);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load messages');
      // Set mock messages as fallback
      const mockMessages: Message[] = [
        { id: 1, sender_id: studentId, message_text: 'Hello! Thank you for being my mentor.', created_at: new Date(Date.now() - 3600000).toISOString() },
        { id: 2, sender_id: user.uid, message_text: 'Happy to help! How can I assist you today?', created_at: new Date(Date.now() - 3500000).toISOString() },
        { id: 3, sender_id: studentId, message_text: 'I\'m struggling with my final year project. Can you give me some advice?', created_at: new Date(Date.now() - 3400000).toISOString() },
      ];
      setMessages(mockMessages);
    }
  };

  // Handle student selection
  const handleStudentSelect = async (studentId: string) => {
    setSelectedStudent(studentId);
    await loadMessages(studentId);

    // Clear unread count
    setMentees(prev => prev.map(mentee => 
      mentee.id === studentId ? { ...mentee, unread: 0 } : mentee
    ));

    // Set up auto-refresh for new messages
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      loadMessages(studentId);
    }, 3000);
  };

  // Send message function
  const sendMessage = async () => {
    if (!message.trim() || !selectedStudent || sending) return;

    setSending(true);
    const messageText = message.trim();

    try {
      const token = localStorage.getItem('token') || '';
      const response = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          recipientId: selectedStudent,
          message: messageText,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const responseData = await response.json();
      console.log('Message sent response:', responseData);

      // Use response data for accurate message display
      const newMessage: Message = {
        id: responseData.id,
        sender_id: responseData.sender_id,
        message_text: responseData.message_text,
        created_at: responseData.created_at,
        status: 'delivered',
      };

      setMessages(prev => [...prev, newMessage]);
      setMessage('');

      // Update last message in mentees list
      setMentees(prev => prev.map(mentee => 
        mentee.id === selectedStudent 
          ? { ...mentee, lastMessage: messageText }
          : mentee
      ));

      toast.success('Message sent!');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };


  // Enhanced functions for advanced messaging features
  const handleEmojiSelect = (emoji: string) => {
    setMessage(prev => prev + emoji);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedStudent) return;

    // Mock file upload - in real implementation, upload to server
    const attachment = {
      url: URL.createObjectURL(file),
      name: file.name,
      type: file.type,
      size: file.size
    };

    const newMessage: Message = {
      id: Date.now(),
      sender_id: user.uid,
      message_text: file.type.startsWith('image/') ? '📷 Image' : '📎 File',
      created_at: new Date().toISOString(),
      status: 'sent',
      type: file.type.startsWith('image/') ? 'image' : 'file',
      attachment
    };

    setMessages(prev => [...prev, newMessage]);
    toast.success('File attached successfully!');
    setShowAttachments(false);
  };

  const handleVoiceRecord = () => {
    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      toast.success('Voice message recorded!');
    } else {
      // Start recording
      setIsRecording(true);
      toast.info('Recording voice message...');
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query && selectedStudent) {
      const filteredMessages = messages.filter(msg => 
        msg.message_text.toLowerCase().includes(query.toLowerCase())
      );
      if (filteredMessages.length === 0) {
        toast.info('No messages found matching your search');
      }
    }
  };

  const handleReply = (message: Message) => {
    setReplyingTo(message);
    setMessage(`@${message.sender_id} `);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getMessageStatusIcon = (status: string) => {
    switch (status) {
      case 'sending':
        return <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />;
      case 'sent':
        return <Check className="w-4 h-4 text-white/70" />;
      case 'delivered':
        return <CheckCheck className="w-4 h-4 text-white/70" />;
      case 'read':
        return <CheckCheck className="w-4 h-4 text-blue-300" />;
      default:
        return null;
    }
  };

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <div className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10">

        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-primary flex-1">Mentorship Hub</h1>
          {selectedStudent && (
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <Search className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {(user as any)?.meta?.field && (
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm text-gray-500">Students in your field</p>
                <p className="text-base font-semibold text-gray-900">{(user as any)?.meta?.field}</p>
              </div>
              <Badge variant="secondary" className="bg-primary/10 text-primary">{fieldStudents.length}</Badge>
            </div>
            {fieldStudentsLoading ? (
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading students...
              </div>
            ) : fieldStudents.length === 0 ? (
              <p className="text-sm text-gray-500">No students found in your field yet.</p>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {fieldStudents.slice(0, 6).map(student => (
                  <button
                    key={student.id}
                    onClick={() => { setViewingProfile(student); setViewingMode('browse'); }}
                    className="border border-gray-200 rounded-lg p-3 bg-gray-50 hover:bg-gray-100 transition text-left"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary">{student.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{student.name}</p>
                        <p className="text-xs text-gray-600 truncate">{student.field}</p>
                        {student.year && (
                          <p className="text-xs text-gray-400">Year {student.year}</p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto h-[calc(100vh-80px)] md:h-[calc(100vh-100px)]">
        <div className="grid md:grid-cols-3 h-full">


          {/* Requests & Mentees List */}
          <div className="border-r border-gray-200 bg-white overflow-y-auto">
            <div className="p-4 border-b border-gray-200">
              <div className="flex gap-2 mb-3">
                <Button
                  variant={activeTab === 'requests' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveTab('requests')}
                  className="flex-1"
                >
                  Requests ({pendingRequests.length})
                </Button>
                <Button
                  variant={activeTab === 'mentees' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveTab('mentees')}
                  className="flex-1"
                >
                  Mentees ({mentees.length})
                </Button>
              </div>
              <div className="mt-3">
                <Input
                  placeholder={activeTab === 'requests' ? "Search requests..." : "Search mentees..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-sm"
                />
              </div>
            </div>
            <div>
              {activeTab === 'requests' ? (
                requestsLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                  </div>
                ) : pendingRequests.length === 0 ? (
                  <div className="text-center p-8">
                    <p className="text-sm text-gray-500">No pending requests</p>
                  </div>
                ) : (
                  pendingRequests
                    .filter(request => 
                      request.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      request.course.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((request) => (
                      <div
                        key={request.id}
                        className="p-4 border-b border-gray-200"
                      >
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {request.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {request.name}
                            </p>
                            <p className="text-xs text-gray-600">{request.course}</p>
                            {request.year && (
                              <p className="text-xs text-gray-400">Year {request.year}</p>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => { setViewingProfile(request); setViewingMode('request'); }}
                              className="mt-2 w-full text-xs"
                            >
                              View Profile
                            </Button>
                            <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleApprove(request.id)}
                                className="flex-1 text-green-600 hover:text-green-700 border-green-300 hover:bg-green-50 font-semibold"
                              >
                                ✓ Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleReject(request.id)}
                                className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-300 font-semibold"
                              >
                                ✕ Decline
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                )
              ) : loading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : mentees.length === 0 ? (
                <div className="text-center p-8">
                  <p className="text-sm text-gray-500">No approved mentees yet</p>
                  <p className="text-xs text-gray-400 mt-1">Accept requests to start mentoring</p>
                </div>
              ) : (
                mentees
                  .filter(mentee => 
                    mentee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    mentee.course.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((mentee) => (
                    <div key={mentee.id} className="border-b border-gray-200">
                      <button
                        onClick={() => handleStudentSelect(mentee.id)}
                        className={`w-full p-4 text-left hover:bg-gray-50 transition ${
                          selectedStudent === mentee.id ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="relative">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {mentee.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            {mentee.isOnline && (
                              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-1">
                              <div>
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {mentee.name}
                                </p>
                                <p className="text-xs text-gray-600">{mentee.course}</p>
                                {!mentee.isOnline && mentee.lastSeen && (
                                  <p className="text-xs text-gray-400">Last seen {mentee.lastSeen}</p>
                                )}
                              </div>
                              {mentee.unread > 0 && (
                                <Badge className="w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center flex-shrink-0 p-0">
                                  {mentee.unread > 99 ? '99+' : mentee.unread}
                                </Badge>
                              )}
                            </div>
                            {mentee.lastMessage && (
                              <p className="text-xs text-gray-500 truncate">{mentee.lastMessage}</p>
                            )}
                          </div>
                        </div>
                      </button>
                      <div className="mt-3 flex gap-2 px-4 pb-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e: { stopPropagation: () => void; }) => {
                            e.stopPropagation();
                            setViewingProfile(mentee as any);
                            setViewingMode('approved');
                          }}
                        >
                          View Profile
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={(e: { stopPropagation: () => void; }) => {
                            e.stopPropagation();
                            handleRemoveMentee(mentee.id);
                          }}
                          disabled={removingId === mentee.id}
                        >
                          {removingId === mentee.id ? 'Removing…' : 'Remove'}
                        </Button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>


          {/* Chat Area */}
          <div className="md:col-span-2 flex flex-col bg-white">
            {selectedStudent ? (
              <>
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {mentees.find(m => m.id === selectedStudent)?.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{mentees.find(m => m.id === selectedStudent)?.name}</p>
                      <p className="text-xs text-gray-600">
                        {mentees.find(m => m.id === selectedStudent)?.course}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        {mentees.find(m => m.id === selectedStudent)?.isOnline ? (
                          <>
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <p className="text-xs text-green-600">Online</p>
                          </>
                        ) : (
                          <p className="text-xs text-gray-400">
                            {mentees.find(m => m.id === selectedStudent)?.lastSeen || 'Offline'}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                

                {/* Chat Search Bar */}
                {showSearch && (
                  <div className="p-4 border-b border-gray-200 bg-gray-50">
                    <Input
                      placeholder="Search in conversation..."
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="w-full"
                    />
                  </div>
                )}

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center text-sm text-gray-500 py-10">
                      <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    messages
                      .filter(msg => 
                        !searchQuery || msg.message_text.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((msg) => {
                        const isMe = msg.sender_id === user.uid;
                        return (
                          <div
                            key={msg.id}
                            className={`flex ${isMe ? 'justify-end' : 'justify-start'} group`}
                            onDoubleClick={() => !isMe && handleReply(msg)}
                          >
                            <div className="relative">
                              {/* Reply indicator */}
                              {msg.reply_to && (
                                <div className="mb-1 ml-2 p-2 bg-gray-100 rounded-lg border-l-2 border-primary max-w-xs">
                                  <p className="text-xs text-gray-500">Replying to message</p>
                                </div>
                              )}
                              
                              <div
                                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl relative ${
                                  isMe
                                    ? 'bg-primary text-white rounded-br-sm'
                                    : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                                }`}
                              >
                                {/* Attachment display */}
                                {msg.attachment && (
                                  <div className="mb-2">
                                    {msg.type === 'image' ? (
                                      <div className="relative">
                                        <img 
                                          src={msg.attachment.url} 
                                          alt={msg.attachment.name}
                                          className="max-w-full h-auto rounded-lg cursor-pointer"
                                          onClick={() => window.open(msg.attachment!.url)}
                                        />
                                        <div className="absolute bottom-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
                                          {formatFileSize(msg.attachment.size)}
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-2 p-2 bg-white/10 rounded-lg">
                                        <FileText className="w-5 h-5" />
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm font-medium truncate">{msg.attachment.name}</p>
                                          <p className="text-xs opacity-70">{formatFileSize(msg.attachment.size)}</p>
                                        </div>
                                        <Download className="w-4 h-4 cursor-pointer hover:bg-white/10 rounded p-1" />
                                      </div>
                                    )}
                                  </div>
                                )}

                                <p className="text-sm whitespace-pre-wrap">{msg.message_text}</p>
                                
                                <div className={`flex items-center justify-between mt-1 ${isMe ? 'text-white/70' : 'text-gray-500'}`}>
                                  <span className="text-xs">
                                    {new Date(msg.created_at).toLocaleTimeString([], { 
                                      hour: '2-digit', 
                                      minute: '2-digit' 
                                    })}
                                    {msg.is_edited && ' (edited)'}
                                  </span>
                                  {isMe && msg.status && (
                                    <div className="ml-2">
                                      {getMessageStatusIcon(msg.status)}
                                    </div>
                                  )}
                                </div>

                                {/* Message actions (visible on hover) */}
                                <div className={`absolute top-0 ${isMe ? '-left-16' : '-right-16'} opacity-0 group-hover:opacity-100 transition-opacity`}>
                                  <div className="flex gap-1">
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-6 w-6"
                                      onClick={() => handleReply(msg)}
                                    >
                                      <MoreVertical className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                  )}
                  <div ref={messagesEndRef} />
                </div>


                {/* Reply indicator */}
                {replyingTo && (
                  <div className="px-4 py-2 bg-blue-50 border-l-4 border-primary">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-blue-800">Replying to: {replyingTo.message_text.substring(0, 50)}...</p>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setReplyingTo(null)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </Button>
                    </div>
                  </div>
                )}

                <div className="p-4 border-t border-gray-200">
                  {/* Attachment preview */}
                  {showAttachments && (
                    <div className="mb-3 p-3 border-2 border-dashed border-gray-300 rounded-lg">
                      <div className="flex items-center gap-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex items-center gap-2"
                        >
                          <Image className="w-4 h-4" />
                          Image
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex items-center gap-2"
                        >
                          <FileText className="w-4 h-4" />
                          Document
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex items-center gap-2"
                        >
                          <Video className="w-4 h-4" />
                          Video
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="flex items-end gap-2">
                    <div className="flex-1 relative">
                      <Input
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder={replyingTo ? "Type your reply..." : "Type your message..."}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && message.trim() && !sending) {
                            sendMessage();
                          }
                        }}
                        disabled={sending}
                        className="pr-20"
                      />
                      
                      {/* Input actions */}
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <EmojiPicker onEmojiSelect={handleEmojiSelect} />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setShowAttachments(!showAttachments)}
                        >
                          <Paperclip className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {message.trim() ? (
                      <Button 
                        onClick={sendMessage} 
                        disabled={sending}
                        className="px-3"
                      >
                        {sending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </Button>
                    ) : (
                      <Button
                        variant={isRecording ? "destructive" : "outline"}
                        onClick={handleVoiceRecord}
                        className="px-3"
                      >
                        <Mic className={`w-4 h-4 ${isRecording ? 'animate-pulse' : ''}`} />
                      </Button>
                    )}
                  </div>

                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileUpload}
                    accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                    className="hidden"
                  />
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4" />
                  <p className="text-lg font-medium mb-2">Welcome to Mentorship Hub</p>
                  <p>Select a mentee from the list to start chatting</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Student Profile Modal */}
      {viewingProfile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Student Profile</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => { setViewingProfile(null); setViewingMode(null); }}
                  aria-label="Close profile"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </div>

              {viewingMode === 'request' && (
                <div className="flex gap-2 mb-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      handleApprove(viewingProfile.id);
                      setViewingProfile(null);
                      setViewingMode(null);
                    }}
                    className="flex-1 text-green-600 hover:text-green-700 border-green-300 hover:bg-green-50 font-semibold"
                  >
                    ✓ Approve Request
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      handleReject(viewingProfile.id);
                      setViewingProfile(null);
                      setViewingMode(null);
                    }}
                    className="flex-1 text-red-600 hover:text-red-700 border-red-300 hover:bg-red-50 font-semibold"
                  >
                    ✕ Decline
                  </Button>
                </div>
              )}

              {viewingMode === 'approved' && (
                <div className="flex gap-2 mb-4">
                  <Button
                    variant="destructive"
                    onClick={() => {
                      handleRemoveMentee(viewingProfile.id);
                      setViewingProfile(null);
                      setViewingMode(null);
                    }}
                    disabled={removingId === viewingProfile.id}
                    className="flex-1"
                  >
                    {removingId === viewingProfile.id ? 'Removing…' : 'Remove Mentee'}
                  </Button>
                </div>
              )}

              <div className="space-y-4">
                {/* Avatar and Name */}
                <div className="flex flex-col items-center text-center">
                  <Avatar className="h-20 w-20 mb-3">
                    <AvatarFallback className="bg-primary/10 text-primary text-xl">
                      {viewingProfile.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="text-lg font-semibold">{viewingProfile.name}</h3>
                  <p className="text-sm text-gray-600">{'field' in viewingProfile ? viewingProfile.field : viewingProfile.course}</p>
                  {'year' in viewingProfile && viewingProfile.year && (
                    <p className="text-xs text-gray-500">Year {viewingProfile.year}</p>
                  )}
                  {'graduationYear' in viewingProfile && viewingProfile.graduationYear && (
                    <p className="text-xs text-gray-500">Graduating {viewingProfile.graduationYear}</p>
                  )}
                </div>

                {/* Additional Info */}
                <div className="border-t pt-4">
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Field of Study</p>
                      <p className="text-sm font-medium">{'field' in viewingProfile ? viewingProfile.field : viewingProfile.course}</p>
                    </div>
                    
                    {'year' in viewingProfile && viewingProfile.year && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Current Year</p>
                        <p className="text-sm font-medium">Year {viewingProfile.year}</p>
                      </div>
                    )}

                    {'graduationYear' in viewingProfile && viewingProfile.graduationYear && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Expected Graduation</p>
                        <p className="text-sm font-medium">{viewingProfile.graduationYear}</p>
                      </div>
                    )}

                    {'id' in viewingProfile && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Student ID</p>
                        <p className="text-sm font-medium font-mono">{viewingProfile.id}</p>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
