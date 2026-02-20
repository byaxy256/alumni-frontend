// src/components/student/Mentorship.tsx

import { useState, useEffect, useRef } from 'react';

import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ArrowLeft, MessageSquare, Send, UserPlus, Paperclip, Mic, Image, FileText, Video, Loader2 } from 'lucide-react';
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
      <div className="flex flex-col min-h-screen bg-gray-50">
        <header className="bg-white border-b p-4 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto flex items-center gap-4">
            <Button onClick={() => setActiveChatMentor(null)} variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
            <div className="flex items-center gap-3">
              <Avatar><AvatarFallback>{activeChatMentor.name.split(' ').map(n => n[0]).join('')}</AvatarFallback></Avatar>
              <div><h1 className="font-semibold">{activeChatMentor.name}</h1><p className="text-xs text-green-500">Online</p></div>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
                <div className="text-center text-sm text-gray-500 py-10">
                    <p>This is the beginning of your conversation with {activeChatMentor.name}.</p>
                    <p>Send a message to get started!</p>
                </div>
            ) : (
                messages.map(msg => (
                    <div key={msg.id} className={`flex items-end gap-2 ${msg.sender_id === user.uid ? 'justify-end' : ''}`}>
                        <div className={`max-w-xs lg:max-w-md p-3 rounded-2xl ${msg.sender_id === user.uid ? 'bg-primary text-white rounded-br-none' : 'bg-white rounded-bl-none border'}`}>
                            <p className="text-sm">{msg.message_text}</p>
                            <p className="text-xs opacity-70 mt-1 text-right">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                    </div>
                ))
            )}
            <div ref={messagesEndRef} />
        </main>
        <footer className="bg-white border-t p-4 sticky bottom-0">
          <div className="max-w-4xl mx-auto">
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
    } catch (error: any) {
      toast.error(error?.message || 'Failed to cancel request.');
    }
  };

  // --- YOUR ENTIRE ORIGINAL JSX IS PRESERVED AND RESTORED BELOW ---
  return (
    <div className="p-4 lg:p-6 space-y-8">
      <div className="flex items-center gap-4">
        <Button onClick={onBack} variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
        <div>
          <h1 className="text-xl font-semibold">Mentorship</h1>
          <p className="text-sm text-gray-500">Connect with UCU alumni for guidance and support</p>
        </div>
      </div>



      <section>
        <h2 className="text-lg font-semibold mb-4">My Mentors</h2>
        {myMentorsLoading ? (
          <div className="flex items-center justify-center p-8">
            <LoadingSpinner size={24} label="Loading your mentors..." />
          </div>
        ) : myMentors.length > 0 ? (
          myMentors.map((mentor: MyMentor) => (
            <Card key={mentor.id} className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-4 mb-4">
                  <Avatar className="h-12 w-12"><AvatarFallback>{mentor.name.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback></Avatar>
                  <div>
                    <p className="font-semibold">{mentor.name}</p>
                    <p className="text-xs text-gray-600">{mentor.field || mentor.course || 'General'}</p>
                    <Badge variant="outline" className="mt-1 bg-white">Active</Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                    <Button className="flex-1" onClick={() => handleOpenChat(mentor)}>
                        <MessageSquare className="w-4 h-4 mr-2"/> Message
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
        <h2 className="text-lg font-semibold mb-4">Available Mentors</h2>
        
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
              const isPending = Boolean(pendingId);
              return (
              <Card key={mentor.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarFallback>{mentor.name.split(' ').map(n=>n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{mentor.name}</p>
                        <p className="text-xs text-gray-600">{mentor.field} at {mentor.company}</p>
                        <p className="text-xs text-gray-500">{mentor.location}</p>
                        <div className="flex items-center gap-1 text-xs mt-1">
                          <span>{mentor.mentees} mentees · {mentor.experience} years exp · Class of {mentor.classOf}</span>
                        </div>
                      </div>
                    </div>
                    <Badge variant={mentor.status === 'available' ? 'default' : 'secondary'} className={mentor.status === 'available' ? 'bg-green-500 text-white' : ''}>
                      {mentor.status === 'available' ? 'Available' : 'Unavailable'}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 my-3">{mentor.bio}</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {mentor.expertise.map(exp => <Badge key={exp} variant="secondary" className="text-xs">{exp}</Badge>)}
                  </div>
                  <Button
                    className="w-full"
                    disabled={mentor.status === 'unavailable' || isPending}
                    onClick={() => handleRequestMentor(mentor)}
                  >
                    {mentor.status === 'available'
                      ? isPending
                        ? 'Request Sent'
                        : <><UserPlus className="w-4 h-4 mr-2"/> Request Mentor</>
                      : 'Currently Unavailable'}
                  </Button>
                  {isPending && (
                    <Button
                      variant="outline"
                      className="w-full mt-2"
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
        <h2 className="text-lg font-semibold mb-4">Why Get a Mentor?</h2>
        <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-sm mb-2">Career Guidance</h3>
                <p className="text-xs text-gray-600">Get personalized advice on your career path from experienced professionals in your field.</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-sm mb-2">Networking</h3>
                <p className="text-xs text-gray-600">Build valuable connections with UCU alumni working in leading companies worldwide.</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-sm mb-2">Skill Development</h3>
                <p className="text-xs text-gray-600">Learn industry best practices and develop the skills that matter most for your success.</p>
              </CardContent>
            </Card>
        </div>
      </section>
    </div>
  );
}
