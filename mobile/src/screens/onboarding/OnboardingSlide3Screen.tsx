import React from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInUp } from 'react-native-reanimated';
import Button from '../../components/ui/Button';

interface OnboardingSlide3Props {
  onJoin: () => void;
  onLogin: () => void;
  currentPage?: number;
  totalPages?: number;
}

export default function OnboardingSlide3Screen({ onJoin, onLogin, currentPage = 2, totalPages = 3 }: OnboardingSlide3Props) {
  const insets = useSafeAreaInsets();

  const features = [
    { icon: '⭐', text: 'Score points for every action' },
    { icon: '📍', text: 'Represent your LGA, State & Zone' },
    { icon: '🏆', text: 'National Leaderboard visible to all' },
  ];

  return (
    <LinearGradient colors={['#0d2416', '#0f3320']} className="flex-1">
      <View className="flex-1 justify-center items-center px-8" style={{ paddingTop: insets.top + 48 }}>
        <Animated.View entering={FadeInUp.delay(200).duration(600)}>
          <Image
            source={require('../../../assets/files/07_icon_gold.png')}
            style={{ width: 80, height: 80 }}
            className="mb-6"
            contentFit="contain"
          />
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(400).duration(600)}>
          <Text className="font-display text-3xl text-white text-center mb-4" style={{ lineHeight: 36 }}>
            Climb the Ranks.{'\n'}Lead Your Ward.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(500).duration(600)}>
          <Text className="font-body text-base text-gold text-center mb-8" style={{ lineHeight: 22 }}>
            From Ward Coordinator to State Director — your performance drives your promotion.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(600).duration(600)} className="w-full gap-4">
          {features.map((f, i) => (
            <View key={i} className="flex-row items-center gap-4">
              <Text className="text-xl">{f.icon}</Text>
              <Text className="font-body text-base text-white">{f.text}</Text>
            </View>
          ))}
        </Animated.View>
      </View>

      <Animated.View
        entering={FadeInUp.delay(800).duration(600)}
        className="px-6"
        style={{ paddingBottom: insets.bottom + 24 }}
      >
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

        <Button onPress={onJoin} size="lg" className="w-full mb-2">
          Join Now
        </Button>

        <Button variant="outline" onPress={onLogin} size="lg" className="w-full border-white/30 bg-transparent">
          Log In
        </Button>
      </Animated.View>
    </LinearGradient>
  );
}
