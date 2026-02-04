// src/middleware/optionalAuth.ts
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';

// If an Authorization Bearer token is present and valid, attach decoded payload to req.user.
// Does not block requests.
export function optionalAuth(req: any, _res: any, next: any) {
  const authHeader = req.headers?.authorization as string | undefined;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : undefined;

  if (!token) return next();

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    (req as any).user = decoded;
  } catch {
    // Ignore invalid/expired tokens here; protected routes should still use authenticate.
  }

  next();
}
