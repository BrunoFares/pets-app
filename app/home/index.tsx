import { AdaptiveView } from "@/components/AdaptiveView";
import { Header } from "@/components/Header";
import { colors } from "@/constants/colors";
import { FontAwesome, FontAwesome6, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Text, TouchableOpacity, useColorScheme, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import createStyles from "./style";

export default function HomeScreen() {
  const router = useRouter();
  const darkMode = useColorScheme() === 'dark';
  const styles = createStyles({ darkMode });

  return (
    <SafeAreaView style={styles.container}>
      <Header />

      <AdaptiveView style={styles.body}>
        <View style={styles.quadrant}>

          <View style={styles.row}>
            <TouchableOpacity onPress={() => router.navigate('/vets-list')} style={[styles.gridItem, {backgroundColor: colors.lightLightGreen}]}>
              <FontAwesome name="stethoscope" size={72} color={colors.lightGreen} />
              <Text style={[styles.gridItemText, {color: colors.lightGreen}]}>Vets Near Me</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.navigate('/pets-profile')} style={[styles.gridItem, {backgroundColor: colors.lightTurquoise}]}>
              <FontAwesome name="paw" size={72} color={colors.darkTurquoise} />
              <Text style={[styles.gridItemText, {color: colors.darkTurquoise}]}>My Pets</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.row}>
            <TouchableOpacity onPress={() => router.navigate('/shops-list')} style={[styles.gridItem, {backgroundColor: colors.lightLightOrange}]}>
              <FontAwesome6 name="shop" size={72} color={colors.lightOrange} />
              <Text style={[styles.gridItemText, {color: colors.lightOrange}]}>Pet Shops Near Me</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.navigate('/chatbot-screen')} style={[styles.gridItem, {backgroundColor: colors.lightLightViolet}]}>
              <MaterialCommunityIcons name="chat-processing" size={72} color={colors.lightViolet} />
              <Text style={[styles.gridItemText, {color: colors.lightViolet}]}>Dr. Petsapp</Text>
            </TouchableOpacity>

          </View>
        </View>
      </AdaptiveView>
    </SafeAreaView>
  );
}