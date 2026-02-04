// src/routes/automated-deductions.ts - API endpoints for automated loan deductions
import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { Loan } from '../models/Loan.js';
import { AutomatedDeduction } from '../models/AutomatedDeduction.js';
import { Notification } from '../models/Notification.js';
import {
    processPaymentDeduction,
    isStudentBlockedFromNewLoans,
    getLoanBalanceSummary,
    getLoanDeductionHistory,
    markLoanAsOverdue,
    processOverdueLoans,
} from '../services/automatedDeductionService.js';

const router = express.Router();

/**
 * POST /api/automated-deductions/process-payment
 * 
 * Called by School Finance System when a student makes a payment
 * Automatically deducts payment from outstanding loan balance
 * 
 * Body: {
 *   student_uid: string,
 *   payment_amount: number,
 *   payment_reference?: string (e.g., school finance transaction ID)
 * }
 */
router.post('/process-payment', async (req, res) => {
    try {
        const { student_uid, payment_amount, payment_reference } = req.body;

        if (!student_uid || !payment_amount || payment_amount <= 0) {
            return res.status(400).json({ 
                error: 'Invalid request. Required: student_uid, payment_amount (> 0)' 
            });
        }

        const result = await processPaymentDeduction(student_uid, payment_amount, payment_reference);
        
        if (!result.success) {
            return res.status(400).json(result);
        }

        res.status(200).json({
            success: true,
            data: result,
            message: result.message,
        });
    } catch (err) {
        console.error('POST /process-payment error:', err);
        res.status(500).json({ error: 'Failed to process payment deduction' });
    }
});

/**
 * GET /api/automated-deductions/check-block/:studentUid
 * 
 * Check if student is blocked from new loans due to overdue balance
 */
router.get('/check-block/:studentUid', async (req, res) => {
    try {
        const { studentUid } = req.params;
        const isBlocked = await isStudentBlockedFromNewLoans(studentUid);

        res.json({
            student_uid: studentUid,
            isBlocked,
            message: isBlocked 
                ? 'Student has overdue loans and cannot request new loans'
                : 'Student is not blocked',
        });
    } catch (err) {
        console.error('GET /check-block error:', err);
        res.status(500).json({ error: 'Failed to check block status' });
    }
});

/**
 * GET /api/automated-deductions/balance-summary
 * 
 * Get complete loan balance summary for authenticated student
 */
router.get('/balance-summary', authenticate, async (req, res) => {
    try {
        const studentUid = (req as any).user.uid;
        const summary = await getLoanBalanceSummary(studentUid);

        if (!summary) {
            return res.status(500).json({ error: 'Failed to retrieve balance summary' });
        }

        res.json({
            success: true,
            data: summary,
        });
    } catch (err) {
        console.error('GET /balance-summary error:', err);
        res.status(500).json({ error: 'Failed to fetch balance summary' });
    }
});

/**
 * GET /api/automated-deductions/loan/:loanId/deductions
 * 
 * Get deduction history for a specific loan
 */
router.get('/loan/:loanId/deductions', authenticate, async (req, res) => {
    try {
        const { loanId } = req.params;
        const studentUid = (req as any).user.uid;

        // Verify student owns this loan
        const loan = await Loan.findById(loanId);
        if (!loan || loan.student_uid !== studentUid) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const deductions = await getLoanDeductionHistory(loanId);
        res.json({
            success: true,
            loanId,
            deductions,
            count: deductions.length,
        });
    } catch (err) {
        console.error('GET /loan/:loanId/deductions error:', err);
        res.status(500).json({ error: 'Failed to fetch deduction history' });
    }
});

/**
 * GET /api/automated-deductions/all
 * 
 * Admin/Alumni Office: Get all deductions (with filtering)
 */
router.get('/all', authenticate, authorize(['admin', 'alumni_office']), async (req, res) => {
    try {
        const { student_uid, trigger, semester, limit = 50, skip = 0 } = req.query;

        let query: any = {};
        if (student_uid) query.student_uid = student_uid;
        if (trigger) query.trigger = trigger;
        if (semester) query.deduction_semester = semester;

        const deductions = await AutomatedDeduction.find(query)
            .sort({ created_at: -1 })
            .limit(Number(limit))
            .skip(Number(skip))
            .lean();

        const total = await AutomatedDeduction.countDocuments(query);

        res.json({
            success: true,
            data: deductions,
            pagination: {
                total,
                limit: Number(limit),
                skip: Number(skip),
            },
        });
    } catch (err) {
        console.error('GET /all error:', err);
        res.status(500).json({ error: 'Failed to fetch deductions' });
    }
});

/**
 * POST /api/automated-deductions/mark-overdue/:loanId
 * 
 * Admin only: Manually mark a loan as overdue
 */
router.post('/mark-overdue/:loanId', 
    authenticate, 
    authorize(['admin', 'alumni_office']), 
    async (req, res) => {
        try {
            const { loanId } = req.params;
            const loan = await Loan.findById(loanId);

            if (!loan) {
                return res.status(404).json({ error: 'Loan not found' });
            }

            if (loan.outstanding_balance <= 0) {
                return res.status(400).json({ 
                    error: 'Cannot mark paid loan as overdue' 
                });
            }

            await markLoanAsOverdue(loanId, loan.student_uid);

            res.json({
                success: true,
                message: `Loan ${loanId} marked as overdue`,
                loanId,
                studentUid: loan.student_uid,
                outstandingBalance: loan.outstanding_balance,
            });
        } catch (err) {
            console.error('POST /mark-overdue error:', err);
            res.status(500).json({ error: 'Failed to mark loan as overdue' });
        }
    }
);

/**
 * POST /api/automated-deductions/process-overdue-batch
 * 
 * Admin only: Batch process all overdue loans (run at semester start)
 * This should be called via cron job or admin dashboard
 */
router.post('/process-overdue-batch', 
    authenticate, 
    authorize(['admin']), 
    async (req, res) => {
        try {
            const result = await processOverdueLoans();
            res.json(result);
        } catch (err) {
            console.error('POST /process-overdue-batch error:', err);
            res.status(500).json({ error: 'Failed to process overdue loans' });
        }
    }
);

/**
 * GET /api/automated-deductions/student/:studentUid
 * 
 * Admin: Get all deductions for a specific student
 */
router.get('/student/:studentUid', 
    authenticate, 
    authorize(['admin', 'alumni_office']), 
    async (req, res) => {
        try {
            const { studentUid } = req.params;
            
            const deductions = await AutomatedDeduction.find({ student_uid: studentUid })
                .sort({ created_at: -1 })
                .lean();

            const summary = await getLoanBalanceSummary(studentUid);

            res.json({
                success: true,
                student_uid: studentUid,
                deductions,
                summary,
                deductionCount: deductions.length,
            });
        } catch (err) {
            console.error('GET /student/:studentUid error:', err);
            res.status(500).json({ error: 'Failed to fetch student deductions' });
        }
    }
);

/**
 * GET /api/automated-deductions/schedule
 * 
 * Get deduction schedule as CSV download for authenticated student
 */
router.get('/schedule', authenticate, async (req, res) => {
    try {
        const studentUid = (req as any).user.uid;
        
        // Get all deductions for this student
        const deductions = await AutomatedDeduction.find({ student_uid: studentUid })
            .sort({ created_at: 1 })
            .lean();

        if (deductions.length === 0) {
            return res.status(404).json({ error: 'No deduction schedule found' });
        }

        // Generate CSV content
        let csv = 'Date,Loan ID,Semester,Trigger,Amount Deducted,Outstanding Before,Outstanding After,Payment Reference\n';
        
        deductions.forEach((d: any) => {
            const date = new Date(d.created_at).toLocaleDateString('en-US');
            const trigger = d.trigger || 'N/A';
            const semester = d.deduction_semester || 'N/A';
            const loanId = d.loan_id || 'N/A';
            const amount = d.amount_deducted || 0;
            const before = d.outstanding_before || 0;
            const after = d.outstanding_after || 0;
            const paymentRef = d.payment_reference || 'N/A';
            
            csv += `"${date}","${loanId}","${semester}","${trigger}",${amount},${before},${after},"${paymentRef}"\n`;
        });

        // Send as CSV file
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="deduction-schedule-${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(csv);
    } catch (err) {
        console.error('GET /schedule error:', err);
        res.status(500).json({ error: 'Failed to generate deduction schedule' });
    }
});

export default router;

