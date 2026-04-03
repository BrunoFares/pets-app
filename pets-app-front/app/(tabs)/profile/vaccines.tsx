import { AdaptiveText } from "@/components/AdaptiveText";
import { PageHeader } from "@/components/PageHeader";
import { colors } from "@/constants/colors";
import { useGlobal } from "@/contexts/GlobalProvider";
import { PetModel, VaccineRecordModel } from "@/data/models";
import { VaccineRecords } from "@/data/sample";
import { goTo } from "@/utils";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
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
  const [vaccines, setVaccines] = useState<VaccineRecordModel[]>();
  const [pet, setPet] = useState<PetModel>();

  useEffect(() => {
    if (!payload) return;

    let parsed: any = payload;
    if (typeof payload === "string") {
      try {
        parsed = JSON.parse(decodeURIComponent(payload));
      } catch (e) {
        try {
          parsed = JSON.parse(payload);
        } catch (e2) {
          // keep as string if parsing fails
          parsed = payload;
        }
      }
    }

    setPet(parsed.pet);
    const vax = VaccineRecords.filter((item) => item.petId === parsed.pet.Id);
    setVaccines(vax);
  }, [payload]);

  useFocusEffect(
    useCallback(() => {
      setShowFooter?.(false);

      return () => {
        setShowFooter?.(true);
      };
    }, []),
  );

  return (
    <SafeAreaView style={styles.container}>
      <PageHeader title="" />

      <AdaptiveText style={styles.title}>
        Kalinka's Vaccination Record
      </AdaptiveText>

      <FlatList
        data={vaccines}
        keyExtractor={(item) => String(item.Id)}
        renderItem={({ item }) => (
          <>
            <TouchableOpacity
              onPress={() => {
                goTo({ item }, "/profile/modify-add-vaccine", router);
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
          goTo("", "/profile/modify-add-vaccine", router);
        }}
      >
        <Feather
          name="plus"
          size={34}
          color={darkMode ? colors.white : colors.black}
        />
      </TouchableOpacity>
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
    datesList: {
      fontFamily: "Poppins-Light",
      fontSize: 12,
    },
  });
};
