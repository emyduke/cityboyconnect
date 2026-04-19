import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { leaderAddMember } from '../../api/opportunities';
import { getStates, getLGAs, getWards, getUnits } from '../../api/structure';
import { unwrap } from '../../api/client';
import { useToastStore } from '../../store/toastStore';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

export default function AddMemberScreen() {
  const navigation = useNavigation<any>();
  const toast = useToastStore((s) => s.show);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    phone: '', full_name: '', occupation: '', gender: 'MALE',
    state_id: '', lga_id: '', ward_id: '', unit_id: '',
  });

  const [states, setStates] = useState<any[]>([]);
  const [lgas, setLgas] = useState<any[]>([]);
  const [wards, setWards] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await getStates();
        setStates(unwrap(res) || res.data?.results || res.data || []);
      } catch { /* optional */ }
    })();
  }, []);

  useEffect(() => {
    if (form.state_id) {
      (async () => {
        try {
          const res = await getLGAs(Number(form.state_id));
          setLgas(unwrap(res) || res.data?.results || res.data || []);
          setWards([]); setUnits([]);
          set('lga_id', ''); set('ward_id', ''); set('unit_id', '');
        } catch { /* ok */ }
      })();
    }
  }, [form.state_id]);

  useEffect(() => {
    if (form.lga_id) {
      (async () => {
        try {
          const res = await getWards(Number(form.lga_id));
          setWards(unwrap(res) || res.data?.results || res.data || []);
          setUnits([]);
          set('ward_id', ''); set('unit_id', '');
        } catch { /* ok */ }
      })();
    }
  }, [form.lga_id]);

  useEffect(() => {
    if (form.ward_id) {
      (async () => {
        try {
          const res = await getUnits(Number(form.ward_id));
          setUnits(unwrap(res) || res.data?.results || res.data || []);
          set('unit_id', '');
        } catch { /* ok */ }
      })();
    }
  }, [form.ward_id]);

  const set = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    if (!form.phone.trim()) { setError('Phone is required'); return; }
    if (!form.full_name.trim()) { setError('Full name is required'); return; }
    setLoading(true); setError('');
    try {
      const data: any = {
        phone: form.phone.trim(), full_name: form.full_name.trim(),
      };
      if (form.occupation) data.occupation = form.occupation;
      if (form.gender) data.gender = form.gender;
      if (form.ward_id) data.ward_id = Number(form.ward_id);
      if (form.unit_id) data.unit_id = Number(form.unit_id);
      await leaderAddMember(data);
      toast('Member added!', 'success');
      Alert.alert('Success', `${form.full_name} has been added to your network.`, [{ text: 'Add Another', onPress: () => setForm({ phone: '', full_name: '', occupation: '', gender: 'MALE', state_id: '', lga_id: '', ward_id: '', unit_id: '' }) }, { text: 'Done', onPress: () => navigation.goBack() }]);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || err?.response?.data?.detail || 'Failed to add member');
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
      <ScrollView className="flex-1 bg-background p-4" contentContainerStyle={{ paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
        <Text className="text-2xl font-display-bold text-gray-900">Add Member</Text>
        <Text className="text-base font-body text-gray-500 mb-4">Register a new member to your network</Text>

        <Input label="Phone Number *" value={form.phone} onChangeText={(v: string) => set('phone', v)} placeholder="08012345678" keyboardType="phone-pad" />
        <Input label="Full Name *" value={form.full_name} onChangeText={(v: string) => set('full_name', v)} placeholder="John Doe" />
        <Input label="Occupation" value={form.occupation} onChangeText={(v: string) => set('occupation', v)} placeholder="e.g. Farmer, Teacher" />

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

        {/* Geographic cascading selects */}
        {states.length > 0 && (
          <>
            <Text className="text-base font-body-medium text-gray-900 mt-4 mb-1">State</Text>
            <View className="flex-row flex-wrap gap-1">
              {states.slice(0, 20).map((s: any) => (
                <Text
                  key={s.id}
                  className={`text-xs font-body px-2 py-1 rounded-full border overflow-hidden ${form.state_id === String(s.id) ? 'bg-forest/10 border-forest text-forest' : 'bg-surface border-gray-200 text-gray-500'}`}
                  onPress={() => set('state_id', String(s.id))}
                >{s.name}</Text>
              ))}
            </View>
          </>
        )}

        {lgas.length > 0 && (
          <>
            <Text className="text-base font-body-medium text-gray-900 mt-4 mb-1">LGA</Text>
            <View className="flex-row flex-wrap gap-1">
              {lgas.map((l: any) => (
                <Text
                  key={l.id}
                  className={`text-xs font-body px-2 py-1 rounded-full border overflow-hidden ${form.lga_id === String(l.id) ? 'bg-forest/10 border-forest text-forest' : 'bg-surface border-gray-200 text-gray-500'}`}
                  onPress={() => set('lga_id', String(l.id))}
                >{l.name}</Text>
              ))}
            </View>
          </>
        )}

        {wards.length > 0 && (
          <>
            <Text className="text-base font-body-medium text-gray-900 mt-4 mb-1">Ward</Text>
            <View className="flex-row flex-wrap gap-1">
              {wards.map((w: any) => (
                <Text
                  key={w.id}
                  className={`text-xs font-body px-2 py-1 rounded-full border overflow-hidden ${form.ward_id === String(w.id) ? 'bg-forest/10 border-forest text-forest' : 'bg-surface border-gray-200 text-gray-500'}`}
                  onPress={() => set('ward_id', String(w.id))}
                >{w.name}</Text>
              ))}
            </View>
          </>
        )}

        {units.length > 0 && (
          <>
            <Text className="text-base font-body-medium text-gray-900 mt-4 mb-1">Unit</Text>
            <View className="flex-row flex-wrap gap-1">
              {units.map((u: any) => (
                <Text
                  key={u.id}
                  className={`text-xs font-body px-2 py-1 rounded-full border overflow-hidden ${form.unit_id === String(u.id) ? 'bg-forest/10 border-forest text-forest' : 'bg-surface border-gray-200 text-gray-500'}`}
                  onPress={() => set('unit_id', String(u.id))}
                >{u.name}</Text>
              ))}
            </View>
          </>
        )}

        {error ? <Text className="text-xs font-body text-danger mt-2">{error}</Text> : null}
        <Button onPress={handleSubmit} loading={loading} size="lg" className="mt-6">Add Member</Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
