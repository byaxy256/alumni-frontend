// src/models/AuditLog.ts - Audit log schema for MongoDB
import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
    timestamp: Date;
    user_uid: string;
    user_email?: string;
    user_role?: string;
    action: string;
    details: string;
    ip_address?: string;
    metadata?: Record<string, any>;
    created_at: Date;
}

const AuditLogSchema = new Schema<IAuditLog>({
    timestamp: { type: Date, default: Date.now, index: true },
    user_uid: { type: String, required: true, index: true },
    user_email: { type: String },
    user_role: { type: String },
    action: { type: String, required: true, index: true },
    details: { type: String, required: true },
    ip_address: { type: String },
    metadata: { type: Schema.Types.Mixed },
}, {
    timestamps: { createdAt: 'created_at', updatedAt: false }
});

// Indexes for efficient querying
AuditLogSchema.index({ timestamp: -1 });
AuditLogSchema.index({ action: 1, timestamp: -1 });
AuditLogSchema.index({ user_uid: 1, timestamp: -1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
