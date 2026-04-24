import { AdaptiveText } from "@/components/AdaptiveText";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { ProfileEmptyState } from "@/components/ProfileEmptyState";
import { colors } from "@/constants/colors";
import { useGlobal } from "@/contexts/GlobalProvider";
import { ChatSessionModel } from "@/data/models";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { useHeaderSlide } from "@/hooks/useHeaderSlide";
import { presentApiError } from "@/lib/api-feedback";
import {
  createChat,
  fetchChats,
  getChatSessionPreview,
  getChatSessionTitle,
} from "@/lib/chat-api";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Animated,
  FlatList,
  Keyboard,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ChatbotScreen() {
  const router = useRouter();
  const darkMode = useColorScheme() === "dark";
  const styles = createStyles({ darkMode });
  const [chats, setChats] = useState<ChatSessionModel[]>([]);
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { setShowFooter } = useGlobal();

  const loadChats = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await fetchChats();

      const sortedChats = [...response].sort((a, b) => {
        const aTimestamp = new Date(a.UpdatedAt ?? a.CreatedAt).getTime();
        const bTimestamp = new Date(b.UpdatedAt ?? b.CreatedAt).getTime();
        return bTimestamp - aTimestamp;
      });

      setChats(sortedChats);
    } catch (error) {
      setChats([]);
      presentApiError("Could not load chats", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadChats();

      return () => {
        setShowFooter?.(true);
      };
    }, [loadChats, setShowFooter]),
  );

  const { isRefreshing, onRefresh } = usePullToRefresh(loadChats);
  const showLoadingOverlay = (isLoading && !isRefreshing) || isSubmitting;

  const { translateY } = useHeaderSlide({ height: 200, duration: 250 });

  const handleStartChat = async () => {
    const content = prompt.trim();

    if (!content || isSubmitting) {
      return;
    }

    Keyboard.dismiss();
    setIsSubmitting(true);

    try {
      const id = await createChat([{ role: "User", content }]);
      setPrompt("");
      setShowFooter?.(true);
      router.push({
        pathname: "/(tabs)/chatbot/[id]",
        params: { id },
      });
    } catch (error) {
      presentApiError("Could not start chat", error, {
        fallbackMessage:
          "We couldn't start a new local chat right now.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.screen}>
        <Animated.View style={{ transform: [{ translateY }] }}>
          <AdaptiveText style={styles.title}>Dr. Pet</AdaptiveText>
          <AdaptiveText style={styles.subtitle}>
            Your personal assistant&apos;s {"\n"} personal assistant.
          </AdaptiveText>
        </Animated.View>

        <View style={styles.txtInputContainer}>
          <TextInput
            placeholder="Enter a new prompt..."
            placeholderTextColor={darkMode ? colors.lightGrey : colors.darkGrey}
            style={styles.txtInput}
            value={prompt}
            onChangeText={setPrompt}
            onFocus={() => setShowFooter?.(false)}
            onBlur={() => setShowFooter?.(true)}
          />
          <TouchableOpacity
            style={{
              backgroundColor: prompt.trim()
                ? darkMode
                  ? colors.white
                  : colors.black
                : colors.darkGrey,
              borderRadius: 20,
              padding: 6,
              right: 4,
            }}
            disabled={!prompt.trim() || isSubmitting}
            onPress={() => void handleStartChat()}
          >
            <Feather
              name="arrow-up"
              size={24}
              color={
                prompt.trim()
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

        <FlatList
          style={styles.chatList}
          data={chats}
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          onScrollBeginDrag={Keyboard.dismiss}
          contentContainerStyle={{
            alignSelf: "center",
            width: "90%",
            paddingBottom: 100,
            marginTop: 20,
            paddingTop: 0,
            flexGrow: chats.length === 0 ? 1 : 0,
            justifyContent: "flex-start",
          }}
          keyExtractor={(item) => item.Id}
          renderItem={({ item }) => {
            return (
              <TouchableOpacity
                style={styles.chat}
                onPress={() =>
                  router.push({
                    pathname: "/(tabs)/chatbot/[id]",
                    params: { id: item.Id },
                  })
                }
              >
                <View style={styles.chatCopy}>
                  <AdaptiveText style={styles.chatTitle}>
                    {getChatSessionTitle(item)}
                  </AdaptiveText>
                  <AdaptiveText style={styles.chatContent}>
                    {getChatSessionPreview(item)}
                  </AdaptiveText>
                </View>
                <Feather
                  name="arrow-right"
                  size={24}
                  color={darkMode ? colors.white : colors.black}
                />
              </TouchableOpacity>
            );
          }}
          ItemSeparatorComponent={() => <View style={{ height: 15 }} />}
          ListEmptyComponent={
            <ProfileEmptyState
              style={{ width: "98%", marginTop: 0 }}
              title="No conversations yet"
              subtitle="Start a new prompt above and your saved chats will appear here on this device."
            />
          }
        />
      </View>

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
    title: {
      fontSize: 26,
      fontFamily: "Poppins-Bold",
      marginTop: 40,
      textAlign: "center",
    },
    subtitle: {
      fontSize: 16,
      fontFamily: "Poppins-Regular",
      marginTop: 5,
      textAlign: "center",
    },
    chatList: {
      flex: 1,
    },
    chat: {
      backgroundColor: darkMode ? colors.darkGrey : colors.lightGrey,
      paddingHorizontal: 20,
      paddingVertical: 15,
      borderRadius: 20,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    chatCopy: {
      flex: 1,
      paddingRight: 14,
    },
    chatTitle: {
      fontFamily: "Poppins-SemiBold",
    },
    chatContent: {
      fontFamily: "Poppins-Light",
      marginTop: 2,
    },
    txtInputContainer: {
      flexDirection: "row",
      width: "90%",
      alignSelf: "center",
      backgroundColor: darkMode ? colors.darkGrey : colors.white,
      borderRadius: 24,
      alignItems: "center",
      marginTop: 30,

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
  });
};
