// src/models/Loan.ts - Loan schema for MongoDB
import mongoose, { Schema, Document } from 'mongoose';

export interface ILoan extends Document {
    sqlId?: number; // Original MySQL ID
    student_uid: string;
    amount: number;
    outstanding_balance: number;
    status: 'pending' | 'approved' | 'rejected' | 'active' | 'paid' | 'overdue';
    purpose?: string;
    application_date: Date;
    approved_at?: Date;
    approved_by?: string;
    attachments?: {
        fieldname: string;
        originalname: string;
        url: string;
        mimetype?: string;
        size?: number;
        uploaded_at?: Date;
    }[];
    guarantor?: {
        name?: string;
        phone?: string;
        relation?: string;
    };
    created_at: Date;
    updated_at: Date;
}

const LoanSchema = new Schema<ILoan>({
    sqlId: { type: Number, index: true },
    student_uid: { type: String, required: true, index: true },
    amount: { type: Number, required: true },
    outstanding_balance: { type: Number, required: true },
    status: { 
        type: String, 
        enum: ['pending', 'approved', 'rejected', 'active', 'paid', 'overdue'],
        default: 'pending',
        index: true
    },
    purpose: { type: String },
    application_date: { type: Date, default: Date.now },
    approved_at: { type: Date },
    approved_by: { type: String },
    attachments: [{
        fieldname: { type: String },
        originalname: { type: String },
        url: { type: String },
        mimetype: { type: String },
        size: { type: Number },
        uploaded_at: { type: Date, default: Date.now }
    }],
    guarantor: {
        name: { type: String },
        phone: { type: String },
        relation: { type: String }
    },
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

LoanSchema.index({ student_uid: 1, status: 1 });

export const Loan = mongoose.model<ILoan>('Loan', LoanSchema);
