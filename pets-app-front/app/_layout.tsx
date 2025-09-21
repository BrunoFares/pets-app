import { useFonts } from 'expo-font';
import { Stack } from "expo-router";
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function RootLayout() {
  const [initialRoute, setInitialRoute] = useState('login-screen');
  const [fontsLoaded] = useFonts({
    'PlayfairDisplay-Regular': require('../assets/fonts/PlayfairDisplay-Regular.ttf'),
    'PlayfairDisplay-Bold': require('../assets/fonts/PlayfairDisplay-Bold.ttf'),
    'Poppins-Bold': require('../assets/fonts/Poppins-Bold.ttf'),
    'Poppins-SemiBold': require('../assets/fonts/Poppins-SemiBold.ttf'),
    'Poppins-Medium': require('../assets/fonts/Poppins-Medium.ttf'),
    'Poppins-Regular': require('../assets/fonts/Poppins-Regular.ttf'),
    'Poppins-Light': require('../assets/fonts/Poppins-Light.ttf'),
    'Poppins-Thin': require('../assets/fonts/Poppins-Thin.ttf'),
  });

  useEffect(() => {
    setInitialRoute('login-screen');
  })

  if (!initialRoute) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!fontsLoaded) {
    return null;
  }

  return (
    <Stack initialRouteName={initialRoute}>
      <Stack.Screen name="(tabs)" options={{headerShown: false}}/>
      <Stack.Screen name="login-screen" options={{ headerShown: false }} />
      <Stack.Screen name="register-screen" options={{ headerShown: false }} />
      <Stack.Screen name="settings-screen" options={{ headerShown: false }} />
      <Stack.Screen name="account-settings-screen" options={{ headerShown: false }} />
      <Stack.Screen name="location-settings-screen" options={{ headerShown: false }} />
      <Stack.Screen name="charities-list-screen" options={{ headerShown: false }} />
    </Stack>
  );
}