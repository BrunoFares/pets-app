import { colors } from "@/constants/colors";
import { useAuth } from "@/contexts/AuthProvider";
import { useGlobal } from "@/contexts/GlobalProvider";
import { ForumPostAttachmentModel, ForumPostsModel } from "@/data/models";
import { apiRequest } from "@/lib/api";
import { presentApiError } from "@/lib/api-feedback";
import { EvilIcons, Feather, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  Keyboard,
  Modal,
  PanResponder,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { WebView } from "react-native-webview";
import { goTo } from "../utils";
import { AdaptiveText } from "./AdaptiveText";
import { AdaptiveView } from "./AdaptiveView";
import CustomImage from "./CustomImage";
import CustomModal from "./CustomModal";
import { VideoThumbnail } from "./VideoThumbnail";

const REPORT_REASONS = [
  {
    value: "Spam",
    label: "Spam",
    description: "Promotional, repetitive, or misleading content.",
  },
  {
    value: "Harassment",
    label: "Harassment",
    description: "Targeted bullying, threats, or hostile behavior.",
  },
  {
    value: "Abuse",
    label: "Abuse",
    description: "Cruel, violent, or exploitative content.",
  },
  {
    value: "Scam",
    label: "Scam",
    description: "Fraudulent, deceptive, or money-seeking behavior.",
  },
  {
    value: "InappropriateContent",
    label: "Inappropriate content",
    description: "Content that is graphic, offensive, or unsafe.",
  },
  {
    value: "Other",
    label: "Other",
    description: "Something else that should be reviewed.",
  },
] as const;

type ReportReasonValue = (typeof REPORT_REASONS)[number]["value"];

function formatPostTimestamp(
  createdAt: ForumPostsModel["CreatedAt"],
  variant: "compact" | "detailed",
) {
  const parsedDate = new Date(createdAt);

  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  const timeLabel = parsedDate.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  const dateLabel = parsedDate.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    ...(variant === "detailed" ? { year: "numeric" } : {}),
  });

  return variant === "detailed"
    ? `${timeLabel} · ${dateLabel}`
    : `${dateLabel} · ${timeLabel}`;
}

function getImageAttachments(attachments: ForumPostAttachmentModel[]) {
  return attachments.filter(
    (attachment) => attachment.MediaType !== "Video" && Boolean(attachment.Url),
  );
}

function getVideoAttachments(attachments: ForumPostAttachmentModel[]) {
  return attachments.filter(
    (attachment) => attachment.MediaType === "Video" && Boolean(attachment.Url),
  );
}

function buildVideoPlayerHtml(videoUrl: string) {
  // Use the native WebView player so forum videos can play without another
  // dedicated media dependency.
  return `<!DOCTYPE html>
<html>
  <head>
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
    />
    <style>
      html,
      body {
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
        background: #000;
      }

      video {
        width: 100%;
        height: 100%;
        object-fit: contain;
        background: #000;
      }
    </style>
  </head>
  <body>
    <video
      id="player"
      controls
      playsinline
      webkit-playsinline
      preload="auto"
      autoplay
      src=${JSON.stringify(videoUrl)}
    ></video>
    <script>
      const video = document.getElementById("player");

      async function attemptPlayback() {
        try {
          await video.play();
        } catch {}
      }

      window.addEventListener("load", attemptPlayback);
      video.addEventListener("canplay", attemptPlayback);
      video.addEventListener("loadedmetadata", attemptPlayback);
    </script>
  </body>
</html>`;
}

const ForumPost = ({
  item,
  size,
  onClickPost,
  onClickProfile,
  onReplySubmitted,
  onDeleted,
}: {
  item: ForumPostsModel;
  size?: "big" | "small";
  onClickPost?: () => void;
  onClickProfile?: () => void;
  onReplySubmitted?: () => void | Promise<void>;
  onDeleted?: (deletedPost: ForumPostsModel) => void | Promise<void>;
}) => {
  const darkMode = useColorScheme() === "dark";
  const router = useRouter();
  const styles = createStyles({ darkMode });
  const { user } = useAuth();
  const [liked, setLiked] = useState(item.IsLikedByCurrentUser ?? false);
  const [likesCount, setLikesCount] = useState(item.LikesCount ?? 0);
  const [bookmarked, setBookmarked] = useState(item.IsBookmarked ?? false);
  const [replyContent, setReplyContent] = useState("");
  const [isReplySubmitting, setIsReplySubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isOptionsVisible, setIsOptionsVisible] = useState(false);
  const [optionsStep, setOptionsStep] = useState<"menu" | "report">("menu");
  const [selectedReason, setSelectedReason] =
    useState<ReportReasonValue>("Spam");
  const [reportDescription, setReportDescription] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [isAttachmentViewerVisible, setIsAttachmentViewerVisible] =
    useState(false);
  const [selectedAttachmentIndex, setSelectedAttachmentIndex] = useState(0);
  const [selectedVideoAttachment, setSelectedVideoAttachment] =
    useState<ForumPostAttachmentModel | null>(null);
  const { setShowFooter } = useGlobal();
  const attachmentViewerWidth = Dimensions.get("window").width;
  const attachmentViewerHeight = Dimensions.get("window").height;
  const attachmentViewerScrollRef = useRef<ScrollView>(null);
  const attachmentViewerTranslateY = useRef(new Animated.Value(0)).current;
  const compactTimestamp = formatPostTimestamp(item.CreatedAt, "compact");
  const detailedTimestamp = formatPostTimestamp(item.CreatedAt, "detailed");
  const isOwnPost = user ? String(user.Id) === String(item.UserId) : false;
  const isVerifiedUser = Boolean(item.HasRegisteredPlace);
  const imageAttachments = getImageAttachments(item.Attachments ?? []);
  const videoAttachments = getVideoAttachments(item.Attachments ?? []);
  const selectedAttachment = imageAttachments[selectedAttachmentIndex] ?? null;
  const handlePostPress =
    onClickPost ?? (() => goTo(item, "/(tabs)/forum/post/[id]", router));
  const handleProfilePress =
    onClickProfile ??
    (() => {
      const payload = encodeURIComponent(JSON.stringify(item));

      router.push({
        pathname: "/(tabs)/forum/profile/[id]",
        params: {
          id: String(item.UserId),
          payload,
        },
      });
    });

  const openAttachmentViewer = useCallback((index: number) => {
    setSelectedAttachmentIndex(index);
    setIsAttachmentViewerVisible(true);
  }, []);

  const closeAttachmentViewer = useCallback(() => {
    setIsAttachmentViewerVisible(false);
    attachmentViewerTranslateY.setValue(0);
  }, [attachmentViewerTranslateY]);

  const closeVideoViewer = useCallback(() => {
    setSelectedVideoAttachment(null);
  }, []);

  const restoreAttachmentViewerPosition = useCallback(() => {
    Animated.spring(attachmentViewerTranslateY, {
      toValue: 0,
      useNativeDriver: true,
      bounciness: 6,
    }).start();
  }, [attachmentViewerTranslateY]);

  const dismissAttachmentViewerWithSwipe = useCallback(
    (verticalOffset: number) => {
      Animated.timing(attachmentViewerTranslateY, {
        toValue:
          (verticalOffset === 0 ? 1 : Math.sign(verticalOffset)) *
          attachmentViewerHeight,
        duration: 180,
        useNativeDriver: true,
      }).start(() => {
        closeAttachmentViewer();
      });
    },
    [attachmentViewerHeight, attachmentViewerTranslateY, closeAttachmentViewer],
  );

  const attachmentViewerPanResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponderCapture: (_, gestureState) =>
        Math.abs(gestureState.dy) > Math.abs(gestureState.dx) &&
        Math.abs(gestureState.dy) > 10,
      onPanResponderMove: (_, gestureState) => {
        attachmentViewerTranslateY.setValue(gestureState.dy);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (Math.abs(gestureState.dy) > 120) {
          dismissAttachmentViewerWithSwipe(gestureState.dy);
          return;
        }

        restoreAttachmentViewerPosition();
      },
      onPanResponderTerminate: () => {
        restoreAttachmentViewerPosition();
      },
    }),
  ).current;

  useEffect(() => {
    setLiked(item.IsLikedByCurrentUser ?? false);
    setLikesCount(item.LikesCount ?? 0);
    setBookmarked(item.IsBookmarked ?? false);
  }, [item.Id, item.IsBookmarked, item.IsLikedByCurrentUser, item.LikesCount]);

  useEffect(() => {
    if (!isAttachmentViewerVisible) {
      return;
    }

    attachmentViewerTranslateY.setValue(0);

    requestAnimationFrame(() => {
      attachmentViewerScrollRef.current?.scrollTo({
        x: selectedAttachmentIndex * attachmentViewerWidth,
        animated: false,
      });
    });
  }, [
    attachmentViewerTranslateY,
    attachmentViewerWidth,
    isAttachmentViewerVisible,
    selectedAttachmentIndex,
  ]);

  useEffect(() => {
    if (selectedAttachmentIndex >= imageAttachments.length) {
      setSelectedAttachmentIndex(Math.max(0, imageAttachments.length - 1));
    }

    if (imageAttachments.length === 0) {
      closeAttachmentViewer();
    }
  }, [closeAttachmentViewer, imageAttachments.length, selectedAttachmentIndex]);

  const resetReportDraft = () => {
    setOptionsStep("menu");
    setSelectedReason("Spam");
    setReportDescription("");
    setIsSubmittingReport(false);
  };

  const closeOptionsModal = () => {
    if (isDeleting || isSubmittingReport) {
      return;
    }

    setIsOptionsVisible(false);
    resetReportDraft();
  };

  const syncBookmark = async (nextBookmarked: boolean) => {
    if (nextBookmarked) {
      await apiRequest("/api/Users/bookmarks", {
        method: "POST",
        body: JSON.stringify({ forumPostId: item.Id }),
      });
      return;
    }

    await apiRequest(`/api/Users/bookmarks/${item.Id}`, {
      method: "DELETE",
    });
  };

  const syncLike = async (nextLiked: boolean) =>
    apiRequest<{ likesCount: number; isLikedByCurrentUser: boolean }>(
      `/api/ForumPosts/${item.Id}/like`,
      {
        method: nextLiked ? "POST" : "DELETE",
      },
    );

  const likePost = async () => {
    const nextLiked = !liked;
    const previousLiked = liked;
    const previousLikesCount = likesCount;

    setLiked(nextLiked);
    setLikesCount(Math.max(0, previousLikesCount + (nextLiked ? 1 : -1)));

    try {
      const response = await syncLike(nextLiked);
      setLiked(response.isLikedByCurrentUser);
      setLikesCount(response.likesCount);
    } catch (error) {
      setLiked(previousLiked);
      setLikesCount(previousLikesCount);
      presentApiError("Unable to update like", error, {
        networkMessage:
          "We couldn't reach the server, so the like status was not updated.",
      });
    }
  };

  const bookmarkPost = async () => {
    const nextBookmarked = !bookmarked;
    setBookmarked(nextBookmarked);

    try {
      await syncBookmark(nextBookmarked);
    } catch (error) {
      setBookmarked(!nextBookmarked);
      presentApiError("Unable to update bookmark", error, {
        networkMessage:
          "We couldn't reach the server, so the bookmark was not updated.",
      });
    }
  };

  const handleReply = async () => {
    const trimmedReply = replyContent.trim();

    if (!trimmedReply) {
      Alert.alert("Missing content", "Please write a reply before sending.");
      return;
    }

    try {
      setIsReplySubmitting(true);
      await apiRequest(`/api/ForumPosts/${item.Id}/reply`, {
        method: "POST",
        body: JSON.stringify({
          content: trimmedReply,
          attachments: [],
        }),
      });

      setReplyContent("");
      Keyboard.dismiss();
      setShowFooter?.(true);
      await onReplySubmitted?.();
    } catch (error) {
      presentApiError("Unable to reply", error, {
        networkMessage:
          "We couldn't reach the server, so your reply was not published.",
      });
    } finally {
      setIsReplySubmitting(false);
    }
  };

  const deletePost = async () => {
    if (isDeleting) {
      return;
    }

    try {
      setIsDeleting(true);
      await apiRequest(`/api/ForumPosts/${item.Id}`, {
        method: "DELETE",
      });
      setIsOptionsVisible(false);
      await onDeleted?.(item);
    } catch (error) {
      presentApiError("Unable to delete post", error, {
        networkMessage:
          "We couldn't reach the server, so your post was not deleted.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const submitPostReport = async () => {
    try {
      setIsSubmittingReport(true);
      await apiRequest("/api/Reports", {
        method: "POST",
        body: JSON.stringify({
          targetType: "ForumPost",
          targetId: item.Id,
          reasonType: selectedReason,
          description: reportDescription.trim() || null,
        }),
      });

      setIsOptionsVisible(false);
      resetReportDraft();
      Keyboard.dismiss();
      Alert.alert(
        "Report submitted",
        "Thanks for the report. We'll review this post.",
      );
    } catch (error) {
      presentApiError("Unable to submit report", error, {
        networkMessage:
          "We couldn't reach the server, so the report was not submitted.",
      });
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const renderAttachments = (variant: "small" | "big") => {
    if (imageAttachments.length === 0) {
      return null;
    }

    const visibleAttachments = imageAttachments.slice(0, 4);
    const overflowCount = imageAttachments.length - visibleAttachments.length;
    const isSmallVariant = variant === "small";

    const renderAttachmentTile = (
      attachment: ForumPostAttachmentModel,
      index: number,
      customStyle: object,
    ) => {
      const showOverflowCount =
        overflowCount > 0 && index === visibleAttachments.length - 1;

      return (
        <TouchableOpacity
          key={`${attachment.Id}-${index}`}
          activeOpacity={0.92}
          onPress={() => openAttachmentViewer(index)}
          style={[styles.attachmentTile, customStyle]}
        >
          <Image
            source={{ uri: attachment.Url }}
            style={styles.attachmentImage}
            resizeMode="cover"
          />

          {showOverflowCount ? (
            <View style={styles.attachmentOverflow}>
              <AdaptiveText style={styles.attachmentOverflowText}>
                +{overflowCount}
              </AdaptiveText>
            </View>
          ) : null}
        </TouchableOpacity>
      );
    };

    let attachmentLayout: React.ReactNode;

    if (visibleAttachments.length === 1) {
      attachmentLayout = renderAttachmentTile(
        visibleAttachments[0],
        0,
        isSmallVariant
          ? styles.attachmentTileSingleSmall
          : styles.attachmentTileSingleBig,
      );
    } else if (visibleAttachments.length === 2) {
      attachmentLayout = (
        <View
          style={[
            styles.attachmentsRow,
            isSmallVariant
              ? styles.attachmentsRowTwoSmall
              : styles.attachmentsRowTwoBig,
          ]}
        >
          {renderAttachmentTile(visibleAttachments[0], 0, [
            styles.attachmentTileFlex,
            { borderTopRightRadius: 0, borderBottomRightRadius: 0 },
          ])}
          {renderAttachmentTile(visibleAttachments[1], 1, [
            styles.attachmentTileFlex,
            { borderTopLeftRadius: 0, borderBottomLeftRadius: 0 },
          ])}
        </View>
      );
    } else if (visibleAttachments.length === 3) {
      attachmentLayout = (
        <View
          style={[
            styles.attachmentsRow,
            isSmallVariant
              ? styles.attachmentsRowThreeSmall
              : styles.attachmentsRowThreeBig,
          ]}
        >
          {renderAttachmentTile(visibleAttachments[0], 0, [
            styles.attachmentTileFlex,
            { borderTopRightRadius: 0, borderBottomRightRadius: 0 },
          ])}
          <View style={styles.attachmentsColumn}>
            {renderAttachmentTile(visibleAttachments[1], 1, [
              styles.attachmentTileFlex,
              {
                borderTopLeftRadius: 0,
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0,
              },
            ])}
            {renderAttachmentTile(visibleAttachments[2], 2, [
              styles.attachmentTileFlex,
              {
                borderTopLeftRadius: 0,
                borderBottomLeftRadius: 0,
                borderTopRightRadius: 0,
              },
            ])}
          </View>
        </View>
      );
    } else {
      attachmentLayout = (
        <View
          style={[
            styles.attachmentsRow,
            isSmallVariant
              ? styles.attachmentsRowFourSmall
              : styles.attachmentsRowFourBig,
          ]}
        >
          <View style={styles.attachmentsColumn}>
            {renderAttachmentTile(visibleAttachments[0], 0, [
              styles.attachmentTileFlex,
              {
                borderTopRightRadius: 0,
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0,
              },
            ])}
            {renderAttachmentTile(visibleAttachments[2], 2, [
              styles.attachmentTileFlex,
              {
                borderTopLeftRadius: 0,
                borderTopRightRadius: 0,
                borderBottomRightRadius: 0,
              },
            ])}
          </View>
          <View style={styles.attachmentsColumn}>
            {renderAttachmentTile(visibleAttachments[1], 1, [
              styles.attachmentTileFlex,
              {
                borderTopLeftRadius: 0,
                borderBottomRightRadius: 0,
                borderBottomLeftRadius: 0,
              },
            ])}
            {renderAttachmentTile(visibleAttachments[3], 3, [
              styles.attachmentTileFlex,
              {
                borderTopLeftRadius: 0,
                borderBottomLeftRadius: 0,
                borderTopRightRadius: 0,
              },
            ])}
          </View>
        </View>
      );
    }

    return (
      <View
        style={[
          styles.attachmentsSection,
          variant === "small"
            ? styles.attachmentsSectionSmall
            : styles.attachmentsSectionBig,
        ]}
      >
        {attachmentLayout}
      </View>
    );
  };

  const renderVideoAttachments = (variant: "small" | "big") => {
    if (videoAttachments.length === 0) {
      return null;
    }

    const isSmallVariant = variant === "small";

    return (
      <View
        style={[
          styles.attachmentsSection,
          variant === "small"
            ? styles.attachmentsSectionSmall
            : styles.attachmentsSectionBig,
        ]}
      >
        <View style={styles.videoAttachmentList}>
          {videoAttachments.map((attachment) => (
            <TouchableOpacity
              key={String(attachment.Id)}
              activeOpacity={0.92}
              onPress={() => setSelectedVideoAttachment(attachment)}
              style={[
                styles.videoAttachmentCard,
                isSmallVariant
                  ? styles.videoAttachmentCardSmall
                  : styles.videoAttachmentCardBig,
              ]}
            >
              <VideoThumbnail
                uri={attachment.Url}
                style={styles.videoAttachmentThumbnail}
              />
              <View style={styles.videoAttachmentOverlay}>
                <View style={styles.videoAttachmentPlayButton}>
                  <Ionicons name="play" size={24} color={colors.white} />
                </View>
              </View>
              <View style={styles.videoAttachmentFooter}>
                <AdaptiveText style={styles.videoAttachmentFooterText}>
                  Tap to play
                </AdaptiveText>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderAttachmentViewer = () => (
    <Modal
      visible={isAttachmentViewerVisible}
      transparent
      animationType="fade"
      onRequestClose={closeAttachmentViewer}
    >
      <View style={styles.attachmentViewerOverlay}>
        <Animated.View
          style={[
            styles.attachmentViewerContent,
            {
              transform: [{ translateY: attachmentViewerTranslateY }],
            },
          ]}
          {...attachmentViewerPanResponder.panHandlers}
        >
          <TouchableOpacity
            onPress={closeAttachmentViewer}
            style={styles.attachmentViewerCloseButton}
          >
            <Ionicons name="close" size={22} color={colors.white} />
          </TouchableOpacity>

          {isAttachmentViewerVisible && selectedAttachment ? (
            <View style={styles.attachmentViewerCounter}>
              <AdaptiveText style={styles.attachmentViewerCounterText}>
                {selectedAttachmentIndex + 1} / {imageAttachments.length}
              </AdaptiveText>
            </View>
          ) : null}

          <ScrollView
            ref={attachmentViewerScrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            bounces={false}
            onMomentumScrollEnd={(event) => {
              if (!isAttachmentViewerVisible) {
                return;
              }

              const nextIndex = Math.round(
                event.nativeEvent.contentOffset.x / attachmentViewerWidth,
              );
              const boundedIndex = Math.max(
                0,
                Math.min(imageAttachments.length - 1, nextIndex),
              );

              setSelectedAttachmentIndex(boundedIndex);
            }}
          >
            {imageAttachments.map((attachment) => (
              <View
                key={String(attachment.Id)}
                style={[
                  styles.attachmentViewerPage,
                  { width: attachmentViewerWidth },
                ]}
              >
                <Image
                  source={{ uri: attachment.Url }}
                  style={styles.attachmentViewerImage}
                  resizeMode="contain"
                />
              </View>
            ))}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );

  const renderVideoViewer = () => (
    <Modal
      visible={Boolean(selectedVideoAttachment)}
      transparent
      animationType="fade"
      onRequestClose={closeVideoViewer}
    >
      <View style={styles.attachmentViewerOverlay}>
        <View
          style={[
            styles.videoViewerFrame,
            {
              width: Math.max(attachmentViewerWidth - 24, 0),
              height: Math.min(attachmentViewerHeight * 0.72, 520),
            },
          ]}
        >
          <TouchableOpacity
            onPress={closeVideoViewer}
            style={styles.videoViewerCloseButton}
          >
            <Ionicons name="close" size={22} color={colors.white} />
          </TouchableOpacity>

          {selectedVideoAttachment ? (
            <WebView
              originWhitelist={["*"]}
              source={{
                html: buildVideoPlayerHtml(selectedVideoAttachment.Url),
              }}
              allowsInlineMediaPlayback
              mediaPlaybackRequiresUserAction={false}
              allowsFullscreenVideo
              mixedContentMode="always"
              scrollEnabled={false}
              bounces={false}
              style={styles.videoViewerWebView}
            />
          ) : null}
        </View>
      </View>
    </Modal>
  );

  const renderOptionsModal = () => (
    <CustomModal visible={isOptionsVisible} onClose={closeOptionsModal}>
      <ScrollView
        style={styles.optionsModalScroll}
        contentContainerStyle={styles.optionsModalContent}
        keyboardShouldPersistTaps="handled"
      >
        {optionsStep === "menu" ? (
          <>
            <AdaptiveText style={styles.optionsModalTitle}>
              Post options
            </AdaptiveText>

            {isOwnPost ? (
              <AdaptiveText style={styles.optionsModalSubtitle}>
                You can delete this post from the forum.
              </AdaptiveText>
            ) : (
              <AdaptiveText style={styles.optionsModalSubtitle}>
                Report this post if it breaks the forum rules.
              </AdaptiveText>
            )}

            {isOwnPost ? (
              <TouchableOpacity
                onPress={deletePost}
                disabled={isDeleting}
                style={[
                  styles.modalActionButton,
                  styles.deleteActionButton,
                  isDeleting ? styles.modalActionButtonDisabled : null,
                ]}
              >
                <AdaptiveText style={styles.deleteActionText}>
                  {isDeleting ? "Deleting..." : "Delete post"}
                </AdaptiveText>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => setOptionsStep("report")}
                style={[styles.modalActionButton, styles.reportActionButton]}
              >
                <AdaptiveText style={styles.reportActionText}>
                  Report post
                </AdaptiveText>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={closeOptionsModal}
              disabled={isDeleting || isSubmittingReport}
              style={[
                styles.modalActionButton,
                styles.closeActionButton,
                isDeleting || isSubmittingReport
                  ? styles.modalActionButtonDisabled
                  : null,
              ]}
            >
              <AdaptiveText style={styles.closeActionText}>Close</AdaptiveText>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <AdaptiveText style={styles.optionsModalTitle}>
              Report post
            </AdaptiveText>
            <AdaptiveText style={styles.optionsModalSubtitle}>
              Choose a reason and add any helpful details for the moderation
              team.
            </AdaptiveText>

            <View style={styles.reportReasonList}>
              {REPORT_REASONS.map((reason) => {
                const isSelected = reason.value === selectedReason;

                return (
                  <TouchableOpacity
                    key={reason.value}
                    onPress={() => setSelectedReason(reason.value)}
                    style={[
                      styles.reportReasonButton,
                      isSelected ? styles.reportReasonButtonSelected : null,
                    ]}
                  >
                    <AdaptiveText
                      style={[
                        styles.reportReasonLabel,
                        isSelected ? styles.reportReasonLabelSelected : null,
                      ]}
                    >
                      {reason.label}
                    </AdaptiveText>
                    <AdaptiveText
                      style={[
                        styles.reportReasonDescription,
                        isSelected
                          ? styles.reportReasonDescriptionSelected
                          : null,
                      ]}
                    >
                      {reason.description}
                    </AdaptiveText>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TextInput
              value={reportDescription}
              onChangeText={setReportDescription}
              multiline
              editable={!isSubmittingReport}
              textAlignVertical="top"
              placeholder="Additional details (optional)"
              placeholderTextColor={
                darkMode ? colors.lightGrey : colors.darkGrey
              }
              style={styles.reportDescriptionInput}
            />

            <AdaptiveText style={styles.reportDescriptionHint}>
              A short explanation helps moderators review the report faster.
            </AdaptiveText>

            <TouchableOpacity
              onPress={submitPostReport}
              disabled={isSubmittingReport}
              style={[
                styles.modalActionButton,
                styles.submitActionButton,
                isSubmittingReport ? styles.modalActionButtonDisabled : null,
              ]}
            >
              <AdaptiveText style={styles.submitActionText}>
                {isSubmittingReport ? "Submitting..." : "Submit report"}
              </AdaptiveText>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                if (isSubmittingReport) {
                  return;
                }

                setOptionsStep("menu");
              }}
              disabled={isSubmittingReport}
              style={[
                styles.modalActionButton,
                styles.closeActionButton,
                isSubmittingReport ? styles.modalActionButtonDisabled : null,
              ]}
            >
              <AdaptiveText style={styles.closeActionText}>Back</AdaptiveText>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </CustomModal>
  );

  if (size === "small") {
    return (
      <>
        <View style={styles.post}>
          <TouchableOpacity onPress={handlePostPress}>
            <AdaptiveView style={[styles.inner, styles.smallPostBody]}>
              <TouchableOpacity
                style={{ height: 0 }}
                onPress={handleProfilePress}
              >
                <CustomImage
                  image={item.UserImage}
                  customStyles={styles.placeholder}
                />
              </TouchableOpacity>

              <AdaptiveView style={[styles.inner, styles.smallPostContentWrap]}>
                <View style={{ flexDirection: "row" }}>
                  <TouchableOpacity onPress={handleProfilePress}>
                    <View style={styles.postHeaderText}>
                      <View style={styles.postTitleRow}>
                        <AdaptiveText style={styles.postTitle}>
                          {item.UserName}
                        </AdaptiveText>
                        {isVerifiedUser ? (
                          <Ionicons
                            name="checkmark-circle"
                            size={16}
                            color={colors.green}
                            style={styles.verifiedBadge}
                          />
                        ) : null}
                      </View>
                      {compactTimestamp ? (
                        <AdaptiveText style={styles.postTimestamp}>
                          {compactTimestamp}
                        </AdaptiveText>
                      ) : null}
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setIsOptionsVisible(true)}
                    style={styles.optionsButton}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons
                      name="ellipsis-horizontal"
                      size={18}
                      color={darkMode ? colors.white : colors.black}
                    />
                  </TouchableOpacity>
                </View>

                {item.IsAReply && (
                  <TouchableOpacity
                    style={styles.reply}
                    onPress={handlePostPress}
                  >
                    <AdaptiveText style={styles.replyTxt}>
                      Replying to another post
                    </AdaptiveText>
                  </TouchableOpacity>
                )}

                <AdaptiveText style={styles.postContent}>
                  {item.Content}
                </AdaptiveText>

                {renderAttachments("small")}
                {renderVideoAttachments("small")}
              </AdaptiveView>
            </AdaptiveView>

            <AdaptiveView style={[styles.inner, styles.additionalRowSmall]}>
              <TouchableOpacity
                onPress={handlePostPress}
                style={styles.actionButton}
              >
                <EvilIcons
                  name="comment"
                  size={26}
                  color={darkMode ? colors.white : colors.black}
                />
                {typeof item.RepliesCount === "number" ? (
                  <AdaptiveText style={styles.actionCount}>
                    {item.RepliesCount}
                  </AdaptiveText>
                ) : null}
              </TouchableOpacity>

              <TouchableOpacity onPress={likePost} style={styles.actionButton}>
                {liked ? (
                  <Ionicons name="heart-sharp" size={18} color={colors.green} />
                ) : (
                  <Ionicons
                    name="heart-outline"
                    size={18}
                    color={darkMode ? colors.white : colors.black}
                  />
                )}
                <AdaptiveText
                  style={[styles.actionCount, liked && { color: colors.green }]}
                >
                  {likesCount}
                </AdaptiveText>
              </TouchableOpacity>

              <TouchableOpacity onPress={bookmarkPost}>
                {bookmarked ? (
                  <Ionicons name="bookmark" size={18} color={colors.green} />
                ) : (
                  <Ionicons
                    name="bookmark-outline"
                    size={18}
                    color={darkMode ? colors.white : colors.black}
                  />
                )}
              </TouchableOpacity>

              <TouchableOpacity>
                <Feather
                  name="share"
                  size={18}
                  color={darkMode ? colors.white : colors.black}
                />
              </TouchableOpacity>
            </AdaptiveView>
          </TouchableOpacity>
        </View>
        {renderOptionsModal()}
        {renderAttachmentViewer()}
        {renderVideoViewer()}
      </>
    );
  } else if (size === "big") {
    return (
      <>
        <View style={{ marginHorizontal: 20 }}>
          <View style={styles.bigHeaderRow}>
            <TouchableOpacity
              style={styles.bigHeaderProfile}
              onPress={handleProfilePress}
            >
              <CustomImage
                image={item.UserImage}
                customStyles={styles.placeholder}
              />
              <View style={styles.postHeaderText}>
                <View style={styles.postTitleRow}>
                  <AdaptiveText style={styles.postTitle}>
                    {item.UserName}
                  </AdaptiveText>
                  {isVerifiedUser ? (
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color={colors.green}
                      style={styles.verifiedBadge}
                    />
                  ) : null}
                </View>
                {detailedTimestamp ? (
                  <AdaptiveText style={styles.postTimestamp}>
                    {detailedTimestamp}
                  </AdaptiveText>
                ) : null}
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setIsOptionsVisible(true)}
              style={styles.optionsButton}
              // hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name="ellipsis-horizontal"
                size={18}
                color={darkMode ? colors.white : colors.black}
              />
            </TouchableOpacity>
          </View>
          <AdaptiveText style={styles.postBody}>{item.Content}</AdaptiveText>
          {renderAttachments("big")}
          {renderVideoAttachments("big")}
        </View>

        <View style={styles.additionalRowBig}>
          <TouchableOpacity style={styles.actionButton}>
            <EvilIcons
              name="comment"
              size={26}
              color={darkMode ? colors.white : colors.black}
            />
            {typeof item.RepliesCount === "number" ? (
              <AdaptiveText style={styles.actionCount}>
                {item.RepliesCount}
              </AdaptiveText>
            ) : null}
          </TouchableOpacity>

          <TouchableOpacity onPress={likePost} style={styles.actionButton}>
            {liked ? (
              <Ionicons name="heart-sharp" size={18} color={colors.green} />
            ) : (
              <Ionicons
                name="heart-outline"
                size={18}
                color={darkMode ? colors.white : colors.black}
              />
            )}
            <AdaptiveText
              style={[styles.actionCount, liked && { color: colors.green }]}
            >
              {likesCount}
            </AdaptiveText>
          </TouchableOpacity>

          <TouchableOpacity onPress={bookmarkPost}>
            {bookmarked ? (
              <Ionicons name="bookmark" size={18} color={colors.green} />
            ) : (
              <Ionicons
                name="bookmark-outline"
                size={18}
                color={darkMode ? colors.white : colors.black}
              />
            )}
          </TouchableOpacity>

          <TouchableOpacity>
            <Feather
              name="share"
              size={18}
              color={darkMode ? colors.white : colors.black}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.textInputContainer}>
          <TextInput
            style={styles.textInput}
            value={replyContent}
            onChangeText={setReplyContent}
            placeholder={`Reply to ${item.UserName}...`}
            placeholderTextColor={darkMode ? colors.lightGrey : colors.darkGrey}
            onFocus={() => setShowFooter?.(false)}
            onBlur={() => setShowFooter?.(true)}
            editable={!isReplySubmitting}
            multiline
          />
          <TouchableOpacity
            style={styles.replyButton}
            disabled={isReplySubmitting}
            onPress={handleReply}
          >
            <Feather
              name="arrow-right"
              size={24}
              color={
                isReplySubmitting
                  ? darkMode
                    ? colors.lightGrey
                    : colors.darkGrey
                  : darkMode
                    ? colors.white
                    : colors.black
              }
            />
          </TouchableOpacity>
        </View>
        {renderOptionsModal()}
        {renderAttachmentViewer()}
        {renderVideoViewer()}
      </>
    );
  } else {
    return <AdaptiveText>Post unavailable.</AdaptiveText>;
  }
};

const createStyles = ({ darkMode }: any) => {
  return StyleSheet.create({
    placeholder: {
      borderRadius: 52,
      width: 52,
      height: 52,
    },
    post: {
      paddingHorizontal: 20,
      paddingVertical: 15,
      borderBottomColor: darkMode ? colors.darkGrey : colors.lightGrey,
      borderBottomWidth: 1,
      backgroundColor: darkMode ? colors.veryDarkGrey : colors.white,
      position: "relative",
    },
    inner: {
      backgroundColor: darkMode ? colors.veryDarkGrey : colors.white,
    },
    smallPostBody: {
      flexDirection: "row",
    },
    smallPostContentWrap: {
      flex: 1,
    },
    postTitle: {
      fontFamily: "Poppins-SemiBold",
      fontSize: 18,
      marginBottom: -6,
    },
    postTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      flexWrap: "wrap",
    },
    postHeaderText: {
      marginLeft: 10,
      flexShrink: 1,
    },
    verifiedBadge: {
      marginTop: 1,
    },
    optionsButton: {
      alignItems: "center",
      justifyContent: "center",
      minWidth: 28,
      minHeight: 28,
      marginLeft: "auto",
    },
    bigHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginVertical: 16,
      gap: 12,
    },
    bigHeaderProfile: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
      flex: 1,
    },
    postTimestamp: {
      fontFamily: "Poppins-Regular",
      fontSize: 12,
      color: darkMode ? colors.lightGrey : colors.darkGrey,
      marginTop: Platform.select({
        ios: 4,
        android: -2,
      }),
    },
    postContent: {
      fontFamily: "Poppins-Light",
      marginLeft: 10,
      marginTop: 4,
      fontSize: 17,
      lineHeight: 24,
      flexShrink: 1,
    },
    attachmentsSection: {
      width: "100%",
    },
    attachmentsSectionSmall: {
      marginTop: 8,
      paddingLeft: 10,
      alignSelf: "flex-start",
    },
    attachmentsSectionBig: {
      marginTop: 16,
    },
    attachmentsRow: {
      flexDirection: "row",
      gap: 2,
    },
    attachmentsRowTwoSmall: {
      height: 160,
    },
    attachmentsRowTwoBig: {
      height: 220,
    },
    attachmentsRowThreeSmall: {
      height: 190,
    },
    attachmentsRowThreeBig: {
      height: 260,
    },
    attachmentsRowFourSmall: {
      height: 190,
    },
    attachmentsRowFourBig: {
      height: 260,
    },
    attachmentsColumn: {
      flex: 1,
      gap: 4,
    },
    attachmentTile: {
      flex: 1,
      overflow: "hidden",
      borderRadius: 18,
      backgroundColor: darkMode ? colors.averageDarkGrey : colors.lightGrey,
      position: "relative",
    },
    attachmentTileFlex: {
      flex: 1,
    },
    attachmentTileSingleSmall: {
      width: "100%",
      height: 190,
    },
    attachmentTileSingleBig: {
      width: "100%",
      height: 280,
    },
    attachmentImage: {
      height: "100%",
    },
    attachmentOverflow: {
      ...StyleSheet.absoluteFillObject,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(0, 0, 0, 0.42)",
    },
    attachmentOverflowText: {
      color: colors.white,
      fontFamily: "Poppins-Bold",
      fontSize: 24,
    },
    videoAttachmentList: {
      gap: 10,
    },
    videoAttachmentCard: {
      width: "100%",
      overflow: "hidden",
      borderRadius: 18,
      backgroundColor: colors.black,
      position: "relative",
    },
    videoAttachmentCardSmall: {
      height: 190,
    },
    videoAttachmentCardBig: {
      height: 280,
    },
    videoAttachmentThumbnail: {
      ...StyleSheet.absoluteFillObject,
    },
    videoAttachmentOverlay: {
      ...StyleSheet.absoluteFillObject,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(0, 0, 0, 0.18)",
    },
    videoAttachmentPlayButton: {
      width: 60,
      height: 60,
      borderRadius: 30,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(0, 0, 0, 0.48)",
    },
    videoAttachmentFooter: {
      position: "absolute",
      left: 12,
      right: 12,
      bottom: 12,
      alignItems: "flex-start",
    },
    videoAttachmentFooterText: {
      color: colors.white,
      fontFamily: "Poppins-Medium",
      fontSize: 13,
      backgroundColor: "rgba(0, 0, 0, 0.58)",
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
    },
    attachmentViewerOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.92)",
      justifyContent: "center",
      alignItems: "center",
    },
    attachmentViewerContent: {
      width: "100%",
      height: "100%",
      justifyContent: "center",
    },
    attachmentViewerCloseButton: {
      position: "absolute",
      top: 52,
      right: 20,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: "rgba(255, 255, 255, 0.14)",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1,
    },
    attachmentViewerCounter: {
      position: "absolute",
      top: 58,
      alignSelf: "center",
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: "rgba(255, 255, 255, 0)",
      zIndex: 1,
    },
    attachmentViewerCounterText: {
      color: colors.white,
      fontFamily: "Poppins-Medium",
      fontSize: 13,
    },
    attachmentViewerPage: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: 32,
    },
    attachmentViewerImage: {
      width: "100%",
      height: "82%",
    },
    videoViewerFrame: {
      overflow: "hidden",
      borderRadius: 22,
      backgroundColor: colors.black,
    },
    videoViewerCloseButton: {
      position: "absolute",
      top: 14,
      right: 14,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: "rgba(255, 255, 255, 0.14)",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1,
    },
    videoViewerWebView: {
      flex: 1,
      backgroundColor: colors.black,
    },
    additionalRowSmall: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 10,
    },
    actionButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    actionCount: {
      fontFamily: "Poppins-Medium",
      fontSize: 12,
      color: darkMode ? colors.lightGrey : colors.darkGrey,
    },
    additionalRowBig: {
      borderTopColor: darkMode ? colors.darkGrey : colors.lightGrey,
      borderTopWidth: 1,
      borderBottomColor: darkMode ? colors.darkGrey : colors.lightGrey,
      borderBottomWidth: 1,
      paddingHorizontal: 20,
      paddingVertical: 10,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 20,
    },
    textInputContainer: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      borderBottomColor: darkMode ? colors.darkGrey : colors.lightGrey,
      borderBottomWidth: 1,
    },
    textInput: {
      width: "80%",
      fontFamily: "Poppins-Regular",
      fontSize: 18,
      paddingVertical: 20,
      color: darkMode ? colors.white : colors.black,
    },
    replyButton: {
      padding: 10,
    },
    postBody: {
      fontFamily: "Poppins-Regular",
      fontSize: 20,
      lineHeight: 30,
    },
    reply: {
      marginLeft: 10,
    },
    replyTxt: {
      fontFamily: "Poppins-Medium",
      fontSize: 12,
      color: colors.green,
    },
    optionsModalContent: {
      width: "100%",
      paddingBottom: 32,
      alignItems: "center",
    },
    optionsModalScroll: {
      width: "100%",
    },
    optionsModalTitle: {
      fontFamily: "Poppins-Bold",
      fontSize: 24,
      textAlign: "center",
    },
    optionsModalSubtitle: {
      fontFamily: "Poppins-Regular",
      fontSize: 15,
      textAlign: "center",
      marginTop: 12,
      marginBottom: 28,
      color: darkMode ? colors.lightGrey : colors.darkGrey,
      lineHeight: 22,
    },
    modalActionButton: {
      width: "100%",
      borderRadius: 18,
      paddingVertical: 16,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 12,
    },
    modalActionButtonDisabled: {
      opacity: 0.6,
    },
    deleteActionButton: {
      backgroundColor: "#FCE8E8",
    },
    deleteActionText: {
      color: "#B3261E",
      fontFamily: "Poppins-SemiBold",
      fontSize: 16,
    },
    reportActionButton: {
      backgroundColor: darkMode ? "#243327" : "#E8F4EA",
    },
    reportActionText: {
      color: darkMode ? colors.white : colors.black,
      fontFamily: "Poppins-SemiBold",
      fontSize: 16,
    },
    reportReasonList: {
      width: "100%",
      gap: 10,
      marginBottom: 18,
    },
    reportReasonButton: {
      width: "100%",
      borderRadius: 18,
      paddingVertical: 14,
      paddingHorizontal: 16,
      backgroundColor: darkMode ? colors.veryDarkGrey : colors.lightGrey,
      borderWidth: 1,
      borderColor: "transparent",
      gap: 4,
    },
    reportReasonButtonSelected: {
      borderColor: colors.green,
      backgroundColor: darkMode ? "#1E2A20" : "#EEF7EF",
    },
    reportReasonLabel: {
      fontFamily: "Poppins-SemiBold",
      fontSize: 15,
      color: darkMode ? colors.white : colors.black,
    },
    reportReasonLabelSelected: {
      color: colors.green,
    },
    reportReasonDescription: {
      fontFamily: "Poppins-Regular",
      fontSize: 12,
      color: darkMode ? colors.lightGrey : colors.darkGrey,
      lineHeight: 18,
    },
    reportReasonDescriptionSelected: {
      color: darkMode ? "#CFE7D3" : "#47624C",
    },
    reportDescriptionInput: {
      width: "100%",
      minHeight: 112,
      borderRadius: 18,
      paddingHorizontal: 16,
      paddingVertical: 14,
      marginBottom: 10,
      backgroundColor: darkMode ? colors.veryDarkGrey : colors.lightGrey,
      color: darkMode ? colors.white : colors.black,
      fontFamily: "Poppins-Regular",
      fontSize: 15,
      textAlignVertical: "top",
    },
    reportDescriptionHint: {
      width: "100%",
      marginBottom: 22,
      fontFamily: "Poppins-Regular",
      fontSize: 12,
      lineHeight: 18,
      color: darkMode ? colors.lightGrey : colors.darkGrey,
    },
    submitActionButton: {
      backgroundColor: colors.green,
    },
    submitActionText: {
      color: colors.white,
      fontFamily: "Poppins-SemiBold",
      fontSize: 16,
    },
    closeActionButton: {
      backgroundColor: darkMode ? colors.veryDarkGrey : colors.lightGrey,
    },
    closeActionText: {
      color: darkMode ? colors.white : colors.black,
      fontFamily: "Poppins-SemiBold",
      fontSize: 16,
    },
  });
};

export default ForumPost;
