// hooks/useHeaderSlide.ts
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useRef } from "react";
import { Animated, Easing } from "react-native";

/**
 * Slide header: show (0) or hide (-H).
 * Call with { showOnFocus: true } on screens that should show the header,
 * and false on screens that should hide it.
 */
export function useHeaderSlide({ height = 200, duration = 300 }: any) {
  const translateY = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      // Slide in on focus
      Animated.timing(translateY, {
        toValue: 0,
        duration,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }).start();

      // Slide out on blur/unmount
      return () => {
        Animated.timing(translateY, {
          toValue: -height,
          duration,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }).start();
      };
    }, [height, duration, translateY])
  );

  return { translateY };
}
