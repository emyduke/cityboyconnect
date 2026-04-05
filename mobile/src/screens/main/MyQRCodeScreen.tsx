import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import QRCode from 'react-native-qrcode-svg';
import { colors, spacing, typography, shadows, radius } from '../../theme';
import { getMyQR } from '../../api/members';
import { unwrap } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import Skeleton from '../../components/ui/Skeleton';

export default function MyQRCodeScreen() {
  const user = useAuthStore((s) => s.user);
  const toast = useToastStore((s) => s.show);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await getMyQR();
      const payload = unwrap(res);
      if (!payload?.qr_url) {
        setError('QR code could not be generated.');
      } else {
        setData(payload);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load QR code.');
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const copyLink = async () => {
    if (!data?.qr_url) return;
    await Clipboard.setStringAsync(data.qr_url);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    toast('Referral link copied!', 'success');
  };

  const shareQR = async () => {
    if (!data?.qr_url) return;
    try {
      await Share.share({
        message: `Join City Boy Connect under ${user?.full_name || 'me'}: ${data.qr_url}`,
        url: data.qr_url,
      });
    } catch { /* user cancelled */ }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Skeleton variant="card" width={300} height={400} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.center}>
        <View style={styles.card}>
          <Avatar name={user?.full_name || ''} size="lg" />
          <Text style={styles.name}>{user?.full_name}</Text>
          <Text style={styles.subtitle}>{user?.state_name || ''} · City Boy Movement</Text>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
              <Button size="sm" onPress={() => { setError(null); setLoading(true); fetchData(); }}>Retry</Button>
            </View>
          ) : (
            <>
              <View style={styles.qrFrame}>
                <QRCode value={data.qr_url} size={200} color={colors.primary} backgroundColor="white" />
              </View>
              <Text style={styles.instruction}>Scan to join the movement under me</Text>

              <View style={styles.stats}>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{data.direct_count ?? 0}</Text>
                  <Text style={styles.statLabel}>Direct</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{data.network_size ?? 0}</Text>
                  <Text style={styles.statLabel}>Network</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{data.today_count ?? 0}</Text>
                  <Text style={styles.statLabel}>Today</Text>
                </View>
              </View>

              <View style={styles.actions}>
                <Button variant="secondary" onPress={copyLink} style={{ flex: 1 }}>Copy Link</Button>
                <Button onPress={shareQR} style={{ flex: 1 }}>Share</Button>
              </View>
            </>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primaryDark },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.md },
  card: {
    backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg,
    alignItems: 'center', width: '100%', maxWidth: 340, ...shadows.lg,
  },
  name: { ...typography.h3, color: colors.text, marginTop: spacing.sm },
  subtitle: { ...typography.bodySm, color: colors.textSecondary, marginBottom: spacing.md },
  qrFrame: {
    padding: spacing.md, borderRadius: radius.lg, borderWidth: 3,
    borderColor: colors.primary, backgroundColor: '#fff', marginBottom: spacing.md,
  },
  instruction: { ...typography.caption, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.md },
  stats: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginBottom: spacing.md },
  stat: { alignItems: 'center' },
  statValue: { ...typography.h3, color: colors.primary },
  statLabel: { ...typography.caption, color: colors.textSecondary },
  actions: { flexDirection: 'row', gap: spacing.sm, width: '100%' },
  errorBox: { alignItems: 'center', paddingVertical: spacing.lg },
  errorText: { ...typography.body, color: colors.danger, textAlign: 'center', marginBottom: spacing.md },
});
