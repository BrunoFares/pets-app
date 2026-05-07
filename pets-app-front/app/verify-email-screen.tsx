import { AdaptiveText } from "@/components/AdaptiveText";
import CustomInput from "@/components/CustomInput";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { PageHeader } from "@/components/PageHeader";
import { colors } from "@/constants/colors";
import { presentApiError } from "@/lib/api-feedback";
import { ApiRequestError, apiRequest } from "@/lib/api";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type PendingAction = "verify" | "resend" | null;

const VerifyEmailScreen = () => {
  const router = useRouter();
  const { email: emailParam } = useLocalSearchParams<{ email?: string }>();
  const darkMode = useColorScheme() === "dark";
  const styles = createStyles({ darkMode });
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  useEffect(() => {
    if (typeof emailParam !== "string") {
      return;
    }

    const trimmedEmail = emailParam.trim();
    if (trimmedEmail) {
      setEmail(trimmedEmail);
    }
  }, [emailParam]);

  const getVerificationErrorMessage = (error: unknown, action: "verify" | "resend") => {
    if (!(error instanceof Error)) {
      return action === "verify"
        ? "We couldn't verify your email right now. Please try again."
        : "We couldn't send a new code right now. Please try again.";
    }

    if (!(error instanceof ApiRequestError)) {
      return (
        error.message ||
        (action === "verify"
          ? "We couldn't verify your email right now. Please try again."
          : "We couldn't send a new code right now. Please try again.")
      );
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

    if (error.status === 400) {
      if (combinedMessage.includes("expired")) {
        return "That code has expired. Request a new one and try again.";
      }

      if (combinedMessage.includes("invalid")) {
        return action === "verify"
          ? "That code doesn't look right. Please check the 6-digit code and try again."
          : "Please check the email address and try again.";
      }

      if (combinedMessage.includes("already verified")) {
        return "That email is already verified. You can log in now.";
      }

      if (combinedMessage.includes("required")) {
        return action === "verify"
          ? "Please enter your email and the 6-digit verification code."
          : "Please enter your email address first.";
      }
    }

    if (error.status === 429) {
      return "Too many attempts. Please wait a moment and try again.";
    }

    if (error.status >= 500) {
      return "The server is having trouble right now. Please try again in a moment.";
    }

    return (
      error.message ||
      (action === "verify"
        ? "We couldn't verify your email right now. Please try again."
        : "We couldn't send a new code right now. Please try again.")
    );
  };

  const handleCodeChange = (value: string) => {
    setCode(value.replace(/\D/g, "").slice(0, 6));
  };

  const handleVerify = async () => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || code.length !== 6) {
      Alert.alert(
        "Missing information",
        "Please enter your email and the 6-digit code from your inbox.",
      );
      return;
    }

    try {
      setPendingAction("verify");
      const response = await apiRequest<{ message?: string }>("/api/Auth/verify-email", {
        method: "POST",
        body: JSON.stringify({
          email: normalizedEmail,
          code,
        }),
      });

      Alert.alert(
        "Email verified",
        response.message ?? "Your email has been verified. You can now log in.",
        [
          {
            text: "Go to login",
            onPress: () =>
              router.replace({
                pathname: "/login-screen",
                params: { email: normalizedEmail },
              }),
          },
        ],
      );
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 0) {
        presentApiError("Verification failed", error, {
          networkMessage:
            "We couldn't reach the server, so your email has not been verified yet.",
        });
        return;
      }

      Alert.alert(
        "Verification failed",
        getVerificationErrorMessage(error, "verify"),
      );
    } finally {
      setPendingAction(null);
    }
  };

  const handleResendCode = async () => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      Alert.alert(
        "Email required",
        "Please enter the email address you used when creating your account.",
      );
      return;
    }

    try {
      setPendingAction("resend");
      const response = await apiRequest<{ message?: string }>(
        "/api/Auth/resend-verification",
        {
          method: "POST",
          body: JSON.stringify({
            email: normalizedEmail,
          }),
        },
      );

      Alert.alert(
        "Code sent",
        response.message ??
          "If that account exists and is not verified, a new verification code has been sent.",
      );
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 0) {
        presentApiError("Couldn't resend code", error, {
          networkMessage:
            "We couldn't reach the server, so a new verification code was not requested.",
        });
        return;
      }

      Alert.alert(
        "Couldn't resend code",
        getVerificationErrorMessage(error, "resend"),
      );
    } finally {
      setPendingAction(null);
    }
  };

  const isBusy = pendingAction !== null;

  return (
    <SafeAreaView style={styles.container}>
      <PageHeader title="Verify email" />

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <View style={styles.content}>
            <Image
              source={require("@/assets/images/petsapp-logo-light-text.png")}
              style={styles.logo}
            />

            <View style={styles.heroCard}>
              <AdaptiveText style={styles.heroBadge}>One more step</AdaptiveText>
              <AdaptiveText style={styles.heroTitle}>
                Enter your verification code
              </AdaptiveText>
              <AdaptiveText style={styles.heroSubtitle}>
                We sent a 6-digit code to your email during registration. Enter
                it below to activate your account.
              </AdaptiveText>
            </View>

            <View style={styles.formCard}>
              <AdaptiveText style={styles.sectionLabel}>Account email</AdaptiveText>

              <CustomInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                style={styles.input}
                styleLabel={styles.inputLabel}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                keyboardType="email-address"
                textContentType="emailAddress"
                editable={!isBusy}
                returnKeyType="next"
              />

              <AdaptiveText style={styles.sectionLabel}>
                Verification code
              </AdaptiveText>

              <CustomInput
                label="6-digit code"
                value={code}
                onChangeText={handleCodeChange}
                style={styles.input}
                inputStyle={styles.codeInput}
                styleLabel={styles.inputLabel}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="one-time-code"
                keyboardType="number-pad"
                maxLength={6}
                textContentType="oneTimeCode"
                editable={!isBusy}
                returnKeyType="done"
                onSubmitEditing={handleVerify}
              />

              <View style={styles.tipCard}>
                <AdaptiveText style={styles.tipTitle}>
                  Code expired or missing?
                </AdaptiveText>
                <AdaptiveText style={styles.tipText}>
                  Request another verification code and use the newest one in
                  your inbox. In local development, the backend may log the code
                  instead of emailing it.
                </AdaptiveText>
              </View>

              <TouchableOpacity
                style={[styles.primaryButton, isBusy && styles.buttonDisabled]}
                onPress={handleVerify}
                disabled={isBusy}
              >
                <Text style={styles.primaryButtonText}>
                  {pendingAction === "verify" ? "Verifying..." : "Verify email"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.secondaryButton, isBusy && styles.buttonDisabled]}
                onPress={handleResendCode}
                disabled={isBusy}
              >
                <Text style={styles.secondaryButtonText}>
                  {pendingAction === "resend"
                    ? "Sending..."
                    : "Request new verification code"}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.footerRow}>
              <AdaptiveText style={styles.footerText}>
                Already verified?
              </AdaptiveText>

              <TouchableOpacity
                onPress={() =>
                  router.replace({
                    pathname: "/login-screen",
                    params: { email: email.trim().toLowerCase() || undefined },
                  })
                }
              >
                <AdaptiveText style={styles.footerLink}>Go to login</AdaptiveText>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>

      {isBusy && <LoadingOverlay />}
    </SafeAreaView>
  );
};

export default VerifyEmailScreen;

const createStyles = ({ darkMode }: { darkMode: boolean }) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: darkMode ? colors.veryDarkGrey : colors.white,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingBottom: 28,
      alignItems: "center",
    },
    content: {
      width: "100%",
      maxWidth: 560,
      alignItems: "center",
    },
    logo: {
      width: 150,
      height: 150,
      marginTop: 6,
      marginBottom: 10,
      resizeMode: "contain",
    },
    heroCard: {
      width: "100%",
      borderRadius: 28,
      padding: 22,
      marginBottom: 16,
      backgroundColor: darkMode
        ? colors.averageDarkGrey
        : colors.lightTurquoise,
    },
    heroBadge: {
      alignSelf: "flex-start",
      overflow: "hidden",
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 6,
      marginBottom: 12,
      backgroundColor: darkMode ? colors.darkTurquoise : colors.white,
      color: darkMode ? colors.lightTurquoise : colors.darkTurquoise,
      fontFamily: "Poppins-SemiBold",
      fontSize: 12,
    },
    heroTitle: {
      fontFamily: "Poppins-SemiBold",
      fontSize: 28,
      lineHeight: 34,
      marginBottom: 8,
    },
    heroSubtitle: {
      fontFamily: "Poppins-Regular",
      fontSize: 15,
      lineHeight: 24,
      color: darkMode ? colors.lightGrey : colors.mildDarkGrey,
    },
    formCard: {
      width: "100%",
      borderRadius: 28,
      padding: 20,
      backgroundColor: darkMode ? colors.averageDarkGrey : colors.white,
    },
    sectionLabel: {
      fontFamily: "Poppins-SemiBold",
      fontSize: 13,
      letterSpacing: 0.4,
      marginTop: 4,
      marginBottom: 10,
      color: darkMode ? colors.lightTurquoise : colors.darkTurquoise,
      textTransform: "uppercase",
    },
    input: {
      width: "100%",
      marginBottom: 12,
      backgroundColor: darkMode ? colors.averageDarkGrey : colors.white,
    },
    inputLabel: {
      backgroundColor: darkMode ? colors.averageDarkGrey : colors.white,
    },
    codeInput: {
      textAlign: "center",
      fontSize: 26,
      letterSpacing: 10,
      fontFamily: "Poppins-SemiBold",
      paddingVertical: 16,
    },
    tipCard: {
      width: "100%",
      borderRadius: 20,
      padding: 14,
      marginTop: 2,
      marginBottom: 18,
      backgroundColor: darkMode ? colors.veryDarkGrey : colors.lightLightOrange,
    },
    tipTitle: {
      fontFamily: "Poppins-SemiBold",
      fontSize: 14,
      marginBottom: 4,
    },
    tipText: {
      fontFamily: "Poppins-Regular",
      fontSize: 13,
      lineHeight: 20,
      color: darkMode ? colors.lightGrey : colors.mildDarkGrey,
    },
    primaryButton: {
      width: "100%",
      alignItems: "center",
      backgroundColor: colors.green,
      borderRadius: 20,
      paddingVertical: 16,
      marginTop: 2,
    },
    primaryButtonText: {
      color: colors.white,
      fontSize: 18,
      fontFamily: "Poppins-SemiBold",
    },
    secondaryButton: {
      width: "100%",
      alignItems: "center",
      borderRadius: 20,
      paddingVertical: 15,
      marginTop: 12,
      backgroundColor: darkMode ? colors.veryDarkGrey : colors.lightGrey,
    },
    secondaryButtonText: {
      color: darkMode ? colors.white : colors.black,
      fontSize: 16,
      fontFamily: "Poppins-SemiBold",
    },
    buttonDisabled: {
      opacity: 0.7,
    },
    footerRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 18,
      marginBottom: 10,
    },
    footerText: {
      fontFamily: "Poppins-Regular",
      color: darkMode ? colors.lightGrey : colors.mildDarkGrey,
      marginRight: 6,
    },
    footerLink: {
      fontFamily: "Poppins-Bold",
      color: colors.green,
    },
  });
