// src/middleware/auditRequest.ts
import { logAudit } from '../utils/auditLogger.js';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function getClientIp(req: any): string {
  const xfwd = (req.headers?.['x-forwarded-for'] as string | undefined) || '';
  if (xfwd) return xfwd.split(',')[0].trim();
  return req.ip || 'unknown';
}

// Logs a "footprint" entry for authenticated, non-admin mutating requests.
export function auditRequest(req: any, res: any, next: any) {
  const method = String(req.method || '').toUpperCase();
  if (!MUTATING_METHODS.has(method)) return next();

  const user = (req as any).user;
  if (!user?.uid) return next();
  if (user?.role === 'admin') return next();

  const url = req.originalUrl || req.url || '';

  // Avoid infinite recursion / noise from audit endpoints themselves.
  if (url.includes('/api/admin/audit-logs') || url.includes('/api/admin/audit-log')) return next();

  const actionFromRoute = () => {
    // Keep this intentionally small and stable.
    if (url.includes('/api/auth/me') && method === 'PUT') return 'Profile Updated';
    if (url.includes('/api/support') && method === 'POST') return 'Support Request Submitted';
    if (url.includes('/api/loans') && method === 'POST') return 'Loan Application Submitted';
    if (url.includes('/api/donations') && method === 'POST') return 'Donation Created';
    if (url.includes('/api/payments') && method === 'POST') return 'Payment Initiated';
    if (url.includes('/api/content/news') && method === 'POST') return 'News Created';
    if (url.includes('/api/content/events') && method === 'POST') return 'Event Created';
    if (url.includes('/api/content') && (method === 'PUT' || method === 'PATCH')) return 'Content Updated';
    if (url.includes('/api/content') && method === 'DELETE') return 'Content Deleted';
    return 'API Request';
  };

  res.on('finish', () => {
    const bodyKeys = req?.body && typeof req.body === 'object' ? Object.keys(req.body).slice(0, 20) : [];
    void logAudit({
      userUid: user.uid,
      userEmail: user.email,
      userRole: user.role,
      action: actionFromRoute(),
      details: `${method} ${url} -> ${res.statusCode}`,
      ipAddress: getClientIp(req),
      metadata: {
        method,
        url,
        status: res.statusCode,
        bodyKeys,
      }
    });
  });

  next();
}
