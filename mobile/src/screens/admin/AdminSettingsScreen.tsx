import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
      <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
        <View className="p-4 pb-12">
          <Skeleton variant="card" height={200} />
        </View>
      </SafeAreaView>
    );
  }

  if (!settings) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
        <View className="p-4 pb-12 flex-1 items-center justify-center">
          <Text className="text-base font-body text-gray-900">Unable to load settings</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <ScrollView
        contentContainerClassName="p-4 pb-12"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1a472a" />}
      >
        <Card className="mb-4">
          <Text className="text-lg font-display-semibold text-gray-900 mb-4">General</Text>
          {settings.site_name != null && (
            <Input label="Site Name" value={settings.site_name || ''} onChangeText={(v: string) => updateField('site_name', v)} />
          )}
          {settings.maintenance_mode != null && (
            <View className="flex-row justify-between items-center py-2 border-b border-gray-100">
              <Text className="text-base font-body text-gray-900">Maintenance Mode</Text>
              <Switch
                value={settings.maintenance_mode}
                onValueChange={(v) => updateField('maintenance_mode', v)}
                trackColor={{ true: '#1a472a' }}
                thumbColor="#FFFFFF"
              />
            </View>
          )}
          {settings.registration_enabled != null && (
            <View className="flex-row justify-between items-center py-2 border-b border-gray-100">
              <Text className="text-base font-body text-gray-900">Registration Enabled</Text>
              <Switch
                value={settings.registration_enabled}
                onValueChange={(v) => updateField('registration_enabled', v)}
                trackColor={{ true: '#1a472a' }}
                thumbColor="#FFFFFF"
              />
            </View>
          )}
        </Card>

        <Button onPress={handleSave} loading={saving} size="lg" className="mt-4">
          Save Settings
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

