import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography } from '../../theme';

const TAB_CONFIG: Record<string, { icon: string; label: string }> = {
  HomeTab: { icon: '🏠', label: 'Home' },
  MembersTab: { icon: '👥', label: 'Members' },
  EventsTab: { icon: '📅', label: 'Events' },
  RanksTab: { icon: '🏆', label: 'Ranks' },
  MoreTab: { icon: '⚙️', label: 'More' },
};

function TabItem({ routeName, isFocused, onPress }: { routeName: string; isFocused: boolean; onPress: () => void }) {
  const config = TAB_CONFIG[routeName] || { icon: '•', label: routeName };

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(isFocused ? 1.1 : 1, { damping: 15 }) }],
  }));

  return (
    <Pressable style={styles.tab} onPress={onPress}>
      {isFocused && <View style={styles.indicator} />}
      <Animated.View style={[styles.iconWrap, animStyle]}>
        <Text style={[styles.iconText, { opacity: isFocused ? 1 : 0.5 }]}>{config.icon}</Text>
      </Animated.View>
      <Text style={[styles.label, isFocused && styles.labelActive]}>
        {config.label}
      </Text>
    </Pressable>
  );
}

export default function TabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom || spacing.sm }]}>
      {state.routes.map((route: any, index: number) => {
        const isFocused = state.index === index;
        const onPress = () => {
          Haptics.selectionAsync();
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };
        return <TabItem key={route.key} routeName={route.name} isFocused={isFocused} onPress={onPress} />;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  indicator: {
    position: 'absolute',
    top: -spacing.sm,
    width: 24,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.accent,
  },
  iconWrap: { marginBottom: 2 },
  iconText: { fontSize: 22 },
  label: { ...typography.tabLabel, color: colors.textTertiary },
  labelActive: { color: colors.accent, fontFamily: 'PlusJakartaSans-Bold' },
});
