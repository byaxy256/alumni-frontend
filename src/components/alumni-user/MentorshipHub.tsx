import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
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
  Video} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { API_BASE, api } from '../../api';
import { toast } from 'sonner';
import { EmojiPicker } from '../ui/emoji-picker';


interface MentorshipHubProps {
  user: User;
  onBack: () => void;
}

interface Mentee {
  id: string;
  uid?: string; // User UID for messaging
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
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
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
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const lastMessageCountRef = useRef<number>(0);
  const peerParamRef = useRef<string | null>(new URLSearchParams(window.location.search).get('peer'));

  const [mentorApplication, setMentorApplication] = useState({
    field: (user.meta?.field as string) || '',
    company: (user.meta?.company as string) || '',
    roleTitle: String((user.meta?.mentorApplication as any)?.roleTitle || ''),
    experience: String((user.meta?.mentorApplication as any)?.experience || ''),
    location: String((user.meta?.mentorApplication as any)?.location || ''),
    languages: String((user.meta?.mentorApplication as any)?.languages || ''),
    expertise: String((user.meta?.mentorApplication as any)?.expertise || ''),
    mentorshipTopics: String((user.meta?.mentorApplication as any)?.mentorshipTopics || ''),
    availability: String((user.meta?.mentorApplication as any)?.availability || ''),
    preferredMode: String((user.meta?.mentorApplication as any)?.preferredMode || ''),
    linkedinUrl: String((user.meta?.mentorApplication as any)?.linkedinUrl || ''),
    bio: String((user.meta?.mentorApplication as any)?.bio || ''),
  });
  const [submittingApplication, setSubmittingApplication] = useState(false);
  const [mentorApplicationStatus, setMentorApplicationStatus] = useState<any>(user.meta?.mentorApplication || null);

  const hasMentorApplication = Boolean(mentorApplicationStatus?.submittedAt);

  const handleMentorApplicationSubmit = async () => {
    if (hasMentorApplication) return;
    const required = [
      mentorApplication.field,
      mentorApplication.company,
      mentorApplication.roleTitle,
      mentorApplication.experience,
      mentorApplication.location,
      mentorApplication.expertise,
      mentorApplication.mentorshipTopics,
      mentorApplication.availability,
      mentorApplication.preferredMode,
      mentorApplication.bio,
    ];
    if (required.some((v) => !String(v || '').trim())) {
      toast.error('Please complete all required mentor application fields.');
      return;
    }

    try {
      setSubmittingApplication(true);
      const token = localStorage.getItem('token') || '';
      const payload = {
        ...(user.meta || {}),
        wantsToMentor: true,
        mentorApplication: {
          ...mentorApplication,
          submittedAt: new Date().toISOString(),
          status: 'pending',
        },
      };

      await api.updateProfile({ meta: payload }, token);
      setMentorApplicationStatus(payload.mentorApplication);
      toast.success('Mentor application submitted successfully.');
    } catch (error: any) {
      console.error('Mentor application submit error', error);
      toast.error(error?.message || 'Failed to submit mentor application.');
    } finally {
      setSubmittingApplication(false);
    }
  };


  // Load pending requests from API
  const loadPendingRequests = async () => {
    try {
      setRequestsLoading(true);
      const token = localStorage.getItem('token') || '';
      const response = await fetch(`${API_BASE}/mentors/pending-requests`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load pending requests');
      }

      const requestsData: any[] = await response.json();
      const mappedRequests: MentorRequest[] = requestsData.map((req: any) => ({
        id: req.assignmentId || req.id,
        name: req.name,
        course: req.field || req.course || 'General',
        field: req.field || 'General',
        year: req.year,
      }));
      setPendingRequests(mappedRequests);
    } catch (error) {
      console.error('Error loading pending requests:', error);
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
        uid: mentee.uid || mentee.id, // Prefer uid, fallback to id
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

  // Auto-open chat when ?peer=<uid> exists and mentees are loaded
  useEffect(() => {
    if (!peerParamRef.current) return;
    if (!mentees || mentees.length === 0) return;
    const match = mentees.find(m => (m.uid || m.id) === peerParamRef.current);
    if (match) {
      handleStudentSelect(match.uid || match.id);
      peerParamRef.current = null;
    }
  }, [mentees]);

  // Approve request
  const handleApprove = async (assignmentId: string) => {
    try {
      console.log('Approving assignment:', assignmentId);
      const token = localStorage.getItem('token') || '';
      console.log('Token exists:', !!token);
      
      const response = await fetch(`${API_BASE}/mentors/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ assignmentId }),
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
  const handleReject = async (assignmentId: string) => {
    try {
      console.log('Rejecting assignment:', assignmentId);
      const token = localStorage.getItem('token') || '';
      const response = await fetch(`${API_BASE}/mentors/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ assignmentId }),
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
  const handleRemoveMentee = async (studentUid: string) => {
    try {
      setRemovingId(studentUid);
      const token = localStorage.getItem('token') || '';
      const response = await fetch(`${API_BASE}/mentors/remove-approved`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ studentId: studentUid }),
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
    const poll = setInterval(() => {
      loadPendingRequests();
      loadMentees();
    }, 10000);
    return () => clearInterval(poll);
  }, []);

  // Load messages when a student is selected (use UID)
  const loadMessages = async (studentUid: string, isPoll: boolean = false) => {
    try {
      if (!isPoll) setMessagesLoading(true);
      const token = localStorage.getItem('token') || '';
      const response = await fetch(`${API_BASE}/chat/${studentUid}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load messages');
      }

      const chatHistory: Message[] = await response.json();
      console.log('Loaded messages:', chatHistory);

      const prevCount = lastMessageCountRef.current;
      const newCount = chatHistory.length;

      if (isPoll && newCount > prevCount && prevCount > 0) {
        const menteeName = mentees.find(m => (m.uid || m.id) === studentUid)?.name || 'Your mentee';
        toast.info('New message', { description: `New message from ${menteeName}` });
      }

      lastMessageCountRef.current = newCount;
      setMessages(chatHistory);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load messages');
      if (!isPoll) setMessages([]);
    }
    finally {
      if (!isPoll) setMessagesLoading(false);
    }
  };

  // Handle student selection
  const handleStudentSelect = async (studentUid: string) => {
    setSelectedStudent(studentUid);
    await loadMessages(studentUid, false);

    // Clear unread count
    setMentees(prev => prev.map(mentee => 
      (mentee.uid || mentee.id) === studentUid ? { ...mentee, unread: 0 } : mentee
    ));

    // Clear any existing message polling interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    // Lightweight polling for new messages every 3s while a chat is open
    intervalRef.current = setInterval(() => {
      loadMessages(studentUid, true);
    }, 3000);
  };

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

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
          recipientUid: selectedStudent,  // Changed from recipientId to recipientUid
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

      setMessages(prev => {
        const updated = [...prev, newMessage];
        lastMessageCountRef.current = updated.length;
        return updated;
      });
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
        return <CheckCheck className="w-4 h-4 text-white/90" />;
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
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <div className="bg-card border-b border-border p-4 sticky top-0 z-10">

        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-muted rounded-lg text-foreground" title="Go back">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="flex-1 font-semibold text-foreground" style={{ color: 'var(--chat-header-blue)' }}>Mentorship Hub</h1>
          {selectedStudent && (
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="p-2 hover:bg-gray-100 rounded-lg"
              title="Search students"
            >
              <Search className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto h-[calc(100vh-80px)] md:h-[calc(100vh-100px)]">
        <div className="grid md:grid-cols-3 h-full">


          {/* Requests & Mentees List */}
          <div className="border-r border-border bg-card overflow-y-auto">
            <div className="p-4 border-b border-border">
              <Card className="mb-4">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Apply to Become a Mentor</CardTitle>
                  <CardDescription>Submit your profile for Alumni Office review.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {hasMentorApplication ? (
                    <div className="space-y-3">
                      <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                        Application submitted on {new Date(mentorApplicationStatus.submittedAt).toLocaleDateString()} • Status: {mentorApplicationStatus.status || 'pending'}
                      </div>

                      <div className="rounded-lg border border-border p-3 text-sm space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-muted-foreground">Field</span>
                          <span className="font-medium">{mentorApplicationStatus.field || '—'}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-muted-foreground">Company</span>
                          <span className="font-medium text-right">{mentorApplicationStatus.company || '—'}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-muted-foreground">Role</span>
                          <span className="font-medium text-right">{mentorApplicationStatus.roleTitle || '—'}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-muted-foreground">Experience</span>
                          <span className="font-medium">{mentorApplicationStatus.experience || '—'} yrs</span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-muted-foreground">Location</span>
                          <span className="font-medium text-right">{mentorApplicationStatus.location || '—'}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-muted-foreground">Preferred mode</span>
                          <span className="font-medium text-right">{mentorApplicationStatus.preferredMode || '—'}</span>
                        </div>
                      </div>

                      <p className="text-xs text-muted-foreground">
                        Your application is under review by the Alumni Office. You’ll be notified once it’s approved.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-1.5">
                        <Label htmlFor="mentor-field">Field (required)</Label>
                        <Input
                          id="mentor-field"
                          placeholder="e.g. Software Engineering"
                          value={mentorApplication.field}
                          onChange={(e) => setMentorApplication((prev) => ({ ...prev, field: e.target.value }))}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="mentor-company">Company/Organization (required)</Label>
                        <Input
                          id="mentor-company"
                          placeholder="Where you currently work"
                          value={mentorApplication.company}
                          onChange={(e) => setMentorApplication((prev) => ({ ...prev, company: e.target.value }))}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="mentor-role">Current role/title (required)</Label>
                        <Input
                          id="mentor-role"
                          placeholder="e.g. Product Designer, Software Engineer"
                          value={mentorApplication.roleTitle}
                          onChange={(e) => setMentorApplication((prev) => ({ ...prev, roleTitle: e.target.value }))}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="mentor-exp">Years of experience (required)</Label>
                        <Input
                          id="mentor-exp"
                          type="number"
                          min={0}
                          placeholder="e.g. 5"
                          value={mentorApplication.experience}
                          onChange={(e) => setMentorApplication((prev) => ({ ...prev, experience: e.target.value }))}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="mentor-location">Location (required)</Label>
                        <Input
                          id="mentor-location"
                          placeholder="e.g. Kampala, Uganda"
                          value={mentorApplication.location}
                          onChange={(e) => setMentorApplication((prev) => ({ ...prev, location: e.target.value }))}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="mentor-languages">Languages (optional)</Label>
                        <Input
                          id="mentor-languages"
                          placeholder="e.g. English, Luganda"
                          value={mentorApplication.languages}
                          onChange={(e) => setMentorApplication((prev) => ({ ...prev, languages: e.target.value }))}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="mentor-expertise">Expertise/skills (required)</Label>
                        <Input
                          id="mentor-expertise"
                          placeholder="e.g. React, Career guidance, Data analysis (comma-separated)"
                          value={mentorApplication.expertise}
                          onChange={(e) => setMentorApplication((prev) => ({ ...prev, expertise: e.target.value }))}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="mentor-topics">Mentorship topics you can help with (required)</Label>
                        <Input
                          id="mentor-topics"
                          placeholder="e.g. Final year project, internships, CV review (comma-separated)"
                          value={mentorApplication.mentorshipTopics}
                          onChange={(e) => setMentorApplication((prev) => ({ ...prev, mentorshipTopics: e.target.value }))}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="mentor-availability">Availability (required)</Label>
                        <Input
                          id="mentor-availability"
                          placeholder="e.g. Weeknights 7–9pm, Sat mornings"
                          value={mentorApplication.availability}
                          onChange={(e) => setMentorApplication((prev) => ({ ...prev, availability: e.target.value }))}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="mentor-mode">Preferred mentorship mode (required)</Label>
                        <Input
                          id="mentor-mode"
                          placeholder="e.g. Chat + calls, In-person, Video"
                          value={mentorApplication.preferredMode}
                          onChange={(e) => setMentorApplication((prev) => ({ ...prev, preferredMode: e.target.value }))}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="mentor-linkedin">LinkedIn profile (optional)</Label>
                        <Input
                          id="mentor-linkedin"
                          placeholder="https://linkedin.com/in/yourname"
                          value={mentorApplication.linkedinUrl}
                          onChange={(e) => setMentorApplication((prev) => ({ ...prev, linkedinUrl: e.target.value }))}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="mentor-bio">Short mentor bio (required)</Label>
                        <Textarea
                          id="mentor-bio"
                          rows={4}
                          placeholder="A short intro students will read before requesting you as a mentor"
                          value={mentorApplication.bio}
                          onChange={(e) => setMentorApplication((prev) => ({ ...prev, bio: e.target.value }))}
                        />
                      </div>

                      <Button
                        onClick={handleMentorApplicationSubmit}
                        disabled={submittingApplication}
                        className="w-full"
                      >
                        {submittingApplication ? 'Submitting...' : 'Submit Mentor Application'}
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>

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
                            <AvatarFallback className="text-white" style={{ backgroundColor: 'var(--chat-header-blue)' }}>
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
                        onClick={() => handleStudentSelect(mentee.uid || mentee.id)}
                        className={`w-full p-4 text-left hover:bg-muted/70 transition ${
                          selectedStudent === (mentee.uid || mentee.id) ? 'bg-[var(--chat-header-blue)]/10' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="relative">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="text-white" style={{ backgroundColor: 'var(--chat-header-blue)' }}>
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
                                <Badge className="w-5 h-5 rounded-full text-white text-xs flex items-center justify-center flex-shrink-0 p-0" style={{ backgroundColor: 'var(--chat-header-blue)' }}>
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
                            handleRemoveMentee(mentee.uid || mentee.id);
                          }}
                          disabled={removingId === (mentee.uid || mentee.id)}
                        >
                          {removingId === (mentee.uid || mentee.id) ? 'Removing…' : 'Remove'}
                        </Button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>


          {/* Chat Area */}
          <div className="md:col-span-2 flex flex-col bg-card">
            {selectedStudent ? (
              <>
                <div className="p-4 border-b border-border">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="text-white" style={{ backgroundColor: 'var(--chat-header-blue)' }}>
                        {mentees.find(m => (m.uid || m.id) === selectedStudent)?.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{mentees.find(m => (m.uid || m.id) === selectedStudent)?.name}</p>
                        {mentees.find(m => (m.uid || m.id) === selectedStudent)?.isOnline && (
                          <span className="w-2.5 h-2.5 rounded-full bg-green-500 border border-white/80" />
                        )}
                      </div>
                      <p className="text-xs text-gray-600">
                        {mentees.find(m => (m.uid || m.id) === selectedStudent)?.course}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        {mentees.find(m => (m.uid || m.id) === selectedStudent)?.isOnline ? (
                          <p className="text-xs text-green-600">Online</p>
                        ) : (
                          <p className="text-xs text-gray-400">
                            {mentees.find(m => (m.uid || m.id) === selectedStudent)?.lastSeen || 'Offline'}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                

                {/* Chat Search Bar */}
                {showSearch && (
                  <div className="p-4 border-b border-border bg-muted/50">
                    <Input
                      placeholder="Search in conversation..."
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="w-full"
                    />
                  </div>
                )}

                <div className="flex-1 overflow-y-auto p-4 space-y-4 chat-area-bg">
                  {messagesLoading ? (
                    <div className="flex items-center justify-center py-10">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center text-sm text-muted-foreground py-10">
                      <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                      <p>No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    messages
                      .filter(msg => 
                        !searchQuery || msg.message_text.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((msg) => {
                        const isMe = msg.sender_id === user.uid;
                        const time = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        return (
                          <div
                            key={msg.id}
                            className={`flex ${isMe ? 'justify-end' : 'justify-start'} group`}
                            onDoubleClick={() => !isMe && handleReply(msg)}
                          >
                            <div className="relative">
                              {/* Reply indicator */}
                              {msg.reply_to && (
                                <div className="mb-1 ml-2 p-2 rounded-lg border-l-2 max-w-xs bg-muted/80" style={{ borderColor: 'var(--chat-header-blue)' }}>
                                  <p className="text-xs text-muted-foreground">Replying to message</p>
                                </div>
                              )}
                              
                              <div
                                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl relative ${
                                  isMe
                                    ? 'chat-bubble-out rounded-br-sm'
                                    : 'chat-bubble-in rounded-bl-sm text-card-foreground'
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

                                <div className="flex items-end gap-2 mt-0.5">
                                  <span className="text-sm whitespace-pre-wrap break-words leading-snug">{msg.message_text}</span>
                                  <span className={`chat-bubble-meta ${isMe ? 'text-white/80' : 'text-muted-foreground'}`}>
                                    {time}{msg.is_edited && ' · edited'}
                                  </span>
                                  {isMe && msg.status && (
                                    <div className="ml-1">
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
                  <div className="px-4 py-2 border-l-4 bg-muted/70" style={{ borderColor: 'var(--chat-header-blue)' }}>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-foreground">Replying to: {replyingTo.message_text.substring(0, 50)}...</p>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setReplyingTo(null)}
                        className="text-foreground hover:opacity-80"
                        style={{ color: 'var(--chat-header-blue)' }}
                      >
                        ×
                      </Button>
                    </div>
                  </div>
                )}

                <div className="p-4 border-t border-border">
                  {/* Attachment preview */}
                  {showAttachments && (
                    <div className="mb-3 p-3 border-2 border-dashed border-border rounded-lg">
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
                    title="Upload file"
                    aria-label="Upload file"
                  />
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center chat-area-bg text-muted-foreground">
                <div className="text-center">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
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
                      const menteeId = 'uid' in viewingProfile ? (viewingProfile.uid || viewingProfile.id) : viewingProfile.id;
                      handleRemoveMentee(menteeId);
                      setViewingProfile(null);
                      setViewingMode(null);
                    }}
                    disabled={removingId === ('uid' in viewingProfile ? (viewingProfile.uid || viewingProfile.id) : viewingProfile.id)}
                    className="flex-1"
                  >
                    {removingId === ('uid' in viewingProfile ? (viewingProfile.uid || viewingProfile.id) : viewingProfile.id) ? 'Removing…' : 'Remove Mentee'}
                  </Button>
                </div>
              )}

              <div className="space-y-4">
                {/* Avatar and Name */}
                <div className="flex flex-col items-center text-center">
                  <Avatar className="h-20 w-20 mb-3">
                    <AvatarFallback className="text-white text-xl" style={{ backgroundColor: 'var(--chat-header-blue)' }}>
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
                        <p className="text-xs text-gray-500 mb-1">Access Number</p>
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
