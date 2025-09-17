import { AdaptiveText } from "@/components/AdaptiveText";
import { AdaptiveView } from "@/components/AdaptiveView";
import { PageHeader } from "@/components/PageHeader";
import { colors } from "@/constants/colors";
import { AntDesign, MaterialIcons } from "@expo/vector-icons";
import { Platform, SafeAreaView, ScrollView, StyleSheet, TouchableOpacity, useColorScheme, View } from "react-native";

export default function AccountSettingsScreen() {
  const darkMode = useColorScheme() === "dark";
  const styles = createStyles({ darkMode });

  const settingsPage = (title: string, imageTitle: 'privacy-tip' | 'account-circle', fn: () => void) => {
    return (
      <TouchableOpacity style={styles.settingsPage} onPress={fn}>
        <View style={{ flexDirection: 'row', gap: 10 }}>
            <MaterialIcons name={imageTitle} size={24} color={darkMode ? colors.white : colors.black} />
            <AdaptiveText style={{
                fontFamily: 'Poppins-Regular',
                fontSize: 16
            }}>{title}</AdaptiveText>
        </View>
        <AntDesign name="arrowright" size={24} color={darkMode ? colors.white : colors.black} />
      </TouchableOpacity>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <PageHeader title="" style={{marginTop: Platform.select({android: 20})}} />
      <ScrollView>
        <AdaptiveText style={{
            fontFamily: 'Poppins-SemiBold',
            fontSize: 28,
            marginBottom: 40,
            alignSelf: 'center'
        }}>Account Settings</AdaptiveText>
        <AdaptiveView style={styles.container}>
            {settingsPage('password', 'account-circle', () => {})}
            {settingsPage('again', 'privacy-tip', () => {})}
        </AdaptiveView>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = ({ darkMode }: any) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: darkMode ? colors.veryDarkGrey : colors.white,
      alignItems: "center",
      width: "100%",
      gap: 10
    },
    settingsPage: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: darkMode ? colors.darkGrey : colors.lightGrey,
      paddingHorizontal: 16,
      paddingVertical: 14,
      width: '95%',
      borderRadius: 12,
    }
  });
};
