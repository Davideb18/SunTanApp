import React, { useEffect } from "react";
import { View, Dimensions, Image } from "react-native";
import { useRouter } from "expo-router";
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withDelay, 
  withSequence,
  runOnJS,
  Easing
} from "react-native-reanimated";
import { GradientBackground } from "@/components/GradientBackground";
import { useAppStore } from "@/store/useAppStore";

const { width } = Dimensions.get("window");

export default function SplashScreen() {
  const router = useRouter();
  const hasCompletedOnboarding = useAppStore((state) => state.hasCompletedOnboarding);
  
  // Animation values
  const logoOpacity = useSharedValue(0);
  const backgroundOpacity = useSharedValue(1);

  const startNavigation = () => {
    if (hasCompletedOnboarding) {
      router.replace("/(tabs)");
    } else {
      router.replace("/onboarding");
    }
  };

  useEffect(() => {
    // 1. Logo fade in
    logoOpacity.value = withTiming(1, { duration: 1000 });
    
    // 2. Smooth background fade out and navigation
    backgroundOpacity.value = withDelay(2000, 
      withTiming(0, { duration: 800 }, (finished) => {
        if (finished) {
          runOnJS(startNavigation)();
        }
      })
    );
  }, []);

  const animatedLogoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
  }));

  const animatedContainerStyle = useAnimatedStyle(() => ({
    opacity: backgroundOpacity.value,
  }));

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <Animated.View style={[{ flex: 1 }, animatedContainerStyle]}>
        <GradientBackground>
          <View className="flex-1 items-center justify-center">
            <Animated.View style={[animatedLogoStyle, { top: -30 }]}>
              <Image 
                source={require("@/assets/images/logo.png")} 
                style={{ width: width * 0.75, height: width * 0.75 }}
                resizeMode="contain"
              />
            </Animated.View>
          </View>
        </GradientBackground>
      </Animated.View>
    </View>
  );
}
