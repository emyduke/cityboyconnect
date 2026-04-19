import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import Button from '../../components/ui/Button';

export default function SuspendedScreen() {
  const logout = useAuthStore((s) => s.logout);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 justify-center items-center p-8">
        <Text className="text-[64px] mb-4">🔒</Text>
        <Text className="text-2xl font-display-bold text-gray-900 mb-2">Account Suspended</Text>
        <Text className="text-base font-body text-gray-500 text-center leading-6">
          Your account has been suspended. If you believe this is an error, please contact support for assistance.
        </Text>
        <Button variant="secondary" onPress={logout} className="mt-6 w-full">
          Log Out
        </Button>
      </View>
    </SafeAreaView>
  );
}
