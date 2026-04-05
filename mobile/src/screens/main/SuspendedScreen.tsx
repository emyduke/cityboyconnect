import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography, radius } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import Button from '../../components/ui/Button';

export default function SuspendedScreen() {
  const logout = useAuthStore((s) => s.logout);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.center}>
        <Text style={styles.icon}>🔒</Text>
        <Text style={styles.heading}>Account Suspended</Text>
        <Text style={styles.body}>
          Your account has been suspended. If you believe this is an error, please contact support for assistance.
        </Text>
        <Button variant="secondary" onPress={logout} style={{ marginTop: spacing.lg, width: '100%' }}>
          Log Out
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  icon: { fontSize: 64, marginBottom: spacing.md },
  heading: { ...typography.h2, color: colors.text, marginBottom: spacing.sm },
  body: { ...typography.body, color: colors.textSecondary, textAlign: 'center', lineHeight: 24 },
});
