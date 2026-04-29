import { AdaptiveText } from "@/components/AdaptiveText";
import { AdaptiveView } from "@/components/AdaptiveView";
import { PageHeader } from "@/components/PageHeader";
import { colors } from "@/constants/colors";
import { goTo } from "@/utils";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AccountSettingsScreen() {
  const router = useRouter();
  const darkMode = useColorScheme() === "dark";
  const styles = createStyles({ darkMode });

  const settingsPage = (
    title: string,
    imageTitle: "password" | "alternate-email",
    fn: () => void,
  ) => {
    return (
      <TouchableOpacity style={styles.settingsPage} onPress={fn}>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <MaterialIcons
            name={imageTitle}
            size={24}
            color={darkMode ? colors.white : colors.black}
          />
          <AdaptiveText
            style={{
              fontFamily: "Poppins-Regular",
              fontSize: 16,
            }}
          >
            {title}
          </AdaptiveText>
        </View>
        <Feather
          name="arrow-right"
          size={24}
          color={darkMode ? colors.white : colors.black}
        />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <PageHeader
        title=""
        style={{ marginTop: Platform.select({ android: 20 }) }}
      />
      <ScrollView>
        <AdaptiveText
          style={{
            fontFamily: "Poppins-SemiBold",
            fontSize: 28,
            marginBottom: 40,
            alignSelf: "center",
          }}
        >
          Account Settings
        </AdaptiveText>
        <AdaptiveView style={styles.container}>
          {settingsPage("Change email", "alternate-email", () => {
            goTo(
              {},
              "/(tabs)/profile/settings/change-email-screen",
              router,
            );
          })}
          {settingsPage("Change password", "password", () => {})}
        </AdaptiveView>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = ({ darkMode }: any) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: darkMode ? colors.veryDarkGrey : colors.white,
      alignItems: "center",
      width: "100%",
      gap: 10,
    },
    settingsPage: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: darkMode ? colors.darkGrey : colors.lightGrey,
      paddingHorizontal: 16,
      paddingVertical: 14,
      width: "95%",
      borderRadius: 12,
    },
  });
};
