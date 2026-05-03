import { colors } from "@/constants/colors";
import { Stack } from "expo-router";
import { useColorScheme } from "react-native";

export default function MessagesStack() {
  const darkMode = useColorScheme() === "dark";
  const appBackground = darkMode ? colors.veryDarkGrey : colors.white;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: appBackground },
      }}
    >
      <Stack.Screen name="index" options={{ title: "DMs" }} />
      <Stack.Screen name="[id]" options={{ title: "Conversation" }} />
    </Stack>
  );
}
