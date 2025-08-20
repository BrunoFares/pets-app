import { AdaptiveText } from "@/components/AdaptiveText";
import { AdaptiveView } from "@/components/AdaptiveView";
import { Header } from "@/components/Header";
import { colors } from "@/constants/colors";
import { StyleSheet, useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Explore() {
  const darkMode = useColorScheme() === 'dark';
  const styles = createStyles({ darkMode });

  return (
    <SafeAreaView style={styles.container}>
      <Header />

      <AdaptiveView style={styles.body}><AdaptiveText>Explore</AdaptiveText></AdaptiveView>
    </SafeAreaView>
  );
}

const createStyles = ({ darkMode }: any) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: darkMode ? colors.veryDarkGrey : colors.white,
    },
    body: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
  })
};