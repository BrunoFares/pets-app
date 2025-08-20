import { colors } from "@/constants/colors";
import { icons } from "@/constants/icons";
import { Pressable, StyleSheet, Text, useColorScheme } from "react-native";

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
    const darkMode = useColorScheme() === 'dark';
    const style = createStyles({ darkMode });

    return (
        <Pressable
            onPress={onPress}
            onLongPress={onLongPress}
            style={style.tabBarItems}
        >
            {icons[routeName]({
                color: isFocused ? colors.green : colors.black
            })}
            {/* will need to check again for the dark mode */}
            <Text style={{ fontFamily: 'Poppins-Regular', color: isFocused ? colors.green : colors.black}}>
                {label}
            </Text>
        </Pressable>
    )
}

export default TabBarButton;

const createStyles = ({ darkMode }: any) => {
    return StyleSheet.create({
        tabBarItems: {
            flex: 1,
            justifyContent: "center",
            marginHorizontal: 10,
            alignItems: 'center',
        }
    });
}