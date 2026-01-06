import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE } from '../../api';

interface PINManagementProps {
  onClose?: () => void;
}

type ViewMode = 'main' | 'set' | 'change' | 'reset';

const PINManagement: React.FC<PINManagementProps> = ({ onClose }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('main');
  const [hasPin, setHasPin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Set PIN state
  const [newPin, setNewPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [securityQuestion, setSecurityQuestion] = useState<string>('');
  const [storedSecurityQuestion, setStoredSecurityQuestion] = useState<string>('');
  const [securityAnswer, setSecurityAnswer] = useState<string>('');
  
  // Change PIN state
  const [oldPin, setOldPin] = useState<string>('');
  
  // Reset PIN state
  const [resetAnswer, setResetAnswer] = useState<string>('');
  const [resetNewPin, setResetNewPin] = useState<string>('');
  const [resetConfirmPin, setResetConfirmPin] = useState<string>('');
  
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    checkPinStatus();
  }, []);

  const checkPinStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE}/pin/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHasPin(response.data.hasPin);
      if (response.data.security_question) {
        setStoredSecurityQuestion(response.data.security_question);
      }
      setLoading(false);
    } catch (err: any) {
      console.error('Error checking PIN status:', err);
      setError(err.response?.data?.error || 'Failed to check PIN status');
      setLoading(false);
    }
  };

  const handleSetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    console.log('PIN Validation:', {
      newPin,
      newPinLength: newPin.length,
      confirmPin,
      securityQuestion,
      securityAnswer
    });

    // Validation
    if (!newPin || newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      setError('PIN must be exactly 4 digits');
      return;
    }

    if (newPin !== confirmPin) {
      setError('PINs do not match');
      return;
    }

    if (!securityQuestion || securityQuestion === '') {
      setError('Please select a security question from the dropdown');
      return;
    }

    if (!securityAnswer || securityAnswer.trim() === '') {
      setError('Please provide an answer to your security question');
      return;
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE}/pin/set`, {
        pin: newPin,
        security_question: securityQuestion,
        security_answer: securityAnswer
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess('PIN set successfully!');
      setHasPin(true);
      setStoredSecurityQuestion(securityQuestion);
      
      // Reset form
      setNewPin('');
      setConfirmPin('');
      setSecurityQuestion('');
      setSecurityAnswer('');

      await checkPinStatus();
      
      setTimeout(() => {
        setViewMode('main');
        setSuccess('');
      }, 2000);
    } catch (err: any) {
      console.error('Error setting PIN:', err);
      setError(err.response?.data?.error || 'Failed to set PIN');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (oldPin.length !== 4 || !/^\d{4}$/.test(oldPin)) {
      setError('Current PIN must be exactly 4 digits');
      return;
    }

    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      setError('New PIN must be exactly 4 digits');
      return;
    }

    if (newPin !== confirmPin) {
      setError('New PINs do not match');
      return;
    }

    if (oldPin === newPin) {
      setError('New PIN must be different from current PIN');
      return;
    }

    if (!storedSecurityQuestion) {
      setError('Security question not found. Please set your PIN again.');
      return;
    }

    if (!securityAnswer.trim()) {
      setError('Please provide your security answer to change your PIN');
      return;
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      
      // First verify old PIN
      await axios.post(`${API_BASE}/pin/verify`, {
        pin: oldPin
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Then set new PIN (security question remains the same)
      await axios.post(`${API_BASE}/pin/set`, {
        pin: newPin,
        security_question: storedSecurityQuestion,
        security_answer: securityAnswer
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess('PIN changed successfully!');
      
      // Reset form
      setOldPin('');
      setNewPin('');
      setConfirmPin('');
      setSecurityAnswer('');

      await checkPinStatus();
      
      setTimeout(() => {
        setViewMode('main');
        setSuccess('');
      }, 2000);
    } catch (err: any) {
      console.error('Error changing PIN:', err);
      setError(err.response?.data?.error || 'Failed to change PIN');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!resetAnswer.trim()) {
      setError('Please provide your security answer');
      return;
    }

    if (resetNewPin.length !== 4 || !/^\d{4}$/.test(resetNewPin)) {
      setError('New PIN must be exactly 4 digits');
      return;
    }

    if (resetNewPin !== resetConfirmPin) {
      setError('New PINs do not match');
      return;
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE}/pin/reset`, {
        security_answer: resetAnswer,
        new_pin: resetNewPin
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess('PIN reset successfully!');

      // Refresh status so future verifications use the new PIN
      await checkPinStatus();
      
      // Reset form
      setResetAnswer('');
      setResetNewPin('');
      setResetConfirmPin('');
      
      setTimeout(() => {
        setViewMode('main');
        setSuccess('');
      }, 2000);
    } catch (err: any) {
      console.error('Error resetting PIN:', err);
      setError(err.response?.data?.error || 'Failed to reset PIN. Please check your security answer.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Payment PIN Management</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-700">{success}</p>
        </div>
      )}

      {viewMode === 'main' && (
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Status:</strong> {hasPin ? 'PIN is set ✓' : 'No PIN set'}
            </p>
            <p className="text-xs text-blue-600 mt-2">
              Your payment PIN is required for all financial transactions including donations and loan payments.
            </p>
          </div>

          {!hasPin ? (
            <button
              onClick={() => setViewMode('set')}
              className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Set Payment PIN
            </button>
          ) : (
            <div className="space-y-3">
              <button
                onClick={() => setViewMode('change')}
                className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Change PIN
              </button>
              <button
                onClick={() => setViewMode('reset')}
                className="w-full py-3 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Forgot PIN? Reset with Security Question
              </button>
            </div>
          )}
        </div>
      )}

      {viewMode === 'set' && (
        <form onSubmit={handleSetPin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Create 4-Digit PIN
            </label>
            <input
              type="password"
              maxLength={4}
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter 4-digit PIN"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm PIN
            </label>
            <input
              type="password"
              maxLength={4}
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Re-enter PIN"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Security Question
            </label>
            <select
              value={securityQuestion}
              onChange={(e) => setSecurityQuestion(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select a security question</option>
              <option value="What is your mother's maiden name?">What is your mother's maiden name?</option>
              <option value="What was the name of your first pet?">What was the name of your first pet?</option>
              <option value="What city were you born in?">What city were you born in?</option>
              <option value="What is your favorite book?">What is your favorite book?</option>
              <option value="What was your childhood nickname?">What was your childhood nickname?</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Security Answer
            </label>
            <input
              type="text"
              value={securityAnswer}
              onChange={(e) => setSecurityAnswer(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your answer"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              This will be used to reset your PIN if you forget it
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setViewMode('main')}
              className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
              disabled={submitting}
            >
              {submitting ? 'Setting PIN...' : 'Set PIN'}
            </button>
          </div>
        </form>
      )}

      {viewMode === 'change' && (
        <form onSubmit={handleChangePin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current PIN
            </label>
            <input
              type="password"
              maxLength={4}
              value={oldPin}
              onChange={(e) => setOldPin(e.target.value.replace(/\D/g, ''))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter current PIN"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New PIN
            </label>
            <input
              type="password"
              maxLength={4}
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter new 4-digit PIN"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm New PIN
            </label>
            <input
              type="password"
              maxLength={4}
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Re-enter new PIN"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Security Answer
            </label>
            <input
              type="text"
              value={securityAnswer}
              onChange={(e) => setSecurityAnswer(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your security answer"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Needed to confirm your identity before changing the PIN.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setViewMode('main')}
              className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
              disabled={submitting}
            >
              {submitting ? 'Changing PIN...' : 'Change PIN'}
            </button>
          </div>
        </form>
      )}

      {viewMode === 'reset' && (
        <form onSubmit={handleResetPin} className="space-y-4">
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
            <p className="text-sm text-yellow-800">
              Answer your security question to reset your PIN
            </p>
          </div>

          {storedSecurityQuestion && (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-700 font-medium">Security Question</p>
              <p className="text-sm text-gray-900 mt-1">{storedSecurityQuestion}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Security Answer
            </label>
            <input
              type="text"
              value={resetAnswer}
              onChange={(e) => setResetAnswer(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your security answer"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New PIN
            </label>
            <input
              type="password"
              maxLength={4}
              value={resetNewPin}
              onChange={(e) => setResetNewPin(e.target.value.replace(/\D/g, ''))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter new 4-digit PIN"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm New PIN
            </label>
            <input
              type="password"
              maxLength={4}
              value={resetConfirmPin}
              onChange={(e) => setResetConfirmPin(e.target.value.replace(/\D/g, ''))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Re-enter new PIN"
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setViewMode('main')}
              className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
              disabled={submitting}
            >
              {submitting ? 'Resetting PIN...' : 'Reset PIN'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default PINManagement;
