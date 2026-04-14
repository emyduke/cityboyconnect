import { TextStyle } from 'react-native';

// Display / heading font — political authority, bold civic presence
const display = 'BricolageGrotesque-ExtraBold';
const displayBold = 'BricolageGrotesque-Bold';
const displaySemiBold = 'BricolageGrotesque-SemiBold';

// Body font — clean, modern, highly readable
const body = 'PlusJakartaSans-Regular';
const bodyMedium = 'PlusJakartaSans-Medium';
const bodySemiBold = 'PlusJakartaSans-SemiBold';
const bodyBold = 'PlusJakartaSans-Bold';

export const typography: Record<string, TextStyle> = {
  // Headings — Bricolage Grotesque
  h1: { fontSize: 28, fontFamily: display, letterSpacing: -0.5 },
  h2: { fontSize: 24, fontFamily: displayBold, letterSpacing: -0.3 },
  h3: { fontSize: 20, fontFamily: displayBold },
  h4: { fontSize: 17, fontFamily: displaySemiBold },

  // Body — Plus Jakarta Sans
  body: { fontSize: 15, fontFamily: body, lineHeight: 22 },
  bodyMedium: { fontSize: 15, fontFamily: bodyMedium, lineHeight: 22 },
  bodySm: { fontSize: 13, fontFamily: body, lineHeight: 18 },

  // Captions
  caption: { fontSize: 12, fontFamily: body, letterSpacing: 0.2 },
  captionBold: { fontSize: 12, fontFamily: bodySemiBold, letterSpacing: 0.3, textTransform: 'uppercase' },

  // Buttons — semibold Jakarta for actions
  button: { fontSize: 15, fontFamily: bodySemiBold },

  // Tab bar
  tabLabel: { fontSize: 11, fontFamily: bodyMedium },
};
