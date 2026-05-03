import { AdaptiveText } from "@/components/AdaptiveText";
import CustomImage from "@/components/CustomImage";
import CustomModal from "@/components/CustomModal";
import ForumPost from "@/components/ForumPost";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { PageHeader } from "@/components/PageHeader";
import { colors } from "@/constants/colors";
import { useAuth } from "@/contexts/AuthProvider";
import { AppUsersModel, ForumPostsModel } from "@/data/models";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { apiRequest, resolveApiUrlWithCacheBust } from "@/lib/api";
import { presentApiError } from "@/lib/api-feedback";
import { ApiForumPostResponse, normalizeForumPost } from "@/lib/forum-api";
import { createConversation } from "@/lib/messages-api";
import {
  applyRegisteredPlaceFlags,
  getRegisteredPlaceOwnerIds,
} from "@/lib/place-owner-lookup";
import { blockUser, isUserBlocked, unblockUser } from "@/lib/user-blocks";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  FlatList,
  Keyboard,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const REPORT_REASONS = [
  {
    value: "Spam",
    label: "Spam",
    description: "Promotional, repetitive, or misleading behavior.",
  },
  {
    value: "Harassment",
    label: "Harassment",
    description: "Targeted bullying, threats, or hostile behavior.",
  },
  {
    value: "Abuse",
    label: "Abuse",
    description: "Cruel, violent, or exploitative behavior.",
  },
  {
    value: "Scam",
    label: "Scam",
    description: "Fraudulent, deceptive, or suspicious activity.",
  },
  {
    value: "InappropriateContent",
    label: "Inappropriate content",
    description: "Content or behavior that is graphic or unsafe.",
  },
  {
    value: "Other",
    label: "Other",
    description: "Something else that should be reviewed.",
  },
] as const;

type ReportReasonValue = (typeof REPORT_REASONS)[number]["value"];

type ApiForumUserProfileResponse = {
  id: number;
  name: string;
  image?: string | null;
  description?: string | null;
};

const mapApiForumUserToModel = (
  user: ApiForumUserProfileResponse,
  avatarCacheKey?: string | number,
): AppUsersModel => ({
  Id: user.id,
  Name: user.name,
  FirstName: "",
  LastName: "",
  Email: "",
  PhoneNumber: "",
  PasswordHash: "",
  Image: resolveApiUrlWithCacheBust(user.image ?? null, avatarCacheKey),
  CreatedAt: "",
  LastLogin: null,
  Description: user.description ?? "",
  BookmarkedPostID: [],
});

const ProfileScreen = () => {
  const { id, payload } = useLocalSearchParams<{
    id?: string;
    payload?: any;
  }>();
  const { user: currentUser } = useAuth();
  const darkMode = useColorScheme() === "dark";
  const styles = createStyles({ darkMode });
  const [user, setUser] = useState<AppUsersModel>();
  const router = useRouter();

  const labels = ["Posts", "Posts & Replies"];
  const { width } = useWindowDimensions();
  const tabWidth = width / labels.length;

  const [index, setIndex] = useState(0);
  const scrollRef = useRef<any>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const [posts, setPosts] = useState<ForumPostsModel[]>();
  const [replies, setReplies] = useState<ForumPostsModel[]>();
  const [isLoading, setIsLoading] = useState(true);
  const [isOptionsVisible, setIsOptionsVisible] = useState(false);
  const [optionsStep, setOptionsStep] = useState<"menu" | "report">("menu");
  const [selectedReason, setSelectedReason] =
    useState<ReportReasonValue>("Spam");
  const [reportDescription, setReportDescription] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [isBlockingUser, setIsBlockingUser] = useState(false);
  const [isProfileUserBlocked, setIsProfileUserBlocked] = useState(false);
  const [isStartingConversation, setIsStartingConversation] = useState(false);
  const selectedPost = useMemo(() => {
    if (!payload) {
      return null;
    }

    try {
      return JSON.parse(decodeURIComponent(payload)) as ForumPostsModel;
    } catch {
      try {
        return JSON.parse(payload) as ForumPostsModel;
      } catch {
        return null;
      }
    }
  }, [payload]);
  const [isVerifiedUser, setIsVerifiedUser] = useState(
    Boolean(selectedPost?.HasRegisteredPlace),
  );
  const selectedUserID = useMemo(() => {
    if (selectedPost?.UserId !== undefined && selectedPost?.UserId !== null) {
      return String(selectedPost.UserId);
    }

    if (id) {
      return String(id);
    }

    return null;
  }, [id, selectedPost?.UserId]);
  const fallbackUser = useMemo<AppUsersModel | undefined>(() => {
    if (!selectedUserID) {
      return undefined;
    }

    return {
      Id: selectedUserID,
      Name: selectedPost?.UserName ?? "User",
      FirstName: "",
      LastName: "",
      Email: "",
      PhoneNumber: "",
      PasswordHash: "",
      Image: selectedPost?.UserImage ?? "",
      CreatedAt: "",
      LastLogin: null,
      Description: "",
      BookmarkedPostID: [],
    };
  }, [selectedPost, selectedUserID]);
  const displayedUser = user ?? fallbackUser;
  const isOwnProfile = currentUser
    ? String(currentUser.Id) === String(selectedUserID)
    : false;
  const canStartConversation = Boolean(selectedUserID) && !isOwnProfile;

  useEffect(() => {
    if (!selectedUserID || isOwnProfile) {
      setIsProfileUserBlocked(false);
      return;
    }

    let isMounted = true;

    void isUserBlocked(selectedUserID)
      .then((isBlocked) => {
        if (isMounted) {
          setIsProfileUserBlocked(isBlocked);
        }
      })
      .catch(() => {
        if (isMounted) {
          setIsProfileUserBlocked(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOwnProfile, selectedUserID]);
  const displayedUsername = useMemo(() => {
    if (isOwnProfile && currentUser?.Username) {
      return currentUser.Username;
    }

    if (selectedPost?.UserName) {
      return selectedPost.UserName;
    }

    if (posts?.[0]?.UserName) {
      return posts[0].UserName;
    }

    if (replies?.[0]?.UserName) {
      return replies[0].UserName;
    }

    return null;
  }, [
    currentUser?.Username,
    isOwnProfile,
    posts,
    replies,
    selectedPost?.UserName,
  ]);

  const loadProfile = useCallback(async () => {
    if (!selectedUserID || !fallbackUser) {
      setUser(undefined);
      setPosts([]);
      setReplies([]);
      setIsVerifiedUser(false);
      setIsLoading(false);
      return;
    }

    setUser(fallbackUser);
    setPosts([]);
    setReplies([]);
    setIsLoading(true);
    const avatarCacheKey = Date.now();

    const [forumUserResult, allPostsResult, ownerIdsResult] =
      await Promise.allSettled([
        apiRequest<ApiForumUserProfileResponse>(
          `/api/Users/${selectedUserID}/forum-profile`,
        ),
        apiRequest<ApiForumPostResponse[]>("/api/ForumPosts"),
        getRegisteredPlaceOwnerIds(),
      ]);

    if (forumUserResult.status === "fulfilled") {
      setUser(mapApiForumUserToModel(forumUserResult.value, avatarCacheKey));
    } else {
      setUser(fallbackUser);
    }

    if (allPostsResult.status === "fulfilled") {
      const normalizedPosts = allPostsResult.value.map((item) =>
        normalizeForumPost(item, avatarCacheKey),
      );
      const ownerIds =
        ownerIdsResult.status === "fulfilled"
          ? ownerIdsResult.value
          : new Set<string>();
      setIsVerifiedUser(ownerIds.has(String(selectedUserID)));
      const flaggedPosts = applyRegisteredPlaceFlags(normalizedPosts, ownerIds);

      const displayPosts = flaggedPosts.filter(
        (item) => String(item.UserId) === String(selectedUserID),
      );

      setPosts(displayPosts.filter((item) => !item.IsAReply));
      setReplies(displayPosts);
    } else {
      setPosts([]);
      setReplies([]);
      setIsVerifiedUser(Boolean(selectedPost?.HasRegisteredPlace));
    }

    setIsLoading(false);
  }, [fallbackUser, selectedPost?.HasRegisteredPlace, selectedUserID]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    setIsVerifiedUser(Boolean(selectedPost?.HasRegisteredPlace));
  }, [selectedPost?.HasRegisteredPlace]);

  const { isRefreshing, onRefresh } = usePullToRefresh(loadProfile);
  const showLoadingOverlay = isLoading && !isRefreshing;

  const horizontalScroll = (i: number) => {
    setIndex(i);
    scrollRef.current?.scrollTo({ x: i * width, animated: true });
  };

  const handleDeletedPost = useCallback((deletedPost: ForumPostsModel) => {
    setPosts((currentPosts) =>
      currentPosts?.filter((post) => post.Id !== deletedPost.Id),
    );
    setReplies((currentReplies) =>
      currentReplies?.filter((post) => post.Id !== deletedPost.Id),
    );
  }, []);

  const resetReportDraft = () => {
    setOptionsStep("menu");
    setSelectedReason("Spam");
    setReportDescription("");
    setIsSubmittingReport(false);
  };

  const closeOptionsModal = () => {
    if (isSubmittingReport || isBlockingUser) {
      return;
    }

    setIsOptionsVisible(false);
    resetReportDraft();
  };

  const submitUserReport = async () => {
    if (!selectedUserID) {
      Alert.alert(
        "Profile unavailable",
        "We couldn't determine which user to report.",
      );
      return;
    }

    try {
      setIsSubmittingReport(true);
      await apiRequest("/api/Reports", {
        method: "POST",
        body: JSON.stringify({
          targetType: "User",
          targetId: String(selectedUserID),
          reasonType: selectedReason,
          description: reportDescription.trim() || null,
        }),
      });

      setIsOptionsVisible(false);
      resetReportDraft();
      Keyboard.dismiss();
      Alert.alert(
        "Report submitted",
        "Thanks for the report. We'll review this profile.",
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

  const toggleProfileUserBlock = () => {
    if (!selectedUserID || isOwnProfile || isBlockingUser) {
      return;
    }

    Alert.alert(
      isProfileUserBlocked ? "Unblock user?" : "Block user?",
      isProfileUserBlocked
        ? "They will be able to interact with you again."
        : "They won't be able to interact with you. You can unblock them later from your account.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: isProfileUserBlocked ? "Unblock" : "Block",
          style: isProfileUserBlocked ? "default" : "destructive",
          onPress: async () => {
            try {
              setIsBlockingUser(true);
              if (isProfileUserBlocked) {
                await unblockUser(selectedUserID);
              } else {
                await blockUser(selectedUserID);
              }
              setIsProfileUserBlocked(!isProfileUserBlocked);
              setIsOptionsVisible(false);
              resetReportDraft();
              Alert.alert(
                isProfileUserBlocked ? "User unblocked" : "User blocked",
                isProfileUserBlocked
                  ? "This user has been removed from your blocked list."
                  : "This user has been added to your blocked list.",
              );
            } catch (error) {
              presentApiError(
                isProfileUserBlocked
                  ? "Unable to unblock user"
                  : "Unable to block user",
                error,
                {
                  networkMessage:
                    "We couldn't reach the server, so the block status was not updated.",
                },
              );
            } finally {
              setIsBlockingUser(false);
            }
          },
        },
      ],
    );
  };

  const handleStartConversation = useCallback(async () => {
    if (!selectedUserID || isStartingConversation) {
      return;
    }

    try {
      setIsStartingConversation(true);
      const conversation = await createConversation(selectedUserID);

      router.push({
        pathname: "/(tabs)/messages/[id]",
        params: { id: String(conversation.Id) },
      });
    } catch (error) {
      presentApiError("Could not start direct message", error, {
        fallbackMessage:
          "We couldn't open a private chat with this user right now.",
      });
    } finally {
      setIsStartingConversation(false);
    }
  }, [isStartingConversation, router, selectedUserID]);

  const renderProfileOptionsModal = () => (
    <CustomModal visible={isOptionsVisible} onClose={closeOptionsModal}>
      <ScrollView
        style={styles.optionsModalScroll}
        contentContainerStyle={styles.optionsModalContent}
        keyboardShouldPersistTaps="handled"
      >
        {optionsStep === "menu" ? (
          <>
            <AdaptiveText style={styles.optionsModalTitle}>
              Profile options
            </AdaptiveText>

            <AdaptiveText style={styles.optionsModalSubtitle}>
              {isOwnProfile
                ? "Reporting is only available for other users."
                : "Report this user if their activity should be reviewed."}
            </AdaptiveText>

            {!isOwnProfile ? (
              <>
                <TouchableOpacity
                  onPress={() => setOptionsStep("report")}
                  disabled={isBlockingUser}
                  style={[
                    styles.modalActionButton,
                    styles.reportActionButton,
                    isBlockingUser ? styles.modalActionButtonDisabled : null,
                  ]}
                >
                  <AdaptiveText style={styles.reportActionText}>
                    Report user
                  </AdaptiveText>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={toggleProfileUserBlock}
                  disabled={isBlockingUser}
                  style={[
                    styles.modalActionButton,
                    styles.blockActionButton,
                    isBlockingUser ? styles.modalActionButtonDisabled : null,
                  ]}
                >
                  <AdaptiveText style={styles.blockActionText}>
                    {isBlockingUser
                      ? isProfileUserBlocked
                        ? "Unblocking..."
                        : "Blocking..."
                      : isProfileUserBlocked
                        ? "Unblock user"
                        : "Block user"}
                  </AdaptiveText>
                </TouchableOpacity>
              </>
            ) : null}

            <TouchableOpacity
              onPress={closeOptionsModal}
              disabled={isSubmittingReport || isBlockingUser}
              style={[
                styles.modalActionButton,
                styles.closeActionButton,
                isSubmittingReport || isBlockingUser
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
              Report user
            </AdaptiveText>
            <AdaptiveText style={styles.optionsModalSubtitle}>
              Choose the reason that best fits, then add any helpful details.
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
              A little context helps the moderation team review the report.
            </AdaptiveText>

            <TouchableOpacity
              onPress={submitUserReport}
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

  return (
    <SafeAreaView style={styles.container}>
      <PageHeader
        title=""
        rightElement={
          <TouchableOpacity
            onPress={() => setIsOptionsVisible(true)}
            style={styles.headerOptionsButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name="ellipsis-horizontal"
              size={18}
              color={darkMode ? colors.white : colors.black}
            />
          </TouchableOpacity>
        }
      />
      {displayedUser ? (
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
          }
        >
          <View style={styles.header}>
            <CustomImage
              image={displayedUser.Image}
              customStyles={styles.placeholder}
            />

            <View style={styles.headerCopy}>
              <AdaptiveText style={styles.headerName}>
                {displayedUser.Name}
              </AdaptiveText>

              {displayedUsername ? (
                <View style={styles.usernameRow}>
                  <AdaptiveText style={styles.usernameText}>
                    @{displayedUsername}
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
              ) : isVerifiedUser ? (
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color={colors.green}
                  style={styles.verifiedBadgeStandalone}
                />
              ) : null}
            </View>

            {isOwnProfile ? (
              <TouchableOpacity
                style={{
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: colors.green,
                  borderRadius: 16,
                  width: 40,
                  height: 40,
                  marginLeft: "auto",
                }}
                onPress={() => router.push("/(tabs)/forum/create")}
              >
                <Ionicons name="add" size={24} color={colors.white} />
              </TouchableOpacity>
            ) : canStartConversation ? (
              <TouchableOpacity
                style={{
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: colors.green,
                  borderRadius: 16,
                  width: 40,
                  height: 40,
                  marginLeft: "auto",
                }}
                onPress={() => void handleStartConversation()}
                disabled={isStartingConversation}
              >
                <Ionicons name="paper-plane" size={24} color={colors.white} />
              </TouchableOpacity>
            ) : null}
          </View>

          {displayedUser.Description && (
            <AdaptiveText
              style={{
                fontFamily: "Poppins-Regular",
                fontSize: 14,
                marginHorizontal: 20,
                marginVertical: 10,
              }}
            >
              {displayedUser.Description}
            </AdaptiveText>
          )}

          {/* Header area (sliding) */}
          <View style={styles.tabs}>
            {labels.map((label, i) => (
              <Pressable
                key={label}
                onPress={() => horizontalScroll(i)}
                accessibilityRole="tab"
                accessibilityState={{ selected: index === i }}
                style={styles.tabBtn}
              >
                <Text style={[styles.text, index === i && styles.textActive]}>
                  {label}
                </Text>
              </Pressable>
            ))}

            {/* Indicator */}
            <Animated.View
              style={[
                styles.indicator,
                {
                  width: tabWidth,
                  transform: [
                    {
                      translateX: Animated.multiply(scrollX, tabWidth / width),
                    },
                  ],
                },
              ]}
            />
          </View>

          <Animated.ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            bounces={false}
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            onMomentumScrollEnd={(e) => {
              const i = Math.round(e.nativeEvent.contentOffset.x / width);
              setIndex(i);
            }}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              { useNativeDriver: true },
            )}
          >
            <View style={[styles.page, { width }]}>
              {posts ? (
                <FlatList
                  data={posts}
                  scrollEnabled={false}
                  keyExtractor={(item) => String(item.Id)}
                  renderItem={({ item }) => {
                    return (
                      <ForumPost
                        size="small"
                        item={item}
                        onDeleted={handleDeletedPost}
                      />
                    );
                  }}
                />
              ) : (
                <AdaptiveText style={styles.noPosts}>
                  No posts available.
                </AdaptiveText>
              )}
            </View>

            <View style={[styles.page, { width }]}>
              {replies ? (
                <FlatList
                  data={replies}
                  scrollEnabled={false}
                  keyExtractor={(item) => String(item.Id)}
                  contentContainerStyle={{ width: 370 }}
                  renderItem={({ item }) => {
                    return (
                      <ForumPost
                        size="small"
                        item={item}
                        onDeleted={handleDeletedPost}
                      />
                    );
                  }}
                />
              ) : (
                <AdaptiveText style={styles.noPosts}>
                  No replies available.
                </AdaptiveText>
              )}
            </View>
          </Animated.ScrollView>
        </ScrollView>
      ) : (
        <AdaptiveText>No profile found.</AdaptiveText>
      )}

      {showLoadingOverlay && <LoadingOverlay />}
      {renderProfileOptionsModal()}
    </SafeAreaView>
  );
};

export default ProfileScreen;

const createStyles = ({ darkMode }: any) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: darkMode ? colors.veryDarkGrey : colors.white,
    },
    header: {
      flexDirection: "row",
      paddingHorizontal: 20,
      alignItems: "center",
      gap: 20,
    },
    headerCopy: {
      flex: 1,
    },
    headerName: {
      fontFamily: "Poppins-SemiBold",
      fontSize: 20,
    },
    placeholder: {
      backgroundColor: colors.lightGrey,
      borderRadius: 70,
      width: 70,
      height: 70,
    },
    usernameRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: Platform.select({
        ios: 0,
        android: -8,
      }),
      flexWrap: "wrap",
    },
    usernameText: {
      fontFamily: "Poppins-Regular",
      fontSize: 14,
      color: darkMode ? colors.lightGrey : colors.darkGrey,
    },
    verifiedBadge: {
      marginTop: 1,
    },
    verifiedBadgeStandalone: {
      marginTop: 4,
    },
    messageButton: {
      marginHorizontal: 20,
      marginTop: 2,
      marginBottom: 10,
      paddingHorizontal: 18,
      paddingVertical: 14,
      borderRadius: 18,
      backgroundColor: colors.green,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
    },
    messageButtonText: {
      color: colors.white,
      fontFamily: "Poppins-SemiBold",
      fontSize: 15,
    },
    headerOptionsButton: {
      alignItems: "center",
      justifyContent: "center",
      width: 28,
      height: 28,
    },
    page: {
      flex: 1,
    },

    // --- tabs ---
    tabs: {
      flexDirection: "row",
      alignSelf: "center",
      backgroundColor: darkMode ? colors.veryDarkGrey : colors.white,
      gap: 14,
      paddingHorizontal: 16,
      height: 50,
      paddingVertical: 10,
      overflow: "hidden", // keeps indicator rounded
      position: "relative",
    },
    tabBtn: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 6,
      minWidth: 80,
    },
    text: {
      color: darkMode ? colors.white : colors.black,
      fontSize: 14,
      fontWeight: "600",
      fontFamily: "Poppins-Medium",
    },
    textActive: {
      opacity: 1,
    },
    indicator: {
      position: "absolute",
      bottom: 0,
      height: 2,
      backgroundColor: darkMode ? colors.white : colors.black,
    },
    noPosts: {
      marginTop: 20,
      fontFamily: "Poppins-Regular",
      alignSelf: "center",
    },
    optionsModalScroll: {
      width: "100%",
    },
    optionsModalContent: {
      width: "100%",
      paddingBottom: 32,
      alignItems: "center",
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
    reportActionButton: {
      backgroundColor: darkMode ? "#243327" : "#E8F4EA",
    },
    reportActionText: {
      color: darkMode ? colors.white : colors.black,
      fontFamily: "Poppins-SemiBold",
      fontSize: 16,
    },
    blockActionButton: {
      backgroundColor: darkMode ? "#3A2424" : "#FCE8E8",
    },
    blockActionText: {
      color: darkMode ? colors.white : "#B3261E",
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
