import { AdaptiveText } from "@/components/AdaptiveText";
import { AdaptiveView } from "@/components/AdaptiveView";
import { PageHeader } from "@/components/PageHeader";
import { colors } from "@/constants/colors";
import { PetSound, TRANSLATIONS } from "@/data/translations";
import { Feather, FontAwesome6 } from "@expo/vector-icons";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const VISUALIZER_BARS = [0.35, 0.6, 0.9, 0.5, 0.75, 0.4, 0.85];

function formatSeconds(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function getRandomTranslation(sound: PetSound) {
  const options = TRANSLATIONS[sound];
  return options[Math.floor(Math.random() * options.length)];
}

export default function PetTranslatorScreen() {
  const darkMode = useColorScheme() === "dark";
  const styles = createStyles({ darkMode });
  const pulse = useRef(new Animated.Value(1)).current;
  const [selectedSound, setSelectedSound] = useState<PetSound>("meow");
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [translation, setTranslation] = useState(() =>
    getRandomTranslation("meow"),
  );

  useEffect(() => {
    if (!isRecording) {
      pulse.stopAnimation();
      pulse.setValue(1);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.08,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();

    return () => {
      animation.stop();
      pulse.setValue(1);
    };
  }, [isRecording, pulse]);

  useEffect(() => {
    if (!isRecording) return;

    const interval = setInterval(() => {
      setElapsedSeconds((current) => current + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isRecording]);

  const animatedMicStyle = useMemo(
    () => ({
      transform: [{ scale: pulse }],
    }),
    [pulse],
  );

  const startRecording = () => {
    setTranslation(getRandomTranslation(selectedSound));
    setElapsedSeconds(0);
    setIsRecording(true);
  };

  const stopRecording = () => {
    setIsRecording(false);
    setTranslation(getRandomTranslation(selectedSound));
  };

  return (
    <SafeAreaView style={styles.container}>
      <PageHeader title="Pet Translator" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <AdaptiveView style={styles.heroCard}>
          <AdaptiveText style={styles.sectionEyebrow}>
            Pet Translator
          </AdaptiveText>
          <AdaptiveText style={styles.heroTitle}>
            Record a bark or meow and get a playful fake translation.
          </AdaptiveText>
          <AdaptiveText style={styles.heroDescription}>
            A lighthearted feature for turning pet noises into funny captions.
          </AdaptiveText>

          <View style={styles.soundToggleRow}>
            {(["meow", "bark"] as PetSound[]).map((sound) => {
              const active = selectedSound === sound;
              return (
                <TouchableOpacity
                  key={sound}
                  activeOpacity={0.9}
                  style={[
                    styles.soundToggleButton,
                    active && styles.soundToggleButtonActive,
                  ]}
                  onPress={() => {
                    setSelectedSound(sound);
                    if (!isRecording) {
                      setTranslation(getRandomTranslation(sound));
                    }
                  }}
                >
                  <FontAwesome6
                    name={sound === "meow" ? "cat" : "dog"}
                    size={16}
                    color={
                      active
                        ? colors.white
                        : darkMode
                          ? colors.white
                          : colors.black
                    }
                  />
                  <AdaptiveText
                    style={[
                      styles.soundToggleLabel,
                      active && styles.soundToggleLabelActive,
                    ]}
                  >
                    {sound === "meow" ? "Cat meow" : "Dog bark"}
                  </AdaptiveText>
                </TouchableOpacity>
              );
            })}
          </View>
        </AdaptiveView>

        <AdaptiveView style={styles.recorderCard}>
          <View style={styles.recorderHeader}>
            <View>
              <AdaptiveText style={styles.sectionEyebrow}>
                Recorder
              </AdaptiveText>
              <AdaptiveText style={styles.recorderHint}>
                {selectedSound === "meow" ? "Cat mode" : "Dog mode"}
              </AdaptiveText>
            </View>
            <View
              style={[
                styles.statusPill,
                isRecording && styles.statusPillActive,
              ]}
            >
              <AdaptiveText
                style={[
                  styles.statusPillText,
                  isRecording && styles.statusPillTextActive,
                ]}
              >
                {isRecording ? "Recording" : "Ready"}
              </AdaptiveText>
            </View>
          </View>

          <Animated.View style={[styles.micShell, animatedMicStyle]}>
            <Pressable
              onPress={isRecording ? stopRecording : startRecording}
              style={[styles.micButton, isRecording && styles.micButtonActive]}
            >
              <Feather
                name={isRecording ? "pause" : "mic"}
                size={34}
                color={colors.white}
              />
            </Pressable>
          </Animated.View>

          <AdaptiveText style={styles.recordingStatus}>
            {isRecording
              ? `Listening to ${selectedSound === "meow" ? "meows" : "barks"}...`
              : `Ready for a ${selectedSound === "meow" ? "cat solo" : "dog speech"}.`}
          </AdaptiveText>
          <AdaptiveText style={styles.recordingTimer}>
            {formatSeconds(elapsedSeconds)}
          </AdaptiveText>

          <View style={styles.visualizerRow}>
            {VISUALIZER_BARS.map((heightFactor, index) => (
              <View
                key={index}
                style={[
                  styles.visualizerBar,
                  {
                    height: isRecording ? 26 + heightFactor * 54 : 18,
                    opacity: isRecording ? 1 : 0.35,
                  },
                ]}
              />
            ))}
          </View>
        </AdaptiveView>

        <AdaptiveView style={styles.translationCard}>
          <AdaptiveText style={styles.sectionEyebrow}>
            Translation Result
          </AdaptiveText>

          <View style={styles.translationHeader}>
            <View style={styles.translationTitleBlock}>
              <AdaptiveText style={styles.translationTitle}>
                {translation.title}
              </AdaptiveText>
              <AdaptiveText style={styles.translationSubtitle}>
                {translation.subtitle}
              </AdaptiveText>
            </View>

            <View style={styles.energyBadge}>
              <AdaptiveText style={styles.energyBadgeText}>
                {translation.energy}
              </AdaptiveText>
            </View>
          </View>

          <AdaptiveText style={styles.translationBody}>
            {translation.body}
          </AdaptiveText>
        </AdaptiveView>

        <AdaptiveView style={styles.footerNoteCard}>
          <AdaptiveText style={styles.footerNoteTitle}>
            What this actually does
          </AdaptiveText>
          <AdaptiveText style={styles.footerNoteText}>
            This screen is intentionally playful. It doesn&apos;t decode real
            animal language, it just turns pet sounds into funny, friendly
            captions for the user.
          </AdaptiveText>
        </AdaptiveView>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = ({ darkMode }: { darkMode: boolean }) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: darkMode ? colors.veryDarkGrey : colors.white,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingTop: 18,
      paddingBottom: 34,
      gap: 16,
    },
    heroCard: {
      padding: 22,
      borderRadius: 30,
      backgroundColor: darkMode ? colors.darkGrey : colors.white,
      gap: 14,

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
    heroTitle: {
      fontSize: 22,
      lineHeight: 30,
      fontFamily: "Poppins-SemiBold",
    },
    heroDescription: {
      fontSize: 14,
      lineHeight: 22,
      color: darkMode ? colors.lightGrey : colors.mildDarkGrey,
    },
    soundToggleRow: {
      flexDirection: "row",
      gap: 10,
    },
    soundToggleButton: {
      flex: 1,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 8,
      borderRadius: 20,
      paddingVertical: 14,
      paddingHorizontal: 12,
      backgroundColor: darkMode ? colors.veryDarkGrey : colors.lightGrey,
    },
    soundToggleButtonActive: {
      backgroundColor: colors.green,
    },
    soundToggleLabel: {
      fontFamily: "Poppins-Medium",
      fontSize: 13,
    },
    soundToggleLabelActive: {
      color: colors.white,
    },
    recorderCard: {
      padding: 22,
      borderRadius: 30,
      backgroundColor: darkMode ? colors.darkGrey : colors.white,
      alignItems: "center",
      gap: 14,

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
    sectionEyebrow: {
      fontFamily: "Poppins-SemiBold",
      fontSize: 12,
      color: darkMode ? colors.lightGrey : colors.green,
      letterSpacing: 0.4,
      textTransform: "uppercase",
    },
    recorderHeader: {
      width: "100%",
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 12,
    },
    recorderHint: {
      fontFamily: "Poppins-Regular",
      fontSize: 13,
      color: darkMode ? colors.lightGrey : colors.mildDarkGrey,
      marginTop: 2,
    },
    statusPill: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: darkMode ? colors.veryDarkGrey : colors.lightGrey,
    },
    statusPillActive: {
      backgroundColor: darkMode ? colors.red : colors.lightLightOrange,
    },
    statusPillText: {
      fontFamily: "Poppins-SemiBold",
      fontSize: 11,
      color: darkMode ? colors.white : colors.mildDarkGrey,
    },
    statusPillTextActive: {
      color: darkMode ? colors.white : colors.red,
    },
    micShell: {
      marginTop: 4,
      borderRadius: 999,
      padding: 14,
      backgroundColor: darkMode ? "#ffffff10" : colors.lightGrey,
    },
    micButton: {
      width: 96,
      height: 96,
      borderRadius: 999,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.green,

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
    micButtonActive: {
      backgroundColor: colors.red,
    },
    recordingStatus: {
      fontFamily: "Poppins-SemiBold",
      fontSize: 18,
      textAlign: "center",
    },
    recordingTimer: {
      fontFamily: "Poppins-Bold",
      fontSize: 32,
      color: darkMode ? colors.white : colors.green,
    },
    visualizerRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "center",
      gap: 8,
      minHeight: 84,
    },
    visualizerBar: {
      width: 14,
      borderRadius: 999,
      backgroundColor: colors.green,
    },
    secondaryButton: {
      marginTop: 4,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 999,
      backgroundColor: darkMode ? colors.veryDarkGrey : colors.lightGrey,
    },
    secondaryButtonText: {
      fontFamily: "Poppins-Medium",
      color: darkMode ? colors.white : colors.green,
    },
    translationCard: {
      padding: 22,
      borderRadius: 30,
      backgroundColor: darkMode ? colors.darkGrey : colors.white,
      gap: 14,

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
    translationHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: 12,
    },
    translationTitleBlock: {
      flex: 1,
      gap: 2,
    },
    translationTitle: {
      fontFamily: "Poppins-SemiBold",
      fontSize: 20,
      lineHeight: 28,
    },
    translationSubtitle: {
      fontFamily: "Poppins-Medium",
      fontSize: 13,
      color: darkMode ? colors.lightGrey : colors.mildDarkGrey,
    },
    energyBadge: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: darkMode ? colors.veryDarkGrey : colors.lightGrey,
    },
    energyBadgeText: {
      fontFamily: "Poppins-SemiBold",
      fontSize: 11,
      color: darkMode ? colors.white : colors.green,
    },
    translationBody: {
      fontSize: 16,
      lineHeight: 26,
      color: darkMode ? colors.white : colors.black,
    },
    footerNoteCard: {
      padding: 20,
      borderRadius: 26,
      backgroundColor: darkMode ? colors.darkGrey : colors.lightGrey,
      gap: 8,
    },
    footerNoteTitle: {
      fontFamily: "Poppins-SemiBold",
      fontSize: 16,
    },
    footerNoteText: {
      fontSize: 14,
      lineHeight: 22,
      color: darkMode ? colors.lightGrey : colors.mildDarkGrey,
    },
  });
};
