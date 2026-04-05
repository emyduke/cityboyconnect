import { Platform, TextStyle } from 'react-native';

const fontFamily = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  default: 'System',
});

export const typography: Record<string, TextStyle> = {
  h1: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5, fontFamily },
  h2: { fontSize: 24, fontWeight: '700', letterSpacing: -0.3, fontFamily },
  h3: { fontSize: 20, fontWeight: '700', fontFamily },
  h4: { fontSize: 17, fontWeight: '600', fontFamily },
  body: { fontSize: 15, fontWeight: '400', lineHeight: 22, fontFamily },
  bodyMedium: { fontSize: 15, fontWeight: '500', lineHeight: 22, fontFamily },
  bodySm: { fontSize: 13, fontWeight: '400', lineHeight: 18, fontFamily },
  caption: { fontSize: 12, fontWeight: '400', letterSpacing: 0.2, fontFamily },
  captionBold: { fontSize: 12, fontWeight: '600', letterSpacing: 0.3, textTransform: 'uppercase', fontFamily },
  button: { fontSize: 15, fontWeight: '600', fontFamily },
  tabLabel: { fontSize: 11, fontWeight: '500', fontFamily },
};
