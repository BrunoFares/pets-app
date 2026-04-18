import { AdaptiveText } from "@/components/AdaptiveText";
import { AdaptiveView } from "@/components/AdaptiveView";
import CustomImage from "@/components/CustomImage";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import LogOutModal from "@/components/LogOutModal";
import { ProfileEmptyState } from "@/components/ProfileEmptyState";
import { colors } from "@/constants/colors";
import { useAuth } from "@/contexts/AuthProvider";
import { useGlobal } from "@/contexts/GlobalProvider";
import { useHeaderSlide } from "@/hooks/useHeaderSlide";
import { goTo } from "@/utils";
import { Feather, FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  Animated,
  FlatList,
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
  const { setShowFooter } = useGlobal();
  const {
    user: profileInfo,
    pets,
    isAuthenticated,
    isHydrating,
    isRefreshingProfile,
    refreshProfile,
    shouldRefreshProfile,
    signOut,
  } = useAuth();

  const isLoading = isHydrating || isRefreshingProfile;

  useFocusEffect(
    useCallback(() => {
      setShowFooter?.(true);

      if (isAuthenticated && shouldRefreshProfile()) {
        void refreshProfile().catch((error) => {
          Alert.alert(
            "Could not load profile",
            error instanceof Error
              ? error.message
              : "Unable to load your profile.",
          );
        });
      }

      return () => {
        setShowFooter?.(true);
      };
    }, [isAuthenticated, refreshProfile, setShowFooter, shouldRefreshProfile]),
  );

  if (profileInfo) {
    return (
      <SafeAreaView style={styles.container}>
        <FlatList
          data={pets}
          keyExtractor={(item) => String(item.Id)}
          ListHeaderComponent={
            <View>
              <Animated.View style={styles.head}>
                <CustomImage image={profileInfo.Image} />
                <View
                  style={{
                    backgroundColor: darkMode
                      ? colors.veryDarkGrey
                      : colors.white,
                  }}
                >
                  <AdaptiveText style={styles.title}>
                    {profileInfo.Name}
                  </AdaptiveText>
                  <TouchableOpacity
                    style={styles.editProfile}
                    onPress={() => {
                      goTo("", "/profile/edit-profile", router);
                    }}
                  >
                    <AdaptiveText style={styles.editProfileText}>
                      Edit Profile
                    </AdaptiveText>
                  </TouchableOpacity>
                </View>
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

              <TouchableOpacity
                style={styles.addPet}
                onPress={() => goTo({}, "/profile/add-pet", router)}
              >
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
              <TouchableOpacity
                style={styles.petListItem}
                onPress={() => {
                  goTo(item, "/(tabs)/profile/[pet]", router);
                }}
              >
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <FontAwesome5
                    name={item.Species}
                    size={24}
                    color={darkMode ? colors.white : colors.black}
                  />
                  <AdaptiveText style={styles.addPetText}>
                    {item.Name}
                  </AdaptiveText>
                </View>
                <Feather
                  name="arrow-right"
                  size={24}
                  color={darkMode ? colors.white : colors.black}
                />
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <ProfileEmptyState
              style={{
                width: "95%",
              }}
              title="No pets added yet"
              subtitle="Add your first pet to start tracking their profile, consultations, vaccines, and illness history here."
            />
          }
          ListFooterComponent={
            <View
              style={{
                width: "95%",
                flexDirection: "row",
                alignSelf: "center",
                gap: 14,
                marginTop: -10,
                backgroundColor: darkMode ? colors.veryDarkGrey : colors.white,
              }}
            >
              <TouchableOpacity
                onPress={() => {
                  goTo({}, "/(tabs)/profile/settings", router);
                }}
                style={[
                  styles.signOutBtn,
                  {
                    backgroundColor: darkMode
                      ? colors.darkGrey
                      : colors.lightGrey,
                  },
                ]}
              >
                <MaterialIcons
                  name="settings"
                  size={24}
                  color={darkMode ? colors.white : colors.black}
                />
                <Text
                  style={[
                    styles.signOutBtnText,
                    { color: darkMode ? colors.white : colors.black },
                  ]}
                >
                  Settings
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.signOutBtn}
                onPress={() => setLogOutModal(true)}
              >
                <MaterialIcons name="logout" size={24} color={colors.white} />
                <AdaptiveText style={styles.signOutBtnText}>
                  Log Out
                </AdaptiveText>
              </TouchableOpacity>
            </View>
          }
        />
        <LogOutModal
          visible={logOutModal}
          onClose={() => setLogOutModal(false)}
          onDone={async () => {
            setLogOutModal(false);
            await signOut();
          }}
        />

        {isLoading && <LoadingOverlay />}
      </SafeAreaView>
    );
  } else {
    return (
      <SafeAreaView style={styles.container}>
        {isLoading ? (
          <View style={styles.loadingFallback} />
        ) : (
          <AdaptiveView>
            <AdaptiveText>
              {isAuthenticated
                ? "Unable to load your profile right now."
                : "You are not logged in."}
            </AdaptiveText>
          </AdaptiveView>
        )}

        {isLoading && <LoadingOverlay />}
      </SafeAreaView>
    );
  }
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
      width: 120,
      alignItems: "center",
      paddingVertical: 4,
      borderRadius: 10,
      marginTop: 4,
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
      justifyContent: "space-between",
      width: "95%",
      paddingVertical: 15,
      borderRadius: 20,
      alignSelf: "center",
      borderWidth: 1,
      borderColor: darkMode ? colors.darkGrey : colors.lightGrey,
      paddingHorizontal: 20,
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
      color: colors.white,
    },
    loadingFallback: {
      flex: 1,
      width: "100%",
    },
  });
};
