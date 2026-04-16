import Constants from "expo-constants";
// import * as Device from "expo-device";
import { AuthProvider, useAuth } from "@/contexts/AuthProvider";
import { useFonts } from "expo-font";
import * as Notifications from "expo-notifications";
import { Stack, router, usePathname, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, Platform, View } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

async function registerForPushNotificationsAsync() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  // if (!Device.isDevice) {
  //   console.log("Push notifications require a real device");
  //   return null;
  // }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("Notification permission not granted");
    return null;
  }

  const projectId =
    Constants?.expoConfig?.extra?.eas?.projectId ??
    Constants?.easConfig?.projectId;

  if (!projectId) {
    console.log("Project ID not found");
    return null;
  }

  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  console.log("Expo Push Token:", token);
  return token;
}

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
      firstSegment === "login-screen" || firstSegment === "register-screen";

    if (!isAuthenticated && !isIndexRoute && !isPublicRoute) {
      appRouter.replace("/login-screen");
      return;
    }

    if (isAuthenticated && (isIndexRoute || isPublicRoute)) {
      appRouter.replace("/(tabs)");
    }
  }, [appRouter, isAuthenticated, isHydrating, pathname, segments]);

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
    registerForPushNotificationsAsync();

    const receivedSub = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log("Notification received:", notification);
      },
    );

    const responseSub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log("Notification tapped:", response);

        const url = response.notification.request.content.data?.url;
        if (typeof url === "string") {
          router.push(url as any);
        }
      },
    );

    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  }, []);

  return (
    <AuthProvider>
      <RootNavigator fontsLoaded={fontsLoaded} />
    </AuthProvider>
  );
}
