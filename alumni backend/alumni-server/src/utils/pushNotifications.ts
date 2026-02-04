// src/utils/pushNotifications.ts - Push notification helper using Firebase Cloud Messaging
import admin from '../firebase.js';
import { PushToken } from '../models/PushToken.js';

interface PushNotificationPayload {
  title: string;
  body: string;
  targetPath?: string;
  data?: Record<string, string>;
}

/**
 * Send a push notification to a specific user via their registered FCM tokens
 */
export async function sendPushToUser(
  userUid: string,
  payload: PushNotificationPayload
): Promise<void> {
  try {
    // Get all active tokens for this user
    const tokens = await PushToken.find({ user_uid: userUid }).lean();
    
    if (!tokens || tokens.length === 0) {
      console.log(`No push tokens found for user ${userUid}`);
      return;
    }

    const { title, body, targetPath = '/', data = {} } = payload;

    // Build FCM message payload
    const messagePayload: admin.messaging.MulticastMessage = {
      tokens: tokens.map(t => t.token),
      data: {
        title,
        body,
        targetPath,
        ...data,
      },
      notification: {
        title,
        body,
      },
      webpush: {
        fcmOptions: {
          link: targetPath,
        },
      },
    };

    const response = await admin.messaging().sendEachForMulticast(messagePayload);
    
    console.log(`Push sent to ${userUid}: ${response.successCount} succeeded, ${response.failureCount} failed`);

    // Remove invalid tokens
    if (response.failureCount > 0) {
      const invalidTokens: string[] = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const errorCode = (resp.error as any)?.code;
          if (
            errorCode === 'messaging/invalid-registration-token' ||
            errorCode === 'messaging/registration-token-not-registered'
          ) {
            invalidTokens.push(tokens[idx].token);
          }
        }
      });
      
      if (invalidTokens.length > 0) {
        await PushToken.deleteMany({ token: { $in: invalidTokens } });
        console.log(`Removed ${invalidTokens.length} invalid push tokens`);
      }
    }
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
}

/**
 * Send a push notification to a single FCM token
 */
export async function sendPush(
  token: string,
  title: string,
  body: string,
  targetPath: string = '/'
): Promise<void> {
  try {
    const message: admin.messaging.Message = {
      token,
      data: {
        title,
        body,
        targetPath,
      },
      notification: {
        title,
        body,
      },
    };

    await admin.messaging().send(message);
    console.log(`Push notification sent to token: ${token.substring(0, 20)}...`);
  } catch (error) {
    console.error('Error sending push notification:', error);
    throw error;
  }
}

/**
 * Send a push notification to all users subscribed to a topic
 */
export async function notifyTopic(
  topic: string,
  title: string,
  body: string,
  targetPath: string = '/'
): Promise<void> {
  try {
    const message: admin.messaging.Message = {
      topic,
      data: {
        title,
        body,
        targetPath,
      },
      notification: {
        title,
        body,
      },
      webpush: {
        fcmOptions: {
          link: targetPath,
        },
      },
    };

    const response = await admin.messaging().send(message);
    console.log(`Push notification sent to topic '${topic}': ${response}`);
  } catch (error) {
    console.error(`Error sending push notification to topic '${topic}':`, error);
  }
}
