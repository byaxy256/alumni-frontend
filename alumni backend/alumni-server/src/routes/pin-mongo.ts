// src/routes/pin-mongo.ts
import express from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/pin/set
 * Set or update payment PIN
 */
router.post('/set', authenticate, async (req, res) => {
  try {
    const { pin, security_question, security_answer } = req.body;
    const userUid = (req as any).user.uid;

    if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      return res.status(400).json({ error: 'PIN must be exactly 4 digits' });
    }

    if (!security_question || !security_answer) {
      return res.status(400).json({ error: 'Security question and answer are required' });
    }

    const user = await User.findOne({ uid: userUid });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Hash PIN and security answer
    const hashedPin = await bcrypt.hash(pin, 10);
    const hashedAnswer = await bcrypt.hash(security_answer.toLowerCase().trim(), 10);

    user.payment_pin = hashedPin;
    user.security_question = security_question;
    user.security_answer = hashedAnswer;
    await user.save();

    res.json({ message: 'Payment PIN set successfully' });
  } catch (err) {
    console.error('POST /pin/set error:', err);
    res.status(500).json({ error: 'Failed to set PIN' });
  }
});

/**
 * POST /api/pin/verify
 * Verify payment PIN
 */
router.post('/verify', authenticate, async (req, res) => {
  try {
    const { pin } = req.body;
    const userUid = (req as any).user.uid;

    if (!pin || pin.length !== 4) {
      return res.status(400).json({ error: 'Invalid PIN format' });
    }

    const user = await User.findOne({ uid: userUid });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.payment_pin) {
      return res.status(400).json({ error: 'No PIN set. Please set a PIN first.' });
    }

    const isValid = await bcrypt.compare(pin, user.payment_pin);
    
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid PIN' });
    }

    res.json({ message: 'PIN verified successfully' });
  } catch (err) {
    console.error('POST /pin/verify error:', err);
    res.status(500).json({ error: 'Failed to verify PIN' });
  }
});

/**
 * GET /api/pin/status
 * Check if user has set a PIN
 */
router.get('/status', authenticate, async (req, res) => {
  try {
    const userUid = (req as any).user.uid;

    const user = await User.findOne({ uid: userUid }).select('payment_pin security_question');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      hasPin: !!user.payment_pin,
      hasSecurityQuestion: !!user.security_question,
      security_question: user.security_question || null
    });
  } catch (err) {
    console.error('GET /pin/status error:', err);
    res.status(500).json({ error: 'Failed to check PIN status' });
  }
});

/**
 * POST /api/pin/reset
 * Reset PIN using security question
 */
router.post('/reset', authenticate, async (req, res) => {
  try {
    const { security_answer, new_pin } = req.body;
    const userUid = (req as any).user.uid;

    if (!security_answer) {
      return res.status(400).json({ error: 'Security answer is required' });
    }

    if (!new_pin || new_pin.length !== 4 || !/^\d{4}$/.test(new_pin)) {
      return res.status(400).json({ error: 'New PIN must be exactly 4 digits' });
    }

    const user = await User.findOne({ uid: userUid });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.security_answer) {
      return res.status(400).json({ error: 'No security question set' });
    }

    // Verify security answer
    const isAnswerValid = await bcrypt.compare(security_answer.toLowerCase().trim(), user.security_answer);
    if (!isAnswerValid) {
      return res.status(401).json({ error: 'Incorrect security answer' });
    }

    // Set new PIN
    const hashedPin = await bcrypt.hash(new_pin, 10);
    user.payment_pin = hashedPin;
    await user.save();

    res.json({ message: 'PIN reset successfully' });
  } catch (err) {
    console.error('POST /pin/reset error:', err);
    res.status(500).json({ error: 'Failed to reset PIN' });
  }
});

export default router;
