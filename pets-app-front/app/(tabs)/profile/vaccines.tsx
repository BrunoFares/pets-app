import { AdaptiveText } from "@/components/AdaptiveText";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { PageHeader } from "@/components/PageHeader";
import { ProfileEmptyState } from "@/components/ProfileEmptyState";
import { colors } from "@/constants/colors";
import { useGlobal } from "@/contexts/GlobalProvider";
import { PetModel, VaccineRecordModel } from "@/data/models";
import {
  fetchPetVaccines,
  parseRoutePayload,
} from "@/lib/profile-api";
import { goTo } from "@/utils";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const VaccinesScreen = () => {
  const router = useRouter();
  const darkMode = useColorScheme() === "dark";
  const styles = createStyles({ darkMode });
  const { setShowFooter } = useGlobal();
  const { payload } = useLocalSearchParams<{ payload?: any }>();
  const [vaccines, setVaccines] = useState<VaccineRecordModel[]>([]);
  const [pet, setPet] = useState<PetModel>();
  const [petId, setPetId] = useState<string>();
  const [isLoading, setIsLoading] = useState(true);

  const loadVaccines = useCallback(async (id: string) => {
    setIsLoading(true);

    try {
      const response = await fetchPetVaccines(id);
      setVaccines(response);
    } catch (error) {
      Alert.alert(
        "Unable to load vaccines",
        error instanceof Error ? error.message : "Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const parsed = parseRoutePayload<{ pet?: PetModel }>(payload);
    if (!parsed?.pet) {
      setPet(undefined);
      setPetId(undefined);
      setVaccines([]);
      setIsLoading(false);
      return;
    }

    setPet(parsed.pet);
    setPetId(String(parsed.pet.Id));
    void loadVaccines(String(parsed.pet.Id));
  }, [loadVaccines, payload]);

  useFocusEffect(
    useCallback(() => {
      setShowFooter?.(false);

      if (petId) {
        void loadVaccines(petId);
      }

      return () => {
        setShowFooter?.(true);
      };
    }, [loadVaccines, petId, setShowFooter]),
  );

  return (
    <SafeAreaView style={styles.container}>
      <PageHeader title="" />

      <AdaptiveText style={styles.title}>
        {pet?.Name ? `${pet.Name}'s Vaccination Record` : "Vaccination Record"}
      </AdaptiveText>

      <FlatList
        data={vaccines}
        keyExtractor={(item) => String(item.Id)}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          isLoading ? null : (
            <ProfileEmptyState
              title="No vaccines recorded yet"
              subtitle="Add vaccinations here so upcoming doses and past records are easy to review."
            />
          )
        }
        renderItem={({ item }) => (
          <>
            <TouchableOpacity
              onPress={() => {
                goTo({ item, pet }, "/profile/modify-add-vaccine", router);
              }}
              style={{
                alignSelf: "center",
                width: "90%",
                borderColor: colors.darkGrey,
                borderWidth: 1,
                borderRadius: 14,
                paddingVertical: 10,
                paddingHorizontal: 20,
              }}
            >
              <AdaptiveText
                style={{ fontFamily: "Poppins-SemiBold", fontSize: 17 }}
              >
                {item.vaccineName}
              </AdaptiveText>

              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <View>
                  <AdaptiveText style={styles.datesList}>
                    Date Administered
                  </AdaptiveText>
                  <AdaptiveText style={styles.datesList}>
                    {item.dateAdministered?.toDateString()}
                  </AdaptiveText>
                </View>

                <View>
                  <AdaptiveText style={styles.datesList}>
                    Next Due Date
                  </AdaptiveText>
                  <AdaptiveText style={styles.datesList}>
                    {item.nextDueDate?.toDateString()}
                  </AdaptiveText>
                </View>
              </View>
            </TouchableOpacity>
          </>
        )}
      />
      <TouchableOpacity
        style={{
          alignSelf: "center",
          backgroundColor: colors.green,
          padding: 14,
          borderRadius: 18,
          marginBottom: 20,
        }}
        onPress={() => {
          goTo({ pet }, "/profile/modify-add-vaccine", router);
        }}
      >
        <Feather
          name="plus"
          size={34}
          color={darkMode ? colors.white : colors.black}
        />
      </TouchableOpacity>

      {isLoading && <LoadingOverlay />}
    </SafeAreaView>
  );
};

export default VaccinesScreen;

const createStyles = ({ darkMode }: any) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: darkMode ? colors.veryDarkGrey : colors.white,
      gap: 10,
    },
    title: {
      fontSize: 26,
      alignSelf: "center",
      fontFamily: "Poppins-SemiBold",
      paddingHorizontal: 10,
      marginBottom: 10,
      textAlign: "center",
    },
    listContent: {
      paddingBottom: 20,
    },
    datesList: {
      fontFamily: "Poppins-Light",
      fontSize: 12,
    },
  });
};
