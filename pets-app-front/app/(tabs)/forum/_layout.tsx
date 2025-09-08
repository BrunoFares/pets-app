import { Stack } from "expo-router";

export default function ItemsStack() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ title: "Items" }} />
      <Stack.Screen name="[id]" options={{ title: "Details" }} />
    </Stack>
  );
}