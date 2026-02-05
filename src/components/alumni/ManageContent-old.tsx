


import { useState, useCallback, useMemo } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Switch } from '../ui/switch';
import { Badge } from '../ui/badge';
import { Plus, Edit2, Trash2, Calendar, MapPin, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { useRealtime } from '../../hooks/useRealtime';
import { apiCall, API_BASE } from '../../api';

import { ContentItem, ContentFormData } from '../../types/content';
import { 
  getFutureDateString
} from '../../utils/validation';



export default function ContentManagement() {
  const token = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('token') || '';
  }, []);

  const [activeTab, setActiveTab] = useState<'news' | 'event'>('news');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  
  const [formData, setFormData] = useState<ContentFormData>({
    title: '',
    description: '',
    content: '',
    date: '',
    time: '',
    location: '',
    registrationFee: 0,
    published: true,
    audience: 'both',
  });


  // Mock data for when backend is not available (using current dates)
  const mockNews: ContentItem[] = [
    {
      id: '1',
      title: 'Welcome to Alumni Circle',
      description: 'Get started with our new alumni management platform designed to connect and empower our graduate community.',
      content: 'This comprehensive platform will revolutionize how alumni stay connected, share opportunities, and support each other. Explore the new features including mentorship programs, event management, and career networking tools.',
      published: true,
      type: 'news',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    },
    {
      id: '2',
      title: '2025 Alumni Scholarship Program',
      description: 'Applications now open for merit-based scholarships supporting outstanding graduate students',
      content: 'We are excited to announce the 2025 Alumni Circle Scholarship Program. This program provides financial support to deserving graduate students based on academic achievement, community involvement, and potential for impact.',
      published: true,
      type: 'news',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    },
  ];

  const mockEvents: ContentItem[] = [
    {
      id: '1',
      title: 'Annual Alumni Networking Summit 2025',
      description: 'Connect with fellow alumni and industry leaders at our premier annual event',
      date: getFutureDateString(30), // 30 days from now
      time: '18:00',
      location: 'University Grand Auditorium',
      published: true,
      type: 'event',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    },
    {
      id: '2',
      title: 'Tech Career Development Workshop',
      description: 'Learn from industry professionals about advancing your career in technology',
      date: getFutureDateString(14), // 14 days from now
      time: '14:00',
      location: 'Innovation Hub Conference Room',
      published: false,
      type: 'event',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    },
  ];


  // Fetch news and events with real-time updates
  const { data: newsData, refetch: refetchNews, error: newsError } = useRealtime<{ content: any[] }>('/content/news', 5000, token);
  const { data: eventsData, refetch: refetchEvents, error: eventsError } = useRealtime<{ content: any[] }>('/content/events', 5000, token);

  // Determine if we're using real data or mock data
  const isUsingRealData = newsData !== undefined && eventsData !== undefined;
  const news = isUsingRealData
    ? (newsData?.content || []).map((item: any) => ({ ...item, type: 'news' as const }))
    : mockNews;
  const events = isUsingRealData
    ? (eventsData?.content || []).map((item: any) => ({ ...item, type: 'event' as const }))
    : mockEvents;

  // Show backend server warning only if there's an actual error (not empty data)
  const hasServerError = newsError || eventsError;
  const resetForm = useCallback(() => {
    setFormData({
      title: '',
      description: '',
      content: '',
      date: '',
      time: '',
      location: '',
      registrationFee: 0,
      published: true,
      audience: 'both',
    });
    setImageFile(null);
  }, []);

  const handleCreate = () => {
    resetForm();
    setShowCreateDialog(true);
  };

  const handleEdit = (item: any) => {
    setSelectedItem(item);
    setFormData({
      title: item.title || '',
      description: item.description || '',
      content: item.content || '',
      date: item.date || '',
      time: item.time || '',
      location: item.location || '',
      registrationFee: typeof item.registrationFee === 'number' ? item.registrationFee : 0,
      published: item.published ?? true,
      audience: (item.audience as any) || 'both',
    });
    setShowEditDialog(true);
  };

  const handleDelete = (item: any) => {
    setSelectedItem(item);
    setShowDeleteDialog(true);
  };

  const submitCreate = async () => {
    setLoading(true);
    try {
      const segment = activeTab === 'news' ? 'news' : 'events';
      const fd = new FormData();
      fd.append('title', formData.title);
      fd.append('description', formData.description);
      if (activeTab === 'news') {
        fd.append('content', formData.content || '');
      }
      if (activeTab === 'event') {
        if (formData.date) fd.append('date', formData.date);
        if (formData.time) fd.append('time', formData.time);
        if (formData.location) fd.append('location', formData.location);
      }
      fd.append('published', String(formData.published));
      fd.append('audience', formData.audience);
      if (imageFile) fd.append('image', imageFile);

      const res = await fetch(`${API_BASE}/content/${segment}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!res.ok) throw new Error('Failed to create content');

      toast.success(`${activeTab === 'news' ? 'News' : 'Event'} created successfully!`);
      setShowCreateDialog(false);
      resetForm();
      
      // Refetch data
      if (activeTab === 'news') {
        refetchNews();
      } else {
        refetchEvents();
      }
    } catch (error) {
      console.error('Create content error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create content');
    } finally {
      setLoading(false);
    }
  };

  const submitEdit = async () => {
    if (!selectedItem) return;
    
    setLoading(true);
    try {
      const segment = selectedItem.type === 'news' ? 'news' : 'events';
      const fd = new FormData();
      fd.append('title', formData.title);
      fd.append('description', formData.description);
      if (segment === 'news') {
        fd.append('content', formData.content || '');
      }
      if (segment === 'events') {
        if (formData.date) fd.append('date', formData.date);
        if (formData.time) fd.append('time', formData.time);
        if (formData.location) fd.append('location', formData.location);
      }
      fd.append('published', String(formData.published));
      fd.append('audience', formData.audience);
      if (imageFile) fd.append('image', imageFile);

      const res = await fetch(`${API_BASE}/content/${segment}/${selectedItem.id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!res.ok) throw new Error('Failed to update content');

      toast.success(`${activeTab === 'news' ? 'News' : 'Event'} updated successfully!`);
      setShowEditDialog(false);
      setSelectedItem(null);
      resetForm();
      
      // Refetch data
      if (activeTab === 'news') {
        refetchNews();
      } else {
        refetchEvents();
      }
    } catch (error) {
      console.error('Update content error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update content');
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!selectedItem) return;
    
    setLoading(true);
    try {
      const segment = selectedItem.type === 'news' ? 'news' : 'events';

      await apiCall(`/content/${segment}/${selectedItem.id}`, 'DELETE', undefined, token);

      toast.success(`${activeTab === 'news' ? 'News' : 'Event'} deleted successfully!`);
      setShowDeleteDialog(false);
      setSelectedItem(null);
      
      // Refetch data
      if (activeTab === 'news') {
        refetchNews();
      } else {
        refetchEvents();
      }
    } catch (error) {
      console.error('Delete content error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete content');
    } finally {
      setLoading(false);
    }
  };

  const togglePublish = async (item: any) => {
    try {
      const segment = item.type === 'news' ? 'news' : 'events';

      await apiCall(`/content/${segment}/${item.id}`, 'PUT', {
        ...item,
        published: !item.published,
      }, token);

      toast.success(`${item.type === 'news' ? 'News' : 'Event'} ${!item.published ? 'published' : 'unpublished'}`);
      
      // Refetch data
      if (item.type === 'news') {
        refetchNews();
      } else {
        refetchEvents();
      }
    } catch (error) {
      console.error('Toggle publish error:', error);
      toast.error('Failed to update publish status');
    }
  };

  const ContentCard = ({ item, type }: { item: any; type: 'news' | 'event' }) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex gap-4">
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="text-base truncate">{item.title}</h3>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge variant={item.published ? 'default' : 'secondary'}>
                  {item.published ? 'Published' : 'Draft'}
                </Badge>
              </div>
            </div>
            
            <p className="text-sm text-gray-600 line-clamp-2 mb-3">{item.description}</p>
            
            {type === 'event' && (
              <div className="space-y-1 mb-3">
                {item.date && (
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(item.date).toLocaleDateString()}</span>
                  </div>
                )}
                {item.time && (
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Clock className="w-3 h-3" />
                    <span>{item.time}</span>
                  </div>
                )}
                {item.location && (
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <MapPin className="w-3 h-3" />
                    <span>{item.location}</span>
                  </div>
                )}
              </div>
            )}
            

            <div className="flex items-center gap-2 mb-2">
              <Button size="sm" variant="outline" onClick={() => togglePublish(item)}>
                {item.published ? 'Unpublish' : 'Publish'}
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleEdit(item)}>
                <Edit2 className="w-3 h-3 mr-1" />
                Edit
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleDelete(item)}>
                <Trash2 className="w-3 h-3 mr-1" />
                Delete
              </Button>
            </div>
            
            {/* Content History */}
            <div className="text-xs text-gray-500">
              <span>Created: {new Date(item.createdAt).toLocaleDateString()}</span>
              {item.updatedAt && (
                <span className="ml-2">• Updated: {new Date(item.updatedAt).toLocaleDateString()}</span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const FormContent = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="bg-white text-gray-900"
          placeholder="Enter title"
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Short Description *</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="bg-white text-gray-900"
          placeholder="Brief summary (shown in cards)"
          rows={2}
          required
        />
      </div>

      {activeTab === 'news' && (
        <div>
          <Label htmlFor="content">Full Content</Label>
          <Textarea
            id="content"
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            className="bg-white text-gray-900"
            placeholder="Full article content"
            rows={6}
          />
        </div>
      )}

      {activeTab === 'event' && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="bg-white text-gray-900"
              />
            </div>
            <div>
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="bg-white text-gray-900"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="bg-white text-gray-900"
              placeholder="Event venue"
            />
          </div>
        </>
      )}

      <div className="flex items-center justify-between">
        <Label htmlFor="published">Publish immediately</Label>
        <Switch
          id="published"
          checked={formData.published}
          onCheckedChange={(checked: any) => setFormData({ ...formData, published: checked })}
        />
      </div>

      <div>
        <Label htmlFor="audience">Audience</Label>
        <select
          id="audience"
          title="Select audience"
          className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
          value={formData.audience}
          onChange={(e) => setFormData({ ...formData, audience: e.target.value as any })}
        >
          <option value="both">Both (Students & Alumni)</option>
          <option value="students">Students</option>
          <option value="alumni">Alumni</option>
        </select>
      </div>

      <div>
        <Label htmlFor="imageFile">Upload Image</Label>
        <input
          id="imageFile"
          type="file"
          accept="image/*"
          title="Upload an image file"
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          onChange={(e) => {
            const file = e.target.files?.[0] || null;
            setImageFile(file);
          }}
        />
        {imageFile && (
          <div className="mt-3 rounded-lg overflow-hidden bg-gray-100 w-40 h-40">
            <img src={URL.createObjectURL(imageFile)} alt="preview" className="w-full h-full object-cover" />
          </div>
        )}
      </div>
    </div>
  );


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-primary">Content Management</h2>
          <p className="text-sm text-gray-600">
            Manage news and events displayed to students and alumni
          </p>
        </div>
      </div>

      {/* Backend Server Warning */}
      {hasServerError && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-amber-800">Backend Server Not Available</h3>
            <p className="text-sm text-amber-700 mt-1">
              The backend server is not running. Using demo data for demonstration. 
              Your changes will not be saved until the server is started.
            </p>
          </div>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'news' | 'event')}>
        <TabsList>
          <TabsTrigger value="news">News ({news.length})</TabsTrigger>
          <TabsTrigger value="event">Events ({events.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="news" className="space-y-4">
          <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Create News Article
          </Button>

          {news.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                No news articles yet. Create your first one!
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {news.map((item: any) => (
                <ContentCard key={item.id} item={item} type="news" />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="event" className="space-y-4">
          <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Create Event
          </Button>

          {events.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                No events yet. Create your first one!
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {events.map((item: any) => (
                <ContentCard key={item.id} item={item} type="event" />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create {activeTab === 'news' ? 'News Article' : 'Event'}</DialogTitle>
            <DialogDescription>
              Fill in the details below. Published items will be visible to all users immediately.
            </DialogDescription>
          </DialogHeader>
          
          <FormContent />
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={submitCreate} disabled={loading || !formData.title || !formData.description}>
              {loading ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit {activeTab === 'news' ? 'News Article' : 'Event'}</DialogTitle>
            <DialogDescription>
              Update the content details below.
            </DialogDescription>
          </DialogHeader>
          
          <FormContent />
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={submitEdit} disabled={loading || !formData.title || !formData.description}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {activeTab === 'news' ? 'News Article' : 'Event'}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The content will be permanently removed from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={loading}>
              {loading ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
