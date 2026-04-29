import { Stack } from "expo-router";

export default function ItemsStack() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
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
    </Stack>
  );
}
