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
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  FlatList,
  Keyboard,
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
  const [selectedReason, setSelectedReason] = useState<ReportReasonValue>(
    "Spam",
  );
  const [reportDescription, setReportDescription] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
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

  const loadProfile = useCallback(async () => {
    if (!selectedUserID || !fallbackUser) {
      setUser(undefined);
      setPosts([]);
      setReplies([]);
      setIsLoading(false);
      return;
    }

    setUser(fallbackUser);
    setPosts([]);
    setReplies([]);
    setIsLoading(true);
    const avatarCacheKey = Date.now();

    const [forumUserResult, allPostsResult] = await Promise.allSettled([
      apiRequest<ApiForumUserProfileResponse>(
        `/api/Users/${selectedUserID}/forum-profile`,
      ),
      apiRequest<any[]>("/api/ForumPosts"),
    ]);

    if (forumUserResult.status === "fulfilled") {
      setUser(mapApiForumUserToModel(forumUserResult.value, avatarCacheKey));
    } else {
      setUser(fallbackUser);
    }

    if (allPostsResult.status === "fulfilled") {
      const normalizedPosts = allPostsResult.value.map((item) =>
        normalizeForumPost(item as ApiForumPostResponse, avatarCacheKey),
      );

      const displayPosts = normalizedPosts.filter(
        (item) => String(item.UserId) === String(selectedUserID),
      );

      setPosts(displayPosts.filter((item) => !item.IsAReply));
      setReplies(displayPosts);
    } else {
      setPosts([]);
      setReplies([]);
    }

    setIsLoading(false);
  }, [fallbackUser, selectedUserID]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

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
    if (isSubmittingReport) {
      return;
    }

    setIsOptionsVisible(false);
    resetReportDraft();
  };

  const submitUserReport = async () => {
    if (!selectedUserID) {
      Alert.alert("Profile unavailable", "We couldn't determine which user to report.");
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
              <TouchableOpacity
                onPress={() => setOptionsStep("report")}
                style={[styles.modalActionButton, styles.reportActionButton]}
              >
                <AdaptiveText style={styles.reportActionText}>
                  Report user
                </AdaptiveText>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              onPress={closeOptionsModal}
              disabled={isSubmittingReport}
              style={[
                styles.modalActionButton,
                styles.closeActionButton,
                isSubmittingReport ? styles.modalActionButtonDisabled : null,
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

            <AdaptiveText
              style={{
                fontFamily: "Poppins-SemiBold",
                fontSize: 20,
              }}
            >
              {displayedUser.Name}
            </AdaptiveText>

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
              <Ionicons
                name="add"
                size={24}
                color={darkMode ? colors.white : colors.black}
              />
            </TouchableOpacity>
          </View>

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
    placeholder: {
      backgroundColor: colors.lightGrey,
      borderRadius: 70,
      width: 70,
      height: 70,
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
