import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import Animated, { FadeIn, SlideInRight } from 'react-native-reanimated';
import { colors, spacing, radius, typography, shadows } from '../../theme';
import { getAuthMethods, requestOTP, verifyOTP, loginWithPassword, getMe } from '../../api/auth';
import { unwrap } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import Button from '../../components/ui/Button';
import PhoneInput from '../../components/PhoneInput';
import OTPInput from '../../components/OTPInput';
import { AuthStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Login'>;
type Stage = 'phone' | 'method' | 'enter-email' | 'otp' | 'password';

export default function LoginScreen() {
  const navigation = useNavigation<Nav>();
  const login = useAuthStore((s) => s.login);
  const toast = useToastStore((s) => s.show);

  const [stage, setStage] = useState<Stage>('phone');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [otpChannel, setOtpChannel] = useState<'sms' | 'email'>('sms');
  const [otpSentTo, setOtpSentTo] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [methods, setMethods] = useState<string[]>([]);
  const [userHasPwd, setUserHasPwd] = useState(false);
  const [userHasEmail, setUserHasEmail] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const normalizePhone = (p: string) => {
    const clean = p.replace(/\D/g, '');
    if (clean.startsWith('0')) return '+234' + clean.slice(1);
    if (clean.startsWith('234')) return '+' + clean;
    return '+234' + clean;
  };

  const handleLogin = async (data: any) => {
    login(data.user, data.access, data.refresh);
    const meRes = await getMe();
    const user = unwrap(meRes);
    login(user, data.access, data.refresh);
    toast('Welcome back!', 'success');
  };

  const handlePhoneSubmit = async () => {
    if (phone.replace(/\D/g, '').length < 10) {
      setError('Enter a valid phone number');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await getAuthMethods(normalizePhone(phone));
      const d = unwrap(res);
      setMethods(d.available_methods);
      setUserHasPwd(d.user_has_password);
      setUserHasEmail(d.user_has_email);

      if (d.available_methods.length === 1) {
        const only = d.available_methods[0];
        if (only === 'password') { setStage('password'); setLoading(false); return; }
        const ch: 'sms' | 'email' = only === 'sms' ? 'sms' : 'email';
        setOtpChannel(ch);
        if (ch === 'email' && !d.user_has_email) { setStage('enter-email'); setLoading(false); return; }
        await doRequestOTP(normalizePhone(phone), ch);
        return;
      }
      setStage('method');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const doRequestOTP = async (ph?: string, ch?: 'sms' | 'email', em?: string) => {
    setLoading(true);
    setError('');
    try {
      const payload: any = { phone_number: ph || normalizePhone(phone), channel: ch || otpChannel };
      if (em || (ch === 'email' && email)) payload.email = em || email;
      const res = await requestOTP(payload);
      const d = unwrap(res);
      setOtpSentTo(d.destination);
      setStage('otp');
      setCountdown(60);
      toast('Code sent!', 'success');
    } catch (err: any) {
      const apiErr = err?.response?.data?.error;
      setError(apiErr?.message || 'Failed to send code');
      if (apiErr?.code === 'DELIVERY_FAILED' && methods.length > 1) {
        setStage('method');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMethodSelect = (method: string) => {
    setError('');
    if (method === 'password') { setStage('password'); return; }
    const ch = method as 'sms' | 'email';
    setOtpChannel(ch);
    if (ch === 'email' && !userHasEmail) { setStage('enter-email'); return; }
    doRequestOTP(normalizePhone(phone), ch);
  };

  const handleEmailSubmit = () => {
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    doRequestOTP(normalizePhone(phone), 'email', email);
  };

  const handleOTPComplete = async (code: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await verifyOTP({
        phone_number: normalizePhone(phone),
        otp_code: code,
        email: otpChannel === 'email' ? email : undefined,
      });
      const data = unwrap(res);
      await handleLogin(data);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Invalid code');
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async () => {
    if (!password) { setError('Please enter your password'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await loginWithPassword({ phone_number: normalizePhone(phone), password });
      const data = unwrap(res);
      await handleLogin(data);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Invalid credentials');
      setLoading(false);
    }
  };

  const handleResend = () => {
    if (countdown > 0) return;
    doRequestOTP(normalizePhone(phone), otpChannel, otpChannel === 'email' ? email : undefined);
  };

  return (
    <View style={styles.root}>
      <View style={styles.heroSection}>
        <SafeAreaView edges={['top']}>
          <View style={styles.heroContent}>
            <Image
              source={require('../../../assets/files/02_primary_transparent.png')}
              style={styles.logo}
              contentFit="contain"
            />
            <Text style={styles.heroSubtitle}>Welcome back</Text>
          </View>
        </SafeAreaView>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" bounces={false}>
          <View style={[styles.card, shadows.md]}>

            {/* PHONE */}
            {stage === 'phone' && (
              <Animated.View entering={FadeIn.duration(300)} key="phone-step">
                <Text style={styles.heading}>Enter your phone number</Text>
                <PhoneInput value={phone} onChangeText={setPhone} error={error} />
                <Button onPress={handlePhoneSubmit} loading={loading} size="lg" style={styles.btn}>
                  Continue
                </Button>
                <View style={styles.divider}>
                  <View style={styles.line} />
                  <Text style={styles.dividerText}>or</Text>
                  <View style={styles.line} />
                </View>
                <Pressable onPress={() => navigation.navigate('Join', {})}>
                  <Text style={styles.linkText}>New here? <Text style={styles.linkBold}>Create account →</Text></Text>
                </Pressable>
              </Animated.View>
            )}

            {/* METHOD CHOICE */}
            {stage === 'method' && (
              <Animated.View entering={SlideInRight.duration(300)} key="method-step">
                <Pressable onPress={() => { setStage('phone'); setError(''); }}>
                  <Text style={styles.backLink}>← Back</Text>
                </Pressable>
                <Text style={styles.heading}>How would you like to sign in?</Text>
                {error ? <Text style={styles.error}>{error}</Text> : null}

                {methods.includes('sms') && (
                  <Pressable
                    style={({ pressed }) => [styles.methodCard, pressed && styles.methodCardPressed]}
                    onPress={() => handleMethodSelect('sms')}
                    disabled={loading}
                  >
                    <Text style={styles.methodIcon}>💬</Text>
                    <View style={styles.methodTextWrap}>
                      <Text style={styles.methodTitle}>Text message (SMS)</Text>
                      <Text style={styles.methodDesc}>6-digit code to your phone</Text>
                    </View>
                    <Text style={styles.methodArrow}>→</Text>
                  </Pressable>
                )}
                {methods.includes('email') && (
                  <Pressable
                    style={({ pressed }) => [styles.methodCard, pressed && styles.methodCardPressed]}
                    onPress={() => handleMethodSelect('email')}
                    disabled={loading}
                  >
                    <Text style={styles.methodIcon}>✉️</Text>
                    <View style={styles.methodTextWrap}>
                      <Text style={styles.methodTitle}>Email</Text>
                      <Text style={styles.methodDesc}>6-digit code to your email</Text>
                    </View>
                    <Text style={styles.methodArrow}>→</Text>
                  </Pressable>
                )}
                {methods.includes('password') && userHasPwd && (
                  <Pressable
                    style={({ pressed }) => [styles.methodCard, pressed && styles.methodCardPressed]}
                    onPress={() => handleMethodSelect('password')}
                    disabled={loading}
                  >
                    <Text style={styles.methodIcon}>🔑</Text>
                    <View style={styles.methodTextWrap}>
                      <Text style={styles.methodTitle}>Password</Text>
                      <Text style={styles.methodDesc}>Sign in with your password</Text>
                    </View>
                    <Text style={styles.methodArrow}>→</Text>
                  </Pressable>
                )}
              </Animated.View>
            )}

            {/* ENTER EMAIL */}
            {stage === 'enter-email' && (
              <Animated.View entering={SlideInRight.duration(300)} key="email-step">
                <Pressable onPress={() => setStage('method')}>
                  <Text style={styles.backLink}>← Back</Text>
                </Pressable>
                <Text style={styles.heading}>Enter your email</Text>
                <Text style={styles.subheading}>We'll send your code there</Text>
                <TextInput
                  style={[styles.input, error ? styles.inputError : null]}
                  placeholder="you@example.com"
                  placeholderTextColor={colors.textTertiary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {error ? <Text style={styles.error}>{error}</Text> : null}
                <Button onPress={handleEmailSubmit} loading={loading} size="lg" style={styles.btn}>
                  Send code
                </Button>
              </Animated.View>
            )}

            {/* OTP */}
            {stage === 'otp' && (
              <Animated.View entering={SlideInRight.duration(300)} key="otp-step">
                <Pressable onPress={() => setStage(methods.length > 1 ? 'method' : 'phone')}>
                  <Text style={styles.backLink}>← Back</Text>
                </Pressable>
                <Text style={styles.heading}>Enter your code</Text>
                <View style={styles.phonePill}>
                  <Text style={styles.phonePillText}>
                    {otpChannel === 'sms' ? `Sent via SMS to ${otpSentTo}` : `Sent to ${otpSentTo}`}
                  </Text>
                </View>
                <View style={styles.otpWrap}>
                  <OTPInput onComplete={handleOTPComplete} />
                </View>
                {error ? <Text style={styles.error}>{error}</Text> : null}
                {loading && <Text style={styles.verifying}>Verifying...</Text>}

                <View style={styles.resendRow}>
                  {countdown > 0 ? (
                    <Text style={styles.countdown}>Resend in 0:{countdown.toString().padStart(2, '0')}</Text>
                  ) : (
                    <Pressable onPress={handleResend}>
                      <Text style={styles.resendLink}>Resend Code</Text>
                    </Pressable>
                  )}
                </View>

                {methods.length > 1 && (
                  <Pressable onPress={() => setStage('method')}>
                    <Text style={styles.switchLink}>Try a different method</Text>
                  </Pressable>
                )}
              </Animated.View>
            )}

            {/* PASSWORD */}
            {stage === 'password' && (
              <Animated.View entering={SlideInRight.duration(300)} key="pwd-step">
                <Pressable onPress={() => setStage(methods.length > 1 ? 'method' : 'phone')}>
                  <Text style={styles.backLink}>← Back</Text>
                </Pressable>
                <Text style={styles.heading}>Enter your password</Text>
                <View style={styles.pwdRow}>
                  <TextInput
                    style={[styles.input, styles.pwdInput, error ? styles.inputError : null]}
                    placeholder="Your password"
                    placeholderTextColor={colors.textTertiary}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPwd}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <Pressable onPress={() => setShowPwd((v) => !v)} style={styles.showHideBtn}>
                    <Text style={styles.showHideText}>{showPwd ? 'Hide' : 'Show'}</Text>
                  </Pressable>
                </View>
                {error ? <Text style={styles.error}>{error}</Text> : null}
                <Button onPress={handlePasswordSubmit} loading={loading} size="lg" style={styles.btn}>
                  Sign in
                </Button>
                {(methods.includes('sms') || methods.includes('email')) && (
                  <Pressable onPress={() => setStage('method')}>
                    <Text style={styles.switchLink}>Sign in with a code instead</Text>
                  </Pressable>
                )}
              </Animated.View>
            )}

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  heroSection: {
    backgroundColor: colors.primary,
    paddingBottom: spacing.xxl + spacing.md,
  },
  heroContent: {
    alignItems: 'center',
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  logo: { width: 180, height: 72, marginBottom: spacing.sm },
  heroSubtitle: { ...typography.body, color: colors.accent, fontFamily: 'PlusJakartaSans-Medium' },
  scroll: { flexGrow: 1, paddingHorizontal: spacing.lg, marginTop: -spacing.xl },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  heading: { ...typography.h4, color: colors.text, marginBottom: spacing.md, textAlign: 'center' },
  subheading: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.lg },
  btn: { marginTop: spacing.sm },
  backLink: { ...typography.bodyMedium, color: colors.primary, marginBottom: spacing.md },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: spacing.lg },
  line: { flex: 1, height: 1, backgroundColor: colors.divider },
  dividerText: { ...typography.bodySm, color: colors.textTertiary, marginHorizontal: spacing.md },
  linkText: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
  linkBold: { color: colors.primary, fontFamily: 'PlusJakartaSans-SemiBold' },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.divider,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
  },
  methodCardPressed: { backgroundColor: (colors as any).primaryLight + '15', borderColor: colors.primary },
  methodIcon: { fontSize: 22 },
  methodTextWrap: { flex: 1 },
  methodTitle: { ...typography.bodyMedium, color: colors.text, marginBottom: 2 },
  methodDesc: { ...typography.bodySm, color: colors.textSecondary },
  methodArrow: { ...typography.body, color: colors.textTertiary },
  input: {
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: radius.md,
    padding: spacing.md,
    ...typography.body,
    color: colors.text,
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
  },
  inputError: { borderColor: colors.danger },
  pwdRow: { position: 'relative' as const },
  pwdInput: { paddingRight: 60 },
  showHideBtn: { position: 'absolute' as const, right: spacing.md, top: spacing.md },
  showHideText: { ...typography.bodySm, color: colors.textTertiary },
  phonePill: {
    backgroundColor: (colors as any).primaryLight + '15',
    alignSelf: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    marginBottom: spacing.lg,
  },
  phonePillText: { ...typography.bodySm, color: colors.primary, textAlign: 'center' },
  otpWrap: { marginBottom: spacing.md },
  error: { ...typography.caption, color: colors.danger, textAlign: 'center', marginTop: spacing.sm },
  verifying: { ...typography.bodySm, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm },
  resendRow: { alignItems: 'center', marginTop: spacing.lg },
  countdown: { ...typography.bodySm, color: colors.textTertiary },
  resendLink: { ...typography.bodyMedium, color: colors.primary },
  switchLink: { ...typography.bodySm, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.md, textDecorationLine: 'underline' },
  changeLink: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.md },
});
