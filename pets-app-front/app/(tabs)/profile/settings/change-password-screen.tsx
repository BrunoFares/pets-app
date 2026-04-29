import { AdaptiveText } from "@/components/AdaptiveText";
import CustomInput from "@/components/CustomInput";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { PageHeader } from "@/components/PageHeader";
import { colors } from "@/constants/colors";
import { useGlobal } from "@/contexts/GlobalProvider";
import { presentApiError } from "@/lib/api-feedback";
import { changePassword } from "@/lib/profile-api";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Alert,
  Keyboard,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ChangePasswordScreen() {
  const darkMode = useColorScheme() === "dark";
  const styles = createStyles({ darkMode });
  const router = useRouter();
  const { setShowFooter } = useGlobal();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setShowFooter?.(false);

      return () => {
        setShowFooter?.(true);
      };
    }, [setShowFooter]),
  );

  const handleSave = async () => {
    if (
      !currentPassword.trim() ||
      !newPassword.trim() ||
      !confirmNewPassword.trim()
    ) {
      Alert.alert(
        "Missing information",
        "Please enter your current password and your new password twice.",
      );
      return;
    }

    if (newPassword.trim().length < 8) {
      Alert.alert(
        "Password too short",
        "Your new password must be at least 8 characters long.",
      );
      return;
    }

    if (newPassword !== confirmNewPassword) {
      Alert.alert(
        "Passwords do not match",
        "Your new password and confirmation must match exactly.",
      );
      return;
    }

    if (currentPassword === newPassword) {
      Alert.alert(
        "Choose a new password",
        "Your new password must be different from your current password.",
      );
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await changePassword(
        currentPassword,
        newPassword,
        confirmNewPassword,
      );

      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");

      Alert.alert("Password updated", response.message, [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      presentApiError("Unable to change password", error, {
        networkMessage:
          "We couldn't reach the server, so your password was not updated.",
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
        <AdaptiveText style={styles.title}>Change password</AdaptiveText>
        <AdaptiveText style={styles.subtitle}>
          Confirm your current password, then choose a new one for your account.
        </AdaptiveText>

        <View style={styles.infoCard}>
          <AdaptiveText style={styles.infoLabel}>Password tips</AdaptiveText>
          <AdaptiveText style={styles.infoValue}>
            Use at least 8 characters and avoid reusing your current password.
          </AdaptiveText>
        </View>

        <AdaptiveText style={styles.inputText}>Current Password</AdaptiveText>
        <CustomInput
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          editable={!isSubmitting}
          style={{ width: "84%" }}
        />

        <AdaptiveText style={styles.inputText}>New Password</AdaptiveText>
        <CustomInput
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          editable={!isSubmitting}
          style={{ width: "84%" }}
        />

        <AdaptiveText style={styles.inputText}>
          Confirm New Password
        </AdaptiveText>
        <CustomInput
          value={confirmNewPassword}
          onChangeText={setConfirmNewPassword}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          editable={!isSubmitting}
          style={{ width: "84%" }}
        />

        <TouchableOpacity
          style={styles.buttonSave}
          disabled={isSubmitting}
          onPress={handleSave}
        >
          <Text style={styles.btnTextSave}>
            {isSubmitting ? "Saving..." : "Update password"}
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
      lineHeight: 24,
    },
    inputText: {
      width: "84%",
      marginBottom: Platform.select({
        ios: -3,
        android: -10,
      }),
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
  });
};
