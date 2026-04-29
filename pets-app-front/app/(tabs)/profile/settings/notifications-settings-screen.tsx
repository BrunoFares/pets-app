import { AdaptiveText } from "@/components/AdaptiveText";
import { AdaptiveView } from "@/components/AdaptiveView";
import { PageHeader } from "@/components/PageHeader";
import { colors } from "@/constants/colors";
import {
  getNotificationPermissionAsync,
  getNotificationsUnavailableMessage,
  type NotificationPermissionState,
  requestNotificationPermissionAsync,
} from "@/lib/notifications";
import { MaterialIcons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function NotificationSettingsScreen() {
  const darkMode = useColorScheme() === "dark";
  const styles = createStyles({ darkMode });

  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermissionState | null>(null);

  const showNotificationsUnavailableAlert = () => {
    Alert.alert("Notifications unavailable", getNotificationsUnavailableMessage());
  };

  const getNotificationPermission = useCallback(async () => {
    try {
      const current = await getNotificationPermissionAsync();

      if (!current) {
        showNotificationsUnavailableAlert();
        return null;
      }

      setNotificationPermission(current);
      return current;
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Unexpected error.");
      return null;
    }
  }, []);

  const requestNotificationPermission = async () => {
    try {
      const current = await getNotificationPermissionAsync();

      if (!current) {
        showNotificationsUnavailableAlert();
        return;
      }

      if (current.granted) {
        Alert.alert(
          "Already Enabled",
          "Notifications are already allowed for this app.",
        );
        setNotificationPermission(current);
        return;
      }

      const requested = await requestNotificationPermissionAsync();

      if (!requested) {
        showNotificationsUnavailableAlert();
        return;
      }

      setNotificationPermission(requested);

      if (requested.granted) {
        Alert.alert("Success", "Notification permission granted.");
      } else {
        Alert.alert(
          "Permission Not Granted",
          "Notification access was not granted. You can enable it from Settings.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Open Settings", onPress: () => Linking.openSettings() },
          ],
        );
      }
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Unexpected error.");
    }
  };

  const modifyNotificationPermission = async () => {
    const current = await getNotificationPermission();

    if (!current) return;

    if (current.granted) {
      Alert.alert(
        "Modify Permission",
        "Notifications are currently allowed. Open Settings to change them.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Open Settings", onPress: () => Linking.openSettings() },
        ],
      );
      return;
    }

    Alert.alert(
      "Notification Permission",
      "Notifications are currently not allowed. Would you like to request permission now?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Allow", onPress: requestNotificationPermission },
        { text: "Open Settings", onPress: () => Linking.openSettings() },
      ],
    );
  };

  const getPermissionLabel = () => {
    if (!notificationPermission) return "unavailable";
    return notificationPermission.granted
      ? "granted"
      : notificationPermission.status;
  };

  const settingsPage = (
    title: string,
    imageTitle: "notifications",
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

        <AdaptiveText
          style={{
            textAlign: "right",
            fontFamily: "Poppins-Regular",
            fontSize: 12,
            marginTop: 8,
          }}
        >
          Notification permission is {getPermissionLabel()}.
        </AdaptiveText>
      </TouchableOpacity>
    );
  };

  useEffect(() => {
    void getNotificationPermission();
  }, [getNotificationPermission]);

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
          Notification Settings
        </AdaptiveText>

        <AdaptiveView style={styles.container}>
          {settingsPage(
            "Modify Notification Permissions",
            "notifications",
            modifyNotificationPermission,
          )}
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
      justifyContent: "flex-start",
      backgroundColor: darkMode ? colors.darkGrey : colors.lightGrey,
      paddingHorizontal: 16,
      paddingVertical: 14,
      width: 360,
      borderRadius: 12,
    },
  });
};
