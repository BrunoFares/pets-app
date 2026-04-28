import { AdaptiveText } from "@/components/AdaptiveText";
import CustomInput from "@/components/CustomInput";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { PageHeader } from "@/components/PageHeader";
import { VideoThumbnail } from "@/components/VideoThumbnail";
import { colors } from "@/constants/colors";
import { useGlobal } from "@/contexts/GlobalProvider";
import { presentApiError } from "@/lib/api-feedback";
import {
  createForumPost,
  getForumPostIdFromCreateResponse,
  MAX_FORUM_ATTACHMENTS,
  uploadForumPostAttachments,
} from "@/lib/forum-api";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  Image,
  Keyboard,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function formatVideoDuration(durationMs?: number | null) {
  if (!durationMs || durationMs < 1000) {
    return null;
  }

  const totalSeconds = Math.floor(durationMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(
      seconds,
    ).padStart(2, "0")}`;
  }

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export default function CreateForumPostScreen() {
  const router = useRouter();
  const darkMode = useColorScheme() === "dark";
  const styles = createStyles({ darkMode });
  const { setShowFooter } = useGlobal();
  const [content, setContent] = useState("");
  const [selectedImageAssets, setSelectedImageAssets] = useState<
    ImagePicker.ImagePickerAsset[]
  >([]);
  const [selectedVideoAsset, setSelectedVideoAsset] =
    useState<ImagePicker.ImagePickerAsset | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const remainingAttachmentSlots =
    MAX_FORUM_ATTACHMENTS - selectedImageAssets.length;
  const selectedVideoDuration = formatVideoDuration(selectedVideoAsset?.duration);

  useFocusEffect(
    useCallback(() => {
      setShowFooter?.(false);

      return () => {
        setShowFooter?.(true);
      };
    }, [setShowFooter]),
  );

  const handlePickImages = async () => {
    if (isSubmitting || remainingAttachmentSlots <= 0 || selectedVideoAsset) {
      return;
    }

    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert(
        "Permission required",
        "Please allow photo library access so you can attach images to your post.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      allowsMultipleSelection: true,
      selectionLimit: remainingAttachmentSlots,
      quality: 0.9,
    });

    if (result.canceled) {
      return;
    }

    setSelectedImageAssets((currentAssets) => {
      const nextAssets = [...currentAssets];
      const seenKeys = new Set(
        currentAssets.map((asset) => asset.assetId ?? asset.uri),
      );

      for (const asset of result.assets) {
        const assetKey = asset.assetId ?? asset.uri;

        if (seenKeys.has(assetKey)) {
          continue;
        }

        nextAssets.push(asset);
        seenKeys.add(assetKey);

        if (nextAssets.length >= MAX_FORUM_ATTACHMENTS) {
          break;
        }
      }

      return nextAssets;
    });
  };

  const handlePickVideo = async () => {
    if (isSubmitting || selectedImageAssets.length > 0) {
      return;
    }

    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert(
        "Permission required",
        "Please allow photo library access so you can attach a video to your post.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["videos"],
      allowsEditing: false,
      allowsMultipleSelection: false,
      quality: 1,
    });

    if (result.canceled || result.assets.length === 0) {
      return;
    }

    setSelectedVideoAsset(result.assets[0]);
  };

  const handleRemoveVideo = () => {
    setSelectedVideoAsset(null);
  };

  const handleRemoveImage = (assetToRemove: ImagePicker.ImagePickerAsset) => {
    setSelectedImageAssets((currentAssets) =>
      currentAssets.filter((asset) => asset.uri !== assetToRemove.uri),
    );
  };

  const handleCreatePost = async () => {
    const trimmedContent = content.trim();

    if (!trimmedContent) {
      Alert.alert("Missing content", "Please write something before posting.");
      return;
    }

    try {
      setIsSubmitting(true);
      const createResponse = await createForumPost(trimmedContent);
      const createdPostId = getForumPostIdFromCreateResponse(createResponse);

      const attachmentAssets = selectedVideoAsset
        ? [selectedVideoAsset]
        : selectedImageAssets;

      if (attachmentAssets.length > 0) {
        if (!createdPostId) {
          Alert.alert(
            "Post published without media",
            "Your post was published, but the app could not attach the selected media.",
          );
          router.back();
          return;
        }

        try {
          await uploadForumPostAttachments(createdPostId, attachmentAssets);
        } catch {
          Alert.alert(
            "Post published without media",
            "Your text was published, but the selected media could not be uploaded.",
          );
          router.back();
          return;
        }
      }

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
          <AdaptiveText style={styles.title}>
            Share with the community
          </AdaptiveText>
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

        <View style={styles.attachmentsSection}>
          {/* Images */}
          <View style={styles.attachmentsHeader}>
            <AdaptiveText style={styles.label}>Images</AdaptiveText>
            <AdaptiveText style={styles.attachmentsCounter}>
              {selectedImageAssets.length}/{MAX_FORUM_ATTACHMENTS}
            </AdaptiveText>
          </View>

          <AdaptiveText style={styles.attachmentsHint}>
            Add up to {MAX_FORUM_ATTACHMENTS} images, or attach one video
            instead — not both.
          </AdaptiveText>

          <TouchableOpacity
            style={[
              styles.imagePickerButton,
              (isSubmitting ||
                remainingAttachmentSlots <= 0 ||
                !!selectedVideoAsset) &&
                styles.imagePickerButtonDisabled,
            ]}
            disabled={
              isSubmitting ||
              remainingAttachmentSlots <= 0 ||
              !!selectedVideoAsset
            }
            onPress={handlePickImages}
          >
            <Ionicons
              name="images-outline"
              size={18}
              color={darkMode ? colors.white : colors.black}
            />
            <AdaptiveText style={styles.imagePickerButtonText}>
              {selectedVideoAsset
                ? "Remove video to add images"
                : remainingAttachmentSlots <= 0
                  ? "Image limit reached"
                  : selectedImageAssets.length > 0
                    ? "Add more images"
                    : "Choose images"}
            </AdaptiveText>
          </TouchableOpacity>

          {selectedImageAssets.length > 0 ? (
            <View style={styles.imageGrid}>
              {selectedImageAssets.map((asset) => (
                <View key={asset.assetId ?? asset.uri} style={styles.imageCard}>
                  <Image
                    source={{ uri: asset.uri }}
                    style={styles.imagePreview}
                  />
                  <TouchableOpacity
                    onPress={() => handleRemoveImage(asset)}
                    style={styles.removeImageButton}
                  >
                    <Ionicons name="close" size={14} color={colors.white} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : null}

          {/* Video */}
          <View style={[styles.attachmentsHeader, { marginTop: 10 }]}>
            <AdaptiveText style={styles.label}>Video</AdaptiveText>
          </View>

          <TouchableOpacity
            style={[
              styles.imagePickerButton,
              (isSubmitting ||
                !!selectedVideoAsset ||
                selectedImageAssets.length > 0) &&
                styles.imagePickerButtonDisabled,
            ]}
            disabled={
              isSubmitting ||
              !!selectedVideoAsset ||
              selectedImageAssets.length > 0
            }
            onPress={handlePickVideo}
          >
            <Ionicons
              name="videocam-outline"
              size={18}
              color={darkMode ? colors.white : colors.black}
            />
            <AdaptiveText style={styles.imagePickerButtonText}>
              {selectedImageAssets.length > 0
                ? "Remove images to add a video"
                : selectedVideoAsset
                  ? "Video selected"
                  : "Choose a video"}
            </AdaptiveText>
          </TouchableOpacity>

          {selectedVideoAsset && (
            <View style={styles.videoCard}>
              <View style={styles.videoPreviewFrame}>
                <VideoThumbnail
                  uri={selectedVideoAsset.uri}
                  style={styles.videoPreview}
                />
                <View style={styles.videoPreviewOverlay}>
                  <Ionicons name="play" size={18} color={colors.white} />
                </View>
              </View>
              <View style={styles.videoTextBlock}>
                <AdaptiveText style={styles.videoFileName} numberOfLines={1}>
                  {selectedVideoAsset.fileName ?? "Selected video"}
                </AdaptiveText>
                <AdaptiveText style={styles.videoMeta}>
                  {selectedVideoDuration
                    ? `Ready to upload · ${selectedVideoDuration}`
                    : "Ready to upload"}
                </AdaptiveText>
              </View>
              <TouchableOpacity
                onPress={handleRemoveVideo}
                style={styles.removeImageButton}
              >
                <Ionicons name="close" size={14} color={colors.white} />
              </TouchableOpacity>
            </View>
          )}
        </View>

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
      fontFamily: "Poppins-Medium",
    },
    attachmentsSection: {
      width: "84%",
      marginBottom: 20,
    },
    attachmentsHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 8,
    },
    attachmentsCounter: {
      fontSize: 13,
      fontFamily: "Poppins-Medium",
      color: darkMode ? colors.lightGrey : colors.darkGrey,
    },
    attachmentsHint: {
      marginBottom: 12,
      fontSize: 14,
      fontFamily: "Poppins-Regular",
      lineHeight: 20,
      color: darkMode ? colors.lightGrey : colors.darkGrey,
    },
    imagePickerButton: {
      minHeight: 54,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: darkMode ? colors.mildDarkGrey : colors.lightGrey,
      backgroundColor: darkMode ? colors.averageDarkGrey : "#F7F7F7",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      paddingHorizontal: 16,
      marginBottom: 14,
    },
    imagePickerButtonDisabled: {
      opacity: 0.65,
    },
    imagePickerButtonText: {
      fontFamily: "Poppins-Medium",
      fontSize: 15,
    },
    imageGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
    },
    imageCard: {
      width: "30.5%",
      aspectRatio: 1,
      borderRadius: 18,
      overflow: "hidden",
      position: "relative",
      backgroundColor: darkMode ? colors.averageDarkGrey : colors.lightGrey,
    },
    imagePreview: {
      width: "100%",
      height: "100%",
    },
    removeImageButton: {
      position: "absolute",
      top: 8,
      right: 8,
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: "rgba(0, 0, 0, 0.72)",
      alignItems: "center",
      justifyContent: "center",
    },
    videoCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      borderWidth: 1,
      borderColor: darkMode ? colors.mildDarkGrey : colors.lightGrey,
      borderRadius: 18,
      backgroundColor: darkMode ? colors.averageDarkGrey : "#F7F7F7",
      paddingVertical: 12,
      paddingHorizontal: 16,
      position: "relative",
    },
    videoPreviewFrame: {
      width: 92,
      height: 68,
      borderRadius: 12,
      overflow: "hidden",
      backgroundColor: colors.black,
      position: "relative",
    },
    videoPreview: {
      width: "100%",
      height: "100%",
    },
    videoPreviewOverlay: {
      ...StyleSheet.absoluteFillObject,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(0, 0, 0, 0.16)",
    },
    videoTextBlock: {
      flex: 1,
      gap: 2,
    },
    videoFileName: {
      fontFamily: "Poppins-Regular",
      fontSize: 14,
    },
    videoMeta: {
      fontFamily: "Poppins-Regular",
      fontSize: 12,
      color: darkMode ? colors.lightGrey : colors.darkGrey,
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
