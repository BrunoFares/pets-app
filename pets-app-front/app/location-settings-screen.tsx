import { AdaptiveText } from "@/components/AdaptiveText";
import { AdaptiveView } from "@/components/AdaptiveView";
import { PageHeader } from "@/components/PageHeader";
import { colors } from "@/constants/colors";
import { MaterialIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useEffect, useState } from "react";
import {
  Alert,
  Linking,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

export default function LocationSettingsScreen() {
  const darkMode = useColorScheme() === "dark";
  const styles = createStyles({ darkMode });

  const [locationPermission, setLocationPermission] = useState<Location.LocationPermissionResponse | null>(null);

  const getLocationPermission = async () => {
    try {
      // Is location service (GPS) on? (optional but nice UX)
      const servicesOn = await Location.hasServicesEnabledAsync();
      if (!servicesOn) {
        Alert.alert(
          "Location is off",
          "Please enable Location Services (GPS) to continue."
        );
      }
      // Check existing permission FIRST
      const current = await Location.getForegroundPermissionsAsync();
      setLocationPermission(current);
      return current;
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Unexpected error.");
    }
  };

  const modifyLocationPermission = async () => {
    const current = await getLocationPermission();
    if (!current) return;
    if (current.status === "denied" && !current.canAskAgain) {
      Alert.alert(
        "Permission required",
        "Location access is blocked. Open Settings to allow it.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Open Settings", onPress: () => Linking.openSettings() },
        ]
      );
      return;
    }
    // Either undetermined, or denied but canAskAgain → ask the system prompt
    const result = await Location.requestForegroundPermissionsAsync();
    setLocationPermission(result);
    if (result.status === "granted") {
      Alert.alert("Thanks!", "Location permission granted.");
    } else {
      Alert.alert(
        "Permission denied",
        "You can enable it later from Settings if you change your mind."
      );
    }
  };

  const settingsPage = (
    title: string,
    imageTitle: "privacy-tip" | "account-circle" | "location-pin",
    fn: () => void
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
        <AdaptiveText style={{
          textAlign: "right",
          fontFamily: "Poppins-Regular",
          fontSize: 12,
        }}>
          Location permission is {locationPermission && locationPermission.status}.
        </AdaptiveText>
      </TouchableOpacity>
    );
  };

  // On mount, get current permission
  useEffect(() => {
    getLocationPermission();
  }, []);

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
          Location Settings
        </AdaptiveText>
        <AdaptiveView style={styles.container}>
          {settingsPage(
            "Modify Location Permissions",
            "location-pin",
            modifyLocationPermission
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
