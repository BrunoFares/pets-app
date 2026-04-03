import { colors } from "@/constants/colors";
import { useGlobal } from "@/contexts/GlobalProvider";
import { useFooterSlide } from "@/hooks/useFooterSlide";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import React, { useEffect, useState } from "react";
import {
  LayoutChangeEvent,
  Animated as RNAnimated,
  StyleSheet,
  useColorScheme,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import TabBarButton from "./TabBarButton";

export function Footer({ state, descriptors, navigation }: BottomTabBarProps) {
  const darkMode = useColorScheme() === "dark";
  const style = createStyles({ darkMode });
  const { showFooter } = useGlobal();

  const [dimensions, setDimensions] = useState({ height: 20, width: 100 });
  const buttonWidth = dimensions.width / state.routes.length;
  const tabPositionX = useSharedValue(0);
  const { translateY } = useFooterSlide({
    visible: showFooter !== false,
    height: dimensions.height,
    bottomOffset: 50,
  });

  const onTabBarLayout = (e: LayoutChangeEvent) => {
    setDimensions({
      height: e.nativeEvent.layout.height,
      width: e.nativeEvent.layout.width,
    });
  };

  useEffect(() => {
    // keep the indicator in sync whenever the selected tab changes or layout changes
    tabPositionX.value = withSpring(buttonWidth * state.index, {
      stiffness: 1000,
      damping: 30,
      mass: 1,
    });
  }, [state.index, buttonWidth, tabPositionX]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: tabPositionX.value }],
    };
  });

  return (
    <RNAnimated.View
      onLayout={onTabBarLayout}
      pointerEvents={showFooter === false ? "none" : "auto"}
      style={[style.container, { transform: [{ translateY }] }]}
    >
      <Animated.View
        style={[
          animatedStyle,
          {
            position: "absolute",
            backgroundColor: colors.green,
            borderRadius: 30,
            marginHorizontal: 8,
            width: buttonWidth - 15,
            height: dimensions.width * 0.16,
          },
        ]}
      />
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
              ? options.title
              : route.name;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: "tabLongPress",
            target: route.key,
          });
        };

        return (
          <TabBarButton
            key={route.name}
            onPress={onPress}
            onLongPress={onLongPress}
            isFocused={isFocused}
            routeName={
              route.name === "index" ||
              route.name === "explore" ||
              route.name === "chatbot" ||
              route.name === "forum" ||
              route.name === "profile"
                ? route.name
                : "index"
            }
            label={
              typeof label === "string"
                ? label
                : descriptors[route.key].options.title || ""
            }
          />
        );
      })}
    </RNAnimated.View>
  );
}

const createStyles = ({ darkMode }: any) => {
  return StyleSheet.create({
    container: {
      position: "absolute",
      bottom: 50,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      width: "90%",
      alignSelf: "center",
      backgroundColor: darkMode ? colors.darkGrey : colors.white,
      paddingVertical: 15,
      borderRadius: 35,

      // shadow
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 10 },
      shadowRadius: 10,
      shadowOpacity: 0.2,
      elevation: 8,
    },
  });
};
