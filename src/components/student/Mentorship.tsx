// src/components/student/Mentorship.tsx

import { useState, useEffect, useRef } from 'react';

import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ArrowLeft, MessageSquare, Send, UserPlus, Paperclip, Mic, Image, FileText, Video, Loader2, Eye, Star, BriefcaseBusiness, Building2, MapPin, X } from 'lucide-react';
import { LoadingSpinner } from '../ui/loading-spinner';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Input } from '../ui/input';
import { toast } from 'sonner';
import type { User } from '../../App';
import { API_BASE, api } from '../../api';


// --- Type Definitions ---
interface Mentor {
  id: string;
  uid: string; // User UID for chat/messaging
  name: string;
  title: string;
  company: string;
  location: string;
  rating: number;
  mentees: number;
  classOf: number;
  bio: string;
  tags: string[];
  status: 'available' | 'unavailable';
  field: string; // Academic field/course
  expertise: string[]; // Specific areas of expertise
  experience: number; // Years of experience
  maxMentees?: number;
}

interface MyMentor extends Mentor {
  course: string;
  sessions: number;
  nextSession?: string;
}


interface Message {
  id: string;
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
  reply_to?: string;
  is_edited?: boolean;
}

// --- Main Component ---

export function Mentorship({ user, onBack }: { user: User; onBack: () => void; }) {
  const [myMentors, setMyMentors] = useState<MyMentor[]>([]);
  const [availableMentors, setAvailableMentors] = useState<Mentor[]>([]);
  const [selectedMentorProfile, setSelectedMentorProfile] = useState<Mentor | null>(null);
  const [myMentorsLoading, setMyMentorsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterField, setFilterField] = useState<string>('All Fields');
  const [pendingRequests, setPendingRequests] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);



  const [activeChatMentor, setActiveChatMentor] = useState<MyMentor | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastMessageCountRef = useRef<number>(0);
  const peerParamRef = useRef<string | null>(new URLSearchParams(window.location.search).get('peer'));


  // Load available mentors from API
  useEffect(() => {
    const loadAvailableMentors = async () => {
      try {
        setLoading(true);
        const filters: { field?: string; search?: string } = {};
        if (filterField && filterField !== 'All Fields') {
          filters.field = filterField;
        }
        if (searchQuery) {
          filters.search = searchQuery;
        }
        const token = localStorage.getItem('token') || '';
        const mentors = await api.getMentors(filters, token);
        setAvailableMentors(mentors);
      } catch (error) {
        console.error('Error loading mentors:', error);
        toast.error('Failed to load available mentors');
      } finally {
        setLoading(false);
      }
    };
    loadAvailableMentors();
  }, [filterField, searchQuery]);

  // Load my pending mentor requests (for undo + disable)
  useEffect(() => {
    const loadPending = async () => {
      try {
        const token = localStorage.getItem('token') || '';
        const pending = await api.getMyMentorRequests(token);
        const mapped: Record<string, string> = {};
        (pending || []).forEach((p: any) => {
          if (p?.mentorUid && p?.assignmentId) mapped[p.mentorUid] = p.assignmentId;
        });
        setPendingRequests(mapped);
      } catch (error) {
        console.error('Error loading pending mentor requests:', error);
      }
    };
    loadPending();
  }, []);

  // Load my mentors from API
  useEffect(() => {
    const loadMyMentors = async () => {
      try {
        setMyMentorsLoading(true);
        const token = localStorage.getItem('token') || '';
        const mentors = await api.getMyMentors(token);
        console.log('Loaded my mentors:', mentors);
        setMyMentors(mentors);
      } catch (error) {
        console.error('Error loading my mentors:', error);
        toast.error('Failed to load your mentors');
      } finally {
        setMyMentorsLoading(false);
      }
    };

    loadMyMentors();

    // Refresh mentors every 15s to pick up approvals
    const mentorInterval = setInterval(loadMyMentors, 15000);
    return () => clearInterval(mentorInterval);
  }, []);

  // Auto-open chat when ?peer=<uid> is present after mentors load
  useEffect(() => {
    if (!peerParamRef.current) return;
    if (!myMentors || myMentors.length === 0) return;
    const match = myMentors.find(m => m.uid === peerParamRef.current);
    if (match) {
      handleOpenChat(match);
      peerParamRef.current = null; // prevent re-open
    }
  }, [myMentors]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleOpenChat = async (mentor: MyMentor) => {
    setActiveChatMentor(mentor);
    setMessages([]); // Start with a blank slate
    try {
      const token = localStorage.getItem('token') || '';
      // Use mentor's UID for API call
      const res = await fetch(`${API_BASE}/chat/${mentor.uid}`, { 
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-cache'
      });
      if (res.status === 500 || res.status === 404) {
        // Chat doesn't exist yet - show empty state
        toast.info('Start a conversation with this mentor!');
        return;
      }
      if (!res.ok) throw new Error('Failed to load chat history.');
      const chatHistory: Message[] = await res.json();
      setMessages(chatHistory);
    } catch (err: any) {
      console.error('Chat error:', err);
      toast.error('Could not load chat. Please try again.');
    }
  };

  useEffect(() => {
    if (!activeChatMentor) return;
    
    const fetchLatestMessages = async () => {
      try {
        const token = localStorage.getItem('token') || '';
        const res = await fetch(`${API_BASE}/chat/${activeChatMentor.uid}`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-cache' as RequestCache
        });
        if (res.ok) {
          const chatHistory: Message[] = await res.json();
          const prevCount = lastMessageCountRef.current;
          const newCount = chatHistory.length;

          if (newCount > prevCount && prevCount > 0) {
            const mentorName = activeChatMentor?.name || 'Your mentor';
            toast.info('New message', { description: `New message from ${mentorName}` });
          }

          lastMessageCountRef.current = newCount;
          setMessages(chatHistory);
          scrollToBottom();
        }
      } catch (err) {
        console.error('Error fetching latest messages:', err);
      }
    };
    
      const intervalId = setInterval(fetchLatestMessages, 4000);
      return () => clearInterval(intervalId);
  }, [activeChatMentor, messages.length]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeChatMentor) return;
    
    setIsSending(true);
    try {
      const token = localStorage.getItem('token') || '';
      console.log('Sending message to mentor UID:', activeChatMentor.uid);
      const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          recipientUid: activeChatMentor.uid,  // Using mentor UID
          message: newMessage 
        })
      });
      
      if (!res.ok) throw new Error('Failed to send message');
      
      const responseData = await res.json();
      console.log('Message sent response:', responseData);
      
      // Add the message to the UI using the response data
      setMessages(prev => [...prev, responseData]);
      setNewMessage('');
      scrollToBottom();
    } catch (err) {
      console.error('Send message error:', err);
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !activeChatMentor) return;

    // Mock file upload - in real implementation, upload to server
    const attachment = {
      url: URL.createObjectURL(file),
      name: file.name,
      type: file.type,
      size: file.size
    };

    const newMsg: Message = {
      id: String(Date.now()),
      sender_id: user.uid,
      message_text: file.type.startsWith('image/') ? '📷 Image' : '📎 File',
      created_at: new Date().toISOString(),
      status: 'sent',
      type: file.type.startsWith('image/') ? 'image' : 'file',
      attachment
    };

    setMessages(prev => [...prev, newMsg]);
    toast.success('File attached successfully!');
    setShowAttachments(false);
  };

  const handleVoiceRecord = () => {
    if (isRecording) {
      setIsRecording(false);
      toast.success('Voice message recorded!');
    } else {
      setIsRecording(true);
      toast.info('Recording voice message...');
    }
  };

  if (activeChatMentor) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <header className="p-4 sticky top-0 z-10" style={{ background: 'linear-gradient(135deg, #0b2a4a 0%, #1a4d7a 100%)', borderBottom: '1px solid rgba(255,255,255,0.12)' }}>
          <div className="max-w-4xl mx-auto flex items-center gap-4">
            <Button onClick={() => setActiveChatMentor(null)} variant="ghost" size="icon" className="text-white hover:bg-white/15"><ArrowLeft className="w-5 h-5" /></Button>
            <div className="flex items-center gap-3">
              <Avatar><AvatarFallback>{activeChatMentor.name.split(' ').map(n => n[0]).join('')}</AvatarFallback></Avatar>
              <div><h1 className="font-semibold text-white">{activeChatMentor.name}</h1><p className="text-xs text-green-300">Online</p></div>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 space-y-4 chat-area-bg">
            {messages.length === 0 ? (
                <div className="text-center text-sm text-muted-foreground py-10">
                    <p>This is the beginning of your conversation with {activeChatMentor.name}.</p>
                    <p>Send a message to get started!</p>
                </div>
            ) : (
                messages.map(msg => (
                    <div key={msg.id} className={`flex items-end gap-2 ${msg.sender_id === user.uid ? 'justify-end' : ''}`}>
                        <div className={`max-w-xs lg:max-w-md p-3 rounded-2xl ${msg.sender_id === user.uid ? 'chat-bubble-out rounded-br-none' : 'bg-card text-card-foreground rounded-bl-none border border-border shadow-sm'}`}>
                            <p className="text-sm">{msg.message_text}</p>
                            <p className="text-xs opacity-70 mt-1 text-right">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                    </div>
                ))
            )}
            <div ref={messagesEndRef} />
        </main>
        <footer className="bg-card border-t border-border p-4 sticky bottom-0">
          <div className="max-w-4xl mx-auto">
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
            
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <Input 
                  placeholder="Type a message..." 
                  value={newMessage} 
                  onChange={e => setNewMessage(e.target.value)} 
                  onKeyPress={e => e.key === 'Enter' && !isSending && handleSendMessage()} 
                  className="pr-20"
                />
                
                {/* Input actions */}
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
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
              
              {newMessage.trim() ? (
                <Button onClick={handleSendMessage} disabled={isSending}>
                  {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              ) : (
                <Button
                  variant={isRecording ? "destructive" : "outline"}
                  onClick={handleVoiceRecord}
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
              title="Attach a file"
              placeholder="Attach a file"
            />
          </div>
        </footer>
      </div>
    );
  }

  const getMentorUid = (mentor: Mentor) => mentor.uid || (mentor as any).mentor_uid || mentor.id;

  const handleRequestMentor = async (mentor: Mentor) => {
    try {
      const token = localStorage.getItem('token') || '';
      const mentorUid = getMentorUid(mentor);
      if (!mentorUid) {
        toast.error('Mentor UID missing. Please refresh and try again.');
        return;
      }
      const res = await api.requestMentor(mentorUid, token, mentor.field);
      const assignmentId = res?.assignmentId;
      if (assignmentId) {
        setPendingRequests(prev => ({ ...prev, [mentorUid]: assignmentId }));
      }
      toast.success(`Request sent to ${mentor.name}!`);
      
      // Reload available mentors to get updated counts
      const filters: { field?: string; search?: string } = {};
      if (filterField && filterField !== 'All Fields') {
        filters.field = filterField;
      }
      if (searchQuery) {
        filters.search = searchQuery;
      }
      const mentors = await api.getMentors(filters, token);
      setAvailableMentors(mentors);
    } catch (error: any) {
      const message = error?.message || 'Failed to send request.';
      if (message.toLowerCase().includes('already exists')) {
        toast.info(`Request already sent to ${mentor.name}.`);
        const token = localStorage.getItem('token') || '';
        const pending = await api.getMyMentorRequests(token);
        const mapped: Record<string, string> = {};
        (pending || []).forEach((p: any) => {
          if (p?.mentorUid && p?.assignmentId) mapped[p.mentorUid] = p.assignmentId;
        });
        setPendingRequests(mapped);
        return;
      }
      toast.error(message);
    }
  };

  const handleUndoRequest = async (mentor: Mentor) => {
    try {
      const token = localStorage.getItem('token') || '';
      const mentorUid = getMentorUid(mentor);
      const assignmentId = pendingRequests[mentorUid];
      if (!assignmentId) return;
      await api.cancelMentorRequest(assignmentId, token);
      setPendingRequests(prev => {
        const next = { ...prev };
        delete next[mentorUid];
        return next;
      });
      toast.success(`Request cancelled for ${mentor.name}.`);
      
      // Reload available mentors to get updated counts
      const filters: { field?: string; search?: string } = {};
      if (filterField && filterField !== 'All Fields') {
        filters.field = filterField;
      }
      if (searchQuery) {
        filters.search = searchQuery;
      }
      const mentors = await api.getMentors(filters, token);
      setAvailableMentors(mentors);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to cancel request.');
    }
  };

  const selectedMentorUid = selectedMentorProfile ? getMentorUid(selectedMentorProfile) : '';
  const selectedMentorPending = selectedMentorUid ? Boolean(pendingRequests[selectedMentorUid]) : false;

  // --- YOUR ENTIRE ORIGINAL JSX IS PRESERVED AND RESTORED BELOW ---
  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <div className="sticky top-0 z-10" style={{ background: 'linear-gradient(135deg, #0b2a4a 0%, #1a4d7a 100%)', borderBottom: '1px solid rgba(255,255,255,0.12)' }}>
        <div className="p-4 lg:px-6 lg:py-5 flex items-center gap-4">
          <Button onClick={onBack} variant="ghost" size="icon" className="text-white hover:bg-white/15 hover:text-white"><ArrowLeft className="w-5 h-5" /></Button>
          <div>
            <h1 className="text-xl font-semibold text-white">Mentorship</h1>
            <p className="text-sm text-white/75">Connect with UCU alumni for guidance and support</p>
          </div>
        </div>
      </div>

      <div className="p-4 lg:p-6 space-y-8">



      <section>
        <div className="mb-4 rounded-2xl px-4 py-3 text-white shadow-sm" style={{ background: 'linear-gradient(145deg, #2f5288 0%, #355C9A 100%)' }}>
          <h2 className="text-lg font-semibold">My Mentors</h2>
          <p className="text-sm text-white/75">Your active mentor connections and conversations.</p>
        </div>
        {myMentorsLoading ? (
          <div className="flex items-center justify-center p-8">
            <LoadingSpinner size={24} label="Loading your mentors..." />
          </div>
        ) : myMentors.length > 0 ? (
          myMentors.map((mentor: MyMentor) => (
            <Card key={mentor.id} className="border-[#c7d5f1] bg-white">
              <CardContent className="p-4">
                <div className="flex items-center gap-4 mb-4">
                  <Avatar className="h-12 w-12"><AvatarFallback>{mentor.name.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback></Avatar>
                  <div>
                    <p className="font-semibold text-[#1f3f73]">{mentor.name}</p>
                    <p className="text-xs text-[#4d6388]">{mentor.field || mentor.course || 'General'}</p>
                    <Badge variant="outline" className="mt-1 border-[#bdd0f0] bg-[#edf3ff] text-[#355C9A]">Active</Badge>
                    {/* Show mentee count for this mentor */}
                    <p className="text-xs text-gray-500 mt-1">Mentees: {mentor.mentees ?? 0}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                    <Button className="flex-1 text-white" style={{ background: 'linear-gradient(145deg, #2f5288 0%, #355C9A 100%)' }} onClick={() => handleOpenChat(mentor)}>
                        <MessageSquare className="w-4 h-4 mr-2"/> Message
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 border-[#c6d5f2] bg-[#f4f8ff] text-[#355C9A] hover:bg-[#e6efff]"
                      onClick={() => setSelectedMentorProfile(mentor)}
                    >
                      <Eye className="w-4 h-4 mr-2" /> View Details
                    </Button>
                </div>
                {mentor.nextSession && <p className="text-xs text-gray-500 mt-3 text-center">Next session: {mentor.nextSession}</p>}
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500 mb-4">You are not currently matched with any mentors.</p>
            <p className="text-xs text-gray-400">Browse available mentors below and request to connect!</p>
          </div>
        )}
        {/* Global loading overlay for available mentors */}
        {loading && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
            <LoadingSpinner size={36} label="Loading mentors..." />
          </div>
        )}
      </section>

      <section>
        <div className="mb-4 rounded-2xl px-4 py-3 text-white shadow-sm" style={{ background: 'linear-gradient(145deg, #6d4e8f 0%, #845aa7 100%)' }}>
          <h2 className="text-lg font-semibold">Available Mentors</h2>
          <p className="text-sm text-white/75">Browse alumni ready to guide you, ask questions, and open doors.</p>
        </div>
        
        {/* Search and Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Search mentors by name, company, or expertise..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="sm:w-48">
            <select
              aria-label="Filter mentors by field"
              value={filterField}
              onChange={(e) => setFilterField(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="All Fields">All Fields</option>
              <option value="Software Engineering">Software Engineering</option>
              <option value="Data Science">Data Science</option>
              <option value="Product Management">Product Management</option>
              <option value="Marketing">Marketing</option>
              <option value="Business Development">Business Development</option>
              <option value="Finance">Finance</option>
              <option value="Design">Design</option>
            </select>
          </div>
        </div>

        {/* Filtered mentors display */}
        <div className="space-y-4">
            {availableMentors
            .filter(mentor => {
              const matchesSearch = mentor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                  mentor.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                  mentor.expertise.some(exp => exp.toLowerCase().includes(searchQuery.toLowerCase()));
              const selectedField = filterField;
              const matchesField = selectedField === 'All Fields' || mentor.field === selectedField;
              return matchesSearch && matchesField;
            })
            .map(mentor => {
              const mentorUid = getMentorUid(mentor);
              const pendingId = mentorUid ? pendingRequests[mentorUid] : undefined;
              // Only allow undo if there is a pending request (not approved yet)
              const isPending = Boolean(pendingId);
              return (
                <Card key={mentor.id} className="border-[#d6c8e5] bg-[var(--brand-purple-soft-8)]/70">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16">
                          <AvatarFallback>{mentor.name.split(' ').map(n=>n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-[#573c72]">{mentor.name}</p>
                          <p className="text-xs text-[#6f5a85]">{mentor.field} at {mentor.company}</p>
                          <p className="text-xs text-gray-500">{mentor.location}</p>
                          <div className="flex items-center gap-1 text-xs mt-1">
                            <span>{mentor.mentees} mentees · {mentor.experience} years exp · Class of {mentor.classOf}</span>
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className={mentor.status === 'available' ? 'border-[#c7b2db] bg-[#efe8f6] text-[#785493]' : 'border-gray-300 bg-white/80 text-gray-600'}>
                        {mentor.status === 'available' ? 'Available' : 'Unavailable'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 my-3">{mentor.bio}</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {mentor.expertise.map(exp => <Badge key={exp} variant="secondary" className="text-xs border-[#d8c9e8] bg-white/80 text-[#6f4f8a]">{exp}</Badge>)}
                    </div>
                    <div className="flex flex-wrap gap-2 items-center">
                      <Button
                        variant="outline"
                        className="border-[#cdbad9] bg-[#f7f2fb] text-[#6f4f8a] hover:bg-[#efe8f6] hover:text-[#5c4275]"
                        onClick={() => setSelectedMentorProfile(mentor)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                      <Button
                        variant="outline"
                        className="border-[#cdbad9] bg-[#f7f2fb] text-[#6f4f8a] hover:border-[#c79a2b] hover:bg-[#c79a2b] hover:text-white disabled:border-gray-300 disabled:bg-gray-100 disabled:text-gray-400"
                        disabled={mentor.status === 'unavailable' || isPending}
                        onClick={() => handleRequestMentor(mentor)}
                      >
                        {mentor.status === 'available'
                          ? isPending
                            ? 'Request Sent'
                            : <><UserPlus className="w-4 h-4 mr-2"/> Request Mentor</>
                          : 'Currently Unavailable'}
                      </Button>
                    </div>
                    {/* Undo button should always show for pending requests, even if not approved */}
                    {isPending && (
                      <Button
                        variant="outline"
                        className="mt-2 border-[#d7c8e6] bg-white/80 text-[#6f4f8a] hover:bg-[#efe8f6]"
                        onClick={() => handleUndoRequest(mentor)}
                      >
                        Undo Request
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}

          {availableMentors.filter(mentor => {
            const matchesSearch = mentor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                mentor.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                mentor.expertise.some(exp => exp.toLowerCase().includes(searchQuery.toLowerCase()));
            const matchesField = filterField === 'All Fields' || mentor.field === filterField;
            return matchesSearch && matchesField;
          }).length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No mentors found matching your criteria.</p>
            </div>
          )}
        </div>
      </section>
      
      <section>
        <div className="mb-4 rounded-2xl px-4 py-3 text-white shadow-sm" style={{ background: 'linear-gradient(145deg, #2f5288 0%, #355C9A 100%)' }}>
          <h2 className="text-lg font-semibold">Why Get a Mentor?</h2>
          <p className="text-sm text-white/75">Guidance, connections, and practical support from alumni who understand your journey.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
            <Card className="border-white/20 text-white" style={{ background: 'linear-gradient(145deg, #2f5288 0%, #355C9A 100%)' }}>
              <CardContent className="p-4">
                <h3 className="font-semibold text-sm mb-2 text-white">Career Guidance</h3>
                <p className="text-xs text-white/85">Get personalized advice on your career path from experienced professionals in your field.</p>
              </CardContent>
            </Card>
            <Card className="border-white/20 text-white" style={{ background: 'linear-gradient(145deg, #742033 0%, #8A1F3A 100%)' }}>
              <CardContent className="p-4">
                <h3 className="font-semibold text-sm mb-2 text-white">Networking</h3>
                <p className="text-xs text-white/85">Build valuable connections with UCU alumni working in leading companies worldwide.</p>
              </CardContent>
            </Card>
            <Card className="border-white/20 text-white" style={{ background: 'linear-gradient(145deg, #356642 0%, #3F7A4A 100%)' }}>
              <CardContent className="p-4">
                <h3 className="font-semibold text-sm mb-2 text-white">Skill Development</h3>
                <p className="text-xs text-white/85">Learn industry best practices and develop the skills that matter most for your success.</p>
              </CardContent>
            </Card>
        </div>
      </section>

      </div>

      {selectedMentorProfile && (
        <div className="fixed inset-0 z-50 bg-black/55 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b border-border px-5 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">{selectedMentorProfile.name}</h3>
                <p className="text-sm text-muted-foreground">{selectedMentorProfile.title || selectedMentorProfile.field || 'Mentor'}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedMentorProfile(null)}
                aria-label="Close mentor profile"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="p-5 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-lg border border-border bg-muted/40 p-3">
                  <p className="text-xs text-muted-foreground mb-1">Work Experience</p>
                  <p className="text-sm flex items-center gap-2">
                    <BriefcaseBusiness className="w-4 h-4 text-primary" />
                    {selectedMentorProfile.experience || 0} years
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-muted/40 p-3">
                  <p className="text-xs text-muted-foreground mb-1">Current Workplace</p>
                  <p className="text-sm flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-primary" />
                    {selectedMentorProfile.company || 'Not provided'}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-muted/40 p-3">
                  <p className="text-xs text-muted-foreground mb-1">Location</p>
                  <p className="text-sm flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    {selectedMentorProfile.location || 'Not provided'}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-muted/40 p-3">
                  <p className="text-xs text-muted-foreground mb-1">Mentor Rating</p>
                  <p className="text-sm flex items-center gap-2">
                    <Star className="w-4 h-4 text-accent" />
                    {selectedMentorProfile.rating?.toFixed?.(1) ?? '4.0'} / 5
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">About</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {selectedMentorProfile.bio || 'No bio shared yet.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground mb-1">Field</p>
                  <p>{selectedMentorProfile.field || 'General'}</p>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground mb-1">Class Of</p>
                  <p>{selectedMentorProfile.classOf || 'N/A'}</p>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground mb-1">Current Mentees</p>
                  <p>{selectedMentorProfile.mentees ?? 0}</p>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground mb-1">Capacity</p>
                  <p>{selectedMentorProfile.maxMentees ?? 10}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Expertise</p>
                <div className="flex flex-wrap gap-2">
                  {(selectedMentorProfile.expertise || []).length ? (
                    selectedMentorProfile.expertise.map((exp) => (
                      <Badge key={exp} variant="secondary" className="text-xs">
                        {exp}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No expertise tags provided.</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <Button variant="outline" onClick={() => setSelectedMentorProfile(null)}>
                  Close
                </Button>
                <Button
                  variant="outline"
                  className="border-[#cdbad9] bg-white text-[#6f4f8a] hover:border-[#c79a2b] hover:bg-[#c79a2b] hover:text-white disabled:border-gray-300 disabled:bg-gray-100 disabled:text-gray-400"
                  disabled={selectedMentorProfile.status === 'unavailable' || selectedMentorPending}
                  onClick={async () => {
                    await handleRequestMentor(selectedMentorProfile);
                  }}
                >
                  {selectedMentorProfile.status === 'available'
                    ? selectedMentorPending
                      ? 'Request Sent'
                      : 'Request Mentor'
                    : 'Currently Unavailable'}
                </Button>
              </div>

              {selectedMentorPending && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={async () => {
                    await handleUndoRequest(selectedMentorProfile);
                  }}
                >
                  Undo Request
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
