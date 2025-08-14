import { AdaptiveView } from "@/components/AdaptiveView";
import { Header } from "@/components/Header";
import { colors } from "@/constants/colors";
import { useRouter } from "expo-router";
import { StyleSheet, Text, useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Explore() {
  const router = useRouter();
  const darkMode = useColorScheme() === 'dark';
  const styles = createStyles({ darkMode });

  return (
    <SafeAreaView style={styles.container}>
      <Header />

      <AdaptiveView style={styles.body}><Text>Explore</Text></AdaptiveView>
    </SafeAreaView>
  );
}


const createStyles = ({ darkMode }: any) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.green,
    },
    body: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    quadrant: {
      gap: 10
    },
    row: {
      flexDirection: 'row',
      gap: 10
    },
    gridItem: {
      width: 170,
      height: 170,
      backgroundColor: colors.lightGrey,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 10
    },
    gridItemText: {
      fontFamily: 'Poppins-Bold',
      fontSize: 19,
      textAlign: 'center'
    }
  })
};