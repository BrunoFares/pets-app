import { AdaptiveText } from "@/components/AdaptiveText";
import CustomInput from "@/components/CustomInput";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { colors } from "@/constants/colors";
import { useAuth } from "@/contexts/AuthProvider";
import { presentApiError } from "@/lib/api-feedback";
import { apiRequest, ApiRequestError } from "@/lib/api";
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
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const darkMode = useColorScheme() === "dark";
  const styles = createStyles({ darkMode });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getLoginErrorMessage = (error: unknown) => {
    if (!(error instanceof Error)) {
      return "Unable to log in right now. Please try again.";
    }

    if (!(error instanceof ApiRequestError)) {
      return error.message || "Unable to log in right now. Please try again.";
    }

    if (error.status === 0) {
      return "We couldn't reach the server. Please check your connection and try again.";
    }

    const combinedMessage = [
      error.message,
      error.payload?.message,
      error.payload?.detail,
      error.payload?.title,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    if (error.status === 400 || error.status === 401) {
      if (combinedMessage.includes("verify") && combinedMessage.includes("email")) {
        return "Please verify your email before logging in. Check your inbox for the verification link.";
      }

      if (
        combinedMessage.includes("invalid") ||
        combinedMessage.includes("incorrect") ||
        combinedMessage.includes("unauthorized") ||
        combinedMessage.includes("password") ||
        combinedMessage.includes("email") ||
        combinedMessage.includes("credential")
      ) {
        return "Incorrect email or password. Please try again.";
      }

      return "We couldn't log you in with those details. Please check your email and password and try again.";
    }

    if (error.status === 403) {
      return "Your account doesn't have access right now. Please contact support if this keeps happening.";
    }

    if (error.status === 404) {
      return "We couldn't find an account with that email.";
    }

    if (error.status === 429) {
      return "Too many login attempts. Please wait a moment and try again.";
    }

    if (error.status >= 500) {
      return "The server is having trouble right now. Please try again in a moment.";
    }

    return "Unable to log in right now. Please try again.";
  };

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

      await signIn(response);
      router.replace("/(tabs)");
    } catch (error) {
      console.error("[login] Login request failed", error);
      if (error instanceof ApiRequestError && error.status === 0) {
        presentApiError("Login failed", error, {
          networkMessage:
            "We couldn't reach the server, so login was not completed.",
        });
        return;
      }

      Alert.alert("Login failed", getLoginErrorMessage(error));
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

        <View style={{ flexDirection: "row", marginTop: 20 }}>
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
        </View>

        {isSubmitting && <LoadingOverlay />}
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
