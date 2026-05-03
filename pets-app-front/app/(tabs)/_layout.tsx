import { Footer } from "@/components/Footer";
import { colors } from "@/constants/colors";
import { GlobalProvider } from "@/contexts/GlobalProvider";
import { Tabs } from "expo-router";
import React from "react";
import { useColorScheme } from "react-native";

const TabsLayout = () => {
  const darkMode = useColorScheme() === "dark";
  const appBackground = darkMode ? colors.veryDarkGrey : colors.white;

  return (
    <GlobalProvider>
      <Tabs
        tabBar={(props: any) => <Footer {...props} />}
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: appBackground },
        }}
      >
        <Tabs.Screen name="index" options={{ title: "Home" }} />
        <Tabs.Screen name="explore" options={{ title: "Explore" }} />
        <Tabs.Screen name="forum" options={{ title: "Forum" }} />
        <Tabs.Screen name="messages" options={{ title: "DMs" }} />
        <Tabs.Screen name="profile" options={{ title: "Profile" }} />
      </Tabs>
    </GlobalProvider>
  );
};

export default TabsLayout;
