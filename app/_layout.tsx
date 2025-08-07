import { useFonts } from 'expo-font';
import { Stack } from "expo-router";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'PlayfairDisplay-Regular': require('../assets/fonts/PlayfairDisplay-Regular.ttf'),
    'PlayfairDisplay-Bold': require('../assets/fonts/PlayfairDisplay-Bold.ttf'),
  });

  if (!fontsLoaded) {
    return null;
  }

  return <Stack 
    screenOptions={{
      headerShown: false, // disables header globally
    }}
  />;
}
