import { colors } from "@/constants/colors";
import { AntDesign } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
    StyleSheet,
    TouchableOpacity,
    useColorScheme,
    View,
} from "react-native";
import { AdaptiveText } from "./AdaptiveText";
import { AdaptiveView } from "./AdaptiveView";

export const PageHeader = ({
  title,
  onBackBtnPressed,
}: {
  title: string;
  onBackBtnPressed?: () => void;
}) => {
  const darkMode = useColorScheme() === "dark";
  const styles = createStyles({ darkMode });
  const router = useRouter();

  return (
    <AdaptiveView style={styles.header}>
      <TouchableOpacity 
        onPress={onBackBtnPressed ? onBackBtnPressed : () => router.back()} // allows the dev to add custom functions to the back btn
      >
        <AntDesign
          name="left"
          size={24}
          color={darkMode ? colors.white : colors.veryDarkGrey}
        />
      </TouchableOpacity>
      <AdaptiveText>{title}</AdaptiveText>
      <View style={{ width: 24 }} />
    </AdaptiveView>
  );
};

const createStyles = ({ darkMode }: any) => {
  return StyleSheet.create({
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: darkMode ? colors.veryDarkGrey : colors.white,
      height: 50,
      width: "100%",

      // shadow
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 10 },
      shadowRadius: 10,
      shadowOpacity: 0.2,
      elevation: 8,
    },
    icon: {
      marginRight: 12,
    },
  });
};
