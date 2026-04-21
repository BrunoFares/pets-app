import { AdaptiveText } from "@/components/AdaptiveText";
import { AdaptiveView } from "@/components/AdaptiveView";
import { PageHeader } from "@/components/PageHeader";
import { colors } from "@/constants/colors";
import { PetSound, TRANSLATIONS } from "@/data/translations";
import {
  PetTranslatorAnalysis,
  analyzePetAudio,
} from "@/lib/pet-translator-api";
import { presentApiError } from "@/lib/api-feedback";
import { Feather } from "@expo/vector-icons";
import {
  RecordingPresets,
  getRecordingPermissionsAsync,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
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

type DetectedAnimal = "cat" | "dog" | "neither";

function getRandomTranslationForAnimal(animal: Extract<DetectedAnimal, "cat" | "dog">) {
  return getRandomTranslation(animal === "cat" ? "meow" : "bark");
}

export default function PetTranslatorScreen() {
  const darkMode = useColorScheme() === "dark";
  const styles = createStyles({ darkMode });
  const pulse = useRef(new Animated.Value(1)).current;
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 200);
  const isRecording = recorderState.isRecording;
  const [hasMicrophonePermission, setHasMicrophonePermission] = useState<
    boolean | null
  >(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [detectedAnimal, setDetectedAnimal] = useState<DetectedAnimal | null>(
    null,
  );
  const [analysis, setAnalysis] = useState<PetTranslatorAnalysis | null>(null);
  const [translation, setTranslation] = useState<ReturnType<
    typeof getRandomTranslation
  > | null>(null);

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
    let isMounted = true;

    async function configureRecorder() {
      try {
        const status = await getRecordingPermissionsAsync();
        const granted =
          status.granted ||
          (await requestRecordingPermissionsAsync()).granted;

        if (!isMounted) {
          return;
        }

        setHasMicrophonePermission(granted);

        if (!granted) {
          return;
        }

        await setAudioModeAsync({
          playsInSilentMode: true,
          allowsRecording: true,
        });
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setHasMicrophonePermission(false);
        Alert.alert(
          "Microphone unavailable",
          "We couldn't access the microphone. Please check the app permissions and try again.",
        );
      }
    }

    void configureRecorder();

    return () => {
      isMounted = false;
    };
  }, []);

  const animatedMicStyle = useMemo(
    () => ({
      transform: [{ scale: pulse }],
    }),
    [pulse],
  );

  async function ensureRecordingPermission() {
    if (hasMicrophonePermission) {
      return true;
    }

    try {
      const { granted } = await requestRecordingPermissionsAsync();
      setHasMicrophonePermission(granted);

      if (!granted) {
        Alert.alert(
          "Microphone access required",
          "Please allow microphone access so the translator can analyze your pet's sound.",
        );
        return false;
      }

      await setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: true,
      });

      return true;
    } catch {
      Alert.alert(
        "Microphone unavailable",
        "We couldn't request microphone access right now. Please try again.",
      );
      return false;
    }
  }

  const startRecording = async () => {
    if (isAnalyzing) {
      return;
    }

    const granted = await ensureRecordingPermission();
    if (!granted) {
      return;
    }

    setDetectedAnimal(null);
    setAnalysis(null);
    setTranslation(null);

    try {
      await recorder.prepareToRecordAsync();
      recorder.record();
    } catch (error) {
      Alert.alert(
        "Couldn't start recording",
        "The recorder couldn't start. Please try again.",
      );
    }
  };

  const stopRecording = async () => {
    if (!isRecording) {
      return;
    }

    setIsAnalyzing(true);

    try {
      await recorder.stop();

      if (!recorder.uri) {
        throw new Error("No recording was captured.");
      }

      const nextAnalysis = await analyzePetAudio({
        uri: recorder.uri,
        fileName:
          recorder.uri.split("/").pop() ||
          `pet-recording.${recorder.uri.endsWith(".webm") ? "webm" : "m4a"}`,
        mimeType: recorder.uri.endsWith(".webm") ? "audio/webm" : "audio/mp4",
      });

      setAnalysis(nextAnalysis);
      setDetectedAnimal(nextAnalysis.label);

      if (nextAnalysis.label === "cat" || nextAnalysis.label === "dog") {
        setTranslation(getRandomTranslationForAnimal(nextAnalysis.label));
        return;
      }

      setTranslation(null);
    } catch (error) {
      setDetectedAnimal(null);
      setAnalysis(null);
      setTranslation(null);
      presentApiError("Couldn't analyze recording", error, {
        fallbackMessage:
          "Please try again with a clearer pet sound, or make sure the backend translator service is available.",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <PageHeader title="Pet Translator" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <AdaptiveView style={styles.grid}>
          <AdaptiveText style={styles.sectionEyebrow}>
            Pet Translator
          </AdaptiveText>
          <AdaptiveText style={styles.heroTitle}>
            Record a pet sound and let the model decide whether it came from a
            cat, a dog, or neither.
          </AdaptiveText>
          <AdaptiveText style={styles.heroDescription}>
            The translator only generates a playful caption after the model
            classifies the audio as cat or dog.
          </AdaptiveText>
        </AdaptiveView>

        <AdaptiveView style={styles.recorderCard}>
          <View style={styles.recorderHeader}>
            <View>
              <AdaptiveText style={styles.sectionEyebrow}>
                Recorder
              </AdaptiveText>
              <AdaptiveText style={styles.recorderHint}>
                {isAnalyzing
                  ? "Uploading the recording and waiting for the model result."
                  : detectedAnimal === "cat"
                  ? "Latest result: cat audio detected."
                  : detectedAnimal === "dog"
                    ? "Latest result: dog audio detected."
                    : detectedAnimal === "neither"
                      ? "Latest result: neither cat nor dog."
                      : hasMicrophonePermission === false
                        ? "Microphone access is required before recording."
                        : "The model will classify the sound after you stop recording."}
              </AdaptiveText>
            </View>
            <View
              style={[
                styles.statusPill,
                (isRecording || isAnalyzing) && styles.statusPillActive,
              ]}
            >
              <AdaptiveText
                style={[
                  styles.statusPillText,
                  (isRecording || isAnalyzing) && styles.statusPillTextActive,
                ]}
              >
                {isRecording ? "Recording" : isAnalyzing ? "Analyzing" : "Ready"}
              </AdaptiveText>
            </View>
          </View>

          <Animated.View style={[styles.micShell, animatedMicStyle]}>
            <Pressable
              onPress={isRecording ? stopRecording : startRecording}
              disabled={isAnalyzing}
              style={[styles.micButton, isRecording && styles.micButtonActive]}
            >
              {isAnalyzing ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <Feather
                  name={isRecording ? "pause" : "mic"}
                  size={34}
                  color={colors.white}
                />
              )}
            </Pressable>
          </Animated.View>

          <AdaptiveText style={styles.recordingStatus}>
            {isAnalyzing
              ? "Analyzing the recording..."
              : isRecording
              ? "Listening for cat or dog cues..."
              : detectedAnimal === "cat"
                ? `Detected: Cat${
                    analysis ? ` (${Math.round(analysis.confidence * 100)}%)` : ""
                  }`
                : detectedAnimal === "dog"
                  ? `Detected: Dog${
                      analysis ? ` (${Math.round(analysis.confidence * 100)}%)` : ""
                    }`
                  : detectedAnimal === "neither"
                    ? "Detected: Neither cat nor dog"
                    : "Ready to analyze pet audio."}
          </AdaptiveText>
          <AdaptiveText style={styles.recordingTimer}>
            {formatSeconds(Math.floor((recorderState.durationMillis ?? 0) / 1000))}
          </AdaptiveText>

          <View style={styles.visualizerRow}>
            {VISUALIZER_BARS.map((heightFactor, index) => (
              <View
                key={index}
                style={[
                  styles.visualizerBar,
                  {
                    height: isRecording ? 26 + heightFactor * 54 : 18,
                    opacity: isRecording || isAnalyzing ? 1 : 0.35,
                  },
                ]}
              />
            ))}
          </View>
        </AdaptiveView>

        <AdaptiveView style={styles.grid}>
          <AdaptiveText style={styles.sectionEyebrow}>
            Translation Result
          </AdaptiveText>

          {translation && detectedAnimal !== "neither" ? (
            <>
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
            </>
          ) : detectedAnimal === "neither" ? (
            <View style={styles.resultMessageCard}>
              <AdaptiveText style={styles.resultMessageTitle}>
                No translation available
              </AdaptiveText>
              <AdaptiveText style={styles.resultMessageBody}>
                {analysis?.message ||
                  "The model did not identify this recording as a cat or dog vocalization, so no translated caption was generated."}
              </AdaptiveText>
            </View>
          ) : (
            <View style={styles.resultMessageCard}>
              <AdaptiveText style={styles.resultMessageTitle}>
                Waiting for a recording
              </AdaptiveText>
              <AdaptiveText style={styles.resultMessageBody}>
                Record a sound and stop the session to let the model classify
                it before showing a result.
              </AdaptiveText>
            </View>
          )}
        </AdaptiveView>

        <AdaptiveView style={styles.footerNoteCard}>
          <AdaptiveText style={styles.footerNoteTitle}>
            What this actually does
          </AdaptiveText>
          <AdaptiveText style={styles.footerNoteText}>
            This screen now records a real audio clip, uploads it to the
            backend model, and only shows a playful translation when the model
            classifies the recording as cat or dog audio.
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
    grid: {
      padding: 22,
      borderRadius: 30,
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
    recorderCard: {
      padding: 22,
      borderRadius: 30,
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
    resultMessageCard: {
      borderRadius: 22,
      padding: 18,
      backgroundColor: darkMode ? colors.darkGrey : colors.lightGrey,
      gap: 10,
    },
    resultMessageTitle: {
      fontFamily: "Poppins-SemiBold",
      fontSize: 18,
    },
    resultMessageBody: {
      fontSize: 15,
      lineHeight: 24,
      color: darkMode ? colors.lightGrey : colors.mildDarkGrey,
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
