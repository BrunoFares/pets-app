import { colors } from "@/constants/colors";
import { Stack } from "expo-router";
import { useColorScheme } from "react-native";

export default function ItemsStack() {
  const darkMode = useColorScheme() === "dark";
  const appBackground = darkMode ? colors.veryDarkGrey : colors.white;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: appBackground },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Settings" }} />
      <Stack.Screen
        name="account-settings-screen"
        options={{ title: "Account Settings" }}
      />
      <Stack.Screen
        name="change-email-screen"
        options={{ title: "Change Email" }}
      />
      <Stack.Screen
        name="change-password-screen"
        options={{ title: "Change Password" }}
      />
      <Stack.Screen
        name="location-settings-screen"
        options={{ title: "Location Settings" }}
      />
      <Stack.Screen
        name="notifications-settings-screen"
        options={{ title: "Notifications Settings" }}
      />
      <Stack.Screen
        name="blocked-users-screen"
        options={{ title: "Blocked Users" }}
      />
    </Stack>
  );
}
