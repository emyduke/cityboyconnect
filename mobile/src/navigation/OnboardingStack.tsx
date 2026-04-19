import React, { useState, useRef } from 'react';
import { View, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { SlideInRight, SlideOutLeft, SlideInLeft, SlideOutRight } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WelcomeScreen from '../screens/onboarding/WelcomeScreen';
import OnboardingSlide2Screen from '../screens/onboarding/OnboardingSlide2Screen';
import OnboardingSlide3Screen from '../screens/onboarding/OnboardingSlide3Screen';
import { RootStackParamList } from './types';

const TOTAL_PAGES = 3;

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function OnboardingStack() {
  const [page, setPage] = useState(0);
  const navigation = useNavigation<Nav>();

  const finish = async (target: 'Login' | 'Join') => {
    await AsyncStorage.setItem('onboarding_done', '1');
    navigation.reset({ index: 0, routes: [{ name: 'Auth', params: { screen: target } }] });
  };

  return (
    <View className="flex-1">
      {page === 0 && (
        <Animated.View className="absolute inset-0" entering={SlideInRight.duration(350)} exiting={SlideOutLeft.duration(250)}>
          <WelcomeScreen
            onGetStarted={() => setPage(1)}
            onLogin={() => finish('Login')}
            currentPage={0}
            totalPages={TOTAL_PAGES}
          />
        </Animated.View>
      )}
      {page === 1 && (
        <Animated.View className="absolute inset-0" entering={SlideInRight.duration(350)} exiting={SlideOutLeft.duration(250)}>
          <OnboardingSlide2Screen
            onNext={() => setPage(2)}
            onSkip={() => finish('Join')}
            currentPage={1}
            totalPages={TOTAL_PAGES}
          />
        </Animated.View>
      )}
      {page === 2 && (
        <Animated.View className="absolute inset-0" entering={SlideInRight.duration(350)} exiting={SlideOutLeft.duration(250)}>
          <OnboardingSlide3Screen
            onJoin={() => finish('Join')}
            onLogin={() => finish('Login')}
            currentPage={2}
            totalPages={TOTAL_PAGES}
          />
        </Animated.View>
      )}
    </View>
  );
}
