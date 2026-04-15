import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography, radius } from '../../theme';
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
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: spacing.xxl }} keyboardShouldPersistTaps="handled">
        <Text style={styles.heading}>Add Member</Text>
        <Text style={styles.subtitle}>Register a new member to your network</Text>

        <Input label="Phone Number *" value={form.phone} onChangeText={(v: string) => set('phone', v)} placeholder="08012345678" keyboardType="phone-pad" />
        <Input label="Full Name *" value={form.full_name} onChangeText={(v: string) => set('full_name', v)} placeholder="John Doe" />
        <Input label="Occupation" value={form.occupation} onChangeText={(v: string) => set('occupation', v)} placeholder="e.g. Farmer, Teacher" />

        <Text style={styles.label}>Gender</Text>
        <View style={styles.chipRow}>
          {['MALE', 'FEMALE'].map((g) => (
            <Text key={g} style={[styles.chip, form.gender === g && styles.chipActive]} onPress={() => set('gender', g)}>{g}</Text>
          ))}
        </View>

        {/* Geographic cascading selects */}
        {states.length > 0 && (
          <>
            <Text style={styles.label}>State</Text>
            <View style={styles.chipRow}>
              {states.slice(0, 20).map((s: any) => (
                <Text key={s.id} style={[styles.chip, form.state_id === String(s.id) && styles.chipActive]} onPress={() => set('state_id', String(s.id))}>{s.name}</Text>
              ))}
            </View>
          </>
        )}

        {lgas.length > 0 && (
          <>
            <Text style={styles.label}>LGA</Text>
            <View style={styles.chipRow}>
              {lgas.map((l: any) => (
                <Text key={l.id} style={[styles.chip, form.lga_id === String(l.id) && styles.chipActive]} onPress={() => set('lga_id', String(l.id))}>{l.name}</Text>
              ))}
            </View>
          </>
        )}

        {wards.length > 0 && (
          <>
            <Text style={styles.label}>Ward</Text>
            <View style={styles.chipRow}>
              {wards.map((w: any) => (
                <Text key={w.id} style={[styles.chip, form.ward_id === String(w.id) && styles.chipActive]} onPress={() => set('ward_id', String(w.id))}>{w.name}</Text>
              ))}
            </View>
          </>
        )}

        {units.length > 0 && (
          <>
            <Text style={styles.label}>Unit</Text>
            <View style={styles.chipRow}>
              {units.map((u: any) => (
                <Text key={u.id} style={[styles.chip, form.unit_id === String(u.id) && styles.chipActive]} onPress={() => set('unit_id', String(u.id))}>{u.name}</Text>
              ))}
            </View>
          </>
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button onPress={handleSubmit} loading={loading} size="lg" style={{ marginTop: spacing.lg }}>Add Member</Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.md },
  heading: { ...typography.h2, color: colors.text },
  subtitle: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.md },
  label: { ...typography.bodyMedium, color: colors.text, marginTop: spacing.md, marginBottom: spacing.xs },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: { ...typography.caption, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, backgroundColor: colors.surface, borderRadius: 999, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', color: colors.textSecondary },
  chipActive: { backgroundColor: colors.primary + '15', borderColor: colors.primary, color: colors.primary },
  error: { ...typography.caption, color: colors.danger, marginTop: spacing.sm },
});
