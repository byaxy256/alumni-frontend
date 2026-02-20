import { useState, useEffect } from 'react';
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
import { UCU_COURSES, getDurationByProgram, type DegreeLevel, getCoursesByDegreeLevel } from '../../data/ucu-courses';

interface ApplyLoanSupportProps {
  user: User;
  onBack: () => void;
  applicationType?: 'loan' | 'benefit';
}

const MAX_LOAN_AMOUNT = 3200000; // 3.2M UGX max
const PHONE_MAX_LENGTH = 10;

export function ApplyLoanSupport({ user, onBack, applicationType: propApplicationType = 'loan' }: ApplyLoanSupportProps) {
  const [step, setStep] = useState(1);
  const [applicationType, setApplicationType] = useState<'loan' | 'support'>(propApplicationType === 'benefit' ? 'support' : 'loan');
  const [showChopConsent, setShowChopConsent] = useState(false);
  const [chopConsented, setChopConsented] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    // Personal Info
    firstName: '',
    lastName: '',
    accessNumber: '',
    email: user.email,
    phone: '',
    // Guarantor info (required for loans)
    guarantorName: '',
    guarantorRelation: '',
    guarantorPhone: '',
    // University Details
    degreeLevel: '' as DegreeLevel | '',
    program: '',
    currentSemester: '',
    faculty: '',
    // Application Details
    amountRequested: '',
    purpose: '',
  });

  const [uploadedFiles, setUploadedFiles] = useState<{
    financialStatement: File | null;
  }>({
    financialStatement: null,
  });

  // Always include: 1=type, 2=personal, 3=amount & purpose, 4=documents (loan/support both need docs)
  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;

  // Get course duration
  const courseDuration = formData.program ? getDurationByProgram(formData.program) : 3;

  // Check if student is in final semester
  const isFinalSemester = 
    (courseDuration === 3 && formData.currentSemester === 'Year 3 Sem 2') ||
    (courseDuration === 4 && formData.currentSemester === 'Year 4 Sem 2');

  // Auto-populate access number from user meta on component mount
  useEffect(() => {
    if (user?.meta?.accessNumber) {
      setFormData(prev => ({
        ...prev,
        accessNumber: user.meta.accessNumber
      }));
    }
  }, [user?.meta?.accessNumber]);

  // Get available courses for selected degree level
  const availableCourses = formData.degreeLevel 
    ? getCoursesByDegreeLevel(formData.degreeLevel as DegreeLevel)
    : [];

  // Generate semester options based on duration
  const generateSemesterOptions = () => {
    const options = [];
    for (let year = 1; year <= courseDuration; year++) {
      options.push(`Year ${year} Sem 1`);
      options.push(`Year ${year} Sem 2`);
    }
    return options;
  };

  // Validate access number format (A12345 or B12345)
  const validateAccessNumber = (value: string): boolean => {
    const regex = /^[AB]\d{5}$/;
    return regex.test(value);
  };

  // Validate and limit phone number input
  const handlePhoneChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, PHONE_MAX_LENGTH);
    setFormData({ ...formData, phone: cleaned });
  };

  // Validate and limit guarantor phone input
  const handleGuarantorPhoneChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, PHONE_MAX_LENGTH);
    setFormData({ ...formData, guarantorPhone: cleaned });
  };

  // Handle program selection and auto-generate faculty
  const handleProgramChange = (selectedProgram: string) => {
    const course = UCU_COURSES.find(c => c.name === selectedProgram);
    setFormData({
      ...formData,
      program: selectedProgram,
      faculty: course?.faculty || '',
      currentSemester: '', // Reset semester when program changes
    });
  };

  const handleFileUpload = (fileType: keyof typeof uploadedFiles, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFiles({ ...uploadedFiles, [fileType]: file });
      toast.success(`${file.name} uploaded successfully`);
    }
  };

  const handleNext = () => {
    // When leaving Personal & Academic step (step 2) validate access number
    if (step === 2) {
      if (!formData.degreeLevel) {
        toast.error('Please select a degree level (Diploma, Bachelor, or Postgraduate)');
        return;
      }
      if (!formData.program) {
        toast.error('Please select your program/course');
        return;
      }
      if (!formData.currentSemester) {
        toast.error('Please select your current semester');
        return;
      }
      if (!formData.accessNumber || !validateAccessNumber(formData.accessNumber)) {
        toast.error('Access Number must be in format A12345 or B12345');
        return;
      }
      if (!formData.phone || formData.phone.length < 10) {
        toast.error('Please enter a valid phone number');
        return;
      }
      if (applicationType === 'loan') {
        if (!formData.guarantorName || !formData.guarantorPhone || !formData.guarantorRelation) {
          toast.error('Please provide full guarantor details (name, relation, phone) for loan applications.');
          return;
        }
        if (formData.guarantorPhone.length < 10) {
          toast.error('Guarantor phone must be at least 10 digits');
          return;
        }
      }
    }

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

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // Sanitize and validate the amountRequested field
      const sanitizedAmount = formData.amountRequested.replace(/[^0-9]/g, '');
      const numericAmount = parseInt(sanitizedAmount, 10);

      if (isNaN(numericAmount) || numericAmount <= 0) {
        toast.error('Please enter a valid, positive number for the amount.');
        setSubmitting(false);
        return;
      }

      // Require guarantor details for loan applications
      if (applicationType === 'loan') {
        const hasGuarantor = formData.guarantorName?.trim() && formData.guarantorPhone?.trim() && formData.guarantorRelation?.trim();
        if (!hasGuarantor) {
          toast.error('Guarantor name, relation, and phone are required for loans.');
          setSubmitting(false);
          return;
        }
      }

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
      form.append('accessNumber', formData.accessNumber || '');
      form.append('email', formData.email || user.email || '');
      form.append('phone', formData.phone || '');
      form.append('program', formData.program || '');
      form.append('currentSemester', formData.currentSemester || '');
      form.append('faculty', formData.faculty || '');
      form.append('amountRequested', String(numericAmount));
      form.append('amount_requested', String(numericAmount));
      form.append('purpose', formData.purpose || '');
      form.append('reason', formData.purpose || '');
      form.append('type', applicationType);
      form.append('studentUid', studentUid);
      form.append('student_uid', studentUid);
      if (applicationType === 'loan') form.append('chopConsented', String(chopConsented));
      // Include guarantor details for loans
      if (applicationType === 'loan') {
        form.append('guarantor_name', formData.guarantorName || '');
        form.append('guarantor_relation', formData.guarantorRelation || '');
        form.append('guarantor_phone', formData.guarantorPhone || '');
      }

      // files
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
        return;
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
              <Label htmlFor="accessNumber">Access Number *</Label>
              <Input
                id="accessNumber"
                value={formData.accessNumber}
                onChange={(e) => setFormData({ ...formData, accessNumber: e.target.value.toUpperCase() })}
                placeholder="e.g., A12345 or B12345"
                maxLength={6}
                required
              />
              <p className="text-xs text-gray-500 mt-1">Format: Letter (A or B) followed by 5 digits</p>
              {formData.accessNumber && !validateAccessNumber(formData.accessNumber) && (
                <p className="text-xs text-red-600 mt-1">Invalid format. Use A12345 or B12345</p>
              )}
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
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="256XXXXXXXXX"
                  maxLength={PHONE_MAX_LENGTH}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">{formData.phone.length}/{PHONE_MAX_LENGTH} characters</p>
              </div>
            </div>

            {/* Guarantor fields for loans */}
            {applicationType === 'loan' && (
              <div className="space-y-4 p-4 rounded-lg border" style={{ backgroundColor: '#0b2a4a', borderColor: '#c79b2d' }}>
                <h4 className="font-semibold text-sm" style={{ color: '#c79b2d' }}>Guarantor Information *</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="guarantorName" style={{ color: '#ffffff' }}>Guarantor Name</Label>
                    <Input
                      id="guarantorName"
                      value={formData.guarantorName}
                      onChange={(e) => setFormData({ ...formData, guarantorName: e.target.value })}
                      placeholder="Full name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="guarantorRelation" style={{ color: '#ffffff' }}>Relation</Label>
                    <Input
                      id="guarantorRelation"
                      value={formData.guarantorRelation}
                      onChange={(e) => setFormData({ ...formData, guarantorRelation: e.target.value })}
                      placeholder="e.g., Father, Mother, Employer"
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="guarantorPhone" style={{ color: '#ffffff' }}>Guarantor Phone *</Label>
                  <Input
                    id="guarantorPhone"
                    type="tel"
                    value={formData.guarantorPhone}
                    onChange={(e) => handleGuarantorPhoneChange(e.target.value)}
                    placeholder="256XXXXXXXXX"
                    maxLength={PHONE_MAX_LENGTH}
                    required
                  />
                  <p className="text-xs mt-1" style={{ color: '#c79b2d' }}>{formData.guarantorPhone.length}/{PHONE_MAX_LENGTH} characters</p>
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="degreeLevel">Degree Level *</Label>
              <Select value={formData.degreeLevel} onValueChange={(v: string) => {
                setFormData({
                  ...formData,
                  degreeLevel: v as DegreeLevel,
                  program: '',
                  faculty: '',
                  currentSemester: '',
                });
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select degree level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="diploma">Diploma</SelectItem>
                  <SelectItem value="bachelor">Bachelor's Degree</SelectItem>
                  <SelectItem value="postgraduate">Postgraduate</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="program">Program/Course *</Label>
              <Select value={formData.program} onValueChange={handleProgramChange}>
                <SelectTrigger>
                  <SelectValue placeholder={formData.degreeLevel ? "Select your program/course" : "Select degree level first"} />
                </SelectTrigger>
                <SelectContent className="!max-h-[400px] overflow-y-auto">
                  {availableCourses.map((course) => (
                    <SelectItem key={course.name} value={course.name}>
                      {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">Search and select from all available UCU courses</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="currentSemester">Current Semester *</Label>
                <Select value={formData.currentSemester} onValueChange={(v: string) => setFormData({ ...formData, currentSemester: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder={formData.program ? "Select semester" : "Select a program first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {formData.program && generateSemesterOptions().map((semester) => (
                      <SelectItem key={semester} value={semester}>
                        {semester}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.program && <p className="text-xs text-gray-500 mt-1">{courseDuration}-year program</p>}
              </div>

              <div>
                <Label htmlFor="faculty">Faculty</Label>
                <Input
                  id="faculty"
                  value={formData.faculty}
                  disabled
                  className="bg-gray-100"
                />
                <p className="text-xs text-gray-500 mt-1">Auto-generated from your course selection</p>
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
          <div>
            <input
              type="file"
              id="financialStatement"
              accept="image/*,.pdf"
              onChange={(e) => handleFileUpload('financialStatement', e)}
              className="hidden"
              title="Upload financial statement or proof of need"
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
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg" title="Go back">
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
                disabled={submitting || !uploadedFiles.financialStatement || (applicationType === 'loan' && !chopConsented)}
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
