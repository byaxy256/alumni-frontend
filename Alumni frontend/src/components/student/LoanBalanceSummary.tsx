// src/components/student/LoanBalanceSummary.tsx
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Progress } from '../ui/progress';
import { Button } from '../ui/button';
import { AlertTriangle, AlertCircle, CheckCircle, Clock, Download } from 'lucide-react';
import { API_BASE } from '../../api';
import { toast } from 'sonner';

interface LoanBalance {
    id: string;
    amount: number;
    outstanding: number;
    paid: number;
    status: 'pending' | 'approved' | 'active' | 'overdue' | 'paid';
    isOverdue: boolean;
    gracePeriodEnd: string;
    appliedDate: string;
}

interface LoanSummary {
    totalBorrowed: number;
    totalOutstanding: number;
    totalPaid: number;
    activeLoans: number;
    overdueLoans: number;
    paidLoans: number;
    isBlocked: boolean;
    loans: LoanBalance[];
}

export const LoanBalanceSummary: React.FC = () => {
    const [summary, setSummary] = useState<LoanSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [downloadingSchedule, setDownloadingSchedule] = useState(false);

    useEffect(() => {
        fetchBalanceSummary();
    }, []);

    const fetchBalanceSummary = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE}/automated-deductions/balance-summary`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch balance summary');
            }

            const data = await response.json();
            setSummary(data.data);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error fetching balance');
        } finally {
            setLoading(false);
        }
    };

    const downloadDeductionSchedule = async () => {
        try {
            setDownloadingSchedule(true);
            const response = await fetch(`${API_BASE}/automated-deductions/schedule`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to download deduction schedule');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `deduction-schedule-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toast.success('Deduction schedule downloaded successfully');
        } catch (err) {
            console.error('Download error:', err);
            toast.error(err instanceof Error ? err.message : 'Failed to download schedule');
        } finally {
            setDownloadingSchedule(false);
        }
    };

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Loan Balance Summary</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8">Loading...</div>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }

    if (!summary) {
        return null;
    }

    const paidPercentage = summary.totalBorrowed > 0 
        ? (summary.totalPaid / summary.totalBorrowed) * 100 
        : 0;

    return (
        <div className="space-y-6">
            {/* Overall Summary */}
            <Card>
                <CardHeader>
                    <CardTitle>Loan Balance Summary</CardTitle>
                    <CardDescription>
                        Track your outstanding loans and payments
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Block Alert */}
                    {summary.isBlocked && (
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                                ⚠️ <strong>Account Blocked:</strong> You have overdue loans. You cannot request new loans until all balances are cleared.
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Overall Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                            <p className="text-sm text-gray-600 dark:text-gray-400">Total Borrowed</p>
                            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                UGX {summary.totalBorrowed.toLocaleString()}
                            </p>
                        </div>

                        <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                            <p className="text-sm text-gray-600 dark:text-gray-400">Outstanding</p>
                            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                                UGX {summary.totalOutstanding.toLocaleString()}
                            </p>
                        </div>

                        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                            <p className="text-sm text-gray-600 dark:text-gray-400">Paid</p>
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                UGX {summary.totalPaid.toLocaleString()}
                            </p>
                        </div>

                        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                            <p className="text-sm text-gray-600 dark:text-gray-400">Progress</p>
                            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                {Math.round(paidPercentage)}%
                            </p>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div>
                        <div className="flex justify-between text-sm mb-2">
                            <span className="font-medium">Overall Payment Progress</span>
                            <span className="text-gray-600 dark:text-gray-400">
                                {summary.totalPaid.toLocaleString()} / {summary.totalBorrowed.toLocaleString()}
                            </span>
                        </div>
                        <Progress value={paidPercentage} className="h-2" />
                    </div>

                    {/* Loan Summary */}
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <Clock className="h-5 w-5 mx-auto text-blue-600 dark:text-blue-400 mb-2" />
                            <p className="text-sm text-gray-600 dark:text-gray-400">Active</p>
                            <p className="text-lg font-bold">{summary.activeLoans}</p>
                        </div>
                        <div>
                            <AlertTriangle className="h-5 w-5 mx-auto text-orange-600 dark:text-orange-400 mb-2" />
                            <p className="text-sm text-gray-600 dark:text-gray-400">Overdue</p>
                            <p className="text-lg font-bold text-orange-600 dark:text-orange-400">{summary.overdueLoans}</p>
                        </div>
                        <div>
                            <CheckCircle className="h-5 w-5 mx-auto text-green-600 dark:text-green-400 mb-2" />
                            <p className="text-sm text-gray-600 dark:text-gray-400">Paid</p>
                            <p className="text-lg font-bold text-green-600 dark:text-green-400">{summary.paidLoans}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Individual Loans */}
            {summary.loans.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Your Loans</h3>
                    {summary.loans.map((loan) => (
                        <Card key={loan.id}>
                            <CardContent className="pt-6">
                                <div className="space-y-4">
                                    {/* Status Badge and Date */}
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">Applied</p>
                                            <p className="font-medium">
                                                {new Date(loan.appliedDate).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                                            loan.status === 'paid' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                                            loan.status === 'overdue' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' :
                                            loan.status === 'active' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' :
                                            'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300'
                                        }`}>
                                            {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                                        </div>
                                    </div>

                                    {/* Loan Amounts */}
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <p className="text-xs text-gray-600 dark:text-gray-400 uppercase">Amount</p>
                                            <p className="font-bold text-lg">UGX {loan.amount.toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-600 dark:text-gray-400 uppercase">Paid</p>
                                            <p className="font-bold text-lg text-green-600 dark:text-green-400">
                                                UGX {loan.paid.toLocaleString()}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-600 dark:text-gray-400 uppercase">Outstanding</p>
                                            <p className="font-bold text-lg text-orange-600 dark:text-orange-400">
                                                UGX {loan.outstanding.toLocaleString()}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Progress */}
                                    <div>
                                        <div className="flex justify-between text-sm mb-2">
                                            <span>Payment Progress</span>
                                            <span>{Math.round((loan.paid / loan.amount) * 100)}%</span>
                                        </div>
                                        <Progress value={(loan.paid / loan.amount) * 100} className="h-2" />
                                    </div>

                                    {/* Grace Period or Overdue Info */}
                                    {loan.isOverdue && loan.status !== 'paid' ? (
                                        <Alert variant="destructive">
                                            <AlertTriangle className="h-4 w-4" />
                                            <AlertDescription>
                                                ⚠️ This loan is OVERDUE. Payment is required immediately.
                                            </AlertDescription>
                                        </Alert>
                                    ) : loan.gracePeriodEnd ? (
                                        <Alert>
                                            <AlertCircle className="h-4 w-4" />
                                            <AlertDescription>
                                                Next CHOP deduction: {new Date(loan.gracePeriodEnd).toLocaleDateString()}
                                            </AlertDescription>
                                        </Alert>
                                    ) : null}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    
                    {/* Deduction Schedule Download */}
                    <div className="mt-6 flex justify-center">
                        <Button 
                            onClick={downloadDeductionSchedule}
                            disabled={downloadingSchedule}
                            className="flex items-center gap-2"
                        >
                            <Download className="h-4 w-4" />
                            {downloadingSchedule ? 'Downloading...' : 'Download Deduction Schedule'}
                        </Button>
                    </div>
                </div>
            )}

            {/* Help Text */}
            <Card className="bg-blue-50 dark:bg-blue-900/20">
                <CardContent className="pt-6">
                    <h4 className="font-semibold mb-2">How Automatic Deductions Work</h4>
                    <ul className="text-sm space-y-2 text-gray-700 dark:text-gray-300">
                        <li>✓ Whenever you pay fees to the school, we automatically deduct your loan balance</li>
                        <li>✓ If you borrow in Semester X, you must pay by the start of Semester X+1</li>
                        <li>✓ After that date, any school payments will continue to be deducted until loan is cleared</li>
                        <li>✓ If you have overdue loans, you cannot request new loans until cleared</li>
                    </ul>
                </CardContent>
            </Card>
        </div>
    );
};
