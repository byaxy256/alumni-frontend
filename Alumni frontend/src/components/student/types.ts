// src/components/student/types.ts

export type Application = {
  id: number;
  applicationId: string;
  type: 'loan' | 'support';
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'under_review';
  // Add any other fields you want to display on the success screen
};