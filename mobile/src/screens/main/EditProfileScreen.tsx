import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { updateMemberProfile } from '../../api/opportunities';
import { useToastStore } from '../../store/toastStore';
import { useAuthStore } from '../../store/authStore';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

export default function EditProfileScreen() {
  const navigation = useNavigation<any>();
  const toast = useToastStore((s) => s.show);
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    full_name: user?.full_name || '', occupation: user?.occupation || '',
    gender: user?.gender || 'MALE',
  });

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    if (!form.full_name.trim()) { setError('Name is required'); return; }
    setLoading(true); setError('');
    try {
      await updateMemberProfile(form);
      if (setUser) setUser({ ...user, ...form });
      toast('Profile updated!', 'success');
      navigation.goBack();
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Failed to update');
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
      <ScrollView className="flex-1 bg-background p-4" contentContainerStyle={{ paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
        <Text className="text-2xl font-display-bold text-gray-900 mb-4">Edit Profile</Text>

        <Input label="Full Name *" value={form.full_name} onChangeText={(v: string) => set('full_name', v)} />
        <Input label="Occupation" value={form.occupation} onChangeText={(v: string) => set('occupation', v)} placeholder="e.g. Engineer, Teacher" />

        <Text className="text-base font-body-medium text-gray-900 mt-4 mb-1">Gender</Text>
        <View className="flex-row flex-wrap gap-1">
          {['MALE', 'FEMALE'].map((g) => (
            <Text
              key={g}
              className={`text-xs font-body px-2 py-1 rounded-full border overflow-hidden ${form.gender === g ? 'bg-forest/10 border-forest text-forest' : 'bg-surface border-gray-200 text-gray-500'}`}
              onPress={() => set('gender', g)}
            >{g}</Text>
          ))}
        </View>

        {error ? <Text className="text-xs font-body text-danger mt-2">{error}</Text> : null}
        <Button onPress={handleSubmit} loading={loading} size="lg" className="mt-6">Save Changes</Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
