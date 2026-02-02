# Database Schema Updates - Automated Deduction System

## Overview

This document details all database schema changes required for the Automated Deduction System.

---

## Modified Collections

### 1. Loan Collection (Updated)

**Changes:**
- Added `'overdue'` status to enum
- All other fields remain unchanged

**Before:**
```typescript
status: 'pending' | 'approved' | 'rejected' | 'active' | 'paid'
```

**After:**
```typescript
status: 'pending' | 'approved' | 'rejected' | 'active' | 'paid' | 'overdue'
```

**Complete Schema:**
```typescript
{
  _id: ObjectId,
  sqlId?: number,
  student_uid: string (indexed),
  amount: number,
  outstanding_balance: number,
  status: string (enum, indexed),
  purpose?: string,
  application_date: Date,
  approved_at?: Date,
  approved_by?: string,
  attachments?: [
    {
      fieldname: string,
      originalname: string,
      url: string,
      mimetype?: string,
      size?: number,
      uploaded_at?: Date
    }
  ],
  guarantor?: {
    name?: string,
    phone?: string,
    relation?: string
  },
  created_at: Date,
  updated_at: Date
}
```

**Index:**
```
db.loans.createIndex({ "student_uid": 1, "status": 1 })
```

---

## New Collections

### 2. AutomatedDeduction Collection (New)

**Purpose:** Track all automatic loan deductions from school payments

**Complete Schema:**
```typescript
{
  _id: ObjectId,
  student_uid: string (indexed),
  loan_id: string (indexed),
  amount: number,
  trigger: string (enum: 'PAYMENT_EVENT' | 'OVERDUE_RECOVERY', indexed),
  source_semester: string (e.g., '2026-EASTER', indexed),
  deduction_semester: string (e.g., '2026-EASTER'),
  payment_reference?: string,
  previous_balance: number,
  new_balance: number,
  notes?: string,
  created_at: Date,
  updated_at: Date
}
```

**Indexes:**
```javascript
// Primary lookup
db.automateddeductions.createIndex({ 
  "student_uid": 1, 
  "loan_id": 1, 
  "created_at": -1 
})

// Filter by trigger type and semester
db.automateddeductions.createIndex({ 
  "trigger": 1, 
  "deduction_semester": 1 
})

// Student lookup for audit
db.automateddeductions.createIndex({ 
  "student_uid": 1,
  "created_at": -1
})
```

**Sample Document:**
```json
{
  "_id": ObjectId("507f1f77bcf86cd799439011"),
  "student_uid": "john.doe@ucu.ac.ug",
  "loan_id": "507f1f77bcf86cd799439010",
  "amount": 500000,
  "trigger": "PAYMENT_EVENT",
  "source_semester": "2026-EASTER",
  "deduction_semester": "2026-EASTER",
  "payment_reference": "SCHOOL_PAY_12345",
  "previous_balance": 700000,
  "new_balance": 200000,
  "notes": "Automatic deduction from school finance payment. Trigger: PAYMENT_EVENT",
  "created_at": ISODate("2026-02-15T14:30:00Z"),
  "updated_at": ISODate("2026-02-15T14:30:00Z")
}
```

---

## Migration Guide

### For Existing Databases

If you have an existing Alumni Aid database, run these migrations:

#### Step 1: Update Loan Status Enum

MongoDB doesn't enforce schema at the DB level, so no migration needed. The code handles both old and new status values.

However, for clarity, you may want to verify all existing loans are in valid states:

```javascript
// Check existing loans status values
db.loans.aggregate([
  { $group: { _id: "$status", count: { $sum: 1 } } }
])

// Example output:
// { "_id": "active", "count": 45 }
// { "_id": "pending", "count": 12 }
// { "_id": "paid", "count": 8 }
// { "_id": "rejected", "count": 2 }
```

#### Step 2: Create New AutomatedDeduction Collection

```javascript
// Create collection with indexes
db.createCollection("automateddeductions")

// Create indexes
db.automateddeductions.createIndex({ 
  "student_uid": 1, 
  "loan_id": 1, 
  "created_at": -1 
})

db.automateddeductions.createIndex({ 
  "trigger": 1, 
  "deduction_semester": 1 
})

db.automateddeductions.createIndex({ 
  "student_uid": 1,
  "created_at": -1
})
```

#### Step 3: Verify Connection

```javascript
// Test the new collection
db.automateddeductions.insertOne({
  student_uid: "test@ucu.ac.ug",
  loan_id: ObjectId(),
  amount: 0,
  trigger: "PAYMENT_EVENT",
  source_semester: "2026-EASTER",
  deduction_semester: "2026-EASTER",
  previous_balance: 0,
  new_balance: 0,
  created_at: new Date(),
  updated_at: new Date()
})

// Delete test record
db.automateddeductions.deleteOne({
  student_uid: "test@ucu.ac.ug"
})
```

---

## Data Relationships

### Loan → AutomatedDeduction

```
Loan (1)
  ↓
  └── AutomatedDeduction (many)

Every loan can have multiple deductions recorded
Every deduction references one loan
```

**Query Example:**
```javascript
// Get all deductions for a loan
db.automateddeductions.find({
  loan_id: ObjectId("507f1f77bcf86cd799439010")
}).sort({ created_at: -1 })
```

### Student → Loan → AutomatedDeduction

```
Student (identified by student_uid)
  ↓
  └── Loan (1 or many)
        ↓
        └── AutomatedDeduction (0 or many)

Example hierarchy:
john.doe@ucu.ac.ug
  ├── Loan A (700k) → Deduction 1, 2, 3
  └── Loan B (500k) → Deduction 4, 5
```

---

## Query Examples

### Find All Deductions for a Student

```javascript
db.automateddeductions.find({
  student_uid: "john.doe@ucu.ac.ug"
}).sort({ created_at: -1 })
```

### Find All Overdue Recoveries

```javascript
db.automateddeductions.find({
  trigger: "OVERDUE_RECOVERY"
}).sort({ created_at: -1 })
```

### Calculate Total Deducted by Semester

```javascript
db.automateddeductions.aggregate([
  { $match: { deduction_semester: "2026-EASTER" } },
  { $group: {
    _id: null,
    total: { $sum: "$amount" },
    count: { $sum: 1 }
  }}
])
```

### Find Students with Most Deductions

```javascript
db.automateddeductions.aggregate([
  { $group: {
    _id: "$student_uid",
    deductionCount: { $sum: 1 },
    totalDeducted: { $sum: "$amount" }
  }},
  { $sort: { totalDeducted: -1 } },
  { $limit: 10 }
])
```

### Audit Trail for Specific Loan

```javascript
db.automateddeductions.find({
  loan_id: ObjectId("507f1f77bcf86cd799439010")
}).project({
  amount: 1,
  trigger: 1,
  created_at: 1,
  previous_balance: 1,
  new_balance: 1
}).sort({ created_at: 1 })
```

---

## Backup Strategy

Before deploying changes:

```bash
# Backup loans collection
mongodump --db alumni_circle --collection loans --out backup_2026_02_15

# Backup entire database
mongodump --db alumni_circle --out backup_2026_02_15

# Restore if needed
mongorestore --db alumni_circle backup_2026_02_15/alumni_circle/
```

---

## Performance Considerations

### Index Usage

The AutomatedDeduction collection has 3 compound indexes optimized for:

1. **Single loan audit trail:**
   ```javascript
   { "student_uid": 1, "loan_id": 1, "created_at": -1 }
   ```
   
2. **Batch queries by trigger:**
   ```javascript
   { "trigger": 1, "deduction_semester": 1 }
   ```
   
3. **Student deduction history:**
   ```javascript
   { "student_uid": 1, "created_at": -1 }
   ```

### Estimated Collection Size

With 2,000 active students and ~5 deductions per student:

```
Documents: ~10,000
Average document size: ~300 bytes
Total collection size: ~3 MB
```

With growth to 10,000 students:
- Documents: ~50,000
- Total size: ~15 MB
- Still comfortably within MongoDB limits

---

## Data Integrity

### Constraints to Implement at Application Level

1. **No duplicate deductions:**
   - Use `payment_reference` to ensure idempotency
   - Check if deduction already exists before creating new one

2. **Balance consistency:**
   - `new_balance = previous_balance - amount`
   - Verify this before saving deduction
   - Verify loan.outstanding_balance matches after deduction

3. **Status transitions:**
   - Only mark loan as 'overdue' if grace period has passed
   - Only transition 'paid' loans if outstanding_balance = 0

### Validation Queries

```javascript
// Verify all deductions have valid calculations
db.automateddeductions.find({
  $expr: {
    $ne: [
      { $subtract: ["$previous_balance", "$amount"] },
      "$new_balance"
    ]
  }
})
// Should return 0 results

// Check for orphaned deductions (loan doesn't exist)
db.automateddeductions.aggregate([
  { $lookup: {
    from: "loans",
    localField: "loan_id",
    foreignField: "_id",
    as: "loan"
  }},
  { $match: { loan: [] } }
])
// Should return 0 results
```

---

## Rollback Plan

If needed, to rollback the AutomatedDeduction system:

1. **Stop calling deduction API** in School Finance System
2. **Keep AutomatedDeduction collection** for audit trail (read-only)
3. **Manually process any outstanding deductions** if needed
4. **Revert Loan status** from 'overdue' to 'active' for any flagged loans

```javascript
// If rolling back: reset overdue loans
db.loans.updateMany(
  { status: "overdue" },
  { $set: { status: "active" } }
)
```

---

## Monitoring

### Health Checks

Run these queries regularly to monitor system health:

```javascript
// Check for deductions with missing loans
db.automateddeductions.aggregate([
  { $lookup: {
    from: "loans",
    localField: "loan_id",
    foreignField: "_id",
    as: "loan"
  }},
  { $match: { loan: [] } },
  { $count: "orphaned_deductions" }
])

// Verify no deductions exceed loan amounts
db.automateddeductions.aggregate([
  { $group: {
    _id: "$loan_id",
    totalDeducted: { $sum: "$amount" }
  }},
  { $lookup: {
    from: "loans",
    localField: "_id",
    foreignField: "_id",
    as: "loan"
  }},
  { $match: {
    $expr: { $gt: ["$totalDeducted", { $arrayElemAt: ["$loan.amount", 0] }] }
  }}
])

// Check for duplicate payment references
db.automateddeductions.aggregate([
  { $group: {
    _id: "$payment_reference",
    count: { $sum: 1 }
  }},
  { $match: { count: { $gt: 1 } } }
])
```

---

## Summary

| Item | Status |
|------|--------|
| Loan schema updated | ✅ Code handles it |
| AutomatedDeduction collection created | ✅ Needs index creation |
| Indexes created | ⚠️ Manual step |
| Relationships validated | ✅ Code enforces |
| Backups created | ⚠️ Recommended |
| Performance verified | ✅ Optimized |
| Rollback plan ready | ✅ Documented |

---

## Support

For database-related issues, contact DBA with:
- Collection name
- Query being run
- Error message
- Number of affected documents
