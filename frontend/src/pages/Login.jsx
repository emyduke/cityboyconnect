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
    <div className="min-h-screen flex flex-col items-center justify-center bg-off-white p-6">
      <div className="text-center mb-8">
        <img src="/assets/logos/04_icon_dark.png" alt="City Boy Connect" className="w-20 h-20 object-contain mb-4 mx-auto" />
        <h1 className="font-display text-[1.75rem] font-bold text-forest-dark mb-1.5">Welcome back</h1>
        <p className="text-[0.95rem] text-gray-500">Sign in to City Boy Connect</p>
      </div>

      <div className="w-full max-w-[420px] bg-white rounded-3xl p-8 border border-gray-100 shadow-[0_4px_24px_rgba(26,71,42,0.08)]">

        {/* PHONE */}
        {stage === 'phone' && (
          <div className="flex flex-col">
            <h2 className="font-display text-xl font-bold text-gray-900 mb-1.5">Enter your phone number</h2>
            <form onSubmit={handlePhoneSubmit}>
              <PhoneInput value={phone} onChange={setPhone} label="Phone Number" error={error} />
              <Button type="submit" loading={loading} size="lg" className="w-full mt-6">
                Continue
              </Button>
            </form>
            <p className="text-center text-sm text-gray-500 mt-6">
              New member? <Link to="/join" className="text-forest font-semibold no-underline hover:underline">Join the movement &rarr;</Link>
            </p>
          </div>
        )}

        {/* METHOD CHOICE */}
        {stage === 'method' && (
          <div className="flex flex-col">
            <button className="bg-transparent border-none text-forest text-sm font-medium cursor-pointer p-0 mb-4 inline-flex items-center gap-1 text-left" onClick={() => { setStage('phone'); setError(''); }}>&larr; Back</button>
            <h2 className="font-display text-xl font-bold text-gray-900 mb-1.5">How would you like to sign in?</h2>
            <p className="text-sm text-gray-500 mb-6">Choose a verification method</p>
            {error && <p className="text-danger text-[0.85rem] text-center my-2">{error}</p>}
            <div className="flex flex-col gap-2.5 mt-1">
              {methods.includes('sms') && (
                <button className="flex items-center gap-3.5 px-[18px] py-4 border-[1.5px] border-gray-200 rounded-[14px] bg-white cursor-pointer text-left transition-all duration-150 w-full hover:border-forest hover:bg-[#e8f0eb] hover:shadow-[0_2px_12px_rgba(26,71,42,0.08)]" onClick={() => handleMethodSelect('sms')} disabled={loading}>
                  <span className="text-[1.4rem] shrink-0 leading-none">💬</span>
                  <div className="flex-1">
                    <p className="font-semibold text-[0.95rem] text-gray-900 mb-0.5">Text message (SMS)</p>
                    <p className="text-[0.82rem] text-gray-500 m-0">Get a 6-digit code sent to your phone</p>
                  </div>
                  <span className="text-base text-gray-400 shrink-0">&rarr;</span>
                </button>
              )}
              {methods.includes('email') && (
                <button className="flex items-center gap-3.5 px-[18px] py-4 border-[1.5px] border-gray-200 rounded-[14px] bg-white cursor-pointer text-left transition-all duration-150 w-full hover:border-forest hover:bg-[#e8f0eb] hover:shadow-[0_2px_12px_rgba(26,71,42,0.08)]" onClick={() => handleMethodSelect('email')} disabled={loading}>
                  <span className="text-[1.4rem] shrink-0 leading-none">✉️</span>
                  <div className="flex-1">
                    <p className="font-semibold text-[0.95rem] text-gray-900 mb-0.5">Email</p>
                    <p className="text-[0.82rem] text-gray-500 m-0">Get a code sent to your email address</p>
                  </div>
                  <span className="text-base text-gray-400 shrink-0">&rarr;</span>
                </button>
              )}
              {methods.includes('password') && (
                <button className="flex items-center gap-3.5 px-[18px] py-4 border-[1.5px] border-gray-200 rounded-[14px] bg-white cursor-pointer text-left transition-all duration-150 w-full hover:border-forest hover:bg-[#e8f0eb] hover:shadow-[0_2px_12px_rgba(26,71,42,0.08)]" onClick={() => handleMethodSelect('password')} disabled={loading}>
                  <span className="text-[1.4rem] shrink-0 leading-none">🔑</span>
                  <div className="flex-1">
                    <p className="font-semibold text-[0.95rem] text-gray-900 mb-0.5">Password</p>
                    <p className="text-[0.82rem] text-gray-500 m-0">{userHasPwd ? 'Sign in with your password' : 'Set up a password to sign in'}</p>
                  </div>
                  <span className="text-base text-gray-400 shrink-0">&rarr;</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* ENTER EMAIL */}
        {stage === 'enter-email' && (
          <div className="flex flex-col">
            <button className="bg-transparent border-none text-forest text-sm font-medium cursor-pointer p-0 mb-4 inline-flex items-center gap-1 text-left" onClick={() => setStage('method')}>&larr; Back</button>
            <h2 className="font-display text-xl font-bold text-gray-900 mb-1.5">Enter your email address</h2>
            <p className="text-sm text-gray-500 mb-6">We'll send your code there</p>
            <Input
              type="email"
              label="Email address"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={error}
              onKeyDown={(e) => e.key === 'Enter' && handleEmailSubmit()}
            />
            <Button onClick={handleEmailSubmit} loading={loading} size="lg" className="w-full mt-4">
              Send code
            </Button>
          </div>
        )}

        {/* OTP */}
        {stage === 'otp' && (
          <div className="flex flex-col">
            <button className="bg-transparent border-none text-forest text-sm font-medium cursor-pointer p-0 mb-4 inline-flex items-center gap-1 text-left" onClick={() => setStage(methods.length > 1 ? 'method' : 'phone')}>
              &larr; Back
            </button>
            <h2 className="font-display text-xl font-bold text-gray-900 mb-1.5">Enter your code</h2>
            <p className="text-sm text-gray-500 mb-6">
              {otpChannel === 'sms' ? `Sent via SMS to ${otpSentTo}` : `Sent to ${otpSentTo}`}
            </p>
            <OTPInput onComplete={handleOTPComplete} error={error} disabled={loading} />
            {loading && <p className="text-center text-sm text-forest mt-3">Verifying...</p>}
            <ResendTimer onResend={() => doRequestOTP(phone, otpChannel, otpChannel === 'email' ? email : undefined)} loading={loading} />
            {methods.length > 1 && (
              <button className="block text-center mt-4 bg-transparent border-none text-gray-500 text-[0.85rem] cursor-pointer underline p-0 hover:text-forest" onClick={() => setStage('method')}>
                Try a different method
              </button>
            )}
          </div>
        )}

        {/* PASSWORD */}
        {stage === 'password' && (
          <div className="flex flex-col">
            <button className="bg-transparent border-none text-forest text-sm font-medium cursor-pointer p-0 mb-4 inline-flex items-center gap-1 text-left" onClick={() => setStage(methods.length > 1 ? 'method' : 'phone')}>
              &larr; Back
            </button>
            {userHasPwd ? (
              <>
                <h2 className="font-display text-xl font-bold text-gray-900 mb-1.5">Enter your password</h2>
                <form onSubmit={handlePasswordSubmit}>
                  <div className="relative">
                    <Input
                      type={showPwd ? 'text' : 'password'}
                      label="Password"
                      placeholder="Your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      error={error}
                    />
                    <button type="button" className="absolute right-3 top-[38px] bg-transparent border-none text-gray-400 text-[0.8rem] cursor-pointer p-0" onClick={() => setShowPwd((v) => !v)}>
                      {showPwd ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <Button type="submit" loading={loading} size="lg" className="w-full mt-4">
                    Sign in
                  </Button>
                </form>
                {(methods.includes('sms') || methods.includes('email')) && (
                  <button className="block text-center mt-4 bg-transparent border-none text-gray-500 text-[0.85rem] cursor-pointer underline p-0 hover:text-forest" onClick={() => setStage('method')}>
                    Sign in with a code instead
                  </button>
                )}
              </>
            ) : (
              <>
                <h2 className="font-display text-xl font-bold text-gray-900 mb-1.5">No password set yet</h2>
                <p className="text-sm text-gray-500 mb-6">Sign in with SMS or Email first, then set a password from your security settings.</p>
                {error && <p className="text-danger text-[0.85rem] text-center my-2">{error}</p>}
                {methods.includes('sms') && (
                  <Button onClick={() => handleMethodSelect('sms')} size="lg" variant="secondary" className="w-full mt-2">
                    Send SMS code
                  </Button>
                )}
                {methods.includes('email') && (
                  <Button onClick={() => handleMethodSelect('email')} size="lg" variant="secondary" className="w-full mt-2">
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

  if (loading) return <p className="text-center text-sm text-gray-500 mt-4">Sending new code...</p>;

  return (
    <p className="text-center text-sm text-gray-500 mt-4">
      {seconds > 0 ? (
        <>Resend code in <strong>0:{String(seconds).padStart(2, '0')}</strong></>
      ) : (
        <button className="bg-transparent border-none text-forest font-semibold text-sm cursor-pointer underline p-0" onClick={() => { onResend(); setSeconds(60); }}>
          Resend code
        </button>
      )}
    </p>
  );
}
