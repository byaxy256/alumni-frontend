import { useEffect, useState } from 'react';
import { ArrowLeft, Heart, Smartphone, Building2, Loader2, Calendar, CheckCircle2 } from 'lucide-react';
import type { User } from '../../App';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { toast } from 'sonner';
import { API_BASE } from '../../api';
import { DonationPINPrompt } from './DonationPINPrompt';

interface AlumniDonationsProps {
	user: User;
	onBack: () => void;
}

interface DonationStats {
	totalDonated: number;
	studentsHelped: number;
	currentYear: number;
	donationCount: number;
}

interface DonationItem {
	_id?: string;
	transaction_ref?: string;
	amount: number;
	cause: string;
	created_at: string;
	payment_status: string;
	payment_method?: string;
}

interface DonationCause {
	id: string;
	name: string;
	raised: number;
	goal: number;
}

const formatUGX = (value: number) => `UGX ${Number(value || 0).toLocaleString()}`;

const sanitizeAccessNumber = (value: string) => {
	const upper = value.toUpperCase();
	const letter = upper[0];
	if (letter !== 'A' && letter !== 'B') return '';
	const digits = upper.slice(1).replace(/\D/g, '').slice(0, 5);
	return `${letter}${digits}`;
};

export function AlumniDonations({ user, onBack }: AlumniDonationsProps) {
	const [donationStats, setDonationStats] = useState<DonationStats | null>(null);
	const [donations, setDonations] = useState<DonationItem[]>([]);
	const [causes, setCauses] = useState<DonationCause[]>([]);
	const [selectedCause, setSelectedCause] = useState<string>('');
	const [amount, setAmount] = useState<string>('');
	const [paymentMethod, setPaymentMethod] = useState<'mtn' | 'airtel' | 'bank'>('mtn');
	const [phoneNumber, setPhoneNumber] = useState('');
	const [showPaymentPage, setShowPaymentPage] = useState(false);
	const [showPINPrompt, setShowPINPrompt] = useState(false);
	const [pendingTransactionId, setPendingTransactionId] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [loading, setLoading] = useState(true);

	const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';

	const fetchStats = async () => {
		if (!token) return;
		try {
			const res = await fetch(`${API_BASE}/donations/stats`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			if (res.ok) {
				const data = await res.json();
				setDonationStats(data);
			}
		} catch (err) {
			console.error('fetchStats error', err);
		}
	};

	const fetchCauses = async () => {
		try {
			const res = await fetch(`${API_BASE}/donations/causes`);
			if (res.ok) {
				const data = await res.json();
				setCauses(data);
				if (!selectedCause && data.length > 0) setSelectedCause(data[0].id);
			} else {
				setCauses([]);
			}
		} catch (err) {
			console.error('fetchCauses error', err);
			setCauses([]);
		}
	};

	const fetchHistory = async () => {
		if (!token) return;
		try {
			const res = await fetch(`${API_BASE}/donations/my-donations`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			if (res.ok) {
				const data = await res.json();
				setDonations(data);
			} else {
				setDonations([]);
			}
		} catch (err) {
			console.error('fetchHistory error', err);
			setDonations([]);
		}
	};

	useEffect(() => {
		const load = async () => {
			setLoading(true);
			await Promise.all([fetchStats(), fetchCauses(), fetchHistory()]);
			setLoading(false);
		};
		load();
	}, []);

	const resetForm = () => {
		setAmount('');
		setPhoneNumber('');
		setSelectedCause(causes[0]?.id || '');
		setPendingTransactionId(null);
		setShowPaymentPage(false);
		setShowPINPrompt(false);
	};

	const handleSubmitDonation = async () => {
		if (!amount || Number(amount) <= 0) {
			toast.error('Enter a valid amount');
			return;
		}
		if (!selectedCause) {
			toast.error('Select a cause');
			return;
		}
		const accessPattern = /^[AB]\d{5}$/;
		if (paymentMethod !== 'bank' && !accessPattern.test(phoneNumber)) {
			toast.error('Access number must be A12345 or B12345 format.');
			return;
		}

		const donationAmount = Number(amount);
		const causeName = causes.find((c) => c.id === selectedCause)?.name || 'General Fund';
		const txRef = `DON-${user.uid}-${Date.now()}`;

		if (paymentMethod === 'bank') {
			try {
				const res = await fetch(`${API_BASE}/donations`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({
						amount: donationAmount,
						cause: causeName,
						transaction_ref: txRef,
						payment_method: 'bank',
					}),
				});
				if (!res.ok) throw new Error('Failed to record bank donation');
				toast.success('Donation recorded! Please complete the bank transfer.');
				resetForm();
				fetchStats();
				fetchHistory();
			} catch (err: any) {
				toast.error(err?.message || 'Failed to record donation');
			}
			return;
		}

		setIsSubmitting(true);
		try {
			const res = await fetch(`${API_BASE}/donations`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					amount: donationAmount,
					cause: causeName,
					transaction_ref: txRef,
					payment_method: paymentMethod,
				}),
			});

			const data = await res.json().catch(() => ({}));
			if (!res.ok) {
				throw new Error(data?.error || 'Failed to initiate donation');
			}

			setPendingTransactionId(data._id || txRef);
			setShowPINPrompt(true);
		} catch (err: any) {
			toast.error(err?.message || 'Failed to initiate donation');
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleConfirmSuccess = async () => {
		try {
			if (!pendingTransactionId) {
				toast.error('Missing transaction ID');
				setShowPINPrompt(false);
				return;
			}

			const res = await fetch(`${API_BASE}/donations/webhook`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					tx_ref: pendingTransactionId,
					status: 'successful',
					amount: Number(amount),
				}),
			});

			if (!res.ok) throw new Error('Failed to confirm donation');

			toast.success('Thank you for your donation!');
			resetForm();
			await Promise.all([fetchStats(), fetchHistory(), fetchCauses()]);
		} catch (err: any) {
			toast.error(err?.message || 'Failed to confirm donation');
			setShowPINPrompt(false);
		}
	};

	return (
		<div className="min-h-screen bg-gray-50 pb-16 md:pb-6">
			<div className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10">
				<div className="max-w-5xl mx-auto flex items-center gap-4">
					<button onClick={showPaymentPage ? () => setShowPaymentPage(false) : onBack} className="p-2 hover:bg-gray-100 rounded-lg" aria-label="Go back">
						<ArrowLeft className="w-5 h-5" />
						<span className="sr-only">Go back</span>
					</button>
					<h1 className="text-primary">{showPaymentPage ? 'Make Donation' : 'Donations'}</h1>
				</div>
			</div>

			{!showPaymentPage ? (
				<div className="max-w-5xl mx-auto p-6 space-y-6">
				<Card className="p-6 bg-gradient-to-br from-[#c79b2d] to-[#7a5a13] text-white">
					<div className="flex flex-wrap items-center justify-between gap-4">
						<div>
							<p className="text-sm opacity-90">Total Given</p>
							<p className="text-3xl font-semibold">
								{formatUGX(donationStats?.totalDonated || 0)}
							</p>
							<p className="text-xs opacity-80 mt-1">
								{donationStats?.donationCount || 0} donations | {donationStats?.studentsHelped || 0} students helped
							</p>
						</div>
						<div className="text-right">
							<p className="text-sm opacity-90">This Year</p>
							<p className="text-xl font-semibold">{formatUGX(donationStats?.currentYear || 0)}</p>
						</div>
					</div>
				</Card>

				<div className="grid md:grid-cols-2 gap-6 items-start">
					<div className="space-y-4">
						<h3 className="text-lg mb-2">Choose a Cause</h3>
						<div className="grid md:grid-cols-2 gap-4">
							{causes.map((cause) => (
								<Card
									key={cause.id}
									className={`p-5 cursor-pointer transition-all ${selectedCause === cause.id ? 'border-primary shadow-lg' : 'hover:shadow-md'}`}
									onClick={() => setSelectedCause(cause.id)}
								>
									<h4 className="mb-2 font-semibold">{cause.name}</h4>
									<div className="space-y-2 text-sm">
										<div className="flex justify-between">
											<span className="text-gray-600">Raised</span>
											<span>{formatUGX(cause.raised)}</span>
										</div>
										<div className="w-full bg-gray-200 rounded-full h-2">
											<div
												className="bg-accent h-2 rounded-full"
												style={{ width: `${Math.min(100, (cause.raised / cause.goal) * 100)}%` }}
											/>
										</div>
										<div className="text-xs text-gray-600 text-right">Goal: {formatUGX(cause.goal)}</div>
									</div>
								</Card>
							))}
							{causes.length === 0 && !loading && (
								<div className="text-sm text-gray-600">No causes available right now.</div>
							)}
						</div>
					</div>

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
										UGX {parseInt(preset, 10) / 1000}K
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
								disabled={!amount || !selectedCause}
								onClick={() => setShowPaymentPage(true)}
							>
								<Heart className="w-4 h-4 mr-2" />
								Donate {amount ? formatUGX(Number(amount)) : ''}
							</Button>
						</div>
					</Card>
				</div>

				<div className="space-y-3">
					<h3 className="text-lg">My Donations</h3>
					{donations.length === 0 && !loading && (
						<Card className="p-5 text-sm text-gray-600">No donations recorded yet.</Card>
					)}
					{donations.map((donation) => {
						const id = donation._id || donation.transaction_ref;
						return (
							<Card key={id} className="p-5">
								<div className="flex items-start justify-between gap-4">
									<div className="flex gap-3 items-start">
										<div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
											<CheckCircle2 className="w-5 h-5 text-green-600" />
										</div>
										<div>
											<p className="font-medium">{donation.cause}</p>
											<div className="flex items-center gap-3 text-xs text-gray-600 mt-1">
												<span className="flex items-center gap-1">
													<Calendar className="w-3 h-3" />
													{new Date(donation.created_at).toLocaleDateString()}
												</span>
												<span>•</span>
												<span className="capitalize">{donation.payment_method || 'mobile money'}</span>
											</div>
											<p className="text-xs text-gray-500 mt-1 capitalize">Status: {donation.payment_status}</p>
										</div>
									</div>
									<p className="font-semibold">{formatUGX(donation.amount)}</p>
								</div>
							</Card>
						);
					})}
				</div>
			</div>
		) : (
			<div className="max-w-4xl mx-auto p-6 space-y-6">
				<Card className="p-6 bg-gradient-to-br from-[#c79b2d] to-[#7a5a13] text-white">
					<div className="flex items-start justify-between mb-4">
						<div>
							<p className="text-sm opacity-90">Donation Amount</p>
							<p className="text-3xl mt-1">{formatUGX(Number(amount) || 0)}</p>
							<p className="text-sm mt-1 opacity-90">To: {causes.find((c) => c.id === selectedCause)?.name || 'General Fund'}</p>
						</div>
						<div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
							<Heart className="w-6 h-6" />
						</div>
					</div>
				</Card>

				<Card className="p-5">
					<h3 className="text-sm mb-3">Accepted Payment Methods</h3>
					<div className="grid grid-cols-3 gap-3">
						<div className="text-center p-3 bg-yellow-50 rounded-lg">
							<Smartphone className="w-8 h-8 mx-auto mb-2 text-yellow-600" />
							<p className="text-xs">MTN Money</p>
						</div>
						<div className="text-center p-3 bg-red-50 rounded-lg">
							<Smartphone className="w-8 h-8 mx-auto mb-2 text-red-600" />
							<p className="text-xs">Airtel Money</p>
						</div>
						<div className="text-center p-3 bg-blue-50 rounded-lg">
							<Building2 className="w-8 h-8 mx-auto mb-2 text-blue-600" />
							<p className="text-xs">Bank Transfer</p>
						</div>
					</div>
				</Card>

				<Card className="p-6">
					<h3 className="text-lg mb-4">Payment Method</h3>
					<div className="space-y-4">
						<div>
							<Label>Payment Method</Label>
							<RadioGroup value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)} className="space-y-2 mt-2">
								<Card className={paymentMethod === 'mtn' ? 'border-2 border-yellow-500' : ''}>
									<CardContent className="p-4 flex items-center gap-3">
										<RadioGroupItem value="mtn" id="mtn-donate" />
										<Smartphone className="w-5 h-5 text-yellow-600" />
										<Label htmlFor="mtn-donate" className="cursor-pointer flex-1">MTN Mobile Money</Label>
									</CardContent>
								</Card>
								<Card className={paymentMethod === 'airtel' ? 'border-2 border-red-500' : ''}>
									<CardContent className="p-4 flex items-center gap-3">
										<RadioGroupItem value="airtel" id="airtel-donate" />
										<Smartphone className="w-5 h-5 text-red-600" />
										<Label htmlFor="airtel-donate" className="cursor-pointer flex-1">Airtel Money</Label>
									</CardContent>
								</Card>
								<Card className={paymentMethod === 'bank' ? 'border-2 border-blue-500' : ''}>
									<CardContent className="p-4 flex items-center gap-3">
										<RadioGroupItem value="bank" id="bank-donate" />
										<Building2 className="w-5 h-5 text-blue-600" />
										<Label htmlFor="bank-donate" className="cursor-pointer flex-1">Bank Transfer</Label>
									</CardContent>
								</Card>
							</RadioGroup>
						</div>

						{paymentMethod === 'bank' && (
							<div className="bg-blue-50 p-4 rounded-lg text-sm border border-blue-200">
								<p className="mb-2 font-semibold">Please transfer the amount to:</p>
								<p><strong>Account Name:</strong> UCU Alumni Circle</p>
								<p><strong>Account Number:</strong> 1234567890</p>
								<p><strong>Bank:</strong> Stanbic Bank Uganda</p>
								<p className="mt-2 text-xs text-gray-600">Include your name and email as the reference.</p>
							</div>
						)}

						{(paymentMethod === 'mtn' || paymentMethod === 'airtel') && (
							<div>
								<Label htmlFor="phone-donate">Access Number</Label>
								<Input
									id="phone-donate"
									type="text"
									inputMode="numeric"
									value={phoneNumber}
									onChange={(e) => setPhoneNumber(sanitizeAccessNumber(e.target.value))}
									placeholder="A12345 or B12345"
									maxLength={6}
									className="mt-1"
								/>
							</div>
						)}

						<Button
							onClick={handleSubmitDonation}
							className="w-full"
							disabled={!amount || isSubmitting || (paymentMethod !== 'bank' && !phoneNumber)}
						>
							{isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
							{isSubmitting ? 'Processing...' : paymentMethod === 'bank' ? 'Record Donation' : 'Proceed to Payment'}
						</Button>
					</div>
				</Card>
			</div>
		)}

		{showPINPrompt && (
			<DonationPINPrompt
				phoneNumber={phoneNumber}
				amount={Number(amount)}
				provider={paymentMethod as 'mtn' | 'airtel'}
				cause={causes.find((c) => c.id === selectedCause)?.name || 'General Fund'}
				onSuccess={handleConfirmSuccess}
				onCancel={() => {
					setShowPINPrompt(false);
					setPendingTransactionId(null);
					toast.info('Donation cancelled');
				}}
			/>
		)}
	</div>
	);
}
