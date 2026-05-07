import { AdaptiveText } from "@/components/AdaptiveText";
import CustomImage from "@/components/CustomImage";
import CustomModal from "@/components/CustomModal";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { ProfileEmptyState } from "@/components/ProfileEmptyState";
import { colors } from "@/constants/colors";
import { useGlobal } from "@/contexts/GlobalProvider";
import { DirectMessageConversationSummaryModel } from "@/data/models";
import { useHeaderSlide } from "@/hooks/useHeaderSlide";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { presentApiError } from "@/lib/api-feedback";
import {
  createConversation,
  fetchConversations,
  findUserByChatCode,
  getConversationParticipantName,
  getConversationPreviewLabel,
} from "@/lib/messages-api";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  Animated,
  FlatList,
  Keyboard,
  RefreshControl,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function formatConversationTimestamp(
  timestamp?: string | number | null,
  fallbackTimestamp?: string | number | null,
) {
  const value = timestamp ?? fallbackTimestamp;

  if (!value) {
    return "";
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  const now = new Date();
  const isSameDay = parsedDate.toDateString() === now.toDateString();

  return isSameDay
    ? parsedDate.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      })
    : parsedDate.toLocaleDateString([], {
        month: "short",
        day: "numeric",
      });
}

export default function MessagesScreen() {
  const router = useRouter();
  const darkMode = useColorScheme() === "dark";
  const styles = createStyles({ darkMode });
  const [conversations, setConversations] = useState<
    DirectMessageConversationSummaryModel[]
  >([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [chatCode, setChatCode] = useState("");
  const [isCodeModalVisible, setIsCodeModalVisible] = useState(false);
  const [isStartingConversation, setIsStartingConversation] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { setShowFooter } = useGlobal();
  const { translateY } = useHeaderSlide({ height: 180, duration: 250 });

  const loadConversations = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await fetchConversations();
      const sortedConversations = [...response].sort((a, b) => {
        const aTimestamp = new Date(a.LastMessageAt ?? a.CreatedAt).getTime();
        const bTimestamp = new Date(b.LastMessageAt ?? b.CreatedAt).getTime();
        return bTimestamp - aTimestamp;
      });

      setConversations(sortedConversations);
    } catch (error) {
      setConversations([]);
      presentApiError("Could not load direct messages", error, {
        fallbackMessage: "We couldn't load your conversations right now.",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setShowFooter?.(true);
      void loadConversations();

      return () => {
        setShowFooter?.(true);
      };
    }, [loadConversations, setShowFooter]),
  );

  const { isRefreshing, onRefresh } = usePullToRefresh(loadConversations);
  const showLoadingOverlay = isLoading && !isRefreshing;
  const trimmedSearchQuery = searchQuery.trim().toLowerCase();
  const filteredConversations = useMemo(() => {
    if (!trimmedSearchQuery) {
      return conversations;
    }

    return conversations.filter((conversation) => {
      const participantName = getConversationParticipantName(
        conversation.OtherParticipant,
      ).toLowerCase();
      const username = conversation.OtherParticipant.Username.toLowerCase();
      const preview = getConversationPreviewLabel(conversation).toLowerCase();

      return (
        participantName.includes(trimmedSearchQuery) ||
        username.includes(trimmedSearchQuery) ||
        preview.includes(trimmedSearchQuery)
      );
    });
  }, [conversations, trimmedSearchQuery]);

  const openCodePrompt = useCallback(() => {
    setChatCode("");
    setIsCodeModalVisible(true);
    setShowFooter?.(false);
  }, [setShowFooter]);

  const closeCodePrompt = useCallback(() => {
    if (isStartingConversation) {
      return;
    }

    setIsCodeModalVisible(false);
    setChatCode("");
    setShowFooter?.(true);
  }, [isStartingConversation, setShowFooter]);

  const handleStartConversationFromCode = useCallback(async () => {
    const normalizedCode = chatCode.trim();
    if (!normalizedCode || isStartingConversation) {
      return;
    }

    try {
      setIsStartingConversation(true);
      const user = await findUserByChatCode(normalizedCode);
      const conversation = await createConversation(user.Id);
      setIsCodeModalVisible(false);
      setChatCode("");
      setShowFooter?.(true);
      router.push({
        pathname: "/(tabs)/messages/[id]",
        params: { id: String(conversation.Id) },
      });
    } catch (error) {
      presentApiError("Could not start chat", error, {
        fallbackMessage: "Check the code and try again.",
      });
    } finally {
      setIsStartingConversation(false);
    }
  }, [chatCode, isStartingConversation, router, setShowFooter]);

  const emptyState = useMemo(
    () => (
      <ProfileEmptyState
        style={styles.emptyState}
        title={trimmedSearchQuery ? "No chats found" : "No DMs yet"}
        subtitle={
          trimmedSearchQuery
            ? "Try a different name, username, or message preview."
            : "Start a private chat from a forum profile or a pet place page."
        }
      />
    ),
    [styles.emptyState, trimmedSearchQuery],
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.screen}>
        <Animated.View style={[styles.header, { transform: [{ translateY }] }]}>
          <AdaptiveText style={styles.title}>Direct Messages</AdaptiveText>
          <AdaptiveText style={styles.subtitle}>
            Private chats with other people and pet places.
          </AdaptiveText>
        </Animated.View>

        <View style={styles.searchWrap}>
          <Ionicons
            name="search"
            size={18}
            color={darkMode ? colors.lightGrey : colors.darkGrey}
          />

          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search chats..."
            placeholderTextColor={darkMode ? colors.lightGrey : colors.darkGrey}
            style={styles.searchInput}
            autoCapitalize="none"
            autoCorrect={false}
            clearButtonMode="while-editing"
            onFocus={() => {
              setIsSearchFocused(true);
              setShowFooter?.(false);
            }}
            onBlur={() => {
              setIsSearchFocused(false);
              setShowFooter?.(true);
            }}
          />
        </View>

        <FlatList
          data={filteredConversations}
          keyExtractor={(item) => String(item.Id)}
          style={styles.list}
          contentContainerStyle={[
            styles.listContent,
            filteredConversations.length === 0 ? styles.listContentEmpty : null,
          ]}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
          }
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          onScrollBeginDrag={Keyboard.dismiss}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.conversationCard}
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/messages/[id]",
                  params: { id: String(item.Id) },
                })
              }
              activeOpacity={0.88}
            >
              <CustomImage
                image={item.OtherParticipant.AvatarUrl}
                customStyles={styles.avatar}
              />

              <View style={styles.conversationCopy}>
                <View style={styles.conversationTopRow}>
                  <AdaptiveText style={styles.participantName}>
                    {getConversationParticipantName(item.OtherParticipant)}
                  </AdaptiveText>

                  {item.UnreadCount > 0 ? (
                    <View style={styles.unreadBadge}>
                      <AdaptiveText style={styles.unreadBadgeText}>
                        {item.UnreadCount > 99 ? "99+" : item.UnreadCount}
                      </AdaptiveText>
                    </View>
                  ) : null}
                </View>

                <View style={styles.conversationBottomRow}>
                  <AdaptiveText style={styles.preview} numberOfLines={2}>
                    {getConversationPreviewLabel(item)}
                  </AdaptiveText>

                  <AdaptiveText style={styles.timestamp}>
                    {formatConversationTimestamp(
                      item.LastMessageAt,
                      item.CreatedAt,
                    )}
                  </AdaptiveText>
                </View>
              </View>

              <Ionicons
                name="chevron-forward"
                size={20}
                color={darkMode ? colors.lightGrey : colors.darkGrey}
              />
            </TouchableOpacity>
          )}
          ListEmptyComponent={emptyState}
        />
      </View>

      <CustomModal
        visible={isCodeModalVisible}
        onClose={closeCodePrompt}
        style={styles.codeModal}
      >
        <AdaptiveText style={styles.modalTitle}>Enter Chat Code</AdaptiveText>
        <AdaptiveText style={styles.modalSubtitle}>
          Ask the other user for the code shown on their profile.
        </AdaptiveText>
        <View style={styles.codeInputWrap}>
          <AdaptiveText style={styles.codeInputPrefix}>#</AdaptiveText>
          <TextInput
            value={chatCode}
            onChangeText={setChatCode}
            placeholder="Chat code"
            placeholderTextColor={darkMode ? colors.lightGrey : colors.darkGrey}
            autoCapitalize="characters"
            autoCorrect={false}
            style={styles.codeInput}
            editable={!isStartingConversation}
            onSubmitEditing={handleStartConversationFromCode}
          />
        </View>
        <View style={styles.modalActions}>
          <TouchableOpacity
            style={[
              styles.modalPrimaryButton,
              (!chatCode.trim() || isStartingConversation) &&
                styles.modalPrimaryButtonDisabled,
            ]}
            onPress={handleStartConversationFromCode}
            disabled={!chatCode.trim() || isStartingConversation}
            activeOpacity={0.88}
          >
            <AdaptiveText style={styles.modalPrimaryText}>
              {isStartingConversation ? "Starting..." : "Start Chat"}
            </AdaptiveText>
          </TouchableOpacity>
        </View>
      </CustomModal>


        {!isSearchFocused ? (
          <TouchableOpacity
            style={{
              alignSelf: "flex-end",
              backgroundColor: colors.green,
              padding: 10,
              marginRight: 20,
              borderRadius: 20,
              marginBottom: 110,
            }}
            onPress={openCodePrompt}
          >
            <Ionicons name="add" size={32} color={colors.white} />
          </TouchableOpacity>
        ) : null}

      {showLoadingOverlay && <LoadingOverlay />}
    </SafeAreaView>
  );
}

const createStyles = ({ darkMode }: any) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: darkMode ? colors.veryDarkGrey : colors.white,
    },
    screen: {
      flex: 1,
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: 50,
      alignItems: "center",
      paddingBottom: 20,
    },
    title: {
      fontFamily: "Poppins-SemiBold",
      fontSize: 28,
    },
    subtitle: {
      marginTop: 6,
      fontFamily: "Poppins-Regular",
      fontSize: 14,
      lineHeight: 22,
      color: darkMode ? colors.lightGrey : colors.darkGrey,
    },
    searchWrap: {
      width: "92%",
      alignSelf: "center",
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 18,
      marginBottom: 10,
      backgroundColor: darkMode ? colors.darkGrey : colors.lightGrey,
    },
    searchInput: {
      flex: 1,
      paddingVertical: 0,
      color: darkMode ? colors.white : colors.black,
      fontFamily: "Poppins-Regular",
      fontSize: 15,
    },
    codeButton: {
      width: "92%",
      alignSelf: "center",
      marginBottom: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 18,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      backgroundColor: darkMode ? colors.averageDarkGrey : colors.lightLightGreen1,
    },
    codeButtonText: {
      fontFamily: "Poppins-SemiBold",
      fontSize: 15,
    },
    list: {
      flex: 1,
    },
    listContent: {
      width: "100%",
      alignSelf: "center",
      paddingBottom: 150,
    },
    listContentEmpty: {
      flexGrow: 1,
      justifyContent: "center",
    },
    conversationCard: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      borderBottomWidth: 1,
      borderBottomColor: darkMode ? colors.darkGrey : colors.lightGrey,
      borderTopWidth: 1,
      borderTopColor: darkMode ? colors.darkGrey : colors.lightGrey,
    },
    conversationCopy: {
      flex: 1,
    },
    conversationTopRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
    },
    conversationBottomRow: {
      flexDirection: "row",
      gap: 12,
      alignItems: "flex-start",
    },
    avatar: {
      width: 56,
      height: 56,
      borderRadius: 28,
    },
    participantName: {
      flex: 1,
      fontFamily: "Poppins-SemiBold",
      fontSize: 16,
    },
    username: {
      marginTop: 2,
      fontFamily: "Poppins-Regular",
      fontSize: 13,
      color: darkMode ? colors.lightGrey : colors.darkGrey,
    },
    preview: {
      flex: 1,
      fontFamily: "Poppins-Regular",
      fontSize: 13,
      lineHeight: 20,
      color: darkMode ? colors.white : colors.black,
      opacity: 0.85,
    },
    timestamp: {
      fontFamily: "Poppins-Medium",
      fontSize: 12,
      color: darkMode ? colors.lightGrey : colors.darkGrey,
    },
    unreadBadge: {
      minWidth: 28,
      borderRadius: 999,
      paddingVertical: 4,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.green,
    },
    unreadBadgeText: {
      color: colors.white,
      fontFamily: "Poppins-SemiBold",
      fontSize: 11,
    },
    emptyState: {
      width: "85%",
      marginTop: 0,
    },
    codeModal: {
      width: "100%",
      paddingBottom: 80,
    },
    modalTitle: {
      fontFamily: "Poppins-SemiBold",
      fontSize: 24,
      marginBottom: 10,
      textAlign: 'center',
    },
    modalSubtitle: {
      marginVertical: 6,
      fontFamily: "Poppins-Regular",
      fontSize: 18,
      textAlign: 'center',
      lineHeight: 20,
      color: darkMode ? colors.lightGrey : colors.darkGrey,
    },
    codeInputWrap: {
      marginTop: 16,
      borderRadius: 14,
      width: '80%',
      paddingHorizontal: 12,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: darkMode ? colors.averageDarkGrey : colors.lightGrey,
    },
    codeInputPrefix: {
      fontFamily: "Poppins-SemiBold",
      fontSize: 18,
      letterSpacing: 0,
      color: darkMode ? colors.white : colors.black,
      marginRight: 2,
    },
    codeInput: {
      flex: 1,
      paddingVertical: 8,
      fontFamily: "Poppins-SemiBold",
      fontSize: 18,
      marginLeft: 3,
      letterSpacing: 0,
      color: darkMode ? colors.white : colors.black,
    },
    modalActions: {
      marginTop: 18,
      flexDirection: "row",
      justifyContent: "center",
      gap: 12,
    },
    modalSecondaryButton: {
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 12,
      backgroundColor: darkMode ? colors.averageDarkGrey : colors.lightGrey,
    },
    modalSecondaryText: {
      fontFamily: "Poppins-Medium",
      fontSize: 14,
    },
    modalPrimaryButton: {
      paddingHorizontal: 24,
      paddingVertical: 14,
      borderRadius: 20,
      marginTop: 10,
      backgroundColor: colors.green,
    },
    modalPrimaryButtonDisabled: {
      opacity: 0.5,
    },
    modalPrimaryText: {
      color: colors.white,
      fontFamily: "Poppins-SemiBold",
      fontSize: 20,
    },
  });
};
