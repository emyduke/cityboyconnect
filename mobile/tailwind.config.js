/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        forest: { DEFAULT: '#1a472a', light: '#2d6a4f', dark: '#0d2416' },
        gold: { DEFAULT: '#d4a017', light: '#e8c547', dark: '#b8860b' },
        danger: { DEFAULT: '#dc2626', light: '#fee2e2' },
        success: { DEFAULT: '#16a34a', light: '#dcfce7' },
        warning: { DEFAULT: '#d97706', light: '#fef3c7' },
        info: { DEFAULT: '#2563eb', light: '#dbeafe' },
        surface: '#FFFFFF',
        background: '#FAFAF8',
      },
      fontFamily: {
        display: ['BricolageGrotesque-ExtraBold'],
        'display-bold': ['BricolageGrotesque-Bold'],
        'display-semibold': ['BricolageGrotesque-SemiBold'],
        body: ['PlusJakartaSans-Regular'],
        'body-medium': ['PlusJakartaSans-Medium'],
        'body-semibold': ['PlusJakartaSans-SemiBold'],
        'body-bold': ['PlusJakartaSans-Bold'],
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
      },
    },
  },
  plugins: [],
};
