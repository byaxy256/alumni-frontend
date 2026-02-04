// src/services/automatedDeductionService.ts - Handle loan deductions and grace period logic
import { Loan } from '../models/Loan.js';
import { AutomatedDeduction } from '../models/AutomatedDeduction.js';
import { User } from '../models/User.js';
import { Notification } from '../models/Notification.js';
import { 
    getSemesterIdFromDate, 
    getNextSemester, 
    getSemesterById, 
    isLoanOverdue,
    getGracePeriodEndDate 
} from '../config/semesterCalendar.js';

/**
 * Process automatic deduction when student makes a payment to school finance
 * 
 * @param studentUid - Student's UID
 * @param paymentAmount - Amount paid to school finance
 * @param paymentReference - Optional reference from school finance system
 * @returns Object with deduction details
 */
export async function processPaymentDeduction(
    studentUid: string, 
    paymentAmount: number,
    paymentReference?: string
) {
    try {
        // Find active/pending loans for this student
        const loans = await Loan.find({
            student_uid: studentUid,
            status: { $in: ['active', 'pending', 'approved'] },
            outstanding_balance: { $gt: 0 }
        }).sort({ created_at: 1 }); // Process oldest loans first

        if (loans.length === 0) {
            return { success: false, message: 'No active loans found', deducted: 0 };
        }

        let remainingDeduction = paymentAmount;
        const deductions = [];

        for (const loan of loans) {
            if (remainingDeduction <= 0) break;

            const deductionAmount = Math.min(remainingDeduction, loan.outstanding_balance);
            const previousBalance = loan.outstanding_balance;
            const newBalance = previousBalance - deductionAmount;

            // Determine if this is normal payment or overdue recovery
            const isOverdue = isLoanOverdue(loan.application_date);
            const trigger = isOverdue ? 'OVERDUE_RECOVERY' : 'PAYMENT_EVENT';

            // Get semester info
            const loanSemester = getSemesterIdFromDate(loan.application_date);
            const currentSemester = getSemesterIdFromDate(new Date());

            // Update loan balance
            loan.outstanding_balance = newBalance;

            // Update loan status
            if (newBalance === 0) {
                loan.status = 'paid';
            } else if (loan.status === 'pending' || loan.status === 'approved') {
                loan.status = 'active';
            }

            await loan.save();

            // Record the deduction
            const deduction = await AutomatedDeduction.create({
                student_uid: studentUid,
                loan_id: loan._id.toString(),
                amount: deductionAmount,
                trigger,
                source_semester: loanSemester || 'UNKNOWN',
                deduction_semester: currentSemester || 'UNKNOWN',
                payment_reference: paymentReference,
                previous_balance: previousBalance,
                new_balance: newBalance,
                notes: `Automatic deduction from school finance payment. Trigger: ${trigger}`,
            });

            deductions.push({
                loanId: loan._id.toString(),
                amount: deductionAmount,
                previousBalance,
                newBalance,
                deductionId: deduction._id.toString(),
            });

            remainingDeduction -= deductionAmount;

            // Send notification to student
            await sendDeductionNotification(studentUid, deductionAmount, newBalance, trigger);
        }

        return {
            success: true,
            totalDeducted: paymentAmount - remainingDeduction,
            deductions,
            message: `Deducted UGX ${(paymentAmount - remainingDeduction).toLocaleString()} from loans`,
        };
    } catch (error) {
        console.error('Error processing payment deduction:', error);
        return { success: false, message: 'Error processing deduction', error };
    }
}

/**
 * Mark loans as overdue and block student from new loans/benefits
 */
export async function markLoanAsOverdue(loanId: string, studentUid: string) {
    try {
        const loan = await Loan.findById(loanId);
        if (!loan) return;

        if (loan.outstanding_balance > 0) {
            loan.status = 'overdue';
            await loan.save();

            // Notify student and guarantor
            await Notification.create({
                target_uid: studentUid,
                title: 'Loan Overdue - Action Required',
                message: `Your loan of UGX ${loan.outstanding_balance.toLocaleString()} is now overdue. Please make payment immediately to avoid further penalties.`,
                read: false,
            });

            if (loan.guarantor?.phone) {
                // Queue notification to guarantor (via SMS/email if configured)
                console.log(`Guarantor notification: ${loan.guarantor.name} - Loan overdue for ${studentUid}`);
            }
        }
    } catch (error) {
        console.error('Error marking loan as overdue:', error);
    }
}

/**
 * Check if student is blocked from new loans due to overdue balance
 */
export async function isStudentBlockedFromNewLoans(studentUid: string): Promise<boolean> {
    try {
        const overdueLoans = await Loan.findOne({
            student_uid: studentUid,
            status: 'overdue',
            outstanding_balance: { $gt: 0 }
        });

        return !!overdueLoans;
    } catch (error) {
        console.error('Error checking student block status:', error);
        return false;
    }
}

/**
 * Get loan balance summary for student
 */
export async function getLoanBalanceSummary(studentUid: string) {
    try {
        const loans = await Loan.find({ student_uid: studentUid }).lean();

        const summary = {
            totalBorrowed: 0,
            totalOutstanding: 0,
            totalPaid: 0,
            activeLoans: 0,
            overdueLoans: 0,
            paidLoans: 0,
            loans: [] as any[],
            isBlocked: false,
        };

        for (const loan of loans) {
            const amount = loan.amount || 0;
            const outstanding = loan.outstanding_balance || 0;
            const paid = amount - outstanding;

            summary.totalBorrowed += amount;
            summary.totalOutstanding += outstanding;
            summary.totalPaid += paid;

            if (loan.status === 'paid') {
                summary.paidLoans++;
            } else if (loan.status === 'overdue') {
                summary.overdueLoans++;
                summary.isBlocked = true;
            } else if (loan.status === 'active' || loan.status === 'approved') {
                summary.activeLoans++;
            }

            const gracePeriodEnd = getGracePeriodEndDate(loan.application_date);
            const isOverdue = isLoanOverdue(loan.application_date);

            summary.loans.push({
                id: loan._id.toString(),
                amount,
                outstanding,
                paid,
                status: loan.status,
                isOverdue,
                gracePeriodEnd,
                appliedDate: loan.application_date,
            });
        }

        return summary;
    } catch (error) {
        console.error('Error getting loan balance summary:', error);
        return null;
    }
}

/**
 * Get deduction history for a loan
 */
export async function getLoanDeductionHistory(loanId: string) {
    try {
        return await AutomatedDeduction.find({ loan_id: loanId })
            .sort({ created_at: -1 })
            .lean();
    } catch (error) {
        console.error('Error getting deduction history:', error);
        return [];
    }
}

/**
 * Send notification to student about deduction
 */
async function sendDeductionNotification(
    studentUid: string, 
    deductionAmount: number, 
    newBalance: number,
    trigger: 'PAYMENT_EVENT' | 'OVERDUE_RECOVERY'
) {
    try {
        const triggerLabel = trigger === 'OVERDUE_RECOVERY' ? 'Overdue Recovery' : 'Payment';
        
        await Notification.create({
            target_uid: studentUid,
            title: `${triggerLabel} Applied to Your Loan`,
            message: `UGX ${deductionAmount.toLocaleString()} has been deducted from your school payment and applied to your Alumni Aid loan. Your remaining balance is UGX ${newBalance.toLocaleString()}.`,
            read: false,
        });
    } catch (error) {
        console.error('Error sending deduction notification:', error);
    }
}

/**
 * Batch process overdue loans at semester start
 * Called via cron job or admin endpoint
 */
export async function processOverdueLoans() {
    try {
        // Find all loans that are now overdue
        const overdueLoans = await Loan.find({
            status: { $in: ['active', 'approved', 'pending'] },
            outstanding_balance: { $gt: 0 }
        });

        let markedOverdue = 0;

        for (const loan of overdueLoans) {
            if (isLoanOverdue(loan.application_date)) {
                await markLoanAsOverdue(loan._id.toString(), loan.student_uid);
                markedOverdue++;
            }
        }

        return {
            success: true,
            message: `Marked ${markedOverdue} loans as overdue`,
            count: markedOverdue,
        };
    } catch (error) {
        console.error('Error in batch overdue processing:', error);
        return { success: false, message: 'Error processing overdue loans', error };
    }
}
