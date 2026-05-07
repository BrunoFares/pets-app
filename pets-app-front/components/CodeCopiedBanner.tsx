import { AdaptiveText } from "@/components/AdaptiveText";
import { colors } from "@/constants/colors";
import { Feather } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Platform,
  StyleSheet,
  useColorScheme,
  View,
} from "react-native";

type CodeCopiedBannerProps = {
  visible: boolean;
};

export function CodeCopiedBanner({ visible }: CodeCopiedBannerProps) {
  const darkMode = useColorScheme() === "dark";
  const styles = createStyles({ darkMode });
  const translateY = useRef(new Animated.Value(-140)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const [isRendered, setIsRendered] = useState(false);

  useEffect(() => {
    if (visible) {
      setIsRendered(true);

      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          damping: 18,
          stiffness: 170,
          mass: 0.9,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();

      return;
    }

    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -140,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 140,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setIsRendered(false);
      }
    });
  }, [opacity, translateY, visible]);

  if (!isRendered) {
    return null;
  }

  return (
    <View pointerEvents="box-none" style={styles.overlay}>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.bannerWrap,
          {
            opacity,
            transform: [{ translateY }],
          },
        ]}
      >
        <View style={styles.banner}>
          <View style={styles.iconWrap}>
            <Feather
              name="check"
              size={18}
              color={darkMode ? colors.white : colors.darkGreen}
            />
          </View>
          <AdaptiveText style={styles.title}>Code copied</AdaptiveText>
        </View>
      </Animated.View>
    </View>
  );
}

const createStyles = ({ darkMode }: { darkMode: boolean }) =>
  StyleSheet.create({
    overlay: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 999,
      elevation: 999,
      pointerEvents: "box-none",
    },
    bannerWrap: {
      marginTop: Platform.select({
        ios: 58,
        android: 28,
        default: 28,
      }),
      paddingHorizontal: 14,
    },
    banner: {
      borderRadius: 20,
      borderWidth: 1,
      borderColor: darkMode ? colors.lightGreen : colors.lightLightGreen1,
      backgroundColor: darkMode ? colors.averageDarkGrey : colors.lightLightGreen1,
      paddingVertical: 14,
      paddingHorizontal: 14,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      shadowColor: "#000000",
      shadowOpacity: darkMode ? 0.25 : 0.1,
      shadowRadius: 16,
      shadowOffset: {
        width: 0,
        height: 8,
      },
      elevation: 8,
    },
    iconWrap: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: darkMode ? "rgba(255,255,255,0.08)" : colors.white,
    },
    title: {
      fontFamily: "Poppins-SemiBold",
      fontSize: 14,
    },
  });
