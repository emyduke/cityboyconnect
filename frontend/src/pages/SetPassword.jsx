import './SetPassword.css';
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
    <div className="set-password-page">
      <div className="set-password-card">
        <h2 className="set-password-title">
          {user?.has_password ? 'Change Password' : 'Set a Password'}
        </h2>
        <p className="set-password-sub">
          {user?.has_password
            ? 'Update the password you use to sign in.'
            : 'Set a password so you can sign in without needing a code every time.'}
        </p>

        <form onSubmit={handleSubmit} className="set-password-form">
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
          {error && <p className="set-password-error">{error}</p>}
          <Button type="submit" loading={loading} size="lg" className="set-password-btn">
            {user?.has_password ? 'Update Password' : 'Set Password'}
          </Button>
        </form>
      </div>
    </div>
  );
}
