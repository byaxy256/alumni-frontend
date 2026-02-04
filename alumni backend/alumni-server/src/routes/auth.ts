// src/routes/auth.ts
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { User } from '../models/User.js';
import { logAudit, AuditActions } from '../utils/auditLogger.js';

dotenv.config();
const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';

console.log('=== AUTH ROUTE INIT ===');
console.log('JWT_SECRET env var exists:', !!process.env.JWT_SECRET);
console.log('JWT_SECRET value:', process.env.JWT_SECRET ? `${process.env.JWT_SECRET.substring(0, 10)}...` : 'UNDEFINED - USING FALLBACK');
console.log('Actual secret being used:', JWT_SECRET === process.env.JWT_SECRET ? 'FROM ENVIRONMENT' : 'FALLBACK (change_this_secret)');
console.log('All env vars keys:', Object.keys(process.env).filter(k => k.includes('JWT') || k.includes('SECRET')));
console.log('========================');

const genToken = (payload: object) => jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

// --- REGISTER ---
router.post('/register', async (req, res) => {
  try {
    const { full_name, email, phone, password, role, meta } = req.body;
    if (!email || !password || !role) {
      return res.status(400).json({ error: 'Email, password, and role are required' });
    }

    // Block self-registration of privileged roles unless an admin secret is provided
    if (role === 'admin' || role === 'alumni_office') {
      const secretFromHeader = (req.headers['x-admin-secret'] as string | undefined) || '';
      const secretFromBody = (req.body?.adminSecret as string | undefined) || '';
      const provided = (secretFromHeader || secretFromBody).trim();
      const expected = (process.env.ADMIN_REGISTRATION_SECRET || '').trim();

      if (!expected || provided !== expected) {
        return res.status(403).json({ error: 'Admin/alumni office registration is not allowed' });
      }
    }

    // Check if user already exists
    const existing = await User.findOne({ $or: [{ email }, { phone: phone || '' }] });
    if (existing) {
      return res.status(400).json({ error: 'Email or phone already exists' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const uid = 'u' + Date.now();

    const user = await User.create({
      uid,
      full_name: full_name || '',
      email,
      phone: phone || '',
      password: hashed,
      role,
      meta: meta || {},
      last_login: new Date()
    });

    const token = genToken({ id: user._id.toString(), role: user.role, uid: user.uid, email: user.email });

    // Log audit trail
    await logAudit({
      userUid: user.uid,
      userEmail: user.email,
      userRole: user.role,
      action: AuditActions.REGISTER,
      details: `New ${user.role} account registered: ${user.full_name}`,
      ipAddress: req.ip || req.headers['x-forwarded-for'] as string || 'unknown'
    });

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id.toString(),
        uid: user.uid,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        meta: user.meta || {},
        last_login: user.last_login
      }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// --- LOGIN ---
router.post('/login', async (req, res) => {
  try {
    console.log('Incoming /auth/login body:', req.body);
    // support both frontends that send { email, phone, password } or { emailOrPhone, password } or { credential, password }
    const { email, phone, emailOrPhone, credential, password } = req.body;
    const cred = (credential || emailOrPhone || email || phone || '').trim();
    console.log('Parsed credential for login:', cred ? cred : '(empty)');

    if (!cred || !password) return res.status(400).json({ error: 'Missing credentials' });

    const user = await User.findOne({ $or: [{ email: cred }, { phone: cred }] });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    // Block alumni office access until approved and not suspended
    if (user.role === 'alumni_office') {
      if (user.meta?.approved !== true) {
        return res.status(403).json({ error: 'Alumni office account not approved yet' });
      }
      if (user.meta?.suspended === true) {
        return res.status(403).json({ error: 'Alumni office account is suspended' });
      }
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: 'Invalid credentials' });

    const token = genToken({ id: user._id.toString(), role: user.role, uid: user.uid, email: user.email });

    // Track last login timestamp
    user.last_login = new Date();
    await user.save();

    // Log audit trail
    await logAudit({
      userUid: user.uid,
      userEmail: user.email,
      userRole: user.role,
      action: AuditActions.LOGIN,
      details: `User logged in: ${user.full_name} (${user.role})`,
      ipAddress: req.ip || req.headers['x-forwarded-for'] as string || 'unknown'
    });

    res.json({
      success: true,
      token,
      user: {
        id: user._id.toString(),
        uid: user.uid,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        meta: user.meta || {},
        last_login: user.last_login
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// --- GET CURRENT USER ---
router.get('/me', async (req, res) => {
  try {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ error: 'No token' });
    const token = auth.replace('Bearer ', '');
    let payload: any;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch (err: any) {
      if (err?.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired' });
      }
      throw err;
    }

    if (!payload?.id) return res.status(401).json({ error: 'Invalid token payload' });

    const user = await User.findById(payload.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({
      user: {
        id: user._id.toString(),
        uid: user.uid,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        email_verified: false,
        meta: user.meta || {},
        last_login: user.last_login
      }
    });
  } catch (err) {
    console.error('GET /me error:', err);
    res.status(401).json({ error: 'Invalid token' });
  }
});

// --- GET ALL USERS (for testing) ---
router.get('/users', async (req, res) => {
  try {
    const users = await User.find()
      .select('uid full_name email phone role meta last_login created_at updated_at')
      .sort({ created_at: -1 });

    res.json(users.map(user => ({
      uid: user.uid,
      full_name: user.full_name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      meta: user.meta || {},
      last_login: user.last_login,
      created_at: user.created_at,
      updated_at: user.updated_at
    })));
  } catch (err) {
    console.error('GET /users error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/test', (req, res) => {
  console.log('🎉 /api/auth/test route was hit successfully!');
  res.send('Auth route test is working!');
});

// --- UPDATE CURRENT USER (profile save) ---
router.put('/me', async (req, res) => {
  try {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ error: 'No token' });
    const token = auth.replace('Bearer ', '');
    const payload: any = jwt.verify(token, JWT_SECRET);
    if (!payload?.id) return res.status(401).json({ error: 'Invalid token payload' });

    const { full_name, email, phone, meta, semester, program, university_id } = req.body;
    
    const updateData: any = {};
    if (full_name) updateData.full_name = full_name;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    
    // Handle meta object update
    if (meta) {
      updateData.meta = meta;
    } else {
      // Handle individual meta field updates
      if (semester !== undefined) updateData['meta.semester'] = semester;
      if (program) updateData['meta.program'] = program;
      if (university_id) updateData['meta.university_id'] = university_id;
    }

    const user = await User.findByIdAndUpdate(
      payload.id,
      { $set: updateData },
      { new: true, select: '-password' }
    );

    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({
      user: {
        id: user._id.toString(),
        uid: user.uid,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        email_verified: false,
        meta: user.meta || {}
      }
    });
  } catch (err) {
    console.error('PUT /me error:', err);
    res.status(401).json({ error: 'Invalid token or server error' });
  }
});

export default router;
