# Integrating Loan Balance Summary into Student Dashboard

This guide shows how to add the new Loan Balance Summary component to the student dashboard.

---

## Quick Integration

### Step 1: Import the Component

In your `StudentApp.tsx` or dashboard page:

```tsx
import { LoanBalanceSummary } from '@/components/student/LoanBalanceSummary';
```

### Step 2: Add to Dashboard

```tsx
export const StudentDashboard: React.FC = () => {
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold">Student Dashboard</h1>
      
      {/* Loan Balance Summary - NEW */}
      <LoanBalanceSummary />
      
      {/* Existing components... */}
      <ApplyLoanSupport />
      <StudentMentorship />
    </div>
  );
};
```

---

## Placement Options

### Option 1: Full Page Tab
Create a dedicated "My Loans" tab in the student navigation:

```tsx
// src/pages/StudentLoans.tsx
import { LoanBalanceSummary } from '@/components/student/LoanBalanceSummary';

export const StudentLoansPage: React.FC = () => {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">My Loans</h1>
      <LoanBalanceSummary />
    </div>
  );
};
```

### Option 2: Sidebar Widget
Add as a condensed widget in sidebar:

```tsx
import { LoanBalanceSummary } from '@/components/student/LoanBalanceSummary';
import { Card, CardContent } from '@/components/ui/card';

export const SidebarLoanWidget: React.FC = () => {
  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="font-bold mb-4">Quick Loan Status</h3>
        <LoanBalanceSummary />
      </CardContent>
    </Card>
  );
};
```

### Option 3: Modal Dialog
Show in a modal when student clicks "View Loans":

```tsx
import { LoanBalanceSummary } from '@/components/student/LoanBalanceSummary';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface LoanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoanBalanceModal: React.FC<LoanModalProps> = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Your Loans & Deductions</DialogTitle>
        </DialogHeader>
        <LoanBalanceSummary />
      </DialogContent>
    </Dialog>
  );
};
```

---

## Navigation Integration

### Add Menu Item

Update student navigation menu:

```tsx
// src/components/student/StudentNav.tsx
const menuItems = [
  { label: 'Dashboard', path: '/student/dashboard' },
  { label: 'Apply for Loan', path: '/student/loans/apply' },
  { label: 'My Loans', path: '/student/loans/balance' },  // NEW
  { label: 'Mentorship', path: '/student/mentors' },
  { label: 'Profile', path: '/student/profile' },
];
```

---

## Styling Customization

The component uses Tailwind CSS and can be customized:

```tsx
// Customize card styling
<LoanBalanceSummary />

// Or wrap with custom styling
<div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg">
  <LoanBalanceSummary />
</div>
```

---

## Dark Mode Support

The component includes dark mode support with Tailwind classes:

```tsx
// Automatically uses dark mode when enabled
// Classes like: dark:bg-slate-900, dark:text-white, etc.
<LoanBalanceSummary />
```

---

## Error Handling

Component handles errors gracefully:

```tsx
// Shows error alert if API fails
// Shows loading state while fetching
// Handles empty state (no loans)
// All handled internally by LoanBalanceSummary
```

---

## Refresh/Refetch Functionality

To add a refresh button:

```tsx
import { LoanBalanceSummary } from '@/components/student/LoanBalanceSummary';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useRef } from 'react';

export const LoanDashboard: React.FC = () => {
  const componentRef = useRef<any>(null);

  const handleRefresh = () => {
    // Re-fetch the data
    window.location.reload(); // Simple approach
    // Or implement internal refresh mechanism
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Loan Summary</h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
      <LoanBalanceSummary />
    </div>
  );
};
```

---

## Context Integration

To prevent redundant API calls across components:

```tsx
// src/context/LoanContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';

interface LoanSummary {
  totalBorrowed: number;
  totalOutstanding: number;
  // ... other fields
}

const LoanContext = createContext<LoanSummary | null>(null);

export const LoanProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [summary, setSummary] = useState<LoanSummary | null>(null);

  useEffect(() => {
    // Fetch once at app level
    fetch(`${API_BASE}/automated-deductions/balance-summary`)
      .then(r => r.json())
      .then(data => setSummary(data.data));
  }, []);

  return (
    <LoanContext.Provider value={summary}>
      {children}
    </LoanContext.Provider>
  );
};

export const useLoanSummary = () => {
  return useContext(LoanContext);
};
```

Usage in component:
```tsx
const summary = useLoanSummary();
if (summary?.isBlocked) {
  // Show blocking message
}
```

---

## Notification Integration

Show loan alerts in notification system:

```tsx
import { useEffect } from 'react';
import { useNotification } from '@/context/NotificationContext';

export const LoanNotificationBanner: React.FC = () => {
  const { showAlert } = useNotification();

  useEffect(() => {
    fetch(`${API_BASE}/automated-deductions/balance-summary`)
      .then(r => r.json())
      .then(data => {
        if (data.data.isBlocked) {
          showAlert({
            type: 'warning',
            title: 'Account Blocked',
            message: 'You have overdue loans. Clear them before requesting new loans.',
          });
        }
        
        if (data.data.overdueLoans > 0) {
          showAlert({
            type: 'error',
            title: 'Overdue Loans',
            message: `You have ${data.data.overdueLoans} overdue loan(s) requiring immediate payment.`,
          });
        }
      });
  }, []);

  return null;
};
```

---

## Mobile Optimization

The component is responsive but can be further optimized:

```tsx
export const MobileLoanDashboard: React.FC = () => {
  return (
    <div className="p-4 space-y-4">
      {/* Stack components vertically on mobile */}
      <div className="space-y-2">
        <div className="bg-blue-50 p-3 rounded text-sm">
          <p className="text-gray-600">Total Borrowed</p>
          <p className="text-xl font-bold">Loading...</p>
        </div>
        {/* Repeat for other stats */}
      </div>
      
      <LoanBalanceSummary />
    </div>
  );
};
```

---

## Performance Optimization

### Lazy Loading
```tsx
import { lazy, Suspense } from 'react';

const LoanBalanceSummary = lazy(() => 
  import('@/components/student/LoanBalanceSummary').then(m => ({ default: m.LoanBalanceSummary }))
);

export const StudentDashboard: React.FC = () => {
  return (
    <Suspense fallback={<div>Loading loans...</div>}>
      <LoanBalanceSummary />
    </Suspense>
  );
};
```

### Memoization
```tsx
import { memo } from 'react';
import { LoanBalanceSummary } from '@/components/student/LoanBalanceSummary';

export const MemoizedLoanSummary = memo(LoanBalanceSummary);

// Use instead of LoanBalanceSummary to prevent unnecessary re-renders
```

---

## Test Cases

Add tests for the integration:

```typescript
// __tests__/LoanBalanceSummary.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { LoanBalanceSummary } from '@/components/student/LoanBalanceSummary';

describe('LoanBalanceSummary', () => {
  it('displays loading state', () => {
    render(<LoanBalanceSummary />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('fetches and displays balance summary', async () => {
    render(<LoanBalanceSummary />);
    
    await waitFor(() => {
      expect(screen.getByText(/Total Borrowed/)).toBeInTheDocument();
    });
  });

  it('shows block warning if student is blocked', async () => {
    // Mock API response with isBlocked: true
    render(<LoanBalanceSummary />);
    
    await waitFor(() => {
      expect(screen.getByText(/Account Blocked/)).toBeInTheDocument();
    });
  });

  it('displays individual loan details', async () => {
    render(<LoanBalanceSummary />);
    
    await waitFor(() => {
      expect(screen.getByText(/Your Loans/)).toBeInTheDocument();
    });
  });
});
```

---

## API Keys & Configuration

Ensure your `api.ts` has correct base URL:

```typescript
// src/api.ts
export const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';
```

In `.env`:
```
VITE_API_URL=http://localhost:4000/api
```

---

## Troubleshooting

### Component shows "No active loans found"
- This is normal if student hasn't taken a loan yet
- Shows in the alert section

### Authorization errors
- Verify student is logged in
- Check token is still valid
- Component handles auth errors gracefully

### Balance not updating
- Component fetches on mount
- Refresh page to re-fetch
- Or implement manual refresh button

---

## Complete Example Integration

```tsx
// src/pages/StudentDashboard.tsx
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoanBalanceSummary } from '@/components/student/LoanBalanceSummary';
import { ApplyLoanSupport } from '@/components/student/ApplyLoanSupport';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const StudentDashboard: React.FC = () => {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-4xl font-bold mb-8">Welcome to Your Dashboard</h1>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="loans">My Loans</TabsTrigger>
          <TabsTrigger value="apply">Apply for Loan</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Dashboard Overview</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Quick stats go here */}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="loans">
          <LoanBalanceSummary />
        </TabsContent>

        <TabsContent value="apply">
          <ApplyLoanSupport />
        </TabsContent>
      </Tabs>
    </div>
  );
};
```

---

## Summary

The `LoanBalanceSummary` component is:
- ✅ Self-contained (handles its own API calls)
- ✅ Responsive (works on mobile & desktop)
- ✅ Accessible (proper labels & semantic HTML)
- ✅ Themed (supports dark mode)
- ✅ Error-tolerant (graceful error handling)

Simply import and use it anywhere in the student dashboard!

---

**For questions, see AUTOMATED_DEDUCTION_SYSTEM.md**
