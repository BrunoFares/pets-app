import { AdaptiveText } from "@/components/AdaptiveText";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { PageHeader } from "@/components/PageHeader";
import { ProfileEmptyState } from "@/components/ProfileEmptyState";
import { colors } from "@/constants/colors";
import { useGlobal } from "@/contexts/GlobalProvider";
import {
  IllnessRecordModel,
  MedicationRecordModel,
  PetModel,
} from "@/data/models";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { presentApiError } from "@/lib/api-feedback";
import {
  fetchIllnessMedications,
  fetchPetIllnesses,
  parseRoutePayload,
} from "@/lib/profile-api";
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
  const [petId, setPetId] = useState<string>();
  const [illnesses, setIllnesses] = useState<IllnessRecordModel[]>([]);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [medications, setMedications] = useState<
    Record<string, MedicationRecordModel[]>
  >({});
  const [isLoading, setIsLoading] = useState(true);

  const loadIllnesses = useCallback(async (id: string) => {
    setIsLoading(true);

    try {
      const illnessResponse = await fetchPetIllnesses(id);
      setIllnesses(illnessResponse);

      const medicationEntries = await Promise.all(
        illnessResponse.map(async (illness) => [
          String(illness.Id),
          await fetchIllnessMedications(illness.Id),
        ]),
      );

      setMedications(Object.fromEntries(medicationEntries));
    } catch (error) {
      presentApiError("Unable to load illness history", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const parsed = parseRoutePayload<{ pet?: PetModel }>(payload);
    if (!parsed?.pet) {
      setPet(undefined);
      setPetId(undefined);
      setIllnesses([]);
      setMedications({});
      setIsLoading(false);
      return;
    }

    setPet(parsed.pet);
    setPetId(String(parsed.pet.Id));
    void loadIllnesses(String(parsed.pet.Id));
  }, [loadIllnesses, payload]);

  useFocusEffect(
    useCallback(() => {
      setShowFooter?.(false);

      if (petId) {
        void loadIllnesses(petId);
      }

      return () => {
        setShowFooter?.(true);
      };
    }, [loadIllnesses, petId, setShowFooter]),
  );

  const { isRefreshing, onRefresh } = usePullToRefresh(
    useCallback(async () => {
      if (petId) {
        await loadIllnesses(petId);
      }
    }, [loadIllnesses, petId]),
  );
  const showLoadingOverlay = isLoading && !isRefreshing;

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

    if (interval <= 0 || now < start) return false;

    if (datediff(start, now) % interval === 0) return true;
    return false;
  };

  const formatDate = (value?: Date | string | null) => {
    if (!value) return "-";

    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return "-";

    return date.toDateString();
  };

  const formatMedicationFrequency = (days: number) => {
    if (days <= 1) {
      return "Every day";
    }

    return `Every ${days} days`;
  };

  const formatMedicationTimes = (times: string[]) => {
    const cleanedTimes = times.map((time) => time.trim()).filter(Boolean);

    if (cleanedTimes.length === 0) {
      return "No reminder times added";
    }

    return cleanedTimes.join(" • ");
  };

  const getMedicationCourseLabel = (med: MedicationRecordModel) => {
    const startLabel = formatDate(med.startDate);
    const endLabel = med.endDate
      ? formatDate(med.endDate)
      : med.isActive
        ? "Ongoing"
        : "No end date";

    return `${startLabel} to ${endLabel}`;
  };

  const isIllnessOngoing = (item: IllnessRecordModel) => !item.curedDate;

  const renderMedicationRecordModel = (med: MedicationRecordModel) => {
    const isDueToday =
      med.isActive && isMedicationDay(med.startDate, med.frequencyInDays, new Date());
    const medicationStatusLabel = isDueToday
      ? "Due today"
      : med.isActive
        ? "Active"
        : "Inactive";

    return (
      <View key={med.Id} style={styles.medicationCard}>
        <View style={styles.medicationHeader}>
          <AdaptiveText style={styles.medicationName}>
            {med.medicationName}
          </AdaptiveText>

          <View
            style={[
              styles.medicationStatusBadge,
              isDueToday
                ? styles.medicationStatusDueToday
                : med.isActive
                  ? styles.medicationStatusActive
                  : styles.medicationStatusInactive,
            ]}
          >
            <AdaptiveText style={styles.medicationStatusText}>
              {medicationStatusLabel}
            </AdaptiveText>
          </View>
        </View>

        <View style={styles.medicationDetails}>
          <View style={styles.medicationDetailRow}>
            <AdaptiveText style={styles.medicationDetailLabel}>Dosage</AdaptiveText>
            <AdaptiveText style={styles.medicationDetailValue}>
              {med.dosage?.trim() || "Not recorded"}
            </AdaptiveText>
          </View>

          <View style={styles.medicationDetailRow}>
            <AdaptiveText style={styles.medicationDetailLabel}>Schedule</AdaptiveText>
            <AdaptiveText style={styles.medicationDetailValue}>
              {formatMedicationFrequency(med.frequencyInDays)}
            </AdaptiveText>
          </View>

          <View style={styles.medicationDetailRow}>
            <AdaptiveText style={styles.medicationDetailLabel}>Times</AdaptiveText>
            <AdaptiveText style={styles.medicationDetailValue}>
              {formatMedicationTimes(med.times)}
            </AdaptiveText>
          </View>

          <View style={styles.medicationDetailRow}>
            <AdaptiveText style={styles.medicationDetailLabel}>Course</AdaptiveText>
            <AdaptiveText style={styles.medicationDetailValue}>
              {getMedicationCourseLabel(med)}
            </AdaptiveText>
          </View>

          <View style={styles.medicationInstructionBlock}>
            <AdaptiveText style={styles.medicationDetailLabel}>
              How to take it
            </AdaptiveText>
            <AdaptiveText style={styles.medicationInstructionValue}>
              {med.instructions?.trim() || "No special instructions recorded yet."}
            </AdaptiveText>
          </View>
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
        refreshing={isRefreshing}
        onRefresh={onRefresh}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          isLoading ? null : (
            <ProfileEmptyState
              title="No illnesses recorded yet"
              subtitle="Keep track of past and ongoing medical conditions here."
            />
          )
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

                <View style={styles.infoRow}>
                  <View>
                    <AdaptiveText style={styles.datesLabel}>
                      Diagnosis Date
                    </AdaptiveText>
                    <AdaptiveText style={styles.datesList}>
                      {formatDate(item.diagnosisDate)}
                    </AdaptiveText>
                  </View>

                  <View style={styles.rightInfoBlock}>
                    <AdaptiveText style={styles.datesLabel}>
                      {isOngoing ? "Status" : "Cured Date"}
                    </AdaptiveText>
                    <AdaptiveText style={styles.datesList}>
                      {isOngoing ? "Still ongoing" : formatDate(item.curedDate)}
                    </AdaptiveText>
                  </View>
                </View>

                <View style={styles.summaryRow}>
                  <AdaptiveText style={styles.summaryText}>
                    {illnessMeds.length > 0
                      ? `${illnessMeds.length} medication${illnessMeds.length !== 1 ? "s" : ""}`
                      : "No medications added yet"}
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
                  <AdaptiveText style={styles.medicationsHeading}>
                    Medication plan
                  </AdaptiveText>
                  <AdaptiveText style={styles.medicationsSubheading}>
                    Dose, schedule, times, and instructions at a glance.
                  </AdaptiveText>

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
                      goTo(
                        { item: { ...item, medications: illnessMeds }, pet },
                        "/profile/modify-add-illness",
                        router,
                      );
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

      {showLoadingOverlay && <LoadingOverlay />}
    </SafeAreaView>
  );
};

export default IllnessesScreen;

const createStyles = ({ darkMode }: any) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: darkMode ? colors.veryDarkGrey : "#f7f4ee",
      gap: 8,
    },
    title: {
      fontSize: 26,
      alignSelf: "center",
      fontFamily: "Poppins-SemiBold",
      paddingHorizontal: 10,
      marginBottom: 12,
      textAlign: "center",
    },
    listContent: {
      paddingBottom: 28,
    },
    card: {
      alignSelf: "center",
      width: "92%",
      borderRadius: 20,
      marginBottom: 16,
      overflow: "hidden",
      backgroundColor: darkMode ? colors.averageDarkGrey : "#fcfbf7",
      shadowColor: colors.black,
      shadowOpacity: darkMode ? 0 : 0.05,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 6 },
      elevation: darkMode ? 0 : 1,
    },
    cardHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingTop: 16,
      paddingHorizontal: 18,
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
      backgroundColor: "rgba(7, 125, 39, 0.12)",
    },
    resolvedBadge: {
      backgroundColor: "rgba(140, 140, 140, 0.12)",
    },
    statusText: {
      fontSize: 11,
      fontFamily: "Poppins-Medium",
      color: darkMode ? colors.white : colors.veryDarkGrey,
    },
    infoRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: 18,
      paddingTop: 12,
      paddingBottom: 10,
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
      paddingHorizontal: 18,
      paddingBottom: 16,
    },
    summaryText: {
      fontFamily: "Poppins-Light",
      fontSize: 12,
      opacity: 0.72,
    },
    medicationsContent: {
      paddingHorizontal: 18,
      paddingTop: 4,
      paddingBottom: 18,
      backgroundColor: darkMode ? "rgba(255,255,255,0.015)" : "rgba(255,255,255,0.55)",
    },
    medicationsHeading: {
      fontFamily: "Poppins-SemiBold",
      fontSize: 15,
      marginBottom: 1,
    },
    medicationsSubheading: {
      fontFamily: "Poppins-Light",
      fontSize: 12,
      lineHeight: 17,
      opacity: 0.72,
      marginBottom: 10,
    },
    medicationCard: {
      gap: 10,
      paddingVertical: 14,
      paddingHorizontal: 14,
      marginBottom: 10,
      borderRadius: 16,
      backgroundColor: darkMode ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.76)",
    },
    medicationDetails: {
      gap: 10,
    },
    medicationHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: 10,
    },
    medicationStatusBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
    },
    medicationStatusDueToday: {
      backgroundColor: "rgba(7, 125, 39, 0.16)",
    },
    medicationStatusActive: {
      backgroundColor: darkMode
        ? "rgba(255,255,255,0.08)"
        : "rgba(29,29,29,0.06)",
    },
    medicationStatusInactive: {
      backgroundColor: "rgba(140, 140, 140, 0.12)",
    },
    medicationStatusText: {
      fontFamily: "Poppins-Medium",
      fontSize: 11,
      color: darkMode ? colors.white : colors.veryDarkGrey,
    },
    medicationDetailRow: {
      flexDirection: "column",
      alignItems: "flex-start",
      gap: 4,
    },
    medicationDetailLabel: {
      fontFamily: "Poppins-Medium",
      fontSize: 11,
      opacity: 0.56,
    },
    medicationDetailValue: {
      fontFamily: "Poppins-Regular",
      fontSize: 13,
      lineHeight: 19,
      opacity: 0.95,
    },
    medicationInstructionBlock: {
      gap: 4,
    },
    medicationInstructionValue: {
      fontFamily: "Poppins-Regular",
      fontSize: 13,
      lineHeight: 19,
      opacity: 0.92,
    },
    medicationName: {
      fontFamily: "Poppins-SemiBold",
      fontSize: 15,
      flex: 1,
    },
    noMedicationsText: {
      fontFamily: "Poppins-Light",
      fontSize: 12,
      opacity: 0.7,
      marginTop: 2,
      marginBottom: 4,
    },
    innerActionButton: {
      marginTop: 8,
      backgroundColor: colors.green,
      paddingVertical: 12,
      borderRadius: 14,
      alignItems: "center",
    },
    innerActionButtonText: {
      fontFamily: "Poppins-Medium",
      color: colors.white,
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
