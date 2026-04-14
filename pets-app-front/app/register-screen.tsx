import { AdaptiveText } from "@/components/AdaptiveText";
import { AdaptiveView } from "@/components/AdaptiveView";
import CustomInput from "@/components/CustomInput";
import { PageHeader } from "@/components/PageHeader";
import { colors } from "@/constants/colors";
import {
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
  const darkMode = useColorScheme() === "dark";
  const { width } = useWindowDimensions();
  const styles = createStyles({ darkMode, width });

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

            <CustomInput label="Username" />
            <CustomInput label="Password" />
            <CustomInput label="Repeat Password" />
            <CustomInput label="Email" />

            <TouchableOpacity style={styles.btn}>
              <Text style={styles.txtBtn}>Register</Text>
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
