import { AdaptiveText } from "@/components/AdaptiveText";
import { AdaptiveView } from "@/components/AdaptiveView";
import { PageHeader } from "@/components/PageHeader";
import { colors } from "@/constants/colors";
import { useGlobal } from "@/contexts/GlobalProvider";
import {
  IllnessRecordModel,
  MedicationRecordModel,
  PetModel,
} from "@/data/models";
import { IllnessRecords, MedicationRecords } from "@/data/sample";
import { datediff, goTo } from "@/utils";
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
  const [illnesses, setIllnesses] = useState<IllnessRecordModel[]>([]);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [medications, setMedications] = useState<
    Record<string, MedicationRecordModel[]>
  >({});

  useEffect(() => {
    if (!payload) return;

    let parsed: any = payload;
    if (typeof payload === "string") {
      try {
        parsed = JSON.parse(decodeURIComponent(payload));
      } catch {
        try {
          parsed = JSON.parse(payload);
        } catch {
          parsed = payload;
        }
      }
    }

    setPet(parsed.pet);

    const ill = IllnessRecords.filter((item) => item.petId === parsed.pet.Id);
    setIllnesses(ill);

    const medMap: Record<string, MedicationRecordModel[]> = {};
    for (const illness of ill) {
      medMap[illness.Id] = MedicationRecords.filter(
        (item: MedicationRecordModel) => item.illnessId === illness.Id,
      );
    }
    setMedications(medMap);
  }, [payload]);

  useFocusEffect(
    useCallback(() => {
      setShowFooter?.(false);
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

  const isMedicationDay = (
    startDate: Date,
    interval: number,
    today: Date,
  ): boolean => {
    const start = startDate.getTime();
    const now = today.getTime();

    if (datediff(start, now) % interval == 0) return true;
    return false;
  };

  const formatDate = (value?: Date | string | null) => {
    if (!value) return "-";

    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return "-";

    return date.toDateString();
  };

  const isIllnessOngoing = (item: IllnessRecordModel) => !item.curedDate;

  const renderMedicationRecordModel = (med: MedicationRecordModel) => {
    const formattedTime = med.times;

    return (
      <View key={med.Id} style={styles.medicationCard}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
          }}
        >
          <AdaptiveText style={styles.medicationName}>
            {med.medicationName}
          </AdaptiveText>

          {!!formattedTime && (
            <AdaptiveText
              style={{
                fontFamily: "Poppins-Light",
                fontSize: 14,
                marginTop: 2,
              }}
            >
              Next Due:{" "}
              {isMedicationDay(med.startDate, med.frequencyInDays, new Date())
                ? "Today, " + formattedTime[0]
                : ""}
            </AdaptiveText>
          )}
        </View>
        <View style={{ flexDirection: "row" }}>
          <View style={styles.medicationTextContainer}>
            {!!med.dosage && (
              <AdaptiveText style={styles.medicationMeta}>
                Dosage: {med.dosage}
              </AdaptiveText>
            )}

            {!!med.instructions && (
              <AdaptiveText style={styles.medicationMeta}>
                {med.instructions}
              </AdaptiveText>
            )}
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.takenButton}
            onPress={() => {
              // Later:
              // 1. mark med as taken for today
              // 2. cancel remaining reminders for this dose
              // 3. save confirmation state
            }}
          >
            <AdaptiveText style={styles.takenButtonText}>Taken</AdaptiveText>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <PageHeader title="" />

      <AdaptiveText style={styles.title}>
        {pet?.Name ? `${pet.Name}'s Illness History` : "Pet's Illness History"}
      </AdaptiveText>

      <FlatList
        data={illnesses}
        keyExtractor={(item) => String(item.Id)}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <AdaptiveText style={styles.emptyTitle}>
              No illnesses recorded yet
            </AdaptiveText>
            <AdaptiveText style={styles.emptySubtitle}>
              Keep track of past and ongoing medical conditions here.
            </AdaptiveText>
          </View>
        }
        renderItem={({ item }) => {
          const isExpanded = expandedIds.includes(item.Id);
          const illnessMeds = medications?.[item.Id] ?? [];
          const isOngoing = isIllnessOngoing(item);

          return (
            <View style={styles.card}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => toggleMedications(item.Id)}
              >
                <View style={styles.cardHeaderRow}>
                  <AdaptiveText style={styles.illnessTitle}>
                    {item.illnessName}
                  </AdaptiveText>

                  <View
                    style={[
                      styles.statusBadge,
                      isOngoing ? styles.ongoingBadge : styles.resolvedBadge,
                    ]}
                  >
                    <AdaptiveText style={styles.statusText}>
                      {isOngoing ? "Ongoing" : "Resolved"}
                    </AdaptiveText>
                  </View>
                </View>

                <AdaptiveView style={styles.infoRow}>
                  <AdaptiveView>
                    <AdaptiveText style={styles.datesLabel}>
                      Diagnosis Date
                    </AdaptiveText>
                    <AdaptiveText style={styles.datesList}>
                      {formatDate(item.diagnosisDate)}
                    </AdaptiveText>
                  </AdaptiveView>

                  <AdaptiveView style={styles.rightInfoBlock}>
                    <AdaptiveText style={styles.datesLabel}>
                      {isOngoing ? "Status" : "Cured Date"}
                    </AdaptiveText>
                    <AdaptiveText style={styles.datesList}>
                      {isOngoing ? "Still ongoing" : formatDate(item.curedDate)}
                    </AdaptiveText>
                  </AdaptiveView>
                </AdaptiveView>

                <View style={styles.summaryRow}>
                  <AdaptiveText style={styles.summaryText}>
                    {illnessMeds.length} medication
                    {illnessMeds.length !== 1 ? "s" : ""}
                  </AdaptiveText>

                  <AntDesign
                    name={isExpanded ? "up" : "down"}
                    size={12}
                    color={darkMode ? colors.white : colors.veryDarkGrey}
                  />
                </View>
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.medicationsContent}>
                  {illnessMeds.length > 0 ? (
                    illnessMeds.map(renderMedicationRecordModel)
                  ) : (
                    <AdaptiveText style={styles.noMedicationsText}>
                      No medications added.
                    </AdaptiveText>
                  )}

                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={styles.innerActionButton}
                    onPress={() => {
                      goTo({ item }, "/profile/modify-add-illness", router);
                    }}
                  >
                    <AdaptiveText style={styles.innerActionButtonText}>
                      Add Medication / Edit Illness
                    </AdaptiveText>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        }}
      />

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => {
          goTo({ pet }, "/profile/modify-add-illness", router);
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
    listContent: {
      paddingBottom: 20,
    },
    emptyState: {
      marginTop: 60,
      paddingHorizontal: 24,
      alignItems: "center",
      justifyContent: "center",
    },
    emptyTitle: {
      fontFamily: "Poppins-SemiBold",
      fontSize: 18,
      textAlign: "center",
      marginBottom: 6,
    },
    emptySubtitle: {
      fontFamily: "Poppins-Light",
      fontSize: 14,
      opacity: 0.8,
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
      backgroundColor: darkMode ? colors.veryDarkGrey : colors.white,
    },
    cardHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingTop: 12,
      paddingHorizontal: 20,
      gap: 12,
    },
    illnessTitle: {
      fontFamily: "Poppins-SemiBold",
      fontSize: 17,
      flex: 1,
    },
    statusBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
    },
    ongoingBadge: {
      backgroundColor: "rgba(0, 180, 80, 0.18)",
    },
    resolvedBadge: {
      backgroundColor: "rgba(160, 160, 160, 0.18)",
    },
    statusText: {
      fontSize: 11,
      fontFamily: "Poppins-Medium",
      color: darkMode ? colors.white : colors.veryDarkGrey,
    },
    infoRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingTop: 10,
      paddingBottom: 12,
      gap: 12,
    },
    rightInfoBlock: {
      alignItems: "flex-end",
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
    summaryRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingBottom: 14,
    },
    summaryText: {
      fontFamily: "Poppins-Light",
      fontSize: 12,
      opacity: 0.8,
    },
    medicationsContent: {
      paddingHorizontal: 20,
      paddingTop: 10,
      paddingBottom: 16,
      backgroundColor: darkMode ? colors.darkGrey : "#f7f7f7",
      borderTopWidth: darkMode ? 1 : 0,
      borderTopColor: colors.darkGrey,
    },
    medicationCard: {
      justifyContent: "space-between",
      alignItems: "center",
      gap: 12,
      paddingVertical: 2,
      borderBottomWidth: 1,
      borderBottomColor: colors.darkGrey,
    },
    medicationTextContainer: {
      flex: 1,
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
    reminderText: {
      fontFamily: "Poppins-Light",
      fontSize: 11,
      marginTop: 4,
      opacity: 0.75,
    },
    noMedicationsText: {
      fontFamily: "Poppins-Light",
      fontSize: 12,
      opacity: 0.7,
    },
    takenButton: {
      backgroundColor: colors.green,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 10,
      alignSelf: "center",
    },
    takenButtonText: {
      fontFamily: "Poppins-Medium",
      fontSize: 12,
      color: colors.white,
    },
    innerActionButton: {
      marginTop: 14,
      backgroundColor: colors.green,
      paddingVertical: 10,
      borderRadius: 10,
      alignItems: "center",
    },
    innerActionButtonText: {
      fontFamily: "Poppins-Medium",
      color: colors.white,
    },
    innerSecondaryButton: {
      marginTop: 8,
      paddingVertical: 10,
      borderRadius: 10,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.darkGrey,
    },
    innerSecondaryButtonText: {
      fontFamily: "Poppins-Medium",
      color: darkMode ? colors.white : colors.veryDarkGrey,
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
