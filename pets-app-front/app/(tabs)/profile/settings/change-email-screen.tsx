import { AdaptiveText } from "@/components/AdaptiveText";
import CustomInput from "@/components/CustomInput";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { PageHeader } from "@/components/PageHeader";
import { colors } from "@/constants/colors";
import { useAuth } from "@/contexts/AuthProvider";
import { useGlobal } from "@/contexts/GlobalProvider";
import { presentApiError } from "@/lib/api-feedback";
import {
  confirmEmailChange,
  requestEmailChange,
} from "@/lib/profile-api";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type EmailChangeStep = "request" | "confirm";

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export default function ChangeEmailScreen() {
  const darkMode = useColorScheme() === "dark";
  const styles = createStyles({ darkMode });
  const router = useRouter();
  const { setShowFooter } = useGlobal();
  const { user, session, signIn, refreshProfile } = useAuth();
  const [step, setStep] = useState<EmailChangeStep>("request");
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setNewEmail(user?.Email ?? "");
  }, [user?.Email]);

  useFocusEffect(
    useCallback(() => {
      setShowFooter?.(false);

      return () => {
        setShowFooter?.(true);
      };
    }, [setShowFooter]),
  );

  const screenCopy = useMemo(() => {
    if (step === "confirm") {
      return {
        title: "Confirm your new email",
        subtitle:
          "Enter the 6-digit verification code sent to your new email address.",
        buttonLabel: "Confirm email change",
      };
    }

    return {
      title: "Change email",
      subtitle:
        "Use your current password to request an email change, then confirm it with the verification code we send.",
      buttonLabel: "Send verification code",
    };
  }, [step]);

  const handleRequestCode = async () => {
    const normalizedEmail = newEmail.trim().toLowerCase();

    if (!normalizedEmail) {
      Alert.alert("Missing information", "Please enter your new email.");
      return;
    }

    if (!isValidEmail(normalizedEmail)) {
      Alert.alert("Invalid email", "Please enter a valid email address.");
      return;
    }

    if (!currentPassword.trim()) {
      Alert.alert(
        "Missing information",
        "Please enter your current password.",
      );
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await requestEmailChange(
        normalizedEmail,
        currentPassword,
      );
      setNewEmail(normalizedEmail);
      setStep("confirm");
      setVerificationCode("");
      Alert.alert("Verification code sent", response.message);
    } catch (error) {
      presentApiError("Unable to request email change", error, {
        networkMessage:
          "We couldn't reach the server, so the verification code was not sent.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmCode = async () => {
    const normalizedCode = verificationCode.trim();

    if (!normalizedCode) {
      Alert.alert(
        "Missing information",
        "Please enter the verification code.",
      );
      return;
    }

    if (!/^\d{6}$/.test(normalizedCode)) {
      Alert.alert(
        "Invalid code",
        "The verification code must be 6 digits.",
      );
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await confirmEmailChange(normalizedCode);

      if (session?.userId) {
        await signIn({
          accessToken: response.accessToken,
          userId: session.userId,
        });
      } else {
        await refreshProfile();
      }

      Alert.alert("Email updated", response.message, [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      presentApiError("Unable to confirm email change", error, {
        networkMessage:
          "We couldn't reach the server, so your email was not updated.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <PageHeader title="" />
      <ScrollView
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={Keyboard.dismiss}
        contentContainerStyle={styles.content}
      >
        <AdaptiveText style={styles.title}>{screenCopy.title}</AdaptiveText>
        <AdaptiveText style={styles.subtitle}>
          {screenCopy.subtitle}
        </AdaptiveText>

        <View style={styles.infoCard}>
          <AdaptiveText style={styles.infoLabel}>Current email</AdaptiveText>
          <AdaptiveText style={styles.infoValue}>
            {user?.Email ?? "Not available"}
          </AdaptiveText>
        </View>

        <AdaptiveText style={styles.inputText}>New Email</AdaptiveText>
        <CustomInput
          value={newEmail}
          onChangeText={setNewEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          editable={!isSubmitting}
          style={{ width: "84%" }}
        />

        {step === "request" ? (
          <>
            <AdaptiveText style={styles.inputText}>
              Current Password
            </AdaptiveText>
            <CustomInput
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isSubmitting}
              style={{ width: "84%" }}
            />
          </>
        ) : (
          <>
            <AdaptiveText style={styles.inputText}>
              Verification Code
            </AdaptiveText>
            <CustomInput
              value={verificationCode}
              onChangeText={(value) =>
                setVerificationCode(value.replace(/\D/g, "").slice(0, 6))
              }
              keyboardType="number-pad"
              editable={!isSubmitting}
              maxLength={6}
              style={{ width: "84%" }}
            />

            <TouchableOpacity
              style={styles.secondaryButton}
              disabled={isSubmitting}
              onPress={handleRequestCode}
            >
              <Text style={styles.secondaryButtonText}>
                Resend verification code
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              disabled={isSubmitting}
              onPress={() => setStep("request")}
            >
              <AdaptiveText style={styles.backLink}>
                Change the email address instead
              </AdaptiveText>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity
          style={styles.buttonSave}
          disabled={isSubmitting}
          onPress={step === "request" ? handleRequestCode : handleConfirmCode}
        >
          <Text style={styles.btnTextSave}>
            {isSubmitting ? "Submitting..." : screenCopy.buttonLabel}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {isSubmitting && <LoadingOverlay />}
    </SafeAreaView>
  );
}

const createStyles = ({ darkMode }: any) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: darkMode ? colors.veryDarkGrey : colors.white,
    },
    content: {
      alignItems: "center",
      gap: 10,
      paddingBottom: "10%",
    },
    title: {
      fontSize: 24,
      fontFamily: "Poppins-SemiBold",
      textAlign: "center",
    },
    subtitle: {
      width: "84%",
      fontFamily: "Poppins-Regular",
      fontSize: 14,
      lineHeight: 22,
      textAlign: "center",
      color: darkMode ? colors.lightGrey : colors.darkGrey,
      marginBottom: 10,
    },
    infoCard: {
      width: "84%",
      borderRadius: 18,
      paddingHorizontal: 16,
      paddingVertical: 14,
      backgroundColor: darkMode ? colors.darkGrey : colors.lightGrey,
      marginTop: 6,
      marginBottom: 8,
      gap: 4,
    },
    infoLabel: {
      fontFamily: "Poppins-Medium",
      fontSize: 12,
      color: darkMode ? colors.lightGrey : colors.darkGrey,
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
    infoValue: {
      fontFamily: "Poppins-Regular",
      fontSize: 16,
    },
    inputText: {
      width: "84%",
      marginBottom: -7,
    },
    buttonSave: {
      backgroundColor: colors.green,
      paddingVertical: 20,
      paddingHorizontal: 40,
      borderRadius: 20,
      marginTop: 20,
      width: "84%",
    },
    btnTextSave: {
      color: colors.white,
      fontFamily: "Poppins-Bold",
      fontSize: 18,
      textAlign: "center",
    },
    secondaryButton: {
      backgroundColor: darkMode ? colors.darkGrey : colors.lightGrey,
      paddingVertical: 16,
      paddingHorizontal: 20,
      borderRadius: 18,
      width: "84%",
      marginTop: 6,
    },
    secondaryButtonText: {
      color: darkMode ? colors.white : colors.black,
      fontFamily: "Poppins-SemiBold",
      fontSize: 15,
      textAlign: "center",
    },
    backLink: {
      fontFamily: "Poppins-Regular",
      fontSize: 14,
      color: darkMode ? colors.lightGrey : colors.darkGrey,
      textDecorationLine: "underline",
      marginTop: 6,
    },
  });
};
