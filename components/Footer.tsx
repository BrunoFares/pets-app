import { colors } from '@/constants/colors';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { PlatformPressable, Text } from '@react-navigation/elements';
import { useLinkBuilder } from '@react-navigation/native';
import { StyleSheet, useColorScheme, View } from 'react-native';

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

        return (
          <PlatformPressable
            key={route.name}
            href={buildHref(route.name, route.params)}
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarButtonTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            style={{ flex: 1 }}
          >
            <Text style={{ color: isFocused ? colors.black : colors.black }}>
              {label}
            </Text>
          </PlatformPressable>
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
            backgroundColor: colors.white,
            marginHorizontal: 80,
        },
    })
}