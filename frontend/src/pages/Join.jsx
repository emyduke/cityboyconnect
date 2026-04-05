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
import { requestOTP, verifyOTP, getMe, onboardingProfile, onboardingPlacement, onboardingVoterCard, getStates, getLGAs, getWards, validateRef } from '../api/client';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';

const STEPS = ['Phone', 'Verify', 'Profile', 'Placement', 'Voter Card', 'Done'];

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

  // Step 0 - Phone
  const [phone, setPhone] = useState('');

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

  // Step 0: Send OTP
  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (phone.replace(/\D/g, '').length < 10) { setError('Enter a valid phone number'); return; }
    setLoading(true); setError('');
    try {
      await requestOTP(phone);
      setStep(1);
      addToast({ type: 'success', message: 'OTP sent!' });
    } catch (err) { setError(err.response?.data?.error?.message || 'Failed to send OTP'); }
    finally { setLoading(false); }
  };

  // Step 1: Verify OTP
  const handleVerifyOTP = async (otp) => {
    setLoading(true); setError('');
    try {
      const res = await verifyOTP(phone, otp);
      const { access, refresh } = res.data.data;
      useAuthStore.getState().setTokens(access, refresh);
      const meRes = await getMe();
      storeLogin(meRes.data.data, access, refresh);
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
      addToast({ type: 'success', message: 'Registration complete!' });
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
            <form onSubmit={handleSendOTP} className="join-form">
              <h2>Join the Movement</h2>
              <p className="join-form__sub">Enter your Nigerian phone number to get started</p>
              <PhoneInput value={phone} onChange={setPhone} label="Phone Number" error={error} />
              <Button type="submit" loading={loading} size="lg" className="join-full-btn">Send OTP</Button>
            </form>
          )}

          {step === 1 && (
            <div className="join-form">
              <h2>Verify Your Phone</h2>
              <p className="join-form__sub">Enter the 6-digit code sent to {phone}</p>
              <OTPInput onComplete={handleVerifyOTP} error={error} disabled={loading} />
              {error && <p className="join-error">{error}</p>}
              <button className="join-back" onClick={() => { setStep(0); setError(''); }}>← Change number</button>
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
                <Button type="submit" loading={loading} size="lg" className="join-full-btn">Complete Registration</Button>
                <button type="button" className="join-skip" onClick={() => { setCompletionData({}); setStep(5); }}>Skip for now</button>
              </div>
            </form>
          )}

          {step === 5 && (
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
