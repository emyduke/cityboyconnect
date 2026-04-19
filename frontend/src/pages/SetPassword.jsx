import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Input from '../components/Input';
import Button from '../components/Button';
import { setPassword } from '../api/client';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';

export default function SetPassword() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const addToast = useToastStore((s) => s.addToast);

  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confPwd, setConfPwd] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await setPassword({
        old_password: user?.has_password ? oldPwd : undefined,
        new_password: newPwd,
        confirm_password: confPwd,
      });
      addToast({ type: 'success', message: 'Password set! You can now sign in with your password.' });
      navigate('/profile');
    } catch (err) {
      const msg = err?.response?.data?.error?.message || 'Could not set password. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6">
      <div className="w-full max-w-[420px] bg-white rounded-3xl p-8 border border-gray-100 shadow-[0_4px_24px_rgba(26,71,42,0.08)]">
        <h2 className="font-display text-xl font-bold text-gray-900 mb-1.5">
          {user?.has_password ? 'Change Password' : 'Set a Password'}
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          {user?.has_password
            ? 'Update the password you use to sign in.'
            : 'Set a password so you can sign in without needing a code every time.'}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {user?.has_password && (
            <Input
              type="password"
              label="Current password"
              value={oldPwd}
              onChange={(e) => setOldPwd(e.target.value)}
            />
          )}
          <Input
            type="password"
            label="New password"
            hint="At least 8 characters"
            value={newPwd}
            onChange={(e) => setNewPwd(e.target.value)}
          />
          <Input
            type="password"
            label="Confirm new password"
            value={confPwd}
            onChange={(e) => setConfPwd(e.target.value)}
          />
          {error && <p className="text-danger text-[0.85rem] text-center">{error}</p>}
          <Button type="submit" loading={loading} size="lg" className="w-full">
            {user?.has_password ? 'Update Password' : 'Set Password'}
          </Button>
        </form>
      </div>
    </div>
  );
}
