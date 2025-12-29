import { Stack } from "expo-router";

export default function ItemsStack() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ title: "Profile" }} />
      <Stack.Screen name="[pet]" options={{ title: "Pet" }} />
      <Stack.Screen name="account-settings-screen" options={{ title: "Account Settings" }} />
      <Stack.Screen name="location-settings-screen" options={{ title: "Location Settings" }} />
    </Stack>
  );
}