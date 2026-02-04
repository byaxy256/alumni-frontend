// src/routes/support-mongo.ts - MongoDB-based support request endpoints
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';
import { SupportRequest } from '../models/SupportRequest.js';
import { User } from '../models/User.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { logAudit, AuditActions } from '../utils/auditLogger.js';
import { Loan } from '../models/Loan.js';
import { Application } from '../models/Application.js';
import { Disbursement } from '../models/Disbursement.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';
const FIN_STAT_DIR = path.join(__dirname, '..', '..', UPLOAD_DIR, 'financial-statements');
fs.ensureDirSync(FIN_STAT_DIR);
const BASE_URL = process.env.BASE_URL || 'http://localhost:4000';

// GET /api/support - Get all support requests (admin/alumni_office only)
router.get('/', async (_req, res) => {
  try {
    const requests = await SupportRequest.find().sort({ created_at: -1 }).lean();
    
    // Import Payment model
    const { Payment } = await import('../models/Payment.js');
    
    // Enrich with user data and application payload data
    const enriched = await Promise.all(requests.map(async (req: any) => {
      const user = await User.findOne({ uid: req.student_uid }).select('full_name email phone meta').lean();
      
      // Try to get data from Application if available (has semester from form)
      const appData = await Application.findOne({ student_uid: req.student_uid }).sort({ created_at: -1 }).lean();
      const appPayload = appData?.payload || {};
      
      // For amount: use req.amount_requested if > 0, else try appPayload.amountRequested, else try disbursement.original_amount
      let amount = req.amount_requested > 0 ? req.amount_requested : (appPayload?.amountRequested ? Number(appPayload.amountRequested) : 0);
      if (amount === 0) {
        const disbursement = await Disbursement.findOne({ student_uid: req.student_uid }).sort({ created_at: -1 }).lean();
        amount = disbursement?.original_amount || 0;
      }
      
      // Calculate actual outstanding balance from successful payments
      const payments = await Payment.find({ 
        support_request_id: req._id.toString(), 
        status: 'SUCCESSFUL' 
      }).lean();
      const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
      const actualOutstanding = Math.max(0, amount - totalPaid);
      
      // For semester: prefer user.meta.semester, fallback to appPayload.currentSemester
      let semester = user?.meta?.semester || appPayload?.currentSemester || '';
      
      const documentsCount = Array.isArray(req.attachments) ? req.attachments.length : 0;

      return {
        ...req,
        id: req._id ? req._id.toString() : undefined,
        type: 'support',
        full_name: user?.full_name || '',
        email: user?.email || '',
        phone: user?.phone || appPayload?.phone || '',
        program: user?.meta?.program || appPayload?.program || '',
        semester: semester,
        university_id: user?.meta?.accessNumber || appPayload?.accessNumber || '',
        documents_count: documentsCount,
        documents_required: 2,
        amount_requested: amount,
        outstanding_balance: actualOutstanding,
        total_paid: totalPaid,
        reason: req.reason || '',
      };
    }));
    
    res.json(enriched);
  } catch (err) {
    console.error('SUPPORT ERROR:', err);
    res.status(500).json({ error: 'Failed to load support requests' });
  }
});

// GET /api/support/user/:student_uid - Get requests for a specific student
router.get('/user/:student_uid', authenticate, authorize(['admin', 'alumni_office']), async (req, res) => {
  try {
    const requests = await SupportRequest.find({ student_uid: req.params.student_uid }).sort({ created_at: -1 }).lean();
    res.json(requests);
  } catch (err) {
    console.error('GET /support/user/:student_uid error:', err);
    res.status(500).json({ error: 'Failed to fetch student support requests' });
  }
});

// GET /api/support/mine - Get requests for current student
router.get('/mine', authenticate, async (req, res) => {
  try {
    const studentUid = (req as any).user.uid;
    if (!studentUid) return res.status(400).json({ error: 'Could not identify user' });
    const requests = await SupportRequest.find({ student_uid: studentUid }).sort({ created_at: -1 }).lean();
    res.json(requests || []);
  } catch (err) {
    console.error('GET /support/mine error:', err);
    // Fail-safe: return empty array so frontend doesn't break if there's a transient DB issue
    return res.json([]);
  }
});

// GET /api/support/:id - Get specific support request
router.get('/:id', authenticate, async (req, res) => {
  try {
    const request = await SupportRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ error: 'Support request not found' });
    res.json(request);
  } catch (err) {
    console.error('GET /support/:id error:', err);
    res.status(500).json({ error: 'Failed to fetch support request' });
  }
});

// POST /api/support - Create a new support request
router.post('/', authenticate, upload.any(), async (req, res) => {
  try {
    const { student_uid, amount_requested, reason, phone, program, currentSemester, accessNumber, firstName, lastName, email, faculty } = req.body;

    const amount = Number(amount_requested);
    if (!student_uid || isNaN(amount)) {
      return res.status(400).json({ error: 'student_uid and amount_requested are required' });
    }

    // Persist uploaded files (studentIdFile, financialStatement) similar to loans
    const files = ((req as any).files as Express.Multer.File[]) || [];
    const attachments = [] as any[];
    for (const file of files) {
      const safeName = `${Date.now()}-${Math.round(Math.random() * 1e6)}-${file.originalname.replace(/[^a-zA-Z0-9.\-]/g, '_')}`;
      const destPath = path.join(FIN_STAT_DIR, safeName);
      await fs.writeFile(destPath, file.buffer);
      const url = `${BASE_URL}/${UPLOAD_DIR}/financial-statements/${safeName}`;
      attachments.push({
        fieldname: file.fieldname,
        originalname: file.originalname,
        url,
        mimetype: file.mimetype,
        size: file.size,
        uploaded_at: new Date()
      });
    }

    const request = new SupportRequest({
      student_uid,
      amount_requested: amount,
      outstanding_balance: amount,
      reason: reason || '',
      attachments,
      status: 'pending',
      requested_fields: {},
    });

    await request.save();

    // Persist full application payload for recall/display
    await Application.create({
      student_uid,
      type: 'support',
      payload: {
        firstName: firstName || '',
        lastName: lastName || '',
        accessNumber: accessNumber || '',
        email: email || '',
        phone: phone || '',
        program: program || '',
        currentSemester: currentSemester || '',
        faculty: faculty || '',
        amountRequested: amount_requested || '',
        reason: reason || '',
        attachments
      },
      status: 'pending'
    });
    
    // Update user metadata with phone, program, semester, accessNumber if provided
    const updateFields: any = {};
    if (phone) updateFields.phone = phone;
    if (program) updateFields['meta.program'] = program;
    if (currentSemester) updateFields['meta.semester'] = currentSemester;
    if (accessNumber) updateFields['meta.accessNumber'] = accessNumber;
    
    if (Object.keys(updateFields).length > 0) {
      await User.updateOne({ uid: student_uid }, { $set: updateFields });
    }
    
    res.status(201).json(request);
  } catch (err) {
    console.error('POST /support error:', err);
    res.status(500).json({ error: 'Failed to create support request' });
  }
});

// PUT /api/support/:id - Update support request (status, rejection reason, etc.)
router.put('/:id', authenticate, authorize(['admin', 'alumni_office']), async (req, res) => {
  try {
    const { status, rejection_reason, requested_fields } = req.body;
    const allowedStatuses = ['pending', 'approved', 'rejected', 'info_requested'];

    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (rejection_reason) updateData.rejection_reason = rejection_reason;
    if (requested_fields) updateData.requested_fields = requested_fields;

    const request = await SupportRequest.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!request) return res.status(404).json({ error: 'Support request not found' });

    // Log audit trail for approved/rejected status changes
    if (status === 'approved' || status === 'rejected') {
      const user = (req as any).user;
      await logAudit({
        userUid: user.uid,
        userEmail: user.email || 'unknown',
        userRole: user.role,
        action: status === 'approved' ? AuditActions.APPLICATION_APPROVED : AuditActions.APPLICATION_REJECTED,
        details: `Support request ${status} for student ${request.student_uid}: ${request.reason}`,
        ipAddress: req.ip || req.headers['x-forwarded-for'] as string || 'unknown',
        metadata: { request_id: request._id.toString(), support_type: request.reason }
      });
    }

    res.json(request);
  } catch (err) {
    console.error('PUT /support/:id error:', err);
    res.status(500).json({ error: 'Failed to update support request' });
  }
});

// DELETE /api/support/:id - Delete support request
router.delete('/:id', authenticate, authorize(['admin', 'alumni_office']), async (req, res) => {
  try {
    const request = await SupportRequest.findByIdAndDelete(req.params.id);
    if (!request) return res.status(404).json({ error: 'Support request not found' });
    res.json({ message: 'Support request deleted successfully' });
  } catch (err) {
    console.error('DELETE /support/:id error:', err);
    res.status(500).json({ error: 'Failed to delete support request' });
  }
});

export default router;
