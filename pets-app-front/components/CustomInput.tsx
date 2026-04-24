import { colors } from "@/constants/colors";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Platform,
  StyleProp,
  StyleSheet,
  TextInput,
  TextInputProps,
  TextStyle,
  useColorScheme,
  View,
  ViewStyle,
} from "react-native";

type CustomInputProps = Omit<TextInputProps, "style"> & {
  label?: string;
  style?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  styleLabel?: StyleProp<TextStyle>;
};

const CustomInput = ({
  label,
  style,
  inputStyle,
  styleLabel,
  value: controlledValue,
  onChangeText,
  ...textInputProps
}: CustomInputProps) => {
  const darkMode = useColorScheme() === "dark";
  const inputRef = useRef<TextInput>(null);
  const styles = createStyles({ darkMode });
  const [uncontrolledValue, setUncontrolledValue] = useState(
    controlledValue ?? "",
  );
  const [textInputFocus, setTextInputFocus] = useState(false);
  const value = controlledValue ?? uncontrolledValue;
  const labelAnim = useRef(new Animated.Value(controlledValue ? 1 : 0)).current;

  const animateLabel = (toValue: number) => {
    Animated.timing(labelAnim, {
      toValue,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  useEffect(() => {
    animateLabel(textInputFocus || !!value ? 1 : 0);
  }, [labelAnim, textInputFocus, value]);

  const handleFocus = () => setTextInputFocus(true);
  const handleBlur = () => setTextInputFocus(false);

  const handleChangeText = (text: string) => {
    onChangeText?.(text);
    if (controlledValue === undefined) {
      setUncontrolledValue(text);
    }
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
          style={[labelStyle, styleLabel]}
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
        style={[styles.txtInput, inputStyle]}
        {...textInputProps}
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
