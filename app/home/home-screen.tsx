import { AdaptiveView } from "@/components/AdaptiveView";
import { Header } from "@/components/Header";
import { Text, TouchableOpacity, useColorScheme, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { createStyles } from "./home-screen-style";

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const styles = createStyles({ colorScheme });

  return (
    <SafeAreaView style={styles.container}>
      <Header></Header>

      <AdaptiveView style={styles.body}>
        <View style={styles.quadrant}>

          <View style={styles.row}>
            <TouchableOpacity style={styles.gridItem}>
              <Text>Vets Near Me</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.gridItem}>
              <Text>My Pets</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.row}>
            <TouchableOpacity style={styles.gridItem}>
              <Text>Pet Shops Near Me</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.gridItem}>
              <Text>Dr. Petsapp</Text>
            </TouchableOpacity>
            
          </View>
        </View>
      </AdaptiveView>
    </SafeAreaView>
  );
}