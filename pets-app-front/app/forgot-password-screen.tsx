import { AdaptiveText } from "@/components/AdaptiveText";
import CustomInput from "@/components/CustomInput";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { PageHeader } from "@/components/PageHeader";
import { colors } from "@/constants/colors";
import { presentApiError } from "@/lib/api-feedback";
import { ApiRequestError, apiRequest } from "@/lib/api";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
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

type ResetStep = "request" | "confirm";
type PendingAction = "request" | "reset" | "resend" | null;

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { email: emailParam } = useLocalSearchParams<{ email?: string }>();
  const darkMode = useColorScheme() === "dark";
  const styles = createStyles({ darkMode });
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState<ResetStep>("request");
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

  const isBusy = pendingAction !== null;
  const normalizedEmail = useMemo(
    () => email.trim().toLowerCase(),
    [email],
  );

  const getErrorMessage = (
    error: unknown,
    action: "request" | "reset" | "resend",
  ) => {
    if (!(error instanceof Error)) {
      return action === "reset"
        ? "We couldn't reset your password right now. Please try again."
        : "We couldn't send a password reset code right now. Please try again.";
    }

    if (!(error instanceof ApiRequestError)) {
      return (
        error.message ||
        (action === "reset"
          ? "We couldn't reset your password right now. Please try again."
          : "We couldn't send a password reset code right now. Please try again.")
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
        return "That reset code has expired. Request a new one and try again.";
      }

      if (combinedMessage.includes("6-digit") || combinedMessage.includes("code")) {
        return action === "reset"
          ? "Please check the 6-digit reset code and try again."
          : "Please enter a valid email address before requesting a code.";
      }

      if (combinedMessage.includes("match")) {
        return "Your new password and confirmation must match.";
      }

      if (combinedMessage.includes("different from the current")) {
        return "Your new password must be different from your current password.";
      }

      if (combinedMessage.includes("invalid password")) {
        return "That password doesn't meet the account requirements. Try a stronger one.";
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
      (action === "reset"
        ? "We couldn't reset your password right now. Please try again."
        : "We couldn't send a password reset code right now. Please try again.")
    );
  };

  const handleCodeChange = (value: string) => {
    setCode(value.replace(/\D/g, "").slice(0, 6));
  };

  const handleRequestCode = async () => {
    if (!normalizedEmail) {
      Alert.alert("Email required", "Please enter your account email.");
      return;
    }

    if (!isValidEmail(normalizedEmail)) {
      Alert.alert("Invalid email", "Please enter a valid email address.");
      return;
    }

    try {
      setPendingAction("request");
      const response = await apiRequest<{ message?: string }>(
        "/api/Auth/forgot-password",
        {
          method: "POST",
          body: JSON.stringify({ email: normalizedEmail }),
        },
      );

      setStep("confirm");
      setCode("");
      setNewPassword("");
      setConfirmPassword("");
      Alert.alert(
        "Reset code sent",
        response.message ??
          "If the account exists, a password reset code has been sent.",
      );
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 0) {
        presentApiError("Couldn't request reset code", error, {
          networkMessage:
            "We couldn't reach the server, so a password reset code was not requested.",
        });
        return;
      }

      Alert.alert(
        "Couldn't request reset code",
        getErrorMessage(error, "request"),
      );
    } finally {
      setPendingAction(null);
    }
  };

  const handleResetPassword = async () => {
    if (!normalizedEmail || code.length !== 6 || !newPassword || !confirmPassword) {
      Alert.alert(
        "Missing information",
        "Please enter your email, the 6-digit code, and your new password twice.",
      );
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert(
        "Password too short",
        "Your new password must be at least 8 characters long.",
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert(
        "Passwords do not match",
        "Your new password and confirmation must match exactly.",
      );
      return;
    }

    try {
      setPendingAction("reset");
      const response = await apiRequest<{ message?: string }>(
        "/api/Auth/reset-password",
        {
          method: "POST",
          body: JSON.stringify({
            email: normalizedEmail,
            code,
            newPassword,
            confirmNewPassword: confirmPassword,
          }),
        },
      );

      Alert.alert(
        "Password reset",
        response.message ?? "Your password has been reset successfully.",
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
        presentApiError("Couldn't reset password", error, {
          networkMessage:
            "We couldn't reach the server, so your password has not been reset yet.",
        });
        return;
      }

      Alert.alert(
        "Couldn't reset password",
        getErrorMessage(error, "reset"),
      );
    } finally {
      setPendingAction(null);
    }
  };

  const handleResendCode = async () => {
    if (!normalizedEmail) {
      Alert.alert("Email required", "Please enter your account email.");
      return;
    }

    if (!isValidEmail(normalizedEmail)) {
      Alert.alert("Invalid email", "Please enter a valid email address.");
      return;
    }

    try {
      setPendingAction("resend");
      const response = await apiRequest<{ message?: string }>(
        "/api/Auth/forgot-password",
        {
          method: "POST",
          body: JSON.stringify({ email: normalizedEmail }),
        },
      );

      Alert.alert(
        "Reset code sent",
        response.message ??
          "If the account exists, a password reset code has been sent.",
      );
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 0) {
        presentApiError("Couldn't resend reset code", error, {
          networkMessage:
            "We couldn't reach the server, so a new reset code was not requested.",
        });
        return;
      }

      Alert.alert(
        "Couldn't resend reset code",
        getErrorMessage(error, "resend"),
      );
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <PageHeader title="Reset password" />

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
              <AdaptiveText style={styles.heroBadge}>Account recovery</AdaptiveText>
              <AdaptiveText style={styles.heroTitle}>
                {step === "request" ? "Send a reset code" : "Create a new password"}
              </AdaptiveText>
              <AdaptiveText style={styles.heroSubtitle}>
                {step === "request"
                  ? "Enter your account email and we’ll send a 6-digit reset code if that account exists."
                  : "Enter the reset code from your email, then choose a new password for your account."}
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

              {step === "confirm" ? (
                <>
                  <AdaptiveText style={styles.sectionLabel}>
                    Reset code
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
                    returnKeyType="next"
                  />

                  <AdaptiveText style={styles.sectionLabel}>
                    New password
                  </AdaptiveText>

                  <CustomInput
                    label="New password"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    style={styles.input}
                    styleLabel={styles.inputLabel}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isBusy}
                    returnKeyType="next"
                  />

                  <AdaptiveText style={styles.sectionLabel}>
                    Confirm password
                  </AdaptiveText>

                  <CustomInput
                    label="Confirm new password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    style={styles.input}
                    styleLabel={styles.inputLabel}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isBusy}
                    returnKeyType="done"
                    onSubmitEditing={handleResetPassword}
                  />

                  <View style={styles.tipCard}>
                    <AdaptiveText style={styles.tipTitle}>
                      Didn&apos;t get the code?
                    </AdaptiveText>
                    <AdaptiveText style={styles.tipText}>
                      Check spam first, then resend if you still don&apos;t see
                      it. In local development, the backend may log the code
                      instead of emailing it.
                    </AdaptiveText>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.primaryButton,
                      isBusy && styles.buttonDisabled,
                    ]}
                    onPress={handleResetPassword}
                    disabled={isBusy}
                  >
                    <Text style={styles.primaryButtonText}>
                      {pendingAction === "reset"
                        ? "Resetting..."
                        : "Reset password"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.secondaryButton,
                      isBusy && styles.buttonDisabled,
                    ]}
                    onPress={handleResendCode}
                    disabled={isBusy}
                  >
                    <Text style={styles.secondaryButtonText}>
                      {pendingAction === "resend"
                        ? "Sending..."
                        : "Resend code"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.inlineAction}
                    onPress={() => setStep("request")}
                    disabled={isBusy}
                  >
                    <AdaptiveText style={styles.inlineActionText}>
                      Use a different email instead
                    </AdaptiveText>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    isBusy && styles.buttonDisabled,
                  ]}
                  onPress={handleRequestCode}
                  disabled={isBusy}
                >
                  <Text style={styles.primaryButtonText}>
                    {pendingAction === "request"
                      ? "Sending..."
                      : "Send reset code"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.footerRow}>
              <AdaptiveText style={styles.footerText}>
                Remembered your password?
              </AdaptiveText>

              <TouchableOpacity
                onPress={() =>
                  router.replace({
                    pathname: "/login-screen",
                    params: { email: normalizedEmail || undefined },
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
}

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
      letterSpacing: 6,
      fontSize: 20,
    },
    tipCard: {
      borderRadius: 20,
      padding: 16,
      marginTop: 4,
      marginBottom: 16,
      backgroundColor: darkMode ? colors.darkGrey : colors.lightGrey,
    },
    tipTitle: {
      fontFamily: "Poppins-SemiBold",
      fontSize: 15,
      marginBottom: 6,
    },
    tipText: {
      fontFamily: "Poppins-Regular",
      fontSize: 14,
      lineHeight: 22,
      color: darkMode ? colors.lightGrey : colors.mildDarkGrey,
    },
    primaryButton: {
      width: "100%",
      borderRadius: 20,
      paddingVertical: 18,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.green,
    },
    primaryButtonText: {
      color: colors.white,
      fontFamily: "Poppins-Bold",
      fontSize: 17,
    },
    secondaryButton: {
      width: "100%",
      borderRadius: 20,
      paddingVertical: 18,
      marginTop: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: darkMode ? colors.darkGrey : colors.lightGrey,
    },
    secondaryButtonText: {
      color: darkMode ? colors.white : colors.black,
      fontFamily: "Poppins-Bold",
      fontSize: 16,
    },
    inlineAction: {
      alignSelf: "center",
      marginTop: 14,
    },
    inlineActionText: {
      fontFamily: "Poppins-Regular",
      fontSize: 14,
      color: darkMode ? colors.lightGrey : colors.mildDarkGrey,
      textDecorationLine: "underline",
    },
    buttonDisabled: {
      opacity: 0.7,
    },
    footerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: 18,
      marginBottom: 8,
      flexWrap: "wrap",
      justifyContent: "center",
    },
    footerText: {
      fontFamily: "Poppins-Regular",
      color: darkMode ? colors.lightGrey : colors.mildDarkGrey,
    },
    footerLink: {
      fontFamily: "Poppins-SemiBold",
      color: colors.green,
    },
  });
