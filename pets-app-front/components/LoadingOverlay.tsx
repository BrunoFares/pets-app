import { colors } from "@/constants/colors";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Image,
  ImageSourcePropType,
  StyleSheet,
  useColorScheme,
  View,
} from "react-native";

type LoadingOverlayProps = {
  logoSize?: number;
  logoSource?: ImageSourcePropType;
};

const lightLogo = require("../assets/images/petsapp-logo-light.png");
const darkLogo = require("../assets/images/petsapp-logo-dark.png");

export const LoadingOverlay = ({
  logoSize = 86,
  logoSource,
}: LoadingOverlayProps) => {
  const darkMode = useColorScheme() === "dark";
  const styles = createStyles({ darkMode, logoSize });
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [pulse]);

  // Swap this out for your final logo animation when you're ready.
  const defaultLogoAnimation = {
    opacity: pulse.interpolate({
      inputRange: [0, 1],
      outputRange: [0.82, 1],
    }),
    transform: [
      {
        scale: pulse.interpolate({
          inputRange: [0, 1],
          outputRange: [0.96, 1.04],
        }),
      },
    ],
  };

  return (
    <View style={styles.overlay} pointerEvents="auto">
      <Animated.View style={[styles.logoWrap, defaultLogoAnimation]}>
        <Image
          source={logoSource ?? lightLogo}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
};

const createStyles = ({
  darkMode,
  logoSize,
}: {
  darkMode: boolean;
  logoSize: number;
}) => {
  return StyleSheet.create({
    overlay: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: darkMode
        ? "rgba(0, 0, 0, 0.46)"
        : "rgba(84, 84, 84, 0.22)",
    },
    logoWrap: {
      width: logoSize + 42,
      height: logoSize + 42,
      borderRadius: logoSize + 42,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: darkMode
        ? "rgba(29, 29, 29, 0.7)"
        : "rgba(255, 255, 255, 0.68)",
      borderWidth: 1,
      borderColor: darkMode ? colors.darkGrey : colors.lightGrey,
    },
    logo: {
      width: logoSize,
      height: logoSize,
    },
  });
};
