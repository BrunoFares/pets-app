import { useEffect, useRef } from "react";
import { Animated, Easing } from "react-native";

type UseFooterSlideParams = {
  visible?: boolean;
  height?: number;
  bottomOffset?: number;
  duration?: number;
};

export function useFooterSlide({
  visible = true,
  height = 120,
  bottomOffset = 50,
  duration = 300,
}: UseFooterSlideParams) {
  const translateY = useRef(new Animated.Value(visible ? 0 : height + bottomOffset))
    .current;

  useEffect(() => {
    Animated.timing(translateY, {
      toValue: visible ? 0 : height + bottomOffset,
      duration,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [bottomOffset, duration, height, translateY, visible]);

  return { translateY };
}
