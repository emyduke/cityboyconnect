import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInUp } from 'react-native-reanimated';
import Button from '../../components/ui/Button';

interface OnboardingSlide2Props {
  onNext: () => void;
  onSkip: () => void;
  currentPage?: number;
  totalPages?: number;
}

export default function OnboardingSlide2Screen({ onNext, onSkip, currentPage = 1, totalPages = 3 }: OnboardingSlide2Props) {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top + 32 }}>
      <View className="flex-1 justify-center items-center px-8">
        {/* Illustration */}
        <Animated.View entering={FadeInUp.delay(200).duration(600)} className="mb-8">
          <View className="w-[200px] h-[200px] rounded-full bg-forest-light/[0.08] justify-center items-center">
            <View className="w-[100px] h-[140px] rounded-md border-[3px] border-forest justify-center items-center bg-surface">
              <View className="items-center">
                <Text className="text-2xl mb-1">📱</Text>
                <View className="flex-row flex-wrap w-[45px] gap-[3px]">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <View
                      key={i}
                      className={`w-[13px] h-[13px] rounded-sm ${i % 2 === 0 ? 'bg-forest' : 'bg-gray-200'}`}
                    />
                  ))}
                </View>
              </View>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(400).duration(600)}>
          <View className="flex-row items-center gap-1 mb-2">
            <Text className="text-lg">🏅</Text>
            <Text className="font-body-bold text-xs text-gold">Your Digital ID</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(500).duration(600)}>
          <Text className="font-display text-2xl text-gray-900 text-center mb-4">
            Your QR Code is Your Identity
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(600).duration(600)}>
          <Text className="font-body text-base text-gray-500 text-center" style={{ lineHeight: 22 }}>
            Get verified, recruit members, earn points, and track your network — all from one app.
          </Text>
        </Animated.View>
      </View>

      <View className="px-6" style={{ paddingBottom: insets.bottom + 24 }}>
        <View className="flex-row justify-center mb-6 gap-2">
          {Array.from({ length: totalPages }).map((_, i) => (
            <View
              key={i}
              className={i === currentPage
                ? 'h-2 rounded-full bg-gold w-6'
                : 'w-2 h-2 rounded-full bg-gray-200'
              }
            />
          ))}
        </View>

        <Button onPress={onNext} size="lg" className="w-full mb-4">
          Next →
        </Button>

        <Pressable onPress={onSkip}>
          <Text className="font-body text-base text-gray-400 text-center">Skip</Text>
        </Pressable>
      </View>
    </View>
  );
}
