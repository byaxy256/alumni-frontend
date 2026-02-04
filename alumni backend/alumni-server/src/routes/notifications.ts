// src/routes/notifications.ts
import express from 'express';
import admin from '../firebase.js';
import { Notification } from '../models/Notification.js';
import { PushToken } from '../models/PushToken.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   GET /api/notifications/mine
 * @desc    Fetch all notifications for the currently logged-in user.
 * @access  Private (Requires authentication)
 */
router.get('/mine', authenticate, async (req, res) => {
    try {
        const userUid = (req as any).user.uid;

        if (!userUid) {
            return res.status(401).json({ error: "Unauthorized: Could not identify user from token." });
        }

        const notifications = await Notification.find({ target_uid: userUid })
            .sort({ created_at: -1 })
            .lean();

        res.json(notifications.map(n => ({ ...n, id: n._id.toString() })));

    } catch (err) {
        console.error("Fetch notifications error:", err);
        res.status(500).json({ error: "Server error while fetching notifications." });
    }
});

/**
 * @route   PATCH /api/notifications/:notificationId/read
 * @desc    Mark a single notification as read.
 * @access  Private (Requires authentication)
 */
router.patch('/:notificationId/read', authenticate, async (req, res) => {
    try {
        const userUid = (req as any).user.uid;
        const { notificationId } = req.params;

        if (!notificationId) {
            return res.status(400).json({ error: "Notification ID is required." });
        }

        const result = await Notification.findOneAndUpdate(
            { _id: notificationId, target_uid: userUid },
            { $set: { read: true } },
            { new: true }
        );

        if (!result) {
            return res.status(404).json({ error: "Notification not found or you do not have permission." });
        }

        res.status(200).json({ message: "Notification marked as read." });

    } catch (err) {
        console.error("Mark notification as read error:", err);
        res.status(500).json({ error: "Server error while updating notification." });
    }
});

/**
 * @route   PATCH /api/notifications/read-all
 * @desc    Mark all of the logged-in user's notifications as read.
 * @access  Private (Requires authentication)
 */
router.patch('/read-all', authenticate, async (req, res) => {
    try {
        const userUid = (req as any).user.uid;
        
        await Notification.updateMany(
            { target_uid: userUid, read: { $ne: true } },
            { $set: { read: true } }
        );

        res.status(200).json({ message: "All notifications marked as read." });

    } catch (err) {
        console.error("Mark all notifications as read error:", err);
        res.status(500).json({ error: "Server error while updating notifications." });
    }
});

/**
 * @route   POST /api/notifications/register-token
 * @desc    Register (or refresh) a push token for the authenticated user
 * @access  Private
 */
router.post('/register-token', authenticate, async (req, res) => {
    try {
        const userUid = (req as any).user?.uid;
        const userRole = (req as any).user?.role;
        const { token, platform = 'web' } = req.body || {};

        if (!userUid) {
            return res.status(401).json({ error: 'Unauthorized: missing user UID' });
        }

        if (!token || typeof token !== 'string') {
            return res.status(400).json({ error: 'Missing push token' });
        }

        // Auto-subscribe to topics based on role
        const topics = ['news'];
        
        if (userRole === 'student') {
            topics.push('loans', 'payments');
        } else if (userRole === 'alumni') {
            topics.push('mentors');
        } else if (userRole === 'admin') {
            topics.push('admin', 'loans', 'payments', 'mentors');
        }

        // Subscribe to FCM topics
        for (const topic of topics) {
            try {
                await admin.messaging().subscribeToTopic(token, topic);
                console.log(`Subscribed ${userUid} to topic: ${topic}`);
            } catch (error) {
                console.error(`Failed to subscribe to topic ${topic}:`, error);
            }
        }

        // Store token with topics
        await PushToken.findOneAndUpdate(
            { token },
            { token, user_uid: userUid, platform, topics },
            { upsert: true, setDefaultsOnInsert: true }
        );

        res.status(200).json({ message: 'Push token registered', topics });
    } catch (err) {
        console.error('Register push token error:', err);
        res.status(500).json({ error: 'Server error while registering push token' });
    }
});

export default router;