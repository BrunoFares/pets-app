import { AdaptiveText } from "@/components/AdaptiveText";
import { AdaptiveView } from "@/components/AdaptiveView";
import CustomInput from "@/components/CustomInput";
import { colors } from "@/constants/colors";
import { apiRequest, saveAuthSession } from "@/lib/api";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  Keyboard,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LoginScreen() {
  const router = useRouter();
  const darkMode = useColorScheme() === "dark";
  const styles = createStyles({ darkMode });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert(
        "Missing information",
        "Please enter your email and password.",
      );
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await apiRequest<{
        accessToken: string;
        userId: number;
      }>("/api/Auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      await saveAuthSession(response);
      router.replace("/(tabs)");
    } catch (error) {
      console.error("[login] Login request failed", error);
      Alert.alert(
        "Login failed",
        error instanceof Error ? error.message : "Unable to log in.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <TouchableWithoutFeedback
      style={styles.container}
      onPress={Keyboard.dismiss}
    >
      <SafeAreaView style={styles.container}>
        <Image
          source={require("@/assets/images/petsapp-logo-light-text.png")}
          style={styles.img}
        />

        <CustomInput
          label="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <CustomInput
          label="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity style={{ alignSelf: "flex-end" }}>
          <AdaptiveText
            style={{
              marginRight: 30,
              fontFamily: "Poppins-Regular",
            }}
          >
            Forgot your password?
          </AdaptiveText>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.btn}
          onPress={handleLogin}
          disabled={isSubmitting}
        >
          <Text style={styles.txtBtn}>
            {isSubmitting ? "Logging In..." : "Login"}
          </Text>
        </TouchableOpacity>

        <AdaptiveView style={{ flexDirection: "row", marginTop: 20 }}>
          <AdaptiveText style={{ fontFamily: "Poppins-Regular" }}>
            Don&apos;t have an account?{" "}
          </AdaptiveText>

          <TouchableOpacity onPress={() => router.push("/register-screen")}>
            <AdaptiveText
              style={{ fontFamily: "Poppins-Bold", color: colors.green }}
            >
              Sign Up!
            </AdaptiveText>
          </TouchableOpacity>
        </AdaptiveView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const createStyles = ({ darkMode }: any) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: darkMode ? colors.veryDarkGrey : colors.white,
      alignItems: "center",
      width: "100%",
      justifyContent: "center",
    },
    img: {
      height: 230,
      width: 230,
      marginBottom: 80,
    },
    btn: {
      backgroundColor: colors.green,
      borderRadius: 20,
      paddingVertical: 6,
      paddingHorizontal: 30,
      marginTop: 100,
    },
    txtBtn: {
      fontSize: 20,
      fontFamily: "Poppins-SemiBold",
      color: colors.white,
      paddingVertical: 12,
      paddingHorizontal: 16,
    },
  });
};
