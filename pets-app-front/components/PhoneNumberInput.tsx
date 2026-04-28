import { colors } from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  StyleProp,
  StyleSheet,
  TextInput,
  TextInputProps,
  TextStyle,
  useColorScheme,
  View,
  ViewStyle,
} from "react-native";

type PhoneNumberInputProps = Omit<TextInputProps, "style"> & {
  style?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
};

function sanitizePhoneNumberInput(value: string) {
  const startsWithPlus = value.trimStart().startsWith("+");
  const cleaned = value.replace(/[^\d()+\-\s]/g, "");
  const withoutExtraPlus = cleaned.replace(/\+/g, "");
  const normalized = `${startsWithPlus ? "+" : ""}${withoutExtraPlus}`.replace(
    /\s{2,}/g,
    " ",
  );

  return normalized;
}

export default function PhoneNumberInput({
  style,
  inputStyle,
  onChangeText,
  onFocus,
  onBlur,
  keyboardType,
  inputMode,
  autoComplete,
  textContentType,
  autoCorrect,
  spellCheck,
  maxLength,
  placeholder,
  placeholderTextColor,
  ...textInputProps
}: PhoneNumberInputProps) {
  const darkMode = useColorScheme() === "dark";
  const styles = createStyles({ darkMode });
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View
      style={[
        styles.container,
        isFocused
          ? { borderColor: darkMode ? colors.lightGrey : colors.darkGrey }
          : null,
        style,
      ]}
    >
      <View style={styles.iconWrap}>
        <Ionicons
          name="call-outline"
          size={18}
          color={darkMode ? colors.lightGrey : colors.darkGrey}
        />
      </View>

      <TextInput
        {...textInputProps}
        onFocus={(event) => {
          setIsFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setIsFocused(false);
          onBlur?.(event);
        }}
        onChangeText={(text) => onChangeText?.(sanitizePhoneNumberInput(text))}
        keyboardType={keyboardType ?? "phone-pad"}
        inputMode={inputMode ?? "tel"}
        autoComplete={autoComplete ?? "tel"}
        textContentType={textContentType ?? "telephoneNumber"}
        autoCorrect={autoCorrect ?? false}
        spellCheck={spellCheck ?? false}
        maxLength={maxLength ?? 24}
        placeholder={placeholder ?? "Enter phone number"}
        placeholderTextColor={
          placeholderTextColor ??
          (darkMode ? colors.lightGrey : colors.darkGrey)
        }
        style={[styles.input, inputStyle]}
      />
    </View>
  );
}

const createStyles = ({ darkMode }: any) => {
  return StyleSheet.create({
    container: {
      width: "85%",
      marginBottom: 12,
      borderWidth: 1,
      borderRadius: 16,
      borderColor: darkMode ? colors.darkGrey : colors.lightGrey,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 14,
    },
    iconWrap: {
      marginRight: 10,
    },
    input: {
      flex: 1,
      fontSize: 16,
      fontFamily: "Poppins-Regular",
      color: darkMode ? colors.white : colors.black,
      paddingVertical: 12,
    },
  });
}
