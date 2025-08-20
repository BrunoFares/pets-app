import { colors } from '@/constants/colors';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useLinkBuilder } from '@react-navigation/native';
import React, { useEffect } from 'react';
import { StyleSheet, useColorScheme, View } from 'react-native';
import TabBarButton from './TabBarButton';

export function Footer({ state, descriptors, navigation }: BottomTabBarProps) {
  const darkMode = useColorScheme() === 'dark';
  const style = createStyles({ darkMode });
  const { buildHref } = useLinkBuilder();

  return (
    <View style={style.container}>
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

        useEffect(() => {
          console.log(descriptors[route.key].options.title)
        }, []);

        return (
          <TabBarButton
            key={route.name}
            onPress={onPress}
            onLongPress={onLongPress}
            isFocused={isFocused}
            routeName={(
              route.name === 'index' || 
              route.name === 'explore' || 
              route.name === 'profile' || 
              route.name === 'chatbot')
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
            bottom: 50, 
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '90%',
            alignSelf: 'center',
            backgroundColor: colors.white,
            paddingVertical: 15, 
            borderRadius: 35, 

            // shadow
            shadowColor: colors.black,
            shadowOffset: {width: 0, height: 10},
            shadowRadius: 10,
            shadowOpacity: 0.1,
            elevation: 4
        },
    })
}