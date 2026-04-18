import { AdaptiveText } from "@/components/AdaptiveText";
import { AdaptiveView } from "@/components/AdaptiveView";
import CustomImage from "@/components/CustomImage";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { ProfileEmptyState } from "@/components/ProfileEmptyState";
import { colors } from "@/constants/colors";
import { useAuth } from "@/contexts/AuthProvider";
import { useGlobal } from "@/contexts/GlobalProvider";
import { PlaceModel } from "@/data/models";
import { useHeaderSlide } from "@/hooks/useHeaderSlide";
import { fetchCharityOrganisations } from "@/lib/discovery-api";
import {
  fetchDueVaccines,
  fetchMedicationReminders,
  fetchOngoingIllnesses,
  fetchUpcomingConsultations,
} from "@/lib/profile-api";
import {
  buildReminderBoardItems,
  formatReminderDate,
  getRandomIntegerInclusive,
  getRelativeDueLabel,
  getReminderTypeLabel,
  goTo,
  ReminderBoardItem,
  ReminderUrgency,
} from "@/utils";
import {
  Entypo,
  FontAwesome6,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import tipsOfTheDay from "../../data/tips-of-the-day.json";

function getReminderAccent(
  urgency: ReminderUrgency,
  darkMode: boolean,
): string {
  if (urgency === "overdue") return colors.red;
  if (urgency === "today") return colors.lightOrange;
  return darkMode ? colors.lightGreen : (colors.green ?? colors.darkGreen);
}

export default function HomeScreen() {
  const [componentWidth, setComponentWidth] = useState(0);
  const darkMode = useColorScheme() === "dark";
  const { width } = useWindowDimensions();
  const router = useRouter();
  const styles = createStyles({ darkMode, componentWidth, width });
  const [tipOfTheDay, setTipOfTheDay] = useState<string>();
  const [reminderBoardItems, setReminderBoardItems] = useState<
    ReminderBoardItem[]
  >([]);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);
  const [charityOrganisations, setCharityOrganisations] = useState<
    PlaceModel[]
  >([]);
  const [isLoadingCharities, setIsLoadingCharities] = useState(true);
  const { setShowFooter } = useGlobal();
  const {
    user,
    pets,
    isHydrating,
    isRefreshingProfile,
    refreshProfile,
    shouldRefreshProfile,
  } = useAuth();

  const visibleReminders = reminderBoardItems.slice(0, 6);
  const visibleCharityOrganisations = charityOrganisations.slice(0, 3);
  const isLoading =
    isHydrating ||
    isRefreshingProfile ||
    isLoadingDashboard ||
    isLoadingCharities;
  const reminderCounts = {
    medication: reminderBoardItems.filter((item) => item.type === "medication")
      .length,
    vaccination: reminderBoardItems.filter(
      (item) => item.type === "vaccination",
    ).length,
    consultation: reminderBoardItems.filter(
      (item) => item.type === "consultation",
    ).length,
  };

  useFocusEffect(
    useCallback(() => {
      const tipSource = pets.some((pet) => pet.Species?.toLowerCase() === "dog")
        ? tipsOfTheDay.dogTips
        : tipsOfTheDay.catTips;
      const tipIndex = getRandomIntegerInclusive(
        0,
        Math.max(tipSource.length - 1, 0),
      );
      const tip = tipSource[tipIndex]?.tip;
      setTipOfTheDay(tip);
    }, [pets]),
  );

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const loadDashboard = async () => {
        if (shouldRefreshProfile()) {
          try {
            await refreshProfile();
          } catch (error) {
            if (isActive) {
              Alert.alert(
                "Could not load home",
                error instanceof Error
                  ? error.message
                  : "Unable to load your dashboard.",
              );
            }
          } finally {
            if (isActive) {
              setIsLoadingDashboard(false);
            }
          }

          return;
        }

        if (!user) {
          if (isActive) {
            setReminderBoardItems([]);
            setIsLoadingDashboard(false);
          }
          return;
        }

        setIsLoadingDashboard(true);

        try {
          const [consultations, illnessRecords, medicationRecords, vaccineRecords] =
            await Promise.all([
              fetchUpcomingConsultations(),
              fetchOngoingIllnesses(),
              fetchMedicationReminders(),
              fetchDueVaccines(),
            ]);

          if (!isActive) return;

          setReminderBoardItems(
            buildReminderBoardItems({
              consultations,
              illnessRecords,
              medicationRecords,
              pets,
              vaccineRecords,
            }),
          );
        } catch (error) {
          if (!isActive) return;

          setReminderBoardItems([]);
          Alert.alert(
            "Could not load reminders",
            error instanceof Error ? error.message : "Please try again.",
          );
        } finally {
          if (isActive) {
            setIsLoadingDashboard(false);
          }
        }
      };

      void loadDashboard();

      return () => {
        isActive = false;
        setShowFooter?.(true);
      };
    }, [pets, refreshProfile, setShowFooter, shouldRefreshProfile, user]),
  );

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const loadCharityOrganisations = async () => {
        setIsLoadingCharities(true);

        try {
          const response = await fetchCharityOrganisations();

          if (!isActive) return;

          setCharityOrganisations(response);
        } catch (error) {
          if (!isActive) return;

          setCharityOrganisations([]);
          Alert.alert(
            "Could not load charity organisations",
            error instanceof Error ? error.message : "Please try again.",
          );
        } finally {
          if (isActive) {
            setIsLoadingCharities(false);
          }
        }
      };

      void loadCharityOrganisations();

      return () => {
        isActive = false;
      };
    }, []),
  );

  const { translateY } = useHeaderSlide({ height: 200 });
  const displayName = user?.Name ?? "there";

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View style={[styles.header, { transform: [{ translateY }] }]}>
          <AdaptiveText
            style={{
              fontFamily: "Poppins-SemiBold",
              fontSize: 24,
            }}
          >
            Welcome back,{" "}
            <Text style={{ color: darkMode ? colors.white : colors.green }}>
              {displayName}
            </Text>
            !
          </AdaptiveText>
        </Animated.View>

        <AdaptiveView style={styles.tips}>
          <View style={styles.divisionTitleSection}>
            <MaterialCommunityIcons
              name="lightbulb-on"
              size={14}
              color={darkMode ? colors.white : colors.green}
            />
            <AdaptiveText style={styles.divisionTitle}>
              Tip of the day
            </AdaptiveText>
          </View>
          <AdaptiveText
            style={{
              fontFamily: "Poppins-Regular",
              fontSize: 16,
            }}
          >
            {tipOfTheDay}
          </AdaptiveText>
        </AdaptiveView>

        <AdaptiveView style={styles.tips}>
          <View style={styles.divisionTitleSection}>
            <MaterialCommunityIcons
              name="clipboard-text-clock-outline"
              size={16}
              color={darkMode ? colors.white : colors.green}
            />
            <AdaptiveText style={styles.divisionTitle}>
              Reminder board
            </AdaptiveText>
          </View>

          <AdaptiveText style={styles.reminderHeadline}>
            Keep track of medications, vaccines, and routine vet follow-ups for
            your pets.
          </AdaptiveText>

          <View style={styles.reminderSummaryRow}>
            <View style={styles.summaryPill}>
              <AdaptiveText style={styles.summaryPillValue}>
                {reminderCounts.medication}
              </AdaptiveText>
              <AdaptiveText style={styles.summaryPillLabel}>
                Medications
              </AdaptiveText>
            </View>
            <View style={styles.summaryPill}>
              <AdaptiveText style={styles.summaryPillValue}>
                {reminderCounts.vaccination}
              </AdaptiveText>
              <AdaptiveText style={styles.summaryPillLabel}>
                Vaccines
              </AdaptiveText>
            </View>
            <View style={styles.summaryPill}>
              <AdaptiveText style={styles.summaryPillValue}>
                {reminderCounts.consultation}
              </AdaptiveText>
              <AdaptiveText style={styles.summaryPillLabel}>
                Check-ins
              </AdaptiveText>
            </View>
          </View>

          {visibleReminders.length ? (
            <View style={styles.reminderList}>
              {visibleReminders.map((item) => (
                <TouchableOpacity
                  key={item.key}
                  activeOpacity={0.85}
                  style={styles.reminderCard}
                  onPress={() => {
                    if (item.type === "vaccination") {
                      const payload = encodeURIComponent(
                        JSON.stringify({ pet: item.pet }),
                      );
                      router.push({
                        pathname: "/profile/vaccines",
                        params: { payload },
                      });
                      return;
                    }

                    if (item.type === "medication") {
                      const payload = encodeURIComponent(
                        JSON.stringify({ pet: item.pet }),
                      );
                      router.push({
                        pathname: "/profile/illnesses",
                        params: { payload },
                      });
                      return;
                    }

                    goTo(
                      { ...item.pet, key: item.pet.Id },
                      "/profile/[pet]",
                      router,
                    );
                  }}
                >
                  <View
                    style={[
                      styles.reminderAccent,
                      {
                        backgroundColor: getReminderAccent(
                          item.urgency,
                          darkMode,
                        ),
                      },
                    ]}
                  />
                  <View style={styles.reminderBody}>
                    <View style={styles.reminderTopRow}>
                      <AdaptiveText style={styles.reminderType}>
                        {getReminderTypeLabel(item.type)}
                      </AdaptiveText>
                      <AdaptiveText style={styles.reminderDueState}>
                        {getRelativeDueLabel(item.dueDate)}
                      </AdaptiveText>
                    </View>

                    <AdaptiveText style={styles.reminderTitle}>
                      {item.title}
                    </AdaptiveText>
                    <AdaptiveText style={styles.reminderSubtitle}>
                      {item.pet.Name} • {item.subtitle}
                    </AdaptiveText>
                    <AdaptiveText style={styles.reminderDate}>
                      {formatReminderDate(item.dueDate)}
                    </AdaptiveText>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <AdaptiveView style={styles.emptyReminderState}>
              <AdaptiveText style={styles.emptyReminderTitle}>
                No active reminders right now.
              </AdaptiveText>
              <AdaptiveText style={styles.emptyReminderText}>
                As you add medications, vaccine due dates, or consultations,
                they&apos;ll show up here for quick follow-up.
              </AdaptiveText>
            </AdaptiveView>
          )}
        </AdaptiveView>

        <AdaptiveView style={styles.tips}>
          <AdaptiveView style={styles.divisionTitleSection}>
            <FontAwesome6
              name="hand-holding-heart"
              size={14}
              color={darkMode ? colors.white : colors.green}
            />
            <AdaptiveText style={styles.divisionTitle}>
              Charity organisations
            </AdaptiveText>
          </AdaptiveView>

          {visibleCharityOrganisations.length ? (
            <AdaptiveView style={styles.charityGrid}>
              {visibleCharityOrganisations.map((organisation) => (
                <TouchableOpacity
                  key={organisation.Id}
                  onLayout={(event) => {
                    const { width } = event.nativeEvent.layout;
                    setComponentWidth(width);
                  }}
                  style={styles.charityCard}
                  onPress={() =>
                    router.push({
                      pathname: "/individual-charity-screen",
                      params: { key: organisation.Id },
                    })
                  }
                >
                  <CustomImage
                    image={organisation.Photo}
                    customStyles={styles.pfp}
                  />
                </TouchableOpacity>
              ))}
            </AdaptiveView>
          ) : (
            <ProfileEmptyState
              title="No charity organisations available"
              subtitle="When organisations are added to the database, they’ll appear here."
              compact
              style={styles.charityEmptyState}
            />
          )}

          <TouchableOpacity
            style={{ alignSelf: "flex-end" }}
            onPress={() => router.push("/charities-list-screen")}
          >
            <Text
              style={{
                fontFamily: "Poppins-Medium",
                fontSize: 12,
                color: darkMode ? colors.lightGrey : colors.green,
              }}
            >
              More Charity Organisations →
            </Text>
          </TouchableOpacity>
        </AdaptiveView>

        <AdaptiveView style={[styles.tips, { gap: 20 }]}>
          <AdaptiveView style={styles.divisionTitleSection}>
            <Entypo
              name="modern-mic"
              size={14}
              color={darkMode ? colors.white : colors.green}
            />
            <AdaptiveText style={styles.divisionTitle}>
              Pet Translator
            </AdaptiveText>
          </AdaptiveView>

          <View style={styles.translatorPreviewRow}>
            <View style={styles.translatorIconBubble}>
              <FontAwesome6 name="dog" size={16} color={colors.white} />
            </View>
            <View style={styles.translatorWaveGroup}>
              <View
                style={[styles.translatorWaveBar, styles.translatorWaveShort]}
              />
              <View
                style={[styles.translatorWaveBar, styles.translatorWaveTall]}
              />
              <View
                style={[styles.translatorWaveBar, styles.translatorWaveMid]}
              />
              <View
                style={[styles.translatorWaveBar, styles.translatorWaveTall]}
              />
              <View
                style={[styles.translatorWaveBar, styles.translatorWaveShort]}
              />
            </View>
            <View style={styles.translatorIconBubble}>
              <FontAwesome6 name="cat" size={16} color={colors.white} />
            </View>
          </View>

          <View style={styles.translatorCopyBlock}>
            <AdaptiveText style={styles.translatorTitle}>
              Bark in. Meow out.
            </AdaptiveText>
            <AdaptiveText style={styles.translatorSubtitle}>
              Funny fake translations for your pet&apos;s latest speech.
            </AdaptiveText>
          </View>

          <TouchableOpacity
            style={styles.translatorFooterRow}
            onPress={() => router.push("/pet-translator-screen")}
          >
            <AdaptiveText style={styles.translatorCta}>
              Open translator
            </AdaptiveText>
          </TouchableOpacity>
        </AdaptiveView>
      </ScrollView>

      {isLoading && <LoadingOverlay />}
    </SafeAreaView>
  );
}

const createStyles = ({ darkMode, componentWidth, width }: any) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: darkMode ? colors.veryDarkGrey : colors.white,
    },
    scrollView: {
      flex: 1,
      width,
      backgroundColor: darkMode ? colors.veryDarkGrey : colors.white,
    },
    scrollContent: {
      alignItems: "center",
      gap: 12,
      paddingTop: Platform.select({
        android: 10,
      }),
      paddingBottom: 180,
    },
    header: {
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginTop: 20,
      borderRadius: 30,
      alignSelf: "center",
    },
    tips: {
      paddingHorizontal: 24,
      paddingVertical: 16,
      borderRadius: 30,
      width: "90%",
      alignSelf: "center",
      gap: 10,

      // shadow
      shadowColor: colors.black,
      shadowOffset: {
        width: darkMode ? 5 : 0,
        height: 10,
      },
      shadowRadius: 10,
      shadowOpacity: darkMode ? 0.5 : 0.1,

      elevation: 10,
    },
    divisionTitleSection: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    divisionTitle: {
      fontFamily: "Poppins-Regular",
      fontSize: 12,
      color: darkMode ? colors.white : colors.green,
    },
    reminderHeadline: {
      fontFamily: "Poppins-Regular",
      fontSize: 16,
      lineHeight: 23,
    },
    reminderSummaryRow: {
      flexDirection: "row",
      gap: 10,
    },
    summaryPill: {
      flex: 1,
      borderRadius: 18,
      paddingVertical: 10,
      paddingHorizontal: 12,
      backgroundColor: darkMode ? colors.darkGrey : colors.lightLightGreen1,
      alignItems: "center",
      gap: 2,
    },
    summaryPillValue: {
      fontFamily: "Poppins-Bold",
      fontSize: 20,
      color: darkMode ? colors.white : colors.green,
    },
    summaryPillLabel: {
      fontFamily: "Poppins-Medium",
      fontSize: 11,
      color: darkMode ? colors.lightGrey : colors.black,
    },
    reminderList: {
      gap: 10,
    },
    reminderCard: {
      flexDirection: "row",
      alignItems: "stretch",
      borderRadius: 22,
      overflow: "hidden",
      backgroundColor: darkMode ? colors.darkGrey : colors.lightGrey,
    },
    reminderAccent: {
      width: 8,
    },
    reminderBody: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 14,
      gap: 2,
    },
    reminderTopRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 10,
    },
    reminderType: {
      fontFamily: "Poppins-SemiBold",
      fontSize: 12,
      color: darkMode ? colors.white : colors.green,
    },
    reminderDueState: {
      fontFamily: "Poppins-Medium",
      fontSize: 11,
      color: darkMode ? colors.lightGrey : colors.darkGrey,
    },
    reminderTitle: {
      fontFamily: "Poppins-SemiBold",
      fontSize: 17,
    },
    reminderSubtitle: {
      fontFamily: "Poppins-Regular",
      fontSize: 13,
      color: darkMode ? colors.lightGrey : colors.mildDarkGrey,
    },
    reminderDate: {
      fontFamily: "Poppins-Medium",
      fontSize: 12,
      color: darkMode ? colors.white : colors.black,
      marginTop: 4,
    },
    emptyReminderState: {
      borderRadius: 22,
      padding: 18,
      backgroundColor: darkMode ? colors.darkGrey : colors.lightGrey,
      gap: 4,
    },
    emptyReminderTitle: {
      fontFamily: "Poppins-SemiBold",
      fontSize: 16,
    },
    emptyReminderText: {
      fontFamily: "Poppins-Regular",
      fontSize: 13,
      lineHeight: 20,
      color: darkMode ? colors.lightGrey : colors.mildDarkGrey,
    },
    pfp: {
      height: componentWidth,
      width: "100%",
      borderRadius: 30,
      backgroundColor: colors.lightGrey,
    },
    charityGrid: {
      flexDirection: "row",
      gap: 10,
    },
    charityCard: {
      flex: 1,
    },
    charityEmptyState: {
      width: "100%",
      marginTop: 0,
      marginBottom: 0,
    },
    translatorPreviewRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      marginTop: 2,
    },
    translatorIconBubble: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.green,
    },
    translatorWaveGroup: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingHorizontal: 8,
    },
    translatorWaveBar: {
      width: 8,
      borderRadius: 999,
      backgroundColor: darkMode ? colors.lightGrey : colors.green,
      opacity: darkMode ? 0.9 : 0.75,
    },
    translatorWaveShort: {
      height: 14,
    },
    translatorWaveMid: {
      height: 24,
    },
    translatorWaveTall: {
      height: 34,
    },
    translatorCopyBlock: {
      gap: 4,
    },
    translatorTitle: {
      fontFamily: "Poppins-SemiBold",
      fontSize: 17,
    },
    translatorSubtitle: {
      fontFamily: "Poppins-Regular",
      fontSize: 13,
      lineHeight: 20,
      color: darkMode ? colors.lightGrey : colors.mildDarkGrey,
    },
    translatorFooterRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
      backgroundColor: colors.green,
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderRadius: 10,
    },
    translatorCta: {
      fontFamily: "Poppins-SemiBold",
      fontSize: 16,
      color: colors.white,
    },
  });
};
