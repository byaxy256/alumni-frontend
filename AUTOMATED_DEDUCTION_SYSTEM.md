# Automated Loan Deduction System - Implementation Guide

## Overview

The Alumni Aid system now integrates **automated loan deductions** with the School Finance System. When students make payments to the school, the system automatically deducts their Alumni Aid loan balance, and overdue loans are automatically recovered when the grace period expires.

## Key Features

### 1. Real-Time Payment Deduction
When a student makes **any payment to the School Finance Office**:
- System automatically checks for active Alumni Aid loans
- Payment amount is deducted from outstanding loan balance
- Remaining balance is displayed to the student
- Student receives notification of deduction

**Example:**
```
Loan Amount: 700,000 UGX
School Payment: 500,000 UGX
→ Loan Balance becomes: 200,000 UGX
```

### 2. Semester-Based Grace Period
- Any loan taken in **Semester X** must be fully paid by the start of **Semester X+1**
- After grace period expires, loan is marked as **OVERDUE**
- Automatic deductions continue until loan is cleared

**UCU Academic Calendar:**
- **Advent Semester:** September
- **Easter Semester:** January  
- **Trinity Semester:** May

### 3. Automatic Overdue Recovery
For loans that exceed the grace period:
- System continues auto-deducting from all school payments
- No manual intervention needed
- Continues until loan balance reaches zero

### 4. Student Blocking
If a student has **overdue loans**:
- ❌ Cannot request new loans
- ❌ Cannot request student support benefits
- ⚠️ Receives notifications until debt is cleared

### 5. Complete Audit Trail
Every deduction is recorded with:
- Student ID & Loan ID
- Deduction amount
- Trigger type (PAYMENT_EVENT or OVERDUE_RECOVERY)
- Semester information
- Previous & new balance
- Timestamp

---

## API Endpoints

### For School Finance System Integration

#### 1. Process Payment Deduction
**POST** `/api/automated-deductions/process-payment`

When school receives a payment from a student, call this endpoint to auto-deduct from loan.

**Request Body:**
```json
{
  "student_uid": "student_uid_here",
  "payment_amount": 500000,
  "payment_reference": "SCHOOL_TXN_12345"
}
```

**Response:**
```json
{
  "success": true,
  "totalDeducted": 500000,
  "deductions": [
    {
      "loanId": "loan_id_1",
      "amount": 500000,
      "previousBalance": 700000,
      "newBalance": 200000,
      "deductionId": "deduction_id_1"
    }
  ],
  "message": "Deducted UGX 500,000 from loans"
}
```

#### 2. Check Student Block Status
**GET** `/api/automated-deductions/check-block/:studentUid`

Check if student is blocked from new loans due to overdue balance.

**Response:**
```json
{
  "student_uid": "student_uid",
  "isBlocked": true,
  "message": "Student has overdue loans and cannot request new loans"
}
```

---

### For Student Dashboard

#### 3. Get Loan Balance Summary
**GET** `/api/automated-deductions/balance-summary`

(Requires authentication) Get complete balance summary for logged-in student.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalBorrowed": 1500000,
    "totalOutstanding": 500000,
    "totalPaid": 1000000,
    "activeLoans": 1,
    "overdueLoans": 0,
    "paidLoans": 2,
    "isBlocked": false,
    "loans": [
      {
        "id": "loan_id_1",
        "amount": 700000,
        "outstanding": 200000,
        "paid": 500000,
        "status": "active",
        "isOverdue": false,
        "gracePeriodEnd": "2026-05-11T00:00:00Z",
        "appliedDate": "2026-01-12T10:30:00Z"
      }
    ]
  }
}
```

#### 4. Get Deduction History for a Loan
**GET** `/api/automated-deductions/loan/:loanId/deductions`

Get complete deduction history for a specific loan.

**Response:**
```json
{
  "success": true,
  "loanId": "loan_id_1",
  "deductions": [
    {
      "_id": "deduction_id_1",
      "amount": 500000,
      "trigger": "PAYMENT_EVENT",
      "source_semester": "2026-EASTER",
      "deduction_semester": "2026-EASTER",
      "previous_balance": 700000,
      "new_balance": 200000,
      "created_at": "2026-02-15T14:30:00Z"
    }
  ],
  "count": 1
}
```

---

### For Admin Dashboard

#### 5. Get All Deductions (with filtering)
**GET** `/api/automated-deductions/all?student_uid=xxx&trigger=OVERDUE_RECOVERY&limit=50&skip=0`

Admin/Alumni Office only. Get all deductions with optional filters.

#### 6. Mark Loan as Overdue
**POST** `/api/automated-deductions/mark-overdue/:loanId`

Manually mark a loan as overdue (admin only).

#### 7. Batch Process Overdue Loans
**POST** `/api/automated-deductions/process-overdue-batch`

Process all loans that should be marked overdue (run at semester start). Admin only.

#### 8. Get Student Deductions
**GET** `/api/automated-deductions/student/:studentUid`

Admin only. Get all deductions and loan summary for a specific student.

#### 9. Send Overdue Notification
**POST** `/api/automated-deductions/notify-overdue/:studentUid`

Send notification to student about overdue loans (admin only).

---

## Database Schema

### AutomatedDeduction Collection
```typescript
{
  student_uid: string,           // Student UID
  loan_id: string,               // Loan ObjectId
  amount: number,                // Deduction amount
  trigger: 'PAYMENT_EVENT' | 'OVERDUE_RECOVERY',
  source_semester: string,       // Semester loan was taken (e.g., "2026-EASTER")
  deduction_semester: string,    // Semester when deduction occurred
  payment_reference?: string,    // School finance system reference
  previous_balance: number,      // Balance before deduction
  new_balance: number,           // Balance after deduction
  notes?: string,
  created_at: Date,
  updated_at: Date
}
```

### Updated Loan Model
Loan status now includes: `'overdue'`

```typescript
status: 'pending' | 'approved' | 'rejected' | 'active' | 'paid' | 'overdue'
```

---

## Implementation Workflow

### When School Finance Receives a Payment

1. **Payment Made** → Student pays 500k to school for tuition
2. **School Calls Alumni Aid API** → `POST /api/automated-deductions/process-payment`
3. **System Processes**:
   - Finds all active loans for student
   - Deducts payment from oldest loan first
   - Updates outstanding balance
   - Records deduction with audit trail
4. **Student Notified** → "500k deducted from your loan. New balance: 200k"

### When Grace Period Expires (Automatic)

1. **Semester Starts** → New semester begins (e.g., TRINITY semester)
2. **Overdue Check** → System checks if loans from previous semester are paid
3. **Mark Overdue** → If unpaid, loan marked as `'overdue'`
4. **Block Student** → Cannot request new loans
5. **Notify** → Student and guarantor receive notifications
6. **Continue Recovery** → All future school payments auto-deduct

---

## Frontend Integration

### Display Loan Balance Summary Component

Use the provided `LoanBalanceSummary` component to show:
- Total borrowed, paid, and outstanding amounts
- Payment progress bar
- Individual loan details with grace period info
- Overdue warnings
- Block status

**Usage:**
```tsx
import { LoanBalanceSummary } from '@/components/student/LoanBalanceSummary';

// In your dashboard
<LoanBalanceSummary />
```

---

## Semester Calendar Reference

### 2026 Semesters
- **EASTER:** Jan 12 - Apr 30, 2026
- **TRINITY:** May 11 - Aug 30, 2026
- **ADVENT:** Sep 7 - Dec 20, 2026

### Grace Period Examples

**Loan taken in EASTER 2026:**
- Start: Jan 12, 2026
- Grace period ends: May 11, 2026 (start of TRINITY)
- After May 11: Automatic overdue recovery begins

**Loan taken in TRINITY 2026:**
- Start: May 11, 2026
- Grace period ends: Sep 7, 2026 (start of ADVENT)
- After Sep 7: Automatic overdue recovery begins

---

## Testing Guide

### Test Case 1: Real-Time Deduction
1. Create a loan for 700k
2. Call `POST /api/automated-deductions/process-payment` with 500k
3. Verify outstanding balance is now 200k
4. Verify deduction record created with PAYMENT_EVENT trigger

### Test Case 2: Grace Period
1. Create loan in January (EASTER semester)
2. Verify gracePeriodEnd = May 11 (next semester)
3. On May 11, loan should be marked overdue
4. Verify any subsequent payments deduct with OVERDUE_RECOVERY trigger

### Test Case 3: Student Blocking
1. Create overdue loan for student
2. Call `GET /api/automated-deductions/check-block/:studentUid`
3. Verify `isBlocked = true`
4. Try to create new loan with `POST /api/loans`
5. Should return 403 with message about overdue loans

### Test Case 4: Multiple Loans
1. Create loan 1: 500k (oldest)
2. Create loan 2: 300k (newer)
3. Payment 400k received
4. Verify: Loan 1 deducted 400k (100k remaining), Loan 2 untouched
5. Payment 200k received
6. Verify: Loan 1 fully paid, Loan 2 deducted 100k (200k remaining)

---

## Admin Actions

### Semester Start (Run at beginning of each semester)

```bash
# Mark all overdue loans
POST /api/automated-deductions/process-overdue-batch
```

### Monitor Deductions

```bash
# View all deductions
GET /api/automated-deductions/all

# View deductions for specific student
GET /api/automated-deductions/student/:studentUid

# View deductions for specific loan
GET /api/automated-deductions/loan/:loanId/deductions
```

### Manual Interventions

```bash
# Mark a loan as overdue
POST /api/automated-deductions/mark-overdue/:loanId

# Send overdue reminder
POST /api/automated-deductions/notify-overdue/:studentUid
```

---

## Guarantor Notifications

When a loan becomes overdue:
1. **Student receives:** In-app notification
2. **Guarantor receives:** SMS/Email notification (configured in system)
   - Message: "Loan for [Student Name] is overdue for UGX [Amount]"
   - Action required: Contact student to ensure payment

---

## Security Considerations

✅ **Implemented:**
- Authorization checks (only students can see their data)
- Audit trails for all deductions
- Guarantee of idempotency (same deduction not applied twice)
- Validation of payment amounts

⚠️ **Required from School Finance System:**
- Authenticate API calls (API key or OAuth)
- Use HTTPS/TLS for all communications
- Rate limiting on payment notification endpoint
- Unique payment references to prevent duplicates

---

## Future Enhancements

1. **Payment Plans:** Allow students to set up payment installments
2. **Late Fees:** Add configurable late fees for overdue loans
3. **SMS Notifications:** Automatic SMS alerts to guarantor
4. **Dashboard Analytics:** Admin view of default rates by semester
5. **Forgiveness Policy:** Configure loan forgiveness conditions
6. **Multi-Loan Prioritization:** Custom rules for which loan to pay first

---

## Support & Troubleshooting

**Issue:** Deductions not being applied
- Check that `student_uid` is correct
- Verify loan exists and is active
- Check server logs for errors

**Issue:** Student blocked but should be unblocked
- Verify all loans are fully paid (`outstanding_balance = 0`)
- Check loan status is marked as `'paid'`

**Issue:** Grace period not working
- Verify semester calendar is up-to-date
- Check `application_date` is correct on loan
- Run batch overdue processing

---

## Support Contact

For questions or issues with the automated deduction system, contact the development team with:
- Student UID
- Loan ID
- Deduction ID (if applicable)
- Error message
- Timestamp
