import { useState, useEffect, createElement } from 'react';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import axios from 'axios';
import { API_BASE } from '../../api';

interface PaymentPINPromptProps {
  phoneNumber: string;
  amount: number;
  provider: 'mtn' | 'airtel';
  onSuccess: () => void;
  onCancel: () => void;
  onNoPinSet?: () => void; // Callback when user hasn't set a PIN
}

export function PaymentPINPrompt({ phoneNumber, amount, provider, onSuccess, onCancel, onNoPinSet }: PaymentPINPromptProps) {
  const [pin, setPin] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes countdown
  const [checkingPin, setCheckingPin] = useState(true);

  // Check if user has PIN set up on mount
  useEffect(() => {
    checkPinStatus();
  }, []);

  const checkPinStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE}/pin/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.data.hasPin) {
        // User hasn't set a PIN yet
        if (onNoPinSet) {
          onNoPinSet();
        } else {
          setError('Please set up your payment PIN in your profile first');
        }
      }
      setCheckingPin(false);
    } catch (err: any) {
      console.error('Error checking PIN status:', err);
      setError('Failed to verify PIN setup. Please try again.');
      setCheckingPin(false);
    }
  };

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) {
      setError('Request timed out. Please try again.');
      return;
    }
    const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft]);

  const handleVerifyPIN = async () => {
    if (pin.length !== 4) {
      setError('PIN must be 4 digits');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      
      // Verify PIN with backend
      await axios.post(`${API_BASE}/pin/verify`, {
        pin
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // PIN is valid - simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Success
      setIsSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err: any) {
      console.error('PIN verification error:', err);
      setError(err.response?.data?.error || 'Failed to verify PIN. Please try again.');
      setIsVerifying(false);
      setPin(''); // Clear PIN input
    }
  };

  const handlePINInput = (value: string) => {
    // Only allow digits, max 4
    const numericValue = value.replace(/\D/g, '').slice(0, 4);
    setPin(numericValue);
    setError('');
  };

  const getProviderName = () => provider === 'mtn' ? 'MTN Mobile Money' : 'Airtel Money';

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (checkingPin) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="max-w-md w-full mx-4 bg-white">
          <CardContent className="pt-6 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-sm text-gray-600">Checking PIN setup...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="max-w-md w-full mx-4 bg-white">
          <CardContent className="pt-6 text-center">
            <div className="mb-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
            </div>
            <h2 className="text-xl font-semibold mb-2">Payment Successful!</h2>
            <p className="text-sm text-gray-600 mb-4">
              UGX {amount.toLocaleString()} has been deducted from your {getProviderName()} account.
            </p>
            <p className="text-xs text-gray-500">Redirecting...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="max-w-md w-full mx-4 bg-white">
        <CardHeader className="text-center">
          <CardTitle>Confirm Payment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Provider Info */}
          <div className={provider === 'mtn' ? "p-4 bg-yellow-50 rounded-lg border border-yellow-200" : "p-4 bg-red-50 rounded-lg border border-red-200"}>
            <p className="text-xs text-gray-600">Provider</p>
            <p className="text-lg font-semibold text-gray-900">{getProviderName()}</p>
          </div>

          {/* Transaction Details */}
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Access Number</span>
              <span className="font-medium">{phoneNumber.toUpperCase()}</span>
            </div>
            <div className="flex justify-between text-sm border-t border-gray-200 pt-3">
              <span className="text-gray-600">Amount</span>
              <span className="font-semibold text-lg">UGX {amount.toLocaleString()}</span>
            </div>
          </div>

          {/* PIN Input */}
          <div>
            <label className="block text-sm font-medium mb-3">Enter your payment PIN</label>
            <div className="flex gap-2 justify-center mb-2">
              {[0, 1, 2, 3].map((i) =>
                createElement('input' as any, {
                  key: `pin-${i}`,
                  type: 'password',
                  inputMode: 'numeric',
                  value: (pin[i] || '') as any,
                  onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                    const digit = e.currentTarget.value.replace(/\D/g, '').slice(0, 1);
                    const digits = pin.split('');
                    digits[i] = digit;
                    handlePINInput(digits.join(''));
                    
                    // Auto-focus next input
                    if (digit && i < 3) {
                      const nextInput = e.currentTarget.nextElementSibling as HTMLInputElement;
                      if (nextInput) nextInput.focus();
                    }
                  },
                  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
                    // Auto-focus previous input on backspace
                    if (e.key === 'Backspace' && !pin[i] && i > 0) {
                      const prevInput = (e.currentTarget as HTMLInputElement).previousElementSibling as HTMLInputElement;
                      if (prevInput) prevInput.focus();
                    }
                  },
                  disabled: isVerifying,
                  className: 'w-14 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:bg-gray-100',
                  placeholder: '•',
                } as any)
              )}
            </div>
            <p className="text-xs text-gray-500 text-center">4-digit payment PIN (set in your profile)</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Timer */}
          <div className="text-center">
            <p className="text-xs text-gray-500">
              Request expires in <span className="font-mono font-semibold">{formatTime(timeLeft)}</span>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isVerifying}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleVerifyPIN}
              disabled={pin.length !== 4 || isVerifying}
              className="flex-1"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Confirm Payment'
              )}
            </Button>
          </div>

          <p className="text-xs text-center text-gray-500">
            Your PIN is never stored and only used for this transaction.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
