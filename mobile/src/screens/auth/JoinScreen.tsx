import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';
import { Share } from 'react-native';
import Animated, { FadeIn, SlideInRight, SlideOutLeft } from 'react-native-reanimated';
import { requestOTP, verifyOTP, getMe } from '../../api/auth';
import { onboardingProfile, onboardingPlacement, onboardingVoterCard } from '../../api/onboarding';
import { getStates, getLGAs, getWards } from '../../api/structure';
import { unwrap } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import PhoneInput from '../../components/PhoneInput';
import OTPInput from '../../components/OTPInput';
import StepProgressBar from '../../components/ui/StepProgressBar';
import BottomSheetPicker from '../../components/ui/BottomSheetPicker';
import DatePickerSheet from '../../components/ui/DatePickerSheet';
import ReferralBanner from '../../components/ui/ReferralBanner';
import MembershipCard from '../../components/ui/MembershipCard';
import { AuthStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Join'>;

const TOTAL_STEPS = 6;

export default function JoinScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProp<AuthStackParamList, 'Join'>>();
  const loginAction = useAuthStore((s) => s.login);
  const toast = useToastStore((s) => s.show);

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 0: Phone
  const [phone, setPhone] = useState('');
  // Step 1: OTP
  const [countdown, setCountdown] = useState(0);
  // Step 2: Profile
  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);
  const [gender, setGender] = useState('');
  const [occupation, setOccupation] = useState('');
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  // Step 3: Placement
  const [states, setStates] = useState<any[]>([]);
  const [lgas, setLgas] = useState<any[]>([]);
  const [wards, setWardsData] = useState<any[]>([]);
  const [stateId, setStateId] = useState<number | null>(null);
  const [stateName, setStateName] = useState('');
  const [lgaId, setLgaId] = useState<number | null>(null);
  const [lgaName, setLgaName] = useState('');
  const [wardId, setWardId] = useState<number | null>(null);
  const [wardName, setWardName] = useState('');
  const [address, setAddress] = useState('');
  const [pickerType, setPickerType] = useState<'state' | 'lga' | 'ward' | null>(null);
  // Step 4: Voter Card
  const [vin, setVin] = useState('');
  const [apcNumber, setApcNumber] = useState('');
  const [voterPhoto, setVoterPhoto] = useState<string | null>(null);

  // Referral
  const referralToken = route.params?.ref || '';
  const [showReferral, setShowReferral] = useState(!!referralToken);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  // Load states on step 3
  useEffect(() => {
    if (step === 3 && states.length === 0) {
      getStates().then((res) => {
        const data = unwrap(res);
        setStates(Array.isArray(data) ? data : data.results || []);
      }).catch(() => {});
    }
  }, [step]);

  const normalizePhone = (p: string) => {
    const clean = p.replace(/\D/g, '');
    if (clean.startsWith('0')) return '+234' + clean.slice(1);
    if (clean.startsWith('234')) return '+' + clean;
    return '+234' + clean;
  };

  // Step 0: Send OTP
  const handleSendOTP = async () => {
    if (phone.length < 10) { setError('Enter a valid phone number'); return; }
    setLoading(true); setError('');
    try {
      await requestOTP(normalizePhone(phone));
      setStep(1);
      setCountdown(60);
      toast('OTP sent!', 'success');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to send OTP');
    } finally { setLoading(false); }
  };

  // Step 1: Verify OTP
  const handleVerifyOTP = async (code: string) => {
    setLoading(true); setError('');
    try {
      const res = await verifyOTP(normalizePhone(phone), code);
      const data = unwrap(res);
      useAuthStore.getState().setTokens(data.access, data.refresh);
      setStep(2);
      toast('Phone verified!', 'success');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.response?.data?.message || 'Invalid OTP');
    } finally { setLoading(false); }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setLoading(true); setError('');
    try {
      await requestOTP(normalizePhone(phone));
      setCountdown(60);
      toast('OTP resent!', 'success');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to resend');
    } finally { setLoading(false); }
  };

  // Step 2: Profile
  const pickProfilePhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setProfilePhoto(result.assets[0].uri);
    }
  };

  const handleProfile = async () => {
    if (!fullName.trim()) { setError('Full name is required'); return; }
    if (!gender) { setError('Please select your gender'); return; }
    setLoading(true); setError('');
    try {
      const formData = new FormData();
      formData.append('full_name', fullName.trim());
      if (gender) formData.append('gender', gender);
      if (occupation) formData.append('occupation', occupation);
      if (dateOfBirth) formData.append('date_of_birth', dateOfBirth.toISOString().split('T')[0]);
      if (profilePhoto) {
        const ext = profilePhoto.split('.').pop() || 'jpg';
        formData.append('profile_photo', { uri: profilePhoto, name: `photo.${ext}`, type: `image/${ext}` } as any);
      }
      await onboardingProfile(formData);
      setStep(3);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to save profile');
    } finally { setLoading(false); }
  };

  // Step 3: Placement
  const handleStateSelect = async (value: number | string, label: string) => {
    const id = Number(value);
    setStateId(id);
    setStateName(label);
    setLgaId(null); setLgaName(''); setWardId(null); setWardName('');
    setLgas([]); setWardsData([]);
    try {
      const res = await getLGAs(id);
      const data = unwrap(res);
      setLgas(Array.isArray(data) ? data : data.results || []);
    } catch {}
  };

  const handleLgaSelect = async (value: number | string, label: string) => {
    const id = Number(value);
    setLgaId(id);
    setLgaName(label);
    setWardId(null); setWardName('');
    setWardsData([]);
    try {
      const res = await getWards(id);
      const data = unwrap(res);
      setWardsData(Array.isArray(data) ? data : data.results || []);
    } catch {}
  };

  const handlePlacement = async () => {
    if (!stateId) { setError('Select your state'); return; }
    if (!lgaId) { setError('Select your LGA'); return; }
    if (!wardId) { setError('Select your ward'); return; }
    setLoading(true); setError('');
    try {
      const payload: any = { state: stateId, lga: lgaId, ward: wardId };
      if (address) payload.residential_address = address;
      if (referralToken) payload.referral_token = referralToken;
      await onboardingPlacement(payload);
      setStep(4);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to save placement');
    } finally { setLoading(false); }
  };

  // Step 4: Voter Card
  const pickVoterPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setVoterPhoto(result.assets[0].uri);
    }
  };

  const handleVoterCard = async (skip = false) => {
    setLoading(true); setError('');
    try {
      if (!skip) {
        const formData = new FormData();
        if (vin) formData.append('voter_card_number', vin.toUpperCase());
        if (apcNumber) formData.append('apc_membership_number', apcNumber);
        if (voterPhoto) {
          const ext = voterPhoto.split('.').pop() || 'jpg';
          formData.append('voter_card_photo', { uri: voterPhoto, name: `voter.${ext}`, type: `image/${ext}` } as any);
        }
        await onboardingVoterCard(formData);
      }
      const meRes = await getMe();
      const user = unwrap(meRes);
      const { accessToken, refreshToken } = useAuthStore.getState();
      loginAction(user, accessToken!, refreshToken!);
      setStep(5);
      toast('Welcome to the Movement! 🎉', 'success');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to submit');
    } finally { setLoading(false); }
  };

  // Share referral
  const user = useAuthStore((s) => s.user);
  const handleCopyReferral = async () => {
    if (user?.referral_code) {
      await Clipboard.setStringAsync(user.referral_code);
      toast('Referral code copied!', 'success');
    }
  };
  const handleShareReferral = async () => {
    if (user?.referral_code) {
      await Share.share({ message: `Join City Boy Connect with my referral code: ${user.referral_code}` });
    }
  };

  const goBack = () => {
    if (step > 0 && step < 5) {
      setStep(step - 1);
      setError('');
    }
  };

  // Picker data
  const pickerOptions = pickerType === 'state'
    ? states.map((s) => ({ label: s.name, value: s.id }))
    : pickerType === 'lga'
    ? lgas.map((l) => ({ label: l.name, value: l.id }))
    : wards.map((w) => ({ label: w.name, value: w.id }));

  const pickerValue = pickerType === 'state' ? stateId : pickerType === 'lga' ? lgaId : wardId;
  const pickerTitle = pickerType === 'state' ? 'Select State' : pickerType === 'lga' ? 'Select LGA' : 'Select Ward';

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        {/* Top Bar */}
        {step < 5 && (
          <View className="flex-row items-center justify-between px-4 py-2">
            {step > 0 && step < 5 ? (
              <Pressable onPress={goBack} hitSlop={12}><Text className="font-body text-base text-forest">← Back</Text></Pressable>
            ) : <View className="w-[60px]" />}
            <Image
              source={require('../../../assets/files/08_horizontal_dark.png')}
              style={{ width: 120, height: 32 }}
              contentFit="contain"
            />
            <Text className="font-body text-xs text-gray-400">Step {step + 1} of {TOTAL_STEPS}</Text>
          </View>
        )}

        {/* Progress Bar */}
        {step < 5 && (
          <View className="px-6 mb-4">
            <StepProgressBar current={step} total={TOTAL_STEPS} />
          </View>
        )}

        <ScrollView contentContainerClassName="grow px-6 pb-12" keyboardShouldPersistTaps="handled" bounces={false}>
          {/* Referral Banner */}
          {showReferral && step < 5 && referralToken && (
            <ReferralBanner referrerName={referralToken} onDismiss={() => setShowReferral(false)} />
          )}

          {/* Step 0: Phone */}
          {step === 0 && (
            <Animated.View entering={FadeIn.duration(300)} className="flex-1">
              <View className="w-[72px] h-[72px] rounded-full bg-forest-light/[0.08] justify-center items-center self-center mb-6">
                <Text className="text-[32px]">📱</Text>
              </View>
              <Text className="font-display text-2xl text-gray-900 mb-1 text-center">Join the Movement</Text>
              <Text className="font-body text-base text-gray-500 text-center mb-6">Enter your Nigerian phone number</Text>
              <PhoneInput value={phone} onChangeText={setPhone} error={error} />
              <Button onPress={handleSendOTP} loading={loading} size="lg" className="mt-4">
                Send Verification Code
              </Button>
              <View className="flex-row items-center my-6">
                <View className="flex-1 h-px bg-gray-200" /><Text className="font-body text-sm text-gray-400 mx-4">or</Text><View className="flex-1 h-px bg-gray-200" />
              </View>
              <Pressable onPress={() => navigation.navigate('Login')}>
                <Text className="font-body text-base text-gray-500 text-center">Already a member? <Text className="text-forest font-body-semibold">Log In</Text></Text>
              </Pressable>
            </Animated.View>
          )}

          {/* Step 1: OTP */}
          {step === 1 && (
            <Animated.View entering={SlideInRight.duration(300)} className="flex-1">
              <View className="w-[72px] h-[72px] rounded-full bg-forest-light/[0.08] justify-center items-center self-center mb-6">
                <Text className="text-[32px]">✅</Text>
              </View>
              <Text className="font-display text-2xl text-gray-900 mb-1 text-center">Code sent to</Text>
              <View className="bg-forest-light/[0.08] self-center px-4 py-1 rounded-full mb-6">
                <Text className="font-body-medium text-base text-forest">+234 {phone.replace(/^0/, '')}</Text>
              </View>
              <OTPInput onComplete={handleVerifyOTP} />
              {error ? <Text className="font-body text-xs text-danger text-center mt-2">{error}</Text> : null}
              {loading && <Text className="font-body text-sm text-gray-500 text-center mt-2">Verifying...</Text>}
              <View className="items-center mt-6">
                {countdown > 0 ? (
                  <Text className="font-body text-sm text-gray-400">Resend code in 0:{countdown.toString().padStart(2, '0')}</Text>
                ) : (
                  <Pressable onPress={handleResend}><Text className="font-body-medium text-base text-forest">Resend Code</Text></Pressable>
                )}
              </View>
              <Pressable onPress={() => { setStep(0); setError(''); }}>
                <Text className="font-body text-base text-gray-500 text-center mt-4">← Change number</Text>
              </Pressable>
            </Animated.View>
          )}

          {/* Step 2: Profile */}
          {step === 2 && (
            <Animated.View entering={SlideInRight.duration(300)} className="flex-1">
              <Text className="font-display text-2xl text-gray-900 mb-1 text-center">Tell us about yourself</Text>
              <Text className="font-body text-base text-gray-500 text-center mb-6">Step 3 • Profile</Text>

              <Pressable className="w-[100px] h-[100px] rounded-full border-2 border-dashed border-forest justify-center items-center self-center mb-1 overflow-hidden bg-background" onPress={pickProfilePhoto}>
                {profilePhoto ? (
                  <Image source={{ uri: profilePhoto }} style={{ width: 100, height: 100 }} contentFit="cover" />
                ) : (
                  <Text className="text-[32px]">📷</Text>
                )}
              </Pressable>
              <Text className="font-body text-xs text-gray-400 text-center mb-6">Add photo (optional)</Text>

              <Input label="Full Name *" value={fullName} onChangeText={setFullName} placeholder="e.g. John Doe" />

              <Pressable onPress={() => setShowDatePicker(true)}>
                <View pointerEvents="none">
                  <Input
                    label="Date of Birth *"
                    value={dateOfBirth ? dateOfBirth.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                    placeholder="Select your date of birth"
                    editable={false}
                  />
                </View>
              </Pressable>

              <Text className="font-body-medium text-sm text-gray-900 mb-1">Gender *</Text>
              <View className="flex-row gap-2 mb-4">
                {[{ label: 'Male', value: 'M' }, { label: 'Female', value: 'F' }, { label: 'Other', value: 'O' }].map((g) => (
                  <Pressable
                    key={g.value}
                    className={`flex-1 h-[44px] rounded-full border-[1.5px] justify-center items-center ${gender === g.value ? 'bg-forest border-forest' : 'border-gray-200 bg-surface'}`}
                    onPress={() => setGender(g.value)}
                  >
                    <Text className={`font-body-medium text-base ${gender === g.value ? 'text-white' : 'text-gray-500'}`}>{g.label}</Text>
                  </Pressable>
                ))}
              </View>

              <Input label="Occupation" value={occupation} onChangeText={setOccupation} placeholder="e.g. Engineer" />

              {error ? <Text className="font-body text-xs text-danger text-center mt-2">{error}</Text> : null}
              <Button onPress={handleProfile} loading={loading} size="lg" className="mt-4">
                Continue →
              </Button>

              <DatePickerSheet
                visible={showDatePicker}
                value={dateOfBirth}
                onSelect={setDateOfBirth}
                onClose={() => setShowDatePicker(false)}
              />
            </Animated.View>
          )}

          {/* Step 3: Placement */}
          {step === 3 && (
            <Animated.View entering={SlideInRight.duration(300)} className="flex-1">
              <Text className="font-display text-2xl text-gray-900 mb-1 text-center">📍 Where are you from?</Text>
              <Text className="font-body text-base text-gray-500 text-center mb-6">This determines your ward & LGA</Text>

              <Pressable onPress={() => setPickerType('state')}>
                <View pointerEvents="none">
                  <Input label="State *" value={stateName} placeholder="Select your state..." editable={false} />
                </View>
              </Pressable>

              <Pressable onPress={() => stateId && setPickerType('lga')} disabled={!stateId}>
                <View pointerEvents="none">
                  <Input label="LGA *" value={lgaName} placeholder={stateId ? 'Select your LGA...' : 'Select state first'} editable={false} />
                </View>
              </Pressable>

              <Pressable onPress={() => lgaId && setPickerType('ward')} disabled={!lgaId}>
                <View pointerEvents="none">
                  <Input label="Ward *" value={wardName} placeholder={lgaId ? 'Select your ward...' : 'Select LGA first'} editable={false} />
                </View>
              </Pressable>

              <Input label="Residential Address (optional)" value={address} onChangeText={setAddress} placeholder="Your street address" multiline />

              {error ? <Text className="font-body text-xs text-danger text-center mt-2">{error}</Text> : null}
              <Button onPress={handlePlacement} loading={loading} size="lg" className="mt-4">
                Continue →
              </Button>

              <BottomSheetPicker
                visible={!!pickerType}
                options={pickerOptions}
                value={pickerValue}
                title={pickerTitle}
                onSelect={(value, label) => {
                  if (pickerType === 'state') handleStateSelect(value, label);
                  else if (pickerType === 'lga') handleLgaSelect(value, label);
                  else { setWardId(Number(value)); setWardName(label); }
                }}
                onClose={() => setPickerType(null)}
              />
            </Animated.View>
          )}

          {/* Step 4: Voter Card */}
          {step === 4 && (
            <Animated.View entering={SlideInRight.duration(300)} className="flex-1">
              <Text className="font-display text-2xl text-gray-900 mb-1 text-center">🗳️ Voter Verification</Text>
              <Text className="font-body text-base text-gray-500 text-center mb-6">Verify your voter card to unlock full member privileges</Text>

              <Input
                label="Voter Identification Number (VIN)"
                value={vin}
                onChangeText={(t) => setVin(t.toUpperCase())}
                placeholder="19-character VIN"
                maxLength={19}
                autoCapitalize="characters"
              />

              <Input label="APC Membership Number (optional)" value={apcNumber} onChangeText={setApcNumber} placeholder="If you have one" />

              <Text className="font-body-medium text-sm text-gray-900 mb-1">Voter Card Photo</Text>
              <Pressable className="h-[140px] rounded-lg border-2 border-dashed border-gray-200 justify-center items-center bg-background mb-4 overflow-hidden" onPress={pickVoterPhoto}>
                {voterPhoto ? (
                  <Image source={{ uri: voterPhoto }} className="w-full h-full" contentFit="cover" />
                ) : (
                  <>
                    <Text className="text-[32px] mb-1">📄</Text>
                    <Text className="font-body text-sm text-gray-400">Tap to upload photo</Text>
                  </>
                )}
              </Pressable>

              {error ? <Text className="font-body text-xs text-danger text-center mt-2">{error}</Text> : null}
              <Button onPress={() => handleVoterCard(false)} loading={loading} size="lg" className="mt-4">
                Submit & Verify
              </Button>

              <View className="flex-row items-center my-6">
                <View className="flex-1 h-px bg-gray-200" /><Text className="font-body text-sm text-gray-400 mx-4">or</Text><View className="flex-1 h-px bg-gray-200" />
              </View>
              <Pressable onPress={() => handleVoterCard(true)}>
                <Text className="font-body-medium text-base text-forest text-center">Skip for now →</Text>
              </Pressable>
              <Text className="font-body text-xs text-gray-400 text-center mt-1">You can verify later in Profile</Text>
            </Animated.View>
          )}

          {/* Step 5: Success */}
          {step === 5 && (
            <Animated.View entering={FadeIn.duration(500)} className="flex-1 items-center justify-center bg-forest-dark rounded-xl p-8 mt-4">
              <Image
                source={require('../../../assets/files/07_icon_gold.png')}
                style={{ width: 100, height: 100 }}
                className="mb-6"
                contentFit="contain"
              />
              <Text className="font-display text-3xl text-white mb-1">You're In! 🎉</Text>
              <Text className="font-body text-base text-gold mb-8">Welcome to City Boy Connect</Text>

              {user && <MembershipCard user={user} compact />}

              {user?.referral_code && (
                <View className="items-center mt-6">
                  <Text className="font-body text-sm text-white/70 mb-1">Your Referral Code</Text>
                  <Text className="font-display text-xl text-gold mb-4">{user.referral_code}</Text>
                  <View className="flex-row gap-2">
                    <Pressable className="bg-gold px-4 py-2 rounded-full" onPress={handleCopyReferral}>
                      <Text className="font-body-bold text-sm text-forest-dark">📋 Copy</Text>
                    </Pressable>
                    <Pressable className="bg-gold px-4 py-2 rounded-full" onPress={handleShareReferral}>
                      <Text className="font-body-bold text-sm text-forest-dark">📤 Share</Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </Animated.View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

