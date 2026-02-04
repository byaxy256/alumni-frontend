// src/routes/account-settings-mongo.ts
import express from 'express';
import bcrypt from 'bcrypt';
import { User } from '../models/User.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/auth/change-password
 * Change user password
 */
router.post('/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userUid = (req as any).user.uid;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const user = await User.findOne({ uid: userUid });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash and update new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('POST /change-password error:', err);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

/**
 * PUT /api/auth/preferences
 * Update user preferences (notifications, privacy)
 */
router.put('/preferences', authenticate, async (req, res) => {
  try {
    const userUid = (req as any).user.uid;
    const { notifications, privacy } = req.body;

    const user = await User.findOne({ uid: userUid });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update preferences in user meta
    if (!user.meta) {
      user.meta = {};
    }

    if (notifications) {
      user.meta.notifications = notifications;
    }

    if (privacy) {
      user.meta.privacy = privacy;
    }

    await user.save();

    res.json({ 
      message: 'Preferences updated successfully',
      meta: user.meta 
    });
  } catch (err) {
    console.error('PUT /preferences error:', err);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

/**
 * GET /api/auth/preferences
 * Get user preferences
 */
router.get('/preferences', authenticate, async (req, res) => {
  try {
    const userUid = (req as any).user.uid;

    const user = await User.findOne({ uid: userUid });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const preferences = {
      notifications: user.meta?.notifications || {
        email: true,
        push: true,
        donationUpdates: true,
        mentorshipAlerts: true
      },
      privacy: user.meta?.privacy || {
        profileVisibility: 'alumni-only',
        showEmail: false,
        showPhone: false
      }
    };

    res.json(preferences);
  } catch (err) {
    console.error('GET /preferences error:', err);
    res.status(500).json({ error: 'Failed to fetch preferences' });
  }
});

export default router;
