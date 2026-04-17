import { AdaptiveText } from "@/components/AdaptiveText";
import { AdaptiveView } from "@/components/AdaptiveView";
import CustomInput from "@/components/CustomInput";
import { PageHeader } from "@/components/PageHeader";
import { colors } from "@/constants/colors";
import { useAuth } from "@/contexts/AuthProvider";
import { apiRequest } from "@/lib/api";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  useColorScheme,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const RegisterScreen = () => {
  const router = useRouter();
  const { signIn } = useAuth();
  const darkMode = useColorScheme() === "dark";
  const { width } = useWindowDimensions();
  const styles = createStyles({ darkMode, width });
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = async () => {
    if (
      !username.trim() ||
      !firstName.trim() ||
      !lastName.trim() ||
      !phoneNumber.trim() ||
      !email.trim() ||
      !password
    ) {
      Alert.alert("Missing information", "Please fill in all required fields.");
      return;
    }

    if (password !== repeatPassword) {
      Alert.alert("Password mismatch", "The passwords you entered do not match.");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await apiRequest<{ accessToken: string; userId: number }>(
        "/api/Auth/register",
        {
          method: "POST",
          body: JSON.stringify({
            username: username.trim(),
            name: `${firstName.trim()} ${lastName.trim()}`.trim(),
            email: email.trim(),
            phoneNumber: phoneNumber.trim(),
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            password,
          }),
        },
      );

      await signIn(response);
      router.replace("/(tabs)");
    } catch (error) {
      Alert.alert(
        "Registration failed",
        error instanceof Error ? error.message : "Unable to register.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <PageHeader title="" />
      <TouchableWithoutFeedback
        style={styles.container}
        onPress={Keyboard.dismiss}
      >
        <AdaptiveView style={styles.container}>
          <ScrollView
            contentContainerStyle={{ width, alignItems: "center" }}
          >
            <AdaptiveText
              style={{
                fontSize: 26,
                fontFamily: "Poppins-SemiBold",
                marginBottom: 80,
              }}
            >
              Register Account
            </AdaptiveText>

            <CustomInput label="Username" value={username} onChangeText={setUsername} autoCapitalize="none" />
            <CustomInput label="First Name" value={firstName} onChangeText={setFirstName} />
            <CustomInput label="Last Name" value={lastName} onChangeText={setLastName} />
            <CustomInput label="Phone Number" value={phoneNumber} onChangeText={setPhoneNumber} keyboardType="phone-pad" />
            <CustomInput label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
            <CustomInput label="Password" value={password} onChangeText={setPassword} secureTextEntry />
            <CustomInput label="Repeat Password" value={repeatPassword} onChangeText={setRepeatPassword} secureTextEntry />

            <TouchableOpacity style={styles.btn} onPress={handleRegister} disabled={isSubmitting}>
              <Text style={styles.txtBtn}>{isSubmitting ? "Registering..." : "Register"}</Text>
            </TouchableOpacity>
          </ScrollView>
        </AdaptiveView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

export default RegisterScreen;

const createStyles = ({ darkMode, width }: any) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: darkMode ? colors.veryDarkGrey : colors.white,
      alignItems: "center",
      width,
      justifyContent: "center",
    },
    btn: {
      backgroundColor: colors.green,
      borderRadius: 20,
      paddingVertical: 6,
      paddingHorizontal: 30,
      marginTop: 100
    },
    txtBtn: {
      fontSize: 20,
      fontFamily: "Poppins-SemiBold",
      color: colors.white,
      paddingVertical: 12,
      paddingHorizontal: 16,
    }
  });
};
