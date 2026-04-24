import { AdaptiveText } from "@/components/AdaptiveText";
import CustomInput from "@/components/CustomInput";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { PageHeader } from "@/components/PageHeader";
import { colors } from "@/constants/colors";
import { apiRequest, ApiRequestError } from "@/lib/api";
import { presentApiError } from "@/lib/api-feedback";
import { useRouter } from "expo-router";
import { useState } from "react";
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
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const RegisterScreen = () => {
  const router = useRouter();
  const darkMode = useColorScheme() === "dark";
  const { width } = useWindowDimensions();
  const isWideLayout = width >= 430;
  const styles = createStyles({ darkMode, isWideLayout });
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getRegisterErrorMessage = (error: unknown) => {
    if (!(error instanceof Error)) {
      return "Unable to create your account right now. Please try again.";
    }

    if (!(error instanceof ApiRequestError)) {
      return (
        error.message ||
        "Unable to create your account right now. Please try again."
      );
    }

    if (error.status === 400) {
      const combinedMessage = [
        error.message,
        error.payload?.message,
        error.payload?.detail,
        error.payload?.title,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (combinedMessage.includes("password")) {
        return "Your password must be 8 to 64 characters and include uppercase, lowercase, a number, and a symbol.";
      }

      return error.message || "Please review your details and try again.";
    }

    if (error.status === 409) {
      const combinedMessage = [error.message, error.payload?.message]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (combinedMessage.includes("username")) {
        return "That username is already taken. Please choose another one.";
      }

      if (combinedMessage.includes("email")) {
        return "That email is already in use. Try logging in or use a different email.";
      }

      return "An account with those details already exists.";
    }

    if (error.status === 429) {
      return "Too many registration attempts. Please wait a moment and try again.";
    }

    if (error.status >= 500) {
      return "The server is having trouble right now. Please try again in a moment.";
    }

    return (
      error.message ||
      "Unable to create your account right now. Please try again."
    );
  };

  const handleRegister = async () => {
    const normalizedEmail = email.trim().toLowerCase();

    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !username.trim() ||
      !normalizedEmail ||
      !password
    ) {
      Alert.alert(
        "Missing information",
        "Please enter your first name, last name, username, email, and password.",
      );
      return;
    }

    if (password !== repeatPassword) {
      Alert.alert(
        "Password mismatch",
        "The passwords you entered do not match.",
      );
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await apiRequest<{
        userId: number;
        message?: string;
      }>("/api/Auth/register", {
        method: "POST",
        body: JSON.stringify({
          username: username.trim(),
          email: normalizedEmail,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          password,
        }),
      });

      Alert.alert(
        "Registration successful",
        response.message ??
          "Your account was created. Please verify your email before logging in.",
        [
          {
            text: "Enter code",
            onPress: () =>
              router.replace({
                pathname: "/verify-email-screen",
                params: { email: normalizedEmail },
              }),
          },
        ],
      );
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 0) {
        presentApiError("Registration failed", error, {
          networkMessage:
            "We couldn't reach the server, so your account was not created yet.",
        });
        return;
      }

      Alert.alert("Registration failed", getRegisterErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <PageHeader title="Create account" />

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
              <AdaptiveText style={styles.heroBadge}>Join PetsApp</AdaptiveText>
              <AdaptiveText style={styles.heroTitle}>
                Create your account
              </AdaptiveText>
              <AdaptiveText style={styles.heroSubtitle}>
                We only ask for the details required by registration, and
                you&apos;ll verify your email before your first login.
              </AdaptiveText>
            </View>

            <View style={styles.formCard}>
              <AdaptiveText style={styles.sectionLabel}>Your name</AdaptiveText>

              <View style={styles.inputRow}>
                <View
                  style={[
                    styles.inputColumn,
                    isWideLayout && styles.inputColumnWithGap,
                  ]}
                >
                  <CustomInput
                    label="First Name"
                    value={firstName}
                    onChangeText={setFirstName}
                    style={styles.input}
                    styleLabel={styles.textInput}
                    autoCapitalize="words"
                    autoComplete="name-given"
                    textContentType="givenName"
                    returnKeyType="next"
                  />
                </View>

                <View style={styles.inputColumn}>
                  <CustomInput
                    label="Last Name"
                    value={lastName}
                    onChangeText={setLastName}
                    style={styles.input}
                    styleLabel={styles.textInput}
                    autoCapitalize="words"
                    autoComplete="name-family"
                    textContentType="familyName"
                    returnKeyType="next"
                  />
                </View>
              </View>

              <AdaptiveText style={styles.sectionLabel}>
                Sign-in details
              </AdaptiveText>

              <CustomInput
                label="Username"
                value={username}
                onChangeText={setUsername}
                style={styles.input}
                styleLabel={styles.textInput}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="username"
                spellCheck={false}
                textContentType="username"
                returnKeyType="next"
              />

              <CustomInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                style={styles.input}
                styleLabel={styles.textInput}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                spellCheck={false}
                keyboardType="email-address"
                textContentType="emailAddress"
                returnKeyType="next"
              />

              <AdaptiveText style={styles.sectionLabel}>Security</AdaptiveText>

              <CustomInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                style={styles.input}
                styleLabel={styles.textInput}
                secureTextEntry
                autoComplete="new-password"
                textContentType="newPassword"
                returnKeyType="next"
              />

              <CustomInput
                label="Repeat Password"
                value={repeatPassword}
                onChangeText={setRepeatPassword}
                style={styles.input}
                styleLabel={styles.textInput}
                secureTextEntry
                autoComplete="new-password"
                textContentType="password"
                returnKeyType="done"
              />

              <View style={styles.passwordHintCard}>
                <AdaptiveText style={styles.passwordHintTitle}>
                  Password requirements
                </AdaptiveText>
                <AdaptiveText style={styles.passwordHintText}>
                  Use 8 to 64 characters with uppercase, lowercase, a number,
                  and a symbol. Spaces are not allowed.
                </AdaptiveText>
              </View>

              <TouchableOpacity
                style={[styles.button, isSubmitting && styles.buttonDisabled]}
                onPress={handleRegister}
                disabled={isSubmitting}
              >
                <Text style={styles.buttonText}>
                  {isSubmitting ? "Creating account..." : "Create account"}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.footerRow}>
              <AdaptiveText style={styles.footerText}>
                Already have an account?
              </AdaptiveText>

              <TouchableOpacity onPress={() => router.replace("/login-screen")}>
                <AdaptiveText style={styles.footerLink}>Log in</AdaptiveText>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>

      {isSubmitting && <LoadingOverlay />}
    </SafeAreaView>
  );
};

export default RegisterScreen;

const createStyles = ({
  darkMode,
  isWideLayout,
}: {
  darkMode: boolean;
  isWideLayout: boolean;
}) => {
  return StyleSheet.create({
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
        : colors.lightLightGreen1,
    },
    heroBadge: {
      alignSelf: "flex-start",
      overflow: "hidden",
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 6,
      marginBottom: 12,
      backgroundColor: darkMode ? colors.darkGreen : colors.white,
      color: darkMode ? colors.lightLightGreen1 : colors.green,
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
      color: darkMode ? colors.lightLightGreen1 : colors.green,
      textTransform: "uppercase",
    },
    inputRow: {
      flexDirection: isWideLayout ? "row" : "column",
      width: "100%",
    },
    inputColumn: {
      flex: 1,
      width: "100%",
      marginRight: 0,
    },
    inputColumnWithGap: {
      marginRight: 12,
    },
    input: {
      width: "100%",
      marginBottom: 12,
      backgroundColor: darkMode ? colors.averageDarkGrey : colors.white,
    },
    textInput: {
      backgroundColor: darkMode ? colors.averageDarkGrey : colors.white,
    },
    passwordHintCard: {
      width: "100%",
      borderRadius: 20,
      padding: 14,
      marginTop: 2,
      marginBottom: 18,
      backgroundColor: darkMode ? colors.veryDarkGrey : colors.lightLightOrange,
    },
    passwordHintTitle: {
      fontFamily: "Poppins-SemiBold",
      fontSize: 14,
      marginBottom: 4,
    },
    passwordHintText: {
      fontFamily: "Poppins-Regular",
      fontSize: 13,
      lineHeight: 20,
      color: darkMode ? colors.lightGrey : colors.mildDarkGrey,
    },
    button: {
      width: "100%",
      alignItems: "center",
      backgroundColor: colors.green,
      borderRadius: 20,
      paddingVertical: 16,
      marginTop: 2,
    },
    buttonDisabled: {
      opacity: 0.7,
    },
    buttonText: {
      color: colors.white,
      fontSize: 18,
      fontFamily: "Poppins-SemiBold",
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
};
