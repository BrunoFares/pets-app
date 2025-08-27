import { colors } from "@/constants/colors";
import { useHeaderSlide } from "@/hooks/useHeaderSlide";
import React, { useRef, useState } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ExploreTab from "../explore-tab";

export default function Explore() {
  const darkMode = useColorScheme() === "dark";
  const styles = createStyles({ darkMode });

  // Hide header on this screen
  const { translateY } = useHeaderSlide({ showOnFocus: false, height: 200 });

  // --- swipeable tabs state ---
  const labels = ["Vets", "Pet Shops", "Pet Places"];
  const { width } = useWindowDimensions();
  const tabWidth = (width * 0.8) / labels.length;

  const [index, setIndex] = useState(0);
  const scrollRef = useRef<any>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const goTo = (i: number) => {
    setIndex(i);
    scrollRef.current?.scrollTo({ x: i * width, animated: true });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header area (sliding) */}
      <Animated.View style={{ transform: [{ translateY }] }}>
        <View style={styles.tabs}>
          {labels.map((label, i) => (
            <Pressable
              key={label}
              onPress={() => goTo(i)}
              accessibilityRole="tab"
              accessibilityState={{ selected: index === i }}
              style={styles.tabBtn}
            >
              <Text style={[styles.text, index === i && styles.textActive]}>
                {label}
              </Text>
            </Pressable>
          ))}

          {/* Indicator */}
          <Animated.View
            style={[
              styles.indicator,
              {
                width: tabWidth,
                transform: [
                  {
                    translateX: Animated.multiply(scrollX, tabWidth / width),
                  },
                ],
              },
            ]}
          />
        </View>
      </Animated.View>

      {/* Pages */}
      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(e) => {
          const i = Math.round(e.nativeEvent.contentOffset.x / width);
          setIndex(i);
        }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true }
        )}
      >
        <View style={[styles.page, { width }]}>
          <ExploreTab />
        </View>

        <View style={[styles.page, { width }]}>
          <ExploreTab />
        </View>

        <View style={[styles.page, { width }]}>
          <ExploreTab />
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const createStyles = ({ darkMode }: any) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: darkMode ? colors.veryDarkGrey : colors.white,
    },
    body: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    // --- tabs ---
    tabs: {
      flexDirection: "row",
      alignSelf: "center",
      backgroundColor: darkMode ? colors.darkGrey : colors.lightLightGreen1,
      gap: 14,
      paddingHorizontal: 16,
      width: '80%',
      paddingVertical: 10,
      borderRadius: 24,
      overflow: "hidden", // keeps indicator rounded
      position: "relative",
    },
    tabBtn: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 6,
      minWidth: 80,
    },
    text: {
      color: darkMode ? colors.white : colors.black,
      fontSize: 14,
      fontWeight: "600",
      fontFamily: 'Poppins-Medium',
    },
    textActive: {
      opacity: 1,
    },
    indicator: {
      position: "absolute",
      bottom: 0,
      left: 0,
      height: 50,
      borderRadius: 24,
      backgroundColor: darkMode ? colors.white : colors.green,
      opacity: 0.1
    },
    // --- pages ---
    page: {
      flex: 1,
    },
  });
};
