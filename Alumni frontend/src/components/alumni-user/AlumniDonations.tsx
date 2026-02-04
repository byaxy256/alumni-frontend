import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import type { User } from '../../App';
import { ArrowLeft, Heart, Smartphone, Building2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { API_BASE } from '../../api';
import { PaymentPINPrompt } from '../student/PaymentPINPrompt';

interface AlumniDonationsProps {
  user: User;
  onBack: () => void;
  onNavigate?: (screen: string) => void;
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

interface MyDonation {
  _id: string;
  amount: number;
  cause: string;
  transaction_ref: string;
  payment_status: string;
  payment_method: string;
  created_at: string;
}

export function AlumniDonations({ user, onBack, onNavigate }: AlumniDonationsProps) {
  const [amount, setAmount] = useState('');
  const [selectedCause, setSelectedCause] = useState('');
  const [donationStats, setDonationStats] = useState<DonationStats>({
    totalDonated: 0,
    studentsHelped: 0,
    currentYear: 0,
  });
  const [causes, setCauses] = useState<Cause[]>([]);
  const [myDonations, setMyDonations] = useState<MyDonation[]>([]);
  const [, setLoading] = useState(true);
  
  // Payment flow states
  const [showPaymentPage, setShowPaymentPage] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'mtn' | 'airtel' | 'bank'>('mtn');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showPINPrompt, setShowPINPrompt] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingTransactionRef, setPendingTransactionRef] = useState<string | null>(null);
  const [showPinSetupPrompt, setShowPinSetupPrompt] = useState(false);

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

  const fetchMyDonations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/donations/my-donations`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        // Normalize and keep only our supported payment methods
        const filteredDonations = (data || []).map((donation: MyDonation) => {
          const method = donation.payment_method?.toLowerCase() || '';
          const normalizedMethod = method === 'mtn_momo' ? 'mtn' : method === 'airtel_money' ? 'airtel' : method === 'bank_transfer' ? 'bank' : method;
          return { ...donation, payment_method: normalizedMethod } as MyDonation;
        }).filter((donation: MyDonation) => {
          const method = donation.payment_method?.toLowerCase() || '';
          return method === 'mtn' || method === 'airtel' || method === 'bank';
        });
        setMyDonations(filteredDonations);
      }
    } catch (error) {
      console.error('Failed to fetch my donations:', error);
    }
  };

  useEffect(() => {
    fetchDonationStats();
    fetchCauses();
    fetchMyDonations();
    setLoading(false);
  }, []);

  // Keep cause totals fresh while this screen is open
  useEffect(() => {
    const id = window.setInterval(() => {
      fetchCauses();
    }, 15000);

    return () => {
      window.clearInterval(id);
    };
  }, []);

  const sanitizePhoneNumber = (value: string) => {
    return value.replace(/\D/g, '').slice(0, 10);
  };

  const handleProceedToPayment = async () => {
    if (!amount) return;

    if (!selectedCause) {
      alert('Please select a cause');
      return;
    }
    
    const donationAmount = parseInt(amount);
    const causeName = causes.find(c => c.id === selectedCause)?.name || 'General Fund';
    
    if (paymentMethod === 'bank') {
      // For bank transfer, just save the donation record and show instructions
      try {
        setIsSubmitting(true);
        const token = localStorage.getItem('token');
        const txRef = `DON-${user.uid}-${Date.now()}`;

        const createRes = await fetch(`${API_BASE}/donations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            amount: donationAmount,
            cause: causeName,
            transaction_ref: txRef,
            payment_method: 'bank',
          }),
        });

        if (!createRes.ok) {
          const msg = await createRes.text();
          throw new Error(msg || 'Failed to create donation record');
        }

        alert(
          `Bank Transfer Details:\n\n` +
          `Account Name: UCU Alumni Fund\n` +
          `Account Number: 1234567890\n` +
          `Bank: Stanbic Bank Uganda\n\n` +
          `Amount: UGX ${donationAmount.toLocaleString()}\n` +
          `Reference: ${txRef}\n\n` +
          `Please use the reference number in your transfer.`
        );
        
        // Refresh data
        await fetchDonationStats();
        await fetchCauses();
        await fetchMyDonations();
        
        setShowPaymentPage(false);
        setAmount('');
        setSelectedCause('');
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
      const createRes = await fetch(`${API_BASE}/donations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: donationAmount,
          cause: causeName,
          transaction_ref: txRef,
          payment_method: paymentMethod === 'mtn' ? 'mtn' : 'airtel',
        }),
      });

      if (!createRes.ok) {
        const msg = await createRes.text();
        throw new Error(msg || 'Failed to create donation record');
      }

      // Store the transaction ref for confirmation later
      setPendingTransactionRef(txRef);
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

        {/* PIN Setup Required Modal */}
        {showPinSetupPrompt && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-xl font-semibold mb-4">Payment PIN Required</h3>
              <p className="text-gray-600 mb-6">
                You need to set up a payment PIN before making donations. Please go to your profile to set up your PIN.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowPinSetupPrompt(false);
                    setShowPaymentPage(false);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowPinSetupPrompt(false);
                    setShowPaymentPage(false);
                    // Prefer navigation callback if provided
                    if (typeof (window as any).onNavigate === 'function') {
                      try { (window as any).onNavigate('profile'); return; } catch {};
                    }
                    if (onNavigate) { onNavigate('profile'); return; }
                    onBack();
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Go to Profile
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PIN Prompt Modal */}
        {showPINPrompt && (
          <PaymentPINPrompt
            phoneNumber={phoneNumber}
            amount={parseInt(amount)}
            provider={paymentMethod as 'mtn' | 'airtel'}
            onNoPinSet={() => {
              setShowPINPrompt(false);
              setShowPinSetupPrompt(true);
            }}
            onSuccess={async () => {
              try {
                // Confirm the donation payment
                if (pendingTransactionRef) {
                  const token = localStorage.getItem('token');
                  const confirmRes = await fetch(`${API_BASE}/donations/confirm`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                      transaction_ref: pendingTransactionRef,
                    }),
                  });

                  if (!confirmRes.ok) {
                    const msg = await confirmRes.text();
                    throw new Error(msg || 'Failed to confirm donation');
                  }

                  // Optimistically update the selected cause raised amount immediately
                  const donationAmount = parseInt(amount);
                  const causeName = causes.find(c => c.id === selectedCause)?.name;
                  if (causeName && Number.isFinite(donationAmount)) {
                    setCauses(prev =>
                      prev.map(c => (c.name === causeName ? { ...c, raised: (c.raised || 0) + donationAmount } : c))
                    );
                  }
                }
              } catch (error) {
                console.error('Failed to confirm donation:', error);
                alert('Payment succeeded, but we could not confirm the donation on the server. Please try again or check your connection.');
                return;
              }

              setShowPINPrompt(false);
              setShowPaymentPage(false);
              setPhoneNumber('');
              setPendingTransactionRef(null);
              
              // Refresh the donation stats and causes
              await fetchDonationStats();
              await fetchCauses();
              await fetchMyDonations();
              
              // Reset form
              setAmount('');
              setSelectedCause('');
              
              alert('Thank you for your donation! Your payment was successful.');
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

        {/* My Donations History */}
        {myDonations.length > 0 && (
          <div>
            <h3 className="text-lg mb-4">My Donations</h3>
            <Card className="p-6">
              <div className="space-y-3">
                {myDonations.map((donation) => {
                  // Get payment method display name
                  const paymentMethodMap: Record<string, string> = {
                    'mtn': 'MTN Mobile Money',
                    'airtel': 'Airtel Money',
                    'bank': 'Bank Transfer',
                  };
                  const paymentMethodDisplay = paymentMethodMap[donation.payment_method?.toLowerCase() || ''] || 'Mobile Money';

                  return (
                    <div key={donation._id} className="flex justify-between items-start py-3 border-b last:border-b-0">
                      <div className="flex-1">
                        <p className="font-medium">{donation.cause}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(donation.created_at).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{paymentMethodDisplay}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">UGX {donation.amount.toLocaleString()}</p>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          donation.payment_status === 'completed' 
                            ? 'bg-green-100 text-green-700' 
                            : donation.payment_status === 'pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {donation.payment_status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
