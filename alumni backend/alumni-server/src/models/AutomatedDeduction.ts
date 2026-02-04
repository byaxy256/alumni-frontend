// src/models/AutomatedDeduction.ts - Track all automated loan deductions
import mongoose, { Schema, Document } from 'mongoose';

export interface IAutomatedDeduction extends Document {
    student_uid: string;
    loan_id: string;
    amount: number;
    trigger: 'PAYMENT_EVENT' | 'OVERDUE_RECOVERY';
    source_semester: string; // Semester when loan was taken (e.g., "2026-EASTER")
    deduction_semester: string; // Semester when deduction occurred (e.g., "2026-ADVENT")
    payment_reference?: string; // School finance system reference
    previous_balance: number;
    new_balance: number;
    notes?: string;
    created_at: Date;
    updated_at: Date;
}

const AutomatedDeductionSchema = new Schema<IAutomatedDeduction>({
    student_uid: { type: String, required: true, index: true },
    loan_id: { type: String, required: true, index: true },
    amount: { type: Number, required: true },
    trigger: { 
        type: String, 
        enum: ['PAYMENT_EVENT', 'OVERDUE_RECOVERY'],
        required: true,
        index: true
    },
    source_semester: { type: String, required: true, index: true },
    deduction_semester: { type: String, required: true, index: true },
    payment_reference: { type: String },
    previous_balance: { type: Number, required: true },
    new_balance: { type: Number, required: true },
    notes: { type: String },
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

AutomatedDeductionSchema.index({ student_uid: 1, loan_id: 1, created_at: -1 });
AutomatedDeductionSchema.index({ trigger: 1, deduction_semester: 1 });

export const AutomatedDeduction = mongoose.model<IAutomatedDeduction>('AutomatedDeduction', AutomatedDeductionSchema);
