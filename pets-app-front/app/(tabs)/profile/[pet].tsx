import { AdaptiveText } from "@/components/AdaptiveText";
import { AdaptiveView } from "@/components/AdaptiveView";
import CustomImage from "@/components/CustomImage";
import { PageHeader } from "@/components/PageHeader";
import { colors } from "@/constants/colors";
import { useGlobal } from "@/contexts/GlobalProvider";
import { ConsultationModel, PetModel } from "@/data/models";
import { Consultations } from "@/data/sample";
import { calculateAge, goTo } from "@/utils";
import { Entypo, Feather, FontAwesome5, Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
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
              <View style={styles.header}>
                <CustomImage />
                <AdaptiveText style={styles.title}>{pet.Name}</AdaptiveText>
                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={() => goTo({}, "/profile/edit-pet", router)}
                >
                  <AdaptiveText style={styles.editBtnTxt}>Edit</AdaptiveText>
                </TouchableOpacity>
              </View>

              <View style={styles.table}>
                <View style={styles.centralRow}>
                  <View
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
                  </View>

                  <View
                    style={[
                      styles.tableUnit,
                      {
                        borderLeftWidth: 1,
                        borderBottomWidth: 1,
                      },
                    ]}
                  >
                    <Ionicons
                      name={pet.Sex.toLowerCase()}
                      size={48}
                      color={darkMode ? colors.white : colors.black}
                      style={{ paddingVertical: 24 }}
                    />
                    <AdaptiveText style={styles.tableUnitInfo}>
                      sex
                    </AdaptiveText>
                  </View>
                </View>
                <View style={styles.centralRow}>
                  <View
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
                  </View>

                  <View
                    style={[
                      styles.tableUnit,
                      {
                        borderLeftWidth: 1,
                        borderTopWidth: 1,
                      },
                    ]}
                  >
                    <AdaptiveText style={styles.tableUnitTxt}>
                      {pet.WeightKg} Kg
                    </AdaptiveText>
                    <AdaptiveText style={styles.tableUnitInfo}>
                      weight
                    </AdaptiveText>
                  </View>
                </View>

                <View style={styles.centralRow}>
                  <View
                    style={[
                      styles.tableUnit,
                      {
                        borderRightWidth: 1,
                        borderTopWidth: 1,
                      },
                    ]}
                  >
                    <AdaptiveText style={styles.tableUnitTxt}>
                      {pet.Neutered ? "Yes" : "No"}
                    </AdaptiveText>
                    <AdaptiveText style={styles.tableUnitInfo}>
                      Kalinka is {!pet.Neutered && "Not"}neutered.
                    </AdaptiveText>
                  </View>

                  <View
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
                  </View>
                </View>
              </View>

              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: 10,
                  alignItems: "center",
                }}
              >
                <AdaptiveText style={styles.consTitle}>
                  Consultations
                </AdaptiveText>
                <TouchableOpacity
                  style={{
                    backgroundColor: darkMode
                      ? colors.darkGrey
                      : colors.lightGrey,
                    marginRight: "5%",
                    borderRadius: 20,
                    padding: 5,
                  }}
                  onPress={() => goTo("", "/profile/add-consultation", router)}
                >
                  <Feather
                    name="plus"
                    size={20}
                    color={darkMode ? colors.white : colors.black}
                  />
                </TouchableOpacity>
              </View>
            </>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.consultation}
              onPress={() => {
                const deliverable = { item, pet };
                goTo(deliverable, "/profile/consultation", router);
              }}
            >
              <AdaptiveText>{item.Date.toDateString()}</AdaptiveText>
            </TouchableOpacity>
          )}
          ListFooterComponent={
            <>
              <AdaptiveText style={[styles.consTitle, { marginTop: 20 }]}>
                Medical Information
              </AdaptiveText>
              <View
                style={{
                  width: "90%",
                  flexDirection: "row",
                  alignSelf: "center",
                  gap: 14,
                  marginBottom: 20,
                  backgroundColor: darkMode
                    ? colors.veryDarkGrey
                    : colors.white,
                }}
              >
                <TouchableOpacity
                  onPress={() => {
                    goTo({ pet }, "/profile/illnesses", router);
                  }}
                  style={styles.vaccinesBtn}
                >
                  <Entypo
                    name="squared-cross"
                    size={32}
                    style={{
                      transform: [{ rotate: "45deg" }],
                      marginBottom: 4,
                    }}
                    color={darkMode ? colors.white : colors.black}
                  />
                  <Text style={styles.vaccinesBtnText}>Illness History</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.vaccinesBtn}
                  onPress={() => {
                    goTo({ pet }, "/profile/vaccines", router);
                  }}
                >
                  <FontAwesome5
                    name="syringe"
                    size={32}
                    style={{ marginBottom: 4 }}
                    color={darkMode ? colors.white : colors.black}
                  />
                  <AdaptiveText style={styles.vaccinesBtnText}>
                    Vaccination Record
                  </AdaptiveText>
                </TouchableOpacity>
              </View>
            </>
          }
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
      backgroundColor: darkMode ? colors.veryDarkGrey : colors.white,
    },
    title: {
      fontSize: 26,
      fontFamily: "Poppins-SemiBold",
    },
    centralRow: {
      flexDirection: "row",
      justifyContent: "center",
      height: 140,
      backgroundColor: darkMode ? colors.veryDarkGrey : colors.white,
    },
    table: {
      height: 450,
      width: "100%",
    },
    tableUnitInfo: {
      flex: 1,
      textAlign: "center",
      fontSize: 14,
      // color: darkMode ? colors.lightGrey : colors.darkGrey,
      color: darkMode ? colors.white : colors.green,
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
    vaccinesBtn: {
      flex: 1,
      alignItems: "center",
      alignSelf: "center",
      paddingVertical: 15,
      borderRadius: 20,
      paddingHorizontal: 40,
      marginTop: 20,
      backgroundColor: darkMode ? colors.darkGrey : colors.lightGrey,
    },
    vaccinesBtnText: {
      fontFamily: "Poppins-Medium",
      fontSize: 12,
      textAlign: "center",
      color: darkMode ? colors.white : colors.black,
    },
  });
};
