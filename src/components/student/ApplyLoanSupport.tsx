import { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Progress } from '../ui/progress';
import { ArrowLeft, Upload, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { User } from '../../App';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { Alert, AlertDescription } from '../ui/alert';
import { API_BASE } from '../../api';

interface ApplyLoanSupportProps {
  user: User;
  onBack: () => void;
}

const MAX_LOAN_AMOUNT = 3200000; // 3.2M UGX max

export function ApplyLoanSupport({ user, onBack }: ApplyLoanSupportProps) {
  const [step, setStep] = useState(1);
  const [applicationType, setApplicationType] = useState<'loan' | 'support'>('loan');
  const [showChopConsent, setShowChopConsent] = useState(false);
  const [chopConsented, setChopConsented] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    // Personal Info
    firstName: '',
    lastName: '',
    studentId: '',
    email: user.email,
    phone: '',
    // University Details
    program: '',
    currentSemester: '',
    faculty: '',
    // Application Details
    amountRequested: '',
    purpose: '',
  });

  const [uploadedFiles, setUploadedFiles] = useState<{
    studentId: File | null;
    financialStatement: File | null;
  }>({
    studentId: null,
    financialStatement: null,
  });

  // Always include: 1=type, 2=personal, 3=amount & purpose, 4=documents (loan/support both need docs)
  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;

  // Check if student is in final semester
  const isFinalSemester = formData.currentSemester === 'Year 4 Sem 2' || formData.currentSemester === 'Year 3 Sem 2';

  const handleFileUpload = (fileType: keyof typeof uploadedFiles, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFiles({ ...uploadedFiles, [fileType]: file });
      toast.success(`${file.name} uploaded successfully`);
    }
  };

  const handleNext = () => {
    // When leaving the Amount & Purpose step (step 3) validate the amount/purpose
    if (step === 3) {
      const amount = parseInt(formData.amountRequested || '0');
      if (!formData.amountRequested || amount <= 0) {
        toast.error('Please enter a valid amount.');
        return;
      }
      if (applicationType === 'loan') {
        if (amount > MAX_LOAN_AMOUNT) {
          toast.error(`Loan amount cannot exceed UGX ${MAX_LOAN_AMOUNT.toLocaleString()}`);
          return;
        }
        if (isFinalSemester) {
          toast.error('Final semester students are not eligible for loans');
          return;
        }
      }
      if (!formData.purpose || formData.purpose.trim().length < 5) {
        toast.error('Please provide a brief purpose for the request.');
        return;
      }
    }

    // For loan show chop consent before final submit (when on step 3)
    if (step === totalSteps - 1 && applicationType === 'loan') {
      setShowChopConsent(true);
    } else if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleChopConsent = () => {
    setChopConsented(true);
    setShowChopConsent(false);
    setStep(totalSteps);
  };

 // src/components/student/ApplyLoanSupport.tsx

// ... inside the ApplyLoanSupport component

// src/components/student/ApplyLoanSupport.tsx

// ... inside the ApplyLoanSupport component

const handleSubmit = async () => {
  // ... (your existing final validations for files and consent) ...

  setSubmitting(true);
  try {
    // --- FIX START: Sanitize and validate the amountRequested field ---

    // 1. Remove any non-numeric characters (like commas) from the input string.
    const sanitizedAmount = formData.amountRequested.replace(/[^0-9]/g, '');

    // 2. Convert the clean string to a number.
    const numericAmount = parseInt(sanitizedAmount, 10);

    // 3. Perform a final, robust check on the number.
    if (isNaN(numericAmount) || numericAmount <= 0) {
      toast.error('Please enter a valid, positive number for the amount.');
      setSubmitting(false); // Stop the submission
      return;
    }
    // --- FIX END ---

    const token = localStorage.getItem('token') || '';
    const endpoint = applicationType === 'loan' ? `${API_BASE}/loans` : `${API_BASE}/support`;

    const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
    const studentUid = savedUser?.uid || user?.uid;

    if (!studentUid) {
      toast.error('Could not identify student. Please log in again.');
      setSubmitting(false);
      return;
    }

    const form = new FormData();
    // append form fields
    form.append('firstName', formData.firstName || '');
    form.append('lastName', formData.lastName || '');
    form.append('studentId', formData.studentId || '');
    form.append('email', formData.email || user.email || '');
    form.append('phone', formData.phone || '');
    form.append('program', formData.program || '');
    form.append('currentSemester', formData.currentSemester || '');
    form.append('faculty', formData.faculty || '');
    
    // Use the CLEANED numeric amount for the submission
    form.append('amountRequested', String(numericAmount)); 
    
    form.append('purpose', formData.purpose || '');
    form.append('type', applicationType);
    form.append('studentUid', studentUid);
    if (applicationType === 'loan') form.append('chopConsented', String(chopConsented));

    // files
    if (uploadedFiles.studentId) form.append('studentIdFile', uploadedFiles.studentId, uploadedFiles.studentId.name);
    if (uploadedFiles.financialStatement) form.append('financialStatement', uploadedFiles.financialStatement, uploadedFiles.financialStatement.name);

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });

    const text = await res.text();
    let data: any = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = null; }

    if (!res.ok) {
      const msg = data?.error || data?.message || text || `Submit failed (${res.status})`;
      toast.error(msg);
      console.warn('Submit failed', res.status, data ?? text);
      return; // Stop execution on failure
    }

    toast.success('Application submitted successfully, you will be notified when it is approved.');
    try { window.dispatchEvent(new Event('application:submitted')); } catch {}

    setTimeout(() => onBack(), 800);
  } catch (err: any) {
    console.error('Submit error', err);
    toast.error(err?.message || 'Submission failed');
  } finally {
    setSubmitting(false);
  }
};

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <h3>Choose Application Type</h3>
            <RadioGroup value={applicationType} onValueChange={(v: string) => setApplicationType(v as 'loan' | 'support')}>
              <Card className={applicationType === 'loan' ? 'border-2 border-primary' : ''}>
                <CardContent className="p-4 flex items-start gap-3">
                  <RadioGroupItem value="loan" id="loan" />
                  <div className="flex-1">
                    <Label htmlFor="loan" className="cursor-pointer">
                      <p className="text-sm">Student Loan</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Repayable loan up to UGX 3.2M with full semester deduction
                      </p>
                    </Label>
                  </div>
                </CardContent>
              </Card>

              <Card className={applicationType === 'support' ? 'border-2 border-primary' : ''}>
                <CardContent className="p-4 flex items-start gap-3">
                  <RadioGroupItem value="support" id="support" />
                  <div className="flex-1">
                    <Label htmlFor="support" className="cursor-pointer">
                      <p className="text-sm">Student Benefit (Support Request)</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Non-repayable emergency financial support from Alumni Office
                      </p>
                    </Label>
                  </div>
                </CardContent>
              </Card>
            </RadioGroup>

            {applicationType === 'loan' && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  • Maximum loan amount: UGX 3,200,000<br/>
                  • Final semester students are NOT eligible<br/>
                  • Full amount will be deducted from your next semester fees
                </AlertDescription>
              </Alert>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h3>Personal & Academic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="studentId">Student ID</Label>
              <Input
                id="studentId"
                value={formData.studentId}
                onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                placeholder="e.g., 2021/BAC/123"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  disabled
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+256 700 000 000"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="program">Program/Course</Label>
              <Input
                id="program"
                value={formData.program}
                onChange={(e) => setFormData({ ...formData, program: e.target.value })}
                placeholder="e.g., Bachelor of Computer Science"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="currentSemester">Current Semester</Label>
                <Select value={formData.currentSemester} onValueChange={(v: any) => setFormData({ ...formData, currentSemester: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select semester" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Year 1 Sem 1">Year 1 Semester 1</SelectItem>
                    <SelectItem value="Year 1 Sem 2">Year 1 Semester 2</SelectItem>
                    <SelectItem value="Year 2 Sem 1">Year 2 Semester 1</SelectItem>
                    <SelectItem value="Year 2 Sem 2">Year 2 Semester 2</SelectItem>
                    <SelectItem value="Year 3 Sem 1">Year 3 Semester 1</SelectItem>
                    <SelectItem value="Year 3 Sem 2">Year 3 Semester 2</SelectItem>
                    <SelectItem value="Year 4 Sem 1">Year 4 Semester 1</SelectItem>
                    <SelectItem value="Year 4 Sem 2">Year 4 Semester 2 (Final)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="faculty">Faculty</Label>
                <Select value={formData.faculty} onValueChange={(v: any) => setFormData({ ...formData, faculty: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select faculty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="science">Faculty of Science & Technology</SelectItem>
                    <SelectItem value="business">Faculty of Business & Management</SelectItem>
                    <SelectItem value="education">Faculty of Education</SelectItem>
                    <SelectItem value="social">Faculty of Social Sciences</SelectItem>
                    <SelectItem value="theology">Faculty of Theology</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {isFinalSemester && applicationType === 'loan' && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Final semester students are not eligible for loans as there is no subsequent semester for deduction.
                </AlertDescription>
              </Alert>
            )}
          </div>
        );

      case 3:
        // Step 3 = Amount & Purpose for both support and loan
        return (
          <div className="space-y-4">
            <h3>Application Details</h3>
            
            <div>
              <Label htmlFor="amountRequested">Amount Requested (UGX)</Label>
              <Input
                id="amountRequested"
                type="number"
                value={formData.amountRequested}
                onChange={(e) => setFormData({ ...formData, amountRequested: e.target.value })}
                placeholder="Enter amount"
                max={applicationType === 'loan' ? MAX_LOAN_AMOUNT : undefined}
                required
              />
              {applicationType === 'loan' && (
                <p className="text-xs text-gray-500 mt-1">
                  Maximum: UGX {MAX_LOAN_AMOUNT.toLocaleString()} (UCU tuition fee limit)
                </p>
              )}
              {formData.amountRequested && parseInt(formData.amountRequested) > MAX_LOAN_AMOUNT && applicationType === 'loan' && (
                <p className="text-xs text-red-600 mt-1">
                  Amount exceeds maximum limit of UGX {MAX_LOAN_AMOUNT.toLocaleString()}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="purpose">Purpose / Reason for Request</Label>
              <Textarea
                id="purpose"
                value={formData.purpose}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                placeholder="Please explain why you need this financial assistance..."
                rows={5}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Be specific about how the funds will be used (e.g., tuition fees, accommodation, medical emergency)
              </p>
            </div>
          </div>
        );

      case 4:
        // Step 4 = Documents for both support and loan
        return renderDocumentsStep();

      default:
        return null;
    }
  };

  const renderDocumentsStep = () => (
    <div className="space-y-4">
      <h3>Supporting Documents</h3>
      <p className="text-sm text-gray-600">
        Please upload the required documents to support your application.
      </p>

      {/* Student ID Card */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm">Student ID Card</p>
              <p className="text-xs text-gray-500">Clear photo or scan of your student ID</p>
            </div>
            {uploadedFiles.studentId && <CheckCircle2 className="w-5 h-5 text-green-600" />}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="file"
              id="studentId"
              accept="image/*,.pdf"
              onChange={(e) => handleFileUpload('studentId', e)}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => document.getElementById('studentId')?.click()}
              className="w-full"
            >
              <Upload className="w-4 h-4 mr-2" />
              {uploadedFiles.studentId ? 'Change File' : 'Upload File'}
            </Button>
          </div>
          {uploadedFiles.studentId && (
            <p className="text-xs text-green-600 mt-2">
              ✓ {uploadedFiles.studentId.name}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Financial Statement */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm">Financial Statement / Proof of Need</p>
              <p className="text-xs text-gray-500">Bank statement, fee statement, or letter explaining financial situation</p>
            </div>
            {uploadedFiles.financialStatement && <CheckCircle2 className="w-5 h-5 text-green-600" />}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="file"
              id="financialStatement"
              accept="image/*,.pdf"
              onChange={(e) => handleFileUpload('financialStatement', e)}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => document.getElementById('financialStatement')?.click()}
              className="w-full"
            >
              <Upload className="w-4 h-4 mr-2" />
              {uploadedFiles.financialStatement ? 'Change File' : 'Upload File'}
            </Button>
          </div>
          {uploadedFiles.financialStatement && (
            <p className="text-xs text-green-600 mt-2">
              ✓ {uploadedFiles.financialStatement.name}
            </p>
          )}
        </CardContent>
      </Card>

      {applicationType === 'loan' && !chopConsented && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            After uploading documents, you will need to consent to the loan deduction terms.
          </AlertDescription>
        </Alert>
      )}

      {chopConsented && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-sm text-green-800">
            You have consented to the loan deduction terms.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-6">
      <div className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-primary">Apply for {applicationType === 'loan' ? 'Student Loan' : 'Student Benefit'}</h1>
            <p className="text-xs text-gray-600">Step {step} of {totalSteps}</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <Progress value={progress} className="h-2" />
        </div>

        <Card className="p-6">
          {renderStepContent()}

          <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1">
                Back
              </Button>
            )}
            {step < totalSteps ? (
              <Button 
                onClick={handleNext} 
                className="flex-1"
                disabled={isFinalSemester && applicationType === 'loan'}
              >
                Next
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit} 
                className="flex-1"
                disabled={submitting || !uploadedFiles.studentId || !uploadedFiles.financialStatement || (applicationType === 'loan' && !chopConsented)}
              >
                {submitting ? 'Submitting...' : 'Submit Application'}
              </Button>
             )}
          </div>
        </Card>
      </div>

      {/* Chop Consent Dialog */}
      <AlertDialog open={showChopConsent} onOpenChange={setShowChopConsent}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Loan Deduction Consent</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                I, <strong>{formData.firstName} {formData.lastName}</strong>, hereby consent to the following terms:
              </p>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 text-sm space-y-2">
                <p className="text-gray-900">
                  <strong>1. Full Semester Deduction:</strong> I authorize Uganda Christian University Alumni Office to deduct the <strong>ENTIRE loan amount of UGX {parseInt(formData.amountRequested || '0').toLocaleString()}</strong> from my next semester's student fund allocation in one single payment.
                </p>
                <p className="text-gray-900">
                  <strong>2. Automatic Processing:</strong> This deduction will be processed automatically before any funds are disbursed to me for the next semester.
                </p>
                <p className="text-gray-900">
                  <strong>3. No Installments:</strong> The full amount will be deducted at once, not in installments or portions.
                </p>
              </div>
              <p className="text-sm text-gray-600">
                By consenting, you acknowledge that if you do not have sufficient funds in your next semester allocation, the remaining balance will be carried forward.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>I Do Not Consent</AlertDialogCancel>
            <AlertDialogAction onClick={handleChopConsent}>
              I Consent to These Terms
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
