// src/utils/auditLogger.ts - Utility for logging system actions
import { AuditLog } from '../models/AuditLog.js';

interface LogParams {
  userUid: string;
  userEmail?: string;
  userRole?: string;
  action: string;
  details: string;
  ipAddress?: string;
  metadata?: Record<string, any>;
}

export async function logAudit(params: LogParams): Promise<void> {
  try {
    await AuditLog.create({
      user_uid: params.userUid,
      user_email: params.userEmail,
      user_role: params.userRole,
      action: params.action,
      details: params.details,
      ip_address: params.ipAddress,
      metadata: params.metadata || {},
      timestamp: new Date()
    });
  } catch (err) {
    console.error('Failed to create audit log:', err);
    // Don't throw - audit logging failure shouldn't break the main operation
  }
}

export const AuditActions = {
  // Auth actions
  LOGIN: 'User Login',
  LOGOUT: 'User Logout',
  REGISTER: 'User Registration',
  
  // Application actions
  APPLICATION_CREATED: 'Application Submitted',
  APPLICATION_APPROVED: 'Application Approved',
  APPLICATION_REJECTED: 'Application Rejected',
  
  // Loan actions
  LOAN_CREATED: 'Loan Application Created',
  LOAN_APPROVED: 'Loan Approved',
  LOAN_DISBURSED: 'Loan Disbursed',
  
  // Donation actions
  DONATION_CREATED: 'Donation Made',
  DONATION_CONFIRMED: 'Donation Confirmed',
  
  // Admin actions
  USER_APPROVED: 'User Verified',
  USER_REJECTED: 'User Rejected',
  USER_SUSPENDED: 'User Suspended',
  ALUMNI_OFFICE_APPROVED: 'Alumni Office Account Approved',
  ALUMNI_OFFICE_REJECTED: 'Alumni Office Account Rejected',
  
  // Config actions
  CONFIG_UPDATED: 'System Config Updated',
  
  // Disbursement actions
  DISBURSEMENT_CREATED: 'Disbursement Created',
  CHOP_DEDUCTION: 'Chop Deduction Processed',
  
  // Payment actions
  PAYMENT_INITIATED: 'Payment Initiated',
  PAYMENT_SUCCESS: 'Payment Successful',
  PAYMENT_FAILED: 'Payment Failed',

  // Generic request footprints
  API_REQUEST: 'API Request',
} as const;
