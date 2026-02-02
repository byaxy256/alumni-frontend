# Access Number Auto-Population & Deduction Schedule Download

## Overview
This implementation adds automatic access number population throughout the signup and loan application flow, and enables students to download their deduction schedule as a CSV file.

## Changes Made

### Frontend Changes

#### 1. **SignUp.tsx** - Auto-capture access number
- Added `accessNumber` field to form state
- Made field required for student registrations with validation for format `[AB]\d{5}` (e.g., A12345, B67890)
- Input converts to uppercase automatically and limits to 6 characters
- Includes helpful format hint: "Letter (A/B) + 5 digits"
- Stores in user's `meta.accessNumber` on successful registration
- **File**: `/Alumni frontend/src/components/SignUp.tsx`
- **Changes**: 
  - Line 1: Added `useEffect` import
  - Lines 43-49: Added `accessNumber: ''` to form state
  - Lines 130-136: Added validation check for access number
  - Lines 253-260: Added field to signup payload meta object
  - Lines 325-336: Added UI input field with uppercase handler, maxLength, and format hint

#### 2. **ApplyLoanSupport.tsx** - Auto-populate access number
- Added `useEffect` hook to auto-populate access number from `user.meta.accessNumber`
- Field pre-fills if user already has access number stored from signup
- Student can override if needed, but field is required
- Includes same validation as SignUp (format check: `[AB]\d{5}`)
- **File**: `/Alumni frontend/src/components/student/ApplyLoanSupport.tsx`
- **Changes**:
  - Line 1: Added `useEffect` to imports and added `Download` icon
  - Lines 82-88: Added `useEffect` hook to populate access number from user.meta
  - Existing validation already checks format (was already implemented)

#### 3. **LoanBalanceSummary.tsx** - Deduction schedule download
- Added download button below "Next CHOP deduction" section for each loan
- Button fetches CSV file from `/api/automated-deductions/schedule` endpoint
- Shows loading state while downloading
- Updated grace period alert message to "Next CHOP deduction:" for clarity
- Includes toast notifications for success/error feedback
- **File**: `/Alumni frontend/src/components/student/LoanBalanceSummary.tsx`
- **Changes**:
  - Line 1: Added `Button` import and `Download` icon
  - Line 8: Added `toast` import from 'sonner'
  - Line 34: Added `downloadingSchedule` state
  - Lines 54-77: Added `downloadDeductionSchedule()` async function
  - Lines 196-199: Updated grace period label text
  - Lines 200-209: Added download button with loading state
  - Button placed after individual loan details, centered, with download icon

### Backend Changes

#### **automated-deductions.ts** - Deduction schedule endpoint
- Added new `GET /api/automated-deductions/schedule` endpoint
- Requires authentication (JWT token)
- Generates CSV report of all deductions for authenticated student
- CSV includes columns:
  - **Date**: When deduction occurred
  - **Loan ID**: Associated loan ID
  - **Semester**: Which semester deduction was from
  - **Trigger**: What triggered the deduction (payment, grace period end, etc.)
  - **Amount Deducted**: Amount deducted in this transaction
  - **Outstanding Before**: Balance before deduction
  - **Outstanding After**: Balance after deduction
  - **Payment Reference**: Reference ID for the payment
- File automatically named with current date: `deduction-schedule-YYYY-MM-DD.csv`
- Returns HTTP 404 if student has no deductions
- **File**: `/alumni backend/alumni-server/src/routes/automated-deductions.ts`
- **Changes**: Added 37 lines (lines 265-301) with new schedule endpoint

## Data Flow

### 1. Signup Flow
```
Student Registration
  ↓
SignUp Component captures access number
  ↓
Validation: must match [AB]\d{5} format
  ↓
Stored in user.meta.accessNumber
  ↓
Auto-populated in loan forms via ApplyLoanSupport useEffect
```

### 2. Deduction Schedule Download
```
Student views LoanBalanceSummary
  ↓
Clicks "Download Deduction Schedule" button
  ↓
Frontend calls GET /api/automated-deductions/schedule
  ↓
Backend queries AutomatedDeduction collection for student
  ↓
Generates CSV with all deductions
  ↓
Sends as attachment with timestamp filename
  ↓
Browser downloads: deduction-schedule-2026-02-02.csv
```

## User Benefits

1. **One-time entry**: Access number entered at signup, auto-populated elsewhere
2. **Clear format guidance**: Format hint helps users enter correct access number
3. **Easy deduction tracking**: Download schedule to view all loan deductions
4. **Clear timeline**: "Next CHOP deduction" label shows when next deduction happens
5. **Compliance**: CSV format useful for records, audits, and personal financial management

## Technical Details

### Access Number Format
- **Pattern**: `[AB]\d{5}` (letter A or B, followed by 5 digits)
- **Examples**: A12345, B67890, A00001
- **Storage**: `user.meta.accessNumber` (string)
- **Validation**: Regex check in both frontend and backend (ApplyLoanSupport)

### Deduction Schedule CSV
- **Encoding**: UTF-8, RFC 4180 compliant
- **Headers**: Date, Loan ID, Semester, Trigger, Amount Deducted, Outstanding Before, Outstanding After, Payment Reference
- **Date Format**: MM/DD/YYYY (browser locale)
- **Currency**: UGX (plain numbers, no formatting)
- **Null handling**: 'N/A' for missing values

### API Endpoint
- **Route**: `GET /api/authenticated-deductions/schedule`
- **Authentication**: Required (Bearer token)
- **Authorization**: Student sees only their own deductions
- **Response Type**: `text/csv` with attachment header
- **Error Responses**:
  - 401: Not authenticated
  - 404: No deductions found for student
  - 500: Server error

## Testing Checklist

- [ ] Student can register and enter access number in SignUp
- [ ] Access number auto-populates in ApplyLoanSupport form
- [ ] Access number displays with uppercase enforcement
- [ ] Access number validation prevents invalid formats
- [ ] Download button appears in LoanBalanceSummary
- [ ] CSV downloads with correct filename and date
- [ ] CSV has correct columns and data
- [ ] Error toast shows if no deductions exist
- [ ] Access number persists in user.meta after reload
- [ ] ApplyLoanSupport can override auto-populated access number if needed

## Deployment Notes

1. **No database migrations needed**: Uses existing `user.meta` field for storage
2. **No new collections**: Uses existing `AutomatedDeduction` collection
3. **Backward compatible**: Existing users can continue without access number
4. **No environment variables**: No new config required
5. **Frontend build**: Successfully compiles with all changes
6. **Backend build**: TypeScript compiles without errors

## Git Commits

**Frontend Commit**: `40e59fbd`
```
feat: add access number auto-population and deduction schedule download
- Auto-populate access number field in SignUp from user.meta
- Auto-populate access number in ApplyLoanSupport when user exists
- Add Download Deduction Schedule button to LoanBalanceSummary
- Update grace period label to 'Next CHOP deduction' for clarity
- Add CSV export support for deduction history
```

**Backend Commit**: `04c383d`
```
feat: add deduction schedule download endpoint
- Add GET /api/automated-deductions/schedule endpoint
- Generate CSV file with deduction history
- Include columns: Date, Loan ID, Semester, Trigger, Amount, Outstanding Before/After
- Sends file as attachment with timestamp in filename
- Requires authentication
```

## Next Steps (Optional)

1. **PDF Export**: Add PDF export option alongside CSV
2. **Email Schedule**: Option to email deduction schedule monthly
3. **Balance Alerts**: Email when balance drops below threshold
4. **Custom Columns**: Allow students to customize CSV columns
5. **Bulk Download**: Admin ability to download all student schedules
