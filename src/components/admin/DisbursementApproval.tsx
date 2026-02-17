import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Alert, AlertDescription } from '../ui/alert';
import { CheckCircle, XCircle, AlertTriangle, DollarSign, Scissors, Calculator } from 'lucide-react';
import { toast } from 'sonner';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';

const pendingDisbursements = [
  {
    id: 1,
    studentName: 'Sarah Nakato',
    accessNumber: 'A12345',
    loanAmount: 5000000,
    purpose: 'Tuition fees for Semester 2',
    applicationDate: '2024-10-28',
    chopAmount: 850000,
    netAmount: 4150000,
    hasConsent: true,
    crbStatus: 'passed',
    guarantor: 'Dr. John Musoke',
  },
  {
    id: 2,
    studentName: 'David Musoke',
    accessNumber: 'B67890',
    loanAmount: 3000000,
    purpose: 'Research materials',
    applicationDate: '2024-10-30',
    chopAmount: 0,
    netAmount: 3000000,
    hasConsent: false,
    crbStatus: 'passed',
    guarantor: 'Prof. Mary Atim',
  },
  {
    id: 3,
    studentName: 'Mary Achieng',
    accessNumber: 'A09876',
    loanAmount: 7500000,
    purpose: 'Tuition fees and accommodation',
    applicationDate: '2024-11-01',
    chopAmount: 1200000,
    netAmount: 6300000,
    hasConsent: true,
    crbStatus: 'warning',
    guarantor: 'Mr. Peter Okello',
  },
];

export default function DisbursementApproval() {
  const [selectedDisbursement, setSelectedDisbursement] = useState<typeof pendingDisbursements[0] | null>(null);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [confirmationChecked, setConfirmationChecked] = useState(false);

  const handleApprove = () => {
    if (!confirmationChecked) {
      toast.error('Please confirm chop preview before approving');
      return;
    }
    toast.success(`Disbursement approved for ${selectedDisbursement?.studentName}`);
    setShowApprovalDialog(false);
    setConfirmationChecked(false);
  };

  const handleReject = (id: number) => {
    toast.error('Disbursement rejected');
  };

  const formatCurrency = (amount: number) => {
    return `UGX ${amount.toLocaleString()}`;
  };

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div>
        <h1>Disbursement Approval</h1>
        <p className="text-muted-foreground">Review and approve loan disbursements with chop deduction preview</p>
      </div>

      <Alert>
        <AlertTriangle className="w-4 h-4" />
        <AlertDescription>
          All disbursements require chop preview verification. Ensure student consent is obtained before final approval.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Pending Disbursements ({pendingDisbursements.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Purpose</TableHead>
                  <TableHead>Chop Amount</TableHead>
                  <TableHead>CRB Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingDisbursements.map((disbursement) => (
                  <TableRow key={disbursement.id}>
                    <TableCell>
                      <div>
                        <p>{disbursement.studentName}</p>
                        <p className="text-sm text-muted-foreground">{disbursement.accessNumber}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p>{formatCurrency(disbursement.loanAmount)}</p>
                        <p className="text-sm text-muted-foreground">Applied {disbursement.applicationDate}</p>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{disbursement.purpose}</TableCell>
                    <TableCell>
                      {disbursement.chopAmount > 0 ? (
                        <div className="flex items-center gap-2">
                          <Scissors className="w-4 h-4 text-orange-600" />
                          <span>{formatCurrency(disbursement.chopAmount)}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">No chop</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          disbursement.crbStatus === 'passed' ? 'default' :
                          disbursement.crbStatus === 'warning' ? 'secondary' : 'destructive'
                        }
                      >
                        {disbursement.crbStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedDisbursement(disbursement);
                            setShowApprovalDialog(true);
                          }}
                        >
                          Review
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Approval Dialog with Chop Preview */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Disbursement Approval with Chop Preview</DialogTitle>
            <DialogDescription>
              Review all details and chop calculations before final approval
            </DialogDescription>
          </DialogHeader>

          {selectedDisbursement && (
            <div className="space-y-6">
              {/* Student Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Student Name</Label>
                  <p className="text-sm">{selectedDisbursement.studentName}</p>
                </div>
                <div>
                  <Label>Access Number</Label>
                  <p className="text-sm">{selectedDisbursement.accessNumber}</p>
                </div>
                <div>
                  <Label>Purpose</Label>
                  <p className="text-sm">{selectedDisbursement.purpose}</p>
                </div>
                <div>
                  <Label>Guarantor</Label>
                  <p className="text-sm">{selectedDisbursement.guarantor}</p>
                </div>
              </div>

              {/* CRB Status */}
              {selectedDisbursement.crbStatus === 'warning' && (
                <Alert>
                  <AlertTriangle className="w-4 h-4" />
                  <AlertDescription>
                    CRB check indicates previous late payments. Proceed with caution.
                  </AlertDescription>
                </Alert>
              )}

              {/* Chop Calculation Preview */}
              <Card className="bg-muted/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="w-5 h-5" />
                    Chop Deduction Preview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Original Loan Amount:</span>
                    <span className="text-xl">{formatCurrency(selectedDisbursement.loanAmount)}</span>
                  </div>
                  
                  {selectedDisbursement.chopAmount > 0 && (
                    <>
                      <div className="flex justify-between items-center text-orange-600">
                        <span className="flex items-center gap-2">
                          <Scissors className="w-4 h-4" />
                          Automatic Deduction (Chop):
                        </span>
                        <span className="text-xl">- {formatCurrency(selectedDisbursement.chopAmount)}</span>
                      </div>
                      <div className="border-t pt-4 flex justify-between items-center">
                        <span>Net Amount to Disburse:</span>
                        <span className="text-2xl text-primary">{formatCurrency(selectedDisbursement.netAmount)}</span>
                      </div>
                    </>
                  )}

                  {!selectedDisbursement.hasConsent && (
                    <Alert>
                      <AlertTriangle className="w-4 h-4" />
                      <AlertDescription>
                        Student consent for chop deduction is pending. Cannot proceed with approval.
                      </AlertDescription>
                    </Alert>
                  )}

                  {selectedDisbursement.hasConsent && selectedDisbursement.chopAmount > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-green-700">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm">Student has consented to chop deduction</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Confirmation Checkbox */}
              <div className="flex items-start gap-3 p-4 border rounded-lg">
                <Checkbox
                  id="confirm"
                  checked={confirmationChecked}
                  onCheckedChange={(checked: boolean) => setConfirmationChecked(checked as boolean)}
                />
                <div className="grid gap-1.5 leading-none">
                  <label
                    htmlFor="confirm"
                    className="text-sm peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    I confirm that I have reviewed the chop deduction preview and verified that:
                  </label>
                  <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                    <li>The original amount is correct</li>
                    <li>The chop calculation is accurate</li>
                    <li>Student consent has been obtained</li>
                    <li>Net disbursement amount is as shown</li>
                  </ul>
                </div>
              </div>

              {/* Microcopy for Chop Consent */}
              <div className="bg-muted p-4 rounded-lg text-sm">
                <p className="text-muted-foreground">
                  <strong>Student Consent Message:</strong> "You are about to consent to a loan deduction (chop) of{' '}
                  {formatCurrency(selectedDisbursement.chopAmount)} from your next university disbursement. This amount will be 
                  automatically deducted to repay your Alumni Aid loan. The net amount of{' '}
                  {formatCurrency(selectedDisbursement.netAmount)} will be disbursed to your account. Do you wish to continue?"
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowApprovalDialog(false);
                setConfirmationChecked(false);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedDisbursement) {
                  handleReject(selectedDisbursement.id);
                }
                setShowApprovalDialog(false);
              }}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Reject
            </Button>
            <Button
              onClick={handleApprove}
              disabled={!confirmationChecked || !selectedDisbursement?.hasConsent}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Approve & Disburse
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
