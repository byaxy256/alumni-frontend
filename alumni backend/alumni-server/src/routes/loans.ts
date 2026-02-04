// src/routes/loans.ts
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';
import { Loan } from '../models/Loan.js';
import { User } from '../models/User.js';
import { Application } from '../models/Application.js';
import { Disbursement } from '../models/Disbursement.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { notifyTopic } from '../utils/pushNotifications.js';
import { ConsentForm } from '../models/ConsentForm.js';
import { logAudit, AuditActions } from '../utils/auditLogger.js';
import { isStudentBlockedFromNewLoans } from '../services/automatedDeductionService.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';
const FIN_STAT_DIR = path.join(__dirname, '..', '..', UPLOAD_DIR, 'financial-statements');
fs.ensureDirSync(FIN_STAT_DIR);
const BASE_URL = process.env.BASE_URL || 'http://localhost:4000';

// POST /api/loans (Student creates a loan)
router.post('/', authenticate, authorize(['student']), upload.any(), async (req, res) => {
  try {
    const studentUid = (req as any).user.uid;

    // Check if student is blocked due to overdue loans
    const isBlocked = await isStudentBlockedFromNewLoans(studentUid);
    if (isBlocked) {
      return res.status(403).json({ 
        error: 'You have overdue loans and cannot request new loans. Please clear outstanding balances first.' 
      });
    }

    const { amountRequested, semester, consentFullChop, purpose, phone, program, currentSemester, accessNumber, firstName, lastName, email, faculty } = req.body;
    // Guarantor fields (frontend sends these when applicationType === 'loan')
    const guarantorName = req.body.guarantor_name || req.body.guarantorName || req.body.guarantor?.name;
    const guarantorPhone = req.body.guarantor_phone || req.body.guarantorPhone || req.body.guarantor?.phone;
    const guarantorRelation = req.body.guarantor_relation || req.body.guarantorRelation || req.body.guarantor?.relation;
    const amount = Number(amountRequested);
    if (isNaN(amount) || amount <= 0) return res.status(400).json({ error: 'Invalid amountRequested' });

    if (!guarantorName || !guarantorPhone || !guarantorRelation) {
      return res.status(400).json({ error: 'Guarantor name, phone, and relation are required' });
    }

    // Persist uploaded financial documents (studentIdFile, financialStatement)
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

    const loan = await Loan.create({
      student_uid: studentUid,
      amount,
      outstanding_balance: amount,
      status: 'pending',
      purpose: purpose || '',
      application_date: new Date(),
      attachments,
      guarantor: {
        name: guarantorName || undefined,
        phone: guarantorPhone || undefined,
        relation: guarantorRelation || undefined,
      }
    });

    // Persist full application payload for recall/display
    await Application.create({
      student_uid: studentUid,
      type: 'loan',
      payload: {
        firstName: firstName || '',
        lastName: lastName || '',
        accessNumber: accessNumber || '',
        email: email || '',
        phone: phone || '',
        program: program || '',
        currentSemester: currentSemester || '',
        faculty: faculty || '',
        amountRequested: amountRequested || '',
        purpose: purpose || '',
        guarantor: {
          name: guarantorName || '',
          phone: guarantorPhone || '',
          relation: guarantorRelation || '',
        },
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
      await User.updateOne({ uid: studentUid }, { $set: updateFields });
    }

    // Create consent form records if student agreed
    const user = await User.findOne({ uid: studentUid });
    if (consentFullChop === 'yes' || consentFullChop === true) {
      await ConsentForm.create({
        student_uid: studentUid,
        student_name: user?.full_name || 'Unknown',
        student_id: accessNumber || user?.meta?.accessNumber || studentUid,
        form_type: 'chop_consent',
        content: `I consent to full CHOP deductions from my loan disbursement`,
        signed: true,
        signed_at: new Date(),
        ipAddress: req.ip || req.socket.remoteAddress,
        metadata: { loan_id: loan._id.toString(), amount }
      });
    }

    // Create loan agreement consent
    await ConsentForm.create({
      student_uid: studentUid,
      student_name: user?.full_name || 'Unknown',
      student_id: accessNumber || user?.meta?.accessNumber || studentUid,
      form_type: 'loan_agreement',
      content: `Loan Agreement for UGX ${amount.toLocaleString()} - ${purpose || 'Educational expenses'}`,
      signed: true,
      signed_at: new Date(),
      ipAddress: req.ip || req.socket.remoteAddress,
      metadata: { loan_id: loan._id.toString(), amount, purpose }
    });

    res.status(201).json({ ok: true, id: loan._id.toString() });
  } catch (err) {
    console.error('POST /loans error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/loans (Alumni Office gets all loans)
router.get('/', async (_req, res) => {
  try {
    const loans = await Loan.find().sort({ created_at: -1 }).lean();
    
    // Import Payment model
    const { Payment } = await import('../models/Payment.js');
    
    // Enrich with user data and application payload data
    const enriched = await Promise.all(loans.map(async (loan) => {
      const user = await User.findOne({ uid: loan.student_uid }).select('full_name email phone meta').lean();
      
      // Try to get data from Application if available (has semester and amount_requested from form)
      const appData = await Application.findOne({ student_uid: loan.student_uid }).sort({ created_at: -1 }).lean();
      const appPayload = appData?.payload || {};
      
      // For amount: use loan.amount if > 0, else try appPayload.amountRequested, else try disbursement.original_amount
      let amount = loan.amount > 0 ? loan.amount : (appPayload?.amountRequested ? Number(appPayload.amountRequested) : 0);
      if (amount === 0) {
        const disbursement = await Disbursement.findOne({ student_uid: loan.student_uid }).sort({ created_at: -1 }).lean();
        amount = disbursement?.original_amount || 0;
      }
      
      // Calculate actual outstanding balance from successful payments
      const payments = await Payment.find({ 
        loan_id: loan._id.toString(), 
        status: 'SUCCESSFUL' 
      }).lean();
      const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
      const actualOutstanding = Math.max(0, amount - totalPaid);
      
      // For semester: prefer user.meta.semester, fallback to appPayload.currentSemester
      let semester = user?.meta?.semester || appPayload?.currentSemester || '';
      
      const documentsCount = Array.isArray((loan as any).attachments)
        ? (loan as any).attachments.length
        : Array.isArray(appPayload?.attachments)
          ? appPayload.attachments.length
          : 0;

      return {
        ...loan,
        id: loan._id ? loan._id.toString() : loan.sqlId,
        type: 'loan',
        full_name: user?.full_name || '',
        email: user?.email || '',
        phone: user?.phone || appPayload?.phone || '',
        program: user?.meta?.program || appPayload?.program || '',
        semester: semester,
        university_id: user?.meta?.accessNumber || appPayload?.accessNumber || '',
        // Expose guarantor fields for frontend display (support different possible shapes)
        guarantor_name: loan?.guarantor?.name || (loan as any).guarantor_name || '',
        guarantor_phone: loan?.guarantor?.phone || (loan as any).guarantor_phone || '',
        guarantor_relation: loan?.guarantor?.relation || (loan as any).guarantor_relation || '',
        guarantor: loan?.guarantor || undefined,
        documents_count: documentsCount,
        documents_required: 2,
        amount_requested: amount,
        outstanding_balance: actualOutstanding,
        total_paid: totalPaid,
        purpose: loan.purpose || appPayload?.purpose || '',
        repaymentPeriod: 12,
      };
    }));

    res.json(enriched);
  } catch (err) {
    console.error('LOANS ERROR:', err);
    res.status(500).json({ error: 'Failed to load loans' });
  }
});

// GET /api/loans/mine (Student gets their own loans)
router.get('/mine', authenticate, async (req, res) => {
  try {
    const studentUid = (req as any).user.uid;
    const loans = await Loan.find({ student_uid: studentUid })
      .sort({ created_at: -1 })
      .lean();
    
    // Import Payment model to calculate actual outstanding balance
    const { Payment } = await import('../models/Payment.js');
    
    // Normalize response and recalculate outstanding balance from payments
    const mapped = await Promise.all(loans.map(async (loan) => {
      // Get all successful payments for this loan
      const payments = await Payment.find({ 
        loan_id: loan._id.toString(), 
        status: 'SUCCESSFUL' 
      }).lean();
      
      const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
      const actualOutstanding = Math.max(0, loan.amount - totalPaid);
      
      return {
        id: loan._id.toString(),
        amount_requested: loan.amount,
        outstanding_balance: actualOutstanding,
        total_paid: totalPaid,
        status: loan.status,
        created_at: loan.created_at,
        repaymentPeriod: (loan as any).repaymentPeriod,
        chopConsented: (loan as any).consentFullChop || false,
        guarantor_name: (loan as any)?.guarantor?.name || (loan as any)?.guarantor_name || '',
        guarantor_phone: (loan as any)?.guarantor?.phone || (loan as any)?.guarantor_phone || '',
        guarantor_relation: (loan as any)?.guarantor?.relation || (loan as any)?.guarantor_relation || '',
        raw: loan
      };
    }));

    res.json(mapped);
  } catch (err) {
    console.error('GET /loans/mine error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/loans/:id/status (Alumni Office updates status)
router.patch('/:id/status', authenticate, authorize(['alumni_office', 'admin']), async (req, res) => {
  const { id } = req.params;
  try {
    const { status, reason } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status provided' });
    }

    const loan = await Loan.findByIdAndUpdate(id, {
      status,
      rejection_reason: status === 'rejected' ? (reason || null) : null,
      approved_at: status === 'approved' ? new Date() : undefined,
      approved_by: status === 'approved' ? (req as any).user.uid : undefined
    }, { new: true });

    if (!loan) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    // Log audit trail
    const user = (req as any).user;
    await logAudit({
      userUid: user.uid,
      userEmail: user.email || 'unknown',
      userRole: user.role,
      action: status === 'approved' ? AuditActions.APPLICATION_APPROVED : AuditActions.APPLICATION_REJECTED,
      details: `Loan application ${status} for student ${loan.student_uid}: UGX ${loan.amount.toLocaleString()}`,
      ipAddress: req.ip || req.headers['x-forwarded-for'] as string || 'unknown',
      metadata: { loan_id: loan._id.toString(), amount: loan.amount, reason }
    });

    // Send push notification when loan is approved
    if (status === 'approved') {
      try {
        await notifyTopic(
          'loans',
          'Loan Approved 🎉',
          'Your loan application has been approved',
          '/loans'
        );
      } catch (pushErr) {
        console.error('Failed to send loan approval push notification:', pushErr);
      }
    }

    res.json({ message: `Loan status updated successfully to ${status}` });
  } catch (err) {
    console.error(`Error updating loan ${id}:`, err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;