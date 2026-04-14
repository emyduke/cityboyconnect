import './Login.css';
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import PhoneInput from '../components/PhoneInput';
import OTPInput from '../components/OTPInput';
import Button from '../components/Button';
import Input from '../components/Input';
import { getAuthMethods, requestOTP, verifyOTP, loginWithPassword } from '../api/client';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import { getFriendlyError } from '../lib/errors';

export default function Login() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const loginStore = useAuthStore((s) => s.login);
  const setTokens = useAuthStore((s) => s.setTokens);
  const addToast = useToastStore((s) => s.addToast);

  const [stage, setStage] = useState('phone');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [otpChannel, setOtpChannel] = useState('sms');
  const [otpSentTo, setOtpSentTo] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [methods, setMethods] = useState([]);
  const [userHasPwd, setUserHasPwd] = useState(false);
  const [userHasEmail, setUserHasEmail] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (params.get('reason') === 'session_expired') {
      addToast({ type: 'info', message: 'Your session expired. Please sign in again.' });
    }
  }, [params]);

  const handleLogin = (data) => {
    const d = data.data || data;
    setTokens(d.access, d.refresh);
    loginStore(d.user, d.access, d.refresh);
    addToast({ type: 'success', message: 'Welcome back!' });
    if (d.is_new_user) {
      navigate('/join', { state: { fromLogin: true } });
    } else {
      navigate('/dashboard');
    }
  };

  const handlePhoneSubmit = async (e) => {
    e?.preventDefault?.();
    if (phone.replace(/\D/g, '').length < 10) {
      setError('Enter a valid Nigerian phone number');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await getAuthMethods(phone);
      const d = res.data.data;
      setMethods(d.available_methods);
      setUserHasPwd(d.user_has_password);
      setUserHasEmail(d.user_has_email);

      if (d.available_methods.length === 1) {
        const only = d.available_methods[0];
        if (only === 'password') { setStage('password'); setLoading(false); return; }
        const ch = only === 'sms' ? 'sms' : 'email';
        setOtpChannel(ch);
        if (ch === 'email' && !d.user_has_email) { setStage('enter-email'); setLoading(false); return; }
        await doRequestOTP(phone, ch);
        return;
      }
      setStage('method');
    } catch (err) {
      setError(getFriendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  const doRequestOTP = async (ph, ch, em) => {
    setLoading(true);
    setError('');
    try {
      const payload = { phone_number: ph || phone, channel: ch || otpChannel };
      if (em || (ch === 'email' && email)) payload.email = em || email;
      const res = await requestOTP(payload);
      const d = res.data.data;
      setOtpSentTo(d.destination);
      setStage('otp');
    } catch (err) {
      const apiErr = err?.response?.data?.error;
      setError(apiErr?.message || getFriendlyError(err));
      if (apiErr?.code === 'DELIVERY_FAILED' && methods.length > 1) {
        setStage('method');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMethodSelect = (method) => {
    setError('');
    if (method === 'password') { setStage('password'); return; }
    setOtpChannel(method);
    if (method === 'email' && !userHasEmail) { setStage('enter-email'); return; }
    doRequestOTP(phone, method);
  };

  const handleEmailSubmit = () => {
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    doRequestOTP(phone, 'email', email);
  };

  const handleOTPComplete = async (code) => {
    setLoading(true);
    setError('');
    try {
      const res = await verifyOTP({
        phone_number: phone,
        otp_code: code,
        email: otpChannel === 'email' ? email : undefined,
      });
      handleLogin(res.data);
    } catch (err) {
      setError(err?.response?.data?.error?.message || getFriendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e?.preventDefault?.();
    if (!password) { setError('Please enter your password.'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await loginWithPassword({ phone_number: phone, password });
      handleLogin(res.data);
    } catch (err) {
      setError(err?.response?.data?.error?.message || getFriendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-hero">
        <img src="/assets/logos/04_icon_dark.png" alt="City Boy Connect" className="login-logo" />
        <h1 className="login-title">Welcome back</h1>
        <p className="login-sub">Sign in to City Boy Connect</p>
      </div>

      <div className="login-card">

        {/* PHONE */}
        {stage === 'phone' && (
          <div className="login-stage">
            <h2 className="stage-heading">Enter your phone number</h2>
            <form onSubmit={handlePhoneSubmit}>
              <PhoneInput value={phone} onChange={setPhone} label="Phone Number" error={error} />
              <Button type="submit" loading={loading} size="lg" className="login-btn mt-6">
                Continue
              </Button>
            </form>
            <p className="login-footer-text">
              New member? <Link to="/join" className="login-link">Join the movement &rarr;</Link>
            </p>
          </div>
        )}

        {/* METHOD CHOICE */}
        {stage === 'method' && (
          <div className="login-stage">
            <button className="back-link" onClick={() => { setStage('phone'); setError(''); }}>&larr; Back</button>
            <h2 className="stage-heading">How would you like to sign in?</h2>
            <p className="stage-sub">Choose a verification method</p>
            {error && <p className="login-error">{error}</p>}
            <div className="method-options">
              {methods.includes('sms') && (
                <button className="method-card" onClick={() => handleMethodSelect('sms')} disabled={loading}>
                  <span className="method-icon">💬</span>
                  <div className="method-text">
                    <p className="method-title">Text message (SMS)</p>
                    <p className="method-desc">Get a 6-digit code sent to your phone</p>
                  </div>
                  <span className="method-arrow">&rarr;</span>
                </button>
              )}
              {methods.includes('email') && (
                <button className="method-card" onClick={() => handleMethodSelect('email')} disabled={loading}>
                  <span className="method-icon">✉️</span>
                  <div className="method-text">
                    <p className="method-title">Email</p>
                    <p className="method-desc">Get a code sent to your email address</p>
                  </div>
                  <span className="method-arrow">&rarr;</span>
                </button>
              )}
              {methods.includes('password') && (
                <button className="method-card" onClick={() => handleMethodSelect('password')} disabled={loading}>
                  <span className="method-icon">🔑</span>
                  <div className="method-text">
                    <p className="method-title">Password</p>
                    <p className="method-desc">{userHasPwd ? 'Sign in with your password' : 'Set up a password to sign in'}</p>
                  </div>
                  <span className="method-arrow">&rarr;</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* ENTER EMAIL */}
        {stage === 'enter-email' && (
          <div className="login-stage">
            <button className="back-link" onClick={() => setStage('method')}>&larr; Back</button>
            <h2 className="stage-heading">Enter your email address</h2>
            <p className="stage-sub">We'll send your code there</p>
            <Input
              type="email"
              label="Email address"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={error}
              onKeyDown={(e) => e.key === 'Enter' && handleEmailSubmit()}
            />
            <Button onClick={handleEmailSubmit} loading={loading} size="lg" className="login-btn mt-4">
              Send code
            </Button>
          </div>
        )}

        {/* OTP */}
        {stage === 'otp' && (
          <div className="login-stage">
            <button className="back-link" onClick={() => setStage(methods.length > 1 ? 'method' : 'phone')}>
              &larr; Back
            </button>
            <h2 className="stage-heading">Enter your code</h2>
            <p className="stage-sub">
              {otpChannel === 'sms' ? `Sent via SMS to ${otpSentTo}` : `Sent to ${otpSentTo}`}
            </p>
            <OTPInput onComplete={handleOTPComplete} error={error} disabled={loading} />
            {loading && <p className="otp-verifying">Verifying...</p>}
            <ResendTimer onResend={() => doRequestOTP(phone, otpChannel, otpChannel === 'email' ? email : undefined)} loading={loading} />
            {methods.length > 1 && (
              <button className="switch-method-link" onClick={() => setStage('method')}>
                Try a different method
              </button>
            )}
          </div>
        )}

        {/* PASSWORD */}
        {stage === 'password' && (
          <div className="login-stage">
            <button className="back-link" onClick={() => setStage(methods.length > 1 ? 'method' : 'phone')}>
              &larr; Back
            </button>
            {userHasPwd ? (
              <>
                <h2 className="stage-heading">Enter your password</h2>
                <form onSubmit={handlePasswordSubmit}>
                  <div className="password-field">
                    <Input
                      type={showPwd ? 'text' : 'password'}
                      label="Password"
                      placeholder="Your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      error={error}
                    />
                    <button type="button" className="pwd-toggle" onClick={() => setShowPwd((v) => !v)}>
                      {showPwd ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <Button type="submit" loading={loading} size="lg" className="login-btn mt-4">
                    Sign in
                  </Button>
                </form>
                {(methods.includes('sms') || methods.includes('email')) && (
                  <button className="switch-method-link" onClick={() => setStage('method')}>
                    Sign in with a code instead
                  </button>
                )}
              </>
            ) : (
              <>
                <h2 className="stage-heading">No password set yet</h2>
                <p className="stage-sub">Sign in with SMS or Email first, then set a password from your security settings.</p>
                {error && <p className="login-error">{error}</p>}
                {methods.includes('sms') && (
                  <Button onClick={() => handleMethodSelect('sms')} size="lg" variant="secondary" className="login-btn mt-2">
                    Send SMS code
                  </Button>
                )}
                {methods.includes('email') && (
                  <Button onClick={() => handleMethodSelect('email')} size="lg" variant="secondary" className="login-btn mt-2">
                    Send Email code
                  </Button>
                )}
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

function ResendTimer({ onResend, loading }) {
  const [seconds, setSeconds] = useState(60);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  if (loading) return <p className="resend-text">Sending new code...</p>;

  return (
    <p className="resend-text">
      {seconds > 0 ? (
        <>Resend code in <strong>0:{String(seconds).padStart(2, '0')}</strong></>
      ) : (
        <button className="resend-btn" onClick={() => { onResend(); setSeconds(60); }}>
          Resend code
        </button>
      )}
    </p>
  );
}
