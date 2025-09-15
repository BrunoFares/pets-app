import { Stack } from "expo-router";

export default function ItemsStack() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ title: "Shops" }} />
      <Stack.Screen name="[key]" options={{ title: "Details" }} />
    </Stack>
  );
}