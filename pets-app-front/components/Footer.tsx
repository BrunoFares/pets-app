import { colors } from '@/constants/colors';
import { useGlobal } from '@/contexts/GlobalProvider';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useLinkBuilder } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, useColorScheme, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import TabBarButton from './TabBarButton';

export function Footer({ state, descriptors, navigation }: BottomTabBarProps) {
  const darkMode = useColorScheme() === 'dark';
  const style = createStyles({ darkMode });
  const { buildHref } = useLinkBuilder();
  const { showFooter } = useGlobal();

  const [dimensions, setDimensions] = useState({height: 20, width: 100});
  const buttonWidth = dimensions.width / state.routes.length;

  const onTabBarLayout = (e: LayoutChangeEvent) => {
    setDimensions({
      height: e.nativeEvent.layout.height,
      width: e.nativeEvent.layout.width
    })
  }

  useEffect(() => {
    // keep the indicator in sync whenever the selected tab changes or layout changes
    tabPositionX.value = withSpring(buttonWidth * state.index, {
      stiffness: 1000,
      damping: 30,
      mass: 1,
    });
  }, [state.index, buttonWidth]);

  const tabPositionX = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => {
    return ({
      transform: [{translateX: tabPositionX.value,}]
    })
  })

  return (
    <View onLayout={onTabBarLayout} style={[style.container, (showFooter !== undefined && !showFooter) && {height: 0, width: 0}]}>
      <Animated.View style={[animatedStyle, {
        position: 'absolute',
        backgroundColor: colors.green,
        borderRadius: 30,
        marginHorizontal: 8,
        width: buttonWidth - 15,
        height: dimensions.width - 310
      }]} />
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
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        return (
          <TabBarButton
            key={route.name}
            onPress={onPress}
            onLongPress={onLongPress}
            isFocused={isFocused}
            routeName={(
              route.name === 'index' || 
              route.name === 'explore' || 
              route.name === 'chatbot' || 
              route.name === 'forum' || 
              route.name === 'profile')
            ? route.name : 'index'}
            label={typeof label === 'string' ? label : descriptors[route.key].options.title || ""}
          />
        );
      })}
    </View>
  );
}

const createStyles = ({ darkMode }: any) => {
    return StyleSheet.create({
        container: {
            position: 'absolute',
            bottom: 30, 
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '90%',
            alignSelf: 'center',
            backgroundColor: darkMode ? colors.darkGrey : colors.white,
            paddingVertical: 15, 
            borderRadius: 35, 

            // shadow
            shadowColor: colors.black,
            shadowOffset: {width: 0, height: 10},
            shadowRadius: 10,
            shadowOpacity: 0.2,
            elevation: 8
        },
    })
}