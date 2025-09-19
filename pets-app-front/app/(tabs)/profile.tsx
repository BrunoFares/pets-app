import { AdaptiveText } from "@/components/AdaptiveText";
import { AdaptiveView } from "@/components/AdaptiveView";
import LogOutModal from "@/components/LogOutModal";
import { colors } from "@/constants/colors";
import { useHeaderSlide } from "@/hooks/useHeaderSlide";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Animated,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Profile() {
  const { translateY } = useHeaderSlide({ height: 200, duration: 200 });
  const darkMode = useColorScheme() === "dark";
  const router = useRouter();
  const styles = createStyles({ darkMode, translateY });
  const [logOutModal, setLogOutModal] = useState(false);
  const [profileInfo, setProfileInfo] = useState<any>({
    pets: [
      {
        key: 1,
        name: "Kalinka",
      },
      {
        key: 2,
        name: "Minouche",
      },
    ],
  });

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={profileInfo && profileInfo.pets ? profileInfo.pets : {}}
        keyExtractor={(item) => String(item.key)}
        ListHeaderComponent={
          <View style={{ width: 380}}>
            <Animated.View style={styles.head}>
              <View>
                {profileInfo && profileInfo.picture ? (
                  <Image source={profileInfo.picture} />
                ) : (
                  <View style={styles.pfp} />
                )}
              </View>
              <AdaptiveView>
                <AdaptiveText style={styles.title}>Bruno</AdaptiveText>
                <TouchableOpacity style={styles.editProfile}>
                  <AdaptiveText style={styles.editProfileText}>
                    Edit Profile
                  </AdaptiveText>
                </TouchableOpacity>
              </AdaptiveView>
            </Animated.View>

            <AdaptiveText
              style={{
                fontFamily: "Poppins-Bold",
                fontSize: 18,
                marginLeft: 20,
                marginVertical: 15,
              }}
            >
              My Pets
            </AdaptiveText>

            <TouchableOpacity style={styles.addPet}>
              <Feather
                name="plus"
                size={30}
                color={darkMode ? colors.white : colors.black}
              />
              <AdaptiveText style={styles.addPetText}>Add Pet</AdaptiveText>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => {
          return (
            <TouchableOpacity style={styles.petListItem}>
              <AdaptiveText style={styles.addPetText}>{item.name}</AdaptiveText>
              <Feather
                name="arrow-right"
                size={24}
                color={darkMode ? colors.white : colors.black}
              />
            </TouchableOpacity>
          );
        }}
        ListFooterComponent={
          <AdaptiveView style={{ width: '95%', flexDirection: 'row', alignSelf: 'center', gap: 14}}>
            <TouchableOpacity onPress={() => {router.push('/settings-screen')}} style={[styles.signOutBtn, {backgroundColor: darkMode ? colors.darkGrey : colors.lightGrey}]}>
              <MaterialIcons name="settings" size={24} color={darkMode ? colors.white : colors.black} />
              <Text style={[styles.signOutBtnText, {color: darkMode ? colors.white : colors.black}]}>
                Settings
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.signOutBtn} onPress={() => setLogOutModal(true)}>
              <MaterialIcons name="logout" size={24} color={colors.white} />
              <AdaptiveText style={styles.signOutBtnText}>Log Out</AdaptiveText>
            </TouchableOpacity>
          </AdaptiveView>
        }
      />
    <LogOutModal 
      visible={logOutModal}
      onClose={() => setLogOutModal(false)}
      onDone={() => {router.replace('/login-screen')}}
    />
    </SafeAreaView>
  );
}

const createStyles = ({ darkMode, translateY }: any) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: darkMode ? colors.veryDarkGrey : colors.white,
      alignItems: "center",
    },
    head: {
      transform: [{ translateY }],
      alignItems: "center",
      justifyContent: "flex-start",
      flexDirection: "row",
      paddingVertical: 20,
      paddingHorizontal: 16,
      gap: 20,
    },
    body: {},
    title: {
      fontFamily: "Poppins-SemiBold",
      fontSize: 24,
    },
    editProfile: {
      backgroundColor: darkMode ? colors.darkGrey : colors.lightGrey,
      paddingHorizontal: 16,
      paddingVertical: 4,
      borderRadius: 10,
    },
    editProfileText: {
      fontFamily: "Poppins-Regular",
      fontSize: 16,
    },
    pfp: {
      height: 120,
      width: 120,
      borderRadius: 120,
      backgroundColor: colors.lightGrey,
    },
    addPet: {
      backgroundColor: darkMode ? colors.darkGrey : colors.lightGrey,
      flexDirection: "row",
      gap: 20,
      alignItems: "center",
      justifyContent: "center",
      width: "95%",
      paddingVertical: 15,
      borderRadius: 20,
      alignSelf: "center",
    },
    addPetText: {
      fontFamily: "Poppins-Medium",
      fontSize: 20,
      textAlign: "center",
    },
    petListItem: {
      flexDirection: "row",
      gap: 20,
      alignItems: "center",
      alignSelf: "center",
      justifyContent: "space-between",
      width: "95%",
      paddingVertical: 15,
      borderWidth: 1,
      borderColor: darkMode ? colors.darkGrey : colors.lightGrey,
      borderRadius: 20,
      paddingHorizontal: 40,
      marginTop: 10,
    },
    signOutBtn: {
      flex: 1,
      alignItems: "center",
      alignSelf: "center",
      paddingVertical: 15,
      backgroundColor: colors.red,
      borderRadius: 20,
      paddingHorizontal: 40,
      marginTop: 20,
    },
    signOutBtnText: {
      fontFamily: "Poppins-Medium",
      fontSize: 20,
      textAlign: "center",
      color: colors.white
    }
  });
};
