import { AdaptiveText } from "@/components/AdaptiveText";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { PageHeader } from "@/components/PageHeader";
import { ProfileEmptyState } from "@/components/ProfileEmptyState";
import { colors } from "@/constants/colors";
import { useGlobal } from "@/contexts/GlobalProvider";
import { ChatSessionModel } from "@/data/models";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { presentApiError } from "@/lib/api-feedback";
import {
  appendChatMessages,
  fetchChatById,
  getChatSessionTitle,
} from "@/lib/chat-api";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Keyboard,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ChatScreen = () => {
  const darkMode = useColorScheme() === "dark";
  const styles = createStyles({ darkMode });
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { setShowFooter } = useGlobal();
  const [chat, setChat] = useState<ChatSessionModel | null>(null);
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(Boolean(id));
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const loadChat = useCallback(async () => {
    if (!id) {
      setChat(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetchChatById(id);
      setChat(response);
    } catch (error) {
      setChat(null);
      presentApiError("Could not load chat", error);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      setShowFooter?.(false);

      void loadChat();

      return () => {
        setShowFooter?.(true);
      };
    }, [loadChat, setShowFooter]),
  );

  const { isRefreshing, onRefresh } = usePullToRefresh(loadChat);
  const showLoadingOverlay = (isLoading && !isRefreshing) || isSending;

  useEffect(() => {
    if (!chat?.Discussion.length) {
      return;
    }

    const timer = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 60);

    return () => clearTimeout(timer);
  }, [chat?.Discussion.length]);

  const handleSend = async () => {
    const content = prompt.trim();

    if (!id || !chat || !content || isSending) {
      return;
    }

    Keyboard.dismiss();
    setIsSending(true);

    try {
      await appendChatMessages(id, [{ role: "User", content }]);
      const updatedChat = await fetchChatById(id);
      setChat(updatedChat);
      setPrompt("");
    } catch (error) {
      presentApiError("Could not send message", error, {
        networkMessage:
          "We couldn't reach the server, so your message was not sent.",
      });
    } finally {
      setIsSending(false);
    }
  };

  const hasBotReply =
    chat?.Discussion.some((message) => message.Role === "Bot") ?? false;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.screen}>
        <PageHeader title={getChatSessionTitle(chat)} />

        <ScrollView
          ref={scrollRef}
          style={styles.chatbotResponse}
          contentContainerStyle={[
            styles.chatContent,
            !chat ? styles.emptyStateWrap : null,
          ]}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          onScrollBeginDrag={Keyboard.dismiss}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
          }
        >
          {chat ? (
            <>
              {!hasBotReply && chat.Discussion.length > 0 ? (
                <AdaptiveText style={styles.systemNote}>
                  Messages are saving to the backend. Assistant replies will show
                  up here as soon as the server returns them.
                </AdaptiveText>
              ) : null}

              {chat.Discussion.length ? (
                chat.Discussion.map((message) => {
                  const isUser = message.Role === "User";

                  return (
                    <View
                      key={message.Id}
                      style={[
                        styles.messageRow,
                        isUser ? styles.messageRowUser : styles.messageRowBot,
                      ]}
                    >
                      <View
                        style={[
                          styles.messageBubble,
                          isUser
                            ? styles.messageBubbleUser
                            : styles.messageBubbleBot,
                        ]}
                      >
                        <AdaptiveText
                          style={[
                            styles.messageText,
                            isUser ? styles.messageTextUser : styles.messageTextBot,
                          ]}
                        >
                          {message.Content}
                        </AdaptiveText>
                      </View>
                    </View>
                  );
                })
              ) : (
                <ProfileEmptyState
                  title="No messages yet"
                  subtitle="Send a message below to start this conversation."
                />
              )}
            </>
          ) : !isLoading ? (
            <ProfileEmptyState
              title={id ? "Chat unavailable" : "Missing chat"}
              subtitle="We couldn't load this conversation right now."
            />
          ) : null}
        </ScrollView>

        <View style={styles.txtInputContainer}>
          <TextInput
            placeholder="Enter a new prompt..."
            placeholderTextColor={darkMode ? colors.lightGrey : colors.darkGrey}
            style={styles.txtInput}
            value={prompt}
            onChangeText={setPrompt}
          />
          <TouchableOpacity
            disabled={!chat || !prompt.trim() || isSending}
            onPress={() => void handleSend()}
          >
            <Feather
              name="arrow-up"
              size={24}
              color={
                prompt.trim()
                  ? darkMode
                    ? colors.white
                    : colors.black
                  : colors.darkGrey
              }
            />
          </TouchableOpacity>
        </View>
      </View>

      {showLoadingOverlay && <LoadingOverlay />}
    </SafeAreaView>
  );
};

export default ChatScreen;

const createStyles = ({ darkMode }: any) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: darkMode ? colors.veryDarkGrey : colors.white,
    },
    screen: {
      height: "100%",
    },
    chatbotResponse: {
      marginHorizontal: 20,
    },
    chatContent: {
      paddingBottom: 140,
      gap: 12,
    },
    systemNote: {
      fontFamily: "Poppins-Regular",
      fontSize: 14,
      textAlign: "center",
      opacity: 0.8,
      marginBottom: 8,
    },
    messageRow: {
      width: "100%",
    },
    messageRowUser: {
      alignItems: "flex-end",
    },
    messageRowBot: {
      alignItems: "flex-start",
    },
    messageBubble: {
      maxWidth: "85%",
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    messageBubbleUser: {
      backgroundColor: darkMode ? colors.green : colors.darkGreen,
    },
    messageBubbleBot: {
      backgroundColor: darkMode ? colors.darkGrey : colors.lightGrey,
    },
    messageText: {
      fontFamily: "Poppins-Regular",
      fontSize: 15,
      lineHeight: 22,
    },
    messageTextUser: {
      color: colors.white,
    },
    messageTextBot: {
      color: darkMode ? colors.white : colors.black,
    },
    txtInputContainer: {
      flexDirection: "row",
      width: "90%",
      position: "absolute",
      bottom: 10,
      alignSelf: "center",
      backgroundColor: darkMode ? colors.darkGrey : colors.white,
      borderRadius: 24,
      alignItems: "center",

      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 10 },
      shadowRadius: 10,
      shadowOpacity: 0.2,
      elevation: 8,
    },
    txtInput: {
      width: "90%",
      backgroundColor: darkMode ? colors.darkGrey : colors.white,
      color: darkMode ? colors.white : colors.black,
      fontFamily: "Poppins-Regular",
      fontSize: 16,
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: 24,
    },
    emptyStateWrap: {
      flex: 1,
      justifyContent: "center",
    },
  });
};
