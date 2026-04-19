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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-forest-dark to-forest p-6">
      <div className="bg-white rounded-2xl px-10 py-8 w-full max-w-[540px] shadow-heavy animate-slide-up">
        <Link to="/" className="block font-display font-extrabold text-[1.1rem] text-forest no-underline text-center mb-6">City Boy Connect</Link>

        {referrer && (
          <div className="bg-gradient-to-br from-forest to-forest-dark text-white rounded-xl px-4 py-3 text-center mb-4 flex flex-col gap-0.5">
            <span className="text-xs opacity-85 uppercase tracking-wide">You&apos;re joining under</span>
            <span className="font-bold text-[1.05rem]">{referrer.full_name}</span>
            {referrer.state_name && <span className="text-[0.8rem] opacity-70">{referrer.state_name}</span>}
          </div>
        )}

        <StepIndicator steps={STEPS} current={step} />

        <div className="mt-8">
          {step === 0 && (
            <>
              {authSubStep === 'phone' && (
                <form onSubmit={handlePhoneSubmit} className="flex flex-col gap-4">
                  <h2 className="text-[1.3rem] font-extrabold text-gray-900 text-center">Join the Movement</h2>
                  <p className="text-center text-gray-500 text-sm mb-2">Enter your Nigerian phone number to get started</p>
                  <PhoneInput value={phone} onChange={setPhone} label="Phone Number" error={error} />
                  <Button type="submit" loading={loading} size="lg" className="w-full">Continue</Button>
                </form>
              )}

              {authSubStep === 'method' && (
                <div className="flex flex-col gap-4">
                  <button className="bg-transparent border-none text-forest text-[0.85rem] cursor-pointer text-center font-medium hover:underline" onClick={() => { setAuthSubStep('phone'); setError(''); }}>← Change number</button>
                  <h2 className="text-[1.3rem] font-extrabold text-gray-900 text-center">Choose verification method</h2>
                  <p className="text-center text-gray-500 text-sm mb-2">How would you like to verify your phone?</p>
                  {error && <p className="text-danger text-[0.85rem] text-center">{error}</p>}
                  <div className="flex flex-col gap-2.5 mt-1">
                    {methods.includes('sms') && (
                      <button className="flex items-center gap-3.5 px-[18px] py-4 border-[1.5px] border-gray-200 rounded-[14px] bg-white cursor-pointer text-left transition-all duration-150 w-full hover:border-forest hover:bg-gray-50" onClick={() => handleMethodSelect('sms')} disabled={loading}>
                        <span className="text-2xl">💬</span>
                        <div className="flex-1">
                          <p className="font-semibold text-[0.95rem] m-0">Text message (SMS)</p>
                          <p className="text-[0.8rem] text-gray-500 mt-0.5">Get a 6-digit code sent to your phone</p>
                        </div>
                      </button>
                    )}
                    {methods.includes('email') && (
                      <button className="flex items-center gap-3.5 px-[18px] py-4 border-[1.5px] border-gray-200 rounded-[14px] bg-white cursor-pointer text-left transition-all duration-150 w-full hover:border-forest hover:bg-gray-50" onClick={() => handleMethodSelect('email')} disabled={loading}>
                        <span className="text-2xl">✉️</span>
                        <div className="flex-1">
                          <p className="font-semibold text-[0.95rem] m-0">Email</p>
                          <p className="text-[0.8rem] text-gray-500 mt-0.5">Get a code sent to your email address</p>
                        </div>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {authSubStep === 'enter-email' && (
                <div className="flex flex-col gap-4">
                  <button className="bg-transparent border-none text-forest text-[0.85rem] cursor-pointer text-center font-medium hover:underline" onClick={() => setAuthSubStep(methods.length > 1 ? 'method' : 'phone')}>← Back</button>
                  <h2 className="text-[1.3rem] font-extrabold text-gray-900 text-center">Enter your email</h2>
                  <p className="text-center text-gray-500 text-sm mb-2">We&apos;ll send your verification code there</p>
                  <Input
                    type="email" label="Email address" placeholder="you@example.com"
                    value={email} onChange={(e) => setEmail(e.target.value)} error={error}
                    onKeyDown={(e) => e.key === 'Enter' && handleEmailSubmit()}
                  />
                  <Button onClick={handleEmailSubmit} loading={loading} size="lg" className="w-full">Send code</Button>
                </div>
              )}
            </>
          )}

          {step === 1 && (
            <div className="flex flex-col gap-4">
              <button className="bg-transparent border-none text-forest text-[0.85rem] cursor-pointer text-center font-medium hover:underline" onClick={() => { setStep(0); setAuthSubStep(methods.length > 1 ? 'method' : 'phone'); setError(''); }}>← Back</button>
              <h2 className="text-[1.3rem] font-extrabold text-gray-900 text-center">Verify Your Phone</h2>
              <p className="text-center text-gray-500 text-sm mb-2">
                {otpChannel === 'sms' ? `Enter the 6-digit code sent to ${otpSentTo}` : `Enter the code sent to ${otpSentTo}`}
              </p>
              <OTPInput onComplete={handleVerifyOTP} error={error} disabled={loading} />
              {error && <p className="text-danger text-[0.85rem] text-center">{error}</p>}
              {methods.length > 1 && (
                <button className="bg-transparent border-none text-forest text-[0.85rem] cursor-pointer text-center font-medium hover:underline" onClick={() => { setStep(0); setAuthSubStep('method'); setError(''); }}>
                  Try a different method
                </button>
              )}
            </div>
          )}

          {step === 2 && (
            <form onSubmit={handleProfile} className="flex flex-col gap-4">
              <h2 className="text-[1.3rem] font-extrabold text-gray-900 text-center">Your Profile</h2>
              <p className="text-center text-gray-500 text-sm mb-2">Tell us about yourself</p>
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
              {error && <p className="text-danger text-[0.85rem] text-center">{error}</p>}
              <Button type="submit" loading={loading} size="lg" className="w-full">Continue</Button>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handlePlacement} className="flex flex-col gap-4">
              <h2 className="text-[1.3rem] font-extrabold text-gray-900 text-center">Political Placement</h2>
              <p className="text-center text-gray-500 text-sm mb-2">Where are you located?</p>
              <SearchableSelect label="State" options={states} value={placement.state} onChange={handleStateChange} placeholder="Select State" />
              <SearchableSelect label="LGA" options={lgas} value={placement.lga} onChange={handleLgaChange} placeholder={placement.state ? 'Select LGA' : 'Select State first'} disabled={!placement.state} />
              <SearchableSelect label="Ward" options={wards} value={placement.ward} onChange={val => setPlacement(p => ({ ...p, ward: val }))} placeholder={placement.lga ? 'Select Ward' : 'Select LGA first'} disabled={!placement.lga} />
              <Input label="Residential Address" placeholder="Your residential address" value={placement.residential_address} onChange={e => setPlacement(p => ({ ...p, residential_address: e.target.value }))} />
              {error && <p className="text-danger text-[0.85rem] text-center">{error}</p>}
              <Button type="submit" loading={loading} size="lg" className="w-full">Continue</Button>
            </form>
          )}

          {step === 4 && (
            <form onSubmit={handleVoterCard} className="flex flex-col gap-4">
              <h2 className="text-[1.3rem] font-extrabold text-gray-900 text-center">Voter Card Verification</h2>
              <p className="text-center text-gray-500 text-sm mb-2">This helps verify your identity (can be done later)</p>
              <Input label="Voter Card Number (VIN)" placeholder="19-character VIN" value={voterCard.voter_card_number} onChange={e => setVoterCard(p => ({ ...p, voter_card_number: e.target.value.toUpperCase().slice(0, 19) }))} maxLength={19} />
              <FileUpload label="Voter Card Photo (front)" accept="image/*" onChange={setVoterCardImage} />
              <Input label="APC Membership Number (optional)" placeholder="If you have one" value={voterCard.apc_membership_number} onChange={e => setVoterCard(p => ({ ...p, apc_membership_number: e.target.value }))} />
              {error && <p className="text-danger text-[0.85rem] text-center">{error}</p>}
              <div className="flex flex-col gap-2 items-center">
                <Button type="submit" loading={loading} size="lg" className="w-full">Continue</Button>
                <button type="button" className="bg-transparent border-none text-gray-400 text-[0.85rem] cursor-pointer text-center font-medium hover:underline" onClick={() => setStep(5)}>Skip for now</button>
              </div>
            </form>
          )}

          {step === 5 && (
            <div className="flex flex-col gap-4">
              <h2 className="text-[1.3rem] font-extrabold text-gray-900 text-center">Set a Password</h2>
              <p className="text-center text-gray-500 text-sm mb-2">Create a password so you can sign in easily, even if SMS or email isn&apos;t available.</p>
              <div className="relative">
                <Input
                  type={showPwd ? 'text' : 'password'}
                  label="New Password"
                  placeholder="At least 8 characters"
                  value={newPwd}
                  onChange={(e) => setNewPwd(e.target.value)}
                />
                <button type="button" className="absolute right-3 top-[34px] bg-transparent border-none text-forest text-[0.8rem] cursor-pointer font-semibold" onClick={() => setShowPwd((v) => !v)}>
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
              {error && <p className="text-danger text-[0.85rem] text-center">{error}</p>}
              <Button
                loading={loading}
                size="lg"
                className="w-full"
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
            <div className="flex flex-col gap-4 items-center text-center">
              <div className="text-5xl mb-4 animate-count-up">🎉</div>
              <h2 className="text-[1.3rem] font-extrabold text-gray-900 text-center">Welcome to City Boy Connect!</h2>
              <p className="text-center text-gray-500 text-sm mb-2">You are now part of Nigeria's most organized youth movement.</p>
              {completionData?.membership_id && (
                <div className="flex flex-col items-center gap-1 p-4 bg-gray-50 rounded-xl border-2 border-dashed border-forest">
                  <span className="text-xs text-gray-500 uppercase tracking-widest">Your Membership ID</span>
                  <span className="font-mono text-xl font-bold text-forest">{completionData.membership_id}</span>
                </div>
              )}
              {completionData?.referral_code && (
                <div className="text-[0.85rem] text-gray-500 px-4 py-2 bg-gray-50 rounded-lg">
                  <span>Share your referral code: <strong className="text-gold-dark">{completionData.referral_code}</strong></span>
                </div>
              )}
              <p className="text-[0.85rem] text-warning font-semibold">Status: Pending Verification</p>
              <Button onClick={() => navigate('/dashboard')} size="lg" className="w-full">Go to Dashboard</Button>
            </div>
          )}
        </div>

        {step < 2 && (
          <p className="text-center text-[0.85rem] text-gray-500 mt-8">Already a member? <Link to="/login" className="text-forest font-semibold">Sign In</Link></p>
        )}
      </div>
    </div>
  );
}
