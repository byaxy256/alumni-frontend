// src/routes/admin-mongo.ts
import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { User } from '../models/User.js';
import { Donation } from '../models/Donation.js';
import { Application } from '../models/Application.js';
import { Disbursement } from '../models/Disbursement.js';
import { MentorAssignment } from '../models/MentorAssignment.js';
import { Loan } from '../models/Loan.js';
import { SupportRequest } from '../models/SupportRequest.js';
import { AuditLog } from '../models/AuditLog.js';
import { ConsentForm } from '../models/ConsentForm.js';

const router = express.Router();

/**
 * GET /api/admin/dashboard-stats
 * Comprehensive dashboard statistics for admin
 */
router.get('/dashboard-stats', authenticate, async (req, res) => {
  try {
    const userRole = (req as any).user.role;
    if (userRole !== 'admin' && userRole !== 'alumni_office') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // User stats by role
    const totalUsers = await User.countDocuments();
    const studentCount = await User.countDocuments({ role: 'student' });
    const alumniCount = await User.countDocuments({ role: 'alumni' });
    const alumniOfficeCount = await User.countDocuments({ role: 'alumni_office' });
    const adminCount = await User.countDocuments({ role: 'admin' });

    // Donation stats
    const completedDonations = await Donation.find({ payment_status: 'completed' }).lean();
    const totalDonated = completedDonations.reduce((sum, d) => sum + d.amount, 0);
    const donorCount = new Set(completedDonations.map(d => d.donor_uid)).size;

    // Application stats (count both Application model AND Loan/Support models)
    const totalApplications = await Application.countDocuments();
    const totalLoans = await Loan.countDocuments();
    const totalSupport = await SupportRequest.countDocuments();
    
    const pendingApplications = await Application.countDocuments({ status: 'pending' });
    const pendingLoans = await Loan.countDocuments({ status: 'pending' });
    const pendingSupport = await SupportRequest.countDocuments({ status: 'pending' });
    
    const approvedApplications = await Application.countDocuments({ status: 'approved' });
    const approvedLoans = await Loan.countDocuments({ status: 'approved' });
    const approvedSupport = await SupportRequest.countDocuments({ status: 'approved' });

    // Disbursement stats
    const allDisbursements = await Disbursement.find().lean();
    const totalDisbursed = allDisbursements.reduce((sum, d) => sum + d.net_amount, 0);
    const pendingDisbursements = 0; // No status field in current schema

    // Mentorship stats
    const activeMentorships = await MentorAssignment.countDocuments({ status: 'active' });
    const totalMentorships = await MentorAssignment.countDocuments();

    // Recent growth (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const newUsers = await User.countDocuments({ created_at: { $gte: thirtyDaysAgo } });
    const recentDonations = await Donation.find({ 
      created_at: { $gte: thirtyDaysAgo },
      payment_status: 'completed'
    }).lean();
    const recentDonationTotal = recentDonations.reduce((sum, d) => sum + d.amount, 0);

    res.json({
      users: {
        total: totalUsers,
        students: studentCount,
        alumni: alumniCount,
        admins: adminCount,
        alumni_office: alumniOfficeCount,
        newLast30Days: newUsers
      },
      donations: {
        totalAmount: totalDonated,
        totalCount: completedDonations.length,
        donorCount,
        last30DaysAmount: recentDonationTotal,
        last30DaysCount: recentDonations.length
      },
      applications: {
        total: totalApplications + totalLoans + totalSupport,
        pending: pendingApplications + pendingLoans + pendingSupport,
        approved: approvedApplications + approvedLoans + approvedSupport
      },
      disbursements: {
        totalAmount: totalDisbursed,
        totalCount: allDisbursements.length,
        pending: pendingDisbursements
      },
      mentorships: {
        active: activeMentorships,
        total: totalMentorships
      }
    });
  } catch (err) {
    console.error('GET /admin/dashboard-stats error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

/**
 * GET /api/admin/recent-activity
 * Recent system activity across all modules
 */
router.get('/recent-activity', authenticate, async (req, res) => {
  try {
    const userRole = (req as any).user.role;
    if (userRole !== 'admin' && userRole !== 'alumni_office') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const limit = parseInt(req.query.limit as string) || 20;

    // Collect actors so we can render names instead of bare UIDs
    const uidSet = new Set<string>();

    // Get recent donations
    const recentDonations = await Donation.find({ payment_status: 'completed' })
      .sort({ created_at: -1 })
      .limit(limit)
      .lean();
    recentDonations.forEach(d => uidSet.add(d.donor_uid));

    // Get recent applications
    const recentApplications = await Application.find()
      .sort({ created_at: -1 })
      .limit(limit)
      .lean();
    recentApplications.forEach(a => uidSet.add(a.student_uid));
      
    // Get recent loans
    const recentLoans = await Loan.find()
      .sort({ created_at: -1 })
      .limit(limit)
      .lean();
    recentLoans.forEach(l => uidSet.add(l.student_uid));
      
    // Get recent support requests
    const recentSupport = await SupportRequest.find()
      .sort({ created_at: -1 })
      .limit(limit)
      .lean();
    recentSupport.forEach(s => uidSet.add(s.student_uid));

    // Get recent disbursements
    const recentDisbursements = await Disbursement.find()
      .sort({ created_at: -1 })
      .limit(limit)
      .lean();
    recentDisbursements.forEach(d => uidSet.add(d.student_uid));

    // Get recent users
    const recentUsers = await User.find()
      .sort({ created_at: -1 })
      .limit(limit)
      .select('uid full_name email role created_at')
      .lean();

    // Build a UID -> display string map so activity shows names
    const actorUids = Array.from(uidSet);
    const actorDocs = actorUids.length
      ? await User.find({ uid: { $in: actorUids } }).select('uid full_name email role').lean()
      : [];
    const userDisplay = new Map<string, string>();
    actorDocs.forEach(u => {
      const label = u.full_name || u.email || u.uid;
      userDisplay.set(u.uid, `${label}${u.role ? ` (${u.role})` : ''}`);
    });

    const formatActor = (uid: string) => userDisplay.get(uid) || uid;

    // Combine and format
    const activities: any[] = [];

    recentDonations.forEach(d => {
      activities.push({
        type: 'donation',
        action: `New donation of UGX ${d.amount.toLocaleString()} to ${d.cause}`,
        user: formatActor(d.donor_uid),
        amount: `UGX ${d.amount.toLocaleString()}`,
        time: d.created_at,
        status: 'success'
      });
    });

    recentApplications.forEach(a => {
      const amountFromPayload = (a.payload as any)?.amount || (a.payload as any)?.loan_amount;
      activities.push({
        type: 'application',
        action: `Loan application ${a.status}`,
        user: formatActor(a.student_uid),
        amount: amountFromPayload ? `UGX ${amountFromPayload.toLocaleString()}` : undefined,
        time: a.created_at,
        status: a.status === 'approved' ? 'success' : a.status === 'pending' ? 'warning' : 'info'
      });
    });
    
    recentLoans.forEach(l => {
      activities.push({
        type: 'loan',
        action: `Loan application ${l.status}`,
        user: formatActor(l.student_uid),
        amount: l.amount ? `UGX ${l.amount.toLocaleString()}` : undefined,
        time: l.created_at,
        status: l.status === 'approved' ? 'success' : l.status === 'pending' ? 'warning' : 'info'
      });
    });
    
    recentSupport.forEach(s => {
      activities.push({
        type: 'support',
        action: `Support request ${s.status}`,
        user: formatActor(s.student_uid),
        amount: s.amount_requested ? `UGX ${s.amount_requested.toLocaleString()}` : undefined,
        time: s.created_at,
        status: s.status === 'approved' ? 'success' : s.status === 'pending' ? 'warning' : 'info'
      });
    });

    recentDisbursements.forEach(d => {
      activities.push({
        type: 'disbursement',
        action: `Disbursement completed`,
        user: formatActor(d.student_uid),
        amount: `UGX ${d.net_amount.toLocaleString()}`,
        time: d.created_at,
        status: 'success'
      });
    });

    recentUsers.forEach(u => {
      activities.push({
        type: 'user',
        action: `New ${u.role} registered`,
        user: u.full_name || u.email,
        time: u.created_at,
        status: 'info'
      });
    });

    // Sort by time descending
    activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    res.json(activities.slice(0, limit));
  } catch (err) {
    console.error('GET /admin/recent-activity error:', err);
    res.status(500).json({ error: 'Failed to fetch recent activity' });
  }
});

/**
 * GET /api/admin/trends
 * Monthly trends for donations, disbursements, applications
 */
router.get('/trends', authenticate, async (req, res) => {
  try {
    const userRole = (req as any).user.role;
    if (userRole !== 'admin' && userRole !== 'alumni_office') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const months = 6; // Last 6 months
    const now = new Date();
    const monthlyData: any[] = [];

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

      // Donations in this month
      const donations = await Donation.find({
        created_at: { $gte: date, $lt: nextMonth },
        payment_status: 'completed'
      }).lean();
      const donationTotal = donations.reduce((sum, d) => sum + d.amount, 0);

      // Disbursements in this month
      const disbursements = await Disbursement.find({
        created_at: { $gte: date, $lt: nextMonth }
      }).lean();
      const disbursementTotal = disbursements.reduce((sum, d) => sum + d.net_amount, 0);

      // Applications in this month (all types)
      const applications = await Application.countDocuments({
        created_at: { $gte: date, $lt: nextMonth }
      });
      
      const loans = await Loan.countDocuments({
        created_at: { $gte: date, $lt: nextMonth }
      });
      
      const support = await SupportRequest.countDocuments({
        created_at: { $gte: date, $lt: nextMonth }
      });

      // New users in this month
      const newUsers = await User.countDocuments({
        created_at: { $gte: date, $lt: nextMonth }
      });

      monthlyData.push({
        month: monthName,
        donations: donationTotal,
        disbursements: disbursementTotal,
        applications: applications + loans + support,
        newUsers
      });
    }

    res.json(monthlyData);
  } catch (err) {
    console.error('GET /admin/trends error:', err);
    res.status(500).json({ error: 'Failed to fetch trends' });
  }
});

/**
 * GET /api/admin/pending-alumni-office
 * Get all pending alumni office account requests
 */
router.get('/pending-alumni-office', authenticate, async (req, res) => {
  try {
    const userRole = (req as any).user.role;
    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Find users with role alumni_office who are not yet verified/approved
    // We'll use a meta.approved field to track this
    const pendingUsers = await User.find({
      role: 'alumni_office',
      $or: [
        { 'meta.approved': { $exists: false } },
        { 'meta.approved': false }
      ]
    }).select('uid full_name email phone meta created_at').lean();

    res.json(pendingUsers);
  } catch (err) {
    console.error('GET /admin/pending-alumni-office error:', err);
    res.status(500).json({ error: 'Failed to fetch pending alumni office accounts' });
  }
});

/**
 * POST /api/admin/approve-alumni-office
 * Approve or reject an alumni office account
 */
router.post('/approve-alumni-office', authenticate, async (req, res) => {
  try {
    const userRole = (req as any).user.role;
    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { uid, approved } = req.body;
    
    if (!uid || typeof approved !== 'boolean') {
      return res.status(400).json({ error: 'uid and approved (boolean) are required' });
    }

    const user = await User.findOneAndUpdate(
      { uid, role: 'alumni_office' },
      {
        $set: {
          'meta.approved': approved,
          'meta.approvedAt': new Date(),
          'meta.approvedBy': (req as any).user.uid,
          'meta.suspended': false
        }
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ 
      success: true, 
      message: approved ? 'Alumni office account approved' : 'Alumni office account rejected',
      user: {
        uid: user.uid,
        full_name: user.full_name,
        email: user.email,
        approved: !!user.meta?.approved,
        suspended: !!user.meta?.suspended
      }
    });
  } catch (err) {
    console.error('POST /admin/approve-alumni-office error:', err);
    res.status(500).json({ error: 'Failed to update approval status' });
  }
});

/**
 * POST /api/admin/alumni-office/suspend
 * Suspend or unsuspend an alumni office user
 */
router.post('/alumni-office/suspend', authenticate, async (req, res) => {
  try {
    const userRole = (req as any).user.role;
    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { uid, suspended } = req.body;
    if (!uid || typeof suspended !== 'boolean') {
      return res.status(400).json({ error: 'uid and suspended (boolean) are required' });
    }

    const user = await User.findOneAndUpdate(
      { uid, role: 'alumni_office' },
      { $set: { 'meta.suspended': suspended } },
      { new: true }
    );

    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({ success: true, user: { uid: user.uid, suspended: user.meta?.suspended } });
  } catch (err) {
    console.error('POST /admin/alumni-office/suspend error:', err);
    res.status(500).json({ error: 'Failed to update suspension status' });
  }
});

/**
 * DELETE /api/admin/alumni-office/:uid
 * Delete an alumni office user
 */
router.delete('/alumni-office/:uid', authenticate, async (req, res) => {
  try {
    const userRole = (req as any).user.role;
    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { uid } = req.params;
    const deleted = await User.findOneAndDelete({ uid, role: 'alumni_office' });
    if (!deleted) return res.status(404).json({ error: 'User not found' });

    res.json({ success: true, message: 'Alumni office user deleted' });
  } catch (err) {
    console.error('DELETE /admin/alumni-office/:uid error:', err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

/**
 * GET /api/admin/audit-logs
 * Get system audit logs with filtering
 */
router.get('/audit-logs', authenticate, async (req, res) => {
  try {
    const userRole = (req as any).user.role;
    if (userRole !== 'admin' && userRole !== 'alumni_office') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const limit = parseInt(req.query.limit as string) || 100;
    const action = req.query.action as string;
    const userUid = req.query.user as string;
    
    const query: any = {};
    if (action && action !== 'all') {
      query.action = action;
    }
    if (userUid) {
      query.user_uid = userUid;
    }

    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();

    res.json(logs);
  } catch (err) {
    console.error('GET /admin/audit-logs error:', err);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

/**
 * POST /api/admin/audit-log
 * Create a new audit log entry (utility for logging admin actions)
 */
router.post('/audit-log', authenticate, async (req, res) => {
  try {
    const { action, details, metadata } = req.body;
    const user = (req as any).user;
    
    if (!action || !details) {
      return res.status(400).json({ error: 'action and details are required' });
    }

    const log = await AuditLog.create({
      user_uid: user.uid,
      user_email: user.email,
      user_role: user.role,
      action,
      details,
      ip_address: req.ip || req.socket.remoteAddress,
      metadata: metadata || {}
    });

    res.status(201).json({ success: true, id: log._id.toString() });
  } catch (err) {
    console.error('POST /admin/audit-log error:', err);
    res.status(500).json({ error: 'Failed to create audit log' });
  }
});

/**
 * GET /api/admin/financial-statements
 * List uploaded financial statements attached to loan applications
 */
router.get('/financial-statements', authenticate, async (req, res) => {
  try {
    const userRole = (req as any).user.role;
    if (userRole !== 'admin' && userRole !== 'alumni_office') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const loansWithFiles = await Loan.find({ 'attachments.0': { $exists: true } })
      .sort({ created_at: -1 })
      .lean();

    const supportWithFiles = await SupportRequest.find({ 'attachments.0': { $exists: true } })
      .sort({ created_at: -1 })
      .lean();

    const uids = Array.from(new Set([
      ...loansWithFiles.map(l => l.student_uid),
      ...supportWithFiles.map(s => s.student_uid)
    ]));
    const userDocs = uids.length
      ? await User.find({ uid: { $in: uids } }).select('uid full_name email role').lean()
      : [];
    const userLookup = new Map(userDocs.map(u => [u.uid, u]));

    const fromLoan = loansWithFiles.flatMap(loan => {
      const attachments = (loan.attachments || []).filter(att =>
        ['financialStatement', 'financial_statement', 'financial'].includes(att.fieldname || '')
      );
      const relevant = attachments.length ? attachments : (loan.attachments || []);

      return relevant.map(att => {
        const user = userLookup.get(loan.student_uid);
        return {
          source: 'loan',
          loan_id: loan._id?.toString() || '',
          support_id: undefined,
          student_uid: loan.student_uid,
          student_name: user?.full_name || loan.student_uid,
          email: user?.email,
          role: user?.role,
          amount: loan.amount,
          status: loan.status,
          url: att.url,
          filename: att.originalname,
          uploaded_at: att.uploaded_at || loan.created_at
        };
      });
    });

    const fromSupport = supportWithFiles.flatMap(support => {
      const attachments = (support.attachments || []).filter(att =>
        ['financialStatement', 'financial_statement', 'financial'].includes(att.fieldname || '')
      );
      const relevant = attachments.length ? attachments : (support.attachments || []);

      return relevant.map(att => {
        const user = userLookup.get(support.student_uid);
        return {
          source: 'support',
          loan_id: undefined,
          support_id: support._id?.toString() || '',
          student_uid: support.student_uid,
          student_name: user?.full_name || support.student_uid,
          email: user?.email,
          role: user?.role,
          amount: support.amount_requested,
          status: support.status,
          url: att.url,
          filename: att.originalname,
          uploaded_at: att.uploaded_at || support.created_at
        };
      });
    });

    res.json([...fromLoan, ...fromSupport]);
  } catch (err) {
    console.error('GET /admin/financial-statements error:', err);
    res.status(500).json({ error: 'Failed to fetch financial statements' });
  }
});

/**
 * GET /api/admin/consent-forms
 * Fetch all consent forms with optional filters
 */
router.get('/consent-forms', authenticate, async (req, res) => {
  try {
    const userRole = (req as any).user.role;
    if (userRole !== 'admin' && userRole !== 'alumni_office') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { form_type, signed, student_uid } = req.query;
    const query: any = {};
    
    if (form_type) query.form_type = form_type;
    if (signed !== undefined) query.signed = signed === 'true';
    if (student_uid) query.student_uid = student_uid;

    const forms = await ConsentForm.find(query)
      .sort({ signed_at: -1, created_at: -1 })
      .limit(100)
      .lean();

    res.json(forms);
  } catch (err) {
    console.error('GET /admin/consent-forms error:', err);
    res.status(500).json({ error: 'Failed to fetch consent forms' });
  }
});

/**
 * POST /api/admin/consent-form
 * Create a consent form record (called when student signs a form)
 */
router.post('/consent-form', authenticate, async (req, res) => {
  try {
    const { student_uid, form_type, content, signed } = req.body;
    const user = (req as any).user;

    if (!student_uid || !form_type || !content) {
      return res.status(400).json({ error: 'student_uid, form_type, and content are required' });
    }

    // Get student details
    const student = await User.findOne({ uid: student_uid });
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const form = await ConsentForm.create({
      student_uid,
      student_name: student.full_name,
      student_id: student.meta?.student_id || student.uid,
      form_type,
      content,
      signed: signed || false,
      signed_at: signed ? new Date() : undefined,
      ip_address: req.ip || req.socket.remoteAddress,
      metadata: { created_by: user.uid }
    });

    res.status(201).json({ success: true, id: form._id.toString() });
  } catch (err) {
    console.error('POST /admin/consent-form error:', err);
    res.status(500).json({ error: 'Failed to create consent form' });
  }
});

export default router;
