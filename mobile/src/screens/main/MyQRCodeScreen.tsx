import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import QRCode from 'react-native-qrcode-svg';
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
    const shareUrl = data?.share_url || data?.qr_url;
    if (!shareUrl) return;
    await Clipboard.setStringAsync(shareUrl);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    toast('Referral link copied!', 'success');
  };

  const shareQR = async () => {
    const shareUrl = data?.share_url || data?.qr_url;
    if (!shareUrl) return;
    try {
      await Share.share({
        message: `Join City Boy Connect under ${user?.full_name || 'me'}: ${shareUrl}`,
        url: shareUrl,
      });
    } catch { /* user cancelled */ }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-forest-dark">
        <View className="flex-1 justify-center items-center p-4">
          <Skeleton variant="card" width={300} height={400} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-forest-dark">
      <View className="flex-1 justify-center items-center p-4">
        <View className="bg-surface rounded-xl p-6 items-center w-full max-w-[340px] shadow-lg">
          <Avatar name={user?.full_name || ''} size="lg" />
          <Text className="text-xl font-display-bold text-gray-900 mt-2">{user?.full_name}</Text>
          <Text className="text-sm font-body text-gray-500 mb-4">{user?.state_name || ''} · City Boy Movement</Text>

          {error ? (
            <View className="items-center py-6">
              <Text className="text-base font-body text-danger text-center mb-4">{error}</Text>
              <Button size="sm" onPress={() => { setError(null); setLoading(true); fetchData(); }}>Retry</Button>
            </View>
          ) : (
            <>
              <View className="p-4 rounded-lg border-[3px] border-forest bg-white mb-4">
                <QRCode value={data.qr_url} size={200} color="#1a472a" backgroundColor="white" />
              </View>
              <Text className="text-xs font-body text-gray-500 text-center mb-4">Scan to join the movement under me</Text>

              <View className="flex-row justify-around w-full mb-4">
                <View className="items-center">
                  <Text className="text-xl font-display-bold text-forest">{data.direct_count ?? 0}</Text>
                  <Text className="text-xs font-body text-gray-500">Direct</Text>
                </View>
                <View className="items-center">
                  <Text className="text-xl font-display-bold text-forest">{data.network_size ?? 0}</Text>
                  <Text className="text-xs font-body text-gray-500">Network</Text>
                </View>
                <View className="items-center">
                  <Text className="text-xl font-display-bold text-forest">{data.today_count ?? 0}</Text>
                  <Text className="text-xs font-body text-gray-500">Today</Text>
                </View>
              </View>

              <View className="flex-row gap-2 w-full">
                <Button variant="secondary" onPress={copyLink} className="flex-1">Copy Link</Button>
                <Button onPress={shareQR} className="flex-1">Share</Button>
              </View>
            </>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
