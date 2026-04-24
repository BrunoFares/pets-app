import { colors } from "@/constants/colors";
import { AntDesign } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import type { ReactNode } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  View,
  ViewStyle,
} from "react-native";
import { AdaptiveText } from "./AdaptiveText";
import { AdaptiveView } from "./AdaptiveView";

export const PageHeader = ({
  title,
  style,
  onBackBtnPressed,
  rightElement,
}: {
  title: string;
  style?: ViewStyle;
  onBackBtnPressed?: () => void;
  rightElement?: ReactNode;
}) => {
  const darkMode = useColorScheme() === "dark";
  const styles = createStyles({ darkMode });
  const router = useRouter();

  return (
    <AdaptiveView style={[styles.header, style]}>
      <View style={styles.sideSlot}>
        <TouchableOpacity
          onPress={onBackBtnPressed ? onBackBtnPressed : () => router.back()} // allows the dev to add custom functions to the back btn
        >
          <AntDesign
            name="left"
            size={24}
            color={darkMode ? colors.white : colors.veryDarkGrey}
          />
        </TouchableOpacity>
      </View>

      <AdaptiveText
        style={{
          fontFamily: "Poppins-Regular",
        }}
      >
        {title}
      </AdaptiveText>

      <View style={[styles.sideSlot, styles.rightSlot]}>
        {rightElement ?? <View style={styles.sideSlotPlaceholder} />}
      </View>
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
    },
    sideSlot: {
      width: 32,
      alignItems: "flex-start",
      justifyContent: "center",
    },
    rightSlot: {
      alignItems: "flex-end",
    },
    sideSlotPlaceholder: {
      width: 24,
      height: 24,
    },
  });
};
