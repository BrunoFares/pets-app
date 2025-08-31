import { AdaptiveText } from "@/components/AdaptiveText";
import { AdaptiveView } from "@/components/AdaptiveView";
import { MainHeader } from "@/components/MainHeader";
import { colors } from "@/constants/colors";
import { useHeaderSlide } from "@/hooks/useHeaderSlide";
import { Animated, StyleSheet, useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const darkMode = useColorScheme() === "dark";
  const styles = createStyles({darkMode})

  const { translateY } = useHeaderSlide({ height: 200 });

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={{ transform: [{ translateY }] }}>
        <MainHeader />
      </Animated.View>

      <AdaptiveView style={styles.body}>
        <AdaptiveText>Home Screen</AdaptiveText>
      </AdaptiveView>
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