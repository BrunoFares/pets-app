import { colors } from "@/constants/colors";
import { useRef, useState } from "react";
import {
  Animated,
  Platform,
  StyleSheet,
  TextInput,
  useColorScheme,
  View,
  ViewStyle,
} from "react-native";

const CustomInput = ({
  label,
  style,
  value = "",
  onChangeText,
}: {
  label?: string;
  style?: ViewStyle;
  value?: string;
  onChangeText?: (text: string) => void;
}) => {
  const darkMode = useColorScheme() === "dark";
  const inputRef = useRef<TextInput>(null);
  const styles = createStyles({ darkMode });
  const [textInputFocus, setTextInputFocus] = useState(false);
  const labelAnim = useRef(new Animated.Value(0)).current; // 0: inside, 1: floated

  // Animate label when focus or has value
  const animateLabel = (toValue: number) => {
    Animated.timing(labelAnim, {
      toValue,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleFocus = () => {
    setTextInputFocus(true);
    animateLabel(1);
  };
  const handleBlur = () => {
    setTextInputFocus(false);
    if (!value) animateLabel(0);
  };
  const handleChangeText = (text: string) => {
    onChangeText?.(text);
    if (text && !textInputFocus) animateLabel(1);
    if (!text && !textInputFocus) animateLabel(0);
  };

  const labelStyle = {
    position: "absolute" as const,
    left: 10,
    // interpolate between inside and floated
    top: labelAnim.interpolate({
      inputRange: [0, 1],
      outputRange: Platform.select({
        ios: [11, -11],
        android: [13, -11],
      }) || [11, -11],
    }),
    fontSize: labelAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 12],
    }),
    color: darkMode ? colors.lightGrey : colors.darkGrey,
    fontFamily: "Poppins-Regular",
    backgroundColor: darkMode ? colors.veryDarkGrey : colors.white,
    paddingHorizontal: 6,
    zIndex: 2,
  };

  return (
    <View
      style={[
        styles.txtInputContainer,
        textInputFocus && {
          borderColor: darkMode ? colors.lightGrey : colors.darkGrey,
        },
        style,
      ]}
    >
      {label && (
        <Animated.Text
          onPress={() => {
            inputRef.current?.focus();
            handleFocus();
          }}
          style={labelStyle}
        >
          {label}
        </Animated.Text>
      )}
      <TextInput
        ref={inputRef}
        value={value}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onChangeText={handleChangeText}
        style={styles.txtInput}
      />
    </View>
  );
};

export default CustomInput;

const createStyles = ({ darkMode }: any) => {
  return StyleSheet.create({
    txtInputContainer: {
      borderColor: darkMode ? colors.darkGrey : colors.lightGrey,
      borderWidth: 1,
      borderRadius: 16,
      width: "85%",
      marginBottom: 12,
    },
    txtInput: {
      fontSize: 16,
      fontFamily: "Poppins-Regular",
      color: darkMode ? colors.white : colors.black,
      paddingVertical: 12,
      paddingHorizontal: 16,
    },
  });
};
