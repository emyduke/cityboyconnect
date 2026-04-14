import './Join.css';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import PhoneInput from '../components/PhoneInput';
import OTPInput from '../components/OTPInput';
import Input from '../components/Input';
import Button from '../components/Button';
import SearchableSelect from '../components/SearchableSelect';
import FileUpload from '../components/FileUpload';
import StepIndicator from '../components/StepIndicator';
import { requestOTP, verifyOTP, getAuthMethods, setPassword, getMe, onboardingProfile, onboardingPlacement, onboardingVoterCard, getStates, getLGAs, getWards, validateRef } from '../api/client';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import { getFriendlyError } from '../lib/errors';

const STEPS = ['Phone', 'Verify', 'Profile', 'Placement', 'Voter Card', 'Security', 'Done'];

export default function Join() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login: storeLogin, isAuthenticated } = useAuthStore();
  const addToast = useToastStore((s) => s.addToast);

  // Referral
  const [referrer, setReferrer] = useState(null);
  const refToken = searchParams.get('ref');

  useEffect(() => {
    if (refToken) {
      validateRef(refToken).then(res => {
        setReferrer(res.data.data || res.data);
      }).catch(() => { /* invalid ref */ });
    }
  }, [refToken]);

  // Step 0 - Phone & auth method
  const [phone, setPhone] = useState('');
  const [methods, setMethods] = useState([]);
  const [authSubStep, setAuthSubStep] = useState('phone'); // phone | method | enter-email
  const [otpChannel, setOtpChannel] = useState('sms');
  const [email, setEmail] = useState('');
  const [otpSentTo, setOtpSentTo] = useState('');

  // Step 5 - Security (set password)
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showPwd, setShowPwd] = useState(false);

  // Step 2 - Profile
  const [profile, setProfile] = useState({ full_name: '', date_of_birth: '', gender: '', occupation: '' });
  const [profilePhoto, setProfilePhoto] = useState(null);

  // Step 3 - Placement
  const [states, setStates] = useState([]);
  const [lgas, setLgas] = useState([]);
  const [wards, setWards] = useState([]);
  const [placement, setPlacement] = useState({ state: '', lga: '', ward: '', residential_address: '' });

  // Step 4 - Voter Card
  const [voterCard, setVoterCard] = useState({ voter_card_number: '', apc_membership_number: '' });
  const [voterCardImage, setVoterCardImage] = useState(null);

  // Completion data
  const [completionData, setCompletionData] = useState(null);

  useEffect(() => {
    if (isAuthenticated && step < 2) setStep(2);
  }, [isAuthenticated, step]);

  const loadStates = useCallback(async () => {
    try {
      const res = await getStates();
      setStates((res.data.data || res.data.results || res.data).map(s => ({ value: s.id, label: s.name })));
    } catch { /* ok */ }
  }, []);

  useEffect(() => { if (step === 3) loadStates(); }, [step, loadStates]);

  const handleStateChange = async (val) => {
    setPlacement(p => ({ ...p, state: val, lga: '', ward: '' }));
    setLgas([]); setWards([]);
    if (!val) return;
    try {
      const res = await getLGAs(val);
      setLgas((res.data.data || res.data.results || res.data).map(l => ({ value: l.id, label: l.name })));
    } catch { /* ok */ }
  };

  const handleLgaChange = async (val) => {
    setPlacement(p => ({ ...p, lga: val, ward: '' }));
    setWards([]);
    if (!val) return;
    try {
      const res = await getWards(val);
      setWards((res.data.data || res.data.results || res.data).map(w => ({ value: w.id, label: w.name })));
    } catch { /* ok */ }
  };

  // Step 0: Phone submit → fetch available methods
  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    if (phone.replace(/\D/g, '').length < 10) { setError('Enter a valid phone number'); return; }
    setLoading(true); setError('');
    try {
      const res = await getAuthMethods(phone);
      const d = res.data.data;
      setMethods(d.available_methods);
      const otpMethods = d.available_methods.filter(m => m !== 'password');
      // Auto-pick if only one OTP method
      if (otpMethods.length === 1) {
        const ch = otpMethods[0] === 'sms' ? 'sms' : 'email';
        setOtpChannel(ch);
        if (ch === 'email') { setAuthSubStep('enter-email'); setLoading(false); return; }
        await doRequestOTP(phone, ch);
        return;
      }
      setAuthSubStep('method');
    } catch (err) { setError(getFriendlyError(err)); }
    finally { setLoading(false); }
  };

  const handleMethodSelect = (method) => {
    setError('');
    setOtpChannel(method);
    if (method === 'email') { setAuthSubStep('enter-email'); return; }
    doRequestOTP(phone, method);
  };

  const handleEmailSubmit = () => {
    if (!email || !email.includes('@')) { setError('Enter a valid email address'); return; }
    doRequestOTP(phone, 'email', email);
  };

  const doRequestOTP = async (ph, ch, em) => {
    setLoading(true); setError('');
    try {
      const payload = { phone_number: ph || phone, channel: ch || otpChannel };
      if (em || (ch === 'email' && email)) payload.email = em || email;
      const res = await requestOTP(payload);
      const d = res.data.data;
      setOtpSentTo(d.destination);
      setStep(1);
      addToast({ type: 'success', message: `Code sent to ${d.destination}` });
    } catch (err) { setError(err.response?.data?.error?.message || getFriendlyError(err)); }
    finally { setLoading(false); }
  };

  // Step 1: Verify OTP
  const handleVerifyOTP = async (otp) => {
    setLoading(true); setError('');
    try {
      const res = await verifyOTP({
        phone_number: phone,
        otp_code: otp,
        email: otpChannel === 'email' ? email : undefined,
      });
      const { access, refresh, user } = res.data.data;
      useAuthStore.getState().setTokens(access, refresh);
      storeLogin(user, access, refresh);
      setStep(2);
    } catch (err) { setError(err.response?.data?.error?.message || 'Invalid OTP'); }
    finally { setLoading(false); }
  };

  // Step 2: Profile
  const handleProfile = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const fd = new FormData();
      Object.entries(profile).forEach(([k, v]) => fd.append(k, v));
      if (profilePhoto) fd.append('profile_photo', profilePhoto);
      await onboardingProfile(fd);
      setStep(3);
      addToast({ type: 'success', message: 'Profile saved!' });
    } catch (err) { setError(err.response?.data?.error?.message || 'Failed to save profile'); }
    finally { setLoading(false); }
  };

  // Step 3: Placement
  const handlePlacement = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const placementData = { ...placement };
      if (refToken) placementData.referral_token = refToken;
      await onboardingPlacement(placementData);
      setStep(4);
      addToast({ type: 'success', message: 'Placement saved!' });
    } catch (err) { setError(err.response?.data?.error?.message || 'Failed to save placement'); }
    finally { setLoading(false); }
  };

  // Step 4: Voter Card
  const handleVoterCard = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const fd = new FormData();
      Object.entries(voterCard).forEach(([k, v]) => { if (v) fd.append(k, v); });
      if (voterCardImage) fd.append('voter_card_image', voterCardImage);
      await onboardingVoterCard(fd);
      const meRes = await getMe();
      setCompletionData(meRes.data.data);
      setStep(5);
      addToast({ type: 'success', message: 'Voter card saved!' });
    } catch (err) { setError(err.response?.data?.error?.message || 'Failed to save voter card'); }
    finally { setLoading(false); }
  };

  return (
    <div className="join-page">
      <div className="join-card">
        <Link to="/" className="join-brand">City Boy Connect</Link>

        {referrer && (
          <div className="join-referral-banner">
            <span className="join-referral-banner__label">You&apos;re joining under</span>
            <span className="join-referral-banner__name">{referrer.full_name}</span>
            {referrer.state_name && <span className="join-referral-banner__meta">{referrer.state_name}</span>}
          </div>
        )}

        <StepIndicator steps={STEPS} current={step} />

        <div className="join-step-content">
          {step === 0 && (
            <>
              {authSubStep === 'phone' && (
                <form onSubmit={handlePhoneSubmit} className="join-form">
                  <h2>Join the Movement</h2>
                  <p className="join-form__sub">Enter your Nigerian phone number to get started</p>
                  <PhoneInput value={phone} onChange={setPhone} label="Phone Number" error={error} />
                  <Button type="submit" loading={loading} size="lg" className="join-full-btn">Continue</Button>
                </form>
              )}

              {authSubStep === 'method' && (
                <div className="join-form">
                  <button className="join-back" onClick={() => { setAuthSubStep('phone'); setError(''); }}>← Change number</button>
                  <h2>Choose verification method</h2>
                  <p className="join-form__sub">How would you like to verify your phone?</p>
                  {error && <p className="join-error">{error}</p>}
                  <div className="method-options">
                    {methods.includes('sms') && (
                      <button className="method-card" onClick={() => handleMethodSelect('sms')} disabled={loading}>
                        <span className="method-icon">💬</span>
                        <div className="method-text">
                          <p className="method-title">Text message (SMS)</p>
                          <p className="method-desc">Get a 6-digit code sent to your phone</p>
                        </div>
                      </button>
                    )}
                    {methods.includes('email') && (
                      <button className="method-card" onClick={() => handleMethodSelect('email')} disabled={loading}>
                        <span className="method-icon">✉️</span>
                        <div className="method-text">
                          <p className="method-title">Email</p>
                          <p className="method-desc">Get a code sent to your email address</p>
                        </div>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {authSubStep === 'enter-email' && (
                <div className="join-form">
                  <button className="join-back" onClick={() => setAuthSubStep(methods.length > 1 ? 'method' : 'phone')}>← Back</button>
                  <h2>Enter your email</h2>
                  <p className="join-form__sub">We&apos;ll send your verification code there</p>
                  <Input
                    type="email" label="Email address" placeholder="you@example.com"
                    value={email} onChange={(e) => setEmail(e.target.value)} error={error}
                    onKeyDown={(e) => e.key === 'Enter' && handleEmailSubmit()}
                  />
                  <Button onClick={handleEmailSubmit} loading={loading} size="lg" className="join-full-btn">Send code</Button>
                </div>
              )}
            </>
          )}

          {step === 1 && (
            <div className="join-form">
              <button className="join-back" onClick={() => { setStep(0); setAuthSubStep(methods.length > 1 ? 'method' : 'phone'); setError(''); }}>← Back</button>
              <h2>Verify Your Phone</h2>
              <p className="join-form__sub">
                {otpChannel === 'sms' ? `Enter the 6-digit code sent to ${otpSentTo}` : `Enter the code sent to ${otpSentTo}`}
              </p>
              <OTPInput onComplete={handleVerifyOTP} error={error} disabled={loading} />
              {error && <p className="join-error">{error}</p>}
              {methods.length > 1 && (
                <button className="join-back" onClick={() => { setStep(0); setAuthSubStep('method'); setError(''); }}>
                  Try a different method
                </button>
              )}
            </div>
          )}

          {step === 2 && (
            <form onSubmit={handleProfile} className="join-form">
              <h2>Your Profile</h2>
              <p className="join-form__sub">Tell us about yourself</p>
              <Input label="Full Name" placeholder="e.g. Abubakar Tafawa Balewa" value={profile.full_name} onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))} required />
              <Input label="Date of Birth" type="date" value={profile.date_of_birth} onChange={e => setProfile(p => ({ ...p, date_of_birth: e.target.value }))} required />
              <SearchableSelect
                label="Gender"
                options={[{ value: 'M', label: 'Male' }, { value: 'F', label: 'Female' }, { value: 'O', label: 'Other' }]}
                value={profile.gender}
                onChange={val => setProfile(p => ({ ...p, gender: val }))}
              />
              <Input label="Occupation" placeholder="e.g. Software Engineer" value={profile.occupation} onChange={e => setProfile(p => ({ ...p, occupation: e.target.value }))} required />
              <FileUpload label="Profile Photo (optional)" accept="image/*" onChange={setProfilePhoto} />
              {error && <p className="join-error">{error}</p>}
              <Button type="submit" loading={loading} size="lg" className="join-full-btn">Continue</Button>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handlePlacement} className="join-form">
              <h2>Political Placement</h2>
              <p className="join-form__sub">Where are you located?</p>
              <SearchableSelect label="State" options={states} value={placement.state} onChange={handleStateChange} placeholder="Select State" />
              <SearchableSelect label="LGA" options={lgas} value={placement.lga} onChange={handleLgaChange} placeholder={placement.state ? 'Select LGA' : 'Select State first'} disabled={!placement.state} />
              <SearchableSelect label="Ward" options={wards} value={placement.ward} onChange={val => setPlacement(p => ({ ...p, ward: val }))} placeholder={placement.lga ? 'Select Ward' : 'Select LGA first'} disabled={!placement.lga} />
              <Input label="Residential Address" placeholder="Your residential address" value={placement.residential_address} onChange={e => setPlacement(p => ({ ...p, residential_address: e.target.value }))} />
              {error && <p className="join-error">{error}</p>}
              <Button type="submit" loading={loading} size="lg" className="join-full-btn">Continue</Button>
            </form>
          )}

          {step === 4 && (
            <form onSubmit={handleVoterCard} className="join-form">
              <h2>Voter Card Verification</h2>
              <p className="join-form__sub">This helps verify your identity (can be done later)</p>
              <Input label="Voter Card Number (VIN)" placeholder="19-character VIN" value={voterCard.voter_card_number} onChange={e => setVoterCard(p => ({ ...p, voter_card_number: e.target.value.toUpperCase().slice(0, 19) }))} maxLength={19} />
              <FileUpload label="Voter Card Photo (front)" accept="image/*" onChange={setVoterCardImage} />
              <Input label="APC Membership Number (optional)" placeholder="If you have one" value={voterCard.apc_membership_number} onChange={e => setVoterCard(p => ({ ...p, apc_membership_number: e.target.value }))} />
              {error && <p className="join-error">{error}</p>}
              <div className="join-actions">
                <Button type="submit" loading={loading} size="lg" className="join-full-btn">Continue</Button>
                <button type="button" className="join-skip" onClick={() => setStep(5)}>Skip for now</button>
              </div>
            </form>
          )}

          {step === 5 && (
            <div className="join-form">
              <h2>Set a Password</h2>
              <p className="join-form__sub">Create a password so you can sign in easily, even if SMS or email isn&apos;t available.</p>
              <div className="password-field">
                <Input
                  type={showPwd ? 'text' : 'password'}
                  label="New Password"
                  placeholder="At least 8 characters"
                  value={newPwd}
                  onChange={(e) => setNewPwd(e.target.value)}
                />
                <button type="button" className="pwd-toggle" onClick={() => setShowPwd((v) => !v)}>
                  {showPwd ? 'Hide' : 'Show'}
                </button>
              </div>
              <Input
                type={showPwd ? 'text' : 'password'}
                label="Confirm Password"
                placeholder="Re-enter your password"
                value={confirmPwd}
                onChange={(e) => setConfirmPwd(e.target.value)}
              />
              {error && <p className="join-error">{error}</p>}
              <Button
                loading={loading}
                size="lg"
                className="join-full-btn"
                onClick={async () => {
                  if (newPwd.length < 8) { setError('Password must be at least 8 characters'); return; }
                  if (newPwd !== confirmPwd) { setError('Passwords do not match'); return; }
                  setLoading(true); setError('');
                  try {
                    await setPassword({ new_password: newPwd, confirm_password: confirmPwd });
                    useAuthStore.getState().setUser({ ...useAuthStore.getState().user, has_password: true });
                    addToast({ type: 'success', message: 'Password set successfully!' });
                    if (!completionData) {
                      const meRes = await getMe();
                      setCompletionData(meRes.data.data);
                    }
                    setStep(6);
                  } catch (err) { setError(err.response?.data?.error?.message || 'Failed to set password'); }
                  finally { setLoading(false); }
                }}
              >
                Set Password
              </Button>
            </div>
          )}

          {step === 6 && (
            <div className="join-form join-complete">
              <div className="join-complete__icon">🎉</div>
              <h2>Welcome to City Boy Connect!</h2>
              <p className="join-form__sub">You are now part of Nigeria's most organized youth movement.</p>
              {completionData?.membership_id && (
                <div className="join-complete__id">
                  <span className="join-complete__id-label">Your Membership ID</span>
                  <span className="join-complete__id-value">{completionData.membership_id}</span>
                </div>
              )}
              {completionData?.referral_code && (
                <div className="join-complete__referral">
                  <span>Share your referral code: <strong>{completionData.referral_code}</strong></span>
                </div>
              )}
              <p className="join-complete__status">Status: Pending Verification</p>
              <Button onClick={() => navigate('/dashboard')} size="lg" className="join-full-btn">Go to Dashboard</Button>
            </div>
          )}
        </div>

        {step < 2 && (
          <p className="join-footer">Already a member? <Link to="/login">Sign In</Link></p>
        )}
      </div>
    </div>
  );
}
