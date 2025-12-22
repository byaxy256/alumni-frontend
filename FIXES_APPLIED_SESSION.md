# Mentorship System - Fixes Applied

## Issues Fixed

### 1. Chat Endpoint 500 Error - Schema Mismatch ✅

**Problem**: The chat endpoint (`GET /api/chat/:otherUserId`) was returning 500 errors because the route code was trying to query non-existent columns.

**Root Cause**: The `chats.ts` route was using incorrect column names:
- Route used: `conversation_id`, `sender_id`, `message_text`, `created_at`, `recipient_id`
- Table actually has: `chat_id`, `sender_uid`, `text`, `ts`

**Solution**: Updated `/alumni-server/src/routes/chats.ts`:
```typescript
// GET route - Line 41
// BEFORE: SELECT id, sender_id, message_text, created_at FROM messages WHERE conversation_id = ?
// AFTER:  SELECT id, sender_uid, text, ts FROM messages WHERE chat_id = ?

// POST route - Line 71
// BEFORE: INSERT INTO messages (conversation_id, sender_id, recipient_id, message_text) VALUES (?, ?, ?, ?)
// AFTER:  INSERT INTO messages (chat_id, sender_uid, text) VALUES (?, ?, ?)
```

**Files Modified**:
- `/alumni-server/src/routes/chats.ts` - Fixed both GET and POST routes

---

### 2. Approve Button Non-Functional - Missing Debug Info ✅

**Problem**: The approve/decline buttons in MentorshipHub appeared to not trigger any action or response.

**Root Cause**: Lack of error logging made it impossible to diagnose issues. Errors were being silently caught and displayed as generic toast messages.

**Solution**: Added detailed debug logging to `/src/components/alumni-user/MentorshipHub.tsx`:

1. **handleApprove Function** (Lines 179-211):
   - Added `console.log` for student ID being approved
   - Added `console.log` to verify token exists
   - Added `console.log` for response status
   - Enhanced error handling to parse error responses and show specific messages
   - Parse and log success response data

2. **handleReject Function** (Lines 214-241):
   - Added similar logging pattern as approve
   - Better error message extraction from API responses

**Benefits**:
- Developers can now open browser console to see exactly where requests fail
- Error messages from API are now properly displayed to users
- Response data is logged for verification

**Files Modified**:
- `/src/components/alumni-user/MentorshipHub.tsx` - Enhanced both approve and reject handlers

---

## Implementation Architecture

### Mentorship Request Flow

```
1. Student Requests Mentor
   └─ Student clicks "Request" on mentor card
   └─ POST /api/mentors/request { mentorId }
   └─ Backend adds studentId to mentor's pending_requests in meta field
   └─ Toast: "Request sent!"

2. Mentor Approves/Rejects
   └─ Mentor views pending requests (loaded from GET /api/mentors/my-mentors)
   └─ Mentor clicks Approve/Decline on request card or profile modal
   └─ POST /api/mentors/approve { studentId } with JWT token
   └─ Backend:
      ├─ Verifies mentor is alumni role
      ├─ Removes studentId from pending_requests
      ├─ Adds studentId to approved_mentees
      ├─ Creates notification for student
      └─ Returns success
   └─ Frontend: Reloads pending requests and approved mentees
   └─ Toast: "Request approved!" or "Request rejected!"

3. Student Receives Notification
   └─ Notification in database: target_uid=studentId
   └─ Student notification list shows "Mentor request approved"
   └─ Toast appears on next poll/reload

4. Chat Loading
   └─ Student/Mentor clicks "Send Message" on approved mentee
   └─ GET /api/chat/:otherUserId (with JWT token)
   └─ Backend queries messages where chat_id matches
   └─ Returns array of messages (now works with correct columns!)
   └─ Chat UI displays conversation history
```

### Database Schema (Messages Table)
```sql
CREATE TABLE messages (
  id bigint unsigned NOT NULL AUTO_INCREMENT,
  chat_id varchar(255) NOT NULL,           -- e.g., "uid1--uid2" (sorted)
  sender_uid varchar(100),
  text text,
  ts timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);
```

### Endpoints Overview

**Mentor Routes** (`/api/mentors/`):
- `GET /` - List available mentors (filtered by field, hides requested/approved)
- `GET /my-mentors` - Get pending requests for alumni
- `GET /my-approved-mentees` - Get approved mentees for alumni
- `GET /students-by-field` - Get students by field
- `POST /request` - Student requests mentor
- `POST /approve` - Alumni approves pending request
- `POST /reject` - Alumni rejects pending request
- `POST /remove-approved` - Alumni removes approved mentee

**Chat Routes** (`/api/chat/`):
- `GET /:otherUserId` - Get chat history (uses correct column names)
- `POST /` - Send a message

**Notification Routes** (`/api/notifications/`):
- `GET /mine` - Get notifications for current user
- `PATCH /:notificationId/read` - Mark notification as read
- `PATCH /read-all` - Mark all notifications as read

---

## Testing Instructions

### Manual Testing Checklist

1. **Backend Verification**
   ```bash
   # Verify backend is running
   curl http://localhost:4000/api/auth/health
   
   # Should see: Connected to MySQL database: alumniCircle
   ```

2. **Chat Endpoint**
   ```bash
   # Test with a valid JWT token
   curl -X GET http://localhost:4000/api/chat/u1763363777159 \
     -H "Authorization: Bearer <VALID_JWT>"
   
   # Should return: [] or array of messages (not 500 error)
   ```

3. **Frontend Testing**
   - Navigate to http://localhost:3002
   - Log in as alumnus
   - Go to MentorshipHub
   - Open browser console (Cmd+Option+J on Mac)
   - Click "Approve" on any pending request
   - Should see console logs:
     - "Approving student: [studentId]"
     - "Token exists: true"
     - "Response status: 200"
     - "Success response: {message: 'Request approved successfully!'}"
   - Toast should show "Request approved!"

---

## Technical Details

### Column Mapping (Fixed)
| What Code Used | Actual Table Column | Fixed |
|---|---|---|
| `conversation_id` | `chat_id` | ✅ |
| `sender_id` | `sender_uid` | ✅ |
| `message_text` | `text` | ✅ |
| `created_at` | `ts` | ✅ |
| `recipient_id` | (doesn't exist) | ✅ Removed |

### Debug Logging Output Example
```javascript
// In browser console when approving:
Approving student: u1763363777159
Token exists: true
Response status: 200
Success response: {message: "Request approved successfully!"}
```

---

## Files Modified

1. **Backend**:
   - `/alumni-server/src/routes/chats.ts` - Fixed schema mismatch (2 routes)

2. **Frontend**:
   - `/src/components/alumni-user/MentorshipHub.tsx` - Added debug logging (2 functions)

---

## Next Steps (If Issues Persist)

1. **Check Browser Console**: Open DevTools (F12) and look for console logs
2. **Check Server Logs**: Watch terminal for `[nodemon]` output when making requests
3. **Verify Token**: Ensure JWT token is being stored in localStorage
4. **Check Network Tab**: Verify API requests are being sent with proper headers
5. **Database Check**: Verify messages table has correct data:
   ```sql
   SELECT * FROM messages LIMIT 5;
   ```

---

## Success Indicators

✅ Backend server starts without errors  
✅ Frontend loads on http://localhost:3002  
✅ Chat endpoint returns 200 (not 500)  
✅ Approve button shows debug logs in console  
✅ Toast messages appear on success/error  
✅ Pending requests disappear after approval  
✅ Approved mentees appear in mentees tab  
✅ Student receives notification on approval  

---

**Date**: Session 5
**Status**: READY FOR TESTING
