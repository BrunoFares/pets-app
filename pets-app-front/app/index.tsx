import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

export default function Entry() {
  const [initialRoute, setInitialRoute] = useState('');

  useEffect(() => {
    setInitialRoute('/login-screen');
  }, []);

  if (!initialRoute) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return <Redirect href={initialRoute} />;
}
