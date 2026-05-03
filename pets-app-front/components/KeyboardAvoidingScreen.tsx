import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleProp,
  StyleSheet,
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
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
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
