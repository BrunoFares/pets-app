import { AdaptiveText } from "@/components/AdaptiveText";
import { colors } from "@/constants/colors";
import {
  SoftErrorNotice,
  dismissSoftErrorNotice,
  subscribeToSoftErrorNotice,
} from "@/lib/soft-error-notice";
import { Feather } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  useColorScheme,
  View,
} from "react-native";

export function SoftErrorBanner() {
  const darkMode = useColorScheme() === "dark";
  const styles = createStyles({ darkMode });
  const translateY = useRef(new Animated.Value(-140)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const [notice, setNotice] = useState<SoftErrorNotice | null>(null);
  const [renderedNotice, setRenderedNotice] = useState<SoftErrorNotice | null>(
    null,
  );

  useEffect(() => {
    return subscribeToSoftErrorNotice(setNotice);
  }, []);

  useEffect(() => {
    if (notice) {
      setRenderedNotice(notice);

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
        setRenderedNotice(null);
      }
    });
  }, [notice, opacity, translateY]);

  if (!renderedNotice) {
    return null;
  }

  return (
    <View pointerEvents="box-none" style={styles.overlay}>
      <Animated.View
        style={[
          styles.bannerWrap,
          {
            opacity,
            transform: [{ translateY }],
          },
        ]}
        pointerEvents="box-none"
      >
        <View style={styles.banner}>
          <View style={styles.iconWrap}>
            <Feather
              name="wifi-off"
              size={18}
              color={darkMode ? colors.lightOrange : colors.darkGreen}
            />
          </View>

          <View style={styles.copyWrap}>
            <AdaptiveText style={styles.title}>Connection issue</AdaptiveText>
            <AdaptiveText style={styles.message}>
              {renderedNotice.message}
            </AdaptiveText>
          </View>

          <Pressable
            accessibilityLabel="Dismiss network notice"
            onPress={dismissSoftErrorNotice}
            hitSlop={10}
            style={styles.dismissButton}
          >
            <Feather
              name="x"
              size={18}
              color={darkMode ? colors.white : colors.black}
            />
          </Pressable>
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
      borderColor: darkMode ? colors.lightOrange : colors.lightLightOrange,
      backgroundColor: darkMode ? colors.averageDarkGrey : colors.lightLightOrange,
      paddingVertical: 14,
      paddingHorizontal: 14,
      flexDirection: "row",
      alignItems: "flex-start",
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
      marginTop: 2,
    },
    copyWrap: {
      flex: 1,
    },
    title: {
      fontFamily: "Poppins-SemiBold",
      fontSize: 14,
      marginBottom: 2,
    },
    message: {
      fontFamily: "Poppins-Regular",
      fontSize: 13,
      lineHeight: 19,
      opacity: 0.9,
    },
    dismissButton: {
      paddingTop: 2,
    },
  });
