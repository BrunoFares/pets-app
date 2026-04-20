import { Stack } from "expo-router";

export default function ItemsStack() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ title: "Items" }} />
      <Stack.Screen name="create" options={{ title: "Create post" }} />
      <Stack.Screen name="post/[id]" options={{ title: "Details" }} />
      <Stack.Screen name="profile/[id]" options={{ title: "Profile" }} />
      <Stack.Screen name="bookmarks" options={{ title: "Bookmarks" }} />
    </Stack>
  );
}
