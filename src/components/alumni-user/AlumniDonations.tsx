import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import type { User } from '../../App';
import { ArrowLeft, Heart, TrendingUp, Users, Smartphone, Building2, CreditCard } from 'lucide-react';
import { useState, useEffect } from 'react';
import { API_BASE } from '../../api';
import { PaymentPINPrompt } from '../student/PaymentPINPrompt';

interface AlumniDonationsProps {
  user: User;
  onBack: () => void;
}

interface DonationStats {
  totalDonated: number;
  studentsHelped: number;
  currentYear: number;
}

interface Cause {
  id: string;
  name: string;
  raised: number;
  goal: number;
}

export function AlumniDonations({ user, onBack }: AlumniDonationsProps) {
  const [amount, setAmount] = useState('');
  const [selectedCause, setSelectedCause] = useState('');
  const [donationStats, setDonationStats] = useState<DonationStats>({
    totalDonated: 0,
    studentsHelped: 0,
    currentYear: 0,
  });
  const [causes, setCauses] = useState<Cause[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Payment flow states
  const [showPaymentPage, setShowPaymentPage] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'mtn' | 'airtel' | 'bank'>('mtn');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showPINPrompt, setShowPINPrompt] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchDonationStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/donations/stats`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setDonationStats(data);
        }
      } catch (error) {
        console.error('Failed to fetch donation stats:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchCauses = async () => {
      try {
        const response = await fetch(`${API_BASE}/donations/causes`);
        if (response.ok) {
          const data = await response.json();
          setCauses(data);
        }
      } catch (error) {
        console.error('Failed to fetch causes:', error);
      }
    };

    fetchDonationStats();
    fetchCauses();
  }, []);

  const sanitizePhoneNumber = (value: string) => {
    return value.replace(/\D/g, '').slice(0, 10);
  };

  const handleProceedToPayment = async () => {
    if (!amount) return;
    
    const donationAmount = parseInt(amount);
    const causeName = causes.find(c => c.id === selectedCause)?.name || 'General Fund';
    
    if (paymentMethod === 'bank') {
      // For bank transfer, just save the donation record and show instructions
      try {
        setIsSubmitting(true);
        const token = localStorage.getItem('token');
        const txRef = `DON-${user.uid}-${Date.now()}`;
        
        await fetch(`${API_BASE}/donations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            amount: donationAmount,
            cause: causeName,
            transaction_ref: txRef,
            payment_method: 'bank_transfer',
          }),
        });

        alert(
          `Bank Transfer Details:\n\n` +
          `Account Name: UCU Alumni Fund\n` +
          `Account Number: 1234567890\n` +
          `Bank: Stanbic Bank Uganda\n\n` +
          `Amount: UGX ${donationAmount.toLocaleString()}\n` +
          `Reference: ${txRef}\n\n` +
          `Please use the reference number in your transfer.`
        );
        
        setShowPaymentPage(false);
        setAmount('');
        setSelectedCause('');
        window.location.reload();
      } catch (error) {
        console.error('Failed to process donation:', error);
        alert('Failed to process donation. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // For mobile money, validate phone and show PIN prompt
    if (!phoneNumber || phoneNumber.length < 10) {
      alert('Please enter a valid phone number');
      return;
    }

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('token');
      const txRef = `DON-${user.uid}-${Date.now()}`;
      
      // Save donation record
      await fetch(`${API_BASE}/donations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: donationAmount,
          cause: causeName,
          transaction_ref: txRef,
          payment_method: paymentMethod === 'mtn' ? 'mtn_momo' : 'airtel_money',
        }),
      });

      setIsSubmitting(false);
      setShowPINPrompt(true);
    } catch (error) {
      console.error('Failed to process donation:', error);
      alert('Failed to process donation. Please try again.');
      setIsSubmitting(false);
    }
  };

  // If showing payment page, render payment UI
  if (showPaymentPage) {
    return (
      <>
        <div className="min-h-screen bg-gray-50 pb-20 md:pb-6">
          <div className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10">
            <div className="max-w-4xl mx-auto flex items-center gap-4">
              <button onClick={() => setShowPaymentPage(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-primary">Complete Donation Payment</h1>
            </div>
          </div>

          <div className="max-w-2xl mx-auto p-6 space-y-6">
            {/* Payment Summary */}
            <Card className="p-6">
              <h3 className="text-lg mb-4">Payment Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Cause:</span>
                  <span className="font-medium">{causes.find(c => c.id === selectedCause)?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-bold text-lg">UGX {parseInt(amount).toLocaleString()}</span>
                </div>
              </div>
            </Card>

            {/* Payment Method Selection */}
            <Card className="p-6">
              <h3 className="text-lg mb-4">Select Payment Method</h3>
              <RadioGroup value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)} className="space-y-3">
                <Card className={`cursor-pointer transition-all ${paymentMethod === 'mtn' ? 'border-2 border-yellow-500 shadow-md' : 'hover:border-gray-300'}`}>
                  <CardContent className="p-4 flex items-center">
                    <RadioGroupItem value="mtn" id="mtn" className="mr-3" />
                    <Smartphone className="w-5 h-5 mr-2 text-yellow-500" />
                    <Label htmlFor="mtn" className="cursor-pointer flex-1">MTN Mobile Money</Label>
                  </CardContent>
                </Card>
                
                <Card className={`cursor-pointer transition-all ${paymentMethod === 'airtel' ? 'border-2 border-red-500 shadow-md' : 'hover:border-gray-300'}`}>
                  <CardContent className="p-4 flex items-center">
                    <RadioGroupItem value="airtel" id="airtel" className="mr-3" />
                    <Smartphone className="w-5 h-5 mr-2 text-red-500" />
                    <Label htmlFor="airtel" className="cursor-pointer flex-1">Airtel Money</Label>
                  </CardContent>
                </Card>
                
                <Card className={`cursor-pointer transition-all ${paymentMethod === 'bank' ? 'border-2 border-blue-500 shadow-md' : 'hover:border-gray-300'}`}>
                  <CardContent className="p-4 flex items-center">
                    <RadioGroupItem value="bank" id="bank" className="mr-3" />
                    <Building2 className="w-5 h-5 mr-2 text-blue-500" />
                    <Label htmlFor="bank" className="cursor-pointer flex-1">Bank Transfer</Label>
                  </CardContent>
                </Card>
              </RadioGroup>
            </Card>

            {/* Phone Number Input for Mobile Money */}
            {(paymentMethod === 'mtn' || paymentMethod === 'airtel') && (
              <Card className="p-6">
                <Label htmlFor="phone" className="mb-2 block">Mobile Money Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(sanitizePhoneNumber(e.target.value))}
                  placeholder="07XXXXXXXX"
                  maxLength={10}
                  className="text-lg"
                />
                <p className="text-xs text-gray-500 mt-2">Enter your {paymentMethod === 'mtn' ? 'MTN' : 'Airtel'} number</p>
              </Card>
            )}

            {/* Bank Transfer Instructions */}
            {paymentMethod === 'bank' && (
              <Card className="p-6 bg-blue-50 border-blue-200">
                <h4 className="font-semibold mb-3">Bank Transfer Details</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Account Name:</strong> UCU Alumni Fund</p>
                  <p><strong>Account Number:</strong> 1234567890</p>
                  <p><strong>Bank:</strong> Stanbic Bank Uganda</p>
                  <p className="text-xs text-gray-600 mt-3">Use the generated reference number for your transfer</p>
                </div>
              </Card>
            )}

            <Button 
              onClick={handleProceedToPayment}
              className="w-full" 
              size="lg"
              disabled={isSubmitting || (paymentMethod !== 'bank' && !phoneNumber)}
            >
              {isSubmitting ? 'Processing...' : 'Proceed to Payment'}
            </Button>
          </div>
        </div>

        {/* PIN Prompt Modal */}
        {showPINPrompt && (
          <PaymentPINPrompt
            phoneNumber={phoneNumber}
            amount={parseInt(amount)}
            provider={paymentMethod as 'mtn' | 'airtel'}
            onSuccess={() => {
              setShowPINPrompt(false);
              setShowPaymentPage(false);
              setAmount('');
              setSelectedCause('');
              setPhoneNumber('');
              alert('Thank you for your donation! Your payment was successful.');
              window.location.reload();
            }}
            onCancel={() => {
              setShowPINPrompt(false);
            }}
          />
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-6">
      <div className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-primary">Make a Donation</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Impact Stats */}
        <Card className="p-6 bg-gradient-to-br from-primary to-[#1a4d7a] text-white">
          <div className="flex items-center gap-2 mb-4">
            <Heart className="w-6 h-6" />
            <h2 className="text-xl">Your Giving Impact</h2>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm opacity-80">Total Donated</p>
              <p className="text-2xl mt-1">UGX {donationStats.totalDonated.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm opacity-80">Students Helped</p>
              <p className="text-2xl mt-1">{donationStats.studentsHelped}</p>
            </div>
            <div>
              <p className="text-sm opacity-80">This Year</p>
              <p className="text-2xl mt-1">UGX {donationStats.currentYear.toLocaleString()}</p>
            </div>
          </div>
        </Card>

        {/* Donation Causes */}
        <div>
          <h3 className="text-lg mb-4">Choose a Cause</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {causes.map((cause) => (
              <Card
                key={cause.id}
                className={`p-5 cursor-pointer transition-all ${
                  selectedCause === cause.id
                    ? 'border-primary shadow-lg'
                    : 'hover:shadow-md'
                }`}
                onClick={() => setSelectedCause(cause.id)}
              >
                <h4 className="mb-3">{cause.name}</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Raised</span>
                    <span>UGX {(cause.raised / 1000000).toFixed(1)}M</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-accent h-2 rounded-full"
                      style={{ width: `${(cause.raised / cause.goal) * 100}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-600 text-right">
                    Goal: UGX {(cause.goal / 1000000).toFixed(1)}M
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Donation Amount */}
        {selectedCause && (
          <Card className="p-6">
            <h3 className="text-lg mb-4">Donation Amount</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {['100000', '500000', '1000000'].map((preset) => (
                  <Button
                    key={preset}
                    variant={amount === preset ? 'default' : 'outline'}
                    onClick={() => setAmount(preset)}
                  >
                    UGX {parseInt(preset) / 1000}K
                  </Button>
                ))}
              </div>
              <div>
                <Label htmlFor="custom-amount">Custom Amount (UGX)</Label>
                <Input
                  id="custom-amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="mt-1"
                />
              </div>

              <Button 
                className="w-full" 
                size="lg" 
                disabled={!amount}
                onClick={() => {
                  if (!amount) return;
                  setShowPaymentPage(true);
                }}
              >
                <Heart className="w-4 h-4 mr-2" />
                Donate UGX {amount ? parseInt(amount).toLocaleString() : '0'}
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
