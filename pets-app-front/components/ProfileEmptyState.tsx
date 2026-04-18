import { AdaptiveText } from "@/components/AdaptiveText";
import { colors } from "@/constants/colors";
import React from "react";
import { StyleSheet, useColorScheme, View, ViewStyle } from "react-native";

type ProfileEmptyStateProps = {
  title: string;
  subtitle?: string;
  compact?: boolean;
  style?: ViewStyle;
};

export function ProfileEmptyState({
  title,
  subtitle,
  compact = false,
  style,
}: ProfileEmptyStateProps) {
  const darkMode = useColorScheme() === "dark";
  const styles = createStyles({
    darkMode,
    compact,
    hasSubtitle: Boolean(subtitle),
  });

  return (
    <View style={[styles.card, style]}>
      <AdaptiveText style={styles.title}>{title}</AdaptiveText>
      {!!subtitle && (
        <AdaptiveText style={styles.subtitle}>{subtitle}</AdaptiveText>
      )}
    </View>
  );
}

const createStyles = ({
  darkMode,
  compact,
  hasSubtitle,
}: {
  darkMode: boolean;
  compact: boolean;
  hasSubtitle: boolean;
}) => {
  return StyleSheet.create({
    card: {
      width: "90%",
      alignSelf: "center",
      borderRadius: 18,
      paddingHorizontal: 20,
      paddingVertical: compact ? 18 : 24,
      marginTop: compact ? 8 : 24,
      marginBottom: compact ? 8 : 16,
      backgroundColor: darkMode ? colors.darkGrey : colors.lightGrey,
      alignItems: "center",
    },
    title: {
      fontFamily: "Poppins-SemiBold",
      fontSize: compact ? 16 : 18,
      textAlign: "center",
      marginBottom: hasSubtitle ? 6 : 0,
    },
    subtitle: {
      fontFamily: "Poppins-Light",
      fontSize: 14,
      textAlign: "center",
      opacity: 0.85,
    },
  });
};
