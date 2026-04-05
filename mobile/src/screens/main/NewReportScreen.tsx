import React, { useState } from 'react';
import { ScrollView, Text, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography } from '../../theme';
import { createReport, submitReport } from '../../api/reports';
import { unwrap } from '../../api/client';
import { useToastStore } from '../../store/toastStore';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

export default function NewReportScreen() {
  const navigation = useNavigation();
  const toast = useToastStore((s) => s.show);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState('');
  const [summary, setSummary] = useState('');
  const [newMembers, setNewMembers] = useState('');
  const [eventsHeld, setEventsHeld] = useState('');
  const [challenges, setChallenges] = useState('');
  const [plans, setPlans] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!summary.trim()) { setError('Summary is required'); return; }
    setLoading(true); setError('');
    try {
      const res = await createReport({
        report_period: period || new Date().toISOString().slice(0, 7),
        summary_of_activities: summary,
        membership_new: parseInt(newMembers) || 0,
        events_held: parseInt(eventsHeld) || 0,
        challenges,
        plans_next_period: plans,
      });
      const report = unwrap(res);
      if (report?.id) await submitReport(report.id);
      toast('Report submitted!', 'success');
      navigation.goBack();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit');
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: spacing.xxl }} keyboardShouldPersistTaps="handled">
        <Input label="Report Period" value={period} onChangeText={setPeriod} placeholder="e.g. 2025-Q2 or 2025-06" />
        <Input label="Summary of Activities" value={summary} onChangeText={setSummary} placeholder="What was accomplished?" multiline numberOfLines={4} />
        <Input label="New Members" value={newMembers} onChangeText={setNewMembers} placeholder="0" keyboardType="number-pad" />
        <Input label="Events Held" value={eventsHeld} onChangeText={setEventsHeld} placeholder="0" keyboardType="number-pad" />
        <Input label="Challenges" value={challenges} onChangeText={setChallenges} placeholder="Any challenges faced?" multiline />
        <Input label="Plans for Next Period" value={plans} onChangeText={setPlans} placeholder="What's planned?" multiline />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button onPress={handleSubmit} loading={loading} size="lg" style={{ marginTop: spacing.md }}>Submit Report</Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.md },
  error: { ...typography.caption, color: colors.danger, marginBottom: spacing.sm },
});
