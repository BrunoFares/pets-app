import { AdaptiveText } from "@/components/AdaptiveText";
import { AdaptiveView } from "@/components/AdaptiveView";
import { PageHeader } from "@/components/PageHeader";
import { colors } from "@/constants/colors";
import { useGlobal } from "@/contexts/GlobalProvider";
import { IllnessRecordModel, PetModel } from "@/data/models";
import { IllnessRecords, MedicationRecords } from "@/data/sample";
import { goTo } from "@/utils";
import { AntDesign, Feather } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  LayoutAnimation,
  Platform,
  StyleSheet,
  TouchableOpacity,
  UIManager,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const IllnessesScreen = () => {
  const router = useRouter();
  const darkMode = useColorScheme() === "dark";
  const styles = createStyles({ darkMode });
  const { setShowFooter } = useGlobal();
  const { payload } = useLocalSearchParams<{ payload?: any }>();

  const [pet, setPet] = useState<PetModel>();
  const [illnesses, setIllnesses] = useState<IllnessRecordModel[]>();
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [medications, setMedications] = useState<Record<string, any[]>>();

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
          parsed = payload;
        }
      }
    }

    setPet(parsed.pet);
    const ill = IllnessRecords.filter((item) => item.petId === parsed.pet.Id);
    setIllnesses(ill);

    if (ill && ill.length) {
      const med: Record<string, any[]> = {};
      for (const illness of ill) {
        med[illness.Id] = MedicationRecords.filter(
          (item) => item.Id === illness.Id,
        );
      }
      setMedications(med);
      console.log(medications);
    }
  }, [payload]);

  useFocusEffect(
    useCallback(() => {
      setShowFooter?.(false);

      return () => {
        setShowFooter?.(true);
      };
    }, []),
  );

  const toggleMedications = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    setExpandedIds((prev) =>
      prev.includes(id)
        ? prev.filter((itemId) => itemId !== id)
        : [...prev, id],
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <PageHeader title="" />

      <AdaptiveText style={styles.title}>Pet's Illness History</AdaptiveText>

      <FlatList
        data={illnesses}
        keyExtractor={(item) => String(item.Id)}
        contentContainerStyle={{ paddingBottom: 20 }}
        renderItem={({ item }) => {
          const isExpanded = expandedIds.includes(item.Id);

          return (
            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.card}
              onPress={() => {
                goTo({ item }, "/profile/modify-add-illness", router);
              }}
            >
              <AdaptiveText style={styles.illnessTitle}>
                {item.illnessName}
              </AdaptiveText>

              <AdaptiveView style={styles.infoRow}>
                <AdaptiveView>
                  <AdaptiveText style={styles.datesLabel}>
                    Diagnosis Date
                  </AdaptiveText>
                  <AdaptiveText style={styles.datesList}>
                    {item.diagnosisDate?.toDateString()}
                  </AdaptiveText>
                </AdaptiveView>

                <AdaptiveView>
                  <AdaptiveText style={styles.datesLabel}>
                    Cured Date
                  </AdaptiveText>
                  <AdaptiveText style={styles.datesList}>
                    {item.curedDate?.toDateString()}
                  </AdaptiveText>
                </AdaptiveView>
              </AdaptiveView>

              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.medicationsHeader,
                  isExpanded && styles.medicationsHeaderExpanded,
                ]}
                onPress={(e) => {
                  e.stopPropagation();
                  toggleMedications(item.Id);
                }}
              >
                <AntDesign
                  name={isExpanded ? "up" : "down"}
                  size={10}
                  style={{ paddingRight: 16 }}
                  color={darkMode ? colors.white : colors.veryDarkGrey}
                />
                <AdaptiveText>Medications</AdaptiveText>
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.medicationsContent}>
                  {medications &&
                  item.medicationsId &&
                  item.medicationsId.length > 0 ? (
                    medications[item.Id].map((med: any, index: number) => (
                      <View key={index}>
                        <AdaptiveText style={styles.medicationName}>
                          {med.medicationName}
                        </AdaptiveText>
                        {!!med.dosage && (
                          <AdaptiveText style={styles.medicationMeta}>
                            Dosage: {med.dosage}
                          </AdaptiveText>
                        )}
                        {!!med.frequency && (
                          <AdaptiveText style={styles.medicationMeta}>
                            Frequency: {med.frequency}
                          </AdaptiveText>
                        )}
                      </View>
                    ))
                  ) : (
                    <AdaptiveText style={styles.noMedicationsText}>
                      No medications added.
                    </AdaptiveText>
                  )}
                </View>
              )}
            </TouchableOpacity>
          );
        }}
      />

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => {
          goTo("", "/profile/modify-add-illness", router);
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

export default IllnessesScreen;

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
    card: {
      alignSelf: "center",
      width: "90%",
      borderColor: colors.darkGrey,
      borderWidth: 1,
      borderRadius: 14,
      marginBottom: 12,
      overflow: "hidden",
    },
    illnessTitle: {
      fontFamily: "Poppins-SemiBold",
      fontSize: 17,
      paddingTop: 10,
      paddingHorizontal: 20,
    },
    infoRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingBottom: 12,
    },
    datesLabel: {
      fontFamily: "Poppins-Light",
      fontSize: 12,
      opacity: 0.7,
    },
    datesList: {
      fontFamily: "Poppins-Light",
      fontSize: 12,
    },
    medicationsHeader: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 8,
      backgroundColor: colors.mildDarkGrey,
    },
    medicationsHeaderExpanded: {
      borderBottomWidth: darkMode ? 1 : 0,
      borderBottomColor: colors.darkGrey,
    },
    medicationsContent: {
      paddingHorizontal: 20,
      paddingVertical: 8,
      backgroundColor: darkMode ? colors.darkGrey : "#f7f7f7",
    },
    medicationName: {
      fontFamily: "Poppins-Medium",
      fontSize: 14,
    },
    medicationMeta: {
      fontFamily: "Poppins-Light",
      fontSize: 12,
      marginTop: 2,
    },
    noMedicationsText: {
      fontFamily: "Poppins-Light",
      fontSize: 12,
      opacity: 0.7,
    },
    addButton: {
      alignSelf: "center",
      backgroundColor: colors.green,
      padding: 14,
      borderRadius: 18,
      marginBottom: 20,
    },
  });
};
