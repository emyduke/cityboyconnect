import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import Button from '../../components/ui/Button';

interface WelcomeScreenProps {
  onGetStarted: () => void;
  onLogin: () => void;
  currentPage?: number;
  totalPages?: number;
}

export default function WelcomeScreen({ onGetStarted, onLogin, currentPage = 0, totalPages = 3 }: WelcomeScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={['#0d2416', '#1a472a', '#2d6a4f']}
      className="flex-1"
    >
      <View className="flex-1 justify-center items-center px-8" style={{ paddingTop: insets.top + 48 }}>
        <Animated.View entering={FadeInUp.delay(200).duration(800)} className="mb-8">
          <Image
            source={require('../../../assets/files/02_primary_transparent.png')}
            style={{ width: 240, height: 100 }}
            contentFit="contain"
          />
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(500).duration(600)}>
          <Text className="font-display text-2xl text-white text-center mb-4" style={{ lineHeight: 32 }}>
            Building Nigeria's Most Organised Youth Movement
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(700).duration(600)}>
          <Text className="font-body text-base text-gold text-center opacity-90">
            Join 50,000+ members across all 36 states and the FCT
          </Text>
        </Animated.View>
      </View>

      <Animated.View
        entering={FadeInDown.delay(900).duration(600)}
        className="px-6"
        style={{ paddingBottom: insets.bottom + 24 }}
      >
        {/* Page dots */}
        <View className="flex-row justify-center mb-6 gap-2">
          {Array.from({ length: totalPages }).map((_, i) => (
            <View
              key={i}
              className={i === currentPage
                ? 'h-2 rounded-full bg-gold w-6'
                : 'w-2 h-2 rounded-full bg-white/30'
              }
            />
          ))}
        </View>

        <Button onPress={onGetStarted} size="lg" className="w-full mb-4">
          Get Started
        </Button>

        <Pressable onPress={onLogin}>
          <Text className="font-body text-base text-white text-center underline opacity-80">
            I have an account
          </Text>
        </Pressable>
      </Animated.View>
    </LinearGradient>
  );
}
