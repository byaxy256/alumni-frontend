import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import type { User } from '../../App';
import { ArrowLeft, Heart, TrendingUp, Users } from 'lucide-react';
import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../api';

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

  useEffect(() => {
    const fetchDonationStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/donations/stats`, {
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
        const response = await fetch(`${API_BASE_URL}/donations/causes`);
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
                onClick={async () => {
                  if (!amount) return;
                  const donationAmount = parseInt(amount);
                  const causeName = causes.find(c => c.id === selectedCause)?.name || 'General Fund';
                  const txRef = `DON-${user.uid}-${Date.now()}`;
                  
                  try {
                    // Save donation record first
                    const token = localStorage.getItem('token');
                    const saveResponse = await fetch(`${API_BASE_URL}/donations`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                      },
                      body: JSON.stringify({
                        amount: donationAmount,
                        cause: causeName,
                        transaction_ref: txRef,
                        payment_method: 'flutterwave',
                      }),
                    });

                    if (!saveResponse.ok) {
                      throw new Error('Failed to save donation record');
                    }

                    // Use FlutterWave Inline (better than hosted checkout)
                    // @ts-ignore
                    if (window.FlutterwaveCheckout) {
                      // @ts-ignore
                      window.FlutterwaveCheckout({
                        public_key: "FLWPUBK-xxxxx", // Replace with your actual public key
                        tx_ref: txRef,
                        amount: donationAmount,
                        currency: "UGX",
                        payment_options: "mobilemoneyuganda,card,ussd",
                        customer: {
                          email: user.email,
                          name: user.full_name || user.email,
                        },
                        customizations: {
                          title: "UCU Alumni Circle",
                          description: `Donation for ${causeName}`,
                          logo: "https://alumni-frontend-seven.vercel.app/logo.png",
                        },
                        callback: function (data: any) {
                          console.log('Payment callback:', data);
                          if (data.status === 'successful') {
                            alert('Thank you for your donation! Your payment was successful.');
                            window.location.reload();
                          }
                        },
                        onclose: function () {
                          console.log('Payment modal closed');
                        }
                      });
                    } else {
                      // Fallback to simple payment page
                      alert(`Donation Amount: UGX ${donationAmount.toLocaleString()}\nCause: ${causeName}\n\nFlutterwave integration requires the Flutterwave script. Please contact support.`);
                    }
                  } catch (error) {
                    console.error('Failed to create donation record:', error);
                    alert('Failed to process donation. Please try again.');
                  }
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
