import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, StyleSheet, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography, radius, shadows } from '../../theme';
import { adminApi } from '../../api/admin';
import { useToastStore } from '../../store/toastStore';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import Skeleton from '../../components/ui/Skeleton';

export default function AdminSettingsScreen() {
  const toast = useToastStore((s) => s.show);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await adminApi.getSettings();
      setSettings(res.data || res);
    } catch { /* handled */ }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminApi.updateSettings(settings);
      toast('Settings saved', 'success');
    } catch (err: any) {
      toast(err.response?.data?.message || 'Failed to save', 'error');
    }
    setSaving(false);
  };

  const updateField = (key: string, value: any) => {
    setSettings((prev: any) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.container}>
          <Skeleton variant="card" height={200} />
        </View>
      </SafeAreaView>
    );
  }

  if (!settings) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
          <Text style={typography.body}>Unable to load settings</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>General</Text>
          {settings.site_name != null && (
            <Input label="Site Name" value={settings.site_name || ''} onChangeText={(v: string) => updateField('site_name', v)} />
          )}
          {settings.maintenance_mode != null && (
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Maintenance Mode</Text>
              <Switch
                value={settings.maintenance_mode}
                onValueChange={(v) => updateField('maintenance_mode', v)}
                trackColor={{ true: colors.primary }}
                thumbColor={colors.surface}
              />
            </View>
          )}
          {settings.registration_enabled != null && (
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Registration Enabled</Text>
              <Switch
                value={settings.registration_enabled}
                onValueChange={(v) => updateField('registration_enabled', v)}
                trackColor={{ true: colors.primary }}
                thumbColor={colors.surface}
              />
            </View>
          )}
        </Card>

        <Button onPress={handleSave} loading={saving} size="lg" style={{ marginTop: spacing.md }}>
          Save Settings
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.md, paddingBottom: spacing.xxl },
  section: { marginBottom: spacing.md },
  sectionTitle: { ...typography.h4, color: colors.text, marginBottom: spacing.md },
  switchRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.divider,
  },
  switchLabel: { ...typography.body, color: colors.text },
});
