import { AdaptiveText } from "@/components/AdaptiveText";
import { AdaptiveView } from "@/components/AdaptiveView";
import CustomImage from "@/components/CustomImage";
import { colors } from "@/constants/colors";
import { useGlobal } from "@/contexts/GlobalProvider";
import {
  AppUsers,
  Consultations,
  IllnessRecords,
  MedicationRecords,
  Pets,
  VaccineRecords,
} from "@/data/sample";
import { useHeaderSlide } from "@/hooks/useHeaderSlide";
import {
  buildReminderBoardItems,
  formatReminderDate,
  getRandomIntegerInclusive,
  getRelativeDueLabel,
  getReminderTypeLabel,
  goTo,
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
  const { setShowFooter } = useGlobal();
  const user = AppUsers[0];
  const userPets = Pets.filter((pet) => pet.UserId === user.Id);
  const reminderBoardItems = buildReminderBoardItems({
    consultations: Consultations,
    illnessRecords: IllnessRecords,
    medicationRecords: MedicationRecords,
    pets: userPets,
    vaccineRecords: VaccineRecords,
  });

  const visibleReminders = reminderBoardItems.slice(0, 6);
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

  const items = [
    {
      key: 1,
      name: "BETA",
      location: "Hazmieh, Mount Lebanon",
      rating: 3.8,
      image: "Users/brunofares/Desktop/mourinho.jpeg",
    },
    {
      key: 3,
      name: "Bruno Fares albo kbir",
      location: "Mansourieh, Mount Lebanon",
      rating: 5.0,
      image: "",
    },
    {
      key: 4,
      name: "Whatever man",
      location: "Ain Hircha, Beqaa",
      rating: 0.3,
      image: "",
    },
  ];

  useFocusEffect(
    useCallback(() => {
      const tipIndex = getRandomIntegerInclusive(1, 50);

      // will have to check whether or not to separate cat tips and dog tips
      // if the decision is to separate them, we will have to implement a mechanism for checking
      // the species of the user's pet(s)
      const tip = tipsOfTheDay.catTips[tipIndex].tip;
      setTipOfTheDay(tip);
    }, []),
  );

  useFocusEffect(
    useCallback(() => {
      return () => {
        setShowFooter?.(true);
      };
    }, [setShowFooter]),
  );

  const { translateY } = useHeaderSlide({ height: 200 });

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
              {user.Name}
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
              Donate to charity
            </AdaptiveText>
          </AdaptiveView>

          <AdaptiveView
            style={{
              flexDirection: "row",
              gap: 10,
            }}
          >
            <TouchableOpacity
              onLayout={(event) => {
                const { width } = event.nativeEvent.layout;
                setComponentWidth(width);
              }}
              style={{ flex: 1 }}
              onPress={() => {
                const payload = encodeURIComponent(JSON.stringify(items[0]));
                router.push({
                  pathname: "/individual-charity-screen",
                  params: { key: String(items[0].key), payload },
                });
              }}
            >
              <CustomImage image={user.Image} customStyles={styles.pfp} />
            </TouchableOpacity>

            <TouchableOpacity
              onLayout={(event) => {
                const { width } = event.nativeEvent.layout;
                setComponentWidth(width);
              }}
              style={{ flex: 1 }}
              onPress={() => {
                const payload = encodeURIComponent(JSON.stringify(items[1]));
                router.push({
                  pathname: "/individual-charity-screen",
                  params: { key: String(items[1].key), payload },
                });
              }}
            >
              <CustomImage image={user.Image} customStyles={styles.pfp} />
            </TouchableOpacity>

            <TouchableOpacity
              onLayout={(event) => {
                const { width } = event.nativeEvent.layout;
                setComponentWidth(width);
              }}
              style={{ flex: 1 }}
              onPress={() => {
                const payload = encodeURIComponent(JSON.stringify(items[2]));
                router.push({
                  pathname: "/individual-charity-screen",
                  params: { key: String(items[2].key), payload },
                });
              }}
            >
              <CustomImage image={user.Image} customStyles={styles.pfp} />
            </TouchableOpacity>
          </AdaptiveView>

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
