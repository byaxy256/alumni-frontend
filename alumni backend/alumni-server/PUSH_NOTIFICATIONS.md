# RENDER DEPLOYMENT INSTRUCTIONS

## Required Secret Files on Render:

Upload the Firebase service account JSON to Render at:
**Path**: `/etc/secrets/firebase-service-account.json`

In your Render dashboard:
1. Go to your backend service
2. Navigate to "Environment" → "Secret Files"
3. Click "Add Secret File"
4. Filename: `firebase-service-account.json`
5. File Contents: Copy the entire contents of `alumni-circle-271e9-firebase-adminsdk-fbsvc-10f6e241a0.json`

## Environment Variables Required:

Add these to your Render service's Environment tab:
- All existing MongoDB, JWT, and API keys
- Firebase variables (already in .env file)

## How Push Notifications Work:

1. **Student requests mentor**:
   - Notification + push sent to mentor's device
   - Deep-link: `/mentorship`

2. **Mentor approves request**:
   - Notification + push sent to student's device
   - Deep-link: `/mentorship`

3. **New chat message**:
   - Notification + push sent to recipient
   - Deep-link: `/mentorship` (opens chat)

4. **User clicks notification**:
   - Service worker intercepts click
   - Opens app at `targetPath`
   - If app already open, focuses existing tab and navigates

## Testing Locally:

1. Start backend: `npm run dev`
2. Start frontend: `npm run dev`
3. Open app in browser
4. Log in as student/alumni
5. Grant notification permission when prompted
6. Test mentor request or send a message
7. Notification should appear (even in background)
8. Click notification to deep-link to relevant screen
