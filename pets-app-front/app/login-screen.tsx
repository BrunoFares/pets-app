import { AdaptiveText } from "@/components/AdaptiveText";
import { AdaptiveView } from "@/components/AdaptiveView";
import CustomInput from "@/components/CustomInput";
import { colors } from "@/constants/colors";
import { useRouter } from "expo-router";
import React from "react";
import {
  Image,
  Keyboard,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  useColorScheme
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LoginScreen() {
  const router = useRouter();
  const darkMode = useColorScheme() === "dark";
  const styles = createStyles({ darkMode });

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

        <CustomInput label='Username' />

        <CustomInput label='Password' />

        <TouchableOpacity style={{alignSelf: 'flex-end',}}>
          <AdaptiveText style={{
            marginRight: 30,
            fontFamily: 'Poppins-Regular',
          }}>Forgot your password?</AdaptiveText>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btn} onPress={() => {router.replace("/(tabs)")}}>
          <Text style={styles.txtBtn}>Login</Text>
        </TouchableOpacity>

        <AdaptiveView style={{ flexDirection: "row", marginTop: 20 }}>
          <AdaptiveText style={{ fontFamily: "Poppins-Regular"}} >Don&apos;t have an account? </AdaptiveText>

          <TouchableOpacity onPress={() => router.push("/register-screen")}>
            <AdaptiveText style={{ fontFamily: "Poppins-Bold", color: colors.green}}>Sign Up!</AdaptiveText>
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
      marginBottom: 80
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
