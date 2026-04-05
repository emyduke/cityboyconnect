import { Platform, ViewStyle } from 'react-native';

type ShadowStyle = ViewStyle;

export const shadows: Record<string, ShadowStyle> = {
  sm: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3 },
    android: { elevation: 2 },
    default: { elevation: 2 },
  }) as ShadowStyle,
  md: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12 },
    android: { elevation: 4 },
    default: { elevation: 4 },
  }) as ShadowStyle,
  lg: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 24 },
    android: { elevation: 8 },
    default: { elevation: 8 },
  }) as ShadowStyle,
};
