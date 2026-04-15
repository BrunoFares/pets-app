import { AdaptiveText } from "@/components/AdaptiveText";
import { AdaptiveView } from "@/components/AdaptiveView";
import CustomImage from "@/components/CustomImage";
import LogOutModal from "@/components/LogOutModal";
import { colors } from "@/constants/colors";
import { useGlobal } from "@/contexts/GlobalProvider";
import { AppUsersModel, PetModel } from "@/data/models";
import { useHeaderSlide } from "@/hooks/useHeaderSlide";
import { apiRequest, clearAuthSession, resolveApiUrl } from "@/lib/api";
import { goTo } from "@/utils";
import { Feather, FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
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
  const [containerWidth, setContainerWidth] = useState(0);
  const styles = createStyles({ darkMode, translateY, containerWidth });
  const [logOutModal, setLogOutModal] = useState(false);
  const [profileInfo, setProfileInfo] = useState<AppUsersModel>();
  const [pets, setPets] = useState<PetModel[]>([]);
  const { setShowFooter } = useGlobal();
  const [isLoading, setIsLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      const [user, animals] = await Promise.all([
        apiRequest<{
          id: number;
          username: string;
          name?: string | null;
          firstName: string;
          lastName: string;
          email: string;
          phoneNumber: string;
          image?: string | null;
          description?: string | null;
          createdAt: string;
          lastLogin?: string | null;
        }>("/api/Users/me"),
        apiRequest<{
          id: string;
          userId: number;
          name: string;
          speciesId: number;
          species: string;
          breedId?: number | null;
          breed?: string | null;
          sex: "Male" | "Female";
          birthDate?: string | null;
          weightKg?: number | null;
          color: string;
          neutered: boolean;
          avatarUrl?: string | null;
          notes?: string | null;
          createdAt: string;
          updatedAt: string;
        }[]>("/api/Pets"),
      ]);

      setProfileInfo({
        Id: user.id,
        Name: user.name || `${user.firstName} ${user.lastName}`.trim(),
        FirstName: user.firstName,
        LastName: user.lastName,
        Email: user.email,
        PhoneNumber: user.phoneNumber,
        PasswordHash: "",
        Image: resolveApiUrl(user.image),
        CreatedAt: user.createdAt,
        LastLogin: user.lastLogin ?? null,
        Description: user.description ?? "",
        BookmarkedPostID: [],
      });

      setPets(
        animals.map((pet) => ({
          Id: pet.id,
          UserId: pet.userId,
          Name: pet.name,
          SpeciesId: pet.speciesId,
          BreedId: pet.breedId ?? null,
          Sex: pet.sex,
          BirthDate: pet.birthDate ?? null,
          WeightKg: pet.weightKg ?? null,
          Color: pet.color,
          Neutered: pet.neutered,
          AvatarUrl: resolveApiUrl(pet.avatarUrl),
          Notes: pet.notes ?? "",
          CreatedAt: pet.createdAt,
          UpdatedAt: pet.updatedAt,
          Species: pet.species.toLowerCase(),
          Breed: pet.breed ?? null,
          ConsultationsId: [],
        })),
      );
    } catch (error) {
      setProfileInfo(undefined);
      setPets([]);
      Alert.alert(
        "Could not load profile",
        error instanceof Error ? error.message : "Unable to load your profile.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useFocusEffect(
    useCallback(() => {
      setShowFooter?.(true);
      loadProfile();

      return () => {
        // This code runs when the screen is unfocused (or unmounted).
        setShowFooter?.(true);
      };
    }, [loadProfile, setShowFooter]), // The empty dependency array ensures the effect runs only on focus/unfocus.
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
                  <AdaptiveText style={styles.title}>{profileInfo.Name}</AdaptiveText>
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
                onLayout={(event) => {
                  const { width } = event.nativeEvent.layout;
                  setContainerWidth(width);
                }}
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
          ListFooterComponent={
            <View
              style={{
                width: "95%",
                flexDirection: "row",
                alignSelf: "center",
                gap: 14,
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
            try {
              await apiRequest("/api/Auth/logout", { method: "POST" });
            } catch {}

            await clearAuthSession();
            router.replace("/login-screen");
          }}
        />
      </SafeAreaView>
    );
  } else {
    return (
      <SafeAreaView style={styles.container}>
        <AdaptiveView>
          <AdaptiveText>
            {isLoading ? "Loading profile..." : "You are not logged in."}
          </AdaptiveText>
        </AdaptiveView>
      </SafeAreaView>
    );
  }
}

const createStyles = ({ darkMode, translateY, containerWidth }: any) => {
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
      width: containerWidth,
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
  });
};
