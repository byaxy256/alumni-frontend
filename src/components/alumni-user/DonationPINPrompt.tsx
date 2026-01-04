import { useState, useEffect } from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';

interface DonationPINPromptProps {
  phoneNumber: string;
  amount: number;
  provider: 'mtn' | 'airtel';
  cause: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function DonationPINPrompt({ phoneNumber, amount, provider, cause, onSuccess, onCancel }: DonationPINPromptProps) {
  const [pin, setPin] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes countdown

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
      // Simulate PIN verification
      await new Promise(resolve => setTimeout(resolve, 1500));

      if (!/^\d{4}$/.test(pin)) {
        setError('Invalid PIN format');
        setIsVerifying(false);
        return;
      }

      setIsSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err) {
      setError('Failed to verify PIN. Please try again.');
      setIsVerifying(false);
    }
  };

  const handlePINInput = (value: string) => {
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
            <h2 className="text-xl font-semibold mb-2">Donation Successful!</h2>
            <p className="text-sm text-gray-600 mb-2">
              UGX {amount.toLocaleString()} has been donated from your {getProviderName()} account.
            </p>
            <p className="text-sm text-gray-600 mb-4">
              Cause: {cause}
            </p>
            <p className="text-xs text-gray-500">Thank you for your contribution!</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="max-w-md w-full mx-4 bg-white">
        <CardContent className="p-6">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold mb-2">Enter Your PIN</h2>
            <p className="text-sm text-gray-600">
              A payment request for <strong>UGX {amount.toLocaleString()}</strong> has been sent to your {getProviderName()} number ending in <strong>{phoneNumber.slice(-4)}</strong>
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Time remaining: {formatTime(timeLeft)}
            </p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Mobile Money PIN</label>
            <input
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={(e) => handlePINInput(e.target.value)}
              maxLength={4}
              className="w-full text-center text-2xl tracking-widest border-2 border-gray-300 rounded-lg p-4 focus:border-primary focus:outline-none"
              placeholder="••••"
              autoFocus
            />
            {error && (
              <div className="mt-2 flex items-center gap-2 text-red-600 text-sm">
                <span>{error}</span>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleVerifyPIN}
              className="w-full"
              disabled={pin.length !== 4 || isVerifying}
            >
              {isVerifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Confirm Payment'
              )}
            </Button>
            <Button
              onClick={onCancel}
              variant="outline"
              className="w-full"
              disabled={isVerifying}
            >
              Cancel
            </Button>
          </div>

          <div className="mt-4 text-xs text-gray-500 text-center">
            <p>Please check your phone for the payment prompt and enter your {getProviderName()} PIN above.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
