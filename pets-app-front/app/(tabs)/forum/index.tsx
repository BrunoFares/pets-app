import { AdaptiveText } from "@/components/AdaptiveText";
import ForumPost from "@/components/ForumPost";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { colors } from "@/constants/colors";
import { useGlobal } from "@/contexts/GlobalProvider";
import { ForumPostsModel } from "@/data/models";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { useHeaderSlide } from "@/hooks/useHeaderSlide";
import { apiRequest } from "@/lib/api";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Animated,
  FlatList,
  Image,
  Keyboard,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ForumScreen() {
  const router = useRouter();
  const darkMode = useColorScheme() === "dark";
  const styles = createStyles({ darkMode });
  const [posts, setPosts] = useState<ForumPostsModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { setShowFooter } = useGlobal();

  const loadPosts = useCallback(async () => {
    setIsLoading(true);

    try {
      const forumPosts = await apiRequest<{
        id: string;
        userId: number;
        userName: string;
        content: string;
        attachments: string[];
        createdAt: string;
        updatedAt?: string | null;
        isAReply: boolean;
        replyingToPost?: string | null;
        repliesCount: number;
        isBookmarked: boolean;
      }[]>("/api/ForumPosts");

      setPosts(
        forumPosts.map((post) => ({
          Id: post.id,
          UserId: post.userId,
          UserName: post.userName,
          Content: post.content,
          Attachments: post.attachments ?? [],
          CreatedAt: post.createdAt,
          UpdatedAt: post.updatedAt ?? null,
          IsAReply: post.isAReply,
          ReplyingToPost: post.replyingToPost ?? null,
          RepliesCount: post.repliesCount,
          IsBookmarked: post.isBookmarked,
        })),
      );
    } catch {
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadPosts();
    }, [loadPosts]),
  );

  const { isRefreshing, onRefresh } = usePullToRefresh(loadPosts);
  const showLoadingOverlay = isLoading && !isRefreshing;

  useFocusEffect(
    useCallback(() => {
      return () => {
        // This code runs when the screen is unfocused (or unmounted).
        setShowFooter?.(true);
      };
    }, [setShowFooter]), // The empty dependency array ensures the effect runs only on focus/unfocus.
  );

  const { translateY } = useHeaderSlide({ height: 200, duration: 250 });

  return (
    <SafeAreaView style={styles.container}>
      <View>
        <Animated.View style={[styles.header, { transform: [{ translateY }] }]}>
          <TouchableOpacity onPress={() => router.push("/(tabs)/forum/bookmarks")}>
            <Ionicons
              name="bookmark"
              size={24}
              color={darkMode ? colors.white : colors.black}
            />
          </TouchableOpacity>

          <Image
            source={require("@/assets/images/petsapp-logo-light.png")}
            style={{ height: 64, width: 64 }}
          />
          <TouchableOpacity>
            <FontAwesome
              name="search"
              size={24}
              color={darkMode ? colors.white : colors.black}
            />
          </TouchableOpacity>
        </Animated.View>

        {posts ? (
          <FlatList
            data={posts}
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            onScrollBeginDrag={Keyboard.dismiss}
            contentContainerStyle={{ alignSelf: "center", width: "100%" }}
            keyExtractor={(item) => String(item.Id)}
            renderItem={({ item }) => {
              return (
                <ForumPost
                  size="small"
                  item={item}
                />
              );
            }}
            ListFooterComponent={<View style={{ height: 180 }} />}
          />
        ) : (
          <AdaptiveText
            style={{
              alignSelf: "center",
              fontFamily: "Poppins-SemiBold",
              marginTop: 250,
            }}
          >
            No items found.
          </AdaptiveText>
        )}
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
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      width: "100%",
      alignSelf: "center",
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderBottomColor: darkMode ? colors.darkGrey : colors.lightGrey,
      borderBottomWidth: 1,
    },
  });
};
