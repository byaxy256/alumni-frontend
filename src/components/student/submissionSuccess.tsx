// src/components/student/SubmissionSuccess.tsx

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { CheckCircle2, FileText, Clock } from 'lucide-react';
import type { Application } from './types'; // We will create this types file next

interface SubmissionSuccessProps {
  application: Application;
  onDone: () => void;
}

export function SubmissionSuccess({ application, onDone }: SubmissionSuccessProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg text-center">
        <CardHeader>
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle>Application Submitted!</CardTitle>
          <CardDescription>
            Your application has been successfully received and is now pending review.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-left p-4 bg-slate-50 rounded-lg border">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Application ID</span>
              <span className="font-mono text-sm">{application.applicationId}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Application Type</span>
              <span className="font-medium capitalize">{application.type}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Amount Requested</span>
              <span className="font-medium">UGX {application.amount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Current Status</span>
              <div className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-yellow-800 bg-yellow-100 rounded-full">
                <Clock className="w-3 h-3" />
                <span>Pending</span>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4">
            You will be notified via email and on your dashboard once there is an update on your application status.
          </p>
          <Button onClick={onDone} className="w-full mt-6">
            Back to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}