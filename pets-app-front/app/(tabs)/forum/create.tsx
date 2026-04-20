import { AdaptiveText } from "@/components/AdaptiveText";
import CustomInput from "@/components/CustomInput";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { PageHeader } from "@/components/PageHeader";
import { colors } from "@/constants/colors";
import { useGlobal } from "@/contexts/GlobalProvider";
import { presentApiError } from "@/lib/api-feedback";
import { apiRequest } from "@/lib/api";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  Keyboard,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CreateForumPostScreen() {
  const router = useRouter();
  const darkMode = useColorScheme() === "dark";
  const styles = createStyles({ darkMode });
  const { setShowFooter } = useGlobal();
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setShowFooter?.(false);

      return () => {
        setShowFooter?.(true);
      };
    }, [setShowFooter]),
  );

  const handleCreatePost = async () => {
    const trimmedContent = content.trim();

    if (!trimmedContent) {
      Alert.alert("Missing content", "Please write something before posting.");
      return;
    }

    try {
      setIsSubmitting(true);
      await apiRequest("/api/ForumPosts", {
        method: "POST",
        body: JSON.stringify({
          content: trimmedContent,
        }),
      });

      router.back();
    } catch (error) {
      presentApiError("Unable to create post", error, {
        networkMessage:
          "We couldn't reach the server, so your post was not published.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <PageHeader title="Create Post" />

      <ScrollView
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={Keyboard.dismiss}
        contentContainerStyle={styles.content}
      >
        <View style={styles.copyBlock}>
          <AdaptiveText style={styles.title}>Share with the community</AdaptiveText>
          <AdaptiveText style={styles.subtitle}>
            Ask a question, share advice, or post an update for other pet
            owners.
          </AdaptiveText>
        </View>

        <AdaptiveText style={styles.label}>Post content</AdaptiveText>
        <CustomInput
          value={content}
          onChangeText={setContent}
          multiline
          textAlignVertical="top"
          placeholder="What's on your mind?"
          placeholderTextColor={darkMode ? colors.lightGrey : colors.darkGrey}
          style={styles.inputContainer}
          inputStyle={styles.input}
        />

        <TouchableOpacity
          style={[styles.button, isSubmitting && styles.buttonDisabled]}
          disabled={isSubmitting}
          onPress={handleCreatePost}
        >
          <AdaptiveText style={styles.buttonText}>
            {isSubmitting ? "Publishing..." : "Publish Post"}
          </AdaptiveText>
        </TouchableOpacity>
      </ScrollView>

      {isSubmitting && <LoadingOverlay />}
    </SafeAreaView>
  );
}

const createStyles = ({ darkMode }: any) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: darkMode ? colors.veryDarkGrey : colors.white,
    },
    content: {
      alignItems: "center",
      paddingTop: 16,
      paddingBottom: 40,
    },
    copyBlock: {
      width: "84%",
      marginBottom: 18,
      gap: 8,
    },
    title: {
      fontSize: 24,
      fontFamily: "Poppins-SemiBold",
    },
    subtitle: {
      fontSize: 15,
      fontFamily: "Poppins-Regular",
      opacity: 0.8,
      lineHeight: 22,
    },
    label: {
      width: "84%",
      marginBottom: 8,
      fontFamily: "Poppins-Medium",
    },
    inputContainer: {
      width: "84%",
      minHeight: 200,
      marginBottom: 20,
    },
    input: {
      minHeight: 180,
      paddingTop: 16,
    },
    button: {
      width: "84%",
      backgroundColor: colors.green,
      borderRadius: 18,
      paddingVertical: 18,
      alignItems: "center",
      justifyContent: "center",
    },
    buttonDisabled: {
      opacity: 0.7,
    },
    buttonText: {
      color: colors.white,
      fontFamily: "Poppins-Bold",
      fontSize: 17,
    },
  });
};
