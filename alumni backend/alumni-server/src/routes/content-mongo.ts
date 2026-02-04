// src/routes/content-mongo.ts - MongoDB-based content management
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import fsSync from 'fs';
import { News } from '../models/News.js';
import { Event } from '../models/Event.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';
const CONTENT_DIR = path.join(process.cwd(), UPLOAD_DIR, 'content');

// Utility: save uploaded file to disk and/or keep buffer
async function saveUploadedFile(file?: Express.Multer.File) {
  if (!file) return { path: null, buffer: null, mime: null };

  await fs.mkdir(CONTENT_DIR, { recursive: true });

  const safeName = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;
  const filePath = path.join(CONTENT_DIR, safeName);
  await fs.writeFile(filePath, file.buffer);

  return {
    path: `/${UPLOAD_DIR}/content/${safeName}`,
    buffer: file.buffer,
    mime: file.mimetype,
  };
}

// ===== GET Endpoints =====

function normalizeAudience(value?: string): 'students' | 'alumni' | 'both' {
  const v = String(value || '').toLowerCase();
  if (v === 'students' || v === 'student') return 'students';
  if (v === 'alumni') return 'alumni';
  return 'both';
}

function buildPublishedAudienceQuery(audience?: string) {
  const a = normalizeAudience(audience);

  // Back-compat: some docs store target_audience as 'all'|'students'|'alumni'
  // and/or audience as 'both'|'students'|'alumni'|'all'.
  const audienceValues = a === 'both' ? ['both', 'all', 'students', 'alumni'] : [a, 'both', 'all'];
  const targetValues = a === 'both' ? ['all', 'students', 'alumni'] : [a, 'all'];

  return {
    status: 'published',
    $or: [
      { audience: { $in: audienceValues } },
      { target_audience: { $in: targetValues } },
      { audience: { $exists: false } },
      { target_audience: { $exists: false } },
    ],
  };
}

function mapNews(doc: any) {
  const description = doc.description ?? doc.content ?? '';
  return {
    id: doc._id?.toString?.() || doc.id,
    title: doc.title ?? '',
    description,
    content: doc.content ?? description,
    published: (doc.status ?? 'published') === 'published',
    audience: normalizeAudience(doc.audience || doc.target_audience),
    hasImage: !!(doc.image_url || doc.image_data),
    imageUrl: doc.image_url || undefined,
    type: 'news',
    createdAt: doc.created_at ?? doc.createdAt ?? null,
    updatedAt: doc.updated_at ?? doc.updatedAt ?? null,
  };
}

function mapEvent(doc: any) {
  const d = doc.event_date ? new Date(doc.event_date) : null;
  const date = d ? new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10) : '';
  return {
    id: doc._id?.toString?.() || doc.id,
    title: doc.title ?? '',
    description: doc.description ?? '',
    date,
    time: doc.event_time ?? '',
    location: doc.location ?? '',
    registrationFee: doc.registration_fee ?? 0,
    published: (doc.status ?? 'published') === 'published',
    audience: normalizeAudience(doc.audience || doc.target_audience),
    hasImage: !!(doc.image_url || doc.image_data),
    imageUrl: doc.image_url || undefined,
    type: 'event',
    createdAt: doc.created_at ?? doc.createdAt ?? null,
    updatedAt: doc.updated_at ?? doc.updatedAt ?? null,
  };
}

// Get all published news
router.get('/news', async (req, res) => {
  try {
    const query = buildPublishedAudienceQuery(req.query.audience as string | undefined);
    const news = await News.find(query).sort({ created_at: -1 }).lean();
    res.json({ content: (news || []).map(mapNews) });
  } catch (err) {
    console.error('NEWS ERROR:', err);
    res.status(500).json({ error: 'Failed to load news' });
  }
});

// Get all events
router.get('/events', async (req, res) => {
  try {
    const query = buildPublishedAudienceQuery(req.query.audience as string | undefined);
    const events = await Event.find(query).sort({ event_date: -1 }).lean();
    res.json({ content: (events || []).map(mapEvent) });
  } catch (err) {
    console.error('EVENTS ERROR:', err);
    res.status(500).json({ error: 'Failed to load events' });
  }
});

// ===== POST Endpoints =====

// Create news
router.post('/news', authenticate, authorize(['admin', 'alumni_office']), upload.single('image'), async (req, res) => {
  try {
    const { title, description, content, audience, published, status } = req.body;
    const { path: imagePath, buffer: imageBuffer, mime: imageMime } = await saveUploadedFile(req.file);

    const finalAudience = normalizeAudience(audience);
    const finalStatus = typeof published !== 'undefined'
      ? (String(published) === 'true' ? 'published' : 'draft')
      : (status || 'published');
    const descriptionVal = description || '';
    const contentVal = content || descriptionVal || '';

    const news = new News({
      title,
      description: descriptionVal,
      content: contentVal,
      image_url: imagePath || undefined,
      image_data: imageBuffer || undefined,
      image_mime: imageMime,
      audience: finalAudience,
      target_audience: finalAudience === 'both' ? 'all' : finalAudience,
      status: finalStatus,
      author_id: (req as any).user.uid,
    });

    await news.save();
    res.status(201).json({ content: [mapNews(news.toObject())] });
  } catch (err) {
    console.error('POST /news error:', err);
    res.status(500).json({ error: 'Failed to create news' });
  }
});

// Create event
router.post('/events', authenticate, authorize(['admin', 'alumni_office']), upload.single('image'), async (req, res) => {
  try {
    const { title, description, event_date, event_time, date, time, location, audience, published, status, registrationFee, registration_fee } = req.body;
    const { path: imagePath, buffer: imageBuffer, mime: imageMime } = await saveUploadedFile(req.file);

    const finalAudience = normalizeAudience(audience);
    const finalStatus = typeof published !== 'undefined'
      ? (String(published) === 'true' ? 'published' : 'draft')
      : (status || 'published');

    const dateStr = event_date || date;
    const eventDate = dateStr ? new Date(dateStr) : new Date();
    const eventTime = event_time || time;
    const fee = Number(registration_fee ?? registrationFee ?? 0) || 0;

    const event = new Event({
      title,
      description,
      image_url: imagePath || undefined,
      image_data: imageBuffer || undefined,
      image_mime: imageMime,
      event_date: eventDate,
      event_time: eventTime,
      location,
      audience: finalAudience,
      target_audience: finalAudience === 'both' ? 'all' : finalAudience,
      status: finalStatus,
      registration_fee: fee,
      organizer_id: (req as any).user.uid,
    });

    await event.save();
    res.status(201).json({ content: [mapEvent(event.toObject())] });
  } catch (err) {
    console.error('POST /events error:', err);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// ===== PUT Endpoints =====

// Update news
router.put('/news/:id', authenticate, authorize(['admin', 'alumni_office']), upload.single('image'), async (req, res) => {
  try {
    const { title, description, content, audience, published, status } = req.body;
    const { path: imagePath, buffer: imageBuffer, mime: imageMime } = await saveUploadedFile(req.file);

    const finalAudience = normalizeAudience(audience);
    const finalStatus = typeof published !== 'undefined'
      ? (String(published) === 'true' ? 'published' : 'draft')
      : (status || undefined);

    const update: any = {
      updated_at: new Date(),
    };
    if (typeof title !== 'undefined') update.title = title;
    if (typeof description !== 'undefined') update.description = description;
    if (typeof content !== 'undefined') update.content = content || description || '';
    if (typeof audience !== 'undefined') {
      update.audience = finalAudience;
      update.target_audience = finalAudience === 'both' ? 'all' : finalAudience;
    }
    if (typeof finalStatus !== 'undefined') update.status = finalStatus;
    if (imagePath) update.image_url = imagePath;
    if (imageBuffer) update.image_data = imageBuffer;
    if (imagePath || imageBuffer) update.image_mime = imageMime;

    const news = await News.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true }
    );

    if (!news) return res.status(404).json({ error: 'News not found' });
    res.json({ content: [mapNews(news.toObject())] });
  } catch (err) {
    console.error('PUT /news/:id error:', err);
    res.status(500).json({ error: 'Failed to update news' });
  }
});

// Update event
router.put('/events/:id', authenticate, authorize(['admin', 'alumni_office']), upload.single('image'), async (req, res) => {
  try {
    const { title, description, event_date, event_time, date, time, location, audience, published, status, registrationFee, registration_fee } = req.body;
    const { path: imagePath, buffer: imageBuffer, mime: imageMime } = await saveUploadedFile(req.file);

    const finalAudience = normalizeAudience(audience);
    const finalStatus = typeof published !== 'undefined'
      ? (String(published) === 'true' ? 'published' : 'draft')
      : (status || undefined);

    const update: any = {
      updated_at: new Date(),
    };
    if (typeof title !== 'undefined') update.title = title;
    if (typeof description !== 'undefined') update.description = description;
    if (typeof location !== 'undefined') update.location = location;
    const dateStr = event_date || date;
    if (typeof dateStr !== 'undefined') update.event_date = dateStr ? new Date(dateStr) : undefined;
    const timeStr = event_time || time;
    if (typeof timeStr !== 'undefined') update.event_time = timeStr;
    if (typeof audience !== 'undefined') {
      update.audience = finalAudience;
      update.target_audience = finalAudience === 'both' ? 'all' : finalAudience;
    }
    if (typeof finalStatus !== 'undefined') update.status = finalStatus;
    const fee = Number(registration_fee ?? registrationFee);
    if (!Number.isNaN(fee) && typeof (registration_fee ?? registrationFee) !== 'undefined') update.registration_fee = fee;
    if (imagePath) update.image_url = imagePath;
    if (imageBuffer) update.image_data = imageBuffer;
    if (imagePath || imageBuffer) update.image_mime = imageMime;

    const event = await Event.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true }
    );

    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json({ content: [mapEvent(event.toObject())] });
  } catch (err) {
    console.error('PUT /events/:id error:', err);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

// ===== DELETE Endpoints =====

router.delete('/news/:id', authenticate, authorize(['admin', 'alumni_office']), async (req, res) => {
  try {
    const news = await News.findByIdAndDelete(req.params.id);
    if (!news) return res.status(404).json({ error: 'News not found' });
    res.json({ message: 'News deleted' });
  } catch (err) {
    console.error('DELETE /news/:id error:', err);
    res.status(500).json({ error: 'Failed to delete news' });
  }
});

router.delete('/events/:id', authenticate, authorize(['admin', 'alumni_office']), async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json({ message: 'Event deleted' });
  } catch (err) {
    console.error('DELETE /events/:id error:', err);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

// ===== IMAGE SERVING =====
async function serveImage(res: express.Response, data: any, mime: string | undefined) {
  try {
    if (!data) return res.status(404).json({ error: 'Image not found' });

    if (typeof data === 'string') {
      const filePath = path.join(process.cwd(), data.replace(/^\//, ''));
      if (fsSync.existsSync(filePath)) {
        const stat = fsSync.statSync(filePath);
        res.setHeader('Content-Type', mime || 'application/octet-stream');
        res.setHeader('Content-Length', String(stat.size));
        return fsSync.createReadStream(filePath).pipe(res);
      }
      return res.redirect(data); // fallback to URL
    }

    if (Buffer.isBuffer(data)) {
      res.setHeader('Content-Type', mime || 'application/octet-stream');
      res.setHeader('Content-Length', String(data.length));
      return res.send(data);
    }

    return res.status(404).json({ error: 'Image not found' });
  } catch (err) {
    console.error('serveImage error:', err);
    res.status(500).json({ error: 'Failed to load image' });
  }
}

// News image endpoint
router.get('/news/:id/image', async (req, res) => {
  const news: any = await News.findById(req.params.id).lean();
  return serveImage(res, news?.image_url || news?.image_data, news?.image_mime);
});

// Event image endpoint
router.get('/events/:id/image', async (req, res) => {
  const event: any = await Event.findById(req.params.id).lean();
  return serveImage(res, event?.image_url || event?.image_data, event?.image_mime);
});

export default router;
