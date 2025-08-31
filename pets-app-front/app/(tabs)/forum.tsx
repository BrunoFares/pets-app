import { AdaptiveText } from "@/components/AdaptiveText";
import { AdaptiveView } from "@/components/AdaptiveView";
import { MainHeader } from "@/components/MainHeader";
import { colors } from "@/constants/colors";
import { StyleSheet, useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ForumScreen() {
  const darkMode = useColorScheme() === 'dark';
  const styles = createStyles({ darkMode });

  return (
    <SafeAreaView style={styles.container}>
      <MainHeader />

      <AdaptiveView style={styles.body}><AdaptiveText>Forum Screen</AdaptiveText></AdaptiveView>
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