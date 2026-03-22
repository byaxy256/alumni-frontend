// Password reset after opening link with ?reset_token=...
import { useState, type KeyboardEvent } from 'react';
import { api } from '../api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Lock, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

type ResetPasswordProps = {
  token: string;
  onSuccess: () => void;
  onBack: () => void;
};

export default function ResetPassword({ token, onSuccess, onBack }: ResetPasswordProps) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!password || password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (password !== confirm) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await api.resetPasswordWithToken(token, password);
      toast.success('Password updated. You can sign in now.');
      onSuccess();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Reset failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') void submit();
  };

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden bg-[#0f1b2d] text-white flex items-center justify-center p-4"
      style={{ fontFamily: 'Manrope, Inter, system-ui, sans-serif' }}
    >
      <button
        type="button"
        onClick={onBack}
        className="absolute top-5 left-5 flex items-center gap-2 rounded-full border border-white/20 bg-[rgba(13,22,38,0.45)] px-4 py-2 text-sm text-white backdrop-blur-sm"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div
        className="w-full max-w-md rounded-2xl border border-white/15 p-8"
        style={{ background: 'rgba(24,37,59,0.93)' }}
      >
        <h1 className="text-2xl font-bold text-white mb-1">Set new password</h1>
        <p className="text-white/70 text-sm mb-6">Choose a new password for your account.</p>

        <div className="space-y-4">
          <div>
            <Label className="text-white/85">New password</Label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="At least 8 characters"
                className="pl-10 bg-[rgba(10,18,33,0.65)] border-white/15 text-white placeholder:text-white/35"
              />
            </div>
          </div>
          <div>
            <Label className="text-white/85">Confirm password</Label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
              <Input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Repeat password"
                className="pl-10 bg-[rgba(10,18,33,0.65)] border-white/15 text-white placeholder:text-white/35"
              />
            </div>
          </div>
          <Button
            className="w-full h-12 rounded-full bg-[#f07a2a] hover:bg-[#f07a2a]/90 text-white font-bold"
            onClick={() => void submit()}
            disabled={loading}
          >
            {loading ? 'Saving…' : 'Update password'}
          </Button>
        </div>
      </div>
    </div>
  );
}
