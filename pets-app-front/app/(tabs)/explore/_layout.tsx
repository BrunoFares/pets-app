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
      <Stack.Screen name="index" options={{ title: "Shops" }} />
      <Stack.Screen name="[key]" options={{ title: "Details" }} />
    </Stack>
  );
}
