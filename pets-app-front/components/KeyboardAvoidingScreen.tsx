import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";

type KeyboardAvoidingScreenProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function KeyboardAvoidingScreen({
  children,
  style,
}: KeyboardAvoidingScreenProps) {
  if (Platform.OS === "android") {
    return <View style={[styles.container, style]}>{children}</View>;
  }

  return (
    <KeyboardAvoidingView
      behavior="padding"
      keyboardVerticalOffset={0}
      style={[styles.container, style]}
    >
      {children}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
