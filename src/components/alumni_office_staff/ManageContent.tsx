import { useState, useCallback, useMemo, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Switch } from '../ui/switch';
import { Badge } from '../ui/badge';
import { Plus, Edit2, Trash2, Calendar, MapPin, AlertCircle, Newspaper, ImageIcon, Loader2 } from 'lucide-react';
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
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { api, apiCall, API_BASE } from '../../api';

import { ContentItem, ContentFormData } from '../../types/content';

function getApiOrigin(): string {
  return API_BASE.replace(/\/api\/?$/, '');
}

/** Resolve image URL for list / preview: disk path, absolute URL, or /image fallback. */
function getContentImageSrc(
  item: { id: string; hasImage?: boolean; imageUrl?: string },
  kind: 'news' | 'events',
  refreshKey: number
): string | null {
  if (item.imageUrl && typeof item.imageUrl === 'string') {
    const u = item.imageUrl.trim();
    if (u.startsWith('http')) return `${u}${u.includes('?') ? '&' : '?'}v=${refreshKey}`;
    if (u.startsWith('/')) return `${getApiOrigin()}${u}?v=${refreshKey}`;
  }
  if (item.hasImage && item.id) {
    return `${API_BASE}/content/${kind}/${item.id}/image?v=${refreshKey}`;
  }
  return null;
}

interface FormContentProps {
  activeTab: 'news' | 'event';
  formData: ContentFormData;
  setFormData: (data: ContentFormData) => void;
  imageFile: File | null;
  setImageFile: (file: File | null) => void;
  /** Current image from server when editing (no new file chosen yet). */
  existingImageUrl?: string | null;
}

function FormContent({
  activeTab,
  formData,
  setFormData,
  imageFile,
  setImageFile,
  existingImageUrl,
}: FormContentProps) {
  const previewSrc = imageFile ? URL.createObjectURL(imageFile) : existingImageUrl || null;

  return (
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

          <div className="grid grid-cols-2 gap-4">
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
            <div>
              <Label htmlFor="registrationFee">Ticket Price (UGX) - 0 = Free</Label>
              <Input
                id="registrationFee"
                type="number"
                min="0"
                step="1000"
                value={formData.registrationFee}
                onChange={(e) => setFormData({ ...formData, registrationFee: Number(e.target.value) || 0 })}
                className="bg-white text-gray-900"
                placeholder="0 for free event"
              />
            </div>
          </div>
        </>
      )}

      <div className="flex items-center justify-between">
        <Label htmlFor="published">Publish immediately</Label>
        <Switch
          id="published"
          checked={formData.published}
          onCheckedChange={(checked: boolean) => setFormData({ ...formData, published: checked })}
        />
      </div>

      <div>
        <Label htmlFor="audience">Audience</Label>
        <select
          id="audience"
          title="Select audience for content"
          className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
          value={formData.audience}
          onChange={(e) => setFormData({ ...formData, audience: e.target.value as ContentFormData['audience'] })}
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
        {previewSrc && (
          <div className="mt-3 rounded-xl overflow-hidden bg-gray-100 w-full max-w-md aspect-video border border-gray-200 shadow-inner">
            <img src={previewSrc} alt="Preview" className="w-full h-full object-cover" />
          </div>
        )}
      </div>
    </div>
  );
}

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
  const [listLoading, setListLoading] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [refreshStamp, setRefreshStamp] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [news, setNews] = useState<ContentItem[]>([]);
  const [events, setEvents] = useState<ContentItem[]>([]);

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

  const [editExistingImageUrl, setEditExistingImageUrl] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    if (!token) {
      setListLoading(false);
      return;
    }
    setLoadError(null);
    try {
      const [newsRes, eventsRes] = await Promise.all([
        api.getContentAdmin('news', token),
        api.getContentAdmin('events', token),
      ]);
      const n = (newsRes as { content?: unknown[] })?.content;
      const e = (eventsRes as { content?: unknown[] })?.content;
      setNews(Array.isArray(n) ? n.map((item: any) => ({ ...item, type: 'news' as const })) : []);
      setEvents(Array.isArray(e) ? e.map((item: any) => ({ ...item, type: 'event' as const })) : []);
    } catch (err) {
      console.error(err);
      setLoadError(err instanceof Error ? err.message : 'Failed to load content');
      setNews([]);
      setEvents([]);
    } finally {
      setListLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  useEffect(() => {
    const id = window.setInterval(() => void loadAll(), 8000);
    return () => window.clearInterval(id);
  }, [loadAll]);

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
    setEditExistingImageUrl(null);
  }, []);

  const handleCreate = () => {
    resetForm();
    setShowCreateDialog(true);
  };

  const toDateInput = (val: unknown): string => {
    if (!val) return '';
    try {
      const d = typeof val === 'string' ? new Date(val) : (val as Date);
      if (isNaN(d.getTime())) return '';
      return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    } catch {
      return '';
    }
  };

  const toTimeInput = (val: unknown): string => {
    if (!val) return '';
    if (/^\d{2}:\d{2}$/.test(String(val))) return String(val);
    try {
      const d = new Date(`1970-01-01T${val}`);
      if (isNaN(d.getTime())) return '';
      const h = String(d.getHours()).padStart(2, '0');
      const m = String(d.getMinutes()).padStart(2, '0');
      return `${h}:${m}`;
    } catch {
      return '';
    }
  };

  const handleEdit = (item: ContentItem) => {
    setSelectedItem(item);
    setActiveTab(item.type === 'news' ? 'news' : 'event');
    setFormData({
      title: item.title || '',
      description: item.description || '',
      content: item.content || '',
      date: toDateInput(item.date || ''),
      time: toTimeInput(item.time || ''),
      location: item.location || '',
      registrationFee: item.registrationFee || 0,
      published: item.published ?? true,
      audience: (item.audience as ContentFormData['audience']) || 'both',
    });
    setImageFile(null);
    const kind = item.type === 'news' ? 'news' : 'events';
    const url = getContentImageSrc(item, kind, refreshStamp + 1);
    setEditExistingImageUrl(url);
    setShowEditDialog(true);
  };

  const handleDelete = (item: ContentItem) => {
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
        fd.append('registrationFee', String(formData.registrationFee || 0));
      }
      fd.append('published', String(formData.published));
      fd.append('audience', formData.audience);
      if (imageFile) fd.append('image', imageFile);

      const res = await fetch(`${API_BASE}/content/${segment}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).error || 'Failed to create content');
      }

      toast.success(`${activeTab === 'news' ? 'News' : 'Event'} created successfully!`);
      setShowCreateDialog(false);
      resetForm();
      setRefreshStamp((s) => s + 1);
      await loadAll();
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
        const dateVal = formData.date || toDateInput(selectedItem?.date || '');
        if (dateVal) fd.append('date', dateVal);
        if (formData.time) fd.append('time', formData.time);
        if (formData.location) fd.append('location', formData.location);
        fd.append('registrationFee', String(formData.registrationFee || 0));
      }
      fd.append('published', String(formData.published));
      fd.append('audience', formData.audience);
      if (imageFile) fd.append('image', imageFile);

      const res = await fetch(`${API_BASE}/content/${segment}/${selectedItem.id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).error || 'Failed to update content');
      }

      toast.success(`${selectedItem.type === 'news' ? 'News' : 'Event'} updated successfully!`);
      setShowEditDialog(false);
      setSelectedItem(null);
      resetForm();
      setRefreshStamp((s) => s + 1);
      await loadAll();
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

      toast.success(`${selectedItem.type === 'news' ? 'News' : 'Event'} deleted successfully!`);
      setShowDeleteDialog(false);
      setSelectedItem(null);
      setRefreshStamp((s) => s + 1);
      await loadAll();
    } catch (error) {
      console.error('Delete content error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete content');
    } finally {
      setLoading(false);
    }
  };

  const togglePublish = async (item: ContentItem) => {
    try {
      const segment = item.type === 'news' ? 'news' : 'events';
      await apiCall(`/content/${segment}/${item.id}`, 'PUT', { published: !item.published }, token);
      toast.success('Content updated');
      await loadAll();
      setRefreshStamp((s) => s + 1);
    } catch (error) {
      console.error('Toggle publish error:', error);
      toast.error('Failed to update content');
    }
  };

  const formTabForEdit = selectedItem?.type === 'event' ? 'event' : 'news';

  const ContentCard = ({ item, type }: { item: ContentItem; type: 'news' | 'event' }) => {
    const kind = type === 'news' ? 'news' : 'events';
    const imgSrc = getContentImageSrc(item, kind, refreshStamp);
    const dateLabel =
      type === 'event'
        ? `${item.date || '—'}${item.time ? ` · ${item.time}` : ''}`
        : item.createdAt
          ? new Date(item.createdAt).toLocaleDateString()
          : '';
    const cardTone =
      type === 'event'
        ? 'bg-gradient-to-r from-[#f8fbff] via-[#eef4ff] to-[#e8eeff] border-[#c8d8ff]'
        : 'bg-gradient-to-r from-[#fff8f6] via-[#fff1ea] to-[#ffe8de] border-[#ffd7c6]';

    return (
      <Card className={`group overflow-hidden shadow-md border rounded-2xl ${cardTone}`}>
        <div className="flex flex-col md:flex-row items-stretch">
          <CardContent className="p-4 md:p-5 space-y-3 flex-1">
            <div className="flex flex-wrap gap-2">
              <Badge className={item.published ? 'bg-emerald-600 hover:bg-emerald-600' : 'bg-amber-600 hover:bg-amber-600'}>
                {item.published ? 'Published' : 'Draft'}
              </Badge>
              <Badge variant="secondary" className="bg-[#0b2a4a]/90 text-white border-0">
                {type === 'event' ? 'Event' : 'News'}
              </Badge>
            </div>

            <div>
              <h3 className="font-bold text-lg text-[#0b2a4a] leading-snug line-clamp-2">{item.title}</h3>
              <p className="text-xs text-slate-600 mt-1 flex items-center gap-1.5">
                {type === 'event' ? <Calendar className="w-3.5 h-3.5 shrink-0" /> : <Newspaper className="w-3.5 h-3.5 shrink-0" />}
                {dateLabel}
              </p>
            </div>
            <p className="text-sm text-slate-700 line-clamp-3">{item.description}</p>
            {type === 'event' && item.location && (
              <p className="text-xs text-slate-600 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                {item.location}
              </p>
            )}
            <div className="flex flex-wrap gap-2 pt-1">
              <Button size="sm" variant="secondary" className="rounded-full" onClick={() => void togglePublish(item)}>
                {item.published ? 'Unpublish' : 'Publish'}
              </Button>
              <Button size="sm" variant="outline" className="rounded-full border-[#0b2a4a]/30" onClick={() => handleEdit(item)}>
                <Edit2 className="w-3.5 h-3.5 mr-1" />
                Edit
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="rounded-full text-red-700 border-red-200 hover:bg-red-50"
                onClick={() => handleDelete(item)}
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                Delete
              </Button>
            </div>
          </CardContent>

          <div className="relative h-48 md:h-auto md:w-[320px] md:min-w-[320px] bg-slate-100 border-t md:border-t-0 md:border-l border-black/10">
            {imgSrc ? (
              <img
                src={imgSrc}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-2">
                <ImageIcon className="w-12 h-12 opacity-40" />
                <span className="text-xs font-medium">No image</span>
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div
        className="overflow-hidden border-b border-black/10 shadow-md -mt-px"
        style={{
          backgroundColor: '#0b2a4a',
        }}
      >
        <div className="px-6 py-8 text-white">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Content Studio</h2>
          <p className="text-sm text-white/85 mt-2 max-w-2xl">
            Create and manage news and events for students and alumni. Only items you save in the database appear here — no demo data.
          </p>
        </div>
      </div>

      {loadError && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-amber-900">Could not load content</h3>
            <p className="text-sm text-amber-800 mt-1">{loadError}</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => void loadAll()}>
              Retry
            </Button>
          </div>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'news' | 'event')}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <TabsList className="bg-slate-100/90 p-1 rounded-xl">
            <TabsTrigger value="news" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow">
              News ({news.length})
            </TabsTrigger>
            <TabsTrigger value="event" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow">
              Events ({events.length})
            </TabsTrigger>
          </TabsList>
          <Button
            onClick={handleCreate}
            className="rounded-full bg-[#f07a2a] hover:bg-[#e06a20] text-white font-semibold shadow-md"
          >
            <Plus className="w-4 h-4 mr-2" />
            {activeTab === 'news' ? 'New article' : 'New event'}
          </Button>
        </div>

        <TabsContent value="news" className="mt-6 space-y-4">
          {listLoading ? (
            <div className="flex items-center justify-center py-20 text-slate-500 gap-2">
              <Loader2 className="w-6 h-6 animate-spin" />
              Loading news…
            </div>
          ) : news.length === 0 ? (
            <Card className="border-dashed border-2 bg-slate-50/80">
              <CardContent className="p-12 text-center text-slate-600">
                <Newspaper className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                <p className="font-medium">No news yet</p>
                <p className="text-sm mt-1">Create your first article — it will show up here with your cover image.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {news.map((item) => (
                <ContentCard key={item.id} item={item} type="news" />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="event" className="mt-6 space-y-4">
          {listLoading ? (
            <div className="flex items-center justify-center py-20 text-slate-500 gap-2">
              <Loader2 className="w-6 h-6 animate-spin" />
              Loading events…
            </div>
          ) : events.length === 0 ? (
            <Card className="border-dashed border-2 bg-slate-50/80">
              <CardContent className="p-12 text-center text-slate-600">
                <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                <p className="font-medium">No events yet</p>
                <p className="text-sm mt-1">Add an event and upload an image — it will display as a large card preview.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {events.map((item) => (
                <ContentCard key={item.id} item={item} type="event" />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl flex flex-col" style={{ maxHeight: '90dvh', height: '90dvh', overflow: 'hidden' }}>
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Create {activeTab === 'news' ? 'News Article' : 'Event'}</DialogTitle>
            <DialogDescription>Published items appear on student and alumni dashboards (per audience).</DialogDescription>
          </DialogHeader>

          <div
            style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', minHeight: 0, paddingRight: '4px', paddingBottom: '8px' }}
          >
            <FormContent
              activeTab={activeTab}
              formData={formData}
              setFormData={setFormData}
              imageFile={imageFile}
              setImageFile={setImageFile}
              existingImageUrl={null}
            />
          </div>

          <DialogFooter className="flex-shrink-0 border-t pt-4 bg-background">
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button
              className="bg-[#0b2a4a] hover:bg-[#0b2a4a]/90"
              onClick={() => void submitCreate()}
              disabled={loading || !formData.title || !formData.description}
            >
              {loading ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl flex flex-col" style={{ maxHeight: '90dvh', height: '90dvh', overflow: 'hidden' }}>
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Edit {selectedItem?.type === 'event' ? 'Event' : 'News Article'}</DialogTitle>
            <DialogDescription>Update details or replace the image. Saving refreshes the gallery.</DialogDescription>
          </DialogHeader>

          <div
            style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', minHeight: 0, paddingRight: '4px', paddingBottom: '8px' }}
          >
            <FormContent
              activeTab={formTabForEdit === 'event' ? 'event' : 'news'}
              formData={formData}
              setFormData={setFormData}
              imageFile={imageFile}
              setImageFile={setImageFile}
              existingImageUrl={imageFile ? null : editExistingImageUrl}
            />
          </div>

          <DialogFooter className="flex-shrink-0 border-t pt-4 bg-background">
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button
              className="bg-[#0b2a4a] hover:bg-[#0b2a4a]/90"
              onClick={() => void submitEdit()}
              disabled={loading || !formData.title || !formData.description}
            >
              {loading ? 'Saving...' : 'Save changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedItem?.type === 'event' ? 'event' : 'news article'}?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the item from the database permanently. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              type="button"
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => void confirmDelete()}
              disabled={loading}
            >
              {loading ? 'Deleting...' : 'Delete'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
