import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';
import { Share } from 'react-native';
import Animated, { FadeIn, SlideInRight, SlideOutLeft } from 'react-native-reanimated';
import { colors, spacing, radius, typography, shadows } from '../../theme';
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
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        {/* Top Bar */}
        {step < 5 && (
          <View style={styles.topBar}>
            {step > 0 && step < 5 ? (
              <Pressable onPress={goBack} hitSlop={12}><Text style={styles.backBtn}>← Back</Text></Pressable>
            ) : <View style={{ width: 60 }} />}
            <Image
              source={require('../../../assets/files/08_horizontal_dark.png')}
              style={styles.topLogo}
              contentFit="contain"
            />
            <Text style={styles.stepLabel}>Step {step + 1} of {TOTAL_STEPS}</Text>
          </View>
        )}

        {/* Progress Bar */}
        {step < 5 && (
          <View style={styles.progressWrap}>
            <StepProgressBar current={step} total={TOTAL_STEPS} />
          </View>
        )}

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" bounces={false}>
          {/* Referral Banner */}
          {showReferral && step < 5 && referralToken && (
            <ReferralBanner referrerName={referralToken} onDismiss={() => setShowReferral(false)} />
          )}

          {/* Step 0: Phone */}
          {step === 0 && (
            <Animated.View entering={FadeIn.duration(300)} style={styles.stepContainer}>
              <View style={styles.iconCircle}>
                <Text style={{ fontSize: 32 }}>📱</Text>
              </View>
              <Text style={styles.heading}>Join the Movement</Text>
              <Text style={styles.subtitle}>Enter your Nigerian phone number</Text>
              <PhoneInput value={phone} onChangeText={setPhone} error={error} />
              <Button onPress={handleSendOTP} loading={loading} size="lg" style={styles.btn}>
                Send Verification Code
              </Button>
              <View style={styles.divider}>
                <View style={styles.line} /><Text style={styles.divText}>or</Text><View style={styles.line} />
              </View>
              <Pressable onPress={() => navigation.navigate('Login')}>
                <Text style={styles.linkText}>Already a member? <Text style={styles.linkBold}>Log In</Text></Text>
              </Pressable>
            </Animated.View>
          )}

          {/* Step 1: OTP */}
          {step === 1 && (
            <Animated.View entering={SlideInRight.duration(300)} style={styles.stepContainer}>
              <View style={styles.iconCircle}>
                <Text style={{ fontSize: 32 }}>✅</Text>
              </View>
              <Text style={styles.heading}>Code sent to</Text>
              <View style={styles.phonePill}>
                <Text style={styles.phonePillText}>+234 {phone.replace(/^0/, '')}</Text>
              </View>
              <OTPInput onComplete={handleVerifyOTP} />
              {error ? <Text style={styles.error}>{error}</Text> : null}
              {loading && <Text style={styles.verifying}>Verifying...</Text>}
              <View style={styles.resendRow}>
                {countdown > 0 ? (
                  <Text style={styles.countdown}>Resend code in 0:{countdown.toString().padStart(2, '0')}</Text>
                ) : (
                  <Pressable onPress={handleResend}><Text style={styles.resendLink}>Resend Code</Text></Pressable>
                )}
              </View>
              <Pressable onPress={() => { setStep(0); setError(''); }}>
                <Text style={styles.changeLink}>← Change number</Text>
              </Pressable>
            </Animated.View>
          )}

          {/* Step 2: Profile */}
          {step === 2 && (
            <Animated.View entering={SlideInRight.duration(300)} style={styles.stepContainer}>
              <Text style={styles.heading}>Tell us about yourself</Text>
              <Text style={styles.subtitle}>Step 3 • Profile</Text>

              <Pressable style={styles.photoCircle} onPress={pickProfilePhoto}>
                {profilePhoto ? (
                  <Image source={{ uri: profilePhoto }} style={styles.photoImage} contentFit="cover" />
                ) : (
                  <Text style={styles.cameraIcon}>📷</Text>
                )}
              </Pressable>
              <Text style={styles.photoHint}>Add photo (optional)</Text>

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

              <Text style={styles.fieldLabel}>Gender *</Text>
              <View style={styles.genderRow}>
                {[{ label: 'Male', value: 'M' }, { label: 'Female', value: 'F' }, { label: 'Other', value: 'O' }].map((g) => (
                  <Pressable
                    key={g.value}
                    style={[styles.genderPill, gender === g.value && styles.genderPillActive]}
                    onPress={() => setGender(g.value)}
                  >
                    <Text style={[styles.genderText, gender === g.value && styles.genderTextActive]}>{g.label}</Text>
                  </Pressable>
                ))}
              </View>

              <Input label="Occupation" value={occupation} onChangeText={setOccupation} placeholder="e.g. Engineer" />

              {error ? <Text style={styles.error}>{error}</Text> : null}
              <Button onPress={handleProfile} loading={loading} size="lg" style={styles.btn}>
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
            <Animated.View entering={SlideInRight.duration(300)} style={styles.stepContainer}>
              <Text style={styles.heading}>📍 Where are you from?</Text>
              <Text style={styles.subtitle}>This determines your ward & LGA</Text>

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

              {error ? <Text style={styles.error}>{error}</Text> : null}
              <Button onPress={handlePlacement} loading={loading} size="lg" style={styles.btn}>
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
            <Animated.View entering={SlideInRight.duration(300)} style={styles.stepContainer}>
              <Text style={styles.heading}>🗳️ Voter Verification</Text>
              <Text style={styles.subtitle}>Verify your voter card to unlock full member privileges</Text>

              <Input
                label="Voter Identification Number (VIN)"
                value={vin}
                onChangeText={(t) => setVin(t.toUpperCase())}
                placeholder="19-character VIN"
                maxLength={19}
                autoCapitalize="characters"
              />

              <Input label="APC Membership Number (optional)" value={apcNumber} onChangeText={setApcNumber} placeholder="If you have one" />

              <Text style={styles.fieldLabel}>Voter Card Photo</Text>
              <Pressable style={styles.uploadBox} onPress={pickVoterPhoto}>
                {voterPhoto ? (
                  <Image source={{ uri: voterPhoto }} style={styles.uploadImage} contentFit="cover" />
                ) : (
                  <>
                    <Text style={styles.uploadIcon}>📄</Text>
                    <Text style={styles.uploadText}>Tap to upload photo</Text>
                  </>
                )}
              </Pressable>

              {error ? <Text style={styles.error}>{error}</Text> : null}
              <Button onPress={() => handleVoterCard(false)} loading={loading} size="lg" style={styles.btn}>
                Submit & Verify
              </Button>

              <View style={styles.divider}>
                <View style={styles.line} /><Text style={styles.divText}>or</Text><View style={styles.line} />
              </View>
              <Pressable onPress={() => handleVoterCard(true)}>
                <Text style={styles.skipLink}>Skip for now →</Text>
              </Pressable>
              <Text style={styles.skipHint}>You can verify later in Profile</Text>
            </Animated.View>
          )}

          {/* Step 5: Success */}
          {step === 5 && (
            <Animated.View entering={FadeIn.duration(500)} style={styles.successContainer}>
              <Image
                source={require('../../../assets/files/07_icon_gold.png')}
                style={styles.successIcon}
                contentFit="contain"
              />
              <Text style={styles.successTitle}>You're In! 🎉</Text>
              <Text style={styles.successSubtitle}>Welcome to City Boy Connect</Text>

              {user && <MembershipCard user={user} compact />}

              {user?.referral_code && (
                <View style={styles.referralSection}>
                  <Text style={styles.referralLabel}>Your Referral Code</Text>
                  <Text style={styles.referralCode}>{user.referral_code}</Text>
                  <View style={styles.referralButtons}>
                    <Pressable style={styles.refBtn} onPress={handleCopyReferral}>
                      <Text style={styles.refBtnText}>📋 Copy</Text>
                    </Pressable>
                    <Pressable style={styles.refBtn} onPress={handleShareReferral}>
                      <Text style={styles.refBtnText}>📤 Share</Text>
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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  backBtn: { ...typography.body, color: colors.primary },
  topLogo: { width: 120, height: 32 },
  stepLabel: { ...typography.caption, color: colors.textTertiary },
  progressWrap: { paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  scroll: { flexGrow: 1, paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  stepContainer: { flex: 1 },
  heading: { ...typography.h2, color: colors.text, marginBottom: spacing.xs, textAlign: 'center' },
  subtitle: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.lg },
  iconCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: colors.primaryLight + '15',
    justifyContent: 'center', alignItems: 'center',
    alignSelf: 'center', marginBottom: spacing.lg,
  },
  btn: { marginTop: spacing.md },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: spacing.lg },
  line: { flex: 1, height: 1, backgroundColor: colors.divider },
  divText: { ...typography.bodySm, color: colors.textTertiary, marginHorizontal: spacing.md },
  linkText: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
  linkBold: { color: colors.primary, fontFamily: 'PlusJakartaSans-SemiBold' },
  phonePill: {
    backgroundColor: colors.primaryLight + '15',
    alignSelf: 'center',
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    borderRadius: radius.full, marginBottom: spacing.lg,
  },
  phonePillText: { ...typography.bodyMedium, color: colors.primary },
  error: { ...typography.caption, color: colors.danger, textAlign: 'center', marginTop: spacing.sm },
  verifying: { ...typography.bodySm, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm },
  resendRow: { alignItems: 'center', marginTop: spacing.lg },
  countdown: { ...typography.bodySm, color: colors.textTertiary },
  resendLink: { ...typography.bodyMedium, color: colors.primary },
  changeLink: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.md },
  // Profile
  photoCircle: {
    width: 100, height: 100, borderRadius: 50,
    borderWidth: 2, borderColor: colors.primary, borderStyle: 'dashed',
    justifyContent: 'center', alignItems: 'center',
    alignSelf: 'center', marginBottom: spacing.xs,
    overflow: 'hidden', backgroundColor: colors.background,
  },
  photoImage: { width: 100, height: 100 },
  cameraIcon: { fontSize: 32 },
  photoHint: { ...typography.caption, color: colors.textTertiary, textAlign: 'center', marginBottom: spacing.lg },
  fieldLabel: { ...typography.bodySm, fontFamily: 'PlusJakartaSans-Medium', color: colors.text, marginBottom: spacing.xs },
  genderRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  genderPill: {
    flex: 1, height: 44, borderRadius: radius.full,
    borderWidth: 1.5, borderColor: colors.border,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: colors.surface,
  },
  genderPillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  genderText: { ...typography.bodyMedium, color: colors.textSecondary },
  genderTextActive: { color: colors.textInverse },
  // Voter Card
  uploadBox: {
    height: 140, borderRadius: radius.lg,
    borderWidth: 2, borderColor: colors.border, borderStyle: 'dashed',
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: colors.background, marginBottom: spacing.md,
    overflow: 'hidden',
  },
  uploadImage: { width: '100%', height: '100%' },
  uploadIcon: { fontSize: 32, marginBottom: spacing.xs },
  uploadText: { ...typography.bodySm, color: colors.textTertiary },
  skipLink: { ...typography.bodyMedium, color: colors.primary, textAlign: 'center' },
  skipHint: { ...typography.caption, color: colors.textTertiary, textAlign: 'center', marginTop: spacing.xs },
  // Success
  successContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.primaryDark, borderRadius: radius.xl,
    padding: spacing.xl, marginTop: spacing.md,
  },
  successIcon: { width: 100, height: 100, marginBottom: spacing.lg },
  successTitle: { ...typography.h1, color: colors.textInverse, marginBottom: spacing.xs },
  successSubtitle: { ...typography.body, color: colors.accent, marginBottom: spacing.xl },
  referralSection: { alignItems: 'center', marginTop: spacing.lg },
  referralLabel: { ...typography.bodySm, color: 'rgba(255,255,255,0.7)', marginBottom: spacing.xs },
  referralCode: { ...typography.h3, color: colors.accent, marginBottom: spacing.md },
  referralButtons: { flexDirection: 'row', gap: spacing.sm },
  refBtn: {
    backgroundColor: colors.accent, paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm, borderRadius: radius.full,
  },
  refBtnText: { ...typography.bodySm, color: colors.primaryDark, fontFamily: 'PlusJakartaSans-Bold' },
});
