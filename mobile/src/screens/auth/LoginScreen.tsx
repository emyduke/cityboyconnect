import React, { useState, useEffect } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import Animated, { FadeIn, SlideInRight } from 'react-native-reanimated';
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
    <View className="flex-1 bg-background">
      <View className="bg-forest pb-16">
        <SafeAreaView edges={['top']}>
          <View className="items-center pt-8 px-6">
            <Image
              source={require('../../../assets/files/02_primary_transparent.png')}
              style={{ width: 180, height: 72 }}
              className="mb-2"
              contentFit="contain"
            />
            <Text className="font-body-medium text-base text-gold">Welcome back</Text>
          </View>
        </SafeAreaView>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView contentContainerClassName="grow px-6 -mt-8" keyboardShouldPersistTaps="handled" bounces={false}>
          <View className="bg-surface rounded-xl p-6 pt-8 shadow-md">

            {/* PHONE */}
            {stage === 'phone' && (
              <Animated.View entering={FadeIn.duration(300)} key="phone-step">
                <Text className="font-display-bold text-lg text-gray-900 mb-4 text-center">Enter your phone number</Text>
                <PhoneInput value={phone} onChangeText={setPhone} error={error} />
                <Button onPress={handlePhoneSubmit} loading={loading} size="lg" className="mt-2">
                  Continue
                </Button>
                <View className="flex-row items-center my-6">
                  <View className="flex-1 h-px bg-gray-200" />
                  <Text className="font-body text-sm text-gray-400 mx-4">or</Text>
                  <View className="flex-1 h-px bg-gray-200" />
                </View>
                <Pressable onPress={() => navigation.navigate('Join', {})}>
                  <Text className="font-body text-base text-gray-500 text-center">New here? <Text className="text-forest font-body-semibold">Create account →</Text></Text>
                </Pressable>
              </Animated.View>
            )}

            {/* METHOD CHOICE */}
            {stage === 'method' && (
              <Animated.View entering={SlideInRight.duration(300)} key="method-step">
                <Pressable onPress={() => { setStage('phone'); setError(''); }}>
                  <Text className="font-body-medium text-base text-forest mb-4">← Back</Text>
                </Pressable>
                <Text className="font-display-bold text-lg text-gray-900 mb-4 text-center">How would you like to sign in?</Text>
                {error ? <Text className="font-body text-xs text-danger text-center mt-2">{error}</Text> : null}

                {methods.includes('sms') && (
                  <Pressable
                    className="flex-row items-center gap-[14px] p-4 border-[1.5px] border-gray-200 rounded-lg bg-surface mb-2 active:bg-forest-light/[0.08] active:border-forest"
                    onPress={() => handleMethodSelect('sms')}
                    disabled={loading}
                  >
                    <Text className="text-[22px]">💬</Text>
                    <View className="flex-1">
                      <Text className="font-body-medium text-base text-gray-900 mb-0.5">Text message (SMS)</Text>
                      <Text className="font-body text-sm text-gray-500">6-digit code to your phone</Text>
                    </View>
                    <Text className="font-body text-base text-gray-400">→</Text>
                  </Pressable>
                )}
                {methods.includes('email') && (
                  <Pressable
                    className="flex-row items-center gap-[14px] p-4 border-[1.5px] border-gray-200 rounded-lg bg-surface mb-2 active:bg-forest-light/[0.08] active:border-forest"
                    onPress={() => handleMethodSelect('email')}
                    disabled={loading}
                  >
                    <Text className="text-[22px]">✉️</Text>
                    <View className="flex-1">
                      <Text className="font-body-medium text-base text-gray-900 mb-0.5">Email</Text>
                      <Text className="font-body text-sm text-gray-500">6-digit code to your email</Text>
                    </View>
                    <Text className="font-body text-base text-gray-400">→</Text>
                  </Pressable>
                )}
                {methods.includes('password') && userHasPwd && (
                  <Pressable
                    className="flex-row items-center gap-[14px] p-4 border-[1.5px] border-gray-200 rounded-lg bg-surface mb-2 active:bg-forest-light/[0.08] active:border-forest"
                    onPress={() => handleMethodSelect('password')}
                    disabled={loading}
                  >
                    <Text className="text-[22px]">🔑</Text>
                    <View className="flex-1">
                      <Text className="font-body-medium text-base text-gray-900 mb-0.5">Password</Text>
                      <Text className="font-body text-sm text-gray-500">Sign in with your password</Text>
                    </View>
                    <Text className="font-body text-base text-gray-400">→</Text>
                  </Pressable>
                )}
              </Animated.View>
            )}

            {/* ENTER EMAIL */}
            {stage === 'enter-email' && (
              <Animated.View entering={SlideInRight.duration(300)} key="email-step">
                <Pressable onPress={() => setStage('method')}>
                  <Text className="font-body-medium text-base text-forest mb-4">← Back</Text>
                </Pressable>
                <Text className="font-display-bold text-lg text-gray-900 mb-4 text-center">Enter your email</Text>
                <Text className="font-body text-base text-gray-500 text-center mb-6">We'll send your code there</Text>
                <TextInput
                  className={`border rounded-md p-4 font-body text-base text-gray-900 bg-surface mb-2 ${error ? 'border-danger' : 'border-gray-200'}`}
                  placeholder="you@example.com"
                  placeholderTextColor="#9ca3af"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {error ? <Text className="font-body text-xs text-danger text-center mt-2">{error}</Text> : null}
                <Button onPress={handleEmailSubmit} loading={loading} size="lg" className="mt-2">
                  Send code
                </Button>
              </Animated.View>
            )}

            {/* OTP */}
            {stage === 'otp' && (
              <Animated.View entering={SlideInRight.duration(300)} key="otp-step">
                <Pressable onPress={() => setStage(methods.length > 1 ? 'method' : 'phone')}>
                  <Text className="font-body-medium text-base text-forest mb-4">← Back</Text>
                </Pressable>
                <Text className="font-display-bold text-lg text-gray-900 mb-4 text-center">Enter your code</Text>
                <View className="bg-forest-light/[0.08] self-center px-4 py-1 rounded-full mb-6">
                  <Text className="font-body text-sm text-forest text-center">
                    {otpChannel === 'sms' ? `Sent via SMS to ${otpSentTo}` : `Sent to ${otpSentTo}`}
                  </Text>
                </View>
                <View className="mb-4">
                  <OTPInput onComplete={handleOTPComplete} />
                </View>
                {error ? <Text className="font-body text-xs text-danger text-center mt-2">{error}</Text> : null}
                {loading && <Text className="font-body text-sm text-gray-500 text-center mt-2">Verifying...</Text>}

                <View className="items-center mt-6">
                  {countdown > 0 ? (
                    <Text className="font-body text-sm text-gray-400">Resend in 0:{countdown.toString().padStart(2, '0')}</Text>
                  ) : (
                    <Pressable onPress={handleResend}>
                      <Text className="font-body-medium text-base text-forest">Resend Code</Text>
                    </Pressable>
                  )}
                </View>

                {methods.length > 1 && (
                  <Pressable onPress={() => setStage('method')}>
                    <Text className="font-body text-sm text-gray-500 text-center mt-4 underline">Try a different method</Text>
                  </Pressable>
                )}
              </Animated.View>
            )}

            {/* PASSWORD */}
            {stage === 'password' && (
              <Animated.View entering={SlideInRight.duration(300)} key="pwd-step">
                <Pressable onPress={() => setStage(methods.length > 1 ? 'method' : 'phone')}>
                  <Text className="font-body-medium text-base text-forest mb-4">← Back</Text>
                </Pressable>
                <Text className="font-display-bold text-lg text-gray-900 mb-4 text-center">Enter your password</Text>
                <View className="relative">
                  <TextInput
                    className={`border rounded-md p-4 pr-[60px] font-body text-base text-gray-900 bg-surface mb-2 ${error ? 'border-danger' : 'border-gray-200'}`}
                    placeholder="Your password"
                    placeholderTextColor="#9ca3af"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPwd}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <Pressable onPress={() => setShowPwd((v) => !v)} className="absolute right-4 top-4">
                    <Text className="font-body text-sm text-gray-400">{showPwd ? 'Hide' : 'Show'}</Text>
                  </Pressable>
                </View>
                {error ? <Text className="font-body text-xs text-danger text-center mt-2">{error}</Text> : null}
                <Button onPress={handlePasswordSubmit} loading={loading} size="lg" className="mt-2">
                  Sign in
                </Button>
                {(methods.includes('sms') || methods.includes('email')) && (
                  <Pressable onPress={() => setStage('method')}>
                    <Text className="font-body text-sm text-gray-500 text-center mt-4 underline">Sign in with a code instead</Text>
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
