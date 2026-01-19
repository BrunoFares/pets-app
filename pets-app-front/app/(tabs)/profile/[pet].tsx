import { AdaptiveText } from "@/components/AdaptiveText";
import { AdaptiveView } from "@/components/AdaptiveView";
import CustomImage from "@/components/CustomImage";
import { PageHeader } from "@/components/PageHeader";
import { colors } from "@/constants/colors";
import { useGlobal } from "@/contexts/GlobalProvider";
import { ConsultationModel, PetModel } from "@/data/models";
import { Consultations } from "@/data/sample";
import { calculateAge, goTo } from "@/utils";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Pet = () => {
  const router = useRouter();
  const darkMode = useColorScheme() === "dark";
  const styles = createStyles({ darkMode });
  const { setShowFooter } = useGlobal();
  const { payload } = useLocalSearchParams<{ payload?: any }>();
  const [pet, setPet] = useState<PetModel>();
  const [consultations, setConsultations] = useState<ConsultationModel[]>();

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

    const cons = Consultations.filter((item) => item.PetId === parsed.Id);
    setConsultations(cons);

    setPet(parsed);
  }, [payload]);

  useFocusEffect(
    useCallback(() => {
      setShowFooter?.(false);

      return () => {
        setShowFooter?.(true);
      };
    }, []),
  );

  if (pet) {
    return (
      <SafeAreaView style={styles.container}>
        <PageHeader title="" />
        <FlatList
          data={consultations}
          keyExtractor={(item) => String(item.Id)}
          ListHeaderComponent={
            <>
              <AdaptiveView style={styles.header}>
                <CustomImage />
                <AdaptiveText style={styles.title}>{pet.Name}</AdaptiveText>
                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={() => goTo({}, "/profile/edit-pet", router)}
                >
                  <AdaptiveText style={styles.editBtnTxt}>Edit</AdaptiveText>
                </TouchableOpacity>
              </AdaptiveView>

              <AdaptiveView style={styles.table}>
                <AdaptiveView style={styles.centralRow}>
                  <AdaptiveView
                    style={[
                      styles.tableUnit,
                      {
                        borderRightWidth: 1,
                        borderBottomWidth: 1,
                      },
                    ]}
                  >
                    <AdaptiveText style={styles.tableUnitTxt}>
                      {calculateAge(new Date(pet.BirthDate))}
                    </AdaptiveText>
                    <AdaptiveText style={styles.tableUnitInfo}>
                      years old
                    </AdaptiveText>
                  </AdaptiveView>

                  <AdaptiveView
                    style={[
                      styles.tableUnit,
                      {
                        borderLeftWidth: 1,
                        borderBottomWidth: 1,
                      },
                    ]}
                  >
                    <Ionicons
                      name={pet.Sex}
                      size={48}
                      color={darkMode ? colors.white : colors.black}
                      style={{ paddingVertical: 24 }}
                    />
                    <AdaptiveText style={styles.tableUnitInfo}>
                      sex
                    </AdaptiveText>
                  </AdaptiveView>
                </AdaptiveView>
                <AdaptiveView style={styles.centralRow}>
                  <AdaptiveView
                    style={[
                      styles.tableUnit,
                      {
                        borderRightWidth: 1,
                        borderTopWidth: 1,
                      },
                    ]}
                  >
                    <AdaptiveText style={styles.tableUnitTxt}>
                      {pet.Breed}
                    </AdaptiveText>
                    <AdaptiveText style={styles.tableUnitInfo}>
                      breed
                    </AdaptiveText>
                  </AdaptiveView>

                  <AdaptiveView
                    style={[
                      styles.tableUnit,
                      {
                        borderLeftWidth: 1,
                        borderTopWidth: 1,
                      },
                    ]}
                  >
                    <AdaptiveText style={styles.tableUnitTxt}>
                      {pet.Color}
                    </AdaptiveText>
                    <AdaptiveText style={styles.tableUnitInfo}>
                      colour
                    </AdaptiveText>
                  </AdaptiveView>
                </AdaptiveView>
              </AdaptiveView>

              <AdaptiveText style={styles.consTitle}>
                Consultations
              </AdaptiveText>
            </>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.consultation}
              onPress={() => {
                goTo("", "/profile/consultation", router);
              }}
            >
              <AdaptiveText>{item.Date.toDateString()}</AdaptiveText>
            </TouchableOpacity>
          )}
        />
      </SafeAreaView>
    );
  } else {
    return (
      <SafeAreaView style={styles.container}>
        <PageHeader title="" />
        <AdaptiveView style={styles.container}>
          <AdaptiveText>Pet unavailable.</AdaptiveText>
        </AdaptiveView>
      </SafeAreaView>
    );
  }
};

export default Pet;

const createStyles = ({ darkMode }: any) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: darkMode ? colors.veryDarkGrey : colors.white,
      alignItems: "center",
      gap: 10,
    },
    header: {
      alignItems: "center",
      gap: 10,
      marginBottom: 30,
    },
    title: {
      fontSize: 26,
      fontFamily: "Poppins-SemiBold",
    },
    centralRow: {
      flexDirection: "row",
      justifyContent: "center",
      height: 140,
    },
    table: {
      height: 310,
      width: "100%",
    },
    tableUnitInfo: {
      flex: 1,
      textAlign: "center",
      fontSize: 14,
      color: darkMode ? colors.lightGrey : colors.darkGrey,
      fontFamily: "Poppins-Light",
      paddingBottom: 10,
    },
    tableUnitTxt: {
      fontSize: 28,
      textAlign: "center",
      paddingVertical: 30,
      fontFamily: "Poppins-SemiBold",
      // paddingHorizontal: 30
    },
    tableUnit: {
      width: "45%",
      justifyContent: "center",
      alignItems: "center",
      borderColor: darkMode ? colors.darkGrey : colors.lightGrey,
    },
    consTitle: {
      marginLeft: "5%",
      fontSize: 16,
      fontFamily: "Poppins-Bold",
    },
    consultation: {
      marginHorizontal: "5%",
      marginTop: 10,
      fontSize: 16,
      paddingHorizontal: 20,
      paddingVertical: 10,
      backgroundColor: darkMode ? colors.darkGrey : colors.lightGrey,
      borderRadius: 10,
    },
    editBtn: {
      backgroundColor: darkMode ? colors.darkGrey : colors.lightGrey,
      paddingHorizontal: 18,
      paddingVertical: 6,
      borderRadius: 8,
    },
    editBtnTxt: {
      fontSize: 16,
    },
  });
};
