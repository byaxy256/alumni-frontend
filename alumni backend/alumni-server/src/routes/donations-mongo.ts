// src/routes/donations-mongo.ts
import express from 'express';
import { Donation } from '../models/Donation.js';
import { User } from '../models/User.js';
import { MentorAssignment } from '../models/MentorAssignment.js';
import { authenticate } from '../middleware/auth.js';
import { logAudit, AuditActions } from '../utils/auditLogger.js';

const router = express.Router();

/**
 * POST /api/donations
 * Create a donation record (called after payment initiation)
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const { amount, cause, transaction_ref, payment_method } = req.body;
    const userUid = (req as any).user.uid;

    if (!amount || !cause || !transaction_ref) {
      return res.status(400).json({ error: 'amount, cause, and transaction_ref are required' });
    }

    const donation = new Donation({
      donor_uid: userUid,
      amount,
      cause,
      transaction_ref,
      payment_method: payment_method || 'flutterwave',
      payment_status: 'pending',
    });

    await donation.save();
    res.status(201).json(donation);
  } catch (err) {
    console.error('POST /donations error:', err);
    res.status(500).json({ error: 'Failed to create donation record' });
  }
});

/**
 * POST /api/donations/webhook
 * Flutterwave webhook to update donation status
 */
router.post('/webhook', async (req, res) => {
  try {
    const { status, tx_ref, amount, currency, customer } = req.body;

    if (!tx_ref) {
      return res.status(400).json({ error: 'tx_ref is required' });
    }

    const donation = await Donation.findOne({ transaction_ref: tx_ref });
    if (!donation) {
      return res.status(404).json({ error: 'Donation not found' });
    }

    // Update status based on Flutterwave response
    if (status === 'successful') {
      donation.payment_status = 'completed';
    } else if (status === 'failed') {
      donation.payment_status = 'failed';
    }

    donation.payment_metadata = req.body;
    donation.updated_at = new Date();
    await donation.save();

    res.json({ message: 'Donation status updated', donation });
  } catch (err) {
    console.error('POST /donations/webhook error:', err);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
});

/**
 * POST /api/donations/confirm
 * Confirm donation payment (called after successful PIN entry)
 */
router.post('/confirm', authenticate, async (req, res) => {
  try {
    const { transaction_ref } = req.body;
    const userUid = (req as any).user.uid;

    if (!transaction_ref) {
      return res.status(400).json({ error: 'transaction_ref is required' });
    }

    const donation = await Donation.findOne({ 
      transaction_ref,
      donor_uid: userUid 
    });

    if (!donation) {
      return res.status(404).json({ error: 'Donation not found' });
    }

    // Mark as completed
    donation.payment_status = 'completed';
    donation.updated_at = new Date();
    await donation.save();

    // Log audit trail
    const user = (req as any).user;
    const donorUser = await User.findOne({ uid: userUid });
    await logAudit({
      userUid: userUid,
      userEmail: donorUser?.email || 'unknown',
      userRole: donorUser?.role || 'unknown',
      action: AuditActions.DONATION_CONFIRMED,
      details: `Donation confirmed: UGX ${donation.amount.toLocaleString()} for ${donation.cause}`,
      ipAddress: req.ip || req.headers['x-forwarded-for'] as string || 'unknown',
      metadata: { 
        donation_id: donation._id.toString(),
        amount: donation.amount,
        cause: donation.cause,
        payment_method: donation.payment_method
      }
    });

    res.json({ message: 'Donation confirmed', donation });
  } catch (err) {
    console.error('POST /donations/confirm error:', err);
    res.status(500).json({ error: 'Failed to confirm donation' });
  }
});

/**
 * GET /api/donations/my-donations
 * Get all donations by current user (excludes Flutterwave)
 */
router.get('/my-donations', authenticate, async (req, res) => {
  try {
    const userUid = (req as any).user.uid;
    const donations = await Donation.find({ 
      donor_uid: userUid,
      payment_method: { $in: ['mtn', 'airtel', 'bank'] }
    })
      .sort({ created_at: -1 })
      .lean();

    res.json(donations);
  } catch (err) {
    console.error('GET /my-donations error:', err);
    res.status(500).json({ error: 'Failed to fetch donations' });
  }
});

/**
 * GET /api/donations/stats
 * Get donation statistics for current user (excludes Flutterwave)
 */
router.get('/stats', authenticate, async (req, res) => {
  try {
    const userUid = (req as any).user.uid;

    // Get all completed donations (exclude Flutterwave)
    const completedDonations = await Donation.find({
      donor_uid: userUid,
      payment_status: 'completed',
      payment_method: { $in: ['mtn', 'airtel', 'bank'] }
    }).lean();

    const totalDonated = completedDonations.reduce((sum, d) => sum + d.amount, 0);
    
    // Calculate this year's donations
    const currentYear = new Date().getFullYear();
    const currentYearDonations = completedDonations.filter(d => 
      new Date(d.created_at).getFullYear() === currentYear
    );
    const currentYearTotal = currentYearDonations.reduce((sum, d) => sum + d.amount, 0);

    // Get actual students mentored
    const mentorAssignments = await MentorAssignment.find({ 
      mentor_uid: userUid,
      status: 'active'
    }).lean();
    
    const studentsHelped = mentorAssignments.length;

    res.json({
      totalDonated,
      studentsHelped,
      currentYear: currentYearTotal,
      donationCount: completedDonations.length
    });
  } catch (err) {
    console.error('GET /donations/stats error:', err);
    res.status(500).json({ error: 'Failed to fetch donation stats' });
  }
});

/**
 * GET /api/donations/all-stats
 * Get platform-wide donation statistics (for admin/dashboard)
 */
router.get('/all-stats', authenticate, async (req, res) => {
  try {
    const completedDonations = await Donation.find({ payment_status: 'completed' }).lean();
    
    const totalRaised = completedDonations.reduce((sum, d) => sum + d.amount, 0);
    const donorCount = new Set(completedDonations.map(d => d.donor_uid)).size;
    
    // Group by cause
    const byCause: Record<string, number> = {};
    completedDonations.forEach(d => {
      byCause[d.cause] = (byCause[d.cause] || 0) + d.amount;
    });

    res.json({
      totalRaised,
      donorCount,
      donationCount: completedDonations.length,
      byCause
    });
  } catch (err) {
    console.error('GET /donations/all-stats error:', err);
    res.status(500).json({ error: 'Failed to fetch platform stats' });
  }
});

/**
 * GET /api/donations/causes
 * Get donation causes with real-time raised amounts
 */
router.get('/causes', async (req, res) => {
  try {
    const completedDonations = await Donation.find({ payment_status: 'completed' }).lean();
    
    // Group by cause
    const byCause: Record<string, number> = {};
    completedDonations.forEach(d => {
      byCause[d.cause] = (byCause[d.cause] || 0) + d.amount;
    });

    const donationCauses = [
      {
        id: 'student-loans',
        name: 'Student Loan Fund',
        raised: byCause['Student Loan Fund'] || 0,
        goal: 30000000
      },
      {
        id: 'scholarships',
        name: 'Merit Scholarships',
        raised: byCause['Merit Scholarships'] || 0,
        goal: 20000000
      },
      {
        id: 'infrastructure',
        name: 'Campus Development',
        raised: byCause['Campus Development'] || 0,
        goal: 50000000
      },
      {
        id: 'emergency',
        name: 'Emergency Relief',
        raised: byCause['Emergency Relief'] || 0,
        goal: 10000000
      },
    ];

    res.json(donationCauses);
  } catch (err) {
    console.error('GET /donations/causes error:', err);
    res.status(500).json({ error: 'Failed to fetch causes' });
  }
});

export default router;
