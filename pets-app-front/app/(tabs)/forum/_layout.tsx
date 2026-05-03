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
      <Stack.Screen name="index" options={{ title: "Items" }} />
      <Stack.Screen name="create" options={{ title: "Create post" }} />
      <Stack.Screen name="post/[id]" options={{ title: "Details" }} />
      <Stack.Screen name="profile/[id]" options={{ title: "Profile" }} />
      <Stack.Screen name="bookmarks" options={{ title: "Bookmarks" }} />
    </Stack>
  );
}
