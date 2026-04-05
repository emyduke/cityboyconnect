import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography } from '../../theme';
import { requestOTP, verifyOTP, getMe } from '../../api/auth';
import { unwrap } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import Button from '../../components/ui/Button';
import PhoneInput from '../../components/PhoneInput';
import OTPInput from '../../components/OTPInput';
import { AuthStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export default function LoginScreen() {
  const navigation = useNavigation<Nav>();
  const login = useAuthStore((s) => s.login);
  const toast = useToastStore((s) => s.show);

  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const normalizePhone = (p: string) => {
    const clean = p.replace(/\D/g, '');
    if (clean.startsWith('0')) return '+234' + clean.slice(1);
    if (clean.startsWith('234')) return '+' + clean;
    return '+234' + clean;
  };

  const handleSendOTP = async () => {
    if (phone.length < 10) {
      setError('Enter a valid phone number');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await requestOTP(normalizePhone(phone));
      setStep('otp');
      toast('OTP sent!', 'success');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (code: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await verifyOTP(normalizePhone(phone), code);
      const data = unwrap(res);
      const meRes = await getMe();
      const user = unwrap(meRes);
      login(user, data.access, data.refresh);
      toast('Welcome back!', 'success');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid OTP');
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={[colors.primaryDark, colors.primary, colors.primaryLight]} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <Text style={styles.logo}>City Boy{'\n'}Connect</Text>
            <Text style={styles.subtitle}>Building Nigeria's Most Organised Youth Movement</Text>

            <View style={styles.card}>
              {step === 'phone' ? (
                <>
                  <Text style={styles.heading}>Welcome Back</Text>
                  <PhoneInput value={phone} onChangeText={setPhone} error={error} />
                  <Button onPress={handleSendOTP} loading={loading} size="lg" style={styles.btn}>
                    Send OTP
                  </Button>
                  <Button variant="ghost" onPress={() => navigation.navigate('Join', {})} style={{ marginTop: spacing.sm }}>
                    New here? Join the Movement
                  </Button>
                </>
              ) : (
                <>
                  <Text style={styles.heading}>Enter OTP</Text>
                  <Text style={styles.otpHint}>Sent to +234{phone.replace(/^0/, '')}</Text>
                  <OTPInput onComplete={handleVerifyOTP} />
                  {error ? <Text style={styles.error}>{error}</Text> : null}
                  {loading && <Text style={styles.otpHint}>Verifying...</Text>}
                  <Button variant="ghost" onPress={() => { setStep('phone'); setError(''); }} style={{ marginTop: spacing.lg }}>
                    Change Number
                  </Button>
                </>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg },
  logo: { ...typography.h1, color: colors.accent, textAlign: 'center', fontSize: 36, marginBottom: spacing.sm },
  subtitle: { ...typography.body, color: colors.textInverse, textAlign: 'center', opacity: 0.8, marginBottom: spacing.xxl },
  card: { backgroundColor: colors.surface, borderRadius: 24, padding: spacing.lg },
  heading: { ...typography.h3, color: colors.text, marginBottom: spacing.lg, textAlign: 'center' },
  otpHint: { ...typography.bodySm, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.lg },
  error: { ...typography.caption, color: colors.danger, textAlign: 'center', marginTop: spacing.md },
  btn: { marginTop: spacing.sm },
});
