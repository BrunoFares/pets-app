import { AdaptiveText } from "@/components/AdaptiveText";
import CustomImage from "@/components/CustomImage";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { PageHeader } from "@/components/PageHeader";
import { ProfileEmptyState } from "@/components/ProfileEmptyState";
import { VideoThumbnail } from "@/components/VideoThumbnail";
import { colors } from "@/constants/colors";
import { useAuth } from "@/contexts/AuthProvider";
import { useGlobal } from "@/contexts/GlobalProvider";
import {
  DirectMessageConversationModel,
  DirectMessageModel,
} from "@/data/models";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { presentApiError } from "@/lib/api-feedback";
import {
  fetchConversationById,
  getConversationParticipantName,
  isDirectMessageVideoAsset,
  markConversationRead,
  sendDirectMessage,
} from "@/lib/messages-api";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  AppState,
  AppStateStatus,
  Dimensions,
  Image,
  Keyboard,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

function formatMessageTimestamp(timestamp: string | number) {
  const parsedDate = new Date(timestamp);

  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  return parsedDate.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

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

function buildVideoPlayerHtml(videoUrl: string) {
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

const POLLING_INTERVAL_MS = 3000;

function hasUnreadIncomingMessage(
  conversation: DirectMessageConversationModel,
) {
  const latestMessage = conversation.Messages.at(-1);

  if (!latestMessage) {
    return false;
  }

  const isIncomingMessage =
    String(latestMessage.SenderUserId) ===
    String(conversation.OtherParticipant.Id);

  if (!isIncomingMessage) {
    return false;
  }

  if (!conversation.LastReadAt) {
    return true;
  }

  return (
    new Date(conversation.LastReadAt).getTime() <
    new Date(latestMessage.CreatedAt).getTime()
  );
}

const ConversationScreen = () => {
  const darkMode = useColorScheme() === "dark";
  const styles = createStyles({ darkMode });
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { setShowFooter } = useGlobal();
  const [conversation, setConversation] =
    useState<DirectMessageConversationModel | null>(null);
  const [messageText, setMessageText] = useState("");
  const [selectedMediaAsset, setSelectedMediaAsset] =
    useState<ImagePicker.ImagePickerAsset | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(
    null,
  );
  const [selectedVideoMessage, setSelectedVideoMessage] =
    useState<DirectMessageModel | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(id));
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const imageViewerScrollRef = useRef<ScrollView>(null);
  const conversationRef = useRef<DirectMessageConversationModel | null>(null);
  const isRefreshingConversationRef = useRef(false);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const attachmentViewerWidth = Dimensions.get("window").width;
  const attachmentViewerHeight = Dimensions.get("window").height;
  const selectedMediaIsVideo = selectedMediaAsset
    ? isDirectMessageVideoAsset(selectedMediaAsset)
    : false;
  const selectedVideoDuration = selectedMediaIsVideo
    ? formatVideoDuration(selectedMediaAsset?.duration)
    : null;
  const canSendMessage = Boolean(messageText.trim() || selectedMediaAsset);
  const imageMessages =
    conversation?.Messages.filter(
      (message) => message.MediaType === "Image" && Boolean(message.MediaUrl),
    ) ?? [];

  useEffect(() => {
    conversationRef.current = conversation;
  }, [conversation]);

  useEffect(() => {
    setMessageText("");
    setSelectedMediaAsset(null);
    setSelectedImageIndex(null);
    setSelectedVideoMessage(null);
  }, [id]);

  const loadConversation = useCallback(
    async ({
      showLoader = true,
      showError = true,
    }: {
      showLoader?: boolean;
      showError?: boolean;
    } = {}) => {
      if (!id) {
        setConversation(null);
        setIsLoading(false);
        return;
      }

      if (isRefreshingConversationRef.current) {
        return;
      }

      if (showLoader) {
        setIsLoading(true);
      }

      isRefreshingConversationRef.current = true;

      try {
        const response = await fetchConversationById(id);
        conversationRef.current = response;

        setConversation((currentConversation) => {
          if (!currentConversation) {
            return response;
          }

          const currentLastMessage = currentConversation.Messages.at(-1);
          const nextLastMessage = response.Messages.at(-1);
          const isSameConversationState =
            currentConversation.Messages.length === response.Messages.length &&
            String(currentLastMessage?.Id ?? "") ===
              String(nextLastMessage?.Id ?? "") &&
            String(currentConversation.LastReadAt ?? "") ===
              String(response.LastReadAt ?? "");

          return isSameConversationState ? currentConversation : response;
        });

        if (hasUnreadIncomingMessage(response)) {
          void markConversationRead(id)
            .then((readState) => {
              conversationRef.current = conversationRef.current
                ? {
                    ...conversationRef.current,
                    LastReadAt: readState.lastReadAt,
                  }
                : conversationRef.current;

              setConversation((currentConversation) =>
                currentConversation
                  ? {
                      ...currentConversation,
                      LastReadAt: readState.lastReadAt,
                    }
                  : currentConversation,
              );
            })
            .catch(() => undefined);
        }
      } catch (error) {
        if (!conversationRef.current) {
          setConversation(null);
        }

        if (showError) {
          presentApiError("Could not load conversation", error, {
            fallbackMessage: "We couldn't load this conversation right now.",
          });
        } else {
          console.warn("[messages] Silent conversation refresh failed", error);
        }
      } finally {
        isRefreshingConversationRef.current = false;

        if (showLoader) {
          setIsLoading(false);
        }
      }
    },
    [id],
  );

  useFocusEffect(
    useCallback(() => {
      setShowFooter?.(false);
      void loadConversation();

      const pollingInterval = setInterval(() => {
        void loadConversation({ showLoader: false, showError: false });
      }, POLLING_INTERVAL_MS);

      const appStateSubscription = AppState.addEventListener(
        "change",
        (nextAppState) => {
          const previousAppState = appStateRef.current;
          appStateRef.current = nextAppState;

          const wasInactive =
            previousAppState === "inactive" ||
            previousAppState === "background";

          if (wasInactive && nextAppState === "active") {
            void loadConversation({ showLoader: false, showError: false });
          }
        },
      );

      return () => {
        clearInterval(pollingInterval);
        appStateSubscription.remove();
        setShowFooter?.(true);
      };
    }, [loadConversation, setShowFooter]),
  );

  const { isRefreshing, onRefresh } = usePullToRefresh(
    useCallback(
      async () => loadConversation({ showLoader: false, showError: true }),
      [loadConversation],
    ),
  );
  const showLoadingOverlay = (isLoading && !isRefreshing) || isSending;

  useEffect(() => {
    if (!conversation?.Messages.length) {
      return;
    }

    const timer = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 60);

    return () => clearTimeout(timer);
  }, [conversation?.Messages.length]);

  useEffect(() => {
    if (selectedImageIndex === null) {
      return;
    }

    if (selectedImageIndex >= imageMessages.length) {
      setSelectedImageIndex(null);
      return;
    }

    const timer = setTimeout(() => {
      imageViewerScrollRef.current?.scrollTo({
        x: selectedImageIndex * attachmentViewerWidth,
        animated: false,
      });
    }, 0);

    return () => clearTimeout(timer);
  }, [attachmentViewerWidth, imageMessages.length, selectedImageIndex]);

  const handleChooseFromLibrary = async () => {
    if (isSending) {
      return;
    }

    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert(
        "Permission required",
        "Please allow photo library access so you can attach a photo or video to your message.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"],
      allowsEditing: false,
      allowsMultipleSelection: false,
      quality: 1,
    });

    if (result.canceled || result.assets.length === 0) {
      return;
    }

    setSelectedMediaAsset(result.assets[0]);
  };

  const handleTakePhoto = async () => {
    if (isSending) {
      return;
    }

    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert(
        "Permission required",
        "Please allow camera access so you can take a photo to send in your message.",
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      quality: 1,
    });

    if (result.canceled || result.assets.length === 0) {
      return;
    }

    setSelectedMediaAsset(result.assets[0]);
  };

  const handlePickMedia = useCallback(() => {
    if (isSending) {
      return;
    }

    Alert.alert("Add attachment", "Choose how you'd like to add media.", [
      {
        text: "Take Photo",
        onPress: () => {
          void handleTakePhoto();
        },
      },
      {
        text: "Choose from Library",
        onPress: () => {
          void handleChooseFromLibrary();
        },
      },
      {
        text: "Cancel",
        style: "cancel",
      },
    ]);
  }, [isSending]);

  const handleRemoveSelectedMedia = useCallback(() => {
    if (isSending) {
      return;
    }

    setSelectedMediaAsset(null);
  }, [isSending]);

  const handleOpenImageViewer = useCallback(
    (messageId: string | number) => {
      const nextIndex = imageMessages.findIndex(
        (message) => String(message.Id) === String(messageId),
      );

      if (nextIndex < 0) {
        return;
      }

      Keyboard.dismiss();
      setSelectedImageIndex(nextIndex);
    },
    [imageMessages],
  );

  const handleCloseImageViewer = useCallback(() => {
    setSelectedImageIndex(null);
  }, []);

  const handleOpenVideoViewer = useCallback((message: DirectMessageModel) => {
    if (!message.MediaUrl) {
      return;
    }

    Keyboard.dismiss();
    setSelectedVideoMessage(message);
  }, []);

  const handleCloseVideoViewer = useCallback(() => {
    setSelectedVideoMessage(null);
  }, []);

  const handleSend = async () => {
    const content = messageText.trim();

    if (!conversation || (!content && !selectedMediaAsset) || isSending) {
      return;
    }

    Keyboard.dismiss();
    setIsSending(true);

    try {
      const sentMessage = await sendDirectMessage(conversation.Id, {
        content,
        mediaAsset: selectedMediaAsset,
      });

      setConversation((currentConversation) =>
        currentConversation
          ? {
              ...currentConversation,
              Messages: [...currentConversation.Messages, sentMessage],
              LastMessageAt: sentMessage.CreatedAt,
              LastReadAt: sentMessage.CreatedAt,
            }
          : currentConversation,
      );
      setMessageText("");
      setSelectedMediaAsset(null);
    } catch (error) {
      presentApiError("Could not send message", error, {
        fallbackMessage: "We couldn't send your direct message right now.",
      });
    } finally {
      setIsSending(false);
    }
  };

  const renderMessage = (message: DirectMessageModel) => {
    const otherParticipantId = conversation?.OtherParticipant?.Id;
    const isOwnMessage =
      otherParticipantId !== undefined && otherParticipantId !== null
        ? String(message.SenderUserId) !== String(otherParticipantId)
        : String(message.SenderUserId) === String(user?.Id);
    const hasImageAttachment =
      message.MediaType === "Image" && Boolean(message.MediaUrl);
    const hasVideoAttachment =
      message.MediaType === "Video" && Boolean(message.MediaUrl);

    return (
      <View
        key={String(message.Id)}
        style={[
          styles.messageRow,
          isOwnMessage ? styles.messageRowOwn : styles.messageRowOther,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isOwnMessage ? styles.messageBubbleOwn : styles.messageBubbleOther,
            (hasVideoAttachment || hasImageAttachment) && {
              paddingHorizontal: 4,
              paddingVertical: 4,
            },
          ]}
        >
          {message.Content?.trim() ? (
            <AdaptiveText
              style={[
                styles.messageText,
                isOwnMessage ? styles.messageTextOwn : styles.messageTextOther,
              ]}
            >
              {message.Content}
            </AdaptiveText>
          ) : null}

          {hasImageAttachment ? (
            <TouchableOpacity
              activeOpacity={0.92}
              onPress={() => handleOpenImageViewer(message.Id)}
              style={styles.messageMediaButton}
            >
              <Image
                source={{ uri: message.MediaUrl ?? undefined }}
                style={styles.messageImage}
              />
            </TouchableOpacity>
          ) : null}

          {hasVideoAttachment ? (
            <TouchableOpacity
              activeOpacity={0.92}
              onPress={() => handleOpenVideoViewer(message)}
              style={styles.messageMediaButton}
            >
              <VideoThumbnail
                uri={message.MediaUrl ?? ""}
                style={styles.messageVideo}
              />
              <View style={styles.messageVideoOverlay}>
                <View style={styles.messageVideoPlayButton}>
                  <Feather name="play" size={20} color={colors.white} />
                </View>
              </View>
            </TouchableOpacity>
          ) : null}

          <AdaptiveText
            style={[
              styles.messageTimestamp,
              isOwnMessage
                ? styles.messageTimestampOwn
                : styles.messageTimestampOther,
            ]}
          >
            {formatMessageTimestamp(message.CreatedAt)}
          </AdaptiveText>
        </View>
      </View>
    );
  };

  const handleOpenParticipantProfile = useCallback(() => {
    if (!conversation?.OtherParticipant?.Id) {
      return;
    }

    router.push({
      pathname: "/(tabs)/forum",
      params: {
        openProfileId: String(conversation.OtherParticipant.Id),
        openProfileToken: String(Date.now()),
      },
    });
  }, [conversation?.OtherParticipant?.Id, router]);

  const selectedImage =
    selectedImageIndex === null
      ? null
      : (imageMessages[selectedImageIndex] ?? null);

  const renderVideoViewer = () => (
    <Modal
      visible={Boolean(selectedVideoMessage)}
      transparent
      animationType="fade"
      onRequestClose={handleCloseVideoViewer}
    >
      <View style={styles.attachmentViewerOverlay}>
        <View
          style={[
            styles.videoViewerFrame,
            {
              width: Math.max(attachmentViewerWidth, 0),
              height: Math.min(attachmentViewerHeight * 0.72, 520),
            },
          ]}
        >
          <TouchableOpacity
            onPress={handleCloseVideoViewer}
            style={styles.videoViewerCloseButton}
          >
            <Feather name="x" size={22} color={colors.white} />
          </TouchableOpacity>

          {selectedVideoMessage?.MediaUrl ? (
            <WebView
              originWhitelist={["*"]}
              source={{
                html: buildVideoPlayerHtml(selectedVideoMessage.MediaUrl),
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.screen}>
        <PageHeader
          title={getConversationParticipantName(conversation?.OtherParticipant)}
          style={styles.pageHeader}
          titleElement={
            conversation?.OtherParticipant ? (
              <TouchableOpacity
                style={styles.headerProfileButton}
                onPress={handleOpenParticipantProfile}
                activeOpacity={0.8}
              >
                <CustomImage
                  image={conversation.OtherParticipant.AvatarUrl}
                  customStyles={styles.headerAvatar}
                />

                <View style={styles.headerProfileCopy}>
                  <AdaptiveText
                    style={styles.headerProfileName}
                    numberOfLines={1}
                  >
                    {getConversationParticipantName(
                      conversation.OtherParticipant,
                    )}
                  </AdaptiveText>
                </View>
              </TouchableOpacity>
            ) : undefined
          }
        />

        {conversation ? (
          <>
            <ScrollView
              ref={scrollRef}
              style={styles.messages}
              contentContainerStyle={styles.messagesContent}
              keyboardDismissMode="on-drag"
              keyboardShouldPersistTaps="handled"
              onScrollBeginDrag={Keyboard.dismiss}
              refreshControl={
                <RefreshControl
                  refreshing={isRefreshing}
                  onRefresh={onRefresh}
                />
              }
            >
              {conversation.Messages.length ? (
                conversation.Messages.map(renderMessage)
              ) : (
                <ProfileEmptyState
                  title="No messages yet"
                  subtitle="Send the first message below to start the conversation."
                />
              )}
            </ScrollView>
          </>
        ) : !isLoading ? (
          <ScrollView
            contentContainerStyle={styles.emptyStateWrap}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
            }
          >
            <ProfileEmptyState
              title={id ? "Conversation unavailable" : "Missing conversation"}
              subtitle="We couldn't load this direct message thread right now."
            />
          </ScrollView>
        ) : null}

        {conversation ? (
          <View style={styles.composer}>
            {selectedMediaAsset ? (
              <View style={styles.selectedMediaCard}>
                <View style={styles.selectedMediaPreviewFrame}>
                  {selectedMediaIsVideo ? (
                    <>
                      <VideoThumbnail
                        uri={selectedMediaAsset.uri}
                        style={styles.selectedMediaPreview}
                      />
                      <View style={styles.selectedMediaVideoOverlay}>
                        <View style={styles.selectedMediaPlayButton}>
                          <Feather name="play" size={18} color={colors.white} />
                        </View>
                      </View>
                    </>
                  ) : (
                    <Image
                      source={{ uri: selectedMediaAsset.uri }}
                      style={styles.selectedMediaPreview}
                    />
                  )}
                </View>

                <View style={styles.selectedMediaCopy}>
                  <AdaptiveText
                    style={styles.selectedMediaTitle}
                    numberOfLines={1}
                  >
                    {selectedMediaAsset.fileName?.trim() ||
                      (selectedMediaIsVideo
                        ? "Selected video"
                        : "Selected photo")}
                  </AdaptiveText>
                  <AdaptiveText style={styles.selectedMediaMeta}>
                    {selectedMediaIsVideo
                      ? selectedVideoDuration
                        ? `Video ready to send · ${selectedVideoDuration}`
                        : "Video ready to send"
                      : "Photo ready to send"}
                  </AdaptiveText>
                </View>

                <TouchableOpacity
                  style={styles.removeSelectedMediaButton}
                  onPress={handleRemoveSelectedMedia}
                  disabled={isSending}
                >
                  <Feather name="x" size={16} color={colors.white} />
                </TouchableOpacity>
              </View>
            ) : null}

            <View style={styles.composerRow}>
              <TouchableOpacity
                style={[
                  styles.attachButton,
                  selectedMediaAsset ? styles.attachButtonActive : null,
                ]}
                onPress={() => void handlePickMedia()}
                disabled={isSending}
                activeOpacity={0.85}
              >
                <Feather
                  name="paperclip"
                  size={18}
                  color={darkMode ? colors.white : colors.black}
                />
              </TouchableOpacity>

              <TextInput
                value={messageText}
                onChangeText={setMessageText}
                placeholder="Write a message..."
                placeholderTextColor={
                  darkMode ? colors.lightGrey : colors.darkGrey
                }
                style={styles.input}
                editable={!isSending}
                multiline
              />

              <TouchableOpacity
                style={[
                  styles.sendButton,
                  canSendMessage
                    ? styles.sendButtonActive
                    : styles.sendButtonInactive,
                ]}
                onPress={() => void handleSend()}
                disabled={!canSendMessage || isSending}
                activeOpacity={0.85}
              >
                <Feather
                  name="arrow-up"
                  size={22}
                  color={
                    canSendMessage
                      ? darkMode
                        ? colors.black
                        : colors.white
                      : darkMode
                        ? colors.white
                        : colors.black
                  }
                />
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
      </View>

      {showLoadingOverlay && <LoadingOverlay />}

      <Modal
        visible={selectedImage !== null}
        transparent
        animationType="fade"
        onRequestClose={handleCloseImageViewer}
      >
        <View style={styles.attachmentViewerOverlay}>
          <TouchableOpacity
            onPress={handleCloseImageViewer}
            style={styles.attachmentViewerCloseButton}
          >
            <Feather name="x" size={22} color={colors.white} />
          </TouchableOpacity>

          {selectedImage ? (
            <View style={styles.attachmentViewerCounter}>
              <AdaptiveText style={styles.attachmentViewerCounterText}>
                {selectedImageIndex! + 1} / {imageMessages.length}
              </AdaptiveText>
            </View>
          ) : null}

          <ScrollView
            ref={imageViewerScrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            bounces={false}
            onMomentumScrollEnd={(event) => {
              if (selectedImageIndex === null) {
                return;
              }

              const nextIndex = Math.round(
                event.nativeEvent.contentOffset.x / attachmentViewerWidth,
              );
              const boundedIndex = Math.max(
                0,
                Math.min(imageMessages.length - 1, nextIndex),
              );

              setSelectedImageIndex(boundedIndex);
            }}
          >
            {imageMessages.map((message) => (
              <View
                key={String(message.Id)}
                style={[
                  styles.attachmentViewerPage,
                  { width: attachmentViewerWidth },
                ]}
              >
                <Image
                  source={{ uri: message.MediaUrl ?? undefined }}
                  style={styles.attachmentViewerImage}
                  resizeMode="contain"
                />
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {renderVideoViewer()}
    </SafeAreaView>
  );
};

export default ConversationScreen;

const createStyles = ({ darkMode }: any) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: darkMode ? colors.veryDarkGrey : colors.white,
    },
    screen: {
      flex: 1,
    },
    pageHeader: {
      height: 68,
      paddingVertical: 10,
    },
    headerProfileButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      maxWidth: "100%",
    },
    headerProfileCopy: {
      minWidth: 0,
      alignItems: "flex-start",
    },
    headerProfileName: {
      fontFamily: "Poppins-SemiBold",
      fontSize: 14,
    },
    headerProfileUsername: {
      fontFamily: "Poppins-Regular",
      fontSize: 11,
      color: darkMode ? colors.lightGrey : colors.darkGrey,
    },
    headerAvatar: {
      width: 34,
      height: 34,
      borderRadius: 17,
    },
    messages: {
      flex: 1,
    },
    messagesContent: {
      paddingHorizontal: 12,
      paddingTop: 8,
      paddingBottom: 18,
      gap: 4,
    },
    messageRow: {
      width: "100%",
    },
    messageRowOwn: {
      alignItems: "flex-end",
    },
    messageRowOther: {
      alignItems: "flex-start",
    },
    messageBubble: {
      maxWidth: "82%",
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 8,
      gap: 8,
    },
    messageBubbleOwn: {
      alignSelf: "flex-end",
      backgroundColor: darkMode ? colors.lightGrey : colors.green,
    },
    messageBubbleOther: {
      alignSelf: "flex-start",
      backgroundColor: darkMode ? colors.darkGrey : colors.lightGrey,
    },
    messageText: {
      fontFamily: "Poppins-Regular",
      fontSize: 14,
    },
    messageTextOwn: {
      color: darkMode ? colors.black : colors.white,
    },
    messageTextOther: {
      color: darkMode ? colors.white : colors.black,
    },
    messageMediaButton: {
      borderRadius: 10,
      overflow: "hidden",
    },
    messageImage: {
      width: 210,
      height: 210,
      borderRadius: 10,
      backgroundColor: darkMode ? colors.mildDarkGrey : colors.white,
    },
    messageVideo: {
      width: 210,
      height: 210,
      backgroundColor: colors.black,
    },
    messageVideoOverlay: {
      ...StyleSheet.absoluteFillObject,
      alignItems: "center",
      justifyContent: "center",
    },
    messageVideoPlayButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(0, 0, 0, 0.52)",
    },
    messageTimestamp: {
      alignSelf: "flex-end",
      fontFamily: "Poppins-Regular",
      fontSize: 9,
      opacity: 0.8,
    },
    messageTimestampOwn: {
      color: darkMode ? colors.black : colors.white,
    },
    messageTimestampOther: {
      color: darkMode ? colors.lightGrey : colors.darkGrey,
    },
    composer: {
      paddingHorizontal: 16,
      paddingTop: 10,
      paddingBottom: 10,
      borderTopWidth: 1,
      borderTopColor: darkMode ? colors.darkGrey : colors.lightGrey,
      gap: 10,
      backgroundColor: darkMode ? colors.veryDarkGrey : colors.white,
    },
    composerRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "center",
      gap: 10,
    },
    selectedMediaCard: {
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      borderRadius: 16,
      padding: 10,
      paddingRight: 42,
      backgroundColor: darkMode ? colors.darkGrey : colors.lightGrey,
      position: "relative",
    },
    selectedMediaPreviewFrame: {
      width: 72,
      height: 72,
      borderRadius: 14,
      overflow: "hidden",
      backgroundColor: darkMode ? colors.mildDarkGrey : colors.white,
      flexShrink: 0,
    },
    selectedMediaPreview: {
      width: "100%",
      height: "100%",
    },
    selectedMediaVideoOverlay: {
      ...StyleSheet.absoluteFillObject,
      alignItems: "center",
      justifyContent: "center",
    },
    selectedMediaPlayButton: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(0, 0, 0, 0.52)",
    },
    selectedMediaCopy: {
      flex: 1,
      minWidth: 0,
      gap: 2,
    },
    selectedMediaTitle: {
      fontFamily: "Poppins-SemiBold",
      fontSize: 13,
      color: darkMode ? colors.white : colors.black,
    },
    selectedMediaMeta: {
      fontFamily: "Poppins-Regular",
      fontSize: 12,
      color: darkMode ? colors.lightGrey : colors.darkGrey,
    },
    removeSelectedMediaButton: {
      position: "absolute",
      top: 8,
      right: 8,
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(0, 0, 0, 0.52)",
    },
    attachButton: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: darkMode ? colors.darkGrey : colors.lightGrey,
      flexShrink: 0,
    },
    attachButtonActive: {
      backgroundColor: darkMode ? colors.mildDarkGrey : colors.lightLightGreen1,
    },
    input: {
      flex: 1,
      maxHeight: 130,
      borderRadius: 10,
      paddingHorizontal: 16,
      paddingVertical: 10,
      backgroundColor: darkMode ? colors.darkGrey : colors.lightGrey,
      color: darkMode ? colors.white : colors.black,
      fontFamily: "Poppins-Regular",
      fontSize: 15,
    },
    sendButton: {
      width: 38,
      height: 38,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
    },
    sendButtonActive: {
      backgroundColor: darkMode ? colors.white : colors.black,
    },
    sendButtonInactive: {
      backgroundColor: darkMode ? colors.mildDarkGrey : colors.lightGrey,
    },
    emptyStateWrap: {
      flexGrow: 1,
      justifyContent: "center",
      paddingHorizontal: 16,
      paddingBottom: 40,
    },
    attachmentViewerOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.92)",
      justifyContent: "center",
      alignItems: "center",
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
  });
};
