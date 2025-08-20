import { colors } from "@/constants/colors";
import { icons } from "@/constants/icons";
import { useEffect } from "react";
import { Pressable, StyleSheet, useColorScheme } from "react-native";
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const TabBarButton = ({
    onPress, 
    onLongPress, 
    isFocused, 
    routeName, 
    label
}: {
    onPress: () => void;
    onLongPress: () => void;
    isFocused: boolean;
    routeName: 'index' | 'explore' | 'profile' | 'chatbot';
    label: string;
}) => {
    const scale = useSharedValue(0);
    const darkMode = useColorScheme() === 'dark';
    const style = createStyles({ darkMode });

    useEffect(() => {
        scale.value = withSpring(typeof isFocused === 'boolean' ? (isFocused ? 1 : 0) : isFocused, {duration: 350});
    }, [scale, isFocused])

    const animatedIconStyle = useAnimatedStyle(() => {
        const scaleValue = interpolate(scale.value, [0,1], [1,1.2]);
        const top = interpolate(scale.value, [0,1], [0,9]);

        return {
            transform: [{
                scale: scaleValue
            }],
            top
        }
    })

    const animatedTextStyle = useAnimatedStyle(() => {
        const opacity = interpolate(scale.value, [0,1], [1,0]);

        return {opacity};
    })

    return (
        <Pressable
            onPress={onPress}
            onLongPress={onLongPress}
            style={style.tabBarItems}
        >
            <Animated.View style={animatedIconStyle}>
                {icons[routeName]({
                    color: isFocused ? colors.white : darkMode ? colors.white : colors.black,
                })}
            </Animated.View>

            {/* will need to check again for the dark mode */}
            <Animated.Text style={[style.text, animatedTextStyle]}>
                {label}
            </Animated.Text>
        </Pressable>
    )
}

export default TabBarButton;

const createStyles = ({ darkMode, isFocused }: any) => {
    return StyleSheet.create({
        tabBarItems: {
            flex: 1,
            justifyContent: "center",
            marginHorizontal: 10,
            alignItems: 'center',
        },
        text: {
            fontFamily: 'Poppins-Regular', 
            fontSize: 14,
            color: darkMode ? colors.white : colors.black,
        }
    });
}