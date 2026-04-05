import './Login.css';
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import PhoneInput from '../components/PhoneInput';
import OTPInput from '../components/OTPInput';
import Button from '../components/Button';
import { requestOTP, verifyOTP, getMe } from '../api/client';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';

export default function Login() {
  const [step, setStep] = useState('phone'); // phone | otp
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const addToast = useToastStore((s) => s.addToast);

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    if (phone.replace(/\D/g, '').length < 10) {
      setError('Enter a valid Nigerian phone number');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await requestOTP(phone);
      setStep('otp');
      addToast({ type: 'success', message: 'OTP sent to your phone' });
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to send OTP. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (otp) => {
    setLoading(true);
    setError('');
    try {
      const res = await verifyOTP(phone, otp);
      const { access, refresh } = res.data.data;
      useAuthStore.getState().setTokens(access, refresh);
      const meRes = await getMe();
      login(meRes.data.data, access, refresh);
      addToast({ type: 'success', message: 'Welcome back!' });
      if (res.data.data.is_new_user) {
        navigate('/join', { state: { fromLogin: true } });
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Invalid OTP. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <Link to="/" className="login-brand">City Boy Connect</Link>
        <h1 className="login-title">{step === 'phone' ? 'Welcome Back' : 'Enter OTP'}</h1>
        <p className="login-sub">
          {step === 'phone'
            ? 'Sign in with your phone number to access your dashboard'
            : `We sent a 6-digit code to ${phone}`}
        </p>

        {step === 'phone' ? (
          <form onSubmit={handleRequestOTP} className="login-form">
            <PhoneInput value={phone} onChange={setPhone} label="Phone Number" error={error} />
            <Button type="submit" loading={loading} size="lg" className="login-submit">
              Send OTP
            </Button>
          </form>
        ) : (
          <div className="login-form">
            <OTPInput onComplete={handleVerifyOTP} error={error} disabled={loading} />
            {error && <p className="login-error">{error}</p>}
            <button className="login-resend" onClick={() => { setStep('phone'); setError(''); }} disabled={loading}>
              ← Change number
            </button>
          </div>
        )}

        <p className="login-footer-text">
          Don't have an account? <Link to="/join">Join the Movement</Link>
        </p>
      </div>
    </div>
  );
}
