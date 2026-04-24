import { colors } from "@/constants/colors";
import { useAuth } from "@/contexts/AuthProvider";
import { useGlobal } from "@/contexts/GlobalProvider";
import { ForumPostsModel } from "@/data/models";
import { apiRequest } from "@/lib/api";
import { presentApiError } from "@/lib/api-feedback";
import { EvilIcons, Feather, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Keyboard,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { goTo } from "../utils";
import { AdaptiveText } from "./AdaptiveText";
import { AdaptiveView } from "./AdaptiveView";
import CustomImage from "./CustomImage";
import CustomModal from "./CustomModal";

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
  const [selectedReason, setSelectedReason] = useState<ReportReasonValue>(
    "Spam",
  );
  const [reportDescription, setReportDescription] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const { setShowFooter } = useGlobal();
  const compactTimestamp = formatPostTimestamp(item.CreatedAt, "compact");
  const detailedTimestamp = formatPostTimestamp(item.CreatedAt, "detailed");
  const isOwnPost = user ? String(user.Id) === String(item.UserId) : false;
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

  useEffect(() => {
    setLiked(item.IsLikedByCurrentUser ?? false);
    setLikesCount(item.LikesCount ?? 0);
    setBookmarked(item.IsBookmarked ?? false);
  }, [item.Id, item.IsBookmarked, item.IsLikedByCurrentUser, item.LikesCount]);

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
              <TouchableOpacity onPress={handleProfilePress}>
                <CustomImage
                  image={item.UserImage}
                  customStyles={styles.placeholder}
                />
              </TouchableOpacity>

              <AdaptiveView style={[styles.inner, styles.smallPostContentWrap]}>
                <View style={{ flexDirection: "row" }}>
                  <TouchableOpacity onPress={handleProfilePress}>
                    <View style={styles.postHeaderText}>
                      <AdaptiveText style={styles.postTitle}>
                        {item.UserName}
                      </AdaptiveText>
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
                <AdaptiveText style={styles.actionCount}>
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
                <AdaptiveText style={styles.postTitle}>
                  {item.UserName}
                </AdaptiveText>
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
            <AdaptiveText style={styles.actionCount}>{likesCount}</AdaptiveText>
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
    postHeaderText: {
      marginLeft: 10,
      flexShrink: 1,
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
    },
    postContent: {
      fontFamily: "Poppins-Light",
      marginLeft: 10,
      fontSize: 18,
      width: 300,
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
