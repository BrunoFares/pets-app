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

  const getMedicationStatusMeta = (med: MedicationRecordModel) => {
    const isDueToday =
      med.isActive &&
      isMedicationDay(med.startDate, med.frequencyInDays, new Date());
    const primaryReminderTime = med.times
      .map((time) => time.trim())
      .find(Boolean);

    if (isDueToday) {
      return {
        label: "Due Today",
        supportingLabel: primaryReminderTime
          ? `Take it today at ${primaryReminderTime}`
          : "Scheduled for today",
        tone: "due" as const,
      };
    }

    if (med.isActive) {
      return {
        label: "Active",
        supportingLabel: med.reminderEnabled ? "Reminders on" : "Reminders off",
        tone: "active" as const,
      };
    }

    return {
      label: "Inactive",
      supportingLabel: med.endDate
        ? `Last scheduled ${formatDate(med.endDate)}`
        : "Not currently being taken",
      tone: "inactive" as const,
    };
  };

  const renderMedicationRecordModel = (med: MedicationRecordModel) => {
    const medicationStatus = getMedicationStatusMeta(med);
    const medicationStatusBadgeStyle =
      medicationStatus.tone === "due"
        ? styles.medicationStatusBadgeDue
        : medicationStatus.tone === "active"
          ? styles.medicationStatusBadgeActive
          : styles.medicationStatusBadgeInactive;
    const medicationStatusTextStyle =
      medicationStatus.tone === "due"
        ? styles.medicationStatusTextDue
        : medicationStatus.tone === "active"
          ? styles.medicationStatusTextActive
          : styles.medicationStatusTextInactive;

    return (
      <View key={med.Id} style={styles.medicationCard}>
        <View style={styles.medicationTopRow}>
          <View style={styles.medicationHeadingBlock}>
            <AdaptiveText style={styles.medicationName}>
              {med.medicationName}
            </AdaptiveText>

            <AdaptiveText style={styles.medicationSupportText}>
              {medicationStatus.supportingLabel}
            </AdaptiveText>
          </View>

          <View
            style={[styles.medicationStatusBadge, medicationStatusBadgeStyle]}
          >
            <AdaptiveText
              style={[styles.medicationStatusText, medicationStatusTextStyle]}
            >
              {medicationStatus.label}
            </AdaptiveText>
          </View>
        </View>

        <View style={styles.medicationChipRow}>
          <View style={styles.medicationChip}>
            <AdaptiveText style={styles.medicationChipText}>
              Dose · {med.dosage?.trim() || "Not recorded"}
            </AdaptiveText>
          </View>

          <View style={styles.medicationChip}>
            <AdaptiveText style={styles.medicationChipText}>
              Schedule · {formatMedicationFrequency(med.frequencyInDays)}
            </AdaptiveText>
          </View>

          <View style={styles.medicationChip}>
            <AdaptiveText style={styles.medicationChipText}>
              Reminders · {med.reminderEnabled ? "On" : "Off"}
            </AdaptiveText>
          </View>
        </View>

        <View style={styles.medicationDetailsStack}>
          <View style={styles.medicationDetailRow}>
            <AdaptiveText style={styles.medicationDetailLabel}>
              Reminder times
            </AdaptiveText>
            <AdaptiveText style={styles.medicationDetailValue}>
              {formatMedicationTimes(med.times)}
            </AdaptiveText>
          </View>

          <View style={styles.medicationDetailRow}>
            <AdaptiveText style={styles.medicationDetailLabel}>
              Course
            </AdaptiveText>
            <AdaptiveText style={styles.medicationDetailValue}>
              {getMedicationCourseLabel(med)}
            </AdaptiveText>
          </View>

          <View style={styles.medicationInstructionBlock}>
            <AdaptiveText style={styles.medicationDetailLabel}>
              Instructions
            </AdaptiveText>
            <AdaptiveText style={styles.medicationInstructionValue}>
              {med.instructions?.trim() ||
                "No special instructions recorded yet."}
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
          const dueTodayCount = illnessMeds.filter(
            (med) =>
              med.isActive &&
              isMedicationDay(med.startDate, med.frequencyInDays, new Date()),
          ).length;

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
                      ? `${illnessMeds.length} medication${illnessMeds.length !== 1 ? "s" : ""}${dueTodayCount > 0 ? ` • ${dueTodayCount} due today` : ""}`
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
                  <View style={styles.medicationsHeaderRow}>
                    <AdaptiveText style={styles.medicationsHeaderTitle}>
                      Medications
                    </AdaptiveText>
                    <AdaptiveText style={styles.medicationsHeaderCount}>
                      {illnessMeds.length > 0
                        ? `${illnessMeds.length} tracked`
                        : "Nothing tracked yet"}
                    </AdaptiveText>
                  </View>

                  {illnessMeds.length > 0 ? (
                    illnessMeds.map(renderMedicationRecordModel)
                  ) : (
                    <View style={styles.noMedicationsCard}>
                      <AdaptiveText style={styles.noMedicationsText}>
                        No medications have been added for this illness yet.
                      </AdaptiveText>
                    </View>
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
                      Manage Illness & Medications
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
      paddingBottom: 28,
    },
    card: {
      alignSelf: "center",
      width: "90%",
      borderRadius: 20,
      marginBottom: 16,
      overflow: "hidden",
      backgroundColor: darkMode ? colors.averageDarkGrey : "#fcfbf7",
      shadowColor: colors.black,
      shadowOpacity: darkMode ? 0 : 0.04,
      shadowRadius: 14,
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
      opacity: 0.8,
    },
    medicationsContent: {
      paddingHorizontal: 18,
      paddingTop: 8,
      paddingBottom: 16,
      backgroundColor: darkMode
        ? "rgba(255,255,255,0.02)"
        : "rgba(255,255,255,0.58)",
    },
    medicationsHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 10,
      gap: 12,
    },
    medicationsHeaderTitle: {
      fontFamily: "Poppins-SemiBold",
      fontSize: 14,
    },
    medicationsHeaderCount: {
      fontFamily: "Poppins-Light",
      fontSize: 12,
      opacity: 0.75,
      textAlign: "right",
    },
    medicationCard: {
      gap: 12,
      padding: 14,
      marginBottom: 10,
      borderRadius: 16,
      backgroundColor: darkMode
        ? "rgba(255,255,255,0.035)"
        : "rgba(255,255,255,0.78)",
    },
    medicationTopRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      width: "100%",
      gap: 12,
    },
    medicationName: {
      fontFamily: "Poppins-Medium",
      fontSize: 15,
    },
    medicationHeadingBlock: {
      flex: 1,
      gap: 4,
    },
    medicationSupportText: {
      fontFamily: "Poppins-Light",
      fontSize: 12,
      opacity: 0.68,
      lineHeight: 18,
    },
    medicationStatusBadge: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      alignSelf: "flex-start",
    },
    medicationStatusBadgeDue: {
      backgroundColor: darkMode ? "rgba(242, 168, 151, 0.18)" : "#fde7de",
    },
    medicationStatusBadgeActive: {
      backgroundColor: darkMode ? "rgba(135, 179, 150, 0.2)" : "#e3f2e7",
    },
    medicationStatusBadgeInactive: {
      backgroundColor: darkMode ? "rgba(228, 228, 228, 0.12)" : "#ececec",
    },
    medicationStatusText: {
      fontFamily: "Poppins-Medium",
      fontSize: 11,
    },
    medicationStatusTextDue: {
      color: darkMode ? "#ffd0c3" : "#a8563d",
    },
    medicationStatusTextActive: {
      color: darkMode ? "#cce7d3" : "#24603a",
    },
    medicationStatusTextInactive: {
      color: darkMode ? "#e4e4e4" : "#5f5f5f",
    },
    medicationChipRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    medicationChip: {
      paddingHorizontal: 10,
      paddingVertical: 7,
      borderRadius: 999,
      backgroundColor: darkMode
        ? "rgba(255,255,255,0.06)"
        : "rgba(7,125,39,0.08)",
    },
    medicationChipText: {
      fontFamily: "Poppins-Medium",
      fontSize: 11,
      opacity: 0.82,
    },
    medicationDetailsStack: {
      gap: 10,
    },
    medicationDetailRow: {
      gap: 3,
    },
    medicationDetailLabel: {
      fontFamily: "Poppins-Medium",
      fontSize: 11,
      opacity: 0.56,
    },
    medicationDetailValue: {
      fontFamily: "Poppins-Light",
      fontSize: 12,
      lineHeight: 18,
    },
    medicationInstructionBlock: {
      marginTop: 2,
      gap: 4,
    },
    medicationInstructionValue: {
      fontFamily: "Poppins-Light",
      fontSize: 12,
      lineHeight: 18,
      opacity: 0.9,
    },
    noMedicationsCard: {
      padding: 14,
      borderRadius: 16,
      backgroundColor: darkMode
        ? "rgba(255,255,255,0.035)"
        : "rgba(255,255,255,0.75)",
    },
    noMedicationsText: {
      fontFamily: "Poppins-Light",
      fontSize: 12,
      opacity: 0.68,
      lineHeight: 18,
    },
    innerActionButton: {
      marginTop: 14,
      backgroundColor: darkMode
        ? "rgba(135,179,150,0.16)"
        : "rgba(7,125,39,0.10)",
      paddingVertical: 10,
      borderRadius: 999,
      alignItems: "center",
    },
    innerActionButtonText: {
      fontFamily: "Poppins-Medium",
      color: darkMode ? "#d4edd9" : colors.green,
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
