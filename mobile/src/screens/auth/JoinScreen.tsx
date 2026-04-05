import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, radius, typography } from '../../theme';
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
import { AuthStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Join'>;

const STEPS = ['Phone', 'OTP', 'Profile', 'Placement', 'Voter Card', 'Done'];

export default function JoinScreen() {
  const navigation = useNavigation<Nav>();
  const login = useAuthStore((s) => s.login);
  const toast = useToastStore((s) => s.show);

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 0: Phone
  const [phone, setPhone] = useState('');
  // Step 2: Profile
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState('');
  const [occupation, setOccupation] = useState('');
  // Step 3: Placement
  const [stateId, setStateId] = useState<number | null>(null);
  const [lgaId, setLgaId] = useState<number | null>(null);
  const [wardId, setWardId] = useState<number | null>(null);
  const [address, setAddress] = useState('');
  // Step 4: Voter Card
  const [voterCardNumber, setVoterCardNumber] = useState('');

  const normalizePhone = (p: string) => {
    const clean = p.replace(/\D/g, '');
    if (clean.startsWith('0')) return '+234' + clean.slice(1);
    if (clean.startsWith('234')) return '+' + clean;
    return '+234' + clean;
  };

  const handleSendOTP = async () => {
    if (phone.length < 10) { setError('Enter a valid phone number'); return; }
    setLoading(true); setError('');
    try {
      await requestOTP(normalizePhone(phone));
      setStep(1);
      toast('OTP sent!', 'success');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally { setLoading(false); }
  };

  const handleVerifyOTP = async (code: string) => {
    setLoading(true); setError('');
    try {
      const res = await verifyOTP(normalizePhone(phone), code);
      const data = unwrap(res);
      useAuthStore.getState().setTokens(data.access, data.refresh);
      setStep(2);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid OTP');
    } finally { setLoading(false); }
  };

  const handleProfile = async () => {
    if (!fullName.trim()) { setError('Full name is required'); return; }
    setLoading(true); setError('');
    try {
      await onboardingProfile({ full_name: fullName, gender, occupation });
      setStep(3);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save profile');
    } finally { setLoading(false); }
  };

  const handlePlacement = async () => {
    if (!stateId) { setError('Select your state'); return; }
    setLoading(true); setError('');
    try {
      await onboardingPlacement({ state: stateId, lga: lgaId, ward: wardId, residential_address: address });
      setStep(4);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save placement');
    } finally { setLoading(false); }
  };

  const handleVoterCard = async () => {
    setLoading(true); setError('');
    try {
      await onboardingVoterCard({ voter_card_number: voterCardNumber });
      const meRes = await getMe();
      const user = unwrap(meRes);
      const { accessToken, refreshToken } = useAuthStore.getState();
      login(user, accessToken!, refreshToken!);
      setStep(5);
      toast('Welcome to the Movement! 🎉', 'success');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit voter card');
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Step Indicator */}
          <View style={styles.steps}>
            {STEPS.map((s, i) => (
              <View key={i} style={[styles.stepDot, i <= step && styles.stepActive]} />
            ))}
          </View>
          <Text style={styles.stepLabel}>{STEPS[step]}</Text>

          {step === 0 && (
            <View style={styles.section}>
              <Text style={styles.heading}>Join City Boy Connect</Text>
              <PhoneInput value={phone} onChangeText={setPhone} error={error} />
              <Button onPress={handleSendOTP} loading={loading} size="lg">Send OTP</Button>
              <Button variant="ghost" onPress={() => navigation.navigate('Login')} style={{ marginTop: spacing.md }}>
                Already a member? Login
              </Button>
            </View>
          )}

          {step === 1 && (
            <View style={styles.section}>
              <Text style={styles.heading}>Verify Your Phone</Text>
              <OTPInput onComplete={handleVerifyOTP} />
              {error ? <Text style={styles.error}>{error}</Text> : null}
            </View>
          )}

          {step === 2 && (
            <View style={styles.section}>
              <Text style={styles.heading}>Your Profile</Text>
              <Input label="Full Name" value={fullName} onChangeText={setFullName} placeholder="e.g. John Doe" />
              <Input label="Gender" value={gender} onChangeText={setGender} placeholder="M, F, or O" />
              <Input label="Occupation" value={occupation} onChangeText={setOccupation} placeholder="e.g. Engineer" />
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <Button onPress={handleProfile} loading={loading} size="lg">Continue</Button>
            </View>
          )}

          {step === 3 && (
            <View style={styles.section}>
              <Text style={styles.heading}>Political Placement</Text>
              <Input label="State ID" value={stateId?.toString() || ''} onChangeText={(t) => setStateId(Number(t) || null)} placeholder="State ID" keyboardType="number-pad" />
              <Input label="LGA ID" value={lgaId?.toString() || ''} onChangeText={(t) => setLgaId(Number(t) || null)} placeholder="LGA ID" keyboardType="number-pad" />
              <Input label="Ward ID" value={wardId?.toString() || ''} onChangeText={(t) => setWardId(Number(t) || null)} placeholder="Ward ID" keyboardType="number-pad" />
              <Input label="Residential Address" value={address} onChangeText={setAddress} placeholder="Your address" multiline />
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <Button onPress={handlePlacement} loading={loading} size="lg">Continue</Button>
            </View>
          )}

          {step === 4 && (
            <View style={styles.section}>
              <Text style={styles.heading}>Voter Card Verification</Text>
              <Input label="Voter Card Number (VIN)" value={voterCardNumber} onChangeText={setVoterCardNumber} placeholder="19-character VIN" maxLength={19} />
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <Button onPress={handleVoterCard} loading={loading} size="lg">Submit & Join</Button>
              <Button variant="ghost" onPress={handleVoterCard} style={{ marginTop: spacing.sm }}>Skip for now</Button>
            </View>
          )}

          {step === 5 && (
            <View style={[styles.section, { alignItems: 'center' }]}>
              <Text style={{ fontSize: 64 }}>🎉</Text>
              <Text style={styles.heading}>Welcome to the Movement!</Text>
              <Text style={[styles.sub, { textAlign: 'center' }]}>Your membership is pending verification. You can start exploring the platform.</Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, padding: spacing.lg },
  steps: { flexDirection: 'row', justifyContent: 'center', gap: spacing.xs, marginBottom: spacing.sm },
  stepDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
  stepActive: { backgroundColor: colors.primary, width: 20 },
  stepLabel: { ...typography.captionBold, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.lg },
  section: { flex: 1 },
  heading: { ...typography.h2, color: colors.text, marginBottom: spacing.lg },
  sub: { ...typography.body, color: colors.textSecondary },
  error: { ...typography.caption, color: colors.danger, textAlign: 'center', marginVertical: spacing.sm },
});
