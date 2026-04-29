import { SoftErrorBanner } from "@/components/SoftErrorBanner";
// import * as Device from "expo-device";
import { AuthProvider, useAuth } from "@/contexts/AuthProvider";
import { useFonts } from "expo-font";
import {
  addNotificationReceivedListener,
  addNotificationResponseReceivedListener,
  clearMedicationReminderNotifications,
  configureNotificationHandler,
  registerForPushNotificationsAsync,
  syncMedicationReminderNotifications,
} from "@/lib/notifications";
import { Stack, router, usePathname, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

function RootNavigator({ fontsLoaded }: { fontsLoaded: boolean }) {
  const appRouter = useRouter();
  const pathname = usePathname();
  const segments = useSegments();
  const { isAuthenticated, isHydrating } = useAuth();

  useEffect(() => {
    if (isHydrating) {
      return;
    }

    const firstSegment = segments[0];
    const isIndexRoute = pathname === "/" && firstSegment !== "(tabs)";
    const isPublicRoute =
      firstSegment === "login-screen" ||
      firstSegment === "register-screen" ||
      firstSegment === "verify-email-screen";

    if (!isAuthenticated && (isIndexRoute || !isPublicRoute)) {
      appRouter.replace("/login-screen");
      return;
    }

    if (isAuthenticated && (isIndexRoute || isPublicRoute)) {
      appRouter.replace("/(tabs)");
    }
  }, [appRouter, isAuthenticated, isHydrating, pathname, segments]);

  useEffect(() => {
    if (isHydrating) {
      return;
    }

    if (!isAuthenticated) {
      void clearMedicationReminderNotifications();
      return;
    }

    void (async () => {
      await registerForPushNotificationsAsync();
      await syncMedicationReminderNotifications();
    })();
  }, [isAuthenticated, isHydrating]);

  if (!fontsLoaded || isHydrating) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack initialRouteName="index">
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="login-screen" options={{ headerShown: false }} />
      <Stack.Screen name="register-screen" options={{ headerShown: false }} />
      <Stack.Screen
        name="verify-email-screen"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="charities-list-screen"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="individual-charity-screen"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="pet-translator-screen"
        options={{ headerShown: false }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    "PlayfairDisplay-Regular": require("../assets/fonts/PlayfairDisplay-Regular.ttf"),
    "PlayfairDisplay-Bold": require("../assets/fonts/PlayfairDisplay-Bold.ttf"),
    "Poppins-Bold": require("../assets/fonts/Poppins-Bold.ttf"),
    "Poppins-SemiBold": require("../assets/fonts/Poppins-SemiBold.ttf"),
    "Poppins-Medium": require("../assets/fonts/Poppins-Medium.ttf"),
    "Poppins-Regular": require("../assets/fonts/Poppins-Regular.ttf"),
    "Poppins-Light": require("../assets/fonts/Poppins-Light.ttf"),
    "Poppins-Thin": require("../assets/fonts/Poppins-Thin.ttf"),
  });

  useEffect(() => {
    configureNotificationHandler();
    void registerForPushNotificationsAsync();

    const receivedSub = addNotificationReceivedListener((notification) => {
      console.log("Notification received:", notification);
    });

    const responseSub = addNotificationResponseReceivedListener((response) => {
      console.log("Notification tapped:", response);

      const url = (response as any)?.notification?.request?.content?.data?.url;
      if (typeof url === "string") {
        router.push(url as any);
      }
    });

    return () => {
      receivedSub?.remove();
      responseSub?.remove();
    };
  }, []);

  return (
    <AuthProvider>
      <RootNavigator fontsLoaded={fontsLoaded} />
      <SoftErrorBanner />
    </AuthProvider>
  );
}
